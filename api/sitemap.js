import { INDEXABLE_PAGES, SITE_ORIGIN } from "../src/services/publicPages.js";

const COURSES_URL = "https://api.especializacondutor.com.br/api/courses";
const BLOG_URL = "https://api.especializacondutor.com.br/api/blog/posts";
const BLOG_PAGE_LIMIT = 40;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export function buildSitemap(courses, posts = []) {
  const urls = Object.values(INDEXABLE_PAGES).map((path) => SITE_ORIGIN + path);
  const slugs = new Set();

  for (const course of courses) {
    const slug = course?.slug;
    if (typeof slug !== "string" || !slug.trim() || slugs.has(slug)) continue;
    slugs.add(slug);
    urls.push(`${SITE_ORIGIN}/cursos/${encodeURIComponent(slug)}`);
  }
  const postSlugs = new Set();
  for (const post of posts) {
    const slug = post?.slug;
    if (typeof slug !== "string" || !slug.trim() || postSlugs.has(slug)) continue;
    postSlugs.add(slug);
    urls.push(`${SITE_ORIGIN}/blog/${encodeURIComponent(slug)}`);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
  ].join("\n");
}

async function fetchPublishedPosts() {
  const posts = [];
  for (let page = 1; page <= BLOG_PAGE_LIMIT; page++) {
    const response = await fetch(`${BLOG_URL}?per_page=24&page=${page}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Blog unavailable");
    const payload = await response.json();
    if (!Array.isArray(payload?.data)) throw new Error("Invalid blog listing");
    posts.push(...payload.data);
    if (!payload.meta || page >= Number(payload.meta.last_page || 1)) break;
  }
  return posts;
}

export async function GET() {
  try {
    const response = await fetch(COURSES_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Course catalog unavailable");

    const payload = await response.json();
    if (!Array.isArray(payload?.data)) throw new Error("Invalid course catalog");

    const posts = await fetchPublishedPosts();

    return new Response(buildSitemap(payload.data, posts), {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Sitemap temporariamente indisponível.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
