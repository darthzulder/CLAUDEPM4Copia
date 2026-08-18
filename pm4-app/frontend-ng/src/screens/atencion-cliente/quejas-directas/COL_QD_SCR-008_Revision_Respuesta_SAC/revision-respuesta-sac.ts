import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZrAlertInline, ZrButton, ZrLoader } from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { PreviewModalComponent } from '../../../../components/preview-modal';
import { RequestFileListComponent } from '../../../../components/request-file-list';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { CollectionService } from '../../../../core/collection.service';
import { selloFechaHoraDesdeIso } from '../../../../core/fecha-hora';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { TaskService } from '../../../../core/task.service';
import {
  QD,
  QD_COLLECTIONS,
  SCR000_ADJUNTO_KEYS,
  SCR008_DEFAULTS as DEFAULTS,
  SCR008_SLA_UMBRAL_CRITICO as SLA_UMBRAL_CRITICO,
  SCR0051_ADJUNTO_KEYS as ADJUNTO_KEYS,
  type AccionRevisionSAC,
} from '../fields/fields';
import {
  buildRespuestaFinalHtml,
  fillRespuestaFinalHtml,
} from '../COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/respuestaFinalTemplate';

/**
 * Correos de la colección 46 (Mails BPM) para la respuesta final. La favorabilidad
 * (`qd_strFavorability`) decide cuál: `'1'` = a favor del Cliente ⇒ "09 … queja procede"; cualquier
 * otro ⇒ "10 … queja no procede". (Misma lógica que SCR-0051.)
 */
const EMAIL_TPL_PROCEDE_PREFIX = '09';
const EMAIL_TPL_NO_PROCEDE_PREFIX = '10';

/** Lo que se muestra cuando un campo de solo lectura no trae dato. */
const STR_PLACEHOLDER = '—';

/**
 * SCR-008 · Revisión Respuesta SAC — el Analista SAC revisa el borrador que elaboró el Área
 * Responsable y **aprueba**, **devuelve con observaciones** o **reasigna** el caso.
 *
 * Port de `frontend/src/screens/.../COL_QD_SCR-008_Revision_Respuesta_SAC/RevisionRespuestaSac.tsx`.
 * La trazabilidad FLD/RUL/MSG/ACT contra el Anexo02 vive en
 * [DOCUMENTACION_COL_QD_SCR-008_Revision_Respuesta_SAC.md](./DOCUMENTACION_COL_QD_SCR-008_Revision_Respuesta_SAC.md),
 * al lado de este archivo, y ahí está anotada la única divergencia que este port arrastra respecto
 * del anexo (§4 pide S2 de solo lectura y el código la deja editable, deliberadamente).
 *
 * ── Los dos límites de negocio que gobiernan la pantalla ────────────────────────────────────────
 * - **RUL-008-01 (🔴 bloquea):** no se puede devolver sin observaciones. Vive en
 *   [`blnPuedeDevolver`](#blnPuedeDevolver) y se aplica en **dos** lugares a propósito: deshabilita
 *   el botón (afordancia) *y* corta en el handler con un `setErrors` (guarda real). Lo segundo no es
 *   redundante — un `disabled` del DS no impide invocar el handler, que es exactamente la trampa que
 *   `docs/guides/testing-conventions.md` documenta para los controles de Zurich bajo jsdom.
 * - **RUL-008-02 (informativa):** banner rojo si el SLA restante es ≤ 3 días hábiles. Vive en
 *   [`blnSlaCritico`](#blnSlaCritico).
 *
 * ── El contrato de envío, que es lo más fácil de romper sin que se note ─────────────────────────
 * `qd_blnSACApproved` es la decisión booleana del SAC y **solo dos de las tres acciones la escriben**:
 * `APROBAR` ⇒ `true`, `DEVOLVER` ⇒ `false`, y **`REASIGNAR` no la toca** (viaja el valor que ya venía
 * en el caso). Reasignar no es una decisión sobre la respuesta, así que sobrescribirla con `false`
 * marcaría el borrador como rechazado por el solo hecho de haber cambiado de responsable. El spec lo
 * asevera con un caso que entra con `true`, porque asegurar `false` contra el default `false` pasaría
 * igual si alguien agregara la rama prohibida.
 *
 * ── Por qué `CollectionService` va en `providers` y no se inyecta de root ───────────────────────
 * Es `@Injectable()` sin `providedIn`, o sea **una instancia por consumidor**: guarda `options` de
 * *una* colección en sus signals. Esta pantalla necesita solo la 46 (plantillas de correo), así que
 * una instancia alcanza; una pantalla con dos selects dinámicos necesitaría dos providers, no un
 * singleton compartido que se pisaría las opciones.
 */
@Component({
  selector: 'app-revision-respuesta-sac',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    RequestFileListComponent,
    PreviewModalComponent,
    ZdsInput,
    ZdsTextarea,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrLoader,
  ],
  providers: [CollectionService],
  templateUrl: './revision-respuesta-sac.html',
})
export class RevisionRespuestaSac implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objColeccion = inject(CollectionService);

  /** Estado de la tarea, tal como lo exponía `useTask()` en React. */
  readonly objTarea = this.objTareas.tarea;
  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  readonly cllAdjuntosRadicador = SCR000_ADJUNTO_KEYS;
  readonly cllSoportesInternos = ADJUNTO_KEYS;

  /**
   * El formulario, tipado sobre `SCR008_DEFAULTS`.
   *
   * ── Los `maxLength` de React viven en DOS lugares, y hacen falta los dos ───────────────────
   * En React eran `<ZdsTextarea maxLength={5000} />`, un solo atributo que hacía las dos cosas. Acá
   * se separan porque son dos contratos distintos:
   *
   *  1. **El límite efectivo** es el `Validators.maxLength(n)` de abajo, y es el único que de verdad
   *     invalida el control. Va acá y no en el componente porque `lib-textarea-z` **no registra
   *     control en el group** (su `ngOnInit` nunca llama `generateControl()`), así que no compone
   *     ningún validador propio: lo que se le pase es puramente visual.
   *  2. **El contador visual** (`9/5000`) es el `[maxLength]` de `zds-textarea` en la plantilla.
   *
   * ⚠ **Este comentario decía antes que el input de la fachada no existía y que pasarlo sería un
   * falso verde.** Era cierto cuando se escribió —el `[attr.max-length]` de `lib-textarea-z` muere
   * antes de llegar al `z-textarea`— y dejó de serlo cuando `zds-textarea` lo neutralizó reponiendo
   * el atributo con un `afterRenderEffect`. Mientras el comentario quedó viejo, esta pantalla se
   * portó **sin** los tres `[maxLength]` y los tres contadores que React sí pinta faltaban. Medido
   * lado a lado con la task 171840: React mostraba `9/5000`, `12/5000` y `0/2000`; Angular ninguno.
   * Ver el bloque del `maxLength` en
   * [zds-textarea.ts](../../../../components/fields/zds-textarea.ts).
   *
   * `qd_strSacRemarks` **no lleva `Validators.required`**, aunque RUL-008-01 lo exija para devolver:
   * la obligatoriedad es **condicional a la acción**, no del campo. Un `required` fijo dejaría el
   * form inválido al montar y bloquearía *Aprobar*, que por ACT-008-01 no pide observaciones. Se
   * aplica en el handler de devolver, igual que el `setError` de React.
   */
  readonly form = new FormGroup({
    [QD.strSfcCode]: new FormControl(''),
    [QD.strSlaAssigned]: new FormControl(''),
    [QD.strRevisionVersion]: new FormControl(''),
    [QD.strAssigneeArea]: new FormControl(''),
    [QD.strResponsableRole]: new FormControl(''),
    [QD.strDraftDate]: new FormControl(''),
    [QD.strChannel]: new FormControl(''),
    [QD.strReceptionInstance]: new FormControl(''),
    [QD.strAdmission]: new FormControl(''),
    [QD.strControlEntity]: new FormControl(''),
    [QD.strSfcProduct]: new FormControl(''),
    [QD.strInteraction]: new FormControl(''),
    [QD.strSfcReason]: new FormControl(''),
    [QD.strComplaintText]: new FormControl(''),
    [QD.strBpmCaseId]: new FormControl(''),
    [QD.strRequestType]: new FormControl(''),
    [QD.strEmail]: new FormControl(''),
    [QD.strFavorability]: new FormControl(''),
    [QD.strFirstName]: new FormControl(''),
    [QD.strLastName]: new FormControl(''),
    [QD.strCompanyName]: new FormControl(''),
    [QD.strClientResponse]: new FormControl('', [Validators.maxLength(5000)]),
    [QD.strActionsTaken]: new FormControl('', [Validators.maxLength(5000)]),
    [QD.strAcknowledgment]: new FormControl(''),
    [QD.strCompensation]: new FormControl(''),
    [QD.strSacRemarks]: new FormControl('', [Validators.maxLength(2000)]),
    [QD.blnSacApproved]: new FormControl<boolean | string>(''),
    [QD.strAction]: new FormControl(''),
  });

  /**
   * Espejo del valor del form como signal, que es el equivalente del `watch()` de react-hook-form.
   *
   * `valueChanges` es un `Observable` y no notifica a los `computed` de Angular, así que sin este
   * puente `blnPuedeDevolver` nunca se recalcularía al tipear y el botón *Devolver* quedaría
   * deshabilitado para siempre. Se suscribe en el constructor y se desuscribe en `ngOnDestroy`.
   *
   * ⚠ Se siembra con `getRawValue()` y no con `{}`: si arrancara vacío, todo lo derivado leería
   * `undefined` hasta el primer cambio del usuario, y la precarga de `patchValue` —que sí emite—
   * es lo único que lo poblaría. Con la semilla el estado inicial ya es coherente.
   */
  private readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /** Visibilidad de la vista previa (ACT-008-04). */
  readonly blnVerVistaPrevia = signal(false);

  /** URL del blob de la carta. `null` mientras no hay vista previa abierta. */
  readonly strUrlVistaPrevia = signal<string | null>(null);

  /**
   * Marca de que ya se intentó enviar, para el mismo `isSubmitted` de react-hook-form: el error de
   * *requerido* de las observaciones no se pinta hasta que el SAC intenta devolver. Sin esto la
   * pantalla abriría con el campo en rojo, que es lo contrario de lo que RUL-008-01 quiere decir
   * (es obligatorio *para devolver*, no para estar en la pantalla).
   */
  readonly blnIntentoEnvio = signal(false);

  /**
   * RUL-008-02 · MSG-008-02 — SLA crítico.
   *
   * `Number.isFinite` sobre el `parseInt` es la guarda que importa: `qd_strSlaAssigned` viaja como
   * **string** desde PM4 y puede llegar vacío. `parseInt('')` es `NaN`, y `NaN <= 3` es `false`, así
   * que sin el `isFinite` el resultado ya sería el correcto por accidente — se conserva explícito
   * porque el día que el umbral se compare al revés (`>=`) el accidente se da vuelta en silencio.
   */
  readonly blnSlaCritico = computed(() => {
    const intSla = Number.parseInt(String(this.sigValores()[QD.strSlaAssigned] ?? ''), 10);
    return Number.isFinite(intSla) && intSla <= SLA_UMBRAL_CRITICO;
  });

  /** El SLA tal como se muestra en el banner. */
  readonly strSlaAsignado = computed(() => String(this.sigValores()[QD.strSlaAssigned] ?? ''));

  /** RUL-008-01 — observaciones obligatorias para devolver. */
  readonly blnPuedeDevolver = computed(() =>
    !!String(this.sigValores()[QD.strSacRemarks] ?? '').trim(),
  );

  /** Versión bajo revisión (FLD-122), que se pinta como texto plano y no como campo. */
  readonly strVersionRevision = computed(
    () => String(this.sigValores()[QD.strRevisionVersion] ?? '') || STR_PLACEHOLDER,
  );

  /** Momento de la interacción, texto plano. */
  readonly strInteraccion = computed(
    () => String(this.sigValores()[QD.strInteraction] ?? '') || STR_PLACEHOLDER,
  );

  /**
   * Mensaje de error de las observaciones, o `''`.
   *
   * Réplica del `err()` de React: el `required` se oculta hasta que se intentó enviar. El resto de
   * los errores (hoy solo `maxLength`) se muestran siempre, porque el usuario los provocó tipeando.
   */
  readonly strErrorObservaciones = computed(() => {
    if (!this.blnIntentoEnvio()) return '';
    return this.blnPuedeDevolver() ? '' : 'Campo requerido';
  });

  /** Nombre del cliente (jurídica gana sobre natural), para el destinatario de la carta. */
  readonly strNombreCliente = computed(() => this.nombreDe(this.sigValores()));

  /** Descripción del documento en la vista previa. */
  readonly objDocumentoVistaPrevia = computed(() => ({
    fileName: 'Vista previa — carta de respuesta final',
    descripcion: `Destinatario: ${this.strNombreCliente() || STR_PLACEHOLDER} (${
      String(this.sigValores()[QD.strEmail] ?? '') || STR_PLACEHOLDER
    })`,
    blobUrl: this.strUrlVistaPrevia(),
  }));

  /**
   * ACT-008-04 — construye la carta al abrir la vista previa y **revoca el blob al cerrarla**.
   *
   * El `URL.revokeObjectURL` no es higiene opcional: sin él cada apertura deja el HTML de la carta
   * retenido en el proceso hasta recargar el iframe, y esta pantalla vive dentro de PM4 donde nadie
   * recarga. Es el port del `return () => URL.revokeObjectURL(...)` del `useEffect` de React, que en
   * Angular corresponde a la función de limpieza del `effect` (corre antes de cada re-ejecución y al
   * destruir el componente).
   */
  private readonly efVistaPrevia = effect((in_objLimpieza) => {
    if (!this.blnVerVistaPrevia()) return;

    // Se lee `options()` para que el efecto se re-ejecute cuando la colección 46 termine de cargar:
    // si el SAC abre la vista previa antes de que llegue, se pinta la plantilla local y en cuanto
    // llega la fila real se reconstruye con ella.
    const cllPlantillas = this.objColeccion.options();
    const dicDatos = this.form.getRawValue() as Record<string, unknown>;

    const objVars = {
      tipo: String(dicDatos[QD.strRequestType] ?? '') || 'queja',
      tipoDesc: dicDatos[`${QD.strRequestType}_desc`] as string | undefined,
      numeroRadicado: String(dicDatos[QD.strBpmCaseId] ?? ''),
      nombre: this.nombreDe(dicDatos),
      interaccion: String(dicDatos[QD.strInteraction] ?? ''),
      loQueOcurrio: String(dicDatos[QD.strComplaintText] ?? ''),
      nuestraRespuesta: String(dicDatos[QD.strClientResponse] ?? ''),
      textoProcede: String(dicDatos[QD.strActionsTaken] ?? ''),
    };

    // '1' = a favor del Cliente ⇒ queja procede (fila 09); cualquier otro ⇒ no procede (fila 10).
    const strPrefijo =
      dicDatos[QD.strFavorability] === '1' ? EMAIL_TPL_PROCEDE_PREFIX : EMAIL_TPL_NO_PROCEDE_PREFIX;
    const strHtmlCrudo = cllPlantillas.find((in_objOpcion) =>
      in_objOpcion.label.trim().startsWith(strPrefijo),
    )?.value;

    const strHtml = strHtmlCrudo
      ? fillRespuestaFinalHtml(strHtmlCrudo, objVars)
      : buildRespuestaFinalHtml(objVars);

    const strUrl = URL.createObjectURL(new Blob([strHtml], { type: 'text/html' }));
    this.strUrlVistaPrevia.set(strUrl);

    in_objLimpieza(() => {
      URL.revokeObjectURL(strUrl);
      this.strUrlVistaPrevia.set(null);
    });
  });

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();
    // La colección 46 se pide una vez y sin gating: no depende de ningún campo del form.
    void this.objColeccion.cargar(QD_COLLECTIONS.emailTemplates);
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /**
   * Precarga desde `task.data` con las **tres cadenas de respaldo** que documenta el anexo (§4).
   * No son cosmética: sin ellas la pantalla abre con tres campos de contexto vacíos y el SAC no sabe
   * qué versión está revisando.
   *
   * 1. **ID Caso / Código SFC** — `qd_strSfcCode` lo asigna la SFC al radicar, que en SP2 todavía no
   *    pasó; se cae al número de caso BPM.
   * 2. **Fecha de elaboración del borrador** — la sella SCR-0051 al *Enviar*; para casos ya en curso
   *    se cae al `created_at` de **esta** tarea, que el BPM crea en el mismo instante del envío.
   * 3. **Versión bajo revisión** — la incrementa SCR-0051; sin contador, lo que el SAC tiene enfrente
   *    es la `v1`.
   */
  private precargar(): void {
    const objTarea = this.objTarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const texto = (in_strClave: string): string => String(dicDatos[in_strClave] ?? '');

    // Solo las claves que el form declara: `patchValue` ignora las demás, pero pasar `task.data`
    // entero dejaría el descarte a merced de Angular en vez de declararlo acá.
    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }

    this.form.patchValue({
      ...DEFAULTS,
      ...dicParche,
      [QD.strSfcCode]: texto(QD.strSfcCode) || texto(QD.strBpmCaseId) || '',
      [QD.strDraftDate]:
        texto(QD.strDraftDate).trim() || selloFechaHoraDesdeIso(objTarea.created_at),
      [QD.strRevisionVersion]: texto(QD.strRevisionVersion).trim() || 'v1',
    });
  }

  /**
   * Descripción legible de un campo respaldado por colección.
   *
   * Port de `descDe()`: los campos de Clasificación Regulatoria guardan el **código** (calculado en
   * M1) y viajan con su compañera `<campo>_desc` (convención `_desc` del proyecto). Se prefiere la
   * descripción, se cae al código y por último al guion — mostrar un código crudo es feo, pero
   * mostrar vacío esconde que el dato existe.
   *
   * Los `_desc` **no son controles del form**: no se editan y sumarlos duplicaría 7 campos. Se leen
   * de `task.data` directo.
   */
  descDe(in_strBase: string): string {
    const dicDatos = (this.objTarea()?.data ?? {}) as Record<string, unknown>;
    const strDesc = String(dicDatos[`${in_strBase}_desc`] ?? '').trim();
    if (strDesc) return strDesc;
    return String(this.sigValores()[in_strBase] ?? '') || STR_PLACEHOLDER;
  }

  /** Nombre del cliente: la razón social gana; si no, nombre + apellido. */
  private nombreDe(in_dicDatos: Record<string, unknown>): string {
    const strEmpresa = String(in_dicDatos[QD.strCompanyName] ?? '').trim();
    if (strEmpresa) return strEmpresa;
    return `${String(in_dicDatos[QD.strFirstName] ?? '')} ${String(
      in_dicDatos[QD.strLastName] ?? '',
    )}`.trim();
  }

  abrirVistaPrevia(): void {
    this.blnVerVistaPrevia.set(true);
  }

  cerrarVistaPrevia(): void {
    this.blnVerVistaPrevia.set(false);
  }

  /** ACT-008-01 — Aprobar Respuesta. No exige observaciones. */
  aprobar(): void {
    void this.enviarCon('APROBAR');
  }

  /** ACT-008-03 — Reasignar Caso. El enrutamiento a SP2-T03 lo resuelve el BPM. */
  reasignar(): void {
    void this.enviarCon('REASIGNAR');
  }

  /**
   * ACT-008-02 — Devolver con Observaciones (RUL-008-01).
   *
   * ⚠ La guarda es **acá**, no solo en el `[disabled]` del botón. Un `disabled` de un componente del
   * DS no impide que el handler se invoque (es la trampa 1 de `testing-conventions.md`: un `z-button`
   * deshabilitado igual dispara su click), así que sin este corte se podría devolver sin
   * observaciones y el área recibiría el caso de vuelta sin saber qué corregir.
   *
   * `markAsTouched` va junto al `setErrors` porque el estado de error del wrapper es
   * `invalid && touched`: sin el `touched` el campo quedaría inválido y pintado como si nada.
   */
  devolver(): void {
    this.blnIntentoEnvio.set(true);

    if (!this.blnPuedeDevolver()) {
      const objControl = this.form.get(QD.strSacRemarks);
      objControl?.setErrors({ required: true });
      objControl?.markAsTouched();
      // Recibe el form, no un diccionario de errores: el puerto Angular camina el árbol de controles
      // (poda por `valid`) en vez de aplanar el `FieldErrors` de RHF. Por eso el `setErrors` de arriba
      // tiene que ir ANTES — es lo que hace que el control sea el inválido que la función va a encontrar.
      scrollToFirstError(this.form);
      return;
    }

    void this.enviarCon('DEVOLVER');
  }

  /**
   * Completa la tarea con la acción elegida, preservando el contrato de `qd_blnSACApproved` descrito
   * en la cabecera de la clase: lo escriben `APROBAR` (⇒ `true`) y `DEVOLVER` (⇒ `false`), y
   * `REASIGNAR` **no lo toca**.
   *
   * El `catch` con `console.error` se porta tal cual: `TaskService` ya deja el mensaje en su signal
   * `error`, y lo que este log agrega es el objeto de excepción completo en la consola del iframe,
   * que es donde se diagnostica un 422 de PM4 sin devtools de red a mano.
   */
  private async enviarCon(in_strAccion: AccionRevisionSAC): Promise<void> {
    const dicPayload: Record<string, unknown> = {
      ...this.form.getRawValue(),
      [QD.strAction]: in_strAccion,
    };

    if (in_strAccion === 'APROBAR') dicPayload[QD.blnSacApproved] = true;
    if (in_strAccion === 'DEVOLVER') dicPayload[QD.blnSacApproved] = false;

    try {
      await this.objTareas.completarTarea(dicPayload);
    } catch (excError) {
      console.error('[RevisionRespuestaSac] Error al enviar:', excError);
    }
  }
}
