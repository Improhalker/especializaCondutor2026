# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Análise própria

O painel `/admin/atendimentos` consome exclusivamente a API Laravel para tráfego, cliques, rolagem, tempo ativo e desempenho. O coletor está em `src/services/siteAnalytics.js`, com rotas públicas e normalização de paginação em `src/services/analyticsPayload.js`. CTAs podem usar `data-analytics-kind="whatsapp"` e `data-analytics-label` para identificar sua localização.

Validação sem dependências adicionais: `node --test tests/analytics.test.mjs` e `npm run build`. Configuração do servidor, limitações das métricas e privacidade estão documentadas em `../EspecializaBack/ANALYTICS.md`. Não adicionar dados fictícios ao painel real.
