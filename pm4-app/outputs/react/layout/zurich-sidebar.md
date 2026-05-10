# ZrSidebar — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Layout
> **Package:** `@zurich/web-components/react/sidebar`

---

## 1. AI Implementation Instructions

When the user asks for a **sidebar**, **side panel**, **drawer**, **off-canvas menu**, **slide-in panel** (left or right), or **navigation drawer**, use this component.

1. Import:
   ```tsx
   import { ZrSidebar } from '@zurich/web-components/react/sidebar';
   ```
2. Control visibility via the **`model` prop bound to React state** (boolean). Update it through the `onChange` event for a closed loop.
3. Use the `open` flag **only** for static / uncontrolled initial state — it does not stay in sync with state.
4. Use `config` to position the sidebar:
   - `config="left"` — slide in from the left edge.
   - `config="right"` *(default)* — slide in from the right edge.
5. Provide content as **children** (default slot). The sidebar does not render its own header / close button — compose your own.
6. Pair the sidebar with a trigger element (typically a `ZrButton`) — the sidebar does **not** ship its own trigger.
7. Customize visuals through the documented `--z-sidebar--*` CSS variables (width, padding, radius, top offset, colors).
8. **Difference vs `ZrModal`:**
   - `ZrModal` overlays the viewport with a centered dialog and a backdrop.
   - `ZrSidebar` slides in from the side as a tall panel — typically used for navigation, filters, settings, or contextual info.

---

## 2. Import

```tsx
import { ZrSidebar } from '@zurich/web-components/react/sidebar';
import { ZrButton }  from '@zurich/web-components/react/button'; // common trigger
```

---

## 3. Props (Parameters)

| Prop        | Type                              | Default     | Required | Description                                                                                                |
|-------------|-----------------------------------|-------------|----------|------------------------------------------------------------------------------------------------------------|
| `model`     | `boolean`                         | `false`     | No       | Controls open state. Bind to React state and update via `onChange` for a closed loop.                       |
| `open`      | `boolean`                         | `false`     | No       | **Initial** open state only. Static — not kept in sync with state. Use `model` for interactive control.    |
| `config`    | `"left"` \| `"right"`             | `"right"`   | No       | Position of the sidebar (slides in from this edge).                                                        |
| `children`  | `React.ReactNode`                 | —           | No       | Default slot — preferred way to provide rich sidebar content.                                              |

---

## 4. Events

| Event       | Payload   | Description                                                |
|-------------|-----------|------------------------------------------------------------|
| `onChange`  | `boolean` | Fires whenever the sidebar opens/closes. New value of model.|

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                          |
|--------------|----------------------|----------------------------------|
| *(default)*  | `<span>` / any block | Sidebar body content (any JSX).  |

---

## 6. CSS Customization Tokens

| CSS Variable            | Type     | Purpose                                             |
|-------------------------|----------|-----------------------------------------------------|
| `--z-sidebar--bg`       | color    | Background color of the sidebar panel.              |
| `--z-sidebar--color`    | color    | Foreground (text) color.                            |
| `--z-sidebar--padding`  | distance | Inner padding of the sidebar.                       |
| `--z-sidebar--top`      | distance | Distance from the top of the viewport (e.g. for fixed headers). |
| `--z-sidebar--radius`   | distance | Border radius of the sidebar surface.               |
| `--z-sidebar--width`    | distance | Width of the sidebar.                               |

```tsx
<ZrSidebar
  config="left"
  model={open}
  onChange={(v) => setOpen(v)}
  style={{
    ['--z-sidebar--bg' as any]:      'var(--z-color-surface)',
    ['--z-sidebar--color' as any]:   'var(--z-color-on-surface)',
    ['--z-sidebar--padding' as any]: '1.5rem',
    ['--z-sidebar--top' as any]:     '64px',
    ['--z-sidebar--radius' as any]:  '0 12px 12px 0',
    ['--z-sidebar--width' as any]:   '320px',
  }}
>
  Sidebar content
</ZrSidebar>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage (uncontrolled, opens once)
```tsx
<ZrSidebar config="left" open>
  Content
</ZrSidebar>
```

### 7.2 Controlled — recommended pattern
```tsx
import { useState } from 'react';
import { ZrSidebar } from '@zurich/web-components/react/sidebar';
import { ZrButton }  from '@zurich/web-components/react/button';

export function MenuDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ZrButton
        config="s"
        icon="menu:line"
        onClick={() => setOpen(true)}
      >
        Menu
      </ZrButton>

      <ZrSidebar
        config="left"
        model={open}
        onChange={(v: boolean) => setOpen(v)}
      >
        <h3 style={{ marginTop: 0 }}>Menu</h3>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/policies">Policies</a>
          <a href="/profile">Profile</a>
        </nav>
      </ZrSidebar>
    </>
  );
}
```

### 7.3 Right-side filter panel (default position)
```tsx
<ZrSidebar
  model={filtersOpen}
  onChange={(v: boolean) => setFiltersOpen(v)}
>
  <h3 style={{ marginTop: 0 }}>Filters</h3>
  <ZrForm config="line">
    <ZrSelect label="Status" options={[...]} />
    <ZrRangeDateInput label="Date" />
  </ZrForm>
</ZrSidebar>
```

### 7.4 Themed sidebar (full-bleed brand panel)
```tsx
<ZrSidebar
  config="left"
  model={open}
  onChange={(v) => setOpen(v)}
  style={{
    ['--z-sidebar--bg' as any]:      '#0F172A',
    ['--z-sidebar--color' as any]:   '#F8FAFC',
    ['--z-sidebar--padding' as any]: '2rem',
    ['--z-sidebar--width' as any]:   '360px',
  }}
>
  <h3 style={{ marginTop: 0 }}>Premium plan</h3>
  <p>Upgrade for 24/7 assistance and family coverage.</p>
  <ZrButton config="primary" wide>Upgrade</ZrButton>
</ZrSidebar>
```

### 7.5 Sidebar offset below a fixed app header
```tsx
<ZrSidebar
  config="right"
  model={open}
  onChange={(v) => setOpen(v)}
  style={{ ['--z-sidebar--top' as any]: '64px' }}
>
  Settings
</ZrSidebar>
```

### 7.6 Sidebar hosting a Zurich form
```tsx
import { useState } from 'react';
import { ZrSidebar }   from '@zurich/web-components/react/sidebar';
import { ZrButton }    from '@zurich/web-components/react/button';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrSelect }    from '@zurich/web-components/react/select';

export function QuoteSidebar() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  return (
    <>
      <ZrButton config="s" onClick={() => setOpen(true)}>Get a quote</ZrButton>

      <ZrSidebar config="right" model={open} onChange={(v) => setOpen(v)}>
        <h3 style={{ marginTop: 0 }}>Get a quote</h3>
        <ZrForm
          config="line"
          size="m"
          onSubmit={(data) => { console.log('submit', data); setOpen(false); }}
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
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <ZrButton config="secondary" onClick={() => setOpen(false)}>Cancel</ZrButton>
            <ZrButton as-submit config="primary">Save</ZrButton>
          </div>
        </ZrForm>
      </ZrSidebar>
    </>
  );
}
```

### 7.7 Closing the sidebar from inside its content
```tsx
<ZrSidebar config="left" model={open} onChange={(v) => setOpen(v)}>
  <h3 style={{ marginTop: 0 }}>Menu</h3>
  <ZrButton config="link" onClick={() => setOpen(false)}>
    Close
  </ZrButton>
</ZrSidebar>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`open` vs `model`:**
  - `open` — only sets the **initial** state. Will not reflect later state changes.
  - `model` — full closed-loop control. **Always pair with `onChange`** to keep React state in sync (clicking outside or pressing ESC fires `onChange(false)`).
- ❗ **Reactivity:** hardcoding `model` makes the sidebar static. Always bind to `useState`.
- ❗ **Trigger is external.** The sidebar does not render its own opener. Pair it with `ZrButton` or any clickable element.
- ❗ **Default position is `right`.** Set `config="left"` for left-side drawers (typical for navigation menus).
- ❗ **Header offset:** when your app has a fixed top bar, set `--z-sidebar--top` so the sidebar starts below it.
- ❗ **Width / padding** are controlled via `--z-sidebar--width` and `--z-sidebar--padding` — don't override with raw CSS unless those tokens are insufficient.
- ❗ **Provide a way to close** from inside the sidebar (e.g. a Close button or auto-close on submit) — depending on the host UI, ESC / outside-click may not always be obvious.
- ❗ **Use modal (`ZrModal`) instead** for short, focused dialogs that require user attention. Use sidebar for navigation, filters, or contextual side-panels.
- ❗ **Stacking:** if you ever combine a modal and a sidebar, the modal will typically render on top.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
slide-in side panel                                     → <ZrSidebar>...</ZrSidebar>
left-edge navigation drawer                             → config="left"
right-edge filter / settings panel                      → config="right" (default)
controlled open/close                                   → model={open} + onChange
opens on initial render                                 → open
custom width                                            → --z-sidebar--width
offset below a fixed header                             → --z-sidebar--top
themed bg / color / padding                             → --z-sidebar--* tokens
sidebar containing a form                               → <ZrSidebar><ZrForm>...</ZrForm></ZrSidebar>
short, focused dialog                                   → ❌ use <ZrModal>
permanently visible side column                         → ❌ build a regular <aside> with CSS
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrSidebarProps = {
  model?: boolean;
  open?: boolean;
  config?: 'left' | 'right';
  onChange?: (open: boolean) => void;
  style?: React.CSSProperties & {
    ['--z-sidebar--bg']?: string;
    ['--z-sidebar--color']?: string;
    ['--z-sidebar--padding']?: string;
    ['--z-sidebar--top']?: string;
    ['--z-sidebar--radius']?: string;
    ['--z-sidebar--width']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Trigger + Sidebar (canonical)
```tsx
const [open, setOpen] = useState(false);

<>
  <ZrButton onClick={() => setOpen(true)}>Open</ZrButton>
  <ZrSidebar config="left" model={open} onChange={(v) => setOpen(v)}>
    …
  </ZrSidebar>
</>
```

### 11.2 Filters drawer (right side, table on the left)
```tsx
const [filtersOpen, setFiltersOpen] = useState(false);

<>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <h2>Policies</h2>
    <ZrButton config="secondary" icon="filter:line" onClick={() => setFiltersOpen(true)}>
      Filters
    </ZrButton>
  </div>

  <ZrTable headers={['ID', 'Holder', 'Status']} rows={rows} zebra />

  <ZrSidebar
    config="right"
    model={filtersOpen}
    onChange={(v) => setFiltersOpen(v)}
  >
    <h3 style={{ marginTop: 0 }}>Filters</h3>
    {/* form fields */}
  </ZrSidebar>
</>
```

### 11.3 Form host inside a sidebar (auto-close on submit)
```tsx
<ZrSidebar config="right" model={open} onChange={(v) => setOpen(v)}>
  <ZrForm onSubmit={(data) => { save(data); setOpen(false); }}>
    {/* inputs */}
    <ZrButton as-submit config="primary" wide>Save</ZrButton>
  </ZrForm>
</ZrSidebar>
```

### 11.4 Card-rich sidebar (rich navigation)
```tsx
<ZrSidebar config="left" model={open} onChange={(v) => setOpen(v)}>
  <ZrCard config="grid" clickable onClick={() => navigate('/dashboard')}>
    Dashboard
  </ZrCard>
  <ZrCard config="grid" clickable onClick={() => navigate('/policies')}>
    Policies
  </ZrCard>
  <ZrCard config="grid" clickable onClick={() => navigate('/profile')}>
    Profile
  </ZrCard>
</ZrSidebar>
```

> Rule of thumb: **`<ZrSidebar>` is a transient side panel.** Manage its visibility through `model` + `onChange`, place any Zurich content inside its default slot, choose `config="left"`/`"right"` for position, and theme it with `--z-sidebar--*` tokens. For centered dialogs use `<ZrModal>`; for permanently visible columns build a regular CSS layout.
