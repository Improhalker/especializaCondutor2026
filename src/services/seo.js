import { INDEXABLE_PAGES, SITE_ORIGIN } from "./publicPages.js";

const brand = "Especializa Condutor";
const descriptions = {
  home: "Conheça os cursos do Especializa Condutor e fale com nossa equipe para esclarecer dúvidas e consultar condições.",
  courses:
    "Explore o catálogo de cursos do Especializa Condutor. Consulte informações, modalidades e requisitos de cada curso.",
  about:
    "Conheça a Especializa Condutor, nossa forma de atendimento e a jornada que já ajudou mais de 70 motoristas a avançarem em sua especialização.",
  privacy:
    "Saiba quais dados a Especializa Condutor usa na navegação e no atendimento, e como falar conosco sobre sua privacidade.",
  blog:
    "Artigos e orientações para motoristas sobre cursos especializados, formação, atualização e rotina profissional.",
  terms:
    "Entenda como funciona a vitrine de cursos da Especializa Condutor e o atendimento para matrícula pelo WhatsApp.",
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
    blog: "Blog",
    about: "Quem somos",
    privacy: "Política de Privacidade",
    terms: "Termos de Uso",
    "not-found": "Página não encontrada",
    error: "Não foi possível carregar a página",
    admin: "Administração",
    loading: "Carregando curso",
    "loading-article": "Carregando artigo",
  };
  const post = page === "blog-post" ? course : null;
  const rawTitle =
    page === "course"
      ? course?.meta_title?.trim() || course?.name
      : post
        ? post.meta_title?.trim() || post.title
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
      : post
        ? post.meta_description?.trim() ||
          post.excerpt?.trim() ||
          "Leia o artigo no blog do Especializa Condutor."
        : descriptions[page] || "Administração do Especializa Condutor.";
  const path =
    page === "course"
      ? `/cursos/${encodeURIComponent(course.slug)}`
      : post
        ? `/blog/${encodeURIComponent(post.slug)}`
        : INDEXABLE_PAGES[page] || null;
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
    type: post ? "article" : "website",
    publishedTime: post?.published_at || null,
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
export function robotsDirective(page, indexable) {
  // Loading is temporary, not evidence that a public course must be excluded.
  if ((page === "loading" || page === "loading-article") && indexable) return null;
  return indexable &&
    (Object.hasOwn(INDEXABLE_PAGES, page) || page === "course" || page === "blog-post")
    ? "index, follow"
    : "noindex, nofollow";
}
export function setPageSeo(page, course = null) {
  const serverOrigin = document.head.querySelector(
    'meta[name="site-origin"]',
  )?.content;
  const origin = publicOrigin(serverOrigin || SITE_ORIGIN);
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
    robotsDirective(page, indexable),
  );
  for (const [key, value] of Object.entries({
    title: data.title,
    description: data.description,
    url: data.canonical,
    type: data.type,
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
  meta("property", "article:published_time", data.publishedTime);
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
