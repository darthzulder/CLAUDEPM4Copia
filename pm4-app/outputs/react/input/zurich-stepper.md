# ZrStepper — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/stepper`

---

## 1. AI Implementation Instructions

When the user asks for a **stepper**, **step indicator with controls**, **wizard step counter**, **N of M progress with prev/next**, **paginator-style step**, or **integer counter bound to a finite range (1..N)**, use this component.

1. Import:
   ```tsx
   import { ZrStepper } from '@zurich/web-components/react/stepper';
   ```
2. Bind `model` (number) to **React state** for reactivity. Update via `onChange`. The value is **1-based** and must be in `[1, steps]`.
3. Set the total number of steps via `steps` (defaults to `10` if omitted).
4. Use `label` (or the `label` slot) to describe what the stepper represents (e.g. `"Step name"`, `"Question"`).
5. Use `config="center"` to center the counter and label (default is left-aligned).
6. Use `disabled` to block interaction without losing the displayed value.
7. **Difference vs `ZrProgressBar`:** stepper exposes user controls (prev/next) and an integer counter; progress bar is a passive indicator. Use stepper when the user actively moves between discrete steps.
8. **Difference vs `ZrTabs`:** tabs are non-sequential panels; stepper is a sequential index. For a wizard UI, often combine: a stepper at the top and conditional content below.

---

## 2. Import

```tsx
import { ZrStepper } from '@zurich/web-components/react/stepper';
```

---

## 3. Props (Parameters)

| Prop        | Type                                            | Default     | Required | Description                                                                                |
|-------------|-------------------------------------------------|-------------|----------|--------------------------------------------------------------------------------------------|
| `model`     | `number` (1-based) — also accepts numeric `string` | `1`      | No       | Current step. Must be in `[1, steps]`. Bind to React state for reactivity.                 |
| `steps`     | `number` — also accepts numeric `string`        | `10`        | No       | Total number of steps.                                                                     |
| `label`     | `string`                                        | —           | No       | Visible label describing the stepper.                                                      |
| `config`    | `"center"` \| *(omit for left-aligned)*         | left-aligned| No       | Alignment of counter + label. Only documented value is `"center"`.                         |
| `disabled`  | `boolean`                                       | `false`     | No       | Fully blocks interaction (counter remains visible).                                        |

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|----------------------------------------------|
| `onChange`     | `number`   | New step value (1-based).                    |
| `onRestarted`  | `void`     | Value was reset.                             |

---

## 5. Slots

| Slot         | Allowed tags         | Purpose                                            |
|--------------|----------------------|----------------------------------------------------|
| `label`      | `<span>` (or `<em>`) | Custom label content (overrides `label` prop).     |

---

## 6. Canonical Examples

### 6.1 Minimal usage (defaults to step 1 of 10)
```tsx
<ZrStepper />
```

### 6.2 Pre-selected step
```tsx
<ZrStepper model={5} />
```

### 6.3 Custom total
```tsx
<ZrStepper model={4} steps={6} />
```

### 6.4 With label
```tsx
<ZrStepper label="Stepper" model={3} />
```

### 6.5 Custom label via slot
```tsx
<ZrStepper model={3}>
  <em slot="label">Stepper</em>
</ZrStepper>
```

### 6.6 Centered layout
```tsx
<ZrStepper config="center" model={3} />
```

### 6.7 Disabled (read-only display)
```tsx
<ZrStepper model={3} disabled />
```

### 6.8 Reactive (recommended) — controlled with `model`
```tsx
import { useState } from 'react';
import { ZrStepper } from '@zurich/web-components/react/stepper';

export function Counter() {
  const [step, setStep] = useState(1);

  return (
    <ZrStepper
      label="Question"
      model={step}
      steps={10}
      onChange={(value: number) => setStep(value)}
    />
  );
}
```

### 6.9 Wizard pattern (stepper drives panel content)
```tsx
import { useState } from 'react';
import { ZrStepper }   from '@zurich/web-components/react/stepper';
import { ZrButton }    from '@zurich/web-components/react/button';
import { ZrCard }      from '@zurich/web-components/react/card';

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const total = 4;

  return (
    <ZrCard config="grid">
      <ZrStepper
        label="Onboarding"
        config="center"
        model={step}
        steps={total}
        onChange={(v: number) => setStep(v)}
      />

      {step === 1 && <p>Step 1: tell us about you.</p>}
      {step === 2 && <p>Step 2: pick a plan.</p>}
      {step === 3 && <p>Step 3: review terms.</p>}
      {step === 4 && <p>Step 4: confirmation.</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <ZrButton
          config="secondary"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Previous
        </ZrButton>
        <ZrButton
          config="primary"
          disabled={step === total}
          onClick={() => setStep((s) => Math.min(total, s + 1))}
        >
          Next
        </ZrButton>
      </div>
    </ZrCard>
  );
}
```

### 6.10 Read-only display of progress
```tsx
<ZrStepper label="Lesson" model={lesson} steps={totalLessons} disabled />
```

### 6.11 Centered + slot label inside a card
```tsx
<ZrCard config="grid">
  <ZrStepper config="center" model={step} steps={5} onChange={(v) => setStep(v)}>
    <em slot="label">Setup</em>
  </ZrStepper>
</ZrCard>
```

---

## 7. Behavior Rules (for the AI)

- ❗ **`model` is 1-based.** Allowed range is `[1, steps]`. Don't pass `0` or values greater than `steps`.
- ❗ **Reactivity:** if `model` is hardcoded, the counter will not respond to user input. Always pair it with state and `onChange`.
- ❗ **`steps` defaults to `10`.** Always set it explicitly when the wizard's length is known.
- ❗ **`config="center"`** only centers the layout; it does not affect behavior.
- ❗ **`disabled`** keeps the current value displayed but blocks the prev/next controls — useful for "readonly progress" displays.
- ❗ **No prev/next callbacks separately:** there's only `onChange(newValue)`. Compute direction by comparing with the previous state.
- ❗ **Don't use** `ZrStepper` for a non-sequential set of panels (use `ZrTabs`), for a passive percentage indicator (use `ZrProgressBar`), or for unbounded counters (use a regular numeric `ZrTextInput`).

---

## 8. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
N-of-M step counter with prev/next                      → <ZrStepper model + steps + onChange />
preselected step                                        → model={N}
custom total                                            → steps={N}
visible label / heading                                 → label="..." (or slot="label")
centered layout                                         → config="center"
read-only / progress-only                               → disabled
wizard with content panels                              → ZrStepper + conditional content + ZrButton prev/next
sequential progress %                                   → ❌ stepper — use <ZrProgressBar config="linear">
non-sequential panels                                   → ❌ stepper — use <ZrTabs>
unbounded numeric counter                               → ❌ stepper — use <ZrTextInput input-type="number">
```

---

## 9. TypeScript Type Hint (suggested)

```ts
type ZrStepperProps = {
  model?: number;          // 1-based
  steps?: number;
  label?: string;
  config?: 'center';
  disabled?: boolean;
  onChange?: (value: number) => void;
  onRestarted?: () => void;
  children?: React.ReactNode;
};
```

---

## 10. Composition Patterns

### 10.1 Stepper + tabs (visual progress + content)
```tsx
const total = 3;

<>
  <ZrStepper
    label="Profile setup"
    config="center"
    model={step}
    steps={total}
    onChange={(v) => setStep(v)}
  />

  <ZrTabs model={step} tabs={[{ name: 'Personal' }, { name: 'Address' }, { name: 'Review' }]}>
    <div slot="tab-1">{/* personal form */}</div>
    <div slot="tab-2">{/* address form */}</div>
    <div slot="tab-3">{/* review */}</div>
  </ZrTabs>
</>
```

### 10.2 Stepper inside a sidebar (long onboarding flow)
```tsx
<ZrSidebar config="right" model={open} onChange={(v) => setOpen(v)}>
  <ZrStepper
    label="Onboarding"
    model={step}
    steps={5}
    onChange={(v) => setStep(v)}
    config="center"
  />
  {/* per-step content */}
</ZrSidebar>
```

### 10.3 Stepper paired with progress bar (visual + interactive)
```tsx
<ZrCard config="grid">
  <ZrProgressBar
    config="linear"
    progress={step}
    max={total}
    no-percentage
    progress-bar-title={`Step ${step} of ${total}`}
  />
  <ZrStepper model={step} steps={total} onChange={(v) => setStep(v)} />
</ZrCard>
```

### 10.4 Question paginator (form-style)
```tsx
const [q, setQ] = useState(1);

<ZrForm config="line">
  <ZrStepper label="Question" model={q} steps={questions.length} onChange={(v) => setQ(v)} />
  <ZrTextInput
    label={questions[q - 1].label}
    model={answers[q - 1] ?? ''}
    onChange={(v) => setAnswers((a) => ({ ...a, [q - 1]: v }))}
  />
</ZrForm>
```

> Rule of thumb: **`<ZrStepper>` is a 1-based bounded counter with built-in prev/next controls.** Drive it with `useState`, set `steps` explicitly, and combine with `<ZrTabs>` / conditional content for full wizard flows. For passive % progress use `<ZrProgressBar>`; for non-sequential panels use `<ZrTabs>`.
