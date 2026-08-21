import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, type OnDestroy,
  type OnInit, runInInjectionContext, signal,
} from '@angular/core';
import {
  FormControl, FormGroup, ReactiveFormsModule, type ValidatorFn, Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { urlApi } from '../../../../api/pm4Client';
import { RecaptchaWidgetComponent } from '../../../../components/recaptcha-widget';
import { ZdsCheckboxField } from '../../../../components/fields/zds-checkbox-field';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import {
  ZrAlertInline, ZrButton, ZrIcon, ZrLoader, ZrModal, ZrTemplate,
} from '../../../../components/fields/zds-reexports';
import { AttachmentsService, idsAdjuntosAPayload } from '../../../../core/attachments.service';
import { CatalogosService } from '../../../../core/catalogos.service';
import type { CollectionOption } from '../../../../core/collection.types';
import { FileRegistryService } from '../../../../core/file-registry.service';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { TaskService } from '../../../../core/task.service';
import {
  aPrefijoOs, buildSfcCode, conPrefijoOs, esTipoQueja, QD, QD_COLLECTIONS,
  SCR000_ADJUNTO_KEYS, SCR000_DEFAULTS,
  SCR000_OS_SIMILAR_CASES_SCRIPT_ID,
  SCR000_OS_WEB_ENTRY_EVENT_ID, SCR000_OS_WEB_ENTRY_PROCESS_ID,
  SCR000_SIMILAR_CASES_SCRIPT_ID,
  SCR000_WEB_ENTRY_EVENT_ID, SCR000_WEB_ENTRY_PROCESS_ID,
} from '../fields/fields';
import { PqrPageComponent } from './pqr-page';
import { PqrSectionComponent } from './pqr-section';
// `RGX_SOLO_LETRAS` viene de S2 y no se declara acá: es la misma constante que usa su tabla de
// validadores por rama, y dos copias que se desincronizaran dejarían el `pattern` puesto en una rama
// y ausente en la otra. Ver el comentario de la constante.
import { RGX_SOLO_LETRAS, SeccionConsumidor } from './seccion-consumidor';
import { SeccionDetalleQueja } from './seccion-detalle-queja';

/** Titular y descripción del banner. Literales de React, sin cambios. */
const STR_BANNER_TITULO = 'Radicación PQRs';
const STR_BANNER_INTRO = 'Radica tu petición, queja, reclamo, sugerencia o felicitación. '
  + 'Completa los campos obligatorios, acepta el tratamiento de datos y valida el captcha '
  + 'para presionar Enviar PQRS.';

/**
 * Puntos de recepción (CAT-PUNTO, colección 20) que **ya no se ofrecen**: 2 (Aplicación móvil),
 * 6 (Audio respuesta) y 99 (Otros Puntos de recepción). Decisión de negocio heredada de React.
 */
const CLL_PUNTOS_OCULTOS: readonly string[] = ['2', '6', '99'];

/**
 * El canal **no se elige**: se deriva del punto de recepción (colección 20 → colección 10,
 * CAT-CANAL), por regla de negocio:
 *  · Punto 5 (Call center) → Canal 5
 *  · Puntos 1, 3, 7 (Internet, Correo electrónico, Redes sociales) → Canal 13
 *  · Punto 4 (Oficina) → Canal 14
 *
 * Los puntos sin regla dejan el canal vacío — hoy no queda ninguno visible tras ocultar 2/6/99, así
 * que esa rama es defensiva contra un reordenamiento del catálogo, no un caso alcanzable.
 */
const DIC_CANAL_POR_PUNTO: Readonly<Record<string, string>> = {
  '5': '5',
  '1': '13',
  '3': '13',
  '7': '13',
  '4': '14',
};

/** Código de `qd_strFilerRole` = Empleado Zurich. Es el único rol que ve el campo Alianza (RUL-000-01). */
const STR_ROL_EMPLEADO = '3';

/** Código de `qd_strFilerRole` = Defensor del Consumidor Financiero. Ver `sembrarInstancia()`. */
const STR_ROL_DEFENSOR = '4';

/** Instancia de recepción del Defensor del Consumidor Financiero (CAT-INSTANCIA). */
const STR_INSTANCIA_DEFENSOR = '3';

/** Instancia de recepción "Entidad vigilada" (CAT-INSTANCIA), la de los otros cuatro roles. */
const STR_INSTANCIA_VIGILADA = '2';

/** Roles que resuelven a "Entidad vigilada": Cliente, Intermediario, Empleado Zurich, No cliente. */
const CLL_ROLES_VIGILADA: readonly string[] = ['1', '2', '3', '5'];

/** Tope del texto de la queja y del argumento de réplica (FLD-327/FLD-326). */
const INT_MAX_TEXTO = 2000;

/** Mínimo del texto de la queja: sin esto la SFC rechaza la radicación por descripción insuficiente. */
const INT_MIN_QUEJA = 50;

/** El mínimo de 50 del relato de la queja, como referencia única para el form y para la tabla de ramas. */
const FN_MIN_QUEJA: ValidatorFn = Validators.minLength(INT_MIN_QUEJA);

/** El tope de 2000, ídem: lo comparten los dos detalles y el argumento de réplica. */
const FN_MAX_TEXTO: ValidatorFn = Validators.maxLength(INT_MAX_TEXTO);

/** Las dos ramas de detalle, como nombres y no como un booleano: el guardia de rama las compara. */
const STR_RAMA_QUEJA = 'queja';
const STR_RAMA_SOLICITUD = 'solicitud';

/**
 * Los validadores de los cinco campos de detalle, **completos y por rama**: la columna que aplica
 * según lo elegido en S1 es el estado final del control, no un delta sobre lo que había.
 *
 * Va como lista de tripletes y no como dos diccionarios paralelos porque así el tipo **obliga** a
 * declarar las dos ramas de cada campo: un campo que solo apareciera en una de las dos columnas
 * quedaría con los validadores de la rama anterior al cruzar, que es exactamente el defecto que la
 * tabla existe para cerrar.
 *
 * `strSfcProduct`/`strInteraction`/`strSfcReason` no llevan nada en la rama de solicitud: sus campos
 * ni se montan ahí. Los dos textarea conservan el tope de 2000 en las dos (tolera vacío por
 * definición) y se cambian el `required`; el mínimo de 50 es de la queja y solo de la queja.
 */
const CLL_VALIDADORES_DETALLE: readonly {
  readonly strCampo: string;
  readonly cllQueja: readonly ValidatorFn[];
  readonly cllSolicitud: readonly ValidatorFn[];
}[] = [
  { strCampo: QD.strSfcProduct, cllQueja: [Validators.required], cllSolicitud: [] },
  { strCampo: QD.strInteraction, cllQueja: [Validators.required], cllSolicitud: [] },
  { strCampo: QD.strSfcReason, cllQueja: [Validators.required], cllSolicitud: [] },
  {
    strCampo: QD.strComplaintText,
    cllQueja: [Validators.required, FN_MIN_QUEJA, FN_MAX_TEXTO],
    cllSolicitud: [FN_MAX_TEXTO],
  },
  {
    strCampo: QD.strCaseDescription,
    cllQueja: [FN_MAX_TEXTO],
    cllSolicitud: [Validators.required, FN_MAX_TEXTO],
  },
];

/** `ABC123` o `ABC 123`. Placa colombiana, tal como la valida React. */
const RGX_PLACA = /^[A-Za-z]{3} ?[0-9]{3}$/;

/** Correo, mismo patrón que React usa en los dos campos de email. */
const RGX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Exactamente 10 dígitos, para el celular. */
const RGX_CELULAR = /^\d{10}$/;

/** Una fila del resumen de éxito (MSG-000-08). */
interface FilaResumen {
  label: string;
  value: string;
}

/** Lo que el chequeo de similares deja para el modal de confirmación. */
interface AvisoSimilares {
  cllIds: number[];
  intCantidad: number;
  cllCasos: Record<string, unknown>[];
}

/**
 * **SCR-000 · Crear/Recibir Queja** — el formulario público de radicación de PQRS.
 *
 * Port de `frontend/src/screens/.../CrearRecibirQueja.tsx`. Es la pantalla que **crea** el caso, y la
 * única de las doce que se publica como **página web** (Web Entry) en vez de embeberse como tarea de
 * PM4. De ahí sus tres rasgos únicos, y los tres condicionan el diseño de esta clase.
 *
 * ── 1 · Dos modos de envío en el mismo componente ────────────────────────────────────────────────
 * `TaskService.blnEsWebEntry` (un **getter**: `!taskId() && !caseId()`) decide la rama:
 * - **Web Entry** → `POST /process_events/{destino}`, que crea el caso.
 * - **Tarea normal** → `completarTarea()`, que avanza el caso que ya existe.
 *
 * ⚠ **Y la rama de Web Entry NO usa `TaskService.iniciarProceso()`, a propósito.** Es lo primero que
 * uno intenta y no puede funcionar: `iniciarProceso()` resuelve el proceso y el evento desde
 * `Pm4ContextService`, que los lee **solo del query string**. La URL de una Web Entry no trae
 * `process_id` ni `event_id` (si los trajera, no sería una Web Entry: sería un arranque parametrizado),
 * así que el `if (!strProcessId) throw` del servicio dispara y la radicación muere antes del POST. Los
 * ids de esta pantalla vienen del **registro** (`SCR000_WEB_ENTRY_PROCESS_ID` / `_EVENT_ID`, resueltos
 * por nombre — regla 6), no de la URL. React esquiva su propio hook por exactamente el mismo motivo
 * (`CrearRecibirQueja.tsx:236-238`), así que este POST directo es paridad, no atajo.
 *
 * ── 1-bis · Y radica en DOS procesos distintos según el tipo de solicitud ────────────────────────
 * El formulario es uno, el destino no: **una queja** abre un caso de *Gestión de Quejas Directas*
 * (proceso 31) con variables `qd_*` y chequea similitud con el script 70; **cualquier otro tipo**
 * —solicitud, felicitación, sugerencia, derecho de petición, vulneración de datos— abre un caso de
 * *Otras Solicitudes* (proceso 36) con variables `os_*` y el script 101. La bifurcación entera cuelga
 * de `blnEsQueja()`, y cambia también qué sección de detalle se monta ("Detalle de la queja" completa
 * vs "Detalle de la Solicitud", un solo campo).
 *
 * Dos consecuencias que no se ven leyendo el `@if` de la plantilla, y las dos tienen su propio
 * docstring porque son los modos de falla del diseño:
 * - **El vocabulario se traduce en el borde HTTP, no en el form** — adentro todo es `qd_` siempre. Ver
 *   `conVocabularioDestino()`, que además explica por qué la rama de tarea normal queda afuera.
 * - **Los `required` viajan de una sección a la otra** — un `@if` desmonta widgets pero no toca el
 *   `FormGroup`, así que sin `alternarValidadoresDetalle()` la rama de solicitud sería inenviable sin
 *   un solo campo en rojo que lo explique.
 *
 * ── 2 · Lo que no existe hasta después del envío ─────────────────────────────────────────────────
 * `case_number`, `qd_strSfcCode` y el estado ante la SFC **no existen** mientras se llena el
 * formulario: PM4 los asigna al radicar. Por eso `qd_strSfcCode` se escribe en un **segundo** PUT,
 * después de crear el caso (`buildSfcCode(case_number)`), y por eso las secciones que React tenía para
 * mostrarlos ya no están en el código — ver los desvíos §4 y §7 de la ficha 2.0.
 *
 * ── 3 · El chrome es de sitio público, no de bandeja de tareas ───────────────────────────────────
 * `app-pqr-page`/`app-pqr-section`/`app-pqr-readonly` en vez de `app-screen-header`/
 * `app-form-section`. Las tres divergencias del DS (la barra maquetada a mano, el intro fuera del
 * banner y los colores por `customStr`) están documentadas en `pqr-page.ts`.
 *
 * ── El gate de envío se deriva de `sigValores()`, nunca de `form.valid` ──────────────────────────
 * `form.valid` es un **getter**, no un signal: leerlo dentro de un `computed()` no crea dependencia y
 * el computed se congela en el valor de su primera evaluación (form vacío ⇒ inválido) para siempre. El
 * gate real son dos condiciones sobre el espejo reactivo: autorización de datos y token de captcha.
 * La validez del form se chequea **imperativamente** en el submit, que es donde sí se puede leer.
 *
 * ── Los mensajes de error esperan el primer intento de envío ─────────────────────────────────────
 * `blnIntentoEnvio` viaja a las dos secciones. Sin esa guarda la pantalla se abriría **entera en
 * rojo**: son ~20 controles obligatorios que arrancan vacíos, y un ciudadano que entra a radicar vería
 * un formulario que parece ya haber fallado.
 *
 * ── Los validadores viven acá, los textos en cada sección ────────────────────────────────────────
 * `Validators.required`/`pattern`/`minLength` son parte de la **definición del campo**, así que están
 * en este `FormGroup`; el *texto* de cada error es UI de la sección que lo pinta, así que vive en su
 * `mensajeDeError()`. Es la misma separación que SCR-003.
 *
 * ── `getRawValue()` en TODAS las lecturas del form, y no es preferencia ──────────────────────────
 * S2 **deshabilita** el municipio mientras no haya departamento (es el único canal: `zds-select` no
 * tiene input `disabled`), y **un control deshabilitado desaparece de `form.value`**. Con `value`, el
 * municipio viajaría ausente a PM4 en el caso más común de todos.
 *
 * ── El chequeo de similares es best-effort, y el orden del flujo es contrato ─────────────────────
 * Submit → captcha presente → script de similares (70 u 101) → [modal si hay coincidencias] → verify
 * del captcha server-side → envío. Si el script falla, se **radica igual** (un detector de duplicados
 * caído no puede bloquear el derecho a radicar); si el verify falla, **no** se radica (un captcha sin
 * verificar no es un captcha, ver el docstring de `recaptcha-modal.ts`).
 */
@Component({
  selector: 'app-crear-recibir-queja',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PqrPageComponent,
    PqrSectionComponent,
    SeccionConsumidor,
    SeccionDetalleQueja,
    RecaptchaWidgetComponent,
    ZdsCheckboxField,
    ZdsInput,
    ZdsSelect,
    // Solo para el detalle de "Detalle de la Solicitud", que se maqueta acá y no en una sección
    // propia — ver el `@else` de la plantilla.
    ZdsTextarea,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrIcon,
    ZrLoader,
    ZrModal,
    // ⚠ Sin esta directiva el atributo `libZTemplate` no matchea nada, Angular lo trata como un
    //   atributo cualquiera del `ng-template` y **no da ningún error**: los dos modales abren VACÍOS.
    //   Ver el ⚠ de `zds-reexports.ts` y la mutación registrada en SCR-003.
    ZrTemplate,
  ],
  providers: [CatalogosService, FileRegistryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-recibir-queja.html',
})
export class CrearRecibirQueja implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objCatalogos = inject(CatalogosService);
  private readonly objRegistro = inject(FileRegistryService);
  private readonly objAdjuntos = inject(AttachmentsService);
  private readonly objHttp = inject(HttpClient);
  private readonly objInjector = inject(Injector);

  protected readonly blnCargando = this.objTareas.cargando;
  protected readonly strErrorCarga = this.objTareas.error;
  protected readonly blnEnviando = this.objTareas.enviando;

  protected readonly QD = QD;
  protected readonly STR_BANNER_TITULO = STR_BANNER_TITULO;
  protected readonly STR_BANNER_INTRO = STR_BANNER_INTRO;
  protected readonly INT_MAX_TEXTO = INT_MAX_TEXTO;

  /**
   * El form de la pantalla entera. Las dos secciones escriben sobre **estos** controles, no sobre una
   * copia — reciben el `FormGroup` por input.
   *
   * Los `_desc` de los campos con código no se declaran acá: los **crea** `sincronizarDesc()` si no
   * existen, y cada sección engancha los suyos. Los que sí se declaran son los que esta pantalla
   * sincroniza (S1) más los que arrancan con valor de negocio.
   *
   * ⚠ La única excepción es `qd_strSfcProduct_desc`, que **sí** se declara abajo: el producto es el
   * único campo con código que no pasa por `sincronizarDesc()` —la colección 16 repite códigos, ver
   * el docstring de `vincular()` en `matriz-motivos.service.ts`— así que nadie lo crearía.
   */
  protected readonly form = new FormGroup({
    // ── S1 · Tipo de solicitud y rol ──────────────────────────────────────────────────────────────
    [QD.strRequestType]: new FormControl('', [Validators.required]),
    [QD.strFilerRole]: new FormControl('', [Validators.required]),
    [QD.strReceptionPoint]: new FormControl('', [Validators.required]),
    // Sin `required`: la asigna RUL-000-01, el control va deshabilitado y **no tiene widget** (negocio
    // la maneja por detrás), así que exigirla sería exigirle al ciudadano algo que no puede ni ver.
    [QD.strReceptionInstance]: new FormControl(''),
    // El canal se deriva del punto (DIC_CANAL_POR_PUNTO) y no tiene widget.
    [QD.strChannel]: new FormControl(''),
    // Alianza: solo aplica al rol Empleado Zurich, y ahí tampoco es obligatoria (React no la exige).
    [QD.strAlliance]: new FormControl(''),

    // ── S2 · Datos del Consumidor Financiero ──────────────────────────────────────────────────────
    [QD.strIdType]: new FormControl('', [Validators.required]),
    [QD.strIdNumber]: new FormControl('', [Validators.required]),
    // ── ⚠ Los cinco campos de nombre no llevan su `required` acá: lo pone `CLL_VALIDADORES_PERSONA`
    //    en S2, por rama. Estos son solo el `pattern` del dato y el valor inicial ──
    //
    // RUL-000-02/03 los hacen obligatorios **cada uno en su rama**: nombre+apellido si es persona
    // natural, razón social + contacto si es jurídica. Un `Validators.required` fijo acá exigiría los
    // cinco a la vez —incluidos los tres de la rama que el `@if` no montó— y el form nunca sería válido.
    //
    // ⚠ **La versión anterior le dejaba esa rama al DS y era un bug con dos síntomas en producción.**
    // La apuesta era que el `[obligatorio]="true"` de la plantilla —que `zds-input` reenvía como
    // `[required]` a `lib-input-text-z`, que **compone** su `{errorRequired: true}` sobre el control—
    // "se montara y desmontara con el `@if`". Se monta; **no se desmonta**: ningún `lib-*-z` tiene
    // `ngOnDestroy`, así que el closure sobrevive al widget leyendo un `model` congelado en `''`. El
    // resultado medido era la rama jurídica inenviable por dos campos invisibles, y los nombres
    // acusados de "Campo requerido" con texto correcto al volver a la rama natural. El detalle completo
    // está en `alternarValidadoresPersona()` de [seccion-consumidor.ts](./seccion-consumidor.ts), que
    // es quien ahora manda; este comentario solo dice por qué acá **no** hay un `required`.
    //
    // Los `[obligatorio]="true"` de la plantilla se conservan: pintan el asterisco. Ya no son la fuente
    // de verdad de la validez.
    //
    // ⚠ Corolario que sigue vigente: el docstring de `obligatorio` en `campo-base.ts` dice que es "el
    // asterisco del rótulo, nada más". **Para `zds-input`/`zds-select` eso es falso** — también
    // invalida, y encima de forma permanente. Va al reporte al negocio junto con lo demás de la fachada.
    [QD.strFirstName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strLastName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strCompanyName]: new FormControl(''),
    [QD.strContactFirstName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strContactLastName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strEmail]: new FormControl('', [Validators.required, Validators.pattern(RGX_EMAIL)]),
    [QD.strPhone]: new FormControl('', [Validators.required, Validators.pattern(RGX_CELULAR)]),
    [QD.strPersonType]: new FormControl(''),
    [QD.strCountryCode]: new FormControl(''),
    [QD.strDepartment]: new FormControl('', [Validators.required]),
    [QD.strCity]: new FormControl('', [Validators.required]),
    [QD.strAddress]: new FormControl(''),
    [QD.strSex]: new FormControl(''),
    [QD.strLgbtiq]: new FormControl(''),
    [QD.strSpecialCondition]: new FormControl(''),
    [QD.strDigitalProduct]: new FormControl(''),
    [QD.strComplaintStatus]: new FormControl(''),

    // ── S3 · Detalle de la queja ──────────────────────────────────────────────────────────────────
    [QD.strSfcProduct]: new FormControl('', [Validators.required]),
    // ⚠ El `_desc` del producto se declara acá y no lo crea `sincronizarDesc()` (que es lo que pasa con
    //   los otros ~10 campos con código de esta pantalla). Motivo: la colección 16 repite códigos —`104`
    //   es "Garantía extendida" **y** "Copropiedades"—, así que resolver la etiqueta por código elegiría
    //   la equivocada. La única fuente correcta es lo que el usuario tocó, y por eso lo escribe
    //   `MatrizMotivosService.syncProductDesc()` desde el satélite del picker de S3.
    //
    //   Sin este control ese escritor no tenía dónde escribir (abre con `if (!objControl) return`) y la
    //   etiqueta no llegaba a `getRawValue()`: el resumen MSG-000-08 mostraba "Producto: —" y el `_desc`
    //   viajaba vacío a PM4, con lo que SCR-0051 caía al `uiValueFromCode` sin desambiguador y
    //   preseleccionaba el primer registro con ese código.
    //
    //   Se declara junto al producto, y no en S1 con los demás, porque su escritor vive en S3.
    [`${QD.strSfcProduct}_desc`]: new FormControl(''),
    [QD.strInteraction]: new FormControl('', [Validators.required]),
    // Servicio prestado: obligatorio **solo** en Asistencias, por el mismo mecanismo que los cinco
    // campos de nombre de arriba — el `@if (blnIsAsistencias())` de `seccion-detalle-queja.html` monta
    // un `zds-select` con `[obligatorio]="true"` y el DS compone el validador mientras esté montado.
    // Nadie llama a `setValidators()`: React tampoco, ahí la `rules={{required}}` desaparece con el
    // ternario. Un `Validators.required` fijo acá volvería el form inválido para siempre en todos los
    // momentos que no son Asistencias, donde el campo ni existe.
    [QD.strServiceProvided]: new FormControl(''),
    [QD.strSfcReason]: new FormControl('', [Validators.required]),
    // Placa: el `pattern` es incondicional (tolera vacío por definición), el `required` no puede serlo
    // porque el campo solo existe en la familia Autos.
    [QD.strPlate]: new FormControl('', [Validators.pattern(RGX_PLACA)]),
    // ⚠ Lo que se declara acá es la rama **queja**, y es la declaración que la pantalla muestra al
    //   abrirse (sin tipo elegido) porque `alternarValidadoresDetalle()` corre en el primer efecto y
    //   aplica la columna de solicitud sobre estos cinco campos. Los dos estados son la tabla
    //   `CLL_VALIDADORES_DETALLE`; esto es solo el valor inicial del control.
    [QD.strComplaintText]: new FormControl('', [Validators.required, FN_MIN_QUEJA, FN_MAX_TEXTO]),
    // El detalle de "Detalle de la Solicitud" — el espejo del anterior para todo tipo que **no** es
    // queja. Su `required` lo pone la columna de solicitud de la tabla. Sin mínimo de 50: ese piso es
    // un requisito de la SFC sobre la descripción de una **queja**, y el Anexo 02 no lo pide para el
    // resto de las PQR.
    [QD.strCaseDescription]: new FormControl('', [FN_MAX_TEXTO]),
    [QD.strReply]: new FormControl('NO'),
    [QD.strReplyArgument]: new FormControl('', [FN_MAX_TEXTO]),
    [QD.strProductDetail]: new FormControl(''),
    // Los cinco que deriva la matriz del motivo elegido, sin widget.
    [QD.strResponsableRole]: new FormControl(''),
    [QD.strOmbudsmanEscalation]: new FormControl(''),
    [QD.strCompensation]: new FormControl(''),
    [QD.strSlaAssigned]: new FormControl(''),
    [QD.strFraudRelated]: new FormControl(''),
    // Los cuatro que S3 resuelve contra su catálogo. Tres no tienen widget; la admisión SÍ lo tiene,
    // pero solo para el Defensor del Consumidor, así que su `required` no se declara acá: lo pone y lo
    // saca `alternarValidadorAdmision()` de S3 según el rol (FLD-331 / RUL-000-01).
    [QD.strAdmission]: new FormControl(''),
    [QD.strControlEntity]: new FormControl(''),
    [QD.strTutela]: new FormControl(''),
    [QD.strExpressComplaint]: new FormControl(''),
    // Los cinco adjuntos: guardan el **nombre** del archivo; el binario vive en `FileRegistryService`.
    [QD.strAttach01]: new FormControl(''),
    [QD.strAttach02]: new FormControl(''),
    [QD.strAttach03]: new FormControl(''),
    [QD.strAttach04]: new FormControl(''),
    [QD.strAttach05]: new FormControl(''),

    // ── S4 · Autorización y envío ─────────────────────────────────────────────────────────────────
    // ⚠ Sin `Validators.requiredTrue` a propósito: el gate de envío ya exige la autorización, y un
    //   validador acá haría que `form.invalid` dispare el `scrollToFirstError` sobre un checkbox que el
    //   ciudadano no puede alcanzar desde el primer campo en rojo. El aviso de MSG lo pinta S4.
    [QD.blnDataAuth]: new FormControl(false),
    [QD.blnCaptcha]: new FormControl(false),
    [QD.strCcEmail]: new FormControl('', [Validators.pattern(RGX_EMAIL)]),

    // ── S5/S6 · post-radicación (back). Solo lectura cuando el caso ya tiene responsable. ─────────
    [QD.strSmartSupStatus]: new FormControl(''),
    [QD.strSfcFilingDate]: new FormControl(''),
    [QD.strAssigneeRole]: new FormControl(''),
    [QD.strAssignee]: new FormControl(''),
  });

  /**
   * Espejo en signal del valor del form.
   *
   * Se siembra con `getRawValue()` y **no** con `{}`: los computeds y las dos secciones se leen en el
   * primer render, antes de que ningún `valueChanges` haya emitido. Y es `getRawValue()` por lo dicho
   * en la cabecera: el municipio se deshabilita y `value` lo omitiría.
   */
  protected readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /** Se levanta al primer intento de envío: recién ahí las secciones pintan sus mensajes de error. */
  protected readonly blnIntentoEnvio = signal(false);

  /** Token del captcha ya resuelto por el usuario. **No** es prueba de nada sin el verify server-side. */
  private readonly strTokenCaptcha = signal('');

  /** Mensaje de error de la sección de envío (captcha, o un fallo de la radicación). */
  protected readonly strErrorEnvio = signal('');

  /** Overlay de "radicando": cubre submit → similares → verify → envío. */
  protected readonly blnRadicando = signal(false);

  /** `true` cuando la radicación salió bien: la pantalla pasa al resumen (MSG-000-08). */
  protected readonly blnEnviado = signal(false);

  /** `case_number` que PM4 asignó, para el resumen. */
  private readonly numCasoCreado = signal<number | undefined>(undefined);

  /** Fecha de creación mostrada en el resumen, `DD/MM/AAAA`. */
  private readonly strFechaCreacion = signal('');

  /** Aviso de casos similares en espera de decisión del usuario. `null` = no hay modal abierto. */
  protected readonly objAvisoSimilares = signal<AvisoSimilares | null>(null);

  /** Salida del script 70, para fusionar en el payload cuando el usuario decida continuar. */
  private readonly dicSimilaresPendiente = signal<Record<string, unknown>>({});

  /**
   * Registra las cinco derivaciones de S1 más el traspaso de validadores entre las dos secciones de
   * detalle (que también depende de S1, por el tipo de solicitud).
   *
   * ⚠ **Va en el constructor y no en `ngOnInit`**, por dos motivos distintos: `effect()` exige contexto
   * de inyección (`ngOnInit` lo es solo mientras corre sincrónicamente, y este `ngOnInit` tiene un
   * `await` en el medio), y las derivaciones tienen que estar escuchando **antes** de que `precargar()`
   * escriba los códigos que las disparan.
   *
   * ⚠ Y va **después** de `form` y `sigValores` en el orden de declaración, que en una clase es el orden
   * de ejecución: los cuerpos leen `sigValores()` a través de `leer()`, y un constructor declarado
   * arriba correría con el campo todavía `undefined`.
   *
   * Es el mismo patrón de las dos secciones hijas (`seccion-consumidor.ts:98-115`,
   * `seccion-detalle-queja.ts:134-150`). **Esta pantalla no lo tenía**, así que los cinco métodos de
   * abajo estaban definidos y sin un solo call site: `tsc` no marca un método de clase sin usar y el
   * lint tampoco, así que el defecto no se veía ni en la suite (26 casos verdes) ni en el build — se
   * destapó comparando la pantalla contra el React en el navegador, donde el punto de recepción salía
   * vacío. Los casos que lo fijan están en `crear-recibir-queja.spec.ts` bajo "las cuatro derivaciones
   * de S1"; no borrar este bloque sin mirar esos.
   */
  constructor() {
    effect(() => this.sembrarPunto());
    effect(() => this.derivarCanal());
    effect(() => this.sembrarInstancia());
    effect(() => this.bloquearInstancia());
    effect(() => this.limpiarAlianza());
    effect(() => this.alternarValidadoresDetalle());
  }

  public async ngOnInit(): Promise<void> {
    // ⚠ `vincular()` va **antes** del `await`, y el orden importa por dos motivos distintos:
    //
    // 1. `sincronizarDesc()` hace `inject(DestroyRef)`, y `ngOnInit` es contexto de inyección **solo
    //    mientras corre sincrónicamente**. Después del `await` ya no lo es, así que llamarlo abajo
    //    daría NG0203 en runtime — invisible al compilar. El `runInInjectionContext` lo cubre igual,
    //    pero la posición es la que hace que no dependa de él.
    // 2. Los `_desc` tienen que estar enganchados **antes** de que `precargar()` escriba los códigos:
    //    si se enganchan después, la precarga ya pasó y los `_desc` de un caso precargado quedarían
    //    vacíos hasta que el usuario toque el select.
    runInInjectionContext(this.objInjector, () => this.vincular());

    // ⚠ Y el `await` + `precargar()` son obligatorios, no una mejora: sin esto ni `task.data` ni
    // `SCR000_DEFAULTS` llegan nunca al form. En Web Entry (sin `task_id`) `cargar()` sale temprano y
    // `task.data` está vacío, pero los defaults **igual** hacen falta — son el país fijo de
    // RUL-000-10 y los cuatro campos de back sin widget (`strDigitalProduct`, `strComplaintStatus`,
    // `strReply`, `strFraudRelated`), que sin precarga viajarían vacíos a PM4 en cada radicación.
    await this.objTareas.cargar();
    this.precargar();
  }

  public ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /** Engancha los `_desc` de S1 y dispara sus seis catálogos. */
  private vincular(): void {
    // El tercer argumento va como **función**: cuando esto corre ningún GET respondió, así que pasar
    // el array capturaría el `[]` del primer instante y el `_desc` quedaría vacío para siempre.
    sincronizarDesc(this.form, QD.strRequestType, () => this.cllTiposSolicitud());
    sincronizarDesc(this.form, QD.strFilerRole, () => this.cllRoles());
    sincronizarDesc(this.form, QD.strChannel, () => this.cllCanales());
    sincronizarDesc(this.form, QD.strReceptionPoint, () => this.cllPuntos());
    sincronizarDesc(this.form, QD.strReceptionInstance, () => this.cllInstancias());
    sincronizarDesc(this.form, QD.strAlliance, () => this.cllAlianzas());

    const dicValores = this.form.getRawValue() as Record<string, unknown>;
    void this.objCatalogos.cargar('requestType', QD_COLLECTIONS.requestType, dicValores);
    void this.objCatalogos.cargar('filerRole', QD_COLLECTIONS.filerRole, dicValores);
    void this.objCatalogos.cargar('channel', QD_COLLECTIONS.channel, dicValores);
    void this.objCatalogos.cargar('receptionPoint', QD_COLLECTIONS.receptionPoint, dicValores);
    void this.objCatalogos.cargar('receptionInstance', QD_COLLECTIONS.receptionInstance, dicValores);
    void this.objCatalogos.cargar('alliance', QD_COLLECTIONS.alliance, dicValores);
  }

  // ── Catálogos de S1 ─────────────────────────────────────────────────────────────────────────────

  protected readonly cllTiposSolicitud = computed(
    () => this.objCatalogos.de('requestType').options(),
  );
  protected readonly cllRoles = computed(() => this.objCatalogos.de('filerRole').options());
  private readonly cllCanales = computed(() => this.objCatalogos.de('channel').options());
  private readonly cllPuntos = computed(() => this.objCatalogos.de('receptionPoint').options());
  /**
   * `private` y no `protected`: la instancia de recepción **no tiene select** —la maneja el BPM por
   * detrás—, así que la plantilla no lee este catálogo. Se sigue cargando porque es donde
   * `sembrarInstancia()` resuelve el código contra el registro, y `sincronizarDesc()` contra la
   * etiqueta.
   */
  private readonly cllInstancias = computed(
    () => this.objCatalogos.de('receptionInstance').options(),
  );
  protected readonly cllAlianzas = computed(() => this.objCatalogos.de('alliance').options());

  /**
   * Puntos de recepción que se ofrecen, sin los tres retirados.
   *
   * El filtro se aplica **solo al select**: `sincronizarDesc` sigue enganchado al catálogo completo,
   * así que un caso precargado con el punto 2 conserva su `_desc` legible aunque el punto ya no se
   * pueda elegir. Filtrar el catálogo entero borraría la descripción de los casos históricos.
   */
  protected readonly cllPuntosVisibles = computed(
    () => this.cllPuntos().filter((in_objO) => !CLL_PUNTOS_OCULTOS.includes(in_objO.value)),
  );

  // ── Estado derivado de S1 ───────────────────────────────────────────────────────────────────────

  /**
   * **La bifurcación de la pantalla**: `true` si el tipo elegido en S1 es una queja.
   *
   * De este booleano cuelgan cuatro cosas, y no tres de ellas son de UI:
   *  1. Qué sección de detalle se monta — "Detalle de la queja" (S3 completa) o "Detalle de la
   *     Solicitud" (un solo campo).
   *  2. Qué proceso recibe la radicación — 31 (Quejas Directas) o 36 (Otras Solicitudes).
   *  3. Con qué prefijo viajan las variables — `qd_` o `os_`.
   *  4. Qué script chequea similitudes — 70 o 101.
   *
   * La regla vive en `esTipoQueja()` (etiqueta primero, código de respaldo) y su docstring explica por
   * qué en ese orden. Acá se resuelve la etiqueta contra el catálogo de S1, igual que lo hace
   * `MatrizMotivosService` para alimentar la cascada de la matriz.
   *
   * Sin tipo elegido devuelve `false`: la lectura literal de la regla es que el detalle de la queja se
   * muestra **solo si** hay queja, así que el formulario abre con "Detalle de la Solicitud".
   */
  protected readonly blnEsQueja = computed(() => {
    const strCodigo = this.leer(QD.strRequestType);
    const strEtiqueta = this.cllTiposSolicitud()
      .find((in_objOpt) => in_objOpt.value === strCodigo)?.label ?? '';
    return esTipoQueja(strCodigo, strEtiqueta);
  });

  /** **RUL-000-01** · solo el Empleado Zurich (rol `'3'`) ve el campo Alianza. */
  protected readonly blnEsEmpleadoZurich = computed(
    () => this.leer(QD.strFilerRole) === STR_ROL_EMPLEADO,
  );

  /** S6 aparece recién cuando el caso ya tiene responsable — o sea nunca en una radicación nueva. */
  protected readonly blnTieneResponsable = computed(
    () => !!this.leer(QD.strAssigneeRole) || !!this.leer(QD.strAssignee),
  );

  /** `true` cuando el ciudadano tildó la autorización de tratamiento de datos. */
  protected readonly blnAutorizo = computed(() => !!this.sigValores()[QD.blnDataAuth]);

  /**
   * **El gate de envío.** Autorización de datos **y** token de captcha.
   *
   * Ver la cabecera: esto se deriva de `sigValores()` y del signal del token, nunca de `form.valid`.
   * La validez del form se chequea en el submit, imperativamente.
   */
  protected readonly blnPuedeEnviar = computed(
    () => this.blnAutorizo() && !!this.strTokenCaptcha(),
  );

  // ── Precarga ───────────────────────────────────────────────────────────────────────────────────

  /**
   * Vuelca `SCR000_DEFAULTS` + `task.data` sobre los controles que **existen**.
   *
   * ⚠ El filtro por `Object.keys(this.form.controls)` no es simetría cosmética: `SCR000_DEFAULTS` trae
   * ~50 claves y este form declara menos, así que un `patchValue` del objeto crudo le entregaría al
   * form claves sin control. En modo estricto eso es **TS2345**, y `ng build` no lo ve mientras nada
   * enrute la pantalla (AOT no compila lo que nadie referencia). En SCR-003 lo destapó la sonda de
   * montaje; acá el riesgo es 5× mayor.
   *
   * El orden es contrato: el default primero, el dato del caso después. El caso gana cuando trae la
   * clave, y el default cubre lo que PM4 no manda.
   */
  private precargar(): void {
    const dicDatos = (this.objTareas.tarea()?.data ?? {}) as Record<string, unknown>;
    const dicDefaults = SCR000_DEFAULTS as Record<string, unknown>;
    // `string | boolean` y no `unknown`: es lo que el bucle abajo garantiza, y es lo que `patchValue`
    // acepta. Con `unknown` el compilador rechaza el parche (TS2345) desde que el form declara una
    // clave computada —el `_desc` del producto—, porque eso le agrega una firma de índice `string`.
    const dicParche: Record<string, string | boolean> = {};

    for (const strClave of Object.keys(this.form.controls)) {
      const genValor = strClave in dicDatos ? dicDatos[strClave] : dicDefaults[strClave];
      if (genValor === undefined) continue;
      // Los dos booleanos del form (`blnDataAuth`, `blnCaptcha`) se dejan pasar tal cual: un
      // `String(false)` los volvería el literal `'false'`, que es *truthy* y tildaría el checkbox de
      // autorización solo, abriendo el gate de envío sin que nadie lo haya aceptado.
      dicParche[strClave] = typeof genValor === 'boolean' ? genValor : String(genValor ?? '');
    }

    this.form.patchValue(dicParche);
  }

  // ── Las cuatro derivaciones de S1 ──────────────────────────────────────────────────────────────

  /**
   * **RUL-000-01** · el rol determina la instancia de recepción (back, deshabilitada en pantalla).
   *
   * Defensor del consumidor (4) → Defensor del consumidor financiero (3); Cliente/Intermediario/
   * Empleado/No cliente (1,2,3,5) → Entidad vigilada (2). La instancia 1 (SFC) la asigna la
   * integración SFC, no esta pantalla.
   *
   * Se escribe el **código** (la descripción viaja por `_desc`, que `vincular()` engancha), y se
   * resuelve contra el catálogo en vez de escribir el literal: si negocio reordena CAT-INSTANCIA, el
   * código sigue siendo el correcto o no se escribe nada, en vez de escribir un código inexistente.
   */
  private sembrarInstancia(): void {
    const strRol = this.leer(QD.strFilerRole);
    if (!strRol || this.cllInstancias().length === 0) return;

    let strCodigo = '';
    if (strRol === STR_ROL_DEFENSOR) strCodigo = STR_INSTANCIA_DEFENSOR;
    else if (CLL_ROLES_VIGILADA.includes(strRol)) strCodigo = STR_INSTANCIA_VIGILADA;

    const objOpcion = this.cllInstancias().find((in_objO) => in_objO.value === strCodigo);
    if (objOpcion) this.escribirSiCambia(QD.strReceptionInstance, objOpcion.value);
  }

  /**
   * Punto de recepción por defecto de la radicación web = "Internet" (CAT-PUNTO).
   *
   * Va **por etiqueta** y no por código fijo, igual que React: el select es editable desde el rediseño
   * (ver el desvío §7 de la ficha), así que lo que se siembra es el `value` de la opción cuya etiqueta
   * dice "internet". Solo si el campo está vacío — un caso precargado conserva su punto.
   */
  private sembrarPunto(): void {
    if (this.leer(QD.strReceptionPoint) || this.cllPuntosVisibles().length === 0) return;
    const objInternet = this.cllPuntosVisibles().find((in_objO) => /internet/i.test(in_objO.label));
    if (objInternet) this.escribirSiCambia(QD.strReceptionPoint, objInternet.value);
  }

  /** El canal se deriva del punto elegido. Sin regla para ese punto, queda vacío. */
  private derivarCanal(): void {
    const strCanal = DIC_CANAL_POR_PUNTO[this.leer(QD.strReceptionPoint)] ?? '';
    this.escribirSiCambia(QD.strChannel, strCanal);
  }

  /** La alianza solo aplica al Empleado Zurich: al cambiar de rol se limpia. */
  private limpiarAlianza(): void {
    if (this.blnEsEmpleadoZurich()) return;
    if (this.leer(QD.strAlliance)) this.escribirSiCambia(QD.strAlliance, '');
  }

  /**
   * Deshabilita el control de la instancia de recepción.
   *
   * ⚠ **Sigue haciendo falta aunque el campo ya no se pinte**, y no es defensa por si acaso: un control
   * deshabilitado queda fuera de `form.value` y de `form.valid`, así que es lo que garantiza que un
   * `patchValue` de precarga o un watcher no puedan dejar la pantalla inválida por un campo que nadie
   * puede corregir porque nadie lo ve. El dato viaja igual: el payload se arma con `getRawValue()`.
   *
   * `emitEvent: false` es obligatorio: esto corre desde un efecto alimentado por `valueChanges`, y
   * emitir reentraría.
   */
  private bloquearInstancia(): void {
    const objControl = this.form.get(QD.strReceptionInstance);
    if (objControl?.enabled) objControl.disable({ emitEvent: false });
  }

  // ── El traspaso de validadores entre las dos secciones de detalle ──────────────────────────────

  /**
   * La rama de detalle cuya columna de validadores está aplicada sobre el `FormGroup` — el guardia que
   * hace que la tabla se escriba solo al cruzar de una rama a la otra. Ver `alternarValidadoresDetalle()`.
   *
   * Arranca en `''` (ninguna) a propósito: así el primer efecto aplica la columna que corresponde al
   * montaje, que es la de solicitud porque al abrir no hay tipo elegido.
   */
  private strRamaDetalle: '' | typeof STR_RAMA_QUEJA | typeof STR_RAMA_SOLICITUD = '';

  /**
   * Aplica sobre el `FormGroup` la columna de `CLL_VALIDADORES_DETALLE` que le toca al tipo elegido en
   * S1: mueve los obligatorios de "Detalle de la queja" a "Detalle de la Solicitud" y al revés.
   *
   * ⚠ **Sin esto la pantalla se cuelga sin síntoma, y es el único modo de falla no obvio del cambio.**
   * Ocultar S3 con un `@if` desmonta sus widgets pero **no** toca el `FormGroup`: los `required` que
   * esta pantalla declaró sobre `strComplaintText`/`strSfcProduct`/`strInteraction`/`strSfcReason`
   * siguen ahí, así que `this.form.invalid` sería `true` para siempre en la rama de solicitud. Y el
   * submit no muestra nada: `scrollToFirstError()` busca el `id="field-<name>"` de campos que no
   * existen en el DOM, así que el ciudadano vería el botón responder y nada más pasar.
   *
   * **`strSfcProduct` no tiene red del DS**: su `[obligatorio]` viaja sobre el control satélite
   * `objProductoUi` (la colección 16 repite códigos — ver `seccion-detalle-queja.ts`), no sobre el
   * control real, así que el `required` de la tabla es el único que ese campo tiene. Lo mismo del otro
   * lado: `zds-textarea` **no** compone el `required` del DS —sobreescribe `ngOnChanges` para cortar el
   * contagio de validez de la lib, ver su cabecera—, así que el detalle de la solicitud solo es
   * obligatorio por lo que pone esta tabla. Sin este método su sección se podría enviar vacía.
   *
   * El mínimo de 50 viaja con el `required` de la queja y por un motivo propio: un ciudadano que
   * escribió 20 caracteres en el relato y **después** cambió el tipo dejaría el form inválido por un
   * `minlength` de un campo invisible, que es el mismo cuelgue con otro nombre.
   *
   * ── ⚠ Por qué `setValidators()` de la tabla entera y no un `addValidators`/`removeValidators` ──
   * Los `zds-select` de S3 (`strInteraction`, `strSfcReason`) llevan `[obligatorio]="true"`, y el DS
   * **compone su propio `required` sobre el control real de esta pantalla** al montarse:
   * `generateControl()` hace `setValidators(Validators.compose([elValidadorQueHabía, () =>
   * generateValidation()]))` (ver `campo-base.ts`). Después de eso el control ya **no** tiene
   * `Validators.required` como validador propio, tiene un closure compuesto — así que un
   * `removeValidators(Validators.required)`, que compara por identidad de función, **no saca nada y no
   * falla**. Y ningún componente de campo de la lib tiene `ngOnDestroy`: cuando el `@if` desmonta S3,
   * ese closure sigue enganchado al control, leyendo el `model` de un componente destruido. Con
   * `removeValidators` el resultado era la rama de solicitud inválida para siempre por dos campos que
   * no están en el DOM, sin nada en rojo y con `scrollToFirstError()` buscando ids inexistentes.
   *
   * Escribir la columna completa con `setValidators()` deja el control exactamente en el estado que le
   * corresponde a la rama, sin importar qué le compuso el DS antes.
   *
   * ── Y por qué el guardia de rama ──
   * El efecto corre con cada `valueChanges`, o sea con cada tecla. Reescribir la tabla en cada tecla
   * borraría el `required` compuesto del DS mientras los widgets siguen montados, así que la rama queja
   * perdería en la primera pulsación los validadores que el DS pone al montar y que nada vuelve a
   * componer hasta un remontaje. El guardia hace que la tabla se aplique **solo al cruzar** de una rama
   * a la otra, que es cuando el estado tiene que cambiar; el `''` inicial fuerza la primera aplicación
   * al montar (sin tipo elegido la rama es la de solicitud).
   *
   * `emitEvent: false` es obligatorio: esto corre desde un efecto alimentado por `valueChanges`, y
   * emitir reentraría. No hace falta refrescar `sigValores` para que el mensaje de error aparezca —
   * un efecto de componente corre **antes** de que se refresque su plantilla, así que
   * `mensajeDeError()` ya se evalúa con los validadores nuevos puestos, y por el mismo orden la tabla
   * se aplica **antes** de que el `@if` monte o desmonte la sección.
   */
  private alternarValidadoresDetalle(): void {
    const strRama = this.blnEsQueja() ? STR_RAMA_QUEJA : STR_RAMA_SOLICITUD;
    if (strRama === this.strRamaDetalle) return;
    this.strRamaDetalle = strRama;

    for (const objCampo of CLL_VALIDADORES_DETALLE) {
      const objControl = this.form.get(objCampo.strCampo);
      if (!objControl) continue;

      const cllValidadores = strRama === STR_RAMA_QUEJA ? objCampo.cllQueja : objCampo.cllSolicitud;
      objControl.setValidators([...cllValidadores]);
      objControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  // ── El destino de la radicación (proceso, evento, script y vocabulario) ────────────────────────

  /**
   * Proceso PM4 que recibe el caso: **31** (Quejas Directas) si es una queja, **36** (Otras
   * Solicitudes) en cualquier otro caso.
   *
   * Es un getter y no un `computed()` a propósito: lo leen métodos del submit, no la plantilla, y un
   * getter no puede quedar “congelado” por leerse fuera de un contexto reactivo.
   */
  private get intProcesoDestino(): number {
    return this.blnEsQueja() ? SCR000_WEB_ENTRY_PROCESS_ID : SCR000_OS_WEB_ENTRY_PROCESS_ID;
  }

  /** Start event del proceso destino. Va siempre en pareja con `intProcesoDestino`. */
  private get strEventoDestino(): string {
    return this.blnEsQueja() ? SCR000_WEB_ENTRY_EVENT_ID : SCR000_OS_WEB_ENTRY_EVENT_ID;
  }

  /** Watcher de casos similares del proceso destino: **70** para quejas, **101** para el resto. */
  private get intScriptSimilares(): number {
    return this.blnEsQueja() ? SCR000_SIMILAR_CASES_SCRIPT_ID : SCR000_OS_SIMILAR_CASES_SCRIPT_ID;
  }

  /**
   * Traduce un diccionario al vocabulario del proceso destino: intacto para quejas, `qd_` → `os_` para
   * Otras Solicitudes.
   *
   * ⚠ **Se aplica en el borde HTTP y solo ahí.** Adentro la pantalla habla `qd_` siempre —los controles
   * del form, los `_desc`, los `computed`, el resumen—, y el renombre ocurre en el último momento: el
   * POST que crea el caso, el PUT que le agrega el código SFC y los ids de adjuntos, y el `data` del
   * script de similitud. Un form con nombres variables obligaría a reconstruirlo al cambiar el tipo, y
   * con él se irían los valores ya escritos.
   *
   * ⚠ **Y no se aplica en `enviarPorTarea()`, también a propósito.** Esa rama no crea nada: completa una
   * tarea de un caso que **ya existe** en el proceso 31 con sus variables `qd_*` escritas. Renombrarlas
   * ahí no movería el caso a otro proceso —eso no lo hace un PUT—, solo dejaría el caso con dos juegos
   * de variables y las pantallas del 31 leyendo las viejas. El cambio de proceso es una decisión de
   * **radicación**, así que vive donde se radica.
   */
  private conVocabularioDestino(in_dic: Record<string, unknown>): Record<string, unknown> {
    return this.blnEsQueja() ? in_dic : aPrefijoOs(in_dic);
  }

  /** Una sola clave traducida al vocabulario del destino — para leer la salida del script. */
  private clave(in_strClave: string): string {
    return this.blnEsQueja() ? in_strClave : conPrefijoOs(in_strClave);
  }

  // ── El submit ──────────────────────────────────────────────────────────────────────────────────

  /**
   * **Paso 1** · valida, exige captcha y corre el chequeo de similares.
   *
   * El orden importa y es el de React: primero el captcha (barato, local), después la validez del
   * form, y recién ahí el script 70. Al revés se le pediría al ciudadano corregir 20 campos para
   * después descubrir que además le falta el captcha.
   */
  protected async enviar(): Promise<void> {
    this.blnIntentoEnvio.set(true);
    this.strErrorEnvio.set('');

    if (!this.strTokenCaptcha()) {
      this.strErrorEnvio.set('Marca "No soy un robot" para completar la validación de seguridad.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError(this.form);
      return;
    }

    this.blnRadicando.set(true);
    const dicSimilares = await this.chequearSimilares();
    this.dicSimilaresPendiente.set(dicSimilares);
    this.blnRadicando.set(false);

    const intCantidad = Number(dicSimilares[QD.intCountSimilarCases] ?? 0);
    if (intCantidad > 0) {
      this.objAvisoSimilares.set({
        cllIds: (dicSimilares[QD.arridSimilarCases] ?? []) as number[],
        intCantidad,
        cllCasos: (dicSimilares[QD.arrSimilarCases] ?? []) as Record<string, unknown>[],
      });
      return; // esperamos la decisión del usuario
    }

    await this.radicar(dicSimilares);
  }

  /**
   * Ejecuta el watcher de similitud del proceso destino —**70** para quejas, **101** para Otras
   * Solicitudes— que busca casos **activos** con el mismo motivo + producto + identificación.
   *
   * Los dos scripts son el mismo script con otro prefijo: el 101 lee `os_strSfcReason`/
   * `os_strSfcProduct`/`os_strIdNumber` y devuelve `os_intCountSimilarCases`/`os_arridSimilarCases`.
   * Por eso la entrada pasa por `conVocabularioDestino()` y la salida se lee con `clave()`, y no hay
   * dos implementaciones. `similar_check_status` y `process_id` **no** llevan prefijo en ninguno de los
   * dos, y no lo reciben porque el renombre es por prefijo `qd_` (ver `conPrefijoOs()`).
   *
   * Lo que devuelve este método está siempre en el vocabulario canónico `qd_`: quien lo consume es el
   * modal de similares y el payload, que se traduce solo en el borde.
   *
   * ⚠ **No se manda la clave `_request`**, y no es un olvido: PM4 la trata como reservada y sobrescribe
   * el `$data` del script, borrando las variables de entrada — el script devolvía "Faltan variables
   * obligatorias". El `process_id` acota la búsqueda; la exclusión del caso actual no aplica en la
   * radicación web, donde el caso todavía no existe.
   *
   * PM4 espera `data`/`config` como **strings JSON** y `sync: true`, igual que los demás watchers.
   *
   * Es best-effort: si el script falla se devuelve `{}` y la radicación **sigue**. Un detector de
   * duplicados caído no puede bloquear el derecho a radicar.
   */
  private async chequearSimilares(): Promise<Record<string, unknown>> {
    const dicValores = this.form.getRawValue() as Record<string, unknown>;
    const dicEntrada = this.conVocabularioDestino({
      [QD.strSfcReason]: dicValores[QD.strSfcReason],
      [QD.strSfcProduct]: dicValores[QD.strSfcProduct],
      [QD.strIdNumber]: dicValores[QD.strIdNumber],
      // Acota la búsqueda al proceso donde va a caer el caso, así que sigue al destino. Sin prefijo:
      // es un parámetro del script, no una variable del proyecto.
      process_id: this.intProcesoDestino,
    });
    const objCuerpo = {
      data: JSON.stringify(dicEntrada),
      config: JSON.stringify({}),
      sync: true,
    };

    try {
      const genResp = await firstValueFrom(
        this.objHttp.post<Record<string, unknown>>(
          urlApi(`/scripts/${this.intScriptSimilares}/execute`),
          objCuerpo,
        ),
      );
      // La salida puede venir en `.response`, en `.output` o directamente en la raíz.
      const dicSalida = (genResp['response'] ?? genResp['output'] ?? genResp) as Record<string, unknown>;
      const cllIds = (dicSalida[this.clave(QD.arridSimilarCases)] ?? []) as number[];
      // `qd_arrSimilarCases` viene vacío del script (está comentado allá), así que el detalle de cada
      // caso se resuelve acá contra `/requests/{id}` — ver `detallarSimilares()`.
      const cllDetalle = cllIds.length > 0 ? await this.detallarSimilares(cllIds) : [];
      return {
        // `similar_check_status` ya viene sin prefijo de los dos scripts, así que no pasa por `clave()`.
        [QD.strSimilarCheckStatus]: dicSalida[QD.strSimilarCheckStatus],
        [QD.arridSimilarCases]: cllIds,
        [QD.intCountSimilarCases]: dicSalida[this.clave(QD.intCountSimilarCases)] ?? 0,
        [QD.arrSimilarCases]: cllDetalle,
      };
    } catch (excError) {
      console.warn('[casos-similares] el script falló; se radica sin el chequeo:', excError);
      return {};
    }
  }

  /**
   * Resuelve el detalle de cada caso similar contra `GET /requests/{id}?include=data`.
   *
   * El script solo devuelve los **ids internos**, y el modal necesita mostrar el número de caso real y
   * la fecha de radicación. Best-effort por caso: si una consulta falla, ese caso se omite y los otros
   * se muestran igual — un id que no se pudo leer no vale por menos aviso.
   */
  private async detallarSimilares(in_cllIds: number[]): Promise<Record<string, unknown>[]> {
    const cllResultados = await Promise.all(in_cllIds.map(async (in_intId) => {
      try {
        return await firstValueFrom(
          this.objHttp.get<Record<string, unknown>>(urlApi(`/requests/${in_intId}`), {
            params: new HttpParams().set('include', 'data'),
          }),
        );
      } catch (excError) {
        console.warn(`[casos-similares] no se pudo leer el request ${in_intId}:`, excError);
        return null;
      }
    }));
    return cllResultados.filter((in_gen): in_gen is Record<string, unknown> => in_gen !== null);
  }

  /** **Paso 2a** · el usuario vio los similares y decide radicar igual. */
  protected async confirmarSimilares(): Promise<void> {
    this.objAvisoSimilares.set(null);
    await this.radicar(this.dicSimilaresPendiente());
  }

  /** **Paso 2b** · el usuario decide no continuar: se cierra el modal y se queda en el formulario. */
  protected cancelarSimilares(): void {
    this.objAvisoSimilares.set(null);
    this.dicSimilaresPendiente.set({});
  }

  /**
   * **Paso 3** · verifica el captcha server-side y recién ahí envía.
   *
   * El verify va **antes** del envío y es bloqueante, al contrario del chequeo de similares: un token
   * que `siteverify` rechaza (caducado, reusado) significa que no hay validación humana, y radicar sin
   * eso convierte el captcha en un checkbox decorativo. Ver el docstring de `recaptcha-modal.ts`.
   *
   * Las tres derivaciones del payload viven acá porque dependen del resultado del chequeo de similares:
   * - `qd_strReconsiderationSacEscalation` — réplica "Sí" **y** cero similares ⇒ el detector automático
   *   no atrapó la duplicidad, así que SAC tiene que escalarla a mano.
   * - `qd_strMarking = '1'` — misma condición, para que quede marcada y SAC la revise.
   * - `qd_blnSmartSupervisionCase = false` — siempre al radicar: el caso todavía no existe en SFC.
   */
  private async radicar(in_dicSimilares: Record<string, unknown>): Promise<void> {
    this.blnRadicando.set(true);

    try {
      const genVerify = await firstValueFrom(
        this.objHttp.post<{ success?: boolean }>(
          urlApi('/recaptcha/verify'),
          { token: this.strTokenCaptcha() },
        ),
      );
      if (!genVerify?.success) {
        this.fallarCaptcha();
        return;
      }
    } catch {
      this.fallarCaptcha();
      return;
    }

    const dicValores = this.form.getRawValue() as Record<string, unknown>;
    const intSimilares = Number(in_dicSimilares[QD.intCountSimilarCases] ?? 0);
    const blnEsReplica = dicValores[QD.strReply] === 'SI';
    const blnEscalar = blnEsReplica && intSimilares === 0;

    try {
      await this.enviarAPm4({
        ...dicValores,
        [QD.blnCaptcha]: true,
        ...in_dicSimilares,
        [QD.strReconsiderationSacEscalation]: blnEscalar,
        // ⚠ La marcación va **solo** cuando se deriva, y no con un `?:` que en la otra rama escribiría
        //   el valor previo. Esta pantalla no declara control para `qd_strMarking` (no está en
        //   `SCR000_DEFAULTS` ni tiene widget: la asigna SCR-009 al clasificar), así que un
        //   `dicValores[QD.strMarking]` sería `undefined` y viajaría como clave explícita — PM4 la
        //   escribiría sobre el `$data` del caso y la pantalla que sí la gobierna la leería vacía.
        //   React tiene el mismo `?:`, pero ahí el objeto del form nunca trae la clave y el
        //   `undefined` se pierde en el `JSON.stringify` de axios; en Angular el PUT lo serializa
        //   igual, así que la paridad de comportamiento exige omitirla.
        ...(blnEscalar ? { [QD.strMarking]: '1' } : {}),
        [QD.blnSmartSupervisionCase]: false,
      });
    } catch (excError) {
      console.error('[CrearRecibirQueja] Error al enviar:', excError);
      this.strErrorEnvio.set('Ocurrió un error al radicar la solicitud. Intenta nuevamente.');
    } finally {
      // En éxito ya se pasó al resumen; en error, quitar el overlay es lo que deja ver el mensaje.
      this.blnRadicando.set(false);
    }
  }

  /** El captcha no validó: se descarta el token para exigir una marca nueva. */
  private fallarCaptcha(): void {
    this.strErrorEnvio.set('No pudimos validar la seguridad. Vuelve a marcar "No soy un robot".');
    this.strTokenCaptcha.set('');
    this.blnRadicando.set(false);
  }

  /**
   * Los **dos modos de envío**. Ver el punto 1 de la cabecera.
   *
   * ⚠ La rama de Web Entry hace el POST **directo** y no pasa por `TaskService.iniciarProceso()`,
   * porque ese método resuelve el proceso y el evento del query string y una URL de Web Entry no los
   * trae. Los ids salen del registro PM4, resueltos por nombre.
   *
   * En las dos ramas los adjuntos se suben **antes** de escribir `qd_strSfcCode`, para que sus
   * `<docKey>_id` viajen en la misma actualización.
   */
  private async enviarAPm4(in_dicDatos: Record<string, unknown>): Promise<void> {
    if (this.objTareas.blnEsWebEntry) {
      await this.enviarPorWebEntry(in_dicDatos);
      return;
    }
    await this.enviarPorTarea(in_dicDatos);
  }

  /**
   * Rama Web Entry: crea el caso y después le escribe el código SFC y los ids de adjuntos.
   *
   * Es **la única rama que elige proceso**, y por eso es la única donde el destino y el vocabulario se
   * deciden: una queja abre un caso del 31 con variables `qd_*`, cualquier otro tipo abre uno del 36 con
   * variables `os_*`. Ver `conVocabularioDestino()` para por qué el renombre vive acá y no en el form.
   */
  private async enviarPorWebEntry(in_dicDatos: Record<string, unknown>): Promise<void> {
    const genResp = await firstValueFrom(
      this.objHttp.post<Record<string, unknown>>(
        urlApi(`/process_events/${this.intProcesoDestino}`),
        this.conVocabularioDestino(in_dicDatos),
        { params: new HttpParams().set('event', this.strEventoDestino) },
      ),
    );

    const intRequestId = (genResp['id'] ?? genResp['request_id']) as number | undefined;
    // El `case_number` (el número de queja que ve el ciudadano) viene en la misma respuesta, junto al
    // id interno del request. No son lo mismo: PM4 los expone como campos independientes.
    const numCaso = (genResp['case_number'] ?? intRequestId) as number | undefined;

    if (intRequestId) {
      const dicExtra: Record<string, unknown> = {
        ...idsAdjuntosAPayload(await this.subirAdjuntos(intRequestId)),
      };
      // `qd_strSfcCode` solo puede construirse **después** de crear el caso: su tercer componente es
      // el número de queja que PM4 acaba de asignar.
      if (numCaso) dicExtra[QD.strSfcCode] = buildSfcCode(numCaso);
      if (Object.keys(dicExtra).length > 0) {
        // Mismo renombre que el POST, y por el mismo motivo: este PUT escribe sobre el caso que se
        // acaba de crear, así que sus claves tienen que ser las del proceso que lo recibió — si no, el
        // 36 quedaría con un `qd_strSfcCode` que ninguna de sus pantallas lee.
        await firstValueFrom(
          this.objHttp.put(
            urlApi(`/requests/${intRequestId}`),
            { data: this.conVocabularioDestino(dicExtra) },
          ),
        );
      }
    }

    this.completar(numCaso);
  }

  /** Rama tarea normal: el caso ya existe, así que el código SFC viaja en el mismo `completarTarea`. */
  private async enviarPorTarea(in_dicDatos: Record<string, unknown>): Promise<void> {
    const intRequestId = this.objTareas.tarea()?.process_request_id;
    let numCaso: number | undefined;
    let dicIds: Record<string, number> = {};

    if (intRequestId) {
      dicIds = await this.subirAdjuntos(intRequestId);
      // `process_request_id` es el id interno del request, **no** el `case_number`: hay que pedirlo.
      numCaso = await this.leerNumeroDeCaso(intRequestId);
    }

    await this.objTareas.completarTarea({
      ...in_dicDatos,
      ...idsAdjuntosAPayload(dicIds),
      ...(numCaso ? { [QD.strSfcCode]: buildSfcCode(numCaso) } : {}),
    });

    this.completar(numCaso);
  }

  /** Sube los binarios del registro, o devuelve `{}` si no hay ninguno (evita el ida y vuelta). */
  private async subirAdjuntos(in_intRequestId: number): Promise<Record<string, number>> {
    if (this.objRegistro.intCantidad === 0) return {};
    return this.objAdjuntos.subir(in_intRequestId, this.objRegistro.mapArchivos);
  }

  /**
   * Resuelve el `case_number` a partir del id interno del request.
   *
   * Es el mismo valor que otras pantallas leen como `qd_strBpmCaseId`, y **no** es el `id`/
   * `request_id`: PM4 los expone como campos independientes.
   */
  private async leerNumeroDeCaso(in_intRequestId: number): Promise<number | undefined> {
    const genResp = await firstValueFrom(
      this.objHttp.get<{ case_number?: number }>(urlApi(`/requests/${in_intRequestId}`)),
    );
    return genResp?.case_number;
  }

  /** Cierra el flujo: guarda lo que el resumen necesita y pasa a la pantalla de éxito. */
  private completar(in_numCaso: number | undefined): void {
    this.numCasoCreado.set(in_numCaso);
    this.strFechaCreacion.set(this.fechaDeHoy());
    this.blnEnviado.set(true);
  }

  /**
   * `DD/MM/AAAA` de hoy, la misma convención con la que viajan las fechas de PM4
   * (ver `qd_strFilingDate`).
   *
   * Es un método y no una constante de módulo porque tiene que leer el reloj **en el momento de
   * radicar**, no cuando se cargó el bundle.
   */
  private fechaDeHoy(): string {
    const objHoy = new Date();
    const strDia = String(objHoy.getDate()).padStart(2, '0');
    const strMes = String(objHoy.getMonth() + 1).padStart(2, '0');
    return `${strDia}/${strMes}/${objHoy.getFullYear()}`;
  }

  // ── El resumen de éxito (MSG-000-08) ───────────────────────────────────────────────────────────

  /**
   * Las seis filas del resumen.
   *
   * Los cuatro campos de negocio se leen de su **`_desc`** y no del código: el ciudadano tiene que
   * poder leer "Autos", no "104". Los `_desc` están al día porque `sincronizarDesc` los mantiene y el
   * picker de producto de S3 escribe el suyo.
   */
  protected readonly cllResumen = computed<FilaResumen[]>(() => {
    const dic = this.sigValores();
    const desc = (in_strCampo: string): string => String(dic[`${in_strCampo}_desc`] ?? '') || '—';
    const numCaso = this.numCasoCreado();
    return [
      { label: 'Número de caso', value: numCaso ? String(numCaso) : '—' },
      { label: 'Fecha de creación', value: this.strFechaCreacion() || '—' },
      { label: 'Tipo de solicitud', value: desc(QD.strRequestType) },
      { label: 'Producto', value: desc(QD.strSfcProduct) },
      { label: 'Motivo de la queja', value: desc(QD.strSfcReason) },
      { label: 'Canal de recepción', value: desc(QD.strChannel) },
    ];
  });

  /**
   * Las líneas del modal de casos similares.
   *
   * El número visible es **`qd_strBpmCaseId`** (la misma variable que muestra el InfoBar de SCR-0051),
   * no el id interno; cae a `case_number`/`id` solo si ese caso todavía no lo tiene sincronizado. Si
   * ningún detalle se pudo leer, se listan los ids crudos: un aviso con ids es más útil que ninguno.
   */
  protected readonly cllLineasSimilares = computed<string[]>(() => {
    const objAviso = this.objAvisoSimilares();
    if (!objAviso) return [];
    if (objAviso.cllCasos.length === 0) {
      return objAviso.cllIds.map((in_intId) => `Caso #${in_intId}`);
    }
    return objAviso.cllCasos.map((in_objCaso) => {
      const dicDatos = (in_objCaso['data'] ?? {}) as Record<string, unknown>;
      const genNumero = dicDatos[QD.strBpmCaseId] || in_objCaso['case_number'] || in_objCaso['id'];
      const strEstado = in_objCaso['status'] ? ` · ${String(in_objCaso['status'])}` : '';
      // `qd_strFilingDate` ya viaja en 'DD/MM/AAAA'.
      const strFecha = dicDatos[QD.strFilingDate] ? ` · ${String(dicDatos[QD.strFilingDate])}` : '';
      return `Caso #${String(genNumero)}${strEstado}${strFecha}`;
    });
  });

  /** Texto del aviso, con el singular y el plural que React distingue. */
  protected readonly strTextoSimilares = computed(() => {
    const intCantidad = this.objAvisoSimilares()?.intCantidad ?? 0;
    return intCantidad === 1
      ? 'Ya existe 1 caso activo con el mismo motivo, producto e identificación. '
        + 'Revisa antes de radicar uno nuevo.'
      : `Ya existen ${intCantidad} casos activos con el mismo motivo, producto e identificación. `
        + 'Revisa antes de radicar uno nuevo.';
  });

  // ── Acciones del usuario ───────────────────────────────────────────────────────────────────────

  protected alVerificarCaptcha(in_strToken: string): void {
    this.strTokenCaptcha.set(in_strToken);
    this.strErrorEnvio.set('');
  }

  /**
   * El token caducó (a los dos minutos).
   *
   * Invalidar la copia local es **obligatorio**: sin esto, el `siteverify` del backend rechazaría el
   * token con `timeout-or-duplicate` y el ciudadano vería un fallo de seguridad sobre un checkbox que
   * el widget ya destildó. Ver el ⚠ de `recaptcha-widget.ts`.
   */
  protected alExpirarCaptcha(): void {
    this.strTokenCaptcha.set('');
  }

  /**
   * Vacía el formulario, el registro de binarios y las cinco claves de adjuntos, y sube la vista.
   *
   * `setTimeout(0)` y no `requestAnimationFrame`: rAF puede quedar suspendido si el iframe no está en
   * primer plano en el momento del clic (misma razón que documenta `scroll-to-first-error.ts`).
   */
  protected limpiarFormulario(): void {
    this.form.reset();
    this.precargar();
    this.objRegistro.limpiar();
    for (const strClave of SCR000_ADJUNTO_KEYS) {
      this.form.get(strClave)?.setValue('');
    }
    this.blnIntentoEnvio.set(false);
    this.strErrorEnvio.set('');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /** "Ir al inicio" del resumen: cierra el modal y deja el formulario listo para otra radicación. */
  protected volverAlInicio(): void {
    this.blnEnviado.set(false);
    this.numCasoCreado.set(undefined);
    this.strFechaCreacion.set('');
    this.strTokenCaptcha.set('');
    this.limpiarFormulario();
  }

  // ── Mensajes de error de S1/S4 ─────────────────────────────────────────────────────────────────

  private static readonly DIC_MSG_PATRON: Readonly<Record<string, string>> = {
    [QD.strCcEmail]: 'Formato esperado: usuario@dominio.com',
  };

  /**
   * Mensaje de error de un campo de esta pantalla, o `''` mientras no haya habido intento de envío.
   *
   * ⚠ Se lee `sigValores()` aunque no se use: `form.get().valid` **no es un signal**, así que sin
   * tocarlo este método no se re-evaluaría al corregir el campo y el mensaje quedaría pegado en
   * pantalla después de arreglarlo. Misma trampa que documentan las dos secciones.
   */
  protected mensajeDeError(in_strCampo: string): string {
    if (!this.blnIntentoEnvio()) return '';
    void this.sigValores();

    const objControl = this.form.get(in_strCampo);
    if (!objControl || objControl.valid) return '';
    if (objControl.hasError('pattern')) {
      return CrearRecibirQueja.DIC_MSG_PATRON[in_strCampo] ?? 'Formato inválido';
    }
    return 'Campo requerido';
  }

  // ── Utilidades ─────────────────────────────────────────────────────────────────────────────────

  /** Escribe solo si el valor cambió, para no reentrar en el efecto que dispara `valueChanges`. */
  private escribirSiCambia(in_strCampo: string, in_strValor: string): void {
    const objControl = this.form.get(in_strCampo);
    if (objControl && objControl.value !== in_strValor) objControl.setValue(in_strValor);
  }

  /** Lee un campo del espejo reactivo, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()[in_strCampo] ?? '');
  }

  /** Las cinco claves de adjuntos, para el uploader de S3. */
  protected readonly cllClavesAdjuntos = SCR000_ADJUNTO_KEYS;

  /** Opciones vacías tipadas, para los selects cuyo catálogo todavía no respondió. */
  protected readonly CLL_VACIO: readonly CollectionOption[] = [];
}
