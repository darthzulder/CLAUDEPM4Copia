# ZDS Cheat-Sheet — Referencia de CONSUMO (pantallas PM4)

> **Para qué sirve:** construir pantallas rápido. Fuente de verdad de **qué
> componentes/props existen de verdad**, derivada de
> [`components/fields/ZdsFields.tsx`](../frontend/src/components/fields/ZdsFields.tsx).
> No inventes props que no estén aquí. (Reglas generales de imports, tokens, fachada y
> patrón react-hook-form: ver `CLAUDE.md` — no se repiten aquí.)

---

## 1. Función visual → componente (empieza por aquí)

| ¿Qué función cumple el elemento? | Componente | Notas |
|---|---|---|
| Texto 1 línea (texto/email/tel), editable o readonly | `ZdsInput` | `inputType`, `readOnly`, `icon` |
| Texto multilínea | `ZdsTextarea` | `maxLength`, `elastic` (default true) |
| Lista desplegable (con/sin búsqueda) | `ZdsSelect` | `withSearch`, `placeholder`, `disabled`, `loading` |
| Grupo de radios | `ZdsRadio` | `inline` |
| Checkbox booleano | `ZdsCheckboxField` | solo `name/control/label` |
| Toggle segmentado (SÍ/NO…) | `ZdsSegmented` | opciones con `icon` opcional |
| Selector de fecha (campo) | `ZdsDate` | `min` |
| Calendario inline (grilla de mes) | `ZdsCalendar` | `min/max/wide` |
| Contador de pasos 1-based | `ZdsStepper` | `steps/label/center` |
| Píldora de estado (semáforo) | `ZdsStatusBadge` | `variant` success/danger/info/neutral |
| Carga de 1 archivo | `ZrFileInput` | ver patrón fileRegistry |
| Carga múltiple de soportes | `DocSupportUploader` | wrapper propio sobre ZrFileInput |
| Card con header azul (sección) | `FormSection` | `title/action/footer` |
| Barra de botones al pie | `ActionBar` + `ZrButton` | — |
| Cabecera azul con logo | `ScreenHeader` | `title/subtitle[]` |
| Banda de pares label/valor | `InfoBar` | — |
| Aviso/validación en banda | `ZrAlert` | `config` (ver enum) |
| Botón | `ZrButton` | `config`, `icon`, `loading`, `disabled` |
| Tabla | `ZrTable` / `z-table` | estilos en shared.css |
| Modal | `ZrModal` | controlado por `model` |

Si **ninguno** cumple la función → dominio tokenizado (último recurso). Si necesitas un
componente DS **que no está en la fachada** → DETENTE y consulta (ver jerarquía en CLAUDE.md).

---

## 2. Wrappers react-hook-form (usan `Controller`; pasa `control` + `name`)

Props comunes: `control`, `name`, `label`, `rules`, `required`, `error`, `helpText`.

| Wrapper | Props propias extra | Enums / detalle |
|---|---|---|
| `ZdsInput` | `inputType`, `readOnly`, `icon` | `inputType`: `'text' \| 'email' \| 'tel'`. email auto-pone icono `mail-closed:line` |
| `ZdsTextarea` | `maxLength`, `elastic`, `placeholder` | `elastic` default `true` |
| `ZdsSelect` | `options`, `withSearch`, `placeholder`, `disabled`, `loading` | `options`: `{value, label?/text?, disabled?}[]` (acepta `as const`) |
| `ZdsRadio` | `options`, `inline` | `inline` → `config="inline"` |
| `ZdsCheckboxField` | — | valor booleano; solo `name/control/label` |
| `ZdsSegmented` | `options`, `disabled` | opción acepta `icon` |
| `ZdsDate` | `min`, `readOnly` | modelo ISO `YYYY-MM-DD` |
| `ZdsCalendar` | `min`, `max`, `wide`, `disabled` | inline, modelo ISO |
| `ZdsStepper` | `steps`, `label`, `center`, `disabled` | 1-based en `[1, steps]` |

`error`: pásalo con el helper `fieldError` (oculta "required" hasta enviar). Patrón:
```ts
const err = (n) => fieldError(errors, n, w[n], isSubmitted);
```

---

## 3. Re-exports directos (sin Controller — `model`/`onChange` propios o estáticos)

| Componente | Props/enums verificados | Notas |
|---|---|---|
| `ZrButton` | `config="<tipo>:<size>"` p.ej. `positive:s`, `secondary:s`, `secondary`; `icon`, `loading`, `disabled`, `onClick` | tipos vistos: `positive`, `secondary` |
| `ZrAlert` | `config`: **`'info' \| 'negative' \| 'positive' \| 'alert'`** | kebab `hide-close` para ocultar la X. ⚠ NO existe `'warning'` (usa `alert`) |
| `ZrFileInput` | `label`, `model`, `droppable`, `accept` (array), `help-text`; `onChange(file: File\|string\|null)` | ver patrón abajo |
| `ZrIcon` | `icon="name:line"`, `config="size:color"` | — |
| `ZrModal` | controlado por `model`; el wrapper restaura `overflow` al desmontar | no montar con `cond && <ZrModal>` sin cuidado |
| `ZrLoader` | dimensionable con `--z-loader--size` | spinner oficial; no crear CSS |
| `ZrTable`, `ZrTabs`, `ZrCard`, `ZrForm`, `ZrSidebar`, `ZrTile`, `ZrTooltip`, `ZrInputGroup`, `ZrFieldset`, `ZrChip`, `ZrTag`, `ZrBadge`, `ZrProgressBar`, `ZrSegmentedControl` | ver `ZdsFields.tsx` / ficha en `outputs/react/` | — |

`ZdsStatusBadge` (sobre `ZrTag`): `variant: 'success' \| 'danger' \| 'info' \| 'neutral'`.
`ZrBadge` NO sirve standalone (es overlay `position:absolute`).

---

## 4. Quirks kebab-case (JSX no admite guiones → spread con cast)

Se pasan así: `{...({ 'help-text': x, accept: [...] } as Record<string, unknown>)}`.
Kebab usados en la app: `help-text`, `input-type`, `max-length`, `with-search`,
`search-autofocus`, `search-placeholder`, `hide-close` (ZrAlert), `accept`, `min`, `max`.
Eventos siempre camelCase: `onChange`, `onBlur`, `onClick`.

---

## 5. Molde de uso

Cuando no haya una pantalla análoga que clonar, usa el catálogo visual vivo
`?screen=ds-catalog` ([DsCatalog.tsx](../frontend/src/screens/ds-catalog/DsCatalog.tsx)):
renderiza cada componente de la fachada con sus variantes y props reales.

(El esqueleto de pantalla `useTask → reset → control → ZdsXxx → completeTask` y el patrón
de subida con `fileRegistry` están en `CLAUDE.md`.)
