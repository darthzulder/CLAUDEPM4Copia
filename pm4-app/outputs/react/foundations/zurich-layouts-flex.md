# Zurich Layouts — Flex (`z-flex` + `z-align`)

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same attributes everywhere)
> **Package:** `@zurich/design-tokens`
> **Companion doc:** see [`zurich-layouts-grid.md`](./zurich-layouts-grid.md) for the 12-column grid system.
> **Scope of this file:** the `z-flex` and `z-align` HTML attributes for laying out elements with CSS flexbox **without writing CSS**.

---

## 1. AI Implementation Instructions

When the user asks for **flexbox**, **row / column layout**, **wrap / reverse**, **gap between items**, **alignment** (`justify-content`, `align-items`, `align-content`), **centered content**, or any short-form way to express a flex container without writing CSS rules, use this foundation.

1. **Apply layout as HTML attributes on a container element** (typically `<section>`, `<div>`, `<header>`, …). No CSS classes needed.
2. **`z-flex`** controls `flex-direction`, `flex-wrap` and `gap` in one string with the pattern:
   ```
   z-flex="<?direction>:<?wrap>:<?gap>"
   ```
3. **`z-align`** controls `justify-content`, `align-items` and `align-content` in one string with the pattern:
   ```
   z-align="<justify>:<?align>:<?content>"
   ```
   `z-align` must be used **together with `z-flex`** (its sibling).
4. **`z-flex`** sets `align-items: center` by default — vertical centering is the baseline behavior. If you want a different vertical alignment, override it via `z-align`'s second segment.
5. **Gap values** come from the Spacing foundation: `50`, `75`, `100`, `150`, `200`, `300`. Default is `0` (no gap).
6. **Use boolean `z-flex` with no value** to apply the default `row`, no-wrap, no-gap layout (with `align-items: center`).
7. **Prefer `z-flex` over inline `display: flex`** — it keeps your layouts consistent with the rest of the design system and avoids divergent flex behaviors.
8. **Don't apply `z-flex` to a `<ZrCard>` or `<ZrForm>`** — those components have their own internal layout primitives (`config="grid"`, `--z-card--gap`, `--z-form--gap`). Use `z-flex` on raw HTML containers.

---

## 2. `z-flex` Attribute — Reference

### 2.1 Grammar

```
z-flex="<?direction>:<?wrap>:<?gap>"
```

Each segment is optional. Empty/missing segments default to:
- `direction` → `row`
- `wrap` → no wrap
- `gap` → `0`

### 2.2 Direction values (maps to `flex-direction`)

| Value           | CSS equivalent      | Notes                                |
|-----------------|---------------------|--------------------------------------|
| `row`           | `flex-direction: row` | Default when omitted.              |
| `column` / `col`| `flex-direction: column` | Short form `col` allowed.         |
| `row-rev` / `rev`| `flex-direction: row-reverse` | Short form `rev` allowed.    |
| `column-rev` / `col-rev` | `flex-direction: column-reverse` | —                  |

### 2.3 Wrap values (maps to `flex-wrap`)

| Value      | CSS equivalent          |
|------------|-------------------------|
| `wrap`     | `flex-wrap: wrap`       |
| `wrap-rev` | `flex-wrap: wrap-reverse` |

> If the **direction** is omitted, you may write `z-flex="wrap"` and the wrap modifier still applies.

### 2.4 Gap values (maps to `gap`)

| Value | Spacing token (ZDS Spacing foundation)             |
|-------|----------------------------------------------------|
| `50`  | smallest gap                                       |
| `75`  | small                                              |
| `100` | medium                                             |
| `150` | medium-large                                       |
| `200` | large                                              |
| `300` | largest                                            |

> Default = `0`. Do **not** use arbitrary px / rem values — pick from the sanctioned list.

### 2.5 Valid `z-flex` examples

| Attribute                      | Direction        | Wrap        | Gap |
|--------------------------------|------------------|-------------|-----|
| `z-flex`                       | row              | no          | 0   |
| `z-flex="100"`                 | row              | no          | 100 |
| `z-flex="wrap:200"`            | row              | wrap        | 200 |
| `z-flex="row:wrap:150"`        | row              | wrap        | 150 |
| `z-flex="col"`                 | column           | no          | 0   |
| `z-flex="col:50"`              | column           | no          | 50  |
| `z-flex="col-rev:wrap:50"`     | column-reverse   | wrap        | 50  |
| `z-flex="col:wrap-rev:50"`     | column           | wrap-reverse| 50  |
| `z-flex="rev"`                 | row-reverse      | no          | 0   |

---

## 3. `z-align` Attribute — Reference

### 3.1 Grammar

```
z-align="<justify>:<?align>:<?content>"
```

Each segment is optional except the first (`justify`).

### 3.2 Justify values (maps to `justify-content`)

| Value     | CSS equivalent                |
|-----------|-------------------------------|
| `center`  | `justify-content: center`     |
| `left`    | `justify-content: flex-start` |
| `right`   | `justify-content: flex-end`   |
| `even`    | `justify-content: space-evenly` |
| `between` | `justify-content: space-between` |
| `around`  | `justify-content: space-around`  |

> Note: the docs phrase says it "modifies `flex-direction`" — that is misleading. The first segment of `z-align` actually drives `justify-content` (horizontal placement along the main axis when `direction=row`).

### 3.3 Align values (maps to `align-items`)

| Value      | CSS equivalent              |
|------------|-----------------------------|
| `center`   | `align-items: center` *(default of `z-flex`)* |
| `top`      | `align-items: flex-start`   |
| `bottom`   | `align-items: flex-end`     |
| `stretch`  | `align-items: stretch`      |
| `baseline` | `align-items: baseline`     |

### 3.4 Content values (maps to `align-content`)

Used when items wrap into multiple lines — distributes the lines along the cross-axis.

| Value      | CSS equivalent                  |
|------------|---------------------------------|
| `join`     | `align-content: center`         |
| `start`    | `align-content: flex-start`     |
| `end`      | `align-content: flex-end`       |
| `fill`     | `align-content: stretch`        |
| `disperse` | `align-content: space-between`  |
| `uniform`  | `align-content: space-evenly`   |

### 3.5 Valid `z-align` examples

| Attribute                              | Justify | Align  | Content |
|----------------------------------------|---------|--------|---------|
| `z-align="center"`                     | center  | (default `center`) | — |
| `z-align="right"`                      | right   | (default `center`) | — |
| `z-align="right:bottom"`               | right   | bottom | — |
| `z-align="even:even"`                  | even    | even   | — *(rare — "even" as align means stretched evenly via CSS distribution)* |
| `z-align="center:join"`                | center  | (default `center`) | join |
| `z-align="right:bottom:end"`           | right   | bottom | end |

> **`z-align` requires `z-flex`** on the same element. Without `z-flex`, the alignment attributes are ignored.

---

## 4. Canonical Examples

### 4.1 Default flex (row, no wrap, no gap)
```html
<section z-flex>
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</section>
```

### 4.2 Row with medium gap
```html
<section z-flex="100">
  <div>1</div><div>2</div><div>3</div><div>4</div>
</section>
```

### 4.3 Wrapping row with large gap
```html
<section z-flex="wrap:200">
  <div>1</div><div>2</div><div>3</div>
  <div>4</div><div>5</div><div>6</div>
</section>
```

### 4.4 Reverse column with wrap
```html
<section z-flex="col-rev:wrap:50">
  <div>1</div><div>2</div><div>3</div>
  <div>4</div><div>5</div><div>6</div>
</section>
```

### 4.5 Column with reverse-wrap
```html
<section z-flex="col:wrap-rev:50">
  <div>1</div><div>2</div><div>3</div>
  <div>4</div><div>5</div><div>6</div>
</section>
```

### 4.6 Center horizontally
```html
<section z-flex="50" z-align="center">
  <div>1</div><div>2</div><div>3</div><div>4</div>
</section>
```

### 4.7 Right-aligned row
```html
<section z-flex="50" z-align="right">
  <div>1</div><div>2</div><div>3</div><div>4</div>
</section>
```

### 4.8 Right + bottom
```html
<section z-flex="50" z-align="right:bottom" style="height: 100px;">
  <div>1</div><div>2</div><div>3</div><div>4</div>
</section>
```

### 4.9 Wrapping rows joined to the center
```html
<section z-flex="wrap" z-align="center:join" style="height: 200px;">
  <div>1</div><div>2</div><div>3</div>
  <div>4</div><div>5</div><div>6</div>
</section>
```

### 4.10 Three-axis alignment
```html
<section z-flex="50" z-align="right:bottom:end" style="height: 200px;">
  <div>1</div><div>2</div><div>3</div>
  <div>4</div><div>5</div><div>6</div>
</section>
```

### 4.11 React JSX (kebab attributes pass through)
```tsx
<section z-flex="wrap:100" z-align="center">
  {items.map((it) => <div key={it.id}>{it.label}</div>)}
</section>
```

### 4.12 Toolbar (icon group on the left, primary on the right)
```html
<section z-flex="100" z-align="between" style="padding: 0.5rem 1rem;">
  <div z-flex="50">
    <button>Bold</button>
    <button>Italic</button>
    <button>Underline</button>
  </div>
  <button>Save</button>
</section>
```

### 4.13 Hero with vertically centered content
```html
<section z-flex="col:200" z-align="center:center" style="height: 100vh;">
  <h1 z-heading="display">Welcome</h1>
  <p>Protection for what matters most.</p>
  <button>Get started</button>
</section>
```

---

## 5. Behavior Rules (for the AI)

- ❗ **`z-flex` defaults to `row`, no wrap, gap `0`, and `align-items: center`.** When you use it standalone, items are vertically centered automatically.
- ❗ **Use only the sanctioned gap values** (`50` / `75` / `100` / `150` / `200` / `300`). Don't pass `px` or arbitrary numbers.
- ❗ **`z-align` is meaningless without `z-flex`** on the same element.
- ❗ **The first segment of `z-align`** is `justify-content` (horizontal along main axis), not `flex-direction` — the docs phrasing is misleading.
- ❗ **`align-content` only matters when wrapping** — set it via `z-align`'s third segment when items wrap to multiple lines.
- ❗ **Short forms allowed:** `col` for `column`, `rev` for `row-rev`, `col-rev` for `column-rev`.
- ❗ **Don't apply `z-flex` to ZDS components** (`ZrCard`, `ZrForm`, `ZrModal`, `ZrSidebar`) — they expose their own layout tokens. Use `z-flex` on raw HTML containers.
- ❗ **Empty segments are valid** — `z-flex="row::100"` (no wrap, gap 100) won't work; instead write `z-flex="100"` or `z-flex="row:100"`. Maintain the colon separators only when adjacent segments are present.
- ❗ **React JSX:** kebab attributes (`z-flex`, `z-align`) are passed through as-is on intrinsic HTML elements. No special escaping needed.

---

## 6. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
default horizontal row                                  → z-flex
horizontal row with a gap                               → z-flex="<gap>" (50 / 75 / 100 / 150 / 200 / 300)
vertical stack                                          → z-flex="col[:<gap>]"
wrapping row                                            → z-flex="wrap[:<gap>]" or "row:wrap:<gap>"
reverse order                                           → z-flex="rev" or "col-rev"
center horizontally                                     → z-flex + z-align="center"
right-align items                                       → z-align="right"
space-between (logo + nav)                              → z-align="between"
even spacing on both sides                              → z-align="even" or "around"
top / bottom vertical alignment                         → z-align="<justify>:<top|bottom>"
multi-line alignment after wrap                         → z-align="<justify>:<align>:<join|fill|disperse|uniform|start|end>"
align baseline of text                                  → z-align="<justify>:baseline"
mixing with ZDS components                              → ❌ apply z-flex on a wrapping <div>, not on the ZDS component
arbitrary px gap                                        → ❌ pick a sanctioned token (50/75/100/150/200/300)
```

---

## 7. Cheat Sheet

```
z-flex grammar:   "<?direction>:<?wrap>:<?gap>"
   direction:     row | col | rev | col-rev
   wrap:          wrap | wrap-rev
   gap:           50 | 75 | 100 | 150 | 200 | 300

z-align grammar:  "<justify>:<?align>:<?content>"
   justify:       center | left | right | even | between | around
   align:         center | top | bottom | stretch | baseline
   content:       join | start | end | fill | disperse | uniform

defaults:
   z-flex          → row, no wrap, gap 0, align-items: center
   z-align <align> → center (when omitted)
```

> Rule of thumb: **`z-flex` for direction/wrap/gap, `z-align` (with `z-flex`) for justify/align/content. Pick gap tokens from the Spacing foundation. Don't write inline `display:flex` — let the attribute drive it.**
