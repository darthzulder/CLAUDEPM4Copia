# PM4 App — Contexto para Claude Code

## Qué es este proyecto

App React + Express que actúa como **iframe dentro de ProcessMaker 4** para Zurich Regional (Colombia).
No es un form-builder: cada pantalla es un componente React que replica exactamente el formulario de PM4.
Las pantallas se crean aquí con ayuda de Claude (este chat), **no dentro de PM4**.

**PM4 instance:** `https://mxzurich.dev.cloud.processmaker.net`
**API base:** `/api/1.0`
**Docs OpenAPI:** `../docs (4).json` (un nivel arriba de pm4-app)
**Paquetes JSON de pantallas originales:** `../*.json` (un nivel arriba de pm4-app)

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
npm run build --workspace=frontend   # tsc + vite
npm run build --workspace=backend    # tsc
npm run lint  --workspace=frontend   # eslint
```

Si alguno falla con errores de TypeScript, lint o empaquetado, **corregir antes de commitear**. No commitear con builds rotos.

> Según el entorno de cada dev, `npm` corre en local o dentro del contenedor. Si usas
> Docker, antepón `docker exec -w /app pm4-app-container ` a cada comando y, como no hay
> HMR en el mount, `docker restart pm4-app-container` para validar el cambio visual.

---

## Variables de entorno (`.env` en raíz de pm4-app)

```
PM4_BASE_URL=https://mxzurich.dev.cloud.processmaker.net
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

## Colecciones PM4 conocidas

| ID | Contenido | label field | value field |
|----|-----------|-------------|-------------|
| 2 | NAIC (actividades) | `data.frm_actividad` | `data.frm_codigo` |
| 4 | Intermediarios | `data.frm_nombre_entidad` | `id` |
| 5 | Correos de intermediarios | `data.frm_mail_intermediario` | `data.frm_mail_intermediario` |

> IDs basados en el paquete `COL - FF - Form - Cotizador Fast Flow`.
> Verificar en cada instancia de PM4 si los IDs cambian.

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
   - `COLLECTIONS` — IDs de colecciones PM4 que usan los selects dinámicos
   - `WATCHERS` — definición de watchers (campo que observan, script ID, run_onload)
   - Interface TypeScript de los datos del formulario
3. **No crear `styles.css` local.** Sigue la **Jerarquía de decisión de UI** (sección abajo): reusar componentes/elementos del DS antes de crear, y CSS custom solo como último recurso. Todo estilo nuevo va **al final de `shared.css`**, DRY y **con tokens** (`--zs-*`, `--zf-*`, `--z-*`/`--zc-*`/`--zg-*`), nunca px/hex crudos. `shared.css` es la única hoja de estilos global permitida.
4. Crear `NombrePantalla.tsx` — componente React (<300 líneas por archivo)
5. Registrar en `App.tsx` en el objeto `SCREENS`

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
| `DocSupportUploader` | `components/DocSupportUploader` | Bloque de carga de documentos de soporte |
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
| Re-exports directos | — | `ZrButton`, `ZrIcon`, `ZrModal`, `ZrForm`, `ZrCard`, `ZrTabs`, `ZrTable`, `ZrAlert`, `ZrBadge`, `ZrChip`, `ZrTag`, `ZrProgressBar`, `ZrFileInput`, `ZrSegmentedControl`, `ZrSidebar`, `ZrTile`, `ZrTooltip`, `ZrInputGroup`, `ZrFieldset`, `ZrStepper`, `ZrCalendar`, `ZrLoader` — componentes DS que no requieren Controller |

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

### Datos pre-cargados desde PM4

**Todas las pantallas siempre reciben datos pre-poblados desde PM4.** El flujo es:
1. PM4 genera la URL del iframe con `?task_id=` o `?case_id=`
2. `useTask()` hace GET al task y obtiene `task.data` con todos los valores del caso
3. Los valores de `task.data` se inyectan en el formulario con `form.setValue()` al montar

Esto significa que al renderizar, los campos ya tienen sus valores. No hay pantalla en blanco.
Las pantallas de solo lectura (resultado, resumen) **no usan `react-hook-form`**; leen directamente de `task.data` y solo muestran información.

---

## Estructura de un paquete PM4 exportado

```json
{
  "type": "screen_package",
  "version": 2,
  "screens": [ { "title": "...", "config": [], "computed": [], "watchers": [], "custom_css": "..." } ],
  "scripts": [ { "id": 4, "language": "php", "code": "..." } ]
}
```

Componentes PM4 que existen: `FormInput`, `FormMultiColumn`, `FormHtmlViewer`, `FormNestedScreen`, `FormSelectList`, `FormDatePicker`, `BWrapperComponent`.

`FormMultiColumn.items` es un **array de arrays** (columnas → items por columna).

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
