<script setup>
import {
  BadgeCheck,
  ExternalLink,
  FileCheck2,
  Landmark,
} from "lucide-vue-next";

const officialSources = [
  {
    label: "IBAC Brasil na SENATRAN",
    url: "https://www.gov.br/transportes/pt-br/assuntos/transito/senatran/ibacbrasil",
  },
  {
    label: "Resolução CONTRAN nº 1.020/2025",
    url: "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao10202025.pdf",
  },
  {
    label: "Portaria SENATRAN nº 923/2025",
    url: "https://www.gov.br/transportes/pt-br/assuntos/transito/arquivos-senatran/portarias/2025/Portaria9232025.pdf",
  },
];
</script>

<template>
  <section class="regulatory-footer" aria-labelledby="regulatory-title">
    <div class="container">
      <div class="regulatory-intro">
        <div class="regulatory-mark" aria-hidden="true">
          <img
            src="/brand/marca.png"
            alt=""
            width="456"
            height="456"
            loading="lazy"
          />
        </div>
        <div>
          <p class="footer-title">CONFIANÇA E CONFORMIDADE</p>
          <h2 id="regulatory-title">
            Especialização alinhada às normas atuais de trânsito.
          </h2>
          <p>
            A Especializa Condutor atua como parceira comercial da Access
            IBACBrasil, entidade homologada pela SENATRAN para a oferta dos
            cursos especializados divulgados aqui.
          </p>
        </div>
      </div>

      <div class="regulatory-grid">
        <article>
          <BadgeCheck :size="28" aria-hidden="true" />
          <div>
            <h3>Parceiro homologado</h3>
            <p>
              A Access IBACBrasil integra a relação oficial de entidades
              homologadas da SENATRAN, vinculada à Portaria nº 232/2025.
            </p>
          </div>
        </article>
        <article>
          <FileCheck2 :size="28" aria-hidden="true" />
          <div>
            <h3>Regulamentação atual</h3>
            <p>
              Os cursos seguem a Resolução CONTRAN nº 1.020/2025 e os
              conteúdos e cargas horárias da Portaria SENATRAN nº 923/2025.
            </p>
          </div>
        </article>
        <article>
          <Landmark :size="28" aria-hidden="true" />
          <div>
            <h3>Processo oficial</h3>
            <p>
              Certificação, registro no Renach e eventual exame teórico seguem
              as etapas aplicáveis ao curso, à modalidade e ao Detran
              responsável pela CNH.
            </p>
          </div>
        </article>
      </div>

      <div class="regulatory-sources" aria-label="Fontes oficiais">
        <span>Consulte as fontes oficiais:</span>
        <a
          v-for="source in officialSources"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ source.label }} <ExternalLink :size="15" aria-hidden="true" />
        </a>
      </div>

      <p class="regulatory-disclosure">
        A Especializa Condutor realiza divulgação, orientação e atendimento
        comercial. A execução acadêmica, a avaliação e a certificação são de
        responsabilidade da instituição parceira e dos órgãos competentes.
      </p>
    </div>
  </section>
</template>
