# ZrTable — Zurich Web Components (React)

> **Status:** ⚠️ Experimental
> **Platform:** React / Web / CSS
> **Category:** Layout
> **Package:** `@zurich/web-components/react/table`

---

## 1. AI Implementation Instructions

When the user asks for a **table / data grid / tabular display** using the **Zurich Design System**, you (the AI) must:

1. Import the component from the official path:
   ```tsx
   import { ZrTable } from '@zurich/web-components/react/table';
   ```
2. Choose **one of three data-input modes** (do not mix arbitrarily):
   - **Matrix mode:** `headers` is `(string | number)[]` and `rows` is `(string | number)[][]`. Simplest case.
   - **Object mode:** `headers` is an array of `{ prop, text, bg? }` config objects and `rows` is an array of plain objects with matching `prop` keys.
   - **Embedded mode:** place a native `<table>` (with `<thead>`, `<tbody>`, `<tr>`, `<td>`) as a child of `<ZrTable>`. Most flexible, lets you use cell-level attributes like `config` and `highlight`.
3. Use the `caption` prop to label the table (a11y-friendly).
4. Use `zebra` (true / `"even"` / `"odd"`) to alternate row backgrounds.
5. Customize cell content via slots:
   - `head-<index>` for header cells.
   - `cell-<row>-<index>` for matrix-style rows.
   - `cell-<row>-<prop>` for object-style rows.
6. In embedded mode, use:
   - `config="left" | "center" | "right"` on `<td>`/`<th>` for alignment.
   - `highlight` on a `<td>` in the header to highlight the full column.
7. Tune cell padding via the `--z-table--cell-padding` CSS variable.
8. The component is **presentational** — it does not handle sorting, pagination, or selection by itself.

---

## 2. Import

```tsx
import { ZrTable } from '@zurich/web-components/react/table';

// Optional, when adorning header/cell slots with icons:
import { ZrIcon }  from '@zurich/web-components/react/icon';
```

---

## 3. Props (Parameters)

| Prop            | Type                                                                                  | Default | Required | Description                                                                                                |
|-----------------|---------------------------------------------------------------------------------------|---------|----------|------------------------------------------------------------------------------------------------------------|
| `headers`       | `(string \| number)[]` **or** `ZrTableHeader[]` *(see §3.1)*                          | —       | No       | Column headers. Strings/numbers for matrix mode; config objects for object mode.                           |
| `rows`          | `(string \| number)[][]` **or** `Record<string, any>[]`                               | —       | No       | Row data. Matrix or array of objects (paired with header `prop`s).                                         |
| `caption`       | `string`                                                                              | —       | No       | Caption shown above the table.                                                                             |
| `zebra`         | `boolean` \| `"even"` \| `"odd"`                                                      | `false` | No       | Alternate row background. `true` ≡ `"even"`. Use `"odd"` to flip.                                          |
| `columns`       | `number`                                                                              | —       | No       | Number of columns (used by the Playground; usually inferred from `headers`/`rows`).                        |
| `objectHeader`  | `boolean`                                                                             | `false` | No       | Playground hint indicating header is in object form. Inferred automatically when `headers[0]` is an object.|
| `objectValues`  | `boolean`                                                                             | `false` | No       | Playground hint indicating rows are in object form. Inferred automatically when `rows[0]` is an object.    |
| `children`      | `React.ReactNode`                                                                     | —       | No       | Default slot — embed a native `<table>` or define `head-*`/`cell-*` slot content.                          |

### 3.1 `ZrTableHeader` shape (object mode)

```ts
type ZrTableHeader = {
  prop: string;        // key in each row object that feeds this column
  text: string;        // visible header text
  bg?: string | true;  // highlight the column. `true` for default highlight, or a CSS color string
};
```

### 3.2 Embedded-mode cell attributes

When you provide a native `<table>` inside `<ZrTable>`:

| Attribute    | Where         | Values                              | Effect                                                  |
|--------------|---------------|-------------------------------------|---------------------------------------------------------|
| `config`     | `<td>`/`<th>` | `"left"` \| `"center"` \| `"right"` | Aligns cell content.                                    |
| `highlight`  | `<td>` (head) | boolean                             | Highlights the entire column whose header has it.       |

---

## 4. Events

> ZrTable does not declare its own events. Wire interactions on inner elements (e.g. `onClick` on cells) when needed.

---

## 5. Slots

| Slot                  | Purpose                                                                                |
|-----------------------|----------------------------------------------------------------------------------------|
| *(default)*           | Embedded `<table>` markup or slot wrappers for `head-*` / `cell-*`.                    |
| `head-<index>`        | Custom content for the header cell at the given index (matrix mode).                   |
| `cell-<row>-<index>`  | Custom content for the cell at `(row, index)` in matrix mode.                          |
| `cell-<row>-<prop>`   | Custom content for the cell at `(row, prop)` in object mode (use the property key).    |

> Slots accept any inline-or-block markup. Use `z-flex="50"` (or similar utility attributes) inside slot content for layout fine-tuning, as shown in the official examples.

---

## 6. CSS Customization Tokens

| CSS Variable               | Type     | Purpose                              |
|----------------------------|----------|--------------------------------------|
| `--z-table--cell-padding`  | distance | Inner padding applied to each cell.  |

```tsx
<ZrTable
  headers={['A', 'B', 'C']}
  rows={[['1', '2', '3']]}
  style={{ ['--z-table--cell-padding' as any]: '0.75rem 1rem' }}
/>
```

---

## 7. Canonical Examples

### 7.1 Minimal — matrix mode
```tsx
<ZrTable
  headers={['Head 1', 'Head 2', 'Head 3']}
  rows={[
    ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
    ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
  ]}
/>
```

### 7.2 With caption
```tsx
<ZrTable
  caption="Quarterly results"
  headers={['Head 1', 'Head 2', 'Head 3']}
  rows={[
    ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
    ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
  ]}
/>
```

### 7.3 Custom header content via `head-<index>` slot
```tsx
import { ZrTable } from '@zurich/web-components/react/table';
import { ZrIcon }  from '@zurich/web-components/react/icon';

<ZrTable headers={['Head 1', 'Head 2', 'Head 3']}>
  <span slot="head-0" z-flex="50">
    <ZrIcon icon="help" />
    Info
  </span>
</ZrTable>
```

### 7.4 Custom cell content via `cell-<row>-<index>` slot (matrix mode)
```tsx
<ZrTable
  rows={[
    ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
    ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
  ]}
>
  <span slot="cell-0-1" z-flex="50">
    <ZrIcon icon="help" />
    Cell prop
  </span>
</ZrTable>
```

### 7.5 Object mode — headers as config + rows as objects
```tsx
const headers = [
  { prop: 'props_1', text: 'Prop 1' },
  { prop: 'props_2', text: 'Prop 2' },
  { prop: 'props_3', text: 'Prop 3' },
];

const rows = [
  { props_1: 'Prop 1-1', props_2: 'Prop 1-2', props_3: 'Prop 1-3' },
  { props_1: 'Prop 2-1', props_2: 'Prop 2-2', props_3: 'Prop 2-3' },
];

<ZrTable headers={headers} rows={rows} />
```

### 7.6 Custom cell in object mode — `cell-<row>-<prop>`
```tsx
<ZrTable headers={headers} rows={rows}>
  <span slot="cell-0-props_2" z-flex="50">
    <ZrIcon icon="help" />
    Cell prop
  </span>
</ZrTable>
```

### 7.7 Highlight a column (object mode)
```tsx
const headers = [
  { prop: 'a', text: 'Header 1' },
  { prop: 'b', text: 'Header 2', bg: true },         // default highlight
  { prop: 'c', text: 'Header 3', bg: '#FFF7ED' },    // custom color
];

<ZrTable headers={headers} rows={[
  { a: 'Cell 1-1', b: 'Cell 1-2', c: 'Cell 1-3' },
  { a: 'Cell 2-1', b: 'Cell 2-2', c: 'Cell 2-3' },
]} />
```

### 7.8 Zebra rows
```tsx
{/* Even rows highlighted (default when zebra is true) */}
<ZrTable
  zebra
  rows={[
    ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
    ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
    ['Cell 3-1', 'Cell 3-2', 'Cell 3-3'],
  ]}
/>

{/* Odd rows highlighted */}
<ZrTable
  zebra="odd"
  rows={[
    ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
    ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
    ['Cell 3-1', 'Cell 3-2', 'Cell 3-3'],
  ]}
/>
```

### 7.9 Embedded mode — full control with native `<table>`
```tsx
<ZrTable>
  <table>
    <thead>
      <tr>
        <td>Head 1</td>
        <td>Head 2</td>
        <td>Head 3</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cell 1-1</td>
        <td>Cell 1-2</td>
        <td>Cell 1-3</td>
      </tr>
      <tr>
        <td>Cell 2-1</td>
        <td>Cell 2-2</td>
        <td>Cell 2-3</td>
      </tr>
    </tbody>
  </table>
</ZrTable>
```

### 7.10 Embedded — alignment per cell
```tsx
<ZrTable>
  <table>
    <tbody>
      <tr>
        <td style={{ width: 100 }}>Left</td>
        <td style={{ width: 100 }} config="center">Center</td>
        <td style={{ width: 100 }} config="right">Right</td>
      </tr>
    </tbody>
  </table>
</ZrTable>
```

### 7.11 Embedded — highlight a column via `highlight`
```tsx
<ZrTable>
  <table>
    <thead>
      <tr>
        <td>Head 1</td>
        <td highlight>Head 2</td>
        <td>Head 3</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cell 1</td>
        <td>Cell 2</td>
        <td>Cell 3</td>
      </tr>
    </tbody>
  </table>
</ZrTable>
```

### 7.12 Embedded + zebra
```tsx
<ZrTable zebra>
  <table>
    <tbody>
      <tr><td>Cell 1-1</td><td>Cell 1-2</td><td>Cell 1-3</td></tr>
      <tr><td>Cell 2-1</td><td>Cell 2-2</td><td>Cell 2-3</td></tr>
      <tr><td>Cell 3-1</td><td>Cell 3-2</td><td>Cell 3-3</td></tr>
    </tbody>
  </table>
</ZrTable>
```

### 7.13 Wrapped inside a card (typical layout)
```tsx
import { ZrCard }  from '@zurich/web-components/react/card';
import { ZrTable } from '@zurich/web-components/react/table';

<ZrCard config="grid">
  <ZrTable
    caption="Active policies"
    headers={[
      { prop: 'id',     text: 'ID' },
      { prop: 'holder', text: 'Holder' },
      { prop: 'status', text: 'Status', bg: true },
    ]}
    rows={[
      { id: 'POL-001', holder: 'Alex Vargas', status: 'Active' },
      { id: 'POL-002', holder: 'María Pérez', status: 'Pending' },
    ]}
    zebra
  />
</ZrCard>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **Pick one data mode:** matrix, object, or embedded. Avoid mixing them in the same table.
- ❗ **Object mode requires aligned keys.** Every header `prop` must exist as a key in each row object.
- ❗ **Embedded mode unlocks per-cell attributes** (`config`, `highlight`) but loses the `head-*` / `cell-*` slot system — use one or the other.
- ❗ **`zebra={true}` ≡ `zebra="even"`.** Use `"odd"` to flip the highlighted rows.
- ❗ **Slot naming is strict:**
  - Matrix rows: `cell-<rowIndex>-<columnIndex>` (zero-based).
  - Object rows: `cell-<rowIndex>-<propertyKey>` — use the **key**, not the visible text.
- ❗ **`bg`** in header config accepts `true` (default highlight) or a CSS color string (custom highlight).
- ❗ **No built-in sorting/pagination/selection.** Implement these in surrounding state/UI when required.
- ❗ **Accessibility:** prefer `caption` over a separate `<h*>` so screen readers associate it with the table.
- ❗ **Cell padding** is the only first-class CSS token (`--z-table--cell-padding`); style other aspects via outer wrappers.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
quick tabular display from arrays                       → headers + rows (matrix mode)
data-driven table from list of objects                  → headers as config + rows as objects
maximum control over markup                             → embed a native <table>
column highlight                                        → header.bg=true|color (or `highlight` attr)
alternating row backgrounds                             → zebra (true | "even" | "odd")
custom header content (icon, badge)                     → slot="head-<index>"
custom cell content (matrix)                            → slot="cell-<row>-<index>"
custom cell content (object rows)                       → slot="cell-<row>-<propKey>"
align cell text                                         → embed mode + config="left|center|right"
caption / accessible title                              → caption="..."
adjust cell padding                                     → --z-table--cell-padding
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrTableHeader = {
  prop: string;
  text: string;
  bg?: string | true;
};

type ZrTableRowMatrix = (string | number)[];
type ZrTableRowObject = Record<string, string | number | boolean | null | undefined>;

type ZrTableProps = {
  headers?: (string | number)[] | ZrTableHeader[];
  rows?: ZrTableRowMatrix[] | ZrTableRowObject[];
  caption?: string;
  zebra?: boolean | 'even' | 'odd';
  columns?: number;
  objectHeader?: boolean;
  objectValues?: boolean;
  style?: React.CSSProperties & {
    ['--z-table--cell-padding']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Card + Table (canonical dashboard surface)
```tsx
<ZrCard config="grid">
  <ZrTable headers={...} rows={...} zebra />
</ZrCard>
```

### 11.2 Modal + Table (detail dialog)
```tsx
<ZrModal model={open} onChange={(v) => setOpen(v)}>
  <ZrTable
    caption="Items in this policy"
    headers={[
      { prop: 'sku',  text: 'SKU' },
      { prop: 'name', text: 'Item' },
      { prop: 'qty',  text: 'Qty' },
    ]}
    rows={items}
    zebra
  />
</ZrModal>
```

### 11.3 Form-driven table (filterable list)
```tsx
<ZrForm config="line">
  <ZrTextInput name="q" label="Search" model={q} onChange={(v) => setQ(v)} />
</ZrForm>

<ZrTable
  headers={[
    { prop: 'id',     text: 'ID' },
    { prop: 'holder', text: 'Holder' },
  ]}
  rows={items.filter(i => i.holder.includes(q))}
  zebra
/>
```

> Rule of thumb: **`<ZrTable>` is purely presentational.** Decide on a single data mode, drive it from React state, and rely on `head-*` / `cell-*` slots (or embedded `<table>` markup) for any per-cell customization.
