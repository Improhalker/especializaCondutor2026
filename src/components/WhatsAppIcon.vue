<script setup>
defineProps({
  size: { type: Number, default: 20 },
});
</script>

<template>
  <img
    class="whatsapp-icon"
    src="/brand/whatsapp-icon.png"
    alt=""
    aria-hidden="true"
    :width="size"
    :height="size"
  />
</template>

<style scoped>
.whatsapp-icon {
  display: inline-block;
  flex: none;
  object-fit: contain;
}
</style>
