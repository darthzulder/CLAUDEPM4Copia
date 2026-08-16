import { Component, computed, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputSelectZ } from '@zurich-col/lib-zurich';
import { CampoBase } from './campo-base';

/** Opción tal como la escriben las pantallas hoy (contrato de la fachada React). */
export interface OpcionZds {
  readonly value: string;
  readonly text?: string;
  readonly label?: string;
  readonly disabled?: boolean;
}

/** La forma que `lib-input-select-z` espera en `[options]`: `value` + `description`. */
interface OpcionLib {
  value: string;
  description: string;
}

/**
 * Select de la fachada. Envuelve `lib-input-select-z` y preserva el contrato de `ZdsSelect` de la
 * fachada React (`options` con `text`/`label`, `placeholder`, `loading`, `withSearch`).
 *
 * ```html
 * <zds-select formControlName="qd_strChannel" name="qd_strChannel" label="Canal"
 *             [options]="cllCanales" placeholder="Seleccione..." />
 * ```
 *
 * ── Gotchas de `lib-input-select-z`, TODOS distintos a los de `lib-input-text-z` ─────────────
 * Verificados en `fesm2022/zurich-col-lib-zurich.mjs`. Este componente **no** es el mismo caso que
 * el input de texto, y asumir que sí era el error más fácil de cometer acá:
 *
 *  - **`invalid` significa `invalid`.** A diferencia de `lib-input-text-z`/`lib-textarea-z`/
 *    `lib-input-date-z` —donde el input se llama `valid` y se pasa como `[invalid]`— acá el input
 *    ya se llama `invalid` y llega como `[invalid]="invalid"`. **La polaridad NO se invierte.**
 *    Se le pasa `blnEnError` derecho, sin negar.
 *  - **`options` usa `description`, no `text` ni `label`.** Su template hace
 *    `<option [value]="item.value">{{item.description}}</option>`; una opción con `text` renderiza
 *    la etiqueta **vacía** sin fallar — falso verde silencioso. Por eso `cllOpcionesLib` traduce.
 *  - **`disable` (sin "d" final) es un input MUERTO.** Existe y arranca en `false`, pero no se lee
 *    en ninguna parte de la clase ni del template (verificado: 3 ocurrencias, todas de la
 *    declaración). O sea que ni `disable` ni `disabled` deshabilitan este select. Se documenta y
 *    **no se bindea**, para no ofrecer un prop que no hace nada. El plan decía "usa `disable`, no
 *    `disabled`" — es cierto en cuanto al nombre, pero incompleto: ninguno de los dos funciona.
 *  - **`manualValidation` SÍ existe acá** (a diferencia de textarea/checkbox), y hace falta por el
 *    mismo motivo que en el input de texto: sin él, `ngOnChanges` hace
 *    `if (!manualValidation && group.status == 'INVALID') this.invalid = true`, marcando en error un
 *    select correcto porque otro campo del form es inválido.
 *  - **`multiSelect` cambia el elemento interno**, no solo el modo: `za-multiselect` en vez de
 *    `za-select`, y esa rama **no** pasa `help-text`. Se expone igual porque las pantallas lo usan,
 *    con el límite documentado.
 *  - **`typeLine`, no `lineType`.** El textarea y el date usan `lineType`; este usa `typeLine`. Los
 *    tres significan lo mismo. No hay razón, hay que escribirlo como está.
 */
@Component({
  selector: 'zds-select',
  standalone: true,
  imports: [InputSelectZ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZdsSelect),
      multi: true,
    },
  ],
  template: `
    <div class="zds-select-wrap" [id]="strId" tabindex="-1">
      <lib-input-select-z
        [group]="grupo"
        [name]="name()"
        [label]="label()"
        [model]="model() ?? ''"
        (modelChange)="alCambiarModelo($event)"
        [options]="cllOpcionesLib()"
        [multiSelect]="multiSelect()"
        [required]="obligatorio()"
        [helpText]="strTextoAyudaSelect"
        [invalid]="blnEnError"
        [manualValidation]="true"
      />
    </div>
  `,
})
export class ZdsSelect extends CampoBase<string> {
  readonly options = input<readonly OpcionZds[]>([]);

  /**
   * Prompt del select. **Redeclara el `placeholder` de `CampoBase` a propósito** (de ahí el
   * `override`): en los demás campos el placeholder es un passthrough al atributo del input, pero
   * `lib-input-select-z` no tiene ningún input de placeholder — acá se implementa como una primera
   * `<option>` de valor vacío, que es el mismo truco que usa la fachada React.
   *
   * Diferencia con React que vale conocer: allá esa opción va con `disabled: true` para que no se
   * pueda re-seleccionar. Acá la lib emite `<option [value]="...">` **sin** `[disabled]`, así que el
   * prompt es elegible y volver a elegirlo deja el campo vacío. Eso lo atrapa `Validators.required`
   * en el control, que es donde el proyecto ya declara la obligatoriedad.
   */
  override readonly placeholder = input<string>('');

  readonly multiSelect = input(false);

  /**
   * `true` mientras las opciones se cargan de una colección PM4. En React deshabilitaba el select y
   * mostraba "Cargando opciones..." como help-text. Acá **solo** hace lo segundo: el select no se
   * puede deshabilitar (ver el gotcha de `disable` arriba). Se deja el prop porque el texto de carga
   * sí es visible y las pantallas lo pasan; lo que no se puede es prometer el disabled.
   */
  readonly loading = input(false);

  /**
   * Traduce las opciones de la fachada al par `{value, description}` que la lib renderiza.
   *
   * `text ?? label ?? value` replica exactamente el orden de la fachada React, así que una pantalla
   * portada no cambia de etiqueta. `disabled` por opción **se descarta**: la lib emite un
   * `<option>` pelado sin `[disabled]`, así que no hay dónde ponerlo — salvo el placeholder, que la
   * lib tampoco puede deshabilitar y por eso queda como primera opción de valor vacío.
   */
  protected readonly cllOpcionesLib = computed<OpcionLib[]>(() => {
    const cllBase: OpcionLib[] = this.options().map((in_objOpcion) => ({
      value: in_objOpcion.value,
      description: in_objOpcion.text ?? in_objOpcion.label ?? in_objOpcion.value,
    }));

    return this.placeholder()
      ? [{ value: '', description: this.placeholder() }, ...cllBase]
      : cllBase;
  });

  /** El error explícito manda; si no, el texto de carga; si no, el `helpText`. Orden de React. */
  protected get strTextoAyudaSelect(): string {
    if (this.error()) return this.error();
    if (this.loading()) return 'Cargando opciones...';
    return this.helpText();
  }
}
