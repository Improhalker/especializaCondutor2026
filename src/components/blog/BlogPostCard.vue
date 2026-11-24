<script setup>
import MediaImage from "../admin/media/MediaImage.vue";
import { formatPostDate, readingLabel } from "../../services/blogFormat";

defineProps({
  post: { type: Object, required: true },
  headingLevel: { type: String, default: "h2" },
});
</script>

<template>
  <article class="blog-card" :class="{ 'has-cover': post.cover?.url }">
    <div v-if="post.cover?.url" class="blog-card-cover">
      <MediaImage
        :src="post.cover.url"
        :alt="post.cover.alt_text"
        :width="post.cover.width"
        :height="post.cover.height"
      />
    </div>
    <div class="blog-card-body">
      <p v-if="post.category" class="eyebrow">{{ post.category }}</p>
      <component :is="headingLevel" class="blog-card-title">
        <RouterLink
          :to="`/blog/${encodeURIComponent(post.slug)}`"
          data-analytics-kind="navigation"
          :data-analytics-label="`Blog · Card · ${post.title}`"
          >{{ post.title }}</RouterLink
        >
      </component>
      <p class="blog-card-excerpt">{{ post.excerpt }}</p>
      <p class="blog-card-meta">
        <time :datetime="post.published_at">{{ formatPostDate(post.published_at) }}</time>
        <span aria-hidden="true">·</span>
        <span>{{ readingLabel(post.reading_minutes) }}</span>
      </p>
    </div>
  </article>
</template>
