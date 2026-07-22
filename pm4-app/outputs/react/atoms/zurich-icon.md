# ZrIcon — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Atoms *(action / interactive primitives)*
> **Package:** `@zurich/web-components/react/icon`
> **Fuente:** https://zds.zurich.com/0.8.1/atoms/icon__react.html

---

## 1. AI Implementation Instructions

Usa `ZrIcon` cuando necesites un **icono standalone** (fuera de un botón/input/tab, que ya tienen su prop `icon`). En este proyecto **no uses emojis** (📄, ✓, …) como iconos: usa `ZrIcon`.

1. **En screens, impórtalo desde la fachada** `ZdsFields`, nunca de `@zurich/...` directo:
   ```tsx
   import { ZrIcon } from '../../components/fields/ZdsFields';
   ```
2. **`icon` es obligatorio** y sigue el patrón `<name>[:style]` (igual que la prop `icon` de `ZrButton`/`ZrTextInput`). `:line` = versión outline. Ej.: `file-blank:line`, `search:line`, `info:line`.
3. **Tamaño y color** van en `config` con el patrón `<size>[:color]` (p.ej. `config="l"`, `config="m:moss"`).
4. **No inventes nombres de icono.** Verifícalos en `../foundations/assets/zurich-icons.md`.
5. **No le pongas `z-flex`** ni estilos de layout; es un átomo inline.

---

## 2. Import

```tsx
import { ZrIcon } from '@zurich/web-components/react/icon';
// En screens del proyecto: import { ZrIcon } from '../../components/fields/ZdsFields';
```

---

## 3. Props (Parameters)

| Prop     | Type                                   | Default | Required | Description                                                                 |
|----------|----------------------------------------|---------|----------|-----------------------------------------------------------------------------|
| `icon`   | `string` — `<name>[:style]`            | —       | ✅ Yes    | Icono a mostrar. `style` opcional (`line` = outline). Ej. `file-blank:line`.|
| `config` | `string` — `<size>[:color]`            | —       | No       | `size`: `xs` \| `s` \| `m` \| `l`. `color`: ver tabla abajo.                |

**Valores de `color`** (segundo segmento de `config`):
`default`, `black`, `white`, `teal`, `moss`, `lilac`, `peach`, `candy`, `mint`, `lime`, `lemon`, `powder-pink`.

> No se documentan eventos, slots ni CSS tokens (`--z-icon--*`) en la página oficial 0.8.1.

---

## 4. Canonical Examples

```tsx
// Mínimo (solo nombre + estilo outline)
<ZrIcon icon="file-blank:line" />

// Tamaño grande
<ZrIcon icon="file-blank:line" config="l" />

// Tamaño pequeño + color
<ZrIcon icon="info:line" config="s:moss" />

// Dentro de una fila de texto (gap lo da el contenedor flex)
<div className="help-product-doc">
  <ZrIcon icon="file-blank:line" config="xs" /> {descripcion}
</div>
```

---

## 5. Behavior Rules (for the AI)

- ❗ `icon` es obligatorio; sin él no renderiza.
- ❗ Nombre de icono debe existir en el catálogo (`foundations/assets/zurich-icons.md`). No inventar.
- ❗ Para iconos **dentro de** botones/inputs/tabs, usa la prop `icon` de ESE componente, no `ZrIcon` aparte.
- ❗ Tamaño/color SIEMPRE vía `config`, no con CSS `font-size` sobre un wrapper.
- ❗ Reemplaza emojis usados como icono por `ZrIcon`.

---

## 6. Quick Decision Tree (for the AI)

```
Necesito un icono...
  dentro de un botón/input/tab        → prop icon="name:line" de ESE componente
  standalone (en texto, header, slot) → <ZrIcon icon="name:line" config="<size>[:color]" />
  con color de estado                 → config="<size>:moss|peach|..." 
  emoji como icono                    → ❌ usar <ZrIcon> en su lugar
```

---

## 7. TypeScript Type Hint (suggested)

```ts
type ZrIconProps = {
  icon: string;            // "<name>[:style]" — p.ej. "file-blank:line"
  config?: string;         // "<size>[:color]" — size xs|s|m|l
};
```
