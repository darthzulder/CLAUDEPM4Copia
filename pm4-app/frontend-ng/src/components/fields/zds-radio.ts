import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ZaRadioSelect } from '@zurich/angular-components';
import { CampoZaBase, proveerAccessorDePaso } from './campo-za-base';

/** Opción tal como la escriben las pantallas hoy (mismo contrato que `ZdsSelect`). */
export interface OpcionZds {
  readonly value: string;
  readonly text?: string;
  readonly label?: string;
  readonly disabled?: boolean;
}

/** La forma que `za-radio-select` pasa tal cual al `z-radio-select` de Lit. */
interface OpcionZa {
  value: string;
  text: string;
  disabled?: boolean;
}

/**
 * Grupo de radios. Envuelve `za-radio-select` y preserva el contrato de `ZdsRadio` de la fachada
 * React (`options` con `text`/`label`, `inline`, `error`).
 *
 * ```html
 * <zds-radio formControlName="qd_strTipo" name="qd_strTipo" label="Tipo"
 *            [options]="cllTipos" [inline]="true" />
 * ```
 *
 * Extiende [`CampoZaBase`](./campo-za-base.ts), **no** `CampoBase`: el CVA es el nativo del
 * componente de Zurich y este wrapper solo le presta el `FormControl`. El porqué completo —y por qué
 * aportar un segundo `NG_VALUE_ACCESSOR` sería un bug silencioso— está en la cabecera de esa base.
 *
 * ── No hay `[group]` ni pre-creación de control, y eso es una simplificación real ──────────────
 * Todo el mecanismo de "pre-crear el control con el `name` real para que `generateControl()` lo
 * adopte" es específico de `lib-*-z`, que inventa nombres con `UtilService.getControlName()`.
 * `za-*` no recibe `[group]` ni registra nada: no existe el `name-<ts>-<n>` posible, así que acá no
 * hay nada que adoptar ni que aseverar sobre las claves del `FormGroup`.
 *
 * El `name` se sigue pidiendo porque el DS lo usa como atributo `name` de los `<input type=radio>`
 * —es lo que los agrupa entre sí en el navegador— y porque el `id` del wrap lo necesita.
 *
 * ── Lo que `za-radio-select` NO ofrece, y cómo se resuelve ────────────────────────────────────
 *  - **No hay input `disabled` por opción.** `disabled` a nivel de Angular existe solo para el grupo
 *    entero (viene de `ZaBaseInput`). El deshabilitado por opción viaja **dentro** de cada objeto de
 *    `[options]`, que el componente pasa sin tocar al web component de Lit — se respeta, pero es
 *    contrato del custom element, no un input verificable por el compilador. Por eso
 *    `cllOpcionesZa` lo preserva en vez de descartarlo (a diferencia de `ZdsSelect`, donde la lib
 *    emite un `<option>` pelado y no hay dónde ponerlo).
 *  - **No se expone un `disabled` de grupo acá.** El estado deshabilitado se gobierna desde el
 *    control (`control.disable()`), que es lo que el `setDisabledState` del CVA nativo ya traduce.
 *    Un input además sería un segundo camino para lo mismo, con precedencia ambigua entre los dos.
 *
 * ── `config` es `'inline' | undefined`, NO un string libre ────────────────────────────────────
 * El tipo real es `ZRadioSelect_Props['config'] = 'inline'` (opcional), verificado en
 * `@zurich/dev-utils/code/RadioSelect.props.d.ts`. O sea que **`''` no es un valor válido** — el
 * primer borrador de este wrapper mandaba `''` como "no inline" y el compilador de plantillas lo
 * rechazó con `TS2322`. El "sin config" se expresa con `undefined`, que es lo que significa el prop
 * opcional y lo que Angular omite al escribir la propiedad.
 *
 * Vale anotarlo porque el error **solo aparece al compilar los specs**: `npm run lint` (eslint +
 * `tsc -p tsconfig.app.json`) pasaba en verde. Es el mismo tipo de hueco que el gate 1 ya encontró
 * con `test-setup.ts` fuera del programa de TypeScript.
 */
@Component({
  selector: 'zds-radio',
  standalone: true,
  imports: [ReactiveFormsModule, ZaRadioSelect],
  // Accessor de paso: habilita el `formControlName` de la pantalla sin escribir el control. El
  // `useExisting` apunta a esta clase concreta, no a `CampoZaBase` — ver `proveerAccessorDePaso`.
  providers: [proveerAccessorDePaso(() => ZdsRadio)],
  template: `
    <div class="zds-field-wrap" [id]="strId" tabindex="-1">
      <za-radio-select
        [formControl]="control"
        [name]="name()"
        [label]="label()"
        [options]="cllOpcionesZa()"
        [required]="required()"
        [invalid]="blnEnError"
        [help-text]="strTextoAyuda"
        [config]="strConfig()"
      />
    </div>
  `,
})
export class ZdsRadio extends CampoZaBase {
  readonly options = input<readonly OpcionZds[]>([]);

  /** Radios en una fila en vez de apilados. En React era `config: 'inline'`. */
  readonly inline = input(false);

  /**
   * `text ?? label ?? value`: mismo orden de precedencia que la fachada React, así una pantalla
   * portada no cambia de etiqueta.
   */
  protected readonly cllOpcionesZa = computed<OpcionZa[]>(() =>
    this.options().map((in_objOpcion) => ({
      value: in_objOpcion.value,
      text: in_objOpcion.text ?? in_objOpcion.label ?? in_objOpcion.value,
      disabled: in_objOpcion.disabled,
    })),
  );

  protected readonly strConfig = computed<'inline' | undefined>(() =>
    this.inline() ? 'inline' : undefined,
  );
}
