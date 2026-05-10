# ZrTooltip — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Atoms *(hover hint / contextual helper)*
> **Package:** `@zurich/web-components/react/tooltip`

---

## 1. AI Implementation Instructions

When the user asks for a **tooltip**, **hover hint**, **on-hover popup**, **info bubble**, or **contextual helper text**, use this component.

1. Import:
   ```tsx
   import { ZrTooltip } from '@zurich/web-components/react/tooltip';
   ```
2. There are **two pieces of content** to provide — don't confuse them:
   - **`text`** → the tooltip's *message* shown on hover.
   - **`content`** (or default slot) → the *trigger* element the user hovers (typically a label, icon, or word).
3. Use the `config` prop to combine **side + size** modifiers separated by `:`. Pattern: `<side><?:size>`.
   - **Side:** `top` | `top-right` | `top-left` | `bottom` | `bottom-right` | `bottom-left`. Default is `top-left`.
   - **Size:** `xs` | `s` | `m` *(default)* | `l`.
   - Examples: `config="top"`, `config="bottom-right"`, `config="top:s"`, `config="bottom-left:l"`.
4. Customize visuals through the documented `--z-tooltip--*` CSS variables.
5. The component is **purely presentational on hover** — no events, no controlled state. If you need a controlled popover, use `<ZrButton>`'s `popover` slot instead.
6. Wrap inline elements (`<span>`, icon, single word). Avoid wrapping large blocks — use a popover/modal for that.

---

## 2. Import

```tsx
import { ZrTooltip } from '@zurich/web-components/react/tooltip';
```

---

## 3. Props (Parameters)

| Prop        | Type                                                                            | Default       | Required | Description                                                                                       |
|-------------|---------------------------------------------------------------------------------|---------------|----------|---------------------------------------------------------------------------------------------------|
| `text`      | `string`                                                                        | —             | ✅ Yes    | The tooltip message displayed on hover.                                                           |
| `content`   | `string`                                                                        | —             | No       | The trigger element's text (the thing the user hovers). Equivalent to the default slot.            |
| `config`    | `string` — combine side + size separated by `:`                                 | `"top-left"`  | No       | Position + size modifiers (see §3.1). Example: `"bottom-right:s"`.                                |
| `side`      | `"top"` \| `"top-right"` \| `"top-left"` \| `"bottom"` \| `"bottom-right"` \| `"bottom-left"` | `"top-left"`  | No       | Position of the tooltip relative to the trigger. Often configured via `config`.                   |
| `size`      | `"xs"` \| `"s"` \| `"m"` \| `"l"`                                               | `"m"`         | No       | Size of the tooltip bubble. Often configured via `config`.                                        |
| `children`  | `React.ReactNode`                                                               | —             | No       | Default slot — alternative to `content`. Renders the hoverable trigger.                            |

### 3.1 `config` modifier grammar

`config` follows the pattern `<side><?:size>` — side first, optional size second:

```
side ::= top | top-right | top-left | bottom | bottom-right | bottom-left
size ::= xs | s | m | l
```

Valid examples:

```
config="top"
config="top-right"
config="bottom-left"
config="top:s"
config="bottom-right:m"
config="top-left:l"
```

> Order matters: side comes first, then size after the colon.

---

## 4. Events

> ZrTooltip does not declare events. Hover behavior is fully handled by the component.

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                                         |
|--------------|----------------------|-----------------------------------------------------------------|
| *(default)*  | `<span>` / inline    | The hoverable trigger element. Equivalent to the `content` prop.|

---

## 6. CSS Customization Tokens

| CSS Variable           | Type   | Purpose                                       |
|------------------------|--------|-----------------------------------------------|
| `--z-tooltip--color`   | color  | Foreground (text) color of the tooltip bubble.|
| `--z-tooltip--bg`      | color  | Background color of the tooltip bubble.      |

```tsx
<ZrTooltip
  text="Help text"
  config="top"
  style={{
    ['--z-tooltip--bg' as any]:    'var(--z-color-surface-inverse)',
    ['--z-tooltip--color' as any]: 'var(--z-color-on-surface-inverse)',
  }}
>
  Hover me
</ZrTooltip>
```

---

## 7. Canonical Examples

### 7.1 Minimal — `content` + `text`
```tsx
<ZrTooltip content="Tooltip content" text="Information text" />
```

### 7.2 Default slot — preferred for inline JSX
```tsx
<ZrTooltip text="Information text">
  Tooltip content
</ZrTooltip>
```

### 7.3 Hover an icon
```tsx
import { ZrTooltip } from '@zurich/web-components/react/tooltip';
import { ZrIcon }    from '@zurich/web-components/react/icon';

<ZrTooltip text="More information">
  <ZrIcon icon="info:line" />
</ZrTooltip>
```

### 7.4 All sides
```tsx
<ZrTooltip config="top"          text="Tooltip text">Hover me</ZrTooltip>
<ZrTooltip config="top-right"    text="Tooltip text">Hover me</ZrTooltip>
<ZrTooltip config="top-left"     text="Tooltip text">Hover me</ZrTooltip>
<ZrTooltip config="bottom"       text="Tooltip text">Hover me</ZrTooltip>
<ZrTooltip config="bottom-right" text="Tooltip text">Hover me</ZrTooltip>
<ZrTooltip config="bottom-left"  text="Tooltip text">Hover me</ZrTooltip>
```

### 7.5 Sizes (combined with side)
```tsx
<ZrTooltip
  config="top:s"
  text="Tooltip text long enough to be wrapped into several lines"
>
  Hover me
</ZrTooltip>
<ZrTooltip
  config="top:m"
  text="Tooltip text long enough to be wrapped into several lines"
>
  Hover me
</ZrTooltip>
<ZrTooltip
  config="top:l"
  text="Tooltip text long enough to be wrapped into several lines"
>
  Hover me
</ZrTooltip>
```

### 7.6 Tooltip wrapping a Zurich button
```tsx
import { ZrButton }  from '@zurich/web-components/react/button';
import { ZrTooltip } from '@zurich/web-components/react/tooltip';

<ZrTooltip text="Save changes" config="top">
  <ZrButton config="primary" icon="check:line">Save</ZrButton>
</ZrTooltip>
```

### 7.7 Tooltip on a form helper icon
```tsx
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrTooltip }   from '@zurich/web-components/react/tooltip';
import { ZrIcon }      from '@zurich/web-components/react/icon';

<ZrTextInput label="Policy number">
  <span slot="label">
    Policy number{' '}
    <ZrTooltip text="Format: POL-XXXX-YYYY" config="top-right">
      <ZrIcon icon="info:line" />
    </ZrTooltip>
  </span>
</ZrTextInput>
```

### 7.8 Themed tooltip
```tsx
<ZrTooltip
  text="Premium feature"
  config="bottom-right:l"
  style={{
    ['--z-tooltip--bg' as any]:    '#0F172A',
    ['--z-tooltip--color' as any]: '#F8FAFC',
  }}
>
  Premium
</ZrTooltip>
```

### 7.9 Inline glossary term
```tsx
<p>
  Your policy will renew based on the{' '}
  <ZrTooltip text="The starting date of your insurance coverage." config="top">
    <em>effective date</em>
  </ZrTooltip>
  .
</p>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`text` is the message; `content` (or slot) is the trigger.** Never invert them.
- ❗ **`content` vs default slot:** prefer the slot for JSX/icons; use `content` only for plain strings.
- ❗ **`config` follows `<side><?:size>`** — side first, optional size after `:`. Don't pass an object.
- ❗ **Size cannot stand alone in `config`.** `config="s"` is invalid; use `config="top:s"` (or set `size` separately).
- ❗ **Default position is `top-left`.**
- ❗ **No events / no controlled state** — the component is purely hover-driven. For click-driven contextual UI, use `<ZrButton>` with the `popover` slot or `<ZrModal>`.
- ❗ **Wrap inline elements only** (a single word, an icon, a small badge). Wrapping wide block elements distorts the trigger box and the tooltip anchor.
- ❗ **Accessibility:** the tooltip's `text` is shown on hover; ensure the same information is reachable for keyboard / screen-reader users via the trigger's accessible name (e.g. `aria-label` on the icon).
- ❗ **Theming:** prefer `--z-tooltip--bg` / `--z-tooltip--color` over inline color overrides.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
hover hint on a word / icon                             → <ZrTooltip text="..."><trigger /></ZrTooltip>
position above the trigger                              → config="top" (or top-left/top-right)
position below the trigger                              → config="bottom" (or bottom-left/bottom-right)
small / large bubble                                    → config="<side>:s" / "<side>:l"
plain-text trigger                                      → content="..." + text="..."
icon trigger                                            → wrap a <ZrIcon> inside the slot
themed bubble                                           → --z-tooltip--bg / --z-tooltip--color
click-driven contextual content                         → ❌ tooltip — use <ZrButton popover slot> or <ZrModal>
help text below a form field                            → ❌ tooltip — use the input's help-text prop
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrTooltipSide =
  | 'top' | 'top-right' | 'top-left'
  | 'bottom' | 'bottom-right' | 'bottom-left';
type ZrTooltipSize = 'xs' | 's' | 'm' | 'l';
type ZrTooltipConfig =
  | ZrTooltipSide
  | `${ZrTooltipSide}:${ZrTooltipSize}`;

type ZrTooltipProps = {
  text: string;
  content?: string;
  config?: ZrTooltipConfig;
  side?: ZrTooltipSide;
  size?: ZrTooltipSize;
  style?: React.CSSProperties & {
    ['--z-tooltip--color']?: string;
    ['--z-tooltip--bg']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Annotate a button
```tsx
<ZrTooltip text="Delete this policy" config="top">
  <ZrButton config="negative" icon="trash:line" />
</ZrTooltip>
```

### 11.2 Annotate a label inside a form
```tsx
<ZrTextInput label="">
  <span slot="label">
    Premium{' '}
    <ZrTooltip text="Calculated monthly. Excludes taxes." config="top-right">
      <ZrIcon icon="info:line" />
    </ZrTooltip>
  </span>
</ZrTextInput>
```

### 11.3 Annotate a table header
```tsx
<ZrTable headers={['ID', 'Holder', 'Status']}>
  <span slot="head-2" z-flex="50">
    Status{' '}
    <ZrTooltip text="Active means the policy is currently in force." config="bottom">
      <ZrIcon icon="info:line" />
    </ZrTooltip>
  </span>
</ZrTable>
```

> Rule of thumb: **`<ZrTooltip>` is a hover-only annotation atom.** Wrap an inline trigger, place the message in `text`, and tune position via `config="<side>:<size>"`. For click-driven content, reach for `<ZrButton popover>` or `<ZrModal>` instead.
