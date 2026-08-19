import { ChangeDetectionStrategy, Component, contentChild, ElementRef, input } from '@angular/core';
import { ZrIcon } from './fields/zds-reexports';

/**
 * Card de un archivo ya existente: ícono + nombre + meta + acciones, con cuerpo expandible opcional.
 * Port de `components/DocCard.tsx`.
 *
 * ── Cuatro slots, y uno de ellos NO es contenido proyectado ──────────────────────────────────────
 * React recibía `fileName` (string), `meta` y `actions` (`ReactNode`), y `children` para el cuerpo.
 * `meta` y `actions` pasan a `ng-content select="[meta]"` / `select="[actions]"`; el cuerpo pasa a
 * `select="[viewer]"`. `fileName` se queda como `input` porque es un string, no markup.
 *
 * El `viewer` lleva `select` en vez de ser el catch-all —al revés de lo que hace `FormSection`— por
 * lo que se explica abajo: el componente necesita **saber si el cuerpo existe**, y para eso hay que
 * poder consultarlo con un `contentChild`.
 *
 * ── ⚠ El cuerpo se monta solo si está abierto Y HAY cuerpo (`contentChild`, no `:empty`) ──────────
 * La condición de React era `{isOpen && children && (<div className="doc-viewer">…</div>)}`: los dos
 * términos, no solo `isOpen`. Con `ng-content` a secas eso no se puede replicar, porque el wrapper
 * existe siempre y el componente no se enteraría de si la pantalla proyectó algo.
 *
 * `FormSection` resolvió su caso equivalente con `:empty { display: none }`, pero acá **ese truco no
 * sirve**: `.doc-viewer` tiene `padding: var(--zs-100)` y `background` propio (verificado en
 * `shared.css`), así que un wrapper vacío se vería como una **banda gris de relleno** debajo del
 * header. `:empty` lo taparía en el navegador, sí, pero el motivo por el que acá se elige otro camino
 * es distinto: se necesita la condición **en el template**, no solo en el CSS, porque es la que decide
 * si se aplica también la clase `is-open` del header (que pinta borde y fondo azul). Una sola fuente
 * de verdad para las dos cosas.
 *
 * Por eso el cuerpo va con `select="[viewer]"` y un `contentChild` que lo detecta: `tieneViewer()` es
 * `true` solo si la pantalla proyectó un nodo con el atributo `viewer`. Cuesta un `contentChild` (que
 * se resuelve una vez, no en cada ciclo) y devuelve exactamente la semántica del original.
 *
 * ── El ícono es fijo, igual que en React ─────────────────────────────────────────────────────────
 * `file-blank:line` con `config="l"` está hardcodeado en el original y se preserva: la card es "un
 * archivo", no "un archivo de tipo X". Si alguna pantalla necesitara diferenciar por extensión, eso es
 * un cambio funcional y va con su propio pedido.
 *
 * ⚠ `ZrIcon` (`za-icon`) usa el input **`icon`**, no `name` — y Angular 21 lo hace fallar duro con
 * `NG8008` si falta, así que el nombre está verificado contra el paquete, no supuesto.
 */
@Component({
  selector: 'app-doc-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="doc-card" [class.is-open]="mostrarViewer()">
      <div class="doc-card-header">
        <za-icon icon="file-blank:line" config="l" />
        <div class="doc-info">
          <div class="doc-name">{{ fileName() }}</div>
          <div class="doc-meta"><ng-content select="[meta]" /></div>
        </div>
        <div class="doc-actions"><ng-content select="[actions]" /></div>
      </div>
      <!-- Ver el ⚠ del componente: la condición es "abierto Y hay cuerpo", igual que el
           isOpen && children de React. El @if envuelve al ng-content, así que el wrapper con
           padding no se monta cuando no hay nada que mostrar. -->
      @if (mostrarViewer()) {
        <div class="doc-viewer"><ng-content select="[viewer]" /></div>
      }
    </div>
  `,
  imports: [ZrIcon],
})
export class DocCardComponent {
  public readonly fileName = input.required<string>();

  /** Si la card está expandida. La pantalla la gobierna; el componente no guarda estado propio. */
  public readonly isOpen = input<boolean>(false);

  /**
   * El nodo del cuerpo, si la pantalla proyectó uno.
   *
   * Se pide con `{ descendants: false }` porque el `[viewer]` es hijo directo del contenido
   * proyectado: buscar en profundidad haría que un `[viewer]` anidado dentro del `[actions]` contara
   * como cuerpo.
   */
  private readonly viewer = contentChild('viewer', {
    read: ElementRef,
    descendants: false,
  });

  /**
   * `true` cuando hay que pintar el cuerpo: abierta **y** con contenido proyectado.
   *
   * Gobierna las dos cosas a la vez —el `.doc-viewer` y la clase `is-open` del header— para que no
   * puedan divergir: una card con el header azul de "abierta" y sin cuerpo debajo se lee como un
   * error de carga.
   */
  protected mostrarViewer(): boolean {
    return this.isOpen() && this.viewer() !== undefined;
  }
}
