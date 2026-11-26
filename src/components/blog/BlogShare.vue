<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Check, Facebook, Link2, Linkedin, Share2, Twitter } from "lucide-vue-next";
import WhatsAppIcon from "../WhatsAppIcon.vue";

const props = defineProps({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  headingLevel: { type: String, default: "h2" },
});

const canNativeShare = ref(false);
const copied = ref(false);
const status = ref("");
let copiedTimer;

const url = computed(() => {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/blog/${encodeURIComponent(props.slug)}`;
});
const links = computed(() => {
  const u = encodeURIComponent(url.value);
  const t = encodeURIComponent(props.title);
  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${props.title} ${url.value}`)}`,
    },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: Facebook },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: Linkedin },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${t}&url=${u}`, icon: Twitter },
  ];
});

onMounted(() => {
  canNativeShare.value = typeof navigator !== "undefined" && typeof navigator.share === "function";
});
onBeforeUnmount(() => clearTimeout(copiedTimer));

// In-app browsers (Instagram, Facebook) often block the async clipboard API.
function legacyCopy(text) {
  const trigger = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
  document.body.appendChild(field);
  field.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  field.remove();
  trigger?.focus?.();
  return ok;
}
async function copyLink() {
  let ok = false;
  try {
    await navigator.clipboard.writeText(url.value);
    ok = true;
  } catch {
    ok = legacyCopy(url.value);
  }
  copied.value = ok;
  status.value = ok ? "Link copiado." : `Não foi possível copiar. Endereço: ${url.value}`;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = false;
    status.value = "";
  }, 3000);
}
async function nativeShare() {
  try {
    await navigator.share({ title: props.title, url: url.value });
  } catch {
    // Closing the share sheet is not an error worth reporting.
  }
}
</script>

<template>
  <div class="blog-share">
    <component :is="headingLevel" class="blog-share-title">Compartilhe este artigo</component>
    <ul class="blog-share-list">
      <li v-for="link in links" :key="link.id">
        <a
          class="blog-share-button"
          :class="`is-${link.id}`"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Compartilhar no ${link.label} (abre em nova aba)`"
          :title="`Compartilhar no ${link.label}`"
        >
          <WhatsAppIcon v-if="link.id === 'whatsapp'" :size="19" />
          <component :is="link.icon" v-else :size="18" aria-hidden="true" />
        </a>
      </li>
      <li>
        <button
          class="blog-share-button is-copy"
          type="button"
          :aria-label="copied ? 'Link copiado' : 'Copiar link do artigo'"
          :title="copied ? 'Link copiado' : 'Copiar link'"
          @click="copyLink"
        >
          <Check v-if="copied" :size="18" aria-hidden="true" />
          <Link2 v-else :size="18" aria-hidden="true" />
        </button>
      </li>
      <li v-if="canNativeShare">
        <button class="blog-share-button is-native" type="button" aria-label="Mais opções de compartilhamento" title="Mais opções" @click="nativeShare">
          <Share2 :size="18" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <p class="blog-share-status" role="status" aria-live="polite">{{ status }}</p>
  </div>
</template>
