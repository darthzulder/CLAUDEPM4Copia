# PM4 App — Contexto para Claude Code

## Qué es este proyecto

App React + Express que actúa como **iframe dentro de ProcessMaker 4** para Zurich Regional (Colombia).
No es un form-builder: cada pantalla es un componente React que replica exactamente el formulario de PM4.
Las pantallas se crean aquí con ayuda de Claude (este chat), **no dentro de PM4**.

**PM4 instance:** la instancia activa es la que define `PM4_BASE_URL` en `pm4-app/.env` — este valor **cambia entre entornos y migraciones** (ya pasó una vez), nunca asumas ni hardcodees un hostname fijo en código o documentación; consulta siempre `.env` para saber contra qué instancia se está corriendo.
**API base:** `/api/1.0`
**Docs OpenAPI:** `../docs (4).json` (un nivel arriba de pm4-app)
**Paquetes JSON de pantallas originales:** `../*.json` (un nivel arriba de pm4-app)

### ⚠ Cuál es el frontend vivo (Fase 7, ago-2026)

**El frontend desplegado es `frontend-ng` (Angular 21).** El workspace `frontend` (React 19) sigue en
el árbol como **referencia de paridad** —hay que poder abrir la misma pantalla en los dos y
compararlas— pero ya **no se buildea ni se sirve**: `npm run build` encadena `frontend-ng && backend`,
y el Express de producción monta `frontend-ng/dist/frontend-ng/browser`. React debe seguir compilando
mientras exista (lo cubre `npm run verify`); su borrado es un commit aparte, pendiente de que el
usuario valide el deploy, y arrastra regenerar `package-lock.json` en el mismo movimiento porque cuatro
`@zurich/*@0.8.1` resuelven a `file:frontend/vendor/*.tgz`.

**Este archivo describe mayoritariamente el proyecto React**, que es donde se escribieron las
convenciones. Casi todo sigue vigente conceptualmente (BFF, nomenclatura `qd_*`, jerarquía de UI,
tokens, tests obligatorios), pero **los detalles de implementación son de React**: `App.tsx`,
`ZdsFields.tsx`, react-hook-form, `.test.tsx`. Los equivalentes de Angular son `app/pantallas.ts`,
`components/fields/`, Reactive Forms y `.spec.ts` — y sus trampas propias (zoneless, `NG0201`/`NG0203`,
el DS `lib-*-z`) están en **`CONTEXTO_MIGRACION_ANGULAR.md`**, que es lectura obligatoria antes de
tocar `frontend-ng`.

**Stack Angular (`frontend-ng`, desplegado):** Angular 21 + TypeScript 5.9 · Reactive Forms ·
`@zurich/web-components`/`css-components`/`angular-components` **0.8.2** + `@zurich-col/lib-zurich`
2.6.16, instalados del feed de Azure (ver `InsumosZurich/FEED-ZURICH.md`), **no vendorizados**.

**Stack React (`frontend`, referencia de paridad):** React 19.2.7 + TypeScript 5.9.3 + Vite 8.1.2 ·
Express 5.2.1 + Node 24 (backend/proxy, compartido) · react-hook-form 7.80.0 ·
`@zurich/web-components`/`css-components` 0.8.1 **vendorizados** en `frontend/vendor/*.tgz`
(ver `Bootstrap y registro de ZDS` abajo y `frontend/vendor/README.md`).

---

## Reglas obligatorias para cualquier tarea (LEER PRIMERO)

Aplican a **todo** cambio de código en este proyecto, no solo a pantallas nuevas:

1. **Nomenclatura de campos `qd_*`** — prefijo de tipo + CamelCase inglés, fechas como `str`.
   Ver [`../docs/guides/nomenclatura-variables.md`](../docs/guides/nomenclatura-variables.md).
2. **Nunca inventar UI** — seguir la [Jerarquía de decisión de UI](#jerarquía-de-decisión-de-ui-obligatorio)
   y, si vas a crear algo, revisar primero el contenido real del DS. En **Angular**: los `.d.ts` de
   `InsumosZurich/lib-zurich-2.6.16/package/types/` (nunca por grep sobre el `.mjs`, que va en una sola
   línea y devuelve inputs del componente vecino). En **React**: `frontend/vendor/*.tgz` vía
   [`outputs/react/VENDOR_COMPONENT_CATALOG.md`](outputs/react/VENDOR_COMPONENT_CATALOG.md).
3. **Arquitectura BFF** — toda llamada externa (PM4, futuras APIs) pasa por `backend/`,
   nunca directo desde una pantalla. Ver [Principio arquitectónico: BFF](#principio-arquitectónico-backend-for-frontend-bff).
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
8. **Nunca commitear sin confirmación del usuario. Nunca pushear, salvo pedido explícito.**
   Ver [Flujo de trabajo con Claude](#flujo-de-trabajo-con-claude).
   *Excepción única:* los commits de captura en la rama `pm4-scripts-historial` son automáticos.
   No son trabajo tuyo ni una decisión de diseño: son el registro de un estado que **ya existe en
   PM4**, escritos con plumbing sobre una rama huérfana que nunca se mergea, sin tocar el working
   tree, el índice ni la rama activa. Pedir confirmación destruiría lo que los hace útiles: que
   capturar sea imposible de olvidar.
9. **Nunca sobrescribir un script PM4 sin capturar antes y después.** Toda escritura
   —`pm4_update_script`, `pm4_run_script` con `code_adhoc` (que también escribe), o
   `PUT /scripts/{id}`— queda registrada por los hooks `PreToolUse`/`PostToolUse`, que guardan el
   estado anterior y el nuevo. **Si escribís por API cruda (`curl`, Bash) los hooks no disparan:**
   ahí corré `npm run pm4:capture -- --id <id>` vos mismo, antes y después. Ver
   [`../docs/guides/historial-scripts-pm4.md`](../docs/guides/historial-scripts-pm4.md).

---

## Flujo de trabajo con Claude

El pedido típico es una línea —`"Crea la SCR-000 basada en su anexo: <ruta>"`— y detrás corre
este guion. Sirve igual para una pantalla nueva, un fix o un refactor.

### Los dos frenos, antes que nada

- **Commit:** preparo todo (archivos, mensaje) y **pido confirmación**. Nunca commiteo por
  iniciativa propia, ni siquiera cuando `verify` está verde y "obviamente corresponde".
- **Push:** **no lo hago nunca**, salvo que el usuario lo pida con esas palabras. El push y el
  PR son suyos. Si digo "listo", significa *commiteado en local*, no *subido*.

Esto no es cortesía: un commit o un push son las dos acciones difíciles de revertir de todo el
ciclo, y son las únicas donde el criterio del usuario no lo puede suplir la automatización.

### Qué necesito en el pedido

| Insumo | Por qué |
|---|---|
| El **anexo** (o el JSON exportado de PM4, o un screenshot) | Sin él invento campos, y eso es peor que no empezar |
| Los **watchers**, si tiene | Qué campo dispara qué script |
| La pantalla de referencia, si querés clonar una | Si no, elijo yo la más análoga y te lo digo |

### Las 6 fases

1. **Leer** — el insumo, más `../docs/guides/nomenclatura-variables.md`,
   `outputs/zds-cheatsheet.md`, `outputs/shared-css-catalog.md` y
   `../docs/guides/testing-conventions.md`. Si falta algo, **me detengo y pregunto**.
2. **Rama** — `git switch -c feat/<slug>` desde `develop` actualizado (ver
   [Modelo de ramas](#modelo-de-ramas-las-dos-de-larga-vida-son-entornos-desplegados)). Nunca
   trabajo sobre `develop` ni `main`.
3. **Construir** — `variables.ts` con las colecciones **por nombre** (`resolveCollectionId`,
   jamás un id suelto) · campos `qd_*` con la nomenclatura · UI bajando la
   [Jerarquía de decisión de UI](#jerarquía-de-decisión-de-ui-obligatorio) · registro en
   `App.tsx` · `DOCUMENTACION_<slug>.md` con la trazabilidad FLD/RUL/MSG contra el insumo.
4. **Testear — en el MISMO commit, no después.** Ver el detalle abajo.
5. **Mutar** — rompo cada regla nueva a propósito, confirmo que el test se pone **rojo**, y
   reverto. Si un test no se pone rojo al romper lo que dice cubrir, no sirve y hay que
   rehacerlo.
6. **Verificar y entregar** — `npm run verify` verde, `npm run coverage:diff` para ver qué quedó
   sin ejercitar, y te reporto: qué construí, qué testeé, **qué mutaciones verifiqué** y qué
   dejé afuera. Ahí pido la confirmación para commitear. El push y el PR contra `develop` son tuyos.

### Qué significa "con sus tests" para una pantalla

Tres cosas distintas, no un test genérico:

- **Lógica pura** (`.test.ts`) — helpers y cálculos de `variables.ts` o `core/`.
- **Pantalla** (`.test.tsx`) — que monte, **más un test por cada RUL del anexo**. Si el anexo
  dice *"RUL-000-09: al cambiar Departamento se limpia Municipio"*, hay un test que falla si
  alguien saca esa línea.
- **Smoke de arranque** — registrar la pantalla en `App.tsx` **obliga** a sumar el slug a
  `frontend/src/App.smoke.test.tsx`; si no, la guarda de inventario pone la suite en rojo
  nombrando el slug faltante. Es el único de los tres que no depende de mi buena voluntad.

Si el insumo pide una integración nueva, va como ruta en `backend/`, con la lógica no trivial
extraída a `backend/src/lib/` y testeada ahí — nunca un `fetch` desde una pantalla.

### Dónde freno a preguntar (y está bien que lo haga)

- Un componente del DS que **no está documentado** en `outputs/` → pido la doc oficial antes de
  inventar props.
- Una colección/script que **no resuelve por nombre** en `pm4-registry.json`.
- Una regla del insumo **ambigua** o que contradice una pantalla existente.

### El límite honesto, y cómo controlarlo

Los cuatro anillos atrapan **"rompiste algo"**, no **"no lo testeaste"**. Salvo la guarda del
smoke, nada me obliga a escribir el test de una regla nueva. La palanca es una sola pregunta:

> **"¿Qué mutaste para comprobar que los tests detectan la rotura?"**

Si no puedo nombrar la línea que rompí y el test que se puso rojo, el test no vale.

---

## Cómo se ejecuta

```bash
cd pm4-app   # desde la raíz del repo
npm run dev
```

- **Backend** → `http://localhost:3001` (Express, proxy a PM4 API)
- **Frontend** → `http://localhost:4200` (Angular, `frontend-ng` — el desplegado)

Para levantar el React de referencia en su lugar: `npm run dev:react` → `http://localhost:5173`. Para
compararlos, los dos a la vez (cada uno con su backend).

URL del iframe en PM4:
```
http://localhost:4200/?screen=COL_QD_SCR-000_CrearRecibirQueja&task_id=123&token=eyJ...
```

El contrato de la URL es **el mismo que tenía React**, por decisión explícita del usuario: PM4 sigue
generando `?screen=<slug>` y el router de Angular lo traduce a un path real preservando `task_id` y
`token` (`app/app.routes.ts`). En producción el Express sirve el build de Angular y hace fallback al
`index.html` solo para las navegaciones — que es lo que hace que un refresh directo en `/<slug>`
funcione, y por qué un `/api/*` inexistente o un asset faltante siguen dando 404 y no HTML
(`backend/src/lib/estaticos.ts`).

---

## ⚠️ Antes de hacer commit / push a git — OBLIGATORIO

```bash
npm run verify   # lint front+back · typecheck · builds · tests front+back
```

Un solo comando: es la **única definición de verde** del proyecto
(`pm4-app/scripts/verify.mjs`). Si algo falla —TypeScript,
lint, empaquetado o **tests**— **corregir antes de commitear**. Tampoco commitear con un test
preexistente que dejó de pasar por el cambio actual.

Está automatizado en **cuatro anillos** (setup y detalle en
[`../docs/guides/entorno-local-y-verificacion.md`](../docs/guides/entorno-local-y-verificacion.md)):

| # | Anillo | Responde |
|---|---|---|
| 1 | `npm run test:watch` | ¿rompí esto que estoy escribiendo? |
| 2 | `pre-commit` | ¿rompí lo que toqué? |
| 3 | `pre-push` | ¿rompí el proyecto? + aviso si la rama quedó detrás de su base |
| 4 | **GitHub Actions en el PR** | **¿rompo la rama base al MERGEAR?** ← el único que no se puede saltar |

Los anillos 2 y 3 se activan una vez con `npm run setup:hooks`.

### Modelo de ramas: las dos de larga vida son entornos desplegados

```
feat/…  fix/…  chore/…  ──PR──►  develop  ──►  Render de DESARROLLO
                develop  ──PR──►  main     ──►  Render de PRODUCCIÓN
```

La **base** de un cambio es `develop` para el trabajo normal y `main` para un release o `hotfix/*`. La
regla está en [`scripts/integration-base.mjs`](scripts/integration-base.mjs) y la consumen el hook
`pre-push` y el informe de cobertura — no la dupliques al escribir tooling nuevo.

**El proyecto integra por PR, no con `git merge` local.** No es preferencia de estilo: en un PR,
GitHub corre la suite sobre la **merge commit** (la base + la rama ya integradas). Un merge local
prueba la rama *aislada*, así que los conflictos semánticos —la base renombra un campo `qd_*`, la
rama agrega un uso del nombre viejo, ambos verdes por separado— no aparecen hasta que la rama base
ya está rota, con un entorno desplegado detrás.

Para saber **qué parte de un cambio quedó sin ejercitar**: `npm run coverage && npm run
coverage:diff` (en un PR sale solo en el job summary). Es una señal, no un gate — que una línea
esté cubierta no significa que esté asertada.

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

> **⚠ Los fallbacks de `.env` son solo de desarrollo (Fase 7).** En Angular las variables entran al
> bundle por `frontend-ng/scripts/gen-env-define.mjs`, y cuando `NODE_ENV=production` las tres de dev
> —`VITE_PM4_TOKEN`, `VITE_TASK_ID`, `VITE_CASE_ID`— se emiten **vacías**: un bundle de producción no
> puede llevar un token ni aunque la variable esté definida en el dashboard de Render. Se emiten vacías
> y **no omitidas** porque `core/pm4-context.service.ts` importa las tres por nombre; omitirlas daría
> `TS2305` y rompería el deploy para proteger un valor que `''` ya protege. En producción, entonces, el
> token y el task_id **solo** pueden venir del query param del iframe. El prefijo `VITE_` se conserva
> por continuidad con React, aunque Angular no use Vite.

---

## Arquitectura de archivos

### `frontend-ng` (Angular) — el desplegado

```
pm4-app/
├── .env                          ← NO subir a git
├── backend/src/
│   ├── server.ts                 ← Express puerto 3001, CORS abierto
│   ├── lib/estaticos.ts          ← QUÉ carpeta se sirve y CUÁNDO va el fallback SPA (con spec)
│   └── routes/pm4.routes.ts      ← Proxy: lee token del header x-pm4-token o PM4_TOKEN env
└── frontend-ng/src/
    ├── main.ts                   ← bootstrapApplication
    ├── env.generated.ts          ← generado por scripts/gen-env-define.mjs — GITIGNOREADO (trae el JWT de dev)
    ├── app/
    │   ├── app.routes.ts         ← traduce ?screen=<slug> a path preservando task_id/token
    │   ├── pantallas.ts          ← DIC_PANTALLAS (el equivalente del objeto SCREENS de App.tsx)
    │   ├── indice-pantallas.ts   ← índice cuando no hay ?screen=
    │   └── pantalla-no-encontrada.ts
    ├── api/                      ← cliente HTTP, inyecta x-pm4-token
    ├── core/                     ← servicios (task, collection, catalogos, attachments…) + lógica pura
    ├── components/               ← componentes propios; `fields/` es la fachada del DS
    └── screens/<area>/<slug>/    ← una carpeta por pantalla: .ts .html .spec.ts + DOCUMENTACION_<slug>.md
```

Los tests viven **al lado** del archivo que prueban (`x.ts` + `x.spec.ts`), no en una carpeta aparte.

### `frontend/` (React) — referencia de paridad, ya no se despliega

```
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
del frontend a PM4. Esta sección existe para que **se mantenga así**:

- Toda integración externa nueva (PM4, cualquier API futura) se agrega
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

### Historial de los scripts PHP (rama `pm4-scripts-historial`)

Hermano de esta sección: ambas tratan de cómo se referencia y se mantiene lo que vive en PM4.

- Los scripts PM4 se editan en la UI o por API; **git no los gobierna, los registra**. La API de PM4
  no tiene historial de versiones, así que cada escritura pisa la anterior sin dejar rastro.
- **Escrituras por el MCP:** los hooks `PreToolUse`/`PostToolUse` capturan solos el estado anterior
  y el nuevo, en el momento. No hace falta ningún paso final: si la sesión se corta, lo ya subido
  ya está registrado.
- **Trabajo en la UI de PM4:** `npm run pm4:capture -- --all`. Es el único paso manual — la UI no
  pasa por ninguna herramienta que un hook pueda interceptar.
- **Alcance por proceso, no toda la instancia:** solo se vigilan los procesos declarados en
  `scripts/pm4-scripts/pm4-scripts.config.json` (hoy el 31 → 13 scripts de los 62 de la instancia).
  Los scripts de cada proceso se descubren de su BPMN; en `scriptsExtra` se declaran solo los que
  ningún BPMN referencia (los que otro script invoca en runtime, y los watchers del frontend).
- Los `.php` capturados viven en la rama huérfana `pm4-scripts-historial`, nunca en `develop`. Son
  registro, no fuente: editarlos no cambia nada en PM4. La rama no se mergea ni se borra.
  La copia navegable de `/pm4-scripts/` (raíz del repo) se **genera** en cada captura y está
  ignorada en git.
- Coherente con la regla de IDs de arriba: el índice se indexa por `uuid` y el id numérico es solo
  caché que se re-resuelve en cada corrida.
- Flujo completo, comandos de consulta y vuelta atrás:
  [`../docs/guides/historial-scripts-pm4.md`](../docs/guides/historial-scripts-pm4.md).

---

## Tests automatizados (OBLIGATORIO)

Necesitan test, si son nuevos o los estás modificando:
- **Lógica pura** — `core/*.ts`, helpers, `backend/src/lib/*.ts`.
- **Componentes propios** (`components/*.tsx`) y **pantallas** — al menos un smoke test con
  React Testing Library (`.test.tsx`, project `components` de Vitest; confirmado compatible
  con los custom elements de `@zurich/web-components`).
- **Rutas nuevas del backend** (`backend/src/routes/`) — la lógica no trivial se extrae a
  `backend/src/lib/` y se testea ahí, como se hizo con `lib/token.ts`. Es donde la
  [regla de BFF](#principio-arquitectónico-backend-for-frontend-bff) manda toda integración
  externa nueva, así que es donde más importa.

Comandos:
```bash
npm run verify                         # build + lint + tests de los 3 workspaces — el gate completo
npm run test --workspace=frontend-ng   # Angular (el desplegado) — ng test, specs .spec.ts
npm run test --workspace=frontend      # React (referencia) — vitest, projects 'logic' y 'components'
npm run test --workspace=backend       # vitest — lib/*.ts
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

**Tanda 2 pagada (ago-2026):**
- `core/useTask.test.tsx` cubre el hook completo (no solo una función pura extraída) —
  carga inicial por `task_id` y por `case_id`, el error con y sin `response.data.message`,
  y las cuatro mutaciones (`completeTask`, `saveDraft`, `startProcess`, y el **contrato de
  dos PUT de `reassignTask`**: el primero SOLO con `user_id` y el segundo a
  `/requests/{id}` con los datos, que se omite si no hay `process_request_id`). Se mockean
  `api/pm4Client` y los cuatro resolvers de `core/useToken.ts`; el archivo es `.test.tsx`
  (no `.test.ts`) porque `renderHook` necesita DOM.
- **Los 14 componentes de `components/*.tsx` tienen smoke test** (antes solo `ActionBar`).
  Los que pegan a PM4 (`PdfViewer`, `RequestFileList`) mockean
  `api/pm4Client`/`core/useRequestFiles`; `PreviewModal` mockea su propio `PdfViewer` hijo
  para no re-probar esa red; `RecaptchaModal` stubea `window.grecaptcha` (si no,
  `loadRecaptcha()` espera el script real de Google o expira a los 10s).
- **Las 10 pantallas de Quejas Directas tienen smoke test** (antes solo `SCR-0052`), más
  `ds-catalog` y `smartsupervision-api-docs`, que no son de Quejas Directas:
  `ds-catalog`, `smartsupervision-api-docs`, `SCR-000`, `SCR-003`, `SCR-004`, `SCR-008`,
  `SCR-009`, `SCR-0051`, `SCR-011`, `SCR-012`, `SCR-013` — las **SCR-004, 011 y 012** se
  eliminaron del proyecto en ago-2026 (§6-sexies de `CONTEXTO_MIGRACION_ANGULAR.md`), así
  que sus smoke tests ya no están; el inventario se conserva porque es el registro de qué
  cubrió esa tanda. `SCR-000`
  (`CrearRecibirQueja.test.tsx`) NO cubre el flujo end-to-end de envío exitoso
  (`checkSimilarCases` → `recaptcha/verify` → `completeTask`/`process_events`): exige ~20
  campos obligatorios repartidos en selects del DS no interactuables vía `fireEvent` en
  jsdom, y además el Municipio se limpia deliberadamente cada vez que cambia el
  Departamento (RUL-000-09) — incluida la precarga inicial desde `task.data` — así que ni
  con un fixture queda satisfecho; se cubre el gate de envío (`blnCanSubmit`) y las
  secciones condicionales, no el submit real.

**`FAST-FLOW/*` fue eliminado del proyecto (ago-2026)** — ya no queda deuda de cobertura
pendiente por ese lado.

Qué implica en la práctica:
- **Lo que toques, lo cubrís.** No hace falta un backfill masivo antes de poder trabajar; sí
  hace falta que todo cambio nuevo llegue con su test.
- **Si vas a modificar un módulo sin tests**, escribirle el test primero (o en el mismo
  commit) es parte del cambio, no un extra opcional.
- Al testear fechas, recordá que la zona horaria está **fijada** en `vitest.config.ts`
  (`America/Bogota`) — ver `docs/guides/testing-conventions.md`.

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
- **Solo tokens:** `--zs-*` (espaciado), `--zf-*` (tipografía), `--z-*`/`--zc-*`/`--zg-*` (color). **Nunca** px/hex crudos (excepto `1px` de borde, `line-height` y anchos puntuales).
- **Radios: tokenizados cuando coinciden con la escala `--zs-*`.** Ya no son excepción libre. El DS **no** usa sus propios tokens de radio (`--z-rd-s/m/l` aparecen **una vez** en toda la librería, en `kpi-value`): usa los de **espaciado** como radios en 20+ componentes (`--zs-25` color-input, `--zs-50` selectable-cards, `--zs-75` alert/chip, `--zs-100` action-card, `--zs-150` modal/tag). Así que el patrón correcto es 2px→`--zs-12`, 4px→`--zs-25`, 8px→`--zs-50`, 12px→`--zs-75`, 16px→`--zs-100`, 24px→`--zs-150`. Queda crudo solo lo que la escala no cubre — `50%` y pills (el DS también los deja crudos), y valores intermedios como `10px`/`3px`, **siempre con comentario del motivo**. (Verificado 2026-08-16 sobre el CSS compilado de los tres paquetes. Los `lib-*-z` de Colombia usan radios crudos en su shadow DOM, pero eso no condiciona nuestras hojas.)
- **Nombra clases por componente/primitivo, nunca por pantalla.**
- **CSS nuevo va al final de `shared.css`, DRY.**

### `shared.css` de Angular: minimizar, no replicar el de React (política 2026-08-16)

`frontend-ng/src/shared.css` se copió tal cual del React en la Fase 1 para no bloquear el porte, pero **no debe converger a él**. Cuando se escribió el original no se conocía el inventario completo del DS, así que hay bloques que reimplementan a mano cosas que el DS ya da hechas. El objetivo en Angular es **reducir esa hoja priorizando `lib-*-z` de Colombia como base**.

- **Elemento visual** (card, tag, acordeón, badge, loader, tabla) → componente del DS. Orden: `@zurich-col/lib-zurich` → `za-*` → CSS propio.
- **Layout o estructura** (grillas, posicionamiento, overlays, breakpoints, scrims) → CSS propio. El DS no cubre layout de pantalla; forzarlo empeora el resultado (ver el caso `za-fieldset` vs `.form-row`, documentado en la hoja).
- **Paridad visual:** no hace falta ser idéntico a React, pero sí lo más parecido posible. Si el componente del DS se ve algo distinto del CSS a mano, **gana el componente del DS**.
- **Momento de migrar cada bloque: al portar la pantalla que lo usa, no antes.** Buena parte de la hoja es CSS anticipado (sus pantallas no están portadas), y reescribir un bloque sin pantalla que lo consuma deja el cambio sin forma de verificarse contra el React de referencia.
- Los bloques ya investigados llevan nota en la hoja: `⏳ CANDIDATO ZDS PENDIENTE` con el componente y sus inputs verificados, o el motivo del descarte. **Leer esas notas antes de re-investigar.** Verificar los inputs contra `InsumosZurich/lib-zurich-2.6.16/package/types/zurich-col-lib-zurich.d.ts` — **no** por grep sobre el `.mjs`, que va en una sola línea y devuelve inputs del componente vecino (así se le atribuyó a `lib-footer-z` un `routes`/`social` que no tiene: `FooterZ` está vacía).

### ¿Clase o componente nuevo? *(bifurcación del escalón "crear")*
- Concepto de UI reutilizable **con markup/comportamiento** → **componente** semántico (`ActionBar`, `FormRow`).
- Patrón de **solo estilo** sin markup → **clase** en `shared.css`.
- **NO** crear componentes genéricos de layout (`<Flex>`, `<Row>`, `<Col>`) → reinventa los primitivos DS.
- **NO** envolver lo que ya es componente. Umbral de reúso **≥3** (o que encapsule comportamiento real).

### Hechos de `z-flex`/`z-align` (verificados contra el CSS compilado)
- Gaps válidos: `50 / 75 / 100 / 150 / 200 / 300 / 400 / 600` (= `--zs-*`). **No existe gap `25`** (4px) → ese caso queda como clase CSS. (Re-verificado 2026-08-16 enumerando los selectores `[z-flex…]` de `base.css`: **`400` y `600` sí existen** y esta lista los omitía.)
- Modificadores de wrap: `:wrap` y `:wrap-rev` son válidos como sufijo (`[z-flex*=":wrap"]`), además de las formas `wrap`/`wrap-rev` al principio del valor. También existen `rev`, `row-rev`, `col`/`column-rev` como prefijo.
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
| `PreviewModal` | `components/PreviewModal` | Modal de vista previa de documento |
| `PdfViewer` | `components/PdfViewer` | Visor de PDF/archivo PM4 vía blob |
| `DocCard` | `components/DocCard` | Card de un archivo ya existente (ícono+nombre+meta+acciones), con cuerpo expandible opcional |
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

**ZDS vendorizado — ⚠ aplica SOLO a React (`frontend`), que ya no se despliega.** Desde jul-2026,
`@zurich/web-components` y `@zurich/css-components` (0.8.1) no vienen del registro npm público — el ZDS
DevKit fue decomisionado (31-dic-2025) y ambos paquetes están **vendorizados** como `.tgz` en
`frontend/vendor/`, referenciados en `frontend/package.json` via `file:vendor/*.tgz`. Ambos llevan un
**parche** que reemplaza su `dist/react/jsx-runtime.js` (ESM y CJS) por un shim que usa el jsx-runtime
real de React en vez de una copia congelada de React 18 (necesario para React 19 — ver
`frontend/vendor/README.md` para el detalle completo y cómo reproducir el parche). **No actualizar
estos `.tgz` a mano ni correr `npm update` sobre `@zurich/*`** — no hay versión nueva que instalar (el
paquete está descontinuado) y una actualización involuntaria perdería el parche.

> **En Angular (`frontend-ng`) NO hay vendorizado ni parche.** El DS son paquetes instalados del feed
> de Azure: `@zurich/{web,css,angular}-components@0.8.2` + `@zurich-col/lib-zurich@2.6.16` (ver
> `InsumosZurich/FEED-ZURICH.md`). La colisión de versiones la resuelve el hoisting de npm sola: la
> 0.8.1 de React queda hoisteada en el `node_modules` raíz y la 0.8.2 anidada en
> `frontend-ng/node_modules`, así que cada workspace resuelve la suya por resolución de Node.
> **Y la política ante un defecto del vendor es la opuesta a la de React:** por decisión explícita del
> usuario, en Angular el defecto se **envuelve en nuestro código documentándolo** (`modelo-za.ts`,
> `boton-habilitado.ts`), nunca se parchea el paquete. Ver `CONTEXTO_MIGRACION_ANGULAR.md` §Deudas.

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
