import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  Component, computed, inject, type OnDestroy, type OnInit, signal,
} from '@angular/core';
import {
  AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators,
  type ValidationErrors,
} from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import {
  type ModeloTablaZr,
  ZrAlertInline, ZrButton, ZrLoader, ZrModal, ZrTable, ZrTemplate,
} from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { TaskService } from '../../../../core/task.service';
import { SeccionCamposPayload } from './seccion-campos-payload';
import {
  type AccionErrorFuncional,
  QD,
  SCR003_DEFAULTS,
  SCR003_PAYLOAD_M2_FIELDS,
  SCR003_UMBRAL_INTENTOS,
} from '../fields/fields';

/** FLD-047 · tope de la justificación de la corrección, igual que el contador visual del DS. */
const INT_MAX_JUSTIF = 2000;

/** Solo dígitos, para `numero_id_CF`. Ver `validarDigitos`. */
const RGX_SOLO_DIGITOS = /^\d+$/;

/** `DD/MM/AAAA`, el formato en que `fecha_creacion` viaja a la SFC. Ver `validarFecha`. */
const RGX_FECHA_DDMMAAAA = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * Validador de formato **tolerante con vacío**.
 *
 * ⚠ No es `Validators.pattern`: ese ya tolera el vacío, pero acá la tolerancia es la mitad
 * importante del contrato y conviene que sea explícita y esté testeada. **Ningún campo del payload
 * es obligatorio en esta pantalla** (RUL-003-01 no bloquea, ver el docstring de la clase), así que
 * un campo vacío tiene que pasar: el que decide si falta un dato es el script/la SFC del otro lado,
 * no esta pantalla. Si un formato marcara `required` de contrabando, el gestor no podría reenviar
 * un caso cuyo `numero_id_CF` la SFC rechazó justamente por venir vacío.
 */
function validadorFormato(in_objRgx: RegExp, in_strClave: string) {
  return (in_objControl: AbstractControl): ValidationErrors | null => {
    const strValor = String(in_objControl.value ?? '').trim();
    if (!strValor) return null;
    return in_objRgx.test(strValor) ? null : { [in_strClave]: true };
  };
}

/** Una fila del historial de intentos (FLD-048, `qd_lstAttemptHistory`). */
interface FilaHistorial {
  intento?: unknown;
  fecha?: unknown;
  campoAfectado?: unknown;
  codigoError?: unknown;
}

/**
 * SCR-003 · Corrección Error Funcional — task **SP1-T05** del proceso SP1 (Gestor de Experiencia).
 *
 * Port de `frontend/src/screens/.../CorreccionErrorFuncional.tsx`. Se abre cuando Smart Supervision
 * devuelve un **HTTP 400 funcional** al enviar el Momento 2 de una queja: el body salió bien formado
 * pero la SFC rechazó su **contenido**. El gestor corrige los campos del body sobre las variables del
 * caso de las que el script los lee, y reenvía (→ SP1-T02) o escala a soporte técnico.
 *
 * ── Los tres nombres de campo de S1 son DINÁMICOS, y eso es el hallazgo del porte ────────────────
 * El anexo declara FLD-040..045 (`qd_strSfcErrorCode`, `qd_strSfcErrorMessage`,
 * `qd_strM1M2AttemptNum`, …) pero **ningún script los escribe hoy**: `sfcCamposErrorTecnico()` de
 * `Solo Momento 2.php` emite el mismo juego que consume SCR-004 (`qd_strHttpCode`,
 * `qd_strErrorType`, `qd_strApiTechMessage`, `qd_strCompleteLogAPI`, `qd_strAttemptNum`,
 * `qd_strPayloadSent`). Verificado contra `task.data` real (caso BPM 216 / request 34251): las
 * variables específicas de SCR-003 llegan **ausentes**.
 *
 * Por eso los tres campos se atan al nombre que el caso **realmente trae**, resuelto en tiempo de
 * render, y el `FormGroup` declara **los seis** para que cualquiera de las dos ramas tenga control
 * que adoptar. Es lo mismo que hacía React con `objWatch[QD.x] ? QD.x : QD.y`; acá son `computed()`
 * que alimentan `[formControlName]`/`[name]`.
 *
 * No se "arregla" eligiendo un solo juego: si mañana el script empieza a escribir FLD-040..045, el
 * fallback los toma sin tocar la pantalla; y si se hubiera cableado solo el juego real, la pantalla
 * mostraría campos vacíos en el caso que el anexo describe.
 *
 * ── Los dos submits difieren en una línea, y la línea importa ────────────────────────────────────
 * **ACT-003-01 (reenviar)** manda `qd_strPayloadSent: ''` y `qd_strPayloadAdjustNeeded: 'NO'` para
 * que `opMomento2` **regenere** el body desde las variables corregidas. Si se dejara el payload
 * viejo, el script compararía el body regenerado contra él, vería diferencia y reenviaría **el
 * viejo** — o sea que la corrección del gestor no llegaría nunca a la SFC.
 * **ACT-003-02 (escalar)** **NO** lo vacía: el payload rechazado es la evidencia técnica que el
 * analista necesita para diagnosticar.
 *
 * ── `getRawValue()` y no `value`, en las dos lecturas del form ───────────────────────────────────
 * La sección de payload bloquea cada fila con `control.disable()` (porque `zds-select` no se puede
 * deshabilitar: sus inputs `disable`/`disabled` están muertos), y **un control deshabilitado
 * desaparece de `form.value`**. Así que tanto el armado del payload como `lstCambios()` leen
 * `getRawValue()`: con `value`, todos los campos que el gestor no desbloqueó viajarían **vacíos** a
 * PM4 — peor que el error que la pantalla vino a corregir.
 *
 * ── RUL-003-01 NO bloquea, a propósito (decisión de negocio 2026-08-04) ─────────────────────────
 * Un 400 funcional puede resolverse **sin** cambiar ningún dato (p.ej. un duplicado que ya se cerró
 * del lado de la SFC), así que "Corregir y Reenviar" está **siempre** habilitado. La trazabilidad no
 * se pierde: `lstCambios()` escribe `qd_strFieldCorrection` con el literal
 * `'Reenvío sin cambios en el payload'` cuando no hubo cambios, y MSG-003-01 quedó como alerta
 * informativa permanente de S2. MSG-003-03 lo emite el BPM después de avanzar a SP1-T02, no esta
 * pantalla.
 *
 * ── Por qué no hay gate derivado de `sigValores` como en SCR-012 ────────────────────────────────
 * Porque **no hay gate**: los dos botones solo se apagan mientras el envío está en vuelo. Vale
 * anotar igual la trampa que SCR-012 aprendió a los golpes, porque el próximo que agregue una regla
 * bloqueante acá va a querer escribirla mal: `form.valid` es un **getter**, no un signal, así que
 * leerlo dentro de un `computed()` no crea dependencia y el computed se queda con el valor de la
 * primera evaluación (form vacío ⇒ inválido) para siempre. Cualquier gate futuro se deriva de
 * `sigValores()`.
 */
@Component({
  selector: 'app-correccion-error-funcional',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    SeccionCamposPayload,
    ZdsInput,
    ZdsTextarea,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrLoader,
    ZrModal,
    ZrTable,
    // ⚠ `ZrTemplate` (la directiva `libZTemplate`) tiene que estar acá aunque la plantilla no la
    //   nombre como componente: sin ella el atributo `libZTemplate` no matchea ninguna directiva,
    //   Angular lo trata como un atributo cualquiera del `ng-template` y **no da ningún error**. El
    //   `ModalZ` no encuentra el slot `content` y el modal abre VACÍO. Ver el ⚠ del modal en el .html.
    //
    //   Verificado por mutación en esta pantalla, no solo en la sonda: al quitar esta línea se pone
    //   rojo **un solo** caso del spec (`el contenido del slot del modal llega al DOM`, con
    //   `expected null not to be null`) y los otros 38 quedan verdes, igual que el `ng build`. Es la
    //   razón por la que ese caso asevera sobre el `<h3 class="modal-titulo">` y no sobre la bandera.
    ZrTemplate,
  ],
  templateUrl: './correccion-error-funcional.html',
})
export class CorreccionErrorFuncional implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);

  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  /**
   * El form declara los **seis** campos de diagnóstico (los tres del anexo y los tres que el script
   * escribe de verdad), más las 20 variables del body, más las 3 auxiliares de la cascada.
   *
   * Los validadores de formato viven acá y no en la sección: son parte de la **definición del
   * campo**, no de cómo se pinta la fila. Los dos son tolerantes con vacío — ver `validadorFormato`.
   */
  readonly form = new FormGroup({
    // ── S1 · diagnóstico según el anexo (FLD-040..045). Sin validadores: son datos del script.
    [QD.strSfcErrorCode]: new FormControl(''),
    [QD.strSfcErrorMessage]: new FormControl(''),
    [QD.strM1M2AttemptNum]: new FormControl(''),
    [QD.strAffectedField]: new FormControl(''),
    [QD.strRejectedValue]: new FormControl(''),
    [QD.strRejectionDate]: new FormControl(''),

    // ── S1 · diagnóstico que el script de Momento 2 **sí** emite (mismo juego que SCR-004).
    [QD.strHttpCode]: new FormControl(''),
    [QD.strErrorType]: new FormControl(''),
    [QD.strApiTechMessage]: new FormControl(''),
    [QD.strCompleteLogAPI]: new FormControl(''),
    [QD.strEndpointCalled]: new FormControl(''),
    [QD.strAttemptNum]: new FormControl(''),

    // ── Metadatos de flujo (no visibles, pero viajan). Ver el bloque de los dos submits.
    [QD.strPayloadSent]: new FormControl(''),
    [QD.strPayloadAdjustNeeded]: new FormControl('NO'),
    [QD.strFieldCorrection]: new FormControl(''),
    [QD.strBpmCaseId]: new FormControl(''),

    // ── S2 · las 20 variables del body de Momento 2 (SCR003_PAYLOAD_M2_FIELDS).
    [QD.strCountryCode]: new FormControl(''),
    [QD.strDepartment]: new FormControl(''),
    [QD.strCity]: new FormControl(''),
    [QD.strChannel]: new FormControl(''),
    [QD.strSfcProduct]: new FormControl(''),
    [`${QD.strSfcProduct}_desc`]: new FormControl(''),
    [QD.strSfcReason]: new FormControl(''),
    [`${QD.strSfcReason}_desc`]: new FormControl(''),
    [QD.strFilingDate]: new FormControl('', [
      validadorFormato(RGX_FECHA_DDMMAAAA, 'fecha'),
    ]),
    [QD.strCompanyName]: new FormControl(''),
    [QD.strFirstName]: new FormControl(''),
    [QD.strLastName]: new FormControl(''),
    [QD.strIdType]: new FormControl(''),
    [QD.strIdNumber]: new FormControl('', [
      validadorFormato(RGX_SOLO_DIGITOS, 'digitos'),
    ]),
    [QD.strPersonType]: new FormControl(''),
    [QD.strReceptionInstance]: new FormControl(''),
    [QD.strReceptionPoint]: new FormControl(''),
    [QD.strAdmission]: new FormControl(''),
    [QD.strComplaintText]: new FormControl(''),
    [QD.strFinalReplyAttach]: new FormControl(''),
    [QD.strControlEntity]: new FormControl(''),

    // ── S2 · auxiliares de la cascada `cat_matriz_motivos` (no viajan en el body de la SFC).
    //    `qd_strRequestType` no tiene widget: viene precargado y es el primer criterio del filtro
    //    de producto. Ver la advertencia del `strRequestTypeLabel` de `MatrizMotivosService`.
    [QD.strRequestType]: new FormControl(''),
    [QD.strInteraction]: new FormControl(''),
    [QD.strServiceProvided]: new FormControl(''),

    // ── S2b · FLD-047, la única entrada de texto libre obligatoria por formato (tope, no required).
    [QD.strCorrectionJustif]: new FormControl('', [
      Validators.maxLength(INT_MAX_JUSTIF),
    ]),
  });

  /**
   * Espejo en signal del valor del form.
   *
   * Se siembra con `getRawValue()` y **no** con `{}`: los computeds y la sección de payload se leen
   * en el primer render, antes de que ningún `valueChanges` haya emitido, así que con `{}` todo
   * evaluaría como vacío. Y es `getRawValue()` y no `value` por lo mismo que el submit: la sección
   * deshabilita las filas bloqueadas, y `value` las omitiría — la fila se pintaría vacía apenas el
   * gestor la bloquea.
   */
  readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /** Valor de cada variable del payload tal como llegó en `task.data`, congelado en la precarga. */
  readonly dicOriginales = signal<Record<string, string>>({});

  /** ACT-003-03 · el modal del log completo de la API. */
  readonly blnVerLog = signal(false);

  /**
   * **FLD-048** · cabeceras del historial de intentos.
   *
   * `key` **no es decorativo: es la propiedad que `TableZ` lee de cada fila de `data`**, así que estas
   * cuatro claves tienen que coincidir con los campos de `FilaHistorial` — un `key` mal escrito pinta
   * la columna con la celda vacía y sin ningún error. Pasar `string[]` (el reflejo natural) falla en
   * compilación con TS2322, que es la forma correcta de enterarse.
   *
   * Es campo de instancia y no `computed()` porque es un dato fijo: si fuera una expresión en la
   * plantilla, Angular crearía un array nuevo en cada detección de cambios y el `ngOnChanges` de
   * `TableZ` rearmaría la tabla entera en cada ciclo.
   *
   * ⚠ El tipo es `ModeloTablaZr[]` y **no** `readonly ModeloTablaZr[]`, que sería lo correcto para un
   * array que nadie muta: `TableZ` declara su input como `headers: TableModel[]` (mutable), y Angular
   * chequea los bindings de la plantilla, así que un `readonly` acá falla en compilación con **TS4104**
   * en la línea del `<lib-table-z>`. El `readonly` del campo (que sí queda) impide reasignarlo; lo que
   * el DS nos obliga a soltar es la inmutabilidad del contenido. Mismo motivo en `cllHistorial`.
   */
  protected readonly cllColumnasHistorial: ModeloTablaZr[] = [
    { title: 'Intento', key: 'intento' },
    { title: 'Fecha', key: 'fecha' },
    { title: 'Campo afectado', key: 'campoAfectado' },
    { title: 'Código error', key: 'codigoError' },
  ];

  /** Se levanta al primer intento de reenvío, para que los mensajes de formato hablen recién ahí. */
  readonly blnIntentoEnvio = signal(false);

  // ── Los tres nombres dinámicos de S1 (ver el bloque de la cabecera) ───────────────────────────

  /**
   * Nombre del control del que sale el código de error: el del anexo si el caso lo trae, si no el
   * `qd_strHttpCode` que el script escribe de verdad.
   *
   * El `!!` sobre el valor y no un `in`: un control declarado siempre existe en `getRawValue()`, así
   * que preguntar por la clave daría `true` para los seis. Lo que decide es que **tenga valor**.
   */
  readonly nmErrorCode = computed(() =>
    this.leer(QD.strSfcErrorCode) ? QD.strSfcErrorCode : QD.strHttpCode,
  );

  readonly nmErrorMessage = computed(() =>
    this.leer(QD.strSfcErrorMessage) ? QD.strSfcErrorMessage : QD.strApiTechMessage,
  );

  readonly nmAttempt = computed(() =>
    this.leer(QD.strM1M2AttemptNum) ? QD.strM1M2AttemptNum : QD.strAttemptNum,
  );

  /** El intento acumulado que nombra la alerta de S1 y del que depende RUL-003-02. */
  readonly strIntento = computed(() => this.leer(this.nmAttempt()));

  /**
   * **RUL-003-02 (🟡 ADVIERTE)** · a partir de 3 intentos conviene escalar en vez de reinsistir.
   *
   * `Number.isFinite` sobre el `parseInt` y no un `>=` directo: el campo viaja como **string** y un
   * valor no numérico daría `NaN`. Con la guarda explícita, un valor sucio se comporta como "no sé
   * cuántos intentos hay", que es lo correcto.
   *
   * ⚠ **La guarda es documentación, no una rama, y conviene saberlo antes de "cubrirla".** Verificado
   * por mutación: quitarla deja la suite **verde**, y no es un hueco del test — `NaN >= 3` ya es
   * `false`, así que las dos versiones son indistinguibles para **cualquier** entrada. Un caso que
   * las separara tendría que aseverar sobre la forma del código y no sobre el comportamiento. Lo que
   * sí está cubierto es el comportamiento (`no advierte con un valor no numérico`), que es lo que
   * importa si mañana alguien cambia el `>=` por un `!==` o mete un `Number()` de por medio, donde
   * `NaN` **sí** cambiaría el resultado.
   */
  readonly blnMuchosIntentos = computed(() => {
    const intIntentos = Number.parseInt(this.strIntento(), 10);
    return Number.isFinite(intIntentos) && intIntentos >= SCR003_UMBRAL_INTENTOS;
  });

  /**
   * Body que el script alcanzó a enviar (`qd_strPayloadSent`), parseado.
   *
   * Devuelve `null` para todo lo que no sea un objeto plano —incluido un array—, porque la sección
   * de payload lo indexa por clave: un array pasaría el `typeof === 'object'` y devolvería
   * `undefined` en cada fila sin decir por qué. El `catch` es esperable y no excepcional: el script
   * guarda ahí lo que le respondió la SFC, que en un error puede ser texto plano.
   */
  readonly objPayloadEnviado = computed<Record<string, unknown> | null>(() => {
    const strCrudo = this.leer(QD.strPayloadSent);
    if (!strCrudo) return null;
    try {
      const genParseado: unknown = JSON.parse(strCrudo);
      if (!genParseado || typeof genParseado !== 'object' || Array.isArray(genParseado)) return null;
      return genParseado as Record<string, unknown>;
    } catch {
      return null;
    }
  });

  /**
   * Campo que la SFC señaló, para el badge "Señalado por la SFC" de cada fila.
   *
   * Cae al **mensaje de error** cuando `qd_strAffectedField` no vino, que es el caso normal: el
   * script de Momento 2 no lo escribe. `esSenalado()` de la sección busca los tokens de cada clave
   * dentro de esta cadena, así que el mensaje entero funciona como pajar. Ver su docstring.
   */
  readonly strSenalado = computed(() =>
    this.leer(QD.strAffectedField) || this.leer(this.nmErrorMessage()) || '',
  );

  /**
   * FLD-048 · historial de intentos. Solo se aceptan filas que sean objetos.
   *
   * Sin `readonly` en el parámetro de tipo por lo mismo que `cllColumnasHistorial`: el input `data` de
   * `TableZ` es mutable y un `readonly FilaHistorial[]` rebota con TS4104 en el binding.
   */
  readonly cllHistorial = computed<FilaHistorial[]>(() => {
    const genCrudo = this.sigValores()[QD.lstAttemptHistory];
    if (!Array.isArray(genCrudo)) return [];
    return genCrudo.filter(
      (in_gen): in_gen is FilaHistorial => !!in_gen && typeof in_gen === 'object',
    );
  });

  /** Mensaje de formato de la justificación (FLD-047). Habla recién tras el primer intento. */
  readonly strErrorJustif = computed(() => {
    if (!this.blnIntentoEnvio()) return '';
    return this.form.get(QD.strCorrectionJustif)?.hasError('maxlength')
      ? `Máximo ${INT_MAX_JUSTIF} caracteres`
      : '';
  });

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /**
   * Vuelca `task.data` al form y **congela los originales** del payload.
   *
   * El filtro por `Object.keys(this.form.controls)` no es defensivo: `task.data` trae el caso entero
   * (decenas de `qd_*` de las pantallas anteriores del proceso) y un `patchValue` con claves que el
   * `FormGroup` no declara las descarta en silencio, dejando pasar cualquier renombre futuro sin
   * que nada se note.
   *
   * ⚠ **Los defaults pasan por el MISMO filtro, y no es simetría cosmética.** `SCR003_DEFAULTS` incluye
   * `qd_lstAttemptHistory`, que es una **lista** y a propósito **no tiene control** (se refleja a mano en
   * `sigValores` unas líneas más abajo). Spreadearlo crudo en `patchValue` le entregaba al form una clave
   * inexistente con un `IntentoHistorial[]` donde su índice declara `string | null` — **TS2345**, que el
   * `ng build` nunca vio porque esta pantalla no estaba enrutada y el AOT no compila lo que no se
   * referencia. Lo encontró la sonda de montaje.
   *
   * Los originales se congelan **acá y una sola vez**: son la referencia contra la que se calculan
   * el badge "Modificado", la restauración al desmarcar "Editar" y `lstCambios()`. Si se releyeran
   * del form, la primera edición se volvería su propio original y los tres perderían sentido.
   */
  private precargar(): void {
    const objTarea = this.objTareas.tarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const dicDefaults = SCR003_DEFAULTS as Record<string, unknown>;
    const dicParche: Record<string, string | null> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      // El default primero y el dato del caso después: el caso gana cuando trae la clave.
      const genValor = strClave in dicDatos ? dicDatos[strClave] : dicDefaults[strClave];
      if (genValor === undefined) continue;
      dicParche[strClave] = genValor === null ? null : String(genValor);
    }
    this.form.patchValue(dicParche);

    const dicOriginales: Record<string, string> = {};
    for (const objDef of SCR003_PAYLOAD_M2_FIELDS) {
      if (!objDef.variable) continue;
      dicOriginales[objDef.variable] = String(dicDatos[objDef.variable] ?? '');
    }
    this.dicOriginales.set(dicOriginales);

    // `qd_lstAttemptHistory` no tiene control (es una lista de solo lectura, no un campo), así que
    // no entra por `patchValue`: se refleja a mano en el espejo para que `cllHistorial()` la vea.
    this.sigValores.update((in_dic) => ({
      ...in_dic,
      [QD.lstAttemptHistory]: dicDatos[QD.lstAttemptHistory],
    }));
  }

  /**
   * **ACT-003-03** · abre y cierra el modal del log completo.
   *
   * Los dos métodos existen —en vez de un `[open]` de una sola vía— porque `ModalZ.change()` escribe
   * `this.open = false` **sobre su propio input** al cerrarse. Angular no reevalúa un input cuya
   * expresión de origen no cambió, así que el `false` de la lib queda pisando el `true` de la pantalla:
   * sin `cerrarLog()` bajando la bandera, el segundo `abrirLog()` no abriría nada y el defecto solo se
   * ve al segundo click. Ver el punto 3 de `zds-reexports.ts`.
   */
  abrirLog(): void {
    this.blnVerLog.set(true);
  }

  cerrarLog(): void {
    this.blnVerLog.set(false);
  }

  /** Lee un campo del espejo reactivo, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()[in_strCampo] ?? '');
  }

  /**
   * **FLD-046** · resumen legible de lo que el gestor cambió, para `qd_strFieldCorrection`.
   *
   * Es la única trazabilidad de la corrección del lado del BPM, y por eso el formato es contrato y
   * no cosmética: `<rótulo>: <antes> → <ahora> (<descripción>)`, unido con `'; '`.
   *
   * ⚠ El paréntesis lleva el **`<variable>_desc`** del valor nuevo, no la `note` de la definición del
   * campo. Es fácil confundirlos porque `PayloadFieldDef` tiene las dos cosas, pero cumplen roles
   * opuestos: `note` es una **explicación fija del campo** para el gestor que lo está mirando
   * (*"Constante de la configuración del CORE (script SFC) — no editable."*), mientras que `_desc` es
   * la **etiqueta legible del código que quedó** (`producto_cod: 3 → 7 (Autos)`). Usar `note` daría
   * una línea inútil e idéntica en todos los casos de ese campo, y ocultaría justamente el dato que
   * el auditor necesita: qué significa el código nuevo. Los `_desc` los mantiene la convención de
   * colecciones (`sincronizarDesc`), así que están al día en el momento del submit.
   *
   * Las filas **auxiliares**
   * (las de la cascada) se rotulan por su **variable** y no por su `key`, porque su key es el
   * literal `'—'` y una línea que dijera `—: 13 → 14` sería ilegible para quien audite el caso.
   *
   * Cuando no hubo cambios devuelve el literal `'Reenvío sin cambios en el payload'` en vez de
   * cadena vacía: RUL-003-01 no bloquea el reenvío sin cambios (ver la cabecera), así que ese caso
   * es **legítimo** y tiene que quedar dicho en el caso, no ausente.
   *
   * Lee `getRawValue()` porque las filas bloqueadas están deshabilitadas y no salen en `value`.
   */
  lstCambios(): string {
    const dicValores = this.form.getRawValue() as Record<string, unknown>;
    const dicOriginales = this.dicOriginales();
    const lstSalida: string[] = [];

    for (const objDef of SCR003_PAYLOAD_M2_FIELDS) {
      if (!objDef.variable) continue;
      const strAntes = String(dicOriginales[objDef.variable] ?? '');
      const strAhora = String(dicValores[objDef.variable] ?? '');
      if (strAntes === strAhora) continue;

      const strRotulo = objDef.aux ? objDef.variable : objDef.key;
      const strDesc = String(dicValores[`${objDef.variable}_desc`] ?? '');
      const strSufijo = strDesc ? ` (${strDesc})` : '';
      lstSalida.push(
        `${strRotulo}: ${strAntes || '(vacío)'} → ${strAhora || '(vacío)'}${strSufijo}`,
      );
    }

    return lstSalida.length ? lstSalida.join('; ') : 'Reenvío sin cambios en el payload';
  }

  /**
   * **ACT-003-01** · corregir y reenviar. Vacía `qd_strPayloadSent` para que el script **regenere**
   * el body — ver el bloque de los dos submits en la cabecera.
   *
   * No hay gate de validez: RUL-003-01 no bloquea. El único corte es el formato de los tres campos
   * con validador (fecha, dígitos, tope de la justificación), que si está roto no puede viajar a la
   * SFC de todos modos.
   */
  reenviar(): void {
    this.blnIntentoEnvio.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError(this.form);
      return;
    }

    void this.enviar('CORREGIR_REENVIAR', {
      [QD.strPayloadSent]: '',
      [QD.strPayloadAdjustNeeded]: 'NO',
    });
  }

  /**
   * **ACT-003-02** · escalar a soporte técnico.
   *
   * **No valida y no vacía el payload**, y las dos cosas son el contrato: es la salida que el gestor
   * usa cuando la corrección no alcanza, así que exigirle el formato de un campo que igual va a
   * revisar un analista la volvería inalcanzable en su propio escenario; y `qd_strPayloadSent` es la
   * evidencia técnica que ese analista necesita.
   */
  escalar(): void {
    void this.enviar('ESCALAR_SOPORTE');
  }

  /**
   * El PUT a PM4. `getRawValue()` y no `value`: las filas que el gestor no desbloqueó están
   * **deshabilitadas** y `value` las omitiría, así que viajarían vacías (ver la cabecera).
   */
  private async enviar(
    in_strAccion: AccionErrorFuncional,
    in_dicExtra: Record<string, unknown> = {},
  ): Promise<void> {
    const dicPayload: Record<string, unknown> = {
      ...this.form.getRawValue(),
      [QD.strFieldCorrection]: this.lstCambios(),
      [QD.strAction]: in_strAccion,
      ...in_dicExtra,
    };

    try {
      await this.objTareas.completarTarea(dicPayload);
    } catch (excError) {
      // El cartel visible lo pinta `strError()` desde el servicio; acá solo el rastro para dev.
      console.error('[CorreccionErrorFuncional] Error al enviar:', excError);
    }
  }

  /** `QD` para la plantilla: los `qd_*` son contrato con PM4 y viven en un solo lugar (regla 1). */
  protected readonly QD = QD;

  /** Tope de la justificación, para el `[maxLength]` del textarea. */
  protected readonly INT_MAX_JUSTIF = INT_MAX_JUSTIF;
}
