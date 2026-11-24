<script setup>
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import { getBlogComments, postBlogComment } from "../../services/api";
import { formatPostDate } from "../../services/blogFormat";

const props = defineProps({ slug: { type: String, required: true } });
const comments = ref([]);
const meta = ref(null);
const loading = ref(true);
const loadingMore = ref(false);
const loadError = ref(false);
const form = reactive({ author_name: "", body: "", website: "" });
const sending = ref(false);
const success = ref("");
const formError = ref("");
const fieldErrors = ref({});
let active = true;
let generation = 0;

async function load(page = 1) {
  const current = ++generation;
  page === 1 ? (loading.value = true) : (loadingMore.value = true);
  loadError.value = false;
  try {
    const payload = await getBlogComments(props.slug, page);
    if (!active || current !== generation) return;
    comments.value = page === 1 ? payload.data : [...comments.value, ...payload.data];
    meta.value = payload.meta;
  } catch {
    if (active && current === generation) loadError.value = true;
  } finally {
    if (active && current === generation) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

async function submit() {
  if (sending.value) return;
  success.value = "";
  formError.value = "";
  fieldErrors.value = {};
  sending.value = true;
  try {
    const response = await postBlogComment(props.slug, { ...form });
    success.value = response.message || "Seu comentário foi enviado e aguarda aprovação.";
    form.author_name = "";
    form.body = "";
  } catch (error) {
    fieldErrors.value = error.errors || {};
    formError.value = Object.keys(fieldErrors.value).length
      ? "Revise os campos destacados."
      : error.message;
  } finally {
    sending.value = false;
  }
}

watch(
  () => props.slug,
  () => {
    success.value = "";
    formError.value = "";
    fieldErrors.value = {};
    load(1);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  active = false;
});
</script>

<template>
  <section class="blog-comments" aria-labelledby="blog-comments-title">
    <h2 id="blog-comments-title">Comentários</h2>
    <p v-if="loading" class="blog-muted" role="status">Carregando comentários…</p>
    <p v-else-if="loadError" class="blog-muted" role="alert">
      Não foi possível carregar os comentários.
      <button class="blog-inline-button" type="button" @click="load(1)">Tentar novamente</button>
    </p>
    <template v-else>
      <ol v-if="comments.length" class="blog-comment-list">
        <li v-for="comment in comments" :key="comment.id">
          <p class="blog-comment-author">
            <strong>{{ comment.author_name }}</strong>
            <time :datetime="comment.created_at">{{ formatPostDate(comment.created_at) }}</time>
          </p>
          <p class="blog-comment-body">{{ comment.body }}</p>
        </li>
      </ol>
      <p v-else class="blog-muted">Ainda não há comentários. Compartilhe sua dúvida ou experiência.</p>
      <button
        v-if="meta && meta.current_page < meta.last_page"
        class="button button-secondary"
        type="button"
        :disabled="loadingMore"
        @click="load(meta.current_page + 1)"
      >
        {{ loadingMore ? "Carregando…" : "Ver mais comentários" }}
      </button>
    </template>

    <form class="blog-comment-form" novalidate @submit.prevent="submit">
      <h3>Deixe seu comentário</h3>
      <p class="blog-muted">
        Os comentários são revisados antes de aparecer. Não inclua telefone, e-mail ou outros dados pessoais.
      </p>
      <label for="blog-comment-name">Nome de exibição</label>
      <input
        id="blog-comment-name"
        v-model="form.author_name"
        type="text"
        maxlength="60"
        autocomplete="nickname"
        required
        :aria-invalid="Boolean(fieldErrors.author_name)"
        :aria-describedby="fieldErrors.author_name ? 'blog-comment-name-error' : undefined"
      />
      <p v-if="fieldErrors.author_name" id="blog-comment-name-error" class="blog-field-error">{{ fieldErrors.author_name[0] }}</p>
      <label for="blog-comment-body">Comentário</label>
      <textarea
        id="blog-comment-body"
        v-model="form.body"
        rows="5"
        maxlength="2000"
        required
        :aria-invalid="Boolean(fieldErrors.body)"
        :aria-describedby="fieldErrors.body ? 'blog-comment-body-error blog-comment-count' : 'blog-comment-count'"
      ></textarea>
      <p id="blog-comment-count" class="blog-field-hint">{{ form.body.length }}/2000 caracteres · apenas texto simples</p>
      <p v-if="fieldErrors.body" id="blog-comment-body-error" class="blog-field-error">{{ fieldErrors.body[0] }}</p>
      <div class="blog-honeypot" aria-hidden="true">
        <label for="blog-comment-website">Não preencha este campo</label>
        <input id="blog-comment-website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
      </div>
      <p v-if="formError" class="blog-field-error" role="alert">{{ formError }}</p>
      <p v-if="success" class="blog-success" role="status">{{ success }}</p>
      <button class="button" type="submit" :disabled="sending">
        {{ sending ? "Enviando…" : "Enviar comentário" }}
      </button>
    </form>
  </section>
</template>
