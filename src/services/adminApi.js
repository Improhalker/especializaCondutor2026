import {
  adminSession,
  clearAdminSession,
  setAdminSession,
  setAdminUser,
} from "./adminSession";

const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers || {}),
  };
  if (adminSession.token)
    headers.Authorization = `Bearer ${adminSession.token}`;

  if (options.onUploadProgress) return uploadRequest(path, options, headers);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearAdminSession();
    const error = new Error(
      payload.message || "Não foi possível concluir esta ação.",
    );
    error.status = response.status;
    error.errors = payload.errors || {};
    error.usages = payload.usages || [];
    error.usage_count = payload.usage_count || 0;
    throw error;
  }
  return payload;
}

export async function loginAdmin(credentials) {
  const payload = await request("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  setAdminSession(payload);
  return payload;
}

export async function getAdminProfile() {
  const payload = await request("/admin/auth/me");
  setAdminUser(payload.user);
  return payload.user;
}

export async function changeInitialPassword(payload) {
  const response = await request("/admin/auth/initial-password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  setAdminUser(response.user);
  return response.user;
}

export async function logoutAdmin() {
  try {
    await request("/admin/auth/logout", { method: "DELETE" });
  } finally {
    clearAdminSession();
  }
}

export const getAdminCourses = (params = {}) =>
  request(
    `/admin/courses?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)).toString()}`,
  );
export const getAdminCourse = (id) => request(`/admin/courses/${id}`);
export const createAdminCourse = (payload) =>
  request("/admin/courses", { method: "POST", body: JSON.stringify(payload) });
export const updateAdminCourse = (id, payload) =>
  request(`/admin/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
export const updateCoursePublication = (id, is_published) =>
  request(`/admin/courses/${id}/publication`, {
    method: "PATCH",
    body: JSON.stringify({ is_published }),
  });
export const deleteAdminCourse = (id) =>
  request(`/admin/courses/${id}`, { method: "DELETE" });
export const getCategories = () => request("/admin/categories");
export const createCategory = (payload) =>
  request("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateCategory = (id, payload) =>
  request(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
export const deleteCategory = (id) =>
  request(`/admin/categories/${id}`, { method: "DELETE" });
export const getAttendances = (params = {}) =>
  request(
    `/admin/attendances?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)).toString()}`,
  );
export const getSettings = () => request("/admin/settings");
export const updateSettings = (payload) =>
  request("/admin/settings", { method: "PUT", body: JSON.stringify(payload) });

export const getAdminPageAppearances = () =>
  request("/admin/page-appearances");
export const updateAdminPageAppearance = (pageKey, payload) =>
  request(`/admin/page-appearances/${encodeURIComponent(pageKey)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

function uploadRequest(path, options, headers) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "POST", API_URL + path);
    xhr.timeout = 120000;
    Object.entries(headers).forEach(([key, value]) =>
      xhr.setRequestHeader(key, value),
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        options.onUploadProgress(
          Math.round((event.loaded / event.total) * 100),
        );
    };
    xhr.onload = () => {
      let payload;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
        return;
      }
      if (xhr.status === 401) clearAdminSession();
      const error = new Error(
        payload.message ||
          (xhr.status === 413
            ? "A imagem excede o limite do servidor."
            : "Não foi possível enviar a imagem."),
      );
      error.status = xhr.status;
      error.errors = payload.errors || {};
      reject(error);
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "Falha de conexão. Verifique sua internet e tente novamente.",
        ),
      );
    xhr.ontimeout = () =>
      reject(
        new Error(
          "O envio demorou mais que o esperado. Atualize a biblioteca ou tente novamente.",
        ),
      );
    xhr.onabort = () =>
      reject(new Error("Envio interrompido. Tente novamente."));
    xhr.send(options.body);
  });
}

export const getAdminMedia = (params = {}) =>
  request(
    "/admin/media?" +
      new URLSearchParams(
        Object.entries(params).filter(
          ([, value]) => value !== "" && value != null,
        ),
      ),
  );
export const getMediaUsages = (id) => request("/admin/media/" + id + "/usages");
export const getAdminMediaItem = (id) => request("/admin/media/" + id);
export const updateAdminMedia = (id, payload) =>
  request("/admin/media/" + id, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deleteAdminMedia = (id) =>
  request("/admin/media/" + id, { method: "DELETE" });
export function uploadAdminMedia(
  file,
  metadata = {},
  onUploadProgress = () => {},
) {
  const body = new FormData();
  body.append("file", file);
  Object.entries(metadata).forEach(([key, value]) => {
    if (value != null && value !== "") body.append(key, String(value));
  });
  return request("/admin/media", { method: "POST", body, onUploadProgress });
}
