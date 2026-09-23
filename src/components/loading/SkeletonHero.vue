<script setup>
import SkeletonBase from "./SkeletonBase.vue";
import SkeletonText from "./SkeletonText.vue";
</script>

<template>
  <div class="course-hero skeleton-on-dark" role="status" aria-busy="true">
    <span class="sr-only">Carregando conteúdo</span>
    <div class="container course-hero-grid">
      <div>
        <SkeletonBase variant="text" width="140px" height="14px" style="margin-bottom: 46px" />
        <SkeletonBase variant="text" width="110px" height="12px" style="margin-bottom: 15px" />
        <SkeletonBase variant="text" width="80%" height="40px" style="margin-bottom: 19px" />
        <SkeletonText :lines="2" height="16px" gap="8px" width="70%" last-line-width="45%" />
      </div>
      <div class="course-cover-hero skeleton"></div>
    </div>
  </div>
</template>
