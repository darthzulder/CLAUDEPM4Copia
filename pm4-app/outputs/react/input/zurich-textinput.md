# ZrTextInput — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Package:** `@zurich/web-components/react/text-input`

---

## 1. AI Implementation Instructions

When the user asks for an input/text field/form field using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrTextInput } from '@zurich/web-components/react/text-input';
   ```
2. Always pass a `label` (mandatory for accessibility). If a long or rich label is required, use the `label` slot.
3. Use the `model` prop bound to a **React state variable** (never hardcode it — it won't be reactive).
4. Use kebab-case for HTML-like props (`help-text`, `input-type`, `max-length`, `align-right`, `data-list`, `has-data-list`) and camelCase only when the React wrapper requires it. The Zurich React wrapper accepts the kebab-case attributes as shown in the official examples.
5. Wire up events through the `on*` handlers documented below.
6. Do NOT use `disabled` and `readonly` interchangeably — they have distinct meanings.
7. Default shape is "shaped". Pass `config="line"` for the lined variant.

---

## 2. Import

```tsx
import { ZrTextInput } from '@zurich/web-components/react/text-input';
```

---

## 3. Props (Parameters)

| Prop          | Type                                          | Default     | Required | Description                                                                 |
|---------------|-----------------------------------------------|-------------|----------|-----------------------------------------------------------------------------|
| `label`       | `string`                                      | —           | ✅ Yes    | Visible text label describing the field.                                    |
| `model`       | `string`                                      | `""`        | No       | Current value. Bind to React state to keep reactivity.                      |
| `name`        | `string`                                      | —           | No       | Name attribute used inside forms.                                           |
| `config`      | `"line"` \| *(omit for shaped)*               | shaped      | No       | Visual variant: shaped (default) or lined.                                  |
| `size`        | `"s"` \| `"m"` \| `"l"`                       | `"m"`       | No       | Size of the component.                                                      |
| `locale`      | `string` (e.g. `"ar"`, `"th"`, `"en"`)        | system      | No       | Forces localization at component level.                                     |
| `input-type`  | `"text"` \| `"tel"` \| `"email"` \| `"url"`   | `"text"`    | No       | HTML input type.                                                            |
| `help-text`   | `string`                                      | —           | No       | Helper text shown below the input.                                          |
| `icon`        | `string` (e.g. `"search:line"`)               | —           | No       | Icon displayed on the right side. Use `name:style` syntax.                  |
| `min-length`  | `number`                                      | —           | No       | Minimum number of characters allowed.                                       |
| `max-length`  | `number`                                      | —           | No       | Maximum allowed characters; renders a counter below the input.              |
| `data-list`   | `string[]`                                    | —           | No       | Suggestion list for autocomplete.                                           |
| `has-data-list` | `boolean`                                   | `false`     | No       | Enables the suggestion list UI.                                             |
| `disabled`    | `boolean`                                     | `false`     | No       | Disables interaction completely.                                            |
| `readonly`    | `boolean`                                     | `false`     | No       | Renders as read-only output (not the same as disabled).                     |
| `required`    | `boolean` ⚠️ Experimental                      | `false`     | No       | Marks the field as required. Default text adapts to locale.                 |
| `invalid`     | `boolean` ⚠️ Experimental                      | `false`     | No       | Marks the field as invalid. Default text adapts to locale.                  |
| `align-right` | `boolean`                                     | `false`     | No       | Aligns input text to the right. Combinable with `icon`.                     |

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|----------------------------------------------|
| `onChange`     | `string`   | New value of the model.                      |
| `onEnter`      | `void`     | User pressed the Enter key.                  |
| `onRestarted`  | `void`     | Value was reset.                             |
| `onBlur`       | `void`     | Input lost focus.                            |
| `onValidated`  | `boolean`  | Validation status changed.                   |
| `onSelect`     | `string`   | A suggestion was selected from the data-list.|

---

## 5. Slots

| Slot         | Allowed tags | Purpose                                            |
|--------------|--------------|----------------------------------------------------|
| `label`      | `<span>`     | Custom label content (overrides `label` prop).     |
| `help-text`  | `<span>`     | Custom helper text (overrides `help-text` prop).   |
| *(default)*  | `<option>`   | Suggestion items when using the data-list pattern. |

---

## 6. Canonical Examples

### 6.1 Minimal usage
```tsx
<ZrTextInput label="Text input" />
```

### 6.2 Lined variant
```tsx
<ZrTextInput config="line" label="Text input" />
```

### 6.3 Reactive (recommended)
```tsx
import { useState } from 'react';
import { ZrTextInput } from '@zurich/web-components/react/text-input';

export function NameField() {
  const [name, setName] = useState('');

  return (
    <ZrTextInput
      label="Full name"
      model={name}
      onChange={(value: string) => setName(value)}
    />
  );
}
```

### 6.4 With helper text and validation
```tsx
<ZrTextInput
  label="Email"
  input-type="email"
  help-text="We'll never share your email"
  required
  invalid={hasError}
/>
```

### 6.5 With icon and character counter
```tsx
<ZrTextInput
  label="Search"
  icon="search:line"
  max-length={40}
/>
```

### 6.6 Read-only output
```tsx
<ZrTextInput label="Policy number" model="POL-0001-2025" readonly />
```

### 6.7 With suggestion list
```tsx
<ZrTextInput
  label="Country"
  has-data-list
  data-list={['Spain', 'Switzerland', 'Germany']}
  onSelect={(value: string) => console.log('Selected:', value)}
/>
```

Or using the default slot:
```tsx
<ZrTextInput label="Country" has-data-list>
  <option>Spain</option>
  <option>Switzerland</option>
  <option>Germany</option>
</ZrTextInput>
```

### 6.8 Custom label slot
```tsx
<ZrTextInput>
  <em slot="label">Text input</em>
</ZrTextInput>
```

### 6.9 Right-aligned with icon (e.g. amount fields)
```tsx
<ZrTextInput
  label="Amount"
  icon="file-blank:line"
  model={amount}
  align-right
  onChange={(v: string) => setAmount(v)}
/>
```

### 6.10 Full form-ready example
```tsx
import { useState } from 'react';
import { ZrTextInput } from '@zurich/web-components/react/text-input';

export function ContactForm() {
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(true);

  return (
    <form>
      <ZrTextInput
        name="email"
        label="Email address"
        input-type="email"
        model={email}
        help-text="Use your work email"
        required
        invalid={!valid}
        max-length={120}
        onChange={(v: string) => setEmail(v)}
        onValidated={(isValid: boolean) => setValid(isValid)}
        onEnter={() => console.log('submit')}
        onBlur={() => console.log('blur')}
      />
    </form>
  );
}
```

---

## 7. Behavior Rules (for the AI)

- ❗ **Reactivity:** if `model` is hardcoded, the field will not respond to user input. Always pair it with state and `onChange`.
- ❗ **`disabled` vs `readonly`:**
  - `disabled` — fully blocks interaction, value is *not* submitted with the form.
  - `readonly` — value is visible and submitted, but cannot be edited.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default text — do not override unless necessary.
- ❗ **Icons** use the `name:style` format, e.g. `search:line`, `file-blank:line`, `align-text-center:outlined`.
- ❗ **`max-length`** automatically renders a counter (`0/N`).
- ❗ **`config="line"`** changes only the visual style; behavior and props remain identical.
- ❗ **Localization** via `locale` overrides the global locale only for that component instance.

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                      → Use...
--------------------------------------------------------------
single-line text field                → <ZrTextInput label="..." />
email/phone/url input                 → input-type="email" | "tel" | "url"
field with hint                       → help-text="..."
field with validation error           → invalid + help-text="..."
required field                        → required
read-only display                     → readonly + model="..."
search-style field                    → icon="search:line"
field with character limit            → max-length={N}
autocomplete / suggestions            → has-data-list + data-list={[...]}
minimal/lined visual style            → config="line"
amount or numeric-aligned field       → align-right (+ optional icon)
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrTextInputProps = {
  label?: string;
  model?: string;
  name?: string;
  config?: 'line';
  size?: 's' | 'm' | 'l';
  locale?: string;
  'input-type'?: 'text' | 'tel' | 'email' | 'url';
  'help-text'?: string;
  icon?: string;
  'min-length'?: number;
  'max-length'?: number;
  'data-list'?: string[];
  'has-data-list'?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  'align-right'?: boolean;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  onSelect?: (value: string) => void;
  children?: React.ReactNode;
};
```
