# ZrTile — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Molecules *(composite content surface)*
> **Package:** `@zurich/web-components/react/tile`

---

## 1. AI Implementation Instructions

When the user asks for a **tile**, **promo card**, **content card with image + header + body + actions**, **article preview**, **product tile**, **feature card**, or **rich content surface that combines media + text + CTAs**, use this component.

1. Import:
   ```tsx
   import { ZrTile } from '@zurich/web-components/react/tile';
   ```
2. Provide content through any combination of these slots / props (mix freely):
   - `header` (prop) or `header` slot → title row.
   - `content` (prop) or default slot → body copy.
   - `image-src` (prop) or `image-src` slot → media block.
   - `actions` slot → footer CTAs (typically a `ZrButtonGroup` with two or more `<ZrButton>`s).
3. **String props vs slots:** use string props (`content`, `header`, `image-src`) for plain text/URL content. Use slots when you need rich JSX (icons in the header, `<em>` emphasis, custom image element, action buttons).
4. **Layout direction:** set `left` to render the image on the left side instead of on top (the default).
5. **Image source flexibility:** `image-src` accepts either a **URL** (`/path.webp`, `https://...`) or a **named ZDS sample** (e.g. `polar_bear`).
6. **`imageType`** is a Playground hint for picking how the image is rendered (URL vs named). In real code, simply set `image-src` to the appropriate value.
7. **Customize visuals** via the `--z-tile--*` CSS variables (`--z-tile--bg`, `--z-tile--color`).
8. **Difference vs `ZrCard`:**
   - `ZrCard` is a generic container surface (layout primitive).
   - `ZrTile` is a **structured promo** with predefined header / content / image / actions zones.
   - For a plain container, use `ZrCard`. For a media + content + CTA combo, use `ZrTile`.

---

## 2. Import

```tsx
import { ZrTile }        from '@zurich/web-components/react/tile';
import { ZrButton }      from '@zurich/web-components/react/button';
// import { ZrButtonGroup } from '@zurich/web-components/react/button-group'; // when documented
```

---

## 3. Props (Parameters)

| Prop          | Type                                        | Default     | Required | Description                                                                                          |
|---------------|---------------------------------------------|-------------|----------|------------------------------------------------------------------------------------------------------|
| `header`      | `string`                                    | —           | No       | Tile title text. Falls back to the `header` slot when omitted.                                       |
| `content`     | `string`                                    | —           | No       | Tile body text. Falls back to the default slot when omitted.                                         |
| `image-src`   | `string` — URL or named ZDS sample          | —           | No       | Image to display in the media block. Falls back to the `image-src` slot.                             |
| `imageType`   | `string` *(Playground hint)*                | —           | No       | Playground-only — picks between "URL" and named-sample modes. In real code, just set `image-src`.    |
| `left`        | `boolean`                                   | `false`     | No       | Renders the image on the **left** of the content (default: image on top).                           |
| `children`    | `React.ReactNode`                           | —           | No       | Default slot — body content if `content` is not used; container for the named slots (header / image-src / actions). |

---

## 4. Events

> ZrTile does not declare its own events. Wire interactions on the inner buttons inside the `actions` slot (`onClick` per `ZrButton`).

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                                                                  |
|--------------|----------------------|------------------------------------------------------------------------------------------|
| *(default)*  | `<span>` / any block | Tile body content when `content` prop is not provided.                                   |
| `header`     | `<span>` / inline    | Custom header markup (icons, `<em>` emphasis, badges).                                   |
| `image-src`  | `<img>` / any media  | Custom image element (use when `image-src` URL prop is not enough — e.g. `<picture>`).   |
| `actions`    | `<ZrButtonGroup>` / any | Footer action zone — typically a button group with primary + secondary CTAs.           |

---

## 6. CSS Customization Tokens

| CSS Variable        | Type   | Purpose                                          |
|---------------------|--------|--------------------------------------------------|
| `--z-tile--bg`      | color  | Background color of the tile.                    |
| `--z-tile--color`   | color  | Foreground (text / heading) color.               |

```tsx
<ZrTile
  header="Premium plan"
  content="Coverage tailored for families."
  style={{
    ['--z-tile--bg' as any]:    'var(--zc-dove)',
    ['--z-tile--color' as any]: 'var(--zc-blue-dark)',
  }}
/>
```

---

## 7. Canonical Examples

### 7.1 Minimal — body via `content` prop
```tsx
<ZrTile content="Tile content" />
```

### 7.2 Minimal — body via default slot
```tsx
<ZrTile>Tile content</ZrTile>
```

### 7.3 With header
```tsx
<ZrTile header="Header" content="Tile content" />
```

### 7.4 With header slot (rich content)
```tsx
<ZrTile>
  <span slot="header">
    Header <em>text</em>
  </span>
  Tile content
</ZrTile>
```

### 7.5 With image URL
```tsx
<ZrTile
  header="Header"
  image-src="https://zds.zurich.com/0.8.1/sample.webp"
>
  Tile content
</ZrTile>
```

### 7.6 With named ZDS sample image
```tsx
<ZrTile header="Header" image-src="polar_bear">
  Tile content
</ZrTile>
```

### 7.7 Image via slot (full control)
```tsx
<ZrTile header="Header">
  <img slot="image-src" src="/0.8.1/sample.webp" alt="" />
  Tile content
</ZrTile>
```

### 7.8 Horizontal layout — image on the left
```tsx
<ZrTile
  header="Header"
  image-src="https://zds.zurich.com/0.8.1/sample.webp"
  content="Tile content"
  left
/>
```

### 7.9 With actions (CTA buttons)
```tsx
import { ZrButton }      from '@zurich/web-components/react/button';
import { ZrButtonGroup } from '@zurich/web-components/react/button-group';

<ZrTile header="Header" content="Tile content">
  <ZrButtonGroup slot="actions">
    <ZrButton config="xs" icon="link:line">Visit</ZrButton>
    <ZrButton config="secondary:xs" icon="bookmark:line" icon-right>Save</ZrButton>
  </ZrButtonGroup>
</ZrTile>
```

### 7.10 Full promo (image + header + content + actions)
```tsx
<ZrTile
  header="Premium plan"
  image-src="https://zds.zurich.com/0.8.1/sample.webp"
>
  <span slot="header">
    Premium <em>plan</em>
  </span>

  Coverage tailored for families and travelers.

  <ZrButtonGroup slot="actions">
    <ZrButton config="primary:xs" icon="arrow-right:line" icon-right>
      Choose
    </ZrButton>
    <ZrButton config="secondary:xs">Learn more</ZrButton>
  </ZrButtonGroup>
</ZrTile>
```

### 7.11 Reactive — clickable card with state
```tsx
import { useState } from 'react';

export function FeatureTile() {
  const [saved, setSaved] = useState(false);

  return (
    <ZrTile
      header="Wellbeing kit"
      content="Coverage extras for mindfulness and prevention."
    >
      <ZrButtonGroup slot="actions">
        <ZrButton config="xs" icon="link:line">Visit</ZrButton>
        <ZrButton
          config="secondary:xs"
          icon={saved ? 'bookmark' : 'bookmark:line'}
          icon-right
          onClick={() => setSaved((s) => !s)}
        >
          {saved ? 'Saved' : 'Save'}
        </ZrButton>
      </ZrButtonGroup>
    </ZrTile>
  );
}
```

### 7.12 Inside a 12-column grid
```html
<section z-grid="main">
  <div column="1:4">
    <ZrTile header="A" image-src="/a.webp">Description A</ZrTile>
  </div>
  <div column="5:8">
    <ZrTile header="B" image-src="/b.webp">Description B</ZrTile>
  </div>
  <div column="9:12">
    <ZrTile header="C" image-src="/c.webp">Description C</ZrTile>
  </div>
</section>
```

### 7.13 Themed tile
```tsx
<ZrTile
  header="Branded"
  content="Branded tile background"
  style={{
    ['--z-tile--bg' as any]:    'var(--zc-blue-zurich)',
    ['--z-tile--color' as any]: 'var(--zg-white-zurich)',
  }}
/>
```

### 7.14 Avoid: anti-patterns
```tsx
{/* ❌ Putting raw <button> elements inside the actions slot */}
<ZrTile>
  <button slot="actions">Visit</button>
</ZrTile>
{/* → Use <ZrButton> (ideally inside a <ZrButtonGroup>). */}

{/* ❌ Setting both `content` and default slot — ambiguous source of truth */}
<ZrTile content="A">
  B
</ZrTile>

{/* ❌ Image via inline <img> outside a slot — won't be placed in the media zone */}
<ZrTile>
  <img src="/x.webp" alt="" />
  Body
</ZrTile>
{/* → Add slot="image-src" to the <img>, or pass image-src as a prop. */}
```

---

## 8. Behavior Rules (for the AI)

- ❗ **Choose prop OR slot per zone** — don't mix `content` prop with default-slot body, or `header` prop with `header` slot. Pick one.
- ❗ **Layout direction is controlled by `left`** — without it, image stacks on top; with it, image sits on the left.
- ❗ **`image-src` accepts URL or named sample.** Don't pass arbitrary objects.
- ❗ **`actions` slot expects a `<ZrButtonGroup>`** (or any inline content). Use sized buttons (`config="xs"` / `config="secondary:xs"`) so the footer stays compact.
- ❗ **Theme via `--z-tile--bg` / `--z-tile--color`** — never override inline colors directly on inner elements.
- ❗ **Tiles are presentational** — no events; wire interactions on the action buttons.
- ❗ **Use a `ZrCard`** for plain container needs (no media zone, no fixed structure). Use a `ZrTile` when the layout is explicitly Header + Content + Image + Actions.
- ❗ **Don't nest tiles** — they are leaf-level molecules.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
plain content card                                      → <ZrCard>...</ZrCard>
promo / article-style card with header + image + CTAs   → <ZrTile>...</ZrTile>
image on top (default)                                  → omit `left`
image on the left                                       → add `left`
plain header text                                       → header="..." prop
header with <em> / icon                                 → slot="header"
remote image URL                                        → image-src="https://..."
named ZDS sample                                        → image-src="polar_bear" (or other)
custom <picture> / responsive image                     → <img slot="image-src" /> or custom JSX
primary + secondary CTAs in footer                      → <ZrButtonGroup slot="actions">...
themed background                                       → --z-tile--bg / --z-tile--color
multi-tile grid                                         → wrap in <section z-grid="main"> + column="..."
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrTileProps = {
  header?: string;
  content?: string;
  'image-src'?: string;
  imageType?: string;
  left?: boolean;
  style?: React.CSSProperties & {
    ['--z-tile--bg']?: string;
    ['--z-tile--color']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Three-tile feature row
```tsx
<section z-grid="main">
  <div column="1:4">
    <ZrTile
      header="Plans"
      image-src="/plans.webp"
    >
      Tailored coverage for every life stage.
      <ZrButtonGroup slot="actions">
        <ZrButton config="xs" icon="arrow-right:line" icon-right>Explore</ZrButton>
      </ZrButtonGroup>
    </ZrTile>
  </div>

  <div column="5:8">
    <ZrTile
      header="Claims"
      image-src="/claims.webp"
    >
      Resolve issues in 24 hours.
      <ZrButtonGroup slot="actions">
        <ZrButton config="xs" icon="arrow-right:line" icon-right>Learn more</ZrButton>
      </ZrButtonGroup>
    </ZrTile>
  </div>

  <div column="9:12">
    <ZrTile
      header="Support"
      image-src="/support.webp"
    >
      24/7 assistance in your language.
      <ZrButtonGroup slot="actions">
        <ZrButton config="xs" icon="phone:line">Contact</ZrButton>
      </ZrButtonGroup>
    </ZrTile>
  </div>
</section>
```

### 11.2 Horizontal tile (left image) inside a list
```tsx
{items.map((it) => (
  <ZrTile
    key={it.id}
    left
    image-src={it.image}
    header={it.title}
  >
    {it.summary}
    <ZrButtonGroup slot="actions">
      <ZrButton config="xs" icon="link:line">Open</ZrButton>
      <ZrButton config="secondary:xs" icon="bookmark:line" icon-right>Save</ZrButton>
    </ZrButtonGroup>
  </ZrTile>
))}
```

### 11.3 Tile with stateful save action
```tsx
const [saved, setSaved] = useState(false);

<ZrTile
  header="Wellbeing kit"
  content="Mindfulness and prevention extras."
>
  <ZrButtonGroup slot="actions">
    <ZrButton config="primary:xs">Add to plan</ZrButton>
    <ZrButton
      config="secondary:xs"
      icon={saved ? 'bookmark' : 'bookmark:line'}
      onClick={() => setSaved((s) => !s)}
    >
      {saved ? 'Saved' : 'Save'}
    </ZrButton>
  </ZrButtonGroup>
</ZrTile>
```

> Rule of thumb: **`<ZrTile>` is a structured promo molecule** combining header + content + image + actions. Mix string props and slots intentionally, drive actions through `<ZrButton>` inside `<ZrButtonGroup slot="actions">`, and reach for `<ZrCard>` when you only need a plain container.
