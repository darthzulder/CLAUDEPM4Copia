import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputDateZ } from '@zurich-col/lib-zurich';
import { CampoBase } from './campo-base';

/**
 * Campo de fecha de la fachada. Envuelve `lib-input-date-z` y preserva el contrato de `ZdsDate` de
 * la fachada React (`min`, `readOnly`, `error`, modelo string ISO `YYYY-MM-DD`).
 *
 * ```html
 * <zds-date formControlName="qd_strFechaProrroga" name="qd_strFechaProrroga"
 *           label="Fecha de prórroga" min="2026-08-14" />
 * ```
 *
 * ── Gotchas de `lib-input-date-z` ───────────────────────────────────────────────────────────
 *  - **`valid` significa `invalid`** (`[invalid]="valid"` en su template), igual que el input de
 *    texto y el textarea. Se traduce desde `blnEnError`.
 *  - **`manualValidation` existe y hace falta** — mismo `if (!manualValidation && group.status ==
 *    'INVALID')` que ensucia el estado mirando el group entero.
 *  - **NO tiene `helpText`.** Verificado: 0 ocurrencias de `helpText` en la clase, y su template no
 *    pasa `help-text` al `za-date-input`. Es el único de los cinco campos que no puede mostrar texto
 *    de ayuda. **Consecuencia práctica que hay que saber al portar:** un `error` explícito en este
 *    campo **no se ve como mensaje** — solo pinta el borde en rojo. La fachada React sí mostraba el
 *    mensaje (su `ZrDateInput` acepta `help-text`), así que acá hay una pérdida real de paridad que
 *    no depende de este wrapper. Se deja anotado en vez de fingir que el prop funciona: `helpText`
 *    y `error` siguen existiendo en la base (el `error` gobierna el pintado), pero el texto no viaja.
 *    Si una pantalla necesita el mensaje visible, va como texto propio al lado del campo.
 *  - **`inputType` selecciona el modo del `za-date-input`** con una cadena de ternarios que mapea
 *    `date|month|datetime-local|week` y **cae a `'date'`** en cualquier otro caso. Se expone solo
 *    esa unión, por lo mismo que en el input de texto: ofrecer más sería mentir.
 *  - **`lineType` se pasa CRUDO a `[config]`**, no como booleano: el template hace
 *    `[config]="lineType"`, a diferencia del textarea (`[config]="lineType ? 'line' : ''"`) y del
 *    select (`[config]="typeLine ? 'line' : ''"`). Tres componentes hermanos, tres contratos
 *    distintos para el mismo concepto. Acá no se expone: ninguna pantalla lo usa y su tipo real es
 *    el string del DS, no un flag.
 */
@Component({
  selector: 'zds-date',
  standalone: true,
  imports: [InputDateZ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZdsDate),
      multi: true,
    },
  ],
  template: `
    <div class="zds-field-wrap" [id]="strId" tabindex="-1">
      <lib-input-date-z
        [group]="grupo"
        [name]="name()"
        [label]="label()"
        [model]="model() ?? ''"
        (modelChange)="alCambiarModelo($event)"
        [inputType]="inputType()"
        [min]="min()"
        [max]="max()"
        [required]="required()"
        [readonly]="readOnly()"
        [disabled]="deshabilitado()"
        [valid]="blnEnError"
        [manualValidation]="true"
      />
    </div>
  `,
})
export class ZdsDate extends CampoBase<string> {
  readonly inputType = input<'date' | 'month' | 'datetime-local' | 'week'>('date');

  /** Cotas del picker, en el mismo formato que el modelo (`YYYY-MM-DD` para `inputType="date"`). */
  readonly min = input<string>('');
  readonly max = input<string>('');
}
