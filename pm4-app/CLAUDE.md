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
npm run build --workspace=frontend && npm run build --workspace=backend
```

Si alguno de los dos falla con errores de TypeScript o de empaquetado, **corregir antes de commitear**. No commitear con builds rotos.

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
3. **No crear `styles.css` local.** Los diseños deben ser DRY y utilizar únicamente elementos y componentes de ZurichDS. Si son necesarios estilos CSS específicos e inevitables para la pantalla, agrégalos de forma centralizada al final de `frontend/src/shared.css` utilizando un prefijo de clase adecuado (ej. `.screen-<slug>--<elemento>`).
4. Crear `NombrePantalla.tsx` — componente React (<300 líneas por archivo)
5. Registrar en `App.tsx` en el objeto `SCREENS`

**Para pedirle a Claude que cree una nueva pantalla**, proporcionar:
- Screenshot del formulario en PM4
- El archivo JSON exportado del paquete (o el título exacto de la screen en PM4)
- Si tiene watchers, cuáles campos disparan qué scripts

---

## Convenciones de código

### Componentes de campo — `ZdsFields.tsx`

Todos los campos de formulario y componentes Zurich DS se importan **exclusivamente** desde:

```tsx
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsDate, ZdsTextarea,
         ZdsCheckboxField, ZdsSuggest,
         ZrButton, ZrModal, ZrForm, ZrCard } from '../../components/fields/ZdsFields';
```

**Nunca importar directamente de `@zurich/web-components/react/...` en los screens.**

| Wrapper | Componente Zurich | Cuándo usar |
|---|---|---|
| `ZdsInput` | `ZrTextInput` + Controller | Texto, email, tel — editable o readOnly |
| `ZdsSelect` | `ZrSelect` + Controller | Dropdown con opciones |
| `ZdsRadio` | `ZrRadioSelect` + Controller | Grupo de radio buttons |
| `ZdsDate` | `ZrDateInput` + Controller | Selector de fecha |
| `ZdsTextarea` | `ZrTextarea` + Controller | Texto multilínea |
| `ZdsCheckboxField` | `ZrCheckbox` + Controller | Checkbox booleano |
| `ZdsSuggest` | `ZrTextInput` + dropdown | Typeahead con lista filtrada |
| `ZrButton` | re-export directo | Botones de acción |
| `ZrModal` | re-export directo | Diálogos modales |
| `ZrForm` | re-export directo | Contenedor de formulario Zurich |

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
- `useTask()` maneja loading / error / submitting — siempre mostrar estos estados
- Diseños DRY y ZurichDS: Utilizar únicamente componentes de ZurichDS de forma limpia. No se permiten archivos `styles.css` locales por pantalla. Cualquier estilo específico y justificado debe centralizarse en `frontend/src/shared.css` de forma DRY.
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

## CSS Zurich — Variables de color

```css
--zurich-blue:   #2167AE
--zurich-green:  #0CA442
--zurich-red:    #EC5962
--zurich-bg:     #f7f9fc
--zurich-border: #e5e7eb
```

Fuente corporativa: `ZurichSans-Regular.ttf` desde `https://bpm.beesmart.ec/fonts/zurich/`

---

## Pantallas anteriores (backup)

Las pantallas implementadas anteriormente están en `../PM4 Backup/` (un nivel arriba de pm4-app).
El usuario debe especificar explícitamente qué pantalla de backup quiere usar como referencia.
Solo leer esos archivos si el usuario lo pide — no asumir cuál usar.

---

## Referencia de componentes Zurich — OBLIGATORIO

Antes de generar cualquier componente o pantalla nueva, **siempre leer**:

```
outputs/zurich-index.md   (relativo a pm4-app/)
```

Este archivo contiene las bases de diseño, componentes disponibles y convenciones visuales de la aplicación.
No crear componentes sin haberlo leído primero en la conversación actual.

---

## Archivos que NO se deben modificar

- `.env` — solo agregar variables, nunca borrar el token
- `backend/src/routes/pm4.routes.ts` — agregar rutas si se necesitan nuevos endpoints, no reescribir la lógica de proxy
- `../docs (4).json` — es la referencia OpenAPI de PM4, solo lectura
- `../*.json` — exports de PM4 en la raíz del repo, solo lectura
