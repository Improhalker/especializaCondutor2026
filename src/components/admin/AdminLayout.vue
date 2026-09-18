<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Menu, Search } from 'lucide-vue-next'
import AdminSidebar from './AdminSidebar.vue'
import { getAdminProfile, logoutAdmin } from '../../services/adminApi'

const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref(false)
const collapsed = ref(false)
const checkingSession = ref(true)

onMounted(async () => {
  try { await getAdminProfile() } catch (_) { await router.replace({ name: 'admin-login' }) } finally { checkingSession.value = false }
})
watch(() => route.fullPath, () => { mobileMenuOpen.value = false })
async function signOut() { await logoutAdmin(); await router.replace({ name: 'admin-login' }) }
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <div v-if="mobileMenuOpen" class="admin-backdrop" @click="mobileMenuOpen = false"></div>
    <AdminSidebar :collapsed="collapsed" :mobile-open="mobileMenuOpen" @toggle="collapsed = !collapsed" @close="mobileMenuOpen = false" />
    <div class="admin-main"><header class="admin-topbar"><div class="admin-topbar-start"><button class="icon-button mobile-only" type="button" aria-label="Abrir menu" @click="mobileMenuOpen = true"><Menu :size="20" /></button><div class="admin-breadcrumb"><span>Administração</span><strong>{{ route.meta.title || 'Visão geral' }}</strong></div></div><div class="admin-topbar-actions"><label class="admin-search" aria-label="Busca global, disponível em breve"><Search :size="17" /><input disabled value="" placeholder="Buscar em breve" /></label><button class="admin-profile" type="button" @click="signOut"><span>GA</span><strong>Gabriel</strong><small>Sair</small></button></div></header><main class="admin-content"><div v-if="checkingSession" class="admin-page-state"><span class="admin-spinner"></span>Verificando acesso…</div><RouterView v-else /></main></div>
  </div>
</template>
