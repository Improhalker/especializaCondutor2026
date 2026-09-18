<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch, useId } from "vue";
import { X } from "lucide-vue-next";
const props = defineProps({
  open: Boolean,
  title: String,
  busy: Boolean,
  wide: Boolean,
});
const emit = defineEmits(["close"]);
const dialog = ref(null);
const titleId = useId();
const close = () => {
  if (!props.busy) emit("close");
};
async function sync() {
  await nextTick();
  if (props.open && !dialog.value?.open) dialog.value?.showModal();
  else if (!props.open && dialog.value?.open) dialog.value.close();
}
watch(() => props.open, sync);
onMounted(sync);
onBeforeUnmount(() => dialog.value?.close());
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="media-dialog"
      :class="{ wide }"
      :aria-labelledby="titleId"
      @cancel.prevent="close"
      @click="
        (event) => {
          if (event.target === dialog) close();
        }
      "
    >
      <header class="media-dialog-header">
        <h2 :id="titleId">{{ title }}</h2>
        <button
          class="icon-button"
          type="button"
          aria-label="Fechar janela"
          :disabled="busy"
          @click="close"
        >
          <X :size="22" />
        </button>
      </header>
      <div v-if="open" class="media-dialog-body"><slot /></div>
    </dialog>
  </Teleport>
</template>
