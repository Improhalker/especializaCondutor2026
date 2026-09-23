<script setup>
import SkeletonBase from "./SkeletonBase.vue";
import SkeletonText from "./SkeletonText.vue";
</script>

<template>
  <article class="course-card" aria-hidden="true">
    <div class="course-cover-image skeleton"></div>
    <div class="course-card-body">
      <SkeletonBase variant="text" width="96px" height="11px" style="margin-bottom: 12px" />
      <SkeletonBase variant="text" width="78%" height="22px" style="margin-bottom: 12px" />
      <SkeletonText :lines="2" height="13px" gap="6px" />
      <SkeletonBase variant="text" width="128px" height="14px" style="margin-top: 18px" />
    </div>
  </article>
</template>
