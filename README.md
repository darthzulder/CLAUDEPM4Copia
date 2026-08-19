# Introduction

**PM4 App** is a React + Express application that runs as an **iframe inside ProcessMaker 4 (PM4)** for Zurich Insurance Regional Colombia. It is not a form-builder: each screen is a React component that faithfully replicates a specific PM4 form/subform, built using the **Zurich Design System (ZDS)**.

The motivation is that PM4's native screen builder does not offer the flexibility needed for these forms (complex validations, watchers, file uploads, dynamic collections, PDF generation, etc.), so screens are developed here as standalone React apps and embedded back into PM4 process tasks via `task_id`/`token` query parameters.

Key pieces of the repository:
- **`pm4-app/`** — the application itself (frontend and backend/proxy). See [pm4-app/CLAUDE.md](pm4-app/CLAUDE.md) for the full architecture/convention reference.
- **`PM4 Backup/`** — exported JSON packages of the original PM4 screens/forms used as reference when building or migrating a screen.
- **`docs (4).json`** — the OpenAPI reference for the PM4 instance's REST API.
- **`graphify-out/`** — an auto-generated knowledge graph of the codebase ([GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md)) used for navigation and impact analysis.
- **`docker-compose.yml`** — local orchestration for the app.

# Getting Started

## 1. Installation process

This project runs **inside Docker** — Node/npm are not expected to be available on the host. From the repository root:

```bash
docker compose up --build
```

This builds and starts `pm4-app-container` — Express backend (proxy to PM4) + Angular frontend, using `pm4-app/Dockerfile`.

> ⚠ **The repository currently has no `docker-compose.yml`** (the only container file is `pm4-app/Dockerfile`), so the command above does not work as written. Build and run the image directly, or restore a compose file. Pre-existing gap, reported rather than silently patched.

Once running, exec into the app container to run npm scripts (there is no host-level `npm`):

```bash
docker exec pm4-app-container sh -c "cd /app && npm run build --workspace=frontend-ng"
```

## 2. Software dependencies

- **Docker** / Docker Compose
- **Node 24** + npm workspaces (`backend`, `frontend-ng`, `frontend`) — provided by the container, pinned in `pm4-app/Dockerfile`
- **Angular 21**, **TypeScript 5.9** (`frontend-ng` — the deployed frontend since Phase 7)
- **Express 5.2** (backend/proxy)
- `@zurich/web-components` / `@zurich/css-components` **0.8.2** + `@zurich-col/lib-zurich` — installed from the Azure feed (see `InsumosZurich/FEED-ZURICH.md`)
- **`frontend` (React 19.2 / Vite 8.1 / react-hook-form 7.80) is still in the tree but is no longer built or deployed.** It stays as the live parity reference; `@zurich/*` **0.8.1** is vendored as `.tgz` under `pm4-app/frontend/vendor/` and `package-lock.json` resolves those four entries to `file:` paths, so removing the folder requires regenerating the lock in the same commit (see `pm4-app/frontend/vendor/README.md` and the `[[project-zds-decommission]]` note before touching these)

## 3. Configuration

Copy `pm4-app/.env.example` to `pm4-app/.env` and fill in the PM4 credentials:

```
PM4_BASE_URL=https://<current-pm4-instance>   # see pm4-app/.env for the actual value in use
PM4_TOKEN=eyJ...
PORT=3001
VITE_TASK_ID=123
VITE_PM4_TOKEN=eyJ...
```

`PM4_BASE_URL` identifies which PM4 instance the app talks to and **changes across environments/migrations** — never hardcode a specific instance hostname in code or docs; always defer to this variable.

`.env` is git-ignored and must never be committed with a real token.

Once the app is running, a screen is loaded inside PM4 as an iframe pointed at:

```
http://localhost:4200/?screen=<screen-slug>&task_id=<id>&token=<jwt>
```

The Angular router translates `?screen=<slug>` into a real path at the edge, preserving `task_id` and `token` — so PM4 keeps generating the exact same iframe URL it did for React. In production the Express server serves the Angular build and falls back to `index.html` for navigations, which is what makes a direct refresh on `/<slug>` work.

> ⚠ `VITE_PM4_TOKEN` / `VITE_TASK_ID` / `VITE_CASE_ID` are development fallbacks only: since Phase 7 they are baked as empty strings when `NODE_ENV=production`, so a production bundle cannot carry a token even if the variable is set in the deploy environment. The names keep the `VITE_` prefix for continuity with the React setup; the Angular build reads them via `frontend-ng/scripts/gen-env-define.mjs`.

## 4. Latest releases

Deployment target is [Render](https://render.com) (`pm4-app/render.yaml`), building with `npm ci && npm run build` and starting with `npm run start`. Check recent commits / tags on `main` for the latest shipped state.

## 5. API references

- PM4 REST API — OpenAPI spec at [`docs (4).json`](docs%20(4).json) (repo root)
- Internal proxy endpoints — documented in [pm4-app/CLAUDE.md](pm4-app/CLAUDE.md) under "API PM4 (endpoints disponibles en el proxy)"
- Zurich Design System usage — `pm4-app/outputs/zds-cheatsheet.md` (which components/props exist) and `pm4-app/outputs/shared-css-catalog.md` (which CSS classes already exist)

# Build and Test

All commands run inside `pm4-app-container` (no host npm):

```bash
# Dev servers (backend :3001, Angular :4200)
docker exec pm4-app-container sh -c "cd /app && npm run dev"

# Same, against the React reference instead (backend :3001, Vite :5173)
docker exec pm4-app-container sh -c "cd /app && npm run dev:react"

# Production build (frontend-ng then backend). React is deliberately not built.
docker exec pm4-app-container sh -c "cd /app && npm run build"

# Lint (Angular)
docker exec pm4-app-container sh -c "cd /app && npm run lint --workspace=frontend-ng"
```

The container has no HMR against the Windows-mounted volume, so after editing CSS/static assets restart it to pick up changes:

```bash
docker restart pm4-app-container
```

**Before every commit/push**, run the full gate — build + lint + tests — and confirm there are no TypeScript, lint, bundling, or test errors:

```bash
docker exec pm4-app-container sh -c "cd /app && npm run verify"
```

This is enforced in two layers (setup in [docs/guides/entorno-local-y-verificacion.md](docs/guides/entorno-local-y-verificacion.md)): a versioned `pre-commit` hook in `.githooks/` (enable once with `npm run setup:hooks`), and **GitHub Actions** on every push/PR — the latter is the authoritative gate, since a local hook can be bypassed with `--no-verify`.

Automated tests are **mandatory** for new or modified pure logic, own components, and screens
— see [docs/guides/testing-conventions.md](docs/guides/testing-conventions.md) for what needs a
test and the ZDS-specific gotchas. They do not replace manual verification of the screens
themselves, which is still done inside the PM4 iframe (or directly at
`http://localhost:4200/?screen=...`) and via the `?screen=ds-catalog` live component reference:

```bash
# Angular — Vitest, lógica pura de core/*.ts, componentes y pantallas
docker exec pm4-app-container sh -c "cd /app && npm run test --workspace=frontend-ng"
```

# Contribute

- Read [pm4-app/CLAUDE.md](pm4-app/CLAUDE.md) first — it documents the file architecture, data flow, ZDS conventions, and the mandatory "UI decision hierarchy" (reuse existing components/DS before writing custom CSS).
- New screens go under `pm4-app/frontend/src/screens/{slug}/` with a `variables.ts` (options/collections/watchers/types) and a `NombrePantalla.tsx` component, then get registered in `App.tsx`'s `SCREENS` map. Do not create a per-screen `styles.css` — shared styling lives in `shared.css` only, using design tokens (`--zs-*`, `--zf-*`, `--z-*`/`--zc-*`/`--zg-*`).
- Every screen must ship a `DOCUMENTACION_<slug>.md` alongside it, tracing every implemented field/rule/message back to its source in `pm4-app/insumos/` — see [docs/guides/GUIA_DOCUMENTACION_PANTALLAS.md](docs/guides/GUIA_DOCUMENTACION_PANTALLAS.md) for the required structure and traceability rules.
- Never import `@zurich/web-components` directly in a screen — always go through the `ZdsFields` facade (`pm4-app/frontend/src/components/fields/ZdsFields.tsx`).
- Do not modify `.env` (only add variables), `pm4-app/backend/src/routes/pm4.routes.ts`'s core proxy logic, `docs (4).json`, or the exported PM4 packages under `PM4 Backup/` — treat these as read-only references.
- After modifying code, run `graphify update .` to keep `graphify-out/` (the project's knowledge graph) current.
- Run the full build + lint + tests (see above) before opening a pull request.

For more on writing good READMEs, see the [Azure DevOps guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). Inspiration: [ASP.NET Core](https://github.com/aspnet/Home), [Visual Studio Code](https://github.com/Microsoft/vscode), [Chakra Core](https://github.com/Microsoft/ChakraCore).
