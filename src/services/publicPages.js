// Match the final HTTPS origin after the production domain redirect.
export const SITE_ORIGIN = "https://www.especializacondutor.com.br";

// Keep public, indexable routes in one place for the router, SEO tags and sitemap.
export const INDEXABLE_PAGES = Object.freeze({
  home: "/",
  courses: "/cursos",
  about: "/quem-somos",
  privacy: "/politica-de-privacidade",
  terms: "/termos-de-uso",
});
