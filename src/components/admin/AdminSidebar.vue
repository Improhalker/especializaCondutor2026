<script setup>
import {
  Images,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings,
  X,
} from "lucide-vue-next";
import { RouterLink } from "vue-router";
defineProps({ collapsed: Boolean, mobileOpen: Boolean });
defineEmits(["toggle", "close"]);
const links = [
  { name: "admin-dashboard", label: "Visão geral", icon: LayoutDashboard },
  { name: "admin-courses", label: "Cursos", icon: GraduationCap },
  { name: "admin-testimonials", label: "Depoimentos", icon: MessageSquareQuote },
  { name: "admin-faqs", label: "FAQs", icon: HelpCircle },
  { name: "admin-media", label: "Mídia", icon: Images },
  { name: "admin-appearance", label: "Aparência das páginas", icon: PanelsTopLeft },
  { name: "admin-attendances", label: "Atendimentos", icon: BarChart3 },
  { name: "admin-settings", label: "Configurações", icon: Settings },
  { name: "admin-logs", label: "Logs", icon: History },
];
</script>

<template>
  <aside
    class="admin-sidebar"
    :class="{ collapsed, 'mobile-open': mobileOpen }"
  >
    <div class="admin-sidebar-brand">
      <RouterLink to="/admin" aria-label="Especializa Condutor — Administração"
        ><img
          src="/brand/especializa-condutor.png"
          alt="Especializa Condutor" /></RouterLink
      ><button
        class="icon-button mobile-close"
        type="button"
        aria-label="Fechar menu"
        @click="$emit('close')"
      >
        <X :size="20" />
      </button>
    </div>
    <p class="admin-section-label">GERENCIAR</p>
    <nav class="admin-nav" aria-label="Navegação administrativa">
      <RouterLink
        v-for="link in links"
        :key="link.name"
        :to="{ name: link.name }"
        :title="collapsed ? link.label : undefined"
        ><component :is="link.icon" :size="20" /><span>{{
          link.label
        }}</span></RouterLink
      >
    </nav>
    <div class="admin-sidebar-bottom">
      <div class="admin-help">
        <strong>Precisa de ajuda?</strong
        ><span>Use o WhatsApp para dúvidas operacionais.</span>
      </div>
      <button
        class="collapse-button"
        type="button"
        :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'"
        @click="$emit('toggle')"
      >
        <ChevronRight v-if="collapsed" :size="18" /><ChevronLeft
          v-else
          :size="18"
        /><span>Recolher</span>
      </button>
    </div>
  </aside>
</template>
