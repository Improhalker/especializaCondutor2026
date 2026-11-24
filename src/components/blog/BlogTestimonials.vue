<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getTestimonials } from "../../services/api";
import TestimonialsSection from "../testimonials/TestimonialsSection.vue";

// Only real, approved testimonials: the section stays hidden when there are none or the request fails.
const testimonials = ref([]);
let active = true;

onMounted(async () => {
  try {
    const result = await getTestimonials();
    if (active) testimonials.value = result;
  } catch {
    if (active) testimonials.value = [];
  }
});
onBeforeUnmount(() => {
  active = false;
});
</script>

<template>
  <TestimonialsSection v-if="testimonials.length" :testimonials="testimonials" />
</template>
