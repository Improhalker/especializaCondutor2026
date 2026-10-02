<script setup>
import { computed } from "vue"
const props = defineProps({ series: { type: Array, default: () => [] } })
const maximum = computed(() => Math.max(2, ...props.series.map(day => Number(day.views))))
const points = key => props.series.map((day, index) => [45 + index / Math.max(1, props.series.length - 1) * 690, 195 - Number(day[key]) / maximum.value * 160].join(",")).join(" ")
const ticks = computed(() => [0, .5, 1].map(factor => ({ y: 195 - factor * 160, value: Math.round(maximum.value * factor) })))
const date = value => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"))
</script>
<template>
  <div class="traffic-legend"><span><i class="views"></i>Visualizações</span><span><i class="sessions"></i>Sessões</span></div>
  <svg class="traffic-chart" viewBox="0 0 760 230" role="img" aria-label="Evolução diária de visualizações e sessões no período selecionado">
    <g v-for="tick in ticks" :key="tick.y"><line x1="45" x2="735" :y1="tick.y" :y2="tick.y" stroke="#e4edf5" stroke-dasharray="4 4" /><text x="32" :y="tick.y + 4" text-anchor="end" fill="#62778a" font-size="12">{{ tick.value }}</text></g>
    <polyline :points="points('views')" fill="none" stroke="#136ab7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
    <polyline :points="points('sessions')" fill="none" stroke="#14a896" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    <g v-for="(day, index) in series" :key="day.date"><circle :cx="45 + index / Math.max(1, series.length - 1) * 690" :cy="195 - Number(day.views) / maximum * 160" r="3" fill="#136ab7"><title>{{ date(day.date) }}: {{ day.views }} visualizações · {{ day.sessions }} sessões</title></circle></g>
    <text v-if="series.length" x="45" y="222" fill="#62778a" font-size="12">{{ date(series[0].date) }}</text>
    <text v-if="series.length > 1" x="735" y="222" text-anchor="end" fill="#62778a" font-size="12">{{ date(series[series.length - 1].date) }}</text>
  </svg>
  <details class="chart-data"><summary>Consultar dados do gráfico</summary><div class="admin-table-wrap"><table><thead><tr><th>Dia</th><th>Visualizações</th><th>Sessões</th></tr></thead><tbody><tr v-for="day in series" :key="day.date"><td>{{ date(day.date) }}</td><td>{{ day.views }}</td><td>{{ day.sessions }}</td></tr></tbody></table></div></details>
</template>
