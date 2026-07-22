# ZrRadioSelect — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/radio-select`

---

## 1. AI Implementation Instructions

When the user asks for a **radio group**, **radio buttons**, **single-choice picker** ("choose one"), **option list**, or **mutually-exclusive selector**, use this component.

1. Import:
   ```tsx
   import { ZrRadioSelect } from '@zurich/web-components/react/radio-select';
   ```
2. Always provide a `label` (a11y for the whole group). Use the `label` slot for rich content.
3. Define choices through **either**:
   - The `options` prop (array of objects: `{ value, text, disabled? }`), **or**
   - Native `<option>` children with a `value` attribute, **or**
   - The `option-<value>` slots when an option needs custom content (icons, badges, descriptions).
4. Bind `model` (string) to **React state** for reactivity. The value of `model` MUST be one of the option `value`s. Update via `onChange`.
5. Use kebab-case for HTML-like props (`help-text`). Events stay camelCase.
6. Use `config="inline"` to render options on a single row instead of stacked.
7. Wrap together with other Zurich form controls inside a `<ZrForm>` so size/shape tokens cascade.
8. **Don't confuse** with `ZrSelect` (dropdown) or `ZrCheckbox` (multi-select / boolean) — `ZrRadioSelect` enforces **exactly one** choice from a small set.

---

## 2. Import

```tsx
import { ZrRadioSelect } from '@zurich/web-components/react/radio-select';
```

---

## 3. Props (Parameters)

| Prop          | Type                                            | Default     | Required | Description                                                                                |
|---------------|-------------------------------------------------|-------------|----------|--------------------------------------------------------------------------------------------|
| `label`       | `string`                                        | —           | ✅ Yes    | Visible text label describing the group.                                                   |
| `model`       | `string`                                        | `""`        | No       | Currently selected value. Must match a value present in the options. Bind to React state.  |
| `name`        | `string`                                        | —           | No       | Name attribute used inside forms.                                                          |
| `config`      | `"inline"` \| *(omit for stacked)*              | stacked     | No       | Layout: stacked (default) or inline (horizontal).                                          |
| `options`     | `ZrRadioOption[]` *(see §3.1)*                  | —           | No       | Array of option descriptors. Alternative to passing `<option>` children.                    |
| `help-text`   | `string`                                        | —           | No       | Helper text shown below the group.                                                         |
| `locale`      | `string` (e.g. `"ar"`, `"it"`, `"en"`)          | system      | No       | Forces localization at component level.                                                    |
| `disabled`    | `boolean`                                       | `false`     | No       | Fully blocks interaction with the entire group.                                            |
| `required`    | `boolean` ⚠️ Experimental                        | `false`     | No       | Marks the group as required. Default text adapts to locale.                                |
| `invalid`     | `boolean` ⚠️ Experimental                        | `false`     | No       | Marks the group as invalid. Default text adapts to locale.                                 |

### 3.1 `ZrRadioOption` shape

Each entry in the `options` array is an object with these properties:

| Property   | Type        | Required | Description                                                       |
|------------|-------------|----------|-------------------------------------------------------------------|
| `value`    | `string`    | ✅ Yes    | Unique value of the option. The only compulsory property.         |
| `text`     | `string`    | No       | Visible label of the option. Falls back to `value` if omitted.    |
| `disabled` | `boolean`   | No       | If `true`, the option cannot be selected.                         |

```ts
type ZrRadioOption = {
  value: string;
  text?: string;
  disabled?: boolean;
};
```

---

## 4. Events

| Event          | Payload    | Description                                            |
|----------------|------------|--------------------------------------------------------|
| `onChange`     | `string`   | New selected value (matches one of the option values).|
| `onRestarted`  | `void`     | Value was reset.                                       |
| `onBlur`       | `void`     | Component lost focus.                                  |
| `onValidated`  | `boolean`  | Validation status changed.                             |

---

## 5. Slots

| Slot                  | Allowed tags     | Purpose                                                                                           |
|-----------------------|------------------|---------------------------------------------------------------------------------------------------|
| `label`               | `<span>` (or `<em>`) | Custom label content (overrides `label` prop).                                                |
| `help-text`           | `<span>` (or `<em>`) | Custom helper text (overrides `help-text` prop).                                              |
| *(default)*           | `<option>`       | Define options with `value` attribute and inner text. Equivalent to using the `options` prop.     |
| `option-<value>`      | any              | Customize the rendered content of a specific option. Pattern: one slot per option, named `option-` + that option's `value`. |

> ⚠️ When mixing `<option>` children with `option-<value>` slots, the **selected label still derives from the `<option>` inner text** unless you leave it empty and rely entirely on the slotted content.

---

## 6. Canonical Examples

### 6.1 Minimal usage with `<option>` children
```tsx
<ZrRadioSelect label="Radio select">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3" disabled>Option 3</option>
  <option value="4">Option 4</option>
</ZrRadioSelect>
```

### 6.2 Reactive (recommended) using `options` prop
```tsx
import { useState } from 'react';
import { ZrRadioSelect } from '@zurich/web-components/react/radio-select';

export function PlanPicker() {
  const [plan, setPlan] = useState('');

  const options = [
    { value: 'basic',      text: 'Basic' },
    { value: 'pro',        text: 'Pro' },
    { value: 'enterprise', text: 'Enterprise', disabled: true },
  ];

  return (
    <ZrRadioSelect
      label="Plan"
      model={plan}
      options={options}
      onChange={(value: string) => setPlan(value)}
    />
  );
}
```

### 6.3 Pre-selected value
```tsx
<ZrRadioSelect label="Radio select" model="1">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</ZrRadioSelect>
```

### 6.4 Inline layout
```tsx
<ZrRadioSelect config="inline" label="Radio select">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3" disabled>Option 3</option>
  <option value="4">Option 4</option>
</ZrRadioSelect>
```

### 6.5 Helper text
```tsx
<ZrRadioSelect label="Radio select" help-text="Help text">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</ZrRadioSelect>
```

### 6.6 Helper text via slot
```tsx
<ZrRadioSelect label="Radio select">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <em slot="help-text">Help text</em>
</ZrRadioSelect>
```

### 6.7 Custom label via slot
```tsx
<ZrRadioSelect>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <em slot="label">Radio select</em>
</ZrRadioSelect>
```

### 6.8 Customizing option content with `option-<value>` slots
```tsx
<ZrRadioSelect label="Radio select">
  <option value="1"></option>
  <em slot="option-1">Option 1</em>

  <option value="2"></option>
  <em slot="option-2">Option 2</em>

  <option value="3"></option>
  <em slot="option-3">Option 3</em>

  <option value="4"></option>
  <em slot="option-4">Option 4</em>
</ZrRadioSelect>
```

### 6.9 Rich option content (icon + text)
```tsx
import { ZrRadioSelect } from '@zurich/web-components/react/radio-select';
import { ZrIcon }        from '@zurich/web-components/react/icon';

<ZrRadioSelect label="Notification preference">
  <option value="email"></option>
  <span slot="option-email">
    <ZrIcon icon="mail:line" /> Email
  </span>

  <option value="sms"></option>
  <span slot="option-sms">
    <ZrIcon icon="phone:line" /> SMS
  </span>

  <option value="push"></option>
  <span slot="option-push">
    <ZrIcon icon="bell:line" /> Push
  </span>
</ZrRadioSelect>
```

### 6.10 Disabled group
```tsx
<ZrRadioSelect label="Radio select" model="1" disabled>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3" disabled>Option 3</option>
  <option value="4">Option 4</option>
</ZrRadioSelect>
```

### 6.11 Required + invalid (with localization)
```tsx
<ZrRadioSelect label="Radio select" locale="it" model="1" required>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</ZrRadioSelect>

<ZrRadioSelect label="Radio select" locale="it" model="1" invalid>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</ZrRadioSelect>
```

### 6.12 Inside a Zurich form
```tsx
import { useState } from 'react';
import { ZrForm }        from '@zurich/web-components/react/form';
import { ZrTextInput }   from '@zurich/web-components/react/text-input';
import { ZrRadioSelect } from '@zurich/web-components/react/radio-select';

export function QuoteForm() {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('');

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrTextInput
        name="holder"
        label="Holder"
        model={name}
        onChange={(v: string) => setName(v)}
        required
      />
      <ZrRadioSelect
        name="plan"
        label="Plan"
        model={plan}
        options={[
          { value: 'basic', text: 'Basic' },
          { value: 'pro',   text: 'Pro' },
        ]}
        onChange={(v: string) => setPlan(v)}
        required
      />
    </ZrForm>
  );
}
```

---

## 7. Behavior Rules (for the AI)

- ❗ **`model` must match an option `value`.** Otherwise nothing will appear selected.
- ❗ **Reactivity:** if `model` is hardcoded, the selection will not update. Always pair it with state and `onChange`.
- ❗ **Single choice:** `ZrRadioSelect` enforces exactly one selection. For multi-select, use multiple `<ZrCheckbox>`s; for a dropdown, use `<ZrSelect>`.
- ❗ **`disabled` at group level vs. per-option:**
  - `disabled` on `<ZrRadioSelect>` → blocks the entire group.
  - `disabled` on `<option>` (or `option.disabled` in `options`) → blocks only that option.
- ❗ **`config="inline"`** lays out options horizontally; omit for the default stacked layout.
- ❗ **`option-<value>` slots** customize the rendered row. Pair with empty `<option value="...">` tags so the value is registered.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default messages.
- ❗ **Localization** via `locale` overrides the global locale only for that instance.
- ❗ **Don't use** for boolean toggles (`<ZrCheckbox>`) or large, searchable lists (`<ZrSelect>` with `with-search`).

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
"choose one" radio group                                → <ZrRadioSelect> + <option>s
data-driven radio group                                 → options={[{ value, text }, ...]}
preselected value                                       → model="x" (and bind to state)
horizontal radio layout                                 → config="inline"
disable a single option                                 → option.disabled = true
disable the whole group                                 → disabled
required                                                → required
inline error state                                      → invalid (+ optional help-text)
custom row content (icon, badge, description)           → slot="option-<value>"
helper text below the group                             → help-text="..."
inside a Zurich form                                    → wrap in <ZrForm>
many options / searchable                               → ❌ use <ZrSelect with-search>
multi-select                                            → ❌ use multiple <ZrCheckbox>
single boolean (yes/no)                                 → ❌ use <ZrCheckbox>
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrRadioOption = {
  value: string;
  text?: string;
  disabled?: boolean;
};

type ZrRadioSelectProps = {
  label?: string;
  model?: string;
  name?: string;
  config?: 'inline';
  options?: ZrRadioOption[];
  'help-text'?: string;
  locale?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  children?: React.ReactNode;
};
```

---

## 10. Composition Patterns

### 10.1 Plan picker inside a form
```tsx
<ZrForm config="line">
  <ZrRadioSelect
    name="plan"
    label="Choose your plan"
    model={plan}
    options={[
      { value: 'basic', text: 'Basic' },
      { value: 'pro',   text: 'Pro' },
      { value: 'plus',  text: 'Plus' },
    ]}
    onChange={(v) => setPlan(v)}
    required
  />
</ZrForm>
```

### 10.2 Inline yes/no/maybe selector
```tsx
<ZrRadioSelect
  config="inline"
  label="Will you attend?"
  model={answer}
  onChange={(v) => setAnswer(v)}
>
  <option value="yes">Yes</option>
  <option value="no">No</option>
  <option value="maybe">Maybe</option>
</ZrRadioSelect>
```

### 10.3 Rich-content option list (icons + descriptions)
```tsx
<ZrRadioSelect label="Notification channel" model={channel} onChange={(v) => setChannel(v)}>
  <option value="email"></option>
  <span slot="option-email">
    <ZrIcon icon="mail:line" /> <strong>Email</strong> — instant updates
  </span>

  <option value="sms"></option>
  <span slot="option-sms">
    <ZrIcon icon="phone:line" /> <strong>SMS</strong> — short codes only
  </span>
</ZrRadioSelect>
```

### 10.4 Inside a card with helper guidance
```tsx
<ZrCard config="grid">
  <ZrRadioSelect
    label="Coverage type"
    help-text="You can change this later"
    model={coverage}
    onChange={(v) => setCoverage(v)}
  >
    <option value="basic">Basic</option>
    <option value="full">Full</option>
  </ZrRadioSelect>
</ZrCard>
```

> Rule of thumb: **`<ZrRadioSelect>` is a single-choice group of visible options.** Drive it with `model` + `onChange`, choose `config="inline"` for compact layouts, and reach for `option-<value>` slots when each option needs richer markup. For dropdowns, use `<ZrSelect>`; for multi-select, use multiple `<ZrCheckbox>`s.
