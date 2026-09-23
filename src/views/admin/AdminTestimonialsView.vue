<script setup>
import { onMounted, ref, watch } from "vue";
import { MoreHorizontal, Plus, Search, Star } from "lucide-vue-next";
import { RouterLink, useRouter } from "vue-router";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import ConfirmModal from "../../components/admin/ConfirmModal.vue";
import {
  deleteAdminTestimonial,
  getAdminTestimonials,
  updateAdminTestimonial,
  updateTestimonialPublication,
} from "../../services/adminApi";

const router = useRouter();
const testimonials = ref([]);
const meta = ref(null);
const loading = ref(true);
const error = ref("");
const deleting = ref(false);
const selected = ref(null);
const savingOrderId = ref(null);
const filters = ref({ search: "", status: "", sort: "sort_order", direction: "asc", page: 1, per_page: 15 });
let searchTimer;

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}
function excerpt(text) {
  return text.length > 90 ? text.slice(0, 90).trim() + "…" : text;
}
function load(page = filters.value.page) {
  filters.value.page = page;
  loading.value = true;
  error.value = "";
  return getAdminTestimonials(filters.value)
    .then((payload) => {
      testimonials.value = payload.data;
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
function searchTestimonials() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(1), 300);
}
async function togglePublication(testimonial) {
  try {
    await updateTestimonialPublication(testimonial.id, !testimonial.is_published);
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  }
}
async function updateOrder(testimonial, value) {
  const sortOrder = Number(value);
  if (Number.isNaN(sortOrder) || sortOrder === testimonial.sort_order) return;
  savingOrderId.value = testimonial.id;
  try {
    await updateAdminTestimonial(testimonial.id, {
      name: testimonial.name,
      content: testimonial.content,
      rating: testimonial.rating,
      avatar_media_id: testimonial.avatar_media_id,
      is_published: testimonial.is_published,
      sort_order: sortOrder,
    });
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    savingOrderId.value = null;
  }
}
async function destroyTestimonial() {
  if (!selected.value) return;
  deleting.value = true;
  try {
    await deleteAdminTestimonial(selected.value.id);
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
  <AdminPageHeader title="Depoimentos" description="Gerencie os depoimentos exibidos no carrossel da página inicial.">
    <template #actions>
      <RouterLink class="admin-button primary" :to="{ name: 'admin-testimonial-new' }"><Plus :size="18" />Novo depoimento</RouterLink>
    </template>
  </AdminPageHeader>
  <div class="admin-filter-card">
    <div class="admin-search-input">
      <Search :size="18" />
      <input v-model="filters.search" type="search" placeholder="Buscar por nome ou depoimento" @input="searchTestimonials" />
    </div>
    <div class="admin-filter-row">
      <label
        ><span>Status</span
        ><select v-model="filters.status">
          <option value="">Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunhos</option>
        </select></label
      ><label
        ><span>Ordenar por</span
        ><select v-model="filters.sort">
          <option value="sort_order">Ordem</option>
          <option value="name">Nome</option>
          <option value="rating">Estrelas</option>
          <option value="updated_at">Atualizado em</option>
        </select></label
      ><label
        ><span>Direção</span
        ><select v-model="filters.direction">
          <option value="asc">Crescente</option>
          <option value="desc">Decrescente</option>
        </select></label
      >
    </div>
  </div>
  <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
  <AdminState v-if="loading" message="Carregando depoimentos…" />
  <AdminState v-else-if="!testimonials.length" type="empty" message="Nenhum depoimento cadastrado ainda."
    ><RouterLink class="admin-button primary" :to="{ name: 'admin-testimonial-new' }">Cadastrar primeiro depoimento</RouterLink></AdminState
  >
  <section v-else class="admin-table-card">
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Depoimento</th>
            <th>Estrelas</th>
            <th>Texto</th>
            <th>Status</th>
            <th>Ordem</th>
            <th>Atualizado em</th>
            <th><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="testimonial in testimonials" :key="testimonial.id">
            <td>
              <div class="table-course">
                <span class="table-image round"
                  ><img v-if="testimonial.avatar?.url" :src="testimonial.avatar.url" alt="" /><span v-else>{{ testimonial.name.slice(0, 2).toUpperCase() }}</span></span
                >
                <div><RouterLink :to="{ name: 'admin-testimonial-edit', params: { id: testimonial.id } }">{{ testimonial.name }}</RouterLink></div>
              </div>
            </td>
            <td>
              <span class="testimonial-stars-inline"
                ><Star v-for="n in 5" :key="n" :size="14" :fill="n <= testimonial.rating ? '#e8a723' : 'transparent'" :color="n <= testimonial.rating ? '#e8a723' : '#cfdce6'"
              /></span>
            </td>
            <td class="testimonial-excerpt-cell">{{ excerpt(testimonial.content) }}</td>
            <td>
              <button class="status-button" :class="testimonial.is_published ? 'published' : 'draft'" type="button" @click="togglePublication(testimonial)">
                {{ testimonial.is_published ? "Publicado" : "Rascunho" }}
              </button>
            </td>
            <td>
              <input
                class="order-input"
                type="number"
                min="0"
                :value="testimonial.sort_order"
                :disabled="savingOrderId === testimonial.id"
                @change="updateOrder(testimonial, $event.target.value)"
              />
            </td>
            <td>{{ formatDate(testimonial.updated_at) }}</td>
            <td>
              <div class="row-actions">
                <button type="button" title="Editar depoimento" aria-label="Editar depoimento" @click="router.push({ name: 'admin-testimonial-edit', params: { id: testimonial.id } })">
                  <MoreHorizontal :size="19" />
                </button>
                <button class="row-delete" type="button" title="Excluir depoimento" aria-label="Excluir depoimento" @click="selected = testimonial">Excluir</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="meta" class="admin-pagination">
      <span>{{ meta.from }}–{{ meta.to }} de {{ meta.total }} depoimentos</span>
      <div>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page <= 1" @click="load(meta.current_page - 1)">Anterior</button>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">Próxima</button>
      </div>
    </div>
  </section>
  <ConfirmModal
    :open="Boolean(selected)"
    title="Excluir este depoimento?"
    description="O depoimento deixará de existir e será removido do carrossel público. Esta ação não pode ser desfeita."
    confirm-label="Excluir depoimento"
    :busy="deleting"
    @cancel="selected = null"
    @confirm="destroyTestimonial"
  />
</template>
