import { readFile } from "node:fs/promises";
import { INDEXABLE_PAGES, SITE_ORIGIN } from "../src/services/publicPages.js";
import { pageMetadata, robotsDirective } from "../src/services/seo.js";

const COURSES_URL = "https://api.especializacondutor.com.br/api/courses/";
const BLOG_URL = "https://api.especializacondutor.com.br/api/blog/posts";
const SEO_BLOCK = /<!-- public-seo:start -->[\s\S]*?<!-- public-seo:end -->/;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function renderHead(data, robots, indexable) {
  const tag = (name, content, attribute = "name") =>
    `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`;
  return [
    `<title>${escapeHtml(data.title)}</title>`,
    tag("description", data.description),
    tag("robots", robots),
    tag("site-origin", SITE_ORIGIN),
    tag("site-indexable", String(indexable)),
    tag("og:title", data.title, "property"),
    tag("og:description", data.description, "property"),
    tag("og:type", data.type || "website", "property"),
    ...(data.publishedTime ? [tag("article:published_time", data.publishedTime, "property")] : []),
    tag("og:locale", "pt_BR", "property"),
    tag("og:site_name", "Especializa Condutor", "property"),
    tag("twitter:title", data.title),
    tag("twitter:description", data.description),
    tag("twitter:card", data.image ? "summary_large_image" : "summary"),
    ...(data.canonical ? [
      `<link rel="canonical" href="${escapeHtml(data.canonical)}">`,
      tag("og:url", data.canonical, "property"),
    ] : []),
    ...(data.image ? [
      tag("og:image", data.image, "property"),
      tag("og:image:alt", data.imageAlt, "property"),
      tag("twitter:image", data.image),
      tag("twitter:image:alt", data.imageAlt),
    ] : []),
  ].join("\n");
}

const dateLabel = (value) => {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(value));
  } catch {
    return "";
  }
};
const timeTag = (value) => value ? `<p><time datetime="${escapeHtml(value)}">${escapeHtml(dateLabel(value))}</time></p>` : "";

// Main content in the initial HTML; Vue replaces it when it mounts.
function renderContent(page, data, entity, posts) {
  if (page === "blog-post") {
    // The article body is sanitized by Laravel with an allowlist before it is stored.
    return `<main class="ssr-content container"><article class="blog-article"><p><a href="/blog">← Todos os artigos</a></p><h1>${escapeHtml(entity.title)}</h1>${timeTag(entity.published_at)}<p class="blog-article-lead">${escapeHtml(entity.excerpt || "")}</p><div class="blog-prose">${typeof entity.body === "string" ? entity.body : ""}</div></article></main>`;
  }
  if (page === "blog") {
    const items = (posts || [])
      .filter((post) => typeof post?.slug === "string" && typeof post?.title === "string")
      .map((post) => `<li><h2><a href="/blog/${escapeHtml(encodeURIComponent(post.slug))}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt || "")}</p>${timeTag(post.published_at)}</li>`)
      .join("");
    return `<main class="ssr-content container"><h1>Blog</h1>${items ? `<ul class="ssr-list">${items}</ul>` : `<p>${escapeHtml(data.description)}</p>`}<p><a href="/cursos">Ver todos os cursos</a></p></main>`;
  }
  return `<noscript><h1>${escapeHtml(data.title)}</h1><p>${escapeHtml(data.description)}</p><a href="/">Início</a> · <a href="/blog">Blog</a> · <a href="/cursos">Cursos</a></noscript>`;
}

export async function pageResponse(request, {
  template,
  fetcher = fetch,
  environment = process.env,
} = {}) {
  const url = new URL(request.url);
  const path = url.pathname === "/api/page"
    ? url.searchParams.get("page_path") ?? url.pathname
    : url.pathname;
  const indexable = url.origin === SITE_ORIGIN &&
    environment.VERCEL_ENV === "production" &&
    environment.VITE_SITE_INDEXABLE !== "false";
  let page = Object.entries(INDEXABLE_PAGES).find(([, route]) => route === path)?.[0];
  let status = 200;
  let course = null;
  let post = null;
  let posts = null;

  if (!page && /^\/admin(?:\/|$)/.test(path)) page = "admin";
  if (!page && /^\/cursos\/[^/]+$/.test(path)) {
    try {
      const slug = decodeURIComponent(path.slice("/cursos/".length));
      const response = await fetcher(COURSES_URL + encodeURIComponent(slug), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      if (response.status === 404) {
        page = "not-found";
        status = 404;
      } else {
        if (!response.ok) throw new Error("Course API unavailable");
        const payload = await response.json();
        if (payload?.data?.slug !== slug || typeof payload.data.name !== "string") {
          throw new Error("Invalid course response");
        }
        course = payload.data;
        page = "course";
      }
    } catch {
      console.error("Public SEO: course metadata unavailable");
      page = "error";
      status = 503;
    }
  }
  if (!page && /^\/blog\/[^/]+$/.test(path)) {
    try {
      const slug = decodeURIComponent(path.slice("/blog/".length));
      const response = await fetcher(`${BLOG_URL}/${encodeURIComponent(slug)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      if (response.status === 404) {
        page = "not-found";
        status = 404;
      } else {
        if (!response.ok) throw new Error("Blog API unavailable");
        const payload = await response.json();
        if (payload?.data?.slug !== slug || typeof payload.data.title !== "string") {
          throw new Error("Invalid blog response");
        }
        post = payload.data;
        page = "blog-post";
      }
    } catch {
      console.error("Public SEO: blog metadata unavailable");
      page = "error";
      status = 503;
    }
  }
  if (page === "blog") {
    try {
      const response = await fetcher(`${BLOG_URL}?per_page=9`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      const payload = response.ok ? await response.json() : null;
      posts = Array.isArray(payload?.data) ? payload.data : null;
    } catch {
      posts = null;
    }
  }
  if (!page) {
    page = "not-found";
    status = 404;
  }

  const data = pageMetadata(page, post || course, SITE_ORIGIN);
  const robots = robotsDirective(page, indexable);
  if (!template || !SEO_BLOCK.test(template)) {
    return new Response('<!doctype html><html lang="pt-BR"><head><meta name="robots" content="noindex, nofollow"><title>Site temporariamente indisponível</title></head><body><h1>Site temporariamente indisponível</h1></body></html>', {
      status: 503,
      headers: { "Content-Type": "text/html; charset=UTF-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
    });
  }
  const html = template
    .replace(SEO_BLOCK, () => renderHead(data, robots, indexable))
    .replace('<div id="app"></div>', () => `<div id="app">${renderContent(page, data, post, posts)}</div>`);

  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": robots,
      "Cache-Control": data.public && indexable && status === 200
        ? "public, max-age=0, s-maxage=60, stale-while-revalidate=30"
        : "no-store",
      ...(status === 503 ? { "Retry-After": "60" } : {}),
    },
  });
}

export async function GET(request) {
  let template;
  try {
    template = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  } catch {
    console.error("Public SEO: built HTML template unavailable");
  }
  return pageResponse(request, { template });
}
