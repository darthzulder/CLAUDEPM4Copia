import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZrButton, ZrModal, ZrTemplate } from '../../../../components/fields/zds-reexports';

/**
 * Popup de confirmación previo al envío a SmartSupervision. Porte del `ZrModal` que
 * `FormularioSuperintendencia.tsx` rinde al pie: el envío **cierra el caso**, así que media una
 * confirmación explícita en vez de un submit directo.
 *
 * El componente no conoce el formulario ni el envío: recibe `abierto`/`enviando` y emite `atras` y
 * `confirmar`. La pantalla es la que decide qué hacer, igual que en React (`setBlnShowConfirm` +
 * `onConfirmarEnvio`).
 *
 * ── Las tres trampas de `lib-modal-z`, y cómo las esquiva esta plantilla ─────────────────────────
 *  1. **El modal monta SIEMPRE y el `@if` va ADENTRO del slot.** Los slots se leen una única vez en
 *     `ngAfterContentInit` vía `@ContentChildren(ZTemplate)`; si el `lib-modal-z` naciera detrás de un
 *     `@if`, en el momento en que ese `@if` se abre el modal ya perdió su oportunidad de indexar el
 *     contenido y se abriría **vacío**.
 *  2. **`ZrTemplate` tiene que estar en `imports`.** Sin él el `libZTemplate` no matchea ninguna
 *     directiva, el slot nunca se registra y el modal también abre vacío — sin error de compilación
 *     y sin nada en consola.
 *  3. **Se escucha `(close)` y no se ata `[open]` en dos vías.** `change()` del propio componente
 *     muta su input `open`, así que un `[open]` de una sola vía se desincroniza en cuanto el usuario
 *     cierra por el backdrop o por la X: el padre seguiría creyendo que está abierto. React tenía el
 *     mismo contrato con `onChange`.
 *
 * ── Sin márgenes propios: el gap va por `z-flex` ────────────────────────────────────────────────
 * React separaba el título y el párrafo con `style={{ margin: '0 0 var(--zs-100)' }}` en el JSX. Acá
 * el contenedor es `z-flex="col:150"`, que es el primitivo del DS para exactamente eso (regla: el
 * layout se hace con `z-flex`/`z-align`, no con márgenes a mano) y es además lo que ya hace el modal
 * de la OS_SCR-003. El único estilo nombrado es `.modal-titulo`, que ya existe y traduce el shorthand
 * del título — el `--zf-h-20--700` que React escribía **no existe** en la escala del DS e invalidaba
 * todo el `font` (ver la nota de `.pqr-modal-title` en `shared.css`).
 */
@Component({
  selector: 'app-confirmar-envio-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZrButton, BotonHabilitado, ZrModal, ZrTemplate],
  template: `
    <lib-modal-z [open]="abierto()" tamanio="m" (close)="atras.emit()">
      <ng-template libZTemplate id="content">
        @if (abierto()) {
          <div z-flex="col:150">
            <h3 class="modal-titulo">Confirmar envío a SmartSupervision</h3>
            <p>
              ¿Está seguro de enviar estos datos? Se enviarán a <strong>SmartSupervision (SFC)</strong>
              y el caso quedará <strong>cerrado</strong>. Esta acción no se puede deshacer.
            </p>

            <div z-flex="75" z-align="right:center">
              <!-- [disabled] explícito en los dos: el default de ButtonZ es true, así que un botón sin
                   el binding nace deshabilitado y no hay forma de confirmar.
                   (Sin comillas invertidas a propósito: una backtick acá cierra el template literal, y
                   escaparla no alcanza — la secuencia igual entra al HTML y Angular la lee como una
                   interpolación, que es el TS2349/TS2304 que este comentario provocó al escribirse.) -->
              <lib-button-z
                label="Atrás"
                [type]="'secondary'"
                [disabled]="enviando()"
                (eventClick)="atras.emit()"
              />
              <lib-button-z
                label="Enviar ▶"
                [type]="'positive'"
                [disabled]="enviando()"
                [loading]="enviando()"
                (eventClick)="confirmar.emit()"
              />
            </div>
          </div>
        }
      </ng-template>
    </lib-modal-z>
  `,
})
export class ConfirmarEnvioModal {
  readonly abierto = input.required<boolean>();

  /** Envío en curso: bloquea los dos botones y pone el spinner en el de confirmar. */
  readonly enviando = input(false);

  /** "Atrás", la X del modal y el click en el backdrop — los tres cierran sin enviar. */
  readonly atras = output<void>();

  readonly confirmar = output<void>();
}
