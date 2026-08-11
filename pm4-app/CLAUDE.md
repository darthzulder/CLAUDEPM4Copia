# PM4 App — Contexto para Claude Code

## Qué es este proyecto

App React + Express que actúa como **iframe dentro de ProcessMaker 4** para Zurich Regional (Colombia).
No es un form-builder: cada pantalla es un componente React que replica exactamente el formulario de PM4.
Las pantallas se crean aquí con ayuda de Claude (este chat), **no dentro de PM4**.

**PM4 instance:** la instancia activa es la que define `PM4_BASE_URL` en `pm4-app/.env` — este valor **cambia entre entornos y migraciones** (ya pasó una vez), nunca asumas ni hardcodees un hostname fijo en código o documentación; consulta siempre `.env` para saber contra qué instancia se está corriendo.
**API base:** `/api/1.0`
**Docs OpenAPI:** `../docs (4).json` (un nivel arriba de pm4-app)
**Paquetes JSON de pantallas originales:** `../*.json` (un nivel arriba de pm4-app)

**Stack (migrado a React 19, 2026-07-01):** React 19.2.7 + TypeScript 5.9.3 + Vite 8.1.2
(frontend) · Express 5.2.1 + Node 24 (backend/proxy) · react-hook-form 7.80.0 ·
`@zurich/web-components`/`css-components` 0.8.1 **vendorizados** en `frontend/vendor/*.tgz`
(ver `Bootstrap y registro de ZDS` abajo y `frontend/vendor/README.md`).

---

## Reglas obligatorias para cualquier tarea (LEER PRIMERO)

Aplican a **todo** cambio de código en este proyecto, no solo a pantallas nuevas:

1. **Nomenclatura de campos `qd_*`** — prefijo de tipo + CamelCase inglés, fechas como `str`.
   Ver [`../docs/guides/nomenclatura-variables.md`](../docs/guides/nomenclatura-variables.md).
2. **Nunca inventar UI** — seguir la [Jerarquía de decisión de UI](#jerarquía-de-decisión-de-ui-obligatorio)
   y, si vas a crear algo, revisar primero `frontend/vendor/*.tgz` (contenido real del DS) vía
   [`outputs/react/VENDOR_COMPONENT_CATALOG.md`](outputs/react/VENDOR_COMPONENT_CATALOG.md).
3. **Arquitectura BFF** — toda llamada externa (PM4, `cotizador-service`, futuras APIs) pasa
   por `backend/`, nunca directo desde una pantalla. Ver [Principio arquitectónico: BFF](#principio-arquitectónico-backend-for-frontend-bff).
4. **Tests automatizados obligatorios** para lógica nueva/modificada (frontend y backend) y
   para componentes/pantallas propios. Ver [Tests automatizados (OBLIGATORIO)](#tests-automatizados-obligatorio)
   y [`../docs/guides/testing-conventions.md`](../docs/guides/testing-conventions.md).
5. **Antes de dar una tarea por terminada:** `npm run verify` (build + lint + tests) verde,
   nada roto. Lo fuerzan CI y el hook `pre-commit` — ver
   [`../docs/guides/entorno-local-y-verificacion.md`](../docs/guides/entorno-local-y-verificacion.md).
6. **Llamadas a PM4 siempre por nombre, nunca por ID hardcodeado** — se resuelven a id/uuid
   vía el registro. Ver [Registro de IDs PM4](#registro-de-ids-pm4-colecciones-scripts-procesos).
7. **Comentarios técnicos profesionales en el código** — explican el porqué y el contrato,
   no repiten el nombre de la función. Ver [Comentarios y documentación técnica en el código](#comentarios-y-documentación-técnica-en-el-código).

---

## Cómo se ejecuta

```bash
cd pm4-app   # desde la raíz del repo
npm run dev
```

- **Backend** → `http://localhost:3001` (Express, proxy a PM4 API)
- **Frontend** → `http://localhost:5173` (Vite + React + TS)

URL del iframe en PM4:
```
http://localhost:5173/?screen=cotizador-fast-flow&task_id=123&token=eyJ...
```

---

## ⚠️ Antes de hacer commit / push a git — OBLIGATORIO

Siempre ejecutar el build completo antes de lanzar a git para garantizar que el deploy funcione correctamente:

```bash
npm run verify   # build (frontend + backend) + lint + tests, todo en un comando
```

Si tocaste `cotizador-service/`, correr también:

```bash
docker exec cotizador-service-container sh -c "cd /app && pytest -q"
```

Si algo falla con errores de TypeScript, lint, empaquetado o **tests**, **corregir antes de
commitear**. No commitear con builds rotos ni con tests en rojo — tampoco con un test
preexistente que dejó de pasar por el cambio actual.

Esto está **automatizado en dos capas** (setup y detalle en
[`../docs/guides/entorno-local-y-verificacion.md`](../docs/guides/entorno-local-y-verificacion.md)):
el hook `pre-commit` de `.githooks/` lo corre en local (activar una vez con
`npm run setup:hooks`), y **GitHub Actions** lo corre en cada push/PR — ese último es el gate
real, porque el hook se puede saltar con `--no-verify`.

> Según el entorno de cada dev, `npm` corre en local o dentro del contenedor. Si usas
> Docker, antepón `docker exec -w /app pm4-app-container ` a cada comando y, como no hay
> HMR en el mount, `docker restart pm4-app-container` para validar el cambio visual.

---

## Variables de entorno (`.env` en raíz de pm4-app)

```
PM4_BASE_URL=https://<instancia-pm4-actual>   # instancia activa — ver valor real en .env, no lo copies aquí
PM4_TOKEN=eyJ...          # Bearer token para dev (fallback del backend)
PORT=3001
VITE_TASK_ID=             # task_id fallback para frontend dev
VITE_PM4_TOKEN=           # token fallback para frontend dev
```

El token se resuelve en este orden:
1. Query param `?token=` en la URL del iframe
2. `VITE_PM4_TOKEN` en `.env`

El task_id se resuelve en este orden:
1. Query param `?task_id=` en la URL del iframe
2. `VITE_TASK_ID` en `.env`

---

## Arquitectura de archivos

```
pm4-app/
├── .env                          ← NO subir a git
├── backend/src/
│   ├── server.ts                 ← Express puerto 3001, CORS abierto
│   └── routes/pm4.routes.ts     ← Proxy: lee token del header x-pm4-token o PM4_TOKEN env
└── frontend/src/
    ├── App.tsx                   ← Router: lee ?screen= y carga el componente
    ├── api/pm4Client.ts          ← axios base, inyecta x-pm4-token
    ├── core/
    │   ├── useToken.ts           ← resolveToken() y resolveTaskId()
    │   ├── useTask.ts            ← GET /tasks/{id}?include=data  |  PUT /tasks/{id}
    │   └── useCollection.ts     ← GET /collections/{id}/records
    ├── components/fields/        ← ZdsFields.tsx (fachada única para Zurich DS)
    ├── components/FormSection.tsx
    └── screens/
        └── {screen-slug}/
            ├── variables.ts      ← OPTIONS estáticas, COLLECTIONS ids, tipos TS, WATCHERS
            └── NombrePantalla.tsx  ← Componente React. No crear styles.css por pantalla (DRY).
```

---

## Principio arquitectónico: Backend For Frontend (BFF)

`backend/` **ya es** un BFF puro hoy — proxy + inyección de token, cero llamadas directas
del frontend a PM4 o al `cotizador-service`. Esta sección existe para que **se mantenga
así**:

- Toda integración externa nueva (PM4, `cotizador-service`, cualquier API futura) se agrega
  como ruta en `backend/src/routes/`, nunca se llama directo desde una pantalla.
- El frontend solo habla con rutas **relativas** `/api/*` a través de `api/pm4Client.ts`
  (o el cliente equivalente que corresponda) — nunca un `fetch`/`axios` a un host externo
  desde `screens/` o `components/`.
- El token PM4 y cualquier credencial viven y se resuelven **solo** en `backend/`; el
  frontend nunca los maneja en texto plano más allá del header `x-pm4-token` que ya inyecta
  `pm4Client.ts`.
- **Excepción documentada:** el `<script src="https://www.google.com/recaptcha/api.js">`
  de `RecaptchaModal.tsx` carga un script de terceros (sin credenciales), no es una llamada
  de datos — la verificación del token sí pasa por `backend/` (`POST /api/recaptcha/verify`).

---

## Flujo de datos

```
PM4 genera iframe URL con ?token=&task_id=&screen=
        ↓
App.tsx lee ?screen= → carga el componente correcto
        ↓
useTask() → GET /api/tasks/{task_id}?include=data
        ↓
task.data → form.setValue() (pre-popula todos los campos)
        ↓
Usuario llena el formulario
        ↓
onSubmit → POST /api/requests/{request_id}/files  (un POST por cada archivo)
        ↓
onSubmit → PUT /api/tasks/{task_id}  { status: "COMPLETED", data: formData }
        ↓
PM4 avanza el proceso al siguiente nodo
```

---

## Subida de archivos

Los archivos se suben **antes** de completar la tarea, usando `POST /requests/{request_id}/files`.
El `request_id` viene de `task.process_request_id` (devuelto por `useTask`).

### Patrón de implementación

**1. `fileRegistry` en el componente raíz** — un `useRef(new Map<string, File>())` que acumula los archivos mientras el usuario navega entre tabs/secciones:

```tsx
const fileRegistry = useRef(new Map<string, File>());
// Se pasa como prop hacia abajo: SeccionProductos → SeccionDyO / SeccionCC / etc.
```

**2. Registro en cada sección** — cuando el usuario selecciona un archivo:

```tsx
onChange={(e) => {
  const file = e.target.files?.[0];
  if (file) {
    setValue(docKey, file.name as never);       // nombre en el form (para mostrar)
    fileRegistry.current.set(docKey, file);     // binario en el registry (para subir)
  }
}}
```

El `docKey` es el nombre del campo en PM4, p.ej. `frm_dyo_doc_01_nombre`. PM4 lo recibe como `?data_name=` y lo asocia al request.

**3. Upload en `onSubmit`** — antes de `completeTask`:

```tsx
for (const [docKey, file] of fileRegistry.current.entries()) {
  const fd = new FormData();
  fd.append('file', file);
  await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
}
await completeTask(payload);
```

**4. Endpoint en el backend** — `POST /api/requests/:request_id/files`
- Middleware: `multer({ storage: multer.memoryStorage() }).single('file')`
- Reenvía a PM4 como `multipart/form-data` con `form-data` + axios
- Usa el mismo token que el resto del proxy (`x-pm4-token`)
- PM4 responde `{ message: "The file was uploaded.", fileUploadId: <number> }`

### Campos de documento por producto (ff-fl)

| Producto | Campos de nombre |
|----------|-----------------|
| D&O      | `frm_dyo_doc_01_nombre`, `frm_dyo_doc_02_nombre`, `frm_dyo_doc_03_nombre` |
| CC       | `frm_cc_doc_01_nombre`, `frm_cc_doc_02_nombre`, `frm_cc_doc_03_nombre` |
| PDySI    | `frm_pdysi_doc_01_nombre`, `frm_pdysi_doc_02_nombre`, `frm_pdysi_doc_03_nombre` |
| PI       | `frm_pi_doc_01_nombre`, `frm_pi_doc_02_nombre`, `frm_pi_doc_03_nombre` |

---

## API PM4 (endpoints disponibles en el proxy)

| Acción | Método | Ruta proxy |
|--------|--------|------------|
| Obtener tarea con datos | GET | `/api/tasks/{id}?include=data` |
| Completar / derivar tarea | PUT | `/api/tasks/{id}` → `{ status: "COMPLETED", data: {} }` |
| Listar procesos iniciables | GET | `/api/start_processes` |
| Iniciar proceso | POST | `/api/process_events/{process_id}?event={node_id}` |
| Registros de colección | GET | `/api/collections/{id}/records?per_page=500` |
| Ejecutar script (watcher) | POST | `/api/scripts/{id}/execute` |
| Datos del caso (request) | GET | `/api/requests/{id}` |

---

## Registro de IDs PM4 (colecciones, scripts, procesos)

**Regla permanente, no solo de migración:** los IDs numéricos de PM4 (colección, script,
proceso/evento) son específicos de cada instancia y cambian al migrar/reimportar (ya pasó
una vez: la instancia de referencia cambió de `mxzurich...` a la que define `PM4_BASE_URL`
hoy). Por eso **cualquier código nuevo** que necesite referenciar una colección/script/
proceso de PM4 se resuelve **por nombre desde el primer día** — no solo cuando toca migrar
de instancia. El código **no debe hardcodear estos IDs directamente** (queda deuda legada
que aún lo hace; no la tomes como precedente) — cada `CollectionDef`/script/proceso se
resuelve a través de:

- **`frontend/src/config/pm4-registry.json`** — fuente de verdad única: mapea una clave
  estable (slug de negocio, o `uuid` nativo de PM4 para scripts) al ID numérico de la
  instancia activa. Incluye `title` (para detectar drift) y `note` (para colecciones/
  scripts con problemas conocidos — ver notas `⚠️` en el propio JSON).
- **`core/pm4Resolve.ts`** — `resolveCollectionId(slug, fallback)`, `resolveScriptId(slug,
  fallback)`, `resolveProcessEvent(slug, fallback)`. Si el slug no está en el registro,
  cae al `fallback` (el id que tenía el código antes) y avisa por consola — permite migrar
  incremental sin romper nada.
- **`scripts/pm4-registry-sync.mjs`** — script de mantenimiento que verifica/genera el
  registro contra la instancia PM4 real (usa `PM4_BASE_URL`/`PM4_TOKEN` de `.env`):
  ```bash
  node scripts/pm4-registry-sync.mjs --check    # solo reporta, no escribe
  node scripts/pm4-registry-sync.mjs --update   # resuelve y escribe todo automáticamente
  ```
  **Supuesto de automatización (confirmado por el usuario):** el proceso de migración de
  este proyecto entre instancias PM4 preserva los NOMBRES exactos (título de colección,
  nombre de proceso, nombre de evento BPMN) — solo cambian los IDs numéricos. Si en origen
  hay un nombre que colisionaría con uno ya existente en destino, se renombra en origen
  **antes** de migrar para que los nombres sigan siendo idénticos 1:1. Bajo ese supuesto,
  `--update` resuelve y reescribe **todo** por nombre (collections, processes/eventos por
  `eventName`) o por `uuid` (scripts, aún más confiable) — sin edición manual en el caso
  normal. Si un nombre no se encuentra en destino, sale como `[MISSING]`/`[EVENTO NO
  RESUELTO]` — eso sí requiere revisión humana (o indica que el supuesto no se cumplió).

**Enganchado al build (`prebuild` en `package.json`):** cada `npm run build` (local o en
Render) corre primero `node scripts/pm4-registry-sync.mjs --update --ci` — el flag `--ci`
hace que **nunca bloquee el deploy**: si PM4 no responde (red, token vencido, instancia
caída) o faltan `PM4_BASE_URL`/`PM4_TOKEN` en el entorno, se omite el sync y sigue con el
`pm4-registry.json` ya commiteado; si hay entradas sin resolver, imprime un banner bien
visible en el log de build pero igual continúa. Esto significa que **en Render, mientras
`PM4_BASE_URL`/`PM4_TOKEN` estén configurados como env vars** (ya lo están, ver
`render.yaml`, disponibles en build y runtime), cada deploy resuelve el registro contra la
instancia real automáticamente — no hace falta correr `--update` a mano antes de un deploy
normal. Sí seguí corriendo `--check` manualmente después de migrar de instancia para revisar
el reporte con calma antes de confiar ciegamente en el próximo deploy.

**OBLIGATORIO al migrar de instancia PM4:** correr `pm4-registry-sync.mjs --check` primero
para ver el diff, y luego `--update` para aplicarlo (o simplemente re-deployar — el
`prebuild` lo hace solo).

**OBLIGATORIO en cualquier código nuevo, no solo al migrar:** nunca introducir un ID
hardcodeado suelto en `collections.ts`/`variables.ts`/`fields.ts` (ni en un `WATCHERS`,
`dataSourceId`, `scriptId` o similar) — todo pasa por `resolveCollectionId`/
`resolveScriptId`/`resolveProcessEvent`, con el ID que tendrías puesto de todos modos como
`fallback`. Un ID suelto que hoy "funciona" porque coincide con la instancia activa es
exactamente el tipo de deuda que rompe en la próxima migración sin avisar.

⚠️ Varias colecciones de FAST-FLOW (`naic`, `correosIntermediari`/`correosIntermediario`,
`comerciales`, `suscriptores`, `actividadNaic`) y el script `consultarClienteTiaCuw` (id 50)
están **verificadas como incorrectas/huérfanas** contra la instancia actual (no corresponden
a ninguna colección/script real, o apuntan a uno con otro propósito) — es código legado,
diferido para revisión de negocio aparte. Ver las notas `⚠️` en `pm4-registry.json` y los
comentarios en `core/collections.ts`.

---

## Tests automatizados (OBLIGATORIO)

Necesitan test, si son nuevos o los estás modificando:
- **Lógica pura** — `core/*.ts`, helpers, `backend/src/lib/*.ts`, `cotizador-service/app.py`.
- **Componentes propios** (`components/*.tsx`) y **pantallas** — al menos un smoke test con
  React Testing Library (`.test.tsx`, project `components` de Vitest; confirmado compatible
  con los custom elements de `@zurich/web-components`).
- **Rutas nuevas del backend** (`backend/src/routes/`) — la lógica no trivial se extrae a
  `backend/src/lib/` y se testea ahí, como se hizo con `lib/token.ts`. Es donde la
  [regla de BFF](#principio-arquitectónico-backend-for-frontend-bff) manda toda integración
  externa nueva, así que es donde más importa.

Comandos:
```bash
npm run verify                      # build + lint + tests (frontend y backend) — el gate completo
npm run test --workspace=frontend   # vitest — projects 'logic' (node) y 'components' (jsdom)
npm run test --workspace=backend    # vitest — lib/*.ts
pytest -q                           # desde cotizador-service/
```

- Qué necesita test y cómo escribirlo (incluidas las 4 trampas de testear controles del DS
  bajo jsdom): [`../docs/guides/testing-conventions.md`](../docs/guides/testing-conventions.md).
- Cómo se fuerza que corran (CI + hook `pre-commit`) y setup del entorno local:
  [`../docs/guides/entorno-local-y-verificacion.md`](../docs/guides/entorno-local-y-verificacion.md).

Los tests automatizados **no reemplazan** la verificación manual del flujo de datos real
(precarga desde PM4, watchers, subida de archivos) — esa sigue siendo en Docker vía
`?screen=<slug>`, como ya se practica.

### Estado actual — la cobertura es deuda, no un hecho cumplido

Esta regla es un **estándar hacia adelante**, no una descripción del repo.

**Tanda 1 pagada (ago-2026): 315 tests en 13 archivos** (desde 43 en 5). Se cubrió la lógica
donde un fallo es silencioso y caro:
- `core/businessDays.ts` — `parsePm4Date` (la trampa `DD/MM` vs `MM/DD`) y toda la
  matemática de días hábiles/SLA. Es una **réplica en cliente del script PM4
  `COL_UTIL_Dias_Habiles` (id 95)**: dos implementaciones de la misma regla, así que estos
  tests fijan el lado cliente.
- `core/pm4Resolve.ts` — la rama de *fallback*, que hoy está muerta (todos los slugs
  resuelven) y se activa en la próxima migración de instancia.
- `core/collections.test.ts` — **guarda de migración**: valida las 52 colecciones contra
  `pm4-registry.json`, así que un slug que se caiga se ve en el test y no en un `console.warn`
  que nadie mira.
- `core/fechaHora.ts`, `resolveFileId`, `resolvePmql`/`resolvePath`.
- Backend: `lib/recaptcha.ts` (el **fail-open** siempre con `verified:false`) y `lib/tasks.ts`
  (el selector de tarea activa y su fallback).

**Lo que sigue en deuda:** ~1 de 15 componentes y ~1 de 24 pantallas tienen smoke test. El
hook `useTask` completo (con su contrato de dos PUT para reasignar) sigue sin cubrir.

Qué implica en la práctica:
- **Lo que toques, lo cubrís.** No hace falta un backfill masivo antes de poder trabajar; sí
  hace falta que todo cambio nuevo llegue con su test.
- **Si vas a modificar un módulo sin tests**, escribirle el test primero (o en el mismo
  commit) es parte del cambio, no un extra opcional.
- Al testear fechas, recordá que la zona horaria está **fijada** en `vitest.config.ts`
  (`America/Bogota`) — ver `docs/guides/testing-conventions.md`.

---

## Pantallas implementadas

### `cotizador-fast-flow`
- **Archivo JSON original:** `54_9f760fcd-..._COL - FF - Form - Cotizador Fast Flow.json`
- **Subforms en PM4:** Información general, Información tomador, Datos cotización, Propuesta económica, Plan de pago
- **Colecciones:** NAIC (ID 2), Intermediarios (ID 4), Correos (ID 5)
- **Watchers:** Obtener token Tia (on_load), Obtener Token ZDiligence (on_load), Tomador NIT (on change frm_tomador_numDoc)
- **Variables clave:** `frm_gen_*`, `frm_tomador_*`, `frm_tom_*`, `frm_cot_*`, `frm_plan_*`

---

## Cómo agregar una nueva pantalla

1. Crear carpeta: `frontend/src/screens/{slug}/`
2. Crear `variables.ts` con:
   - `OPTIONS` — opciones estáticas de selects/radios
   - `COLLECTIONS` — colecciones PM4 de los selects dinámicos, **resueltas por nombre** con
     `resolveCollectionId('slug', fallback)`; nunca un id numérico suelto (ver
     [Registro de IDs PM4](#registro-de-ids-pm4-colecciones-scripts-procesos))
   - `WATCHERS` — definición de watchers (campo que observan, script vía
     `resolveScriptId('slug', fallback)`, `run_onload`)
   - Interface TypeScript de los datos del formulario
3. **No crear `styles.css` local.** Sigue la **Jerarquía de decisión de UI** (sección abajo): reusar componentes/elementos del DS antes de crear, y CSS custom solo como último recurso. Todo estilo nuevo va **al final de `shared.css`**, DRY y **con tokens** (`--zs-*`, `--zf-*`, `--z-*`/`--zc-*`/`--zg-*`), nunca px/hex crudos. `shared.css` es la única hoja de estilos global permitida.
4. Crear `NombrePantalla.tsx` — componente React (<300 líneas por archivo)
5. Registrar en `App.tsx` en el objeto `SCREENS`
6. Generar `DOCUMENTACION_<slug>.md` en la misma carpeta — no es opcional, es parte del entregable. Ver `../docs/guides/GUIA_DOCUMENTACION_PANTALLAS.md` para la estructura y las reglas de trazabilidad contra `insumos/`.

**Para pedirle a Claude que cree una nueva pantalla**, proporcionar:
- Screenshot del formulario en PM4
- El archivo JSON exportado del paquete (o el título exacto de la screen en PM4)
- Si tiene watchers, cuáles campos disparan qué scripts

---

## Jerarquía de decisión de UI (OBLIGATORIO)

Al construir UI hay **dos ejes** con escaleras distintas. Recorre cada una **de arriba abajo** y baja un escalón solo si el anterior no aplica. Antes de construir, lee `outputs/zds-cheatsheet.md` y `outputs/shared-css-catalog.md` (no el índice).

### Eje A — Elemento *(qué es la cosa: campo, botón, pill, modal, card…)*
1. **Componente propio existente** (ver inventario abajo) o wrapper de `ZdsFields` (`ZdsInput`, `ZdsSelect`, `ActionBar`, `ZdsStatusBadge`, `FormSection`…).
2. **Componente Zurich DS documentado** en `outputs/` → consúmelo vía la fachada `ZdsFields`. **Nunca** importes `@zurich/...` en un screen.
3. **Componente Zurich DS que existe pero NO está documentado** en `outputs/` → **DETENTE y consulta al usuario**: pídele pegar la doc oficial de ZDS, crea el `.md` en `outputs/react/<categoría>/` (plantilla §6.2 del index), y recién entonces úsalo (envuelto en `ZdsFields` si es un control). No inventes props/componentes de memoria.
4. **Nada en el DS** → evalúa crear un **componente propio** (ver criterios).
5. **Último recurso** → CSS custom tokenizado en `shared.css`.

### Eje B — Layout *(cómo se acomoda: stack, fila, grid, alineación)*
1. **Primitivos DS por atributo:** `z-flex` / `z-align` (flex), `z-grid="main"` + `column` (grilla de página). Es lo idiomático; **no escribas `display:flex` a mano** en el markup.
2. **Clase/componente de layout existente:** `form-row.cols-*` (grilla de campos), `FormSection`, `ActionBar`.
3. **Patrón nuevo reutilizable** → clase en `shared.css` **o** componente (ver bifurcación).
4. **Último recurso** → CSS custom tokenizado.

### Regla transversal (SIEMPRE, sin importar el escalón)
- **Solo tokens:** `--zs-*` (espaciado), `--zf-*` (tipografía), `--z-*`/`--zc-*`/`--zg-*` (color). **Nunca** px/hex crudos (excepto `1px` de borde, radios, `line-height`, anchos puntuales).
- **Nombra clases por componente/primitivo, nunca por pantalla.**
- **CSS nuevo va al final de `shared.css`, DRY.**

### ¿Clase o componente nuevo? *(bifurcación del escalón "crear")*
- Concepto de UI reutilizable **con markup/comportamiento** → **componente** semántico (`ActionBar`, `FormRow`).
- Patrón de **solo estilo** sin markup → **clase** en `shared.css`.
- **NO** crear componentes genéricos de layout (`<Flex>`, `<Row>`, `<Col>`) → reinventa los primitivos DS.
- **NO** envolver lo que ya es componente. Umbral de reúso **≥3** (o que encapsule comportamiento real).

### Hechos de `z-flex`/`z-align` (verificados contra el CSS compilado)
- Gaps válidos: `50 / 75 / 100 / 150 / 200 / 300` (= `--zs-*`). **No existe gap `25`** (4px) → ese caso queda como clase CSS.
- `z-flex` por defecto es `align-items: stretch` (la doc local dice "center" y es **falso**).
- **No** pongas `z-flex` sobre `ZrCard`/`ZrForm`/`ZrModal` (tienen su propio layout interno).
- Sintaxis: `z-flex="col:150"` = columna gap 150; fila centrada a la derecha = `z-flex="75" z-align="right:center"`.

## Componentes propios del proyecto (reusar antes de crear)

| Componente | Import | Para qué |
|---|---|---|
| `FormSection` | `components/FormSection` | Card con header azul + body + footer opcional |
| `ActionBar` | `components/ActionBar` | Barra de botones de submit al pie del form |
| `ZdsStatusBadge` | `components/fields/ZdsFields` | Píldora de estado (`success`/`danger`/`info`/`neutral`) sobre `ZrBadge` |
| `ScreenHeader` | `components/ScreenHeader` | Cabecera azul con título/subtítulo + logo Zurich |
| `InfoBar` | `components/InfoBar` | Barra de pares label/valor |
| `HelpModal` | `components/HelpModal` | Contenido de modal de ayuda (se monta dentro de `ZrModal`) |
| `PreviewModal` | `components/PreviewModal` | Modal de vista previa de documento |
| `PdfViewer` | `components/PdfViewer` | Visor de PDF/archivo PM4 vía blob |
| `ResultCard` | `components/ResultCard` | Card centrado de resultado/confirmación (variantes) |
| `DocList` / `DocItem` | `components/DocList`, `components/DocItem` | Lista/fila de documentos (modo upload o validación) |
| `DocCard` | `components/DocCard` | Card de un archivo ya existente (ícono+nombre+meta+acciones), con cuerpo expandible opcional — no confundir con `DocItem` (checklist de documentos requeridos) |
| `RequestFileList` | `components/RequestFileList` | Lista de solo lectura de archivos ya subidos al request (filtra por `data_name`), con previsualizar + descargar |
| `DocSupportUploader` | `components/DocSupportUploader` | Bloque de carga de documentos de soporte |
| `RecaptchaModal` | `components/RecaptchaModal` | Modal con reCAPTCHA v2 (checkbox); `onVerified(token)` al pasar. Site key en `VITE_RECAPTCHA_SITE_KEY`, verificación server-side en `/api/recaptcha/verify` |
| Wrappers de campo | `components/fields/ZdsFields` | `ZdsInput/Select/Radio/Date/Textarea/CheckboxField/Segmented` |

> Mantén esta tabla actualizada al crear/eliminar un componente propio.

---

## Convenciones de código

### Componentes de campo — `ZdsFields.tsx`

Todos los campos de formulario y componentes Zurich DS se importan **exclusivamente** desde:

```tsx
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsDate, ZdsTextarea,
         ZdsCheckboxField, ZdsSegmented, ZdsStatusBadge,
         ZrButton, ZrIcon, ZrModal, ZrForm, ZrCard, ZrTable, ZrAlert } from '../../components/fields/ZdsFields';
```

**Nunca importar directamente de `@zurich/web-components/react/...` en los screens.**

#### Bootstrap y registro de ZDS (dos únicos puntos autorizados)

Todo `@zurich/*` se consume desde dos módulos, enforced por ESLint (`no-restricted-imports`); cualquier otro import directo es error:

- **`zds-setup.ts`** — assets globales del DS: `base.css` (tokens) + `javascript.js` (comportamientos CSS-components). Se importa una vez en `main.tsx`, antes de `shared.css`.
- **`components/fields/ZdsFields.tsx`** — componentes. Importar un wrapper React **auto-registra** su web-component (`z-*`) de forma idempotente (`registerComponent` guarda con `customElements.get()`): el registro ocurre una sola vez, al primer render, y nunca lanza "already defined".

Para habilitar un `z-*` nuevo: re-exportar su wrapper en `ZdsFields` (queda registrado al importarlo). No hay registro manual ni `customElements.define` propio.

**ZDS vendorizado (desde jul-2026):** `@zurich/web-components` y `@zurich/css-components` (0.8.1)
ya no vienen del registro npm público — el ZDS DevKit fue decomisionado (31-dic-2025) y ambos
paquetes están **vendorizados** como `.tgz` en `frontend/vendor/`, referenciados en
`frontend/package.json` via `file:vendor/*.tgz`. Ambos llevan un **parche** que reemplaza su
`dist/react/jsx-runtime.js` (ESM y CJS) por un shim que usa el jsx-runtime real de React en vez
de una copia congelada de React 18 (necesario para React 19 — ver `frontend/vendor/README.md`
para el detalle completo y cómo reproducir el parche). **No actualizar estos `.tgz` a mano ni
correr `npm update` sobre `@zurich/*`** — no hay versión nueva que instalar (el paquete está
descontinuado) y una actualización involuntaria perdería el parche.

| Wrapper | Componente Zurich | Cuándo usar |
|---|---|---|
| `ZdsInput` | `ZrTextInput` + Controller | Texto, email, tel — editable o readOnly |
| `ZdsSelect` | `ZrSelect` + Controller | Dropdown con opciones (con/sin búsqueda) |
| `ZdsRadio` | `ZrRadioSelect` + Controller | Grupo de radio buttons |
| `ZdsDate` | `ZrDateInput` + Controller | Selector de fecha |
| `ZdsTextarea` | `ZrTextarea` + Controller | Texto multilínea |
| `ZdsCheckboxField` | `ZrCheckbox` + Controller | Checkbox booleano |
| `ZdsSegmented` | `ZrSegmentedControl` + Controller | Toggle segmentado (SÍ/NO, etc.) |
| `ZdsStepper` | `ZrStepper` + Controller | Contador de pasos 1-based en `[1, steps]` (wizard/paginador) |
| `ZdsCalendar` | `ZrCalendar` + Controller | Calendario inline (grilla de mes), modelo ISO `YYYY-MM-DD` |
| `ZdsStatusBadge` | `ZrBadge` | Píldora de estado por variante (`success`/`danger`/`info`/`neutral`) |
| Re-exports directos | — | `ZrButton`, `ZrIcon`, `ZrModal`, `ZrForm`, `ZrCard`, `ZrTabs`, `ZrTable`, `ZrAlert`, `ZrBadge`, `ZrChip`, `ZrTag`, `ZrProgressBar`, `ZrFileInput`, `ZrSegmentedControl`, `ZrSidebar`, `ZrTile`, `ZrTooltip`, `ZrInputGroup`, `ZrFieldset`, `ZrStepper`, `ZrCalendar`, `ZrLoader`, `ZrKpiValue`, `ZrEmptyState`, `ZrPagination`, `ZrFooter`, `ZrNavigation`, `ZrStageBanner`, `ZrPromo`, `ZrCheckbox`, `ZrSwitch` — componentes DS que no requieren Controller (`ZrCheckbox`/`ZrSwitch` comparten el bug de vendor `model={false}` descartado en silencio — usar `model={valor ? true : 0}`) |

### Patrón de formulario (react-hook-form + ZdsFields)

```tsx
const { control, handleSubmit, reset, formState: { errors } } = useForm<MiFormData>();

// Los wrappers ZdsXxx usan Controller internamente:
<ZdsInput
  name="campo"
  control={control}
  label="Mi Campo"
  rules={{ required: 'Campo requerido' }}
  required
  error={errors.campo?.message}
/>
```

- `control` reemplaza a `register` para todos los campos ZDS.
- `register` solo se usa para inputs nativos (ej: `<input type="file">`).
- Pre-población desde PM4: `reset(task.data)` actualiza todos los campos en una sola llamada.

### Otras convenciones

- `FormSection` para las secciones con header azul
- Indicadores de carga: usar `ZrLoader` del DS (dimensionable con `--z-loader--size`). No crear spinners CSS custom. El posicionamiento (overlay full-screen) sí es layout propio (`.loading-overlay`).
- `useTask()` maneja loading / error / submitting — siempre mostrar estos estados
- Diseños DRY y ZurichDS: seguir la **Jerarquía de decisión de UI** (arriba). El **layout** se hace con primitivos DS (`z-flex`/`z-align`/`z-grid`), no con `display:flex` a mano; los **elementos** con componentes propios o del DS vía `ZdsFields`. No se permiten `styles.css` locales ni estilos en línea *ad-hoc*. [shared.css](file:///g:/DockerProys/CLAUDEPM4Copia/pm4-app/frontend/src/shared.css) es la única hoja de estilos global y queda reservada a: tablas editables, cards/secciones con estilo de dominio, tipografías (`Capt-12`, `Capt-14`) y grids de campos (`form-row.cols-*`) — siempre con tokens. Las píldoras de estado usan `ZdsStatusBadge` (no clases `.chip`).
- `OPTIONS` en `variables.ts` usan `as const` → pasarlos directamente a los campos (aceptan `readonly`)
- Componente principal < 300 líneas; secciones grandes van como funciones locales en el mismo archivo o archivos separados en la misma carpeta
- **Convención `_desc` (campos de colección):** todo campo respaldado por una colección PM4 guarda el **código** y viaja con una variable compañera `<campo>_desc` con la descripción legible (p.ej. `qd_strChannel="13"` + `qd_strChannel_desc="Internet"`). Se sincroniza con `useSyncDesc(form, campo, options)` (`core/useCollection.ts`) junto al `useCollection` del campo; el resolver de solo lectura es `descOf(options, code)`. Detalle completo en `screens/atencion-cliente/quejas-directas/fields/MAPEO_qd_old_new.md`.
- **Nomenclatura de campos `qd_*`** (prefijo de tipo + CamelCase inglés, fechas como `str`, comentarios en español natural): ver `../docs/guides/nomenclatura-variables.md`.

### Datos pre-cargados desde PM4

**Todas las pantallas siempre reciben datos pre-poblados desde PM4.** El flujo es:
1. PM4 genera la URL del iframe con `?task_id=` o `?case_id=`
2. `useTask()` hace GET al task y obtiene `task.data` con todos los valores del caso
3. Los valores de `task.data` se inyectan en el formulario con `form.setValue()` al montar

Esto significa que al renderizar, los campos ya tienen sus valores. No hay pantalla en blanco.
Las pantallas de solo lectura (resultado, resumen) **no usan `react-hook-form`**; leen directamente de `task.data` y solo muestran información.

---

## Comentarios y documentación técnica en el código

Esto es sobre **comentarios/docstrings que viven en el código**, no sobre generar un `.md`
nuevo por cada cambio. El proyecto ya tiene un estilo de comentario definido — natural,
español, corto (ver `docs/guides/nomenclatura-variables.md`) — y sigue siendo el correcto
para pasos triviales dentro de una función (`// inicializamos la variable`). Esta regla
agrega un requisito adicional para lo **no trivial**:

> **No confundir con `DOCUMENTACION_<slug>.md`.** Son dos entregables distintos y
> **complementarios**, no alternativas: la ficha por pantalla es **trazabilidad funcional**
> contra los insumos del cliente (qué FLD/RUL/MSG del Anexo02 implementa cada campo), algo
> que un comentario de código no puede cubrir y que se audita del lado del negocio. Los
> comentarios de esta sección son **contrato técnico** para quien lee el código. Ambos siguen
> siendo obligatorios en su ámbito.

- Toda función/hook/módulo **exportado** en `core/`, `backend/src/routes/`, y lógica de
  negocio no obvia (cálculos, transformaciones, reglas) necesita un comentario que explique
  **el porqué y el contrato** — no repita el nombre de la función. Explicar: qué asume, qué
  devuelve en casos límite, y cualquier gotcha (formato de fecha, un campo que viaja como
  string aunque parezca número, un efecto secundario no evidente). Ejemplos ya en el
  proyecto: los comentarios de `fields.ts` (`// FLD-xxx · antes qd_nombreViejo`), el bloque
  de cabecera de `pm4Resolve.ts`, o el comentario de `reassignTask` en `useTask.ts` que
  explica por qué el PUT de reasignación va separado del de guardar datos.
- La regla aplica a la **firma pública** de módulos/funciones exportadas, no a cada línea
  interna — no conviertas comentarios naturales cortos en documentación formal excesiva.
- Un `.md` nuevo en `docs/reference/` sigue reservado para lo que **no cabe** como
  comentario de código: una convención transversal, un formato de datos externo (como
  `docs/reference/pm4-export-format.md`), o un módulo cuya arquitectura hay que explicar
  antes de leer el código — no es el default para cada función nueva.

---

## Estructura de un paquete PM4 exportado

Componentes PM4 que existen: `FormInput`, `FormMultiColumn`, `FormHtmlViewer`, `FormNestedScreen`, `FormSelectList`, `FormDatePicker`, `BWrapperComponent`.

`FormMultiColumn.items` es un **array de arrays** (columnas → items por columna).

Detalle completo del formato de export (`screen_package`, `config`/`computed`/`watchers`/
`scripts`, dedup por `uuid`, remapeo de IDs entre instancias, qué nunca modificar): ver
`../docs/reference/pm4-export-format.md`.

---

## CSS Zurich — Color y tokens (FUENTE DE VERDAD)

**Todos los colores provienen de los tokens de `@zurich/css-components`** (importado en `main.tsx` vía `base.css`). **Prohibido hex/rgba crudo** en CSS o en estilos inline `.tsx` — usar siempre `var(--...)`.

- **Tokens del DS** (no redefinir): `--zc-*` (color), `--zg-*` (grises, incl. `--zg-white` #FFF, `--zg-black` #000, `--zg-white-zurich` #ECEEEF), `--zs-*` (espaciado), `--zf-*` (tipografía).
- **Alias semánticos del proyecto** (en `shared.css :root`, todos apuntan a tokens DS): `--z-blue`, `--z-blue-dark`, `--z-blue-light`, `--z-green`, `--z-red`, `--z-orange`, `--z-bg`, `--z-border`, `--z-text`, `--z-muted`, `--z-card-shadow`.
- **Transparencias** → `color-mix(in srgb, var(--token) N%, transparent)`, nunca `rgba()` con números.
- **Escala real del DS:** las familias `--zc-{moss,peach,lemon}-*` usan pasos `20/40/60/80/aa/aaa` (NO existen `-10`/`-30`); `--zc-blue-sky-*` usa `10/25/40/80/aa`. Referenciar un paso inexistente rompe el color (cae a `unset`).
- **Excepciones documentadas** (únicos colores sin token DS, centralizados en `shared.css :root`): `--z-card-border` (#DDE3EC), `--z-warning-deep` (#B8860B), `--z-modal-backdrop` (#0B1B3C).

Fuente corporativa: `ZurichSans-Regular.ttf` desde `https://bpm.beesmart.ec/fonts/zurich/`

---

## Pantallas anteriores (backup)

Las pantallas implementadas anteriormente están en `../PM4 Backup/` (un nivel arriba de pm4-app).
El usuario debe especificar explícitamente qué pantalla de backup quiere usar como referencia.
Solo leer esos archivos si el usuario lo pide — no asumir cuál usar.

---

## Referencia de componentes Zurich — OBLIGATORIO

Antes de generar cualquier pantalla nueva, leer **estas dos referencias de consumo**
(son la fuente de verdad rápida; reemplazan la lectura del índice para construir):

```
outputs/zds-cheatsheet.md       ← qué componentes/props EXISTEN (función→componente, enums, kebab, patrones)
outputs/shared-css-catalog.md   ← qué clases CSS ya existen (estructura, grid, tipografía) antes de escribir CSS
```

**`outputs/zurich-index.md` NO es lectura obligatoria.** Es el meta-índice para
*documentar* componentes DS nuevos (convertir copy-paste de la web a fichas
`outputs/react/...`). **Léelo solo cuando realmente lo necesites:** vas a incorporar un
componente DS que aún no está en la fachada `ZdsFields` ni en el cheat-sheet — y en ese
caso, primero DETENTE y consulta al usuario antes de documentarlo.

**Referencia visual viva:** `?screen=ds-catalog` (componente `screens/ds-catalog/DsCatalog.tsx`)
renderiza cada componente de la fachada con sus variantes — úsalo como **molde de uso**
cuando no exista una pantalla análoga que clonar, y para detectar regresiones.

---

## Archivos que NO se deben modificar

- `.env` — solo agregar variables, nunca borrar el token
- `backend/src/routes/pm4.routes.ts` — agregar rutas si se necesitan nuevos endpoints, no reescribir la lógica de proxy
- `../docs (4).json` — es la referencia OpenAPI de PM4, solo lectura
- `../*.json` — exports de PM4 en la raíz del repo, solo lectura
