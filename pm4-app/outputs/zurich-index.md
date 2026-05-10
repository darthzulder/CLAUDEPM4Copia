# Zurich Web Components — Master Index for AI Agents

> **Audience:** Claude (and any AI coding assistant) consuming this folder as a knowledge base.
> **Purpose:** Tell the AI **how to read the docs in this folder, how to interpret raw web copy-paste, and how to assemble Zurich components into working React code.**
>
> Source of truth: each component has its own `zurich-<component>.md` file inside the matching **platform / category** folder. This index is the entry point.

---

## 0. How to Use This Folder (READ FIRST — AI INSTRUCTIONS)

When a user asks you to build something with the **Zurich Design System**:

1. **Always start here** (`zurich-index.md`) to find the relevant component file.
2. **Open the component file** (`react/<category>/zurich-<name>.md`) and follow the section "AI Implementation Instructions" before writing any code.
3. **Never invent props, events, or imports.** If a prop is not listed in the component's file, do not use it.
4. **Default to React + TypeScript** unless the user specifies otherwise. Today every documented component lives under `react/`.
5. **Bind values to React state** (`useState`) — Zurich inputs are not reactive when their `model` is hardcoded.
6. **Wrap related fields** in `<ZrForm>` so design tokens (size, shape, spacing) cascade correctly.
7. **Use kebab-case attributes** exactly as they appear in the docs (`help-text`, `input-type`, `max-length`, `align-right`, `with-search`, `search-placeholder`, `search-autofocus`, `no-close`, `data-list`, `has-data-list`). The Zurich React wrapper preserves them.
8. **Events use camelCase** (`onChange`, `onEnter`, `onBlur`, `onValidated`, `onSelect`, `onSubmit`, `onSearch`, `onClick`, `onRestarted`).
9. **For styling**, prefer the documented CSS custom properties (`--z-*`) over inline overrides.
10. **If the user asks for a component that is not yet documented in this folder**, say so and ask the user to paste the official docs page so a new file can be generated using the same template (see §6).

---

## 1. Folder Structure

```
outputs/
├── zurich-index.md                       ← you are here (master index)
└── react/                                ← React platform
    ├── atoms/                            ← Category: action / interactive primitives
    │   ├── zurich-button.md
    │   ├── zurich-tooltip.md
    │   └── zurich-progressbar.md
    ├── input/                            ← Category: form-control inputs
    │   ├── zurich-textinput.md
    │   ├── zurich-select.md
    │   ├── zurich-checkbox.md
    │   ├── zurich-dateinput.md
    │   ├── zurich-calendar.md
    │   ├── zurich-rangedateinput.md
    │   ├── zurich-textarea.md
    │   ├── zurich-radioselect.md
    │   └── zurich-stepper.md
    └── layout/                           ← Category: containers & structural surfaces
        ├── zurich-form.md
        ├── zurich-card.md
        ├── zurich-modal.md
        ├── zurich-table.md
        ├── zurich-sidebar.md
        ├── zurich-tabs.md
        └── zurich-inputgroup.md
```

> When a new platform appears (e.g. Vue, Angular), add a sibling folder next to `react/`.
> When a new category appears (e.g. `feedback`, `navigation`, `media`), add a sibling folder next to `input/` and `layout/` inside the relevant platform.

---

## 2. Component Index by Category

### 2.1 React → Atoms *(action / interactive primitives)*

| Component       | File                                                                              | Status         | Purpose                                                         |
|-----------------|-----------------------------------------------------------------------------------|----------------|-----------------------------------------------------------------|
| `ZrButton`      | [`react/atoms/zurich-button.md`](./react/atoms/zurich-button.md)                  | ⚠️ Experimental | Action button: types, sizes, round, icon, link, submit, popover.|
| `ZrTooltip`     | [`react/atoms/zurich-tooltip.md`](./react/atoms/zurich-tooltip.md)                | ⚠️ Experimental | Hover hint with side+size config and theme tokens.              |
| `ZrProgressBar` | [`react/atoms/zurich-progressbar.md`](./react/atoms/zurich-progressbar.md)        | ⚠️ Experimental | Linear / round progress indicator with title, %, highlight.     |

### 2.2 React → Input *(form controls bound to a value)*

| Component          | File                                                                                | Status         | Purpose                                                         |
|--------------------|-------------------------------------------------------------------------------------|----------------|-----------------------------------------------------------------|
| `ZrTextInput`      | [`react/input/zurich-textinput.md`](./react/input/zurich-textinput.md)              | ⚠️ Experimental | Single-line text input (text/tel/email/url) with validation.    |
| `ZrTextarea`       | [`react/input/zurich-textarea.md`](./react/input/zurich-textarea.md)                | ⚠️ Experimental | Multi-line text input with elastic auto-resize and counter.     |
| `ZrSelect`         | [`react/input/zurich-select.md`](./react/input/zurich-select.md)                    | ⚠️ Experimental | Dropdown / searchable select with options + slots.              |
| `ZrRadioSelect`    | [`react/input/zurich-radioselect.md`](./react/input/zurich-radioselect.md)          | ⚠️ Experimental | Single-choice radio group (stacked / inline) with rich slots.   |
| `ZrCheckbox`       | [`react/input/zurich-checkbox.md`](./react/input/zurich-checkbox.md)                | ⚠️ Experimental | Boolean checkbox with indeterminate, required, invalid states.  |
| `ZrDateInput`      | [`react/input/zurich-dateinput.md`](./react/input/zurich-dateinput.md)              | ⚠️ Experimental | Date / month / week / datetime field (ISO 8601, optional `custom-ui`). |
| `ZrCalendar`       | [`react/input/zurich-calendar.md`](./react/input/zurich-calendar.md)                | ⚠️ Experimental | Inline month-grid date selector (no input field).               |
| `ZrRangeDateInput` | [`react/input/zurich-rangedateinput.md`](./react/input/zurich-rangedateinput.md)    | ⚠️ Experimental | Date-range field (`[from, to]` ISO tuple) with bounds.          |
| `ZrStepper`        | [`react/input/zurich-stepper.md`](./react/input/zurich-stepper.md)                  | ⚠️ Experimental | 1-based step counter with prev/next, label, center alignment.   |

### 2.3 React → Layout *(containers & structural surfaces)*

| Component       | File                                                                    | Status         | Purpose                                                         |
|-----------------|-------------------------------------------------------------------------|----------------|-----------------------------------------------------------------|
| `ZrForm`        | [`react/layout/zurich-form.md`](./react/layout/zurich-form.md)          | ⚠️ Experimental | Container that cascades size/shape/style to form controls.      |
| `ZrCard`        | [`react/layout/zurich-card.md`](./react/layout/zurich-card.md)          | ⚠️ Experimental | Container surface (clickable, grid/flex, themable via tokens).  |
| `ZrModal`       | [`react/layout/zurich-modal.md`](./react/layout/zurich-modal.md)        | ⚠️ Experimental | Dialog overlay (controlled via `model`, themable backdrop).     |
| `ZrSidebar`     | [`react/layout/zurich-sidebar.md`](./react/layout/zurich-sidebar.md)    | ⚠️ Experimental | Side drawer (left/right) controlled via `model` + tokens.       |
| `ZrTable`       | [`react/layout/zurich-table.md`](./react/layout/zurich-table.md)        | ⚠️ Experimental | Tabular display (matrix / object / embedded modes; zebra).      |
| `ZrTabs`        | [`react/layout/zurich-tabs.md`](./react/layout/zurich-tabs.md)          | ⚠️ Experimental | 1-based panel switcher (object / option / slot definition).     |
| `ZrInputGroup`  | [`react/layout/zurich-inputgroup.md`](./react/layout/zurich-inputgroup.md) | ⚠️ Experimental | Cluster of related inputs with shared config/size and `<output>` separators. |

> Update these tables every time a new component file is created, and add the row under the **right category**.

---

## 3. Canonical Imports

```tsx
// Atoms
import { ZrButton }      from '@zurich/web-components/react/button';
import { ZrTooltip }     from '@zurich/web-components/react/tooltip';
import { ZrProgressBar } from '@zurich/web-components/react/progress-bar';

// Layout
import { ZrForm }       from '@zurich/web-components/react/form';
import { ZrCard }       from '@zurich/web-components/react/card';
import { ZrModal }      from '@zurich/web-components/react/modal';
import { ZrSidebar }    from '@zurich/web-components/react/sidebar';
import { ZrTable }      from '@zurich/web-components/react/table';
import { ZrTabs }       from '@zurich/web-components/react/tabs';
import { ZrInputGroup } from '@zurich/web-components/react/input-group';

// Input
import { ZrTextInput }       from '@zurich/web-components/react/text-input';
import { ZrTextarea }        from '@zurich/web-components/react/textarea';
import { ZrSelect }          from '@zurich/web-components/react/select';
import { ZrRadioSelect }     from '@zurich/web-components/react/radio-select';
import { ZrCheckbox }        from '@zurich/web-components/react/checkbox';
import { ZrDateInput }       from '@zurich/web-components/react/date-input';
import { ZrCalendar }        from '@zurich/web-components/react/calendar';
import { ZrRangeDateInput }  from '@zurich/web-components/react/range-date-input';
import { ZrStepper }         from '@zurich/web-components/react/stepper';
```

Rule: every Zurich React component is imported from `@zurich/web-components/react/<kebab-case-name>`.

---

## 4. Global Conventions (apply to ALL Zurich components)

These conventions apply across the entire design system unless a component file states otherwise.

### 4.1 Reactivity
- Bind any value-bearing prop (`model`, `value`, etc.) to React state.
- Update state inside the corresponding `on*` handler (e.g. `onChange`).
- Hardcoded values appear static and **will not update on user interaction**.

### 4.2 Controlled vs. uncontrolled
- **Controlled (recommended):** use `model` + `onChange`. Works for inputs, selects, checkboxes, modals.
- **Uncontrolled-initial only:** flags like `checked`, `open` set the initial state but do **not** stay in sync. Don't mix with `model`.

### 4.3 Prop casing
- **Attribute-style props** (mirroring the underlying web component) use **kebab-case**:
  `help-text`, `input-type`, `max-length`, `align-right`, `data-list`, `has-data-list`, `min-length`,
  `with-search`, `search-placeholder`, `search-autofocus`, `no-close`.
- **Event handlers and React-only props** use **camelCase**:
  `onChange`, `onSubmit`, `onValidated`, `onSearch`, `onClick`, `onRestarted`, `children`, `style`, `className`.

### 4.4 Visual style cascade
- `config` (`"line"` or omitted = shaped), `size` (`"s"` | `"m"` | `"l"`), and `type` declared on a parent (`<ZrForm>`) cascade to children.
- Re-declare them on a child only when you need a local override.

### 4.5 States
- `disabled` — blocks interaction, not submitted with the form.
- `readonly` — visible and submitted, but not editable.
- `required` ⚠️ Experimental — adds locale-aware required marker.
- `invalid` ⚠️ Experimental — adds locale-aware invalid marker.
- `indeterminate` (checkbox-specific) — visual mixed state for tri-state UIs.

### 4.6 Localization
- `locale` on a component overrides the global locale for that instance only.
- Default validation/required text adapts automatically to the active locale.

### 4.7 Icons
- Icons are referenced by string in the form `name:style`, e.g. `search:line`, `file-blank:line`, `arrow-diagonal:line`, `align-text-center:outlined`.

### 4.8 Slots
- Slots are passed as children with a `slot="<slot-name>"` attribute, e.g.:
  ```tsx
  <ZrTextInput>
    <em slot="label">Custom label</em>
  </ZrTextInput>
  ```
- Some components expose **dynamic slot names**:
  - `ZrSelect`: `option-<value>` per option.
  - `ZrTable`: `head-<index>`, `cell-<row>-<index>`, `cell-<row>-<prop>`.

### 4.9 CSS tokens
- All visual customization should use the documented `--z-*` CSS variables.
- Common patterns: `--z-form--gap`, `--z-card--bg`, `--z-modal--backdrop`, `--z-checkbox--label-color`, `--z-table--cell-padding`.

---

## 5. Recommended Composition Pattern

A typical Zurich React screen looks like this:

```tsx
import { useState } from 'react';
import { ZrCard }      from '@zurich/web-components/react/card';
import { ZrForm }      from '@zurich/web-components/react/form';
import { ZrTextInput } from '@zurich/web-components/react/text-input';
import { ZrSelect }    from '@zurich/web-components/react/select';
import { ZrCheckbox }  from '@zurich/web-components/react/checkbox';

export function ExampleScreen() {
  const [name, setName]         = useState('');
  const [country, setCountry]   = useState('');
  const [accepted, setAccepted] = useState(false);

  return (
    <ZrCard config="grid">
      <ZrForm
        config="line"
        size="m"
        onSubmit={(data) => console.log('submit:', data)}
        style={{ ['--z-form--gap' as any]: '1rem' }}
      >
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
          options={[
            { value: 'es', text: 'Spain' },
            { value: 'ch', text: 'Switzerland' },
          ]}
          onChange={(v: string) => setCountry(v)}
          required
        />
        <ZrCheckbox
          name="terms"
          label="I accept the terms and conditions"
          model={accepted}
          onChange={(v: boolean) => setAccepted(v)}
          required
        />
      </ZrForm>
    </ZrCard>
  );
}
```

> Rule of thumb: **outer layout → form → inputs → events → state → styling tokens.**

---

## 6. How to Interpret Raw Web Copy-Paste (META RULE)

The user pastes documentation **directly from the Zurich design-system website**. That copy-paste contains a fixed structure. The AI must extract the following blocks and map them into the standard component file template:

| Web section in the paste                                | → Maps to file section          |
|---------------------------------------------------------|---------------------------------|
| `import { ZrXxx } from '@zurich/web-components/react/...'` | §2 Import                    |
| Playground table (Name / Description / Able / Control)  | §3 Props                        |
| `Customization tokens` table                            | §6 CSS Customization Tokens     |
| `Events` table (Name / Payload / Description)           | §4 Events                       |
| `Slots` table (Name / Tags / Description)               | §5 Slots                        |
| `Parameters use` blocks with `<ZrXxx ...>` examples     | §7 Canonical Examples           |
| `Flags` block (`disabled`, `readonly`, `checked`, `open`, `no-close`, `indeterminate`, etc.) | Boolean props inside §3 + §7 |
| Cell-level attributes (e.g. `config`, `highlight` on `<td>`) | §3 sub-table for embedded mode |
| ⚠️ Experimental markers next to params                   | Flag the prop with ⚠️ in §3      |
| Notes like *"If you hardcode this value..."*            | §8 Behavior Rules               |

### 6.1 Conversion rules
- Tables in the paste arrive **flattened** (one cell per line). Reconstruct them column by column.
- Lines that look like control inputs (`size`, `m - Medium`, etc.) are **default values** — record them in the *Default* column.
- Code blocks shown without `tsx`/`jsx` fencing are still React/JSX — render them inside ```tsx``` blocks in the docs file.
- Repeated examples that show **shaped vs. lined** are two variants of the same prop — keep both.
- Output stubs like `Output: null`, `Output: false`, or rendered preview text (e.g. `Text input`, `Select`, `Cell 1-1`) are **not code** — discard them.
- The paste rarely lists explicit types. Infer them from controls:
  - `m - Medium` style toggles → enum of `"s" | "m" | "l"` (or whatever values the toggle exposes).
  - Free text input → `string`.
  - Numeric input → `number`.
  - On/off flag → `boolean`.
  - List entry → `string[]`.
  - "even"/"odd" toggles → string-literal enum.
- Dynamic slot patterns (`option-<value>`, `head-<index>`, `cell-<row>-<prop>`) must be documented as templates, not as static slot names.

### 6.2 Standard file template (use this every time)

When the user pastes a new component, generate `react/<category>/zurich-<component>.md` with **these sections, in this order**:

```
1. Title + status badge (⚠️ Experimental if applicable) + Category line
2. AI Implementation Instructions    (numbered list)
3. Import                            (single tsx block)
4. Props (Parameters)                (table; sub-tables if needed for object shapes
                                     or embedded-mode attributes)
5. Events                            (table)
6. Slots                             (table — include dynamic slot patterns)
7. CSS Customization Tokens          (table) — only if the paste lists any
8. Canonical Examples                (multiple tsx blocks: minimal, lined/variant,
                                     reactive, flags, slots, full form-ready)
9. Behavior Rules (for the AI)       (bulleted ❗ list)
10. Quick Decision Tree              (ASCII table)
11. TypeScript Type Hint             (single ts block)
12. Composition Patterns             (if it nests inside other components,
                                     or hosts other components)
```

This is **exactly** the structure used in the existing `zurich-*.md` files. Follow it for every new component to keep the corpus uniform and machine-readable.

### 6.3 What to do when something is missing in the paste
- **No type info?** → Use the inference table in §6.1.
- **No default?** → Write `—` in the *Default* column.
- **No events listed?** → Omit the Events section, do not invent events.
- **No slots listed?** → Omit the Slots section.
- **No CSS variables?** → Omit the Customization Tokens section.
- **Ambiguous prop?** → Mark it with ⚠️ in the description and note the assumption in §8 Behavior Rules.

### 6.4 Where to save the new file
- Decide the **platform** (currently always `react`).
- Decide the **category**:
  - `atoms` → action / interactive primitives (button, link, chip, badge, etc.).
  - `input` → form controls bound to a value (text input, select, checkbox, radio, date picker, etc.).
  - `layout` → containers & structural surfaces (form, card, modal, table, grid, etc.).
  - *(future)* `feedback`, `navigation`, `media`, `typography`, etc.
- Save as `react/<category>/zurich-<component>.md`.
- Add a row to the matching sub-table in §2.

---

## 7. Generation Prompt (use when user pastes a new component)

When the user pastes the docs page for a new Zurich component, the AI should silently follow this prompt:

> "Read the pasted documentation. Identify: import path, props (Playground table), events, slots, CSS variables, flags, and the `Parameters use` examples. Decide the category (Input vs Layout vs future ones) based on the component's role. Convert into a `react/<category>/zurich-<component>.md` file using the standard template defined in `zurich-index.md` §6.2. Preserve every example as a TSX code block. Add an *AI Implementation Instructions* section, a *Behavior Rules* section, a *Quick Decision Tree*, and a *TypeScript Type Hint*. Do not invent props, defaults, or events that are not in the paste. After creating the file, append a row to the matching sub-table in §2 of `zurich-index.md`."

---

## 8. Validation Checklist (run mentally before delivering code)

Before returning code that uses a Zurich component, verify:

1. ✅ Import path matches `@zurich/web-components/react/<kebab-case>`.
2. ✅ Component name is the exact `Zr<PascalCase>` from the docs.
3. ✅ Every prop used appears in the component's file (§3 Props).
4. ✅ Reactive props (`model`, etc.) are bound to `useState`.
5. ✅ Form controls are wrapped in `<ZrForm>` when more than one is present.
6. ✅ Event handler names are camelCase and listed in §4 Events.
7. ✅ kebab-case attribute names are kept verbatim (no auto-renaming to camelCase).
8. ✅ No invented imports, no invented icons, no invented locales.
9. ✅ ⚠️ Experimental flags are preserved in comments when used.
10. ✅ Styling uses documented `--z-*` CSS variables.
11. ✅ Controlled state — when used, both `model` AND `onChange` are present.
12. ✅ Dynamic slot names follow the documented pattern (e.g. `option-<value>`, `cell-<row>-<prop>`).

If any check fails, fix it before delivering the code.

---

## 9. Roadmap (extend as new components are added)

| Priority | Component         | Suggested category        | File to create                              |
|----------|-------------------|---------------------------|---------------------------------------------|
| 1        | `ZrButton`        | Input *(action)*          | `react/input/zurich-button.md`              |
| 2        | `ZrRadio`         | Input                     | `react/input/zurich-radio.md`               |
| 3        | `ZrIcon`          | Layout *(or new `media`)* | `react/layout/zurich-icon.md`               |
| 4        | `ZrToast`         | *(future `feedback`)*     | `react/feedback/zurich-toast.md`            |
| 5        | `ZrTooltip`       | *(future `feedback`)*     | `react/feedback/zurich-tooltip.md`          |

Each new component must:
- Be saved under the right `react/<category>/` folder.
- Add a row to the matching sub-table in §2.
- Follow the §6.2 template.
- Update §5 (Composition Pattern) if it changes how forms or screens are assembled.

---

## 10. Glossary

- **Shaped**: default rounded visual variant of Zurich inputs.
- **Lined**: minimalist underline variant, activated with `config="line"`.
- **Model**: the current value held by an input. Always pair with state.
- **Slot**: named region inside a component into which custom markup can be projected.
- **Dynamic slot**: slot whose name is templated (e.g. `option-<value>`, `cell-<row>-<prop>`).
- **Token**: design-system CSS custom property (`--z-*`) used to customize spacing, color, etc.
- **Cascade**: when a prop set on `<ZrForm>` propagates to its children.
- **Indeterminate**: tri-state visual for checkboxes when the underlying group is partially selected.
- **Embedded mode** *(table-specific)*: passing a native `<table>` inside `<ZrTable>` for full markup control.

---

*End of index. When in doubt, read the component file first, then come back here.*
