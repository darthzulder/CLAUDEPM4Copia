# ZrPagination — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`). Fuente: `dev-utils/dist/code/Pagination.props.d.ts` + `web-components/dist/pagination.d.ts` + `web-components/dist/react/pagination.d.ts`.
> **Platform:** React / Web
> **Category:** Layout *(structural/navegación de listas)*
> **Package:** `@zurich/web-components/react/pagination`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida **paginación de una tabla/lista** (p.ej. reemplazo de `.dashboard-pagination` en `shared.css`).

1. Import:
   ```tsx
   import { ZrPagination } from '@zurich/web-components/react/pagination';
   ```
2. **Es un componente controlado**: bindea `model` (página actual, 1-based por convención del resto del DS — no verificado explícitamente en el `.d.ts`, pero consistente con `ZdsStepper`/`ZrTabs`) + `onChange`.
3. `pages` = número total de páginas.
4. `show-edges` (`boolean`) muestra los botones de ir a primera/última página.
5. `disabled` (`boolean`) bloquea toda interacción.
6. Expone métodos imperativos en la clase base (`focus()`, `reset()`) — solo accesibles vía `ref` si el wrapper React lo reenvía (`ZrPagination_Type` declara `ref?: React.ForwardedRef<ZPagination>`).
7. ⚠️ **No se encontró `Pagination.css` en el paquete `css-components`** (a diferencia de `KpiValue.css`, `Footer.css`, etc.) — el estilo vive embebido en los estilos `lit` del propio `web-components` (`static styles` en `pagination.d.ts`), no como tokens CSS documentables por separado. No inventar variables `--z-pagination--*` sin confirmarlas en el DOM compilado.

---

## 2. Import

```tsx
import { ZrPagination } from '@zurich/web-components/react/pagination';
```

---

## 3. Props (Parameters)

| Prop          | Type      | Default | Required | Description                                              |
|---------------|-----------|---------|----------|------------------------------------------------------------|
| `model`       | `number`  | —       | No       | Página actual — controlado, bindear a estado.              |
| `pages`       | `number`  | —       | No       | Número total de páginas.                                   |
| `show-edges`  | `boolean` | `false` | No       | Muestra botones de primera/última página.                  |
| `disabled`    | `boolean` | `false` | No       | Bloquea toda interacción.                                   |

---

## 4. Events

| Event       | Payload                                | Description                                  |
|-------------|------------------------------------------|-----------------------------------------------|
| `onChange`  | `number` (nuevo valor de `model`)        | Se dispara al cambiar de página.              |
| `onRestarted` | `void`                                 | Se dispara al llamar al método `reset()`.     |

---

## 5. Slots

> `zPaginationSlots: never[]` — no declara slots.

---

## 6. CSS Customization Tokens

> No se encontró hoja `Pagination.css` en `css-components` — sin tokens `--z-pagination--*` verificables. Omitido por regla §6.3 (no inventar).

---

## 7. Canonical Examples

### 7.1 Mínimo (controlado)
```tsx
import { useState } from 'react';

function CasosPaginados({ totalPages }: { totalPages: number }) {
  const [page, setPage] = useState(1);
  return (
    <ZrPagination model={page} pages={totalPages} onChange={setPage} />
  );
}
```

### 7.2 Con botones de extremos
```tsx
<ZrPagination model={page} pages={totalPages} show-edges onChange={setPage} />
```

### 7.3 Deshabilitado (mientras carga)
```tsx
<ZrPagination model={page} pages={totalPages} disabled={loading} onChange={setPage} />
```

---

## 8. Behavior Rules (for the AI)

- ❗ **Siempre controlado**: `model` + `onChange` juntos, nunca solo `model` estático.
- ❗ **No asumir tokens CSS** que no estén confirmados — este componente no trajo `.css` propio en el paquete vendorizado.
- ❗ **No confundir con `ZrStepper`** — `ZrStepper` es un contador de pasos de wizard (1-based, `[1, steps]`, ya usado en el proyecto como `ZdsStepper`); `ZrPagination` es específicamente paginación de listas/tablas.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                          → Use...
---------------------------------------------------------------
paginación de tabla/lista                  → <ZrPagination model pages onChange>
contador de pasos de wizard                → ZrStepper (ya expuesto como ZdsStepper)
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrPaginationProps = {
  model?: number;
  pages?: number;
  'show-edges'?: boolean;
  disabled?: boolean;
  onChange?: (page: number) => void;
  onRestarted?: () => void;
};
```

---

## 11. Composition Patterns

### 11.1 Reemplazo directo de `.dashboard-pagination`
```tsx
<div className="dashboard-pagination">
  <span>{totalRecords} resultados</span>
  <ZrPagination model={page} pages={totalPages} show-edges onChange={setPage} />
</div>
```

> Antes de adoptarlo: confirmar visualmente contra `?screen=ds-catalog` que el estilo resultante (sin `.css` propio documentado) calza con el resto de la UI del dashboard.
