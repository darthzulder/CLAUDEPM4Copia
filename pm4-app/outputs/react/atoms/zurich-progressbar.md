# ZrProgressBar — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Atoms *(progress / completion indicator)*
> **Package:** `@zurich/web-components/react/progress-bar`

---

## 1. AI Implementation Instructions

When the user asks for a **progress bar**, **loading indicator with %**, **completion meter**, **circular progress / radial spinner with value**, or **step indicator showing how far along**, use this component.

1. Import:
   ```tsx
   import { ZrProgressBar } from '@zurich/web-components/react/progress-bar';
   ```
2. Set the value via `progress` (number). Range is `0..100` by default, or `0..max` when `max` is also provided.
3. Use `config` to combine **type + size** modifiers separated by `:`. Pattern: `<type><?:size>`.
   - **Type:** `linear` *(default)* | `round`.
   - **Size for `linear`:** `s` | `m`.
   - **Size for `round`:** `xs` | `s` | `m` | `l` | `xl`.
   - Examples: `config="linear"`, `config="linear:s"`, `config="round:xl"`.
4. Use `progress-bar-title` to label the bar (visible above/beside the value).
5. Use `no-percentage` to hide the numeric `%` value, `highlight` to draw attention, and `invalid` to mark an error/over-budget state.
6. Customize visuals through the documented `--z-progress-bar--*` CSS variables.
7. The component is **purely presentational** — no events. Drive `progress` from React state when the value changes over time.
8. Bind `progress` to a number; pass it as a numeric value (or numeric string — the docs use both forms).

---

## 2. Import

```tsx
import { ZrProgressBar } from '@zurich/web-components/react/progress-bar';
```

---

## 3. Props (Parameters)

| Prop                  | Type                                                              | Default     | Required | Description                                                                              |
|-----------------------|-------------------------------------------------------------------|-------------|----------|------------------------------------------------------------------------------------------|
| `progress`            | `number` (or numeric `string`)                                    | `0`         | ✅ Yes    | Current value. Range `0..100` unless `max` is set, then `0..max`.                         |
| `max`                 | `number` (or numeric `string`)                                    | `100`       | No       | Maximum value. When provided, `progress` is interpreted relative to it.                  |
| `config`              | `string` — combine type + size separated by `:`                   | `"linear"`  | No       | Type/size modifiers (see §3.1). Example: `"round:l"`.                                    |
| `type`                | `"linear"` \| `"round"`                                           | `"linear"`  | No       | Visual type. Often configured via `config` instead.                                       |
| `size`                | `"s"` \| `"m"` *(linear)* / `"xs"` \| `"s"` \| `"m"` \| `"l"` \| `"xl"` *(round)* | `"m"` | No | Size. Allowed values depend on `type`. Often configured via `config` instead.            |
| `progress-bar-title`  | `string`                                                          | —           | No       | Visible title for the progress bar.                                                       |
| `status`              | `string`                                                          | —           | No       | Status hint shown next to the bar (e.g. `"Loading"`, `"Done"`).                          |
| `no-percentage`       | `boolean`                                                         | `false`     | No       | Hides the numeric percentage.                                                             |
| `highlight`           | `boolean`                                                         | `false`     | No       | Visually highlights the bar.                                                              |
| `invalid`             | `boolean`                                                         | `false`     | No       | Marks the progress as invalid / error state.                                              |
| `isRound`             | `boolean` *(Playground alias)*                                    | `false`     | No       | Playground shortcut equivalent to `config="round"`. Prefer `config` in real code.        |

### 3.1 `config` modifier grammar

`config` follows the pattern `<type><?:size>` — type first, optional size second:

```
type ::= linear | round
size ::= xs | s | m | l | xl       # not all sizes are valid for every type
```

| Type     | Allowed sizes              |
|----------|----------------------------|
| `linear` | `s`, `m`                   |
| `round`  | `xs`, `s`, `m`, `l`, `xl`  |

Valid examples:

```
config="linear"        // linear, default size (m)
config="linear:s"
config="linear:m"
config="round"         // round, default size (m)
config="round:xs"
config="round:s"
config="round:m"
config="round:l"
config="round:xl"
```

> Don't pass round-only sizes (e.g. `xl`) to `linear` or vice versa.

---

## 4. Events

> ZrProgressBar does not declare events. Drive `progress` from your own React state.

---

## 5. Slots

> ZrProgressBar does not declare named slots. Use `progress-bar-title` for the title and surrounding markup for any additional context.

---

## 6. CSS Customization Tokens

| CSS Variable                              | Type     | Purpose                                                  |
|-------------------------------------------|----------|----------------------------------------------------------|
| `--z-progress-bar--color`                 | color    | Color of the filled portion of the bar.                  |
| `--z-progress-bar--bg`                    | color    | Background color of the surrounding area.                |
| `--z-progress-bar--track`                 | color    | Color of the unfilled track.                             |
| `--z-progress-bar--title-color`           | color    | Color of the `progress-bar-title` text.                  |
| `--z-progress-bar--percentage-color`      | color    | Color of the percentage text.                            |
| `--z-progress-bar--size`                  | distance | Overall size (diameter for round, height for linear).    |
| `--z-progress-bar--stroke`                | distance | Stroke thickness (especially for the round type).        |

```tsx
<ZrProgressBar
  progress={42}
  config="round:l"
  progress-bar-title="Uploading"
  style={{
    ['--z-progress-bar--color' as any]:            'var(--z-color-primary)',
    ['--z-progress-bar--track' as any]:            'rgba(0,0,0,0.08)',
    ['--z-progress-bar--title-color' as any]:      'var(--z-color-on-surface)',
    ['--z-progress-bar--percentage-color' as any]: 'var(--z-color-on-surface)',
    ['--z-progress-bar--stroke' as any]:           '8px',
  }}
/>
```

---

## 7. Canonical Examples

### 7.1 Minimal usage
```tsx
<ZrProgressBar progress={25} />
```

### 7.2 With custom max
```tsx
<ZrProgressBar max={200} progress={175} />
```

### 7.3 Linear vs round
```tsx
<ZrProgressBar config="linear" progress={25} />
<ZrProgressBar config="round"  progress={25} />
```

### 7.4 Linear sizes
```tsx
<ZrProgressBar config="linear:s" progress={25} />
<ZrProgressBar config="linear"   progress={25} />  {/* m */}
```

### 7.5 Round sizes
```tsx
<ZrProgressBar config="round:xs" progress={25} />
<ZrProgressBar config="round:s"  progress={25} />
<ZrProgressBar config="round"    progress={25} />  {/* m */}
<ZrProgressBar config="round:l"  progress={25} />
<ZrProgressBar config="round:xl" progress={25} />
```

### 7.6 With title
```tsx
<ZrProgressBar progress={25} progress-bar-title="Loading..." />
```

### 7.7 Hide percentage
```tsx
<ZrProgressBar progress={25} no-percentage />
```

### 7.8 Highlighted
```tsx
<ZrProgressBar progress={25} highlight />
```

### 7.9 Invalid / error state
```tsx
<ZrProgressBar progress={25} invalid />
```

### 7.10 Reactive (driven by React state)
```tsx
import { useEffect, useState } from 'react';
import { ZrProgressBar } from '@zurich/web-components/react/progress-bar';

export function Uploader() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPct((p) => Math.min(100, p + 5)), 200);
    return () => clearInterval(id);
  }, []);

  return (
    <ZrProgressBar
      progress={pct}
      config="linear"
      progress-bar-title="Uploading"
    />
  );
}
```

### 7.11 Round dial in a card
```tsx
import { ZrCard }        from '@zurich/web-components/react/card';
import { ZrProgressBar } from '@zurich/web-components/react/progress-bar';

<ZrCard config="grid">
  <strong>Coverage used</strong>
  <ZrProgressBar
    config="round:xl"
    progress={68}
    progress-bar-title="Annual quota"
  />
</ZrCard>
```

### 7.12 Status-driven coloring
```tsx
const pct = 92;

<ZrProgressBar
  progress={pct}
  config="linear"
  highlight={pct >= 80 && pct < 100}
  invalid={pct >= 100}
  progress-bar-title="Disk usage"
/>
```

### 7.13 Themed bar
```tsx
<ZrProgressBar
  progress={42}
  config="linear"
  progress-bar-title="Onboarding"
  style={{
    ['--z-progress-bar--color' as any]: '#16A34A',
    ['--z-progress-bar--track' as any]: '#E5E7EB',
    ['--z-progress-bar--size' as any]:  '8px',
  }}
/>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`progress` is bounded.** Clamp to `[0, max]` (default `[0, 100]`) before rendering — out-of-range values may render unpredictably.
- ❗ **`max` rescales the meaning of `progress`.** With `max=200` and `progress=175`, the bar reads as ~87.5%.
- ❗ **`config` follows `<type><?:size>`** — type first, then optional size after `:`. Don't pass an object.
- ❗ **Size validity depends on type.** Linear supports `s`/`m`; round supports `xs`/`s`/`m`/`l`/`xl`. Don't mix.
- ❗ **`no-percentage`** hides only the numeric value; the bar fill itself remains visible.
- ❗ **`highlight` and `invalid` are visual hints**, not semantic state — pair them with appropriate `progress-bar-title` / `status` text for screen readers.
- ❗ **Reactivity:** for animated/streaming progress, drive `progress` from React state (`useState` / `useEffect`).
- ❗ **No events:** if you need to react to "progress reached 100%", track it in your own state and trigger side effects there.
- ❗ **Theming:** prefer `--z-progress-bar--*` tokens over inline color overrides.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                         → Use...
------------------------------------------------------------------------------
horizontal progress bar                                  → config="linear"
circular progress dial                                   → config="round"
small / large size                                       → config="<type>:<size>"
custom maximum (e.g. 0..200)                             → max + progress
title above the bar                                      → progress-bar-title="..."
status text (e.g. "Loading")                             → status="..."
hide the % number                                        → no-percentage
draw attention (warning)                                 → highlight
mark as error / over-limit                               → invalid
animated / streaming value                               → drive progress from React state
themed colors                                            → --z-progress-bar--color / --track / etc.
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrProgressBarType = 'linear' | 'round';
type ZrProgressBarLinearSize = 's' | 'm';
type ZrProgressBarRoundSize  = 'xs' | 's' | 'm' | 'l' | 'xl';

type ZrProgressBarConfig =
  | ZrProgressBarType
  | `linear:${ZrProgressBarLinearSize}`
  | `round:${ZrProgressBarRoundSize}`;

type ZrProgressBarProps = {
  progress: number;
  max?: number;
  config?: ZrProgressBarConfig;
  type?: ZrProgressBarType;
  size?: ZrProgressBarLinearSize | ZrProgressBarRoundSize;
  'progress-bar-title'?: string;
  status?: string;
  'no-percentage'?: boolean;
  highlight?: boolean;
  invalid?: boolean;
  style?: React.CSSProperties & {
    ['--z-progress-bar--color']?: string;
    ['--z-progress-bar--bg']?: string;
    ['--z-progress-bar--track']?: string;
    ['--z-progress-bar--title-color']?: string;
    ['--z-progress-bar--percentage-color']?: string;
    ['--z-progress-bar--size']?: string;
    ['--z-progress-bar--stroke']?: string;
  };
};
```

---

## 11. Composition Patterns

### 11.1 Linear progress in a card
```tsx
<ZrCard config="grid">
  <strong>Profile completion</strong>
  <ZrProgressBar progress={profilePct} config="linear" no-percentage />
</ZrCard>
```

### 11.2 Round dial dashboard tile
```tsx
<ZrCard config="grid" clickable onClick={() => navigate('/usage')}>
  <ZrProgressBar
    config="round:xl"
    progress={used}
    max={quota}
    progress-bar-title="Quota"
  />
  <small>{used} / {quota} GB</small>
</ZrCard>
```

### 11.3 Multi-step wizard indicator
```tsx
const totalSteps = 4;
const step = 2;

<ZrProgressBar
  config="linear"
  max={totalSteps}
  progress={step}
  progress-bar-title={`Step ${step} of ${totalSteps}`}
  no-percentage
/>
```

### 11.4 Async upload with state-driven highlight/invalid
```tsx
const [pct, setPct]       = useState(0);
const [error, setError]   = useState(false);

<ZrProgressBar
  progress={pct}
  config="linear"
  progress-bar-title="Uploading"
  highlight={pct >= 80 && !error}
  invalid={error}
/>
```

> Rule of thumb: **`<ZrProgressBar>` is a purely presentational completion indicator.** Drive it with a numeric state, choose `linear` vs `round` via `config`, and reach for `highlight` / `invalid` to communicate states beyond plain progress.
