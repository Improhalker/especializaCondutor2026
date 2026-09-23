<script setup>
import SkeletonBase from "./SkeletonBase.vue";

defineProps({ count: { type: Number, default: 3 } });
</script>

<template>
  <div aria-hidden="true">
    <div v-for="n in count" :key="n" class="skeleton-faq-item">
      <SkeletonBase variant="text" width="65%" height="17px" />
      <SkeletonBase width="16px" height="16px" radius="4px" />
    </div>
  </div>
</template>
