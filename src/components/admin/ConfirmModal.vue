<script setup>
import { AlertTriangle, X } from 'lucide-vue-next'
defineProps({ open: Boolean, title: String, description: String, confirmLabel: { type: String, default: 'Confirmar' }, busy: Boolean })
defineEmits(['cancel', 'confirm'])
</script>
<template><Teleport to="body"><div v-if="open" class="admin-modal-overlay" role="presentation" @click.self="$emit('cancel')"><section class="admin-modal" role="dialog" aria-modal="true" :aria-label="title"><div class="admin-modal-icon"><AlertTriangle :size="20" /></div><button class="icon-button modal-close" type="button" aria-label="Fechar" @click="$emit('cancel')"><X :size="19" /></button><h2>{{ title }}</h2><p>{{ description }}</p><div class="admin-modal-actions"><button class="admin-button ghost" type="button" :disabled="busy" @click="$emit('cancel')">Cancelar</button><button class="admin-button danger" type="button" :disabled="busy" @click="$emit('confirm')">{{ busy ? 'Excluindo…' : confirmLabel }}</button></div></section></div></Teleport></template>
