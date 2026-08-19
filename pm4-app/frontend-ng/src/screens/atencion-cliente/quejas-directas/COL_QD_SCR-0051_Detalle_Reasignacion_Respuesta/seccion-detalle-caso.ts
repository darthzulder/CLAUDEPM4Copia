import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input,
  runInInjectionContext, type Signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { FormSectionComponent } from '../../../../components/form-section';
import { RequestFileListComponent } from '../../../../components/request-file-list';
import { CatalogosService } from '../../../../core/catalogos.service';
import { codeFromUiValue, descOf } from '../../../../core/collection-helpers';
import type { CollectionOption } from '../../../../core/collection.types';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { QD, QD_COLLECTIONS, SCR000_ADJUNTO_KEYS } from '../fields/fields';
import { leerColumnaMatriz, MatrizMotivosService, normalizarMatriz } from '../fields/matriz-motivos.service';

/**
 * S1 · "Datos del Consumidor" (SEC-047), S2 · "Clasificación Regulatoria (precargada M1)" (SEC-048)
 * y S3 · "Descripción de la Queja" (SEC-049).
 *
 * Porte de `SeccionDetalleCaso.tsx`. Recibe el `FormGroup` de la pantalla y escribe sobre sus
 * controles, no sobre una copia.
 *
 * ── El picker del producto necesita un control SATÉLITE, porque la fachada no tiene el triplete ──
 * React resolvía el problema de los códigos duplicados de la colección 16 (el 104 es a la vez "Garantía
 * extendida" y "Copropiedades") con tres props de `ZdsSelect`: `toPickerValue` / `fromPickerValue` /
 * `onPickerChange`. **Ese triplete no existe en Angular** — `zds-select` es un CVA puro y su único canal
 * es el `FormControl`. Así que el patrón, tomado de `SCR-003/seccion-campos-payload.ts`, es:
 *
 * 1. el select se ata a un control **satélite** (`ui-qd_strSfcProduct`) que guarda `código::etiqueta`;
 * 2. su `valueChanges` traduce al control real, que sigue guardando el **código puro** (contrato PM4);
 * 3. y llama a `syncProductDesc()` con el value de UI, que es la única fuente correcta de la etiqueta.
 *
 * SCR-0051 es el **segundo** consumidor de este patrón. Se deja como está y no se agrega el triplete a
 * la fachada: `zds-select` es el archivo más compartido del proyecto y cambiarlo a mitad de la
 * migración movería el riesgo al peor lugar posible. Queda anotado para después de la Fase 5.
 *
 * ── Las limpiezas NO son las de SCR-000, y la diferencia es deliberada ──────────────────────────
 * El form de esta pantalla llega **precargado** desde M1, así que no se puede limpiar a ciegas cuando
 * cambia un eslabón de la cascada: al montar, un valor que no está en las opciones todavía es
 * simplemente un catálogo que no cargó, no un dato inválido. Por eso cada limpieza exige que la lista
 * de opciones **ya tenga contenido**, y la de la placa exige además que el catálogo de productos haya
 * llegado (mientras no llega, `blnIsAutos` es `false` por defecto y borraría la placa precargada).
 *
 * `MatrizMotivosService` deja esta política a la pantalla a propósito — ver su docstring.
 *
 * ── Los regulatorios se re-derivan, pero el SLA y el rol responsable NO ─────────────────────────
 * Al re-elegir el motivo se reescriben escalamiento, resarcimiento y relación con fraude desde la fila
 * de la matriz. `qd_strSlaAssigned` y el rol responsable **conservan** lo que asignó M1: es decisión de
 * negocio (recalcular el SLA movería el vencimiento del caso a mitad del trámite), portada de React.
 */
@Component({
  selector: 'app-seccion-detalle-caso',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormSectionComponent, ZdsInput, ZdsSelect, ZdsTextarea, RequestFileListComponent,
  ],
  // Los dos por sección: `CatalogosService` cachea los catálogos de **estas** filas (canal y admisión),
  // y `MatrizMotivosService` trae los suyos con claves `matriz:*`. Ver sus docstrings.
  providers: [CatalogosService, MatrizMotivosService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-detalle-caso.html',
})
export class SeccionDetalleCaso {
  /** El `FormGroup` de la pantalla. */
  readonly form = input.required<FormGroup>();

  /**
   * Valores del form, reactivos, tal como los mantiene la pantalla desde `valueChanges`.
   *
   * ⚠ No se lee `form.value` directo: no es un signal, así que leerlo en un `computed()` no crea
   * dependencia y toda la cascada quedaría congelada en su primer valor.
   */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** Nombre y identificación del consumidor, ya derivados por la pantalla. */
  readonly nombre = input('');
  readonly identificacion = input('');

  /** `process_request_id` del caso, para listar los adjuntos que subió el radicador en SCR-000. */
  readonly requestId = input<number | null>(null);

  protected readonly objMatriz = inject(MatrizMotivosService);
  private readonly objCatalogos = inject(CatalogosService);
  private readonly objInjector = inject(Injector);

  /** Las claves de adjunto de SCR-000 que `RequestFileList` filtra para S3. */
  protected readonly cllClavesAdjunto = SCR000_ADJUNTO_KEYS;

  /**
   * Control satélite del picker de producto. Guarda `código::etiqueta`; el control real guarda el
   * código. Ver el bloque del picker en la cabecera de la clase.
   *
   * Vive en su propio `FormGroup` y no en el de la pantalla porque **no es un campo del caso**: no
   * viaja a PM4, y meterlo en el form del padre lo pondría en el payload.
   */
  protected readonly objGrupoUi = new FormGroup<Record<string, FormControl<unknown>>>({
    [`ui-${QD.strSfcProduct}`]: new FormControl<unknown>(''),
  });

  protected readonly strNombreUiProducto = `ui-${QD.strSfcProduct}`;

  constructor() {
    // El cableado necesita el `form`, que no tiene valor en el constructor porque llega por `input()`.
    //
    // ⚠ El cuerpo de un `effect()` no es contexto de inyección: `sincronizarDesc()` y
    // `MatrizMotivosService.vincular()` hacen `inject(DestroyRef)` y tirarían NG0203 en runtime
    // (invisible al compilar). De ahí el `runInInjectionContext` con el `Injector` capturado acá.
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });

    // El value de UI del picker sigue al código guardado, para que la precarga se vea preseleccionada.
    // Va con `emitEvent: false` para no reentrar en el `valueChanges` que traduce en sentido contrario.
    effect(() => {
      const strUi = this.objMatriz.strInsuranceUiValue();
      const objUi = this.objGrupoUi.get(this.strNombreUiProducto);
      if (objUi && String(objUi.value ?? '') !== strUi) objUi.setValue(strUi, { emitEvent: false });
    });

    // Las limpiezas y la re-derivación, cada una en su efecto. Ver la cabecera.
    effect(() => this.limpiarMomento());
    effect(() => this.limpiarServicio());
    effect(() => this.limpiarMotivo());
    effect(() => this.limpiarPlaca());
    effect(() => this.rederivarRegulatorios());
    effect(() => this.sincronizarHabilitacion());
  }

  /** Guarda del efecto de vinculación: `vincular()` es idempotente pero cargar catálogos no. */
  private blnVinculado = false;

  /**
   * Ata el form del padre: arranca la cascada, los dos catálogos de display y el picker.
   *
   * ⚠ Tiene que correr dentro de un contexto de inyección — ver el comentario del constructor.
   */
  private vincular(in_objForm: FormGroup): void {
    // Primero la cascada: su `vincular()` arranca los tres catálogos `matriz:*` y sincroniza el `_desc`
    // del motivo, que ninguna otra pieza puede resolver.
    this.objMatriz.vincular(in_objForm, this.sigValores());

    // Canal y admisión: solo se usan para el display de solo lectura, pero su `_desc` sí viaja.
    // Tercer argumento como **función**: pasar el array capturaría el `[]` del primer instante.
    for (const strClave of ['channel', 'admission'] as const) {
      const strCampo = strClave === 'channel' ? QD.strChannel : QD.strAdmission;
      sincronizarDesc(in_objForm, strCampo, () => this.cllOpcionesDe(strClave));
      void this.objCatalogos.cargar(strClave, QD_COLLECTIONS[strClave], in_objForm.getRawValue());
    }

    // El picker: el satélite guarda `código::etiqueta` y acá se traduce al control real.
    this.objGrupoUi.get(this.strNombreUiProducto)?.valueChanges.subscribe((in_genUi: unknown) => {
      const strUi = String(in_genUi ?? '');
      // El `_desc` **antes** del código, por lo mismo que en SCR-000: `syncProductDesc()` escribe con
      // `emitEvent: false`, así que la única emisión de este handler es la del código y es la que
      // refresca el espejo `sigValores`. Al revés, el espejo queda un paso atrás y el expediente
      // completo —que se alimenta de `sigValores()`— pintaría el producto anterior al cambio.
      this.objMatriz.syncProductDesc(strUi);
      in_objForm.get(QD.strSfcProduct)?.setValue(codeFromUiValue(strUi));
    });
  }

  // ── Catálogos de display ──────────────────────────────────────────────────────────────────────

  /**
   * Se llama desde la plantilla, así que **no puede disparar red**: `CatalogosService.de()` separa
   * obtener de cargar justo para esto.
   */
  private cllOpcionesDe(in_strClave: string): readonly CollectionOption[] {
    return this.objCatalogos.de(in_strClave).options();
  }

  protected readonly strDescCanal = computed(
    () => descOf(this.cllOpcionesDe('channel'), this.leer(QD.strChannel)),
  );

  protected readonly strDescAdmision = computed(
    () => descOf(this.cllOpcionesDe('admission'), this.leer(QD.strAdmission)),
  );

  /**
   * "Asunto de la Queja" = la etiqueta del motivo elegido.
   *
   * Los dos fallbacks no son adorno: mientras la matriz no cargó, `cllReason()` está vacío y sin el
   * `_desc` que viaja en `task.data` la pantalla mostraría el **código** crudo por un instante — el
   * "flash" que React documenta. Y si tampoco hay `_desc`, el código es mejor que nada.
   */
  protected readonly strDescMotivo = computed(() => {
    const strCodigo = this.leer(QD.strSfcReason);
    const strEtiqueta = this.objMatriz.cllReason().find(
      (in_objOpcion) => in_objOpcion.value === strCodigo,
    )?.label;
    return strEtiqueta || this.leer(`${QD.strSfcReason}_desc`) || strCodigo || '—';
  });

  // ── Gates de visibilidad y habilitación de la cascada ─────────────────────────────────────────

  /**
   * El servicio solo aplica dentro de "Asistencias" (Anexo02 #31).
   *
   * ⚠ El flag mira el **momento**, no el producto: `MatrizMotivosService` lo calcula como
   * `/asistencias/i.test(qd_strInteraction)`. O sea que depende del texto que guardó el momento, no de
   * ningún código — coherente con que `cllInteraction` traiga `value === label`.
   */
  protected readonly blnEsAsistencias = this.objMatriz.blnIsAsistencias;

  /** La placa solo aplica cuando el producto es de la familia Autos (Anexo02 #25). */
  protected readonly blnEsAutos = this.objMatriz.blnIsAutos;

  /**
   * ── Los tres `disabled` de React van por `control.disable()`, porque `zds-select` NO tiene `disabled` ──
   *
   * React encadena la cascada con el atributo del grupo (`<ZdsSelect … disabled={!producto} />`).
   * `zds-select` **no expone ningún `disabled`** —ni él ni `CampoBase`—, así que el único camino es el
   * estado del `FormControl`, que el CVA baja al web component por `setDisabledState` (más la clase
   * `.zds-select-wrap--deshabilitado` que replica el gris).
   *
   * El costo conocido: **un control deshabilitado desaparece de `form.value`**. Acá es inofensivo y a
   * propósito — la pantalla arma el payload con `getRawValue()` y alimenta `sigValores` con
   * `getRawValue()` también, así que ni el envío ni la cascada ven el hueco. Si algún día alguien
   * cambiara cualquiera de los dos a `.value`, el momento y el motivo saldrían vacíos hacia PM4.
   */
  protected readonly blnMomentoHabilitado = computed(() => !!this.leer(QD.strSfcProduct));

  /** El motivo necesita momento y —dentro de Asistencias— servicio. */
  protected readonly blnMotivoHabilitado = computed(
    () => !!this.leer(QD.strInteraction) && (!this.blnEsAsistencias() || !!this.leer(QD.strServiceProvided)),
  );

  /** El servicio solo existe dentro de "Asistencias"; fuera de ahí ni se pinta. */
  protected readonly blnServicioHabilitado = computed(() => this.blnEsAsistencias());

  /**
   * Baja los tres gates de arriba al estado de los controles.
   *
   * `emitEvent: false`: esto corre en un efecto que depende de `sigValores`, y ese signal se alimenta
   * de `valueChanges` — emitir reentraría en el mismo efecto. Mismo patrón que
   * `SCR-003/seccion-campos-payload.ts`.
   */
  private sincronizarHabilitacion(): void {
    const objForm = this.form();
    const cllGates: readonly (readonly [string, boolean])[] = [
      [QD.strInteraction, this.blnMomentoHabilitado()],
      [QD.strServiceProvided, this.blnServicioHabilitado()],
      [QD.strSfcReason, this.blnMotivoHabilitado()],
    ];
    for (const [strCampo, blnOn] of cllGates) {
      const objControl = objForm.get(strCampo);
      if (!objControl || blnOn === objControl.enabled) continue;
      if (blnOn) objControl.enable({ emitEvent: false });
      else objControl.disable({ emitEvent: false });
    }
  }

  protected readonly strPlaceholderMomento = computed(
    () => (this.leer(QD.strSfcProduct) ? 'Seleccione el momento...' : 'Seleccione primero el seguro'),
  );

  protected readonly strPlaceholderMotivo = computed(
    () => (this.leer(QD.strInteraction) ? 'Seleccione el motivo...' : 'Complete primero el momento'),
  );

  // ── Limpiezas ─────────────────────────────────────────────────────────────────────────────────

  /**
   * Limpia un campo cuyo valor cayó fuera de sus opciones.
   *
   * La guarda de `length === 0` es la diferencia con SCR-000 y no es defensiva: con el form precargado,
   * "el valor no está en las opciones" y "las opciones todavía no llegaron" son indistinguibles, y
   * limpiar en el segundo caso borraría la clasificación que asignó M1.
   *
   * Compara contra `value`, que en momento y servicio **es el texto mismo** (la matriz guarda prosa en
   * esas dos columnas, no códigos) y solo en el motivo es un código real. Funciona en los tres porque
   * el form guarda exactamente lo que trae el `value` de la opción.
   */
  private limpiarSiFuera(in_strCampo: string, in_cllOpciones: readonly CollectionOption[]): void {
    if (in_cllOpciones.length === 0) return;
    const strValor = this.leer(in_strCampo);
    if (!strValor || in_cllOpciones.some((in_objO) => in_objO.value === strValor)) return;
    this.form().get(in_strCampo)?.setValue('');
  }

  private limpiarMomento(): void {
    this.limpiarSiFuera(QD.strInteraction, this.objMatriz.cllInteraction());
  }

  /**
   * Fuera de "Asistencias" el servicio **no aplica**, así que se vacía sin mirar opciones:
   * `limpiarSiFuera()` no alcanza porque con `cllService() === []` corta antes de limpiar, y el valor
   * viejo de un momento anterior se quedaría estrechando la cascada del motivo hasta dejarla en `[]`.
   */
  private limpiarServicio(): void {
    if (!this.leer(QD.strServiceProvided)) return;
    if (!this.blnEsAsistencias()) {
      this.form().get(QD.strServiceProvided)?.setValue('');
      return;
    }
    this.limpiarSiFuera(QD.strServiceProvided, this.objMatriz.cllService());
  }

  private limpiarMotivo(): void {
    this.limpiarSiFuera(QD.strSfcReason, this.objMatriz.cllReason());
  }

  /**
   * La placa no sobrevive fuera de Autos. El gate en `cllInsurance()` cargado es imprescindible:
   * mientras el catálogo no llega, `blnIsAutos` es `false` por defecto y esto borraría la placa
   * precargada de un caso de Autos.
   */
  private limpiarPlaca(): void {
    if (this.objMatriz.cllInsurance().length === 0) return;
    if (!this.blnEsAutos() && this.leer(QD.strPlate)) this.form().get(QD.strPlate)?.setValue('');
  }

  /**
   * **RUL-0051-05** · re-deriva los regulatorios desde la fila de la matriz cuando cambia el motivo.
   *
   * Solo escribe si hay una fila válida: a diferencia de SCR-000 (form vacío), acá vaciar los valores
   * heredados de M1 mientras la matriz todavía no cargó dejaría el caso sin escalamiento ni
   * resarcimiento, que son campos que la Superintendencia lee.
   *
   * `emitEvent: false` porque esto corre en un efecto que depende de `sigValores`, y ese signal se
   * alimenta de `valueChanges` — emitir reentraría en el mismo efecto. El espejo se actualiza a mano.
   */
  private rederivarRegulatorios(): void {
    const objFila = this.objMatriz.objSelectedReasonRow();
    if (!objFila) return;

    const objForm = this.form();
    const dicNuevos: Record<string, string> = {
      [QD.strOmbudsmanEscalation]: leerColumnaMatriz(objFila, 'escalamientoAdministrador'),
      [QD.strCompensation]: leerColumnaMatriz(objFila, 'resarcimientoAdministrador'),
      [QD.strFraudRelated]:
        normalizarMatriz(leerColumnaMatriz(objFila, 'relacionFraude')) === 'si' ? 'SI' : 'NO',
    };

    for (const [strCampo, strValor] of Object.entries(dicNuevos)) {
      const objControl = objForm.get(strCampo);
      if (objControl && String(objControl.value ?? '') !== strValor) {
        objControl.setValue(strValor, { emitEvent: false });
      }
    }
  }

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }

  protected readonly QD = QD;
}
