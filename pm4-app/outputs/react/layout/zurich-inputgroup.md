# ZrInputGroup — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Layout
> **Package:** `@zurich/web-components/react/input-group`

---

## 1. AI Implementation Instructions

When the user asks for a **group of inputs that visually share a single control**, **fieldset**, **input row with prefix/suffix**, **bordered input cluster** (e.g. user + password joined together), **legend + several inputs**, or **inputs glued together with separators / icons**, use this component.

1. Import:
   ```tsx
   import { ZrInputGroup } from '@zurich/web-components/react/input-group';
   ```
2. Place Zurich input components (e.g. `<ZrTextInput>`, `<ZrPasswordInput>`, `<ZrSelect>`) as **children**.
3. Use `config` to **cascade visual style** (e.g. `config="line"`) to all inputs inside the group — equivalent to setting `config` on each input individually.
4. Use `legend` (or the `legend` slot) to title the group. **The `legend` slot, if used, must be the first element**.
5. Add `<output>` tags as **prefix / suffix / middle separators** between inputs. They can carry text content or an `icon` attribute.
6. Tune spacing and shape via `--z-input-group--gap` and `--z-input-group--radius` CSS variables.
7. **Difference vs `ZrForm`:**
   - `ZrForm` is the outer form container (handles `onSubmit`, cascades size/shape across the whole form).
   - `ZrInputGroup` is a **smaller cluster** within a form — visually joining 2–4 inputs that belong together (prefix + value, currency + amount, country code + phone, etc.).
   - You can nest: `<ZrForm><ZrInputGroup>…</ZrInputGroup>…</ZrForm>`.
8. The component is **purely structural** — it does not declare its own events.

---

## 2. Import

```tsx
import { ZrInputGroup }    from '@zurich/web-components/react/input-group';
import { ZrTextInput }     from '@zurich/web-components/react/text-input';
// import { ZrPasswordInput } from '@zurich/web-components/react/password-input'; // when documented
```

---

## 3. Props (Parameters)

| Prop          | Type                                                     | Default       | Required | Description                                                                                          |
|---------------|----------------------------------------------------------|---------------|----------|------------------------------------------------------------------------------------------------------|
| `legend`      | `string`                                                 | —             | No       | Title of the group. Use the `legend` slot for rich content.                                          |
| `config`      | `"line"` \| *(omit for shaped)*                          | shaped        | No       | Cascades the visual variant to all inputs inside the group.                                          |
| `size`        | `"s"` \| `"m"` \| `"l"`                                  | `"m"`         | No       | Size cascaded to all inputs inside the group.                                                        |
| `inputs`      | `number` *(Playground hint)*                             | —             | No       | Playground-only. In real code, the number of inputs is determined by the children.                   |
| `withButton`  | `boolean` *(Playground hint)*                            | `false`       | No       | Playground-only. In real code, just include a `<ZrButton>` as a child.                               |
| `children`    | `React.ReactNode`                                        | —             | ✅ Yes    | The inputs (and optional `<output>` separators / button) belonging to this group.                    |

---

## 4. Events

> ZrInputGroup does not declare its own events. Wire events on the inner inputs (e.g. `onChange` on each `ZrTextInput`).

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                                                       |
|--------------|----------------------|-------------------------------------------------------------------------------|
| *(default)*  | inputs / `<output>` / `<ZrButton>` | Children of the group: Zurich inputs, optional `<output>` separators, optional submit button. |
| `legend`     | `<span>` (or any inline) | Custom legend content. **Must be placed as the first element** when used.   |

> **Rule:** when using the `legend` slot, render it **before** any other child. Otherwise the legend may not render correctly.

---

## 6. CSS Customization Tokens

| CSS Variable                  | Type     | Purpose                                           |
|-------------------------------|----------|---------------------------------------------------|
| `--z-input-group--gap`        | distance | Gap between inputs and `<output>` separators.     |
| `--z-input-group--radius`     | distance | Border radius of the group container.             |

```tsx
<ZrInputGroup
  legend="Account"
  style={{
    ['--z-input-group--gap' as any]:    '0.5rem',
    ['--z-input-group--radius' as any]: '8px',
  }}
>
  <ZrTextInput label="User" />
  <ZrTextInput label="Email" input-type="email" />
</ZrInputGroup>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage
```tsx
<ZrInputGroup>
  <ZrTextInput label="User" />
  <ZrTextInput label="Password" />
</ZrInputGroup>
```

### 7.2 Cascade `config="line"` to all children
```tsx
<ZrInputGroup config="line">
  <ZrTextInput label="User" />
  <ZrTextInput label="Password" />
</ZrInputGroup>
```

### 7.3 With legend (prop)
```tsx
<ZrInputGroup legend="Legend">
  <ZrTextInput label="Input" />
  <ZrTextInput label="Input 2" />
</ZrInputGroup>
```

### 7.4 With legend (slot — must be first child)
```tsx
<ZrInputGroup>
  <span slot="legend">Legend</span>
  <ZrTextInput label="Input" />
  <ZrTextInput label="Input 2" />
</ZrInputGroup>
```

### 7.5 With prefix / middle / suffix `<output>` separators
```tsx
<ZrInputGroup>
  <output icon="edit:line"></output>
  <ZrTextInput label="Input" />
  <output>@</output>
  <ZrTextInput label="Input 2" />
  <output>Text</output>
</ZrInputGroup>
```

### 7.6 Currency + amount cluster
```tsx
<ZrInputGroup>
  <output>€</output>
  <ZrTextInput label="Amount" align-right />
</ZrInputGroup>
```

### 7.7 Country code + phone
```tsx
<ZrInputGroup>
  <ZrSelect
    label="Code"
    options={[
      { value: '+34', text: '+34' },
      { value: '+41', text: '+41' },
      { value: '+49', text: '+49' },
    ]}
  />
  <ZrTextInput label="Phone" input-type="tel" />
</ZrInputGroup>
```

### 7.8 Search field with leading icon and submit button
```tsx
import { ZrButton }     from '@zurich/web-components/react/button';
import { ZrInputGroup } from '@zurich/web-components/react/input-group';
import { ZrTextInput }  from '@zurich/web-components/react/text-input';

<ZrInputGroup>
  <output icon="search:line"></output>
  <ZrTextInput label="Search" />
  <ZrButton config="primary">Search</ZrButton>
</ZrInputGroup>
```

### 7.9 Cascading size + line variant
```tsx
<ZrInputGroup config="line" size="l">
  <ZrTextInput label="First name" />
  <ZrTextInput label="Last name" />
</ZrInputGroup>
```

### 7.10 Reactive group inside a Zurich form
```tsx
import { useState } from 'react';
import { ZrForm }       from '@zurich/web-components/react/form';
import { ZrInputGroup } from '@zurich/web-components/react/input-group';
import { ZrTextInput }  from '@zurich/web-components/react/text-input';

export function LoginForm() {
  const [user, setUser]   = useState('');
  const [pass, setPass]   = useState('');

  return (
    <ZrForm config="line" onSubmit={(data) => console.log(data)}>
      <ZrInputGroup legend="Account">
        <ZrTextInput
          name="user"
          label="User"
          model={user}
          onChange={(v: string) => setUser(v)}
          required
        />
        <ZrTextInput
          name="password"
          label="Password"
          input-type="text"
          model={pass}
          onChange={(v: string) => setPass(v)}
          required
        />
      </ZrInputGroup>
    </ZrForm>
  );
}
```

### 7.11 Themed gap and radius
```tsx
<ZrInputGroup
  legend="Address"
  style={{
    ['--z-input-group--gap' as any]:    '0',     // glued together
    ['--z-input-group--radius' as any]: '12px',
  }}
>
  <ZrTextInput label="Street" />
  <ZrTextInput label="Number" />
  <ZrTextInput label="ZIP" />
</ZrInputGroup>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`config` and `size` cascade** to every Zurich input child. Override per child only when truly needed.
- ❗ **Legend slot must be the first child** when used. Putting it anywhere else may break rendering.
- ❗ **`<output>` separators** can be placed before, between, or after inputs. They can carry text or an `icon` attribute.
- ❗ **No events** on the group itself — events live on the individual inputs.
- ❗ **Input group ≠ form.** Use `<ZrForm>` for the outer container (submission, cascading), and `<ZrInputGroup>` only to visually cluster a small set of related inputs.
- ❗ **Don't nest** `<ZrInputGroup>` inside another `<ZrInputGroup>`.
- ❗ **Reactivity:** as with all Zurich inputs, bind each child input's `model` to React state.
- ❗ **`Submit`** is not a built-in flag — to add a submit button, just include a `<ZrButton as-submit>` inside the group (or outside, more commonly).
- ❗ **Spacing customization** must use `--z-input-group--gap` rather than overriding child margins.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
two or more inputs visually joined                      → <ZrInputGroup>...</ZrInputGroup>
prefix / suffix icon or text on an input                → <output icon="..."> inside the group
currency + amount cluster                               → <output>€</output> + ZrTextInput
country-code + phone cluster                            → ZrSelect + ZrTextInput
search field + button                                   → ZrInputGroup with output icon + input + ZrButton
cascade lined style across multiple inputs              → config="line" on the group
visible heading above the cluster                       → legend="..." (or legend slot — first)
custom heading markup                                   → slot="legend" as first child
glued (no gap) cluster                                  → --z-input-group--gap: 0
themed radius                                           → --z-input-group--radius
form submission handling                                → wrap the group in <ZrForm onSubmit>
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrInputGroupProps = {
  legend?: string;
  config?: 'line';
  size?: 's' | 'm' | 'l';
  // Playground-only (do not use in production):
  inputs?: number;
  withButton?: boolean;
  style?: React.CSSProperties & {
    ['--z-input-group--gap']?: string;
    ['--z-input-group--radius']?: string;
  };
  children: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Login cluster inside a card
```tsx
<ZrCard config="grid">
  <ZrForm config="line" onSubmit={(d) => signIn(d)}>
    <ZrInputGroup legend="Account">
      <ZrTextInput name="user" label="User" required />
      <ZrTextInput name="password" label="Password" required />
    </ZrInputGroup>
    <ZrButton as-submit config="primary" wide>Sign in</ZrButton>
  </ZrForm>
</ZrCard>
```

### 11.2 Search bar (icon + input + button)
```tsx
<ZrInputGroup>
  <output icon="search:line"></output>
  <ZrTextInput
    label="Search"
    model={q}
    onChange={(v) => setQ(v)}
    onEnter={() => runSearch(q)}
  />
  <ZrButton config="primary" onClick={() => runSearch(q)}>Search</ZrButton>
</ZrInputGroup>
```

### 11.3 Money input with currency prefix
```tsx
<ZrInputGroup>
  <output>€</output>
  <ZrTextInput
    label="Amount"
    model={amount}
    onChange={(v) => setAmount(v)}
    align-right
    input-type="text"
  />
</ZrInputGroup>
```

### 11.4 Address fieldset (gap=0 for a glued look)
```tsx
<ZrInputGroup
  legend="Address"
  style={{ ['--z-input-group--gap' as any]: '0' }}
>
  <ZrTextInput label="Street" />
  <ZrTextInput label="Number" />
  <ZrTextInput label="ZIP" />
  <ZrTextInput label="City" />
</ZrInputGroup>
```

### 11.5 Search with prefix icon, separator, and suffix unit
```tsx
<ZrInputGroup>
  <output icon="ruler:line"></output>
  <ZrTextInput label="Width" align-right />
  <output>×</output>
  <ZrTextInput label="Height" align-right />
  <output>cm</output>
</ZrInputGroup>
```

> Rule of thumb: **`<ZrInputGroup>` is a small visual cluster of related inputs.** Cascade `config`/`size` to all children at once, drop `<output>` tags for prefixes/suffixes/separators, use the `legend` slot first when richer than a string, and wrap the cluster in `<ZrForm>` when submission is needed.
