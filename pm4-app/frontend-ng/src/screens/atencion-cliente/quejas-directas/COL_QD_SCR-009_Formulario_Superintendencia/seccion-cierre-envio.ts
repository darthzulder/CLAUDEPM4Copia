import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormSectionComponent } from '../../../../components/form-section';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsStatusBadge, type VarianteEstado } from '../../../../components/fields/zds-status-badge';
import { ZrAlertInline } from '../../../../components/fields/zds-reexports';
import { QD } from '../fields/fields';

/**
 * Estado del envío a la SFC → variante de píldora. Se resuelve con `ZdsStatusBadge` y no con clases
 * de color propias, que es la regla del proyecto para las píldoras de estado.
 *
 * Las cuatro claves son los literales que escribe el script PHP de Momento 3 en
 * `qd_strM3ClosureStatus`; no son enum ni catálogo, así que se comparan como texto. Un valor que no
 * esté en el mapa cae a `'neutral'` en vez de romper — es el estado honesto para "no sé qué es esto".
 */
const DIC_VARIANTE_ESTADO: Record<string, VarianteEstado> = {
  'Pendiente': 'neutral',
  'Enviando': 'info',
  'Rechazado (400)': 'danger',
  'Aceptado (200)': 'success',
};

/**
 * S6 · "Datos de Cierre Regulatorio" y S7 · "Estado del Envío a SmartSupervision (SFC)".
 *
 * Porte de `SeccionCierreEnvio.tsx`. Son las secciones de Cierre Regulatorio de Momento 3 fusionadas
 * desde la ex SCR-010: los datos de cierre los **calcula el back** (Excel PQRS, hoja "MomentoIII"),
 * así que acá son de solo lectura. El gestor solo revisa lo calculado; el envío a SmartSupervision lo
 * dispara la acción `ENVIAR_SFC` del formulario principal.
 *
 * Las tres fechas/códigos van como `zds-input [readOnly]="true"` y **no** como el par
 * `.info-bar-label`/`.valor-solo-lectura`, igual que en React: son controles del `FormGroup` (viajan
 * en el payload), y renderizarlos como texto suelto los sacaría del form.
 */
@Component({
  selector: 'app-seccion-cierre-envio',
  standalone: true,
  imports: [ReactiveFormsModule, FormSectionComponent, ZdsInput, ZdsStatusBadge, ZrAlertInline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-cierre-envio.html',
})
export class SeccionCierreEnvio {
  /** El `FormGroup` de la pantalla. */
  readonly form = input.required<FormGroup>();

  /**
   * Valores del form, reactivos. ⚠ No se lee `form.value` en los `computed()`: no es un signal, así
   * que no crearía dependencia y el badge de estado quedaría congelado. Ver la SCR-003.
   */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** Sin estado escrito todavía, el envío está "Pendiente" — es el default del script de M3. */
  protected readonly strEstado = computed(() => this.leer(QD.strM3ClosureStatus) || 'Pendiente');

  protected readonly strVariante = computed<VarianteEstado>(
    () => DIC_VARIANTE_ESTADO[this.strEstado()] ?? 'neutral',
  );

  /** Sin intentos registrados el contador es `'0'`, no vacío: es un número y se lee como número. */
  protected readonly strIntentos = computed(() => this.leer(QD.strM3ClosureAttempts) || '0');

  protected readonly strUltimoError = computed(() => this.leer(QD.strLastError));

  /**
   * El rechazo se compara contra el literal exacto y no contra "empieza con Rechazado": el alerta
   * roja solo corresponde al 400 de la SFC, que es el único caso reenviable tras corregir.
   */
  protected readonly blnRechazado = computed(
    () => this.leer(QD.strM3ClosureStatus) === 'Rechazado (400)',
  );

  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }

  protected readonly QD = QD;
}
