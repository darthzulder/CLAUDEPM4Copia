import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsRadio } from '../../../../components/fields/zds-radio';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import {
  ZrAlertInline,
  ZrButton,
  ZrLoader,
  ZrModal,
  ZrTemplate,
} from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { TaskService } from '../../../../core/task.service';
import {
  OPTIONS_SI_NO,
  QD,
  SCR011_DEFAULTS as DEFAULTS,
  type AccionErrorTecnicoProrroga,
} from '../fields/fields';

/** Longitud máxima de causa raíz y corrección aplicada (§10 del DOCUMENTACION: suposición, no insumo). */
const INT_MAX_TEXTO = 2000;

/** El valor de `qd_strPayloadAdjustNeeded` que habilita la edición del payload (FLD-058). */
const STR_AJUSTE_SI = 'SI';

/**
 * SCR-011 · Revisión Error Técnico Prórroga — el Analista Técnico revisa el log del error con que
 * falló el envío de la **solicitud de prórroga** a SmartSupervision, registra la corrección y
 * autoriza el reenvío, **o escala el caso al proveedor**.
 *
 * Port de `frontend/src/screens/.../COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga/RevisionErrorTecnicoProrroga.tsx`.
 * La trazabilidad FLD/RUL/MSG/ACT contra el Anexo02 vive en
 * [DOCUMENTACION_COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga.md](./DOCUMENTACION_COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga.md),
 * al lado de este archivo.
 *
 * ── ⚠ Es la pantalla GEMELA de SCR-004, y las cuatro diferencias son el port ────────────────────
 * El anexo mapea FLD-190..196 a los FLD-050..058 de SCR-004 (§10 del DOCUMENTACION: es la misma
 * tarea de usuario sobre el subproceso de prórroga), así que el 90% del código es idéntico y
 * copiarlo es lo correcto. Lo que **no** se puede copiar, y es exactamente donde un port descuidado
 * pierde funcionalidad:
 *
 *  1. **Hay DOS acciones de cierre, no una.** `AccionErrorTecnicoProrroga` es
 *     `'AUTORIZAR_REENVIO' | 'ESCALAR_PROVEEDOR'`, y ACT-011-02 ("Escalar a Proveedor") sigue vivo.
 *     En SCR-004 ese botón **se retiró** por decisión del negocio (§10.10 de su DOCUMENTACION) y su
 *     tipo quedó con un único literal. El comentario de esa pantalla avisa textualmente: *"copiar de
 *     acá para allá perdería esa salida"*. Ver [`escalar`](#escalar).
 *  2. **`escalar()` NO valida RUL-011-01.** Es una salida de excepción: se usa justamente cuando el
 *     analista **no puede** diagnosticar la falla, así que exigirle causa raíz la volvería
 *     inalcanzable. En React es un `onClick` directo que ni pasa por `handleSubmit`. Por eso su
 *     botón tampoco lleva el `[disabled]` de la regla — solo el de `blnEnviando()`.
 *  3. **El `required` de S2 NO vive en los controles.** Y esto es consecuencia directa del punto 2:
 *     con `Validators.required` en `strRootCause`/`strCorrectionApplied`, escalar con los campos
 *     vacíos —el caso normal de ACT-011-02— dejaría el form inválido. No rompería el envío (nada lee
 *     `form.valid` acá), pero sí es una declaración falsa: diría "este campo es obligatorio para la
 *     pantalla" cuando lo es solo para una de sus dos salidas. Es el mismo criterio que SCR-008 usa
 *     para `qd_strSacRemarks` (obligatoriedad **condicional a la acción** → se aplica en el handler)
 *     y el opuesto al de SCR-004, que tiene una sola salida y sí puede ponerlo en el control. La
 *     obligatoriedad real la impone [`blnPuedeAutorizar`](#blnPuedeAutorizar), que es lo que RUL-011-01
 *     pide. El `Validators.maxLength` sí se queda: ese límite aplica a las dos salidas.
 *  4. **Los rótulos y los textos dicen "prórroga".** No es cosmético: son los del Anexo02 para esta
 *     pantalla (FLD-190 "Código HTTP prórroga", FLD-194 "Número de intento prórroga", FLD-193
 *     "Payload de prórroga enviado (JSON)") y el spec los asevera textualmente. Un rótulo copiado de
 *     SCR-004 le diría al analista que está viendo el error de la respuesta, no el de la prórroga.
 *
 * ── El otro límite, que no es del anexo sino del script ────────────────────────────────────────
 * **El payload editado tiene que ser un objeto JSON válido.** Si no parsea —o parsea a un array o a
 * un escalar— el script de Momento 3 lo **descarta** y reconstruye el body desde los campos del
 * caso. Sin este bloqueo el analista editaría el payload de la prórroga, autorizaría, y su
 * corrección se perdería **en silencio**. Vive en [`blnPayloadJsonOk`](#blnPayloadJsonOk).
 *
 * ── Por qué NO hay `CollectionService` en `providers` ──────────────────────────────────────────
 * Igual que SCR-004: esta pantalla no consume ninguna colección. El único campo de valores cerrados
 * (el radio Sí/No) sale de la constante compartida `OPTIONS_SI_NO`. Un provider de más acá sería una
 * dependencia muerta que igual dispararía su GET al montar.
 */
@Component({
  selector: 'app-revision-error-tecnico-prorroga',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    ZdsInput,
    ZdsRadio,
    ZdsTextarea,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrLoader,
    ZrModal,
    ZrTemplate,
  ],
  templateUrl: './revision-error-tecnico-prorroga.html',
})
export class RevisionErrorTecnicoProrroga implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);

  /** Estado de la tarea, tal como lo exponía `useTask()` en React. */
  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  readonly cllOpcionesSiNo = OPTIONS_SI_NO;

  /**
   * El formulario, tipado sobre `SCR011_DEFAULTS`.
   *
   * ── ⚠ Sin `Validators.required` en S2, a diferencia de SCR-004 ─────────────────────────────
   * Ver el punto 3 del docstring de la clase: los dos campos de S2 son obligatorios **para
   * autorizar** (RUL-011-01), no para escalar (ACT-011-02). Ponerlos como `required` del control
   * declararía una obligatoriedad que la pantalla no tiene en una de sus dos salidas. La regla se
   * impone en `blnPuedeAutorizar()`, que además hace el `trim()` que `Validators.required` no hace.
   *
   * `strPayloadAdjustNeeded` **sí** lo lleva: FLD-058 lo marca obligatorio para las dos salidas y
   * `DEFAULTS` lo siembra en `'NO'`, así que está satisfecho desde el montaje. Se declara igual para
   * que un `patchValue` con `''` desde PM4 deje el form inválido en vez de pasar.
   *
   * ── Los `maxLength` de React viven en DOS lugares, y hacen falta los dos ───────────────────
   * En React era un solo `<ZdsTextarea maxLength={2000} />` que hacía las dos cosas. Acá se separan
   * porque son dos contratos distintos:
   *
   *  1. **El límite efectivo** son los `Validators.maxLength(INT_MAX_TEXTO)` de abajo, y son lo único
   *     que de verdad invalida. Viven en el control porque `lib-textarea-z` **no registra control en
   *     el group** (su `ngOnInit` nunca llama `generateControl()`), así que no compone ningún
   *     validador propio: lo que se le pase al componente es puramente visual.
   *  2. **El contador visual** (`9/2000`) es el `[maxLength]="2000"` de los dos `zds-textarea` de la
   *     plantilla. Los dos hacen falta, y el spec de paridad
   *     ([paridad-react.spec.ts](../../../../components/fields/paridad-react.spec.ts)) los asevera por
   *     separado contra el dataset congelado del `.tsx` — que es la guarda que existe porque en
   *     SCR-008 se portaron los validadores y se olvidaron los tres contadores.
   */
  readonly form = new FormGroup({
    [QD.strHttpCode]: new FormControl(''),
    [QD.strErrorType]: new FormControl(''),
    [QD.strAttemptNum]: new FormControl(''),
    [QD.strEndpointCalled]: new FormControl(''),
    [QD.strApiTechMessage]: new FormControl(''),
    [QD.strCompleteLogAPI]: new FormControl(''),
    [QD.strPayloadSent]: new FormControl(''),
    [QD.strRootCause]: new FormControl('', [Validators.maxLength(INT_MAX_TEXTO)]),
    [QD.strCorrectionApplied]: new FormControl('', [Validators.maxLength(INT_MAX_TEXTO)]),
    [QD.strPayloadAdjustNeeded]: new FormControl('', [Validators.required]),
    [QD.strAction]: new FormControl(''),
  });

  /**
   * Espejo del valor del form como signal, que es el equivalente del `watch()` de react-hook-form.
   *
   * `valueChanges` es un `Observable` y no notifica a los `computed` de Angular, así que sin este
   * puente `blnPuedeAutorizar` nunca se recalcularía al tipear y el botón *Autorizar* quedaría
   * deshabilitado para siempre. Se suscribe en el constructor y se desuscribe en `ngOnDestroy`.
   *
   * ⚠ Se siembra con `getRawValue()` y no con `{}`: si arrancara vacío, todo lo derivado leería
   * `undefined` hasta el primer cambio del usuario. Mismo criterio que SCR-004 y SCR-008.
   */
  private readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  /**
   * Una sola suscripción hace dos cosas, y el orden importa: primero refresca el espejo (del que
   * dependen todos los `computed`), después reacciona al cambio de FLD-058 abriendo o cerrando la
   * edición del payload.
   *
   * ⚠ La reacción vive **acá** y no en un `(valueChange)` del template porque los wrappers de la
   * fachada **no exponen output alguno** — su único canal hacia la pantalla es el CVA (ver
   * `campo-base.ts`: `registerOnChange` es lo que hay, no hay `@Output`). Y no puede vivir en un
   * `computed` porque `enable()`/`disable()` es un efecto sobre el form, no un valor derivado.
   */
  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
    this.sincronizarEdicionPayload();
  });

  /** Visibilidad del modal de log. */
  readonly blnVerLog = signal(false);

  /**
   * Marca de que ya se intentó **autorizar**, para el mismo `isSubmitted` de react-hook-form: los
   * errores de requerido no se pintan hasta ese momento. Sin esto la pantalla abriría con los dos
   * campos de S2 en rojo, que es lo contrario de lo que RUL-011-01 quiere decir.
   *
   * ⚠ `escalar()` **no** la levanta: esa salida no exige los campos, así que pintarlos en rojo al
   * escalar sería reprochar al analista por no diagnosticar algo que justamente está derivando.
   */
  readonly blnIntentoEnvio = signal(false);

  /** Número de intento acumulado de la prórroga (FLD-194), para el sufijo de la alerta de S1. */
  readonly strIntento = computed(() => String(this.sigValores()[QD.strAttemptNum] ?? ''));

  /** FLD-058 — el analista marcó que hay que ajustar el payload antes de reenviar. */
  readonly blnAjustaPayload = computed(
    () => this.sigValores()[QD.strPayloadAdjustNeeded] === STR_AJUSTE_SI,
  );

  /**
   * El payload editado es un **objeto** JSON válido (o no hay ajuste marcado, y entonces no hay nada
   * que validar).
   *
   * ⚠ Las tres condiciones del `return` son necesarias y ninguna es redundante, porque `JSON.parse`
   * acepta bastante más que un objeto: `'null'` parsea a `null` (de ahí el `!!`), `'[1,2]'` parsea a un
   * array —que es `typeof 'object'` y pasaría el segundo chequeo— y `'"texto"'` o `'42'` parsean a
   * escalares. El script de M3 espera un **body**, así que cualquiera de esos tres casos haría que
   * descartara la edición. El spec cubre las tres formas.
   */
  readonly blnPayloadJsonOk = computed(() => {
    if (!this.blnAjustaPayload()) return true;
    try {
      const genParseado: unknown = JSON.parse(String(this.sigValores()[QD.strPayloadSent] ?? ''));
      return !!genParseado && typeof genParseado === 'object' && !Array.isArray(genParseado);
    } catch {
      return false;
    }
  });

  /**
   * RUL-011-01 + el gate del payload — habilita "Autorizar Reenvío Prórroga".
   *
   * El `trim()` no es cosmético: un textarea con solo espacios satisface el `Validators.required` de
   * Angular (que solo rechaza `''` y `null`) y dejaría autorizar sin diagnóstico. Es la misma razón
   * por la que React lo hacía, y por la que este computed no se puede reemplazar por `form.valid` —
   * que acá además ni siquiera sería equivalente, porque los dos campos no llevan `required`
   * (punto 3 del docstring de la clase).
   */
  readonly blnPuedeAutorizar = computed(
    () =>
      !!String(this.sigValores()[QD.strRootCause] ?? '').trim() &&
      !!String(this.sigValores()[QD.strCorrectionApplied] ?? '').trim() &&
      this.blnPayloadJsonOk(),
  );

  /** Mensaje de error de la causa raíz, o `''`. Se pinta recién tras el primer intento de autorizar. */
  readonly strErrorCausaRaiz = computed(() => this.mensajeDeError(QD.strRootCause));

  /** Mensaje de error de la corrección aplicada, o `''`. */
  readonly strErrorCorreccion = computed(() => this.mensajeDeError(QD.strCorrectionApplied));

  /**
   * Texto de ayuda del payload, que cambia de significado según FLD-058: con ajuste marcado explica
   * que **este** JSON es el que se reenvía; sin ajuste, que es el del intento fallido y es de lectura.
   */
  readonly strAyudaPayload = computed(() =>
    this.blnAjustaPayload()
      ? 'Ajuste el JSON del body: si difiere del que genera el BPM, se reenviará este.'
      : 'JSON del payload de prórroga del intento fallido — solo lectura.',
  );

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();
    this.sincronizarEdicionPayload();
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /**
   * Precarga desde `task.data`, réplica del `reset({...DEFAULTS, ...task.data})` de React.
   *
   * Solo se copian las claves que el form declara: `patchValue` ignora las demás, pero pasar
   * `task.data` entero dejaría el descarte a merced de Angular en vez de declararlo acá. Mismo
   * criterio que `precargar()` de SCR-004 y SCR-008.
   */
  private precargar(): void {
    const objTarea = this.objTareas.tarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }

    this.form.patchValue({ ...DEFAULTS, ...dicParche });
  }

  /**
   * Pone `qd_strPayloadSent` en `enabled`/`disabled` según FLD-058.
   *
   * ── Por qué `disable()` y no un `[readOnly]` en el template ────────────────────────────────────
   * React pasaba `readOnly={!blnAdjustPayload}` al wrapper, o sea que el bloqueo vivía en la vista.
   * Acá vive en el **control**, por dos motivos que se descubrieron al portar SCR-004:
   *
   * 1. Un `[readOnly]` bindeado a un computed haría que el wrapper reciba el input nuevo, pero el
   *    `readonly` del `za-textarea` es un atributo del custom element de Lit y bajo jsdom no se
   *    refleja — o sea que el spec no podría aseverar el bloqueo de ninguna forma honesta (trampa 2 de
   *    `testing-conventions.md`). `control.disabled` sí es estado de Angular y es verificable.
   * 2. Es lo que de verdad protege el dato. Un textarea `readonly` igual acepta un `setValue()`
   *    programático; un control `disabled` no entra en `form.value` ni se puede escribir desde la
   *    vista, así que el payload no puede mutar mientras el analista no marque el ajuste.
   *
   * ⚠ Y por eso los DOS envíos usan **`getRawValue()`**: `form.value` **omite los controles
   * deshabilitados**, así que con ajuste en `'NO'` el `qd_strPayloadSent` del intento fallido no
   * viajaría en el payload y PM4 lo recibiría como faltante. En esta pantalla el modo de falla es
   * doble —afecta a autorizar **y** a escalar— y hay un caso del spec por cada salida.
   *
   * Se llama con `emitEvent: false` para no re-disparar `valueChanges` desde dentro de la reacción a
   * `valueChanges` (el `enable`/`disable` de un control emite en el form padre).
   */
  private sincronizarEdicionPayload(): void {
    const objControl = this.form.get(QD.strPayloadSent);
    if (!objControl) return;

    if (this.blnAjustaPayload()) objControl.enable({ emitEvent: false });
    else objControl.disable({ emitEvent: false });
  }

  /**
   * Réplica del `err()` de React: el error de un campo, oculto hasta que se intentó autorizar.
   *
   * ⚠ Acá el mensaje de vacío **no** puede salir de `hasError('required')` como en SCR-004, porque
   * los controles de S2 no llevan `Validators.required` (punto 3 del docstring de la clase). Se
   * decide por el valor: sin texto útil, es el requerido de RUL-011-01. Es la misma pregunta que
   * `blnPuedeAutorizar()` hace, así que el `trim()` va también acá — si no, un campo con espacios se
   * vería sin error mientras el botón sigue deshabilitado, que es el peor estado posible: el analista
   * no tendría en pantalla ninguna pista de qué le falta.
   */
  private mensajeDeError(in_strCampo: string): string {
    if (!this.blnIntentoEnvio()) return '';

    const objControl = this.form.get(in_strCampo);
    if (!objControl) return '';
    if (objControl.hasError('maxlength')) return `Máximo ${INT_MAX_TEXTO} caracteres`;
    if (!String(objControl.value ?? '').trim()) return 'Campo requerido';
    return '';
  }

  /** Abre el modal con el log completo que emitió el script de Momento 2/3. */
  abrirLog(): void {
    this.blnVerLog.set(true);
  }

  /**
   * Cierra el modal del log.
   *
   * La pantalla **tiene que** bajar su propia bandera acá y no confiar en el modal: `ModalZ.change()`
   * hace `this.open = false` sobre su **propio input**, así que tras cerrar desde el backdrop o la X
   * el componente y la pantalla quedan desincronizados y el segundo intento de abrir no haría nada
   * (el valor del `[open]` no cambiaría). Ver el punto 3 de
   * [zds-reexports.ts](../../../../components/fields/zds-reexports.ts).
   */
  cerrarLog(): void {
    this.blnVerLog.set(false);
  }

  /**
   * ACT-011-01 — Autorizar Reenvío Prórroga (RUL-011-01).
   *
   * ⚠ La guarda es **acá**, no solo en el `[disabled]` del botón. Un `disabled` de un componente del
   * DS no impide que el handler se invoque (trampa 1 de `testing-conventions.md`: un `z-button`
   * deshabilitado igual dispara su click), así que sin este corte se podría autorizar el reenvío sin
   * causa raíz ni corrección registradas — que es exactamente lo que RUL-011-01 prohíbe— o con un
   * payload que el script va a descartar.
   *
   * `markAllAsTouched` va junto al corte porque el estado de error del wrapper es
   * `invalid && touched`: sin el `touched` los campos quedarían inválidos y pintados como si nada.
   */
  autorizar(): void {
    this.blnIntentoEnvio.set(true);

    if (!this.blnPuedeAutorizar()) {
      this.form.markAllAsTouched();
      // Recibe el form, no un diccionario de errores: el puerto Angular camina el árbol de controles
      // (poda por `valid`). Por eso el `markAllAsTouched` de arriba va ANTES.
      scrollToFirstError(this.form);
      return;
    }

    void this.enviar('AUTORIZAR_REENVIO');
  }

  /**
   * ACT-011-02 — Escalar a Proveedor.
   *
   * ⚠ **Sin validar RUL-011-01, y eso es el requisito, no un olvido.** Es la salida que el analista
   * usa cuando **no puede** diagnosticar la falla —el error es del proveedor—, así que exigirle causa
   * raíz y corrección la volvería inalcanzable justo en el escenario para el que existe. En React es
   * un `onClick` que ni pasa por `handleSubmit`, o sea que tampoco corría las `rules` de los campos.
   *
   * Tampoco levanta `blnIntentoEnvio`: pintar S2 en rojo al escalar sería reprochar la falta de un
   * diagnóstico que el analista está derivando a propósito.
   *
   * ⚠ Esta acción **no existe en SCR-011's gemela**: ACT-004-02 se retiró de SCR-004 por decisión del
   * negocio y su tipo `AccionErrorTecnico` quedó con un único literal. Si alguna vez se sincronizan
   * las dos pantallas copiando código, esta salida es lo primero que se pierde — y su ausencia no
   * rompe nada visible: el analista simplemente se queda sin forma de derivar el caso.
   */
  escalar(): void {
    void this.enviar('ESCALAR_PROVEEDOR');
  }

  /**
   * Completa la tarea con la acción que corresponda a cada botón.
   *
   * `getRawValue()` y no `value`: ver el ⚠ de `sincronizarEdicionPayload()` — con el ajuste en `'NO'`
   * el control del payload está deshabilitado y `form.value` lo omitiría, así que el JSON del intento
   * fallido no llegaría a PM4. Aplica a las dos salidas.
   *
   * El `catch` con `console.error` se porta tal cual: `TaskService` ya deja el mensaje en su signal
   * `error`, y lo que este log agrega es el objeto de excepción completo en la consola del iframe,
   * que es donde se diagnostica un 422 de PM4 sin devtools de red a mano.
   */
  private async enviar(in_strAccion: AccionErrorTecnicoProrroga): Promise<void> {
    const dicPayload: Record<string, unknown> = {
      ...this.form.getRawValue(),
      [QD.strAction]: in_strAccion,
    };

    try {
      await this.objTareas.completarTarea(dicPayload);
    } catch (excError) {
      console.error('[RevisionErrorTecnicoProrroga] Error al enviar:', excError);
    }
  }
}
