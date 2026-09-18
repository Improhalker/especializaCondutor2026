const API_URL = import.meta.env.VITE_API_URL || "/api";
const WHATSAPP_NUMBER = "5519999065094";
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

  return { courses, categories };
}
export async function getCourse(slug) {
  return (await request(`/courses/${encodeURIComponent(slug)}`)).data;
}
export const whatsappUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
export async function trackWhatsAppClick(payload) {
  try {
    await fetch(`${API_URL}/whatsapp-clicks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        source_url: window.location.href,
        utm_source: new URLSearchParams(window.location.search).get(
          "utm_source",
        ),
      }),
      keepalive: true,
    });
  } catch (_) {}
}
