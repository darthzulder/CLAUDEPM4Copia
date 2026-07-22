# ZrCalendar — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/calendar`

---

## 1. AI Implementation Instructions

When the user asks for a **calendar / month grid / inline date picker / always-visible date selector** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrCalendar } from '@zurich/web-components/react/calendar';
   ```
2. Bind `model` to **React state** for reactivity. The value must follow ISO 8601: `"YYYY-MM-DD"`.
3. Use kebab-case for HTML-like props (`first-weekday`, `calendar-type`, `today-nav`, `selected-nav`). Events stay camelCase.
4. Constrain selectable dates with **either** `range={['min', 'max']}` **or** the individual `min` / `max` props (the individual ones override `range`).
5. Use `wide` to let the parent control the width (the calendar fills its container).
6. Use `today-nav` and/or `selected-nav` to add quick-navigation buttons in the footer.
7. **Difference vs `ZrDateInput`:**
   - `ZrCalendar` is an **inline, always-visible** month grid — no input field, no picker popover.
   - `ZrDateInput` is a **text-style field** that may open a picker (native or `custom-ui`).
   - Use `ZrCalendar` for full-bleed date selection UIs (booking screens, planners). Use `ZrDateInput` for forms.
8. The component does **not** ship with `label`, `help-text`, `required`, `invalid`, or slots — it is a pure date selector. Wrap it in surrounding markup if you need labels.

---

## 2. Import

```tsx
import { ZrCalendar } from '@zurich/web-components/react/calendar';
```

---

## 3. Props (Parameters)

| Prop             | Type                                                  | Default      | Required | Description                                                                       |
|------------------|-------------------------------------------------------|--------------|----------|-----------------------------------------------------------------------------------|
| `model`          | `string` (ISO 8601 — `"YYYY-MM-DD"`)                  | `""`         | No       | Currently selected date. Bind to React state for reactivity.                      |
| `first-weekday`  | `"sunday"` \| `"monday"`                              | `"monday"`   | No       | First day of the displayed week.                                                  |
| `calendar-type`  | `string` (e.g. `"gregorian"`, `"islamic"`)            | `"gregorian"`| No       | Calendar system used by the grid.                                                 |
| `locale`         | `string` (e.g. `"zh"`, `"es"`, `"en"`)                | system       | No       | Forces localization at component level.                                           |
| `range`          | `[string, string]` (ISO `[min, max]`, both inclusive) | —            | No       | Allowed selectable range. Overridden by `min` / `max` if provided.                |
| `min`            | `string` (ISO date)                                   | —            | No       | Earliest selectable date. Overrides `range[0]`.                                   |
| `max`            | `string` (ISO date)                                   | —            | No       | Latest selectable date. Overrides `range[1]`.                                     |
| `disabled`       | `boolean`                                             | `false`      | No       | Fully blocks interaction with the calendar.                                       |
| `wide`           | `boolean`                                             | `false`      | No       | Expands the calendar to its parent's width.                                       |
| `today-nav`      | `boolean`                                             | `false`      | No       | Shows a footer button that navigates to today.                                    |
| `selected-nav`   | `boolean`                                             | `false`      | No       | Shows a footer button that navigates to the currently selected date.              |

> The Playground also exposes `firstWeekday` (camelCase). Prefer the kebab-case `first-weekday`, which matches the documented examples.

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|----------------------------------------------|
| `onChange`     | `string`   | New ISO date when the selection changes.     |
| `onRestarted`  | `void`     | Value was reset.                             |

---

## 5. Slots

> ZrCalendar does not declare named slots. Wrap it in surrounding markup if you need labels, headers, or help text.

---

## 6. CSS Customization Tokens

| CSS Variable                 | Type     | Purpose                                    |
|------------------------------|----------|--------------------------------------------|
| `--z-calendar--header-bg`    | color    | Background color of the month header.      |
| `--z-calendar--header-color` | color    | Foreground (text) color of the header.     |
| `--z-calendar--bg`           | color    | Background color of the calendar body.     |
| `--z-calendar--color`        | color    | Foreground color of the calendar body.     |
| `--z-calendar--radius`       | distance | Border radius of the calendar surface.     |
| `--z-calendar--shadow`       | shadow   | Box shadow of the calendar surface.        |

```tsx
<ZrCalendar
  style={{
    ['--z-calendar--header-bg' as any]:    'var(--z-color-primary)',
    ['--z-calendar--header-color' as any]: 'var(--z-color-on-primary)',
    ['--z-calendar--bg' as any]:           'var(--z-color-surface)',
    ['--z-calendar--color' as any]:        'var(--z-color-on-surface)',
    ['--z-calendar--radius' as any]:       '12px',
    ['--z-calendar--shadow' as any]:       '0 6px 18px rgba(0,0,0,0.12)',
  }}
/>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage
```tsx
<ZrCalendar />
```

### 7.2 With initial selected date
```tsx
<ZrCalendar model="2024-04-26" />
```

### 7.3 Reactive (recommended)
```tsx
import { useState } from 'react';
import { ZrCalendar } from '@zurich/web-components/react/calendar';

export function BookingCalendar() {
  const [date, setDate] = useState('');

  return (
    <ZrCalendar
      model={date}
      onChange={(value: string) => setDate(value)}
      today-nav
      selected-nav
    />
  );
}
```

### 7.4 First weekday (Sunday vs Monday)
```tsx
<ZrCalendar first-weekday="monday" />
<ZrCalendar first-weekday="sunday" />
```

### 7.5 Calendar type
```tsx
<ZrCalendar calendar-type="gregorian" />
```

### 7.6 Allowed range with `range`
```tsx
<ZrCalendar range={['2024-09-05', '2024-09-27']} />
```

### 7.7 Allowed range with individual `min` / `max`
```tsx
<ZrCalendar min="2024-09-05" />
<ZrCalendar max="2024-09-27" />
```

### 7.8 Locale override
```tsx
<ZrCalendar locale="zh" />
```

### 7.9 Disabled
```tsx
<ZrCalendar disabled />
```

### 7.10 Wide (fills the parent container)
```tsx
<div style={{ width: '100%' }}>
  <ZrCalendar wide />
</div>
```

### 7.11 Footer navigation buttons
```tsx
<ZrCalendar today-nav />
<ZrCalendar selected-nav />
<ZrCalendar today-nav selected-nav />
```

### 7.12 Themed inline calendar
```tsx
<ZrCalendar
  wide
  today-nav
  selected-nav
  style={{
    ['--z-calendar--header-bg' as any]:    '#0F172A',
    ['--z-calendar--header-color' as any]: '#F8FAFC',
    ['--z-calendar--radius' as any]:       '16px',
    ['--z-calendar--shadow' as any]:       '0 4px 14px rgba(0,0,0,0.10)',
  }}
/>
```

### 7.13 Inside a card (typical inline-picker layout)
```tsx
import { ZrCard }     from '@zurich/web-components/react/card';
import { ZrCalendar } from '@zurich/web-components/react/calendar';

export function PolicyDateCard() {
  const [date, setDate] = useState('');

  return (
    <ZrCard config="grid">
      <strong>Pick a start date</strong>
      <ZrCalendar
        wide
        today-nav
        min="2026-01-01"
        max="2026-12-31"
        model={date}
        onChange={(v: string) => setDate(v)}
      />
    </ZrCard>
  );
}
```

### 7.14 Inside a modal (full-bleed calendar dialog)
```tsx
<ZrModal model={open} onChange={(v) => setOpen(v)}>
  <ZrCalendar
    wide
    today-nav
    selected-nav
    model={date}
    onChange={(v: string) => {
      setDate(v);
      setOpen(false);
    }}
  />
</ZrModal>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`model` must be ISO 8601** (`"YYYY-MM-DD"`). Localized formats (e.g. `"21/09/2024"`) are display-only; never assigned to `model`.
- ❗ **Reactivity:** if `model` is hardcoded, the calendar will not update when the user selects another date. Always bind to `useState`.
- ❗ **Range vs min/max:** `min` and `max` **override** `range[0]` / `range[1]` when both are provided.
- ❗ **Range is inclusive** on both ends.
- ❗ **`wide`** stretches the calendar to the parent container — make sure the parent has a meaningful width.
- ❗ **`selected-nav`** is automatically disabled when there is no selected value.
- ❗ **`first-weekday`** accepts only `"sunday"` or `"monday"`. Other values fall back to the default (`monday`).
- ❗ **Localization** via `locale` overrides the global locale only for that instance. The default comes from the browser/OS.
- ❗ **No labels / help-text:** unlike `ZrDateInput`, this component is unlabelled — wrap it in your own UI (e.g. a `ZrCard` heading) when context is needed.
- ❗ **Use `ZrDateInput`** instead when the date is part of a regular form. Use `ZrCalendar` for inline, full-month selection.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
inline always-visible date picker                       → <ZrCalendar />
date selector embedded in a card / sidebar              → <ZrCalendar wide />
controlled (state-driven) calendar                      → model + onChange
allowed selectable range                                → range={['min','max']} (or min/max)
disable past dates only                                 → min={today}
disable future dates only                               → max={today}
"go to today" footer shortcut                           → today-nav
"go to selected" footer shortcut                        → selected-nav
both footer shortcuts                                   → today-nav + selected-nav
week starts on Sunday                                   → first-weekday="sunday"
non-Gregorian calendar                                  → calendar-type="islamic" (etc.)
custom theme                                            → --z-calendar--* tokens
forced locale                                           → locale="..."
disable interaction                                     → disabled
date picker as part of a form                           → ❌ ZrCalendar — use ZrDateInput
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrCalendarProps = {
  model?: string;                 // ISO date "YYYY-MM-DD"
  'first-weekday'?: 'sunday' | 'monday';
  'calendar-type'?: 'gregorian' | 'islamic' | string;
  locale?: string;
  range?: [string, string];
  min?: string;
  max?: string;
  disabled?: boolean;
  wide?: boolean;
  'today-nav'?: boolean;
  'selected-nav'?: boolean;
  onChange?: (value: string) => void;
  onRestarted?: () => void;
  style?: React.CSSProperties & {
    ['--z-calendar--header-bg']?: string;
    ['--z-calendar--header-color']?: string;
    ['--z-calendar--bg']?: string;
    ['--z-calendar--color']?: string;
    ['--z-calendar--radius']?: string;
    ['--z-calendar--shadow']?: string;
  };
};
```

---

## 11. Composition Patterns

### 11.1 Calendar inside a card (sidebar widget)
```tsx
<ZrCard config="grid">
  <h3 style={{ margin: 0 }}>Pick a date</h3>
  <ZrCalendar wide model={date} onChange={(v) => setDate(v)} today-nav />
</ZrCard>
```

### 11.2 Calendar inside a modal (date-picker dialog)
```tsx
<ZrModal model={open} onChange={(v) => setOpen(v)}>
  <ZrCalendar
    wide
    today-nav
    selected-nav
    min="2026-01-01"
    max="2026-12-31"
    model={date}
    onChange={(v) => { setDate(v); setOpen(false); }}
  />
</ZrModal>
```

### 11.3 Range picker (two coordinated calendars)
```tsx
const [from, setFrom] = useState('');
const [to,   setTo]   = useState('');

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
  <ZrCalendar
    wide
    today-nav
    model={from}
    max={to || undefined}
    onChange={(v) => setFrom(v)}
  />
  <ZrCalendar
    wide
    today-nav
    model={to}
    min={from || undefined}
    onChange={(v) => setTo(v)}
  />
</div>
```

### 11.4 Calendar driving a sibling DateInput
```tsx
const [date, setDate] = useState('');

<ZrCard config="grid">
  <ZrDateInput
    label="Date"
    model={date}
    onChange={(v) => setDate(v)}
    readonly
  />
  <ZrCalendar
    wide
    model={date}
    onChange={(v) => setDate(v)}
    today-nav
    selected-nav
  />
</ZrCard>
```

> Rule of thumb: **`<ZrCalendar>` is an inline, ISO-string-valued month grid.** Drive it with state, constrain it with `min` / `max`, and theme it via `--z-calendar--*` tokens. For form inputs, prefer `<ZrDateInput>`.
