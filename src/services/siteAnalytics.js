import { nextTick } from "vue"
import { adminSession } from "./adminSession"
import { PUBLIC_ANALYTICS_PATH, actionLabel, campaignValue, scrollProgress } from "./analyticsPayload"

const API_URL = import.meta.env.VITE_API_URL || "/api"
const SESSION_KEY = "especializa.analytics.session"
const SESSION_TIMEOUT = 30 * 60 * 1000

// No cookies, durable visitor IDs, raw query strings, IPs or input values.
export function startSiteAnalytics(router) {
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl) return () => {}
  let current = null
  let session = null
  let scroller = null
  let navigatingPath = null
  let initialVisitId = null
  let clsWindow = { value: 0, first: 0, last: 0 }
  const pending = new Map()
  const uuid = () => crypto.randomUUID()
  const permitted = () => !adminSession.token && document.visibilityState !== "hidden"
  const campaign = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign"].map(key => [key, campaignValue(new URLSearchParams(location.search).get(key))]))
  let referrer = null
  try { const host = new URL(document.referrer).hostname; if (host !== location.hostname) referrer = host } catch {}
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch {}

  function getSession() {
    if (!session?.id || !/^[0-9a-f-]{36}$/i.test(session.id) || Date.now() - session.touched > SESSION_TIMEOUT) {
      session = { id: uuid(), touched: Date.now(), campaign, referrer }
    }
    session.campaign = Object.values(campaign).some(Boolean) ? campaign : session.campaign || campaign
    session.referrer = session.referrer || referrer
    session.touched = Date.now()
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
    return session
  }

  function accrue() {
    if (!current) return
    const time = performance.now()
    if (permitted()) current.page.active_ms = Math.min(14400000, Math.round(current.page.active_ms + Math.max(0, Math.min(time, current.lastActivity + 60000) - current.lastTick)))
    current.lastTick = time
  }

  function activity() {
    accrue()
    if (current && permitted()) {
      current.lastActivity = performance.now()
      if (session) session.touched = Date.now()
    }
  }

  function scroll() {
    activity()
    if (current && scroller && permitted()) current.page.scroll_depth = Math.max(current.page.scroll_depth, scrollProgress(scroller.scrollTop, scroller.scrollHeight, scroller.clientHeight))
  }

  function snapshot(visit) {
    return { session_id: visit.sessionId, page: { ...visit.page }, interactions: visit.events.slice(0, 25) }
  }

  function enqueue(visit) {
    if (!visit || adminSession.token) return
    pending.set(visit.page.id, snapshot(visit))
    if (pending.size > 5) pending.delete(pending.keys().next().value)
  }

  let sending = false
  async function flush(leaving = false) {
    if (!leaving && document.visibilityState === 'hidden') return
    accrue()
    enqueue(current)
    if (adminSession.token) { pending.clear(); return }
    if (leaving && navigator.sendBeacon) {
      for (const payload of pending.values()) {
        // JSON triggers CORS preflight, keeping cross-origin submission restricted.
        if (navigator.sendBeacon(API_URL + "/analytics/events", new Blob([JSON.stringify(payload)], { type: "application/json" }))) {
          if (current?.page.id === payload.page.id) current.events = current.events.filter(event => !payload.interactions.some(sent => sent.id === event.id))
          pending.delete(payload.page.id)
        }
      }
      return
    }
    if (sending) return
    sending = true
    try {
      for (const [id, payload] of [...pending]) {
        const response = await fetch(API_URL + "/analytics/events", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), keepalive: true })
        if (response.ok) {
          if (current?.page.id === id) current.events = current.events.filter(event => !payload.interactions.some(sent => sent.id === event.id))
          if (pending.get(id) === payload) pending.delete(id)
        } else if (response.status < 500 && response.status !== 429) pending.delete(id)
      }
    } catch { /* Analytics must never interrupt navigation or WhatsApp. */ }
    finally { sending = false }
  }

  async function navigate(to, from, failure) {
    if (failure || to.path === navigatingPath || (current && to.path === current.page.path)) return
    navigatingPath = to.path
    await flush(true)
    scroller?.removeEventListener("scroll", scroll)
    current = null
    if (adminSession.token || !PUBLIC_ANALYTICS_PATH.test(to.path) || to.name === "not-found") return
    await nextTick()
    if (router.currentRoute.value.path !== to.path) return
    const visitorSession = getSession()
    const time = performance.now()
    current = {
      sessionId: visitorSession.id, events: [], lastTick: time, lastActivity: time,
      page: { id: uuid(), path: to.path, active_ms: 0, scroll_depth: 0, ...(window.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes('layout-shift') ? { cls: 0 } : {}), ...visitorSession.campaign, referrer_host: visitorSession.referrer },
    }
    clsWindow = { value: 0, first: 0, last: 0 }
    if (!initialVisitId && to.path === initialPath) initialVisitId = current.page.id
    scroller = document.getElementById("public-scroll") || document.scrollingElement
    scroller?.addEventListener("scroll", scroll, { passive: true })
    void flush()
  }

  function interaction(kind, label) {
    if (!current || !permitted()) return
    const normalized = actionLabel(label)
    if (!normalized) return
    activity()
    current.events.push({ id: uuid(), kind, label: normalized })
    if (current.events.length >= 20) void flush()
    if (current.events.length > 50) current.events.splice(0, current.events.length - 50)
  }

  function click(event) {
    if (!event.isTrusted || !current || !permitted()) return
    const control = event.target.closest?.("a, button, [role='button']")
    if (!control?.closest(".public-site") || control.closest(".admin-shell")) return
    const label = control.dataset.analyticsLabel || control.getAttribute("aria-label") || control.innerText
    const isWhatsApp = control.dataset.analyticsKind === "whatsapp" || /wa.me|api.whatsapp.com/i.test(control.getAttribute("href") || "") || control.classList.contains("whatsapp-float") || /whatsapp|consultor/i.test(label || "")
    const kind = control.dataset.analyticsKind || (isWhatsApp ? "whatsapp" : control.tagName === "A" ? "navigation" : control.closest(".catalog-filters, .filters") ? "filter" : "button")
    interaction(kind, label)
    // Capture CTAs before same-tab external navigation.
    if (isWhatsApp || (control.tagName === "A" && control.host && control.host !== location.host)) void flush(true)
  }

  function toggle(event) {
    const details = event.target
    if (details.tagName === "DETAILS" && details.open && details.closest(".public-site")) interaction("faq", details.querySelector("summary")?.innerText)
  }

  const observers = []
  function observe(type, callback, options = {}) {
    if (!window.PerformanceObserver || !PerformanceObserver.supportedEntryTypes?.includes(type)) return
    try { const observer = new PerformanceObserver(callback); observer.observe({ type, ...options }); observers.push(observer) } catch {}
  }
  // Native LCP is only meaningful for the initial document navigation, not SPA routes.
  const initialPath = location.pathname
  observe("largest-contentful-paint", list => {
    if (current?.page.id === initialVisitId && permitted()) for (const entry of list.getEntries()) current.page.lcp_ms = Math.min(120000, Math.round(entry.startTime))
  }, { buffered: true })
  observe("event", list => {
    if (current && permitted()) for (const entry of list.getEntries()) current.page.inp_ms = Math.min(120000, Math.max(current.page.inp_ms || 0, Math.round(entry.duration)))
  }, { durationThreshold: 40 })
  observe("layout-shift", list => {
    if (!current || !permitted()) return
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue
      if (entry.startTime - clsWindow.last > 1000 || entry.startTime - clsWindow.first > 5000) clsWindow = { value: 0, first: entry.startTime, last: entry.startTime }
      clsWindow.value += entry.value; clsWindow.last = entry.startTime
      current.page.cls = Math.min(100, Math.max(current.page.cls || 0, clsWindow.value))
    }
  })

  function visibility() {
    // Hidden time is never accumulated; flush the foreground segment first.
    if (document.visibilityState === "hidden") {
      if (current) {
        const time = performance.now()
        current.page.active_ms = Math.min(14400000, Math.round(current.page.active_ms + Math.max(0, Math.min(time, current.lastActivity + 60000) - current.lastTick)))
        current.lastTick = time
      }
      void flush(true)
    } else if (current) current.lastTick = performance.now()
  }
  const pagehide = () => void flush(true)
  document.addEventListener("click", click, true)
  document.addEventListener("toggle", toggle, true)
  document.addEventListener("visibilitychange", visibility)
  for (const type of ["pointerdown", "keydown", "touchstart"]) document.addEventListener(type, activity, { passive: true })
  window.addEventListener("pagehide", pagehide)
  const heartbeat = setInterval(() => void flush(), 15000)
  const stopRoute = router.afterEach(navigate)
  void router.isReady().then(() => navigate(router.currentRoute.value))
  return () => {
    void flush(true); clearInterval(heartbeat); stopRoute()
    scroller?.removeEventListener("scroll", scroll)
    document.removeEventListener("click", click, true); document.removeEventListener("toggle", toggle, true)
    document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pagehide)
    for (const type of ["pointerdown", "keydown", "touchstart"]) document.removeEventListener(type, activity)
    observers.forEach(observer => observer.disconnect())
  }
}
