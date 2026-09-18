const brand = "Especializa Condutor";
const descriptions = {
  home: "Conheça os cursos do Especializa Condutor e fale com nossa equipe para esclarecer dúvidas e consultar condições.",
  courses:
    "Explore o catálogo de cursos do Especializa Condutor. Consulte informações, modalidades e requisitos de cada curso.",
  "not-found":
    "Esta página não foi encontrada ou não está mais disponível. Acesse o início ou explore nossos cursos.",
  error:
    "Não foi possível carregar as informações agora. Tente novamente em instantes.",
};
export function publicOrigin(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      !url.hostname.includes(".") ||
      /(?:^|\.)(localhost|local|test|invalid)$/.test(url.hostname) ||
      /^[\d.]+$/.test(url.hostname) ||
      url.hostname.includes(":")
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function pageMetadata(page, course = null, origin = null) {
  const names = {
    home: "Cursos para motoristas",
    courses: "Cursos",
    "not-found": "Página não encontrada",
    error: "Não foi possível carregar a página",
    admin: "Administração",
    loading: "Carregando curso",
  };
  const rawTitle =
    page === "course"
      ? course?.meta_title?.trim() || course?.name
      : names[page];
  const title =
    (rawTitle || "Cursos")
      .replace(/(?:\s*[|—–-]\s*)?Especializa Condutor\s*$/iu, "")
      .trim() || "Cursos";
  const description =
    page === "course"
      ? course?.meta_description?.trim() ||
        course?.summary?.trim() ||
        `Conheça o curso ${course?.name} e consulte informações com a equipe do Especializa Condutor.`
      : descriptions[page] || "Administração do Especializa Condutor.";
  const path =
    page === "home"
      ? "/"
      : page === "courses"
        ? "/cursos"
        : page === "course"
          ? `/cursos/${encodeURIComponent(course.slug)}`
          : null;
  let image = null;
  const source =
    course?.cover?.url || (origin ? "/brand/especializa-condutor.png" : null);
  if (path && source) {
    try {
      const candidate = new URL(source, origin || undefined);
      if (
        ["http:", "https:"].includes(candidate.protocol) &&
        !candidate.username &&
        !candidate.password
      )
        image = candidate.href;
    } catch {}
  }
  return {
    title: `${title} | ${brand}`,
    description,
    canonical: origin && path ? origin + path : null,
    image,
    imageAlt: course?.cover?.alt_text || brand,
    public: Boolean(path),
  };
}
function meta(attribute, key, content) {
  const nodes = [
    ...document.head.querySelectorAll(`meta[${attribute}="${key}"]`),
  ];
  const node = nodes.shift() || document.createElement("meta");
  nodes.forEach((duplicate) => duplicate.remove());
  if (content == null) {
    node.remove();
    return;
  }
  node.setAttribute(attribute, key);
  node.content = content;
  if (!node.isConnected) document.head.append(node);
}
export function setPageSeo(page, course = null) {
  const serverOrigin = document.head.querySelector(
    'meta[name="site-origin"]',
  )?.content;
  const origin = publicOrigin(serverOrigin || import.meta.env.VITE_SITE_URL);
  const serverIndexable = document.head.querySelector(
    'meta[name="site-indexable"]',
  )?.content;
  const indexable =
    (serverIndexable ?? import.meta.env.VITE_SITE_INDEXABLE) === "true" &&
    location.origin === origin &&
    !import.meta.env.DEV;
  const data = pageMetadata(page, course, origin);
  document.title = data.title;
  document.documentElement.lang = "pt-BR";
  meta("name", "description", data.description);
  meta(
    "name",
    "robots",
    data.public && indexable ? "index, follow" : "noindex, nofollow",
  );
  for (const [key, value] of Object.entries({
    title: data.title,
    description: data.description,
    url: data.canonical,
    type: "website",
    image: data.image,
    "image:alt": data.image ? data.imageAlt : null,
    locale: "pt_BR",
    site_name: brand,
  }))
    meta("property", `og:${key}`, value);
  for (const [key, value] of Object.entries({
    title: data.title,
    description: data.description,
    card: data.image ? "summary_large_image" : "summary",
    image: data.image,
    "image:alt": data.image ? data.imageAlt : null,
  }))
    meta("name", `twitter:${key}`, value);
  const canonicals = [
    ...document.head.querySelectorAll('link[rel="canonical"]'),
  ];
  const canonical = canonicals.shift() || document.createElement("link");
  canonicals.forEach((node) => node.remove());
  if (data.canonical) {
    canonical.rel = "canonical";
    canonical.href = data.canonical;
    if (!canonical.isConnected) document.head.append(canonical);
  } else canonical.remove();
}
