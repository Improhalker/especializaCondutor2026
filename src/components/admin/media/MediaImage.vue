<script setup>
import { ref, watch } from "vue";
import { ImageOff } from "lucide-vue-next";
const props = defineProps({
  src: String,
  alt: { type: String, default: "" },
  width: Number,
  height: Number,
  eager: Boolean,
});
const failed = ref(false);
watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :width="width || undefined"
    :height="height || undefined"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    @error="failed = true"
  />
  <span
    v-else
    class="media-image-fallback"
    role="img"
    :aria-label="alt || 'Imagem sem prévia'"
    ><ImageOff :size="30" /><span>Sem prévia</span></span
  >
</template>
