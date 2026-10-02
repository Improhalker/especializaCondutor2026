<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Menu, Search } from 'lucide-vue-next'
import AdminSidebar from './AdminSidebar.vue'
import { getAdminProfile, logoutAdmin } from '../../services/adminApi'
import { adminSession } from '../../services/adminSession'

const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref(false)
const collapsed = ref(false)
const checkingSession = ref(true)
const sessionError = ref('')

async function checkSession() {
  checkingSession.value = true
  sessionError.value = ''
  try { await getAdminProfile() }
  catch (failure) {
    if (failure.status === 401) await router.replace({ name: 'admin-login', query: { expired: '1', redirect: route.fullPath } })
    else sessionError.value = failure.message || 'Não foi possível verificar sua sessão. Tente novamente.'
  } finally { checkingSession.value = false }
}
onMounted(checkSession)
watch(() => route.fullPath, () => { mobileMenuOpen.value = false })
watch(() => adminSession.token, (token) => {
  if (!token && route.meta.requiresAdmin) router.replace({ name: 'admin-login', query: { expired: '1', redirect: route.fullPath } })
})
async function signOut() { await logoutAdmin(); await router.replace({ name: 'admin-login' }) }
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <div v-if="mobileMenuOpen" class="admin-backdrop" @click="mobileMenuOpen = false"></div>
    <AdminSidebar :collapsed="collapsed" :mobile-open="mobileMenuOpen" @toggle="collapsed = !collapsed" @close="mobileMenuOpen = false" />
    <div class="admin-main"><header class="admin-topbar"><div class="admin-topbar-start"><button class="icon-button mobile-only" type="button" aria-label="Abrir menu" @click="mobileMenuOpen = true"><Menu :size="20" /></button><div class="admin-breadcrumb"><span>Administração</span><strong>{{ route.meta.title || 'Visão geral' }}</strong></div></div><div class="admin-topbar-actions"><label class="admin-search" aria-label="Busca global, disponível em breve"><Search :size="17" /><input disabled value="" placeholder="Buscar em breve" /></label><button class="admin-profile" type="button" @click="signOut"><span>GA</span><strong>Gabriel</strong><small>Sair</small></button></div></header><main class="admin-content"><div v-if="checkingSession" class="admin-page-state"><span class="admin-spinner"></span>Verificando acesso…</div><div v-else-if="sessionError" class="admin-page-state" role="alert"><p>{{ sessionError }}</p><button class="admin-button secondary" @click="checkSession">Tentar novamente</button></div><RouterView v-else-if="adminSession.token" /></main></div>
  </div>
</template>
