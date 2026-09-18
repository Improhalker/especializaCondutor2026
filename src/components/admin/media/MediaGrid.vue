<script setup>
import MediaCard from "./MediaCard.vue";
defineProps({
  items: { type: Array, default: () => [] },
  selectable: Boolean,
  selectedId: Number,
});
defineEmits(["preview", "copy", "delete", "select"]);
</script>

<template>
  <div class="media-grid">
    <MediaCard
      v-for="media in items"
      :key="media.id"
      :media="media"
      :selectable="selectable"
      :selected-id="selectedId"
      @preview="$emit('preview', $event)"
      @copy="$emit('copy', $event)"
      @delete="$emit('delete', $event)"
      @select="$emit('select', $event)"
    />
  </div>
</template>
