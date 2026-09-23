<script setup>
import { computed, ref } from "vue";
import { Quote, Star } from "lucide-vue-next";

const props = defineProps({
  name: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, default: null },
  avatarUrl: { type: String, default: "" },
  avatarAlt: { type: String, default: "" },
  isFallback: { type: Boolean, default: false },
});

const expanded = ref(false);
const avatarFailed = ref(false);
const isLong = computed(() => props.content.length > 220);
const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EC",
);
</script>

<template>
  <article class="testimonial-card" :class="{ 'is-fallback': isFallback }">
    <Quote class="testimonial-quote" :size="26" aria-hidden="true" />
    <div
      v-if="!isFallback && rating"
      class="testimonial-rating"
      :aria-label="`Avaliação: ${rating} de 5 estrelas`"
    >
      <Star
        v-for="n in 5"
        :key="n"
        :size="16"
        :fill="n <= rating ? '#e8a723' : 'transparent'"
        :color="n <= rating ? '#e8a723' : '#cfdce6'"
        aria-hidden="true"
      />
    </div>
    <p class="testimonial-content" :class="{ clamped: isLong && !expanded }">
      {{ content }}
    </p>
    <button
      v-if="isLong"
      class="testimonial-more"
      type="button"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? "Ler menos" : "Ler mais" }}
    </button>
    <footer class="testimonial-footer">
      <span class="testimonial-avatar">
        <img
          v-if="avatarUrl && !avatarFailed"
          :src="avatarUrl"
          :alt="avatarAlt"
          loading="lazy"
          @error="avatarFailed = true"
        />
        <span v-else aria-hidden="true">{{ initials }}</span>
      </span>
      <span class="testimonial-name">{{ name }}</span>
    </footer>
  </article>
</template>
