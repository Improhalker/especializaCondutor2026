export const PUBLIC_ANALYTICS_PATH = /^\/(?:cursos(?:\/[a-z0-9-]+)?|quem-somos|politica-de-privacidade|termos-de-uso)?$/

export function campaignValue(value) {
  const text = typeof value === "string" ? value.trim().slice(0, 80) : ""
  return text && /^[\p{L}\p{N} _.-]+$/u.test(text) ? text : null
}

export function actionLabel(value) {
  return String(value || "").replace(/[<>@]/g, "").replace(/\s+/g, " ").trim().slice(0, 120)
}

export function scrollProgress(top, height, viewport) {
  const distance = height - viewport
  return distance > 0 ? Math.max(0, Math.min(100, Math.round(top / distance * 100))) : 0
}

export function normalizeAttendance(payload) {
  const clicks = payload?.clicks || {}
  const meta = clicks.meta || clicks
  return {
    ...payload,
    summary: { total_clicks: 0, previous_period_clicks: 0, change_percentage: null, by_course: [], by_modality: [], ...payload?.summary },
    clicks: {
      ...clicks,
      data: Array.isArray(clicks.data) ? clicks.data : [],
      meta: { current_page: 1, last_page: 1, total: 0, from: null, to: null, ...meta },
    },
  }
}
