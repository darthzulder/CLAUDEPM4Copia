# ZrDateInput — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/date-input`

---

## 1. AI Implementation Instructions

When the user asks for a **date / date-time / month / week input**, **calendar field**, or **date picker** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrDateInput } from '@zurich/web-components/react/date-input';
   ```
2. Always provide a `label` (a11y). Use the `label` slot only when a non-string label is needed.
3. The `model` value **must follow ISO 8601** depending on `input-type`:
   - `date` → `"YYYY-MM-DD"` (e.g. `"2024-04-11"`).
   - `month` → `"YYYY-MM"`.
   - `week` → `"YYYY-Www"` (ISO week format).
   - `datetime-local` → `"YYYY-MM-DDTHH:mm"`.
4. Bind `model` to **React state** for reactivity — never hardcode it.
5. Use kebab-case for HTML-like props (`help-text`, `input-type`, `custom-ui`, `first-weekday`, `today-nav`, `selected-nav`, `calendar-type`). Events stay camelCase.
6. Constrain the date range with **either** `range={['min', 'max']}` **or** the individual `min` / `max` props (the individual ones override `range`).
7. Use `custom-ui` to enable Zurich's calendar picker (recommended cross-browser, since `month`/`week`/`datetime-local` are not supported natively in Firefox/Safari).
8. Wrap together with other Zurich form controls inside a `<ZrForm>` so size/shape tokens cascade.
9. Don't confuse `disabled` with `readonly` — they are distinct states.
10. Default shape is "shaped"; pass `config="line"` for the lined variant.

---

## 2. Import

```tsx
import { ZrDateInput } from '@zurich/web-components/react/date-input';
```

---

## 3. Props (Parameters)

| Prop             | Type                                                            | Default       | Required | Description                                                                                  |
|------------------|-----------------------------------------------------------------|---------------|----------|----------------------------------------------------------------------------------------------|
| `label`          | `string`                                                        | —             | ✅ Yes    | Visible text label describing the field.                                                     |
| `model`          | `string` (ISO 8601, format depends on `input-type`)             | `""`          | No       | Current value. Bind to React state to keep reactivity.                                       |
| `name`           | `string`                                                        | —             | No       | Name attribute used inside forms.                                                            |
| `config`         | `"line"` \| *(omit for shaped)*                                 | shaped        | No       | Visual variant: shaped (default) or lined.                                                   |
| `size`           | `"s"` \| `"m"` \| `"l"`                                         | `"m"`         | No       | Size of the component.                                                                       |
| `locale`         | `string` (e.g. `"ar"`, `"es"`, `"de"`, `"en"`) ⚠️ Experimental    | system        | No       | Forces localization at component level.                                                      |
| `input-type`     | `"date"` \| `"month"` \| `"datetime-local"` \| `"week"`         | `"date"`      | No       | Type of date input. Affects accepted ISO format and native picker.                            |
| `help-text`      | `string`                                                        | —             | No       | Helper text shown below the input.                                                           |
| `range`          | `[string, string]` (ISO dates, `[min, max]`)                    | —             | No       | Allowed date range. Overridden by `min` / `max` if both are present.                         |
| `min`            | `string` (ISO date)                                             | —             | No       | Earliest allowed date. Overrides the `range[0]` value.                                       |
| `max`            | `string` (ISO date)                                             | —             | No       | Latest allowed date. Overrides the `range[1]` value.                                         |
| `disabled`       | `boolean`                                                       | `false`       | No       | Fully blocks interaction.                                                                    |
| `readonly`       | `boolean`                                                       | `false`       | No       | Renders as read-only output (value visible, not editable).                                   |
| `required`       | `boolean` ⚠️ Experimental                                        | `false`       | No       | Marks the field as required. Default text adapts to locale.                                  |
| `invalid`        | `boolean` ⚠️ Experimental                                        | `false`       | No       | Marks the field as invalid. Default text adapts to locale.                                   |
| `custom-ui`      | `boolean` ⚠️ Experimental                                        | `false`       | No       | Replaces the native picker with Zurich's calendar UI (cross-browser consistent).             |
| `first-weekday`  | `number` (0=Sun, 1=Mon, …) — *requires `custom-ui`*             | locale-based  | No       | First day of the week shown by the calendar.                                                 |
| `today-nav`      | `boolean` — *requires `custom-ui`*                              | `false`       | No       | Shows a "today" navigation shortcut in the calendar.                                         |
| `selected-nav`   | `boolean` — *requires `custom-ui`*                              | `false`       | No       | Shows a "go to selected" shortcut in the calendar.                                           |
| `calendar-type`  | `string` — *requires `custom-ui`*                               | gregorian     | No       | Calendar system used by the picker (gregorian, islamic, …).                                  |

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|----------------------------------------------|
| `onChange`     | `string`   | New ISO value of the model.                  |
| `onEnter`      | `void`     | User pressed the Enter key.                  |
| `onRestarted`  | `void`     | Value was reset.                             |
| `onBlur`       | `void`     | Component lost focus.                        |
| `onValidated`  | `boolean`  | Validation status changed.                   |

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
<ZrDateInput label="Date input" />
```

### 6.2 Lined variant
```tsx
<ZrDateInput config="line" label="Date input" />
```

### 6.3 Reactive (recommended)
```tsx
import { useState } from 'react';
import { ZrDateInput } from '@zurich/web-components/react/date-input';

export function BirthdayField() {
  const [birthday, setBirthday] = useState('');

  return (
    <ZrDateInput
      label="Birthday"
      model={birthday}
      onChange={(value: string) => setBirthday(value)}
    />
  );
}
```

### 6.4 Pre-selected ISO value
```tsx
<ZrDateInput label="Date input" model="2024-04-11" />
```

### 6.5 Allowed range with `range`
```tsx
<ZrDateInput
  label="Travel date"
  model="2024-09-21"
  range={['2024-09-05', '2024-09-27']}
/>
```

### 6.6 Allowed range with individual `min` / `max`
```tsx
<ZrDateInput label="Min only" min="2024-09-05" model="2024-09-21" />
<ZrDateInput label="Max only" max="2024-09-27" model="2024-09-21" />
```

### 6.7 Different input types
```tsx
<ZrDateInput input-type="date"           label="Day" />
<ZrDateInput input-type="month"          label="Month" />
<ZrDateInput input-type="datetime-local" label="Date and time" />
<ZrDateInput input-type="week"           label="Week" />
```

### 6.8 Helper text & validation
```tsx
<ZrDateInput
  label="Date input"
  help-text="Use a date in 2024"
  required
  invalid={hasError}
/>
```

### 6.9 Read-only output
```tsx
<ZrDateInput label="Date input" model="1991-09-21" readonly />
```

### 6.10 Custom label slot
```tsx
<ZrDateInput>
  <em slot="label">Date input</em>
</ZrDateInput>
```

### 6.11 `custom-ui` (Zurich calendar picker — recommended cross-browser)
```tsx
<ZrDateInput label="Date input" custom-ui />
<ZrDateInput config="line" label="Date input" custom-ui />
```

### 6.12 `custom-ui` with calendar modifiers
```tsx
<ZrDateInput
  label="Appointment date"
  custom-ui
  first-weekday={1}        // start week on Monday
  today-nav
  selected-nav
  calendar-type="gregorian"
  min="2026-01-01"
  max="2026-12-31"
  model={date}
  onChange={(v: string) => setDate(v)}
/>
```

### 6.13 Inside a Zurich form
```tsx
import { useState } from 'react';
import { ZrForm }       from '@zurich/web-components/react/form';
import { ZrTextInput }  from '@zurich/web-components/react/text-input';
import { ZrDateInput }  from '@zurich/web-components/react/date-input';

export function PolicyForm() {
  const [name, setName]   = useState('');
  const [start, setStart] = useState('');

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrTextInput
        name="name"
        label="Holder"
        model={name}
        onChange={(v: string) => setName(v)}
        required
      />
      <ZrDateInput
        name="start"
        label="Start date"
        model={start}
        custom-ui
        today-nav
        min="2026-01-01"
        onChange={(v: string) => setStart(v)}
        required
      />
    </ZrForm>
  );
}
```

### 6.14 Date range (two coordinated fields)
```tsx
const [from, setFrom] = useState('');
const [to,   setTo]   = useState('');

<ZrForm>
  <ZrDateInput
    name="from"
    label="From"
    model={from}
    max={to || undefined}
    onChange={(v: string) => setFrom(v)}
    custom-ui
  />
  <ZrDateInput
    name="to"
    label="To"
    model={to}
    min={from || undefined}
    onChange={(v: string) => setTo(v)}
    custom-ui
  />
</ZrForm>
```

---

## 7. Behavior Rules (for the AI)

- ❗ **`model` MUST be ISO 8601** in the format matching `input-type`. Localized formats (e.g. `"21/09/2024"`) are only displayed; never assigned.
- ❗ **Reactivity:** if `model` is hardcoded, the field will not respond to user input. Always pair it with state and `onChange`.
- ❗ **`disabled` vs `readonly`:**
  - `disabled` — fully blocks interaction; value is *not* submitted with the form.
  - `readonly` — value is visible and submitted, but cannot be edited.
- ❗ **`min` / `max` override `range`.** Don't pass both unless you intentionally want individual overrides.
- ❗ **Native picker limitations:**
  - Firefox and Safari **do not support** `input-type="month"` or `input-type="week"`.
  - For `input-type="datetime-local"`, neither shows a time picker natively.
  - When you need consistent behavior across browsers, **use `custom-ui`**.
- ❗ **`custom-ui` modifiers** (`first-weekday`, `today-nav`, `selected-nav`, `calendar-type`) only take effect when `custom-ui` is set.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default messages — avoid overriding them unless necessary.
- ❗ **Localization** via `locale` overrides the global locale only for that instance.
- ❗ **`config="line"`** changes only the visual style; props/events behave identically.

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
single date field                                       → <ZrDateInput label="..." />
month picker                                            → input-type="month" + custom-ui
week picker                                             → input-type="week"  + custom-ui
date + time                                             → input-type="datetime-local" + custom-ui
allowed date range                                      → range={['min','max']}  (or min/max)
disable past dates only                                 → min={today}
disable future dates only                               → max={today}
read-only display                                       → readonly + model="YYYY-MM-DD"
required field                                          → required
invalid state                                           → invalid (+ optional help-text)
cross-browser consistent picker                         → custom-ui
calendar starting on Monday                             → custom-ui + first-weekday={1}
"go to today" shortcut in the picker                    → custom-ui + today-nav
"go to selected" shortcut                               → custom-ui + selected-nav
specific calendar system (e.g. islamic)                 → custom-ui + calendar-type="..."
inside a Zurich form                                    → wrap in <ZrForm>
date range UI (from / to)                               → 2 ZrDateInputs with cross min/max
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrDateInputType = 'date' | 'month' | 'datetime-local' | 'week';

type ZrDateInputProps = {
  label?: string;
  model?: string;        // ISO 8601 — format depends on input-type
  name?: string;
  config?: 'line';
  size?: 's' | 'm' | 'l';
  locale?: string;
  'input-type'?: ZrDateInputType;
  'help-text'?: string;
  range?: [string, string];
  min?: string;
  max?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  'custom-ui'?: boolean;
  // custom-ui modifiers (require 'custom-ui'):
  'first-weekday'?: number;
  'today-nav'?: boolean;
  'selected-nav'?: boolean;
  'calendar-type'?: 'gregorian' | 'islamic' | string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  children?: React.ReactNode;
};
```

---

## 10. Composition Patterns

### 10.1 Single date inside a form
```tsx
<ZrForm config="line">
  <ZrDateInput
    name="dob"
    label="Date of birth"
    model={dob}
    onChange={(v) => setDob(v)}
    custom-ui
    today-nav
    max={new Date().toISOString().slice(0, 10)}
    required
  />
</ZrForm>
```

### 10.2 Date range (from / to) with cross-validation
```tsx
<ZrForm config="line">
  <ZrDateInput
    name="from"
    label="From"
    model={from}
    max={to || undefined}
    onChange={(v) => setFrom(v)}
    custom-ui
  />
  <ZrDateInput
    name="to"
    label="To"
    model={to}
    min={from || undefined}
    onChange={(v) => setTo(v)}
    custom-ui
  />
</ZrForm>
```

### 10.3 Date input inside a card / modal
```tsx
<ZrCard config="grid">
  <ZrDateInput label="Effective date" custom-ui today-nav />
</ZrCard>

<ZrModal model={open} onChange={(v) => setOpen(v)}>
  <ZrForm>
    <ZrDateInput label="Renewal date" custom-ui min="2026-01-01" />
  </ZrForm>
</ZrModal>
```

> Rule of thumb: **`<ZrDateInput>` is a string-valued input that speaks ISO 8601.** Drive it with state, prefer `custom-ui` for consistent UX across browsers, and constrain it with `min` / `max` (or `range`).
