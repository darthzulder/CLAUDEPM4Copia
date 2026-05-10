# Zurich Typography — Foundations

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same tokens everywhere)
> **Package:** `@zurich/design-tokens`
> **Reference fonts:** Zurich Sans, Ogg
> **Token source:** CSS variables (`--zf-sans`, `--zf-ogg`) + emoji stylesheets

---

## 1. AI Implementation Instructions

When the user asks about **typography**, **fonts**, **headings**, **body / caption styles**, **font weights**, **text hierarchy**, **line height**, **paragraph spacing**, **justification**, **text color**, **emojis**, or **flag emojis** in the Zurich Design System, use this foundation.

1. **Always reference fonts through the CSS variables**, never hardcode the font name:
   ```css
   /* Default sans font (Zurich Sans + fallbacks) */
   font-family: var(--zf-sans);

   /* Display / H1 / H2 only (Ogg + fallbacks) */
   font-family: var(--zf-ogg);
   ```
2. **Zurich Sans is the default** for body, headings, captions, links, buttons, and ZDS components.
3. **Ogg is reserved** for high-emphasis headings — **only `Display`, `H1`, and `H2`**. Never use Ogg for body or caption.
4. **Available weights:**
   - Zurich Sans: `300` (Light), `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold) — each available in italic too.
   - Ogg: `400` (Regular) only.
5. **Always pair weight with a numeric `font-weight`** (e.g. `font-weight: 600`) rather than relying on browser defaults.
6. **Use the predefined hierarchies** (`Display`, `H1`–`H6`, `Body`, `Caption`) — don't invent new size scales.
7. **Line height is proportional to size** and predefined per style. Don't override unless the design requires it.
8. **Justification:** default to `left`. Use `center` sparingly. **Avoid `justify`** (fully justified) — it harms legibility.
9. **Color:**
   - On a light background → Dark Blue.
   - On a dark background → White.
10. **For emojis**, import `Emojis.css` from `@zurich/design-tokens` so all platforms render the same Noto Color Emoji glyphs.
11. **For flag emojis** (Windows otherwise won't render them), import the additional `EmojiFlags.css` stylesheet.
12. **Do not** install Zurich Sans or Ogg manually — they are delivered through `@zurich/design-tokens` and resolved by the `--zf-*` variables. Manual installation can be done by downloading from BlueRoom for design tooling, not for runtime.

---

## 2. CSS Variables (Tokens)

| Variable      | Purpose                                                                                          | Use when                                       |
|---------------|--------------------------------------------------------------------------------------------------|------------------------------------------------|
| `--zf-sans`   | Zurich Sans font stack (with fallbacks). Default sans family.                                    | Body, headings, captions, links, buttons, ZDS. |
| `--zf-ogg`    | Ogg font stack (with fallbacks).                                                                 | **Display / H1 / H2 only.**                    |

```css
:root {
  /* Provided by @zurich/design-tokens */
  /* --zf-sans: 'Zurich Sans', system-ui, sans-serif; */
  /* --zf-ogg:  'Ogg', Georgia, 'Times New Roman', serif; */
}

body { font-family: var(--zf-sans); }

h1, h2, .display { font-family: var(--zf-ogg); }
```

---

## 3. Available Font Weights

### 3.1 Zurich Sans

| Weight | Name        | Italic available |
|--------|-------------|------------------|
| 300    | Light       | ✅ Light Italic    |
| 400    | Regular     | ✅ Regular Italic  |
| 500    | Medium      | ✅ Medium Italic   |
| 600    | SemiBold    | ✅ SemiBold Italic |
| 700    | Bold        | ✅ Bold Italic     |

```css
.text-regular  { font-family: var(--zf-sans); font-weight: 400; }
.text-medium   { font-family: var(--zf-sans); font-weight: 500; }
.text-semibold { font-family: var(--zf-sans); font-weight: 600; }
.text-bold     { font-family: var(--zf-sans); font-weight: 700; }
.text-emphasis { font-family: var(--zf-sans); font-weight: 400; font-style: italic; }
```

### 3.2 Ogg

| Weight | Name      | Italic available |
|--------|-----------|------------------|
| 400    | Regular   | —                |

```css
.display, h1, h2 { font-family: var(--zf-ogg); font-weight: 400; }
```

---

## 4. Text Hierarchies

Use the predefined hierarchies to communicate structure consistently:

| Style       | Purpose                                                            | Recommended font   |
|-------------|--------------------------------------------------------------------|--------------------|
| `Display`   | The largest, most prominent heading (landing pages, hero sections).| `var(--zf-ogg)`    |
| `H1`        | Page-level title.                                                  | `var(--zf-ogg)`    |
| `H2`        | Section title.                                                     | `var(--zf-ogg)`    |
| `H3`–`H6`   | Sub-section titles, descending in size.                            | `var(--zf-sans)`   |
| `Body`      | Paragraphs, links, buttons, ZDS component text.                    | `var(--zf-sans)`   |
| `Caption`   | Auxiliary / supporting text (metadata, helper text).               | `var(--zf-sans)`   |

> The hierarchies are the only sanctioned sizes. **Do not invent new sizes** — pick the closest hierarchy.

---

## 5. Typographic Rules

### 5.1 Line height
- Proportional to font size; every style has a **predefined** line height.
- Don't override unless the design explicitly requires it.

### 5.2 Paragraph spacing
- Use spacing **before/after paragraphs** (not extra blank lines) for separation between paragraphs, headings, and sub-headings.
- Larger spacing can emphasize a title.
- Drive spacing via the design system's spacing tokens (see Spacing foundation).

### 5.3 Justification
- Default: **`left`**.
- Allowed alternatives: `center` (sparingly), `right` (e.g. amounts in tables).
- **Avoid** `justify` (fully justified) — it makes reading harder.

### 5.4 Color
- **Light background** → Dark Blue text.
- **Dark background** → White text.
- Use the Color foundation tokens to resolve the exact values.

---

## 6. Emojis (Noto Color Emoji)

Cross-platform inconsistency in emoji rendering is solved by importing the Zurich `Emojis.css` stylesheet. After importing it, any emoji in your content is rendered using Google's **Noto Color Emoji** font.

### 6.1 Import via bundler

```ts
import '@zurich/design-tokens/Emojis.css';
```

### 6.2 Import via CDN

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <link
      rel="stylesheet"
      href="https://zds.zurich.com/0.8.1/@zurich/design-tokens/Emojis.css"
    />
  </head>
</html>
```

### 6.3 Emoji ligatures supported

Once `Emojis.css` is loaded, the typical Unicode emoji ligatures work as expected:

```
🏿 + 👨           → 👨🏿    (skin-tone modifier)
🐕 + ZWJ + 🦺   → 🐕‍🦺     (zero-width-joiner composition)
```

> Catalog of available glyphs: <https://icon-sets.iconify.design/noto/>.

---

## 7. Flag Emojis

Windows historically strips flag emojis from default fonts. To force consistent rendering of flags across all platforms, import the additional flag stylesheet **in addition to** `Emojis.css`:

### 7.1 Import via bundler

```ts
import '@zurich/design-tokens/Emojis.css';
import '@zurich/design-tokens/EmojiFlags.css';
```

### 7.2 Import via CDN

```html
<link rel="stylesheet" href="https://zds.zurich.com/0.8.1/@zurich/design-tokens/Emojis.css" />
<link rel="stylesheet" href="https://zds.zurich.com/0.8.1/@zurich/design-tokens/EmojiFlags.css" />
```

> Without `EmojiFlags.css`, Windows users may see country codes (e.g. `ES`) instead of the flag glyph (🇪🇸).

---

## 8. Canonical Examples

### 8.1 App-wide base stylesheet
```css
/* app.css */
@import '@zurich/design-tokens/Emojis.css';
@import '@zurich/design-tokens/EmojiFlags.css';

:root {
  color-scheme: light dark;
}

body {
  font-family: var(--zf-sans);
  font-weight: 400;
  text-align: left;
  color: var(--z-color-text);            /* resolved by Color foundation */
  background: var(--z-color-background);
}

h1, h2 {
  font-family: var(--zf-ogg);
  font-weight: 400;
}

h3, h4, h5, h6 {
  font-family: var(--zf-sans);
  font-weight: 600;
}

.caption {
  font-family: var(--zf-sans);
  font-weight: 400;
  /* size + line-height come from the Caption hierarchy tokens */
}
```

### 8.2 React entry point
```tsx
// index.tsx
import '@zurich/design-tokens/Emojis.css';
import '@zurich/design-tokens/EmojiFlags.css';
import './app.css';

import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

### 8.3 Inline styles in a React component
```tsx
export function Hero() {
  return (
    <header>
      <h1 style={{ fontFamily: 'var(--zf-ogg)', fontWeight: 400 }}>
        Welcome to Zurich
      </h1>
      <p style={{ fontFamily: 'var(--zf-sans)', fontWeight: 400 }}>
        Protection for what matters most.
      </p>
    </header>
  );
}
```

### 8.4 Display hierarchy (landing page)
```tsx
<h1 style={{
  fontFamily:    'var(--zf-ogg)',
  fontWeight:    400,
  textAlign:     'left',          // default
  // size & line-height come from the Display hierarchy token
}}>
  Protect tomorrow, today.
</h1>
```

### 8.5 Emphasis with italic
```tsx
<p style={{ fontFamily: 'var(--zf-sans)', fontWeight: 400, fontStyle: 'italic' }}>
  Terms and conditions apply.
</p>
```

### 8.6 Avoid: anti-pattern examples
```tsx
{/* ❌ Hardcoded font name */}
<h1 style={{ fontFamily: 'Zurich Sans, sans-serif' }}>Title</h1>

{/* ❌ Ogg in body copy */}
<p style={{ fontFamily: 'var(--zf-ogg)' }}>This paragraph should use --zf-sans.</p>

{/* ❌ Fully justified text */}
<p style={{ textAlign: 'justify' }}>Hard to read on screen.</p>

{/* ❌ Inventing a custom size outside the hierarchy */}
<h2 style={{ fontSize: '23px' }}>Custom size</h2>
```

---

## 9. Decision Rules (for the AI)

- ❗ **Default font:** `var(--zf-sans)`. Use it everywhere unless the element is `Display`, `H1`, or `H2`.
- ❗ **Ogg is restricted** to `Display`, `H1`, `H2`. Don't use it for body text, captions, buttons, or labels.
- ❗ **Never hardcode the font name** ("Zurich Sans", "Ogg") — always go through the CSS variable.
- ❗ **Numeric weights only** (`300`, `400`, `500`, `600`, `700`). Avoid keywords like `lighter`, `normal`, `bolder`, `bold`.
- ❗ **Italic** is supported across all weights of Zurich Sans; Ogg has **no italic**.
- ❗ **Use predefined hierarchies** for size and line-height. Don't introduce custom `font-size` values.
- ❗ **Justification:** default `left`. `center` only when intentional. **Never `justify`.**
- ❗ **Color contrast:** Dark Blue on light, White on dark. Use Color foundation tokens to resolve exact values.
- ❗ **Always include `Emojis.css`** for cross-platform emoji parity; add `EmojiFlags.css` whenever flags are used.
- ❗ **Emoji ligatures work** only once `Emojis.css` is loaded (skin-tone + ZWJ sequences).
- ❗ **Tokens are platform-agnostic** — same `--zf-sans` / `--zf-ogg` apply in React, Vue, plain HTML, etc.

---

## 10. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
default body / paragraph                                → font-family: var(--zf-sans), weight 400
page or section heading (H1/H2)                         → font-family: var(--zf-ogg), weight 400
sub-headings (H3–H6)                                    → var(--zf-sans), weight 600
caption / metadata                                      → var(--zf-sans), weight 400 (Caption size)
emphasized inline text                                  → italic of the appropriate weight
small visual emphasis on a heading                      → SemiBold (600) or Bold (700) — NOT Ogg
landing-page hero title                                 → Display hierarchy + var(--zf-ogg)
ensure emoji parity across OSes                         → import Emojis.css
ensure flag emojis on Windows                           → import EmojiFlags.css
text on a dark background                               → color: white
text on a light background                              → color: dark blue
center a title                                          → text-align: center (only when intentional)
fully justified paragraphs                              → ❌ avoid
custom 23px size                                        → ❌ pick the closest hierarchy
```

---

## 11. Composition Patterns

### 11.1 Reusable typography utilities (CSS)
```css
.zr-display  { font-family: var(--zf-ogg);  font-weight: 400; }
.zr-h1       { font-family: var(--zf-ogg);  font-weight: 400; }
.zr-h2       { font-family: var(--zf-ogg);  font-weight: 400; }
.zr-h3       { font-family: var(--zf-sans); font-weight: 600; }
.zr-h4       { font-family: var(--zf-sans); font-weight: 600; }
.zr-body     { font-family: var(--zf-sans); font-weight: 400; }
.zr-caption  { font-family: var(--zf-sans); font-weight: 400; }
.zr-strong   { font-family: var(--zf-sans); font-weight: 700; }
.zr-italic   { font-style: italic; }
```

### 11.2 React typography helper component
```tsx
type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';

const tokens: Record<Variant, { tag: keyof JSX.IntrinsicElements; family: string; weight: number }> = {
  display: { tag: 'h1', family: 'var(--zf-ogg)',  weight: 400 },
  h1:      { tag: 'h1', family: 'var(--zf-ogg)',  weight: 400 },
  h2:      { tag: 'h2', family: 'var(--zf-ogg)',  weight: 400 },
  h3:      { tag: 'h3', family: 'var(--zf-sans)', weight: 600 },
  h4:      { tag: 'h4', family: 'var(--zf-sans)', weight: 600 },
  body:    { tag: 'p',  family: 'var(--zf-sans)', weight: 400 },
  caption: { tag: 'span', family: 'var(--zf-sans)', weight: 400 },
};

export function Text({ variant = 'body', children, ...rest }: {
  variant?: Variant;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const { tag: Tag, family, weight } = tokens[variant];
  return (
    <Tag style={{ fontFamily: family, fontWeight: weight }} {...rest}>
      {children}
    </Tag>
  );
}

// Usage:
// <Text variant="display">Hello</Text>
// <Text variant="body">Default paragraph.</Text>
```

### 11.3 Emoji-ready bootstrap (Vite / Webpack)
```ts
// main.ts
import '@zurich/design-tokens/Emojis.css';
import '@zurich/design-tokens/EmojiFlags.css';
import './styles/typography.css';
import './styles/colors.css';
```

### 11.4 Heading inside a card (using ZDS components)
```tsx
<ZrCard config="grid">
  <h2 style={{ fontFamily: 'var(--zf-ogg)', fontWeight: 400, margin: 0 }}>
    Premium plan
  </h2>
  <p style={{ fontFamily: 'var(--zf-sans)', fontWeight: 400, margin: 0 }}>
    Coverage tailored for families and travelers.
  </p>
  <ZrButton config="primary">Choose plan</ZrButton>
</ZrCard>
```

---

## 12. AI Quick Reference (cheat sheet)

```
DEFAULT FONT:       var(--zf-sans)
DISPLAY/H1/H2:      var(--zf-ogg)
WEIGHTS (sans):     300 / 400 / 500 / 600 / 700  (+ italic each)
WEIGHTS (ogg):      400 only
HIERARCHIES:        Display, H1, H2, H3, H4, H5, H6, Body, Caption
JUSTIFICATION:      left (default), center (rare), avoid justify
COLOR:              light bg → dark blue, dark bg → white
EMOJI CSS:          import '@zurich/design-tokens/Emojis.css'
FLAG EMOJI CSS:     import '@zurich/design-tokens/EmojiFlags.css'
CDN PREFIX:         https://zds.zurich.com/0.8.1/@zurich/design-tokens/
```

> Rule of thumb: **`var(--zf-sans)` for everything, `var(--zf-ogg)` only for Display/H1/H2, predefined hierarchies for sizing, `Emojis.css` + `EmojiFlags.css` for cross-platform parity.**
