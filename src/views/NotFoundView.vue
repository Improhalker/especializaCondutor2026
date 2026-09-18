<script setup>
import { onMounted } from "vue";
import { setPageSeo } from "../services/seo";
onMounted(() => setPageSeo("not-found"));
</script>

<template>
  <section class="not-found container" aria-labelledby="not-found-title">
    <p class="eyebrow">PÁGINA NÃO ENCONTRADA</p>
    <span class="not-found-code" aria-hidden="true">404</span>
    <h1 id="not-found-title">Este caminho não está disponível.</h1>
    <p>
      A página pode ter sido removida ou o endereço está incorreto. Você pode
      voltar ao início ou encontrar um curso no catálogo.
    </p>
    <div class="hero-actions">
      <RouterLink class="button" to="/">Voltar ao início</RouterLink>
      <RouterLink class="button button-secondary" to="/cursos"
        >Ver todos os cursos</RouterLink
      >
    </div>
  </section>
</template>
