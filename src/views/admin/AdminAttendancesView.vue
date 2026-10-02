<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue"
import { BarChart3, Eye, MousePointerClick, Users, RefreshCw } from "lucide-vue-next"
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue"
import AdminState from "../../components/admin/AdminState.vue"
import TrafficChart from "../../components/admin/analytics/TrafficChart.vue"
import MetricRanking from "../../components/admin/analytics/MetricRanking.vue"
import { getAdminCourses, getAttendances, getSiteAnalytics } from "../../services/adminApi"
import { normalizeAttendance } from "../../services/analyticsPayload"

const report = ref(null)
const history = ref(null)
const courses = ref([])
const loading = ref(true)
const historyLoading = ref(false)
const error = ref("")
const historyError = ref("")
const activeDays = ref(30)
const filters = ref({ start_date: "", end_date: "", path: "", device: "", utm_source: "" })
const historyFilters = ref({ course_id: "", origin: "", modality_id: "", page: 1, per_page: 15 })
let requestId = 0
let historyRequestId = 0
let applied = {}
let alive = true
const number = value => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })
const seconds = value => Number(value) >= 60 ? number(Number(value) / 60) + " min" : number(value) + " s"
const pageLabel = path => ({ "/": "Página inicial", "/cursos": "Catálogo de cursos", "/quem-somos": "Quem somos", "/politica-de-privacidade": "Política de privacidade", "/termos-de-uso": "Termos de uso" })[path] || path
const deviceLabel = value => ({ desktop: "Computador", mobile: "Celular", tablet: "Tablet" })[value] || value
const kindLabel = value => ({ whatsapp: "WhatsApp", navigation: "Navegação", button: "Botão", faq: "Pergunta frequente", filter: "Filtro" })[value] || value
const dateTime = value => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "—"
const dateString = date => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Sao_Paulo" }).format(date)
const buttons = computed(() => (report.value?.buttons || []).map(row => ({ label: row.label, total: row.total, detail: kindLabel(row.kind) + " · " + pageLabel(row.path) })))
const deviceColors = ["#136ab7", "#14a896", "#f3bb55"]
const deviceGradient = computed(() => {
  const total = report.value?.summary.views || 0
  if (!total) return "#eaf0f6"
  let end = 0
  return "conic-gradient(" + (report.value.devices || []).map((row, index) => { const start = end; end += Number(row.total) / total * 100; return deviceColors[index % 3] + " " + start + "% " + end + "%" }).join(",") + ")"
})
const metrics = computed(() => {
  const perf = report.value?.performance || {}
  return [
    { label: "Carregamento principal · LCP", value: perf.lcp_ms == null ? "—" : seconds(Number(perf.lcp_ms) / 1000), samples: perf.lcp_samples, grade: perf.lcp_ms == null ? "" : Number(perf.lcp_ms) <= 2500 ? "good" : Number(perf.lcp_ms) <= 4000 ? "warning" : "poor" },
    { label: "Interação mais lenta", value: perf.inp_ms == null ? "—" : number(perf.inp_ms) + " ms", samples: perf.inp_samples, grade: perf.inp_ms == null ? "" : Number(perf.inp_ms) <= 200 ? "good" : Number(perf.inp_ms) <= 500 ? "warning" : "poor" },
    { label: "Estabilidade visual · CLS", value: perf.cls == null ? "—" : Number(perf.cls).toLocaleString("pt-BR", { maximumFractionDigits: 3 }), samples: perf.cls_samples, grade: perf.cls == null ? "" : Number(perf.cls) <= .1 ? "good" : Number(perf.cls) <= .25 ? "warning" : "poor" },
  ]
})

async function load() {
  if (!filters.value.start_date || !filters.value.end_date || filters.value.start_date > filters.value.end_date) { error.value = "Informe um período válido."; return }
  const id = ++requestId
  loading.value = true; error.value = ""
  applied = { ...filters.value }
  try { const payload = await getSiteAnalytics(applied); if (alive && id === requestId) report.value = payload }
  catch (failure) { if (alive && id === requestId) error.value = failure.message }
  finally { if (alive && id === requestId) loading.value = false }
}
async function loadHistory(page = 1) {
  const id = ++historyRequestId
  historyFilters.value.page = page
  historyLoading.value = true; historyError.value = ""
  try {
    const payload = await getAttendances({ start_date: applied.start_date, end_date: applied.end_date, utm_source: applied.utm_source, ...historyFilters.value })
    if (alive && id === historyRequestId) history.value = normalizeAttendance(payload)
  } catch (failure) { if (alive && id === historyRequestId) historyError.value = failure.message }
  finally { if (alive && id === historyRequestId) historyLoading.value = false }
}
function setPeriod(days) {
  activeDays.value = days
  const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - days + 1)
  filters.value.start_date = dateString(start); filters.value.end_date = dateString(end)
  return refresh()
}
async function refresh() { await load(); if (!error.value) await loadHistory() }
onMounted(async () => {
  await setPeriod(30)
  try { const payload = await getAdminCourses({ per_page: 50, sort: "name", direction: "asc" }); if (alive) courses.value = payload.data || [] } catch {}
})
onBeforeUnmount(() => { alive = false; requestId++; historyRequestId++ })
</script>

<template>
  <AdminPageHeader title="Atendimentos e análise" description="Entenda o caminho do visitante: da primeira página ao contato no WhatsApp.">
    <template #actions><button class="admin-button ghost" :disabled="loading" @click="refresh"><RefreshCw :size="16" />Atualizar dados</button></template>
  </AdminPageHeader>
  <form class="admin-filter-card compact" @submit.prevent="activeDays = 0; refresh()">
    <div class="analytics-periods"><button v-for="days in [7, 30, 90]" :key="days" type="button" :aria-pressed="activeDays === days" :disabled="loading" @click="setPeriod(days)">Últimos {{ days }} dias</button></div>
    <div class="admin-filter-row">
      <label><span>De</span><input v-model="filters.start_date" type="date" required @input="activeDays = 0" /></label>
      <label><span>Até</span><input v-model="filters.end_date" type="date" required @input="activeDays = 0" /></label>
      <label><span>Página</span><select v-model="filters.path"><option value="">Todas as páginas</option><option v-for="path in report?.meta.paths || []" :key="path" :value="path">{{ pageLabel(path) }}</option></select></label>
      <label><span>Dispositivo</span><select v-model="filters.device"><option value="">Todos</option><option value="mobile">Celular</option><option value="desktop">Computador</option><option value="tablet">Tablet</option></select></label>
      <label><span>Origem da campanha</span><input v-model.trim="filters.utm_source" maxlength="80" placeholder="Ex.: instagram" /></label>
      <button class="admin-button primary" :disabled="loading" type="submit">Aplicar filtros</button>
    </div>
  </form>
  <AdminState v-if="loading" message="Preparando análise do período…" />
  <AdminState v-else-if="error" type="error" :message="error"><button class="admin-button secondary" @click="load">Tentar novamente</button></AdminState>
  <div v-else-if="report" class="analytics-overview">
    <div class="analytics-notice">
      <strong>Análise própria, independente do Google Analytics.</strong>
      {{ report.summary.views ? "Os indicadores abaixo correspondem ao período e aos filtros aplicados." : "A coleta está pronta. As primeiras visitas reais preencherão estes gráficos após a publicação." }}
      Sessões são identificadores temporários de navegação, não pessoas únicas.
      <br />Fuso: São Paulo. Acessos com administrador conectado, robôs identificados e preferência de não rastreamento são ignorados.
      <span v-if="report.meta.excluded_ips?.length"> IPs ignorados: {{ report.meta.excluded_ips.join(", ") }}.</span>
      <span v-if="report.meta.enabled === false"> A coleta está desativada no servidor.</span>
    </div>

    <section class="analytics-kpis" aria-label="Resumo do período">
      <article class="analytics-kpi"><span><Eye :size="17" />Visualizações de páginas</span><strong>{{ number(report.summary.views) }}</strong><small>{{ report.summary.views_change == null ? "Sem base no período anterior" : (report.summary.views_change > 0 ? "+" : "") + number(report.summary.views_change) + "% em relação ao período anterior" }}</small></article>
      <article class="analytics-kpi"><span><Users :size="17" />Sessões de navegação</span><strong>{{ number(report.summary.sessions) }}</strong><small>{{ number(report.previous.sessions) }} no período anterior</small></article>
      <article class="analytics-kpi"><span><MousePointerClick :size="17" />Contatos pelo WhatsApp</span><strong>{{ number(report.summary.whatsapp_clicks) }}</strong><small>{{ number(report.summary.contact_rate) }}% das sessões clicaram para conversar; não são vendas confirmadas</small></article>
      <article class="analytics-kpi"><span><BarChart3 :size="17" />Interações registradas</span><strong>{{ number(report.summary.interactions) }}</strong><small>Botões, navegação, filtros e perguntas abertas</small></article>
    </section>

    <section class="admin-card"><h2>Evolução do tráfego</h2><p>Visualizações e sessões por dia. Uma sessão pode acessar várias páginas.</p><TrafficChart :series="report.timeline" /></section>

    <section class="admin-table-card">
      <div class="table-card-title"><div><h2>Páginas mais acessadas</h2><p>Até 15 páginas com mais visitas. Tempo e rolagem ajudam a entender o interesse.</p></div></div>
      <AdminState v-if="!report.pages.length" type="empty" message="As páginas mais visitadas aparecerão aqui." />
      <div v-else class="admin-table-wrap"><table><thead><tr><th>Página</th><th>Visualizações</th><th>Sessões</th><th>Tempo ativo médio</th><th>Rolagem média</th></tr></thead><tbody><tr v-for="row in report.pages" :key="row.path"><td><strong>{{ pageLabel(row.path) }}</strong><small>{{ row.path }}</small></td><td>{{ number(row.views) }}</td><td>{{ number(row.sessions) }}</td><td>{{ seconds(row.active_seconds) }}</td><td>{{ number(row.scroll_depth) }}%</td></tr></tbody></table></div>
    </section>

    <div class="analytics-two-column">
      <section class="admin-card"><h2>Botões e ações mais usados</h2><p>Veja o que foi acionado e em qual página, incluindo a localização dos CTAs.</p><MetricRanking :items="buttons" /></section>
      <section class="admin-card"><h2>Até onde o visitante chegou</h2><p>Percentual das visitas que alcançaram cada faixa do percurso de rolagem.</p><ol class="scroll-funnel"><li v-for="row in report.scroll" :key="row.depth"><div><span>{{ row.depth }}% da rolagem</span><strong>{{ number(row.percentage) }}% <small>· {{ number(row.total) }} visitas</small></strong></div><div class="ranking-track" aria-hidden="true"><span :style="{ width: row.percentage + '%' }"></span></div></li></ol><div class="analytics-engagement"><div><strong>{{ seconds(report.summary.active_seconds) }}</strong><span>tempo ativo médio por visita</span></div><div><strong>{{ number(report.summary.deep_read_rate) }}%</strong><span>visitas com rolagem de pelo menos 75%</span></div></div><p class="analytics-table-note">O tempo considera a aba visível e atividade nos últimos 60 segundos. Rolagem indica alcance, não comprova leitura. Páginas sem área rolável não recebem 100% automaticamente.</p></section>
    </div>

    <div class="analytics-two-column">
      <section class="admin-card"><h2>De onde vêm as visitas</h2><p>UTM source quando informada; caso contrário, domínio de referência ou acesso direto.</p><MetricRanking :items="report.sources" /></section>
      <section class="admin-card"><h2>Dispositivos</h2><p>Distribuição das visualizações por tipo de dispositivo.</p><div class="analytics-device-layout"><div class="analytics-device-ring" :style="{ background: deviceGradient }" aria-hidden="true"><div><strong>{{ number(report.summary.views) }}</strong><small>visualizações</small></div></div><ul class="analytics-device-list"><li v-for="(row, index) in report.devices" :key="row.label"><span><i :style="{ background: deviceColors[index % 3] }"></i>{{ deviceLabel(row.label) }}</span><strong>{{ number(report.summary.views ? Number(row.total) / report.summary.views * 100 : 0) }}%</strong></li><li v-if="!report.devices.length">Sem visitas no período.</li></ul></div></section>
    </div>

    <section class="admin-card"><h2>Campanhas identificadas</h2><p>Ranking de campanhas com parâmetro utm_campaign. Sem esse parâmetro, a visita não entra neste ranking.</p><MetricRanking :items="report.campaigns" empty-message="Ainda não há visitas identificadas por campanha." /></section>
    <section class="admin-card"><h2>Como o site se comporta no navegador</h2><p>Médias das amostras disponíveis no período, sem confundir carregamento com volume de acessos.</p><div class="analytics-performance"><div v-for="metric in metrics" :key="metric.label"><span>{{ metric.label }}</span><strong :class="'metric-' + metric.grade">{{ metric.value }}</strong><small>{{ number(metric.samples) }} amostras</small></div></div><p class="analytics-table-note">LCP mede o conteúdo principal na entrada inicial. A interação mais lenta é uma aproximação baseada nos eventos disponíveis, não o INP oficial. CLS indica deslocamentos inesperados. Valores médios não são percentis nem uma certificação de Core Web Vitals; suporte varia por navegador.</p></section>
  </div>

  <details class="analytics-history" open>
    <summary>Histórico de cliques de atendimento</summary>
    <p>Registros de WhatsApp já existentes, separados da nova análise. Filtros de página e dispositivo acima não se aplicam a este histórico; período e UTM source se aplicam. Cliques antigos sem identificação de IP não podem ser excluídos retroativamente por IP.</p>
    <form class="admin-filter-card compact" @submit.prevent="loadHistory(1)"><div class="admin-filter-row"><label><span>Curso</span><select v-model="historyFilters.course_id"><option value="">Todos os cursos</option><option v-for="course in courses" :key="course.id" :value="course.id">{{ course.name }}</option></select></label><label><span>Origem (parte da URL)</span><input v-model.trim="historyFilters.origin" maxlength="255" placeholder="Ex.: /cursos/mopp" /></label><button class="admin-button secondary" :disabled="historyLoading" type="submit">Filtrar histórico</button></div></form>
    <AdminState v-if="historyLoading" message="Carregando histórico…" />
    <AdminState v-else-if="historyError" type="error" :message="historyError"><button class="admin-button secondary" @click="loadHistory()">Tentar novamente</button></AdminState>
    <template v-else-if="history">
      <div class="analytics-notice"><strong>{{ number(history.summary.total_clicks) }} cliques históricos no período.</strong> {{ number(history.summary.previous_period_clicks) }} no período anterior. {{ history.summary.change_percentage == null ? "Sem base para calcular variação." : "Variação: " + number(history.summary.change_percentage) + "%." }}</div>
      <div class="analytics-two-column" style="margin-top:18px"><section class="admin-card"><h2>Interesse por curso</h2><MetricRanking :items="history.summary.by_course.map(row => ({ label: row.course, total: row.total }))" /></section><section class="admin-card"><h2>Interesse por modalidade</h2><MetricRanking :items="history.summary.by_modality.map(row => ({ label: row.modality, total: row.total }))" /></section></div>
      <section class="admin-table-card"><div class="table-card-title"><div><h2>Registros de WhatsApp</h2><p>Paginação no servidor; nenhuma lista completa é carregada no navegador.</p></div></div><AdminState v-if="!history.clicks.data.length" type="empty" message="Os registros surgem quando visitantes clicam nos CTAs de WhatsApp." /><div v-else class="admin-table-wrap"><table><thead><tr><th>Curso</th><th>Modalidade</th><th>Página de origem</th><th>Campanha</th><th>Data e hora</th></tr></thead><tbody><tr v-for="click in history.clicks.data" :key="click.id"><td>{{ click.course || "Não identificado" }}</td><td>{{ click.modality || "—" }}</td><td>{{ click.source_url || "—" }}</td><td>{{ Object.entries(click.utm || {}).map(([key, value]) => key + ": " + value).join(" · ") || "—" }}</td><td>{{ dateTime(click.created_at) }}</td></tr></tbody></table></div><div v-if="history.clicks.meta.last_page > 1" class="admin-pagination"><span>{{ history.clicks.meta.from }}–{{ history.clicks.meta.to }} de {{ history.clicks.meta.total }}</span><div><button class="admin-button ghost" :disabled="history.clicks.meta.current_page <= 1" @click="loadHistory(history.clicks.meta.current_page - 1)">Anterior</button><button class="admin-button ghost" :disabled="history.clicks.meta.current_page >= history.clicks.meta.last_page" @click="loadHistory(history.clicks.meta.current_page + 1)">Próxima</button></div></div></section>
    </template>
  </details>
</template>
