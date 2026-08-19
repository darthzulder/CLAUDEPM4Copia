import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  Component, computed, inject, signal, type OnDestroy, type OnInit,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { FormSectionComponent } from '../../../../components/form-section';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZrAlertInline, ZrButton, ZrLoader } from '../../../../components/fields/zds-reexports';
import { CatalogosService } from '../../../../core/catalogos.service';
import { descOf } from '../../../../core/collection-helpers';
import type { CollectionOption } from '../../../../core/collection.types';
import { Pm4ContextService } from '../../../../core/pm4-context.service';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { TaskService } from '../../../../core/task.service';
import {
  QD, QD_COLLECTIONS, SCR009_BACK_DEFAULTS, SCR009_DEFAULT_ENTITY_CODE,
  SCR009_DEFAULT_ENTITY_TYPE, SCR009_DEFAULTS as DEFAULTS,
} from '../fields/fields';
import type { AccionFormularioSFC } from '../fields/fields';
import { ConfirmarEnvioModal } from './confirmar-envio-modal';
import { selloBogotaSfc } from './hoy-bogota';
import { SeccionCierreEnvio } from './seccion-cierre-envio';
import { SeccionFraudeAnexos } from './seccion-fraude-anexos';

/** Guion cuando un campo de solo lectura no tiene valor. Mostrar vacío esconde que el dato existe. */
const STR_PLACEHOLDER = '—';

/** Los 12 catálogos que la pantalla resuelve por su cuenta (los 2 de fraude los pide su sección). */
const CLL_CATALOGOS = [
  'sex', 'lgbtiq', 'specialCondition', 'digitalProduct', 'complaintStatus', 'favorability',
  'acceptance', 'rectification', 'withdrawal', 'tutela', 'marking', 'expressComplaint',
] as const;

/**
 * Clave de catálogo → campo `qd_*` que guarda su código.
 *
 * Existe para que la plantilla llame `descDe('favorability')` sin escribir el literal
 * `'qd_strFavorability'` en el HTML: los `qd_*` son contrato con PM4 y viven en un solo lugar
 * (regla 1). Va **antes** de la clase y no al pie del archivo porque el constructor lo recorre: un
 * `const` declarado más abajo estaría en zona muerta al construir la pantalla (`ReferenceError` en
 * runtime, invisible al compilar).
 */
const DIC_CAMPO_DE_CATALOGO = {
  sex: QD.strSex,
  lgbtiq: QD.strLgbtiq,
  specialCondition: QD.strSpecialCondition,
  digitalProduct: QD.strDigitalProduct,
  complaintStatus: QD.strComplaintStatus,
  favorability: QD.strFavorability,
  acceptance: QD.strAcceptance,
  rectification: QD.strRectification,
  withdrawal: QD.strWithdrawal,
  tutela: QD.strTutela,
  marking: QD.strMarking,
  expressComplaint: QD.strExpressComplaint,
} as const satisfies Record<(typeof CLL_CATALOGOS)[number], string>;

/**
 * SCR-009 · Formulario Superintendencia — el **cierre regulatorio** de Quejas Directas.
 *
 * Porte de `FormularioSuperintendencia.tsx`. El gestor revisa lo que calculó el back, completa los
 * pocos campos que le pertenecen y dispara el envío a SmartSupervision, que **cierra el caso**.
 *
 * ── Las dos acciones del anexo, y la tercera que el código necesita ─────────────────────────────
 * El anexo lista solo **ACT-009-01 "Guardar Formulario"** y **ACT-009-02 "Guardar Borrador"**. El
 * envío a la SFC viaja como `qd_strAction = 'ENVIAR_SFC'` y en la ficha de React figura como
 * "ACT-009-03", una acción que **el anexo no declara**. Se porta tal cual —cambiar el literal
 * rompería el enrutamiento del BPM, que es lo que lo lee— y queda anotado como divergencia en la
 * ficha para que la decida el negocio. Es lo mismo que pasa al revés con "Guardar Formulario": la
 * ficha de React la menciona en varias secciones y **el código no tiene esa acción**.
 *
 * ── Estado de la Queja se fuerza a `'4'` y no se muestra ────────────────────────────────────────
 * SCR-009 *es* el cierre, así que `qd_strComplaintStatus` se fija en `'4'` = "Cerrada" (colección 42:
 * 1=Recibida, 2=Abierta, 4=Cerrada) durante la precarga. Sin eso viajaría el `'2'` que dejó la
 * radicación en SCR-000 y la SFC recibiría el cierre marcado como abierto. El campo **sigue en el
 * payload** pero no se pinta: no hay nada que el gestor pueda decidir ahí.
 *
 * ── El gate de envío se deriva del espejo de signals, nunca de `form.valid` ─────────────────────
 * `blnPuedeEnviar` mira `sigValores`, no `this.form.valid`. `valid` es un **getter**, así que leerlo
 * dentro de un `computed()` no crea dependencia: el gate quedaría congelado en su primer valor y el
 * botón de enviar no se habilitaría nunca. Es el mismo puente que documenta la SCR-008.
 *
 * ── Por qué el `Validators.required` va solo en Condición Especial ──────────────────────────────
 * Los 4 campos de fraude son obligatorios **condicionalmente** (solo si `qd_strFraudRelated === 'SI'`,
 * RUL-009-01), así que un `required` fijo dejaría el form inválido al montar en todo caso sin fraude y
 * `scrollToFirstError` saltaría a un campo que ni se está pintando. La condición vive en
 * `blnFraudeCompleto()`, igual que el `objFraudReq` de React.
 *
 * ── `CatalogosService` en `providers` y no de root ──────────────────────────────────────────────
 * Fabrica un `CollectionService` por clave en un `Injector` hijo, y cada `CollectionService` guarda las
 * `options` de *una* colección. Acá hacen falta 12; los 2 de fraude los provee `SeccionFraudeAnexos`
 * por su cuenta, que es lo correcto: son un detalle de cómo se pintan esas filas.
 */
@Component({
  selector: 'app-formulario-superintendencia',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    SeccionFraudeAnexos,
    SeccionCierreEnvio,
    ConfirmarEnvioModal,
    ZdsSelect,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrLoader,
  ],
  providers: [CatalogosService],
  templateUrl: './formulario-superintendencia.html',
})
export class FormularioSuperintendencia implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objCatalogos = inject(CatalogosService);
  private readonly objContexto = inject(Pm4ContextService);

  readonly objTarea = this.objTareas.tarea;
  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  /**
   * El formulario. Declara **todas** las claves de `SCR009_DEFAULTS`, incluidos los campos "Back" que
   * el gestor no edita: `reset()` en React reemplazaba el estado entero, así que todo lo que llegaba en
   * `task.data` viajaba de vuelta intacto. Un control que faltara acá se perdería en el camino y la SFC
   * recibiría el cierre sin ese dato.
   */
  readonly form = new FormGroup(
    Object.fromEntries(
      Object.keys(DEFAULTS).map((in_strClave) => [
        in_strClave,
        new FormControl<string>(''),
      ]),
    ) as Record<string, FormControl<string | null>>,
  );

  /**
   * Espejo del `watch()` de react-hook-form. `valueChanges` es un `Observable` y no notifica a los
   * `computed` de Angular; sin este puente el gate y los campos derivados quedarían congelados.
   *
   * Se siembra con `getRawValue()` y no con `{}` para que el estado inicial ya sea coherente.
   */
  readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /** Equivalente del `isSubmitted` de RHF: hasta el primer intento no se pintan los "requerido". */
  readonly blnIntentoEnvio = signal(false);

  /** Popup de confirmación previo al envío (el envío cierra el caso). */
  readonly blnMostrarConfirmacion = signal(false);

  constructor() {
    // `Validators.required` en el único campo obligatorio incondicional. Va en el constructor y no en
    // el literal del `FormGroup` porque los controles se fabrican en bloque desde `DEFAULTS`.
    this.form.get(QD.strSpecialCondition)?.addValidators(Validators.required);

    // Los 12 `_desc`: el campo base guarda el CÓDIGO que espera el BPM/SFC y su compañera viaja al
    // lado con la descripción legible (convención `_desc` del proyecto).
    //
    // Tercer argumento como **función**: pasar el array capturaría el `[]` del primer instante, antes
    // de que responda el GET del catálogo, y el `_desc` nunca se escribiría.
    //
    // Se llama desde el constructor —que sí es contexto de inyección— porque `sincronizarDesc()` hace
    // `inject(DestroyRef)`. Acá se puede porque el `FormGroup` es un campo de instancia de la pantalla;
    // las secciones lo reciben por `input()` y por eso ellas necesitan `runInInjectionContext`.
    for (const strClave of CLL_CATALOGOS) {
      const strCampo = DIC_CAMPO_DE_CATALOGO[strClave];
      sincronizarDesc(this.form, strCampo, () => this.cllOpcionesDe(strClave));
    }
  }

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();

    // Los 12 catálogos se piden sin gating: ninguno depende de otro campo del form.
    for (const strClave of CLL_CATALOGOS) {
      void this.objCatalogos.cargar(strClave, QD_COLLECTIONS[strClave], this.form.getRawValue());
    }
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /**
   * Precarga desde `task.data`, con las tres garantías que React resolvía en su `reset()`:
   *
   * 1. **`SCR009_BACK_DEFAULTS`** rellena los campos "Back" con código confirmado (Excel PQRS V3.0)
   *    cuando el proceso no los trae o los manda vacíos, para que existan y viajen.
   * 2. **Tipo y código de entidad** respetan el valor del back si viene; si no, se inyecta su default.
   *    El adjunto de respuesta final se fuerza **siempre** a `'SI'` (el PDF lo genera el proceso).
   * 3. **Fecha de Actualización y Fecha de Cierre** se autocompletan con el instante actual en horario
   *    Colombia, formato SFC, y son **idénticas**. En la sección de cierre son `readOnly`, así que el
   *    gestor no las puede tocar.
   *
   * Solo se copian las claves que el form declara: `patchValue` ignoraría las demás igual, pero
   * declarar el descarte acá lo hace visible en vez de dejarlo a merced de Angular.
   */
  private precargar(): void {
    const objTarea = this.objTarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const texto = (in_strClave: string): string => String(dicDatos[in_strClave] ?? '');

    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }

    // Los "Back" con código confirmado, solo si llegaron vacíos.
    for (const [strClave, strDefault] of Object.entries(SCR009_BACK_DEFAULTS)) {
      if (!dicParche[strClave]) dicParche[strClave] = strDefault;
    }

    const strSelloSfc = selloBogotaSfc();

    this.form.patchValue({
      ...DEFAULTS,
      ...dicParche,
      [QD.strEntityType]: texto(QD.strEntityType) || SCR009_DEFAULT_ENTITY_TYPE,
      [QD.strEntityCode]: texto(QD.strEntityCode) || SCR009_DEFAULT_ENTITY_CODE,
      [QD.strFinalReplyAttach]: 'SI',
      // Ver la cabecera de la clase: SCR-009 es el cierre, así que el estado se fija en "Cerrada".
      [QD.strComplaintStatus]: '4',
      [QD.strUpdateDate]: strSelloSfc,
      [QD.strClosureDate]: strSelloSfc,
    });
  }

  // ── Catálogos ─────────────────────────────────────────────────────────────────────────────────

  /**
   * Opciones de un catálogo ya cargado. Se llama desde la plantilla, así que **no dispara red**:
   * `CatalogosService.de()` separa obtener de cargar justo para poder usarse en un binding.
   */
  cllOpcionesDe(in_strClave: string): readonly CollectionOption[] {
    return this.objCatalogos.de(in_strClave).options();
  }

  /** Descripción legible del código guardado en un campo de solo lectura de S3. */
  descDe(in_strClave: keyof typeof DIC_CAMPO_DE_CATALOGO): string {
    const strCampo = DIC_CAMPO_DE_CATALOGO[in_strClave];
    const strCodigo = String(this.sigValores()[strCampo] ?? '');
    return descOf(this.cllOpcionesDe(in_strClave), strCodigo) || STR_PLACEHOLDER;
  }

  // ── El gate de envío (MSG-009-02) ─────────────────────────────────────────────────────────────

  /**
   * Alineación con el Excel PQRS V3.0: los campos regulatorios (sexo, LGBTIQ+, producto digital y toda
   * la Condición de la Queja) los calcula el back → solo lectura. Los editables que **condicionan el
   * guardado** son Condición Especial (Front, obligatorio SFC), los dos indicadores de anexos y, si
   * ¿Relacionada con Fraude? = Sí, los 4 campos de fraude (RUL-009-01 / MSG-009-01).
   */
  readonly blnCondEspecialOk = computed(() => !!this.leer(QD.strSpecialCondition).trim());

  /**
   * Los dos indicadores de anexos llegan en `'SI'` y se pintan bloqueados, pero el gate los mira
   * igual: si el back los mandara vacíos, el envío no debe salir con dos flags en blanco hacia la SFC.
   */
  readonly blnAnexosCompletos = computed(
    () => !!this.leer(QD.strIncludesComplaintAnnex) && !!this.leer(QD.strIncludesReplyAttach),
  );

  readonly blnEsFraude = computed(() => this.leer(QD.strFraudRelated) === 'SI');

  readonly blnFraudeCompleto = computed(
    () =>
      !this.blnEsFraude()
      || (!!this.leer(QD.strFraudType).trim()
        && !!this.leer(QD.strFraudModality).trim()
        && !!this.leer(QD.strClaimedAmount).trim()
        && !!this.leer(QD.strAcknowledgedAmount).trim()),
  );

  readonly blnPuedeEnviar = computed(
    () => this.blnCondEspecialOk() && this.blnAnexosCompletos() && this.blnFraudeCompleto(),
  );

  /** Si la SFC rechazó el envío, la acción pasa a "Reenviar Cierre (corrección)". */
  readonly blnRechazado = computed(
    () => this.leer(QD.strM3ClosureStatus) === 'Rechazado (400)',
  );

  readonly strRotuloEnviar = computed(() =>
    this.blnRechazado() ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶',
  );

  /** Error de Condición Especial: no se pinta hasta el primer intento de envío (el `isSubmitted`). */
  readonly strErrorCondEspecial = computed(() => {
    if (!this.blnIntentoEnvio()) return '';
    return this.blnCondEspecialOk() ? '' : 'Campo requerido';
  });

  private leer(in_strCampo: string): string {
    return String(this.sigValores()[in_strCampo] ?? '');
  }

  // ── Acciones ──────────────────────────────────────────────────────────────────────────────────

  /**
   * Al pulsar "Enviar a SmartSupervision": valida y, si está OK, abre el popup. El envío real ocurre
   * al confirmar — el `handleSubmit(() => setBlnShowConfirm(true), scrollToFirstError)` de React.
   *
   * ⚠ La guarda es **acá**, no solo en el `[disabled]` del botón: un componente del DS deshabilitado
   * igual invoca su handler bajo jsdom (trampa 1 de `testing-conventions.md`), así que sin este corte
   * se podría abrir el popup —y desde ahí enviar— con el formulario incompleto.
   *
   * El `setErrors` va **antes** del `scrollToFirstError`: la función camina el árbol de controles
   * podando por `valid`, así que es lo que hace que el control sea el inválido que va a encontrar. Y
   * `markAsTouched` acompaña porque el estado de error del wrapper es `invalid && touched`.
   */
  solicitarEnvio(): void {
    this.blnIntentoEnvio.set(true);

    if (!this.blnPuedeEnviar()) {
      if (!this.blnCondEspecialOk()) {
        const objControl = this.form.get(QD.strSpecialCondition);
        objControl?.setErrors({ required: true });
        objControl?.markAsTouched();
      }
      scrollToFirstError(this.form);
      return;
    }

    this.blnMostrarConfirmacion.set(true);
  }

  /** "Atrás" del popup, su X y el click en el backdrop: cierra sin enviar. */
  cerrarConfirmacion(): void {
    this.blnMostrarConfirmacion.set(false);
  }

  /** Confirmación del popup → completa la tarea y cierra el caso. */
  async confirmarEnvio(): Promise<void> {
    this.blnMostrarConfirmacion.set(false);
    await this.enviarCon('ENVIAR_SFC');
  }

  /**
   * ACT-009-02 · Guardar Borrador: guarda sin completar la tarea y devuelve el frame superior a la
   * bandeja de ProcessMaker, **solo si se guardó bien**. Redirigir tras un fallo perdería lo escrito
   * sin que el gestor se enterara.
   */
  async guardarBorrador(): Promise<void> {
    const blnOk = await this.enviarCon('GUARDAR_BORRADOR');
    if (!blnOk) return;
    const objTope = window.top;
    if (objTope) objTope.location.href = this.objContexto.urlBandejaTareas();
  }

  /**
   * Envía con la acción elegida. `ENVIAR_SFC` completa la tarea (avanza el BPM y cierra el caso);
   * `GUARDAR_BORRADOR` escribe sobre el *request* sin completar nada.
   *
   * Se lee `getRawValue()` y no `value` por regla del proyecto: un control deshabilitado desaparece de
   * `value`, y acá el payload tiene que llevar **todas** las claves del caso.
   *
   * Devuelve si salió bien porque `guardarBorrador()` decide la redirección con eso. El `console.error`
   * se porta tal cual: `TaskService` ya deja el mensaje en su signal `error`, y este log agrega la
   * excepción completa en la consola del iframe, que es donde se diagnostica un 422 de PM4.
   */
  private async enviarCon(in_strAccion: AccionFormularioSFC): Promise<boolean> {
    const dicPayload: Record<string, unknown> = {
      ...this.form.getRawValue(),
      [QD.strAction]: in_strAccion,
    };

    try {
      if (in_strAccion === 'GUARDAR_BORRADOR') await this.objTareas.guardarBorrador(dicPayload);
      else await this.objTareas.completarTarea(dicPayload);
      return true;
    } catch (excError) {
      console.error('[FormularioSuperintendencia] Error al enviar:', excError);
      return false;
    }
  }

  protected readonly QD = QD;
}
