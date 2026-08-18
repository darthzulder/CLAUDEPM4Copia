import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, output,
  runInInjectionContext, signal, type Signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZrAlertInline, ZrButton } from '../../../../components/fields/zds-reexports';
import { DocSupportUploaderComponent } from '../../../../components/doc-support-uploader';
import { FormSectionComponent } from '../../../../components/form-section';
import { RequestFileListComponent } from '../../../../components/request-file-list';
import { CatalogosService } from '../../../../core/catalogos.service';
import type { CollectionOption } from '../../../../core/collection.types';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import {
  QD, QD_COLLECTIONS, SCR0051_ADJUNTO_KEYS, SCR0051_MAX_SOPORTES, SCR0051_OPTIONS_FAVOR,
} from '../fields/fields';

/**
 * S8 · "Elaboración de Respuesta Técnica" (SEC-054), S9 · "Soportes Internos" (SEC-055) y
 * S10 · "Configuración de Respuesta" (SEC-056).
 *
 * Porte de `SeccionRespuesta.tsx`. Recibe el `FormGroup` de la pantalla y escribe sobre sus controles.
 *
 * ── S10 va ARRIBA de S8 en el render, y no es un error de orden ──────────────────────────────────
 * La numeración de las secciones es la del anexo; el orden visual lo decide qué condiciona a qué.
 * "Respuesta a favor de" (S10) gobierna la visibilidad de "Acciones Tomadas" (RUL-0051-09), así que
 * pintarlo después dejaría al gestor viendo aparecer un campo por encima de lo que acaba de tocar.
 * React lo resolvió igual y lo documenta en el mismo lugar.
 *
 * ── La prórroga es un flujo de DOS pasos, y el segundo botón no existe hasta el primero ──────────
 * ACT-0051-04: "Solicitar Prórroga Regulatoria" no envía nada — abre el select del motivo
 * (CAT-MOTIVO-PRORROGA). El envío real es el segundo botón, que aparece recién con el motivo elegido.
 * El estado del paso vive acá (`blnModoProrroga`) porque es de esta sección; la pantalla solo recibe
 * el evento cuando ya hay motivo.
 *
 * ── ⚠ `withSearch` no existe en la fachada de Angular ───────────────────────────────────────────
 * React pasa `withSearch` al select del motivo de prórroga. `zds-select` **no tiene ese input** (ni él
 * ni `CampoBase`), así que el buscador se pierde. Es una diferencia de render real, no un descuido: el
 * catálogo de motivos de prórroga es corto y agregar el input a `zds-select` a mitad de la migración
 * tocaría el archivo más compartido del proyecto. Queda anotado en la ficha y para después de la Fase 5.
 *
 * ── ⚠ Los soportes heredan las restricciones de SCR-000, que NO son parámetros ───────────────────
 * `DocSupportUploader` fija las extensiones (`pdf/doc/docx/jpg/jpeg/png`), el tope de 5 MB y el texto
 * del error (`MSG-000-06`) como constantes de módulo: su único input configurable es `max`. Así que los
 * soportes internos de esta pantalla validan con las reglas y el mensaje de SCR-000. Es el
 * comportamiento de React —el componente ya era así allá—, se porta igual, y queda reportado como
 * limitación de infraestructura en la ficha.
 */
@Component({
  selector: 'app-seccion-respuesta',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormSectionComponent, ZdsSelect, ZdsTextarea, ZrAlertInline, ZrButton,
    DocSupportUploaderComponent, RequestFileListComponent,
  ],
  // El catálogo de motivos de prórroga es de **esta** sección: nadie más lo usa.
  providers: [CatalogosService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-respuesta.html',
})
export class SeccionRespuesta {
  /** El `FormGroup` de la pantalla. */
  readonly form = input.required<FormGroup>();

  /** Valores del form, reactivos. Ver el mismo input en `SeccionDetalleCaso`. */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** `true` mientras hay un envío en vuelo. */
  readonly enviando = input(false);

  /** **RUL-0051-03** · la prórroga solo se ofrece con el SLA en el umbral. Lo calcula la pantalla. */
  readonly slaCritico = input(false);

  /** `process_request_id`, para listar los soportes ya subidos en la vuelta anterior. */
  readonly requestId = input<number | null>(null);

  /** ACT-0051-05 · abre el modal de vista previa de la carta de respuesta. */
  readonly vistaPrevia = output<void>();

  /** ACT-0051-04 · pide el envío de la prórroga. Solo se emite con motivo elegido. */
  readonly solicitarProrroga = output<void>();

  private readonly objCatalogos = inject(CatalogosService);
  private readonly objInjector = inject(Injector);

  protected readonly CLL_FAVOR = SCR0051_OPTIONS_FAVOR;
  protected readonly CLL_CLAVES_SOPORTE = SCR0051_ADJUNTO_KEYS;
  protected readonly INT_MAX_SOPORTES = SCR0051_MAX_SOPORTES;
  protected readonly strIntroSoportes =
    `Cargue los documentos de soporte del análisis. Se pueden agregar hasta ${SCR0051_MAX_SOPORTES} archivos.`;
  protected readonly QD = QD;

  /** Paso 1/2 de ACT-0051-04: `true` cuando el select del motivo ya está a la vista. */
  protected readonly blnModoProrroga = signal(false);

  constructor() {
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });
  }

  private blnVinculado = false;

  /** Engancha el `_desc` del motivo de prórroga y arranca su catálogo. */
  private vincular(in_objForm: FormGroup): void {
    // Tercer argumento como **función**: pasar el array capturaría el `[]` del primer instante.
    sincronizarDesc(in_objForm, QD.strExtensionReason, () => this.cllMotivosProrroga());
    void this.objCatalogos.cargar(
      'extensionReason', QD_COLLECTIONS.extensionReason, in_objForm.getRawValue(),
    );
  }

  /**
   * Opciones del motivo de prórroga.
   *
   * Se llama desde la plantilla, así que **no puede disparar red**: `CatalogosService.de()` separa
   * obtener de cargar justo para esto.
   */
  protected readonly cllMotivosProrroga = computed<readonly CollectionOption[]>(
    () => this.objCatalogos.de('extensionReason').options(),
  );

  /** **RUL-0051-09** · "Acciones Tomadas" solo con la respuesta a favor del Cliente (código '1'). */
  protected readonly blnMostrarAcciones = computed(() => this.leer(QD.strFavorability) === '1');

  /**
   * Caso devuelto con observaciones por el Analista SAC (FLD-131, lo escribe SCR-008).
   *
   * Gobierna dos cosas distintas en esta sección: muestra el textarea de solo lectura con las
   * observaciones en S8, y en S9 agrega la lista de los soportes que ya se subieron en la vuelta
   * anterior (sin ella el gestor no sabría qué falta y volvería a adjuntar lo mismo).
   */
  protected readonly blnDevueltoPorSac = computed(() => !!this.leer(QD.strSacRemarks).trim());

  /** El botón de enviar la prórroga necesita el motivo. */
  protected readonly blnPuedeEnviarProrroga = computed(() => !!this.leer(QD.strExtensionReason));

  protected abrirModoProrroga(): void {
    this.blnModoProrroga.set(true);
  }

  /**
   * Sale del paso 1 **y limpia el motivo**.
   *
   * React solo bajaba la bandera, dejando el motivo elegido en el form. Acá se limpia porque el valor
   * viaja en el payload de cualquier acción posterior (`getRawValue()`): un motivo de prórroga que el
   * gestor eligió y canceló quedaría adherido al caso al enviar la respuesta, y PM4 lo registraría
   * como si la prórroga se hubiera pedido. Es una corrección, no una divergencia gratuita — anotada en
   * la ficha como **⚠ corregido en 2.0**.
   */
  protected cancelarModoProrroga(): void {
    this.form().get(QD.strExtensionReason)?.setValue('');
    this.blnModoProrroga.set(false);
  }

  protected emitirSolicitarProrroga(): void {
    if (!this.blnPuedeEnviarProrroga()) return;
    this.solicitarProrroga.emit();
  }

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }
}
