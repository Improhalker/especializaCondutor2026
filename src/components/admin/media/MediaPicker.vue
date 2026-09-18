<script setup>
import { computed, ref } from "vue";
import { Images, Upload, Trash2 } from "lucide-vue-next";
import MediaDialog from "./MediaDialog.vue";
import MediaLibrary from "./MediaLibrary.vue";
import MediaImage from "./MediaImage.vue";
const props = defineProps({
  modelValue: Object,
  legacyUrl: String,
  courseName: String,
  altText: String,
});
const emit = defineEmits([
  "update:modelValue",
  "update:legacyUrl",
  "update:altText",
  "change",
]);
const open = ref(false);
const uploadFirst = ref(false);
const busy = ref(false);
const url = computed(() => props.modelValue?.url || props.legacyUrl);
const suggestedAlt = computed(() => {
  if (props.modelValue?.alt_is_custom && props.modelValue.alt_text)
    return props.modelValue.alt_text;
  return props.courseName?.trim()
    ? "Curso " + props.courseName.trim() + " — Especializa Condutor"
    : props.modelValue?.alt_text || "Imagem do Especializa Condutor";
});
function show(upload = false) {
  uploadFirst.value = upload;
  open.value = true;
}
function select(media) {
  emit("update:modelValue", media);
  emit("update:legacyUrl", "");
  emit("update:altText", "");
  emit("change");
  open.value = false;
}
function remove() {
  emit("update:modelValue", null);
  emit("update:legacyUrl", "");
  emit("update:altText", "");
  emit("change");
}
</script>

<template>
  <div class="media-cover-picker">
    <div v-if="url" class="media-cover-preview">
      <MediaImage
        :src="url"
        :alt="altText || suggestedAlt"
        :width="modelValue?.width"
        :height="modelValue?.height"
      />
    </div>
    <div v-else class="media-cover-empty">
      <Images :size="32" /><span>Nenhuma capa selecionada</span>
    </div>
    <div class="media-cover-controls">
      <p>A imagem será reutilizada no catálogo e na página pública do curso.</p>
      <div class="media-detail-actions">
        <button class="admin-button secondary" type="button" @click="show()">
          <Images :size="17" />Selecionar da biblioteca</button
        ><button class="admin-button primary" type="button" @click="show(true)">
          <Upload :size="17" />Enviar nova imagem</button
        ><button v-if="url" class="text-danger" type="button" @click="remove">
          <Trash2 :size="16" />Remover capa
        </button>
      </div>
      <label v-if="url"
        >Texto alternativo da capa<input
          :value="altText || suggestedAlt"
          maxlength="500"
          required
          @input="
            $emit('update:altText', $event.target.value);
            $emit('change');
          "
        /><small
          >Descrição sugerida automaticamente. Você pode personalizá-la para
          este curso.</small
        ></label
      >
      <details v-if="!modelValue" class="media-legacy">
        <summary>Usar URL de capa existente</summary>
        <label
          >URL ou caminho da imagem<input
            :value="legacyUrl"
            maxlength="2048"
            placeholder="https://…"
            @input="
              $emit('update:legacyUrl', $event.target.value);
              $emit('change');
            " /></label
        ><small
          >Compatibilidade temporária com imagens antigas. Prefira a
          biblioteca.</small
        >
      </details>
    </div>
    <MediaDialog
      :open="open"
      title="Selecionar capa do curso"
      wide
      :busy="busy"
      @close="open = false"
    >
      <MediaLibrary
        v-if="open"
        selectable
        :selected-id="modelValue?.id"
        :course-name="courseName"
        :initial-upload="uploadFirst"
        @select="select"
        @busy="busy = $event"
      />
    </MediaDialog>
  </div>
</template>
