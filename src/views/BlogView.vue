<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getBlogPosts } from "../services/api";
import { setPageSeo } from "../services/seo";
import BlogPostCard from "../components/blog/BlogPostCard.vue";
import PublicErrorState from "../components/PublicErrorState.vue";
import SkeletonCourseGrid from "../components/loading/SkeletonCourseGrid.vue";
import { waitForSkeleton } from "../components/loading/waitForSkeleton";

const route = useRoute();
const posts = ref([]);
const meta = ref(null);
const loading = ref(true);
const error = ref(false);
let generation = 0;

const page = computed(() => {
  const value = Number.parseInt(route.query.pagina, 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
});
const pageLink = (number) => ({ name: "blog", query: number > 1 ? { pagina: String(number) } : {} });

async function load() {
  const startedAt = performance.now();
  const current = ++generation;
  loading.value = true;
  error.value = false;
  try {
    const payload = await getBlogPosts(page.value);
    if (current !== generation) return;
    posts.value = payload.data;
    meta.value = payload.meta;
    setPageSeo("blog");
  } catch {
    if (current !== generation) return;
    error.value = true;
    setPageSeo("error");
  } finally {
    if (current === generation) {
      if (!error.value) await waitForSkeleton(startedAt);
      if (current === generation) loading.value = false;
    }
  }
}
watch(page, load, { immediate: true });
onBeforeUnmount(() => generation++);
</script>

<template>
  <div class="blog-page">
    <header class="legal-hero blog-hero">
      <div class="container">
        <p class="eyebrow">BLOG</p>
        <h1>Informação para quem vive a estrada.</h1>
        <p>Orientações sobre cursos especializados, formação, atualização e o dia a dia do motorista profissional.</p>
      </div>
    </header>
    <section class="section container blog-list-section" aria-label="Artigos">
      <SkeletonCourseGrid v-if="loading" :count="3" />
      <PublicErrorState v-else-if="error" @retry="load" />
      <div v-else-if="!posts.length" class="blog-empty" role="status">
        <h2>{{ page > 1 ? "Não há artigos nesta página." : "Os primeiros artigos estão a caminho." }}</h2>
        <p>Enquanto isso, conheça os cursos ou fale com nossa equipe para tirar suas dúvidas.</p>
        <div class="hero-actions">
          <RouterLink v-if="page > 1" class="button" :to="pageLink(1)">Ver artigos mais recentes</RouterLink>
          <RouterLink class="button" :class="{ 'button-secondary': page > 1 }" to="/cursos">Ver todos os cursos</RouterLink>
        </div>
      </div>
      <template v-else>
        <div class="blog-grid content-fade-in">
          <BlogPostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>
        <nav v-if="meta && meta.last_page > 1" class="blog-pagination" aria-label="Paginação dos artigos">
          <RouterLink v-if="meta.current_page > 1" class="button button-secondary" :to="pageLink(meta.current_page - 1)" rel="prev">← Mais recentes</RouterLink>
          <span aria-current="page">Página {{ meta.current_page }} de {{ meta.last_page }}</span>
          <RouterLink v-if="meta.current_page < meta.last_page" class="button button-secondary" :to="pageLink(meta.current_page + 1)" rel="next">Mais antigos →</RouterLink>
        </nav>
      </template>
    </section>
  </div>
</template>
