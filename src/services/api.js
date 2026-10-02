import { adminSession } from "./adminSession";
import { campaignValue } from "./analyticsPayload";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const WHATSAPP_NUMBER = "5519999065094";
const apiOrigin = new URL(API_URL, window.location.href).origin;
if (apiOrigin !== window.location.origin) {
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = apiOrigin;
  preconnect.crossOrigin = "anonymous";
  document.head.append(preconnect);
}
async function request(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const error = new Error("Não foi possível carregar as informações agora.");
    error.status = response.status;
    throw error;
  }
  return response.json();
}
export const getHome = () => request("/home");
export async function getTestimonials() {
  return (await request("/testimonials")).data;
}
export async function getCourses() {
  const payload = await request("/courses");
  const courses = payload.data;
  const categories = [
    ...new Map(
      courses
        .filter((course) => course.category)
        .map((course) => [course.category.id, course.category]),
    ).values(),
  ];

  return { courses, categories, hero: payload.meta?.hero || null };
}
export async function getCourse(slug) {
  return (await request(`/courses/${encodeURIComponent(slug)}`)).data;
}
export const whatsappUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
export async function trackWhatsAppClick(payload) {
  if (adminSession.token || navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  try {
    await fetch(`${API_URL}/whatsapp-clicks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        source_url: window.location.origin + window.location.pathname,
        ...Object.fromEntries(["utm_source", "utm_medium", "utm_campaign"].map(key => [key, campaignValue(new URLSearchParams(window.location.search).get(key))])),
      }),
      keepalive: true,
    });
  } catch (_) {}
}
