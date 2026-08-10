# ZrSwitch — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`), no desde un copy-paste de la web oficial de ZDS (decomisionada 31-dic-2025). Fuente: `dev-utils/dist/code/Switch.props.d.ts` + `dev-utils/dist/code/_BooleanInput.props.d.ts` + `web-components/dist/switch.js` + `web-components/dist/boolean-input.js` + `web-components/dist/react/switch.js` + `css-components/dist/Switch.css`.
> **Platform:** React / Web / CSS
> **Category:** Input
> **Package:** `@zurich/web-components/react/switch`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida un **switch / toggle / interruptor booleano** con la
**Zurich Design System** — es la alternativa visual a `ZrCheckbox` para el mismo tipo de
dato (`boolean`): mismo estado interno, mismos eventos, misma clase base
(`ZBooleanInput`), solo cambia el render (pastilla deslizante vs. casilla).

1. Import:
   ```tsx
   import { ZrSwitch } from '@zurich/web-components/react/switch';
   ```
2. Provee `label` siempre que sea posible (a11y). Usa el slot `label` para contenido rico.
3. Bindea `model` (boolean) a estado de React para un control reactivo cerrado. Actualiza
   el estado vía `onChange`.
4. Usa `checked` **solo** para estado inicial estático/no controlado — no reacciona a
   cambios de estado posteriores.
5. ❗ **Bug del vendor, confirmado leyendo el fuente** (`react/customElement.js`,
   compartido con `ZrCheckbox`): `useCustomElement()` descarta en silencio cualquier prop
   `=== false` (`if (typeof prop === "function" || prop === false || prop === void 0)
   continue;`). Pasar `model={false}` **nunca llega** al custom element — el switch queda
   atascado en su último `true` interno. Workaround (igual que `ZdsCheckboxField`, ver
   `ZdsFields.tsx`): pasar `0` en vez de `false` (`0 === false` es `false` en JS → sobrevive
   el filtro; Lit/el navegador lo coacciona a `false` de forma nativa en
   `input.checked = 0`).
6. No mezcles `model` con `checked` — elegí una estrategia: controlado (`model`) o
   no-controlado-inicial (`checked`).
7. Customiza el color del thumb solo vía los tokens documentados `--z-switch--thumb--on`/
   `--z-switch--thumb--off` — el tamaño de la pastilla se hereda de `--z-boolean-input--size`
   (compartido con `ZrCheckbox`/`ZrRadioSelect`, no es un token propio de `ZrSwitch`).

---

## 2. Import

```tsx
import { ZrSwitch } from '@zurich/web-components/react/switch';
```

---

## 3. Props (Parameters)

| Prop            | Type                                   | Default     | Required | Description                                                                            |
|-----------------|-----------------------------------------|-------------|----------|------------------------------------------------------------------------------------------|
| `label`         | `string`                               | —           | No       | Texto visible de la etiqueta. Cae al slot `label` si se omite.                          |
| `model`         | `boolean`                              | `false`     | No       | Estado actual (encendido/apagado). Bindear a estado de React para reactividad.          |
| `checked`       | `boolean` (flag)                       | `false`     | No       | Estado **inicial** únicamente. Estático — no se sincroniza con cambios de estado. Preferir `model`. |
| `name`          | `string`                               | —           | No       | Atributo `name` dentro de formularios.                                                  |
| `help-text`     | `string`                               | —           | No       | Texto de ayuda junto a la etiqueta.                                                     |
| `disabled`      | `boolean`                              | `false`     | No       | Bloquea toda interacción.                                                               |
| `required`      | `boolean` ⚠️ Experimental               | `false`     | No       | Marca el campo como requerido. El texto default depende del locale.                     |
| `invalid`       | `boolean` ⚠️ Experimental               | `false`     | No       | Marca el campo como inválido (borde/thumb rojo vía `[aria-invalid]`).                   |
| `custom`        | `CustomTokens<'thumb--on'\|'thumb--off'>` | —        | No       | Override de color del thumb en cada estado (ver §6).                                    |

> Idéntico a `ZBooleanInput_Props` (misma base que `ZrCheckbox`, ver `zurich-checkbox.md`)
> menos `indeterminate` — un switch no tiene estado mixto/tri-state.

---

## 4. Events

| Event          | Payload    | Description                                  |
|----------------|------------|-----------------------------------------------|
| `onChange`     | `boolean`  | Nuevo valor del modelo.                       |
| `onRestarted`  | `void`     | El valor se reinició (`.reset()`).            |
| `onBlur`       | `void`     | El componente perdió foco.                    |
| `onValidated`  | `boolean`  | Cambió el estado de validación.               |

---

## 5. Slots

| Slot          | Purpose                                          |
|---------------|----------------------------------------------------|
| `label`       | Contenido de etiqueta personalizado (override de `label`). |
| `help-text`   | Texto de ayuda personalizado (override de `help-text`).    |

---

## 6. CSS Customization Tokens

| CSS Variable            | Type   | Purpose                                                              |
|--------------------------|--------|---------------------------------------------------------------------|
| `--z-switch--thumb--off` | color  | Color del thumb (círculo deslizante) cuando está apagado.            |
| `--z-switch--thumb--on`  | color  | Color del thumb cuando está encendido.                              |

Confirmado en `Switch.css`: `background-color:var(--z-switch--thumb--off, var(--_thumb--off))`
y `...:checked:after{...background-color:var(--z-switch--thumb--on, var(--_thumb--on))}`.
El tamaño de la pastilla completa (`width`/`height`) no tiene token propio de `ZrSwitch` —
depende de `--z-boolean-input--size` (compartido con checkbox/radio vía `ZBooleanInput`).

---

## 7. Canonical Examples

### 7.1 Minimal — sin label
```tsx
<ZrSwitch />
```

### 7.2 Con label
```tsx
<ZrSwitch label="Notificaciones" />
```

### 7.3 Reactivo (recomendado) — controlado con `model`
```tsx
import { useState } from 'react';
import { ZrSwitch } from '@zurich/web-components/react/switch';

export function NotificationsToggle() {
  const [enabled, setEnabled] = useState(false);

  return (
    <ZrSwitch
      label="Recibir notificaciones"
      model={enabled}
      onChange={(v: boolean) => setEnabled(v)}
    />
  );
}
```

### 7.4 Apagar de forma controlada (workaround del bug `model={false}`)
```tsx
const [on, setOn] = useState(false);

<ZrSwitch
  label="¿Incluye anexos?"
  onChange={(v: boolean | null) => setOn(!!v)}
  {...({ model: on ? true : 0 } as Record<string, unknown>)}
/>
```

### 7.5 Disabled
```tsx
<ZrSwitch label="Switch" disabled />
<ZrSwitch label="Switch" checked disabled />
```

### 7.6 Helper text
```tsx
<ZrSwitch label="Modo oscuro" help-text="Aplica a toda la sesión" />
```

### 7.7 Required + invalid
```tsx
<ZrSwitch label="Campo requerido" required />
<ZrSwitch label="Switch" help-text="Este campo es requerido" invalid />
```

### 7.8 Theming del thumb
```tsx
<ZrSwitch
  label="Switch temático"
  style={{
    ['--z-switch--thumb--off' as never]: 'var(--zc-blue-dark)',
    ['--z-switch--thumb--on' as never]:  'var(--zg-white-zurich)',
  }}
/>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`model` vs `checked`:** `model` — controlado, reactivo, **siempre con `onChange`**.
  `checked` — no controlado, solo estado inicial. No mezclar ambos.
- ❗ **Bug del vendor (`model={false}` se descarta):** ver §1.5 — usar `model={valor ? true : 0}`.
  Confirmado en código (no en documentación oficial, que ya no existe): `web-components/dist/react/customElement.js`
  y replicado en el mismo archivo para `useCustomElementWithEvents` (el hook que usa `ZrSwitch`,
  a diferencia de `ZrCheckbox` que usa `useCustomElement` directo — ambos delegan al mismo filtro).
- ❗ **Sin `indeterminate`:** si se necesita un estado tri-state (ej. "seleccionar todos"
  parcial), usar `ZrCheckbox`, no `ZrSwitch` — el switch no tiene ese modo.
- ❗ **`z-switch="outlined"` visto en el CSS compilado NO es una prop real** — no hay
  `config`/variante declarada en `ZSwitch_Props` que la active; parece CSS muerto de una
  versión anterior del componente. No asumir que existe sin verificar en runtime.
- ❗ **`required`/`invalid`** son experimentales y dependen de textos default por locale —
  sobreescribir vía `help-text` reemplaza el default.
- ❗ **Accesibilidad:** si no hay `label` (ni slot `label`), agregar un `aria-label` externo
  en el elemento contenedor.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
campo booleano simple, visual tipo "casilla"             → ZrCheckbox
campo booleano simple, visual tipo "interruptor/toggle"  → ZrSwitch (este)
padre de una lista (algunos hijos seleccionados)         → ZrCheckbox + indeterminate (no existe en Switch)
controlado (dirigido por estado)                          → model + onChange
inicial marcado, no controlado                             → checked
deshabilitado                                               → disabled
aceptación requerida                                        → required (+ help-text opcional)
estado de error en línea                                    → invalid (texto default o help-text)
tema del thumb                                               → --z-switch--thumb--on / --thumb--off
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrSwitchProps = {
  label?: string;
  model?: boolean;
  checked?: boolean;        // solo inicial — no combinar con model
  name?: string;
  'help-text'?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange?: (value: boolean) => void;
  onRestarted?: () => void;
  onBlur?: () => void;
  onValidated?: (isValid: boolean) => void;
  style?: React.CSSProperties & {
    ['--z-switch--thumb--on']?: string;
    ['--z-switch--thumb--off']?: string;
  };
  children?: React.ReactNode;
};
```

---

## 11. Composition Patterns

### 11.1 Mostrar/ocultar una sección condicionada por el switch (uso real en este proyecto)
```tsx
// SeccionDetalleQueja.tsx — ver PqrPage/CrearRecibirQueja
const [showAttachments, setShowAttachments] = useState(false);

<ZrSwitch
  id="pqr-has-attachments"
  name="pqr-has-attachments"
  label="¿Incluye anexos a la queja?"
  onChange={(v: boolean | null) => setShowAttachments(!!v)}
  {...({ model: showAttachments ? true : 0 } as Record<string, unknown>)}
/>

{showAttachments && <DocSupportUploader /* ... */ />}
```

> Regla: **`<ZrSwitch>` es un booleano controlado**, igual que `ZrCheckbox` — dirigilo con
> `model` + `onChange` (con el workaround de §1.5), y temalo solo vía los dos tokens
> `--z-switch--thumb--*`.
