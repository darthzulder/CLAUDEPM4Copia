import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  ChangeDetectionStrategy, Component, computed, input, output, TemplateRef, viewChild,
} from '@angular/core';
import { ZdsStatusBadge } from '../../../../components/fields/zds-status-badge';
import { ZrButton, ZrModal, ZrTemplate } from '../../../../components/fields/zds-reexports';
import { InfoBarComponent, type InfoBarItem } from '../../../../components/info-bar';
import { diasRestantesTexto, estadoVariante } from './dashboard-helpers';
import type { CasoDashboard } from '../fields/types';

/**
 * Modal de detalle de caso (SCR-013 · modal PAN-13). Vista de solo lectura del expediente resumido.
 * Port de `DetalleCasoModal.tsx`.
 *
 * ── Es el caso que justificó el `TemplateRef` de `InfoBar` ───────────────────────────────────────
 * La fila "Estado" de la barra no es texto: es la píldora del DS. En React eso era un `ReactNode`
 * dentro del item; acá va como `TemplateRef`, que es el mecanismo que `info-bar.ts` expone
 * justamente por esta pantalla (ver el ⚠ de su docstring). La plantilla declara el
 * `<ng-template #tplEstado>` y el `computed()` lo mete en el item — así el estado se sigue viendo
 * como píldora y no como texto pelado, que sería un cambio funcional encubierto.
 *
 * ── El `TemplateRef` obliga a que los items se armen en la plantilla, no acá ──────────────────────
 * `cllItems` es un `computed()`, pero necesita el `TemplateRef` del `<ng-template>`, que solo existe
 * después de que la vista se creó. Se resuelve con un `viewChild` de señal: el `computed()` lo lee y
 * se recalcula cuando aparece. Mientras no exista (primer pase), la fila Estado cae al texto del
 * estado, que es información correcta — no un hueco.
 */
@Component({
  selector: 'app-detalle-caso-modal',
  standalone: true,
  imports: [ZrModal, ZrTemplate, ZrButton, BotonHabilitado, ZdsStatusBadge, InfoBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-caso-modal.html',
})
export class DetalleCasoModal {
  readonly caso = input.required<CasoDashboard>();

  /** Código → descripción de la colección de Tipo de solicitud (id 18). */
  readonly tipoMap = input<Record<string, string>>({});

  /** Código → descripción de la colección de Área (id 35). */
  readonly areaMap = input<Record<string, string>>({});

  /**
   * Cierre del modal.
   *
   * ⚠ Obligatorio escucharlo: `ModalZ.change()` hace `open = false` sobre su **propio** input, así
   * que cerrar desde el backdrop o la X deja la bandera de la pantalla en `true` y el modal no vuelve
   * a abrir. Ver el punto 3 de `zds-reexports.ts`.
   */
  readonly cerrar = output<void>();

  /** Tipo resuelto a descripción, con el código como fallback y `—` si no hay ninguno. */
  protected readonly strTipo = computed(() => {
    const objCaso = this.caso();
    return (this.tipoMap()[objCaso.tipoSolicitud] ?? objCaso.tipoSolicitud) || '—';
  });

  /** Área resuelta a descripción, con el código como fallback y `—` si no hay ninguno. */
  protected readonly strArea = computed(() => {
    const objCaso = this.caso();
    return (this.areaMap()[objCaso.areaResponsable] ?? objCaso.areaResponsable) || '—';
  });

  protected readonly strVariante = computed(() => estadoVariante(this.caso().estado));

  protected readonly strDiasRestantes = computed(() => diasRestantesTexto(this.caso()));

  /** SLA en días hábiles, o `—`. El sufijo es el de React ("días hábiles", no "días"). */
  protected readonly strSla = computed(() => {
    const strSla = this.caso().sla;
    return strSla ? `${strSla} días hábiles` : '—';
  });

  /**
   * El `<ng-template>` que pinta la píldora de Estado.
   *
   * `viewChild` de señal (no `@ViewChild`) para que `cllItems` pueda leerlo dentro de un `computed()`:
   * el template no existe en el primer pase de creación de la vista, y con la señal el `computed()`
   * simplemente se recalcula cuando aparece, sin `AfterViewInit` ni un `set` a mano.
   */
  private readonly objTplEstado = viewChild<TemplateRef<unknown>>('tplEstado');

  /**
   * Los siete pares de la barra, en el orden de React.
   *
   * La fila Estado va como `TemplateRef` (la píldora); las demás son texto. Mientras el template no
   * exista —solo el primer pase— cae al **texto** del estado, que es la misma información sin píldora;
   * nunca a un hueco.
   */
  protected readonly cllItems = computed<readonly InfoBarItem[]>(() => {
    const objCaso = this.caso();
    return [
      { label: 'Estado', value: this.objTplEstado() ?? objCaso.estado },
      { label: 'Tipo de solicitud', value: this.strTipo() },
      { label: 'Fecha de creación', value: objCaso.fechaCreacion },
      { label: 'SLA asignado', value: this.strSla() },
      { label: 'Fecha de vencimiento', value: objCaso.fechaVencimiento },
      { label: 'Días restantes', value: this.strDiasRestantes() },
      { label: 'Área responsable', value: this.strArea() },
    ];
  });
}
