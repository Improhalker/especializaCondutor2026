<script setup>
defineProps({
  width: { type: [String, Number], default: "100%" },
  height: { type: [String, Number], default: "16px" },
  radius: { type: [String, Number], default: "8px" },
  variant: { type: String, default: "block" }, // block | text | circle | button
  circle: { type: Boolean, default: false },
});
function toCss(value) {
  return typeof value === "number" ? `${value}px` : value;
}
</script>

<template>
  <span
    class="skeleton"
    :class="[`skeleton--${circle ? 'circle' : variant}`]"
    :style="{
      width: toCss(width),
      height: toCss(height),
      borderRadius: circle ? '50%' : toCss(radius),
    }"
    aria-hidden="true"
  ></span>
</template>
