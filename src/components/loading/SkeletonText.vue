<script setup>
import SkeletonBase from "./SkeletonBase.vue";

const props = defineProps({
  lines: { type: Number, default: 1 },
  width: { type: [String, Number], default: "100%" },
  lastLineWidth: { type: [String, Number], default: "70%" },
  height: { type: [String, Number], default: "14px" },
  gap: { type: [String, Number], default: "8px" },
});
function toCss(value) {
  return typeof value === "number" ? `${value}px` : value;
}
</script>

<template>
  <span class="skeleton-text-group" :style="{ gap: toCss(gap) }" aria-hidden="true">
    <SkeletonBase
      v-for="n in lines"
      :key="n"
      variant="text"
      :height="height"
      :width="n === props.lines && props.lines > 1 ? lastLineWidth : width"
    />
  </span>
</template>
