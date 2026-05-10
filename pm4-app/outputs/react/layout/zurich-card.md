# ZrCard — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Package:** `@zurich/web-components/react/card`

---

## 1. AI Implementation Instructions

When the user asks for a **card / panel / surface / tile / box** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrCard } from '@zurich/web-components/react/card';
   ```
2. Provide content via **either**:
   - The `content` prop (string only), **or**
   - The default slot (`children`) — preferred when content includes JSX/markup.
3. Use the `config` prop to combine **two modifiers** separated by `:` (in any order):
   - **Padding modifier:** `slim` (removes inner padding). Omit for default padding.
   - **Display modifier:** `grid` | `flex`. Omit for default display.
   - Examples: `config="grid"`, `config="flex"`, `config="slim:grid"`, `config="slim:flex"`.
4. Set `clickable` when the card behaves like a button/link, and wire `onClick`.
5. Customize visual appearance through the documented CSS variables (`--z-card--*`) — never with arbitrary inline styles.
6. Cards are **layout primitives**: they don't bring their own typography or color unless tokens are set.

---

## 2. Import

```tsx
import { ZrCard } from '@zurich/web-components/react/card';
```

---

## 3. Props (Parameters)

| Prop         | Type                                                                  | Default     | Required | Description                                                                       |
|--------------|-----------------------------------------------------------------------|-------------|----------|-----------------------------------------------------------------------------------|
| `content`    | `string`                                                              | —           | No       | Text content of the card. Use the default slot for richer content.                |
| `config`     | `string` — combine `slim` and/or `grid`/`flex` separated by `:`       | —           | No       | Padding + display modifiers. Examples: `"grid"`, `"flex"`, `"slim:grid"`.         |
| `display`    | `"grid"` \| `"flex"` \| *(default)*                                   | default     | No       | Inner display strategy. Often configured through `config` instead.                |
| `slim`       | `boolean`                                                             | `false`     | No       | Removes inner padding. Often configured through `config` instead.                 |
| `clickable`  | `boolean`                                                             | `false`     | No       | Makes the card behave as an interactive element (cursor, focus ring, `onClick`).  |
| `size`       | `"desktop"` \| `"tablet"` \| `"mobile"` \| responsive token            | `"desktop"` | No       | Responsive sizing of the card.                                                    |
| `children`   | `React.ReactNode`                                                     | —           | No       | Default slot — preferred way to provide rich content.                             |

> The Playground exposes `display`, `slim`, `clickable`, and `size` as separate controls. In real code, **prefer `config`** (combined modifiers) for `display` + `slim`, since the docs use `config` consistently in the official examples.

---

## 4. Events

| Event       | Payload | Description                                  |
|-------------|---------|----------------------------------------------|
| `onClick`   | `void`  | Fired when the card is clicked. Requires `clickable`. |

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                          |
|--------------|----------------------|----------------------------------|
| *(default)*  | `<span>` / any inline-or-block | Card content (text, JSX, other components). |

---

## 6. CSS Customization Tokens

Set these CSS variables on `<ZrCard>` (or an ancestor) to customize the surface. All accept design-token-friendly values.

| CSS Variable        | Type     | Purpose                                  |
|---------------------|----------|------------------------------------------|
| `--z-card--bg`      | color    | Background color of the card.            |
| `--z-card--color`   | color    | Foreground (text) color.                 |
| `--z-card--radius`  | distance | Border radius.                           |
| `--z-card--padding` | distance | Inner padding (overridden by `slim`).    |
| `--z-card--gap`     | distance | Gap between children (grid/flex display).|
| `--z-card--shadow`  | shadow   | Box shadow.                              |
| `--z-card--border`  | distance | Border thickness (or full border token). |
| `--z-card--font`    | font     | Font family / typography token.          |

Example:

```tsx
<ZrCard
  style={{
    ['--z-card--bg' as any]:      'var(--z-color-surface)',
    ['--z-card--color' as any]:   'var(--z-color-on-surface)',
    ['--z-card--radius' as any]:  '12px',
    ['--z-card--padding' as any]: '1.25rem',
    ['--z-card--gap' as any]:     '0.75rem',
    ['--z-card--shadow' as any]:  '0 2px 8px rgba(0,0,0,0.08)',
  }}
>
  Card content
</ZrCard>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage with `content`
```tsx
<ZrCard content="Card content" />
```

### 7.2 Default slot (preferred for rich content)
```tsx
<ZrCard>Card content</ZrCard>
```

### 7.3 Lorem block
```tsx
<ZrCard>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
</ZrCard>
```

### 7.4 Grid display
```tsx
<ZrCard config="grid">
  <span>Item 1</span>
  <span>Item 2</span>
  <span>Item 3</span>
</ZrCard>
```

### 7.5 Flex display
```tsx
<ZrCard config="flex">
  <span>Left</span>
  <span>Right</span>
</ZrCard>
```

### 7.6 Slim (no padding) + grid
```tsx
<ZrCard config="slim:grid">
  Lorem ipsum dolor sit amet
</ZrCard>
```

### 7.7 Clickable card
```tsx
<ZrCard clickable onClick={() => console.log('card clicked')}>
  Lorem ipsum dolor sit amet
</ZrCard>
```

### 7.8 Clickable + flex layout
```tsx
<ZrCard clickable config="flex" onClick={() => navigate('/details')}>
  <strong>View details</strong>
  <span>→</span>
</ZrCard>
```

### 7.9 Themed card via tokens
```tsx
<ZrCard
  config="grid"
  style={{
    ['--z-card--bg' as any]:     '#0F172A',
    ['--z-card--color' as any]:  '#F8FAFC',
    ['--z-card--radius' as any]: '16px',
    ['--z-card--shadow' as any]: '0 6px 18px rgba(0,0,0,0.18)',
    ['--z-card--gap' as any]:    '1rem',
  }}
>
  <h3 style={{ margin: 0 }}>Premium plan</h3>
  <p style={{ margin: 0 }}>Includes 24/7 assistance and family coverage.</p>
</ZrCard>
```

### 7.10 Card containing a Zurich form
```tsx
import { ZrCard }      from '@zurich/web-components/react/card';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrSelect }   from '@zurich/web-components/react/select';

export function QuoteCard() {
  return (
    <ZrCard config="grid">
      <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
        <ZrTextInput name="name" label="Full name" required />
        <ZrSelect
          name="country"
          label="Country"
          options={[
            { value: 'es', text: 'Spain' },
            { value: 'ch', text: 'Switzerland' },
          ]}
          required
        />
      </ZrForm>
    </ZrCard>
  );
}
```

### 7.11 Grid of cards (list of items)
```tsx
const plans = [
  { id: 'basic',      title: 'Basic',      price: '€9'  },
  { id: 'pro',        title: 'Pro',        price: '€19' },
  { id: 'enterprise', title: 'Enterprise', price: '€49' },
];

export function PlanList() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {plans.map((p) => (
        <ZrCard
          key={p.id}
          clickable
          config="grid"
          onClick={() => console.log('selected', p.id)}
        >
          <strong>{p.title}</strong>
          <span>{p.price}/mo</span>
        </ZrCard>
      ))}
    </div>
  );
}
```

---

## 8. Behavior Rules (for the AI)

- ❗ **Choose `content` OR the default slot** — not both. Slot wins for rich JSX.
- ❗ **`config` combines two modifiers** with `:`. Order doesn't matter (`"slim:grid"` ≡ `"grid:slim"`), but the docs use `slim` first.
- ❗ **Use `clickable`** before wiring `onClick`. Without `clickable`, the card is not interactive and won't expose proper a11y / focus styles.
- ❗ When making a card clickable, **add an accessible label** (e.g. `aria-label` or visible text) so screen readers announce the action.
- ❗ **Customize via tokens**, not via inline `style` overrides of unrelated properties — this keeps theming consistent.
- ❗ **`slim`** removes padding entirely; if you also need a smaller-than-default padding, use `--z-card--padding` instead.
- ❗ Cards do **not** ship semantic structure (heading, list, etc.). Compose meaningful HTML inside the slot when needed.
- ❗ The `size` prop targets responsive breakpoints (`desktop` / `tablet` / `mobile`). Most apps can leave it at the default and rely on CSS.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                      → Use...
----------------------------------------------------------------------------
plain content card                                    → <ZrCard>...</ZrCard>
multi-element card (rows/columns)                     → config="grid" or "flex"
edge-to-edge content (no padding)                     → config="slim" (or "slim:grid")
clickable tile / nav card                             → clickable + onClick
themed card (color, radius, shadow)                   → set --z-card--* tokens
card containing a form                                → <ZrCard><ZrForm>...</ZrForm></ZrCard>
grid of cards                                         → wrapping flex/grid container + map()
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrCardConfig =
  | 'grid'
  | 'flex'
  | 'slim'
  | 'slim:grid'
  | 'slim:flex'
  | 'grid:slim'
  | 'flex:slim';

type ZrCardProps = {
  content?: string;
  config?: ZrCardConfig;
  display?: 'grid' | 'flex';
  slim?: boolean;
  clickable?: boolean;
  size?: 'desktop' | 'tablet' | 'mobile';
  onClick?: () => void;
  style?: React.CSSProperties & {
    ['--z-card--bg']?: string;
    ['--z-card--color']?: string;
    ['--z-card--radius']?: string;
    ['--z-card--padding']?: string;
    ['--z-card--gap']?: string;
    ['--z-card--shadow']?: string;
    ['--z-card--border']?: string;
    ['--z-card--font']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Card as a form container
```tsx
<ZrCard config="grid">
  <ZrForm config="line" size="m">
    {/* fields */}
  </ZrForm>
</ZrCard>
```

### 11.2 Clickable card list (selection UI)
```tsx
<div style={{ display: 'grid', gap: '1rem' }}>
  {items.map((it) => (
    <ZrCard
      key={it.id}
      clickable
      onClick={() => onSelect(it.id)}
      style={{ ['--z-card--padding' as any]: '1rem' }}
    >
      <strong>{it.title}</strong>
      <p style={{ margin: 0 }}>{it.description}</p>
    </ZrCard>
  ))}
</div>
```

### 11.3 Slim card hosting a media element edge-to-edge
```tsx
<ZrCard config="slim:grid">
  <img src="/banner.jpg" alt="" style={{ width: '100%', display: 'block' }} />
  <div style={{ padding: '1rem' }}>
    <h3>Title</h3>
    <p>Description</p>
  </div>
</ZrCard>
```

> Rule of thumb: **`<ZrCard>` is a surface, not a layout engine.** Use `config` for the basic display strategy and tokens for the visuals; everything else lives inside the slot.
