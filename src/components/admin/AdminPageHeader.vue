<script setup>defineProps({ title: { type: String, required: true }, description: { type: String, default: '' } })</script>
<template><div class="admin-page-header"><div><h1>{{ title }}</h1><p v-if="description">{{ description }}</p></div><div class="admin-page-actions"><slot name="actions" /></div></div></template>
