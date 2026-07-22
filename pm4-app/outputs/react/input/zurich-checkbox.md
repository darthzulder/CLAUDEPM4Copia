# ZrCheckbox — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/checkbox`

---

## 1. AI Implementation Instructions

When the user asks for a **checkbox / boolean toggle / consent box / acceptance flag** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrCheckbox } from '@zurich/web-components/react/checkbox';
   ```
2. Provide a `label` whenever possible (a11y). Use the `label` slot for rich content.
3. Bind `model` (boolean) to **React state** for a closed-loop, reactive control. Update state via `onChange`.
4. Use `checked` **only** for static / uncontrolled initial state — it does not react to later state changes.
5. Use `indeterminate` for tri-state UIs (e.g. parent of a list of checkboxes when only some are checked).
6. Use kebab-case for `help-text`. Events stay camelCase (`onChange`, `onBlur`, `onRestarted`, `onValidated`).
7. Wrap multiple form controls in `<ZrForm>` so size/shape tokens cascade.
8. Customize visuals only via documented `--z-checkbox--*` CSS variables.
9. Don't mix `model` with `checked` — pick one strategy: controlled (`model`) or uncontrolled-initial (`checked`).

---

## 2. Import

```tsx
import { ZrCheckbox } from '@zurich/web-components/react/checkbox';
```

---

## 3. Props (Parameters)

| Prop            | Type                                   | Default     | Required | Description                                                                            |
|-----------------|----------------------------------------|-------------|----------|----------------------------------------------------------------------------------------|
| `label`         | `string`                               | —           | No       | Visible text label. Falls back to the `label` slot when omitted.                        |
| `model`         | `boolean`                              | `false`     | No       | Current checked state. Bind to React state for reactivity.                              |
| `checked`       | `boolean` (flag)                       | `false`     | No       | **Initial** checked state only. Static — not synced with state. Prefer `model`.         |
| `indeterminate` | `boolean`                              | `false`     | No       | Renders the checkbox in an indeterminate (mixed) visual state.                          |
| `name`          | `string`                               | —           | No       | Name attribute used inside forms.                                                      |
| `help-text`     | `string`                               | —           | No       | Helper text shown next to the label.                                                   |
| `locale`        | `string` (e.g. `"es"`, `"de"`, `"ar"`) | system      | No       | Forces localization at component level (drives default required/invalid texts).        |
| `disabled`      | `boolean`                              | `false`     | No       | Fully blocks interaction.                                                              |
| `required`      | `boolean` ⚠️ Experimental               | `false`     | No       | Marks the field as required. Default text adapts to locale.                            |
| `invalid`       | `boolean` ⚠️ Experimental               | `false`     | No       | Marks the field as invalid. Default text adapts to locale (overridable via `help-text`).|

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|----------------------------------------------|
| `onChange`     | `boolean`  | New checked value of the model.              |
| `onRestarted`  | `void`     | Value was reset.                             |
| `onBlur`       | `void`     | Component lost focus.                        |
| `onValidated`  | `boolean`  | Validation status changed.                   |

---

## 5. Slots

| Slot          | Allowed tags         | Purpose                                          |
|---------------|----------------------|--------------------------------------------------|
| `label`       | `<span>` (or `<em>`) | Custom label content (overrides `label` prop).    |
| `help-text`   | `<span>` (or `<em>`) | Custom helper text (overrides `help-text` prop). |

---

## 6. CSS Customization Tokens

| CSS Variable                  | Type   | Purpose                                |
|-------------------------------|--------|----------------------------------------|
| `--z-checkbox--bg`            | color  | Background color of the checkbox box.  |
| `--z-checkbox--border-color`  | color  | Border color of the checkbox box.      |
| `--z-checkbox--label-color`   | color  | Color of the label text.               |

```tsx
<ZrCheckbox
  label="Accept terms"
  style={{
    ['--z-checkbox--bg' as any]:           'var(--z-color-surface)',
    ['--z-checkbox--border-color' as any]: 'var(--z-color-primary)',
    ['--z-checkbox--label-color' as any]:  'var(--z-color-on-surface)',
  }}
/>
```

---

## 7. Canonical Examples

### 7.1 Minimal — no label
```tsx
<ZrCheckbox />
```

### 7.2 With label
```tsx
<ZrCheckbox label="Checkbox" />
```

### 7.3 Label slot (custom markup)
```tsx
<ZrCheckbox>
  <span slot="label">Checkbox</span>
</ZrCheckbox>
```

### 7.4 Initial checked (uncontrolled)
```tsx
<ZrCheckbox checked />
```

### 7.5 Reactive (recommended) — controlled with `model`
```tsx
import { useState } from 'react';
import { ZrCheckbox } from '@zurich/web-components/react/checkbox';

export function TermsCheckbox() {
  const [accepted, setAccepted] = useState(false);

  return (
    <ZrCheckbox
      label="I accept the terms and conditions"
      model={accepted}
      onChange={(v: boolean) => setAccepted(v)}
      required
    />
  );
}
```

### 7.6 Indeterminate (tri-state parent)
```tsx
<ZrCheckbox label="Select all" indeterminate />
```

### 7.7 Disabled variants
```tsx
<ZrCheckbox label="Checkbox" disabled />
<ZrCheckbox label="Checkbox" disabled indeterminate />
<ZrCheckbox label="Checkbox" checked disabled />
```

### 7.8 Helper text
```tsx
<ZrCheckbox label="Subscribe" help-text="We send 1 email per month" />
```

### 7.9 Helper text via slot
```tsx
<ZrCheckbox label="Subscribe">
  <em slot="help-text">We send 1 email per month</em>
</ZrCheckbox>
```

### 7.10 Required + invalid (with localization)
```tsx
<ZrCheckbox label="Required field" locale="es" required />
<ZrCheckbox label="Checkbox" locale="de" invalid />
<ZrCheckbox label="Checkbox" help-text="This input is required" invalid />
```

### 7.11 Inside a Zurich form
```tsx
import { useState } from 'react';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrCheckbox }  from '@zurich/web-components/react/checkbox';

export function SignupForm() {
  const [email, setEmail]       = useState('');
  const [accepted, setAccepted] = useState(false);

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrTextInput
        name="email"
        label="Email"
        input-type="email"
        model={email}
        onChange={(v: string) => setEmail(v)}
        required
      />
      <ZrCheckbox
        name="terms"
        label="I accept the terms and conditions"
        model={accepted}
        onChange={(v: boolean) => setAccepted(v)}
        required
      />
    </ZrForm>
  );
}
```

### 7.12 Tri-state list (parent + children pattern)
```tsx
import { useMemo, useState } from 'react';
import { ZrCheckbox } from '@zurich/web-components/react/checkbox';

export function PermissionsGroup() {
  const [perms, setPerms] = useState({ read: true, write: false, admin: false });

  const all  = perms.read && perms.write && perms.admin;
  const none = !perms.read && !perms.write && !perms.admin;
  const indet = !all && !none;

  const toggleAll = (v: boolean) =>
    setPerms({ read: v, write: v, admin: v });

  return (
    <>
      <ZrCheckbox
        label="All permissions"
        model={all}
        indeterminate={indet}
        onChange={(v: boolean) => toggleAll(v)}
      />
      <ZrCheckbox
        label="Read"
        model={perms.read}
        onChange={(v: boolean) => setPerms((p) => ({ ...p, read: v }))}
      />
      <ZrCheckbox
        label="Write"
        model={perms.write}
        onChange={(v: boolean) => setPerms((p) => ({ ...p, write: v }))}
      />
      <ZrCheckbox
        label="Admin"
        model={perms.admin}
        onChange={(v: boolean) => setPerms((p) => ({ ...p, admin: v }))}
      />
    </>
  );
}
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`model` vs `checked`:**
  - `model` — controlled, reactive. **Always pair with `onChange`.**
  - `checked` — uncontrolled, sets only the initial state. Don't mix with `model`.
- ❗ **Reactivity:** hardcoded `model` makes the component static. Always bind to `useState`.
- ❗ **`indeterminate`** is a *visual* state. Internally the value is still `false` until clicked — manage tri-state logic in your own React state.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default messages — overriding via `help-text` replaces the default.
- ❗ **Localization** via `locale` overrides the global locale only for that instance.
- ❗ **Use semantic `name`** when used in a `<ZrForm>`, so submitted data carries a meaningful key.
- ❗ **Accessibility:** if no `label` (and no label slot) is set, provide an external `aria-label` on the wrapping element.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
single boolean field                                    → <ZrCheckbox label="..." />
controlled (state-driven) checkbox                      → model + onChange
initial-checked, uncontrolled                           → checked
parent of a list (some children selected)               → indeterminate
disabled control                                        → disabled
required acceptance                                     → required (+ optional help-text)
inline error state                                      → invalid (default text or help-text)
custom label markup                                     → slot="label"
custom helper text                                      → slot="help-text"
themed look                                             → --z-checkbox--bg / --border-color / --label-color
inside a Zurich form                                    → wrap in <ZrForm>
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrCheckboxProps = {
  label?: string;
  model?: boolean;
  checked?: boolean;        // initial only — do not combine with model
  indeterminate?: boolean;
  name?: string;
  'help-text'?: string;
  locale?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange?: (value: boolean) => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  style?: React.CSSProperties & {
    ['--z-checkbox--bg']?: string;
    ['--z-checkbox--border-color']?: string;
    ['--z-checkbox--label-color']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Terms-and-conditions gate
```tsx
const [accepted, setAccepted] = useState(false);

<ZrForm onSubmit={(data) => accepted && submit(data)}>
  {/* fields */}
  <ZrCheckbox
    name="terms"
    label="I accept the terms and conditions"
    model={accepted}
    onChange={(v) => setAccepted(v)}
    required
    invalid={!accepted}
  />
</ZrForm>
```

### 11.2 Bulk selection in a table row
```tsx
<ZrTable>
  <table>
    <thead>
      <tr>
        <td>
          <ZrCheckbox
            label="All"
            model={allSelected}
            indeterminate={someSelected}
            onChange={(v) => toggleAll(v)}
          />
        </td>
        <td>Holder</td>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.id}>
          <td>
            <ZrCheckbox
              model={r.selected}
              onChange={(v) => setRow(r.id, v)}
            />
          </td>
          <td>{r.holder}</td>
        </tr>
      ))}
    </tbody>
  </table>
</ZrTable>
```

> Rule of thumb: **`<ZrCheckbox>` is a controlled boolean.** Drive it with `model` + `onChange`, use `indeterminate` only for tri-state visuals, and theme it via the three `--z-checkbox--*` tokens.
