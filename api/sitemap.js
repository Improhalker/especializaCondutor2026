import { INDEXABLE_PAGES, SITE_ORIGIN } from "../src/services/publicPages.js";

const COURSES_URL = "https://api.especializacondutor.com.br/api/courses";

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export function buildSitemap(courses) {
  const urls = Object.values(INDEXABLE_PAGES).map((path) => SITE_ORIGIN + path);
  const slugs = new Set();

  for (const course of courses) {
    const slug = course?.slug;
    if (typeof slug !== "string" || !slug.trim() || slugs.has(slug)) continue;
    slugs.add(slug);
    urls.push(`${SITE_ORIGIN}/cursos/${encodeURIComponent(slug)}`);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
  ].join("\n");
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

    return new Response(buildSitemap(payload.data), {
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
