# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A React + Express monorepo that runs **as an iframe inside ProcessMaker 4 (PM4)** for Zurich Regional (Colombia). Each screen is a standalone React form component that replicates a PM4 native form. Screens are built here (not inside PM4) and embedded via iframe URL.

- **PM4 instance:** `https://mxzurich.dev.cloud.processmaker.net`
- **App source:** `pm4-app/` (npm workspaces: `backend` + `frontend`)

## Commands

All commands run from `pm4-app/`:

```bash
npm run dev        # backend :3001 + frontend :5173 concurrently
npm run build      # compile frontend then backend (order matters)
npm start          # production: node backend/dist/server.js
```

Individual workspace:
```bash
npm run dev --workspace=backend
npm run dev --workspace=frontend
```

TypeScript check (no emit):
```bash
npx tsc --noEmit   # from backend/ or frontend/
```

## Architecture

```
pm4-app/
├── backend/src/
│   ├── server.ts            ← Express :3001, serves frontend/dist in prod
│   └── routes/pm4.routes.ts ← Pure proxy: /api/* → PM4 /api/1.0/*
└── frontend/src/
    ├── App.tsx              ← Router: reads ?screen= → loads from SCREENS map
    ├── api/pm4Client.ts     ← axios instance, injects x-pm4-token header
    ├── core/
    │   ├── useToken.ts      ← resolveToken() / resolveTaskId() from URL or env
    │   ├── useTask.ts       ← GET /tasks/{id}?include=data  |  PUT /tasks/{id}
    │   └── useCollection.ts ← GET /collections/{id}/records, PMQL filtering
    ├── components/fields/   ← InputField, SelectField, RadioField, DateField
    ├── components/FormSection.tsx
    └── screens/{slug}/
        ├── variables.ts     ← OPTIONS (static), COLLECTION_DEFS, TS interface, WATCHERS
        ├── styles.css       ← all CSS for this screen (scoped, never global)
        └── ScreenName.tsx   ← main component (<300 lines)
```

**Data flow:**
1. PM4 opens iframe: `?screen=cotizador-fast-flow&task_id=123&token=eyJ...`
2. `App.tsx` resolves `?screen=` → mounts component
3. `useTask()` → `GET /api/tasks/{id}?include=data`
4. `form.reset(task.data)` pre-populates all fields
5. `onSubmit` → `PUT /api/tasks/{id}` `{ status: "COMPLETED", data: formData }`
6. PM4 advances process to next node

**Proxy token resolution (backend):** `Authorization` header from request → `PM4_TOKEN` env var  
**Frontend token resolution:** `?token=` query param → `VITE_PM4_TOKEN` env var  
**Frontend task_id resolution:** `?task_id=` query param → `VITE_TASK_ID` env var

## Environment variables (`.env` in `pm4-app/`)

```
PM4_BASE_URL=https://mxzurich.dev.cloud.processmaker.net
PM4_TOKEN=eyJ...        # backend dev fallback
PORT=3001
VITE_TASK_ID=           # frontend dev fallback
VITE_PM4_TOKEN=         # frontend dev fallback
```

## Adding a new screen

1. Create `frontend/src/screens/{slug}/`
2. `variables.ts` — export `OPTIONS` (static arrays with `value`/`label`, use `as const`), `COLLECTION_DEFS` (PM4 collection sources), TS interface for form data, `WATCHERS`
3. `styles.css` — include Zurich base variables + screen-specific styles
4. `ScreenName.tsx` — use `useTask()`, `useForm()`, `form.reset(task?.data ?? {})` on load
5. Register in `App.tsx` SCREENS map: `'slug': lazy(() => import('./screens/slug/ScreenName'))`

**To request a new screen from Claude:** provide the PM4 package JSON export and/or screenshot.

## PM4 API endpoints (proxied at `/api/*`)

| Action | Method | Path |
|--------|--------|------|
| Get task with data | GET | `/api/tasks/{id}?include=data` |
| Complete task | PUT | `/api/tasks/{id}` → `{ status: "COMPLETED", data: {} }` |
| Collection records | GET | `/api/collections/{id}/records?per_page=500` |
| Start process | POST | `/api/process_events/{process_id}?event={node_id}` |
| Execute script (watcher) | POST | `/api/scripts/{id}/execute` |
| Request data | GET | `/api/requests/{id}` |

## Known PM4 collections

| ID | Content | labelField | valueField |
|----|---------|-----------|-----------|
| 2 | NAIC activities | `data.frm_actividad` | `data.frm_codigo` |
| 4 | Intermediaries | `data.frm_nombre_entidad` | `id` |
| 5 | Intermediary emails | `data.frm_mail_intermediario` | `data.frm_mail_intermediario` |

> Collection IDs may differ across PM4 instances — verify on each environment.

## Code conventions

- **Form state:** `react-hook-form` exclusively. Show validation errors only after first submit or field blur.
- **Field components:** Always use `InputField`, `SelectField`, `RadioField`, `DateField` — never raw `<input>`.
- **Dynamic selects:** Use `COLLECTION_DEFS` with optional `dependsOn` + `pmqlTemplate` (`{{field_name}}` placeholders).
- **CSS:** Scoped per screen in `styles.css`. Never write styles outside that file.
- **Component size:** Main screen component <300 lines. Split large sections into sibling files in the same folder.
- **`OPTIONS` arrays:** Declare `as const`, they're passed directly to field components that accept `readonly`.

## Zurich CSS variables

```css
--zurich-blue:   #2167AE
--zurich-green:  #0CA442
--zurich-red:    #EC5962
--zurich-bg:     #f7f9fc
--zurich-border: #e5e7eb
```

Font: `ZurichSans-Regular.ttf` from `https://bpm.beesmart.ec/fonts/zurich/`  
Layout classes: `.form-row`, `.cols-1/.cols-2/.cols-3`, `.form-group`, `.form-section`, `.form-section-header`, `.form-section-body`

## PM4 package JSON structure (for reading exported packages)

```json
{
  "type": "screen_package",
  "screens": [{ "title": "...", "config": [], "watchers": [], "custom_css": "..." }],
  "scripts": [{ "id": 4, "language": "php", "code": "..." }]
}
```

PM4 component types: `FormInput`, `FormMultiColumn`, `FormSelectList`, `FormDatePicker`, `FormHtmlViewer`, `FormNestedScreen`, `BWrapperComponent`.  
`FormMultiColumn.items` is an **array of arrays** (columns → items per column).

## Files to leave unchanged

- `backend/src/routes/pm4.routes.ts` — only add new route entries, never rewrite proxy logic
- `docs (4).json` (at project root sibling) — OpenAPI reference for PM4, read-only
- `*.json` PM4 package exports — read-only source of truth for screen definitions
