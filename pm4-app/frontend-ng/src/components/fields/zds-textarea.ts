import {
  afterRenderEffect,
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextareaZ } from '@zurich-col/lib-zurich';
import { CampoBase } from './campo-base';

/**
 * Área de texto de la fachada. Envuelve `lib-textarea-z` y preserva el contrato de `ZdsTextarea` de
 * la fachada React (`elastic` con default `true`, `maxLength`, `readOnly`, `helpText`, `error`).
 *
 * ```html
 * <zds-textarea formControlName="qd_strDescription" name="qd_strDescription"
 *               label="Descripción del caso" [obligatorio]="true" />
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
 *  - **No compone validadores propios.** Su `generateControl()` existe pero es código muerto: nadie
 *    lo llama. Así que el `[required]` que este wrapper le pasa adentro es puramente visual — el
 *    asterisco del rótulo—, y la validación efectiva vive donde ya vivía: en el `FormControl`.
 *
 *    ⚠ **De acá se sacó una conclusión falsa y costó un diagnóstico entero, así que queda escrito.**
 *    Se leyó como "entonces marcar el campo no puede agregar validadores", y una pantalla apareció
 *    con `{required: true}` en un control sin un solo validador declarado. La fuga no venía de la lib
 *    ni del `[group]`: venía de la **plantilla de la pantalla**, que escribía
 *    `<zds-textarea formControlName="…" [required]="true" />` — exactamente el selector del
 *    `RequiredValidator` de Angular. Se probó con un A/B de dos hosts idénticos salvo ese atributo
 *    (`CON errors={"required":true}` · `SIN errors=null`), y antes se descartó a este wrapper
 *    clavándole `[required]="false"` adentro sin que la fuga cesara. Por eso el input público se
 *    llama **`obligatorio`**: ver el docstring de `CampoBase.obligatorio`.
 *  - `updateControl()` existe y sí corre por el `setTimeout` de `changes.model`, pero está guardado
 *    por `if (this.group.get(this.name))` — o sea que escribe el control **solo** porque el wrapper
 *    lo pre-creó. La `CampoBase` sigue siendo lo que hace que esto funcione.
 *
 * ── `maxLength`: el par bool+num de la lib, y el contador que NO llega solo ──────────────────
 * En el input de texto `maxLength`/`maxNumber` son inputs muertos. Acá **casi** sirven: el template
 * de `lib-textarea-z` hace `[attr.max-length]="maxLength ? maxNumber : ''"`, así que `maxLength` es
 * el **interruptor booleano** y `maxNumber` el **número**, y hacen falta los dos. El wrapper esconde
 * ese par detrás de un único `maxLength: number` —el nombre y el tipo que usan las pantallas React—
 * y deriva el booleano. El límite **efectivo** se declara como `Validators.maxLength(n)` en el
 * control; esto es solo el contador visual del DS (`15/2000`).
 *
 * **Pero el par no alcanza, y el contador no se pinta.** El `[attr.max-length]` de la lib es un
 * binding de **atributo**, y `za-textarea` declara ese input como **propiedad**
 * (`inputs: { maxLength: ["max-length", "maxLength"] }`). En Angular un `[attr.x]` escribe el
 * atributo del DOM y **no** ejecuta el setter del input del hijo, así que `ZaTextarea.maxLength`
 * queda `undefined` y el `[max-length]="maxLength"` que ese template reenvía al `z-textarea` —el
 * elemento de Lit que de verdad pinta el contador— empuja `undefined`. El atributo queda visible en
 * el `za-textarea` (parece cableado) pero muere ahí: es un bug de `lib-zurich`, no de la fachada.
 *
 * Medido en el navegador contra React lado a lado: React pone `max-length="2000"` **en el
 * `z-textarea`** y su shadow root pinta `0/2000`; Angular lo tenía en el `za-textarea` y no pintaba
 * nada. Poniendo el atributo a mano en el `z-textarea` de Angular el contador apareció al instante
 * (`15/2000` con 15 caracteres tipeados). De ahí el parche de abajo.
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
        [required]="obligatorio()"
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

  private readonly objAnfitrion = inject(ElementRef<HTMLElement>);

  constructor() {
    super();

    // Repone el `max-length` sobre el `z-textarea`, que es el único lugar donde el DS lo lee para
    // pintar el contador. Ver el bloque de la cabecera: el `[attr.max-length]` de `lib-textarea-z`
    // escribe el atributo del `za-textarea` sin ejecutar su setter, así que el valor nunca baja al
    // elemento de Lit y el contador no aparece.
    //
    // Va en `afterRenderEffect` y no en `ngAfterViewInit` por dos motivos: el `z-textarea` lo pinta
    // el template de `za-textarea`, o sea dos niveles abajo y no necesariamente presente en el
    // primer pasaje; y `maxLength()` es un signal input que puede cambiar, así que el efecto se
    // re-ejecuta solo. Es DOM directo por la misma razón que `alCambiarValid()` escribe la propiedad
    // del hijo: la lib no ofrece la palanca y bindear no gana.
    afterRenderEffect(() => {
      const numLimite = this.maxLength();

      const objTextarea = (this.objAnfitrion.nativeElement as HTMLElement).querySelector(
        'za-textarea z-textarea',
      );
      if (!objTextarea) return;

      if (numLimite === undefined) {
        objTextarea.removeAttribute('max-length');
        return;
      }

      objTextarea.setAttribute('max-length', String(numLimite));
    });
  }

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
