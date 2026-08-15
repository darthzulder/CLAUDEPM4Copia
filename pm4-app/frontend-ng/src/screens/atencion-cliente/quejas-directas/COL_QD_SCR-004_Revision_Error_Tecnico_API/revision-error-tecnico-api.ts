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
  SCR004_DEFAULTS as DEFAULTS,
  type AccionErrorTecnico,
} from '../fields/fields';

/** Longitud máxima de causa raíz y corrección aplicada (§10.4 del DOCUMENTACION: suposición, no insumo). */
const INT_MAX_TEXTO = 2000;

/** El valor de `qd_strPayloadAdjustNeeded` que habilita la edición del payload (FLD-058). */
const STR_AJUSTE_SI = 'SI';

/**
 * SCR-004 · Revisión Error Técnico API — el Analista Técnico revisa el log del error con que falló la
 * integración con SmartSupervision, registra la corrección y **autoriza el reenvío**.
 *
 * Port de `frontend/src/screens/.../COL_QD_SCR-004_Revision_Error_Tecnico_API/RevisionErrorTecnicoApi.tsx`.
 * La trazabilidad FLD/RUL/MSG/ACT contra el Anexo02 vive en
 * [DOCUMENTACION_COL_QD_SCR-004_Revision_Error_Tecnico_API.md](./DOCUMENTACION_COL_QD_SCR-004_Revision_Error_Tecnico_API.md),
 * al lado de este archivo.
 *
 * ── Los dos límites de negocio que gobiernan la pantalla ────────────────────────────────────────
 * - **RUL-004-01 (🔴 bloquea):** sin causa raíz **y** corrección aplicada no se puede autorizar el
 *   reenvío (el BPM no debe reejecutar SP1-T02 sin diagnóstico registrado). Vive en
 *   [`blnPuedeAutorizar`](#blnPuedeAutorizar).
 * - **El payload editado tiene que ser un objeto JSON válido**, que no es una regla del anexo sino del
 *   script de Momento 3: si el JSON no parsea —o parsea a un array o a un escalar— el script lo
 *   **descarta** y reconstruye el body desde los campos del caso. Sin este bloqueo el analista
 *   editaría el payload, autorizaría, y su corrección se perdería **en silencio**. Vive en
 *   [`blnPayloadJsonOk`](#blnPayloadJsonOk) y está documentado en §5 y §10.3 del DOCUMENTACION.
 *
 * ── Una sola acción de cierre, y eso es deliberado ─────────────────────────────────────────────
 * `qd_strAction` solo puede valer `'AUTORIZAR_REENVIO'` — el tipo `AccionErrorTecnico` lo fija en un
 * único literal. ACT-004-02 ("Escalar a Proveedor") **se retiró** por decisión del negocio
 * (§10.10 del DOCUMENTACION, 30-jul-2026), así que no hay una segunda rama que portar. Ojo al
 * comparar con SCR-011, que es la pantalla gemela y **sí** conserva su botón de escalar con su propio
 * tipo `AccionErrorTecnicoProrroga`: copiar de acá para allá perdería esa salida.
 *
 * ── Por qué NO hay `CollectionService` en `providers` ──────────────────────────────────────────
 * A diferencia de SCR-008, esta pantalla no consume ninguna colección: §4 del Anexo02 registra que
 * SCR-004 no referencia catálogos `CAT-*`. Los tres campos con valores cerrados (`Sí`/`No` del radio)
 * salen de la constante `OPTIONS_SI_NO` compartida. Un provider de más acá sería una dependencia
 * muerta que igual dispararía su GET al montar.
 */
@Component({
  selector: 'app-revision-error-tecnico-api',
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
    ZrLoader,
    ZrModal,
    ZrTemplate,
  ],
  templateUrl: './revision-error-tecnico-api.html',
})
export class RevisionErrorTecnicoApi implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);

  /** Estado de la tarea, tal como lo exponía `useTask()` en React. */
  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  readonly cllOpcionesSiNo = OPTIONS_SI_NO;

  /**
   * El formulario, tipado sobre `SCR004_DEFAULTS`.
   *
   * ── Los `maxLength` de React viven en DOS lugares, y hacen falta los dos ───────────────────
   * En React eran `<ZdsTextarea maxLength={2000} />`, un solo atributo que hacía las dos cosas. Acá
   * se separan porque son dos contratos distintos:
   *
   *  1. **El límite efectivo** son los `Validators.maxLength(INT_MAX_TEXTO)` de abajo, y son lo único
   *     que de verdad invalida. Viven en el control porque `lib-textarea-z` **no registra control en
   *     el group** (su `ngOnInit` nunca llama `generateControl()`), así que no compone ningún
   *     validador propio: lo que se le pase al componente es puramente visual.
   *  2. **El contador visual** (`9/2000`) es el `[maxLength]="2000"` de los dos `zds-textarea` de la
   *     plantilla.
   *
   * ⚠ **Este comentario decía antes que el input de la fachada nunca llegaba al `za-textarea` y que
   * pasarlo no limitaría nada.** Era cierto cuando se escribió —el `[attr.max-length]` de
   * `lib-textarea-z` muere antes del `z-textarea`— y dejó de serlo cuando `zds-textarea` lo neutralizó
   * reponiendo el atributo con un `afterRenderEffect`. Acá la plantilla **sí** pasa los dos
   * `[maxLength]` y los contadores se pintan; el texto viejo quedó contradiciendo al código de al
   * lado. En SCR-008 ese mismo párrafo costó los tres contadores de esa pantalla, porque se portó
   * creyéndole al comentario. Ver el bloque del `maxLength` en
   * [zds-textarea.ts](../../../../components/fields/zds-textarea.ts).
   *
   * ── `strRootCause`/`strCorrectionApplied` SÍ llevan `Validators.required`, y acá sí corresponde ──
   * Es la diferencia con `qd_strSacRemarks` de SCR-008, donde el `required` se aplica en el handler
   * porque la obligatoriedad es **condicional a la acción** (obligatorio al devolver, opcional al
   * aprobar). Acá la pantalla tiene **una sola** acción de cierre y RUL-004-01 exige los dos campos
   * para ella, así que el `required` es del campo y puede vivir en el control: no hay ninguna salida
   * que quede bloqueada por tenerlo. El error igual no se pinta hasta que se intenta enviar —eso lo
   * gobierna [`blnIntentoEnvio`](#blnIntentoEnvio)—, que es el `isSubmitted` de react-hook-form.
   *
   * `strPayloadAdjustNeeded` arranca en `'NO'` por `DEFAULTS`, así que su `required` está satisfecho
   * desde el montaje; se declara igual porque FLD-058 lo marca obligatorio y un `patchValue` con `''`
   * desde PM4 tiene que dejar el form inválido en vez de pasar.
   */
  readonly form = new FormGroup({
    [QD.strHttpCode]: new FormControl(''),
    [QD.strErrorType]: new FormControl(''),
    [QD.strAttemptNum]: new FormControl(''),
    [QD.strEndpointCalled]: new FormControl(''),
    [QD.strApiTechMessage]: new FormControl(''),
    [QD.strCompleteLogAPI]: new FormControl(''),
    [QD.strPayloadSent]: new FormControl(''),
    [QD.strRootCause]: new FormControl('', [
      Validators.required,
      Validators.maxLength(INT_MAX_TEXTO),
    ]),
    [QD.strCorrectionApplied]: new FormControl('', [
      Validators.required,
      Validators.maxLength(INT_MAX_TEXTO),
    ]),
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
   * `undefined` hasta el primer cambio del usuario. Mismo criterio que SCR-008.
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

  /** Visibilidad del modal de log (ACT-004-03). */
  readonly blnVerLog = signal(false);

  /**
   * Marca de que ya se intentó enviar, para el mismo `isSubmitted` de react-hook-form: los errores de
   * *requerido* no se pintan hasta que el analista intenta autorizar. Sin esto la pantalla abriría con
   * los dos campos de S2 en rojo, que es lo contrario de lo que RUL-004-01 quiere decir.
   */
  readonly blnIntentoEnvio = signal(false);

  /** Número de intento acumulado (FLD-055), para el sufijo de la alerta de S1. */
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
   * RUL-004-01 + el gate del payload — habilita "Autorizar Reenvío".
   *
   * El `trim()` no es cosmético: un textarea con solo espacios satisface el `Validators.required` de
   * Angular (que solo rechaza `''` y `null`) y dejaría autorizar sin diagnóstico. Es la misma razón
   * por la que React lo hacía, y por la que este computed no se puede reemplazar por `form.valid`.
   */
  readonly blnPuedeAutorizar = computed(
    () =>
      !!String(this.sigValores()[QD.strRootCause] ?? '').trim() &&
      !!String(this.sigValores()[QD.strCorrectionApplied] ?? '').trim() &&
      this.blnPayloadJsonOk(),
  );

  /** Mensaje de error de la causa raíz, o `''`. Se pinta recién tras el primer intento de envío. */
  readonly strErrorCausaRaiz = computed(() => this.mensajeDeError(QD.strRootCause));

  /** Mensaje de error de la corrección aplicada, o `''`. */
  readonly strErrorCorreccion = computed(() => this.mensajeDeError(QD.strCorrectionApplied));

  /**
   * Texto de ayuda del payload, que cambia de significado según FLD-058: con ajuste marcado explica
   * que **este** JSON es el que se reenvía; sin ajuste, que es el del intento fallido y es de lectura.
   */
  readonly strAyudaPayload = computed(() =>
    this.blnAjustaPayload()
      ? 'Ajuste el JSON del body de cierre: si difiere del que genera el BPM, se reenviará este.'
      : 'JSON del body de cierre del intento fallido — solo lectura.',
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
   * criterio que `precargar()` de SCR-008.
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
   * Acá vive en el **control**, por dos motivos que se descubrieron al portar:
   *
   * 1. Un `[readOnly]` bindeado a un computed haría que el wrapper reciba el input nuevo, pero el
   *    `readonly` del `za-textarea` es un atributo del custom element de Lit y bajo jsdom no se
   *    refleja — o sea que el spec no podría aseverar el bloqueo de ninguna forma honesta (trampa 2 de
   *    `testing-conventions.md`). `control.disabled` sí es estado de Angular y es verificable.
   * 2. Es lo que de verdad protege el dato. Un textarea `readonly` igual acepta un `setValue()`
   *    programático; un control `disabled` no entra en `form.value` ni se puede escribir desde la
   *    vista, así que el payload no puede mutar mientras el analista no marque el ajuste.
   *
   * ⚠ Y por eso el envío usa **`getRawValue()`**: `form.value` **omite los controles deshabilitados**,
   * así que con ajuste en `'NO'` el `qd_strPayloadSent` del intento fallido no viajaría en el payload
   * y PM4 lo recibiría como faltante. Es el modo de falla que hace que esta decisión tenga costo, y
   * está cubierto por un caso del spec.
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
   * Réplica del `err()` de React: el error de un campo, oculto hasta que se intentó enviar.
   *
   * El `required` se calla antes del primer intento (es el `isSubmitted`); el `maxLength` **también**,
   * y eso es una diferencia deliberada con SCR-008 —donde el `maxLength` se muestra siempre— porque
   * acá los dos campos arrancan vacíos y editables: el analista no puede pasarse de 2000 caracteres
   * sin haber tipeado, así que no hay caso en que ocultarlo esconda algo que ya ocurrió.
   */
  private mensajeDeError(in_strCampo: string): string {
    if (!this.blnIntentoEnvio()) return '';

    const objControl = this.form.get(in_strCampo);
    if (!objControl || objControl.valid) return '';
    if (objControl.hasError('maxlength')) return `Máximo ${INT_MAX_TEXTO} caracteres`;
    return 'Campo requerido';
  }

  /** ACT-004-03 — abre el modal con el log completo que emitió el script de Momento 3. */
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
   * ACT-004-01 — Autorizar Reenvío (RUL-004-01).
   *
   * ⚠ La guarda es **acá**, no solo en el `[disabled]` del botón. Un `disabled` de un componente del
   * DS no impide que el handler se invoque (trampa 1 de `testing-conventions.md`: un `z-button`
   * deshabilitado igual dispara su click), así que sin este corte se podría autorizar el reenvío sin
   * causa raíz ni corrección registradas — que es exactamente lo que RUL-004-01 prohíbe— o con un
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

    void this.enviar();
  }

  /**
   * Completa la tarea con la única acción de cierre de la pantalla.
   *
   * `getRawValue()` y no `value`: ver el ⚠ de `sincronizarEdicionPayload()` — con el ajuste en `'NO'`
   * el control del payload está deshabilitado y `form.value` lo omitiría, así que el JSON del intento
   * fallido no llegaría a PM4.
   *
   * El `catch` con `console.error` se porta tal cual: `TaskService` ya deja el mensaje en su signal
   * `error`, y lo que este log agrega es el objeto de excepción completo en la consola del iframe,
   * que es donde se diagnostica un 422 de PM4 sin devtools de red a mano.
   */
  private async enviar(): Promise<void> {
    const strAccion: AccionErrorTecnico = 'AUTORIZAR_REENVIO';
    const dicPayload: Record<string, unknown> = {
      ...this.form.getRawValue(),
      [QD.strAction]: strAccion,
    };

    try {
      await this.objTareas.completarTarea(dicPayload);
    } catch (excError) {
      console.error('[RevisionErrorTecnicoApi] Error al autorizar:', excError);
    }
  }
}
