<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getTestimonials } from "../../services/api";
import SkeletonTestimonials from "../loading/SkeletonTestimonials.vue";
import TestimonialsSection from "./TestimonialsSection.vue";

const testimonials = ref([]);
const loading = ref(true);
const error = ref(false);
let active = true;

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const result = await getTestimonials();
    if (active) testimonials.value = result;
  } catch (_) {
    if (active) error.value = true;
  } finally {
    if (active) loading.value = false;
  }
}

onMounted(load);
onBeforeUnmount(() => { active = false; });
</script>

<template>
  <SkeletonTestimonials v-if="loading" />
  <section v-else-if="error" class="section testimonials" role="alert">
    <div class="container">
      <p>Não foi possível carregar os depoimentos.</p>
      <button class="button" type="button" @click="load">Tentar novamente</button>
    </div>
  </section>
  <TestimonialsSection v-else :testimonials="testimonials" />
</template>
