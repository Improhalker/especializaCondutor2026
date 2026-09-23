<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue'
import AdminState from '../../components/admin/AdminState.vue'

const loading = ref(true)
const error = ref('')
const logs = ref([])

const sortedLogs = computed(() =>
  [...logs.value].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date)
    return dateDiff !== 0 ? dateDiff : b.id - a.id
  }),
)

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)
}

onMounted(async () => {
  try {
    const response = await fetch('/logs.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('Nao foi possivel carregar os logs.')
    logs.value = await response.json()
  } catch (requestError) {
    error.value = requestError.message || 'Nao foi possivel carregar os logs.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminPageHeader
    title="Logs"
    description="Historico de alteracoes registradas no projeto, do mais recente para o mais antigo."
  />
  <AdminState v-if="loading" message="Carregando registros…" />
  <AdminState v-else-if="error" type="error" :message="error" />
  <AdminState
    v-else-if="!sortedLogs.length"
    type="empty"
    message="Nenhum registro encontrado ainda."
  />
  <section v-else class="admin-card log-card">
    <div class="card-heading">
      <div>
        <h2>Registros</h2>
        <p>{{ sortedLogs.length }} entrada(s) no arquivo de logs.</p>
      </div>
    </div>
    <ul class="log-list">
      <li v-for="log in sortedLogs" :key="log.id">
        <time :datetime="log.date">{{ formatDate(log.date) }}</time>
        <p>{{ log.content }}</p>
      </li>
    </ul>
  </section>
</template>
