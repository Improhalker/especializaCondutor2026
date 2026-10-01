<script setup>
import { whatsappUrl } from "../services/api";
import TestimonialsSection from "./testimonials/TestimonialsSection.vue";
import ProcessJourney from "./ProcessJourney.vue";
import WhatsAppIcon from "./WhatsAppIcon.vue";
import SkeletonTestimonials from "./loading/SkeletonTestimonials.vue";
import SkeletonFaqList from "./loading/SkeletonFaqList.vue";

defineProps({
  testimonials: { type: Array, default: () => [] },
  faqs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});
defineEmits(["retry"]);
</script>

<template>
  <div v-if="error" class="container feedback" role="alert">
    <p>Não foi possível carregar os depoimentos e as perguntas frequentes.</p>
    <button class="button" type="button" @click="$emit('retry')">
      Tentar novamente
    </button>
  </div>
  <SkeletonTestimonials v-if="loading" />
  <TestimonialsSection v-else-if="!error" :testimonials="testimonials" />

  <section id="como-funciona" class="section container process">
    <div class="section-heading">
      <p class="eyebrow">COMO FUNCIONA</p>
      <h2>Da escolha do curso ao seu próximo passo.</h2>
    </div>
    <ProcessJourney />
  </section>

  <section class="cta-band">
    <div class="container cta-inner">
      <div>
        <p class="eyebrow light">PRONTO PARA AVANÇAR?</p>
        <h2>Seu próximo curso<br />começa com uma conversa.</h2>
      </div>
      <a
        class="button button-white"
        :href="whatsappUrl('Olá! Gostaria de saber mais sobre os cursos da Especializa Condutor.')"
      >
        <WhatsAppIcon /> Falar no WhatsApp
      </a>
    </div>
  </section>

  <section
    v-if="loading || (!error && faqs.length)"
    class="section container faq"
    :aria-busy="loading"
  >
    <div class="section-heading">
      <p class="eyebrow">DÚVIDAS FREQUENTES</p>
      <h2>Informação clara para você decidir.</h2>
    </div>
    <template v-if="loading">
      <span class="sr-only" role="status">Carregando perguntas frequentes</span>
      <SkeletonFaqList :count="6" />
    </template>
    <template v-else>
      <details v-for="faq in faqs" :key="faq.id ?? faq.question">
        <summary>{{ faq.question }} <span aria-hidden="true">+</span></summary>
        <p>{{ faq.answer }}</p>
      </details>
    </template>
  </section>
</template>
