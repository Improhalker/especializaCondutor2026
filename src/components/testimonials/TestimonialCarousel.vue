<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import TestimonialCard from "./TestimonialCard.vue";

const props = defineProps({
  items: { type: Array, required: true },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 6500 },
});

const trackRef = ref(null);
const cardRefs = ref([]);
const activeIndex = ref(0);
const reducedMotion = ref(false);
const paused = ref(false);
const isTouching = ref(false);
let mediaQuery = null;
let autoplayTimer = null;
let scrollEndTimer = null;

function setCardRef(el, index) {
  if (el) cardRefs.value[index] = el;
}

function updateReducedMotion() {
  reducedMotion.value = mediaQuery?.matches ?? false;
}

function scrollToIndex(index, behavior = reducedMotion.value ? "auto" : "smooth") {
  const track = trackRef.value;
  const card = cardRefs.value[index];
  if (!track || !card) return;
  track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior });
}

function clampIndex(index) {
  const max = props.items.length - 1;
  return Math.max(0, Math.min(max, index));
}

function goTo(index) {
  activeIndex.value = clampIndex(index);
  scrollToIndex(activeIndex.value);
}

function next() {
  goTo(activeIndex.value + 1 >= props.items.length ? 0 : activeIndex.value + 1);
}
function prev() {
  goTo(activeIndex.value - 1 < 0 ? props.items.length - 1 : activeIndex.value - 1);
}

function syncActiveIndexFromScroll() {
  const track = trackRef.value;
  if (!track) return;
  let closest = 0;
  let closestDistance = Infinity;
  cardRefs.value.forEach((card, index) => {
    if (!card) return;
    const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = index;
    }
  });
  activeIndex.value = closest;
}
function onScroll() {
  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(syncActiveIndexFromScroll, 100);
}

function pause() {
  paused.value = true;
}
function resume() {
  if (!isTouching.value) paused.value = false;
}

function scheduleAutoplay() {
  clearTimeout(autoplayTimer);
  if (
    !props.autoplay ||
    reducedMotion.value ||
    paused.value ||
    props.items.length <= 1 ||
    document.visibilityState !== "visible"
  )
    return;
  autoplayTimer = setTimeout(() => {
    next();
    scheduleAutoplay();
  }, props.interval);
}

function onVisibilityChange() {
  if (document.visibilityState !== "visible") pause();
  else resume();
}

function onKeydown(event) {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    next();
    pause();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    prev();
    pause();
  } else if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
    pause();
  } else if (event.key === "End") {
    event.preventDefault();
    goTo(props.items.length - 1);
    pause();
  }
}

watch(() => [paused.value, reducedMotion.value], scheduleAutoplay);
watch(
  () => props.items.length,
  () => {
    cardRefs.value = [];
    activeIndex.value = 0;
    nextTick(() => scrollToIndex(0, "auto"));
  },
);

onMounted(async () => {
  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  updateReducedMotion();
  mediaQuery.addEventListener("change", updateReducedMotion);
  document.addEventListener("visibilitychange", onVisibilityChange);
  await nextTick();
  scheduleAutoplay();
});
onBeforeUnmount(() => {
  clearTimeout(autoplayTimer);
  clearTimeout(scrollEndTimer);
  mediaQuery?.removeEventListener("change", updateReducedMotion);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<template>
  <div class="testimonial-carousel" @mouseenter="pause" @mouseleave="resume">
    <div class="testimonial-carousel-viewport">
      <button
        v-if="items.length > 1"
        class="testimonial-nav prev"
        type="button"
        aria-label="Depoimento anterior"
        @click="prev(); pause();"
      >
        <ChevronLeft :size="20" />
      </button>
      <div
        ref="trackRef"
        class="testimonial-track"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Depoimentos de clientes"
        tabindex="0"
        @scroll="onScroll"
        @keydown="onKeydown"
        @pointerdown="isTouching = true; pause();"
        @pointerup="isTouching = false; resume();"
        @pointercancel="isTouching = false; resume();"
        @focusin="pause"
        @focusout="resume"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id"
          :ref="(el) => setCardRef(el, index)"
          class="testimonial-slide"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} de ${items.length}`"
        >
          <TestimonialCard
            :name="item.name"
            :content="item.content"
            :rating="item.rating"
            :avatar-url="item.avatarUrl"
            :avatar-alt="item.avatarAlt"
            :is-fallback="item.isFallback"
          />
        </div>
      </div>
      <button
        v-if="items.length > 1"
        class="testimonial-nav next"
        type="button"
        aria-label="Próximo depoimento"
        @click="next(); pause();"
      >
        <ChevronRight :size="20" />
      </button>
    </div>
    <div
      v-if="items.length > 1"
      class="testimonial-dots"
      role="group"
      aria-label="Selecionar depoimento"
    >
      <button
        v-for="(item, index) in items"
        :key="item.id"
        type="button"
        class="testimonial-dot"
        :class="{ active: index === activeIndex }"
        :aria-current="index === activeIndex ? 'true' : undefined"
        :aria-label="`Ir para depoimento ${index + 1} de ${items.length}`"
        @click="goTo(index); pause();"
      ></button>
    </div>
  </div>
</template>
