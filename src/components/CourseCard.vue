<script setup>
import MediaImage from "./admin/media/MediaImage.vue";
defineProps({ course: { type: Object, required: true } });
</script>
<template>
  <article class="course-card">
    <div v-if="course.cover?.url" class="course-cover-image">
      <MediaImage
        :src="course.cover.url"
        :alt="course.cover.alt_text"
        :width="course.cover.width"
        :height="course.cover.height"
      />
    </div>
    <div v-else class="course-art" :class="`art-${course.slug}`">
      <span>{{ course.short_name || course.name }}</span>
      <div class="road"></div>
    </div>
    <div class="course-card-body">
      <p class="eyebrow">
        {{ course.category?.name || "Curso especializado" }}
      </p>
      <h3>{{ course.name }}</h3>
      <p>{{ course.summary }}</p>
      <RouterLink
        class="text-link"
        :to="`/cursos/${encodeURIComponent(course.slug)}`"
        >Conhecer o curso <span>→</span></RouterLink
      >
    </div>
  </article>
</template>
