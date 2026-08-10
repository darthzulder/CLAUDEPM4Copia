# ZrEmptyState — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`). Fuente: `dev-utils/dist/code/EmptyState.props.d.ts` + `web-components/dist/empty-state.d.ts` + `web-components/dist/react/empty-state.d.ts` + `css-components/dist/EmptyState.css`.
> **Platform:** React / Web / CSS
> **Category:** Molecules *(composite content surface)*
> **Package:** `@zurich/web-components/react/empty-state`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida un **estado vacío** (lista/tabla sin resultados, sin documentos, sin registros) — reemplazo directo de `.no-docs-card` y `.record-empty` en `shared.css`.

1. Import:
   ```tsx
   import { ZrEmptyState } from '@zurich/web-components/react/empty-state';
   ```
2. Props principales: `header` (título), `content` (texto de apoyo), `pictogram` (ícono grande temático — hereda de `HasPictogram`), `image-src`/`image-alt`/`cross-origin` (hereda de `HasImage`, alternativa a `pictogram`).
3. Slot `actions` (vía sub-componente `ZrEmptyState.Actions` o prop) para un botón de acción (p.ej. "Cargar documento").
4. Es **responsive por `@container`**: a <768px reduce paddings y tipografía automáticamente — no hay que replicar breakpoints a mano como en `.no-docs-card`.
5. No declara eventos — es presentacional; el `onClick` va en el/los `<ZrButton>` dentro de `actions`.

---

## 2. Import

```tsx
import { ZrEmptyState } from '@zurich/web-components/react/empty-state';
import { ZrButton }     from '@zurich/web-components/react/button';
```

---

## 3. Props (Parameters)

| Prop            | Type                                  | Default | Required | Description                                                    |
|-----------------|-----------------------------------------|---------|----------|------------------------------------------------------------------|
| `header`        | `string` \| `ReactSlot`                 | —       | No       | Título (`--zf-h-44`).                                            |
| `content`       | `string` \| `ReactSlot`                 | —       | No       | Texto de apoyo (`--zf-body-20--300`).                             |
| `pictogram`     | `PictogramName` (+ modificador `dark`) | —       | No       | Ícono grande temático (alternativa a `image-src`).                |
| `image-src`     | `ZurichImageName` \| URL                | —       | No       | Imagen alternativa al pictograma.                                 |
| `image-alt`     | `string`                                | —       | No       | Alt text de la imagen.                                            |
| `cross-origin`  | `'anonymous'` \| `'use-credentials'`   | —       | No       | Atributo `crossorigin` del `<img>`.                               |
| `custom`        | `CustomTokens<'bg'\|'color'>`           | —       | No       | Override de fondo/color vía props (equivalente a `--z-empty-state--bg/--color`). |

---

## 4. Events

> No declara eventos propios. Wire interacciones en el/los `<ZrButton>` del slot `actions`.

---

## 5. Slots

Slots declarados (`zEmptyStateSlots`): `content`, `header`, `image-src`, `actions`. En React, `content`/`header`/`image-src` se pasan como **props** (ver §1.2); `actions` se compone vía sub-componente:

| Sub-componente             | Equivale a       |
|------------------------------|------------------|
| `ZrEmptyState.Header`        | prop `header`    |
| `ZrEmptyState.Content`       | prop `content`   |
| `ZrEmptyState.Actions`       | slot `actions` (children — botones) |

---

## 6. CSS Customization Tokens

| CSS Variable                 | Type   | Purpose                                                       |
|-------------------------------|--------|------------------------------------------------------------------|
| `--z-empty-state--bg`         | color  | Fondo del bloque (default: `var(--z-sf-brand)`).                  |
| `--z-empty-state--color`      | color  | Color de texto (default: `var(--z-ct-primary)`).                  |

---

## 7. Canonical Examples

### 7.1 Mínimo
```tsx
<ZrEmptyState header="Sin documentos" content="Aún no se han cargado soportes para este caso." />
```

### 7.2 Con pictograma
```tsx
<ZrEmptyState
  pictogram="empty-folder"
  header="Sin documentos"
  content="Aún no se han cargado soportes para este caso."
/>
```

### 7.3 Con acción (subir documento)
```tsx
<ZrEmptyState pictogram="empty-folder" header="Sin documentos">
  Aún no se han cargado soportes para este caso.
  <ZrEmptyState.Actions>
    <ZrButton config="secondary:s" icon="upload:line">Cargar documento</ZrButton>
  </ZrEmptyState.Actions>
</ZrEmptyState>
```

### 7.4 Reemplazo directo de `.record-empty`
```tsx
<ZrEmptyState header="Sin resultados" content="No hay registros que coincidan con el filtro aplicado." />
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`pictogram` e `image-src` son alternativos**, no se combinan — elegir uno.
- ❗ **No replicar breakpoints a mano** — el `@container` interno ya reduce padding/tipografía en <1200px/<992px/<768px; no envolver en media queries propias.
- ❗ **Acciones van en `ZrEmptyState.Actions`**, nunca sueltas como hijos directos sin el wrapper.
- ❗ **Es puramente presentacional** — no tiene loading state propio; si se necesita un loader, combinar con `ZrLoader` externamente (no anidarlo dentro de `ZrEmptyState`).

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                  → Use...
--------------------------------------------------------------------------
"no hay documentos/registros" (estado vacío)       → <ZrEmptyState header content>
+ ícono temático                                    → + pictogram="..."
+ botón de acción (cargar/crear)                    → + ZrEmptyState.Actions > ZrButton
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrEmptyStateProps = {
  header?: string | React.ReactNode;
  content?: string | React.ReactNode;
  pictogram?: string;
  'image-src'?: string;
  'image-alt'?: string;
  'cross-origin'?: 'anonymous' | 'use-credentials';
  children?: React.ReactNode; // para ZrEmptyState.Actions
};
```

---

## 11. Composition Patterns

### 11.1 Reemplazo de `.no-docs-card` (`DocList`/`DocItem`)
```tsx
{docs.length === 0 && (
  <ZrEmptyState pictogram="empty-folder" header="Sin documentos">
    No se han cargado soportes para este caso.
  </ZrEmptyState>
)}
```

> Antes de migrar `.no-docs-card`/`.record-empty`: revisar el catálogo de `pictogram` disponible (`PictogramName` en `dev-utils/dist/data`) para elegir uno acorde al dominio (documentos, búsqueda vacía, etc.) — no inventar un nombre de pictograma sin verificarlo ahí.
