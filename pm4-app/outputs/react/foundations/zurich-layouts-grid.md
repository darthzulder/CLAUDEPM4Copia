# Zurich Layouts — Grid (`z-grid` + `column`)

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same attributes everywhere)
> **Package:** `@zurich/design-tokens`
> **Companion doc:** see [`zurich-layouts-flex.md`](./zurich-layouts-flex.md) for the flexbox attribute system.
> **Scope of this file:** the **12-column responsive grid** based on Bootstrap 4.6 — `z-grid` for the container and `column` for the items.

---

## 1. AI Implementation Instructions

When the user asks about **page layout**, **12-column grid**, **responsive columns**, **mobile-first layout**, **column spans**, **breakpoints**, **fixed vs fluid grid**, or any structural / page-wide layout in ZDS, use this foundation.

1. **Wrap the page in a `<section z-grid="main">`** (or another container element). This activates the 12-column grid behavior.
2. **Place children with a `column` attribute** that specifies the span (e.g. `column="1:8"`).
3. **Column syntax — Desktop-first (default):**
   ```
   column="<start>:<end>"   or   column="<span>"
   ```
   - `<start>` and `<end>` are 1-based column indexes from the 12-column grid.
   - `column="2"` means **span 2 columns** from the next available position.
   - `column="1:8"` means **start at column 1, end at column 8** (occupies columns 1 through 8).
4. **Column syntax — Mobile-first (prefix with `m:`):**
   ```
   column="m:<start>:<end>"
   ```
   - Targets the mobile breakpoint specifically (6-column grid).
5. **Use the 8px grid for component spacing** and the **4px grid for inner-component details** (padding, micro-spacing). This is the vertical rhythm rule — implement it via the Spacing foundation tokens.
6. **Pick the grid mode:**
   - **Fixed-width grid (default)** — content fits inside a centered container with a fixed width per breakpoint. Use for normal content pages.
   - **Fluid grid** — content spans 100% of the viewport. Use for dashboards, full-bleed canvases.
7. **Respect alignment rules:**
   - Align components **as a whole** to the grid — not every internal sub-element.
   - **Leave gutters free** — never use the gutter as a column.
   - For extra space between components, **add padding**, don't widen gutters.

---

## 2. Breakpoints & Anatomy

The 12-column grid follows Bootstrap 4.6 breakpoints. Mobile uses a 6-column grid instead.

| Breakpoint        | Art-board  | Viewport range   | Container width | Columns | Column width | Gutter |
|-------------------|------------|------------------|-----------------|---------|--------------|--------|
| Desktop (Large)   | 1440×800   | ≥ 1200px         | 1110px          | 12      | 65px         | 30px   |
| Tablet landscape (Medium) | 1024×768 | 992–1199px | 930px           | 12      | 50px         | 30px   |
| Tablet portrait (Small)   | 768×1024 | 768–991px  | 690px           | 12      | 30px         | 30px   |
| Mobile (Extra small)      | 375×812  | ≤ 767px    | min 315px / max 510px (fluid) | **6** | Auto | 30px |

> **Gutter is always 30px** across all breakpoints.
> **Margins** are fixed per breakpoint range; on mobile, the container is fluid with a 315px minimum and an optional 510px maximum.

### 2.1 Grid anatomy

A page using `z-grid="main"` is composed of:

- **Margins** — outer fixed-width whitespace at the edges of the viewport (per breakpoint).
- **Columns** — equally-wide tracks; 12 on desktop/tablet, 6 on mobile.
- **Gutters** — 30px space between columns. **Never** used as a column.

### 2.2 Fixed vs Fluid

| Mode      | Use when                                                                                          |
|-----------|---------------------------------------------------------------------------------------------------|
| **Fixed** | Content has a known reading-width. Container is centered with a fixed max width per breakpoint.    |
| **Fluid** | Content fills 100% of the viewport (dashboards, data tables, immersive views).                     |

---

## 3. Vertical Rhythm (4px / 8px)

- **8px grid** — drives layout between components (margins, paragraph spacing, gaps).
- **4px grid** — drives detail spacing **inside** a component (paddings, icon spacing, inline gaps).
- **Row grid** — a vertical extension of the 8px grid used to align elements baseline-wise across rows.

> Apply these through the **Spacing foundation tokens** (gutters `50` / `75` / `100` / `150` / `200` / `300`, etc.) — do not write raw `px` values.

---

## 4. `z-grid` Attribute

Apply on the **container** that should host the grid.

| Value     | Meaning                                                                                |
|-----------|----------------------------------------------------------------------------------------|
| `"main"`  | Activates the canonical 12-column responsive grid (Desktop / Tablet / Mobile breakpoints). |

```html
<section z-grid="main">
  <!-- 12 columns under the hood -->
</section>
```

> The container is responsible for the **outer margins** and **gutters**. Don't manually pad the section — the grid does it.

---

## 5. `column` Attribute

Apply on **children of a `z-grid` container** to assign their column span.

### 5.1 Desktop-first (default — applies from desktop down)

| Syntax           | Meaning                                                              |
|------------------|----------------------------------------------------------------------|
| `column="N"`     | Span N columns at the next available position.                       |
| `column="A:B"`   | Start at column A, end at column B (inclusive, 1-based, 1–12).       |

```html
<section z-grid="main">
  <div column="1:8">Header — columns 1..8</div>
  <div column="10:12">Sidebar — columns 10..12</div>
  <div column="2">Spans 2 columns</div>
  <div column="4:12">Long block — columns 4..12</div>
  <div column="4:6">Item A — columns 4..6</div>
  <div column="7:9">Item B — columns 7..9</div>
</section>
```

### 5.2 Mobile-first (`m:` prefix)

Use `m:` to target the **mobile breakpoint** (6-column grid). At mobile, indexes are 1-based and range from 1 to 6.

| Syntax              | Meaning                                                            |
|---------------------|--------------------------------------------------------------------|
| `column="m:N"`      | Span N columns starting at the next available position (mobile).   |
| `column="m:A:B"`    | Start at mobile column A, end at mobile column B (1–6).            |

```html
<section z-grid="main">
  <div column="m:1:2">m:1:2</div>
  <div column="m:4:6">m:4:6</div>
  <div column="m:1:2">m:1:2</div>
  <div column="m:3:4">m:3:4</div>
  <div column="m:5:6">m:5:6</div>
</section>
```

> Combine desktop-first and mobile-first on the same element when the layout needs to change responsively. The desktop-first form applies from desktop down to tablet; the `m:` form takes over at mobile.

---

## 6. Canonical Examples

### 6.1 Basic 12-column container with a header + sidebar
```html
<section z-grid="main">
  <header column="1:12">Header banner</header>
  <main   column="1:8">Main content area</main>
  <aside  column="9:12">Sidebar</aside>
</section>
```

### 6.2 Cards laid out in 4-column tiles (desktop)
```html
<section z-grid="main">
  <div column="1:3">Card A</div>
  <div column="4:6">Card B</div>
  <div column="7:9">Card C</div>
  <div column="10:12">Card D</div>
</section>
```

### 6.3 Responsive: 4-column tiles on desktop, 2-up on mobile
```html
<section z-grid="main">
  <div column="1:3"  column="m:1:3">Card A</div>
  <div column="4:6"  column="m:4:6">Card B</div>
  <div column="7:9"  column="m:1:3">Card C</div>
  <div column="10:12" column="m:4:6">Card D</div>
</section>
```

> ⚠️ In real templating engines you may need to merge these into a single `column` value as a fallback strategy. If the design system supports both attributes at once, use the form above; otherwise pick the breakpoint where the layout is most critical.

### 6.4 Full-width hero
```html
<section z-grid="main">
  <div column="1:12" style="text-align: center;">
    <h1 z-heading="display">Welcome</h1>
  </div>
</section>
```

### 6.5 Two-column form with sticky summary
```html
<section z-grid="main">
  <form column="1:8">
    <!-- ZrTextInput / ZrSelect / etc. -->
  </form>
  <aside column="9:12">
    <!-- Order summary card -->
  </aside>
</section>
```

### 6.6 Mobile-only override
```html
<section z-grid="main">
  <div column="1:12" column="m:1:6">
    Full width on mobile too, but only one item per row.
  </div>
</section>
```

### 6.7 React JSX
```tsx
<section z-grid="main">
  <header column="1:12">{/* ... */}</header>
  <main   column="1:8" >{/* ... */}</main>
  <aside  column="9:12">{/* ... */}</aside>
</section>
```

### 6.8 Avoid: anti-patterns
```html
<!-- ❌ Using the gutter as a column -->
<section z-grid="main">
  <div column="1:3"></div>
  <div style="margin-left: 30px;">Gutter abused as column</div>
</section>

<!-- ❌ Misaligning components inside the same column -->
<section z-grid="main">
  <div column="1:6">
    <h2 style="margin-left: 20px;">Why am I offset?</h2>
  </div>
</section>

<!-- ❌ Skipping z-grid="main" and manually building a 12-col grid -->
<section style="display: grid; grid-template-columns: repeat(12, 1fr);">
  …
</section>
```

---

## 7. Alignment Rules

1. **Components align to the grid as a whole.** Don't push internal sub-elements out of the grid manually.
2. **You don't need to align every element** of a component to the grid — only the component's bounding box.
3. **Leave gutters free.** They are visual breathing room, not columns.
4. **For extra spacing between two adjacent components**, **add padding** inside the component or use Spacing tokens — **don't** stretch the gutter.

---

## 8. Decision Rules (for the AI)

- ❗ **Always start with `z-grid="main"`** when the user describes a page-level layout.
- ❗ **Use `column="A:B"`** for explicit start/end positions, `column="N"` for relative spans.
- ❗ **Mobile prefix `m:`** drops the grid to 6 columns. **Other breakpoints** (tablet portrait / landscape) follow the desktop-first `column` value automatically.
- ❗ **Column indexes are 1-based.** Don't pass `0` or `13` (or `7+` for mobile).
- ❗ **Don't manually set `display: grid` or `grid-template-columns`** in CSS — use the attribute.
- ❗ **30px gutter is fixed.** Don't try to widen it (use padding or the Spacing foundation instead).
- ❗ **Pick fixed vs fluid intentionally** — fixed for normal content pages, fluid for dashboards.
- ❗ **Vertical rhythm:** 8px between components, 4px inside components. Use the Spacing tokens to apply them.
- ❗ **Don't combine `z-grid` and `z-flex` on the same element.** Use `z-grid` on the page container and `z-flex` on inner cluster containers (or vice versa).

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
page-wide responsive layout                             → <section z-grid="main">
12-column row                                           → children with column="A:B"
3 columns wide tile                                     → column="1:3" / column="4:6" / column="7:9" / column="10:12"
sidebar layout (8 + 4)                                  → main column="1:8", aside column="9:12"
full-width row                                          → column="1:12"
mobile override                                         → add column="m:A:B" alongside
dashboard / full-bleed                                  → fluid grid mode (no inner max-width)
custom 30px+ gap between rows                           → ❌ use padding / Spacing tokens
manual flex-based 12-col grid                           → ❌ use z-grid="main"
non-bootstrap 16-col grid                               → ❌ not sanctioned by ZDS
```

---

## 10. Composition Patterns

### 10.1 Dashboard shell (header + sidebar + main)
```html
<section z-grid="main">
  <header column="1:12">App header</header>
  <aside  column="1:3">
    <!-- ZrSidebar or static nav -->
  </aside>
  <main   column="4:12">
    <!-- ZrCard grid below -->
  </main>
</section>
```

### 10.2 Grid of ZrCard tiles
```html
<section z-grid="main">
  <div column="1:4"   column="m:1:3"><ZrCard config="grid">A</ZrCard></div>
  <div column="5:8"   column="m:4:6"><ZrCard config="grid">B</ZrCard></div>
  <div column="9:12"  column="m:1:6"><ZrCard config="grid">C</ZrCard></div>
</section>
```

### 10.3 Two-column form + summary
```html
<section z-grid="main">
  <ZrForm column="1:8">
    <!-- fields -->
  </ZrForm>
  <ZrCard config="grid" column="9:12">
    <!-- summary -->
  </ZrCard>
</section>
```

### 10.4 Centered narrow content
```html
<section z-grid="main">
  <article column="4:9">
    <h1 z-heading="48">Article title</h1>
    <p style="font: var(--zf-body-18);">Lorem ipsum dolor sit amet.</p>
  </article>
</section>
```

### 10.5 Mobile-first checkout
```html
<section z-grid="main">
  <div column="1:8" column="m:1:6">
    <!-- products -->
  </div>
  <div column="9:12" column="m:1:6">
    <!-- summary -->
  </div>
</section>
```

---

## 11. Cheat Sheet

```
PAGE CONTAINER:    <section z-grid="main">

COLUMN (desktop):  column="A:B"     (1-based, A,B ∈ [1..12])
                   column="N"       (relative span)

COLUMN (mobile):   column="m:A:B"   (1-based, A,B ∈ [1..6])

BREAKPOINTS:       Desktop ≥1200 (12 cols, 1110px)
                   Tablet  landscape 992–1199 (12 cols, 930px)
                   Tablet  portrait  768–991  (12 cols, 690px)
                   Mobile  ≤767  (6 cols, fluid 315–510px)

GUTTER:            30px (fixed across breakpoints)

RHYTHM:            8px between components / 4px inside components

NEVER:             use a gutter as a column
NEVER:             widen the gutter for spacing — use padding / Spacing tokens instead
```

> Rule of thumb: **page-level layout = `z-grid="main"` + `column`. Mobile overrides = `column="m:..."`. Cluster-level layout = `z-flex` / `z-align`.**
