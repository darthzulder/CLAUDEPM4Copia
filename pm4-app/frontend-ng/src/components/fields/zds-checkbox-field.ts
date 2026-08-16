import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CheckboxZ } from '@zurich-col/lib-zurich';
import { CampoBase } from './campo-base';

/**
 * Checkbox de la fachada. Envuelve `lib-checkbox-z` y preserva el contrato de `ZdsCheckboxField` de
 * la fachada React, incluido el par `checkedValue`/`uncheckedValue`.
 *
 * ```html
 * <!-- booleano puro -->
 * <zds-checkbox-field formControlName="qd_blnAcepta" name="qd_blnAcepta" label="Acepto" />
 * <!-- respaldando un contrato de texto de PM4 -->
 * <zds-checkbox-field formControlName="qd_strAutoriza" name="qd_strAutoriza" label="Autorizo"
 *                     checkedValue="SI" uncheckedValue="NO" />
 * ```
 *
 * ── Por qué existe `checkedValue`/`uncheckedValue` ──────────────────────────────────────────
 * Hay campos de PM4 que guardan un **contrato de texto** (`'SI'`/`'NO'`) y se muestran como
 * checkbox. Sin esto, el control guardaría `true`/`false` y el proceso recibiría un tipo que no
 * espera — que es exactamente la clase de rotura que la regla 1 de CLAUDE.md previene. El mapeo va
 * en el wrapper, no en la pantalla, para que ninguna pantalla lo reimplemente distinto.
 *
 * ── Gotchas de `lib-checkbox-z`, y son los más distintos de los cinco campos ────────────────
 *  - **NO tiene `manualValidation`** (igual que el textarea), pero **su problema es otro y menos
 *    grave**: no mira `group.status` en `ngOnChanges`. En vez de eso, su `ngOnInit` se suscribe a
 *    `statusChanges` del control **propio** y hace `this.valid = status === 'INVALID' ? false : true`.
 *    Dos cosas se siguen de ahí: (a) el estado lo decide el control propio, no el group entero, así
 *    que **no hay contagio entre campos** y no hace falta neutralizar nada; (b) **acá `valid`
 *    significa `valid`** — polaridad NO invertida, al revés que en el input de texto, el textarea y
 *    el date. Es el segundo componente con polaridad distinta (el otro es el select, con `invalid`).
 *  - **`valid` no llega al DOM de todos modos.** Su template pasa
 *    `id name label help-text ngModel required` a `za-checkbox` y **nada más**: no hay `[invalid]`.
 *    O sea que el estado de error de este componente **no se pinta**. Por eso el wrapper **no**
 *    bindea `valid`: sería un binding sin efecto, y bindearlo "por si acaso" invitaría a que alguien
 *    lo copie a un componente donde la polaridad sí está invertida. El pintado del error de un
 *    checkbox, si hace falta, es del contenedor (`FormSection`), no de este control.
 *  - **`disabled` y `showHelpText` son inputs MUERTOS.** Están declarados con default `false` y no
 *    se leen en ninguna parte (verificado). `readonly` no existe siquiera como input (0
 *    ocurrencias). Ninguno se bindea. `helpText` **sí** funciona: viaja como `[help-text]`.
 *  - **`eventChange` reemite el `change` crudo del DOM** además del `modelChange`. No se usa: el
 *    valor ya llega por `modelChange` y engancharse a los dos duplicaría escrituras al control.
 *
 * ── El gotcha peor, y NO se puede desactivar: `validRequired()` está INVERTIDO ───────────────
 * `generateControl()` compone un validador propio sobre el control, y ese validador es:
 *
 * ```js
 * generateValidation() { if (this.validRequired()) return { errorRequired: true }; return null; }
 * validRequired()     { return this.required && this.model; }   // ← sin negación
 * ```
 *
 * O sea que con `required` en `true` la lib marca `errorRequired` **cuando el checkbox SÍ está
 * tildado**, y lo deja limpio cuando está vacío — exactamente al revés de lo que un obligatorio
 * significa. Y como este componente no tiene `manualValidation`, no hay input que apague la
 * composición: el validador entra siempre que se pase `required`.
 *
 * **Consecuencia para las pantallas, y es una regla, no una sugerencia:** la obligatoriedad de un
 * checkbox se declara **solo** con `Validators.requiredTrue` en el `FormControl`, y **`required` se
 * usa únicamente por su efecto visual** (el asterisco del label). Si además se pasara `required`
 * esperando que valide, el form quedaría inválido justo cuando el usuario acepta. El wrapper no lo
 * neutraliza a propósito: interceptar el validador de la lib significaría pisar el `setValidators`
 * que ella misma compone, y eso rompería la adopción de validadores del padre —que es la pieza sobre
 * la que se apoya toda la fachada (ver el gate 0)— para arreglar un caso que la pantalla ya resuelve
 * declarando bien el control. Queda documentado acá y aseverado en el spec.
 */
@Component({
  selector: 'zds-checkbox-field',
  standalone: true,
  imports: [CheckboxZ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZdsCheckboxField),
      multi: true,
    },
  ],
  template: `
    <div class="zds-field-wrap" [id]="strId" tabindex="-1">
      <lib-checkbox-z
        [group]="grupo"
        [name]="name()"
        [label]="label()"
        [model]="blnTildado"
        (modelChange)="alCambiarTildado($event)"
        [required]="obligatorio()"
        [helpText]="strTextoAyuda"
      />
    </div>
  `,
})
export class ZdsCheckboxField extends CampoBase<string | boolean> {
  /** Valor a guardar cuando se tilda. Si no se pasa, el campo es un booleano puro. */
  readonly checkedValue = input<string | undefined>(undefined);
  readonly uncheckedValue = input<string | undefined>(undefined);

  /**
   * ── El único de los cinco campos que NO le pasa a la lib el `FormGroup` de la pantalla ──────
   *
   * Los otros cuatro wrappers adoptan el group real del padre, y eso es lo correcto: hace que la
   * composición de validadores de `generateControl()` respete los `Validators` que la pantalla puso.
   * Acá se hace al revés a propósito, y son **dos** razones independientes, las dos medidas:
   *
   *  1. **La lib es un segundo escritor, y acá escribe el tipo equivocado.** `updateControl()` hace
   *     `group.get(name).setValue(this.model)`, y el `model` que este wrapper le pasa es el
   *     **booleano** que el `za-checkbox` necesita (`blnTildado`). Con el group real, ese `setValue`
   *     pisa el contrato de texto de PM4: un campo declarado `'SI'`/`'NO'` termina en `false`.
   *     Medido: con el group compartido, `qd_strAutoriza` pasaba de `'NO'` a `false` solo por montar.
   *     Es el único wrapper afectado porque es el único que **transforma** el valor — en el input, el
   *     select, el textarea y el date la lib reescribe el mismo valor que recibió, así que ahí es
   *     redundante y no destructiva (también medido, en los cuatro).
   *  2. **`validRequired()` está invertido** (ver el bloque de la cabecera) y no hay
   *     `manualValidation` para apagarlo. Con el group satélite ese validador se compone sobre el
   *     control satélite, no sobre el de la pantalla, así que el bug de la lib deja de poder marcar
   *     `errorRequired` en el form real. **Esto no cambia la regla para las pantallas**: la
   *     obligatoriedad se sigue declarando con `Validators.requiredTrue` en el `FormControl`, que es
   *     donde de verdad vive. Simplemente ya no hay que confiar en que nadie pase `required`.
   *
   * Lo que se pierde: este campo no participa de la composición de validadores de la lib. Para un
   * checkbox eso es exactamente lo deseado —el único validador que la lib aporta está roto—, así que
   * el intercambio es favorable. Para cualquier otro campo NO lo sería, y por eso el override vive
   * acá y no en `CampoBase`.
   *
   * El control real de la pantalla queda con **un solo escritor**: el CVA, vía `alCambiarTildado`.
   */
  protected override get grupo() {
    return this.grupoPropio();
  }

  /**
   * Lo que el componente del DS necesita: un booleano. Se deriva del valor del control, que puede
   * ser un booleano o una de las dos cadenas del contrato.
   *
   * El criterio es el de la fachada React: **si `checkedValue` está definido, la comparación es
   * contra él** (`field.value === checkedValue`); si no, es la veracidad del valor. Importa que sea
   * en ese orden y no `!!valor`: con el contrato `'SI'`/`'NO'`, la cadena `'NO'` es **truthy**, así
   * que un `!!` pintaría el checkbox tildado justo cuando el usuario dijo que no.
   */
  protected get blnTildado(): boolean {
    const mixValor = this.model();
    return this.checkedValue() !== undefined ? mixValor === this.checkedValue() : !!mixValor;
  }

  /** Traduce el booleano del DS al valor que el control tiene que guardar. */
  protected alCambiarTildado(in_blnTildado: boolean | null): void {
    const blnTildado = !!in_blnTildado;

    if (this.checkedValue() !== undefined || this.uncheckedValue() !== undefined) {
      this.alCambiarModelo(blnTildado ? (this.checkedValue() ?? '') : (this.uncheckedValue() ?? ''));
      return;
    }

    this.alCambiarModelo(blnTildado);
  }
}
