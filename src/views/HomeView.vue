<script setup>
import { onMounted, onBeforeUnmount, nextTick, ref } from "vue";
import { getHome, whatsappUrl } from "../services/api";
import CourseCard from "../components/CourseCard.vue";
import LoadingState from "../components/LoadingState.vue";
import PublicErrorState from "../components/PublicErrorState.vue";
import { setPageSeo } from "../services/seo";
import { useRoute } from "vue-router";
const route = useRoute();
const data = ref(null);
const error = ref("");
let active = true;
onBeforeUnmount(() => {
  active = false;
});
async function load() {
  error.value = "";
  try {
    const result = await getHome();
    if (!active) return;
    data.value = result;
    setPageSeo("home");
    await nextTick();
    if (active && route.hash)
      document.getElementById(route.hash.slice(1))?.scrollIntoView();
  } catch (e) {
    if (!active) return;
    error.value = e.message;
    setPageSeo("error");
  }
}
onMounted(load);
function talkAbout(course = "") {
  const suffix = course
    ? ` o curso ${course}`
    : " os cursos da Especializa Condutor";
  window.location.assign(
    whatsappUrl(`Olá! Gostaria de saber mais sobre${suffix}.`),
  );
}
</script>
<template>
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow light">CURSOS PARA MOTORISTAS</p>
        <h1>
          Especialize sua rota.<br /><strong
            >Conduza novas oportunidades.</strong
          >
        </h1>
        <p class="hero-description">
          Encontre a capacitação ideal para sua atuação profissional. Estude
          online e conte com atendimento direto para tirar suas dúvidas.
        </p>
        <div class="hero-actions">
          <RouterLink class="button button-white" to="/cursos"
            >Ver cursos</RouterLink
          ><button
            class="button button-outline"
            type="button"
            @click="talkAbout()"
          >
            Falar com um consultor
          </button>
        </div>
        <div class="hero-pills">
          <span>100% online</span><span>Atendimento pelo WhatsApp</span>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="visual-ring"></div>
        <div class="visual-road"></div>
        <div class="visual-truck">▰</div>
        <p>SEU PRÓXIMO<br />DESTINO É AQUI</p>
      </div>
    </div>
  </section>
  <LoadingState v-if="!data && !error" />
  <div v-else-if="error" class="container">
    <PublicErrorState @retry="load" />
  </div>
  <template v-else-if="data">
    <section class="trust-strip">
      <div class="container trust-items">
        <span>Aprenda no seu ritmo</span><span>•</span
        ><span>Formação e atualização</span><span>•</span
        ><span>Suporte humano</span>
      </div>
    </section>
    <section class="section container">
      <div class="section-heading split">
        <div>
          <p class="eyebrow">CURSOS EM DESTAQUE</p>
          <h2>Escolha a especialização<br />que acompanha a sua jornada.</h2>
        </div>
        <RouterLink class="text-link all-courses" to="/cursos"
          >Ver todos <span>→</span></RouterLink
        >
      </div>
      <div class="course-grid">
        <CourseCard
          v-for="course in data.featured_courses"
          :key="course.id"
          :course="course"
        />
      </div>
    </section>
    <section class="benefits">
      <div class="container benefits-grid">
        <div>
          <p class="eyebrow">SIMPLIFICAMOS O CAMINHO</p>
          <h2>Capacitação sem complicação.</h2>
          <p>
            Você encontra a modalidade certa, recebe orientação no WhatsApp e
            segue com segurança em cada etapa.
          </p>
        </div>
        <div class="benefit-list">
          <div>
            <b>01</b
            ><span
              ><strong>Escolha o curso</strong>Encontre a especialização que
              atende sua necessidade.</span
            >
          </div>
          <div>
            <b>02</b
            ><span
              ><strong>Fale com a equipe</strong>Receba condições e orientações
              pelo WhatsApp.</span
            >
          </div>
          <div>
            <b>03</b
            ><span
              ><strong>Comece sua jornada</strong>Conclua a matrícula e receba
              seu acesso.</span
            >
          </div>
        </div>
      </div>
    </section>
    <section id="como-funciona" class="section container process">
      <div class="section-heading">
        <p class="eyebrow">COMO FUNCIONA</p>
        <h2>Da escolha do curso ao seu próximo passo.</h2>
      </div>
      <div class="process-grid">
        <article>
          <span>1</span>
          <h3>Escolha sua especialização</h3>
          <p>Veja requisitos e compare Formação e Atualização.</p>
        </article>
        <article>
          <span>2</span>
          <h3>Chame no WhatsApp</h3>
          <p>Nossa equipe orienta sobre condições e matrícula.</p>
        </article>
        <article>
          <span>3</span>
          <h3>Receba seu acesso</h3>
          <p>Após a confirmação, você recebe tudo pelo WhatsApp.</p>
        </article>
      </div>
    </section>
    <section class="cta-band">
      <div class="container cta-inner">
        <div>
          <p class="eyebrow light">PRONTO PARA AVANÇAR?</p>
          <h2>Seu próximo curso<br />começa com uma conversa.</h2>
        </div>
        <button class="button button-white" type="button" @click="talkAbout()">
          Falar no WhatsApp
        </button>
      </div>
    </section>
    <section class="section container faq">
      <div class="section-heading">
        <p class="eyebrow">DÚVIDAS FREQUENTES</p>
        <h2>Informação clara para você decidir.</h2>
      </div>
      <details v-for="faq in data.faqs" :key="faq.id">
        <summary>{{ faq.question }} <span>+</span></summary>
        <p>{{ faq.answer }}</p>
      </details>
    </section>
  </template>
</template>
