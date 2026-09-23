<script setup>
import { computed } from "vue";
import TestimonialCarousel from "./TestimonialCarousel.vue";

const props = defineProps({ testimonials: { type: Array, default: () => [] } });

const FALLBACK = [
  {
    id: "institutional-fallback",
    name: "Especializa Condutor",
    content:
      "Novos depoimentos serão publicados em breve. Fale com nossa equipe para conhecer os cursos e tirar suas dúvidas.",
    rating: null,
    avatarUrl: "/brand/marca.png",
    avatarAlt: "Especializa Condutor",
    isFallback: true,
  },
];

const items = computed(() =>
  props.testimonials?.length
    ? props.testimonials.map((testimonial) => ({
        id: testimonial.id,
        name: testimonial.name,
        content: testimonial.content,
        rating: testimonial.rating,
        avatarUrl: testimonial.avatar?.url || "",
        avatarAlt: testimonial.avatar?.alt_text || testimonial.name,
        isFallback: false,
      }))
    : FALLBACK,
);
</script>

<template>
  <section id="depoimentos" class="section testimonials">
    <div class="container">
      <div class="section-heading" v-reveal>
        <p class="eyebrow">DEPOIMENTOS</p>
        <h2>Quem busca especialização conta com a gente</h2>
        <p class="testimonials-subtitle">
          Histórias reais de quem já concluiu a formação e seguiu em frente
          com mais preparo para a estrada.
        </p>
      </div>
      <TestimonialCarousel :items="items" />
    </div>
  </section>
</template>
