# ZrModal — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Layout
> **Package:** `@zurich/web-components/react/modal`

---

## 1. AI Implementation Instructions

When the user asks for a **modal / dialog / popup / overlay** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrModal } from '@zurich/web-components/react/modal';
   ```
2. Control visibility via the **`model` prop bound to React state** (boolean). Update it through the `onChange` event for a closed loop.
3. Use the `open` flag **only** for static / uncontrolled initial state — not for interactive open/close (it does not stay in sync with state).
4. Provide modal content as **children** through the default slot. `content` (string) is available for plain-text-only modals.
5. Pair the modal with a trigger element (typically a `ZrButton`) — the modal does **not** ship its own trigger.
6. Use `no-close` to suppress the built-in close button when the modal must be dismissed programmatically.
7. Customize visuals through the documented `--z-modal--*` CSS variables. Use `--z-modal--position` to switch between `fixed` (default, overlays the viewport) and `absolute` (overlays the parent).
8. Cards, forms and inputs can live inside `<ZrModal>` like any other content.

---

## 2. Import

```tsx
import { ZrModal }  from '@zurich/web-components/react/modal';
import { ZrButton } from '@zurich/web-components/react/button'; // common trigger
```

---

## 3. Props (Parameters)

| Prop        | Type                | Default     | Required | Description                                                                                                |
|-------------|---------------------|-------------|----------|------------------------------------------------------------------------------------------------------------|
| `model`     | `boolean`           | `false`     | No       | Controls open state. Bind to React state and update via `onChange` for a closed loop.                       |
| `open`      | `boolean`           | `false`     | No       | **Initial** open state only. Static — not kept in sync with state. Use `model` for interactive control.    |
| `no-close`  | `boolean`           | `false`     | No       | Hides the built-in close button. Modal can only be closed programmatically.                                |
| `content`   | `string`            | —           | No       | Text content of the modal. Prefer the default slot for rich content.                                        |
| `children`  | `React.ReactNode`   | —           | No       | Default slot — preferred way to provide rich modal content.                                                 |

> The Playground also lets you tweak `content` directly. In real apps, prefer rendering JSX inside the default slot.

---

## 4. Events

| Event       | Payload   | Description                                                |
|-------------|-----------|------------------------------------------------------------|
| `onChange`  | `boolean` | Fires whenever the modal opens/closes. New value of model. |

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                       |
|--------------|----------------------|-------------------------------|
| *(default)*  | `<span>` / any block | Modal body content (any JSX). |

---

## 6. CSS Customization Tokens

Set these CSS variables on `<ZrModal>` (or an ancestor) to customize the dialog. All accept design-token-friendly values.

| CSS Variable              | Type     | Purpose                                                                  |
|---------------------------|----------|--------------------------------------------------------------------------|
| `--z-modal--bg`           | color    | Background color of the modal panel.                                     |
| `--z-modal--color`        | color    | Foreground (text) color.                                                 |
| `--z-modal--padding`      | distance | Inner padding of the modal panel.                                        |
| `--z-modal--backdrop`     | color    | Color (with alpha) of the backdrop overlay.                              |
| `--z-modal--z-index`      | distance | Stacking order of the modal layer.                                        |
| `--z-modal--position`     | keyword  | `fixed` (default — viewport overlay) or `absolute` (overlays parent).    |

Example:

```tsx
<ZrModal
  model={open}
  onChange={(v: boolean) => setOpen(v)}
  style={{
    ['--z-modal--bg' as any]:        'var(--z-color-surface)',
    ['--z-modal--color' as any]:     'var(--z-color-on-surface)',
    ['--z-modal--padding' as any]:   '1.5rem',
    ['--z-modal--backdrop' as any]:  'rgba(0,0,0,0.45)',
    ['--z-modal--z-index' as any]:   '1000',
  }}
>
  <p>Content of the modal</p>
</ZrModal>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage (uncontrolled, opens once)
```tsx
<ZrModal open>
  Content
</ZrModal>
```

### 7.2 Controlled — recommended pattern
```tsx
import { useState } from 'react';
import { ZrModal }  from '@zurich/web-components/react/modal';
import { ZrButton } from '@zurich/web-components/react/button';

export function ConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ZrButton
        config="s"
        icon="arrow-diagonal:line"
        onClick={() => setOpen(true)}
      >
        Open modal
      </ZrButton>

      <ZrModal model={open} onChange={(v: boolean) => setOpen(v)}>
        <p>Content of the modal</p>
      </ZrModal>
    </>
  );
}
```

### 7.3 Modal that cannot be closed by the user
```tsx
<ZrModal model={open} onChange={(v: boolean) => setOpen(v)} no-close>
  <p>Please wait while we process your request…</p>
</ZrModal>
```

### 7.4 Absolute positioning (overlay parent only)
```tsx
<div style={{ position: 'relative', minHeight: 320 }}>
  <ZrModal
    model={open}
    onChange={(v: boolean) => setOpen(v)}
    style={{ ['--z-modal--position' as any]: 'absolute' }}
  >
    <p>Content of the modal</p>
  </ZrModal>
</div>
```

### 7.5 Themed modal via tokens
```tsx
<ZrModal
  model={open}
  onChange={(v: boolean) => setOpen(v)}
  style={{
    ['--z-modal--bg' as any]:       '#0F172A',
    ['--z-modal--color' as any]:    '#F8FAFC',
    ['--z-modal--padding' as any]:  '2rem',
    ['--z-modal--backdrop' as any]: 'rgba(15,23,42,0.6)',
  }}
>
  <h3 style={{ marginTop: 0 }}>Premium plan</h3>
  <p>Includes 24/7 assistance and family coverage.</p>
</ZrModal>
```

### 7.6 Modal hosting a Zurich form (inputs + select inside)
```tsx
import { useState } from 'react';
import { ZrModal }     from '@zurich/web-components/react/modal';
import { ZrButton }    from '@zurich/web-components/react/button';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrSelect }    from '@zurich/web-components/react/select';

export function QuoteModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  return (
    <>
      <ZrButton config="s" onClick={() => setOpen(true)}>Get a quote</ZrButton>

      <ZrModal model={open} onChange={(v: boolean) => setOpen(v)}>
        <ZrForm
          config="line"
          size="m"
          onSubmit={(data) => {
            console.log('submit', data);
            setOpen(false);
          }}
        >
          <ZrTextInput
            name="name"
            label="Full name"
            model={name}
            onChange={(v: string) => setName(v)}
            required
          />
          <ZrSelect
            name="country"
            label="Country"
            model={country}
            options={[
              { value: 'es', text: 'Spain' },
              { value: 'ch', text: 'Switzerland' },
            ]}
            onChange={(v: string) => setCountry(v)}
            required
          />
        </ZrForm>
      </ZrModal>
    </>
  );
}
```

### 7.7 Confirmation modal with explicit actions and `no-close`
```tsx
<ZrModal
  model={confirmOpen}
  onChange={(v: boolean) => setConfirmOpen(v)}
  no-close
>
  <h3 style={{ marginTop: 0 }}>Delete policy?</h3>
  <p>This action cannot be undone.</p>

  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
    <ZrButton config="s" onClick={() => setConfirmOpen(false)}>Cancel</ZrButton>
    <ZrButton
      config="s"
      onClick={() => {
        deletePolicy();
        setConfirmOpen(false);
      }}
    >
      Delete
    </ZrButton>
  </div>
</ZrModal>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`open` vs `model`:**
  - `open` — only sets the **initial** state. Will not reflect later state changes.
  - `model` — full closed-loop control. **Always pair with `onChange`** to keep React state in sync (clicking the close button or backdrop fires `onChange(false)`).
- ❗ **Reactivity:** hardcoding `model` makes the modal static. Always bind to `useState`.
- ❗ **`no-close`** disables the built-in close affordance — when used, you **must** provide an explicit way to close (a button + `setOpen(false)`).
- ❗ **Triggers are external.** The modal does not render its own opener. Pair it with `ZrButton` or any clickable element.
- ❗ **Default position is `fixed`** (full-viewport overlay). Use `--z-modal--position: absolute` to scope to the parent (the parent must be `position: relative`).
- ❗ **Stacking:** if multiple modals coexist, raise `--z-modal--z-index` on the topmost one.
- ❗ **Backdrop color** (`--z-modal--backdrop`) typically uses an alpha value — pure opaque colors will hide the page entirely.
- ❗ **Choose `content` OR the default slot** — not both. Slot wins for rich JSX.
- ❗ **Accessibility:** include a heading (`<h2>`/`<h3>`) inside the modal and ensure focus management on open. The component handles ESC/backdrop close unless `no-close` is set.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                      → Use...
----------------------------------------------------------------------------
basic dialog                                          → <ZrModal>...</ZrModal>
controlled open/close                                 → model={open} + onChange
opens on initial render                               → open
non-dismissable (loading, mandatory choice)           → no-close + explicit action buttons
overlay only the parent container                     → --z-modal--position: absolute
themed modal (bg, padding, backdrop)                  → --z-modal--* tokens
modal containing a form                               → <ZrModal><ZrForm>...</ZrForm></ZrModal>
confirmation dialog                                   → no-close + Cancel/Confirm ZrButtons
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrModalProps = {
  model?: boolean;
  open?: boolean;
  'no-close'?: boolean;
  content?: string;
  onChange?: (open: boolean) => void;
  style?: React.CSSProperties & {
    ['--z-modal--bg']?: string;
    ['--z-modal--color']?: string;
    ['--z-modal--padding']?: string;
    ['--z-modal--backdrop']?: string;
    ['--z-modal--z-index']?: string;
    ['--z-modal--position']?: 'fixed' | 'absolute';
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Trigger + Modal (canonical)
```tsx
const [open, setOpen] = useState(false);

<>
  <ZrButton onClick={() => setOpen(true)}>Open</ZrButton>
  <ZrModal model={open} onChange={(v: boolean) => setOpen(v)}>
    …
  </ZrModal>
</>
```

### 11.2 Modal as a form host
```tsx
<ZrModal model={open} onChange={(v: boolean) => setOpen(v)}>
  <ZrForm onSubmit={(data) => { save(data); setOpen(false); }}>
    {/* inputs */}
  </ZrForm>
</ZrModal>
```

### 11.3 Card inside a modal (rich content surface)
```tsx
<ZrModal model={open} onChange={(v: boolean) => setOpen(v)}>
  <ZrCard config="grid">
    <h3>Plan details</h3>
    <p>Coverage, premium and conditions.</p>
  </ZrCard>
</ZrModal>
```

> Rule of thumb: **`<ZrModal>` is a transient overlay surface.** Manage its visibility through `model` + `onChange`, render any Zurich content inside its default slot, and theme it with `--z-modal--*` tokens.
