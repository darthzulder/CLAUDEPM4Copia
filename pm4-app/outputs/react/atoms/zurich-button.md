# ZrButton — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Atoms *(action / interactive primitive)*
> **Package:** `@zurich/web-components/react/button`

---

## 1. AI Implementation Instructions

When the user asks for a **button**, **call to action (CTA)**, **submit / cancel control**, **icon button**, **link styled as button**, or **round / floating action button**, use this component.

1. Import:
   ```tsx
   import { ZrButton } from '@zurich/web-components/react/button';
   ```
2. Provide content via **either**:
   - The `content` prop (string only) — **preferred** to avoid a flash of round/empty styling before the slot mounts, **or**
   - The default slot (`children`) for rich JSX (icons, badges, multilingual text).
3. The `config` prop combines **type + size + round modifiers** with `:` (any order):
   - **Type:** `primary` *(default)* | `secondary` | `negative` | `positive` | `link`.
   - **Size:** `xs` | `s` | `m` *(default)* | `l`.
   - **Round:** `round` (forces a circular button — auto-applied when there is no text and only an icon).
   - Examples: `config="primary"`, `config="secondary:xs"`, `config="primary:round"`, `config="negative:s:round"`.
4. Use `icon` to show a built-in Zurich icon (`name:style` format, e.g. `edit:line`, `close`). Combine with `icon-right` to flip the position.
5. Use `href` to render the button as an anchor (`<a>`-like behavior). `target` is also accepted.
6. Use the boolean flags for state: `disabled`, `loading`, `wide` *(or `wide="spread"`)*, `as-submit`, `icon-right`.
7. Wire interactions through `onClick` (camelCase, payload `MouseEvent`).
8. Use the `popover` slot for a popover anchored to the button.
9. Customize visuals through the documented `--z-button--*` CSS variables.

---

## 2. Import

```tsx
import { ZrButton } from '@zurich/web-components/react/button';
```

---

## 3. Props (Parameters)

| Prop          | Type                                                       | Default     | Required | Description                                                                                              |
|---------------|------------------------------------------------------------|-------------|----------|----------------------------------------------------------------------------------------------------------|
| `content`     | `string`                                                   | —           | No       | Text shown inside the button. Preferred over the slot to avoid layout flicker.                            |
| `config`      | `string` — combine type + size + `round` separated by `:`  | `"primary"` | No       | Type/size/round modifiers (see §3.1). Example: `"secondary:xs:round"`.                                    |
| `type`        | `"primary"` \| `"secondary"` \| `"negative"` \| `"positive"` \| `"link"` | `"primary"` | No | Visual type. Often configured via `config` instead.                                                     |
| `size`        | `"xs"` \| `"s"` \| `"m"` \| `"l"`                          | `"m"`       | No       | Size. Often configured via `config` instead.                                                              |
| `rounded`     | `boolean`                                                  | `false`     | No       | Forces the button to be circular. Automatically applied when there's no text and only an icon.            |
| `icon`        | `string` (e.g. `"edit:line"`, `"close"`)                   | —           | No       | Built-in Zurich icon. Use `name:style` syntax.                                                            |
| `icon-right`  | `boolean`                                                  | `false`     | No       | Renders the icon on the right side of the text instead of the left.                                       |
| `disabled`    | `boolean`                                                  | `false`     | No       | Fully blocks interaction.                                                                                 |
| `loading`     | `boolean`                                                  | `false`     | No       | Shows a loading indicator and blocks interaction.                                                         |
| `wide`        | `boolean` \| `"spread"`                                    | `false`     | No       | `true` makes the button fill its parent. `"spread"` distributes inner items with space between them.     |
| `as-submit`   | `boolean`                                                  | `false`     | No       | Behaves as a submit control inside a form.                                                                |
| `href`        | `string`                                                   | —           | No       | Renders the button as a link to the given URL.                                                            |
| `target`      | `string` (`"_blank"`, `"_self"`, …)                        | —           | No       | Standard anchor target. Only meaningful with `href`.                                                      |
| `children`    | `React.ReactNode`                                          | —           | No       | Default slot — alternative to `content`. May cause a flash of empty/round styling on initial render.      |

### 3.1 `config` modifier grammar

`config` is a colon-separated combination of these tokens (any order):

```
type   ::= primary | secondary | negative | positive | link
size   ::= xs | s | m | l
round  ::= round
```

Valid examples (non-exhaustive):

```
config="primary"
config="secondary"
config="negative"
config="positive"
config="link"
config="xs"
config="s"
config="l"
config="primary:round"
config="secondary:xs"
config="secondary:xs:round"
```

> When you only need to change the size, you can pass just `config="xs"`, `config="s"`, etc. — the type defaults to `primary`.

---

## 4. Events

| Event       | Payload      | Description                  |
|-------------|--------------|------------------------------|
| `onClick`   | `MouseEvent` | Fired when the button is clicked. |

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                      |
|--------------|----------------------|----------------------------------------------|
| *(default)*  | `<span>` / any inline | Button content (text, icons, JSX). Equivalent to `content`. |
| `popover`    | `<span>` / any inline | Content rendered inside a popover anchored to the button.   |

> ⚠️ If the default slot is async (loaded after first render), the button may briefly look round/empty. Use `content` to avoid this flicker.

---

## 6. CSS Customization Tokens

| CSS Variable                     | Type     | Purpose                                                  |
|----------------------------------|----------|----------------------------------------------------------|
| `--z-button--bg`                 | color    | Background color of the button.                          |
| `--z-button--color`              | color    | Foreground (text/icon) color.                            |
| `--z-button--radius`             | distance | Border radius of the button.                             |
| `--z-button--backdrop`           | color    | Backdrop overlay color when a popover is active.         |
| `--z-button--popover-radius`     | distance | Border radius of the popover panel.                      |
| `--z-button--popover-padding`    | distance | Inner padding of the popover panel.                      |

```tsx
<ZrButton
  config="primary"
  style={{
    ['--z-button--bg' as any]:     'var(--z-color-primary)',
    ['--z-button--color' as any]:  'var(--z-color-on-primary)',
    ['--z-button--radius' as any]: '8px',
  }}
>
  Save
</ZrButton>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage
```tsx
<ZrButton content="Button" />
{/* or, with default slot */}
<ZrButton>Button</ZrButton>
```

### 7.2 Types
```tsx
<ZrButton config="primary">Button</ZrButton>
<ZrButton config="secondary">Button</ZrButton>
<ZrButton config="negative">Button</ZrButton>
<ZrButton config="positive">Button</ZrButton>
<ZrButton config="link">Button</ZrButton>
```

### 7.3 Sizes
```tsx
<ZrButton config="xs">Button</ZrButton>
<ZrButton config="s">Button</ZrButton>
<ZrButton config="m">Button</ZrButton>
<ZrButton config="l">Button</ZrButton>
```

### 7.4 Round button
```tsx
<ZrButton config="primary:round">BTN</ZrButton>
```

### 7.5 Icon-only (auto-round)
```tsx
<ZrButton icon="close" />
```

### 7.6 Icon + text
```tsx
<ZrButton icon="edit:line">Button</ZrButton>
<ZrButton icon="edit:line" icon-right>Button</ZrButton>
```

### 7.7 Icon-only with config
```tsx
<ZrButton icon="edit:line" />
<ZrButton config="secondary:xs" icon="edit:line" />
<ZrButton config="l" icon="edit:line" />
```

### 7.8 Link-styled button
```tsx
<ZrButton href="#" target="_self">Button</ZrButton>
<ZrButton config="link" href="https://example.com" target="_blank">Open</ZrButton>
```

### 7.9 States
```tsx
<ZrButton disabled>Button</ZrButton>
<ZrButton config="secondary" disabled>Button</ZrButton>
<ZrButton loading>Button</ZrButton>
```

### 7.10 Wide
```tsx
<ZrButton wide>Button</ZrButton>

{/* Distribute inner content with space between items */}
<ZrButton wide="spread">Button</ZrButton>
<ZrButton wide="spread" icon="close">Button</ZrButton>
<ZrButton wide="spread" icon="close" icon-right>Button</ZrButton>
```

### 7.11 Click handler
```tsx
import { ZrButton } from '@zurich/web-components/react/button';

export function SaveAction() {
  return (
    <ZrButton
      config="primary"
      icon="check:line"
      onClick={(e: MouseEvent) => {
        console.log('clicked', e);
      }}
    >
      Save
    </ZrButton>
  );
}
```

### 7.12 As submit inside a Zurich form
```tsx
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrButton }    from '@zurich/web-components/react/button';

export function SignupForm() {
  return (
    <ZrForm config="line" onSubmit={(data) => console.log(data)}>
      <ZrTextInput name="email" label="Email" required />
      <ZrButton as-submit config="primary" wide>
        Sign up
      </ZrButton>
    </ZrForm>
  );
}
```

### 7.13 Trigger a modal
```tsx
const [open, setOpen] = useState(false);

<>
  <ZrButton
    config="s"
    icon="arrow-diagonal:line"
    onClick={() => setOpen(true)}
  >
    Open modal
  </ZrButton>

  <ZrModal model={open} onChange={(v) => setOpen(v)}>
    <p>Modal content</p>
  </ZrModal>
</>
```

### 7.14 Button with popover slot
```tsx
<ZrButton config="secondary" icon="info:line">
  Help
  <span slot="popover">
    Press <strong>Enter</strong> to confirm.
  </span>
</ZrButton>
```

### 7.15 Action group (cancel + confirm)
```tsx
<div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
  <ZrButton config="secondary" onClick={() => onCancel()}>Cancel</ZrButton>
  <ZrButton config="primary"   onClick={() => onConfirm()}>Confirm</ZrButton>
</div>
```

### 7.16 Destructive action with loading state
```tsx
const [busy, setBusy] = useState(false);

<ZrButton
  config="negative"
  loading={busy}
  disabled={busy}
  onClick={async () => {
    setBusy(true);
    await deleteRecord();
    setBusy(false);
  }}
>
  Delete
</ZrButton>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`content` vs default slot:** prefer `content` for static text to avoid initial round/empty styling. Use the slot for JSX/rich content.
- ❗ **`config` is a single string** that combines type, size, and `round` separated by `:`. Don't pass an object.
- ❗ **Auto-round:** a button with only an `icon` and no text is automatically rendered as round.
- ❗ **`href` turns the button into a link.** `onClick` still fires; combine carefully (e.g. analytics tracking + navigation).
- ❗ **`as-submit`** is required to make the button submit a `<ZrForm>`. Without it, clicks are inert with respect to form submission.
- ❗ **`loading`** should be paired with `disabled` to prevent double-submits.
- ❗ **`wide` vs `wide="spread"`:** `wide` fills the width and centers content; `"spread"` fills the width and pushes inner items apart (useful with icon + text).
- ❗ **Icons** use the `name:style` format (e.g. `edit:line`, `close`, `arrow-diagonal:line`). Use the **solid** form by omitting `:line`.
- ❗ **Round buttons** must keep content short (single icon or 2–3 letters).
- ❗ **Theming:** prefer `--z-button--*` tokens over inline color overrides.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
default action button                                   → <ZrButton>...</ZrButton>
secondary / cancel-style button                         → config="secondary"
destructive button                                      → config="negative"
positive / confirm button                               → config="positive"
text link styled as button                              → config="link"
small / extra-small button                              → config="s" or "xs"
large CTA                                               → config="l"
round button (acronym, single CTA)                      → config="...:round"
icon-only button                                        → icon="..." (auto-round)
icon + text                                             → icon="..." [+ icon-right]
button as link                                          → href="..." [+ target="_blank"]
form submit button                                      → as-submit (inside <ZrForm>)
full-width button                                       → wide
full-width with split content                           → wide="spread"
async action / disable while pending                    → loading + disabled
contextual hint / shortcut                              → slot="popover"
themed look                                             → --z-button--bg / --color / --radius
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrButtonType = 'primary' | 'secondary' | 'negative' | 'positive' | 'link';
type ZrButtonSize = 'xs' | 's' | 'm' | 'l';
type ZrButtonConfig = string; // colon-combined: e.g. 'primary:round', 'secondary:xs'

type ZrButtonProps = {
  content?: string;
  config?: ZrButtonConfig;
  type?: ZrButtonType;
  size?: ZrButtonSize;
  rounded?: boolean;
  icon?: string;
  'icon-right'?: boolean;
  disabled?: boolean;
  loading?: boolean;
  wide?: boolean | 'spread';
  'as-submit'?: boolean;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top' | string;
  onClick?: (event: MouseEvent) => void;
  style?: React.CSSProperties & {
    ['--z-button--bg']?: string;
    ['--z-button--color']?: string;
    ['--z-button--radius']?: string;
    ['--z-button--backdrop']?: string;
    ['--z-button--popover-radius']?: string;
    ['--z-button--popover-padding']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Form submit + cancel
```tsx
<ZrForm config="line" onSubmit={(data) => save(data)}>
  {/* fields */}
  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
    <ZrButton config="secondary" onClick={() => onCancel()}>Cancel</ZrButton>
    <ZrButton as-submit config="primary">Save</ZrButton>
  </div>
</ZrForm>
```

### 11.2 Modal trigger + confirm/cancel actions
```tsx
const [open, setOpen] = useState(false);

<>
  <ZrButton config="negative" onClick={() => setOpen(true)}>Delete policy</ZrButton>

  <ZrModal model={open} onChange={(v) => setOpen(v)} no-close>
    <h3 style={{ marginTop: 0 }}>Delete policy?</h3>
    <p>This action cannot be undone.</p>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <ZrButton config="secondary" onClick={() => setOpen(false)}>Cancel</ZrButton>
      <ZrButton
        config="negative"
        onClick={() => { remove(); setOpen(false); }}
      >
        Delete
      </ZrButton>
    </div>
  </ZrModal>
</>
```

### 11.3 Card with primary CTA
```tsx
<ZrCard config="grid">
  <h3 style={{ margin: 0 }}>Premium plan</h3>
  <p style={{ margin: 0 }}>€19/month — full coverage.</p>
  <ZrButton config="primary" wide icon="arrow-right:line" icon-right>
    Choose plan
  </ZrButton>
</ZrCard>
```

### 11.4 Toolbar with icon-only round buttons
```tsx
<div style={{ display: 'flex', gap: '0.25rem' }}>
  <ZrButton icon="bold"      config="secondary:s" />
  <ZrButton icon="italic"    config="secondary:s" />
  <ZrButton icon="underline" config="secondary:s" />
</div>
```

> Rule of thumb: **`<ZrButton>` is the canonical action atom of the system.** Use `config` to combine type/size/round in one prop, choose between `content` and the default slot intentionally, and reach for `as-submit` whenever the button lives inside a `<ZrForm>`.
