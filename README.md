# Introduction

**PM4 App** is a React + Express application that runs as an **iframe inside ProcessMaker 4 (PM4)** for Zurich Insurance Regional Colombia. It is not a form-builder: each screen is a React component that faithfully replicates a specific PM4 form/subform, built using the **Zurich Design System (ZDS)**.

The motivation is that PM4's native screen builder does not offer the flexibility needed for these forms (complex validations, watchers, file uploads, dynamic collections, PDF generation, etc.), so screens are developed here as standalone React apps and embedded back into PM4 process tasks via `task_id`/`token` query parameters.

Key pieces of the repository:
- **`pm4-app/`** — the application itself (frontend, backend/proxy, and a Python cotizador microservice). See [pm4-app/CLAUDE.md](pm4-app/CLAUDE.md) for the full architecture/convention reference.
- **`PM4 Backup/`** — exported JSON packages of the original PM4 screens/forms used as reference when building or migrating a screen.
- **`docs (4).json`** — the OpenAPI reference for the PM4 instance's REST API.
- **`graphify-out/`** — an auto-generated knowledge graph of the codebase ([GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md)) used for navigation and impact analysis.
- **`docker-compose.yml`** — local orchestration for the app plus its Python calculation service.

# Getting Started

## 1. Installation process

This project runs **inside Docker** — Node/npm are not expected to be available on the host. From the repository root:

```bash
docker compose up --build
```

This builds and starts two containers:
- `pm4-app-container` — Express backend (proxy to PM4) + Vite/React frontend, using `pm4-app/Dockerfile`
- `cotizador-service-container` — Python calculation microservice used by the quoting screens

Once running, exec into the app container to run npm scripts (there is no host-level `npm`):

```bash
docker exec pm4-app-container sh -c "cd /app && npm run build --workspace=frontend"
```

## 2. Software dependencies

- **Docker** / Docker Compose
- **Node 24** + npm workspaces (`backend`, `frontend`) — provided by the container, pinned in `pm4-app/Dockerfile`
- **React 19.2**, **TypeScript 5.9**, **Vite 8.1** (frontend)
- **Express 5.2** (backend/proxy)
- **react-hook-form 7.80**
- `@zurich/web-components` / `@zurich/css-components` **0.8.1** — vendored as `.tgz` under `pm4-app/frontend/vendor/` (the ZDS DevKit registry was decommissioned; see `pm4-app/frontend/vendor/README.md` and the `[[project-zds-decommission]]` note before touching these)
- **Python** (cotizador microservice under `pm4-app/cotizador-service/`)

## 3. Configuration

Copy `pm4-app/.env.example` to `pm4-app/.env` and fill in the PM4 credentials:

```
PM4_BASE_URL=https://mxzurich.dev.cloud.processmaker.net
PM4_TOKEN=eyJ...
PORT=3001
VITE_TASK_ID=123
VITE_PM4_TOKEN=eyJ...
```

`.env` is git-ignored and must never be committed with a real token.

Once the app is running, a screen is loaded inside PM4 as an iframe pointed at:

```
http://localhost:5173/?screen=<screen-slug>&task_id=<id>&token=<jwt>
```

## 4. Latest releases

Deployment target is [Render](https://render.com) (`pm4-app/render.yaml`), building with `npm ci && npm run build` and starting with `npm run start`. Check recent commits / tags on `main` for the latest shipped state.

## 5. API references

- PM4 REST API — OpenAPI spec at [`docs (4).json`](docs%20(4).json) (repo root)
- Internal proxy endpoints — documented in [pm4-app/CLAUDE.md](pm4-app/CLAUDE.md) under "API PM4 (endpoints disponibles en el proxy)"
- Zurich Design System usage — `pm4-app/outputs/zds-cheatsheet.md` (which components/props exist) and `pm4-app/outputs/shared-css-catalog.md` (which CSS classes already exist)

# Build and Test

All commands run inside `pm4-app-container` (no host npm):

```bash
# Dev servers (backend :3001, frontend :5173) — already running continuously in the container
docker exec pm4-app-container sh -c "cd /app && npm run dev"

# Production build (frontend then backend)
docker exec pm4-app-container sh -c "cd /app && npm run build"

# Lint (frontend)
docker exec pm4-app-container sh -c "cd /app && npm run lint --workspace=frontend"
```

The container has no HMR against the Windows-mounted volume, so after editing CSS/static assets restart it to pick up changes:

```bash
docker restart pm4-app-container
```

**Before every commit/push**, run the full build + lint and confirm there are no TypeScript, lint, or bundling errors — do not commit a broken build:

```bash
docker exec pm4-app-container sh -c "cd /app && npm run build --workspace=frontend"
docker exec pm4-app-container sh -c "cd /app && npm run build --workspace=backend"
docker exec pm4-app-container sh -c "cd /app && npm run lint --workspace=frontend"
```

There is no automated test suite at this time; verification is done via manual testing of the screen inside the PM4 iframe (or directly at `http://localhost:5173/?screen=...`) and the `?screen=ds-catalog` live component reference.

# Contribute

- Read [pm4-app/CLAUDE.md](pm4-app/CLAUDE.md) first — it documents the file architecture, data flow, ZDS conventions, and the mandatory "UI decision hierarchy" (reuse existing components/DS before writing custom CSS).
- New screens go under `pm4-app/frontend/src/screens/{slug}/` with a `variables.ts` (options/collections/watchers/types) and a `NombrePantalla.tsx` component, then get registered in `App.tsx`'s `SCREENS` map. Do not create a per-screen `styles.css` — shared styling lives in `shared.css` only, using design tokens (`--zs-*`, `--zf-*`, `--z-*`/`--zc-*`/`--zg-*`).
- Never import `@zurich/web-components` directly in a screen — always go through the `ZdsFields` facade (`pm4-app/frontend/src/components/fields/ZdsFields.tsx`).
- Do not modify `.env` (only add variables), `pm4-app/backend/src/routes/pm4.routes.ts`'s core proxy logic, `docs (4).json`, or the exported PM4 packages under `PM4 Backup/` — treat these as read-only references.
- After modifying code, run `graphify update .` to keep `graphify-out/` (the project's knowledge graph) current.
- Run the full build + lint (see above) before opening a pull request.

For more on writing good READMEs, see the [Azure DevOps guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). Inspiration: [ASP.NET Core](https://github.com/aspnet/Home), [Visual Studio Code](https://github.com/Microsoft/vscode), [Chakra Core](https://github.com/Microsoft/ChakraCore).
