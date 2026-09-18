<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Search, Upload, ChevronLeft, ChevronRight } from "lucide-vue-next";
import AdminState from "../AdminState.vue";
import MediaUploader from "./MediaUploader.vue";
import MediaGrid from "./MediaGrid.vue";
import MediaPreviewModal from "./MediaPreviewModal.vue";
import MediaDialog from "./MediaDialog.vue";
import {
  deleteAdminMedia,
  getAdminMedia,
  getMediaUsages,
} from "../../../services/adminApi";
const props = defineProps({
  selectable: Boolean,
  selectedId: Number,
  courseName: String,
  initialUpload: Boolean,
});
const emit = defineEmits(["select", "busy"]);
const uploader = ref(null);
const search = ref("");
const sort = ref("created_at:desc");
const page = ref(1);
const items = ref([]);
const meta = ref({});
const uploadConfig = ref({});
const loading = ref(true);
const error = ref("");
const notice = ref("");
const preview = ref(null);
const showUpload = ref(props.initialUpload);
const uploading = ref(false);
const deleting = ref(null);
const deleteBusy = ref(false);
const usageLoading = ref(false);
const deleteError = ref("");
const usages = ref([]);
const usageTotal = ref(0);
let generation = 0;
let timer;
async function load() {
  const current = ++generation;
  loading.value = true;
  error.value = "";
  try {
    const [column, direction] = sort.value.split(":");
    const result = await getAdminMedia({
      search: search.value,
      sort: column,
      direction,
      page: page.value,
      per_page: 12,
    });
    if (generation !== current) return;
    items.value = result.data;
    meta.value = result.meta;
    uploadConfig.value = result.upload;
  } catch (failure) {
    if (generation === current) error.value = failure.message;
  } finally {
    if (generation === current) loading.value = false;
  }
}
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(sort, () => {
  page.value = 1;
  load();
});
function changePage(next) {
  page.value = next;
  load();
}
async function openUpload() {
  showUpload.value = true;
}
function uploaded(media) {
  notice.value =
    "Imagem enviada e otimizada. Ela já está disponível na biblioteca.";
  page.value = 1;
  search.value = "";
  load();
}
function uploadBusy(value) {
  uploading.value = value;
  emit("busy", value);
}
function select(media) {
  if (uploading.value) {
    notice.value = "Aguarde os envios terminarem para selecionar a capa.";
    return;
  }
  emit("select", media);
}
async function copy(media) {
  try {
    await navigator.clipboard.writeText(media.url);
    notice.value = "URL copiada.";
  } catch {
    notice.value = `Não foi possível copiar automaticamente. Copie esta URL: ${media.url}`;
  }
}
function updated(media) {
  preview.value = media;
  items.value = items.value.map((item) =>
    item.id === media.id ? media : item,
  );
  notice.value = "Descrição da imagem atualizada.";
}
async function confirmDelete(media) {
  deleting.value = media;
  deleteError.value = "";
  usages.value = [];
  usageTotal.value = 0;
  usageLoading.value = true;
  try {
    const result = await getMediaUsages(media.id);
    if (deleting.value?.id !== media.id) return;
    usages.value = result.data;
    usageTotal.value = result.total;
  } catch (failure) {
    deleteError.value = failure.message;
  } finally {
    usageLoading.value = false;
  }
}
async function remove() {
  if (
    !deleting.value ||
    usageLoading.value ||
    usageTotal.value ||
    deleteError.value
  )
    return;
  deleteBusy.value = true;
  try {
    await deleteAdminMedia(deleting.value.id);
    deleting.value = null;
    notice.value = "Imagem excluída.";
    if (items.value.length === 1 && page.value > 1) page.value--;
    await load();
  } catch (failure) {
    deleteError.value = failure.message;
    usages.value = failure.usages || [];
    usageTotal.value = failure.usage_count || 0;
    await load();
  } finally {
    deleteBusy.value = false;
  }
}
defineExpose({ openUpload });
onMounted(load);
onBeforeUnmount(() => {
  clearTimeout(timer);
  generation++;
});
</script>

<template>
  <section class="media-library">
    <div
      v-if="uploadConfig.storage_configured === false"
      class="form-alert error"
      role="status"
    >
      O armazenamento ainda precisa ser configurado no servidor. A biblioteca
      ficará pronta para enviar imagens após essa configuração.
    </div>
    <div
      v-if="uploadConfig.processing_available === false"
      class="form-alert error"
      role="status"
    >
      O processamento de imagens precisa ser habilitado no PHP do servidor.
    </div>
    <div v-if="showUpload" class="media-upload-panel">
      <div class="media-section-heading">
        <h3>Enviar imagens</h3>
        <button
          class="text-button"
          type="button"
          :disabled="uploading"
          @click="showUpload = false"
        >
          Recolher
        </button>
      </div>
      <MediaUploader
        ref="uploader"
        :course-name="courseName"
        :max-size="uploadConfig.max_size_bytes"
        :max-svg-size="uploadConfig.max_svg_bytes"
        @uploaded="uploaded"
        @busy="uploadBusy"
      />
    </div>
    <div class="media-toolbar">
      <label class="media-search"
        ><Search :size="19" aria-hidden="true" /><span class="media-sr-only"
          >Buscar imagens por nome do arquivo</span
        ><input
          v-model="search"
          type="search"
          placeholder="Buscar por nome do arquivo"
      /></label>
      <label class="media-sort"
        ><span>Ordenar por</span
        ><select v-model="sort">
          <option value="created_at:desc">Mais recentes</option>
          <option value="created_at:asc">Mais antigas</option>
          <option value="original_name:asc">Nome A–Z</option>
          <option value="size:desc">Maior tamanho</option>
          <option value="size:asc">Menor tamanho</option>
        </select></label
      >
      <button
        v-if="selectable && !showUpload"
        class="admin-button secondary"
        type="button"
        @click="openUpload"
      >
        <Upload :size="16" />Enviar nova imagem
      </button>
    </div>
    <p v-if="notice" class="media-notice" role="status">{{ notice }}</p>
    <AdminState v-if="loading" message="Carregando imagens…" />
    <AdminState v-else-if="error" type="error" :message="error"
      ><button class="admin-button secondary" type="button" @click="load">
        Tentar novamente
      </button></AdminState
    >
    <AdminState
      v-else-if="!items.length"
      type="empty"
      :message="
        search
          ? 'Nenhuma imagem encontrada para esta busca.'
          : 'Sua biblioteca de mídia começa aqui.'
      "
    >
      <p v-if="!search">
        As imagens enviadas poderão ser reutilizadas nas capas dos cursos e,
        futuramente, em páginas institucionais, blog e campanhas.
      </p>
      <button
        v-if="!search"
        class="admin-button primary"
        type="button"
        @click="openUpload"
      >
        <Upload :size="17" />Enviar imagens
      </button>
    </AdminState>
    <MediaGrid
      v-else
      :items="items"
      :selectable="selectable"
      :selected-id="selectedId"
      @preview="preview = $event"
      @copy="copy"
      @delete="confirmDelete"
      @select="select"
    />
    <nav
      v-if="meta.total > 0"
      class="media-pagination"
      aria-label="Paginação de imagens"
    >
      <span>{{ meta.from }}–{{ meta.to }} de {{ meta.total }} imagens</span>
      <div>
        <button
          class="admin-button ghost"
          type="button"
          :disabled="loading || page <= 1"
          aria-label="Página anterior"
          @click="changePage(page - 1)"
        >
          <ChevronLeft :size="18" /></button
        ><span>Página {{ page }} de {{ meta.last_page }}</span
        ><button
          class="admin-button ghost"
          type="button"
          :disabled="loading || page >= meta.last_page"
          aria-label="Próxima página"
          @click="changePage(page + 1)"
        >
          <ChevronRight :size="18" />
        </button>
      </div>
    </nav>
    <MediaPreviewModal
      :media="preview"
      :selectable="selectable"
      @close="preview = null"
      @updated="updated"
      @select="select"
      @copy="copy"
    />
    <MediaDialog
      :open="Boolean(deleting)"
      :title="usageTotal ? 'Imagem em uso' : 'Excluir imagem?'"
      :busy="deleteBusy"
      @close="deleting = null"
    >
      <AdminState
        v-if="usageLoading"
        message="Verificando onde a imagem está em uso…"
      />
      <template v-else>
        <p v-if="usageTotal">
          Esta imagem está vinculada a {{ usageTotal }} curso(s). Troque ou
          remova as capas antes de excluí-la.
        </p>
        <p v-else>
          Excluir “{{ deleting?.original_name }}” da biblioteca e do
          armazenamento? Esta ação não pode ser desfeita.
        </p>
        <ul v-if="usages.length" class="media-usages">
          <li v-for="course in usages" :key="course.id">
            <RouterLink
              :to="{ name: 'admin-course-edit', params: { id: course.id } }"
              @click="deleting = null"
              >{{ course.name }}</RouterLink
            >
          </li>
        </ul>
        <p v-if="deleteError" class="form-alert error" role="alert">
          {{ deleteError }}
        </p>
      </template>
      <div class="admin-modal-actions">
        <button
          class="admin-button ghost"
          type="button"
          :disabled="deleteBusy"
          @click="deleting = null"
        >
          {{ usageTotal ? "Entendi" : "Cancelar" }}</button
        ><button
          v-if="!usageTotal"
          class="admin-button danger"
          type="button"
          :disabled="deleteBusy || usageLoading || Boolean(deleteError)"
          @click="remove"
        >
          {{ deleteBusy ? "Excluindo…" : "Excluir imagem" }}
        </button>
      </div>
    </MediaDialog>
  </section>
</template>
