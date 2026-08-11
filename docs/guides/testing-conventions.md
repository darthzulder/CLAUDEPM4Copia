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

Comandos: `npm run test --workspace=frontend` (Vitest, ambos projects) ·
`pytest -q` desde `cotizador-service/` (Python).

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

const CLL_VACIO: never[] = [];   // referencia estable, NO `options: []` inline
vi.mock('../../../../core/useCollection', async (in_fnImportOriginal) => {
  // descOf/useSyncDesc son lógica pura ya testeada — se dejan reales.
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useCollection')>();
  return { ...objActual, useCollection: () => ({ options: CLL_VACIO, loading: false, error: null }) };
});
```

**2. La profundidad del path importa y falla en silencio.** Las 11 pantallas de Quejas
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
