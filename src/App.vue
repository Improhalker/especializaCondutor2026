<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import RegulatoryTrust from "./components/RegulatoryTrust.vue";
import WhatsAppIcon from "./components/WhatsAppIcon.vue";
import { whatsappUrl, trackWhatsAppClick } from "./services/api";
const route = useRoute();
const menuOpen = ref(false);
const menuButton = ref(null);
const isHome = computed(() => route.name === "home");
const isAdmin = computed(
  () => route.path === "/admin" || route.path.startsWith("/admin/"),
);
function closeMenu() {
  menuOpen.value = false;
  menuButton.value?.focus();
}
function openWhatsApp() {
  trackWhatsAppClick({});
  window.location.assign(
    whatsappUrl(
      "Olá! Gostaria de saber mais sobre os cursos da Especializa Condutor.",
    ),
  );
}
watch(
  () => route.fullPath,
  async () => {
    menuOpen.value = false;
    await nextTick();
    const scroll = document.getElementById("public-scroll");
    if (route.hash)
      document.getElementById(route.hash.slice(1))?.scrollIntoView();
    else scroll?.scrollTo({ top: 0, behavior: "instant" });
  },
);
</script>

<template>
  <RouterView v-if="isAdmin" />
  <div v-else class="public-site">
    <a class="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
    <div id="public-scroll" class="public-scroll">
      <header class="site-header">
        <div class="container header-inner">
          <RouterLink
            class="brand"
            to="/"
            aria-label="Especializa Condutor - Início"
          >
            <img
              src="/brand/especializa-condutor.png"
              alt="Especializa Condutor"
              width="961"
              height="259"
            />
          </RouterLink>
          <button
            ref="menuButton"
            class="menu-button"
            type="button"
            :aria-expanded="menuOpen"
            aria-controls="public-navigation"
            :aria-label="menuOpen ? 'Fechar menu' : 'Abrir menu'"
            @click="menuOpen = !menuOpen"
            @keydown.esc="closeMenu"
          >
            <span></span><span></span><span></span>
          </button>
          <nav
            id="public-navigation"
            class="main-nav"
            :class="{ open: menuOpen }"
            aria-label="Principal"
            @keydown.esc="closeMenu"
          >
            <RouterLink to="/">Início</RouterLink
            ><RouterLink to="/cursos">Cursos</RouterLink>
            <a v-if="isHome" href="#como-funciona" @click="menuOpen = false"
              >Como funciona</a
            >
            <RouterLink v-else to="/#como-funciona">Como funciona</RouterLink>
            <button
              class="button button-small"
              type="button"
              @click="openWhatsApp"
            >
              <WhatsAppIcon /> Falar no WhatsApp
            </button>
          </nav>
        </div>
      </header>
      <main id="conteudo-principal" tabindex="-1"><RouterView /></main>
      <footer class="site-footer">
        <RegulatoryTrust />
        <div class="container footer-grid">
          <div>
            <img
              class="footer-logo"
              src="/brand/especializa-condutor.png"
              alt="Especializa Condutor"
              width="961"
              height="259"
              loading="lazy"
            />
            <p>
              Cursos especializados ofertados em parceria com a IBAC Brasil,
              com atendimento próximo em cada etapa.
            </p>
          </div>
          <div>
            <p class="footer-title">Navegue</p>
            <RouterLink to="/">Início</RouterLink
            ><RouterLink to="/cursos">Cursos</RouterLink>
          </div>
          <div>
            <p class="footer-title">Atendimento</p>
            <button class="footer-link" type="button" @click="openWhatsApp">
              <WhatsAppIcon /> WhatsApp: (19) 99906-5094
            </button>
            <p class="muted">
              Consulte condições e requisitos com nossa equipe.
            </p>
          </div>
        </div>
        <div class="container footer-bottom">
          © {{ new Date().getFullYear() }} Especializa Condutor. Todos os
          direitos reservados.
        </div>
      </footer>
    </div>
    <button
      class="whatsapp-float"
      type="button"
      aria-label="Tire suas dúvidas pelo WhatsApp"
      @click="openWhatsApp"
    >
      <WhatsAppIcon :size="56" />
    </button>
  </div>
</template>
