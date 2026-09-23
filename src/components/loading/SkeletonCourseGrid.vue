<script setup>
import SkeletonCourseCard from "./SkeletonCourseCard.vue";

defineProps({ count: { type: Number, default: 6 } });
</script>

<template>
  <div class="course-grid" role="status" aria-busy="true">
    <span class="sr-only">Carregando conteúdo</span>
    <SkeletonCourseCard v-for="n in count" :key="n" />
  </div>
</template>
