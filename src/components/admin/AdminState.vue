<script setup>
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-vue-next'
defineProps({ type: { type: String, default: 'loading' }, message: { type: String, default: '' } })
</script>
<template><div class="admin-state" :class="type"><LoaderCircle v-if="type === 'loading'" class="spin" :size="23" /><AlertCircle v-else-if="type === 'error'" :size="23" /><Inbox v-else :size="23" /><p>{{ message }}</p><slot /></div></template>
