<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { ExternalLink } from "lucide-vue-next";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import HeroEditor from "../../components/admin/HeroEditor.vue";
import {
  getAdminPageAppearances,
  updateAdminPageAppearance,
} from "../../services/adminApi";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const notice = ref("");
const dirty = ref(false);
const pages = ref([]);
const selectedKey = ref("");
const form = reactive({
  hero_enabled: false,
  hero_media_id: null,
  hero_mobile_media_id: null,
  hero_media: null,
  hero_mobile_media: null,
  hero_image_position: "center",
  hero_overlay_preset: "institutional",
  hero_overlay_opacity: 75,
});
const selectedPage = computed(() =>
  pages.value.find((page) => page.page_key === selectedKey.value),
);
const previewTitle = computed(() =>
  selectedKey.value === "home"
    ? "Especialize sua rota. Conduza novas oportunidades."
    : selectedKey.value === "courses-index"
      ? "Cursos para quem vive a estrada."
      : selectedPage.value?.label || "Página",
);

function usePage(page) {
  selectedKey.value = page.page_key;
  Object.assign(form, {
    hero_enabled: page.hero_enabled,
    hero_media_id: page.hero_media_id,
    hero_mobile_media_id: page.hero_mobile_media_id,
    hero_media: page.hero_media,
    hero_mobile_media: page.hero_mobile_media,
    hero_image_position: page.hero_image_position || "center",
    hero_overlay_preset: page.hero_overlay_preset || "institutional",
    hero_overlay_opacity: page.hero_overlay_opacity ?? 75,
  });
  dirty.value = false;
  notice.value = "";
  error.value = "";
}
function selectPage(page) {
  if (
    page.page_key === selectedKey.value ||
    (dirty.value &&
      !window.confirm("Existem alterações não salvas. Deseja trocar de página?"))
  )
    return;
  usePage(page);
  router.replace({ query: { page: page.page_key } });
}
function updateHero(patch) {
  Object.assign(form, patch);
  dirty.value = true;
  notice.value = "";
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const response = await getAdminPageAppearances();
    pages.value = response.data;
    const wanted = pages.value.find((page) => page.page_key === route.query.page);
    if (wanted || pages.value[0]) usePage(wanted || pages.value[0]);
  } catch (failure) {
    error.value = failure.message;
  } finally {
    loading.value = false;
  }
}
async function save() {
  if (!selectedKey.value || saving.value) return;
  saving.value = true;
  error.value = "";
  notice.value = "";
  try {
    const payload = {
      hero_enabled: form.hero_enabled,
      hero_media_id: form.hero_media_id,
      hero_mobile_media_id: form.hero_mobile_media_id,
      hero_image_position: form.hero_image_position,
      hero_overlay_preset: form.hero_overlay_preset,
      hero_overlay_opacity: form.hero_overlay_opacity,
    };
    const response = await updateAdminPageAppearance(selectedKey.value, payload);
    pages.value = pages.value.map((page) =>
      page.page_key === selectedKey.value ? response.data : page,
    );
    usePage(response.data);
    notice.value = "Aparência salva. A página pública já pode usar o novo banner.";
  } catch (failure) {
    error.value = failure.errors?.hero_media_id?.[0] || failure.message;
  } finally {
    saving.value = false;
  }
}
onBeforeRouteLeave(() => {
  if (dirty.value && !saving.value)
    return window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?");
});
watch(
  () => route.query.page,
  (key) => {
    const page = pages.value.find((item) => item.page_key === key);
    if (!page || page.page_key === selectedKey.value) return;
    if (
      dirty.value &&
      !window.confirm("Existem alterações não salvas. Deseja trocar de página?")
    ) {
      router.replace({ query: { page: selectedKey.value } });
      return;
    }
    usePage(page);
  },
);
onMounted(load);
</script>

<template>
  <AdminPageHeader
    title="Aparência das páginas"
    description="Configure os banners das páginas que têm Hero Section."
  >
    <template #actions>
      <a
        v-if="selectedPage"
        class="admin-button secondary"
        :href="selectedPage.path"
        target="_blank"
        rel="noopener noreferrer"
      ><ExternalLink :size="16" />Ver página</a>
      <button
        class="admin-button primary"
        type="button"
        :disabled="!dirty || saving || !selectedPage"
        @click="save"
      >{{ saving ? "Salvando…" : "Salvar alterações" }}</button>
    </template>
  </AdminPageHeader>
  <AdminState v-if="loading" message="Carregando páginas…" />
  <AdminState v-else-if="error && !pages.length" type="error" :message="error">
    <button class="admin-button secondary" type="button" @click="load">
      Tentar novamente
    </button>
  </AdminState>
  <AdminState
    v-else-if="!pages.length"
    type="empty"
    message="Nenhuma página com Hero Section está registrada."
  />
  <template v-else>
    <nav class="appearance-page-list" aria-label="Páginas configuráveis">
      <button
        v-for="page in pages"
        :key="page.page_key"
        type="button"
        :class="{ selected: page.page_key === selectedKey }"
        :aria-pressed="page.page_key === selectedKey"
        @click="selectPage(page)"
      >
        <strong>{{ page.label }}</strong><small>{{ page.path }}</small>
      </button>
    </nav>
    <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
    <p v-if="notice" class="media-notice" role="status">{{ notice }}</p>
    <section v-if="selectedPage" class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>{{ selectedPage.label }}</h2>
          <p>Defina a imagem e a sobreposição da Hero Section.</p>
        </div>
      </div>
      <HeroEditor
        :value="form"
        :preview-title="previewTitle"
        :variant="selectedKey === 'courses-index' ? 'page-hero' : 'hero'"
        @update="updateHero"
      />
    </section>
  </template>
</template>
