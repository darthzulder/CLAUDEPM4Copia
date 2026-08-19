import { Component, computed, effect, input, viewChild } from '@angular/core';
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
    <!-- zds-field-bare, no zds-field-wrap: React renderiza el radio SIN div envolvente, así que no le
         corresponde el piso de 68px de la caja pill+helpText (medido: 52px reales → 68px, y ese +16
         era todo el delta de alto de la SCR-011). El div se queda porque es donde vive el id.

         (Sin comillas invertidas a propósito: una backtick acá cierra el template literal.) -->
    <div class="zds-field-bare" [id]="strId" tabindex="-1">
      <za-radio-select
        #objHijo
        [formControl]="control"
        [name]="name()"
        [label]="label()"
        [options]="cllOpcionesZa()"
        [invalid]="blnEnError"
        [help-text]="strTextoAyuda"
        [config]="strConfig()"
        [locale]="strLocale"
      />
    </div>
  `,
})
export class ZdsRadio extends CampoZaBase {
  /**
   * El asterisco se escribe por código, no con `[required]` en la plantilla, y **el renombre del
   * input público no alcanzaba para esto**. Es la segunda mitad del mismo defecto: el selector del
   * `RequiredValidator` de Angular es `[required][formControlName]` **y también**
   * `[required][formControl]`, y acá `[formControl]="control"` es el control **de la pantalla** (esta
   * base lo presta, no lo copia — ver la cabecera de `CampoZaBase`). O sea que un `[required]` sobre
   * este mismo elemento matchea igual y le filtra `{required: true}` al control, aunque el input de
   * la fachada ya se llame `obligatorio`.
   *
   * No sirve `[attr.required]`: `required` es un **input** de `ZaBaseInput` (verificado en
   * `dist/fesm2022/angular.mjs`), y un binding de atributo no ejecuta el setter — el mismo pozo que
   * ya está documentado para `max-length` en `zds-textarea.ts`. Y tampoco sirve clonar el control:
   * el CVA nativo del `za-*` tiene que escribir sobre el objeto real de la pantalla.
   *
   * Queda entonces escribir la propiedad del hijo, que es el mismo canal que usa el DS y la misma
   * técnica que `alCambiarValid()` en `zds-textarea.ts`. Sin el atributo literal en la plantilla el
   * directivo no puede matchear. La guarda es `zds-required.spec.ts`, que es quien encontró esto.
   */
  private readonly objHijo = viewChild.required<ZaRadioSelect>('objHijo');

  constructor() {
    super();
    effect(() => {
      this.objHijo().required = this.obligatorio();
    });
  }

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
