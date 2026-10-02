<script setup>
import { computed } from "vue"
import AdminState from "../AdminState.vue"
const props = defineProps({ items: { type: Array, default: () => [] }, emptyMessage: { type: String, default: "Ainda não há registros neste período." } })
const max = computed(() => Math.max(1, ...props.items.map(item => Number(item.total))))
</script>
<template><AdminState v-if="!items.length" type="empty" :message="emptyMessage" /><ol v-else class="analytics-ranking"><li v-for="(item, index) in items" :key="item.key || item.label + index"><div class="ranking-heading"><span>{{ item.label }}</span><strong>{{ Number(item.total).toLocaleString('pt-BR') }}</strong></div><small v-if="item.detail">{{ item.detail }}</small><div class="ranking-track" aria-hidden="true"><span :style="{ width: Math.max(2, Number(item.total) / max * 100) + '%' }"></span></div></li></ol></template>
