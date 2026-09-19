<script setup>
import { ref, watch } from "vue";
import { Copy, Save, Check } from "lucide-vue-next";
import MediaDialog from "./MediaDialog.vue";
import MediaImage from "./MediaImage.vue";
import { updateAdminMedia, getMediaUsages } from "../../../services/adminApi";
import {
  formatBytes,
  formatDate,
  formatReduction,
} from "../../../services/mediaFormat";
const props = defineProps({ media: Object, selectable: Boolean });
const emit = defineEmits(["close", "updated", "select", "copy"]);
const alt = ref("");
const decorative = ref(false);
const busy = ref(false);
const error = ref("");
const usages = ref([]);
const usageTotal = ref(0);
watch(
  () => props.media,
  async (media) => {
    alt.value = media?.alt_text || "";
    decorative.value = Boolean(media?.is_decorative);
    error.value = "";
    usages.value = [];
    usageTotal.value = 0;
    if (!media) return;
    try {
      const result = await getMediaUsages(media.id);
      if (props.media?.id === media.id) {
        usages.value = result.data;
        usageTotal.value = result.total;
      }
    } catch (failure) {
      if (props.media?.id === media.id) error.value = failure.message;
    }
  },
  { immediate: true },
);
async function save() {
  busy.value = true;
  error.value = "";
  try {
    const response = await updateAdminMedia(props.media.id, {
      alt_text: alt.value,
      is_decorative: decorative.value,
    });
    emit("updated", response.data);
  } catch (failure) {
    error.value = failure.errors?.alt_text?.[0] || failure.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <MediaDialog
    :open="Boolean(media)"
    title="Detalhes da imagem"
    wide
    :busy="busy"
    @close="$emit('close')"
  >
    <div v-if="media" class="media-detail">
      <div class="media-detail-image">
        <MediaImage
          :src="media.url"
          :alt="media.alt_text || ''"
          :width="media.width"
          :height="media.height"
          eager
        />
      </div>
      <div class="media-detail-info">
        <h3>{{ media.original_name }}</h3>
        <dl>
          <div>
            <dt>Formato</dt>
            <dd>
              {{ media.original_extension.toUpperCase() }} →
              {{ media.extension.toUpperCase() }}
            </dd>
          </div>
          <div>
            <dt>Original</dt>
            <dd>{{ formatBytes(media.original_size) }}</dd>
          </div>
          <div>
            <dt>Otimizada</dt>
            <dd>{{ formatBytes(media.size) }}</dd>
          </div>
          <div>
            <dt>Economia</dt>
            <dd>{{ formatReduction(media.reduction_percent) }}</dd>
          </div>
          <div>
            <dt>Dimensões</dt>
            <dd>{{ media.width }} × {{ media.height }} px</dd>
          </div>
          <div>
            <dt>Enviada em</dt>
            <dd>{{ formatDate(media.created_at) }}</dd>
          </div>
        </dl>
        <form class="media-alt-form" @submit.prevent="save">
          <label
            >Texto alternativo<textarea
              v-model="alt"
              maxlength="500"
              rows="3"
              :required="!decorative"
              :disabled="decorative"
              placeholder="Descreva brevemente o conteúdo da imagem"
            ></textarea
            ><small
              >Usado por leitores de tela. A capa de cada curso pode ter uma
              descrição própria.</small
            ></label
          >
          <label class="media-checkbox"
            ><input
              v-model="decorative"
              type="checkbox"
              :disabled="usageTotal > 0"
            />Imagem apenas decorativa</label
          >
          <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
          <button
            class="admin-button primary"
            type="submit"
            :disabled="busy || media.status !== 'ready'"
          >
            <Save :size="16" />{{ busy ? "Salvando…" : "Salvar descrição" }}
          </button>
        </form>
        <div class="media-detail-actions">
          <button
            class="admin-button secondary"
            type="button"
            :disabled="!media.url"
            @click="$emit('copy', media)"
          >
            <Copy :size="16" />Copiar URL</button
          ><button
            v-if="selectable"
            class="admin-button primary"
            type="button"
            :disabled="media.status !== 'ready'"
            @click="$emit('select', media)"
          >
            <Check :size="16" />Usar imagem
          </button>
        </div>
        <section v-if="usageTotal" class="media-usages">
          <h4>Em uso em {{ usageTotal }} vínculo{{ usageTotal === 1 ? '' : 's' }}</h4>
          <ul>
            <li v-for="(usage, index) in usages" :key="`${usage.type}-${usage.id}-${usage.role}-${index}`">
              <RouterLink
                :to="usage.type === 'page'
                  ? { name: 'admin-appearance', query: { page: usage.page_key } }
                  : { name: 'admin-course-edit', params: { id: usage.id } }"
                @click="$emit('close')"
                >{{ usage.name }} · {{ usage.role }}</RouterLink
              >
            </li>
          </ul>
          <small v-if="usageTotal > usages.length"
            >Mostrando os primeiros {{ usages.length }} vínculos.</small
          >
        </section>
      </div>
    </div>
  </MediaDialog>
</template>
