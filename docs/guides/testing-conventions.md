# Convenciones de testing — PM4 App

> Resultado de un spike de validación (ago-2026): React Testing Library **sí** funciona
> bajo `jsdom` con los custom elements reales de `@zurich/web-components` — se confirmó
> renderizando un `ZrButton` real dentro de `ActionBar` (`components/ActionBar.test.tsx`).
> No hace falta mockear los componentes del DS para testear UI propia.

## Por qué existen dos "projects" de Vitest

`pm4-app/frontend/vitest.config.ts` define dos grupos (`logic` y `components`), reemplazo
del `environmentMatchGlobs` que existía en Vitest 3 y fue **removido en Vitest 4**:

| Project | Environment | Include | Para qué |
|---|---|---|---|
| `logic` | `node` (sin DOM) | `src/**/*.test.ts` | Funciones/hooks de lógica pura — rápido, sin ruido de DOM |
| `components` | `jsdom` | `src/**/*.test.tsx` | Componentes/pantallas React con `@testing-library/react` |

Un test de lógica pura va en `.test.ts`; un test que renderiza JSX va en `.test.tsx` —
Vitest lo enruta automáticamente al project correcto por la extensión, no hace falta
configurar nada por archivo.

Comandos: `npm run verify` (el gate completo) · `npm run test --workspace=frontend`
(Vitest, ambos projects) · `npm run test --workspace=backend` · `pytest -q` desde
`cotizador-service/`.

### Tres consecuencias de esa configuración que muerden

1. **El project `logic` no tiene DOM ni `test-setup.ts`.** Un `.test.ts` que toque `window`,
   `document` o `localStorage` falla con `x is not defined`. Si lo necesitás: nombralo
   `.test.tsx`, o poné el docblock `// @vitest-environment jsdom` al inicio del archivo.
   Afecta a lo que se testee de `core/useToken.ts` y `core/scrollToFirstError.ts`.
2. **Los tests los type-checkea el build.** `tsconfig.json` incluye todo `src` y `npm run
   build` corre `tsc` antes de Vite, con `strict` y `noUnusedLocals`. Un import sin usar en un
   test **rompe el build**, no solo el lint.
3. **Un helper compartido no puede llamarse `*.test.ts`/`*.test.tsx`** — los globs lo
   recogerían como suite y fallaría por no tener tests. Usar `src/test-utils/<algo>.ts`
   (`.tsx` si lleva JSX).
4. **`clearMocks: true` está activo, y es a propósito `clearMocks` y no `mockReset`.**
   `clearMocks` limpia `mock.calls` entre tests pero **conserva la implementación**;
   `mockReset` la borraría, y varios tests declaran a nivel de módulo
   `completeTask: vi.fn(() => Promise.resolve({}))` porque la pantalla encadena `.catch()`
   sobre el resultado. Con `mockReset` esas pantallas explotarían con
   *"cannot read .catch of undefined"*.

### Aislamiento: fixture fresco por test, nunca restaurar al final del cuerpo

El patrón correcto es un `makeTask()` que devuelve un objeto nuevo, reasignado en un
`beforeEach`:

```tsx
const makeTask = (in_dicOverrides = {}) => ({ ...OBJ_TASK, data: { ...OBJ_TASK.data, ...in_dicOverrides } });
beforeEach(() => { OBJ_USE_TASK.task = makeTask(); });
```

**Antipatrón** (estuvo en varios archivos): mutar un fixture compartido y restaurarlo en la
última línea del test. Si una aserción intermedia falla, el restore **no corre** y todos los
tests siguientes del archivo quedan con datos corruptos — un fallo se convierte en cascada.
Tampoco llamar `render()` dos veces en un mismo `it()`: ambas instancias quedan en el
`document.body` y las consultas buscan entre las dos.

### Dos trampas más de los controles del DS (verificadas)

**5. Un `z-button` deshabilitado SÍ dispara su `onClick` en jsdom.** No es un `<button>`
nativo, así que el DOM no bloquea el evento. Consecuencia: **nunca** pruebes "no hace X"
clickeando un botón bloqueado — el handler corre igual y el test falla de forma confusa.
Para verificar un bloqueo, asserta la propiedad `disabled` y el mensaje que lo explica:

```tsx
const objBtn = screen.getByText(/Autorizar/).closest('z-button');
expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
expect(screen.getByText(/antes de autorizar/)).toBeInTheDocument();
```

**6. `?.disabled` es un pase de TRES vías cuando el botón está habilitado.** React deja la
propiedad en `undefined` (no en `false`) al habilitar, así que
`expect(x?.disabled).not.toBe(true)` lo satisfacen `false`, `undefined` **y que
`closest('z-button')` devuelva `null`** — o sea, también pasa si el botón no existe. Para
"está habilitado", asserta la **consecuencia observable** (el click llama al handler /
completa la tarea / abre el modal) o la **transición** (antes `true`, después ya no).

**7. Los props de un componente del DS no siempre son propiedades.** En `ZrKpiValue`,
`amount` sí es propiedad del elemento, pero el encabezado se renderiza como
`<span slot="header">`. Ante la duda, volcá el `outerHTML` del elemento en un test
descartable antes de escribir la aserción.

### La zona horaria está fijada — no la quites

Ambos `vitest.config.ts` fijan `env: { TZ: 'America/Bogota' }`. Sin eso, toda aserción de
fecha depende de la máquina: pasa en local (UTC-5) y falla en CI (UTC). Se eligió la zona de
negocio, no UTC, porque `fechaHora.ts` convierte UTC→local a propósito para mostrar; y
Colombia no tiene DST, así que es determinista todo el año.

`core/fechaHora.test.ts` tiene un **test de guardia** que asserta el offset −5: si alguien
quita el `env`, falla ese test primero y con un mensaje claro, en vez de que fallen los de
conversión ISO con un off-by-hours indescifrable.

---

## Qué necesita test — por capa

### 1. Lógica pura (`core/*.ts`, helpers, `cotizador-service/app.py`) — OBLIGATORIO

Toda función/hook nuevo o modificado que transforma datos, calcula algo, o tiene ramas de
decisión (no solo pega a una API) necesita un test Vitest/pytest **colocado junto al
archivo que testea**, mismo patrón que ya existe:
- `core/useCollection.test.ts` — código↔label de colecciones PM4.
- `core/useCotizador.test.ts` — mapeo de resultado de cálculo a payload PM4.
- `screens/.../respuestaFinalTemplate.test.ts` — reemplazo de placeholders en HTML.
- `cotizador-service/tests/test_calc.py` — funciones `calc_*` contra `tables.json`.

Cubrir: el caso feliz, al menos un caso límite (vacío/null/cero), y cualquier gotcha
documentado en el comentario de la función (p. ej. un formato de fecha, un `null` que se
normaliza a `0`).

### 2. Componentes propios (`components/*.tsx`) — OBLIGATORIO

Smoke test con React Testing Library: renderiza sin lanzar, y el contenido/estado esperado
está presente. No hace falta testear cada variante visual (eso lo cubre `?screen=ds-catalog`
a ojo) — el objetivo es atrapar una regresión de props/lógica, no reemplazar el review visual.

```tsx
// components/ActionBar.test.tsx — patrón de referencia
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ZrButton } from './fields/ZdsFields';
import { ActionBar } from './ActionBar';

describe('ActionBar', () => {
  it('renderiza un ZrButton hijo con su texto', () => {
    render(<ActionBar><ZrButton content="Enviar" /></ActionBar>);
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });
});
```

### 3. Pantallas (`screens/**/NombrePantalla.tsx`) — OBLIGATORIO (smoke) + verificación manual

Las pantallas dependen de `useTask()` y `useCollection()` (ambos pegan a PM4 vía
`pm4Client`), así que hay que mockear los dos a nivel de módulo. Referencia real y
funcionando: [`COL_QD_SCR-0052_.../RespuestaAreaResponsable.test.tsx`](../../pm4-app/frontend/src/screens/atencion-cliente/quejas-directas/COL_QD_SCR-0052_Respuesta_Area_Responsable/RespuestaAreaResponsable.test.tsx).

#### ⚠️ Las 4 trampas (verificadas empíricamente — ignorarlas cuelga o rompe el test)

**1. Los mocks DEBEN devolver referencias estables.** Esta es la más grave: si
`useTask: () => ({ ... })` construye un objeto literal nuevo en cada llamada, `task` cambia
de identidad en cada render; el `useEffect(..., [task, reset])` que precarga el formulario
se vuelve a disparar, y el ciclo render→reset→render **no termina**. El test no falla con un
error claro: se cuelga ~5 minutos y muere con `FATAL ERROR: JavaScript heap out of memory`.
Lo mismo aplica a `useCollection` (un `options: []` literal nuevo reactiva `useSyncDesc`).
Declarar los objetos **fuera** de la factory:

```tsx
const OBJ_TASK = { id: 1, status: 'ACTIVE', process_request_id: 10, data: { qd_strComplaintText: 'Ejemplo' } };
const OBJ_USE_TASK = {
  task: OBJ_TASK, loading: false, error: null, submitting: false,
  completeTask: vi.fn(), saveDraft: vi.fn(), reassignTask: vi.fn(),
  startProcess: vi.fn(), isWebEntry: false,
};
vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

// ⚠️ La firma de useCollection es { options, loading, rawMap, records } — NO existe ningún
// campo `error`, y omitir `records`/`rawMap` revienta en las pantallas que sí los usan
// (SCR-000, SCR-003 y SCR-0051 llaman `records.filter(...)` y leen `rawMap`).
const CLL_VACIO: never[] = [];   // referencias estables, NO literales inline
const OBJ_RAW_MAP_VACIO: Record<string, Record<string, unknown>> = {};
const CLL_RECORDS_VACIO: Record<string, unknown>[] = [];
const OBJ_USE_COLLECTION = {
  options: CLL_VACIO, loading: false, rawMap: OBJ_RAW_MAP_VACIO, records: CLL_RECORDS_VACIO,
};

vi.mock('../../../../core/useCollection', async (in_fnImportOriginal) => {
  // descOf/useSyncDesc/resolvePmql son lógica pura ya testeada — se dejan reales.
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useCollection')>();
  return { ...objActual, useCollection: () => OBJ_USE_COLLECTION };
});
```

**2. La profundidad del path importa y falla en silencio.** Las 10 pantallas de Quejas
Directas están 4 niveles bajo `src/` → **`'../../../../core/useTask'`**. Las de
`screens/FAST-FLOW/<slug>/` están a 3 → `'../../../core/useTask'`. Un path que no resuelve
**no lanza error**: `vi.mock` registra un mock que nadie importa, corre el hook real, y el
test falla con un error de red confuso. Copiar el path del `import` real de la pantalla.

**3. Los valores de formulario NO se leen con `getByDisplayValue`.** Los controles del DS
renderizan como custom elements **sin `<input>`/`<textarea>` nativo dentro** (0 elementos
nativos en el DOM de jsdom). El valor vive en la propiedad `model` del elemento:

```tsx
const objTextarea = document.querySelector('z-textarea#field-qd_strComplaintText');
expect((objTextarea as unknown as { model?: string })?.model).toBe('Ejemplo');
```
Los wrappers de `ZdsFields` ponen `id={`field-${name}`}`, así que ese selector es estable.
El tag NO siempre coincide con el nombre del wrapper — `ZdsInput` (que envuelve
`ZrTextInput`) renderiza `z-text-input`, no `z-input`. Verificar el tag real en
`node_modules/@zurich/web-components/dist/react/<componente>.js` (busca el string literal
que se pasa a `jsxRuntimeExports.jsx(...)`) antes de asumirlo por el nombre del wrapper.

**4. `disabled` es propiedad, no atributo.** React 19 asigna las props que coinciden con
propiedades del custom element como propiedades → `hasAttribute('disabled')` da `false`
aunque el botón esté deshabilitado. Leer la propiedad:

```tsx
const objSubmit = screen.getByText(/Enviar comentario/).closest('z-button');
expect((objSubmit as unknown as { disabled?: boolean })?.disabled).toBe(true);
```

`getByText` **sí** funciona para texto en slots (labels, títulos de `FormSection`, children
de `ZrButton`) — es la vía normal para el smoke test de render.

#### Lo que NO se puede testear así

Interacción real sobre controles del DS (escribir en un campo, marcar un checkbox): al no
haber input nativo, `userEvent.type()`/`fireEvent.change()` no llegan al control. Validaciones
disparadas por typing, watchers y el flujo de submit se validan **a mano**.

**Esto no reemplaza la verificación manual.** El flujo completo (precarga real desde PM4,
watchers, subida de archivos, guardado de borrador) solo se valida de verdad en Docker:
`docker restart pm4-app-container` + `http://localhost:5173/?screen=<slug>` (o dentro del
iframe de PM4). El smoke test de RTL atrapa regresiones de render/props entre commits; no
sustituye probar la pantalla real antes de un cambio grande.

---

## Antes de dar por terminada cualquier tarea

```bash
docker exec pm4-app-container sh -c "cd /app && npm run build --workspace=frontend"
docker exec pm4-app-container sh -c "cd /app && npm run build --workspace=backend"
docker exec pm4-app-container sh -c "cd /app && npm run lint --workspace=frontend"
docker exec pm4-app-container sh -c "cd /app && npm run test --workspace=frontend"
# si se tocó cotizador-service:
docker exec cotizador-service-container sh -c "cd /app && pytest -q"
```

No dar una tarea por terminada con build, lint o tests rotos — ni con un test viejo que dejó
de pasar por el cambio actual (arreglarlo o el cambio no está completo).
