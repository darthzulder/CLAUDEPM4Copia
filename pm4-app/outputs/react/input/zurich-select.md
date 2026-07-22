# ZrSelect — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Package:** `@zurich/web-components/react/select`

---

## 1. AI Implementation Instructions

When the user asks for a **dropdown / select / combo / picker** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrSelect } from '@zurich/web-components/react/select';
   ```
2. Always provide a `label` (mandatory for accessibility). Use the `label` slot only when a non-string label is needed.
3. Always declare the available choices through **either**:
   - The `options` prop (array of objects), **or**
   - Native `<option>` children with a `value` attribute.
   - Or the `option-<value>` slots when the option needs custom content (icons, badges).
4. Bind `model` to a **React state variable** (never hardcode it — it won't be reactive). The value of `model` MUST be one of the option `value`s.
5. Wire updates through `onChange` (camelCase). Read search input via `onSearch` (only meaningful when `with-search` is enabled).
6. Use kebab-case for HTML-like props (`help-text`, `with-search`, `search-placeholder`, `search-autofocus`).
7. Wrap together with other Zurich form controls inside a `<ZrForm>` so size/shape tokens cascade.
8. Do NOT confuse `disabled` with `readonly` — they are distinct states.
9. Default shape is "shaped"; pass `config="line"` for the lined variant.

---

## 2. Import

```tsx
import { ZrSelect } from '@zurich/web-components/react/select';

// Optional, when using icon slots inside options:
import { ZrIcon } from '@zurich/web-components/react/icon';
```

---

## 3. Props (Parameters)

| Prop                | Type                                         | Default     | Required | Description                                                                                |
|---------------------|----------------------------------------------|-------------|----------|--------------------------------------------------------------------------------------------|
| `label`             | `string`                                     | —           | ✅ Yes    | Visible text label describing the field.                                                   |
| `model`             | `string`                                     | `""`        | No       | Currently selected value. Must match a value present in `options`. Bind to React state.    |
| `name`              | `string`                                     | —           | No       | Name attribute used inside forms.                                                          |
| `config`            | `"line"` \| *(omit for shaped)*              | shaped      | No       | Visual variant: shaped (default) or lined.                                                 |
| `size`              | `"s"` \| `"m"` \| `"l"`                      | `"m"`       | No       | Size of the component.                                                                     |
| `locale`            | `string` (e.g. `"ar"`, `"it"`, `"en"`)       | system      | No       | Forces localization at component level.                                                    |
| `help-text`         | `string`                                     | —           | No       | Helper text shown below the input.                                                         |
| `options`           | `ZrSelectOption[]` *(see §3.1)*              | —           | No       | Array of option descriptors. Alternative to passing `<option>` children.                    |
| `with-search`       | `boolean`                                    | `false`     | No       | Enables an internal search input to filter the options.                                    |
| `search-placeholder`| `string`                                     | —           | No       | Placeholder/label for the search input (requires `with-search`).                           |
| `search-autofocus`  | `boolean`                                    | `false`     | No       | Auto-focuses the search input when shown (requires `with-search`).                         |
| `readonly`          | `boolean`                                    | `false`     | No       | Renders as read-only output (value visible, not editable).                                 |
| `disabled`          | `boolean`                                    | `false`     | No       | Fully blocks interaction.                                                                  |
| `required`          | `boolean` ⚠️ Experimental                     | `false`     | No       | Marks the field as required. Default text adapts to locale.                                |
| `invalid`           | `boolean` ⚠️ Experimental                     | `false`     | No       | Marks the field as invalid. Default text adapts to locale.                                 |

### 3.1 `ZrSelectOption` shape

Each entry in the `options` array is an object with these properties:

| Property   | Type        | Required | Description                                                              |
|------------|-------------|----------|--------------------------------------------------------------------------|
| `value`    | `string`    | ✅ Yes    | Unique value of the option. The only compulsory property.                |
| `text`     | `string`    | No       | Visible label of the option. Falls back to `value` if omitted.           |
| `disabled` | `boolean`   | No       | If `true`, the option cannot be selected.                                |
| `hide`     | `boolean`   | No       | If `true`, the option is hidden from the visible list.                   |
| `meta`     | `string[]`  | No       | Alternative search terms (used when `with-search` is enabled).           |

```ts
type ZrSelectOption = {
  value: string;
  text?: string;
  disabled?: boolean;
  hide?: boolean;
  meta?: string[];
};
```

---

## 4. Events

| Event          | Payload    | Description                                            |
|----------------|------------|--------------------------------------------------------|
| `onChange`     | `string`   | New selected value (matches one of the option values).|
| `onSearch`     | `string`   | Current search query (only fires with `with-search`). |
| `onRestarted`  | `void`     | Value was reset.                                       |
| `onBlur`       | `void`     | Component lost focus.                                  |
| `onValidated`  | `boolean`  | Validation status changed.                             |

---

## 5. Slots

| Slot                  | Allowed tags     | Purpose                                                                                          |
|-----------------------|------------------|--------------------------------------------------------------------------------------------------|
| `label`               | `<span>` (or `<em>`) | Custom label content (overrides `label` prop).                                              |
| `help-text`           | `<span>` (or `<em>`) | Custom helper text (overrides `help-text` prop).                                            |
| *(default)*           | `<option>`       | Define options with `value` attribute and inner text. Equivalent to using the `options` prop.    |
| `option-<value>`      | any              | Customize the rendered content of a specific option (icons, rich markup). Pattern: one slot per option, named `option-` + that option's `value`. |

> ⚠️ When mixing `<option>` children with `option-<value>` slots, the **selected label still comes from the `<option>` inner text**, not from the slotted content.

---

## 6. Canonical Examples

### 6.1 Minimal usage with `<option>` children
```tsx
<ZrSelect label="Select">
  <option value="a">Option A</option>
  <option value="b">Option B</option>
  <option value="c" disabled>Option C</option>
  <option value="d">Option D</option>
</ZrSelect>
```

### 6.2 Lined variant
```tsx
<ZrSelect config="line" label="Select">
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</ZrSelect>
```

### 6.3 Reactive (recommended) using `options` prop
```tsx
import { useState } from 'react';
import { ZrSelect } from '@zurich/web-components/react/select';

export function CountryPicker() {
  const [country, setCountry] = useState('');

  const options = [
    { value: 'es', text: 'Spain' },
    { value: 'ch', text: 'Switzerland' },
    { value: 'de', text: 'Germany', meta: ['deutschland'] },
    { value: 'fr', text: 'France', disabled: true },
  ];

  return (
    <ZrSelect
      label="Country"
      model={country}
      options={options}
      onChange={(value: string) => setCountry(value)}
    />
  );
}
```

### 6.4 Pre-selected value via `model`
```tsx
<ZrSelect label="Select" model="b">
  <option value="a">Option A</option>
  <option value="b">Option B</option>
  <option value="c">Option C</option>
</ZrSelect>
```

### 6.5 With helper text and validation
```tsx
<ZrSelect
  label="Plan"
  help-text="Choose the plan that fits you best"
  required
  invalid={hasError}
>
  <option value="basic">Basic</option>
  <option value="pro">Pro</option>
  <option value="enterprise">Enterprise</option>
</ZrSelect>
```

### 6.6 Searchable select
```tsx
<ZrSelect
  label="Country"
  with-search
  search-placeholder="Search country…"
  search-autofocus
  onSearch={(query: string) => console.log('searching:', query)}
>
  <option value="es">Spain</option>
  <option value="ch">Switzerland</option>
  <option value="de">Germany</option>
  <option value="fr">France</option>
</ZrSelect>
```

### 6.7 Read-only output
```tsx
<ZrSelect label="Country" model="es" readonly>
  <option value="es">Spain</option>
</ZrSelect>
```

### 6.8 Disabled
```tsx
<ZrSelect label="Select" disabled>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</ZrSelect>
```

### 6.9 Custom label slot
```tsx
<ZrSelect>
  <em slot="label">Select country</em>
  <option value="es">Spain</option>
  <option value="ch">Switzerland</option>
</ZrSelect>
```

### 6.10 Customizing option content with `option-<value>` slots
```tsx
import { ZrSelect } from '@zurich/web-components/react/select';
import { ZrIcon }   from '@zurich/web-components/react/icon';

export function SelectWithIcons() {
  return (
    <ZrSelect label="Select">
      <ZrIcon icon="info:line" slot="option-a" />
      <span slot="option-a">Option A</span>

      <ZrIcon icon="info:line" slot="option-b" />
      <span slot="option-b">Option B</span>

      <ZrIcon icon="info:line" slot="option-c" />
      <span slot="option-c">Option C</span>

      <ZrIcon icon="info:line" slot="option-d" />
      <span slot="option-d">Option D</span>
    </ZrSelect>
  );
}
```

### 6.11 Combining `<option>` children with `option-<value>` slots
```tsx
<ZrSelect label="Country">
  <option value="es">Spain</option>
  <option value="ch">Switzerland</option>

  {/* enrich the rendered row with an icon — selected label still comes from <option> */}
  <ZrIcon icon="info:line" slot="option-es" />
  <ZrIcon icon="info:line" slot="option-ch" />
</ZrSelect>
```

### 6.12 Full form-ready example
```tsx
import { useState } from 'react';
import { ZrForm }   from '@zurich/web-components/react/form';
import { ZrSelect } from '@zurich/web-components/react/select';

export function PolicyForm() {
  const [country, setCountry] = useState('');
  const [valid, setValid]     = useState(true);

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrSelect
        name="country"
        label="Country"
        model={country}
        with-search
        search-placeholder="Search…"
        required
        invalid={!valid}
        help-text="Country where the policy is issued"
        options={[
          { value: 'es', text: 'Spain' },
          { value: 'ch', text: 'Switzerland' },
          { value: 'de', text: 'Germany' },
          { value: 'it', text: 'Italy' },
        ]}
        onChange={(v: string) => setCountry(v)}
        onValidated={(isValid: boolean) => setValid(isValid)}
        onBlur={() => console.log('blur')}
      />
    </ZrForm>
  );
}
```

---

## 7. Behavior Rules (for the AI)

- ❗ **`model` must match an option `value`.** Otherwise nothing will appear selected.
- ❗ **Reactivity:** if `model` is hardcoded, the field will not respond to user changes. Always pair it with state and `onChange`.
- ❗ **`disabled` vs `readonly`:**
  - `disabled` — fully blocks interaction; value is *not* submitted with the form.
  - `readonly` — value is visible and submitted, but cannot be changed.
- ❗ **`with-search` is required** for `search-placeholder` and `search-autofocus` to take effect.
- ❗ **`onSearch`** only fires when `with-search` is enabled. Use it for **external** filtering; the internal filter still runs.
- ❗ **`meta`** in option objects feeds the internal search — use it for synonyms / alternative spellings.
- ❗ **`hide: true`** removes the option from the dropdown list while keeping it valid as a value (useful for conditional visibility).
- ❗ **`option-<value>` slots** customize the *rendered* row, but the selected label is taken from the `<option>` inner text — keep `<option>` tags meaningful.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default messages — avoid overriding them.
- ❗ **`config="line"`** changes only the visual style; props/events behave identically.
- ❗ **Localization** via `locale` overrides the global locale only for that instance.

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                      → Use...
----------------------------------------------------------------------------
basic dropdown                                        → <ZrSelect label="..."> + <option>s
data-driven dropdown                                  → options={[{ value, text }, ...]}
preselected value                                     → model="x" (and bind to state)
filterable / searchable dropdown                      → with-search (+ search-placeholder)
auto-focus the search field                           → with-search + search-autofocus
emit search query to filter externally                → onSearch={(q) => ...}
synonyms / alt search terms                           → option.meta = ['synonym', ...]
hide an option but keep it valid                      → option.hide = true
disable a single option                               → option.disabled = true
read-only display                                     → readonly + model="x"
required field                                        → required
invalid state                                         → invalid (+ optional help-text)
custom row content (icons, badges)                    → slot="option-<value>"
minimal/lined visual style                            → config="line"
inside a Zurich form                                  → wrap in <ZrForm>
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrSelectOption = {
  value: string;
  text?: string;
  disabled?: boolean;
  hide?: boolean;
  meta?: string[];
};

type ZrSelectProps = {
  label?: string;
  model?: string;
  name?: string;
  config?: 'line';
  size?: 's' | 'm' | 'l';
  locale?: string;
  'help-text'?: string;
  options?: ZrSelectOption[];
  'with-search'?: boolean;
  'search-placeholder'?: string;
  'search-autofocus'?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  children?: React.ReactNode;
};
```

---

## 10. Composition Pattern (Form + Select + TextInput)

```tsx
import { useState } from 'react';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrSelect }    from '@zurich/web-components/react/select';

export function QuoteForm() {
  const [name, setName]       = useState('');
  const [country, setCountry] = useState('');

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
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
        with-search
        options={[
          { value: 'es', text: 'Spain' },
          { value: 'ch', text: 'Switzerland' },
          { value: 'de', text: 'Germany' },
        ]}
        onChange={(v: string) => setCountry(v)}
        required
      />
    </ZrForm>
  );
}
```

> Rule of thumb: declare `config`/`size` once on `<ZrForm>` and let it cascade to every `<ZrSelect>` / `<ZrTextInput>` inside.
