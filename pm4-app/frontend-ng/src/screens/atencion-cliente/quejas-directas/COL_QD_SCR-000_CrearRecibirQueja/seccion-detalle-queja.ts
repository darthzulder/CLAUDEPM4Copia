import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, signal,
  runInInjectionContext, type Signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DocSupportUploaderComponent } from '../../../../components/doc-support-uploader';
import { ZdsCheckboxField } from '../../../../components/fields/zds-checkbox-field';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZrSwitch } from '../../../../components/fields/zds-reexports';
import { CatalogosService } from '../../../../core/catalogos.service';
import { codeFromUiValue } from '../../../../core/collection-helpers';
import type { CollectionOption } from '../../../../core/collection.types';
import { FileRegistryService } from '../../../../core/file-registry.service';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { leerColumnaMatriz, MatrizMotivosService } from '../fields/matriz-motivos.service';
import { QD, QD_COLLECTIONS, SCR000_ADJUNTO_KEYS } from '../fields/fields';
import { PqrSectionComponent } from './pqr-section';

/**
 * Código de "Admisión" que FLD-331 pide cuando el radicador **no** es el Defensor del Consumidor.
 * Se intenta primero por código y se cae a la etiqueta: ver `sembrarAdmision()`.
 */
const STR_COD_ADMISION = '9';

/** Código de `qd_strFilerRole` que identifica al Defensor del Consumidor Financiero. */
const STR_ROL_DEFENSOR = '4';

/**
 * S3 · "Detalle de la queja".
 *
 * Porte de `SeccionDetalleQueja.tsx`. Es la sección más grande de la pantalla y la que concentra la
 * clasificación regulatoria: producto SFC → momento → servicio → motivo SFC, y los cinco campos que
 * el motivo elegido **deriva** sin que nadie los escriba a mano.
 *
 * ── La cascada NO se reimplementa: la resuelve `MatrizMotivosService` ────────────────────────────
 * Los cuatro niveles, la desambiguación de la colección 16 y el `_desc` del motivo ya viven en ese
 * servicio, que SCR-003 estrenó. Acá se consume y **no** se re-deriva: la matriz compara TEXTO
 * normalizado de varias columnas a la vez, y una segunda copia de esa lógica es exactamente el tipo
 * de duplicación que se rompe en silencio cuando negocio agrega una fila con espacios sobrantes.
 *
 * Lo que sí es política de esta pantalla —y por eso vive acá y no en el servicio— es **qué hacer
 * cuando el valor elegido cae fuera de las opciones**. SCR-003 lo resuelve con `limpiarSiFuera()`
 * detrás de su checkbox "Editar"; SCR-000 no tiene ese gate: el ciudadano está llenando el formulario
 * por primera vez, así que un cambio de nivel superior **vacía** el inferior sin preguntar, que es lo
 * que hacen los tres `useEffect` de limpieza de React.
 *
 * ── ⚠ El bug del filtro de `productDetail` se PRESERVA (y es peor de lo documentado) ────────────
 * `cargar()` recibe la clave shim `qd_strProductFilter`, y el `dependsOn` de la colección dice
 * `qd_strLegacyInsurance`. Nunca coinciden — pero la consecuencia **no** es la que dice
 * `MAPEO_qd_old_new.md` #3 ("el filtro no se aplica y el catálogo llega completo").
 *
 * **Medido:** `CollectionService.cargar()` abre con un gate duro —`if (dependsOn &&
 * !valores[dependsOn]) { limpiar(); return; }` (`collection.service.ts:102-105`)— así que la clave
 * ausente no degrada el filtro, **cancela la petición**. El catálogo no llega ni completo ni filtrado:
 * no llega. Comprobado en jsdom (al montar se piden los ids `[16,18,45,21,22,30,32]` — el 40 no
 * aparece) y contra el backend real con el navegador.
 *
 * El corolario cae sobre FLD-324: `sembrarDetalleProducto()` no tiene de dónde tomar "la primera
 * opción", así que `qd_strProductDetail` viaja **siempre vacío** a PM4. Es lo que hace hoy React en
 * producción, así que se porta tal cual y se **reporta**: hacer coincidir los tokens cambiaría un dato
 * que el proceso viene recibiendo vacío desde siempre. No se arregla de contrabando.
 *
 * ── Los cinco campos derivados del motivo (`objSelectedReasonRow`) ──────────────────────────────
 * `rolResponsable` → `qd_strResponsableRole` · `escalamientoAdministrador` →
 * `qd_strOmbudsmanEscalation` · `resarcimientoAdministrador` → `qd_strCompensation` · `sla` →
 * `qd_strSlaAssigned` · `relacionFraude` → `qd_strFraudRelated`, normalizado a `'SI'`/`'NO'`.
 *
 * ⚠ Ninguno tiene widget: son variables de back que el BPM usa para enrutar el caso. `relacionFraude`
 * en particular **no está en la ficha 1.0** (está implementado en `SeccionDetalleQueja.tsx:154,169`) y
 * va reportado como `⚠ corregido en 2.0`. El único que se normaliza es ese: la columna trae texto
 * libre y el contrato de PM4 es el par `'SI'`/`'NO'`, así que cualquier cosa que no empiece por "s"
 * cae a `'NO'` — un `''` en un campo que el proceso compara contra `'SI'` bifurcaría por la rama
 * equivocada.
 *
 * ── Los cuatro catálogos planos y sus defaults por etiqueta ─────────────────────────────────────
 * `admission` (FLD-331) · `controlEntity` (FLD-332) · `tutela` (FLD-333) · `expressComplaint`
 * (FLD-334). Los cuatro son variables de back sin widget, igual que sexo/LGBTIQ+ en S2, y los cuatro
 * resuelven su default **contra la etiqueta del catálogo** con los regex exactos de React:
 *
 *  - Admisión: código `'9'` si existe, y si no `/no aplica/i`. Y **solo si el radicador no es el
 *    Defensor** (`qd_strFilerRole !== '4'`): cuando lo es, la admisión la decide él y sembrarla acá
 *    pisaría su respuesta.
 *  - Ente de control: `/otros/i`.
 *  - Tutela y queja exprés: `/^\d?\.?\s*no$/i` — el ancla y el prefijo opcional son obligatorios,
 *    porque las etiquetas reales vienen numeradas (`"1. No"`) y un `/no/i` suelto haría match con
 *    "No aplica".
 *
 * ── La placa aparece solo en Autos ──────────────────────────────────────────────────────────────
 * `blnIsAutos` del servicio (regex `/autos/i` sobre la etiqueta del producto). El patrón
 * `/^[A-Za-z]{3} ?[0-9]{3}$/` vive en el `FormGroup` de la pantalla, como el resto de los validadores;
 * acá solo está su mensaje.
 *
 * ── Los adjuntos van detrás de un switch de UI, que NO es un campo del form ─────────────────────
 * Ver `blnAdjuntos` y `alternarAdjuntos()`. El switch es estado local (React usaba `useState`), no
 * una variable de PM4: lo que viaja son las cinco claves `qd_strDoc*`.
 */
@Component({
  selector: 'app-seccion-detalle-queja',
  standalone: true,
  imports: [
    ReactiveFormsModule, PqrSectionComponent, ZdsInput, ZdsSelect, ZdsTextarea, ZdsCheckboxField,
    ZrSwitch, DocSupportUploaderComponent,
  ],
  providers: [CatalogosService, MatrizMotivosService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-detalle-queja.html',
})
export class SeccionDetalleQueja {
  /** El `FormGroup` de la pantalla. Esta sección escribe sobre sus controles, no sobre una copia. */
  readonly form = input.required<FormGroup>();

  /** Valores del form, reactivos, tal como los mantiene la pantalla desde `valueChanges`. */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** `true` cuando el ciudadano ya intentó enviar. Sin esta guarda la sección abre en rojo. */
  readonly blnIntentoEnvio = input(false);

  private readonly objCatalogos = inject(CatalogosService);
  private readonly objRegistro = inject(FileRegistryService);
  private readonly objInjector = inject(Injector);

  /** La cascada de la matriz. Pública para la plantilla: pinta cuatro de sus listas derivadas. */
  protected readonly objMatriz = inject(MatrizMotivosService);

  protected readonly QD = QD;
  protected readonly cllClavesAdjuntos = SCR000_ADJUNTO_KEYS;

  /**
   * Control satélite del picker de producto.
   *
   * No es un campo de PM4: guarda `código::etiqueta` para que el select del DS pueda distinguir los
   * dos productos que comparten el código 104. El control **real** (`qd_strSfcProduct`) sigue
   * guardando el código puro, y la traducción va en el `valueChanges` de abajo — mismo mecanismo que
   * SCR-003, que es donde se probó.
   */
  protected readonly objProductoUi = new FormControl<string>('', { nonNullable: true });

  constructor() {
    // `sincronizarDesc()` y `MatrizMotivosService.vincular()` hacen `inject(DestroyRef)`, y el cuerpo
    // de un `effect()` **no** es contexto de inyección: NG0203 en el primer render, invisible a `tsc`.
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });

    effect(() => this.aplicarCascadaMomento());
    effect(() => this.aplicarCascadaServicio());
    effect(() => this.aplicarCascadaMotivo());
    effect(() => this.derivarCamposDelMotivo());
    effect(() => this.recargarDetalleProducto());
    effect(() => this.sembrarDefaultsDeBack());
    effect(() => this.sembrarDetalleProducto());
    effect(() => this.preseleccionarProductoUi());
  }

  /** Guarda del efecto de vinculación: `vincular()` es idempotente pero cargar catálogos no. */
  private blnVinculado = false;

  private vincular(in_objForm: FormGroup): void {
    // Primero la matriz: su `vincular()` arranca los tres catálogos `matriz:*` y engancha el `_desc`
    // del motivo, que ninguna otra pieza puede resolver (su código sale de la cascada).
    this.objMatriz.vincular(in_objForm, this.sigValores());

    // Tercer argumento como **función** en todos: al correr esto ningún GET respondió, así que pasar
    // el array capturaría el `[]` del primer instante y el `_desc` nunca se escribiría.
    sincronizarDesc(in_objForm, QD.strProductDetail, () => this.cllDetalleProducto());
    sincronizarDesc(in_objForm, QD.strAdmission, () => this.cllAdmision());
    sincronizarDesc(in_objForm, QD.strControlEntity, () => this.cllEnteControl());
    sincronizarDesc(in_objForm, QD.strTutela, () => this.cllTutela());
    sincronizarDesc(in_objForm, QD.strExpressComplaint, () => this.cllQuejaExpres());

    // ⚠ Interacción y servicio quedan FUERA a propósito, igual que en React: sus values ya **son** el
    // texto (la columna de la matriz no guarda código), así que un `_desc` sería la misma cadena
    // duplicada. El motivo sí lo lleva, y lo pone el servicio.

    const dicValores = in_objForm.getRawValue() as Record<string, unknown>;
    void this.objCatalogos.cargar('admission', QD_COLLECTIONS.admission, dicValores);
    void this.objCatalogos.cargar('controlEntity', QD_COLLECTIONS.controlEntity, dicValores);
    void this.objCatalogos.cargar('tutela', QD_COLLECTIONS.tutela, dicValores);
    void this.objCatalogos.cargar('expressComplaint', QD_COLLECTIONS.expressComplaint, dicValores);
    // `productDetail` NO se carga acá: lo hace su propio efecto, que depende del producto.

    // El picker: el satélite guarda `código::etiqueta`, el control real el código puro.
    this.objProductoUi.valueChanges.subscribe((in_strUi: string) => {
      in_objForm.get(QD.strSfcProduct)?.setValue(codeFromUiValue(in_strUi));
      // El `_desc` del producto NO sale de `sincronizarDesc()`: la colección 16 repite códigos, así
      // que la única fuente correcta de la etiqueta es lo que el usuario clickeó. Ver el servicio.
      this.objMatriz.syncProductDesc(in_strUi);
    });

    // El switch arranca encendido si el caso ya traía algún adjunto: es la condición de React, y sin
    // ella un caso precargado mostraría el switch apagado con documentos que igual viajan.
    if (SCR000_ADJUNTO_KEYS.some((in_strClave) => this.leer(in_strClave))) {
      this.blnAdjuntos.set(true);
    }
  }

  // ── Catálogos planos ──────────────────────────────────────────────────────────────────────────

  protected readonly cllDetalleProducto = computed(
    () => this.objCatalogos.de('productDetail').options(),
  );
  private readonly cllAdmision = computed(() => this.objCatalogos.de('admission').options());
  private readonly cllEnteControl = computed(() => this.objCatalogos.de('controlEntity').options());
  private readonly cllTutela = computed(() => this.objCatalogos.de('tutela').options());
  private readonly cllQuejaExpres = computed(
    () => this.objCatalogos.de('expressComplaint').options(),
  );

  // ── El picker de producto ─────────────────────────────────────────────────────────────────────

  /**
   * Refleja en el satélite el value de UI que le corresponde al código ya guardado.
   *
   * Hace falta para la precarga: el form puede llegar con `qd_strSfcProduct` + su `_desc` desde
   * `task.data`, y sin esto el select saldría vacío aunque el dato esté. `emitEvent: false` evita
   * reentrar en el `valueChanges` de arriba, que volvería a escribir el mismo código.
   */
  private preseleccionarProductoUi(): void {
    const strUi = this.objMatriz.strInsuranceUiValue();
    if (strUi && strUi !== this.objProductoUi.value) {
      this.objProductoUi.setValue(strUi, { emitEvent: false });
    }
  }

  // ── Las tres limpiezas de la cascada ──────────────────────────────────────────────────────────

  /**
   * Un valor que quedó fuera de sus opciones se **vacía**.
   *
   * `in_cllOpciones.length === 0` corta antes de limpiar, y es la guarda que importa: al montar, un
   * valor precargado sin catálogo todavía no significa "dato inválido", significa "el GET no
   * respondió". Sin esa condición la precarga se borraría sola.
   */
  private limpiarSiFuera(in_strCampo: string, in_cllOpciones: readonly CollectionOption[]): void {
    if (in_cllOpciones.length === 0) return;
    const strValor = this.leer(in_strCampo);
    if (!strValor || in_cllOpciones.some((in_objO) => in_objO.value === strValor)) return;
    this.form().get(in_strCampo)?.setValue('');
  }

  private aplicarCascadaMomento(): void {
    this.limpiarSiFuera(QD.strInteraction, this.objMatriz.cllInteraction());
  }

  /**
   * Fuera de "Asistencias" el servicio prestado **no aplica**, así que se vacía sin mirar opciones.
   *
   * `limpiarSiFuera()` no alcanza acá: con `cllService() === []` corta antes de limpiar, y el valor
   * de un momento anterior se quedaría viajando dentro del filtro del motivo — que es el nivel
   * siguiente de la cascada, así que dejaría el motivo filtrado por un servicio que ya nadie ve.
   */
  private aplicarCascadaServicio(): void {
    if (!this.objMatriz.blnIsAsistencias()) {
      if (this.leer(QD.strServiceProvided)) this.form().get(QD.strServiceProvided)?.setValue('');
      return;
    }
    this.limpiarSiFuera(QD.strServiceProvided, this.objMatriz.cllService());
  }

  private aplicarCascadaMotivo(): void {
    this.limpiarSiFuera(QD.strSfcReason, this.objMatriz.cllReason());
  }

  // ── Los cinco campos que el motivo deriva ─────────────────────────────────────────────────────

  /**
   * Copia a los campos de back las cinco columnas de la fila del motivo elegido.
   *
   * Ninguno tiene widget: el BPM los usa para enrutar. Se escriben con el valor tal cual viene de la
   * matriz, **salvo `relacionFraude`**, que se normaliza al par `'SI'`/`'NO'` — ver `strSiNo()`.
   *
   * Sin fila (motivo vacío, o catálogo sin cargar) no se toca nada: dejarlos vacíos "por prolijidad"
   * borraría lo que la precarga ya trajera de otra pantalla.
   */
  private derivarCamposDelMotivo(): void {
    const objFila = this.objMatriz.objSelectedReasonRow();
    if (!objFila) return;

    this.escribirSiCambia(QD.strResponsableRole, leerColumnaMatriz(objFila, 'rolResponsable'));
    this.escribirSiCambia(
      QD.strOmbudsmanEscalation, leerColumnaMatriz(objFila, 'escalamientoAdministrador'),
    );
    this.escribirSiCambia(
      QD.strCompensation, leerColumnaMatriz(objFila, 'resarcimientoAdministrador'),
    );
    this.escribirSiCambia(QD.strSlaAssigned, leerColumnaMatriz(objFila, 'sla'));
    this.escribirSiCambia(
      QD.strFraudRelated, strSiNo(leerColumnaMatriz(objFila, 'relacionFraude')),
    );
  }

  // ── FLD-324 · el detalle del producto ─────────────────────────────────────────────────────────

  /**
   * Recarga el catálogo de detalle de producto cuando cambia el producto SFC.
   *
   * ⚠ **En la práctica no recarga nada: no llega a pedir.** La clave del filtro es
   * `qd_strProductFilter` y el `dependsOn` de la colección dice `qd_strLegacyInsurance`, y como nunca
   * coinciden el gate de `CollectionService.cargar()` (`collection.service.ts:102-105`) corta antes del
   * GET y limpia el estado. O sea que esta función deja el catálogo **vacío**, no completo. Es el bug
   * preservado de la cabecera de la clase — se porta idéntico a React, con su caso en el spec
   * (`contarGets(40) === 0`).
   */
  private recargarDetalleProducto(): void {
    void this.objCatalogos.cargar('productDetail', QD_COLLECTIONS.productDetail, {
      qd_strProductFilter: this.leer(QD.strSfcProduct),
    });
  }

  /**
   * **FLD-324** · el detalle de producto se siembra con la **primera** opción del catálogo.
   *
   * No es una elección del ciudadano —no tiene widget— sino un valor de back que el proceso espera
   * lleno. React hace exactamente `cllProductDetail[0]?.value`; se conserva, incluida la arbitrariedad
   * de "la primera": mientras el filtro siga roto (ver arriba) esa primera opción es la del catálogo
   * completo, no la del producto elegido. Las dos mitades del defecto van reportadas juntas.
   */
  private sembrarDetalleProducto(): void {
    const cllOpciones = this.cllDetalleProducto();
    if (cllOpciones.length === 0 || this.leer(QD.strProductDetail)) return;
    const strPrimera = cllOpciones[0]?.value ?? '';
    if (strPrimera) this.form().get(QD.strProductDetail)?.setValue(strPrimera);
  }

  // ── FLD-331/332/333/334 · los cuatro defaults de back ─────────────────────────────────────────

  private sembrarDefaultsDeBack(): void {
    this.sembrarAdmision();
    this.sembrarPorEtiqueta(QD.strControlEntity, this.cllEnteControl(), /otros/i);
    this.sembrarPorEtiqueta(QD.strTutela, this.cllTutela(), /^\d?\.?\s*no$/i);
    this.sembrarPorEtiqueta(QD.strExpressComplaint, this.cllQuejaExpres(), /^\d?\.?\s*no$/i);
  }

  /**
   * **FLD-331** · admisión, con dos particularidades que no comparte con los otros tres.
   *
   * 1. Se intenta primero por **código** (`'9'`) y solo si ese código no está en el catálogo se cae a
   *    la etiqueta `/no aplica/i`. Es el orden de React, y el orden importa: el código es el contrato
   *    con la Superintendencia, la etiqueta es el respaldo por si negocio lo renumera.
   * 2. **No se siembra si el radicador es el Defensor del Consumidor** (`qd_strFilerRole === '4'`):
   *    en ese caso la admisión la decide él, y escribirla acá pisaría su respuesta.
   */
  private sembrarAdmision(): void {
    if (this.leer(QD.strFilerRole) === STR_ROL_DEFENSOR) return;

    const cllOpciones = this.cllAdmision();
    if (cllOpciones.length === 0 || this.leer(QD.strAdmission)) return;

    const objPorCodigo = cllOpciones.find((in_objO) => in_objO.value === STR_COD_ADMISION);
    if (objPorCodigo) {
      this.form().get(QD.strAdmission)?.setValue(objPorCodigo.value);
      return;
    }
    this.sembrarPorEtiqueta(QD.strAdmission, cllOpciones, /no aplica/i);
  }

  private sembrarPorEtiqueta(
    in_strCampo: string,
    in_cllOpciones: readonly CollectionOption[],
    in_objRegex: RegExp,
  ): void {
    if (in_cllOpciones.length === 0 || this.leer(in_strCampo)) return;
    const objOpcion = in_cllOpciones.find((in_objO) => in_objRegex.test(in_objO.label));
    if (objOpcion) this.form().get(in_strCampo)?.setValue(objOpcion.value);
  }

  // ── Réplica y placa ───────────────────────────────────────────────────────────────────────────

  /** **FLD-326** · el argumento de la réplica solo existe si el ciudadano marcó que sí replica. */
  protected readonly blnReplica = computed(() => this.leer(QD.strReply) === 'SI');

  /** La placa se pide solo en la familia Autos. El regex vive en el servicio de la matriz. */
  protected readonly blnEsAutos = computed(() => this.objMatriz.blnIsAutos());

  // ── El switch de adjuntos ─────────────────────────────────────────────────────────────────────

  /**
   * ¿Se muestran los campos de adjuntos? Es estado **de UI**, no un campo de PM4.
   *
   * React lo tenía en un `useState` y acá es un `signal` por la misma razón: lo que viaja al proceso
   * son las cinco claves `qd_strDoc*`, no la decisión de mostrarlas. Arranca encendido si el caso ya
   * traía algún adjunto (ver `vincular()`).
   */
  protected readonly blnAdjuntos = signal(false);

  /**
   * Apagar el switch **borra** los cinco adjuntos, en los dos lugares donde viven.
   *
   * Es la parte no obvia: el nombre del archivo está en el `FormControl` y el binario en
   * `FileRegistryService`. Limpiar solo el control dejaría los binarios en el registro, y el submit
   * los subiría igual — el caso terminaría con adjuntos que el ciudadano decidió quitar, sin ninguna
   * traza en pantalla de que siguen ahí. Es la condición de React, y va con caso de test.
   */
  protected alternarAdjuntos(in_blnOn: boolean): void {
    this.blnAdjuntos.set(in_blnOn);
    if (in_blnOn) return;

    const objForm = this.form();
    for (const strClave of SCR000_ADJUNTO_KEYS) {
      objForm.get(strClave)?.setValue('');
      this.objRegistro.quitar(strClave);
    }
  }

  /** Lee el `checked` que emite `za-switch`: su `change` trae el booleano en `detail`. */
  protected alCambiarSwitch(in_objEvento: Event): void {
    const objCustom = in_objEvento as CustomEvent<boolean>;
    this.alternarAdjuntos(!!objCustom.detail);
  }

  // ── Mensajes de error ─────────────────────────────────────────────────────────────────────────

  /**
   * Mensajes de `pattern`/longitud por campo, **exactos** de las `rules` de React.
   *
   * El validador ejecutable vive con el control, en el `FormGroup` de la pantalla; acá está solo el
   * texto. Los de `strComplaintText` son dos reglas distintas sobre el mismo campo (mínimo 50 y
   * máximo 2000), así que se resuelven en `mensajeDeError()` por el tipo de error y no por este mapa.
   */
  private static readonly DIC_MSG_PATRON: Readonly<Record<string, string>> = {
    [QD.strPlate]: 'Formato esperado: ABC123',
  };

  protected mensajeDeError(in_strCampo: string): string {
    if (!this.blnIntentoEnvio()) return '';
    // ⚠ `form.get().valid` no es un signal: sin tocar el de valores el mensaje quedaría pegado en
    // pantalla después de corregir el campo. Misma trampa que en S2.
    void this.sigValores()();

    const objControl = this.form().get(in_strCampo);
    if (!objControl || objControl.valid) return '';

    if (objControl.hasError('minlength')) return 'Describe la queja con al menos 50 caracteres';
    if (objControl.hasError('maxlength')) return 'Máximo 2000 caracteres';
    if (objControl.hasError('pattern')) {
      return SeccionDetalleQueja.DIC_MSG_PATRON[in_strCampo] ?? 'Formato inválido';
    }
    return 'Campo requerido';
  }

  // ── Utilidades ────────────────────────────────────────────────────────────────────────────────

  /** Escribe solo si el valor cambió, para no reentrar en el `valueChanges` que alimenta el signal. */
  private escribirSiCambia(in_strCampo: string, in_strValor: string): void {
    const objControl = this.form().get(in_strCampo);
    if (objControl && objControl.value !== in_strValor) objControl.setValue(in_strValor);
  }

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }
}

/**
 * Normaliza el texto libre de una columna de la matriz al par `'SI'`/`'NO'` que PM4 espera.
 *
 * La columna `relacionFraude` trae prosa ("Si", "SI", "sí", "No aplica"), y el proceso compara contra
 * `'SI'` exacto. Cualquier cosa que no empiece por "s" cae a `'NO'`: es más seguro que dejar pasar el
 * valor crudo, porque un `''` en ese campo bifurcaría por la rama de "no es fraude" de todas formas,
 * pero sin dejar constancia de que la matriz sí tenía una respuesta.
 */
function strSiNo(in_strValor: string): string {
  return /^s/i.test(in_strValor.trim()) ? 'SI' : 'NO';
}
