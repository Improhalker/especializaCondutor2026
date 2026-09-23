# Especializa Condutor — frontend agent guide

## Scope and paired back-end

- This repository contains the Vue 3.5 and Vite 8 frontend for Especializa Condutor. The paired Laravel 13 API is in `../EspecializaBack` and has its own `AGENTS.md` with framework-specific rules.
- Inspect the Laravel routes, Resources, Requests, and tests whenever a UI change depends on an API contract. The two repositories have separate Git histories and remotes.
- Production is served by Laravel from this repository's `dist` build. Do not assume a standalone static-host deployment.

## Product conventions

- All public and administrative interface copy is Brazilian Portuguese (`pt-BR`).
- Preserve the visual identity: navy `#0e3459`, supporting blue `#136ab7`, white, neutral grays, and WhatsApp green only for WhatsApp actions.
- Keep public pages responsive and accessible: visible focus, semantic labels, keyboard support, sufficient contrast, meaningful alt text, image dimensions when available, lazy loading for listing images, and reduced-motion support.
- Reuse existing components and styles before creating new ones. Public styles are split across `src/styles/main.css`, `public.css`, `hero.css`, `media.css`, and `motion.css`; admin styles live in `admin.css`.
- Use Vue `<script setup>` and the existing routing and component patterns.

## API and security boundaries

- Vue must never access Supabase Database or Storage directly. Never add Supabase credentials, `supabase-js`, direct bucket operations, or privileged URLs to this repository.
- Use only the existing API clients in `src/services/api.js` and `src/services/adminApi.js`. Keep authentication handling centralized in `src/services/adminSession.js`.
- Supabase credentials belong exclusively in the Laravel `.env`, never in `VITE_*` variables.
- Media upload, listing, editing, deletion, usage checks, and URL delivery are Laravel responsibilities. Frontend images consume the ready-to-use `url`, `alt_text`, `width`, and `height` fields returned by the API.
- Use real API data in integrated pages. Do not ship mock course, media, attendance, or settings data.

## Current routes and modules

- Public routes: `/`, `/cursos`, and `/cursos/:slug`.
- Admin routes: `/admin`, `/admin/cursos`, `/admin/cursos/novo`, `/admin/cursos/:id/editar`, `/admin/midias`, `/admin/aparencia`, `/admin/atendimentos`, `/admin/configuracoes`, and `/admin/logs`.
- Existing reusable areas include course cards, hero rendering/editing, media library/picker/uploader, media preview, loading/error states, confirmation modal, WhatsApp icon/actions, SEO helpers, and reveal/motion behavior.
- Course covers prefer linked media but remain compatible with legacy cover URLs supplied by the API.

## Change log (`public/logs.json`)

- This repository keeps a simple, human- and agent-editable change log at `public/logs.json` (served as-is at `/logs.json` in dev and in the production build, and read at runtime by the Admin "Logs" page — no API involved).
- Whenever you finish a relevant change to either repository (frontend or backend), append one entry to this JSON array. Do not create a database table, endpoint, or any extra tooling for this.
- Entry format (keep it exactly this shape):
  ```json
  { "id": 2, "date": "2026-09-23", "content": "Short, clear description of what changed." }
  ```
- `id` must be a unique, incrementing integer: read the current highest `id` in the file and add 1 (do not reuse or reorder existing ids).
- `date` uses `YYYY-MM-DD` (local date of the change).
- `content` is a short plain-text sentence in Portuguese describing the change; keep the file a plain JSON array, easy to hand-edit.
- Add the new entry to the array (order in the file does not matter — the Admin page sorts by date/id, most recent first).

## Working safely

- Read `git status` and the relevant diff before editing. Preserve all existing user changes and never reset, clean, checkout, or reformat unrelated work.
- Treat local development servers as managed resources. Before starting Laravel, inspect the target port and stop stale `artisan serve`/PHP development processes after confirming their command line; never open extra backend instances or alternate ports to work around a conflict. Stop every temporary server created for tests in the same turn. When local work finishes, restore exactly one official Especializa backend from `../EspecializaBack` at `http://localhost:8000` with a single worker, verify `/api/home`, and leave no orphaned test servers running.
- Check sibling views and components for established patterns. Extend the existing components rather than introducing parallel implementations.
- When an API contract must change, update the Laravel repository and its feature tests as part of the same task.
- Keep environment-specific configuration out of source control. `VITE_API_URL` may select the Laravel API base URL; never expose server credentials through it.
- Do not add or upgrade dependencies without explicit approval.

## Validation

- Run `npm run build` after frontend changes.
- There is currently no frontend automated test script. For behavior or visual work, validate the affected flow in a real browser at desktop and mobile widths.
- Check loading, error, empty, active/selected, keyboard-focus, and long-text states when they are relevant to the change.
- For integrated changes, also run the narrowest relevant Laravel feature tests in `../EspecializaBack`.
- Do not commit, push, deploy, or modify production data unless the user explicitly requests it.
