<script setup>
import { onMounted, ref, watch } from "vue";
import { ExternalLink, Eye, MessagesSquare, Plus, Search } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import ConfirmModal from "../../components/admin/ConfirmModal.vue";
import {
  deleteAdminBlogPost,
  getAdminBlogPosts,
  updateBlogPostPublication,
} from "../../services/adminApi";

const STATUS_LABELS = { draft: "Rascunho", published: "Publicado", unpublished: "Fora do ar" };
const posts = ref([]);
const meta = ref(null);
const loading = ref(true);
const error = ref("");
const notice = ref("");
const busyId = ref(null);
const selected = ref(null);
const deleting = ref(false);
const filters = ref({ search: "", status: "", sort: "updated_at", direction: "desc", page: 1, per_page: 15 });
let searchTimer;

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "—";
}
function load(page = filters.value.page) {
  filters.value.page = page;
  loading.value = true;
  error.value = "";
  return getAdminBlogPosts(filters.value)
    .then((payload) => {
      posts.value = payload.data;
      meta.value = payload.meta;
    })
    .catch((requestError) => {
      error.value = requestError.message;
    })
    .finally(() => {
      loading.value = false;
    });
}
onMounted(load);
watch(() => [filters.value.status, filters.value.sort, filters.value.direction], () => load(1));
function search() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(1), 300);
}
async function setPublication(post, status) {
  busyId.value = post.id;
  error.value = "";
  notice.value = "";
  try {
    await updateBlogPostPublication(post.id, status);
    notice.value = status === "published" ? `“${post.title}” foi publicado.` : `“${post.title}” foi retirado do ar.`;
    await load();
  } catch (requestError) {
    error.value = requestError.errors?.body?.[0] || requestError.message;
  } finally {
    busyId.value = null;
  }
}
async function destroyPost() {
  if (!selected.value) return;
  deleting.value = true;
  try {
    await deleteAdminBlogPost(selected.value.id);
    notice.value = "Artigo excluído.";
    selected.value = null;
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <AdminPageHeader title="Blog" description="Crie, revise e publique artigos para motoristas.">
    <template #actions>
      <RouterLink class="admin-button secondary" :to="{ name: 'admin-blog-comments' }"><MessagesSquare :size="18" />Comentários</RouterLink>
      <RouterLink class="admin-button primary" :to="{ name: 'admin-blog-new' }"><Plus :size="18" />Novo artigo</RouterLink>
    </template>
  </AdminPageHeader>
  <div class="admin-filter-card">
    <div class="admin-search-input">
      <Search :size="18" />
      <input v-model="filters.search" type="search" placeholder="Buscar por título ou endereço" aria-label="Buscar artigos" @input="search" />
    </div>
    <div class="admin-filter-row">
      <label
        ><span>Status</span
        ><select v-model="filters.status">
          <option value="">Todos</option>
          <option value="draft">Rascunhos</option>
          <option value="published">Publicados</option>
          <option value="unpublished">Fora do ar</option>
        </select></label
      ><label
        ><span>Ordenar por</span
        ><select v-model="filters.sort">
          <option value="updated_at">Atualizado em</option>
          <option value="published_at">Publicado em</option>
          <option value="title">Título</option>
        </select></label
      ><label
        ><span>Direção</span
        ><select v-model="filters.direction">
          <option value="desc">Decrescente</option>
          <option value="asc">Crescente</option>
        </select></label
      >
    </div>
  </div>
  <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
  <p v-if="notice" class="form-alert success" role="status">{{ notice }}</p>
  <AdminState v-if="loading" message="Carregando artigos…" />
  <AdminState
    v-else-if="!posts.length"
    type="empty"
    :message="filters.search || filters.status ? 'Nenhum artigo encontrado com estes filtros.' : 'Nenhum artigo criado ainda.'"
    ><RouterLink class="admin-button primary" :to="{ name: 'admin-blog-new' }">Escrever primeiro artigo</RouterLink></AdminState
  >
  <section v-else class="admin-table-card">
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Artigo</th>
            <th>Categoria</th>
            <th>Curso</th>
            <th>Status</th>
            <th>Publicado em</th>
            <th>Atualizado em</th>
            <th><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td>
              <div class="blog-admin-title">
                <RouterLink :to="{ name: 'admin-blog-edit', params: { id: post.id } }">{{ post.title }}</RouterLink>
                <small>/blog/{{ post.slug }}</small>
                <RouterLink
                  v-if="post.pending_comments_count"
                  class="blog-admin-pending"
                  :to="{ name: 'admin-blog-comments', query: { artigo: post.id } }"
                  >{{ post.pending_comments_count }} comentário(s) pendente(s)</RouterLink
                >
              </div>
            </td>
            <td>{{ post.category || "—" }}</td>
            <td>{{ post.course?.name || "—" }}</td>
            <td><span class="status-pill" :class="post.status">{{ STATUS_LABELS[post.status] }}</span></td>
            <td>{{ formatDate(post.published_at) }}</td>
            <td>{{ formatDate(post.updated_at) }}</td>
            <td>
              <div class="row-actions blog-admin-actions">
                <RouterLink
                  class="icon-link"
                  :to="{ name: 'admin-blog-edit', params: { id: post.id }, query: { previa: '1' } }"
                  :aria-label="`Prévia de ${post.title}`"
                  title="Prévia"
                  ><Eye :size="18"
                /></RouterLink>
                <a
                  v-if="post.is_published"
                  class="icon-link"
                  :href="`/blog/${encodeURIComponent(post.slug)}`"
                  target="_blank"
                  rel="noopener"
                  :aria-label="`Ver ${post.title} no site (abre em nova aba)`"
                  title="Ver no site"
                  ><ExternalLink :size="18"
                /></a>
                <button
                  v-if="post.status === 'published'"
                  class="admin-button ghost"
                  type="button"
                  :disabled="busyId === post.id"
                  @click="setPublication(post, 'unpublished')"
                >
                  Retirar do ar
                </button>
                <button
                  v-else
                  class="admin-button secondary"
                  type="button"
                  :disabled="busyId === post.id"
                  @click="setPublication(post, 'published')"
                >
                  Publicar
                </button>
                <button class="row-delete" type="button" :aria-label="`Excluir ${post.title}`" @click="selected = post">Excluir</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="meta" class="admin-pagination">
      <span>{{ meta.from }}–{{ meta.to }} de {{ meta.total }} artigos</span>
      <div>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page <= 1" @click="load(meta.current_page - 1)">Anterior</button>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">Próxima</button>
      </div>
    </div>
  </section>
  <ConfirmModal
    :open="Boolean(selected)"
    title="Excluir este artigo?"
    description="O artigo e seus comentários serão removidos definitivamente. Para apenas ocultá-lo do site, use “Retirar do ar”."
    confirm-label="Excluir artigo"
    :busy="deleting"
    @cancel="selected = null"
    @confirm="destroyPost"
  />
</template>
