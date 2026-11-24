<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { Eye, ImagePlus, PencilLine } from "lucide-vue-next";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import HeroMediaField from "../../components/admin/HeroMediaField.vue";
import MediaDialog from "../../components/admin/media/MediaDialog.vue";
import MediaLibrary from "../../components/admin/media/MediaLibrary.vue";
import BlogArticleContent from "../../components/blog/BlogArticleContent.vue";
import {
  createAdminBlogPost,
  getAdminBlogCategories,
  getAdminBlogPost,
  getAdminCourses,
  previewAdminBlogBody,
  updateAdminBlogPost,
  updateBlogPostPublication,
} from "../../services/adminApi";

const STATUS_LABELS = { draft: "Rascunho", published: "Publicado", unpublished: "Fora do ar" };
// Survives the remount that happens when a new article becomes the edit route.
let carriedNotice = "";
const route = useRoute();
const router = useRouter();
const postId = computed(() => route.params.id || null);
const loading = ref(Boolean(postId.value));
const saving = ref(false);
const error = ref("");
const notice = ref("");
const fieldErrors = ref({});
const isDirty = ref(false);
const slugEdited = ref(false);
const mode = ref(route.query.previa === "1" ? "preview" : "edit");
const courses = ref([]);
const categories = ref([]);
const status = ref("draft");
const publishedAt = ref(null);
const bodyField = ref(null);
const preview = reactive({ loading: false, html: "", removed: [], error: "" });
const imageDialog = ref(false);
const imageBusy = ref(false);
const pendingImage = reactive({ media: null, alt: "", caption: "" });

const form = reactive({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: "",
  course_id: "",
  cta_action: "course",
  cta_label: "",
  cover_media: null,
  cover_alt_text: "",
  meta_title: "",
  meta_description: "",
});

const selectedCourse = computed(() => courses.value.find((course) => course.id === Number(form.course_id)) || null);
const defaultCtaLabel = computed(() => {
  if (!selectedCourse.value) return "";
  const name = selectedCourse.value.name.split(/\s+[—–-]\s+/u)[0].trim() || selectedCourse.value.name;
  return form.cta_action === "whatsapp" ? `Tire dúvidas sobre o curso de ${name}` : `Conheça o curso de ${name}`;
});
const readingMinutes = computed(() => {
  const words = (preview.html || form.body).replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
});
const previewPost = computed(() => ({
  title: form.title,
  excerpt: form.excerpt,
  category: form.category,
  published_at: publishedAt.value,
  reading_minutes: readingMinutes.value,
  cover: form.cover_media?.url
    ? {
        url: form.cover_media.url,
        alt_text: form.cover_alt_text || form.title,
        width: form.cover_media.width,
        height: form.cover_media.height,
      }
    : null,
  body: preview.html,
}));

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 150);
}
function markDirty() {
  isDirty.value = true;
}
function updateTitle() {
  if (!slugEdited.value) form.slug = slugify(form.title);
  markDirty();
}
function fill(post) {
  Object.assign(form, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category || "",
    course_id: post.course_id || "",
    cta_action: post.cta_action || "course",
    cta_label: post.cta_label || "",
    cover_media: post.cover_media || null,
    cover_alt_text: post.cover_alt_text || "",
    meta_title: post.meta_title || "",
    meta_description: post.meta_description || "",
  });
  status.value = post.status;
  publishedAt.value = post.published_at;
  slugEdited.value = true;
  isDirty.value = false;
}
function payload() {
  return {
    title: form.title,
    slug: form.slug || null,
    excerpt: form.excerpt,
    body: form.body,
    category: form.category || null,
    course_id: form.course_id ? Number(form.course_id) : null,
    cta_action: form.cta_action,
    cta_label: form.cta_label || null,
    cover_media_id: form.cover_media?.id || null,
    cover_alt_text: form.cover_media ? form.cover_alt_text || null : null,
    meta_title: form.meta_title || null,
    meta_description: form.meta_description || null,
  };
}
function showErrors(requestError) {
  fieldErrors.value = requestError.errors || {};
  const first = Object.values(fieldErrors.value)[0]?.[0];
  error.value = first || requestError.message;
}
async function save(nextStatus = null) {
  error.value = "";
  notice.value = "";
  fieldErrors.value = {};
  saving.value = true;
  try {
    let response = postId.value
      ? await updateAdminBlogPost(postId.value, payload())
      : await createAdminBlogPost(payload());
    if (nextStatus && nextStatus !== response.data.status) {
      response = await updateBlogPostPublication(response.data.id, nextStatus);
    }
    fill(response.data);
    notice.value =
      nextStatus === "published"
        ? "Artigo publicado."
        : nextStatus === "unpublished"
          ? "Artigo retirado do ar. Ele não aparece mais no site."
          : status.value === "published"
            ? "Alterações publicadas."
            : "Rascunho salvo.";
    if (!postId.value) {
      carriedNotice = notice.value;
      isDirty.value = false;
      await router.replace({ name: "admin-blog-edit", params: { id: response.data.id }, query: route.query });
      return;
    }
    if (mode.value === "preview") await refreshPreview();
  } catch (requestError) {
    showErrors(requestError);
  } finally {
    saving.value = false;
  }
}
async function refreshPreview() {
  preview.loading = true;
  preview.error = "";
  try {
    const response = await previewAdminBlogBody(form.body);
    preview.html = response.data.html;
    preview.removed = response.data.removed;
  } catch (requestError) {
    preview.error = requestError.message;
  } finally {
    preview.loading = false;
  }
}
watch(mode, (value) => {
  router.replace({ query: { ...route.query, previa: value === "preview" ? "1" : undefined } });
  if (value === "preview") refreshPreview();
});

function selectCover(media) {
  form.cover_media = media;
  if (media && !form.cover_alt_text) form.cover_alt_text = media.alt_is_custom ? media.alt_text || "" : "";
  if (!media) form.cover_alt_text = "";
  markDirty();
}
function chooseImage(media) {
  pendingImage.media = media;
  pendingImage.alt = media.alt_is_custom ? media.alt_text || "" : "";
  pendingImage.caption = "";
  imageDialog.value = false;
}
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
function insertImage() {
  const media = pendingImage.media;
  if (!media?.url) return;
  const size = media.width && media.height ? ` width="${media.width}" height="${media.height}"` : "";
  const caption = pendingImage.caption.trim() ? `\n  <figcaption>${escapeHtml(pendingImage.caption.trim())}</figcaption>` : "";
  const snippet = `\n<figure>\n  <img src="${escapeHtml(media.url)}" alt="${escapeHtml(pendingImage.alt.trim())}"${size}>${caption}\n</figure>\n`;
  const field = bodyField.value;
  const start = field?.selectionStart ?? form.body.length;
  const end = field?.selectionEnd ?? form.body.length;
  form.body = form.body.slice(0, start) + snippet + form.body.slice(end);
  pendingImage.media = null;
  markDirty();
  requestAnimationFrame(() => {
    field?.focus();
    field?.setSelectionRange(start + snippet.length, start + snippet.length);
  });
}
function cancel() {
  if (!isDirty.value || window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?"))
    router.push({ name: "admin-blog" });
}
onBeforeRouteLeave((to) => {
  if (to.name === "admin-blog-edit") return true;
  if (isDirty.value && !saving.value)
    return window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?");
});
onMounted(async () => {
  notice.value = carriedNotice;
  carriedNotice = "";
  try {
    const [coursesPayload, categoriesPayload, postPayload] = await Promise.all([
      getAdminCourses({ per_page: 50, sort: "name", direction: "asc" }).catch(() => ({ data: [] })),
      getAdminBlogCategories().catch(() => ({ data: [] })),
      postId.value ? getAdminBlogPost(postId.value) : null,
    ]);
    courses.value = coursesPayload.data || [];
    categories.value = categoriesPayload.data || [];
    if (postPayload) fill(postPayload.data);
    if (mode.value === "preview") await refreshPreview();
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <AdminPageHeader
    :title="postId ? 'Editar artigo' : 'Novo artigo'"
    :description="postId ? `Status: ${STATUS_LABELS[status]}` : 'Todo artigo novo começa como rascunho.'"
    ><template #actions
      ><button class="admin-button ghost" type="button" @click="cancel">Voltar</button
      ><template v-if="status === 'published'"
        ><button class="admin-button secondary" type="button" :disabled="saving" @click="save('unpublished')">Retirar do ar</button
        ><button class="admin-button primary" type="button" :disabled="saving" @click="save()">
          {{ saving ? "Salvando…" : "Salvar e manter publicado" }}
        </button></template
      ><template v-else
        ><button class="admin-button secondary" type="button" :disabled="saving" @click="save()">Salvar rascunho</button
        ><button class="admin-button primary" type="button" :disabled="saving" @click="save('published')">
          {{ saving ? "Salvando…" : "Publicar" }}
        </button></template
      ></template
    ></AdminPageHeader
  >
  <AdminState v-if="loading" message="Carregando artigo…" />
  <template v-else>
    <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
    <p v-if="notice" class="form-alert success" role="status">{{ notice }}</p>
    <div class="blog-admin-mode" role="group" aria-label="Modo de visualização">
      <button type="button" :aria-pressed="mode === 'edit'" :class="{ active: mode === 'edit' }" @click="mode = 'edit'">
        <PencilLine :size="16" />Editar
      </button>
      <button type="button" :aria-pressed="mode === 'preview'" :class="{ active: mode === 'preview' }" @click="mode = 'preview'">
        <Eye :size="16" />Prévia
      </button>
    </div>

    <section v-if="mode === 'preview'" class="blog-admin-preview" aria-label="Prévia do artigo">
      <p class="blog-admin-preview-note">
        Prévia com o estilo de leitura do site, usando a mesma revisão de segurança aplicada ao salvar. Links ficam desativados aqui.
      </p>
      <p v-if="preview.removed.length" class="form-alert warning" role="status">
        Estes itens serão removidos ao salvar: {{ preview.removed.join(", ") }}.
      </p>
      <p v-if="preview.error" class="form-alert error" role="alert">{{ preview.error }}</p>
      <AdminState v-if="preview.loading" message="Preparando prévia…" />
      <div v-else class="blog-admin-preview-frame">
        <BlogArticleContent :post="previewPost" preview />
        <p v-if="!preview.html" class="blog-muted">O corpo do artigo está vazio.</p>
      </div>
    </section>

    <form v-show="mode === 'edit'" class="course-form" @submit.prevent="save()">
      <section class="form-card">
        <div class="form-card-heading">
          <div>
            <h2>Conteúdo</h2>
            <p>Título, endereço, resumo e o corpo do artigo em HTML.</p>
          </div>
        </div>
        <div class="form-grid">
          <label
            >Título<input v-model="form.title" required maxlength="160" :aria-invalid="Boolean(fieldErrors.title)" @input="updateTitle"
          /></label>
          <label
            >Endereço (slug)<small>Letras minúsculas, números e hífens.</small
            ><input
              v-model="form.slug"
              maxlength="160"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              :aria-invalid="Boolean(fieldErrors.slug)"
              @input="
                slugEdited = true;
                markDirty();
              "
            /><span class="input-hint">/blog/{{ form.slug || "endereco-do-artigo" }}</span></label
          >
          <label
            >Resumo<small>Aparece na listagem e na abertura do artigo. {{ form.excerpt.length }}/320</small
            ><textarea v-model="form.excerpt" required rows="2" maxlength="320" :aria-invalid="Boolean(fieldErrors.excerpt)" @input="markDirty"></textarea
          ></label>
        </div>
        <div class="blog-admin-body">
          <div class="blog-admin-body-head">
            <label for="blog-body">Corpo do artigo (HTML)</label>
            <button class="admin-button secondary" type="button" @click="imageDialog = true"><ImagePlus :size="16" />Inserir imagem da biblioteca</button>
          </div>
          <textarea
            id="blog-body"
            ref="bodyField"
            v-model="form.body"
            class="blog-admin-code"
            rows="22"
            spellcheck="true"
            required
            :aria-invalid="Boolean(fieldErrors.body)"
            aria-describedby="blog-body-help"
            @input="markDirty"
          ></textarea>
          <p id="blog-body-help" class="input-hint">
            Use &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;/&lt;ol&gt;, &lt;blockquote&gt;, &lt;a&gt;, &lt;table&gt; e &lt;figure&gt;. Scripts, estilos,
            incorporações e imagens de fora da biblioteca são removidos ao salvar.
          </p>
          <div v-if="pendingImage.media" class="blog-admin-image-panel">
            <img :src="pendingImage.media.url" alt="" />
            <div class="form-grid">
              <label
                >Texto alternativo<small>Descreva a imagem para quem não pode vê-la. Deixe vazio só se for decorativa.</small
                ><input v-model="pendingImage.alt" maxlength="500"
              /></label>
              <label>Legenda (opcional)<input v-model="pendingImage.caption" maxlength="300" /></label>
              <div class="blog-admin-inline-actions">
                <button class="admin-button primary" type="button" @click="insertImage">Inserir no cursor</button>
                <button class="admin-button ghost" type="button" @click="pendingImage.media = null">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="form-card-heading">
          <div>
            <h2>Organização e chamada para o curso</h2>
            <p>A categoria e o curso ajudam a sugerir artigos relacionados.</p>
          </div>
        </div>
        <div class="form-grid two">
          <label
            >Categoria<small>Ex.: Formação, Atualização, Legislação.</small
            ><input v-model="form.category" list="blog-categories" maxlength="60" @input="markDirty" /><datalist id="blog-categories"
              ><option v-for="category in categories" :key="category" :value="category"></option></datalist
          ></label>
          <label
            >Curso relacionado (opcional)<select v-model="form.course_id" @change="markDirty">
              <option value="">Nenhum</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.name }}{{ course.is_published ? "" : " (rascunho)" }}
              </option>
            </select></label
          >
        </div>
        <template v-if="selectedCourse">
          <p v-if="!selectedCourse.is_published" class="form-alert warning">
            Este curso não está publicado. A chamada só aparece quando o curso estiver no ar.
          </p>
          <div class="form-grid two">
            <fieldset class="blog-admin-fieldset">
              <legend>Ação do botão</legend>
              <label class="blog-admin-radio"><input v-model="form.cta_action" type="radio" value="course" @change="markDirty" />Abrir a página do curso</label>
              <label class="blog-admin-radio"><input v-model="form.cta_action" type="radio" value="whatsapp" @change="markDirty" />Conversar pelo WhatsApp</label>
            </fieldset>
            <label
              >Texto do botão (opcional)<small>Padrão: “{{ defaultCtaLabel }}”.</small
              ><input v-model="form.cta_label" maxlength="80" :placeholder="defaultCtaLabel" @input="markDirty"
            /></label>
          </div>
        </template>
      </section>

      <section class="form-card">
        <div class="form-card-heading">
          <div>
            <h2>Capa</h2>
            <p>Opcional. Sem capa, o artigo é exibido somente com texto.</p>
          </div>
        </div>
        <HeroMediaField :media="form.cover_media" label="Capa do artigo" description="JPG, PNG, WebP ou SVG da biblioteca de mídia." @select="selectCover" />
        <label v-if="form.cover_media"
          >Texto alternativo da capa<small>Se ficar vazio, usamos o título do artigo.</small
          ><input v-model="form.cover_alt_text" maxlength="500" :placeholder="form.title" @input="markDirty"
        /></label>
      </section>

      <section class="form-card">
        <div class="form-card-heading">
          <div>
            <h2>SEO</h2>
            <p>Opcional. Sem preenchimento, usamos o título e o resumo.</p>
          </div>
        </div>
        <div class="form-grid">
          <label
            >Título para buscadores<small>{{ form.meta_title.length }}/160 · ideal até 60 caracteres</small
            ><input v-model="form.meta_title" maxlength="160" :placeholder="form.title" @input="markDirty"
          /></label>
          <label
            >Descrição para buscadores<small>{{ form.meta_description.length }}/320 · ideal até 160 caracteres</small
            ><textarea v-model="form.meta_description" rows="2" maxlength="320" :placeholder="form.excerpt" @input="markDirty"></textarea
          ></label>
        </div>
      </section>
    </form>

    <MediaDialog :open="imageDialog" title="Inserir imagem no artigo" wide :busy="imageBusy" @close="imageDialog = false">
      <MediaLibrary v-if="imageDialog" selectable :initial-upload="false" @select="chooseImage" @busy="imageBusy = $event" />
    </MediaDialog>
  </template>
</template>
