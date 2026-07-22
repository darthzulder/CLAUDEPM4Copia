# ZrRangeDateInput — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/range-date-input`

---

## 1. AI Implementation Instructions

When the user asks for a **date range field**, **from / to picker**, **start–end dates** or any single control that captures **two coordinated dates**, use this component.

1. Import:
   ```tsx
   import { ZrRangeDateInput } from '@zurich/web-components/react/range-date-input';
   ```
2. Always provide a `label` (a11y). Use the `label` slot for rich content.
3. The `model` is a **tuple of two ISO 8601 dates** (`"YYYY-MM-DD"`) or `null`s: `[from, to]`. Initial empty state is `[null, null]`.
4. Bind `model` to **React state** for reactivity. Update via `onChange` — payload is `[string, string]`.
5. Constrain selectable dates with **either** `range={[min, max]}` **or** the individual `min` / `max` props (the individual ones override `range`).
6. Use kebab-case for HTML-like attributes (`help-text`). Events stay camelCase.
7. Wrap together with other Zurich form controls inside a `<ZrForm>` so size/shape tokens cascade.
8. Don't confuse with `ZrDateInput` (single date) or two coordinated `ZrDateInput`s — `ZrRangeDateInput` is a **single component** that already renders both Min./Max. fields.
9. Default shape is "shaped"; pass `config="line"` for the lined variant.

---

## 2. Import

```tsx
import { ZrRangeDateInput } from '@zurich/web-components/react/range-date-input';
```

---

## 3. Props (Parameters)

| Prop          | Type                                            | Default        | Required | Description                                                                          |
|---------------|-------------------------------------------------|----------------|----------|--------------------------------------------------------------------------------------|
| `label`       | `string`                                        | —              | ✅ Yes    | Visible text label describing the field.                                             |
| `model`       | `[string \| null, string \| null]`              | `[null, null]` | No       | `[from, to]` ISO 8601 dates. Bind to React state for reactivity.                     |
| `name`        | `string`                                        | —              | No       | Name attribute used inside forms.                                                    |
| `config`      | `"line"` \| *(omit for shaped)*                 | shaped         | No       | Visual variant: shaped (default) or lined.                                           |
| `size`        | `"s"` \| `"m"` \| `"l"`                         | `"m"`          | No       | Size of the component.                                                               |
| `locale`      | `string` (e.g. `"ar"`, `"es"`, `"en"`)          | system         | No       | Forces localization at component level.                                              |
| `help-text`   | `string`                                        | —              | No       | Helper text shown below the Min. field.                                              |
| `range`       | `[string \| null, string \| null]`              | —              | No       | Allowed selectable bounds `[minDate, maxDate]`. Overridden by `min` / `max`.         |
| `min`         | `string` (ISO date)                             | —              | No       | Earliest allowed date for **either** sub-field. Overrides `range[0]`.                |
| `max`         | `string` (ISO date)                             | —              | No       | Latest allowed date for **either** sub-field. Overrides `range[1]`.                  |
| `disabled`    | `boolean`                                       | `false`        | No       | Fully blocks interaction with both sub-fields.                                       |
| `readonly`    | `boolean`                                       | `false`        | No       | Renders both sub-fields as read-only output.                                         |
| `required`    | `boolean` ⚠️ Experimental                        | `false`        | No       | Marks the field as required. Default text adapts to locale.                          |
| `invalid`     | `boolean` ⚠️ Experimental                        | `false`        | No       | Marks the field as invalid. Default text adapts to locale.                           |

> ⚠️ **`range` vs `model`:** `model` holds the **selected** values; `range` holds the **allowed bounds**. Don't confuse them — `[null, null]` in `model` means "nothing selected yet".

---

## 4. Events

| Event          | Payload              | Description                                  |
|----------------|----------------------|----------------------------------------------|
| `onChange`     | `[string, string]`   | New `[from, to]` ISO values of the model.    |
| `onRestarted`  | `void`               | Value was reset.                             |

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                            |
|--------------|----------------------|----------------------------------------------------|
| `label`      | `<span>` (or `<em>`) | Custom label content (overrides `label` prop).     |
| `help-text`  | `<span>` (or `<em>`) | Custom helper text (overrides `help-text` prop).   |

---

## 6. Canonical Examples

### 6.1 Minimal usage
```tsx
<ZrRangeDateInput label="Range date input" />
```

### 6.2 Lined variant
```tsx
<ZrRangeDateInput config="line" label="Range date input" />
```

### 6.3 Reactive (recommended)
```tsx
import { useState } from 'react';
import { ZrRangeDateInput } from '@zurich/web-components/react/range-date-input';

export function TripDates() {
  const [trip, setTrip] = useState<[string | null, string | null]>([null, null]);

  return (
    <ZrRangeDateInput
      label="Trip dates"
      model={trip}
      onChange={(value: [string, string]) => setTrip(value)}
    />
  );
}
```

### 6.4 Initial empty state
```tsx
<ZrRangeDateInput label="Range date input" model={[null, null]} />
```

### 6.5 Pre-selected range
```tsx
<ZrRangeDateInput
  label="Coverage period"
  model={['2026-01-01', '2026-12-31']}
/>
```

### 6.6 Allowed bounds with `range`
```tsx
<ZrRangeDateInput
  label="Range date input"
  range={['2026-01-01', '2026-12-31']}
/>
```

### 6.7 Allowed bounds with `min` / `max`
```tsx
<ZrRangeDateInput label="Min only" min="2026-01-01" />
<ZrRangeDateInput label="Max only" max="2026-12-31" />
```

### 6.8 Helper text & validation
```tsx
<ZrRangeDateInput
  label="Coverage period"
  help-text="Both dates are inclusive"
  required
  invalid={hasError}
/>
```

### 6.9 Custom label / help-text via slots
```tsx
<ZrRangeDateInput>
  <em slot="label">Coverage period</em>
  <em slot="help-text">Both dates are inclusive</em>
</ZrRangeDateInput>
```

### 6.10 Disabled / Readonly
```tsx
<ZrRangeDateInput label="Range date input" disabled />
<ZrRangeDateInput label="Range date input" model={['2026-01-01', '2026-12-31']} readonly />
```

### 6.11 Inside a Zurich form
```tsx
import { useState } from 'react';
import { ZrForm }            from '@zurich/web-components/react/form';
import { ZrTextInput }       from '@zurich/web-components/react/text-input';
import { ZrRangeDateInput }  from '@zurich/web-components/react/range-date-input';

export function PolicyForm() {
  const [name, setName]   = useState('');
  const [period, setPeriod] = useState<[string | null, string | null]>([null, null]);

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrTextInput
        name="holder"
        label="Holder"
        model={name}
        onChange={(v: string) => setName(v)}
        required
      />
      <ZrRangeDateInput
        name="period"
        label="Coverage period"
        model={period}
        min="2026-01-01"
        max="2027-12-31"
        onChange={(v: [string, string]) => setPeriod(v)}
        required
      />
    </ZrForm>
  );
}
```

---

## 7. Behavior Rules (for the AI)

- ❗ **`model` is a tuple `[from, to]`.** Both elements are ISO 8601 strings or `null`. Localized formats (e.g. `"21/09/2024"`) are display-only.
- ❗ **`onChange` always emits a 2-tuple.** Treat empty values as `null`.
- ❗ **Reactivity:** if `model` is hardcoded, the field will not update on user interaction. Always bind to `useState`.
- ❗ **`min` / `max` override `range`.** Don't pass both unless you intentionally want individual overrides.
- ❗ **Bounds are inclusive** on both ends.
- ❗ **`disabled` vs `readonly`:**
  - `disabled` — fully blocks interaction; values are *not* submitted with the form.
  - `readonly` — values visible and submitted, not editable.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default messages.
- ❗ **Localization** via `locale` overrides the global locale only for that instance.
- ❗ **`config="line"`** changes only the visual style; props/events behave identically.
- ❗ **Don't roll-your-own** with two `ZrDateInput`s when a real range is needed — `ZrRangeDateInput` already handles cross-validation visually and emits the tuple.

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
single date range field (from / to)                     → <ZrRangeDateInput label="..." />
controlled range                                        → model={[from,to]} + onChange
restrict bounds                                         → range={[min,max]} (or min / max)
require both dates                                      → required
read-only display of a range                            → readonly + model={[a,b]}
helper text / inline error                              → help-text + invalid
inside a Zurich form                                    → wrap in <ZrForm>
two independent dates with separate logic               → ❌ use 2x <ZrDateInput>
inline always-visible month grid                        → ❌ use <ZrCalendar>
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrRangeDateInputValue = [string | null, string | null];

type ZrRangeDateInputProps = {
  label?: string;
  model?: ZrRangeDateInputValue;
  name?: string;
  config?: 'line';
  size?: 's' | 'm' | 'l';
  locale?: string;
  'help-text'?: string;
  range?: ZrRangeDateInputValue;
  min?: string;
  max?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange?: (value: [string, string]) => void;
  onRestarted?: () => void;
  children?: React.ReactNode;
};
```

---

## 10. Composition Patterns

### 10.1 Coverage-period field in a form
```tsx
<ZrForm config="line">
  <ZrRangeDateInput
    name="coverage"
    label="Coverage period"
    model={period}
    onChange={(v) => setPeriod(v)}
    min="2026-01-01"
    max="2027-12-31"
    required
  />
</ZrForm>
```

### 10.2 Range field inside a card / modal
```tsx
<ZrCard config="grid">
  <ZrRangeDateInput label="Travel dates" model={trip} onChange={(v) => setTrip(v)} />
</ZrCard>

<ZrModal model={open} onChange={(v) => setOpen(v)}>
  <ZrRangeDateInput label="Reservation window" model={resv} onChange={(v) => setResv(v)} />
</ZrModal>
```

> Rule of thumb: **`<ZrRangeDateInput>` is one component that captures two ISO dates.** Drive it with a `[from, to]` state tuple and constrain it with `min` / `max` (or `range`). For a single date use `ZrDateInput`; for an inline month grid use `ZrCalendar`.
