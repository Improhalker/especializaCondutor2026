<script setup>
import { computed } from "vue";
import { Clock3, MonitorPlay, Video, BookOpen, ClipboardCheck, BadgeCheck, Headphones, KeyRound } from "lucide-vue-next";
import { courseCharacteristicRows } from "../services/courseCharacteristics";

const props = defineProps({ modality: { type: Object, required: true } });
const rows = computed(() => courseCharacteristicRows(props.modality));
const icons = { clock: Clock3, monitor: MonitorPlay, video: Video, book: BookOpen, assessment: ClipboardCheck, certificate: BadgeCheck, support: Headphones, access: KeyRound };
</script>

<template>
  <dl v-if="rows.length" class="course-characteristics" :aria-label="`Características de ${modality.name || 'esta modalidade'}`">
    <div v-for="row in rows" :key="row.key" class="course-characteristic" :class="{ 'course-characteristic-workload': row.key === 'workload' }">
      <component :is="icons[row.icon]" :size="21" aria-hidden="true" />
      <div>
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </div>
  </dl>
</template>

<style scoped>
.course-characteristics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 24px; padding: 0; margin: 24px 0; border-top: 1px solid #dbe7ef; border-bottom: 1px solid #dbe7ef; }
.course-characteristic { display: flex; align-items: flex-start; gap: 12px; padding: 18px 0; min-width: 0; border-bottom: 1px solid #e3ecf3; }
.course-characteristic > svg { flex: 0 0 auto; color: #136ab7; margin-top: 2px; }
.course-characteristic > div { min-width: 0; }
.course-characteristic dt { font-size: .76rem; line-height: 1.5; font-weight: 750; color: #446178; margin: 0 0 4px; }
.course-characteristic dd { margin: 0; color: #0e3459; font-size: .94rem; line-height: 1.55; overflow-wrap: anywhere; }
.course-characteristic-workload dd { font-size: 1.35rem; font-weight: 800; line-height: 1.2; }
.course-characteristic-workload > svg { color: #0e3459; }
@media (max-width: 560px) { .course-characteristics { grid-template-columns: 1fr; margin: 20px 0; } .course-characteristic { padding: 15px 0; } .course-characteristic:last-child { border-bottom: 0; } }
</style>
