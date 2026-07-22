# Zurich Typography — Text Styles & Tokens

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same tokens everywhere)
> **Package:** `@zurich/design-tokens`
> **Companion doc:** see [`zurich-typography.md`](./zurich-typography.md) for fonts, weights, emoji setup and general typography rules.
> **Scope of this file:** the complete catalogue of **CSS variables** and the **`z-heading` HTML attribute** for headings, body, and caption text styles.

---

## 1. AI Implementation Instructions

When the user asks about **specific text sizes**, **heading variables**, **`--zf-h-*` / `--zf-ht-*` tokens**, **body 16 / 18 / 20**, **caption 12 / 14**, **`z-heading` attribute**, **display heading**, **emphasizing words with Ogg inside a heading**, or wants to **apply ZDS typography styles via CSS variables**, use this foundation.

1. **Choose the right token family:**
   - **`--zf-ht-1` … `--zf-ht-6`** → tied to the **semantic heading tag level** (`<h1>` through `<h6>`). Applied automatically when the corresponding stylesheet is imported.
   - **`--zf-h-<size>`** → choose by **visual size in `px`** (`72`, `60`, `48`, `44`, `36`, `32`, `30`, `28`, `24`, `22`, `20`), independent of the semantic tag.
   - **`--zf-body-<size>[--<weight>]`** → body copy. `size` ∈ `16 | 18 | 20`. Optional `weight` ∈ `300 | 500 | 600 | 700` (default `400`).
   - **`--zf-capt-<size>[--<weight>]`** → captions. `size` ∈ `12 | 14`. Same optional weight modifiers as body.
2. **Apply tokens via the shorthand `font` property**, not separate `font-family` / `font-size` / `font-weight` / `line-height` — the token already packs everything.
   ```css
   .my-paragraph { font: var(--zf-body-16); }
   .my-headline  { font: var(--zf-h-48); }
   ```
3. **Use `z-heading="<value>"`** as an HTML attribute when you want a different visual size than the semantic tag would normally provide. Allowed values: `72`, `60`, `48`, `44`, `36`, `32`, `30`, `28`, `24`, `22`, `20`, **and `display`**.
4. **Emphasize words inside `<h1>`/`<h2>`/`<h3>`** using `<em>` — the design system swaps `<em>` content to the Ogg font automatically. **Has no effect on `<h4>`/`<h5>`/`<h6>`.**
5. **Import the right stylesheet:**
   - `@zurich/design-tokens/index.css` → includes heading-tag styles + everything else.
   - `@zurich/design-tokens/base.scss` (or `base.css`) → does **NOT** include heading-tag styles by itself.
   - To get heading-tag styles on top of `base.css`, also import `@zurich/design-tokens/HeadingTags.css`.
6. **Font sizes adapt to viewport** automatically following the ZDS breakpoints — don't try to redefine them per breakpoint manually.
7. **Default heading weight is `300` (Light).** That's intentional — don't override it to bold unless the design explicitly calls for it. If you need more emphasis, change the heading **size** (one step up), not the weight.

---

## 2. Heading Tags — `--zf-ht-*` (paired with `<h1>`–`<h6>`)

These tokens are automatically applied to the corresponding semantic tags when `HeadingTags.css` is loaded. **No CSS work required** in your own code — just use `<h1>`, `<h2>`, …, `<h6>`.

| Token         | Tag    | Weight / Size / Line-height / Family                                |
|---------------|--------|---------------------------------------------------------------------|
| `--zf-ht-1`   | `<h1>` | `300 3rem / 4rem ZurichSans, Arial, Helvetica, sans-serif`          |
| `--zf-ht-2`   | `<h2>` | `300 2.75rem / 3.75rem ZurichSans, Arial, Helvetica, sans-serif`    |
| `--zf-ht-3`   | `<h3>` | `300 2.25rem / 3rem ZurichSans, Arial, Helvetica, sans-serif`       |
| `--zf-ht-4`   | `<h4>` | `300 2rem / 2.75rem ZurichSans, Arial, Helvetica, sans-serif`       |
| `--zf-ht-5`   | `<h5>` | `300 1.75rem / 2.5rem ZurichSans, Arial, Helvetica, sans-serif`     |
| `--zf-ht-6`   | `<h6>` | `300 1.5rem / 2.25rem ZurichSans, Arial, Helvetica, sans-serif`     |

```html
<h1>Page title</h1>
<h2>Section title</h2>
<h3>Subsection</h3>
<h4>Card title</h4>
<h5>Inline emphasis</h5>
<h6>Smallest heading</h6>
```

> ⚠️ The values use the shorthand `font: <weight> <size> / <line-height> <family>`. When you reference the token, **apply it through the `font:` shorthand**, not a single sub-property.

---

## 3. Headings by Size — `--zf-h-<size>` (decoupled from the tag)

Use these when you need a specific **visual size**, regardless of the semantic tag. Sizes are expressed in **pixels**.

| Token         | Weight / Size / Line-height / Family                                                       |
|---------------|--------------------------------------------------------------------------------------------|
| `--zf-h-72`   | `300 4.5rem / 6rem ZurichSans, Arial, Helvetica, sans-serif`                               |
| `--zf-h-60`   | `300 3.75rem / 5rem ZurichSans, Arial, Helvetica, sans-serif`                              |
| `--zf-h-48`   | `300 3rem / 4rem ZurichSans, Arial, Helvetica, sans-serif`                                 |
| `--zf-h-44`   | `300 2.75rem / 3.75rem ZurichSans, Arial, Helvetica, sans-serif`                           |
| `--zf-h-36`   | `300 2.25rem / 3rem ZurichSans, Arial, Helvetica, sans-serif`                              |
| `--zf-h-32`   | `300 2rem / 2.75rem ZurichSans, Arial, Helvetica, sans-serif`                              |
| `--zf-h-30`   | `300 1.875rem / 2.625rem ZurichSans, Arial, Helvetica, sans-serif`                         |
| `--zf-h-28`   | `300 1.75rem / 2.5rem ZurichSans, Arial, Helvetica, sans-serif`                            |
| `--zf-h-24`   | `300 1.5rem / 2.25rem ZurichSans, Arial, Helvetica, sans-serif`                            |
| `--zf-h-22`   | `300 1.375rem / 2rem ZurichSans, Arial, Helvetica, sans-serif`                             |
| `--zf-h-20`   | `300 1.25rem / 1.875rem ZurichSans, Arial, Helvetica, sans-serif`                          |

```css
.callout-headline { font: var(--zf-h-48); }
.list-row-title   { font: var(--zf-h-22); }
```

---

## 4. `z-heading` HTML Attribute

When you don't want to override default tag styles globally, or you simply need a visual size that doesn't match the semantic level, use the **`z-heading`** attribute directly on the heading tag.

| Value          | Resolves to                                |
|----------------|--------------------------------------------|
| `"72"`         | `--zf-h-72`                                |
| `"60"`         | `--zf-h-60`                                |
| `"48"`         | `--zf-h-48`                                |
| `"44"`         | `--zf-h-44`                                |
| `"36"`         | `--zf-h-36`                                |
| `"32"`         | `--zf-h-32`                                |
| `"30"`         | `--zf-h-30`                                |
| `"28"`         | `--zf-h-28`                                |
| `"24"`         | `--zf-h-24`                                |
| `"22"`         | `--zf-h-22`                                |
| `"20"`         | `--zf-h-20`                                |
| `"display"`    | Special **Display** size (largest, hero).  |

```html
<h1 z-heading="72">Heading 72</h1>
<h1 z-heading="60">Heading 60</h1>
<h2 z-heading="48">Heading 48</h2>
<!-- ... -->
<h2 z-heading="20">Heading 20</h2>

<!-- Special "Display" heading (heroes / landing pages) -->
<h1 z-heading="display">Heading Test</h1>
```

```tsx
// In React, attributes with a dash translate directly:
<h1 z-heading="display">Welcome to Zurich</h1>
<h2 z-heading="36">Section title</h2>
```

> Use `z-heading` when you want to **decouple visual size from semantic level** (e.g. an `<h2>` that should *look* like a 72px display, or an `<h1>` that should *look* like a 28px row title).

---

## 5. Emphasizing Inside Headings — `<em>`

Inside `<h1>`, `<h2>`, and `<h3>`, wrapping a word in `<em>` automatically swaps it to the **Ogg** display font. Use this to call attention to a single concept inside a heading without changing its size or weight.

```html
<h1>Protect <em>tomorrow</em>, today.</h1>
<h2>Plans for <em>every</em> family.</h2>
```

| Tag       | `<em>` effect                                  |
|-----------|------------------------------------------------|
| `<h1>`    | ✅ Switches the emphasized text to Ogg.         |
| `<h2>`    | ✅ Switches the emphasized text to Ogg.         |
| `<h3>`    | ✅ Switches the emphasized text to Ogg.         |
| `<h4>`    | ❌ No visual effect.                            |
| `<h5>`    | ❌ No visual effect.                            |
| `<h6>`    | ❌ No visual effect.                            |

> Best practice: **emphasize 1–2 words at most** — emphasizing the whole heading defeats the contrast.

---

## 6. Body — `--zf-body-<size>[--<weight>]`

For paragraphs, links, list items, button labels, and Zurich Design System component text.

### 6.1 Sizes

| Size token            | Use case            |
|-----------------------|---------------------|
| `--zf-body-16`        | Small body          |
| `--zf-body-18`        | Medium body         |
| `--zf-body-20`        | Large body          |

### 6.2 Weight modifiers (optional)

Append a weight suffix to get a heavier or lighter variant. **If omitted, weight is `400` (normal).**

| Weight suffix         | Resulting variant       |
|-----------------------|-------------------------|
| *(none)*              | `400` Normal            |
| `--300`               | `300` Light             |
| `--500`               | `500` Medium            |
| `--600`               | `600` SemiBold          |
| `--700`               | `700` Bold              |

Full naming pattern: **`--zf-body-<size>--<weight>`**

```css
.paragraph        { font: var(--zf-body-16); }
.paragraph-light  { font: var(--zf-body-16--300); }
.paragraph-med    { font: var(--zf-body-18--500); }
.paragraph-bold   { font: var(--zf-body-20--700); }
```

---

## 7. Caption — `--zf-capt-<size>[--<weight>]`

For metadata, helper text, badges, fine print.

### 7.1 Sizes

| Size token            | Use case            |
|-----------------------|---------------------|
| `--zf-capt-12`        | Small caption       |
| `--zf-capt-14`        | Large caption       |

### 7.2 Weight modifiers (optional)

Same weight grammar as body: `--zf-capt-<size>--<weight>` with `weight ∈ 300 | 500 | 600 | 700`. Default (no suffix) is `400`.

```css
.helper-text     { font: var(--zf-capt-14); }
.badge-label     { font: var(--zf-capt-12--600); }
.tooltip-text    { font: var(--zf-capt-12--300); }
```

---

## 8. Stylesheet Imports

| File                                          | Includes heading-tag styles? | Notes                                                                   |
|-----------------------------------------------|------------------------------|-------------------------------------------------------------------------|
| `@zurich/design-tokens/index.css`             | ✅ Yes                        | Aggregate file — easiest to drop into a project.                        |
| `@zurich/design-tokens/base.scss` / `base.css`| ❌ No                         | Provides variables and resets, but **not** heading-tag styles.          |
| `@zurich/design-tokens/HeadingTags.css`       | ✅ Yes (only heading-tag styles) | Import on top of `base.css` to get `<h1>`–`<h6>` styling separately. |

```ts
// Easiest setup:
import '@zurich/design-tokens/index.css';

// — OR — minimal base + opt-in heading tag styles:
import '@zurich/design-tokens/base.css';
import '@zurich/design-tokens/HeadingTags.css';
```

> ⚠️ If you import only `base.css` and **don't** add `HeadingTags.css`, plain `<h1>`…`<h6>` tags will not be styled by ZDS. The `--zf-ht-*` variables still exist but won't be applied automatically.

---

## 9. Canonical Examples

### 9.1 Apply heading by size, regardless of tag
```html
<h2 z-heading="48">Looks like 48px</h2>
<h1 z-heading="22">Looks like 22px</h1>
```

### 9.2 Display heading (hero)
```html
<h1 z-heading="display">Protect tomorrow, today.</h1>
```

### 9.3 Heading with Ogg emphasis
```html
<h1>Built for <em>your</em> family.</h1>
<h2>Plans that <em>grow</em> with you.</h2>
```

### 9.4 Body and caption via tokens
```css
.policy-summary { font: var(--zf-body-18); }
.policy-meta    { font: var(--zf-capt-12--500); color: var(--z-color-muted); }
```

### 9.5 React component using body / caption tokens
```tsx
export function PolicyRow({ title, meta }: { title: string; meta: string }) {
  return (
    <article style={{ display: 'grid', gap: '0.25rem' }}>
      <h3 z-heading="22" style={{ margin: 0 }}>{title}</h3>
      <span style={{ font: 'var(--zf-capt-12--500)' }}>{meta}</span>
    </article>
  );
}
```

### 9.6 Display heading inside a card
```tsx
<ZrCard config="grid">
  <h1 z-heading="display" style={{ margin: 0 }}>
    Premium plan
  </h1>
  <p style={{ font: 'var(--zf-body-18)', margin: 0 }}>
    Coverage tailored for families and travelers.
  </p>
</ZrCard>
```

### 9.7 Bold body callout
```tsx
<p style={{ font: 'var(--zf-body-20--700)' }}>
  This action cannot be undone.
</p>
```

### 9.8 Avoid: anti-pattern examples
```html
<!-- ❌ Overriding heading weight to bold manually -->
<h1 style="font-weight: 700;">Title</h1>

<!-- ❌ Setting font-size separately, breaking the line-height pairing -->
<p style="font-family: var(--zf-sans); font-size: 1.25rem;">Body</p>

<!-- ❌ z-heading on a non-heading element -->
<div z-heading="48">Won't behave as expected</div>

<!-- ❌ Importing only base.css and expecting headings to be styled -->
<style>@import '@zurich/design-tokens/base.css';</style>
<h1>This stays unstyled</h1>
```

---

## 10. Decision Rules (for the AI)

- ❗ **Apply tokens with the `font:` shorthand** so size, line-height, weight, and family are kept in sync.
- ❗ **`--zf-ht-*` is for the semantic tag.** Don't reference it manually — let the stylesheet apply it via `<h1>`–`<h6>`.
- ❗ **`--zf-h-<size>` is for visual size.** Use it (or `z-heading="<size>"`) when the visual size must diverge from the semantic level.
- ❗ **`z-heading="display"`** is the only string-valued variant; the rest are numeric strings matching the size.
- ❗ **Default heading weight is `300`.** Don't override to bold — pick a larger size if more emphasis is needed.
- ❗ **`<em>` inside `<h1>`/`<h2>`/`<h3>`** swaps to Ogg. **No effect** in `<h4>`/`<h5>`/`<h6>`.
- ❗ **Body size:** `16 | 18 | 20`. **Caption size:** `12 | 14`. No other sizes are sanctioned.
- ❗ **Weight modifier grammar:** `--zf-body-<size>--<weight>` and `--zf-capt-<size>--<weight>`. No suffix means `400`.
- ❗ **Don't combine** body tokens with separate `font-size` overrides — that breaks the line-height pairing.
- ❗ **Font sizes adapt to viewport** via ZDS breakpoints automatically. Do not write manual media queries.
- ❗ **Tokens are global CSS variables** — usable in React inline styles (`style={{ font: 'var(--zf-body-16)' }}`), CSS classes, CSS-in-JS, etc.

---

## 11. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
just style <h1>–<h6> consistently                       → import HeadingTags.css (or index.css)
size a heading by px regardless of tag                  → z-heading="<size>" OR font: var(--zf-h-<size>)
hero / landing display heading                          → z-heading="display"
emphasize 1–2 words inside h1/h2/h3 with Ogg            → wrap in <em>
emphasize a word inside h4/h5/h6                        → ❌ <em> has no effect — restructure heading
default paragraph                                       → font: var(--zf-body-16)
medium body copy                                        → font: var(--zf-body-18)
large body copy                                         → font: var(--zf-body-20)
bolder body copy                                        → font: var(--zf-body-<size>--600 or --700)
helper text / metadata                                  → font: var(--zf-capt-14)
fine print / badge label                                → font: var(--zf-capt-12 or --zf-capt-12--500)
bold caption                                            → font: var(--zf-capt-<size>--700)
need a different size than 16/18/20 (body)              → ❌ not sanctioned — pick the closest
need a heading bigger than 72                           → ❌ not sanctioned
```

---

## 12. TypeScript Helper (suggested)

```ts
// utilities/typography.ts
export type ZHeading =
  | '20' | '22' | '24' | '28' | '30' | '32'
  | '36' | '44' | '48' | '60' | '72'
  | 'display';

export type ZBodySize    = 16 | 18 | 20;
export type ZCaptionSize = 12 | 14;
export type ZWeight      = 300 | 400 | 500 | 600 | 700;

export function bodyToken(size: ZBodySize, weight?: Exclude<ZWeight, 400>) {
  return weight ? `var(--zf-body-${size}--${weight})` : `var(--zf-body-${size})`;
}

export function captionToken(size: ZCaptionSize, weight?: Exclude<ZWeight, 400>) {
  return weight ? `var(--zf-capt-${size}--${weight})` : `var(--zf-capt-${size})`;
}

export function headingToken(size: Exclude<ZHeading, 'display'>) {
  return `var(--zf-h-${size})`;
}

// Usage:
// <p style={{ font: bodyToken(18, 500) }}>…</p>
// <span style={{ font: captionToken(12, 600) }}>…</span>
// <h2 style={{ font: headingToken('48') }}>Visual h2 of 48px</h2>
// <h1 z-heading="display">Hero</h1>
```

---

## 13. Composition Patterns

### 13.1 Mixed-emphasis hero
```tsx
<header>
  <h1 z-heading="display" style={{ margin: 0 }}>
    Plans for <em>every</em> moment.
  </h1>
  <p style={{ font: 'var(--zf-body-20--300)' }}>
    Coverage built for individuals, families and businesses.
  </p>
</header>
```

### 13.2 List row (title + meta)
```tsx
<li style={{ display: 'grid' }}>
  <span style={{ font: 'var(--zf-h-22)' }}>Policy POL-001</span>
  <span style={{ font: 'var(--zf-capt-12--500)' }}>Issued 2026-01-01 · Active</span>
</li>
```

### 13.3 Quote / pull-quote
```tsx
<blockquote style={{ font: 'var(--zf-body-20--500)', fontStyle: 'italic' }}>
  Service was excellent — claim resolved in 24 hours.
</blockquote>
```

### 13.4 Section heading with badge caption
```tsx
<section>
  <h2 z-heading="32" style={{ margin: 0 }}>Coverage</h2>
  <span style={{ font: 'var(--zf-capt-12--600)' }}>UPDATED</span>
</section>
```

> Rule of thumb: **let `<h1>`–`<h6>` carry semantics, use `z-heading` for visual size, `<em>` for Ogg emphasis (h1–h3 only), and apply body/caption tokens via the shorthand `font:` property.** Default weight `400` for body, `300` for headings — change the **size** to gain emphasis, not the weight.
