# Plan de migración a React 19.2 — PM4 App (Zurich Colombia)

> **Estado: completada (2026-07-01, Etapas 0-6, branch `migracion/react19`).** Este documento
> es el plan original — se conserva como bitácora técnica del problema real que resolvió (el
> parche de `jsx-runtime` vendorizado, todavía vigente en `pm4-app/frontend/vendor/`) y como
> referencia si algún día hay que repetir el mismo tipo de parche sobre otro paquete `@zurich/*`
> decomisionado. **No es una guía de trabajo pendiente** — el stack objetivo ya está en
> producción.
>
> **Resultado real, verificado en `pm4-app/frontend/package.json` (branch `dev`):**
> React **19.2.7** · Node **24** · TypeScript **5.9.3** · Vite **8.1.2** · Express **5.2.1** ·
> react-hook-form **7.80.0**. Las 22 pantallas de `App.tsx` + `?screen=ds-catalog` renderizan
> sin errores de consola (regresión completa verificada al cierre de la Etapa 6).
> Commits `f473661`..`0f5f741`. Detalle del parche vendorizado: `pm4-app/frontend/vendor/README.md`.
>
> **Fecha original:** 2026-07-01 · **Autor:** análisis Claude Code · **Objetivo:** dejar todo
> el stack (frontend + backend + runtime) en su versión más actual y estable, con React
> **19.2.7** como meta principal.
> **Regla de oro aplicada:** la migración avanzó por **etapas verificables**, cada una con
> gate ✅ antes de pasar a la siguiente. Todo ocurrió en el worktree/branch `migracion/react19`;
> `main` no se tocó hasta el merge final.

---

## 1. Contexto y hallazgos de compatibilidad

Análisis previo (leyendo el `dist` real de ZDS en unpkg y grepeando todo `frontend/src`):

- **Código propio del frontend: 100% limpio.** Cero patrones legacy de React 19 (`defaultProps`, `propTypes`, `forwardRef`, `findDOMNode`, string refs, `ReactDOM.render`, legacy context). `main.tsx` ya usa `createRoot` + `StrictMode`.
- **Wrappers de ZDS: la lógica es compatible.** Usan `forwardRef` (deprecado, **no removido** en 19), `createRef` + `useEffect` + `addEventListener` (`customElementWithEvents.js`). Ningún API removido.
- **Bloqueador real de ZDS (verificado):** `@zurich/web-components@0.8.1` empaquetó una **copia congelada del `react/jsx-runtime` de React 18** en `dist/react/jsx-runtime.js`, importada por los ~25 wrappers (`import { j } from "./jsx-runtime.js"`). Esa copia:
  1. Lee `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner` → React 19 renombró ese objeto y **eliminó `ReactCurrentOwner`** ⇒ `TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')` al cargar.
  2. Crea elementos con `$$typeof: Symbol.for('react.element')` → React 19 lo cambió a `'react.transitional.element'` ⇒ elementos no reconocidos.
  - Con solo `overrides`/`--legacy-peer-deps` **instala pero crashea en runtime**. Mismo síntoma que sufrieron headlessui, react-relay y react-three-fiber.
- **Punto clave:** ambos problemas comparten **una sola causa raíz** (el runtime empaquetado) y **un único punto de intervención** compartido por todos los componentes → se arregla una vez, sirve para los ~25.
- **Paquete decomisionado (31-dic-2025):** no habrá release oficial que lo arregle → la solución debía ser propia (vendorizado + shim). **Hallazgo posterior (Etapa 4):** `@zurich/css-components` tenía el mismo bug y no había sido parcheado en la Etapa 1 — quedó oculto porque los `npm install` incrementales de las etapas 1-3 nunca forzaron una re-resolución completa del árbol. Lección aplicada: verificar el jsx-runtime de CADA paquete `@zurich/*` vendorizado individualmente.

---

## 2. Tabla de versiones (actual → objetivo, al momento de planear)

### Frontend (`pm4-app/frontend/package.json`)

| Paquete | Actual (jul-2026) | Objetivo | Nota |
|---|---|---|---|
| `react` | 18.3.1 | **19.2.7** | meta principal |
| `react-dom` | 18.3.1 | **19.2.7** | |
| `@types/react` | 18.3.x | **19.2.17** | |
| `@types/react-dom` | 18.3.x | **19.2.3** | |
| `react-hook-form` | 7.52.1 | **7.80.0** | peer ya `^16.8‖^17‖^18‖^19` |
| `axios` | 1.7.2 | **1.18.1** | |
| `vite` | 5.3.3 | **8.1.2** | ⚠️ 3 majors; requiere Node ≥22.12 |
| `@vitejs/plugin-react` | 4.3.1 | **6.0.3** | requiere `vite ^8` |
| `typescript` | 5.5.3 | **5.9.x** | |
| `@zurich/css-components` | 0.8.1 | **vendorizado** `file:vendor/...` | ver §5 |
| `@zurich/web-components` | 0.8.1 | **vendorizado + shim jsx-runtime** | ver §5 |
| `@zurich/design-tokens` / `dev-utils` | 0.8.1 (transitivo) | **vendorizado** | ver §5 |

### Backend (`pm4-app/backend/package.json`)

| Paquete | Actual (jul-2026) | Objetivo | Nota |
|---|---|---|---|
| `express` | 4.19.2 | **5.2.1** | ⚠️ major; ver §6 (fix wildcard) |
| `multer` | 2.1.1 | **2.2.0** | compatible con Express 5 |
| `@types/node` | 20.14.9 | **^24** | igualar al Node runtime |

### Raíz / runtime

| Ítem | Actual (jul-2026) | Objetivo |
|---|---|---|
| `Dockerfile` base | `node:20-alpine` | **`node:24-alpine`** |

---

## 3. Estrategia general (aplicada)

- **Aislamiento:** todo el trabajo en el worktree/branch `migracion/react19`. `main` intacto hasta el merge final validado.
- **Reproducibilidad:** cada etapa terminó con `package-lock.json` regenerado y commiteado; build con `npm ci` (no `npm install`).
- **Gate por etapa:** cada etapa tuvo un checklist ✅ obligatorio antes de avanzar.
- **Verificación visual:** `?screen=ds-catalog` como detector de regresión principal del DS, complementado con pantallas reales.

---

## 4. Etapas — todas cerradas ✅

### Etapa 0 — Baseline y preparación ✅

Capturó el estado verde de referencia sobre React 18 (Node 20.20.2, npm 10.8.2, `node:20-alpine`):

| Comando | Resultado |
|---|---|
| `npm run build --workspace=frontend` (tsc + vite) | ✅ — Vite 5.4.21, 308 módulos |
| `npm run build --workspace=backend` (tsc) | ✅ |
| `npm run lint --workspace=frontend` (eslint) | ✅ |

Versiones realmente instaladas en el baseline (los `^` ya habían flotado dentro de su major):

| Paquete | Declarado | Instalado |
|---|---|---|
| `react` / `react-dom` | `^18.3.1` | **18.3.1** |
| `react-hook-form` | `^7.52.1` | **7.75.0** |
| `typescript` | `^5.5.3` | **5.9.3** |
| `vite` | `^5.3.3` | **5.4.21** |
| `@zurich/css-components` / `web-components` | 0.8.1 | **0.8.1** (peer react 18.3.1) |

Baseline visual: `?screen=ds-catalog` renderizado y verificado sobre React 18 (botones,
campos, calendario, tabla, cards, `ZrModal`), consola limpia. No hubo captura de baseline de
pantallas reales (sin token PM4 a mano en ese momento) — su regresión se validó
funcionalmente en las etapas siguientes.

> Nota: la copia congelada de referencia `package-lock.baseline.json` mencionada en el plan
> original nunca se comitió (está en `.gitignore` bajo "lockfile de respaldo obsoleto") — la
> comparación real se hizo contra el historial de git, no contra ese archivo.

### Etapa 1 — Vendorizado de ZDS + shim jsx-runtime ✅

Los 4 paquetes `@zurich/*@0.8.1` (`css-components`, `web-components`, `design-tokens`,
`dev-utils`) se empaquetaron como `.tgz` en `frontend/vendor/`, con:
- `peerDependencies.react`/`react-dom` ampliado a `^18.0.0 || ^19.0.0`.
- `dist/react/jsx-runtime.js` (ESM y CJS) reemplazado por un shim que re-exporta el
  jsx-runtime real de la versión de React instalada.

Detalle completo y cómo reproducir el parche: `pm4-app/frontend/vendor/README.md`.

### Etapa 2 — Node runtime 20 → 24 ✅

`Dockerfile` → `node:24-alpine`; `@types/node` → `^24`. Contenedor verificado con backend
(3001) y frontend (5173) arriba.

### Etapa 3 — Toolchain: TypeScript 5.9 + Vite 8.1 + plugin-react 6 ✅

Toolchain modernizado sobre React 18 (aislando breaking changes de Vite/TS de los de React).

### Etapa 4 — React 18 → 19.2 (corazón de la migración) ✅

React 19.2.7 en producción end-to-end. Dos hallazgos que solo aparecieron al forzar una
instalación completa desde cero (no incremental):

1. `@zurich/css-components` tenía el mismo bug de jsx-runtime congelado que
   `web-components` y no se había parcheado en la Etapa 1 — se aplicó el mismo shim.
2. Árbol de React duplicado por estado incremental de los volúmenes Docker (dos copias
   físicas de `react`, 18.3.1 y 19.2.7) — se corrigió vaciando `node_modules` y reinstalando
   desde cero con el lockfile borrado.

Verificado: una sola copia física de react/react-dom deduplicada; build/lint verdes;
`docker build --no-cache` fresco sin errores; sin el crash de `ReactCurrentOwner`;
`ds-catalog` idéntico al baseline (incluye `ZrModal` con su `useEffect` de cleanup).

### Etapa 5 — Backend Express 4 → 5 ✅

Incluyó el fix obligatorio del catch-all SPA (`app.get('*', ...)` → `app.get('/*splat', ...)`,
path-to-regexp v8 rompe con el wildcard suelto). Upload de archivos (multer +
`POST /api/requests/:request_id/files`) verificado end-to-end.

### Etapa 6 — Endurecimiento, docs y merge ✅

Regresión completa: las 22 pantallas de `App.tsx` + `ds-catalog` renderizan sin `Error de
Render` ni errores de consola. `pm4-app/CLAUDE.md` actualizado con el stack nuevo y la
advertencia de no correr `npm update` sobre `@zurich/*`. **El merge de `migracion/react19` a
`main` fue decisión explícita del usuario de hacerlo él mismo** — confirmar en el historial
de `main` si ya ocurrió.

### Etapa 7 (paralela) — Microservicio Python

No confirmada en las memorias del proyecto al momento de archivar este documento — verificar
`pm4-app/cotizador-service/Dockerfile` si se necesita el estado actual.

---

## 5. Anexo A — Solución ZDS: vendorizado + shim (detalle técnico, sigue vigente)

**Los 4 paquetes vendorizados** (todos 0.8.1): `css-components`, `web-components`,
`design-tokens`, `dev-utils`.

### A.1 Ampliar el peer dependency (arregla el ERESOLVE de instalación)
En el `package.json` de cada `.tgz`:
```jsonc
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "vue": "^3.0.0"
}
```

### A.2 Shim del jsx-runtime (arregla el crash de runtime + símbolo de elemento)
Reemplazar el contenido de `dist/react/jsx-runtime.js` (y su equivalente CJS) dentro del
`.tgz` por:
```js
// Shim: usar el jsx-runtime REAL de la versión de React instalada,
// en vez de la copia congelada de React 18 que ZDS empaquetó.
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
export const j = { jsx, jsxs, Fragment };
export { jsx, jsxs, Fragment };
```

### A.3 Cablear en package.json
```jsonc
"dependencies": {
  "@zurich/css-components": "file:vendor/zurich-css-components-0.8.1.tgz",
  "@zurich/web-components": "file:vendor/zurich-web-components-0.8.1.tgz"
},
"overrides": {
  "@zurich/design-tokens": "file:vendor/zurich-design-tokens-0.8.1.tgz",
  "@zurich/dev-utils": "file:vendor/zurich-dev-utils-0.8.1.tgz"
}
```

### A.4 Por qué esto es permanente y reproducible
- No depende de `--legacy-peer-deps` ni flags de npm en cada install.
- No re-descarga de `registry.npmjs.org` → inmune a un eventual *unpublish* del paquete decomisionado.
- El shim vive dentro del artefacto vendorizado y commiteado → todo dev/CI/Docker obtiene exactamente el mismo comportamiento con `npm ci`.

**Repetir este patrón:** si otro paquete `@zurich/*` (o cualquier dependencia decomisionada)
resulta incompatible con una versión futura de React, este es el procedimiento a replicar:
localizar el punto de acceso a internals de React empaquetado, vendorizar, parchear ese único
punto, ampliar el peer.

---

## 6. Anexo B — Express 5: breaking changes que aplicaron aquí

| Cambio | ¿Aplicó? | Acción |
|---|---|---|
| `'*'` suelto en rutas inválido (path-to-regexp v8) | **Sí** — `server.ts` | Reescrito a `app.get('/*splat', ...)` |
| `:param?` opcional → ahora `{:param}` | No (no se usaban) | — |
| `app.del()` removido | No | — |
| `res.sendfile()` (minúscula) removido | No (se usa `sendFile`) | — |
| `req.param()` removido | No | — |
