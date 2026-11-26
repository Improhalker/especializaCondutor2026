<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getBlogPost, trackWhatsAppClick, whatsappUrl } from "../services/api";
import { setPageSeo } from "../services/seo";
import BlogArticleContent from "../components/blog/BlogArticleContent.vue";
import BlogComments from "../components/blog/BlogComments.vue";
import BlogShare from "../components/blog/BlogShare.vue";
import BlogTestimonials from "../components/blog/BlogTestimonials.vue";
import CourseCard from "../components/CourseCard.vue";
import PublicErrorState from "../components/PublicErrorState.vue";
import SkeletonText from "../components/loading/SkeletonText.vue";
import SkeletonBase from "../components/loading/SkeletonBase.vue";
import WhatsAppIcon from "../components/WhatsAppIcon.vue";
import MediaImage from "../components/admin/media/MediaImage.vue";
import { waitForSkeleton } from "../components/loading/waitForSkeleton";
import { formatPostDate } from "../services/blogFormat";
import NotFoundView from "./NotFoundView.vue";

const props = defineProps({ slug: { type: String, required: true } });
const post = ref(null);
const extra = ref({ related: [], next: null, suggested_courses: [] });
const loading = ref(true);
const error = ref(false);
const notFound = ref(false);
let generation = 0;

async function load() {
  const startedAt = performance.now();
  const current = ++generation;
  post.value = null;
  loading.value = true;
  error.value = false;
  notFound.value = false;
  setPageSeo("loading-article");
  try {
    const payload = await getBlogPost(props.slug);
    if (current !== generation) return;
    post.value = payload.data;
    extra.value = { related: [], next: null, suggested_courses: [], ...payload.meta };
    setPageSeo("blog-post", payload.data);
  } catch (failure) {
    if (current !== generation) return;
    notFound.value = [404, 410].includes(failure.status);
    error.value = !notFound.value;
    setPageSeo(notFound.value ? "not-found" : "error");
  } finally {
    if (current === generation) {
      if (post.value) await waitForSkeleton(startedAt);
      if (current === generation) loading.value = false;
    }
  }
}
watch(() => props.slug, load, { immediate: true });
onBeforeUnmount(() => generation++);

const course = computed(() => post.value?.course || null);
const cta = computed(() => (course.value ? post.value.cta : null));

function openWhatsApp() {
  if (!course.value) return;
  trackWhatsAppClick({ course_id: course.value.id });
  window.location.assign(
    whatsappUrl(`Olá! Li o artigo “${post.value.title}” no blog e tenho interesse no curso ${course.value.name}.`),
  );
}
</script>

<template>
  <div v-if="loading" class="container blog-article-wrap" role="status" aria-busy="true">
    <span class="sr-only">Carregando artigo</span>
    <div class="blog-article blog-article-skeleton">
      <SkeletonText width="140px" height="12px" />
      <SkeletonText :lines="2" height="38px" gap="14px" last-line-width="60%" />
      <SkeletonText width="220px" />
      <SkeletonBase height="260px" radius="14px" />
      <SkeletonText :lines="6" gap="12px" />
    </div>
  </div>
  <NotFoundView v-else-if="notFound" />
  <div v-else-if="error" class="container">
    <PublicErrorState @retry="load" />
  </div>
  <div v-else-if="post" class="content-fade-in">
    <div class="container blog-article-wrap blog-layout">
      <div class="blog-main">
        <BlogArticleContent :post="post" />

        <BlogShare class="blog-share-inline" :title="post.title" :slug="post.slug" />

        <aside v-if="cta" class="blog-course-cta" aria-labelledby="blog-course-cta-title">
          <div>
            <p class="eyebrow light">CURSO RELACIONADO</p>
            <h2 id="blog-course-cta-title">{{ course.name }}</h2>
            <p v-if="course.summary">{{ course.summary }}</p>
          </div>
          <button
            v-if="cta.action === 'whatsapp'"
            class="button button-white"
            type="button"
            data-analytics-kind="whatsapp"
            :data-analytics-label="`WhatsApp · Blog · ${course.name}`"
            @click="openWhatsApp"
          >
            <WhatsAppIcon /> {{ cta.label }}
          </button>
          <RouterLink
            v-else
            class="button button-white"
            :to="`/cursos/${encodeURIComponent(course.slug)}`"
            data-analytics-kind="navigation"
            :data-analytics-label="`Blog · Artigo para curso · ${course.name}`"
            >{{ cta.label }} <span aria-hidden="true">→</span></RouterLink
          >
        </aside>

        <nav class="blog-next" aria-label="Continuar lendo">
          <RouterLink
            v-if="extra.next"
            class="blog-next-link"
            :to="`/blog/${encodeURIComponent(extra.next.slug)}`"
            data-analytics-kind="navigation"
            data-analytics-label="Blog · Próximo artigo"
          >
            <small>Próximo artigo</small>
            <strong>{{ extra.next.title }}</strong>
            <span aria-hidden="true">→</span>
          </RouterLink>
          <RouterLink
            v-else
            class="blog-next-link"
            to="/blog"
            data-analytics-kind="navigation"
            data-analytics-label="Blog · Ver todos os artigos"
          >
            <small>Você chegou ao fim da lista</small>
            <strong>Ver todos os artigos</strong>
            <span aria-hidden="true">→</span>
          </RouterLink>
        </nav>
      </div>

      <aside class="blog-sidebar" aria-label="Mais sobre este artigo">
        <section v-if="extra.related.length" class="blog-sidebar-block" aria-labelledby="blog-related-title">
          <h2 id="blog-related-title" class="blog-sidebar-title">Artigos relacionados</h2>
          <ul class="blog-related-list">
            <li v-for="item in extra.related" :key="item.id">
              <RouterLink
                class="blog-related-item"
                :to="`/blog/${encodeURIComponent(item.slug)}`"
                data-analytics-kind="navigation"
                :data-analytics-label="`Blog · Relacionado · ${item.title}`"
              >
                <span v-if="item.cover?.url" class="blog-related-thumb">
                  <MediaImage :src="item.cover.url" alt="" :width="item.cover.width" :height="item.cover.height" />
                </span>
                <span class="blog-related-text">
                  <small v-if="item.category">{{ item.category }}</small>
                  <strong>{{ item.title }}</strong>
                  <time :datetime="item.published_at">{{ formatPostDate(item.published_at) }}</time>
                </span>
              </RouterLink>
            </li>
          </ul>
          <RouterLink class="text-link blog-sidebar-more" to="/blog">Ver todos os artigos <span aria-hidden="true">→</span></RouterLink>
        </section>

        <BlogTestimonials />

        <BlogShare class="blog-sidebar-block blog-share-side" :title="post.title" :slug="post.slug" />
      </aside>

      <BlogComments class="blog-layout-comments" :slug="post.slug" />
    </div>

    <section
      v-if="extra.suggested_courses.length"
      class="section container blog-courses"
      aria-labelledby="blog-courses-title"
    >
      <div class="section-heading split">
        <div>
          <p class="eyebrow">CURSOS</p>
          <h2 id="blog-courses-title">Conheça outras especializações</h2>
        </div>
        <RouterLink class="text-link" to="/cursos">Ver todos <span aria-hidden="true">→</span></RouterLink>
      </div>
      <div class="course-grid">
        <CourseCard v-for="item in extra.suggested_courses" :key="item.id" :course="item" />
      </div>
    </section>
    <section v-else class="cta-band">
      <div class="container cta-inner">
        <div>
          <p class="eyebrow light">CATÁLOGO</p>
          <h2>Encontre o curso para o<br />seu próximo passo.</h2>
        </div>
        <RouterLink class="button button-white" to="/cursos" data-analytics-kind="navigation" data-analytics-label="Blog · Catálogo de cursos"
          >Ver todos os cursos</RouterLink
        >
      </div>
    </section>
  </div>
</template>
