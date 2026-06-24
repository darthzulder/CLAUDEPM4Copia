# Zurich Web Components — Master Index for AI Agents

> **Audience:** Claude (and any AI coding assistant) consuming this folder as a knowledge base.
> **Purpose:** Tell the AI **how to read the docs in this folder, how to interpret raw web copy-paste, and how to assemble Zurich components into working React code.**
>
> Source of truth: each component has its own `zurich-<component>.md` file inside the matching **platform / category** folder. This index is the entry point.

---

## 0. How to Use This Folder (READ FIRST — AI INSTRUCTIONS)

> **Orden de decisión del proyecto (PM4 app):** antes de construir UI sigue la **Jerarquía de decisión de UI** de `pm4-app/CLAUDE.md` (reusar componentes propios → componentes DS vía la fachada `ZdsFields` → **consultar al usuario antes de documentar un elemento DS nuevo** aquí → CSS custom como último recurso; el layout se hace con `z-flex`/`z-align`/`z-grid`, nunca `display:flex` a mano). Este índice es la base de conocimiento del DS de la que se alimenta ese paso (escalones A.2/A.3 y B.1).

When a user asks you to build something with the **Zurich Design System**:

1. **Always start here** (`zurich-index.md`) to find the relevant component file.
2. **Open the component file** (`react/<category>/zurich-<name>.md`) and follow the section "AI Implementation Instructions" before writing any code.
3. **Never invent props, events, or imports.** If a prop is not listed in the component's file, do not use it.
4. **Default to React + TypeScript** unless the user specifies otherwise. Today every documented component lives under `react/`.
5. **Bind values to state** — in standalone usage use `useState`; inside `react-hook-form` screens use `Controller` (via `ZdsFields.tsx` wrappers). Never hardcode `model` — it will not be reactive.
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
└── react/                                ← React design system
    ├── foundations/                      ← Design tokens & guidelines (CSS vars + HTML attrs)
    │   ├── zurich-typography.md          ← fonts (Zurich Sans, Ogg), emoji setup
    │   ├── zurich-typography-styles.md   ← --zf-h-*, --zf-ht-*, --zf-body-*, --zf-capt-*, z-heading
    │   ├── zurich-colors.md              ← brand / secondary / tints / gray / status / overlay taxonomy
    │   ├── zurich-colors-palettes.md     ← per-shade HEX / HSL / RGB / luminance reference
    │   ├── zurich-layouts-flex.md        ← z-flex + z-align HTML attributes
    │   ├── zurich-layouts-grid.md        ← z-grid="main" + column responsive grid
    │   ├── zurich-spacers.md             ← --zs-* spacing scale tokens
    │   └── assets/                       ← Subcategory: catalog assets
    │       ├── zurich-icons.md           ← generic ZDS icon set by category
    │       └── zurich-brand-icons.md     ← social/third-party brand icons (Color & :mono)
    ├── atoms/                            ← Category: action / interactive primitives
    │   ├── zurich-button.md
    │   ├── zurich-icon.md
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
    ├── molecules/                        ← Category: composite content surfaces
    │   └── zurich-tile.md
    └── layout/                           ← Category: containers & structural surfaces
        ├── zurich-form.md
        ├── zurich-card.md
        ├── zurich-modal.md
        ├── zurich-table.md
        ├── zurich-sidebar.md
        ├── zurich-tabs.md
        └── zurich-inputgroup.md
```

> Everything lives under `react/`. Foundations, atoms, inputs, molecules, layouts — all of them.
> When a new category appears (e.g. `feedback`, `navigation`, `media`), add a sibling folder next to the existing ones inside `react/`.

---

## 2. Component Index by Category

### 2.0 React → Foundations *(design tokens & guidelines)*

| Foundation                  | File                                                                                              | Status         | Purpose                                                                       |
|-----------------------------|---------------------------------------------------------------------------------------------------|----------------|-------------------------------------------------------------------------------|
| Typography                  | [`react/foundations/zurich-typography.md`](./react/foundations/zurich-typography.md)              | ✅ Live         | Fonts (Zurich Sans, Ogg), weights, hierarchy, emoji setup.                    |
| Typography styles           | [`react/foundations/zurich-typography-styles.md`](./react/foundations/zurich-typography-styles.md)| ✅ Live         | Detailed tokens: `--zf-h-*`, `--zf-ht-*`, `--zf-body-*`, `--zf-capt-*`, `z-heading`. |
| Colors                      | [`react/foundations/zurich-colors.md`](./react/foundations/zurich-colors.md)                      | ✅ Live         | Brand / secondary / tints / gray / status / overlay taxonomy.                  |
| Color palettes              | [`react/foundations/zurich-colors-palettes.md`](./react/foundations/zurich-colors-palettes.md)    | ✅ Live         | Per-shade HEX / HSL / RGB / luminance reference for every hue.                 |
| Layouts — Flex              | [`react/foundations/zurich-layouts-flex.md`](./react/foundations/zurich-layouts-flex.md)          | ✅ Live         | `z-flex` + `z-align` HTML attributes (direction / wrap / gap / alignment).    |
| Layouts — Grid              | [`react/foundations/zurich-layouts-grid.md`](./react/foundations/zurich-layouts-grid.md)          | ✅ Live         | `z-grid="main"` + `column` 12-col responsive grid, breakpoints, rhythm.       |
| Spacers                     | [`react/foundations/zurich-spacers.md`](./react/foundations/zurich-spacers.md)                    | ✅ Live         | `--zs-*` spacing scale tokens (12/25/50/.../1000 rem-based).                  |
| Assets — Icons              | [`react/foundations/assets/zurich-icons.md`](./react/foundations/assets/zurich-icons.md)          | ✅ Live         | Generic ZDS icon catalog by category, `name[:line]` syntax, sizes.            |
| Assets — Brand icons        | [`react/foundations/assets/zurich-brand-icons.md`](./react/foundations/assets/zurich-brand-icons.md)| ✅ Live       | Social / third-party brand logos, Color vs `:mono` variants.                  |

### 2.1 React → Atoms *(action / interactive primitives)*

| Component       | File                                                                              | Status         | Purpose                                                         |
|-----------------|-----------------------------------------------------------------------------------|----------------|-----------------------------------------------------------------|
| `ZrButton`      | [`react/atoms/zurich-button.md`](./react/atoms/zurich-button.md)                  | ⚠️ Experimental | Action button: types, sizes, round, icon, link, submit, popover.|
| `ZrIcon`        | [`react/atoms/zurich-icon.md`](./react/atoms/zurich-icon.md)                      | ⚠️ Experimental | Standalone icon: `icon="name:line"` + `config="size:color"`.    |
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

### 2.3 React → Molecules *(composite content surfaces — atom + content + actions)*

| Component       | File                                                                              | Status         | Purpose                                                         |
|-----------------|-----------------------------------------------------------------------------------|----------------|-----------------------------------------------------------------|
| `ZrTile`        | [`react/molecules/zurich-tile.md`](./react/molecules/zurich-tile.md)              | ⚠️ Experimental | Promo / article tile with header + image + content + actions.   |

### 2.4 React → Layout *(containers & structural surfaces)*

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

### In this project (PM4 app) — ALWAYS use the ZdsFields facade

```tsx
// All Zurich DS components are imported from the project facade:
import {
  // react-hook-form Controller wrappers (for form fields)
  ZdsInput, ZdsSelect, ZdsRadio, ZdsDate,
  ZdsTextarea, ZdsCheckboxField, ZdsSuggest,
  // Raw re-exports (for components that don't need Controller)
  ZrButton, ZrModal, ZrForm, ZrCard, ZrTabs, ZrProgressBar,
  ZrTextInput, ZrTextarea, ZrSelect,
} from '../../components/fields/ZdsFields';
```

**Never import directly from `@zurich/web-components/react/...` inside screens.**
`ZdsFields.tsx` is the single source of truth for Zurich DS in the app.

### Raw imports (only when modifying ZdsFields.tsx itself, or outside screens)

```tsx
// Atoms
import { ZrButton }      from '@zurich/web-components/react/button';
import { ZrTooltip }     from '@zurich/web-components/react/tooltip';
import { ZrProgressBar } from '@zurich/web-components/react/progress-bar';

// Molecules
import { ZrTile }        from '@zurich/web-components/react/tile';

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

### In this project (PM4 app) — react-hook-form + ZdsFields

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZrButton } from '../../components/fields/ZdsFields';
import { OPTIONS, MyFormData } from './variables';
// No importar styles.css locales. Todos los estilos específicos se manejan de forma DRY en shared.css.

export default function MyScreen() {
  const { task, submitting, completeTask } = useTask();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<MyFormData>();

  useEffect(() => {
    if (task?.data) reset(task.data as MyFormData);
  }, [task, reset]);

  const onSubmit = async (data: MyFormData) => {
    await completeTask(data as Record<string, unknown>);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="My Section">
        <div className="form-row cols-2">
          <ZdsInput
            name="my_field"
            control={control}
            label="My Field"
            rules={{ required: 'Required field' }}
            required
            error={errors.my_field?.message}
          />
          <ZdsSelect
            name="my_select"
            control={control}
            label="My Select"
            options={OPTIONS.mySelect}
            rules={{ required: 'Required field' }}
            required
            error={errors.my_select?.message}
          />
        </div>
      </FormSection>
      <ZrButton type="submit" disabled={submitting}>Save</ZrButton>
    </form>
  );
}
```

> Rule of thumb: **`useTask` → `reset(task.data)` → `control` → `ZdsXxx` wrappers → `completeTask`.**
>
> `control` from react-hook-form replaces per-field `useState`. PM4 pre-population is done with a single `reset()` call.

### Standalone (without react-hook-form) — direct useState

```tsx
import { useState } from 'react';
import { ZrTextInput } from '../../components/fields/ZdsFields';

export function StandaloneExample() {
  const [name, setName] = useState('');

  return (
    <ZrTextInput
      label="Full name"
      model={name}
      onChange={(v: string) => setName(v)}
      required
    />
  );
}
```

> Use only for components that are not PM4 form screens (e.g. simple confirmation modals).

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
- Everything lives under `react/`. Decide the **category** inside it:
  - `foundations` → design tokens & guidelines (typography, colors, layouts, spacers). Save under `react/foundations/`.
  - `foundations/assets` → catalog assets (icons, brand icons). Save under `react/foundations/assets/`.
  - `atoms` → action / interactive primitives (button, tooltip, progress bar, link, chip, badge, etc.). Save under `react/atoms/`.
  - `input` → form controls bound to a value (text input, select, checkbox, radio, date picker, stepper, etc.). Save under `react/input/`.
  - `molecules` → composite content surfaces combining atoms + content + actions (tile, banner, etc.). Save under `react/molecules/`.
  - `layout` → containers & structural surfaces (form, card, modal, table, sidebar, tabs, input-group, etc.). Save under `react/layout/`.
  - *(future)* `feedback`, `navigation`, `media`, `organisms`, etc. — all siblings under `react/`.
- Save as `react/<category>/zurich-<component>.md`.
- Add a row to the matching sub-table in §2.

---

## 7. Generation Prompt (use when user pastes a new component)

When the user pastes the docs page for a new Zurich component, the AI should silently follow this prompt:

> "Read the pasted documentation. Identify: import path, props (Playground table), events, slots, CSS variables, flags, and the `Parameters use` examples. Decide the category (Input vs Layout vs future ones) based on the component's role. Convert into a `react/<category>/zurich-<component>.md` file using the standard template defined in `zurich-index.md` §6.2. Preserve every example as a TSX code block. Add an *AI Implementation Instructions* section, a *Behavior Rules* section, a *Quick Decision Tree*, and a *TypeScript Type Hint*. Do not invent props, defaults, or events that are not in the paste. After creating the file, append a row to the matching sub-table in §2 of `zurich-index.md`."

---

## 8. Validation Checklist (run mentally before delivering code)

Before returning code that uses a Zurich component, verify:

1. ✅ **In screens**: import from `../../components/fields/ZdsFields`, never directly from `@zurich/web-components/react/...`.
2. ✅ **In ZdsFields.tsx itself**: import path matches `@zurich/web-components/react/<kebab-case>`.
3. ✅ Component name is the exact `Zr<PascalCase>` from the docs (inside ZdsFields) or `Zds<PascalCase>` wrapper (in screens).
4. ✅ Every prop used appears in the component's file (§3 Props).
5. ✅ Reactive props (`model`): in forms use `Controller` via `ZdsXxx` wrappers; standalone use `useState`.
6. ✅ Form controls use `control` + `name` + `rules` props (not `register`).
7. ✅ Event handler names are camelCase and listed in §4 Events.
8. ✅ kebab-case attribute names are kept verbatim (no auto-renaming to camelCase).
9. ✅ No invented imports, no invented icons, no invented locales.
10. ✅ ⚠️ Experimental flags are preserved in comments when used.
11. ✅ Styling uses documented `--z-*` CSS variables and `--zf-*` / `--zs-*` tokens.
12. ✅ Controlled state — both `model` AND `onChange` always present together.
13. ✅ Dynamic slot names follow the documented pattern (e.g. `option-<value>`, `cell-<row>-<prop>`).

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
