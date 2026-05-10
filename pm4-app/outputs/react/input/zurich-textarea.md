# ZrTextarea — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/textarea`

---

## 1. AI Implementation Instructions

When the user asks for a **multi-line text input**, **textarea**, **comment box**, **description field**, **notes**, **bio**, or **long-form free-text input**, use this component.

1. Import:
   ```tsx
   import { ZrTextarea } from '@zurich/web-components/react/textarea';
   ```
2. Always provide a `label` (a11y). Use the `label` slot only when a non-string label is needed.
3. Bind `model` (string) to **React state** for reactivity. Update via `onChange`.
4. Use `max-length` to cap the number of characters — a `0/N` counter is shown automatically below the field.
5. Use `elastic` when the textarea should **grow and shrink** to fit its content; otherwise it keeps a fixed height (controlled by `--z-textarea--min-height`).
6. Use kebab-case for HTML-like props (`help-text`, `max-length`). Events stay camelCase.
7. Wrap together with other Zurich form controls inside a `<ZrForm>` so size/shape tokens cascade.
8. Don't confuse `disabled` with `readonly` — they are distinct states.
9. Default shape is "shaped"; pass `config="line"` for the lined variant.
10. **Don't use `<ZrTextarea>` for single-line inputs** — use `<ZrTextInput>` instead.

---

## 2. Import

```tsx
import { ZrTextarea } from '@zurich/web-components/react/textarea';
```

---

## 3. Props (Parameters)

| Prop          | Type                                            | Default     | Required | Description                                                                                  |
|---------------|-------------------------------------------------|-------------|----------|----------------------------------------------------------------------------------------------|
| `label`       | `string`                                        | —           | ✅ Yes    | Visible text label describing the field.                                                     |
| `model`       | `string`                                        | `""`        | No       | Current value. Bind to React state to keep reactivity.                                        |
| `name`        | `string`                                        | —           | No       | Name attribute used inside forms.                                                            |
| `config`      | `"line"` \| *(omit for shaped)*                 | shaped      | No       | Visual variant: shaped (default) or lined.                                                   |
| `size`        | `"s"` \| `"m"` \| `"l"`                         | `"m"`       | No       | Size of the component.                                                                        |
| `locale`      | `string` (e.g. `"ar"`, `"fr"`, `"en"`)          | system      | No       | Forces localization at component level.                                                      |
| `help-text`   | `string`                                        | —           | No       | Helper text shown below the field.                                                           |
| `max-length`  | `number`                                        | —           | No       | Maximum allowed characters; renders a `0/N` counter below.                                   |
| `elastic`     | `boolean`                                       | `false`     | No       | Auto-resizes the textarea to fit its content (grows and shrinks).                            |
| `disabled`    | `boolean`                                       | `false`     | No       | Fully blocks interaction.                                                                     |
| `readonly`    | `boolean`                                       | `false`     | No       | Renders as read-only output (value visible, not editable).                                   |
| `required`    | `boolean` ⚠️ Experimental                        | `false`     | No       | Marks the field as required. Default text adapts to locale.                                  |
| `invalid`     | `boolean` ⚠️ Experimental                        | `false`     | No       | Marks the field as invalid. Default text adapts to locale.                                   |

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|----------------------------------------------|
| `onChange`     | `string`   | New value of the model.                      |
| `onEnter`      | `void`     | User pressed the Enter key.                  |
| `onRestarted`  | `void`     | Value was reset.                             |
| `onBlur`       | `void`     | Component lost focus.                        |
| `onValidated`  | `boolean`  | Validation status changed.                   |

> ⚠️ Note: `onEnter` fires on Enter even though the field is multi-line. For "submit on Enter, newline on Shift+Enter", handle key events at the form/screen level — the component does not expose a built-in modifier.

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                            |
|--------------|----------------------|----------------------------------------------------|
| `label`      | `<span>` (or `<em>`) | Custom label content (overrides `label` prop).     |
| `help-text`  | `<span>` (or `<em>`) | Custom helper text (overrides `help-text` prop).   |

---

## 6. CSS Customization Tokens

| CSS Variable                | Type     | Purpose                                          |
|-----------------------------|----------|--------------------------------------------------|
| `--z-textarea--min-height`  | distance | Minimum height of the textarea (initial size).    |

```tsx
<ZrTextarea
  label="Notes"
  style={{ ['--z-textarea--min-height' as any]: '160px' }}
/>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage
```tsx
<ZrTextarea label="Textarea" />
```

### 7.2 Lined variant
```tsx
<ZrTextarea config="line" label="Textarea" />
```

### 7.3 Reactive (recommended)
```tsx
import { useState } from 'react';
import { ZrTextarea } from '@zurich/web-components/react/textarea';

export function NotesField() {
  const [notes, setNotes] = useState('');

  return (
    <ZrTextarea
      label="Notes"
      model={notes}
      onChange={(value: string) => setNotes(value)}
    />
  );
}
```

### 7.4 Pre-filled value
```tsx
<ZrTextarea label="Textarea" model="Testing" />
```

### 7.5 With helper text
```tsx
<ZrTextarea label="Textarea" help-text="This is a help text" />
```

### 7.6 Helper text via slot
```tsx
<ZrTextarea label="Textarea">
  <em slot="help-text">Help text</em>
</ZrTextarea>
```

### 7.7 With character counter
```tsx
<ZrTextarea label="Textarea" max-length={10} />
{/* Renders 0/10 counter below the field */}
```

### 7.8 Disabled / Readonly
```tsx
<ZrTextarea label="Textarea" disabled />
<ZrTextarea label="Textarea" model="My output" readonly />
```

### 7.9 Required + Invalid (locale-aware default text)
```tsx
<ZrTextarea label="Textarea" required />
<ZrTextarea label="Textarea" locale="fr" required />
<ZrTextarea label="Textarea" invalid />
<ZrTextarea label="Textarea" locale="fr" invalid />
```

### 7.10 Elastic (auto-resize to content)
```tsx
<ZrTextarea label="Textarea" elastic />
<ZrTextarea config="line" label="Textarea" elastic />
```

### 7.11 Custom label slot
```tsx
<ZrTextarea>
  <em slot="label">Textarea</em>
</ZrTextarea>
```

### 7.12 Inside a Zurich form
```tsx
import { useState } from 'react';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrTextarea }  from '@zurich/web-components/react/textarea';

export function FeedbackForm() {
  const [name, setName]       = useState('');
  const [comments, setComments] = useState('');

  return (
    <ZrForm config="line" size="m" onSubmit={(data) => console.log(data)}>
      <ZrTextInput
        name="name"
        label="Your name"
        model={name}
        onChange={(v: string) => setName(v)}
        required
      />
      <ZrTextarea
        name="comments"
        label="Comments"
        model={comments}
        onChange={(v: string) => setComments(v)}
        max-length={500}
        elastic
        help-text="Up to 500 characters"
        required
      />
    </ZrForm>
  );
}
```

### 7.13 Submit on Enter (custom)
```tsx
const [text, setText] = useState('');

<ZrTextarea
  label="Quick note"
  model={text}
  onChange={(v) => setText(v)}
  onEnter={() => save(text)}
/>
```

### 7.14 Themed min-height
```tsx
<ZrTextarea
  label="Long description"
  elastic
  style={{ ['--z-textarea--min-height' as any]: '220px' }}
/>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **Reactivity:** if `model` is hardcoded, the field will not respond to user input. Always pair it with state and `onChange`.
- ❗ **`disabled` vs `readonly`:**
  - `disabled` — fully blocks interaction; value is *not* submitted with the form.
  - `readonly` — value is visible and submitted, but cannot be edited.
- ❗ **`elastic`** auto-resizes to fit content. When omitted, the textarea keeps the height defined by `--z-textarea--min-height`.
- ❗ **`max-length`** automatically renders a counter (`0/N`).
- ❗ **`onEnter`** fires even though the field is multi-line; if you want Enter to insert a newline (default browser behavior) AND submit on a different shortcut, handle keystrokes externally and ignore `onEnter`.
- ❗ **`required` and `invalid`** are experimental and rely on locale-aware default messages — overriding via `help-text` replaces the default.
- ❗ **`config="line"`** changes only the visual style; props/events behave identically.
- ❗ **Localization** via `locale` overrides the global locale only for that instance.
- ❗ **Don't use for single-line inputs** — `<ZrTextInput>` is the correct component for those.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
multi-line free-text field                              → <ZrTextarea label="..." />
auto-grow textarea                                      → elastic
character limit + counter                               → max-length={N}
controlled (state-driven)                               → model + onChange
read-only display of long text                          → readonly + model="..."
required field                                          → required
inline error state                                      → invalid (+ optional help-text)
helper text below the field                             → help-text="..."
larger initial height                                   → --z-textarea--min-height
inside a Zurich form                                    → wrap in <ZrForm>
single-line input                                       → ❌ use <ZrTextInput>
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrTextareaProps = {
  label?: string;
  model?: string;
  name?: string;
  config?: 'line';
  size?: 's' | 'm' | 'l';
  locale?: string;
  'help-text'?: string;
  'max-length'?: number;
  elastic?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  style?: React.CSSProperties & {
    ['--z-textarea--min-height']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Comment / feedback field
```tsx
<ZrForm config="line">
  <ZrTextarea
    name="feedback"
    label="Your feedback"
    model={feedback}
    onChange={(v) => setFeedback(v)}
    max-length={1000}
    elastic
    required
  />
</ZrForm>
```

### 11.2 Description inside a card
```tsx
<ZrCard config="grid">
  <ZrTextarea
    label="Policy description"
    model={desc}
    onChange={(v) => setDesc(v)}
    elastic
    style={{ ['--z-textarea--min-height' as any]: '180px' }}
  />
</ZrCard>
```

### 11.3 Read-only long-form output (e.g. terms preview)
```tsx
<ZrTextarea
  label="Terms preview"
  model={termsText}
  readonly
  elastic
/>
```

> Rule of thumb: **`<ZrTextarea>` is the multi-line cousin of `<ZrTextInput>`.** Drive it with state, reach for `elastic` when the height should follow content, and use `max-length` to surface a character counter.
