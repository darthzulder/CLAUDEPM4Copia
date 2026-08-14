import { Component, forwardRef, input, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextareaZ } from '@zurich-col/lib-zurich';
import { CampoBase } from './campo-base';

/**
 * Área de texto de la fachada. Envuelve `lib-textarea-z` y preserva el contrato de `ZdsTextarea` de
 * la fachada React (`elastic` con default `true`, `maxLength`, `readOnly`, `helpText`, `error`).
 *
 * ```html
 * <zds-textarea formControlName="qd_strDescription" name="qd_strDescription"
 *               label="Descripción del caso" [required]="true" />
 * ```
 *
 * ── El gotcha grave de `lib-textarea-z`: NO tiene `manualValidation` ────────────────────────
 * Verificado en el `.mjs`. Sus `inputs` son
 * `label lineType name model group helpText valid required disabled readonly maxLength maxNumber elastic`
 * — **`manualValidation` no está**. Y su `ngOnChanges` es:
 *
 * ```js
 * if (this.group.status == 'INVALID') { this.valid = true; this.validChange.emit(this.valid); }
 * ```
 *
 * O sea: **sin el `if (!manualValidation)` que sí tienen el input de texto, el select y el date.**
 * Como en esta lib `valid` significa `invalid` (su template hace `[invalid]="valid"`), el textarea
 * se pinta en rojo en cuanto **cualquier** campo del group es inválido, y no hay input para
 * apagarlo. En un form como la SCR-000 (~20 obligatorios) eso es "en rojo desde que monta".
 *
 * ── Un `[valid]` bindeado NO alcanza, y esto se midió ───────────────────────────────────────
 * El primer intento fue exactamente el que parece obvio: bindear `[valid]="blnEnError"` y confiar en
 * que Angular reescriba el input en cada ciclo, "después" de que la lib lo ensucie. **El spec salió
 * rojo** (`expected true to be false`) y con razón:
 *
 *  1. Angular escribe los inputs bindeados **antes** de llamar `ngOnChanges`, no después. Así que la
 *     lib siempre corre última y tiene la última palabra sobre su propia propiedad.
 *  2. Peor: el `if (this.group.status == 'INVALID')` está **fuera** del `if (changes.model)`, así que
 *     corre en **cualquier** `ngOnChanges` — o sea ante el cambio de cualquiera de sus 13 inputs.
 *  3. Y como el wrapper escribiría `false`, eso **es** un cambio de input, que dispara otro
 *     `ngOnChanges`, que vuelve a poner `true`. El binding no gana el empate: lo alimenta.
 *
 * **La neutralización real: escuchar `(validChange)` y devolver el valor correcto.** La lib emite
 * `validChange` cada vez que se auto-asigna, así que ese output es el único punto donde el wrapper
 * puede enterarse y corregir. `alCambiarValid()` reescribe `this.valid` sobre la instancia del hijo
 * cuando la lib lo puso en `true` y el `FormControl` propio dice que el campo está bien.
 *
 * Se escribe la propiedad del hijo directo (vía `viewChild`) en vez de bindear: es el mismo canal
 * que usa la lib, y así no se genera el bucle del punto 3 — no hay cambio de input, no hay
 * `ngOnChanges` nuevo. Es un parche sobre una lib que no ofrece la palanca (`manualValidation`) que
 * sus cuatro componentes hermanos sí tienen, y por eso el spec asevera el **resultado observable**
 * —un campo válido y tocado junto a otro inválido no queda marcado— y no el mecanismo: si mañana la
 * lib agrega `manualValidation`, el wrapper cambia y el spec tiene que seguir igual.
 *
 * ── El otro hallazgo: `lib-textarea-z` NO registra control en el group ──────────────────────
 * Su `ngOnInit` llama **solo** a `generateGroup()`; **nunca** a `generateControl()` (a diferencia de
 * `InputTextZ`/`InputSelectZ`/`InputDateZ`/`CheckboxZ`, que sí). Consecuencias:
 *  - No inventa ningún `name-<ts>-<n>`: no hay nada que adoptar y el group queda intacto.
 *  - **No compone validadores propios**, así que `required` acá es puramente visual (el asterisco
 *    del label). La validación efectiva vive donde ya vivía: `Validators.required` en el control.
 *  - `updateControl()` existe y sí corre por el `setTimeout` de `changes.model`, pero está guardado
 *    por `if (this.group.get(this.name))` — o sea que escribe el control **solo** porque el wrapper
 *    lo pre-creó. La `CampoBase` sigue siendo lo que hace que esto funcione.
 *
 * ── `maxLength` acá SÍ sirve, al revés que en `lib-input-text-z` ────────────────────────────
 * En el input de texto `maxLength`/`maxNumber` son inputs muertos. Acá **no**: el template hace
 * `[attr.max-length]="maxLength ? maxNumber : ''"`. O sea que `maxLength` es el **interruptor
 * booleano** y `maxNumber` el **número**, y hacen falta los dos. El wrapper esconde ese par detrás
 * de un único `maxLength: number` —que es el nombre y el tipo que usan las pantallas React— y
 * deriva el booleano. Igual que en el input de texto, el límite **efectivo** se declara como
 * `Validators.maxLength(n)` en el control; esto es el contador visual del DS.
 */
@Component({
  selector: 'zds-textarea',
  standalone: true,
  imports: [TextareaZ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZdsTextarea),
      multi: true,
    },
  ],
  template: `
    <div class="zds-field-wrap" [id]="strId" tabindex="-1">
      <lib-textarea-z
        #objHijo
        [group]="grupo"
        [name]="name()"
        [label]="label()"
        [model]="model() ?? ''"
        (modelChange)="alCambiarModelo($event)"
        (validChange)="alCambiarValid($event)"
        [required]="required()"
        [readonly]="readOnly()"
        [disabled]="deshabilitado()"
        [helpText]="strTextoAyuda"
        [valid]="blnEnError"
        [elastic]="elastic()"
        [maxLength]="blnConLimite"
        [maxNumber]="maxLength() ?? 0"
      />
    </div>
  `,
})
export class ZdsTextarea extends CampoBase<string> {
  /** Default `true`, igual que la fachada React (`elastic={elastic ?? true}`). */
  readonly elastic = input(true);

  /**
   * Largo máximo para el contador visual del DS. `undefined` = sin contador.
   *
   * Se expone como número —el contrato de React— y se traduce al par `maxLength`(bool) +
   * `maxNumber`(num) que la lib pide. Ver el bloque de la cabecera.
   */
  readonly maxLength = input<number | undefined>(undefined);

  /** El interruptor booleano que la lib llama, confusamente, `maxLength`. */
  protected get blnConLimite(): boolean {
    return this.maxLength() !== undefined;
  }

  private readonly objHijo = viewChild.required<TextareaZ>('objHijo');

  /**
   * Corrige el `valid` que la lib se auto-asignó mirando el group entero.
   *
   * Solo actúa en una dirección: cuando la lib lo puso en `true` (= "inválido", polaridad invertida)
   * pero el criterio de la fachada dice que el campo NO está en error. Nunca al revés — si el campo
   * sí está en error, el `true` de la lib coincide con lo que el wrapper quería y no hay nada que
   * hacer. Ese asimetría es lo que evita pisar un estado legítimo.
   *
   * Se escribe la propiedad del hijo en vez de bindear un input, a propósito: bindear reintroduce el
   * bucle `input cambia → ngOnChanges → valid = true → input cambia` descrito en la cabecera.
   */
  protected alCambiarValid(in_blnValid: boolean): void {
    if (in_blnValid && !this.blnEnError) {
      this.objHijo().valid = false;
    }
  }
}
