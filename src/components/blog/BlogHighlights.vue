<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getBlogPosts } from "../../services/api";
import BlogPostCard from "./BlogPostCard.vue";

// Latest published articles. The section stays hidden while loading, when the
// blog has no articles yet, or when the request fails.
const props = defineProps({
  eyebrow: { type: String, default: "BLOG" },
  title: { type: String, default: "Informação para quem vive a estrada." },
  description: { type: String, default: "" },
  limit: { type: Number, default: 3 },
  source: { type: String, default: "Home" },
});

const posts = ref([]);
let active = true;
const headingId = `blog-highlights-${Math.random().toString(36).slice(2, 8)}`;

onMounted(async () => {
  try {
    const payload = await getBlogPosts(1, props.limit);
    if (active) posts.value = payload.data || [];
  } catch {
    if (active) posts.value = [];
  }
});
onBeforeUnmount(() => {
  active = false;
});
</script>

<template>
  <section v-if="posts.length" class="blog-highlights" :aria-labelledby="headingId">
    <div class="container">
      <div class="section-heading split" v-reveal>
        <div>
          <p class="eyebrow">{{ eyebrow }}</p>
          <h2 :id="headingId">{{ title }}</h2>
          <p v-if="description" class="blog-highlights-description">{{ description }}</p>
        </div>
        <RouterLink
          class="text-link"
          to="/blog"
          data-analytics-kind="navigation"
          :data-analytics-label="`${source} · Ver todos os artigos`"
          >Ver todos os artigos <span aria-hidden="true">→</span></RouterLink
        >
      </div>
      <div class="blog-grid">
        <BlogPostCard
          v-for="(post, index) in posts"
          :key="post.id"
          :post="post"
          heading-level="h3"
          v-reveal="{ delay: (index % 3) * 90 }"
        />
      </div>
    </div>
  </section>
</template>
