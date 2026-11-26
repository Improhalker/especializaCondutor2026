<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getTestimonials } from "../../services/api";
import TestimonialCard from "../testimonials/TestimonialCard.vue";

// Compact sidebar block with real, approved testimonials only: it stays hidden
// when there are none or the request fails (no institutional fallback here).
const props = defineProps({ limit: { type: Number, default: 2 } });
const testimonials = ref([]);
let active = true;

onMounted(async () => {
  try {
    const result = await getTestimonials();
    if (active) testimonials.value = (result || []).slice(0, props.limit);
  } catch {
    if (active) testimonials.value = [];
  }
});
onBeforeUnmount(() => {
  active = false;
});
</script>

<template>
  <section v-if="testimonials.length" class="blog-sidebar-block blog-sidebar-testimonials" aria-labelledby="blog-sidebar-testimonials-title">
    <h2 id="blog-sidebar-testimonials-title" class="blog-sidebar-title">Quem já fez, recomenda</h2>
    <div class="blog-sidebar-testimonial-list">
      <TestimonialCard
        v-for="item in testimonials"
        :key="item.id"
        :name="item.name"
        :content="item.content"
        :rating="item.rating"
        :avatar-url="item.avatar?.url || ''"
        :avatar-alt="item.avatar?.alt_text || item.name"
      />
    </div>
    <RouterLink class="text-link blog-sidebar-more" to="/#depoimentos">Ver todos os depoimentos <span aria-hidden="true">→</span></RouterLink>
  </section>
</template>
