import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pageResponse } from "../api/page.js";
import { INDEXABLE_PAGES, SITE_ORIGIN } from "../src/services/publicPages.js";
import { pageMetadata, publicOrigin, robotsDirective } from "../src/services/seo.js";

const template = await readFile(new URL("../index.html", import.meta.url), "utf8");
const environment = { VERCEL_ENV: "production" };
const requestFor = (path, origin = SITE_ORIGIN) => new Request(origin + path);
const forbiddenFetch = () => { throw new Error("Unexpected API request"); };

for (const [page, path] of Object.entries(INDEXABLE_PAGES)) {
  test(`${path}: HTML público tem SEO próprio e não herda o noindex do template`, async () => {
    const response = await pageResponse(requestFor(path + "?utm_source=audit"), {
      template, environment, fetcher: forbiddenFetch,
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Robots-Tag"), "index, follow");
    assert.match(html, /<meta name="robots" content="index, follow">/);
    assert.ok(!html.includes("noindex"));
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_ORIGIN}${path}">`));
    assert.ok(html.includes(`<title>${pageMetadata(page, null, SITE_ORIGIN).title}</title>`));
    assert.match(html, /name="description" content="[^"]+"/);
    assert.match(html, /property="og:description"/);
    assert.match(html, /name="twitter:card"/);
    assert.ok(!html.includes("utm_source"));
    assert.equal(html.match(/<title>/g)?.length, 1);
    assert.equal(html.match(/name="robots"/g)?.length, 1);
    assert.ok(html.includes('<script type="module" src="/src/main.js"></script>'));
  });
}

for (const [slug, name] of [
  ["mopp", "MOPP — Transporte de Produtos Perigosos"],
  ["transporte-de-carga-indivisivel", "Transporte de Carga Indivisível"],
  ["veiculos-de-emergencia", "Veículos de Emergência"],
  ["transporte-coletivo-de-passageiros", "Transporte Coletivo de Passageiros"],
  ["transporte-escolar", "Transporte Escolar"],
]) {
  test(`${slug}: nome e resumo da API aparecem no HTML inicial`, async () => {
    const calls = [];
    const response = await pageResponse(requestFor(`/api/page?page_path=/cursos/${slug}&utm_source=audit`), {
      template, environment,
      fetcher: async (url, options) => {
        calls.push(url);
        assert.equal(options.headers.Accept, "application/json");
        assert.equal(options.redirect, "error");
        return Response.json({ data: { slug, name, summary: `Informações sobre ${name}.` } });
      },
    });
    const html = await response.text();
    assert.deepEqual(calls, [`https://api.especializacondutor.com.br/api/courses/${slug}`]);
    assert.equal(response.status, 200);
    assert.ok(html.includes(`<title>${name} | Especializa Condutor</title>`));
    assert.ok(html.includes(`href="${SITE_ORIGIN}/cursos/${slug}"`));
    assert.ok(html.includes(`Informações sobre ${name}.`));
    assert.equal(response.headers.get("X-Robots-Tag"), "index, follow");
  });
}

test("artigo publicado entrega SEO de artigo, título e corpo no HTML inicial", async () => {
  const calls = [];
  const response = await pageResponse(requestFor("/api/page?page_path=/blog/renovar-mopp&utm_source=audit"), {
    template, environment,
    fetcher: async (url, options) => {
      calls.push(url);
      assert.equal(options.redirect, "error");
      return Response.json({ data: {
        slug: "renovar-mopp", title: "Como renovar o MOPP", excerpt: "Prazos <e> documentos.",
        meta_title: "", meta_description: "", published_at: "2026-11-20T13:00:00.000Z",
        body: "<h2>Prazos</h2><p>O curso vale por cinco anos.</p>",
      } });
    },
  });
  const html = await response.text();
  assert.deepEqual(calls, ["https://api.especializacondutor.com.br/api/blog/posts/renovar-mopp"]);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Robots-Tag"), "index, follow");
  assert.ok(html.includes("<title>Como renovar o MOPP | Especializa Condutor</title>"));
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_ORIGIN}/blog/renovar-mopp">`));
  assert.ok(html.includes('property="og:type" content="article"'));
  assert.ok(html.includes('property="article:published_time" content="2026-11-20T13:00:00.000Z"'));
  assert.ok(html.includes("<h1>Como renovar o MOPP</h1>"));
  assert.ok(html.includes("Prazos &lt;e&gt; documentos."));
  assert.ok(html.includes("<h2>Prazos</h2><p>O curso vale por cinco anos.</p>"));
  assert.ok(!html.includes("utm_source"));
});

test("listagem do blog inclui artigos publicados e tolera API indisponível", async () => {
  const listed = await pageResponse(requestFor("/blog"), {
    template, environment,
    fetcher: async () => Response.json({ data: [{ slug: "renovar-mopp", title: "Como renovar o MOPP", excerpt: "Resumo" }] }),
  });
  const html = await listed.text();
  assert.equal(listed.status, 200);
  assert.ok(html.includes('href="/blog/renovar-mopp"'));
  const offline = await pageResponse(requestFor("/blog"), { template, environment, fetcher: async () => new Response(null, { status: 503 }) });
  assert.equal(offline.status, 200);
  assert.equal(offline.headers.get("X-Robots-Tag"), "index, follow");
});

test("artigo inexistente ou fora do ar retorna 404 real; API indisponível retorna 503", async () => {
  const missing = await pageResponse(requestFor("/blog/fora-do-ar"), { template, environment, fetcher: async () => new Response(null, { status: 404 }) });
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.ok(!(await missing.text()).includes('rel="canonical"'));
  const unavailable = await pageResponse(requestFor("/blog/qualquer"), { template, environment, fetcher: async () => { throw new Error("Timeout"); } });
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("Cache-Control"), "no-store");
});

test("SEO cadastrado é priorizado e escapado sem injetar HTML ou script", async () => {
  const response = await pageResponse(requestFor("/cursos/mopp"), {
    template, environment,
    fetcher: async () => Response.json({ data: {
      slug: "mopp", name: "Nome padrão", summary: "Resumo padrão",
      meta_title: "MOPP <especial> | Especializa Condutor",
      meta_description: '\"><script>alert("$&")</script>',
      cover: { url: "https://api.especializacondutor.com.br/api/media/cover", alt_text: 'Capa "MOPP"' },
    } }),
  });
  const html = await response.text();
  assert.match(html, /<title>MOPP &lt;especial&gt; \| Especializa Condutor<\/title>/);
  assert.ok(!html.includes('<script>alert('));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;$&amp;&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('property="og:image" content="https://api.especializacondutor.com.br/api/media/cover"'));
});

for (const path of [
  "/admin", "/admin/login", "/admin/primeiro-acesso",
  "/admin/cursos", "/admin/cursos/novo", "/admin/cursos/1/editar",
  "/admin/depoimentos", "/admin/depoimentos/novo", "/admin/depoimentos/1/editar",
  "/admin/faqs", "/admin/faqs/novo", "/admin/faqs/1/editar",
  "/admin/blog", "/admin/blog/novo", "/admin/blog/1/editar", "/admin/blog/comentarios",
  "/admin/midias", "/admin/aparencia", "/admin/atendimentos", "/admin/configuracoes", "/admin/logs",
]) {
  test(`${path}: HTML e cabeçalho continuam bloqueados, sem canonical`, async () => {
    const response = await pageResponse(requestFor(path), { template, environment, fetcher: forbiddenFetch });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.ok(!html.includes('rel="canonical"'));
  });
}

test("URLs inexistentes e rotas privadas desconhecidas têm HTTP 404 e noindex", async () => {
  for (const path of ["/nao-existe", "/login", "/api/unknown", "/cursos/mopp/segredo", "/blog/artigo/segredo"]) {
    const response = await pageResponse(requestFor(path), { template, environment, fetcher: forbiddenFetch });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.ok(!(await response.text()).includes('rel="canonical"'));
  }
});

test("curso inexistente/despublicado retorna HTTP 404, sem transformar em erro temporário", async () => {
  const response = await pageResponse(requestFor("/cursos/oculto"), {
    template, environment, fetcher: async () => new Response(null, { status: 404 }),
  });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.ok(!(await response.text()).includes('rel="canonical"'));
});

test("API indisponível, resposta inválida e timeout não são cacheados nem indexados", async () => {
  for (const fetcher of [
    async () => new Response(null, { status: 503 }),
    async () => Response.json({ data: { slug: "outro-curso", name: "Outro curso" } }),
    async () => Response.json({ data: null }),
    async () => { throw new Error("Timeout"); },
  ]) {
    const response = await pageResponse(requestFor("/cursos/mopp"), { template, environment, fetcher });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }
});

test("preview, localhost, domínio alternativo e desativação explícita mantêm noindex", async () => {
  for (const [origin, env] of [
    [SITE_ORIGIN, { VERCEL_ENV: "preview" }],
    [SITE_ORIGIN, {}],
    [SITE_ORIGIN, { VERCEL_ENV: "production", VITE_SITE_INDEXABLE: "false" }],
    ["http://localhost:5173", environment],
    ["https://especializa-condutor2026.vercel.app", environment],
    ["https://especializacondutor.com.br", environment],
  ]) {
    const response = await pageResponse(requestFor("/", origin), { template, environment: env, fetcher: forbiddenFetch });
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.match(await response.text(), /name="site-indexable" content="false"/);
  }
});

test("template ausente ou incompatível falha de forma segura", async () => {
  for (const value of [undefined, "<html><head></head></html>"]) {
    const response = await pageResponse(requestFor("/"), { template: value, environment, fetcher: forbiddenFetch });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }
});

test("carregamento transitório de curso não injeta noindex em página pública", () => {
  assert.equal(robotsDirective("loading", true), null);
  assert.equal(robotsDirective("loading-article", true), null);
  assert.equal(robotsDirective("blog-post", true), "index, follow");
  for (const page of ["admin", "not-found", "error", "unknown"]) {
    assert.equal(robotsDirective(page, true), "noindex, nofollow");
  }
  for (const page of [...Object.keys(INDEXABLE_PAGES), "course", "loading"]) {
    assert.equal(robotsDirective(page, false), "noindex, nofollow");
  }
});

test("origens locais e inseguras não podem se tornar canônicas", () => {
  for (const origin of ["http://localhost:5173", "http://example.com", "https://127.0.0.1", "https://preview.test", "https://example.com/?utm_source=x", "https://user:pass@example.com"]) {
    assert.equal(publicOrigin(origin), null);
  }
  assert.equal(publicOrigin(SITE_ORIGIN), "https://www.especializacondutor.com.br");
});

test("robots.txt e configuração Vercel preservam bloqueios e a entrega dinâmica de HTML", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.ok(robots.includes("Allow: /"));
  assert.ok(robots.includes("Disallow: /admin"));
  assert.ok(robots.includes("Disallow: /api"));
  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
  assert.equal(config.functions["api/page.js"].includeFiles, "dist/index.html");
  assert.equal(config.rewrites[0].source, "/sitemap.xml");
  assert.equal(config.rewrites.at(-1).destination, "/api/page?page_path=/$1");
  const root = config.routes.find(rule => rule.src === "^/$");
  assert.equal(root.dest, "/api/page?page_path=/", "Home deve passar pelo SEO antes do index.html estático");
  assert.ok(new RegExp(root.src).test("/"));
  assert.ok(!new RegExp(root.src).test("/assets/app.js"));
  assert.ok(!config.routes.some(rule => rule.handle), "Não usar fases de roteamento obsoletas");
  assert.ok(config.headers.find(rule => rule.source === "/admin/:path*").headers.some(header => header.key === "X-Robots-Tag" && header.value === "noindex, nofollow"));
});

test("query arbitrária não transforma rota administrativa em página indexável", async () => {
  const response = await pageResponse(requestFor("/admin?page_path=/"), { template, environment });
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.ok(!(await response.text()).includes('rel="canonical"'));
});
