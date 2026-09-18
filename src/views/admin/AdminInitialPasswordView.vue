<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'
import { changeInitialPassword } from '../../services/adminApi'

const router = useRouter()
const password = ref('')
const passwordConfirmation = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  if (password.value !== passwordConfirmation.value) { error.value = 'As senhas precisam ser iguais.'; return }
  error.value = ''
  submitting.value = true
  try { await changeInitialPassword({ password: password.value, password_confirmation: passwordConfirmation.value }); await router.replace({ name: 'admin-dashboard' }) } catch (requestError) { error.value = requestError.errors?.password?.[0] || requestError.message } finally { submitting.value = false }
}
</script>

<template><main class="admin-auth"><section class="admin-auth-intro"><img src="/brand/especializa-condutor.png" alt="Especializa Condutor" /><div><p class="admin-kicker">PRIMEIRO ACESSO</p><h1>Proteja seu acesso.</h1><p>Por segurança, escolha uma senha exclusiva antes de usar o painel.</p></div></section><section class="admin-auth-card-wrap"><form class="admin-auth-card" @submit.prevent="submit"><div class="admin-auth-icon"><ShieldCheck :size="23" /></div><p class="admin-kicker">NOVA SENHA</p><h2>Defina sua senha</h2><p class="form-intro">Use pelo menos 12 caracteres, com letras maiúsculas, números e símbolos.</p><p v-if="error" class="form-alert error" role="alert">{{ error }}</p><label>Nova senha<input v-model="password" type="password" autocomplete="new-password" required /></label><label>Confirmar nova senha<input v-model="passwordConfirmation" type="password" autocomplete="new-password" required /></label><button class="admin-button primary full" type="submit" :disabled="submitting">{{ submitting ? 'Salvando…' : 'Salvar nova senha' }}</button></form></section></main></template>
