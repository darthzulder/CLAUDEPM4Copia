# ZrTabs — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Layout
> **Package:** `@zurich/web-components/react/tabs`

---

## 1. AI Implementation Instructions

When the user asks for **tabs**, **tab navigation**, **panel switcher**, **tabbed view**, **section selector**, or any UI where multiple panels share the same area and only one is visible at a time, use this component.

1. Import:
   ```tsx
   import { ZrTabs } from '@zurich/web-components/react/tabs';
   ```
2. Define tabs through **one of three modes** (don't mix them arbitrarily):
   - **Object mode (`tabs` prop):** array of `{ name, icon?, content?, disabled? }` objects.
   - **`<option>` mode:** native `<option>` children with `value`, optional `icon`, optional `disabled`, and inner text as content.
   - **Slot mode (`tab-<index>` / `tab-<index>-label`):** the most flexible — set `name`/`disabled` directly on the slot element, and put rich JSX inside.
3. **Indexes are 1-based.** The first tab is `tab-1`, not `tab-0`. The same applies to `model`.
4. Bind `model` (number) to **React state** to control which tab is active. Update via `onChange`.
5. Use `tab-<index>-label` slots to customize the tab button content (icons, badges, emoji); use `tab-<index>` slots to customize the panel content.
6. Use icons via the `icon` property (object mode) or `icon` attribute (option mode). Format: `name:style` (e.g. `home:line`).
7. Disable a tab through `disabled` on the option / slot / object entry.
8. The component owns the visible-panel state internally; for external coordination, use `model` + `onChange`.

---

## 2. Import

```tsx
import { ZrTabs } from '@zurich/web-components/react/tabs';
```

---

## 3. Props (Parameters)

| Prop          | Type                                       | Default | Required | Description                                                                          |
|---------------|--------------------------------------------|---------|----------|--------------------------------------------------------------------------------------|
| `tabs`        | `ZrTab[]` *(see §3.1)*                     | —       | No       | Object-mode definition of tabs. Alternative to `<option>` children or slot mode.     |
| `model`       | `number` (1-based) — also accepts numeric `string` | `1` | No  | Index of the currently active tab. Bind to React state for reactivity.               |
| `numberOfTabs`| `number`                                   | —       | No       | Playground-only hint. Inferred from `tabs` / options / slots in real code.           |
| `children`    | `React.ReactNode`                          | —       | No       | Default slot — `<option>` children, or `tab-<index>` / `tab-<index>-label` slots.    |

### 3.1 `ZrTab` shape (object mode)

| Property   | Type        | Required | Description                                       |
|------------|-------------|----------|---------------------------------------------------|
| `name`     | `string`    | ✅ Yes    | Visible label of the tab.                         |
| `icon`     | `string`    | No       | Icon name (`name:style`, e.g. `home:line`).       |
| `content`  | `string`    | No       | Plain-text panel content. Use slots for rich JSX. |
| `disabled` | `boolean`   | No       | If `true`, the tab cannot be activated.           |

```ts
type ZrTab = {
  name: string;
  icon?: string;
  content?: string;
  disabled?: boolean;
};
```

---

## 4. Events

| Event       | Payload   | Description                                                       |
|-------------|-----------|-------------------------------------------------------------------|
| `onChange`  | `boolean` | Fires when the active tab changes. Use to sync with `useState`.   |

> ⚠️ The docs declare `onChange` payload as `boolean`. In practice, treat it as a "tab changed" notification — read the new index from your state setter or by tracking the user's interaction. If a numeric index is needed, lift the `model` value through your own state.

---

## 5. Slots

| Slot                      | Allowed tags        | Purpose                                                                                |
|---------------------------|---------------------|----------------------------------------------------------------------------------------|
| *(default)*               | `<option>`          | Define tabs via `<option value="..." icon="..." disabled?>...</option>`.               |
| `tab-<index>`             | `<div>` / any block | Rich JSX content for the panel of the n-th tab. Index is 1-based.                      |
| `tab-<index>-label`       | `<span>` (or `<em>`)| Custom label content for the n-th tab button (icons, emoji, badges).                   |

> The slot element itself can carry `name="..."` and/or `disabled` attributes when slot mode is used without `tabs` / `<option>`.

---

## 6. Canonical Examples

### 6.1 Object mode (simplest, plain content)
```tsx
<ZrTabs
  tabs={[
    { name: 'HTML', content: 'HTML — Lorem ipsum dolor sit amet.' },
    { name: 'CSS',  content: 'CSS — Lorem ipsum dolor sit amet.' },
    { name: 'JS',   content: 'JS — Lorem ipsum dolor sit amet.' },
  ]}
/>
```

### 6.2 Object mode with icons + disabled
```tsx
<ZrTabs
  tabs={[
    { name: 'HTML', icon: 'home:line', content: 'HTML — …' },
    { name: 'CSS',  icon: 'home:line', content: 'CSS — …', disabled: true },
    { name: 'JS',   icon: 'home:line', content: 'JS — …' },
  ]}
/>
```

### 6.3 `<option>` mode
```tsx
<ZrTabs>
  <option icon="home:line" value="HTML">
    HTML — Lorem ipsum dolor sit amet.
  </option>
  <option icon="home:line" value="CSS" disabled>
    CSS — Lorem ipsum dolor sit amet.
  </option>
  <option icon="home:line" value="JS">
    JS — Lorem ipsum dolor sit amet.
  </option>
</ZrTabs>
```

### 6.4 `tabs` prop + `tab-<index>` slots for rich content
```tsx
<ZrTabs tabs={[{ name: 'HTML' }, { name: 'CSS' }, { name: 'JS' }]}>
  <div slot="tab-1">
    <b>HTML</b>
    <p>Lorem ipsum dolor sit amet.</p>
  </div>
  <div slot="tab-2">
    <b>CSS</b>
    <p>Lorem ipsum dolor sit amet.</p>
  </div>
  <div slot="tab-3">
    <b>JS</b>
    <p>Lorem ipsum dolor sit amet.</p>
  </div>
</ZrTabs>
```

### 6.5 Slot-only mode (declare `name` / `disabled` on the slot)
```tsx
<ZrTabs>
  <div name="HTML" slot="tab-1">
    <b>HTML</b><p>Lorem ipsum.</p>
  </div>
  <div name="CSS" slot="tab-2">
    <b>CSS</b><p>Lorem ipsum.</p>
  </div>
  <div name="JS" slot="tab-3">
    <b>JS</b><p>Lorem ipsum.</p>
  </div>
</ZrTabs>
```

### 6.6 Customizing tab labels with `tab-<index>-label` slots
```tsx
<ZrTabs>
  <em slot="tab-1-label">🟦 HTML</em>
  <em slot="tab-2-label">🟦 CSS</em>
  <em slot="tab-3-label">🟦 JS</em>

  <div name="HTML" slot="tab-1">
    <b>HTML</b><p>Lorem ipsum.</p>
  </div>
  <div name="CSS" slot="tab-2">
    <b>CSS</b><p>Lorem ipsum.</p>
  </div>
  <div name="JS" slot="tab-3">
    <b>JS</b><p>Lorem ipsum.</p>
  </div>
</ZrTabs>
```

### 6.7 Pre-selected active tab (1-based)
```tsx
<ZrTabs model={2}>
  <div name="HTML" slot="tab-1">HTML — …</div>
  <div name="CSS"  slot="tab-2">CSS — …</div>
  <div name="JS"   slot="tab-3">JS — …</div>
</ZrTabs>
```

### 6.8 Reactive (recommended) — controlled with `model`
```tsx
import { useState } from 'react';
import { ZrTabs } from '@zurich/web-components/react/tabs';

export function DocsTabs() {
  const [active, setActive] = useState(1);

  return (
    <ZrTabs
      model={active}
      onChange={() => {
        // The component switched tabs internally — sync your state.
        // If you need the new index, set it where the click happens
        // (see §6.9), or lift state via tab-<index>-label onClick handlers.
      }}
      tabs={[
        { name: 'HTML' },
        { name: 'CSS' },
        { name: 'JS' },
      ]}
    >
      <div slot="tab-1">HTML content</div>
      <div slot="tab-2">CSS content</div>
      <div slot="tab-3">JS content</div>
    </ZrTabs>
  );
}
```

### 6.9 Reactive with explicit per-tab buttons (when index is needed)
```tsx
import { useState } from 'react';
import { ZrTabs }   from '@zurich/web-components/react/tabs';
import { ZrButton } from '@zurich/web-components/react/button';

export function ControlledTabs() {
  const [active, setActive] = useState(1);

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ZrButton config={active === 1 ? 'primary:s' : 'secondary:s'} onClick={() => setActive(1)}>HTML</ZrButton>
        <ZrButton config={active === 2 ? 'primary:s' : 'secondary:s'} onClick={() => setActive(2)}>CSS</ZrButton>
        <ZrButton config={active === 3 ? 'primary:s' : 'secondary:s'} onClick={() => setActive(3)}>JS</ZrButton>
      </div>

      <ZrTabs model={active} onChange={() => { /* sync if needed */ }}>
        <div name="HTML" slot="tab-1">HTML content</div>
        <div name="CSS"  slot="tab-2">CSS content</div>
        <div name="JS"   slot="tab-3">JS content</div>
      </ZrTabs>
    </>
  );
}
```

### 6.10 Tabs inside a card
```tsx
import { ZrCard } from '@zurich/web-components/react/card';
import { ZrTabs } from '@zurich/web-components/react/tabs';

<ZrCard config="grid">
  <ZrTabs
    tabs={[
      { name: 'Overview' },
      { name: 'Coverage' },
      { name: 'Claims' },
    ]}
  >
    <div slot="tab-1"><h3>Overview</h3><p>…</p></div>
    <div slot="tab-2"><h3>Coverage</h3><p>…</p></div>
    <div slot="tab-3"><h3>Claims</h3><p>…</p></div>
  </ZrTabs>
</ZrCard>
```

---

## 7. Behavior Rules (for the AI)

- ❗ **Indexes are 1-based** for `model`, `tab-<index>` slots, and `tab-<index>-label` slots. There is no `tab-0`.
- ❗ **Pick one definition mode:** object (`tabs`), `<option>` children, or slot-only (with `name` on the slot). Avoid mixing modes for the same set of tabs.
- ❗ **Reactivity:** if `model` is hardcoded, the active tab will not update from the user's clicks. Bind to `useState`.
- ❗ **`onChange` payload is documented as `boolean`** — treat it as a "tab changed" signal. If you need the precise new index, manage selection in your own state via external triggers or lift it from the user's interaction.
- ❗ **Slot composition:** `tab-<index>` controls the panel; `tab-<index>-label` controls the tab button. They can be used together.
- ❗ **`name` on the slot** is required when no `tabs` / `<option>` defines the label.
- ❗ **`disabled` tabs** cannot be activated — make sure `model` doesn't point to a disabled tab.
- ❗ **Icons** use the `name:style` format (e.g. `home:line`, `info:solid`).
- ❗ **Use a card or section** around tabs to give them a visible boundary; the component itself does not draw a container background.
- ❗ **Don't use tabs** for sequential flows (use a wizard / steps), top-level navigation (use sidebar / nav), or modal-only content (use modal).

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                         → Use...
------------------------------------------------------------------------------
simple plain-text tabs                                   → tabs prop with { name, content }
tabs with icons                                          → tabs prop with { name, icon }
disable a single tab                                     → disabled on object/option/slot
rich JSX inside a panel                                  → slot="tab-<n>" (1-based)
custom tab button content (emoji, badge, layout)         → slot="tab-<n>-label"
controlled active tab                                    → model + onChange (+ external buttons if you need the index)
preselected active tab                                   → model={N}
tabs inside a card / section                             → wrap in <ZrCard>
sequential wizard                                        → ❌ tabs — use a stepper / wizard pattern
top-level navigation                                     → ❌ tabs — use <ZrSidebar> or a nav bar
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrTab = {
  name: string;
  icon?: string;
  content?: string;
  disabled?: boolean;
};

type ZrTabsProps = {
  tabs?: ZrTab[];
  model?: number;            // 1-based
  numberOfTabs?: number;
  onChange?: (changed: boolean) => void;
  children?: React.ReactNode;
};
```

---

## 10. Composition Patterns

### 10.1 Documentation viewer (label + rich content slots)
```tsx
<ZrTabs>
  <em slot="tab-1-label">📘 Guide</em>
  <em slot="tab-2-label">⚙️ API</em>
  <em slot="tab-3-label">🧪 Examples</em>

  <div name="Guide"    slot="tab-1"><h3>Guide</h3>{/* MDX/HTML */}</div>
  <div name="API"      slot="tab-2"><h3>API</h3>{/* tables */}</div>
  <div name="Examples" slot="tab-3"><h3>Examples</h3>{/* code samples */}</div>
</ZrTabs>
```

### 10.2 Tabs hosting forms per section
```tsx
<ZrTabs tabs={[{ name: 'Personal' }, { name: 'Address' }, { name: 'Payment' }]}>
  <div slot="tab-1">
    <ZrForm>
      <ZrTextInput label="First name" />
      <ZrTextInput label="Last name" />
    </ZrForm>
  </div>
  <div slot="tab-2">
    <ZrForm>
      <ZrTextInput label="Street" />
      <ZrTextInput label="City" />
    </ZrForm>
  </div>
  <div slot="tab-3">
    <ZrForm>
      <ZrSelect label="Method" options={[{ value: 'card', text: 'Card' }, { value: 'paypal', text: 'PayPal' }]} />
    </ZrForm>
  </div>
</ZrTabs>
```

### 10.3 Tabs inside a sidebar (settings panel)
```tsx
<ZrSidebar config="right" model={open} onChange={(v) => setOpen(v)}>
  <ZrTabs tabs={[{ name: 'General' }, { name: 'Privacy' }, { name: 'Billing' }]}>
    <div slot="tab-1">General settings</div>
    <div slot="tab-2">Privacy settings</div>
    <div slot="tab-3">Billing settings</div>
  </ZrTabs>
</ZrSidebar>
```

> Rule of thumb: **`<ZrTabs>` is a 1-based panel switcher.** Pick one definition mode (object / `<option>` / slot-only), bind `model` to state when you need controlled behavior, and use `tab-<index>` and `tab-<index>-label` slots for rich content. For sequential flows use a wizard pattern; for app navigation use sidebars.
