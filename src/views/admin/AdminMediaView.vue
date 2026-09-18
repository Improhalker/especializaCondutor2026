<script setup>
import { ref } from "vue";
import { Upload } from "lucide-vue-next";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import MediaLibrary from "../../components/admin/media/MediaLibrary.vue";
const library = ref(null);
</script>

<template>
  <AdminPageHeader
    title="Mídia"
    description="Organize suas imagens e reutilize-as nas capas dos cursos."
  >
    <template #actions
      ><button
        class="admin-button primary"
        type="button"
        @click="library?.openUpload()"
      >
        <Upload :size="18" />Enviar imagens
      </button></template
    >
  </AdminPageHeader>
  <MediaLibrary ref="library" initial-upload />
</template>
