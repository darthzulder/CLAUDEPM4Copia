# Plan de migración a React 19.2 — PM4 App (Zurich Colombia)

> **Estado:** propuesta aprobada para ZDS vía **Producción (vendorizado permanente + shim)**.
> **Fecha:** 2026-07-01 · **Autor:** análisis Claude Code · **Objetivo:** dejar todo el stack (frontend + backend + runtime) en su versión más actual y estable, con React **19.2.7** como meta principal.
> **Regla de oro:** la migración avanza por **etapas verificables**. No se pasa a la etapa N+1 hasta que el *gate* de la etapa N esté ✅. Todo ocurre en un worktree/branch aislado; `main` no se toca hasta el merge final.

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
- **Paquete decomisionado (31-dic-2025):** no habrá release oficial que lo arregle → la solución debe ser **nuestra** (vendorizado + shim).

---

## 2. Tabla de versiones (actual → objetivo)

### Frontend (`pm4-app/frontend/package.json`)

| Paquete | Actual | Objetivo | Nota |
|---|---|---|---|
| `react` | 18.3.1 | **19.2.7** | meta principal |
| `react-dom` | 18.3.1 | **19.2.7** | |
| `@types/react` | 18.3.x | **19.2.17** | |
| `@types/react-dom` | 18.3.x | **19.2.3** | |
| `react-hook-form` | 7.52.1 | **7.80.0** | peer ya `^16.8‖^17‖^18‖^19` |
| `axios` | 1.7.2 | **1.18.1** | |
| `vite` | 5.3.3 | **8.1.2** | ⚠️ **3 majors**; requiere Node ≥22.12 |
| `@vitejs/plugin-react` | 4.3.1 | **6.0.3** | requiere `vite ^8` |
| `typescript` | 5.5.3 | **5.9.x** (recomendado) · 6.0.3 opcional | ⚠️ TS 6 es major; verificar `typescript-eslint` antes |
| `@typescript-eslint/parser` | 8.62.0 | última 8.x compatible con el TS elegido | verificar rango soportado |
| `eslint` | 10.5.0 | mantener/última 10.x | ya moderno |
| `eslint-plugin-react-hooks` | 7.1.1 | última 7.x | v7 soporta React 19 |
| `@zurich/css-components` | 0.8.1 | **vendorizado** `file:vendor/...` | ver §5 |
| `@zurich/web-components` | 0.8.1 | **vendorizado + shim jsx-runtime** | ver §5 |
| `@zurich/design-tokens` | 0.8.1 (transitivo) | **vendorizado** | ver §5 |
| `@zurich/dev-utils` | 0.8.1 (transitivo) | **vendorizado** | ver §5 |

### Backend (`pm4-app/backend/package.json`)

| Paquete | Actual | Objetivo | Nota |
|---|---|---|---|
| `express` | 4.19.2 | **5.2.1** | ⚠️ major; ver §6 (fix wildcard) |
| `@types/express` | 4.17.21 | **5.0.6** | |
| `multer` | 2.1.1 | **2.2.0** | compatible con Express 5 |
| `axios` | 1.7.2 | **1.18.1** | |
| `cors` | 2.8.5 | mantener (es la última 2.x) | |
| `@types/cors` | 2.8.17 | mantener | |
| `dotenv` | 16.4.5 | última 16.x | menor |
| `tsx` | 4.16.0 | **4.22.4** | |
| `typescript` | 5.5.3 | igualar al del frontend | |
| `@types/node` | 20.14.9 | **^24** | igualar al Node runtime |

### Raíz / runtime

| Ítem | Actual | Objetivo | Nota |
|---|---|---|---|
| `Dockerfile` base | `node:20-alpine` | **`node:24-alpine`** | Node 20 salió de LTS activo; Node 24 = Active LTS; requerido por Vite 8 |
| `concurrently` (raíz) | 8.2.2 | última 9.x (opcional) | menor |

### Microservicio Python (`pm4-app/cotizador-service`) — **track paralelo, no bloquea React**

| Ítem | Actual | Objetivo |
|---|---|---|
| base image | `python:3.11-slim` | `python:3.13-slim` |
| `flask` / `gunicorn` / `openpyxl` | `>=` sueltos | pinear a última estable de cada uno |

> Se migra como etapa independiente (Etapa 7); su fallo o éxito no afecta el frontend/backend.

---

## 3. Estrategia general

- **Aislamiento:** todo el trabajo en un worktree/branch (`migracion/react19`). `main` intacto hasta el merge final validado.
- **Reproducibilidad:** cada etapa termina con `package-lock.json` regenerado y commiteado; build con `npm ci` (no `npm install`) para reflejar el entorno real de Docker.
- **Entorno de comandos:** según el dev, `npm` corre en local **o** dentro del contenedor. En Docker: anteponer `docker exec -w /app pm4-app-container ` y `docker restart pm4-app-container` para validar visual (no hay HMR en el mount).
- **Gate por etapa:** cada etapa tiene un checklist ✅ obligatorio. Comandos base de verificación:
  ```bash
  npm run build --workspace=frontend    # tsc + vite build
  npm run build --workspace=backend     # tsc
  npm run lint  --workspace=frontend    # eslint (guardrail de imports @zurich)
  ```
- **Verificación visual:** `?screen=ds-catalog` renderiza los ~25 componentes de la fachada → es el detector de regresión principal del DS. Complementar con las pantallas reales (`?screen=cotizador-fast-flow`, etc.).
- **Rollback:** al ser worktree aislado, el rollback de cualquier etapa es `git reset`/descartar; el rollback global es "no mergear". Cero riesgo para `main`.

---

## 4. Etapas

### Etapa 0 — Baseline y preparación

**Objetivo:** capturar el estado verde actual (React 18) como referencia de comparación y crear el aislamiento.

**Acciones:**
- Crear worktree/branch `migracion/react19`.
- Ejecutar los 3 builds/lint actuales y confirmar que pasan **hoy** (baseline verde).
- Capturar screenshots de `?screen=ds-catalog` y de cada pantalla implementada en React 18 (carpeta `outputs/baseline-r18/`) para diffing visual posterior.
- Copiar `package-lock.json` actual como `package-lock.baseline.json` (referencia).

**Gate ✅:**
- [ ] `build frontend`, `build backend`, `lint frontend` verdes en React 18.
- [ ] Screenshots de baseline guardados.
- [ ] Worktree aislado creado; `main` sin cambios.

---

### Etapa 1 — Vendorizado de ZDS + shim jsx-runtime (sobre React 18)

**Objetivo:** blindar ZDS y aplicar el shim **antes** de tocar React, para aislar "¿el vendorizado rompió algo?" de "¿React 19 rompió algo?". Sobre React 18 el shim es un no-op (re-exporta el runtime 18 real) → cualquier cambio visual aquí sería un bug del vendorizado, no de React.

**Acciones:** (detalle técnico en §5)
1. `npm pack` de los 4 paquetes `@zurich/*@0.8.1` → `.tgz` en `frontend/vendor/`.
2. En cada `.tgz` (extraer, editar, re-empaquetar):
   - Ampliar `peerDependencies.react`/`react-dom` a `^18 || ^19` (elimina el ERESOLVE).
   - En `web-components`: reemplazar `dist/react/jsx-runtime.js` por el **shim** que re-exporta `react/jsx-runtime`.
3. `frontend/package.json`: cambiar los `@zurich/*` a `file:vendor/<paquete>.tgz` + `overrides` para transitivos.
4. Regenerar `package-lock.json` y `npm ci`.

**Verificación específica (rigurosa):**
```bash
# En el dist vendorizado, el ÚNICO archivo que puede tocar internals/símbolo viejo
# debe ser jsx-runtime.js (que ya reemplazamos). Cualquier otra coincidencia = revisar.
grep -rn "ReactCurrentOwner\|__SECRET_INTERNALS\|react\.element" frontend/vendor-extracted/dist
```

**Gate ✅:**
- [ ] `npm ci` instala sin ERESOLVE ni descargas a `registry.npmjs.org` de `@zurich/*`.
- [ ] El grep anterior no revela otro punto de acceso a internals fuera del shim.
- [ ] App corre en **React 18** idéntica al baseline (ds-catalog + pantallas sin diff visual).
- [ ] `build`/`lint` verdes.

---

### Etapa 2 — Node runtime 20 → 24

**Objetivo:** subir el runtime (prerequisito de Vite 8) de forma aislada, aún con Vite 5 y React 18.

**Acciones:**
- `pm4-app/Dockerfile`: `FROM node:20-alpine` → `FROM node:24-alpine`.
- `backend/package.json`: `@types/node` → `^24`.
- Rebuild de la imagen Docker.

**Gate ✅:**
- [ ] `docker build` OK; contenedor levanta backend (3001) y frontend (5173).
- [ ] `/health` responde OK.
- [ ] App visualmente idéntica al baseline (nada de React/Vite tocado aún).
- [ ] `build`/`lint` verdes sobre Node 24.

---

### Etapa 3 — Toolchain de build: TypeScript + Vite 8 + plugin-react 6

**Objetivo:** modernizar el toolchain **sin** cambiar aún la versión de React (plugin-react 6 soporta React 17/18/19). Aísla los breaking changes de Vite/TS de los de React.

**Acciones:**
- `typescript` → **5.9.x** (recomendado). Evaluar `@typescript-eslint/parser` compat; solo si soporta TS 6, considerar 6.0.3 (con su propio sub-gate).
- `vite` 5.3.3 → **8.1.2**; `@vitejs/plugin-react` 4.3.1 → **6.0.3**.
- Revisar `vite.config.ts`: la config actual (`plugins: [react()]`, `envPrefix`, `define`, `server.proxy`) es estándar y debería seguir válida; verificar cambios de API de Vite 6/7/8 (p. ej. defaults de `build.target`, opciones de `server`).
- Revisar `tsconfig.json` frente a TS nuevo (`moduleResolution: "bundler"` sigue válido).

**Gate ✅:**
- [ ] `vite build` y `vite dev` verdes; `vite preview` sirve el build.
- [ ] `tsc` sin errores nuevos.
- [ ] `lint` verde (o parser ajustado si se movió TS).
- [ ] App visualmente idéntica al baseline (aún React 18).
- [ ] Consola del navegador sin errores nuevos.

---

### Etapa 4 — React 18 → 19.2 (el corazón de la migración)

**Objetivo:** flipear a React 19.2.7. Aquí el shim vendorizado de la Etapa 1 pasa a re-exportar el runtime **19** → demuestra su valor.

**Acciones:**
- `react` / `react-dom` → **19.2.7**; `@types/react` → **19.2.17**; `@types/react-dom` → **19.2.3**.
- `react-hook-form` → **7.80.0**; `axios` (frontend) → **1.18.1**.
- Revisar `main.tsx` (ya usa `createRoot`+`StrictMode` → sin cambios esperados).
- No se esperan cambios de código propio (grep previo = 0 patrones legacy).

**Verificación específica:**
- Confirmar **ausencia** del error `Cannot read properties of undefined (reading 'ReactCurrentOwner')` (era el crash esperado sin el shim).
- Verificar asignación de props a custom elements: React 19 asigna props coincidentes como *propiedades* nativamente y ZDS también lo hace vía refs; confirmar que coexisten sin doble-efecto visible.

**Gate ✅:**
- [ ] App carga sin el error de `ReactCurrentOwner` ni warnings de "not a valid React element".
- [ ] `?screen=ds-catalog`: los ~25 componentes renderizan e interactúan igual que el baseline (inputs, selects, radios, date, modal, tabs, table, alert, badge, file-input, stepper, calendar, loader…).
- [ ] Pantallas reales: formulario se pre-popula (`reset(task.data)`), valida (react-hook-form), y hace submit.
- [ ] Consola del navegador limpia (sin errores nuevos; los warnings de deprecación de `forwardRef` son aceptables/informativos).
- [ ] `build`/`lint` verdes.

---

### Etapa 5 — Backend Express 4 → 5

**Objetivo:** modernizar el backend/proxy. Independiente del frontend.

**Acciones:**
- `express` 4.19.2 → **5.2.1**; `@types/express` → **5.0.6**; `multer` → **2.2.0**; `axios` (backend) → **1.18.1**; `tsx` → **4.22.4**.
- **Fix obligatorio de Express 5** en `backend/src/server.ts:25`: el catch-all SPA `app.get('*', ...)` **rompe** con path-to-regexp v8. Reescribir como:
  ```ts
  // Express 5: '*' suelto ya no es válido. Usar wildcard nombrado o middleware final.
  app.get('/*splat', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  ```
  (alternativa: `app.use((_req, res) => res.sendFile(...))` como último middleware.)
- Auditar el resto de rutas en `pm4.routes.ts`: usan solo `:params` nombrados (sin wildcards ni `:x?` opcionales) → sin cambios esperados. Confirmar que no se usan APIs removidas en Express 5 (`app.del`, `res.sendfile`, `req.param()`).

**Gate ✅:**
- [ ] `build backend` (tsc) verde.
- [ ] Backend levanta; `/health` OK.
- [ ] Proxy funciona: `GET /api/tasks/{id}?include=data`, `PUT /api/tasks/{id}`.
- [ ] **Upload de archivos** (multer + `POST /api/requests/:request_id/files`) funciona end-to-end.
- [ ] Fallback SPA (`isProd`) sirve `index.html` en rutas no-API.

---

### Etapa 6 — Endurecimiento, docs y merge

**Objetivo:** cerrar con calidad y dejar el repo consistente.

**Acciones:**
- Regresión visual completa: ds-catalog + todas las pantallas implementadas vs. baseline.
- `npm ci` limpio desde cero (simula build de Docker) + `docker build` + `docker restart` y humo manual.
- Actualizar `pm4-app/CLAUDE.md` (versiones, nota del vendorizado/shim) y las memorias del proyecto.
- `graphify update .` para refrescar el grafo.
- Merge de `migracion/react19` a `main`.

**Gate ✅:**
- [ ] Todas las pantallas sin regresión visual ni funcional.
- [ ] `npm ci` reproducible + `docker build` verde desde cero.
- [ ] Docs y memorias actualizadas; grafo regenerado.
- [ ] PR revisado y mergeado.

---

### Etapa 7 (paralela/opcional) — Microservicio Python

**Objetivo:** actualizar `cotizador-service` (no bloquea nada anterior).

**Acciones:**
- `Dockerfile`: `python:3.11-slim` → `python:3.13-slim`.
- `requirements.txt`: pinear versiones exactas de `flask`, `gunicorn`, `openpyxl`.

**Gate ✅:**
- [ ] `docker build` del servicio OK; responde en `:5001`.
- [ ] `cotizador-service` sirve las peticiones que consume el backend (`/cotizador/calcular`).

---

## 5. Anexo A — Solución ZDS: vendorizado + shim (detalle)

**Los 4 paquetes a vendorizar** (todos 0.8.1): `css-components`, `web-components`, `design-tokens`, `dev-utils`.

### A.1 Ampliar el peer dependency (arregla el ERESOLSE de instalación)
En el `package.json` de cada `.tgz` (al menos `web-components`):
```jsonc
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "vue": "^3.0.0"
}
```

### A.2 Shim del jsx-runtime (arregla el crash de runtime + símbolo de elemento)
Reemplazar el contenido de `dist/react/jsx-runtime.js` dentro del `.tgz` de `web-components` por:
```js
// Shim: usar el jsx-runtime REAL de la versión de React instalada (19.2),
// en vez de la copia congelada de React 18 que ZDS empaquetó.
// Arregla: (1) crash por ReactCurrentOwner removido en React 19;
//          (2) símbolo de elemento react.element -> react.transitional.element.
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
export const j = { jsx, jsxs, Fragment };
export { jsx, jsxs, Fragment };
```
> Verificar contra el `jsx-runtime.js` original qué *named exports* consume el resto del `dist` (se observó `import { j } from "./jsx-runtime.js"`; exportar también `jsx/jsxs/Fragment` por si algún chunk los usa directo).

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

### A.4 Por qué esto es "permanente y reproducible"
- No depende de `--legacy-peer-deps` ni flags de npm en cada install.
- No re-descarga de `registry.npmjs.org` → inmune a un eventual *unpublish* del paquete decomisionado.
- El shim vive dentro del artefacto vendorizado y commiteado → todo dev/CI/Docker obtiene exactamente el mismo comportamiento con `npm ci`.

---

## 6. Anexo B — Express 5: breaking changes que aplican aquí

| Cambio | ¿Aplica? | Acción |
|---|---|---|
| `'*'` suelto en rutas inválido (path-to-regexp v8) | **Sí** — `server.ts:25` | Reescribir a `app.get('/*splat', ...)` o middleware final |
| `:param?` opcional → ahora `{:param}` | No (no se usan) | — |
| `app.del()` removido | No | — |
| `res.sendfile()` (minúscula) removido | No (se usa `sendFile`) | — |
| `req.param()` removido | No | — |
| `express.json()` / `express.static()` | Sin cambios | — |
| Rutas con `:id` nombradas | Sin cambios | — |

---

## 7. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Shim ZDS no cubre algún chunk que también accede a internals | Baja | Alto | Grep del `dist` vendorizado en Etapa 1 antes de tocar React |
| Vite 5→8 (3 majors) rompe la config de build | Media | Medio | Etapa 3 aislada con React 18; rollback = mantener Vite 5 y posponer |
| TS 6 incompatible con `typescript-eslint` instalado | Media | Bajo | Objetivo primario TS 5.9.x; TS 6 solo tras verificar parser |
| React 19 asigna props a custom elements distinto que ZDS | Baja | Medio | Verificación explícita en Etapa 4 vía ds-catalog |
| Express 5 rompe el proxy/upload | Baja | Alto | Etapa 5 aislada; gate de upload end-to-end |
| Docker sirve CSS/JS obsoleto tras cambios | Media | Bajo | `docker restart pm4-app-container` (no hay HMR en el mount) |

---

## 8. Orden de dependencia (resumen visual)

```
Etapa 0  Baseline + worktree
   │
Etapa 1  Vendorizado ZDS + shim  (sobre React 18 → aísla el vendorizado)
   │
Etapa 2  Node 20 → 24            (prerequisito de Vite 8)
   │
Etapa 3  TS + Vite 8 + plugin-react 6  (sobre React 18 → aísla el toolchain)
   │
Etapa 4  React 18 → 19.2 + react-hook-form 7.80   ← corazón
   │
Etapa 5  Express 4 → 5 (+ fix wildcard, multer, axios)   [backend, independiente]
   │
Etapa 6  Endurecimiento + docs + graphify + merge
   ┄
Etapa 7  (paralela) Python cotizador-service
```

Cada flecha es un **gate ✅**. No se cruza sin verde.
