<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getCourse, trackWhatsAppClick, whatsappUrl } from "../services/api";
import { setPageSeo } from "../services/seo";
import MediaImage from "../components/admin/media/MediaImage.vue";
import HeroSection from "../components/HeroSection.vue";
import WhatsAppIcon from "../components/WhatsAppIcon.vue";
import LoadingState from "../components/LoadingState.vue";
import NotFoundView from "./NotFoundView.vue";
import PublicErrorState from "../components/PublicErrorState.vue";
const props = defineProps({ slug: { type: String, required: true } });
const course = ref(null);
const loading = ref(true);
const error = ref(false);
const notFound = ref(false);
const selectedModality = ref(null);
let generation = 0;
function sortModalities(modalities = []) {
  return [...modalities].sort((first, second) => {
    const firstPriority =
      first.name?.toLocaleLowerCase("pt-BR") === "formação" ? 0 : 1;
    const secondPriority =
      second.name?.toLocaleLowerCase("pt-BR") === "formação" ? 0 : 1;
    return firstPriority - secondPriority;
  });
}
async function load() {
  const current = ++generation;
  course.value = null;
  error.value = false;
  notFound.value = false;
  loading.value = true;
  setPageSeo("loading");
  try {
    const result = await getCourse(props.slug);
    if (current !== generation) return;
    course.value = result;
    selectedModality.value = sortModalities(result.modalities)[0]?.id || null;
    setPageSeo("course", result);
  } catch (failure) {
    if (current !== generation) return;
    notFound.value = [404, 410].includes(failure.status);
    error.value = !notFound.value;
    setPageSeo(notFound.value ? "not-found" : "error");
  } finally {
    if (current === generation) loading.value = false;
  }
}
watch(() => props.slug, load, { immediate: true });
onBeforeUnmount(() => generation++);
const modality = computed(() =>
  course.value?.modalities?.find((item) => item.id === selectedModality.value),
);
const orderedModalities = computed(() => sortModalities(course.value?.modalities));
function talk() {
  if (!course.value) return;
  const current = modality.value;
  const message =
    current?.whatsapp_message ||
    `Olá! Tenho interesse no curso ${course.value.name}${current?.name ? ` — ${current.name}` : ""}.`;
  trackWhatsAppClick({
    course_id: course.value.id,
    course_modality_id: current?.id,
  });
  window.location.assign(whatsappUrl(message));
}
</script>
<template>
  <LoadingState v-if="loading" />
  <NotFoundView v-else-if="notFound" />
  <div v-else-if="error" class="container">
    <PublicErrorState @retry="load" />
  </div>
  <template v-else-if="course">
    <HeroSection class="course-hero motion-hero" :appearance="course.hero">
      <div class="container course-hero-grid">
        <div>
          <RouterLink class="crumb" to="/cursos">← Todos os cursos</RouterLink>
          <p class="eyebrow light">
            {{ course.category?.name || "CURSO ESPECIALIZADO" }}
          </p>
          <h1>{{ course.name }}</h1>
          <p>{{ course.summary }}</p>
        </div>
        <div v-if="course.cover?.url" class="course-cover-hero">
          <MediaImage
            :src="course.cover.url"
            :alt="course.cover.alt_text"
            :width="course.cover.width"
            :height="course.cover.height"
            eager
          />
        </div>
        <div v-else class="course-symbol" :class="`art-${course.slug}`">
          <span>{{ course.short_name || course.name }}</span>
        </div>
      </div>
    </HeroSection>
    <section class="section course-surface">
      <div class="container course-layout">
      <div class="course-main">
        <div v-if="course.requirements?.length" class="info-panel">
          <p class="eyebrow">REQUISITOS PARA MATRÍCULA</p>
          <h2>Antes de começar, confira.</h2>
          <ul>
            <li v-for="requirement in course.requirements" :key="requirement">
              {{ requirement }}
            </li>
          </ul>
        </div>
        <div class="course-content">
          <h2>Escolha a modalidade</h2>
          <p>Selecione a opção que corresponde ao seu momento profissional.</p>
          <div class="modality-selector">
            <button
              v-for="item in orderedModalities"
              :key="item.id"
              :class="{ selected: item.id === selectedModality }"
              :aria-pressed="item.id === selectedModality"
              type="button"
              @click="selectedModality = item.id"
            >
              <span>{{ item.name }}</span
              ><small>{{ item.workload }}</small>
            </button>
          </div>
          <article v-if="modality" class="modality-detail">
            <div class="modality-head">
              <div>
                <p class="eyebrow">{{ modality.name.toUpperCase() }}</p>
                <h2>O que está incluído</h2>
              </div>
            </div>
            <p>{{ modality.description }}</p>
            <ul class="check-list">
              <li v-for="item in modality.features" :key="item">{{ item }}</li>
            </ul>
            <div v-if="modality.bonuses?.length" class="bonus-box">
              <p>BENEFÍCIOS EXTRAS</p>
              <span v-for="bonus in modality.bonuses" :key="bonus"
                >+ {{ bonus }}</span
              >
            </div>
            <div class="modality-footer">
              <div class="modality-price">
                <small>{{
                  modality.price_label || "Condições especiais para matrícula"
                }}</small
                ><strong v-if="modality.price_mode === 'visible'">{{
                  modality.price
                }}</strong>
              </div>
              <button class="button" type="button" @click="talk">
                <WhatsAppIcon /> Falar no WhatsApp
              </button>
            </div>
          </article>
        </div>
        <section v-if="course.faqs?.length" class="faq course-faq">
          <h2>Perguntas sobre este curso</h2>
          <details v-for="faq in course.faqs" :key="faq.id">
            <summary>{{ faq.question }} <span>+</span></summary>
            <p>{{ faq.answer }}</p>
          </details>
        </section>
      </div>
      <aside class="course-aside">
        <p class="eyebrow">PRECISA DE AJUDA?</p>
        <h3>Fale com um consultor.</h3>
        <p>
          Estamos prontos para orientar você sobre curso, modalidade e
          matrícula.
        </p>
        <button class="button button-full" type="button" @click="talk">
          <WhatsAppIcon /> Chamar no WhatsApp
        </button>
      </aside>
      </div>
    </section>
  </template>
</template>
