import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { DocSupportUploaderComponent } from '../../../../components/doc-support-uploader';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsStatusBadge } from '../../../../components/fields/zds-status-badge';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZrAlertInline, ZrButton, ZrLoader } from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { InfoBarComponent, type InfoBarItem } from '../../../../components/info-bar';
import { RequestFileListComponent } from '../../../../components/request-file-list';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { AttachmentsService, idsAdjuntosAPayload } from '../../../../core/attachments.service';
import { estadoSlaPorDiasRestantes, estadoSlaVariant } from '../../../../core/business-days';
import { FileRegistryService } from '../../../../core/file-registry.service';
import { mensajeDeError } from '../../../../core/http-error';
import { Pm4ContextService } from '../../../../core/pm4-context.service';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { TaskService } from '../../../../core/task.service';
import { ReasignarCasoModal } from './reasignar-caso-modal';
import {
  type AccionGestionLinea2,
  OS,
  OS_CLIENT_DOC_KEYS,
  SCR003_DEFAULTS,
  SCR003_MAX_SOPORTES,
  SCR003_MIN_ANALISIS,
  SCR003_SLA_UMBRAL_PROXIMO,
  SCR003_SUPPORT_DOC_KEYS,
} from '../fields/fields';

/**
 * SCR-003 · PAN-03 — Bandeja de Tareas / **Gestión Línea 2** (tarea **P02-T12** del proceso P02,
 * Otras Solicitudes).
 *
 * Port de `frontend/src/screens/atencion-cliente/otras-solicitudes/.../GestionLinea2.tsx`. Es la
 * **primera pantalla portada del proceso Otras Solicitudes**, así que además del formulario estrena
 * el registro de campos `os_*` ([`../fields/fields.ts`](../fields/fields.ts)).
 *
 * El usuario del área especializada recibe el caso que la compuerta *¿Requiere Línea 2?* le enrutó:
 * ve el estado y el SLA (S1) y el detalle del caso con los documentos del cliente (S2, ambos de solo
 * lectura), documenta el análisis técnico y las acciones en sistemas (S3), y adjunta los soportes
 * internos que respaldan el análisis y **no** se envían al cliente (S4).
 *
 * ── Lo que esta pantalla estrena en la migración ────────────────────────────────────────────────
 *
 * **1. `FileRegistryService` + `AttachmentsService` en una pantalla real.** Ninguna de las cinco
 * pantallas portadas antes subía archivos, así que acá se ejercita por primera vez el par
 * registro-por-pantalla / servicio-de-root que la Fase 4 dejó armado. El `FileRegistryService` va en
 * los `providers` de **este** componente y no en root: si fuera singleton, los adjuntos de una
 * pantalla viajarían a la siguiente dentro del mismo iframe (ver su docstring).
 *
 * **2. El modal de reasignación (ACT-003-02)** y con él la única acción del proyecto que **cambia el
 * responsable sin completar la tarea**: `reasignarTarea` hace `PUT /tasks/{id}` con solo `{user_id}`
 * y el caso sigue parado en P02-T12. Si alguien la implementara con `completarTarea`, el caso
 * avanzaría de nodo y el usuario reasignado recibiría una tarea que ya no existe.
 *
 * ── Las cuatro acciones y por qué solo tres llegan a PM4 ────────────────────────────────────────
 * `AccionGestionLinea2` tiene tres valores para cuatro acciones del anexo. *Cancelar* (ACT-003-03) es
 * **local**: repone los valores del caso y vacía el registro de archivos, sin ningún PUT. Por eso no
 * tiene valor de `os_strAction` — inventarle uno le haría creer al gateway que existe una salida BPMN
 * que no existe.
 *
 * ── El gate de RUL-003-01 se deriva de `sigValores()`, NUNCA de `form.valid` ────────────────────
 * ⚠ No se puede escribir `this.form.valid` dentro de un `computed`: `valid` es un *getter* de
 * `AbstractControl`, no un signal, así que no crea dependencia reactiva y el computed queda con el
 * valor cacheado del primer render (form vacío → inválido). El síntoma es que el botón principal no
 * se habilita nunca y la acción queda inalcanzable. Está medido y documentado en SCR-012, que lo
 * aprendió a los golpes; acá se aplica desde el principio.
 *
 * ── Cancelar tiene que seguir siendo alcanzable con S3 vacío ────────────────────────────────────
 * `os_strTechAnalysis` lleva `Validators.required` + `minLength(100)` (FLD-049), pero *Cancelar* y
 * *Reasignar* no miran `form.valid` en ningún momento: el escenario real de reasignar es justamente
 * "no puedo resolverlo, que lo tome otro", con el análisis sin escribir. Es el mismo contrato que
 * `cancelar()` en SCR-012.
 *
 * ── El error de envío NO se traga ───────────────────────────────────────────────────────────────
 * `enviarCon()` devuelve un booleano y el `catch` deja el mensaje en `strErrorEnvio`. Importa porque
 * *Guardar Borrador* navega el frame superior a la bandeja de PM4 **solo si el guardado salió bien**
 * (ACT-003-04): navegar ante un fallo perdería el trabajo del usuario sin decirle nada.
 */
@Component({
  selector: 'app-gestion-linea2',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    InfoBarComponent,
    RequestFileListComponent,
    DocSupportUploaderComponent,
    ReasignarCasoModal,
    ZdsInput,
    ZdsTextarea,
    ZdsStatusBadge,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrLoader,
  ],
  // Registro de binarios POR PANTALLA. Ver el punto 1 de la cabecera y el docstring del servicio.
  providers: [FileRegistryService],
  templateUrl: './gestion-linea2.html',
})
export class GestionLinea2 implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objAdjuntos = inject(AttachmentsService);
  private readonly objRegistro = inject(FileRegistryService);
  private readonly objContexto = inject(Pm4ContextService);

  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  /** FLD-048 · los `data_name` con los que se filtran los documentos del cliente en S2. */
  readonly cllDocsCliente = OS_CLIENT_DOC_KEYS;

  /** FLD-052 · los slots de soporte interno de S4, y su tope. */
  readonly cllDocsSoporte = SCR003_SUPPORT_DOC_KEYS;
  readonly intMaxSoportes = SCR003_MAX_SOPORTES;

  /**
   * Los tres textos que interpolan una constante del anexo. Viven acá y no literales en la plantilla
   * para que el número salga de `SCR003_MIN_ANALISIS`/`SCR003_MAX_SOPORTES` y no haya dos verdades: si
   * el anexo cambia el mínimo a 150, el placeholder, la ayuda y el validador se mueven juntos.
   */
  readonly strPlaceholderAnalisis =
    `Documente el análisis de la solicitud y la solución adoptada. ` +
    `Mínimo ${SCR003_MIN_ANALISIS} caracteres…`;
  readonly strAyudaAnalisis =
    `Mínimo ${SCR003_MIN_ANALISIS} caracteres. Debe documentar la solución adoptada.`;
  readonly strIntroSoportes =
    `Adjunte los soportes internos del análisis. No van al cliente: son solo de uso interno. ` +
    `Máx ${SCR003_MAX_SOPORTES} archivos.`;

  /** Mensaje del fallo del último envío. Lo pinta la alerta sobre la barra de acciones. */
  readonly strErrorEnvio = signal('');

  readonly blnModalReasignar = signal(false);

  /** Se levanta al primer intento de confirmar. Hasta entonces no se pinta el error de S3. */
  readonly blnIntentoEnvio = signal(false);

  readonly form = new FormGroup({
    // ── S1 · Encabezado Estado del Caso (SEC-009) — FLD-040…043, todo de solo lectura ──
    [OS.strBpmCaseId]: new FormControl(''),
    [OS.strCaseType]: new FormControl(''),
    [OS.intSlaRemaining]: new FormControl<number | string>(''),
    [OS.strDueDate]: new FormControl(''),

    // ── S2 · Detalle del Caso Asignado (SEC-010) — FLD-044…047, todo de solo lectura ──
    [OS.strConsumerName]: new FormControl(''),
    [OS.strIdentification]: new FormControl(''),
    [OS.strProductLine]: new FormControl(''),
    [OS.strCaseDescription]: new FormControl(''),

    // ── S3 · Análisis y Respuesta Técnica (SEC-011) ──
    // FLD-049 · el único obligatorio de la pantalla, con su mínimo de 100 caracteres.
    [OS.strTechAnalysis]: new FormControl('', [
      Validators.required,
      Validators.minLength(SCR003_MIN_ANALISIS),
    ]),
    // FLD-050 · opcional.
    [OS.strSystemActions]: new FormControl(''),

    // ── S4 · Soportes Internos (SEC-012) — FLD-052, un control por slot ──
    // Guardan el NOMBRE del archivo; el binario vive en `FileRegistryService` hasta el submit.
    [OS.strSupportDoc01]: new FormControl(''),
    [OS.strSupportDoc02]: new FormControl(''),
    [OS.strSupportDoc03]: new FormControl(''),
    [OS.strSupportDoc04]: new FormControl(''),
    [OS.strSupportDoc05]: new FormControl(''),
    [OS.strSupportDoc06]: new FormControl(''),
    [OS.strSupportDoc07]: new FormControl(''),
    [OS.strSupportDoc08]: new FormControl(''),
    [OS.strSupportDoc09]: new FormControl(''),
    [OS.strSupportDoc10]: new FormControl(''),

    // ── Soporte de ACT-003-02 (sin FLD) — los dos campos del modal de reasignación ──
    [OS.strAssigneeArea]: new FormControl(''),
    [OS.strAssigneeUser]: new FormControl(''),
  });

  /**
   * Espejo en signal del valor del form. Se siembra con `getRawValue()` y no con `{}` porque los
   * computeds se leen en el primer render, antes de que ningún `valueChanges` haya emitido.
   */
  private readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /**
   * FLD-042 · el SLA llega **ya calculado** en días hábiles (su *Fuente* en el anexo es *Sistema*), a
   * diferencia de Quejas Directas donde se deriva en el cliente. El parse es defensivo porque un caso
   * sin SLA resuelto lo manda vacío o como texto — de ahí el `String(...)` antes del `parseInt`.
   */
  private readonly intDiasSla = computed(() =>
    Number.parseInt(String(this.sigValores()[OS.intSlaRemaining] ?? ''), 10),
  );

  private readonly blnTieneSla = computed(() => Number.isFinite(this.intDiasSla()));

  /**
   * Los dos de arriba expuestos a la plantilla. Son alias y no una duplicación: los `private` los
   * consumen los demás computeds de la clase, y la plantilla necesita el mismo dato para decidir entre
   * la píldora y el guión. Mantenerlos privados y agregar el alias deja explícito que el cálculo tiene
   * un solo dueño.
   */
  readonly blnTieneSlaVisible = this.blnTieneSla;
  readonly intDiasSlaVisible = this.intDiasSla;

  readonly strEstadoSla = computed(() =>
    estadoSlaPorDiasRestantes(this.intDiasSla(), this.blnTieneSla(), SCR003_SLA_UMBRAL_PROXIMO),
  );

  readonly strVarianteSla = computed(() => estadoSlaVariant(this.strEstadoSla()));

  /** Dispara el banner rojo de SLA en zona de vencimiento. Umbral en `SCR003_SLA_UMBRAL_PROXIMO`. */
  readonly blnSlaCritico = computed(
    () => this.blnTieneSla() && this.intDiasSla() <= SCR003_SLA_UMBRAL_PROXIMO,
  );

  /** Texto del badge del SLA. La unidad va explícita: el SLA de este proceso es en días **hábiles**. */
  readonly strTextoSla = computed(() => `${this.intDiasSla()} días hábiles`);

  /** FLD-041 · la tipología, para decidir entre el badge y el guión. */
  readonly strTipologia = computed(() => String(this.sigValores()[OS.strCaseType] ?? ''));

  /**
   * **RUL-003-01 (🔴 BLOQUEA)** · sin análisis técnico no se puede confirmar la atención.
   *
   * Espeja el `Validators.required` declarado arriba —que sigue siendo la obligatoriedad
   * ejecutable— y agrega el `trim()`, porque `required` solo rechaza `''` y `null`: un textarea con
   * espacios dejaría confirmar sin análisis. **No** incluye el mínimo de 100 caracteres, y eso es
   * deliberado: React pone el gate del botón en `!!analisis.trim()` y el mínimo lo reporta el campo
   * al enviar. Mover el mínimo al gate cambiaría la afordancia de la pantalla (el botón quedaría
   * apagado hasta el carácter 100) y sería un cambio funcional de contrabando en una migración.
   */
  readonly blnPuedeConfirmar = computed(
    () => !!String(this.sigValores()[OS.strTechAnalysis] ?? '').trim(),
  );

  /**
   * Mensaje de error del campo de S3, con los textos **literales del Anexo02**.
   *
   * El `required` solo habla después del primer intento de confirmar (es el `objErr.type ===
   * 'required' && !isSubmitted` del helper `err()` de React: un campo obligatorio vacío al abrir la
   * pantalla no es un error del usuario todavía). El `minLength` en cambio habla siempre, porque solo
   * puede dispararse con algo tipeado — y ahí sí es información útil mientras escribe.
   *
   * ⚠ Se lee de `sigValores()` y no solo del control para que el computed **se recalcule**: como el
   * resto de la clase, `hasError()` no es reactivo por sí mismo.
   */
  readonly strErrorAnalisis = computed(() => {
    this.sigValores();
    const objControl = this.form.get(OS.strTechAnalysis);
    if (!objControl) return '';
    if (objControl.hasError('required')) {
      return this.blnIntentoEnvio()
        ? 'Debe documentar el análisis o resolución antes de confirmar la atención.'
        : '';
    }
    if (objControl.hasError('minlength')) {
      return `El análisis debe tener al menos ${SCR003_MIN_ANALISIS} caracteres.`;
    }
    return '';
  });

  /** `process_request_id` del caso: lo necesitan la subida de adjuntos y la lista de S2. */
  readonly intRequestId = computed(() => this.objTareas.tarea()?.process_request_id ?? null);

  /**
   * Plantillas de los badges de la barra de contexto. `InfoBarComponent` acepta un `TemplateRef` como
   * valor justamente para esto: la ctx-bar de la maqueta muestra el SLA, la tipología y el estado como
   * píldoras, no como texto plano.
   *
   * Son `viewChild` **no requeridos** aunque los tres `<ng-template>` estén siempre en la plantilla:
   * `cllInfoItems` se evalúa en el primer render, antes de que las queries de vista se resuelvan, así
   * que un `viewChild.required` reventaría con NG0951. El `?? '—'` de abajo cubre esa primera pasada,
   * y la barra se repinta con los badges cuando la query se resuelve.
   */
  private readonly tplBadgeSla = viewChild<TemplateRef<unknown>>('badgeSla');
  private readonly tplBadgeTipologia = viewChild<TemplateRef<unknown>>('badgeTipologia');
  private readonly tplBadgeEstado = viewChild<TemplateRef<unknown>>('badgeEstado');

  /**
   * Los 4 ítems de la ctx-bar (maqueta `#screen-scr003 .ctx-bar`).
   *
   * SLA y Tipología caen a `'—'` **como texto plano** cuando el caso no trae el dato, igual que
   * React: un badge vacío se vería como una píldora de color sin contenido, que es peor que el guión.
   *
   * ⚠ **"Estado" no es un campo del anexo**: no existe en `03_Campos` para SCR-003. Se rotula fijo
   * como *Asignado a Línea 2* porque mientras esta pantalla está abierta la tarea **es** P02-T12
   * (suposición 8 de la ficha). Inventarle una variable `os_*` sería agregar contrato con PM4 que el
   * proceso no emite.
   */
  readonly cllInfoItems = computed<InfoBarItem[]>(() => [
    { label: 'Caso', value: String(this.sigValores()[OS.strBpmCaseId] ?? '') || '—' },
    { label: 'SLA', value: this.blnTieneSla() ? (this.tplBadgeSla() ?? '—') : '—' },
    { label: 'Tipología', value: this.strTipologia() ? (this.tplBadgeTipologia() ?? '—') : '—' },
    { label: 'Estado', value: this.tplBadgeEstado() ?? 'Asignado a Línea 2' },
  ]);

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /**
   * Vuelca `task.data` al form filtrando por las claves que el form declara. El filtro no es
   * defensivo: `task.data` trae el caso entero (decenas de `os_*` de otras pantallas del proceso), y
   * iterar sobre `this.form.controls` deja explícito que esta pantalla solo toca sus campos.
   */
  private precargar(): void {
    const objTarea = this.objTareas.tarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }

    this.form.patchValue({ ...SCR003_DEFAULTS, ...dicParche });
  }

  /** ACT-003-01 · confirmar la atención de Línea 2. Es la única acción que valida RUL-003-01. */
  async confirmarAtencion(): Promise<void> {
    this.blnIntentoEnvio.set(true);

    if (!this.blnPuedeConfirmar() || this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError(this.form);
      return;
    }

    await this.enviarCon('CONFIRMAR_ATENCION');
  }

  /**
   * ACT-003-04 · guardar el progreso sin avanzar el flujo, y **después** devolver el frame superior a
   * la bandeja de PM4 — solo si el guardado salió bien. Ver el último bloque de la cabecera.
   */
  async guardarBorrador(): Promise<void> {
    const blnOk = await this.enviarCon('GUARDAR_BORRADOR');
    if (!blnOk) return;

    // `window.top` y no `window.location`: la pantalla vive en un iframe dentro de PM4, así que
    // navegar el frame propio dejaría la bandeja embebida dentro del formulario. El `!` de React
    // (`window.top!`) se reemplaza por una guarda real: `top` es `null` en un contexto cross-origin
    // sin permiso, y ahí es mejor no navegar que reventar después de un guardado exitoso.
    const objTop = window.top;
    if (objTop) objTop.location.href = this.objContexto.urlBandejaTareas();
  }

  /**
   * ACT-003-03 · descartar los cambios volviendo a los valores del caso, y vaciar el registro de
   * binarios. **No hay PUT**: es una acción local, por eso no tiene `os_strAction`.
   *
   * El `reset` va con el spread de los defaults igual que la precarga, para que un campo que no
   * viniera en `task.data` vuelva a su default y no quede con lo que el usuario había tipeado.
   */
  cancelar(): void {
    this.strErrorEnvio.set('');
    this.blnIntentoEnvio.set(false);
    const dicDatos = (this.objTareas.tarea()?.data ?? {}) as Record<string, unknown>;
    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }
    this.form.reset({ ...SCR003_DEFAULTS, ...dicParche });
    this.objRegistro.limpiar();
  }

  /**
   * ACT-003-02 · reasignar el caso a otro usuario de Línea 2.
   *
   * ⚠ Usa `reasignarTarea` y **no** `completarTarea`: solo cambia el responsable, sin completar la
   * tarea ni avanzar el flujo BPM. El caso sigue parado en P02-T12 y el usuario reasignado lo
   * encuentra en su bandeja. Con `completarTarea` el caso avanzaría de nodo y la reasignación
   * apuntaría a una tarea que ya no existe — y PM4 respondería 200 igual.
   */
  async reasignar(in_strUserId: string): Promise<void> {
    this.strErrorEnvio.set('');
    try {
      await this.objTareas.reasignarTarea(
        { ...this.form.getRawValue(), [OS.strAction]: 'REASIGNAR' },
        in_strUserId,
      );
      this.blnModalReasignar.set(false);
    } catch (excError) {
      console.error('[GestionLinea2] Error al reasignar el caso:', excError);
      this.strErrorEnvio.set(mensajeDeError(excError));
    }
  }

  /**
   * Sube los soportes internos y manda el payload con su `os_strAction`.
   *
   * @returns `true` si el envío salió bien. El booleano es el contrato con `guardarBorrador()`, que
   *   navega solo si hubo éxito. **El error no se traga**: si no se completa la tarea PM4 no cierra
   *   el iframe, así que el usuario tiene que ver por qué.
   */
  private async enviarCon(in_strAccion: AccionGestionLinea2): Promise<boolean> {
    this.strErrorEnvio.set('');

    try {
      // Los adjuntos van ANTES del PUT: el `<docKey>_id` que PM4 devuelve al subir cada archivo
      // viaja dentro del mismo `data`, así que sin subir primero no hay id que mandar.
      const intRequestId = this.intRequestId();
      const dicIds =
        intRequestId && this.objRegistro.intCantidad > 0
          ? await this.objAdjuntos.subir(intRequestId, this.objRegistro.mapArchivos)
          : {};

      const dicPayload: Record<string, unknown> = {
        ...this.form.getRawValue(),
        ...idsAdjuntosAPayload(dicIds),
        [OS.strAction]: in_strAccion,
      };

      if (in_strAccion === 'GUARDAR_BORRADOR') {
        await this.objTareas.guardarBorrador(dicPayload);
        return true;
      }

      await this.objTareas.completarTarea(dicPayload);
      return true;
    } catch (excError) {
      console.error('[GestionLinea2] Error al enviar:', excError);
      this.strErrorEnvio.set(mensajeDeError(excError));
      return false;
    }
  }
}
