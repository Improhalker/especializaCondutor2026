<script setup>
import { Copy, Eye, MoreHorizontal, Trash2, Check } from "lucide-vue-next";
import MediaImage from "./MediaImage.vue";
import {
  formatBytes,
  formatDate,
  formatReduction,
} from "../../../services/mediaFormat";
defineProps({
  media: { type: Object, required: true },
  selectable: Boolean,
  selectedId: Number,
});
defineEmits(["preview", "copy", "delete", "select"]);
</script>

<template>
  <article class="media-card" :class="{ selected: selectedId === media.id }">
    <button
      class="media-card-preview"
      type="button"
      :aria-label="'Ampliar ' + media.original_name"
      @click="$emit('preview', media)"
    >
      <MediaImage
        :src="media.url"
        :alt="media.alt_text || ''"
        :width="media.width"
        :height="media.height"
      />
      <span class="media-format">{{ media.extension.toUpperCase() }}</span>
    </button>
    <div class="media-card-info">
      <div class="media-card-title">
        <h3 :title="media.original_name">{{ media.original_name }}</h3>
        <details class="media-actions">
          <summary :aria-label="'Ações de ' + media.original_name">
            <MoreHorizontal :size="20" />
          </summary>
          <div class="media-actions-menu">
            <button type="button" @click="$emit('preview', media)">
              <Eye :size="16" />Ver detalhes
            </button>
            <button
              type="button"
              :disabled="!media.url"
              @click="$emit('copy', media)"
            >
              <Copy :size="16" />Copiar URL
            </button>
            <button
              type="button"
              class="text-danger"
              @click="$emit('delete', media)"
            >
              <Trash2 :size="16" />{{
                media.status === "deleting" ? "Repetir exclusão" : "Excluir"
              }}
            </button>
          </div>
        </details>
      </div>
      <p>
        <strong>{{ formatBytes(media.size) }}</strong
        ><span>Original: {{ formatBytes(media.original_size) }}</span>
      </p>
      <small class="media-savings">{{
        formatReduction(media.reduction_percent)
      }}</small>
      <div class="media-card-meta">
        <time :datetime="media.created_at">{{
          formatDate(media.created_at)
        }}</time
        ><span v-if="media.usage_count"
          >Em {{ media.usage_count }} curso(s)</span
        ><span v-else>Disponível</span>
      </div>
      <p v-if="media.status !== 'ready'" class="text-danger">
        {{
          media.status === "deleting"
            ? "Exclusão pendente. Tente novamente."
            : media.status === "failed"
              ? "Envio incompleto. Exclua e envie novamente."
              : "Envio em processamento."
        }}
      </p>
      <button
        v-if="selectable"
        class="admin-button secondary media-select"
        type="button"
        :disabled="media.status !== 'ready'"
        @click="$emit('select', media)"
      >
        <Check :size="16" />{{
          selectedId === media.id ? "Selecionada" : "Usar como capa"
        }}
      </button>
    </div>
  </article>
</template>
