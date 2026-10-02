<script setup>
import { characteristicFields } from "../../services/courseCharacteristics";
import CourseCharacteristics from "../CourseCharacteristics.vue";

const props = defineProps({ modelValue: { type: Object, required: true }, modalityName: { type: String, required: true }, workload: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue"]);
function update(key, value) { emit("update:modelValue", { ...props.modelValue, [key]: value }); }
</script>

<template>
  <fieldset class="characteristics-editor">
    <legend>Características visíveis na página</legend>
    <p class="characteristics-hint">Preencha apenas informações confirmadas para {{ modalityName }} deste curso. Campos vazios não aparecem no site; não são completados com dados de outra modalidade.</p>
    <div class="form-grid two">
      <label v-for="field in characteristicFields" :key="field.key">
        {{ field.label }}
        <small>{{ field.hint }}</small>
        <input v-if="field.numeric" :value="modelValue[field.key]" type="number" min="1" max="100000" step="1" inputmode="numeric" placeholder="Não informado" @input="update(field.key, $event.target.value)" />
        <textarea v-else :value="modelValue[field.key]" rows="2" :maxlength="field.limit || 300" placeholder="Deixe vazio se não estiver confirmado" @input="update(field.key, $event.target.value)"></textarea>
      </label>
    </div>
    <details class="characteristics-preview">
      <summary>Prévia das características de {{ modalityName }}</summary>
      <CourseCharacteristics :modality="{ name: modalityName, workload, characteristics: { ...modelValue, video_lessons_count: modelValue.video_lessons_count === '' ? null : Number(modelValue.video_lessons_count) } }" />
    </details>
  </fieldset>
</template>

<style scoped>
.characteristics-editor { min-width: 0; border: 1px solid #d4e5f2; border-radius: 9px; padding: 16px; margin: 20px 0; background: #f5f9fc; }
.characteristics-editor legend { padding: 0 6px; font-size: .85rem; font-weight: 800; color: #0e3459; }
.characteristics-hint { margin: 0 0 16px; font-size: .78rem; line-height: 1.6; color: #496477; }
.characteristics-editor label { min-width: 0; }
.characteristics-editor small { font-weight: 400; line-height: 1.5; }
.characteristics-preview { margin-top: 16px; color: #0e3459; font-size: .82rem; }
.characteristics-preview summary { cursor: pointer; font-weight: 700; padding: 8px 0; }
.characteristics-preview summary:focus-visible { outline: 2px solid #136ab7; outline-offset: 3px; }
</style>
