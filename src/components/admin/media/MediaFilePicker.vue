<script setup>
import { ref, useId } from "vue";
import { UploadCloud } from "lucide-vue-next";
defineProps({
  disabled: Boolean,
  maxSize: { type: Number, default: 10485760 },
  multiple: { type: Boolean, default: true },
});
const emit = defineEmits(["files"]);
const input = ref(null);
const dragging = ref(false);
const id = useId();
function choose(files) {
  if (files?.length) emit("files", Array.from(files));
  if (input.value) input.value.value = "";
}
defineExpose({ open: () => input.value?.click() });
</script>

<template>
  <div
    class="media-dropzone"
    :class="{ dragging, disabled }"
    @dragover.prevent="dragging = !disabled"
    @dragleave.prevent="dragging = false"
    @drop.prevent="
      dragging = false;
      if (!disabled) choose($event.dataTransfer.files);
    "
  >
    <UploadCloud :size="30" aria-hidden="true" />
    <label :for="id"
      ><strong>Arraste suas imagens até aqui</strong
      ><span>ou escolha os arquivos no seu dispositivo</span></label
    >
    <input
      :id="id"
      ref="input"
      class="media-file-input"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
      :multiple="multiple"
      :disabled="disabled"
      @change="choose($event.target.files)"
    />
    <button
      class="admin-button secondary"
      type="button"
      :disabled="disabled"
      @click="input.click()"
    >
      Selecionar arquivos
    </button>
    <small
      >JPG, PNG, WebP e SVG · Até {{ Math.round(maxSize / 1048576) }} MB por
      imagem<br />JPG e PNG são convertidos para WebP. SVG deve ser estático e
      seguro.</small
    >
  </div>
</template>
