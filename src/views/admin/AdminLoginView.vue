<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole } from 'lucide-vue-next'
import { loginAdmin } from '../../services/adminApi'

const router = useRouter()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    const { user } = await loginAdmin({ username: username.value, password: password.value })
    await router.replace({ name: user.must_change_password ? 'admin-initial-password' : 'admin-dashboard' })
  } catch (requestError) {
    error.value = requestError.message
  } finally { submitting.value = false }
}
</script>

<template>
  <main class="admin-auth"><section class="admin-auth-intro"><img src="/brand/especializa-condutor.png" alt="Especializa Condutor" /><div><p class="admin-kicker">ÁREA ADMINISTRATIVA</p><h1>Seu catálogo, sob controle.</h1><p>Gerencie cursos, acompanhe os cliques de atendimento e mantenha as informações do site sempre atualizadas.</p></div></section><section class="admin-auth-card-wrap"><form class="admin-auth-card" @submit.prevent="submit"><div class="admin-auth-icon"><LockKeyhole :size="23" /></div><p class="admin-kicker">ACESSO SEGURO</p><h2>Entrar no painel</h2><p class="form-intro">Use suas credenciais administrativas.</p><p v-if="error" class="form-alert error" role="alert">{{ error }}</p><label>Usuário<input v-model.trim="username" autocomplete="username" required maxlength="80" /></label><label>Senha<div class="password-field"><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required /><button type="button" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="18" /><Eye v-else :size="18" /></button></div></label><button class="admin-button primary full" type="submit" :disabled="submitting">{{ submitting ? 'Entrando…' : 'Entrar' }}</button></form></section>
  </main>
</template>
