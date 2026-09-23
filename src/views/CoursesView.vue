<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { getCourses } from "../services/api";
import CourseCard from "../components/CourseCard.vue";
import HeroSection from "../components/HeroSection.vue";
import PublicErrorState from "../components/PublicErrorState.vue";
import SkeletonCourseGrid from "../components/loading/SkeletonCourseGrid.vue";
import { setPageSeo } from "../services/seo";
const courses = ref([]);
const categories = ref([]);
const hero = ref(null);
const selected = ref("all");
const error = ref("");
const loading = ref(true);
let active = true;
onBeforeUnmount(() => {
  active = false;
});
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await getCourses();
    if (!active) return;
    courses.value = data.courses;
    categories.value = data.categories;
    hero.value = data.hero;
    setPageSeo("courses");
  } catch (e) {
    if (!active) return;
    error.value = e.message;
    setPageSeo("error");
  } finally {
    loading.value = false;
  }
}
onMounted(load);
const visibleCourses = computed(() =>
  selected.value === "all"
    ? courses.value
    : courses.value.filter(
        (course) => course.category?.slug === selected.value,
      ),
);
</script>
<template>
  <HeroSection class="page-hero motion-hero" :appearance="hero">
    <div class="container">
      <p class="eyebrow">ENCONTRE A SUA ESPECIALIZAÇÃO</p>
      <h1>Cursos para quem<br />vive a estrada.</h1>
      <p>Informações objetivas para você escolher a capacitação que procura.</p>
    </div>
  </HeroSection>
  <section class="section container">
    <div class="filters">
      <button
        :class="{ active: selected === 'all' }"
        :aria-pressed="selected === 'all'"
        type="button"
        @click="selected = 'all'"
      >
        Todos</button
      ><button
        v-for="category in categories"
        :key="category.id"
        :class="{ active: selected === category.slug }"
        :aria-pressed="selected === category.slug"
        type="button"
        @click="selected = category.slug"
      >
        {{ category.name }}
      </button>
    </div>
    <SkeletonCourseGrid v-if="loading" :count="6" />
    <PublicErrorState v-else-if="error" @retry="load" />
    <p v-else-if="!visibleCourses.length" class="empty-catalog" role="status">
      Nenhum curso disponível nesta seleção. Consulte outras categorias ou fale
      com nossa equipe.
    </p>
    <div v-else class="course-grid content-fade-in">
      <CourseCard
        v-for="(course, index) in visibleCourses"
        :key="course.id"
        :course="course"
        v-reveal="{ delay: (index % 3) * 90 }"
      />
    </div>
  </section>
</template>
