<script setup>
defineProps({
  size: { type: Number, default: 24 },
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
    :style="{ '--whatsapp-icon-size': `${size}px` }"
  />
</template>

<style scoped>
.whatsapp-icon {
  display: block;
  flex: none;
  width: var(--whatsapp-icon-size);
  height: var(--whatsapp-icon-size);
  object-fit: contain;
}
</style>
