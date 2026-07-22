# ZrForm — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Package:** `@zurich/web-components/react/form`

---

## 1. AI Implementation Instructions

When the user asks for a **form** built with the **Zurich Design System**, you (the AI) must:

1. Import the component:
   ```tsx
   import { ZrForm } from '@zurich/web-components/react/form';
   ```
2. Wrap all Zurich form-control components (e.g. `ZrTextInput`, future `ZrSelect`, etc.) inside a single `<ZrForm>`.
3. Use `<ZrForm>` as the **outer container** — it propagates visual style (`config`, `size`, `type`) down to its children, so child inputs do not need to repeat them individually.
4. Wire submission through the `onSubmit` event (do **not** use the native `<form onSubmit>` pattern — `ZrForm` already manages the submit lifecycle).
5. Customize spacing exclusively through the documented CSS variables (`--z-form--margin`, `--z-form--gap`). Do **not** override layout with inline `style={{ margin/gap }}` — this breaks design-token consistency.

---

## 2. Import

```tsx
import { ZrForm } from '@zurich/web-components/react/form';
```

Pair with any Zurich form-control component, e.g.:

```tsx
import { ZrTextInput } from '@zurich/web-components/react/text-input';
```

---

## 3. Props (Parameters)

| Prop      | Type                                                | Default     | Required | Description                                                                          |
|-----------|-----------------------------------------------------|-------------|----------|--------------------------------------------------------------------------------------|
| `config`  | `"line"` \| *(omit for shaped)*                     | shaped      | No       | Sets the **shape** of all child form controls (lined or shaped).                     |
| `size`    | `"s"` \| `"m"` \| `"l"`                             | `"m"`       | No       | Sets the **size** of all child form controls.                                        |
| `type`    | `string` (visual style token, e.g. `"primary"`)     | default     | No       | General visual style applied to inputs inside the form.                              |
| `children`| `React.ReactNode`                                   | —           | ✅ Yes    | Form controls rendered inside the form.                                              |

> **Note:** `config`, `size` and `type` flow down to children. A child can still override them locally if needed.

---

## 4. Events

| Event       | Payload | Description                                                |
|-------------|---------|------------------------------------------------------------|
| `onSubmit`  | `any`   | Fired when the form is submitted. Payload is form data.    |

---

## 5. CSS Customization Tokens

Use these CSS variables on the `<ZrForm>` element (or an ancestor) to customize layout. Both accept any valid `distance` value (`px`, `rem`, design tokens, etc.).

| CSS Variable        | Type     | Purpose                                          |
|---------------------|----------|--------------------------------------------------|
| `--z-form--margin`  | distance | Outer margin around the form.                    |
| `--z-form--gap`     | distance | Vertical gap between form controls inside.       |

Example:

```tsx
<ZrForm
  style={{
    ['--z-form--margin' as any]: '1.5rem',
    ['--z-form--gap' as any]: '1rem',
  }}
>
  {/* fields */}
</ZrForm>
```

---

## 6. Canonical Examples

### 6.1 Minimal usage
```tsx
<ZrForm>
  <ZrTextInput label="Name" />
</ZrForm>
```

### 6.2 Lined visual style propagated to all children
```tsx
<ZrForm config="line">
  <ZrTextInput label="Name" placeholder="John Doe" />
</ZrForm>
```

### 6.3 Larger form with mixed inputs
```tsx
<ZrForm size="l">
  <ZrTextInput label="First name" />
  <ZrTextInput label="Last name" />
  <ZrTextInput label="Email" input-type="email" required />
</ZrForm>
```

### 6.4 Handling submission
```tsx
import { useState } from 'react';
import { ZrForm } from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (data: any) => {
    // 'data' is the payload emitted by ZrForm
    console.log('Form submitted:', data, { name, email });
  };

  return (
    <ZrForm config="line" size="m" onSubmit={handleSubmit}>
      <ZrTextInput
        name="name"
        label="Name"
        model={name}
        onChange={(v: string) => setName(v)}
        required
      />
      <ZrTextInput
        name="email"
        label="Email"
        input-type="email"
        model={email}
        onChange={(v: string) => setEmail(v)}
        required
      />
    </ZrForm>
  );
}
```

### 6.5 Customized spacing via CSS variables
```tsx
<ZrForm
  config="line"
  style={{
    ['--z-form--margin' as any]: '2rem 0',
    ['--z-form--gap' as any]: '1.25rem',
  }}
  onSubmit={(data) => console.log(data)}
>
  <ZrTextInput label="Policy holder" />
  <ZrTextInput label="Policy number" />
</ZrForm>
```

---

## 7. Behavior Rules (for the AI)

- ❗ **Always wrap related inputs** in a single `<ZrForm>` — this guarantees consistent spacing, sizing, and styling tokens.
- ❗ **Submit handling** must use the `onSubmit` prop on `<ZrForm>`, not the native HTML form submit.
- ❗ **Do not nest** one `<ZrForm>` inside another.
- ❗ **`config` and `size`** declared on `<ZrForm>` cascade to children. Specify them on `<ZrForm>` first and override per-input only when truly necessary.
- ❗ **Layout customization** must use `--z-form--margin` / `--z-form--gap`, not raw flex/grid hacks.
- ❗ **Children must be Zurich components** (or compatible elements) — mixing arbitrary HTML inputs may break layout tokens.

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                      → Use...
----------------------------------------------------------------------------
a Zurich-styled form                                  → <ZrForm> ... </ZrForm>
lined-style form                                      → <ZrForm config="line">
larger inputs across the form                         → <ZrForm size="l">
custom spacing between fields                         → set --z-form--gap
custom outer margin                                   → set --z-form--margin
form submission handler                               → onSubmit={(data) => ...}
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrFormProps = {
  config?: 'line';
  size?: 's' | 'm' | 'l';
  type?: string;
  onSubmit?: (data: any) => void;
  style?: React.CSSProperties & {
    ['--z-form--margin']?: string;
    ['--z-form--gap']?: string;
  };
  children: React.ReactNode;
};
```

---

## 10. Composition Pattern (TextInput + Form)

`ZrForm` is the natural container for `ZrTextInput` (and future Zurich form controls):

```tsx
import { ZrForm } from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';

export function SignupForm() {
  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrTextInput name="firstName" label="First name" required />
      <ZrTextInput name="lastName"  label="Last name"  required />
      <ZrTextInput name="email"     label="Email" input-type="email" required />
      <ZrTextInput name="phone"     label="Phone" input-type="tel" />
    </ZrForm>
  );
}
```

> When documentation for additional Zurich controls (e.g. `ZrSelect`, `ZrCheckbox`) is added, drop them inside the same `<ZrForm>` — no extra wiring needed.
