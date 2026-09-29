import assert from "node:assert/strict";
import test from "node:test";
import { buildSitemap, GET } from "./api/sitemap.js";

test("lists public pages and catalog URLs with the canonical origin", () => {
  const xml = buildSitemap([
    { slug: "mopp" },
    { slug: "transporte-escolar" },
    { slug: "mopp" },
  ]);

  for (const path of [
    "/",
    "/cursos",
    "/quem-somos",
    "/politica-de-privacidade",
    "/termos-de-uso",
    "/cursos/mopp",
    "/cursos/transporte-escolar",
  ]) {
    assert.ok(xml.includes(`<loc>https://especializacondutor.com.br${path}</loc>`));
  }
  assert.equal(xml.match(/<loc>https:\/\/especializacondutor.com.br\/cursos\/mopp<\/loc>/g)?.length, 1);
  assert.ok(!xml.includes("/admin"));
  assert.ok(!xml.includes("/api"));
});

test("uses the public course API and returns XML", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ slug: "mopp" }] }));

  try {
    const response = await GET();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /^application\/xml/);
    assert.match(await response.text(), /<loc>https:\/\/especializacondutor.com.br\/cursos\/mopp<\/loc>/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fails safely instead of publishing an incomplete sitemap", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("Unavailable", { status: 503 });

  try {
    const response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
