# ZrKpiValue — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`), no desde un paste web. Fuente: `dev-utils/dist/code/KpiValue.props.d.ts` + `web-components/dist/react/kpi-value.d.ts` + `css-components/dist/KpiValue.css`.
> **Platform:** React / Web / CSS
> **Category:** Molecules *(composite content surface)*
> **Package:** `@zurich/web-components/react/kpi-value`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida una **tarjeta de KPI**, **indicador con valor numérico + etiqueta**, o **métrica con flecha de variación** (p.ej. dashboards, resúmenes de gestión).

1. Import:
   ```tsx
   import { ZrKpiValue } from '@zurich/web-components/react/kpi-value';
   ```
2. `amount` (número) es el valor grande mostrado; `header` es la etiqueta superior en negrita; `description` es el texto pequeño bajo el valor (a la derecha).
3. `difference` (número) dibuja una flecha giratoria (▲ si positivo, ▼ si negativo — la rotación se calcula del signo del número) junto al `description`.
4. `config` solo admite **dos** estados de color para la flecha/valor: `'positive'` | `'negative'`. **No existe un tercer estado neutro/warning** — si necesitas un semáforo de 3 colores (éxito/alerta/peligro) tendrás que sobreescribir `--z-kpi-value--color` por CSS custom, `config` no lo cubre.
5. `no-icon` (`boolean`) oculta la flecha de tendencia sin ocultar el número de `difference`.
6. Dos formas verificadas de pasar contenido rico a `header`/`description` (no hay evidencia de un mecanismo `slot="header"` en este componente — evitar inventarlo):
   - Prop plano: `header="Primas emitidas"` (string).
   - Sub-componente dedicado: `<ZrKpiValue.Header>...</ZrKpiValue.Header>` / `<ZrKpiValue.Description>...</ZrKpiValue.Description>` como children, para JSX enriquecido.
7. No declara eventos (`ZKpiValue_Events = {}`).

---

## 2. Import

```tsx
import { ZrKpiValue } from '@zurich/web-components/react/kpi-value';
```

---

## 3. Props (Parameters)

| Prop        | Type                              | Default | Required | Description                                                                 |
|-------------|------------------------------------|---------|----------|-------------------------------------------------------------------------------|
| `amount`    | `number`                           | —       | No       | Valor numérico grande (izquierda).                                          |
| `header`    | `string` \| `ReactSlot`            | —       | No       | Etiqueta superior en negrita (`--zf-h-20`, 700).                            |
| `description` | `string` \| `ReactSlot`          | —       | No       | Texto pequeño bajo el valor, alineado a la derecha.                         |
| `difference`| `number`                           | —       | No       | Variación numérica; controla color y rotación de la flecha de tendencia.    |
| `config`    | `'positive'` \| `'negative'`       | —       | No       | Solo 2 estados de color para `difference`. **No hay tercer estado.**        |
| `no-icon`   | `boolean`                          | `false` | No       | Oculta la flecha de tendencia (mantiene el número de `difference`).         |
| `custom`    | `{}` *(sin claves documentadas)*   | —       | No       | El tipo `ZKpiValue_Custom` no expone claves — usar `style` con `--z-kpi-value--*` directamente. |

Props heredadas de `BaseComponent`: `element-id`, `custom-str`, `z-theme` (`'light'`\|`'dark'`), `slot`.

---

## 4. Events

> `ZKpiValue_Events = {}` — no declara eventos propios. Es un componente puramente presentacional.

---

## 5. Slots

Slots declarados (`zKpiValueSlots`): `description`, `header`, `difference`. En React se exponen como **props del mismo nombre** (no como `slot="..."` en children) — ver §1.6. Además existen sub-componentes dedicados:

| Sub-componente            | Equivale a  |
|----------------------------|-------------|
| `ZrKpiValue.Header`        | prop `header` |
| `ZrKpiValue.Description`   | prop `description` |

---

## 6. CSS Customization Tokens

| CSS Variable                  | Type   | Purpose                                                        |
|--------------------------------|--------|-----------------------------------------------------------------|
| `--z-kpi-value--bg`            | color  | Fondo de la card (default: `var(--z-sf-base)`).                 |
| `--z-kpi-value--color`         | color  | Color del `amount` grande (default: `var(--z-ct-clickable)`).   |
| `--z-kpi-value--diff--pos`     | color  | Color de `difference` cuando `config="positive"`.                |
| `--z-kpi-value--diff--neg`     | color  | Color de `difference` cuando `config="negative"`.                |

```tsx
<ZrKpiValue
  amount={128}
  header="Casos abiertos"
  difference={-4}
  config="negative"
  style={{ ['--z-kpi-value--diff--neg' as any]: 'var(--zc-lemon-aa)' }} // ej.: forzar un 3er color (warning) por CSS
/>
```

---

## 7. Canonical Examples

### 7.1 Mínimo
```tsx
<ZrKpiValue amount={128} header="Casos abiertos" />
```

### 7.2 Con descripción y diferencia positiva
```tsx
<ZrKpiValue
  amount={2450000}
  header="Primas emitidas"
  description="vs. mes anterior"
  difference={12}
  config="positive"
/>
```

### 7.3 Diferencia negativa
```tsx
<ZrKpiValue
  amount={18}
  header="SLA vencidos"
  difference={-3}
  config="negative"
/>
```

### 7.4 Sin ícono de tendencia
```tsx
<ZrKpiValue amount={128} header="Casos abiertos" difference={4} no-icon />
```

### 7.5 Contenido rico vía sub-componentes
```tsx
<ZrKpiValue amount={128}>
  <ZrKpiValue.Header>Casos <em>urgentes</em></ZrKpiValue.Header>
  <ZrKpiValue.Description>últimos 7 días</ZrKpiValue.Description>
</ZrKpiValue>
```

### 7.6 Reactivo (dashboard con datos remotos)
```tsx
function KpiCasosVencidos({ count, deltaVsAyer }: { count: number; deltaVsAyer: number }) {
  return (
    <ZrKpiValue
      amount={count}
      header="Casos vencidos"
      difference={deltaVsAyer}
      config={deltaVsAyer > 0 ? 'negative' : 'positive'}
    />
  );
}
```

---

## 8. Behavior Rules (for the AI)

- ❗ **BUG del vendor (confirmado en runtime, 0.8.1):** el wrapper React de este componente
  (`dist/react/kpi-value.js`) **no incluye** el `<ReactSlots>` interno que sí tienen todos sus
  hermanos (`ZrEmptyState`, `ZrNavigation`, `ZrFooter`, `ZrPromo`, `ZrStageBanner`). Como
  `header`/`description`/`difference` están declaradas como slots del componente, pasar
  `header="texto"` como prop plano se **descarta en silencio** (`useCustomElement()` excluye
  cualquier prop cuya key esté en la lista de slots y no sea un array) — se ve el número pero
  la etiqueta desaparece por completo, sin error en consola. **La fachada `ZdsFields.tsx` ya
  parchea esto** (reasigna `header`/`description`/`difference` como `<span slot="...">` en los
  children, igual que hace `<ReactSlots>` internamente) — usar `ZrKpiValue` **solo desde
  `ZdsFields.tsx`**, nunca importar `@zurich/web-components/react/kpi-value` directo, o se
  vuelve a romper.

- ❗ **`config` solo tiene 2 estados** (`positive`/`negative`) — no inventar `'warning'`/`'neutral'`; si el diseño pide 3+ estados de color, se resuelve con `style` + `--z-kpi-value--diff--pos/neg` (u override completo de `--z-kpi-value--color`), nunca con un valor de `config` no listado.
- ❗ **No pasar contenido a `header`/`description` vía `slot="..."` en un `<span>` hijo** — el mecanismo verificado es prop plano o `ZrKpiValue.Header`/`.Description`.
- ❗ **Es puramente presentacional** — no tiene eventos; no envolver en `onClick` esperando comportamiento nativo.
- ❗ **`difference` es number, no string** — el signo (`-`) determina la rotación de la flecha automáticamente.
- ❗ **No confundir con `ZrProgressBar`/`ZrMetricProgress`** — este componente no muestra progreso hacia una meta, solo valor + variación puntual.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                    → Use...
--------------------------------------------------------------------------
KPI numérico simple (valor + etiqueta)               → <ZrKpiValue amount header>
KPI con variación vs. periodo anterior                → + difference + config
3+ estados de color (semáforo)                        → config (2 estados) + --z-kpi-value--diff--* override
contenido de header/description enriquecido (JSX)      → ZrKpiValue.Header / .Description
progreso hacia una meta (no variación puntual)         → ZrProgressBar / ZrMetricProgress (no este)
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrKpiValueProps = {
  amount?: number;
  header?: string | React.ReactNode;
  description?: string | React.ReactNode;
  difference?: number;
  config?: 'positive' | 'negative';
  'no-icon'?: boolean;
  style?: React.CSSProperties & {
    ['--z-kpi-value--bg']?: string;
    ['--z-kpi-value--color']?: string;
    ['--z-kpi-value--diff--pos']?: string;
    ['--z-kpi-value--diff--neg']?: string;
  };
};
```

---

## 11. Composition Patterns

### 11.1 Fila de KPIs (equivalente a `.kpi-grid` en `shared.css`)
```tsx
<section z-flex="150">
  <ZrKpiValue amount={12} header="Casos abiertos" />
  <ZrKpiValue amount={3} header="SLA en riesgo" difference={2} config="negative" />
  <ZrKpiValue amount={45} header="Cerrados este mes" difference={8} config="positive" />
</section>
```

> Regla de oro: `ZrKpiValue` cubre el 80% de `.kpi-card` (valor + etiqueta + flecha de variación 2-estados). El 20% restante — semáforo de 3+ colores (warn/danger/ok) — necesita override de `--z-kpi-value--diff--*` por CSS custom tokenizado, igual que ya se hace en `shared.css` para otros casos documentados.
