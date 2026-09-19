<script setup>
import { ref } from "vue";
import { Images, Trash2, Upload } from "lucide-vue-next";
import MediaDialog from "./media/MediaDialog.vue";
import MediaLibrary from "./media/MediaLibrary.vue";

defineProps({
  media: { type: Object, default: null },
  label: { type: String, required: true },
  description: { type: String, default: "" },
  courseName: { type: String, default: "" },
});
const emit = defineEmits(["select"]);
const open = ref(false);
const uploadFirst = ref(false);
const busy = ref(false);

function show(upload = false) {
  uploadFirst.value = upload;
  open.value = true;
}
function select(media) {
  emit("select", media);
  open.value = false;
}
</script>

<template>
  <div class="hero-media-field">
    <h4>{{ label }}</h4>
    <p>{{ description }}</p>
    <div class="hero-media-thumb">
      <img v-if="media?.url" :src="media.url" alt="" loading="lazy" />
      <span v-else>Nenhuma imagem selecionada</span>
    </div>
    <div class="hero-media-actions">
      <button class="admin-button secondary" type="button" @click="show()">
        <Images :size="16" />Selecionar imagem
      </button>
      <button class="admin-button secondary" type="button" @click="show(true)">
        <Upload :size="16" />Enviar nova
      </button>
      <button
        v-if="media"
        class="text-danger"
        type="button"
        :aria-label="`Remover ${label.toLowerCase()}`"
        @click="select(null)"
      >
        <Trash2 :size="16" />Remover
      </button>
    </div>
    <MediaDialog
      :open="open"
      :title="`Selecionar ${label.toLowerCase()}`"
      wide
      :busy="busy"
      @close="open = false"
    >
      <MediaLibrary
        v-if="open"
        selectable
        :selected-id="media?.id"
        :course-name="courseName"
        :initial-upload="uploadFirst"
        @select="select"
        @busy="busy = $event"
      />
    </MediaDialog>
  </div>
</template>
