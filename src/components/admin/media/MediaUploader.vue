<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { CheckCircle2, RotateCcw } from "lucide-vue-next";
import MediaFilePicker from "./MediaFilePicker.vue";
import { uploadAdminMedia } from "../../../services/adminApi";
import { formatBytes } from "../../../services/mediaFormat";
const props = defineProps({
  courseName: String,
  maxSize: { type: Number, default: 10485760 },
  maxSvgSize: { type: Number, default: 524288 },
  multiple: { type: Boolean, default: true },
});
const emit = defineEmits(["uploaded", "busy"]);
const picker = ref(null);
const queue = ref([]);
const working = ref(false);
let disposed = false;
const hasItems = computed(() => queue.value.length > 0);
function add(files) {
  for (const file of props.multiple ? files : files.slice(0, 1)) {
    const extension = file.name.split(".").pop().toLowerCase();
    const error = !["jpg", "jpeg", "png", "webp", "svg"].includes(extension)
      ? "Formato não permitido. Use JPG, PNG, WebP ou SVG."
      : file.size > (extension === "svg" ? props.maxSvgSize : props.maxSize)
        ? "Este arquivo excede o limite de envio."
        : "";
    queue.value.push({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: error ? "error" : "queued",
      error,
      retryable: !error,
    });
  }
  run();
}
async function run() {
  if (working.value || disposed) return;
  working.value = true;
  emit("busy", true);
  try {
    while (!disposed) {
      const item = queue.value.find((item) => item.status === "queued");
      if (!item) break;
      item.status = "uploading";
      item.error = "";
      try {
        const response = await uploadAdminMedia(
          item.file,
          {
            course_name: props.courseName,
            upload_key: item.id,
          },
          (percent) => {
            item.progress = percent;
            if (percent === 100) item.status = "processing";
          },
        );
        item.status = "success";
        item.progress = 100;
        emit("uploaded", response.data);
      } catch (error) {
        item.status = "error";
        item.error = error.errors?.file?.[0] || error.message;
      }
    }
  } finally {
    working.value = false;
    emit("busy", false);
  }
}
function retry(item) {
  item.status = "queued";
  item.progress = 0;
  run();
}
defineExpose({ open: () => picker.value?.open() });
onBeforeUnmount(() => {
  disposed = true;
});
</script>

<template>
  <MediaFilePicker
    ref="picker"
    :max-size="maxSize"
    :multiple="multiple"
    @files="add"
  />
  <ul v-if="hasItems" class="media-upload-queue" aria-label="Envios de imagens">
    <li v-for="item in queue" :key="item.id">
      <div class="media-upload-name">
        <strong>{{ item.file.name }}</strong
        ><small>{{ formatBytes(item.file.size) }}</small>
      </div>
      <div aria-live="polite">
        <span v-if="item.status === 'queued'">Na fila</span>
        <span v-else-if="item.status === 'uploading'"
          >Enviando: {{ item.progress }}%</span
        >
        <span v-else-if="item.status === 'processing'"
          >Otimizando e salvando…</span
        >
        <span v-else-if="item.status === 'success'" class="media-success"
          ><CheckCircle2 :size="16" />Imagem enviada</span
        >
        <span v-else class="text-danger">{{ item.error }}</span>
      </div>
      <progress
        v-if="['uploading', 'processing'].includes(item.status)"
        :value="item.status === 'processing' ? undefined : item.progress"
        max="100"
        :aria-label="'Envio de ' + item.file.name"
      />
      <button
        v-if="item.status === 'error' && item.retryable"
        class="text-button"
        type="button"
        @click="retry(item)"
      >
        <RotateCcw :size="15" />Tentar novamente
      </button>
    </li>
  </ul>
</template>
