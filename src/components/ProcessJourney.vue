<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import WhatsAppIcon from "./WhatsAppIcon.vue";

const steps = [
  {
    title: "Escolha sua especialização",
    description: "Veja requisitos e compare Formação e Atualização.",
  },
  {
    title: "Chame no WhatsApp",
    description: "Nossa equipe orienta sobre condições e matrícula.",
    whatsapp: true,
  },
  {
    title: "Receba seu acesso",
    description: "Após a confirmação, você recebe tudo pelo WhatsApp.",
  },
];

const grid = ref(null);
const route = ref("");
const viewBox = ref("0 0 1 1");
const routeVisible = ref(false);
const activeSteps = ref(steps.map(() => false));
let resizeObserver;
let gridObserver;
let stepObserver;
let resizeFrame;
const stepTimers = [];

function measureRoute() {
  if (!grid.value) return;
  const bounds = grid.value.getBoundingClientRect();
  const markers = grid.value.querySelectorAll(".process-step-marker");
  if (markers.length !== steps.length || !bounds.width || !bounds.height) return;

  const points = [...markers].map((marker) => {
    const rect = marker.getBoundingClientRect();
    return [
      rect.left - bounds.left + rect.width / 2,
      rect.top - bounds.top + rect.height / 2,
    ];
  });

  viewBox.value = `0 0 ${bounds.width} ${bounds.height}`;
  route.value = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

function scheduleMeasure() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(measureRoute);
}

onMounted(async () => {
  await nextTick();
  if (!grid.value) return;
  measureRoute();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(grid.value);
  } else {
    window.addEventListener("resize", scheduleMeasure);
  }

  if (
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    routeVisible.value = true;
    activeSteps.value = steps.map(() => true);
    return;
  }

  const root = document.getElementById("public-scroll");
  gridObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      routeVisible.value = true;
      gridObserver.disconnect();
    },
    { root, threshold: 0.08 },
  );
  gridObserver.observe(grid.value);

  stepObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = Number(entry.target.dataset.stepIndex);
        const delay = window.innerWidth > 560 ? index * 180 : 0;
        stepTimers.push(
          window.setTimeout(() => {
            activeSteps.value[index] = true;
          }, delay),
        );
        stepObserver.unobserve(entry.target);
      }
    },
    { root, rootMargin: "0px 0px -12% 0px", threshold: 0.35 },
  );
  grid.value.querySelectorAll(".process-step").forEach((step) => {
    stepObserver.observe(step);
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", scheduleMeasure);
  gridObserver?.disconnect();
  stepObserver?.disconnect();
  cancelAnimationFrame(resizeFrame);
  stepTimers.forEach(clearTimeout);
});
</script>

<template>
  <div ref="grid" class="process-grid process-journey">
    <svg
      v-if="route"
      class="process-route"
      :viewBox="viewBox"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path class="process-route-base" :d="route" />
      <path
        class="process-route-progress"
        :class="{ 'is-visible': routeVisible }"
        :d="route"
        pathLength="1"
      />
    </svg>
    <article
      v-for="(step, index) in steps"
      :key="step.title"
      class="process-step"
      :class="{ 'is-active': activeSteps[index] }"
      :data-step-index="index"
    >
      <span class="process-step-marker">{{ index + 1 }}</span>
      <h3 :class="{ 'process-whatsapp-title': step.whatsapp }">
        <WhatsAppIcon v-if="step.whatsapp" />{{ step.title }}
      </h3>
      <p>{{ step.description }}</p>
    </article>
  </div>
</template>
