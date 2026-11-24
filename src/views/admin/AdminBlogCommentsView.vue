<script setup>
import { onMounted, ref, watch } from "vue";
import { Ban, Check, EyeOff } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import { getAdminBlogComments, getAdminBlogPosts, updateAdminBlogComment } from "../../services/adminApi";

const STATUS = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "hidden", label: "Ocultos" },
  { value: "rejected", label: "Rejeitados" },
  { value: "", label: "Todos" },
];
const STATUS_LABELS = { pending: "Pendente", approved: "Aprovado", hidden: "Oculto", rejected: "Rejeitado" };
const route = useRoute();
const router = useRouter();
const comments = ref([]);
const meta = ref(null);
const counts = ref({});
const posts = ref([]);
const loading = ref(true);
const error = ref("");
const notice = ref("");
const busyId = ref(null);
const filters = ref({
  blog_post_id: route.query.artigo ? String(route.query.artigo) : "",
  status: route.query.status ?? "pending",
  page: 1,
});

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "—";
}
async function load(page = filters.value.page) {
  filters.value.page = page;
  loading.value = true;
  error.value = "";
  try {
    const payload = await getAdminBlogComments({ ...filters.value, per_page: 20 });
    comments.value = payload.data;
    meta.value = payload.meta;
    counts.value = payload.counts || {};
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}
watch(
  () => [filters.value.blog_post_id, filters.value.status],
  ([artigo, status]) => {
    router.replace({ query: { artigo: artigo || undefined, status } });
    load(1);
  },
);
async function moderate(comment, status) {
  busyId.value = comment.id;
  error.value = "";
  notice.value = "";
  try {
    await updateAdminBlogComment(comment.id, status);
    notice.value = { approved: "Comentário aprovado e publicado.", rejected: "Comentário rejeitado.", hidden: "Comentário ocultado do site." }[status];
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    busyId.value = null;
  }
}
onMounted(async () => {
  load(1);
  try {
    posts.value = (await getAdminBlogPosts({ per_page: 100, sort: "title", direction: "asc" })).data;
  } catch {
    posts.value = [];
  }
});
</script>

<template>
  <AdminPageHeader title="Comentários do blog" description="Aprove, rejeite ou oculte comentários. Somente aprovados aparecem no site.">
    <template #actions>
      <RouterLink class="admin-button ghost" :to="{ name: 'admin-blog' }">Voltar aos artigos</RouterLink>
    </template>
  </AdminPageHeader>
  <div class="admin-filter-card">
    <div class="blog-admin-tabs" role="group" aria-label="Filtrar por status">
      <button
        v-for="item in STATUS"
        :key="item.value"
        type="button"
        :class="{ active: filters.status === item.value }"
        :aria-pressed="filters.status === item.value"
        @click="filters.status = item.value"
      >
        {{ item.label }}<span v-if="item.value && counts[item.value] !== undefined">{{ counts[item.value] }}</span>
      </button>
    </div>
    <div class="admin-filter-row">
      <label
        ><span>Artigo</span
        ><select v-model="filters.blog_post_id">
          <option value="">Todos os artigos</option>
          <option v-for="post in posts" :key="post.id" :value="String(post.id)">{{ post.title }}</option>
        </select></label
      >
    </div>
  </div>
  <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
  <p v-if="notice" class="form-alert success" role="status">{{ notice }}</p>
  <AdminState v-if="loading" message="Carregando comentários…" />
  <AdminState v-else-if="!comments.length" type="empty" message="Nenhum comentário nesta seleção." />
  <section v-else class="blog-admin-comments">
    <article v-for="comment in comments" :key="comment.id" class="blog-admin-comment">
      <header>
        <div>
          <strong>{{ comment.author_name }}</strong>
          <span>{{ formatDate(comment.created_at) }}</span>
        </div>
        <span class="status-pill" :class="comment.status">{{ STATUS_LABELS[comment.status] }}</span>
      </header>
      <p class="blog-admin-comment-body">{{ comment.body }}</p>
      <footer>
        <span v-if="comment.post"
          >Em
          <RouterLink :to="{ name: 'admin-blog-edit', params: { id: comment.post.id } }">{{ comment.post.title }}</RouterLink
          ><small v-if="!comment.post.is_published"> (artigo fora do ar)</small></span
        >
        <div class="blog-admin-inline-actions">
          <button
            v-if="comment.status !== 'approved'"
            class="admin-button primary"
            type="button"
            :disabled="busyId === comment.id"
            @click="moderate(comment, 'approved')"
          >
            <Check :size="16" />Aprovar
          </button>
          <button
            v-if="comment.status === 'approved'"
            class="admin-button secondary"
            type="button"
            :disabled="busyId === comment.id"
            @click="moderate(comment, 'hidden')"
          >
            <EyeOff :size="16" />Ocultar
          </button>
          <button
            v-if="comment.status !== 'rejected'"
            class="admin-button ghost"
            type="button"
            :disabled="busyId === comment.id"
            @click="moderate(comment, 'rejected')"
          >
            <Ban :size="16" />Rejeitar
          </button>
        </div>
      </footer>
    </article>
    <div v-if="meta" class="admin-pagination">
      <span>{{ meta.from }}–{{ meta.to }} de {{ meta.total }} comentários</span>
      <div>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page <= 1" @click="load(meta.current_page - 1)">Anterior</button>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">Próxima</button>
      </div>
    </div>
  </section>
</template>
