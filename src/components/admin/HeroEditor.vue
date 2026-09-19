<script setup>
import { computed, ref } from "vue";
import { Trash2 } from "lucide-vue-next";
import HeroSection from "../HeroSection.vue";
import ConfirmModal from "./ConfirmModal.vue";
import HeroMediaField from "./HeroMediaField.vue";

const props = defineProps({
  value: { type: Object, required: true },
  previewTitle: { type: String, default: "Especializa Condutor" },
  previewEyebrow: { type: String, default: "CURSOS PARA MOTORISTAS" },
  variant: { type: String, default: "hero" },
  courseName: { type: String, default: "" },
});
const emit = defineEmits(["update"]);
const confirmingRemoval = ref(false);
const enabled = computed(() => Boolean(props.value.hero_enabled));
const preview = computed(() => ({
  enabled: enabled.value,
  media: props.value.hero_media,
  mobile_media: props.value.hero_mobile_media,
  position: props.value.hero_image_position || "center",
  overlay_preset: props.value.hero_overlay_preset || "institutional",
  overlay_opacity: props.value.hero_overlay_opacity ?? 75,
}));

function update(patch) {
  emit("update", patch);
}
function selectDesktop(media) {
  update({
    hero_media_id: media?.id || null,
    hero_media: media,
    hero_enabled: Boolean(media),
  });
}
function selectMobile(media) {
  update({ hero_mobile_media_id: media?.id || null, hero_mobile_media: media });
}
function removeBanner() {
  update({
    hero_enabled: false,
    hero_media_id: null,
    hero_media: null,
    hero_mobile_media_id: null,
    hero_mobile_media: null,
  });
  confirmingRemoval.value = false;
}
</script>

<template>
  <div class="hero-editor">
    <div class="hero-editor-intro">
      <div>
        <h3>Imagem de fundo</h3>
        <p>Use uma imagem panorâmica. O degradê azul mantém o texto legível.</p>
      </div>
      <label class="hero-editor-toggle">
        <input
          type="checkbox"
          :checked="enabled"
          @change="update({ hero_enabled: $event.target.checked })"
        />
        Ativar banner
      </label>
    </div>
    <div class="hero-media-fields">
      <HeroMediaField
        :media="value.hero_media"
        label="Imagem desktop"
        description="Principal, preferencialmente panorâmica."
        :course-name="courseName"
        @select="selectDesktop"
      />
      <HeroMediaField
        :media="value.hero_mobile_media"
        label="Imagem mobile"
        description="Opcional. Sem ela, a imagem desktop também aparece no celular."
        :course-name="courseName"
        @select="selectMobile"
      />
    </div>
    <div class="hero-editor-controls">
      <label>Posição da imagem
        <select
          :value="value.hero_image_position || 'center'"
          @change="update({ hero_image_position: $event.target.value })"
        >
          <option value="center">Centro</option>
          <option value="top">Topo</option>
          <option value="bottom">Inferior</option>
          <option value="left">Esquerda</option>
          <option value="right">Direita</option>
        </select>
      </label>
      <label>Degradê
        <select
          :value="value.hero_overlay_preset || 'institutional'"
          @change="update({ hero_overlay_preset: $event.target.value })"
        >
          <option value="institutional">Azul institucional</option>
          <option value="dark">Azul escuro</option>
          <option value="soft">Azul suave</option>
        </select>
      </label>
      <label class="hero-opacity">
        <span>Intensidade do degradê: {{ value.hero_overlay_opacity ?? 75 }}%</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          :value="value.hero_overlay_opacity ?? 75"
          @input="update({ hero_overlay_opacity: Number($event.target.value) })"
        />
      </label>
    </div>
    <div class="hero-preview-grid">
      <div>
        <h4>Prévia desktop</h4>
        <HeroSection :class="['hero-editor-preview', variant]" :appearance="preview" :eager="false">
          <div class="hero-preview-copy">
            <p>{{ previewEyebrow }}</p>
            <strong>{{ previewTitle }}</strong>
          </div>
        </HeroSection>
      </div>
      <div>
        <h4>Prévia celular</h4>
        <HeroSection
          :class="['hero-editor-preview', 'mobile', variant]"
          :appearance="preview"
          :eager="false"
          force-mobile
        >
          <div class="hero-preview-copy">
            <p>{{ previewEyebrow }}</p>
            <strong>{{ previewTitle }}</strong>
          </div>
        </HeroSection>
      </div>
    </div>
    <button
      v-if="value.hero_media_id || value.hero_mobile_media_id"
      class="text-danger"
      type="button"
      @click="confirmingRemoval = true"
    >
      <Trash2 :size="16" />Remover banner desta página
    </button>
    <ConfirmModal
      :open="confirmingRemoval"
      title="Remover banner?"
      description="As imagens continuarão na biblioteca. Salve a página para aplicar a alteração."
      confirm-label="Remover banner"
      @cancel="confirmingRemoval = false"
      @confirm="removeBanner"
    />
  </div>
</template>
