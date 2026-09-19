<script setup>
import { computed } from "vue";

const props = defineProps({
  appearance: { type: Object, default: null },
  eager: { type: Boolean, default: true },
  forceMobile: Boolean,
});

const hasImage = computed(
  () => Boolean(props.appearance?.enabled && props.appearance?.media?.url),
);
const preset = computed(() =>
  ["institutional", "dark", "soft"].includes(
    props.appearance?.overlay_preset,
  )
    ? props.appearance.overlay_preset
    : "institutional",
);
const position = computed(() =>
  ["center", "top", "bottom", "left", "right"].includes(
    props.appearance?.position,
  )
    ? props.appearance.position
    : "center",
);
const opacity = computed(() =>
  Math.min(100, Math.max(0, Number(props.appearance?.overlay_opacity ?? 75))),
);
const displayedMedia = computed(() =>
  props.forceMobile && props.appearance?.mobile_media?.url
    ? props.appearance.mobile_media
    : props.appearance?.media,
);
</script>

<template>
  <section
    class="hero-section"
    :class="[
      { 'has-hero-image': hasImage },
      `hero-preset-${preset}`,
    ]"
    :style="{
      '--hero-position': position,
      '--hero-alpha': opacity / 100,
    }"
  >
    <div v-if="hasImage" class="hero-backdrop" aria-hidden="true">
      <picture>
        <source
          v-if="!forceMobile && appearance.mobile_media?.url"
          media="(max-width: 700px)"
          :srcset="appearance.mobile_media.url"
        />
        <img
          :src="displayedMedia.url"
          alt=""
          :width="displayedMedia.width || undefined"
          :height="displayedMedia.height || undefined"
          :loading="eager ? 'eager' : 'lazy'"
          :fetchpriority="eager ? 'high' : undefined"
        />
      </picture>
      <div class="hero-backdrop-overlay"></div>
      <div class="hero-backdrop-scrim"></div>
    </div>
    <slot />
  </section>
</template>
