import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, untracked,
  type OnDestroy, type OnInit, type TemplateRef, viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { ZrAlertInline, ZrButton, ZrLoader } from '../../../../components/fields/zds-reexports';
import { ZdsStatusBadge } from '../../../../components/fields/zds-status-badge';
import { InfoBarComponent, type InfoBarItem } from '../../../../components/info-bar';
import { PreviewModalComponent, type DocumentoVistaPrevia } from '../../../../components/preview-modal';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { AttachmentsService, idsAdjuntosAPayload } from '../../../../core/attachments.service';
import { CollectionService } from '../../../../core/collection.service';
import { diasHabilesRestantes, estadoSlaPorDiasRestantes, estadoSlaVariant, parsePm4Date } from '../../../../core/business-days';
import { FileRegistryService } from '../../../../core/file-registry.service';
import { HolidaysService } from '../../../../core/holidays.service';
import { mensajeDeError } from '../../../../core/http-error';
import { Pm4ContextService } from '../../../../core/pm4-context.service';
import { TaskService } from '../../../../core/task.service';
import { selloFechaHora } from '../../../../core/fecha-hora';
import {
  type AccionFlujoCombinado,
  QD,
  QD_COLLECTIONS,
  SCR0051_DEFAULTS,
  SCR0051_SLA_UMBRAL_PRORROGA,
} from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';
import { SeccionAsignacion } from './seccion-asignacion';
import { SeccionDetalleCaso } from './seccion-detalle-caso';
import { SeccionRespuesta } from './seccion-respuesta';
import { ExpedienteCompletoModal } from './expediente-completo-modal';
import {
  buildRespuestaFinalHtml, fillRespuestaFinalHtml, type RespuestaFinalVars,
} from './respuestaFinalTemplate';

/**
 * Prefijos de código de la colección `emailTemplates` (46) que corresponden a la plantilla de respuesta
 * al consumidor. `09` es la de queja **procedente** y `10` la de **no procedente**; el resto de la
 * colección son plantillas de otros hitos del proceso (acuse, escalamiento) que esta pantalla no usa.
 *
 * Se comparan por prefijo y no por igualdad porque el código real trae sufijos de versión
 * (`09`, `09-B`, `1001`…) que el negocio administra desde PM4 sin avisar.
 */
const EMAIL_TPL_PROCEDE_PREFIX = '09';
const EMAIL_TPL_NO_PROCEDE_PREFIX = '10';

/**
 * Los cinco campos de clasificación regulatoria que, si cambian respecto a lo que traía el caso,
 * fuerzan `qd_strMarking` a `'2'` (FLD-156/179). Es la lista exacta de React: producto SFC,
 * interacción, servicio prestado, placa y motivo SFC.
 */
const CLASSIFICATION_FIELDS = [
  QD.strSfcProduct, QD.strInteraction, QD.strServiceProvided, QD.strPlate, QD.strSfcReason,
] as const;

/**
 * Sube una versión del borrador: `'v3'` → `'v4'`, y cualquier cosa ilegible → `'v1'`.
 *
 * Port literal de `siguienteVersion()` de React, incluido el tratamiento de los casos raros, que no es
 * defensa teórica: `qd_strRevisionVersion` es un **string libre** en PM4 y llega como `''` en el primer
 * envío de todo caso nuevo, con `'v'` suelto si alguien lo tocó a mano, y sin la `v` si otro nodo lo
 * escribió como número. Los tres tienen que caer en `'v1'` y no en `'vNaN'`, que es lo que SCR-008
 * mostraría al revisor como "Versión bajo revisión".
 */
export function siguienteVersion(in_strCurrent: string | undefined): string {
  const intCurrent = Number.parseInt(String(in_strCurrent ?? '').replace(/^\s*v/i, ''), 10);
  return `v${(Number.isFinite(intCurrent) && intCurrent > 0 ? intCurrent : 0) + 1}`;
}

/**
 * SCR-0051 · PAN-05.1 — **Detalle, Reasignación y Respuesta** (tarea **SP2-T01/T03** del subproceso SP2,
 * Quejas Directas).
 *
 * Port de `frontend/src/screens/atencion-cliente/quejas-directas/.../DetalleReasignacionRespuesta.tsx`
 * y sus cuatro secciones. Es la pantalla más grande de la migración: el usuario del área responsable
 * confirma la asignación, puede re-editar la clasificación regulatoria, pedir ayuda a otras áreas,
 * pedir prórroga, y finalmente redactar la respuesta al consumidor.
 *
 * ── Las cinco salidas conviven en un solo campo, `qd_strAction` ──────────────────────────────────
 * `AccionFlujoCombinado` tiene cinco miembros (`CONFIRMAR_ASIGNACION`, `AYUDA`, `SOLICITAR_PRORROGA`,
 * `GUARDAR_BORRADOR`, `ENVIAR`) y el BPM ramifica leyendo ese campo. `enviarCon()` es el único punto
 * que lo escribe, y **devuelve un booleano** en vez de tragarse el error: *Guardar Borrador* navega el
 * frame superior a la bandeja de PM4 y hacerlo tras un fallo perdería lo que el usuario escribió.
 *
 * ⚠ La ficha de negocio lista **cuatro** acciones en su §4 (omite `AYUDA`). Se porta el código de
 * React, que tiene las cinco, y la divergencia queda anotada para el negocio en la ficha (§12).
 *
 * ── `CONFIRMAR_ASIGNACION` es la única salida que REASIGNA la tarea en PM4 ───────────────────────
 * Va por `TaskService.reasignarTarea()`, que hace **dos PUT**: primero `/tasks/{id}` con
 * **únicamente** `{ user_id }`, y después `/requests/{id}` con los datos. Mezclar `status`/`data` en el
 * primero hace que PM4 acepte el request, **no reasigne**, y no devuelva ningún error — ver el docstring
 * del servicio. Las otras cuatro salidas van por `completarTarea()`/`guardarBorrador()`.
 *
 * ── El sello de envío y la versión: solo en `ENVIAR` ─────────────────────────────────────────────
 * `qd_strDraftDate` y `qd_strRevisionVersion` se escriben **exclusivamente** cuando la acción es
 * `ENVIAR`. Sellarlos en un borrador haría que SCR-008 le mostrara al revisor una versión que todavía
 * no existe, y que el contador de versiones subiera cada vez que el redactor guarda para ir a almorzar.
 *
 * ── La marcación derivada compara contra un snapshot CONGELADO ───────────────────────────────────
 * ⚠ Esta regla se trazó un tiempo como "RUL-0051-06" y **es incorrecto**: en el Anexo02, RUL-0051-06 es
 * "no asignar a un usuario fuera del proceso" (bloquea la reasignación, aplica a FLD-092). La marcación
 * derivada **no es un RUL del Anexo02** de esta pantalla — es el contrato de `qd_strMarking`
 * (FLD-156/179), que hereda de SCR-009, y por eso se traza así.
 *
 * **FLD-156/179** · si la clasificación regulatoria cambia respecto a la que traía el caso, la
 * marcación se fuerza a `'2'` para que SCR-009 la traiga preelegida. El punto fino es que el snapshot
 * (`dicOriginal`) se toma **una sola vez, en la precarga**, y no se vuelve a mover: si el usuario
 * cambia el producto y después lo devuelve al valor original, la marcación **vuelve** a lo que traía el
 * caso. Comparar contra el valor anterior en vez de contra el original dejaría la marcación en `'2'`
 * para siempre después del primer tecleo.
 *
 * ── La vista previa de la respuesta es un blob que hay que revocar ───────────────────────────────
 * La plantilla de la colección 46 se resuelve por prefijo (`09` procede / `10` no procede) y, si el
 * catálogo no trajo ninguna, cae a `buildRespuestaFinalHtml()`. El HTML se envuelve en un
 * `URL.createObjectURL()` que `PreviewModalComponent` consume — y que **se revoca** al recalcularse y
 * al destruirse la pantalla: un blob no revocado vive hasta que se recarga el frame, y esta pantalla
 * recalcula la vista previa con cada tecla del textarea de respuesta.
 */
@Component({
  selector: 'app-detalle-reasignacion-respuesta',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    ActionBarComponent,
    InfoBarComponent,
    PreviewModalComponent,
    ExpedienteCompletoModal,
    SeccionDetalleCaso,
    SeccionAsignacion,
    SeccionRespuesta,
    ZdsStatusBadge,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrLoader,
  ],
  // `FileRegistryService` por pantalla: retiene el binario de los diez soportes hasta el submit.
  // `CollectionService` acá y no en `CatalogosService`, porque esta pantalla necesita **una sola**
  // colección propia (las plantillas de correo); las demás las cargan las secciones, cada una con su
  // `CatalogosService`.
  //
  // ⚠ `HolidaysService` va con su **propio** `CollectionService`, y el injector hijo no es adorno: una
  // instancia de `CollectionService` retiene **una** colección, así que compartir la de la pantalla
  // haría que la carga de feriados (colección 48) pisara las plantillas de correo (46) — el select de
  // plantillas quedaría listando fechas. Es el mismo mecanismo que usa `CatalogosService.de()` para dar
  // una instancia por catálogo, con `parent` para que `CollectionService` siga encontrando `HttpClient`
  // (sin padre, `Injector.create()` no ve nada de la app y revienta con NG0201).
  //
  // Es la primera pantalla que usa feriados, así que este es el sitio donde se fija el patrón.
  providers: [
    FileRegistryService,
    CollectionService,
    {
      provide: HolidaysService,
      useFactory: (in_objPadre: Injector) =>
        Injector.create({
          providers: [{ provide: CollectionService }, { provide: HolidaysService }],
          parent: in_objPadre,
          name: 'feriados',
        }).get(HolidaysService),
      deps: [Injector],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-reasignacion-respuesta.html',
})
export class DetalleReasignacionRespuesta implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objAdjuntos = inject(AttachmentsService);
  private readonly objRegistro = inject(FileRegistryService);
  private readonly objPlantillas = inject(CollectionService);
  private readonly objFestivos = inject(HolidaysService);
  private readonly objContexto = inject(Pm4ContextService);

  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  /** Mensaje del fallo del último envío. Lo pinta la alerta sobre la barra de acciones. */
  readonly strErrorEnvio = signal('');

  /** Banderas de los dos modales de la pantalla. */
  readonly blnVistaPreviaAbierta = signal(false);
  readonly blnExpedienteAbierto = signal(false);

  readonly form = new FormGroup({
    // ── S1 · Información del caso (solo lectura) ──
    [QD.strBpmCaseId]: new FormControl(''),
    [QD.strSfcCode]: new FormControl(''),
    [QD.strFirstName]: new FormControl(''),
    [QD.strLastName]: new FormControl(''),
    [QD.strCompanyName]: new FormControl(''),
    [QD.strIdType]: new FormControl(''),
    // El `_desc` del tipo de identificación es el que se muestra en el encabezado ("Cédula de
    // Ciudadanía 1020…" en vez de "CC 1020…"). Va como control y no como lectura de `task.data`
    // porque `strIdentificacion` se deriva de `sigValores()`, que se alimenta del form.
    [`${QD.strIdType}_desc`]: new FormControl(''),
    [QD.strIdNumber]: new FormControl(''),
    [QD.strEmail]: new FormControl(''),
    [QD.strPersonType]: new FormControl(''),
    // ⚠ Los cuatro `_desc` de abajo son **controles**, no valores derivados: React los monta como
    // campos (`<ZdsInput name="qd_strPersonType_desc" readOnly>`) y los lee directo de `task.data`,
    // porque el código ya viene resuelto de SCR-000 y volver a cargar sus colecciones acá serían tres
    // GET para reconstruir una etiqueta que ya viaja en el caso. Pintarlos como texto plano sería un
    // cambio de render de contrabando — mismo criterio que en SCR-0052.
    //
    // El nombre lleva el sufijo literal y no una entrada de `QD`: `_desc` es la convención de
    // compañera documentada en `MAPEO_qd_old_new.md`.
    [`${QD.strPersonType}_desc`]: new FormControl(''),

    // ── S2/S3 · Clasificación, re-editable en M3 (RUL-0051-05/06) ──
    [QD.strRequestType]: new FormControl(''),
    // El `_desc` del tipo de solicitud alimenta la plantilla del correo (`tipoDesc`), que lo prefiere
    // sobre el código.
    [`${QD.strRequestType}_desc`]: new FormControl(''),
    [QD.strInteraction]: new FormControl(''),
    [QD.strServiceProvided]: new FormControl(''),
    [QD.strPlate]: new FormControl(''),
    [QD.strChannel]: new FormControl(''),
    [QD.strSfcProduct]: new FormControl(''),
    // El `_desc` del producto lo escribe `MatrizMotivosService.syncProductDesc()` con la etiqueta que
    // el usuario eligió, no `sincronizarDesc()`: la colección 16 repite códigos (el 104 es a la vez
    // "Garantía extendida" y "Copropiedades"), así que resolver por código elegiría cualquiera.
    [`${QD.strSfcProduct}_desc`]: new FormControl(''),
    [QD.strSfcReason]: new FormControl(''),
    // Este sí sale de la cascada: lo engancha `MatrizMotivosService.vincular()`.
    [`${QD.strSfcReason}_desc`]: new FormControl(''),
    // Derivados de `cat_matriz_motivos` — los escribe `MatrizMotivosService`, no el usuario.
    [QD.strOmbudsmanEscalation]: new FormControl(''),
    [QD.strCompensation]: new FormControl(''),
    [QD.strFraudRelated]: new FormControl(''),
    // Sin campo visible: lo fuerza el efecto de FLD-156/179 y lo lee SCR-009.
    [QD.strMarking]: new FormControl(''),
    [QD.strReceptionInstance]: new FormControl(''),
    [`${QD.strReceptionInstance}_desc`]: new FormControl(''),
    [QD.strReceptionPoint]: new FormControl(''),
    [QD.strAdmission]: new FormControl(''),
    [QD.strControlEntity]: new FormControl(''),
    [`${QD.strControlEntity}_desc`]: new FormControl(''),
    [QD.strComplaintText]: new FormControl(''),

    // ── S4 · SmartSupervision y SLA (solo lectura) ──
    [QD.strSsStatus]: new FormControl(''),
    [QD.strM1M2Attempts]: new FormControl(''),
    [QD.strFilingDate]: new FormControl(''),
    [QD.strSlaAssigned]: new FormControl(''),
    // Los sella `enviarCon()` solo en `ENVIAR`; los lee SCR-008.
    [QD.strDraftDate]: new FormControl(''),
    [QD.strRevisionVersion]: new FormControl(''),

    // ── S5/S6/S7 · Asignación, ayuda e historial ──
    [QD.blnHasAssignee]: new FormControl<boolean>(false),
    [QD.strNeedsOtherAreas]: new FormControl(''),
    [QD.strAssigneeArea]: new FormControl(''),
    [QD.strAssigneeUser]: new FormControl(''),
    [QD.strAssignmentRemarks]: new FormControl(''),
    [QD.strCurrentAssignee]: new FormControl(''),
    [QD.strTargetArea]: new FormControl(''),
    [QD.strNewAssignee]: new FormControl(''),
    [QD.strReassignReason]: new FormControl(''),
    [QD.strReassignRemarks]: new FormControl(''),
    [QD.lstAssignHistory]: new FormControl<AsignacionHistorial[]>([]),
    [QD.intHelpNumber]: new FormControl<number>(0),

    // ── S8/S9/S10 · Respuesta, soportes y favorabilidad ──
    [QD.strClientResponse]: new FormControl(''),
    [QD.strActionsTaken]: new FormControl(''),
    [QD.strAcknowledgment]: new FormControl(''),
    [QD.strSacRemarks]: new FormControl(''),
    [QD.strSupport01]: new FormControl(''),
    [QD.strSupport02]: new FormControl(''),
    [QD.strSupport03]: new FormControl(''),
    [QD.strSupport04]: new FormControl(''),
    [QD.strSupport05]: new FormControl(''),
    [QD.strSupport06]: new FormControl(''),
    [QD.strSupport07]: new FormControl(''),
    [QD.strSupport08]: new FormControl(''),
    [QD.strSupport09]: new FormControl(''),
    [QD.strSupport10]: new FormControl(''),
    [QD.strFavorability]: new FormControl(''),
    [QD.strExtensionReason]: new FormControl(''),
    [QD.strAction]: new FormControl(''),
  });

  /**
   * Espejo en signal del valor del form. Se siembra con `getRawValue()` y no con `{}` porque los
   * computeds se leen en el primer render, antes de que ningún `valueChanges` haya emitido — y porque
   * `getRawValue()` incluye los controles deshabilitados, que `value` descarta.
   */
  readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /**
   * Snapshot de la clasificación tal como llegó del caso. Se congela en la precarga y **no se vuelve a
   * escribir**: es la referencia contra la que FLD-156/179 decide si hubo cambio. Ver la cabecera.
   */
  private dicOriginal: Record<string, string> | null = null;

  /** URL del blob de la vista previa vigente, para poder revocarla antes de crear la siguiente. */
  private strBlobVigente = '';

  constructor() {
    // FLD-156/179 · marcación derivada. Depende de `sigValores()` (reactivo) y escribe en el form con
    // `emitEvent: false` para no re-entrar en su propio efecto a través de `valueChanges`.
    effect(() => {
      const dicValores = this.sigValores();
      const dicOriginal = this.dicOriginal;
      if (!dicOriginal) return;

      const blnCambio = CLASSIFICATION_FIELDS.some(
        (in_strCampo) => String(dicValores[in_strCampo] ?? '') !== (dicOriginal[in_strCampo] ?? ''),
      );
      const strDeseado = blnCambio ? '2' : (dicOriginal[QD.strMarking] ?? '');

      // `untracked` porque leer el control no debe crear otra dependencia, y la guarda de igualdad
      // evita un `setValue` por cada tecla del textarea de respuesta (que también mueve `sigValores`).
      untracked(() => {
        const objControl = this.form.get(QD.strMarking);
        if (objControl && String(objControl.value ?? '') !== strDeseado) {
          objControl.setValue(strDeseado, { emitEvent: false });
          this.sigValores.update((in_dic) => ({ ...in_dic, [QD.strMarking]: strDeseado }));
        }
      });
    });
  }

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();
    void this.objFestivos.cargar();
    void this.objPlantillas.cargar(QD_COLLECTIONS['emailTemplates'], this.form.getRawValue());
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
    // Cerrar la pantalla con el modal abierto no pasa por `cerrarVistaPrevia()`: sin esto el blob
    // sobrevive hasta que se recargue el frame de PM4.
    this.revocarBlob();
  }

  // ── Precarga ──────────────────────────────────────────────────────────────────────────────────

  /**
   * Vuelca `task.data` al form filtrando por las claves que el form declara, y **congela** el snapshot
   * de clasificación que usa FLD-156/179.
   *
   * Los defaults se mezclan **a través del mismo filtro** y no con un spread crudo: `SCR0051_DEFAULTS`
   * es un `Partial` del tipo completo del caso y podría traer claves sin control (ya pasó en SCR-003),
   * que `patchValue` ignoraría en silencio pero `tsc` rechaza.
   *
   * ⚠ **Los escalares se normalizan a `string` y el historial NO.** PM4 devuelve casi todo como texto,
   * pero un número o un booleano llegan crudos y el `String()` los uniforma — es lo que hace SCR-003 y
   * lo que evita que un `1` numérico rompa la comparación de un `_desc`. La excepción es
   * `qd_lstAssignHistory`, cuyo control está tipado `AsignacionHistorial[]`: pasarlo por `String()` lo
   * convertiría en `"[object Object]"` y la tabla del historial quedaría con una fila de basura. Por eso
   * el tipo del parche es la unión y el array viaja tal cual — no es un `unknown` suelto, que es lo que
   * `patchValue` rechaza contra el tipo del `FormGroup`.
   */
  private precargar(): void {
    const objTarea = this.objTareas.tarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const dicDefaults = SCR0051_DEFAULTS as Record<string, unknown>;
    const dicParche: Record<string, string | AsignacionHistorial[] | null> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      // El default primero y el dato del caso después: el caso gana cuando trae la clave.
      const genValor = strClave in dicDatos ? dicDatos[strClave] : dicDefaults[strClave];
      if (genValor === undefined) continue;
      if (strClave === QD.lstAssignHistory) {
        dicParche[strClave] = Array.isArray(genValor) ? (genValor as AsignacionHistorial[]) : [];
        continue;
      }
      dicParche[strClave] = genValor === null ? null : String(genValor);
    }
    this.form.patchValue(dicParche);
    this.sigValores.set(this.form.getRawValue());

    // El snapshot se toma DESPUÉS del patch y una sola vez. La marcación original entra también, para
    // poder volver a ella si el usuario deshace su cambio.
    const dicSnapshot: Record<string, string> = {};
    for (const strCampo of CLASSIFICATION_FIELDS) {
      dicSnapshot[strCampo] = String(dicDatos[strCampo] ?? '');
    }
    dicSnapshot[QD.strMarking] = String(dicDatos[QD.strMarking] ?? '');
    this.dicOriginal = dicSnapshot;
  }

  // ── SLA (S4 y el gate de la prórroga) ─────────────────────────────────────────────────────────

  private readonly dtRadicacion = computed(() =>
    parsePm4Date(String(this.sigValores()[QD.strFilingDate] ?? '')),
  );

  private readonly intSlaAsignado = computed(() =>
    Number.parseInt(String(this.sigValores()[QD.strSlaAssigned] ?? ''), 10),
  );

  /**
   * ¿Se puede calcular el SLA? Hace falta una fecha de radicación parseable **y** un SLA numérico.
   * Sin los dos, S4 pinta el SLA sin el "(N días restantes)" y la prórroga queda apagada — que es lo
   * correcto: un caso sin fecha de radicación no tiene un vencimiento del que pedir prórroga.
   */
  readonly blnSlaCalculable = computed(
    () => !!this.dtRadicacion() && Number.isFinite(this.intSlaAsignado()),
  );

  readonly intDiasRestantes = computed(() => {
    const dtRadicacion = this.dtRadicacion();
    if (!dtRadicacion) return 0;
    return diasHabilesRestantes(dtRadicacion, this.intSlaAsignado(), this.objFestivos.feriados());
  });

  /** **RUL-0051-03** · la prórroga solo se habilita con el SLA en zona crítica (≤ 2 días hábiles). */
  readonly blnSlaCritico = computed(
    () => this.blnSlaCalculable() && this.intDiasRestantes() <= SCR0051_SLA_UMBRAL_PRORROGA,
  );

  readonly strEstadoSla = computed(() =>
    estadoSlaPorDiasRestantes(
      this.intDiasRestantes(), this.blnSlaCalculable(), SCR0051_SLA_UMBRAL_PRORROGA,
    ),
  );

  readonly strVarianteSla = computed(() => estadoSlaVariant(this.strEstadoSla()));

  // ── La barra de información del encabezado ────────────────────────────────────────────────────

  /**
   * Las dos celdas con markup (SLA con su renglón de días restantes, y el badge de estado) llegan como
   * `TemplateRef`: es lo que `InfoBarComponent` acepta además de un string, justamente para no tener
   * que pasar HTML como texto. Ver su docstring.
   */
  private readonly tplSla = viewChild.required<TemplateRef<unknown>>('tplSla');
  private readonly tplEstado = viewChild.required<TemplateRef<unknown>>('tplEstado');

  readonly cllInfoItems = computed<InfoBarItem[]>(() => {
    const dicValores = this.sigValores();
    return [
      // ⚠ El rótulo es "Case" en inglés: es el de React y el que el negocio ya vio en las capturas.
      // "Caso" sería una mejora de traducción, y una migración de framework no las trae de contrabando.
      { label: 'Case', value: String(dicValores[QD.strBpmCaseId] ?? '') || '—' },
      { label: 'SLA', value: this.tplSla() },
      { label: 'Estado', value: this.tplEstado() },
      // ⚠ La celda "SmartSupervision" muestra el **código SFC** (`qd_strSfcCode`), no el estado de
      // integración (`qd_strSsStatus`, que sí es lo que pinta S4). Es lo que hace React y lo que el
      // gestor usa para buscar el caso en el portal de la SFC.
      { label: 'SmartSupervision', value: String(dicValores[QD.strSfcCode] ?? '') || '—' },
      { label: 'Radicación SFC', value: String(dicValores[QD.strFilingDate] ?? '') || '—' },
    ];
  });

  // ── Datos derivados del consumidor ────────────────────────────────────────────────────────────

  readonly strNombre = computed(() => {
    const dicValores = this.sigValores();
    const strEmpresa = String(dicValores[QD.strCompanyName] ?? '').trim();
    if (strEmpresa) return strEmpresa;
    return `${String(dicValores[QD.strFirstName] ?? '')} ${String(dicValores[QD.strLastName] ?? '')}`.trim();
  });

  /**
   * Tipo y número de identificación, para el encabezado y el expediente.
   *
   * Prefiere el `_desc` del tipo sobre el código: en el encabezado importa que se lea "Cédula de
   * Ciudadanía", no "CC". El `||` es deliberado y no un `??` — el `_desc` llega como `''` (no como
   * `undefined`) cuando SCR-000 no lo resolvió, y ahí hay que caer al código.
   */
  readonly strIdentificacion = computed(() => {
    const dicValores = this.sigValores();
    const strTipo = String(dicValores[`${QD.strIdType}_desc`] ?? '')
      || String(dicValores[QD.strIdType] ?? '');
    return `${strTipo} ${String(dicValores[QD.strIdNumber] ?? '')}`.trim();
  });

  // ── S7 · el historial de asignaciones ─────────────────────────────────────────────────────────

  readonly cllHistorial = computed<AsignacionHistorial[]>(() => {
    const genLista = this.sigValores()[QD.lstAssignHistory];
    return Array.isArray(genLista) ? (genLista as AsignacionHistorial[]) : [];
  });

  /** `process_request_id` del caso: lo necesitan la subida de soportes y la lista de archivos. */
  readonly intRequestId = computed(() => this.objTareas.tarea()?.process_request_id ?? null);

  // ── Vista previa de la respuesta ──────────────────────────────────────────────────────────────

  /**
   * Las variables que la plantilla del correo espera, leídas del form. Es el mismo mapeo de React,
   * incluido el `_desc` del tipo de solicitud, que la plantilla prefiere sobre el código.
   */
  private varsRespuesta(): RespuestaFinalVars {
    const dicValores = this.sigValores();
    const strEmpresa = String(dicValores[QD.strCompanyName] ?? '');
    const strPersona =
      `${String(dicValores[QD.strFirstName] ?? '')} ${String(dicValores[QD.strLastName] ?? '')}`;
    return {
      tipo: String(dicValores[QD.strRequestType] ?? '') || 'queja',
      tipoDesc: String(dicValores[`${QD.strRequestType}_desc`] ?? '') || undefined,
      numeroRadicado: String(dicValores[QD.strBpmCaseId] ?? ''),
      nombre: (strEmpresa || strPersona).trim(),
      interaccion: String(dicValores[QD.strInteraction] ?? ''),
      loQueOcurrio: String(dicValores[QD.strComplaintText] ?? ''),
      nuestraRespuesta: String(dicValores[QD.strClientResponse] ?? ''),
      textoProcede: String(dicValores[QD.strActionsTaken] ?? ''),
    };
  }

  /**
   * El HTML de la carta al consumidor. Sale de la plantilla de la colección 46 que corresponde a la
   * favorabilidad (`'1'` a favor del cliente ⇒ fila `09` "queja procede"; cualquier otro ⇒ fila `10`
   * "no procede") y, si no hay ninguna cargada, del generador local.
   *
   * ⚠ La fila se busca por el **`label`** de la opción y el HTML sale de su **`value`**, que es como
   * `CollectionService` proyecta la colección 46: la etiqueta es el nombre de la plantilla (`"09 …
   * queja procede"`) y el valor es el cuerpo del correo. Buscar por una columna `codigo` sobre
   * `records()` es el error natural y no encuentra nada.
   *
   * El fallback no es teórico: la colección se administra desde PM4 y un caso puede abrirse antes de
   * que el GET responda, o con la colección vacía en un entorno recién migrado. Sin él el modal
   * abriría en blanco sin decir por qué.
   */
  private htmlRespuesta(): string {
    const objVars = this.varsRespuesta();
    const strPrefijo = String(this.sigValores()[QD.strFavorability] ?? '') === '1'
      ? EMAIL_TPL_PROCEDE_PREFIX
      : EMAIL_TPL_NO_PROCEDE_PREFIX;

    const strPlantilla = this.objPlantillas.options()
      .find((in_objOpcion) => in_objOpcion.label.trim().startsWith(strPrefijo))?.value;

    return strPlantilla ? fillRespuestaFinalHtml(strPlantilla, objVars) : buildRespuestaFinalHtml(objVars);
  }

  /** Documento que consume `PreviewModalComponent`. Es blob, no `fileId`: el HTML no está en PM4. */
  readonly objDocumentoPrevia = signal<DocumentoVistaPrevia | null>(null);

  /**
   * ACT-0051-05 · vista previa de la respuesta.
   *
   * El blob se arma **al abrir**, con la foto del formulario en ese instante, y se revoca al cerrar —
   * igual que el `useEffect` de React, que depende de `blnShowPreview`. Recalcularlo con cada tecla del
   * textarea de respuesta (que es lo que haría un `computed` sobre `sigValores`) crearía y revocaría un
   * blob por pulsación sin que nadie lo esté mirando.
   */
  abrirVistaPrevia(): void {
    this.revocarBlob();
    const objBlob = new Blob([this.htmlRespuesta()], { type: 'text/html' });
    this.strBlobVigente = URL.createObjectURL(objBlob);
    this.objDocumentoPrevia.set({
      fileName: 'Respuesta al consumidor.html',
      descripcion: 'Vista previa generada — no es el documento definitivo',
      blobUrl: this.strBlobVigente,
    });
    this.blnVistaPreviaAbierta.set(true);
  }

  cerrarVistaPrevia(): void {
    this.blnVistaPreviaAbierta.set(false);
    this.revocarBlob();
    this.objDocumentoPrevia.set(null);
  }

  /** Revoca el blob vigente, si hay. Idempotente: la llaman el cierre, la reapertura y `ngOnDestroy`. */
  private revocarBlob(): void {
    if (!this.strBlobVigente) return;
    URL.revokeObjectURL(this.strBlobVigente);
    this.strBlobVigente = '';
  }

  abrirExpediente(): void {
    this.blnExpedienteAbierto.set(true);
  }

  cerrarExpediente(): void {
    this.blnExpedienteAbierto.set(false);
  }

  // ── El gate de envío ──────────────────────────────────────────────────────────────────────────

  /**
   * **RUL-0051-08 (🔴 BLOQUEA)** · sin respuesta al consumidor y sin favorabilidad no se puede enviar.
   *
   * El `trim()` sobre la respuesta es el mismo de React: un textarea con espacios no es una respuesta.
   * La favorabilidad no lo necesita porque es un select de códigos.
   *
   * ⚠ Se deriva de `sigValores()` y **no** de `form.valid`: `valid` es un getter, no un signal, así que
   * leerlo en un `computed` no crea dependencia y el botón quedaría apagado para siempre. Medido en
   * SCR-012.
   */
  readonly blnPuedeEnviar = computed(() => {
    const dicValores = this.sigValores();
    return !!String(dicValores[QD.strClientResponse] ?? '').trim()
      && !!String(dicValores[QD.strFavorability] ?? '');
  });

  // ── Acciones ──────────────────────────────────────────────────────────────────────────────────

  /**
   * El único punto que escribe `qd_strAction` y despacha a PM4. Devuelve `true` si el envío salió bien.
   *
   * @param in_strAccion Una de las cinco salidas de `AccionFlujoCombinado`.
   * @param in_dicExtra Campos que la acción quiere pisar sobre el valor del form. Lo usa la solicitud
   *   de ayuda, que arma su propio payload para no depender del `valueChanges` que acaba de limpiar los
   *   campos de reasignación (el mismo motivo por el que React pasa un objeto explícito).
   */
  private async enviarCon(
    in_strAccion: AccionFlujoCombinado,
    in_dicExtra: Record<string, unknown> = {},
    in_strUserId = '',
  ): Promise<boolean> {
    this.strErrorEnvio.set('');
    try {
      const intRequestId = this.intRequestId();
      const dicIds = intRequestId
        ? await this.objAdjuntos.subir(intRequestId, this.objRegistro.mapArchivos)
        : {};

      const dicPayload: Record<string, unknown> = {
        ...this.form.getRawValue(),
        ...in_dicExtra,
        ...idsAdjuntosAPayload(dicIds),
        [QD.strAction]: in_strAccion,
        // Solo en `ENVIAR`: ver la cabecera de la clase.
        ...(in_strAccion === 'ENVIAR'
          ? {
              [QD.strDraftDate]: selloFechaHora(),
              [QD.strRevisionVersion]: siguienteVersion(
                String(this.form.getRawValue()[QD.strRevisionVersion] ?? ''),
              ),
            }
          : {}),
      };

      if (in_strAccion === 'GUARDAR_BORRADOR') {
        await this.objTareas.guardarBorrador(dicPayload);
        return true;
      }

      if (in_strAccion === 'CONFIRMAR_ASIGNACION') {
        // La única salida que reasigna: dos PUT, el primero SOLO con `user_id`. Ver la cabecera.
        //
        // ⚠ El id llega por parámetro desde S5 y **no** se lee de `qd_strAssigneeUser`: ese campo
        // guarda el *username*, no el id numérico de PM4. Reasignar con el username hace que PM4
        // responda 200 y no reasigne a nadie — el fallo más silencioso de esta pantalla. Ver el
        // docstring de `usuariosDeGrupo()` y el de `confirmarReasignacion` en `SeccionAsignacion`.
        await this.objTareas.reasignarTarea(dicPayload, in_strUserId);
        return true;
      }

      await this.objTareas.completarTarea(dicPayload);
      return true;
    } catch (in_genError: unknown) {
      this.strErrorEnvio.set(mensajeDeError(in_genError));
      return false;
    }
  }

  /**
   * ACT-0051-01 · confirmar la asignación al usuario elegido en S5.
   *
   * `in_strUserId` es el **id numérico de PM4**, que S5 saca de la opción elegida. Sin id no se
   * despacha nada: un PUT sin `user_id` deja la tarea donde estaba y responde 200 igual.
   */
  async confirmarAsignacion(in_strUserId: string): Promise<void> {
    if (!in_strUserId) return;
    await this.enviarCon('CONFIRMAR_ASIGNACION', {}, in_strUserId);
  }

  /**
   * ACT-0051-03 · solicitar ayuda a otra área. El payload lo arma S6 y llega entero, porque incluye la
   * fila nueva del historial y los tres campos de reasignación **ya limpiados** — leerlos del form acá
   * los tomaría vacíos.
   */
  async solicitarAyuda(in_dicPayload: Record<string, unknown>): Promise<void> {
    await this.enviarCon('AYUDA', in_dicPayload);
  }

  /** ACT-0051-04 · solicitar prórroga. El motivo lo valida S8 antes de llamar (RUL-0051-04). */
  async solicitarProrroga(): Promise<void> {
    await this.enviarCon('SOLICITAR_PRORROGA');
  }

  /**
   * ACT-0051-07 · guardar el borrador y **después** devolver el frame superior a la bandeja de PM4 —
   * solo si el guardado salió bien. Navegar tras un fallo perdería la respuesta redactada sin avisar.
   */
  async guardarBorrador(): Promise<void> {
    const blnOk = await this.enviarCon('GUARDAR_BORRADOR');
    if (!blnOk) return;

    // `window.top` y no `window.location`: la pantalla vive en un iframe dentro de PM4. La guarda es
    // real y no un `!`: `top` es `null` en un contexto cross-origin sin permiso, y ahí es mejor no
    // navegar que reventar después de un guardado exitoso.
    const objTop = window.top;
    if (objTop) objTop.location.href = this.objContexto.urlBandejaTareas();
  }

  /** ACT-0051-08 · enviar la respuesta a revisión SAC. Valida RUL-0051-08. */
  async enviar(): Promise<void> {
    if (!this.blnPuedeEnviar()) return;
    await this.enviarCon('ENVIAR');
  }

  protected readonly QD = QD;
}
