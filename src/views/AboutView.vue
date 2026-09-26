<script setup>
import { ArrowRight, BadgeCheck, HeartHandshake, Route, UsersRound } from "lucide-vue-next";
import WhatsAppIcon from "../components/WhatsAppIcon.vue";
import { trackWhatsAppClick, whatsappUrl } from "../services/api";

function talkToTeam() {
  trackWhatsAppClick({ source: "quem-somos" });
  window.location.assign(
    whatsappUrl(
      "Olá! Conheci a Especializa Condutor pela página Quem Somos e gostaria de saber mais sobre os cursos.",
    ),
  );
}
</script>

<template>
  <div class="about-page">
    <section class="about-hero motion-hero">
      <div class="container about-hero-grid">
        <div class="about-hero-copy">
          <p class="eyebrow light">QUEM SOMOS</p>
          <h1>Mais preparo para quem faz o Brasil seguir em frente.</h1>
          <p>
            A Especializa Condutor aproxima motoristas de cursos especializados,
            com informação clara, atendimento próximo e orientação em cada etapa
            da matrícula.
          </p>
          <div class="about-hero-actions">
            <RouterLink class="button button-white" to="/cursos">
              Conhecer os cursos <ArrowRight :size="18" aria-hidden="true" />
            </RouterLink>
            <button class="button button-outline" type="button" @click="talkToTeam">
              <WhatsAppIcon /> Conversar com a equipe
            </button>
          </div>
        </div>

        <div class="about-hero-mark" aria-hidden="true">
          <span class="about-hero-route"></span>
          <div>
            <strong>EC</strong>
            <small>Especializa<br />Condutor</small>
          </div>
        </div>
      </div>
    </section>

    <section class="about-impact" aria-labelledby="about-impact-title">
      <div class="container">
        <div class="about-impact-heading" v-reveal>
          <div>
            <p class="eyebrow">NOSSA JORNADA</p>
            <h2 id="about-impact-title">Resultados construídos uma conversa de cada vez.</h2>
          </div>
          <p>
            Cada inscrição representa um profissional buscando novas possibilidades
            para sua carreira — e uma responsabilidade que levamos a sério.
          </p>
        </div>

        <div class="about-numbers">
          <article v-reveal>
            <strong>70<span>+</span></strong>
            <h3>Inscrições acompanhadas</h3>
            <p>Motoristas orientados do primeiro contato à escolha do curso.</p>
          </article>
          <article v-reveal="{ delay: 90 }">
            <strong class="about-word-stat">Toda semana</strong>
            <h3>Novos condutores chegam até nós</h3>
            <p>Uma comunidade que continua crescendo com confiança e indicação.</p>
          </article>
          <article v-reveal="{ delay: 180 }">
            <strong>100<span>%</span></strong>
            <h3>Atendimento próximo</h3>
            <p>Orientação humana para esclarecer requisitos, etapas e modalidades.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section about-story">
      <div class="container about-story-grid">
        <div v-reveal>
          <p class="eyebrow">POR QUE EXISTIMOS</p>
          <h2>Especialização profissional precisa começar com clareza.</h2>
          <p>
            Escolher um curso para atuar no trânsito envolve requisitos, prazos e
            decisões importantes. Por isso, organizamos as informações e ajudamos
            cada motorista a entender qual caminho faz sentido para o seu momento.
          </p>
          <p>
            Trabalhamos em parceria comercial com a IBAC Brasil para aproximar o
            condutor de cursos especializados e de uma experiência de matrícula
            mais simples, segura e bem orientada.
          </p>
        </div>

        <aside class="about-principles" v-reveal="{ delay: 120 }">
          <p class="eyebrow light">NOSSO COMPROMISSO</p>
          <h3>Você sabe o próximo passo antes de tomar uma decisão.</h3>
          <ul>
            <li><BadgeCheck :size="20" /> Informações objetivas sobre cada curso</li>
            <li><BadgeCheck :size="20" /> Orientação antes e durante a matrícula</li>
            <li><BadgeCheck :size="20" /> Atendimento direto para tirar dúvidas</li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="about-values">
      <div class="container">
        <div class="section-heading" v-reveal>
          <p class="eyebrow">NOSSO JEITO DE FAZER</p>
          <h2>Próximos de quem quer avançar.</h2>
        </div>
        <div class="about-values-grid">
          <article v-reveal>
            <span><UsersRound :size="25" aria-hidden="true" /></span>
            <h3>Atendimento humano</h3>
            <p>
              Cada motorista tem uma necessidade diferente. A conversa vem antes
              da indicação.
            </p>
          </article>
          <article v-reveal="{ delay: 90 }">
            <span><Route :size="25" aria-hidden="true" /></span>
            <h3>Caminho descomplicado</h3>
            <p>
              Traduzimos etapas e requisitos para que você avance com mais
              segurança.
            </p>
          </article>
          <article v-reveal="{ delay: 180 }">
            <span><HeartHandshake :size="25" aria-hidden="true" /></span>
            <h3>Confiança que permanece</h3>
            <p>
              Nosso relacionamento não termina na inscrição. Seguimos disponíveis
              para orientar.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="about-cta">
      <div class="container about-cta-inner">
        <div>
          <p class="eyebrow light">SUA PRÓXIMA ETAPA</p>
          <h2>Encontre a especialização certa para a sua trajetória.</h2>
          <p>Conheça as opções disponíveis ou fale com nossa equipe.</p>
        </div>
        <div class="about-cta-actions">
          <RouterLink class="button button-white" to="/cursos">Ver cursos</RouterLink>
          <button class="button button-outline" type="button" @click="talkToTeam">
            <WhatsAppIcon /> Falar no WhatsApp
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
