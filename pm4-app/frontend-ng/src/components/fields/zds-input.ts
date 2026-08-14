import { Component, computed, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextZ } from '@zurich-col/lib-zurich';
// `icon` de `lib-input-text-z` está tipado como `SizelessIconAttr | undefined`, una unión cerrada
// de nombres de ícono del DS — no `string`. Se importa el tipo real en vez de ensanchar a `string`
// con un `as`: así un nombre de ícono inexistente lo atrapa `tsc` y no el navegador. Este archivo
// es uno de los dos puntos autorizados a importar `@zurich/*` (lo aplica eslint.config.mjs).
import type { SizelessIconAttr } from '@zurich/dev-utils/data';
import { CampoBase } from './campo-base';

/**
 * Campo de texto de la fachada. Envuelve `lib-input-text-z` y expone el contrato de la fachada
 * React (`ZdsInput`) para que portar una pantalla sea reescribir el template, no repensar el campo.
 *
 * Uso desde una pantalla — Reactive Forms idiomático, sin ver nada de `lib-zurich`:
 * ```html
 * <zds-input formControlName="qd_strChannel" label="Canal" required inputType="email" />
 * ```
 *
 * ── Gotchas de `lib-input-text-z` que este wrapper neutraliza ──────────────────────────────
 *  - **`valid` significa `invalid`.** El input se llama `valid` pero el template del hijo lo pasa
 *    como `[invalid]="valid"` a su `za-text-input`. Acá se expone `error`/estado del control y se
 *    traduce, así que la pantalla nunca escribe la polaridad al revés.
 *  - **`manualValidation = true`, siempre.** Sin eso la lib mira el group ENTERO
 *    (`if (!manualValidation && group.status == 'INVALID') this.valid = true`) y pinta en error un
 *    campo correcto porque otro campo del form es inválido. Ver `blnEnError` en
 *    [campo-base.ts](./campo-base.ts).
 *  - **`icon` por defecto en email.** La fachada React pone `mail-closed:line` cuando
 *    `inputType === 'email'` y no se pasó ícono; se replica para no perder paridad visual.
 *  - **`maxLength` de la lib NO limita nada, y su tipo lo delata: es `boolean`, no `number`.** El
 *    largo iría en `maxNumber`, pero ninguno de los dos llega al `za-text-input`: el template solo
 *    pasa `id/name/label/config/ngModel/input-type/help-text/invalid/required/readonly/icon`, y la
 *    única referencia a `maxLength` en la clase está **comentada** (`// return this.maxLength &&`).
 *    O sea que son inputs muertos. Por eso el wrapper **no** los bindea: el límite de caracteres se
 *    declara como `Validators.maxLength(n)` en el control, que además es donde el proyecto ya lo
 *    tiene. Pasarlo al componente parecería funcionar y no haría nada — falso verde silencioso.
 *
 * El nombre de la clase importada es `InputTextZ`, no `LibInputTextZComponent`: verificado en el
 * `.mjs` del paquete, el selector no predice el nombre de la clase.
 */
@Component({
  selector: 'zds-input',
  standalone: true,
  imports: [InputTextZ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      // `forwardRef` porque la clase todavía no está definida cuando se evalúa el decorador.
      useExisting: forwardRef(() => ZdsInput),
      multi: true,
    },
  ],
  template: `
    <div class="zds-field-wrap" [id]="strId" tabindex="-1">
      <lib-input-text-z
        [group]="grupo"
        [name]="name()"
        [label]="label()"
        [model]="model() ?? ''"
        (modelChange)="alCambiarModelo($event)"
        [inputType]="inputType()"
        [icon]="strIconoEfectivo()"
        [required]="required()"
        [readonly]="readOnly()"
        [helpText]="strTextoAyuda"
        [valid]="blnEnError"
        [manualValidation]="true"
      />
    </div>
  `,
})
export class ZdsInput extends CampoBase<string> {
  /**
   * Tipos que el template de la lib efectivamente traduce. Su expresión es una cadena de ternarios
   * que mapea `text|tel|email|url` y **cae a `'text'` para cualquier otra cosa**, así que ofrecer
   * `number`/`password` acá sería mentir: llegarían como texto. Se expone solo lo que funciona.
   */
  readonly inputType = input<'text' | 'email' | 'tel' | 'url'>('text');

  readonly icon = input<SizelessIconAttr | undefined>(undefined);

  /** Default de ícono para email — paridad con `strEffectiveIcon` de la fachada React. */
  protected readonly strIconoEfectivo = computed<SizelessIconAttr | undefined>(
    () => this.icon() ?? (this.inputType() === 'email' ? 'mail-closed:line' : undefined),
  );
}
