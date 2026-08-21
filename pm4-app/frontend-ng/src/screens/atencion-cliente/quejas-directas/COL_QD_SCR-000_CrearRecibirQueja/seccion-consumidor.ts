import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input,
  runInInjectionContext, type Signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators, type ValidatorFn } from '@angular/forms';

import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { CatalogosService } from '../../../../core/catalogos.service';
import type { CollectionOption } from '../../../../core/collection.types';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { DEFAULT_COUNTRY_CODE, LOCK_COUNTRY, QD, QD_COLLECTIONS } from '../fields/fields';
import { PqrReadonlyComponent } from './pqr-readonly';
import { PqrSectionComponent } from './pqr-section';

/** Código de `codigo_tipo_persona` que marca persona **jurídica** en `cat_tipo_identificacion`. */
const STR_COD_JURIDICA = '2';

/**
 * Solo letras y espacios (incluidas tildes y ñ), para nombres y apellidos.
 *
 * Se exporta y la pantalla la importa —en vez de tener cada archivo su copia— porque ahora el patrón
 * aparece en **dos** lugares que tienen que coincidir: la declaración de los controles en el
 * `FormGroup` de la pantalla y la tabla `CLL_VALIDADORES_PERSONA` de acá abajo. Dos copias que se
 * desincronizaran dejarían el `pattern` puesto en una rama y ausente en la otra, y el síntoma sería
 * "el apellido acepta números pero solo cuando el documento es un NIT".
 */
export const RGX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

/** La rama de nombres que está aplicada sobre el form. `''` es "ninguna todavía". */
const STR_RAMA_NATURAL = 'natural';
const STR_RAMA_JURIDICA = 'juridica';

/**
 * Los validadores de los cinco campos de nombres, **completos y por rama**: la columna que aplica
 * según el tipo de persona derivado es el estado final del control, no un delta sobre lo que había.
 *
 * Es el gemelo de `CLL_VALIDADORES_DETALLE` de la pantalla, con la misma forma de triplete y por el
 * mismo motivo: así el tipo **obliga** a declarar las dos ramas de cada campo, y un campo que
 * apareciera en una sola quedaría con los validadores de la rama anterior al cruzar — que es
 * exactamente el defecto que la tabla cierra.
 *
 * El `pattern` va en las **dos** ramas de los cuatro campos que lo tienen: "solo letras" es del dato,
 * no de la rama. Lo que cambia entre columnas es únicamente el `required`.
 */
const CLL_VALIDADORES_PERSONA: readonly {
  readonly strCampo: string;
  readonly cllNatural: readonly ValidatorFn[];
  readonly cllJuridica: readonly ValidatorFn[];
}[] = [
  {
    strCampo: QD.strFirstName,
    cllNatural: [Validators.required, Validators.pattern(RGX_SOLO_LETRAS)],
    cllJuridica: [Validators.pattern(RGX_SOLO_LETRAS)],
  },
  {
    strCampo: QD.strLastName,
    cllNatural: [Validators.required, Validators.pattern(RGX_SOLO_LETRAS)],
    cllJuridica: [Validators.pattern(RGX_SOLO_LETRAS)],
  },
  // La razón social no lleva `pattern`: un nombre de empresa trae puntos, números y "&" ("3M", "S.A.S").
  { strCampo: QD.strCompanyName, cllNatural: [], cllJuridica: [Validators.required] },
  {
    strCampo: QD.strContactFirstName,
    cllNatural: [Validators.pattern(RGX_SOLO_LETRAS)],
    cllJuridica: [Validators.required, Validators.pattern(RGX_SOLO_LETRAS)],
  },
  {
    strCampo: QD.strContactLastName,
    cllNatural: [Validators.pattern(RGX_SOLO_LETRAS)],
    cllJuridica: [Validators.required, Validators.pattern(RGX_SOLO_LETRAS)],
  },
];

/**
 * S2 · "Datos del Consumidor Financiero".
 *
 * Porte de `SeccionConsumidor.tsx`. Recibe el `FormGroup` de la pantalla y escribe sobre sus
 * controles; los siete catálogos son un detalle de esta sección, así que `CatalogosService` va en
 * su propio `providers` (mismo criterio que `SeccionCamposPayload` de SCR-003).
 *
 * ── Los siete catálogos, y por qué tres de ellos no pintan ningún select ────────────────────────
 * `idType`, `department`, `city` y `personType` alimentan campos visibles. `sex`, `lgbtiq` y
 * `specialCondition` **no tienen widget en esta pantalla**: se cargan solo para poder resolver su
 * default de negocio (FLD-320/321/322) contra la etiqueta del catálogo. Los tres viajan a PM4 como
 * código, así que sin cargar el catálogo el campo saldría vacío y el BPM no podría bifurcar.
 *
 * ⚠ Y los tres defaults se buscan **por etiqueta**, no por código fijo, porque el código de "No
 * aplica" es distinto en cada colección y negocio lo puede reordenar sin avisar. El regex de cada
 * uno se conserva **exacto** de React, incluidas sus anclas: `/^no$/i` para LGBTIQ+ (un `/no/i`
 * suelto haría match con "No aplica" y con "Ninguno") y `/no aplica/i` sin anclas para sexo y
 * condición especial (las etiquetas reales traen prefijos y sufijos).
 *
 * ── RUL-000-02/03 · el tipo de persona lo decide el tipo de documento, no el usuario ────────────
 * `cat_tipo_identificacion` trae una columna `codigo_tipo_persona` por registro: `'2'` es jurídica y
 * cualquier otra cosa es natural. De ahí salen las dos cosas a la vez: qué bloque de nombres se
 * pinta (natural: nombres + apellidos · jurídica: razón social + contacto) y el código que se
 * escribe en `qd_strPersonType` (FLD-315). El campo se pinta como **solo lectura** (`app-pqr-readonly`)
 * y no como select: es derivado, y dejarlo editable permitiría un caso con "CC" + "Jurídica".
 *
 * ── ⚠ RUL-000-09 · el municipio se limpia SIEMPRE que cambia el departamento ────────────────────
 * Incluida la precarga: el efecto no compara contra un valor previo. React lo hace igual
 * (`useEffect(() => { setValue(QD.strCity, ''); }, [objWatch[QD.strDepartment], setValue])`) y es lo
 * que hizo **imposible** el fixture de su propio spec — un `task.data` con departamento y municipio
 * llega con el municipio ya vaciado. Se porta tal cual, con caso de test propio: el municipio
 * pertenece al departamento, y conservarlo al cambiar de departamento produciría una dirección que no
 * existe. Que la precarga también lo vacíe es el costo aceptado, no un descuido.
 *
 * ── RUL-000-10 · el país queda fijo en Colombia ─────────────────────────────────────────────────
 * `qd_strCountryCode` no tiene widget: `SCR000_DEFAULTS` lo siembra en `DEFAULT_COUNTRY_CODE` y este
 * efecto lo **re-escribe** si algo lo movió, mientras `LOCK_COUNTRY` esté encendido. El flag es
 * *opt-out* (`!== 'false'`), así que apagarlo requiere escribir literalmente `false` — ver el bloque
 * de `fields.ts`.
 *
 * ── Los ocho selects van sin buscador ───────────────────────────────────────────────────────────
 * `zds-select` no expone `withSearch`, y esta pantalla es la que más lo sufre: `department` trae 33
 * registros y `city` más de mil. Reportado a negocio; acá se pinta la lista sin filtro porque
 * agregar el buscador a la fachada es un cambio en el punto más compartido del proyecto.
 */
@Component({
  selector: 'app-seccion-consumidor',
  standalone: true,
  imports: [ReactiveFormsModule, PqrSectionComponent, PqrReadonlyComponent, ZdsInput, ZdsSelect],
  providers: [CatalogosService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-consumidor.html',
})
export class SeccionConsumidor {
  /** El `FormGroup` de la pantalla. Esta sección escribe sobre sus controles, no sobre una copia. */
  readonly form = input.required<FormGroup>();

  /**
   * Valores del form, reactivos, tal como los mantiene la pantalla desde `valueChanges`.
   *
   * No se lee `form.value` directo: no es un signal, así que dentro de un `computed()` no crearía
   * dependencia y los bloques condicionales no se repintarían.
   */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /**
   * `true` cuando el ciudadano ya intentó enviar al menos una vez.
   *
   * Los mensajes de error **no** se pintan antes: los ~20 controles obligatorios arrancan vacíos, así
   * que sin esta guarda la pantalla se abriría en rojo entero antes de que nadie escriba nada. Es el
   * mismo criterio que SCR-004/011 y viene de la pantalla porque el intento es de ella, no de S2.
   */
  readonly blnIntentoEnvio = input(false);

  private readonly objCatalogos = inject(CatalogosService);
  private readonly objInjector = inject(Injector);

  protected readonly QD = QD;

  constructor() {
    // El cableado necesita el `form` del padre, y los `input()` no tienen valor en el constructor.
    // `sincronizarDesc()` hace `inject(DestroyRef)`, y el cuerpo de un `effect()` **no** es contexto
    // de inyección (NG0203 en el primer render, invisible a `tsc`) — de ahí el `runInInjectionContext`
    // con el `Injector` capturado acá, que es donde sí hay contexto.
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });

    effect(() => this.aplicarCascadaMunicipio());
    effect(() => this.derivarTipoPersona());
    effect(() => this.alternarValidadoresPersona());
    effect(() => this.sembrarDefaultsDeBack());
    effect(() => this.fijarPais());
    effect(() => this.sincronizarBloqueoMunicipio());
  }

  /** Guarda del efecto de vinculación: `vincular()` es idempotente pero cargar 7 catálogos no. */
  private blnVinculado = false;

  /** Carga los catálogos y engancha los `_desc` de los cuatro campos con código. */
  private vincular(in_objForm: FormGroup): void {
    // El tercer argumento va como **función** en todos: cuando esto corre, ningún GET respondió, así
    // que pasar el array capturaría el `[]` del primer instante y el `_desc` quedaría vacío.
    sincronizarDesc(in_objForm, QD.strIdType, () => this.cllTiposDocumento());
    sincronizarDesc(in_objForm, QD.strDepartment, () => this.cllDepartamentos());
    sincronizarDesc(in_objForm, QD.strCity, () => this.cllMunicipios());
    sincronizarDesc(in_objForm, QD.strPersonType, () => this.cllTiposPersona());
    // Los tres ocultos también llevan `_desc`: viajan al BPM igual que los visibles.
    sincronizarDesc(in_objForm, QD.strSex, () => this.cllSexo());
    sincronizarDesc(in_objForm, QD.strLgbtiq, () => this.cllLgbtiq());
    sincronizarDesc(in_objForm, QD.strSpecialCondition, () => this.cllCondicionEspecial());

    const dicValores = in_objForm.getRawValue() as Record<string, unknown>;
    void this.objCatalogos.cargar('idType', QD_COLLECTIONS.idType, dicValores);
    void this.objCatalogos.cargar('department', QD_COLLECTIONS.department, dicValores);
    void this.objCatalogos.cargar('personType', QD_COLLECTIONS.personType, dicValores);
    void this.objCatalogos.cargar('sex', QD_COLLECTIONS.sex, dicValores);
    void this.objCatalogos.cargar('lgbtiq', QD_COLLECTIONS.lgbtiq, dicValores);
    void this.objCatalogos.cargar('specialCondition', QD_COLLECTIONS.specialCondition, dicValores);
    // `city` NO se carga acá: depende del departamento y lo hace su propio efecto.
  }

  // ── Catálogos ─────────────────────────────────────────────────────────────────────────────────

  protected readonly cllTiposDocumento = computed(() => this.objCatalogos.de('idType').options());
  protected readonly cllDepartamentos = computed(() => this.objCatalogos.de('department').options());
  protected readonly cllMunicipios = computed(() => this.objCatalogos.de('city').options());
  private readonly cllTiposPersona = computed(() => this.objCatalogos.de('personType').options());
  private readonly cllSexo = computed(() => this.objCatalogos.de('sex').options());
  private readonly cllLgbtiq = computed(() => this.objCatalogos.de('lgbtiq').options());
  private readonly cllCondicionEspecial = computed(
    () => this.objCatalogos.de('specialCondition').options(),
  );

  /** `true` mientras el catálogo de municipios está en vuelo, para el `loading` del select. */
  protected readonly blnCargandoMunicipios = computed(
    () => this.objCatalogos.de('city').cargando(),
  );

  /**
   * Placeholder del municipio, que cambia según haya departamento.
   *
   * Sin departamento el select además está **deshabilitado**, así que el texto es la única pista de
   * por qué: "Seleccione municipio..." sobre un control gris se lee como un error de la pantalla.
   */
  protected readonly strPlaceholderMunicipio = computed(
    () => (this.leer(QD.strDepartment)
      ? 'Seleccione municipio...'
      : 'Seleccione primero el departamento'),
  );

  // ── RUL-000-09 · la cascada Departamento → Municipio ──────────────────────────────────────────

  /**
   * Último departamento por el que **ya se pidió** el catálogo de municipios. Ver el ⚠ de abajo.
   *
   * Arranca en `null` y no en `''` a propósito: `''` es un valor legítimo del departamento (el estado
   * inicial), y arrancar ahí saltearía la primera corrida — que es la que limpia el catálogo por el
   * `dependsOn` de `QD_COLLECTIONS.city` y deja el select vacío en vez de con municipios de nadie.
   */
  private strDeptoCargado: string | null = null;

  /**
   * Recarga el catálogo de municipios y **vacía** el municipio elegido.
   *
   * El vaciado es incondicional a propósito — ver el ⚠ RUL-000-09 de la cabecera. `emitEvent` queda
   * por defecto: esto tiene que mover `sigValores` para que el `_desc` y el gate de envío se enteren,
   * y no reentra porque la escritura de un valor que ya es `''` no vuelve a emitir cambio de
   * departamento.
   *
   * ── ⚠ Todo el cuerpo va detrás de "¿cambió el departamento?", y no es una optimización ────────
   * Este efecto depende de `sigValores()` —vía `leer()`—, que se mueve en **cada** escritura del form
   * entero, no solo del departamento. Con los 46 controles de esta pantalla eso significa que el efecto
   * corre por cada tecla de cualquier campo, así que un cuerpo sin guarda hacía **dos** cosas mal:
   *
   * 1. **Un GET del catálogo por pulsación** — 1000+ registros, todos con el mismo PMQL.
   *    `CollectionService.cargar()` no deduplica (a propósito: es un servicio genérico y hay pantallas
   *    que recargan la misma colección para refrescarla), así que la memoria va acá.
   * 2. **Vaciaba el municipio recién elegido.** La limpieza estaba fuera de la guarda con el motivo de
   *    que "es la regla de negocio y tiene que correr siempre que el efecto corra" — y era falso: el
   *    efecto corre por cualquier escritura, no cuando cambia el departamento. O sea que elegir
   *    municipio y después tocar cualquier otro campo lo borraba, y el ciudadano perdía el dato con el
   *    form marcándole el municipio en rojo sin motivo visible.
   *
   * **RUL-000-09 dice "al cambiar Departamento se limpia Municipio"**, y esa condición es exactamente
   * la de la guarda. Los dos lados del `if` son la misma regla, no una regla y una optimización: el
   * catálogo se recarga y el municipio se vacía **cuando el departamento cambió**.
   *
   * Se destapó escribiendo el spec de la pantalla, y en dos pasos: primero el `objMock.verify()`
   * reportando **seis** GETs idénticos a la colección 15 pendientes (el defecto 1), y después
   * `llenarObligatorios()` dejando `qd_strCity` con `{required: true}` sosteniendo el valor que se le
   * acababa de escribir (el defecto 2). Ninguno de los dos se veía en producción: el select terminaba
   * con las opciones correctas, y el borrado del municipio se lee como "se me deseleccionó solo".
   */
  private aplicarCascadaMunicipio(): void {
    const strDepto = this.leer(QD.strDepartment);
    if (strDepto === this.strDeptoCargado) return;
    this.strDeptoCargado = strDepto;

    void this.objCatalogos.cargar('city', QD_COLLECTIONS.city, { [QD.strDepartment]: strDepto });

    const objControl = this.form().get(QD.strCity);
    if (objControl && objControl.value !== '') objControl.setValue('');
  }

  /**
   * Baja a estado del control el `disabled={!department}` que React pone como atributo.
   *
   * `zds-select` **no tiene input `disabled`** (ni él ni `CampoBase`): tiene un `disable` sin "d"
   * final que la lib declara y nunca lee. El único canal real es el `FormControl`, que el CVA traduce
   * con `setDisabledState`.
   *
   * `emitEvent: false` es obligatorio: esto corre en un efecto que depende de `sigValores`, alimentado
   * por `valueChanges` — emitir reentraría en el mismo efecto.
   *
   * ⚠ Corolario para la pantalla: un control deshabilitado **desaparece de `form.value`**. El payload
   * se arma con `getRawValue()`, así que el municipio viaja igual mientras no haya departamento.
   */
  private sincronizarBloqueoMunicipio(): void {
    const objControl = this.form().get(QD.strCity);
    if (!objControl) return;
    const blnOn = !!this.leer(QD.strDepartment);
    if (blnOn === objControl.enabled) return;
    if (blnOn) objControl.enable({ emitEvent: false });
    else objControl.disable({ emitEvent: false });
  }

  // ── RUL-000-02/03 · tipo de persona derivado del tipo de documento ────────────────────────────

  /**
   * `codigo_tipo_persona` del registro de `cat_tipo_identificacion` elegido.
   *
   * Va por `rawMap()` y no por `records()`: ese signal ya está **indexado por el `value` de la
   * opción**, que es exactamente lo que guarda `qd_strIdType`. Buscar en `records()` obligaría a
   * adivinar cuál de sus columnas fue la que el servicio usó como `value` (`id`, `codigo`, …), que es
   * una decisión de `CollectionDef` y no de esta sección.
   *
   * `''` mientras el catálogo no cargó o si el tipo elegido no trae la columna — y ahí no se deriva
   * nada, que es lo correcto: al montar, un valor precargado sin catálogo todavía no significa "este
   * documento no tiene tipo de persona".
   *
   * ⚠ **La columna se lee bajo `.data`, y saltarse ese nivel no rompe nada visible.** `rawMap` indexa
   * el record **completo** de PM4 —`{id, data: {…}}`— no sus columnas: es lo mismo que asevera
   * `collection.service.spec.ts:213`. Leer `objRegistro['codigo_tipo_persona']` da `undefined`, o sea
   * `''`, o sea "no derivar", que es una salida **legítima** de este `computed()`: no lanza, no loguea
   * y el bloque de nombres se queda en la rama natural, que es el default. El resultado es que
   * RUL-000-02/03 deja de existir en silencio —jurídica es inalcanzable y FLD-315 viaja vacío al BPM—
   * y en pantalla solo se ve que "el tipo de persona quedó en blanco". Lo destapó el spec de esta
   * sección; React lo lee igual (`SeccionConsumidor.tsx:69`, `objIdTypeRecord?.data?.…`).
   */
  private readonly strCodigoTipoPersona = computed(() => {
    const strTipoDoc = this.leer(QD.strIdType);
    if (!strTipoDoc) return '';
    const objRegistro = this.objCatalogos.de('idType').rawMap()[strTipoDoc];
    const dicColumnas = objRegistro?.['data'] as Record<string, unknown> | undefined;
    return String(dicColumnas?.['codigo_tipo_persona'] ?? '');
  });

  /** **RUL-000-03** · persona jurídica ⇒ razón social + datos de contacto en vez de nombres. */
  protected readonly blnEsJuridica = computed(() => this.strCodigoTipoPersona() === STR_COD_JURIDICA);

  /** Etiqueta del tipo de persona derivado, para la celda de solo lectura. */
  protected readonly strTipoPersonaDesc = computed(() => {
    const strCodigo = this.strCodigoTipoPersona();
    if (!strCodigo) return '';
    const objOpcion = this.cllTiposPersona().find((in_objO) => in_objO.value === strCodigo);
    return objOpcion?.label ?? '';
  });

  /**
   * **FLD-315** · escribe el código derivado en `qd_strPersonType`.
   *
   * Se escribe el **código** y no la etiqueta porque es lo que el BPM usa para bifurcar; la etiqueta
   * viaja aparte, por el `_desc` que `vincular()` engancha.
   */
  private derivarTipoPersona(): void {
    const strCodigo = this.strCodigoTipoPersona();
    if (!strCodigo) return;
    const objControl = this.form().get(QD.strPersonType);
    if (objControl && objControl.value !== strCodigo) objControl.setValue(strCodigo);
  }

  // ── La obligatoriedad de los nombres, que es de la rama y vive acá ─────────────────────────────

  /**
   * La rama de nombres cuya columna está aplicada sobre el `FormGroup` — el guardia que hace que la
   * tabla se escriba solo al cruzar de una rama a la otra.
   *
   * Arranca en `''` (ninguna) a propósito: así la primera corrida aplica la columna que corresponde al
   * montaje, que es la natural porque al abrir no hay documento elegido.
   */
  private strRamaPersona: '' | typeof STR_RAMA_NATURAL | typeof STR_RAMA_JURIDICA = '';

  /**
   * Aplica sobre el `FormGroup` la columna de `CLL_VALIDADORES_PERSONA` que le toca al tipo de persona
   * derivado: mueve los obligatorios del bloque natural (nombres + apellidos) al jurídico (razón
   * social + contacto) y al revés.
   *
   * ⚠ **Esto arregla dos bugs reportados sobre la pantalla en vivo, y los dos son el mismo defecto.**
   * Antes, la obligatoriedad de estos cinco campos no la ponía esta pantalla: la componía el DS desde
   * el `[obligatorio]="true"` de la plantilla, apostando a que el validador **se montara y desmontara
   * con el `@if`**. La primera mitad de esa apuesta es cierta; la segunda es falsa, y de ahí salen los
   * dos síntomas:
   *
   *  1. **Con NIT y todo lleno, "Enviar" no hace nada y no hay un solo campo en rojo.** Medido en el
   *     navegador: `qd_strFirstName` y `qd_strLastName` quedan en `{errorRequired: true}` con valor
   *     `''` **estando desmontados**. Nótese la ausencia de la clave `required`: el error no es de
   *     Angular, esos dos controles solo declaraban `Validators.pattern`. Y `scrollToFirstError()`
   *     busca `id="field-qd_strFirstName"`, que no está en el DOM, así que no scrollea a nada — el
   *     ciudadano ve el botón responder y nada más.
   *  2. **Volviendo de NIT a Cédula, Nombres y Apellidos dicen "Campo requerido" con texto correcto.**
   *     Medido: `{v: "Nelson", e: {errorRequired: true}}`. `mensajeDeError()` no reconoce
   *     `errorRequired` (no es `pattern`), así que cae al mensaje genérico y acusa de vacío un campo
   *     lleno.
   *
   * La causa es una sola: `generateControl()` de la lib **compone** su validador sobre el control real
   * de la pantalla (`setValidators(compose([elQueHabía, () => generateValidation()]))`), ese closure
   * lee **`this.model` del componente hijo** y no el valor del control, y **ningún `lib-*-z` tiene
   * `ngOnDestroy`** (`ngOnDestroy` aparece 2 veces en el `.mjs` contra 7 de `generateControl`). Cuando
   * el `@if` desmonta el widget, el closure sigue enganchado leyendo el `model` congelado en `''` de un
   * componente destruido, así que `errorRequired` es **permanente**: verificado que no se cae ni con un
   * `updateValueAndValidity()` sincrónico ni 400 ms después. Y como cada remontaje **vuelve** a
   * componer sobre lo que ya había, los closures muertos se **apilan**.
   *
   * Por eso el arreglo es mudar la obligatoriedad a esta tabla, que es nuestra: escribir la columna
   * completa con `setValidators()` deja el control exactamente en el estado que le corresponde a la
   * rama, **sin importar qué le compuso el DS antes**. Un `removeValidators(Validators.required)` no
   * serviría —compara por identidad de función y el validador ya es un closure compuesto, así que no
   * saca nada y no falla—; es el mismo razonamiento que ya documenta `alternarValidadoresDetalle()` en
   * la pantalla, y esta es la segunda vez que el mismo defecto del vendor se cobra una sección.
   *
   * Los `[obligatorio]="true"` de la plantilla **se conservan**: son lo que pinta el asterisco. Lo que
   * cambia es que ya no son la fuente de verdad de la validez, solo de la marca visual.
   *
   * ── Y por qué el guardia de rama (con una mutación que dio un resultado incómodo) ──
   * Este efecto depende de `sigValores()` vía `strCodigoTipoPersona()`, o sea que corre con cada tecla
   * de cualquiera de los 46 controles. Sin el guardia, cada pulsación reescribiría la columna y borraría
   * el `required` compuesto del DS mientras los widgets siguen montados — que en la rama visible no se
   * nota, pero es la misma clase de borrado accidental que documenta el precedente. Se aplica **solo al
   * cruzar**, que es cuando el estado tiene que cambiar.
   *
   * ⚠ Eso es un argumento de diseño, **no** un invariante que la suite defienda hoy: comentando el
   * `if` de abajo la suite queda **verde, 1304/1304** (mutación verificada y revertida). El motivo es
   * que el escenario que lo distinguiría —que el DS haya compuesto algo que la reescritura borre—
   * necesita los componentes de Lit montados de verdad, y bajo jsdom no hacen upgrade. Se conserva
   * porque cuesta lo mismo y elimina la clase de bug entera; ver el caso "la obligatoriedad de la rama
   * SOBREVIVE a la escritura de otro campo" del spec, que nombra el hueco en vez de decorarlo.
   *
   * `emitEvent: false` es obligatorio: esto corre desde un efecto alimentado por `valueChanges`, y
   * emitir reentraría.
   */
  private alternarValidadoresPersona(): void {
    const strRama = this.blnEsJuridica() ? STR_RAMA_JURIDICA : STR_RAMA_NATURAL;
    if (strRama === this.strRamaPersona) return;
    this.strRamaPersona = strRama;

    for (const objCampo of CLL_VALIDADORES_PERSONA) {
      const objControl = this.form().get(objCampo.strCampo);
      if (!objControl) continue;

      const cllValidadores =
        strRama === STR_RAMA_JURIDICA ? objCampo.cllJuridica : objCampo.cllNatural;
      objControl.setValidators([...cllValidadores]);
      objControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  // ── FLD-320/321/322 · los tres defaults que se resuelven contra su catálogo ────────────────────

  /**
   * Siembra sexo, LGBTIQ+ y condición especial con su valor de negocio, **solo si están vacíos**.
   *
   * La guarda de vacío es la que permite que un caso precargado desde `task.data` conserve lo que
   * negocio ya había respondido en otra pantalla (SCR-009 sí los deja elegir).
   */
  private sembrarDefaultsDeBack(): void {
    this.sembrarPorEtiqueta(QD.strSex, this.cllSexo(), /no aplica/i);
    this.sembrarPorEtiqueta(QD.strLgbtiq, this.cllLgbtiq(), /^no$/i);
    this.sembrarPorEtiqueta(QD.strSpecialCondition, this.cllCondicionEspecial(), /no aplica/i);
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

  // ── RUL-000-10 · país fijo ────────────────────────────────────────────────────────────────────

  /**
   * Re-escribe el país si algo lo movió, mientras `LOCK_COUNTRY` esté encendido.
   *
   * ⚠ **El valor se lee por `leer()` y no por `objControl.value`, y de eso depende que el efecto vuelva
   * a correr.** `FormControl.value` no es un signal: leyéndolo, este efecto no declara dependencia de
   * nada que se mueva al cambiar el país, así que corría **una sola vez** al montar y la mitad
   * "re-escribe" de RUL-000-10 no existía — el campo no tiene widget, así que un `patchValue` de
   * precarga o un watcher lo dejaba con un país que la pantalla no ofrece elegir y nadie lo corregía.
   * Que la siembra inicial siguiera funcionando es lo que lo hacía invisible: el payload viajaba con
   * `170` en el caso normal y con basura solo cuando algo escribía encima. Lo destapó el spec de esta
   * sección.
   *
   * La comparación sigue siendo contra el valor del control (vía `leer()`, que es el mismo dato) y no
   * una escritura ciega: sin el `if`, cada `setValue` reentraría en el efecto por `sigValores`.
   */
  private fijarPais(): void {
    if (!LOCK_COUNTRY) return;
    if (this.leer(QD.strCountryCode) === DEFAULT_COUNTRY_CODE) return;
    this.form().get(QD.strCountryCode)?.setValue(DEFAULT_COUNTRY_CODE);
  }

  // ── Mensajes de error ─────────────────────────────────────────────────────────────────────────

  /**
   * Mensaje de `pattern` por campo, **exacto** de las `rules` de React.
   *
   * Están acá y no en el `FormGroup` de la pantalla porque son texto de UI de esta sección; el
   * validador ejecutable (`Validators.pattern`) sí vive con el control, que es lo que decide si el
   * form es válido. Los textos no se unifican en un "Formato inválido" genérico: cada uno dice qué se
   * espera ("exactamente 10 dígitos", "usuario@dominio.com"), y eso es la mitad del valor del mensaje.
   */
  private static readonly DIC_MSG_PATRON: Readonly<Record<string, string>> = {
    [QD.strIdNumber]: 'Verifica el formato según el tipo de documento',
    [QD.strFirstName]: 'Solo letras',
    [QD.strLastName]: 'Solo letras',
    [QD.strContactFirstName]: 'Solo letras',
    [QD.strContactLastName]: 'Solo letras',
    [QD.strEmail]: 'Formato esperado: usuario@dominio.com',
    [QD.strPhone]: 'Debe contener exactamente 10 dígitos',
  };

  /**
   * Mensaje de error de un campo, o `''` mientras no haya habido intento de envío.
   *
   * ⚠ Se lee `sigValores()()` aunque no se use el resultado: `form.get().valid` **no es un signal**,
   * así que sin tocar el signal de valores este método no se re-evaluaría al corregir el campo y el
   * mensaje quedaría pegado en pantalla después de arreglarlo. Es la misma trampa que documenta el
   * input `sigValores`, y acá aparece en un método y no en un `computed()` porque el campo llega como
   * argumento desde la plantilla.
   */
  protected mensajeDeError(in_strCampo: string): string {
    if (!this.blnIntentoEnvio()) return '';
    void this.sigValores()();

    const objControl = this.form().get(in_strCampo);
    if (!objControl || objControl.valid) return '';
    if (objControl.hasError('pattern')) {
      return SeccionConsumidor.DIC_MSG_PATRON[in_strCampo] ?? 'Formato inválido';
    }
    return 'Campo requerido';
  }

  // ── Utilidades ────────────────────────────────────────────────────────────────────────────────

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }
}
