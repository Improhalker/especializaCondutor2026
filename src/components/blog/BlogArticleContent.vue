<script setup>
import { nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import MediaImage from "../admin/media/MediaImage.vue";
import { formatPostDate, readingLabel } from "../../services/blogFormat";

// Shared by the public article and the admin preview, so both use the same reading style.
const props = defineProps({
  post: { type: Object, required: true },
  preview: Boolean,
});
const router = useRouter();
const prose = ref(null);

// Wide tables scroll inside their own focusable region instead of stretching the page on mobile.
watch(
  () => props.post.body,
  async () => {
    await nextTick();
    prose.value?.querySelectorAll("table").forEach((table) => {
      if (table.parentElement?.classList.contains("blog-table-scroll")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "blog-table-scroll";
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", table.querySelector("caption")?.textContent?.trim() || "Tabela");
      table.replaceWith(wrapper);
      wrapper.append(table);
    });
  },
  { immediate: true, flush: "post" },
);

function followLink(event) {
  const link = event.target.closest?.("a[href]");
  if (!link || event.defaultPrevented || event.button !== 0) return;
  if (props.preview) {
    event.preventDefault();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;
  event.preventDefault();
  router.push(url.pathname + url.search + url.hash);
}
</script>

<template>
  <article class="blog-article">
    <header class="blog-article-header">
      <RouterLink v-if="!preview" class="blog-crumb" to="/blog">← Todos os artigos</RouterLink>
      <p v-if="post.category" class="eyebrow">{{ post.category }}</p>
      <h1>{{ post.title || "Título do artigo" }}</h1>
      <p class="blog-card-meta">
        <time v-if="post.published_at" :datetime="post.published_at">{{ formatPostDate(post.published_at) }}</time>
        <span v-else>Não publicado</span>
        <span aria-hidden="true">·</span>
        <span>{{ readingLabel(post.reading_minutes) }}</span>
      </p>
      <p v-if="post.excerpt" class="blog-article-lead">{{ post.excerpt }}</p>
    </header>
    <figure v-if="post.cover?.url" class="blog-article-cover">
      <MediaImage
        :src="post.cover.url"
        :alt="post.cover.alt_text"
        :width="post.cover.width"
        :height="post.cover.height"
        :eager="!preview"
      />
    </figure>
    <!-- The body is sanitized by Laravel with an allowlist before it reaches the browser. -->
    <div ref="prose" class="blog-prose" @click="followLink" v-html="post.body"></div>
  </article>
</template>
