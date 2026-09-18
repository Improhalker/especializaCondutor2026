<script setup>
defineEmits(["retry"]);
</script>
<template>
  <div class="public-error" role="alert">
    <h2>Não foi possível carregar as informações.</h2>
    <p>Confira sua conexão e tente novamente.</p>
    <button class="button" type="button" @click="$emit('retry')">
      Tentar novamente
    </button>
  </div>
</template>
