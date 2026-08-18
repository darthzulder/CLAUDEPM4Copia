import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, output,
  runInInjectionContext, signal, untracked, type Signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../../../../api/pm4Client';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZdsRadio } from '../../../../components/fields/zds-radio';
import {
  ZrAlertInline, ZrButton, ZrTable, ZrTemplate, type ModeloTablaZr,
} from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { CatalogosService } from '../../../../core/catalogos.service';
import type { CollectionOption } from '../../../../core/collection.types';
import { Pm4GroupsService, type Pm4GroupUser } from '../../../../core/pm4-groups.service';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import {
  OPTIONS_SI_NO, QD, QD_COLLECTIONS, SCR0051_MAX_AYUDANTES,
} from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';
import { leerColumnaMatriz } from '../fields/matriz-motivos.service';

/** Fila del historial ya normalizada para `lib-table-z` (todas las celdas como texto). */
interface FilaHistorialVista extends AsignacionHistorial {
  readonly respondioTexto: string;
  readonly comentarioTexto: string;
  readonly adjuntoTexto: string;
}

/**
 * S5 · "Reasignación de Responsable" (SEC-051), S6 · "Solicitud de ayuda" (SEC-052) y
 * S7 · "Historial de Asignaciones" (SEC-053).
 *
 * Porte de `SeccionAsignacion.tsx`. Recibe el `FormGroup` de la pantalla y escribe sobre sus controles.
 *
 * ── Las dos "áreas" NO son un catálogo de áreas ─────────────────────────────────────────────────
 * "Área a reasignar" (S5) y "Área destino" (S6) se llenan con los valores únicos de la columna
 * `rolResponsable` de `cat_matriz_motivos` (id 45), **no** con `CAT-AREA`. Son nombres de **grupos de
 * ProcessMaker**, y por eso `Pm4GroupsService.usuariosDeGrupo()` los resuelve por nombre contra
 * `GET /groups?filter=` en vuelo (los ids de grupo no están en `pm4-registry.json`: el catálogo de
 * grupos lo mantiene negocio y cambia sin pasar por el repo).
 *
 * ── Los dos selects de usuario guardan cosas DISTINTAS, y eso no es un descuido ──────────────────
 * `qd_strAssigneeUser` (S5) guarda el **username**; `qd_strNewAssignee` (S6) guarda el **id numérico**
 * de PM4. Vienen así del contrato con PM4 y con SCR-0052, así que se portan tal cual:
 *
 * - S5 necesita el username porque es lo que se muestra y lo que el caso ya traía asignado; el `id`
 *   viaja aparte, en la opción, y solo se usa para el `user_id` del PUT de reasignación (ACT-0051-01).
 * - S6 necesita el id porque el subproceso de ayuda se lanza contra un usuario concreto; el nombre se
 *   resuelve al momento de escribir la fila del historial.
 *
 * ── ⚠ El `id` de la opción es lo único que puede reasignar la tarea ─────────────────────────────
 * `usuariosDeGrupo()` documenta que PM4 devuelve registros de **pivote** (`group_members`), donde `id`
 * es el id de la fila y el id real del usuario está en `member_id`. Ese servicio ya prioriza el
 * correcto; acá solo importa **no** reconstruir el id desde el username, porque un PUT con el id
 * equivocado reasigna a otro usuario y PM4 responde 200 igual.
 *
 * ── `blnCargandoUsuarios` es un loading real, no "hay opciones o no" (RUL-0051-01-bis) ──────────
 * Con un `qd_strAssigneeUser` precargado y la lista todavía en vuelo, un gate del tipo
 * `cllUsuarios().length > 0` habilitaría "Confirmar Reasignación" antes de poder resolver el `id` — y
 * el PUT saldría sin `user_id`. Por eso el flag es propio y se apaga en el `finally`.
 *
 * ── S5 y S6 desaparecen cuando el caso vuelve del SAC ───────────────────────────────────────────
 * Si `qd_strSacRemarks` trae texto (FLD-131, lo escribe SCR-008), el área solo ajusta la respuesta: la
 * asignación y la solicitud de ayuda se ocultan. El historial (S7) se conserva para auditoría.
 */
@Component({
  selector: 'app-seccion-asignacion',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormSectionComponent, ZdsSelect, ZdsTextarea, ZdsRadio,
    ZrAlertInline, ZrButton, BotonHabilitado, ZrTable, ZrTemplate,
  ],
  // El catálogo de la matriz es de **esta** sección: solo lo usa para sacar los nombres de grupo.
  providers: [CatalogosService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-asignacion.html',
})
export class SeccionAsignacion {
  /** El `FormGroup` de la pantalla. */
  readonly form = input.required<FormGroup>();

  /** Valores del form, reactivos. Ver el mismo input en `SeccionDetalleCaso`. */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** `true` mientras hay un envío en vuelo — deshabilita los botones de la sección. */
  readonly enviando = input(false);

  /**
   * ACT-0051-01 · pide reasignar la tarea **sin completarla**, con el `user_id` real de PM4.
   *
   * Emite el id y no el username: el PUT de `TaskService.reasignarTarea()` espera `user_id`.
   */
  readonly confirmarReasignacion = output<string>();

  /**
   * ACT-0051-03 · pide lanzar el subproceso de ayuda con un payload **explícito**.
   *
   * No emite vacío y deja que la pantalla lea el form: `registrarAyuda()` limpia el mini-formulario
   * en el mismo turno, así que el form ya no tiene los valores de ESTA solicitud. Ver ahí.
   */
  readonly solicitarAyuda = output<Record<string, unknown>>();

  private readonly objCatalogos = inject(CatalogosService);
  private readonly objGrupos = inject(Pm4GroupsService);
  private readonly objHttp = inject(HttpClient);
  private readonly objInjector = inject(Injector);

  protected readonly INT_MAX_AYUDANTES = SCR0051_MAX_AYUDANTES;
  protected readonly CLL_SI_NO = OPTIONS_SI_NO;
  protected readonly QD = QD;

  // ── Estado local de la sección ────────────────────────────────────────────────────────────────

  /** `true` mientras el gestor está editando la asignación (S5 arranca de solo lectura). */
  protected readonly blnModoReasignacion = signal(false);

  /** Foto de la asignación previa, para poder cancelar sin perderla. */
  private dicFoto = { area: '', usuario: '', obs: '' };

  protected readonly cllUsuarios = signal<readonly Pm4GroupUser[]>([]);
  protected readonly blnCargandoUsuarios = signal(false);
  protected readonly cllUsuariosDestino = signal<readonly CollectionOption[]>([]);

  constructor() {
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });

    // Los dos efectos de carga de usuarios. Cada uno vigila su propio campo de área — y el `leer()` de
    // acá arriba es la razón por la que hay que declarar la dependencia a mano.
    //
    // ⚠ `leer()` hace `this.sigValores()()[campo]`, o sea **lee el objeto de valores completo**: dentro
    // de un `effect` eso suscribe al form entero, no al campo. Y estos dos efectos además **escriben**
    // en el form (`qd_strAssigneeUser`, `qd_strNewAssignee`), así que la escritura mueve `sigValores`,
    // que re-dispara el efecto, que vuelve a pedir los usuarios al grupo, que vuelve a escribir: un
    // bucle que no converge y que dispara dos GET a `/groups` por vuelta. En navegador se ve como una
    // pantalla que machaca la API; bajo test se ve como un drenado que nunca termina, que es cómo
    // apareció.
    //
    // El arreglo tiene dos mitades y las dos hacen falta: leer **solo** el campo propio para declarar la
    // dependencia, y meter el resto en `untracked` para que ni la lectura del resto del form ni la
    // escritura cuenten como dependencia.
    effect(() => {
      this.strAreaGestor();
      this.blnModoReasignacion();
      untracked(() => void this.cargarUsuariosDelArea());
    });
    effect(() => {
      this.strAreaDestino();
      untracked(() => void this.cargarUsuariosDelAreaDestino());
    });

    effect(() => this.sincronizarBloqueo());
  }

  private blnVinculado = false;

  /** Engancha los cuatro `_desc` y arranca el catálogo de la matriz. */
  private vincular(in_objForm: FormGroup): void {
    void this.objCatalogos.cargar('matrixMotivos', QD_COLLECTIONS.matrixMotivos);

    // Tercer argumento como **función** en los cuatro: las opciones llegan por red o por el efecto de
    // usuarios, así que pasar el array capturaría el `[]` del primer instante.
    sincronizarDesc(in_objForm, QD.strAssigneeArea, () => this.cllGruposReasignacion());
    sincronizarDesc(in_objForm, QD.strAssigneeUser, () => this.cllUsuarios());
    sincronizarDesc(in_objForm, QD.strTargetArea, () => this.cllGruposReasignacion());
    sincronizarDesc(in_objForm, QD.strNewAssignee, () => this.cllUsuariosDestino());
  }

  // ── Los nombres de grupo, desde la matriz ─────────────────────────────────────────────────────

  /**
   * Valores únicos de `rolResponsable`. `value === label` porque la columna guarda el **nombre** del
   * grupo, que es justo lo que `usuariosDeGrupo()` necesita para resolverlo contra PM4.
   */
  protected readonly cllGruposReasignacion = computed<readonly CollectionOption[]>(() => {
    const setVistos = new Set<string>();
    const cllSalida: CollectionOption[] = [];
    for (const objFila of this.objCatalogos.de('matrixMotivos').records()) {
      const strRol = leerColumnaMatriz(objFila, 'rolResponsable');
      if (!strRol || setVistos.has(strRol)) continue;
      setVistos.add(strRol);
      cllSalida.push({ value: strRol, label: strRol });
    }
    return cllSalida;
  });

  // ── Carga de usuarios (los dos efectos asíncronos) ────────────────────────────────────────────

  /**
   * Contador de peticiones de S5. Reemplaza el `blnActive` del cleanup de React: si el gestor cambia
   * de grupo mientras la anterior está en vuelo, la respuesta vieja llega después y pisaría la lista
   * nueva. Se descarta comparando la generación.
   */
  private intGeneracionUsuarios = 0;

  /** Área del turno anterior, para distinguir "el gestor eligió otro grupo" de "se precargó". */
  private strAreaPrevia: string | null = null;

  /**
   * Usuarios del grupo elegido en S5.
   *
   * El autocompletado del primer usuario corre **solo** cuando el grupo cambió por una elección real
   * en modo reasignación. Si corriera también al precargar, pisaría el `qd_strAssigneeUser` que ya
   * traía el caso con el primer miembro del grupo — o sea, reasignaría el caso solo por abrir la
   * pantalla.
   */
  private async cargarUsuariosDelArea(): Promise<void> {
    const strArea = this.leer(QD.strAssigneeArea);
    const blnModo = this.blnModoReasignacion();

    const strPrevia = this.strAreaPrevia;
    this.strAreaPrevia = strArea;
    const blnCambioElGestor = blnModo && strPrevia !== null && strPrevia !== strArea;

    if (!blnModo || !strArea) {
      this.cllUsuarios.set([]);
      this.blnCargandoUsuarios.set(false);
      return;
    }

    const intGen = ++this.intGeneracionUsuarios;
    this.blnCargandoUsuarios.set(true);
    try {
      const cllUsuarios = await this.objGrupos.usuariosDeGrupo(strArea);
      if (intGen !== this.intGeneracionUsuarios) return;
      this.cllUsuarios.set(cllUsuarios);
      if (blnCambioElGestor) {
        this.form().get(QD.strAssigneeUser)?.setValue(cllUsuarios[0]?.value ?? '');
      }
    } catch (in_excError: unknown) {
      console.error('[SeccionAsignacion] Error al buscar usuarios del grupo PM4:', in_excError);
      if (intGen === this.intGeneracionUsuarios) this.cllUsuarios.set([]);
    } finally {
      if (intGen === this.intGeneracionUsuarios) this.blnCargandoUsuarios.set(false);
    }
  }

  private intGeneracionDestino = 0;

  /**
   * Usuarios del grupo elegido en S6.
   *
   * Acá el autocompletado va **siempre** que cambie el área, sin rastrear el valor previo: "Área
   * destino" arranca vacía en cada solicitud (`registrarAyuda()` la limpia), así que no hay ningún
   * valor precargado que se pueda pisar.
   *
   * `value` es el **id** de PM4, no el username — ver la cabecera de la clase.
   */
  private async cargarUsuariosDelAreaDestino(): Promise<void> {
    const strArea = this.leer(QD.strTargetArea);
    if (!strArea) {
      this.cllUsuariosDestino.set([]);
      return;
    }

    const intGen = ++this.intGeneracionDestino;
    try {
      const cllUsuarios = await this.objGrupos.usuariosDeGrupo(strArea);
      if (intGen !== this.intGeneracionDestino) return;
      const cllOpciones: CollectionOption[] = cllUsuarios.map((in_objUsuario) => ({
        value: in_objUsuario.id,
        label: in_objUsuario.label,
      }));
      this.cllUsuariosDestino.set(cllOpciones);
      this.form().get(QD.strNewAssignee)?.setValue(cllOpciones[0]?.value ?? '');
    } catch (in_excError: unknown) {
      console.error(
        '[SeccionAsignacion] Error al buscar usuarios del grupo PM4 (área destino):', in_excError,
      );
      if (intGen === this.intGeneracionDestino) this.cllUsuariosDestino.set([]);
    }
  }

  // ── Gates de visibilidad ──────────────────────────────────────────────────────────────────────

  /** **RUL-0051-07** · el bloque de ayuda aparece con "¿Necesitas de otras áreas?" = Sí. */
  protected readonly blnMostrarAyuda = computed(() => this.leer(QD.strNeedsOtherAreas) === 'SI');

  /** Caso devuelto por el Analista SAC (FLD-131): se ocultan S5 y S6. */
  protected readonly blnDevueltoPorSac = computed(() => !!this.leer(QD.strSacRemarks).trim());

  protected readonly cllHistorial = computed<readonly AsignacionHistorial[]>(() => {
    const genCrudo = this.sigValores()()[QD.lstAssignHistory];
    if (!Array.isArray(genCrudo)) return [];
    return genCrudo.filter(
      (in_gen): in_gen is AsignacionHistorial => !!in_gen && typeof in_gen === 'object',
    );
  });

  /** **RUL-0051-08** · máximo 4 ayudantes por caso (MSG-0051-06). */
  protected readonly blnTopeAyudantes = computed(
    () => this.cllHistorial().length >= SCR0051_MAX_AYUDANTES,
  );

  /**
   * **RUL-0051-04** · área destino y observaciones son obligatorias (MSG-0051-03).
   *
   * El motivo (`CAT-MOTIVO-REASIG`) quedó retirado: ya no se captura ni se valida, aunque
   * `qd_strReassignReason` sigue viajando vacío en el payload por compatibilidad con SCR-0052.
   */
  protected readonly blnAyudaCompleta = computed(
    () => !!this.leer(QD.strTargetArea) && !!this.leer(QD.strReassignRemarks).trim(),
  );

  /**
   * Usuario de S5 ya resuelto contra la lista, con su `id` real.
   *
   * `undefined` mientras la lista carga, o si el username precargado no pertenece a este grupo (dato
   * legado). En los dos casos **no se puede reasignar** todavía — RUL-0051-01-bis.
   */
  protected readonly objUsuarioElegido = computed(
    () => this.cllUsuarios().find((in_objOpt) => in_objOpt.value === this.leer(QD.strAssigneeUser)),
  );

  /** RUL-0051-01-bis · el grupo ya cargó y no trajo ningún usuario utilizable. */
  protected readonly blnGrupoSinUsuarios = computed(
    () => this.blnModoReasignacion()
      && !!this.leer(QD.strAssigneeArea)
      && !this.blnCargandoUsuarios()
      && !this.objUsuarioElegido(),
  );

  protected readonly blnPuedeConfirmarReasignacion = computed(
    () => !this.enviando() && !!this.objUsuarioElegido(),
  );

  /** Nombre del grupo elegido, para nombrarlo en el aviso de RUL-0051-01-bis. */
  protected readonly strAreaSeleccionada = computed(() => this.leer(QD.strAssigneeArea));

  /**
   * Baja al estado de los controles los tres `disabled` que React pone como atributo.
   *
   * `zds-select` **no tiene input `disabled`** (ni él ni `CampoBase`), así que el único canal es el
   * `FormControl`: el CVA lo traduce con `setDisabledState` y agrega
   * `.zds-select-wrap--deshabilitado`. Los dos selects de S5 se bloquean fuera del modo reasignación,
   * y el de responsable además mientras no haya área elegida.
   *
   * "Responsable Destino" (S6) queda bloqueado hasta que haya área destino, igual que en React.
   *
   * `emitEvent: false`: esto corre en un efecto que depende de `sigValores`, alimentado por
   * `valueChanges` — emitir reentraría en el mismo efecto. Mismo patrón que en `SeccionDetalleCaso`.
   *
   * ⚠ Un control deshabilitado desaparece de `form.value`. Es inofensivo porque la pantalla arma el
   * payload y el espejo con `getRawValue()`; con `.value` el área y el responsable saldrían vacíos
   * hacia PM4 justo cuando el gestor **no** está reasignando, que es el caso normal.
   */
  private sincronizarBloqueo(): void {
    const objForm = this.form();
    const blnModo = this.blnModoReasignacion();
    const cllGates: readonly (readonly [string, boolean])[] = [
      [QD.strAssigneeArea, blnModo],
      [QD.strAssigneeUser, blnModo && !!this.leer(QD.strAssigneeArea)],
      [QD.strNewAssignee, !!this.leer(QD.strTargetArea)],
    ];
    for (const [strCampo, blnOn] of cllGates) {
      const objControl = objForm.get(strCampo);
      if (!objControl || blnOn === objControl.enabled) continue;
      if (blnOn) objControl.enable({ emitEvent: false });
      else objControl.disable({ emitEvent: false });
    }
  }

  // ── S5 · entrar y salir del modo reasignación ─────────────────────────────────────────────────

  protected iniciarReasignacion(): void {
    this.dicFoto = {
      area: this.leer(QD.strAssigneeArea),
      usuario: this.leer(QD.strAssigneeUser),
      obs: this.leer(QD.strAssignmentRemarks),
    };
    this.blnModoReasignacion.set(true);
  }

  protected cancelarReasignacion(): void {
    const objForm = this.form();
    objForm.get(QD.strAssigneeArea)?.setValue(this.dicFoto.area);
    objForm.get(QD.strAssigneeUser)?.setValue(this.dicFoto.usuario);
    objForm.get(QD.strAssignmentRemarks)?.setValue(this.dicFoto.obs);
    this.blnModoReasignacion.set(false);
  }

  protected emitirConfirmarReasignacion(): void {
    const strId = this.objUsuarioElegido()?.id;
    if (!strId) return;
    this.confirmarReasignacion.emit(strId);
  }

  // ── S6 · registrar la solicitud de ayuda ──────────────────────────────────────────────────────

  /**
   * **ACT-0051-03** · agrega la fila al historial y pide el envío con un payload explícito.
   *
   * ⚠ El orden importa y es el que arregló un bug de React: la foto de área/responsable/observaciones
   * se toma **antes** de limpiar el mini-formulario. Si se leyera después, el payload saldría con esos
   * tres campos vacíos y PM4 registraría una ayuda sin destinatario.
   *
   * El payload va explícito y no "que la pantalla lea el form" por lo mismo: los `setValue()` de acá
   * ya vaciaron los controles cuando el padre atiende el evento.
   */
  protected registrarAyuda(): void {
    if (!this.blnAyudaCompleta() || this.blnTopeAyudantes()) return;

    const objForm = this.form();
    const strAreaDestino = this.leer(QD.strTargetArea);
    const strNuevoResponsable = this.leer(QD.strNewAssignee);
    const strObservaciones = this.leer(QD.strReassignRemarks);

    const objFila: AsignacionHistorial = {
      fecha: this.fechaDeHoy(),
      de: this.leer(QD.strCurrentAssignee) || this.leer(QD.strAssigneeUser) || '—',
      // `qd_strNewAssignee` guarda el id: el nombre se resuelve acá, porque el historial lo lee gente.
      para: this.cllUsuariosDestino().find((in_objOpt) => in_objOpt.value === strNuevoResponsable)?.label
        || strNuevoResponsable || '—',
      motivo: '', // CAT-MOTIVO-REASIG retirado — el campo ya no se captura.
      observaciones: strObservaciones,
    };

    const cllNuevoHistorial = [...this.cllHistorial(), objFila];
    // Número de ESTA ayuda (1-based) = posición de la fila nueva. Viaja con el subproceso para que
    // SCR-0052 sepa a qué ayuda está respondiendo (matchea el índice del historial).
    const intNumeroAyuda = cllNuevoHistorial.length;

    objForm.get(QD.lstAssignHistory)?.setValue(cllNuevoHistorial);
    objForm.get(QD.intHelpNumber)?.setValue(intNumeroAyuda);
    // Limpieza del mini-formulario, solo en pantalla: el payload de abajo ya tiene la foto.
    objForm.get(QD.strTargetArea)?.setValue('');
    objForm.get(QD.strNewAssignee)?.setValue('');
    objForm.get(QD.strReassignRemarks)?.setValue('');

    this.solicitarAyuda.emit({
      ...objForm.getRawValue(),
      [QD.lstAssignHistory]: cllNuevoHistorial,
      [QD.intHelpNumber]: intNumeroAyuda,
      [QD.strTargetArea]: strAreaDestino,
      [QD.strNewAssignee]: strNuevoResponsable,
      [QD.strReassignReason]: '',
      [QD.strReassignRemarks]: strObservaciones,
    });
  }

  /**
   * Fecha de hoy como `YYYY-MM-DD`, que es el formato con el que el historial ya viaja.
   *
   * Se arma con los getters locales y no con `toISOString()`: ese convierte a UTC, así que en Bogotá
   * (UTC-5) cualquier registro hecho después de las 19:00 quedaría fechado al día siguiente.
   */
  private fechaDeHoy(): string {
    const dtHoy = new Date();
    const strMes = String(dtHoy.getMonth() + 1).padStart(2, '0');
    const strDia = String(dtHoy.getDate()).padStart(2, '0');
    return `${dtHoy.getFullYear()}-${strMes}-${strDia}`;
  }

  // ── S7 · el historial ─────────────────────────────────────────────────────────────────────────

  /**
   * Columnas del historial.
   *
   * ⚠ **Siete columnas, no ocho.** La octava ("Adjunto") va por `showGenericEnd` + su
   * `<ng-template libZTemplate id="end">`, porque necesita un botón de descarga y `TableZ` no pinta
   * más que texto en una columna normal.
   *
   * ⚠ Y "Respondió" queda como TEXTO (`✓` / `—`) en vez del `zds-status-badge` verde de React. No es
   * pereza: `TableZ` **no soporta plantillas por columna**. Su campo `columnTemplates` se llena en
   * `ngAfterContentInit` y **nunca se lee** en la plantilla del componente (verificado sobre el
   * `.mjs` de `lib-zurich` 2.6.16: solo hay dos apariciones, la declaración y la escritura), así que
   * los únicos huecos templateables son `start` y `end`. La otra salida —`isTag`, que pinta un
   * `lib-tag-z`— tampoco sirve: su color se resuelve contra una lista de palabras **en inglés**
   * (`'OK'`, `'Activo'`, `'Error'`…) y cualquier valor en español cae al negro `#000000`, o sea una
   * píldora negra en vez de un check verde. El texto conserva la misma información y no miente con el
   * color. Anotado en la ficha.
   */
  protected readonly cllColumnasHistorial: ModeloTablaZr[] = [
    { title: 'Fecha', key: 'fecha' },
    { title: 'De', key: 'de' },
    { title: 'Para', key: 'para' },
    { title: 'Motivo', key: 'motivo' },
    { title: 'Observaciones', key: 'observaciones' },
    { title: 'Respondió', key: 'respondioTexto' },
    { title: 'Comentario', key: 'comentarioTexto' },
  ];

  /**
   * Filas listas para la tabla.
   *
   * Sin `readonly` en el tipo del array por el input `data` de `TableZ`, que es mutable: un
   * `readonly FilaHistorialVista[]` rebota con TS4104 en el binding. Mismo caso que en SCR-003.
   */
  protected readonly cllFilasHistorial = computed<FilaHistorialVista[]>(() => this.cllHistorial().map(
    (in_objFila) => ({
      ...in_objFila,
      respondioTexto: in_objFila.respondio === 'si' ? '✓' : '—',
      comentarioTexto: in_objFila.comentario ?? '—',
      adjuntoTexto: in_objFila.adjunto ?? '—',
    }),
  ));

  /**
   * Baja el adjunto que dejó un ayudante en SCR-0052, por su `file_id`.
   *
   * Va por `HttpClient` y no por un `<a href>` directo porque `GET /files/{id}/contents` necesita el
   * header del BFF. Es el mismo procedimiento que `RequestFileList.descargar()`, incluida la
   * revocación en el `finally` para que también corra si el `click()` lanza.
   */
  protected async descargarAdjunto(in_objFila: AsignacionHistorial): Promise<void> {
    const intFileId = in_objFila.adjuntoFileId;
    const strNombre = in_objFila.adjunto;
    if (!intFileId || !strNombre) return;

    let strUrl: string | null = null;
    try {
      const objBlob = await firstValueFrom(
        this.objHttp.get(urlApi(`/files/${intFileId}/contents`), { responseType: 'blob' }),
      );
      strUrl = URL.createObjectURL(objBlob);
      const objEnlace = document.createElement('a');
      objEnlace.href = strUrl;
      objEnlace.download = strNombre;
      objEnlace.click();
    } catch (in_excError: unknown) {
      console.error('[SeccionAsignacion] Error al descargar el adjunto:', in_excError);
    } finally {
      if (strUrl) URL.revokeObjectURL(strUrl);
    }
  }

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }

  /**
   * Las dos áreas, cada una como `computed` propio — el paso que corta el bucle de los efectos de carga.
   *
   * `sigValores` es un signal del objeto de valores **completo**: no hay forma de suscribirse a una sola
   * clave, así que un `effect` que llame a `leer()` queda suscrito a todo el formulario. Envolverlo en un
   * `computed` sí acota la dependencia, porque el `computed` recalcula con cada cambio del form pero solo
   * **notifica** cuando su propio `string` cambia (igualdad por valor). Así el efecto de carga se despierta
   * al cambiar el área y no al tipear en la respuesta al cliente.
   *
   * Sin esto, el `setValue()` que hacen los dos efectos al autocompletar el responsable re-dispara el
   * efecto que lo escribió y la pantalla machaca `/api/groups` sin parar.
   */
  private readonly strAreaGestor = computed(() => this.leer(QD.strAssigneeArea));
  private readonly strAreaDestino = computed(() => this.leer(QD.strTargetArea));
}
