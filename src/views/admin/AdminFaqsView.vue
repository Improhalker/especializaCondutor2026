<script setup>
import { onMounted, ref, watch } from "vue";
import { ChevronDown, ChevronUp, MoreHorizontal, Plus, Search } from "lucide-vue-next";
import { RouterLink, useRouter } from "vue-router";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import ConfirmModal from "../../components/admin/ConfirmModal.vue";
import {
  deleteAdminFaq,
  getAdminCourses,
  getAdminFaq,
  getAdminFaqs,
  updateAdminFaq,
  updateFaqPublication,
} from "../../services/adminApi";

const router = useRouter();
const faqs = ref([]);
const courses = ref([]);
const meta = ref(null);
const loading = ref(true);
const error = ref("");
const deleting = ref(false);
const selected = ref(null);
const expandedId = ref(null);
const expandedCourses = ref([]);
const expandedLoading = ref(false);
const savingOrderId = ref(null);
const filters = ref({ search: "", status: "", application_mode: "", course_id: "", sort: "sort_order", direction: "asc", page: 1, per_page: 15 });
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
  return getAdminFaqs(filters.value)
    .then((payload) => {
      faqs.value = payload.data;
      meta.value = payload.meta;
    })
    .catch((requestError) => {
      error.value = requestError.message;
    })
    .finally(() => {
      loading.value = false;
    });
}
onMounted(async () => {
  try {
    const coursePayload = await getAdminCourses({ per_page: 50, sort: "name", direction: "asc" });
    courses.value = coursePayload.data;
    await load();
  } catch (requestError) {
    error.value = requestError.message;
    loading.value = false;
  }
});
watch(() => [filters.value.status, filters.value.application_mode, filters.value.course_id, filters.value.sort, filters.value.direction], () => load(1));
function searchFaqs() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(1), 300);
}
async function togglePublication(faq) {
  try {
    await updateFaqPublication(faq.id, !faq.is_published);
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  }
}
async function updateOrder(faq, value) {
  const sortOrder = Number(value);
  if (Number.isNaN(sortOrder) || sortOrder === faq.sort_order) return;
  savingOrderId.value = faq.id;
  try {
    const current = await getAdminFaq(faq.id);
    await updateAdminFaq(faq.id, {
      question: current.data.question,
      answer: current.data.answer,
      application_mode: current.data.application_mode,
      course_ids: current.data.course_ids,
      is_published: current.data.is_published,
      sort_order: sortOrder,
    });
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    savingOrderId.value = null;
  }
}
async function destroyFaq() {
  if (!selected.value) return;
  deleting.value = true;
  try {
    await deleteAdminFaq(selected.value.id);
    selected.value = null;
    await load();
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    deleting.value = false;
  }
}
async function toggleExpanded(faq) {
  if (expandedId.value === faq.id) {
    expandedId.value = null;
    return;
  }
  expandedId.value = faq.id;
  expandedCourses.value = [];
  expandedLoading.value = true;
  try {
    const payload = await getAdminFaq(faq.id);
    expandedCourses.value = payload.data.courses || [];
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    expandedLoading.value = false;
  }
}
</script>

<template>
  <AdminPageHeader title="FAQs" description="Biblioteca de perguntas frequentes reutilizáveis entre cursos.">
    <template #actions>
      <RouterLink class="admin-button primary" :to="{ name: 'admin-faq-new' }"><Plus :size="18" />Nova FAQ</RouterLink>
    </template>
  </AdminPageHeader>
  <div class="admin-filter-card">
    <div class="admin-search-input">
      <Search :size="18" />
      <input v-model="filters.search" type="search" placeholder="Buscar por pergunta ou resposta" @input="searchFaqs" />
    </div>
    <div class="admin-filter-row">
      <label
        ><span>Status</span
        ><select v-model="filters.status">
          <option value="">Todos</option>
          <option value="published">Publicadas</option>
          <option value="draft">Rascunhos</option>
        </select></label
      ><label
        ><span>Aplicação</span
        ><select v-model="filters.application_mode">
          <option value="">Todas</option>
          <option value="all_courses">Todos os cursos</option>
          <option value="selected_courses">Cursos selecionados</option>
        </select></label
      ><label
        ><span>Curso</span
        ><select v-model="filters.course_id">
          <option value="">Todos</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.name }}</option>
        </select></label
      >
    </div>
  </div>
  <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
  <AdminState v-if="loading" message="Carregando FAQs…" />
  <AdminState v-else-if="!faqs.length" type="empty" message="Nenhuma FAQ reutilizável cadastrada ainda."
    ><RouterLink class="admin-button primary" :to="{ name: 'admin-faq-new' }">Cadastrar primeira FAQ</RouterLink></AdminState
  >
  <section v-else class="admin-table-card">
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pergunta</th>
            <th>Aplicação</th>
            <th>Status</th>
            <th>Ordem</th>
            <th>Atualizado em</th>
            <th><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="faq in faqs" :key="faq.id">
            <tr>
              <td>
                <div class="table-course">
                  <div>
                    <RouterLink :to="{ name: 'admin-faq-edit', params: { id: faq.id } }">{{ faq.question }}</RouterLink>
                    <small>{{ excerpt(faq.answer) }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="tag">{{ faq.application_mode === "all_courses" ? "Todos os cursos" : "Cursos selecionados" }}</span>
                <button v-if="faq.application_mode === 'selected_courses'" class="text-button faq-toggle-courses" type="button" @click="toggleExpanded(faq)">
                  {{ faq.courses_count }} curso{{ faq.courses_count === 1 ? "" : "s" }}
                  <ChevronUp v-if="expandedId === faq.id" :size="14" /><ChevronDown v-else :size="14" />
                </button>
              </td>
              <td>
                <button class="status-button" :class="faq.is_published ? 'published' : 'draft'" type="button" @click="togglePublication(faq)">
                  {{ faq.is_published ? "Publicada" : "Rascunho" }}
                </button>
              </td>
              <td>
                <input
                  class="order-input"
                  type="number"
                  min="0"
                  :value="faq.sort_order"
                  :disabled="savingOrderId === faq.id"
                  @change="updateOrder(faq, $event.target.value)"
                />
              </td>
              <td>{{ formatDate(faq.updated_at) }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" title="Editar FAQ" aria-label="Editar FAQ" @click="router.push({ name: 'admin-faq-edit', params: { id: faq.id } })">
                    <MoreHorizontal :size="19" />
                  </button>
                  <button class="row-delete" type="button" title="Excluir FAQ" aria-label="Excluir FAQ" @click="selected = faq">Excluir</button>
                </div>
              </td>
            </tr>
            <tr v-if="expandedId === faq.id" class="faq-courses-row">
              <td colspan="6">
                <span v-if="expandedLoading" class="muted-text">Carregando cursos associados…</span>
                <template v-else>
                  <span v-if="!expandedCourses.length" class="muted-text">Nenhum curso associado.</span>
                  <span v-for="course in expandedCourses" :key="course.id" class="tag">{{ course.name }}</span>
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-if="meta" class="admin-pagination">
      <span>{{ meta.from }}–{{ meta.to }} de {{ meta.total }} FAQs</span>
      <div>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page <= 1" @click="load(meta.current_page - 1)">Anterior</button>
        <button class="admin-button ghost" type="button" :disabled="meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">Próxima</button>
      </div>
    </div>
  </section>
  <ConfirmModal
    :open="Boolean(selected)"
    title="Excluir esta FAQ?"
    :description="
      selected?.courses_count
        ? `Esta pergunta está associada a ${selected.courses_count} curso${selected.courses_count === 1 ? '' : 's'}. Os relacionamentos serão removidos, mas os cursos não serão afetados. Esta ação não pode ser desfeita.`
        : 'Esta FAQ deixará de existir. Esta ação não pode ser desfeita.'
    "
    confirm-label="Excluir FAQ"
    :busy="deleting"
    @cancel="selected = null"
    @confirm="destroyFaq"
  />
</template>
