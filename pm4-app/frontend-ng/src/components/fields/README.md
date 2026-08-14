# `components/fields/` — la fachada del Zurich Design System

**Vacía todavía.** Se construye en la **Fase 2** de la migración a Angular. Este README existe
porque la carpeta ya está declarada como punto autorizado en
[`eslint.config.mjs`](../../../eslint.config.mjs), y quien la abra por primera vez necesita saber
qué contrato tiene que cumplir lo que ponga acá.

## Qué es este directorio

Uno de los **dos únicos puntos autorizados** a importar `@zurich/*` o `@zurich-col/*` — el otro es
[`src/zds-setup.ts`](../../zds-setup.ts), que trae los assets globales. La restricción la aplica
ESLint (`no-restricted-imports`), no la buena voluntad: un import del DS desde una pantalla es
error de lint, no una observación de code review.

Es el equivalente Angular de [`frontend/src/components/fields/ZdsFields.tsx`](../../../../frontend/src/components/fields/ZdsFields.tsx)
(695 líneas, 36 símbolos exportados). La diferencia de forma —una carpeta acá, un archivo allá— es
consecuencia del framework, no un cambio de arquitectura: un wrapper con `Controller` de
react-hook-form son ~15 líneas, mientras que un wrapper Angular es un componente standalone con su
clase `ControlValueAccessor`, y meter 36 de esos en un archivo violaría el límite de 300 líneas del
proyecto. El choke point sigue siendo uno.

## Por qué hay que envolver, y no re-exportar

`@zurich-col/lib-zurich` **no implementa `ControlValueAccessor`** (verificado: 0 ocurrencias de
`NG_VALUE_ACCESSOR` y de `ControlValueAccessor` en su `fesm2022/*.mjs`). Cada campo usa
`@Input() model` + `@Output() modelChange` + `@Input() group: FormGroup`, y **genera su propio
nombre de control** vía `UtilService.getControlName()` → `name-<timestamp>-<n>`. Es decir:
`formControlName` y `[formControl]` **no funcionan** sobre un `lib-*-z`.

Lo que hace viable usarlos igual, y está **aseverado en runtime** en el gate 0 de la migración (no
inferido leyendo el `.mjs`): `generateControl()` solo inventa el nombre aleatorio si el control **no
existe ya** en el `FormGroup`. Si el wrapper **pre-crea el control con el `name` real** antes de que
el `lib-*-z` corra su `ngOnInit`, la librería **lo adopta**. Eso es lo que permite escribir
`formControlName="qd_strChannel"` en la pantalla y tener Reactive Forms idiomático encima de un
componente que no lo soporta.

```
<lib-...-z>  o  <za-...>          ← componente Zurich (nunca se toca)
      ▲
ZdsInput / ZdsSelect / ...        ← wrapper CVA (traduce Reactive Forms ↔ model/group)
      ▲
formControlName="qd_strChannel"   ← lo único que ve la pantalla
```

Verificado también en el gate 0: `generateControl()` **compone** validadores
(`setValidators(compose([previo, generateValidation()]))`), así que los `Validators` que el wrapper
ponga al pre-crear el control **sobreviven**. `required` y `maxLength` siguen viviendo en la
definición del `FormGroup`, no en el componente del DS.

## Gotchas de `lib-zurich` que el wrapper tiene que neutralizar

La pantalla nunca debe verlos. Todos verificados sobre
`InsumosZurich/lib-zurich-2.6.16/package/fesm2022/zurich-col-lib-zurich.mjs`:

| Componente | Trampa | Qué hace el wrapper |
|---|---|---|
| `lib-button-z` | `disabled` con default **`true`** | fuerza `[disabled]="false"` |
| `lib-input-text-z`, `-date`, `lib-textarea-z`, `lib-checkbox-z` | el input se llama `valid` pero **significa `invalid`** | expone `error`/`invalid` y traduce |
| ídem | `valid` se auto-asigna mirando **el group entero**: `if (!manualValidation && group.status == 'INVALID') this.valid = true` → un campo correcto se pinta en rojo si cualquier otro del form es inválido | pasa **`manualValidation = true`** y gobierna el error desde el `FormControl` propio (`invalid && touched`) |
| `lib-input-select-z` | usa `disable`, **no** `disabled` | traduce el nombre |
| `lib-modal-z` | `ShowBackdrop` con S mayúscula; sin portal (z-index 1001/backdrop 1000) | mantiene el `ngOnDestroy` que restaura `document.body.style.overflow` |
| `lib-loader-z` | tiene un `custom-str` hardcodeado verde (`#06e7a3`) **además** del bindeado | decide cuál gana y lo documenta |
| `lib-table-z` | `generciEndName` (typo en la lib, hay que escribirlo así); usa `document.querySelector('.checkAll')` → **dos tablas en la misma pantalla colisionan** | documenta el límite (hoy ninguna pantalla lo hace) |
| `lib-avatar-z` | `ngOnInit` hace `name.split(' ')[1][0]` → **explota con nombres de una palabra** | no lo usa ninguna pantalla; queda anotado |
| `lib-footer-z` | contenido **hardcodeado** (links y redes), no configurable | — |
| Slots | `Card`/`Modal`/`Tile`/`Table`/`Accordion` usan `<ng-template libZTemplate id="...">`, pero **`lib-tabs-z` usa `<ng-template #localRef>`** | no mezclar las dos formas |

De `@zurich/angular-components` (los `za-*`), dos cosas del gate 0: el paquete **no** tiene
`fesm2022/` en la raíz — vive en `dist/fesm2022/angular.mjs`, y cualquier grep de verificación tiene
que apuntar ahí. Y **cada input se verifica contra ese archivo antes de usarlo** en vez de asumir el
nombre: `za-icon` usa `icon`, no `name`, y Angular 21 lo hace fallar con `NG8008` (buena señal — el
compilador sí lee los metadatos del paquete compilado con 18.2.13).

## Contrato de la fachada React que hay que preservar

`id="field-<name>"` (lo necesita `scrollToFirstError`, que se porta tal cual), `label`, `required`,
`readOnly`, `helpText`, `error`, `placeholder`, `icon` (con el default `mail-closed:line` para
`inputType="email"`), `maxLength`, `min`, `elastic`.

## Qué se testea acá (y qué no se puede)

jsdom **no ejecuta los custom elements de Lit de verdad**, así que los specs cubren el **contrato del
CVA**, nunca el pintado interno del componente Zurich:

- Ida y vuelta del CVA: `control.setValue(x)` → el `model` que recibe el `lib-*-z` es `x`; el hijo
  emite `modelChange(y)` → `control.value === y`. El `modelChange` se dispara **programáticamente**
  sobre la instancia del hijo (vía `ComponentFixture`/`DebugElement`), no simulando un click en el
  shadow DOM.
- Que el control del `FormGroup` conserve el `name` real (`qd_*`) y **no** un `name-<ts>-<n>`. Es el
  test que se pone rojo si una versión futura de `lib-zurich` cambia `generateControl()`. El gate 0
  reveló que conviene asertar **el conteo** además de los nombres: al renombrar el control pre-creado,
  el group pasó a tener **3** controles (el propio + el generado por la lib), no 2.
- Que cada wrapper emita `id="field-<name>"`.
- La traducción de cada gotcha de la tabla de arriba, aseverada sobre **el input del hijo**, que es
  donde vive el bug que se está neutralizando.

El hueco que jsdom deja —la interacción real sobre un control del DS— lo cubre la **verificación
manual en Docker**, que es parte del gate de las Fases 2, 5 y 6, no un extra opcional. Ver
[`docs/guides/testing-conventions.md`](../../../../../docs/guides/testing-conventions.md).
