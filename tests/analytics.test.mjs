import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { PUBLIC_ANALYTICS_PATH, campaignValue, actionLabel, scrollProgress, normalizeAttendance } from "../src/services/analyticsPayload.js"

test("paginação aceita Laravel antigo, novo e respostas ausentes", () => {
  assert.equal(normalizeAttendance({ clicks: { data: [], last_page: 4, current_page: 2 } }).clicks.meta.last_page, 4)
  assert.equal(normalizeAttendance({ clicks: { data: [], meta: { last_page: 3 } } }).clicks.meta.last_page, 3)
  assert.equal(normalizeAttendance(null).clicks.meta.last_page, 1)
  assert.deepEqual(normalizeAttendance({}).clicks.data, [])
})
test("apenas rotas públicas podem ser coletadas", () => {
  for (const path of ["/", "/cursos", "/cursos/mopp", "/quem-somos", "/politica-de-privacidade", "/termos-de-uso"]) assert.equal(PUBLIC_ANALYTICS_PATH.test(path), true)
  for (const path of ["/admin", "/api/home", "/login", "/cursos/mopp?email=x", "/outra"]) assert.equal(PUBLIC_ANALYTICS_PATH.test(path), false)
})
test("campanhas e rótulos não levam queries ou HTML para a coleta", () => {
  assert.equal(campaignValue(" Formação MOPP "), "Formação MOPP")
  assert.equal(campaignValue("nome@email.com"), null)
  assert.equal(campaignValue("https://site/?token=123"), null)
  assert.equal(actionLabel("<WhatsApp>   ·   Home"), "WhatsApp · Home")
  assert.equal(actionLabel("a".repeat(180)).length, 120)
})
test("rolagem é limitada e não atribui 100% a páginas sem rolagem", () => {
  assert.equal(scrollProgress(500, 1500, 500), 50)
  assert.equal(scrollProgress(1500, 1500, 500), 100)
  assert.equal(scrollProgress(-5, 1500, 500), 0)
  assert.equal(scrollProgress(0, 500, 500), 0)
})

function harness({ token = "", dnt = false } = {}) {
  const callbacks = new Map()
  const document = {
    visibilityState: "visible", referrer: "https://google.com/search?q=private",
    addEventListener(name, fn) { callbacks.set(name, fn) }, removeEventListener(name) { callbacks.delete(name) },
    getElementById() { return scroller },
  }
  const scrollCallbacks = new Map()
  const scroller = { scrollTop: 0, scrollHeight: 1500, clientHeight: 500, addEventListener(name, fn) { scrollCallbacks.set(name, fn) }, removeEventListener(name) { scrollCallbacks.delete(name) } }
  const sessionStorage = { getItem() { return null }, setItem() {} }
  const calls = []
  const beacons = []
  let now = 0
  let afterRoute
  let heartbeat
  let stopped = false
  const route = { value: { path: "/", name: "home" } }
  const router = { currentRoute: route, afterEach(fn) { afterRoute = fn; return () => { afterRoute = null } }, isReady() { return Promise.resolve() } }
  const window = { doNotTrack: "", addEventListener(name, fn) { callbacks.set(name, fn) }, removeEventListener(name) { callbacks.delete(name) } }
  const navigator = { doNotTrack: dnt ? "1" : "", globalPrivacyControl: false, sendBeacon(url, body) { beacons.push(body); return true } }
  const adminSession = { token }
  const location = { pathname: "/", search: "?utm_source=instagram&email=private", hostname: "especializacondutor.com.br", host: "especializacondutor.com.br" }
  const source = readFileSync(new URL("../src/services/siteAnalytics.js", import.meta.url), "utf8").replace(/^import .*$/gm, "").replace("import.meta.env.VITE_API_URL", "null").replace("export function startSiteAnalytics", "function startSiteAnalytics")
  const start = new Function("nextTick", "adminSession", "PUBLIC_ANALYTICS_PATH", "actionLabel", "campaignValue", "scrollProgress", "navigator", "window", "document", "sessionStorage", "crypto", "location", "performance", "fetch", "setInterval", "clearInterval", source + "\nreturn startSiteAnalytics")
    (async () => {}, adminSession, PUBLIC_ANALYTICS_PATH, actionLabel, campaignValue, scrollProgress, navigator, window, document, sessionStorage, { randomUUID }, location, { now: () => now }, async (url, options) => { calls.push(JSON.parse(options.body)); return { ok: true } }, fn => { heartbeat = fn; return 1 }, () => { stopped = true })
  const stop = start(router)
  return { calls, beacons, stop, document, scroller, adminSession, callbacks, scrollCallbacks, setTime(value) { now = value }, async tick() { heartbeat?.(); await settle() }, async navigate(path, name) { route.value = { path, name }; await afterRoute?.(route.value); await settle() }, get stopped() { return stopped } }
}
async function settle() { for (let index = 0; index < 8; index++) await Promise.resolve() }

test("coletor cria uma visita por rota, sem recontar hash ou heartbeat", async () => {
  const h = harness(); await settle()
  assert.equal(new Set(h.calls.map(call => call.page.id)).size, 1)
  await h.navigate("/", "home"); await h.tick()
  assert.equal(new Set(h.calls.map(call => call.page.id)).size, 1)
  await h.navigate("/cursos", "courses")
  assert.equal(new Set(h.calls.map(call => call.page.id)).size, 2)
  assert.equal(h.calls[0].page.referrer_host, "google.com")
  assert.equal(JSON.stringify(h.calls).includes("email=private"), false)
  h.stop(); assert.equal(h.stopped, true)
})
test("tempo ativo ignora abas ocultas e limita inatividade a 60 segundos", async () => {
  const h = harness(); await settle()
  h.setTime(10000); h.document.visibilityState = "hidden"; h.callbacks.get("visibilitychange")()
  const hidden = await h.beacons.at(-1).text(); assert.equal(JSON.parse(hidden).page.active_ms, 10000)
  h.setTime(90000); h.document.visibilityState = "visible"; h.callbacks.get("visibilitychange")()
  await h.tick(); assert.equal(h.calls.at(-1).page.active_ms, 10000)
  h.callbacks.get("pointerdown")(); h.setTime(160000); await h.tick()
  assert.equal(h.calls.at(-1).page.active_ms, 70000)
  h.stop()
})
test("coletor ignora administrador, rotas privadas e preferência DNT", async () => {
  const admin = harness({ token: "test-token" }); await settle(); assert.equal(admin.calls.length, 0); admin.stop()
  const dnt = harness({ dnt: true }); await settle(); assert.equal(dnt.calls.length, 0); dnt.stop()
  const h = harness(); await settle(); await h.navigate("/admin/atendimentos", "admin-attendances")
  assert.equal(h.calls.filter(call => call.page.path.startsWith("/admin")).length, 0); h.stop()
})
test("coletor atualiza maior rolagem e captura clique antes de sair", async () => {
  const h = harness(); await settle()
  h.scroller.scrollTop = 800; h.scrollCallbacks.get("scroll")()
  h.scroller.scrollTop = 100; h.scrollCallbacks.get("scroll")(); await h.tick()
  assert.equal(h.calls.at(-1).page.scroll_depth, 80)
  const control = { dataset: { analyticsKind: "whatsapp", analyticsLabel: "WhatsApp · Hero" }, closest(selector) { return selector === ".public-site" ? {} : null }, getAttribute() { return null }, classList: { contains() { return false } }, tagName: "BUTTON" }
  h.callbacks.get("click")({ isTrusted: true, target: { closest() { return control } } })
  await settle()
  const payload = JSON.parse(await h.beacons.at(-1).text())
  assert.equal(payload.interactions[0].kind, "whatsapp")
  assert.equal(payload.interactions[0].label, "WhatsApp · Hero")
  h.stop()
})
