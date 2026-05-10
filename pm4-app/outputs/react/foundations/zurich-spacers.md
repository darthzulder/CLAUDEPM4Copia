# Zurich Spacers — Foundations

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same tokens everywhere)
> **Package:** `@zurich/design-tokens`
> **Companion docs:**
> - [`zurich-layouts-grid.md`](./zurich-layouts-grid.md) for the 12-column grid (8px / 4px vertical rhythm).
> - [`zurich-layouts-flex.md`](./zurich-layouts-flex.md) for `z-flex` and `z-align` (which consume these tokens via the `gap` modifier).
> **Scope of this file:** the **spacing scale tokens** (`--zs-*`) used for margins, paddings, gaps, and any consistent whitespace.

---

## 1. AI Implementation Instructions

When the user asks about **spacing**, **margins**, **paddings**, **gaps**, **whitespace**, **rhythm**, **gutters**, **root font size**, or **how to apply a consistent gap between elements**, use this foundation.

1. **Always use the `--zs-*` tokens** for any spacing value. **Never hardcode `px` / `rem`** values for margins, paddings, gaps, or insets.
2. **Sizes are `rem`-based and responsive.** The root font size drives the absolute pixel value — changing it scales every spacing token uniformly.
3. **Token name = numeric scale index, NOT pixels.** `--zs-100` is `1rem` (= `16px` at the default root). `--zs-300` is `3rem` (= `48px`), **not** `300px`.
4. **The full sanctioned scale:** `12` · `25` · `50` · `75` · `100` · `150` · `200` · `250` · `300` · `400` · `600` · `1000`. **Pick from these** — don't interpolate new sizes.
5. **The `z-flex` `gap` modifier accepts a subset** of the scale: `50` · `75` · `100` · `150` · `200` · `300` (see `zurich-layouts-flex.md`).
6. **Root font size customization** is supported via `:root { font-size: <12..20>px }`. Stick to **even values between 12 and 20**.
7. **Vertical rhythm:**
   - 8px (`--zs-50`) → spacing **between components**.
   - 4px (`--zs-25`) → spacing **inside components** (paddings, inner gaps).
8. **Apply tokens via CSS variables**, not via the token name as a class. `padding: var(--zs-100)`, not `padding: zs-100`.

---

## 2. Root Size & Responsiveness

| Property            | Value                                                                                  |
|---------------------|----------------------------------------------------------------------------------------|
| Default root size   | **16px** (anchored to the `--zs-100` token = `1rem`).                                  |
| Recommended values  | Even values **between 12 and 20px**: `12`, `14`, `16`, `18`, `20`.                     |
| Where to set        | `:root { font-size: <N>px; }` in CSS.                                                  |
| Effect              | All `--zs-*` tokens (and any `rem`-based size in ZDS) scale linearly with the root.    |

```css
/* Default — equivalent to omitting the rule */
:root { font-size: 16px; }

/* Accessibility-friendly bump */
:root { font-size: 18px; }

/* Compact layout (tablet/desktop dashboards) */
:root { font-size: 14px; }
```

> Token values shown in §3 assume the default 16px root. At any other root, multiply each token's `rem` value by the configured pixel size.

---

## 3. CSS Tokens — Full Spacing Scale

| Scale | Pixels (at 16px root) | CSS token        | Value      |
|-------|------------------------|------------------|------------|
| 12    | 2 px                   | `--zs-12`        | `.125rem`  |
| 25    | 4 px                   | `--zs-25`        | `.25rem`   |
| 50    | 8 px                   | `--zs-50`        | `.5rem`    |
| 75    | 12 px                  | `--zs-75`        | `.75rem`   |
| 100   | 16 px                  | `--zs-100`       | `1rem`     |
| 150   | 24 px                  | `--zs-150`       | `1.5rem`   |
| 200   | 32 px                  | `--zs-200`       | `2rem`     |
| 250   | 40 px                  | `--zs-250`       | `2.5rem`   |
| 300   | 48 px                  | `--zs-300`       | `3rem`     |
| 400   | 64 px                  | `--zs-400`       | `4rem`     |
| 600   | 96 px                  | `--zs-600`       | `6rem`     |
| 1000  | 160 px                 | `--zs-1000`      | `10rem`    |

> The scale follows roughly geometric growth — there's no token between `300` and `400`, `400` and `600`, or `600` and `1000`. Don't try to fill those gaps with custom values.

---

## 4. Recommended Use per Scale Level

| Token       | Typical use                                                                                    |
|-------------|------------------------------------------------------------------------------------------------|
| `--zs-12`   | Hairline detail (icon-to-text micro-gap).                                                      |
| `--zs-25`   | **4px grid** — inner-component spacing (chip padding, divider spacing).                        |
| `--zs-50`   | **8px grid** — base spacing between sibling components / form fields.                          |
| `--zs-75`   | Compact inner padding (small buttons, dense lists).                                            |
| `--zs-100`  | Standard inner padding (cards, modals, list rows).                                             |
| `--zs-150`  | Section vertical rhythm; spacing between groups.                                               |
| `--zs-200`  | Generous padding (hero sections, large modals).                                                |
| `--zs-250`  | Comfortable spacing (page-level paddings on tablet+).                                          |
| `--zs-300`  | Large spacing between page sections.                                                           |
| `--zs-400`  | Hero / banner padding on desktop.                                                              |
| `--zs-600`  | Page-level top/bottom rhythm on landing pages.                                                 |
| `--zs-1000` | Extra-large hero whitespace; rarely used inside dense UI.                                      |

---

## 5. Canonical Examples

### 5.1 Padding via tokens
```css
.card-body { padding: var(--zs-100); }                   /* 16px */
.hero      { padding: var(--zs-300) var(--zs-200); }     /* 48px 32px */
.chip      { padding: var(--zs-25) var(--zs-50); }       /* 4px 8px */
```

### 5.2 Margin between sections
```css
.section + .section { margin-top: var(--zs-200); }       /* 32px */
```

### 5.3 Inline gap via grid / flex
```css
.toolbar  { display: flex; gap: var(--zs-100); }
.cards    { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--zs-150); }
```

### 5.4 Inside ZDS layout attributes (`z-flex` consumes the scale subset)
```html
<section z-flex="100">   <!-- gap = --zs-100 = 16px -->
  <div>A</div>
  <div>B</div>
</section>

<section z-flex="wrap:200">  <!-- gap = --zs-200 = 32px -->
  <div>A</div>
  <div>B</div>
  <div>C</div>
</section>
```

### 5.5 Inside ZDS component tokens
```tsx
<ZrCard
  config="grid"
  style={{
    ['--z-card--padding' as any]: 'var(--zs-150)',
    ['--z-card--gap' as any]:     'var(--zs-100)',
  }}
>
  …
</ZrCard>

<ZrForm
  style={{
    ['--z-form--gap' as any]:    'var(--zs-100)',
    ['--z-form--margin' as any]: 'var(--zs-150) 0',
  }}
>
  …
</ZrForm>
```

### 5.6 React inline styles
```tsx
<section style={{
  paddingBlock: 'var(--zs-200)',
  paddingInline: 'var(--zs-100)',
  display: 'grid',
  gap: 'var(--zs-100)',
}}>
  …
</section>
```

### 5.7 Custom root for accessibility
```css
/* Bump everything up ~12.5% for low-vision users */
:root { font-size: 18px; }
```

### 5.8 Avoid: anti-patterns
```css
/* ❌ Hardcoded pixel values */
.card { padding: 16px; }

/* ❌ Token name interpreted as pixels */
/* "--zs-300 must be 300px" → WRONG: --zs-300 is 3rem (48px at default root). */
.hero { padding: 300px; }

/* ❌ Custom interpolated step (no token between 300 and 400) */
.section { padding: 56px; }

/* ❌ Odd root size */
:root { font-size: 15px; }   /* recommend even 12/14/16/18/20 */
```

---

## 6. Behavior Rules (for the AI)

- ❗ **Token-first, px-never.** Any margin / padding / gap / offset must reference `--zs-*`.
- ❗ **Names are scale indexes, not pixels.** `--zs-50` = `.5rem` = `8px` (at 16px root). `--zs-300` = `3rem` = `48px`.
- ❗ **Only sanctioned steps** exist (`12`, `25`, `50`, `75`, `100`, `150`, `200`, `250`, `300`, `400`, `600`, `1000`). No `175`, no `225`, no `500`.
- ❗ **`z-flex` gap accepts a subset** of the scale: `50` / `75` / `100` / `150` / `200` / `300`. The full scale is available via raw CSS variables when needed.
- ❗ **Use `--zs-25` (4px) for inner-component spacing** and `--zs-50` (8px) for inter-component spacing — the vertical-rhythm convention from the Grid foundation.
- ❗ **Root size customization** uses `:root { font-size: <N>px }`; stick to **even values 12–20**.
- ❗ **All ZDS components expose `--z-*` tokens** (`--z-card--padding`, `--z-form--gap`, `--z-sidebar--padding`, etc.) — set them to a `--zs-*` value instead of a raw px/rem.
- ❗ **Tokens cascade with CSS variables**, so changing the root font-size automatically rescales everything based on `rem`.

---

## 7. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
inner padding of a card / modal                         → --zs-100 / --zs-150
gap between two form fields                             → --zs-50 / --zs-75
gap between two cards in a grid                         → --zs-100 / --zs-150
section break                                           → --zs-200 / --zs-300
hero padding (desktop)                                  → --zs-300 / --zs-400
hairline gap (e.g. icon + text)                         → --zs-12 / --zs-25
matching ZDS gap modifier in z-flex                     → use 50 / 75 / 100 / 150 / 200 / 300
arbitrary 14px / 23px / 56px                            → ❌ pick the closest sanctioned step
root size for accessibility scale-up                    → :root { font-size: 18px; }   (even 12–20)
```

---

## 8. TypeScript Helper (suggested)

```ts
// utilities/spacing.ts
export type ZSpacerStep =
  | 12 | 25 | 50 | 75 | 100 | 150 | 200 | 250 | 300 | 400 | 600 | 1000;

/** Returns `var(--zs-<step>)` ready to use in `style={...}` or CSS-in-JS. */
export function space(step: ZSpacerStep): string {
  return `var(--zs-${step})`;
}

// Usage:
// <section style={{ padding: space(150), gap: space(100) }}>...</section>
// <ZrCard style={{ ['--z-card--padding' as any]: space(100) }}>...</ZrCard>
```

---

## 9. Composition Patterns

### 9.1 Page section rhythm
```css
.page-section {
  padding-block: var(--zs-300);
}
.page-section + .page-section {
  margin-top: var(--zs-150);
}
```

### 9.2 Form with spacing tokens
```tsx
<ZrForm
  style={{
    ['--z-form--gap' as any]:    'var(--zs-100)',
    ['--z-form--margin' as any]: '0 0 var(--zs-200) 0',
  }}
>
  {/* fields */}
</ZrForm>
```

### 9.3 Card grid using spacing tokens
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 'var(--zs-150)',
  padding: 'var(--zs-200)',
}}>
  <ZrCard config="grid">A</ZrCard>
  <ZrCard config="grid">B</ZrCard>
  <ZrCard config="grid">C</ZrCard>
</div>
```

### 9.4 Toolbar with sanctioned gap
```html
<section z-flex="50" z-align="between" style="padding: var(--zs-75) var(--zs-100);">
  <div z-flex="25">
    <button>Bold</button>
    <button>Italic</button>
  </div>
  <button>Save</button>
</section>
```

---

## 10. Cheat Sheet

```
TOKEN PATTERN:    var(--zs-<step>)
STEPS:            12 · 25 · 50 · 75 · 100 · 150 · 200 · 250 · 300 · 400 · 600 · 1000
ROOT (default):   16px  →  --zs-100 = 1rem = 16px
RECOMMENDED ROOT: 12 / 14 / 16 / 18 / 20 (even)

z-flex GAP SUBSET:  50 · 75 · 100 · 150 · 200 · 300

RHYTHM RULE:
  8px (--zs-50)  → spacing BETWEEN components
  4px (--zs-25)  → spacing INSIDE components

ZDS COMPONENT TOKENS (set to --zs-*):
  --z-card--padding, --z-card--gap
  --z-form--margin, --z-form--gap
  --z-modal--padding
  --z-sidebar--padding
  --z-table--cell-padding
  --z-input-group--gap
```

> Rule of thumb: **`--zs-*` everywhere, names are scale indexes (not pixels), keep to sanctioned steps, and let `rem`-based scaling do the responsive work.**
