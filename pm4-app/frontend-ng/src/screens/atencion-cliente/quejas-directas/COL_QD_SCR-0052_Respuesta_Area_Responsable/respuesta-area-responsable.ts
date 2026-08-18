import { Component, computed, inject, signal, type OnDestroy, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { ZdsFileInput } from '../../../../components/fields/zds-file-input';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZrAlertInline, ZrButton, ZrLoader } from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { AttachmentsService, idsAdjuntosAPayload } from '../../../../core/attachments.service';
import { CatalogosService } from '../../../../core/catalogos.service';
import { descOf } from '../../../../core/collection-helpers';
import { FileRegistryService } from '../../../../core/file-registry.service';
import { mensajeDeError } from '../../../../core/http-error';
import { ParentRequestService } from '../../../../core/parent-request.service';
import { Pm4ContextService } from '../../../../core/pm4-context.service';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { TaskService } from '../../../../core/task.service';
import {
  type AccionRespuestaArea,
  QD,
  QD_COLLECTIONS,
  SCR0052_DEFAULTS,
  SCR0052_MAX_ADJUNTO_MB,
} from '../fields/fields';
import type { AsignacionHistorial, RespuestaAyuda } from '../fields/types';

/** Las cuatro colecciones que la pantalla muestra en modo display. Ver `cargarCatalogos()`. */
const CLL_CATALOGOS = ['channel', 'sfcProduct', 'sfcReason', 'admission'] as const;

/**
 * SCR-0052 · PAN-05.2 — **Respuesta del Área Responsable** (tarea **SP2-T02** del subproceso SP2,
 * Quejas Directas).
 *
 * Port de `frontend/src/screens/atencion-cliente/quejas-directas/.../RespuestaAreaResponsable.tsx`.
 *
 * El usuario del área a la que el Analista SAC pidió ayuda lee el caso completo en modo consulta
 * (S1…S4) y responde con un comentario y, si quiere, un adjunto (S5). Es la única pantalla del
 * proyecto que **corre dentro de un subproceso** y por lo tanto la única que tiene que escribir en
 * variables que viven en el request **padre**.
 *
 * ── Lo que esta pantalla estrena en la migración ────────────────────────────────────────────────
 *
 * **1. `ParentRequestService`** — la relectura del request padre antes de guardar. Ver su docstring:
 * el subproceso arranca con un *snapshot* de las variables del padre, así que escribir el array del
 * snapshot **borraría** cualquier fila de ayuda que se hubiera agregado mientras el ayudante redactaba.
 * En React esto vivía inline dentro de `registrarRespuesta` y **no tenía ni un test**; acá es un
 * servicio con su spec.
 *
 * **2. Cuatro catálogos en una pantalla portada, vía `CatalogosService`.** Las pantallas anteriores
 * usaban uno solo y lo declaraban en `providers: [CollectionService]`. Eso no escala al segundo, porque
 * el array `providers` **resuelve por token**: repetirlo da una sola instancia. Ver el docstring de
 * `CatalogosService`.
 *
 * ── Los tres `_desc` que NO se resuelven por catálogo, y que son CAMPOS ─────────────────────────
 * `qd_strPersonType_desc`, `qd_strReceptionInstance_desc` y `qd_strControlEntity_desc` se leen
 * **directo de `task.data`** y se pintan tal cual, sin `descOf()`: esos tres códigos vienen resueltos
 * por SCR-000 (que sí carga sus catálogos) y esta pantalla no los edita, así que cargar tres colecciones
 * más solo para volver a resolver una etiqueta que ya viaja en el caso sería tres GET por nada.
 *
 * ⚠ Pero son **campos del form con su `name`**, no texto plano: React los monta como `<ZdsInput
 * readOnly>` (líneas 213/235/240 del `.tsx`), y por eso los tres figuran en el dataset congelado de
 * `paridad-react.spec.ts` como `ZdsInput`. Pintarlos como `info-bar-value` —que fue el primer intento
 * de este port— es un cambio de render de contrabando: se ven distinto y desaparecen del DOM como
 * campos. La migración porta la estructura, no la reinterpreta.
 *
 * Los otros cuatro (`channel`, `sfcProduct`, `sfcReason`, `admission`) sí van como texto plano, porque
 * es como los monta React: ahí no hay `_desc` en el caso y la etiqueta sale de `descDe()`.
 *
 * ── La fila de solicitud de ayuda se busca por índice 1-based ───────────────────────────────────
 * `qd_intHelpNumber` es el número de ayuda **1-based** que el BPM asignó a esta rama del subproceso, y
 * `qd_lstAssignHistory` es el array 0-based. De ahí el `- 1` de `objSolicitud()` y de
 * `registrarRespuesta()`. Con `qd_intHelpNumber` en 0 o ausente el índice queda en `-1`, y ese caso
 * está contemplado en las dos puntas: S4 no pinta la tarjeta y el guardado **empuja** la respuesta al
 * final en vez de escribir en `lst[-1]`, que crearía una propiedad `"-1"` en el array.
 *
 * ── El gate de RUL-0052-01 se deriva de `sigValores()`, NUNCA de `form.valid` ───────────────────
 * ⚠ `valid` es un *getter* de `AbstractControl`, no un signal: leerlo dentro de un `computed` no crea
 * dependencia reactiva y el computed queda con el valor del primer render (form vacío ⇒ inválido), o
 * sea el botón principal apagado para siempre. Está medido y documentado en SCR-012.
 *
 * ── El error de envío NO se traga ───────────────────────────────────────────────────────────────
 * `enviarCon()` devuelve un booleano y el `catch` deja el mensaje en `strErrorEnvio`. Importa porque
 * *Guardar Borrador* navega el frame superior a la bandeja de PM4 **solo si el guardado salió bien**:
 * navegar ante un fallo perdería el comentario del usuario sin decirle nada.
 */
@Component({
  selector: 'app-respuesta-area-responsable',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    ZdsInput,
    ZdsTextarea,
    ZdsFileInput,
    ZrAlertInline,
    ZrButton,
    ZrLoader,
  ],
  // Los dos por pantalla y no de root: `CatalogosService` cachea los catálogos de **esta** pantalla y
  // `FileRegistryService` guarda su binario hasta el submit. Ver sus docstrings.
  providers: [CatalogosService, FileRegistryService],
  templateUrl: './respuesta-area-responsable.html',
})
export class RespuestaAreaResponsable implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objAdjuntos = inject(AttachmentsService);
  private readonly objRegistro = inject(FileRegistryService);
  private readonly objCatalogos = inject(CatalogosService);
  private readonly objPadre = inject(ParentRequestService);
  private readonly objContexto = inject(Pm4ContextService);

  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  readonly intMaxAdjuntoMb = SCR0052_MAX_ADJUNTO_MB;

  /**
   * FLD-355 · las extensiones que acepta el adjunto de la respuesta. Es una lista **más ancha** que el
   * default de `ZdsFileInput` (que no incluye `xls`/`xlsx`): un área responsable adjunta liquidaciones
   * y cuadros de cálculo, y ese es el formato en el que los tiene. Se pasa explícita porque el default
   * del wrapper los rechazaría en silencio.
   */
  readonly cllExtensiones = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];

  /**
   * El mensaje de extensión/tamaño rechazado, con el tope en MB interpolado. Se arma acá y no en la
   * plantilla porque es el mismo template string de React (`Solo se permiten archivos PDF, DOCX,
   * XLSX, JPG o PNG, máx ${MAX_ADJUNTO_MB} MB`) y el número tiene que salir de la constante, no de un
   * literal que se despegue de `SCR0052_MAX_ADJUNTO_MB` la primera vez que alguien lo cambie.
   */
  readonly strMensajeExtension = `Solo se permiten archivos PDF, DOCX, XLSX, JPG o PNG, máx ${SCR0052_MAX_ADJUNTO_MB} MB`;

  /** Mensaje del fallo del último envío. Lo pinta la alerta sobre la barra de acciones. */
  readonly strErrorEnvio = signal('');

  /** Mensaje del último archivo rechazado por el `ZdsFileInput` (extensión o tamaño). */
  readonly strErrorAdjunto = signal('');

  /** Se levanta al primer intento de enviar. Hasta entonces no se pinta el error de S5. */
  readonly blnIntentoEnvio = signal(false);

  readonly form = new FormGroup({
    // ── S1 · Datos del Consumidor (solo lectura) ──
    [QD.strFirstName]: new FormControl(''),
    [QD.strLastName]: new FormControl(''),
    [QD.strCompanyName]: new FormControl(''),
    [QD.strIdType]: new FormControl(''),
    [QD.strIdNumber]: new FormControl(''),
    [QD.strEmail]: new FormControl(''),
    [QD.strPersonType]: new FormControl(''),
    // ⚠ FLD-315 · el `_desc` es un **control**, no una variable derivada: React lo monta como campo
    // (`<ZdsInput name="qd_strPersonType_desc" readOnly>`). El nombre lleva el sufijo literal y no
    // `QD.algo`, porque `_desc` es la convención de compañera documentada en `MAPEO_qd_old_new.md` y
    // no hay entrada propia en `QD` para él.
    [`${QD.strPersonType}_desc`]: new FormControl(''),

    // ── S2 · Clasificación de la Queja (solo lectura, respaldada por catálogos) ──
    [QD.strChannel]: new FormControl(''),
    [QD.strSfcProduct]: new FormControl(''),
    [QD.strSfcReason]: new FormControl(''),
    [QD.strReceptionInstance]: new FormControl(''),
    [`${QD.strReceptionInstance}_desc`]: new FormControl(''),
    [QD.strAdmission]: new FormControl(''),
    [QD.strControlEntity]: new FormControl(''),
    [`${QD.strControlEntity}_desc`]: new FormControl(''),

    // ── S3 · Descripción de la Queja (solo lectura) ──
    [QD.strComplaintText]: new FormControl(''),

    // ── S4 · Solicitud de Ayuda (solo lectura; se pinta de la fila del historial) ──
    [QD.strAssigneeArea]: new FormControl(''),
    [QD.strAssigneeUser]: new FormControl(''),
    [QD.strAssignmentRemarks]: new FormControl(''),

    // ── S5 · Respuesta del Área (lo ÚNICO editable de la pantalla) ──
    // FLD-354 · RUL-0052-01. El `maxLength(2000)` es el límite efectivo; el contador visual va como
    // `[maxLength]` en la plantilla (los dos hacen falta, ver el bloque del maxLength en SCR-008).
    [QD.strAreaComment]: new FormControl('', [
      Validators.required,
      Validators.maxLength(2000),
    ]),
    // FLD-355 · guarda el NOMBRE del archivo; el binario vive en `FileRegistryService` hasta el submit.
    [QD.strAreaAttach]: new FormControl(''),

    // ── Contexto del subproceso (sin FLD) — de acá sale la fila del historial que se responde ──
    [QD.intHelpNumber]: new FormControl<number>(0),
    [QD.lstAssignHistory]: new FormControl<AsignacionHistorial[]>([]),
    [QD.lstHelpResponses]: new FormControl<RespuestaAyuda[]>([]),
  });

  /**
   * Espejo en signal del valor del form. Se siembra con `getRawValue()` y no con `{}` porque los
   * computeds se leen en el primer render, antes de que ningún `valueChanges` haya emitido.
   */
  private readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  constructor() {
    // ⚠ Va en el constructor y NO en `ngOnInit`: `sincronizarDesc()` hace `inject(DestroyRef)` para su
    // `takeUntilDestroyed()`, y `ngOnInit` no es contexto de inyección (NG0203 en runtime, invisible al
    // compilar). El tercer argumento va como **función** porque el catálogo todavía no cargó: pasar el
    // array capturaría el `[]` del primer instante y el `_desc` nunca se escribiría.
    for (const strClave of CLL_CATALOGOS) {
      sincronizarDesc(this.form, this.variableDe(strClave), () => this.cllOpcionesDe(strClave));
    }
  }

  async ngOnInit(): Promise<void> {
    await this.objTareas.cargar();
    this.precargar();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  // ── Consumo de los catálogos ──────────────────────────────────────────────────────────────────

  /** El campo `qd_*` que cada catálogo respalda. Único punto donde clave ↔ variable se emparejan. */
  private variableDe(in_strClave: (typeof CLL_CATALOGOS)[number]): string {
    if (in_strClave === 'channel') return QD.strChannel;
    if (in_strClave === 'sfcProduct') return QD.strSfcProduct;
    if (in_strClave === 'sfcReason') return QD.strSfcReason;
    return QD.strAdmission;
  }

  /**
   * Se llama desde la plantilla, así que **no puede disparar red**: `CatalogosService.de()` solo crea
   * o devuelve la instancia, y quien pide el GET es `cargarCatalogos()`.
   */
  private cllOpcionesDe(in_strClave: string) {
    return this.objCatalogos.de(in_strClave).options();
  }

  /** Los cuatro GET, una vez, después de precargar (así el `pmql` de cada def ve los valores reales). */
  private cargarCatalogos(): void {
    for (const strClave of CLL_CATALOGOS) {
      void this.objCatalogos.cargar(strClave, QD_COLLECTIONS[strClave], this.form.getRawValue());
    }
  }

  /** Etiqueta de un campo de catálogo para pintarla en modo display. Cae al código si no resolvió. */
  descDe(in_strClave: (typeof CLL_CATALOGOS)[number]): string {
    const strCodigo = String(this.sigValores()[this.variableDe(in_strClave)] ?? '');
    return descOf(this.cllOpcionesDe(in_strClave), strCodigo);
  }

  // ── Datos derivados del consumidor ────────────────────────────────────────────────────────────

  /**
   * El nombre a mostrar: la razón social si el consumidor es una empresa, si no nombre + apellido.
   * El `trim()` cubre el caso de persona natural con apellido vacío, que dejaría un espacio colgando.
   */
  readonly strNombre = computed(() => {
    const dicValores = this.sigValores();
    const strEmpresa = String(dicValores[QD.strCompanyName] ?? '').trim();
    if (strEmpresa) return strEmpresa;
    return `${String(dicValores[QD.strFirstName] ?? '')} ${String(dicValores[QD.strLastName] ?? '')}`.trim();
  });

  readonly strIdentificacion = computed(() => {
    const dicValores = this.sigValores();
    return `${String(dicValores[QD.strIdType] ?? '')} ${String(dicValores[QD.strIdNumber] ?? '')}`.trim();
  });

  // ── S4 · la fila del historial que esta rama del subproceso tiene que responder ────────────────

  /** Índice 0-based de la fila. `-1` cuando el caso no trae `qd_intHelpNumber`. Ver la cabecera. */
  private readonly intIndiceAyuda = computed(
    () => (Number(this.sigValores()[QD.intHelpNumber]) || 0) - 1,
  );

  private readonly cllHistorial = computed<AsignacionHistorial[]>(() => {
    const genLista = this.sigValores()[QD.lstAssignHistory];
    return Array.isArray(genLista) ? (genLista as AsignacionHistorial[]) : [];
  });

  /** La solicitud a la que se responde, o `undefined` si el caso no la trae (S4 no se pinta). */
  readonly objSolicitud = computed<AsignacionHistorial | undefined>(
    () => this.cllHistorial()[this.intIndiceAyuda()],
  );

  // ── S5 · el gate de RUL-0052-01 ───────────────────────────────────────────────────────────────

  /**
   * **RUL-0052-01 (🔴 BLOQUEA)** · sin comentario no se puede enviar la respuesta.
   *
   * Espeja el `Validators.required` declarado arriba —que sigue siendo la obligatoriedad ejecutable— y
   * agrega el `trim()`, porque `required` solo rechaza `''` y `null`: un textarea con espacios dejaría
   * enviar sin respuesta. Es el mismo `!!objWatch[...]?.trim()` de React.
   */
  readonly blnPuedeEnviar = computed(
    () => !!String(this.sigValores()[QD.strAreaComment] ?? '').trim(),
  );

  /**
   * Error del campo de S5. El `required` solo habla después del primer intento de enviar (un campo
   * obligatorio vacío al abrir la pantalla no es un error del usuario todavía); el `maxlength` habla
   * siempre, porque solo puede dispararse con algo tipeado.
   *
   * ⚠ Se lee de `sigValores()` para que el computed **se recalcule**: `hasError()` no es reactivo.
   */
  readonly strErrorComentario = computed(() => {
    this.sigValores();
    const objControl = this.form.get(QD.strAreaComment);
    if (!objControl) return '';
    if (objControl.hasError('required')) {
      return this.blnIntentoEnvio() ? 'Debe escribir un comentario antes de enviarlo.' : '';
    }
    if (objControl.hasError('maxlength')) return 'El comentario no puede exceder 2000 caracteres.';
    return '';
  });

  /** `process_request_id` del caso: lo necesita la subida del adjunto. */
  readonly intRequestId = computed(() => this.objTareas.tarea()?.process_request_id ?? null);

  // ── Precarga ──────────────────────────────────────────────────────────────────────────────────

  /**
   * Vuelca `task.data` al form filtrando por las claves que el form declara. El filtro no es defensivo:
   * `task.data` trae el caso entero (decenas de `qd_*` de otras pantallas), e iterar sobre
   * `this.form.controls` deja explícito que esta pantalla solo toca sus campos.
   *
   * Los tres `_desc` entran por acá como cualquier otro campo, porque son controles declarados: no hace
   * falta un canal aparte para ellos.
   */
  private precargar(): void {
    const objTarea = this.objTareas.tarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }
    this.form.patchValue({ ...SCR0052_DEFAULTS, ...dicParche });
  }

  // ── Adjunto de S5 ─────────────────────────────────────────────────────────────────────────────

  /**
   * El `ZdsFileInput` aceptó un archivo: el nombre va al control (contrato con PM4) y el binario al
   * registro, que lo retiene hasta el submit.
   *
   * ⚠ La API del wrapper de Angular **no es la de React**: allá se le pasaban `fileRegistry`,
   * `setValue`, `setError` y `clearErrors` como props y el componente escribía por su cuenta. Acá
   * expone dos salidas (`aceptado`/`rechazado`) y la pantalla decide, que es lo que permite tener el
   * registro en `providers` en vez de pasarlo por props hasta el fondo del árbol.
   */
  alAceptarAdjunto(in_objArchivo: File): void {
    this.strErrorAdjunto.set('');
    this.form.get(QD.strAreaAttach)?.setValue(in_objArchivo.name);
    this.objRegistro.registrar(QD.strAreaAttach, in_objArchivo);
  }

  /**
   * El wrapper rechazó el archivo (extensión, tamaño o duplicado). Además de pintar el motivo hay que
   * **limpiar** el nombre y el binario: si el usuario ya había elegido uno válido y el segundo se
   * rechaza, dejar el anterior mandaría a PM4 un nombre que no corresponde al archivo que el usuario
   * cree que subió.
   */
  alRechazarAdjunto(in_strMotivo: string): void {
    this.strErrorAdjunto.set(in_strMotivo);
    this.form.get(QD.strAreaAttach)?.setValue('');
    this.objRegistro.quitar(QD.strAreaAttach);
  }

  // ── Acciones ──────────────────────────────────────────────────────────────────────────────────

  /** ACT-0052-03 · volver sin guardar. Es navegación del navegador, no una salida BPM. */
  volver(): void {
    window.history.back();
  }

  /**
   * ACT-0052-01 · enviar el comentario al Analista SAC. Es la única acción que valida RUL-0052-01 y la
   * única que escribe en el historial del padre.
   */
  async enviar(): Promise<void> {
    this.blnIntentoEnvio.set(true);

    if (!this.blnPuedeEnviar() || this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError(this.form);
      return;
    }

    await this.enviarCon('ENVIAR');
  }

  /**
   * ACT-0052-02 · guardar el progreso sin responder, y **después** devolver el frame superior a la
   * bandeja de PM4 — solo si el guardado salió bien.
   *
   * ⚠ No pasa por `registrarRespuesta()`: un borrador no es una respuesta. Escribir la fila del
   * historial con `respondio: 'si'` al guardar dejaría al Analista SAC viendo una ayuda respondida con
   * un comentario a medio escribir, y el BPM podría avanzar sobre eso.
   */
  async guardarBorrador(): Promise<void> {
    const blnOk = await this.enviarCon('GUARDAR_BORRADOR');
    if (!blnOk) return;

    // `window.top` y no `window.location`: la pantalla vive en un iframe dentro de PM4, así que
    // navegar el frame propio dejaría la bandeja embebida dentro del formulario. El `window.top!` de
    // React se reemplaza por una guarda real: `top` es `null` en un contexto cross-origin sin permiso,
    // y ahí es mejor no navegar que reventar después de un guardado exitoso.
    const objTop = window.top;
    if (objTop) objTop.location.href = this.objContexto.urlBandejaTareas();
  }

  /**
   * Registra la respuesta en las **dos** listas que viven en el request padre.
   *
   * ── Por qué relee el padre y no usa el snapshot local ───────────────────────────────────────
   * Ver el docstring de `ParentRequestService`: el subproceso arrancó con una copia de las variables
   * del padre, y guardar esa copia con la respuesta encima **borraría** cualquier fila de ayuda que se
   * hubiera agregado mientras el ayudante redactaba. La relectura degrada a `null` si falla, y ahí sí
   * se usa el snapshot: peor dato, pero la respuesta no se pierde.
   *
   * @param in_dicDatos El `getRawValue()` del form, que es el snapshot de respaldo.
   * @param in_intAdjuntoId El `fileUploadId` que devolvió PM4 al subir el adjunto, si hubo.
   */
  private async registrarRespuesta(
    in_dicDatos: Record<string, unknown>,
    in_intAdjuntoId?: number,
  ): Promise<Record<string, unknown>> {
    const intIndice = (Number(in_dicDatos[QD.intHelpNumber]) || 0) - 1;
    const strComentario = String(in_dicDatos[QD.strAreaComment] ?? '');
    const strAdjunto = String(in_dicDatos[QD.strAreaAttach] ?? '');
    // Quién responde: el usuario asignado si el BPM lo nombró, si no el área. El guión evita que la
    // tarjeta del Analista SAC muestre un "Respondió por:" vacío.
    const strQuienResponde =
      String(in_dicDatos[QD.strAssigneeUser] ?? '') ||
      String(in_dicDatos[QD.strAssigneeArea] ?? '') ||
      '—';
    const strFecha = new Date().toISOString().slice(0, 10);

    // Se arranca del snapshot local y se **sobrescribe** con lo fresco si la relectura salió bien.
    let cllHistorial = Array.isArray(in_dicDatos[QD.lstAssignHistory])
      ? [...(in_dicDatos[QD.lstAssignHistory] as AsignacionHistorial[])]
      : [];
    let cllRespuestas = Array.isArray(in_dicDatos[QD.lstHelpResponses])
      ? [...(in_dicDatos[QD.lstHelpResponses] as RespuestaAyuda[])]
      : [];

    const intPadre = this.objPadre.idDelPadre(
      this.objTareas.tarea()?.data as Record<string, unknown> | undefined,
    );
    if (intPadre) {
      const dicFrescas = await this.objPadre.leerVariables(intPadre);
      if (Array.isArray(dicFrescas?.[QD.lstAssignHistory])) {
        cllHistorial = [...(dicFrescas[QD.lstAssignHistory] as AsignacionHistorial[])];
      }
      if (Array.isArray(dicFrescas?.[QD.lstHelpResponses])) {
        cllRespuestas = [...(dicFrescas[QD.lstHelpResponses] as RespuestaAyuda[])];
      }
    }

    // La fila del historial se marca respondida conservando lo que ya tenía (`fecha`, `de`, `motivo`,
    // `observaciones`): el spread NO se puede reemplazar por un objeto nuevo, porque esos cuatro
    // campos los escribió SCR-005 y esta pantalla no los conoce.
    if (intIndice >= 0 && cllHistorial[intIndice]) {
      cllHistorial[intIndice] = {
        ...cllHistorial[intIndice],
        respondio: 'si',
        comentario: strComentario,
        adjunto: strAdjunto,
        adjuntoFileId: in_intAdjuntoId,
      };
    }

    const objRespuesta: RespuestaAyuda = {
      numero: Number(in_dicDatos[QD.intHelpNumber]) || cllRespuestas.length + 1,
      fecha: strFecha,
      respondio: strQuienResponde,
      comentario: strComentario,
      adjunto: strAdjunto,
      adjuntoFileId: in_intAdjuntoId,
    };

    // Con índice válido se escribe en su posición (una ayuda tiene UNA respuesta, así que responder de
    // nuevo la reemplaza). Sin índice se empuja: escribir en `lst[-1]` crearía una propiedad `"-1"`
    // que no es un elemento del array y que el Analista SAC nunca vería.
    if (intIndice >= 0) cllRespuestas[intIndice] = objRespuesta;
    else cllRespuestas.push(objRespuesta);

    return {
      [QD.lstAssignHistory]: cllHistorial,
      [QD.lstHelpResponses]: cllRespuestas,
    };
  }

  /**
   * Sube el adjunto y manda el payload con su `qd_strAction`.
   *
   * @returns `true` si el envío salió bien. El booleano es el contrato con `guardarBorrador()`, que
   *   navega solo si hubo éxito. **El error no se traga**: si no se completa la tarea PM4 no cierra el
   *   iframe, así que el usuario tiene que ver por qué.
   */
  private async enviarCon(in_strAccion: AccionRespuestaArea): Promise<boolean> {
    this.strErrorEnvio.set('');

    try {
      // El adjunto va ANTES del PUT: el `<docKey>_id` que PM4 devuelve al subir viaja dentro del mismo
      // `data`, así que sin subir primero no hay id que mandar — ni que meter en la fila del historial.
      const intRequestId = this.intRequestId();
      const dicIds =
        intRequestId && this.objRegistro.intCantidad > 0
          ? await this.objAdjuntos.subir(intRequestId, this.objRegistro.mapArchivos)
          : {};

      const dicDatos = this.form.getRawValue() as Record<string, unknown>;

      if (in_strAccion === 'GUARDAR_BORRADOR') {
        await this.objTareas.guardarBorrador({
          ...dicDatos,
          ...idsAdjuntosAPayload(dicIds),
          [QD.strAction]: in_strAccion,
        });
        return true;
      }

      const dicExtra = await this.registrarRespuesta(dicDatos, dicIds[QD.strAreaAttach]);

      await this.objTareas.completarTarea({
        ...dicDatos,
        ...idsAdjuntosAPayload(dicIds),
        ...dicExtra,
        [QD.strAction]: in_strAccion,
      });
      return true;
    } catch (excError) {
      console.error('[RespuestaAreaResponsable] Error al enviar:', excError);
      this.strErrorEnvio.set(mensajeDeError(excError));
      return false;
    }
  }
}
