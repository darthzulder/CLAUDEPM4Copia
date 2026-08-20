import {
  Component, effect, inject, Injector, input, output, runInInjectionContext, signal, type Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormSectionComponent } from '../../../../components/form-section';
import { ZdsCheckboxField } from '../../../../components/fields/zds-checkbox-field';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsRadio } from '../../../../components/fields/zds-radio';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsStatusBadge } from '../../../../components/fields/zds-status-badge';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import { ZrAlertInline } from '../../../../components/fields/zds-reexports';
import { CatalogosService } from '../../../../core/catalogos.service';
import { codeFromUiValue, descOf, uiValueFromCode } from '../../../../core/collection-helpers';
import type { CollectionOption } from '../../../../core/collection.types';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { MatrizMotivosService } from '../fields/matriz-motivos.service';
import { OPTIONS_SI_NO, QD, QD_COLLECTIONS, SCR003_PAYLOAD_M2_FIELDS } from '../fields/fields';
import type { PayloadFieldDef } from '../fields/fields';

/** Texto legible de un valor del payload enviado. */
export function fmtPayload(in_gen: unknown): string {
  if (in_gen === null || in_gen === undefined || in_gen === '') return '—';
  if (typeof in_gen === 'object') return JSON.stringify(in_gen);
  return String(in_gen);
}

/**
 * ¿La SFC señaló este campo?
 *
 * Compara contra la variable del caso, la clave del body y los **tokens** de la clave
 * (`canal_cod` → `canal`, `macro_motivo_cod` → `motivo`), porque el mensaje de la SFC nombra los
 * campos en prosa o en slug (p.ej. `queja_entidad_motivo_producto_canal_already_exist`).
 *
 * ⚠ El piso de **5 caracteres** por token no es cosmético: sin él, tokens cortos como `id` o `cod`
 * harían match dentro de cualquier mensaje y **todas** las filas saldrían señaladas — que es peor que
 * ninguna, porque el gestor pierde la única pista de dónde mirar. Va con caso de test.
 */
export function esSenalado(in_strSenalado: string, in_objDef: PayloadFieldDef, in_strVar: string): boolean {
  if (!in_strSenalado) return false;
  const strHaystack = in_strSenalado.toLowerCase();
  if (strHaystack === in_strVar.toLowerCase()) return true;
  // Las filas auxiliares no viajan en el body, así que no hay clave que la SFC pueda nombrar.
  if (in_objDef.key === '—') return false;
  const strBase = in_objDef.key.toLowerCase().replace(/_cod$/, '');
  const lstTokens = [in_objDef.key.toLowerCase(), strBase, strBase.split('_').pop() ?? ''];
  return lstTokens.some((in_strToken) => in_strToken.length >= 5 && strHaystack.includes(in_strToken));
}

/**
 * S2 · "Campos a Corregir" — un control por cada campo del body de Momento 2
 * (`SCR003_PAYLOAD_M2_FIELDS`, espejo de `buildBodyMomento2()` del script PHP), ligado a la variable
 * del caso de la que el script lo lee.
 *
 * Porte de `SeccionCamposPayload.tsx`. Cada fila solo se edita tras marcar su checkbox "Editar"; al
 * desmarcarlo se restaura el valor que llegó en `task.data`.
 *
 * ── Los 13 catálogos, y por qué esta sección los provee y no la pantalla ────────────────────────
 * `CatalogosService` y `MatrizMotivosService` se declaran en el `providers` de **este** componente:
 * los catálogos son un detalle de cómo se pintan estas filas, no del formulario. La pantalla padre no
 * tiene ningún select propio. Son 10 catálogos planos + los 3 que la cascada de la matriz pide por su
 * cuenta con claves `matriz:*` (ver `MatrizMotivosService`).
 *
 * ── El `FormGroup` satélite de los checkboxes "Editar" ──────────────────────────────────────────
 * Los checkboxes son **estado de UI**, no datos del caso: nada llamado `edit-qd_strChannel` puede
 * llegar a PM4. Viven en un `FormGroup` propio (`objGrupoEdicion`) con un control por variable, y por
 * eso el payload group queda intacto — el submit es `{...form.getRawValue()}` y un control extra ahí
 * viajaría al BPM como un campo inventado.
 *
 * Hace falta un control **real** y no solo un signal porque `ZdsCheckboxField` es un CVA: sin
 * `formControlName` no hay nada que escribir. (Su `grupo` ya es satélite frente a `lib-checkbox-z`,
 * pero eso es otra capa: protege del segundo escritor de la lib, no de que el control exista.)
 *
 * ── Por qué el producto SFC necesita un control aparte y los otros 12 selects no ────────────────
 * La colección 16 **repite códigos** (el 104 es a la vez "Garantía extendida" y "Copropiedades") y el
 * picker del DS indexa por `value`, así que con values crudos no podría distinguir cuál se eligió. La
 * fachada React resolvía esto con la tríada `toPickerValue`/`fromPickerValue`/`onPickerChange`, que
 * **`zds-select` no tiene**. Acá el select se ata a un control satélite (`ui-<var>`) que guarda el
 * value de UI `código::etiqueta`, y un `valueChanges` traduce al control real: el form sigue guardando
 * el **código puro**, que es el contrato con PM4. Agregar la tríada a la fachada sería más código en el
 * punto más compartido del proyecto para un caso que hoy tiene un solo usuario.
 */
@Component({
  selector: 'app-seccion-campos-payload',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormSectionComponent, ZdsInput, ZdsSelect, ZdsTextarea, ZdsRadio,
    ZdsCheckboxField, ZdsStatusBadge, ZrAlertInline,
  ],
  providers: [CatalogosService, MatrizMotivosService],
  templateUrl: './seccion-campos-payload.html',
})
export class SeccionCamposPayload {
  /** El `FormGroup` de la pantalla. Esta sección escribe sobre sus controles, no sobre una copia. */
  readonly form = input.required<FormGroup>();

  /**
   * Valores del form, reactivos, tal como los mantiene la pantalla desde `valueChanges`.
   *
   * ⚠ No se lee `form.value` directo: **no es un signal**, así que leerlo dentro de un `computed()` no
   * crea dependencia y las filas no se repintarían al cambiar un valor. Es el mismo motivo por el que
   * `MatrizMotivosService.vincular()` recibe este signal en vez del form solo.
   */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** Valor de cada variable tal como llegó en `task.data` (para revertir y para comparar). */
  readonly dicOriginales = input<Record<string, string>>({});

  /** Body que el script alcanzó a enviar (`qd_strPayloadSent` parseado), si lo hay. */
  readonly objPayloadEnviado = input<Record<string, unknown> | null>(null);

  /** Campo señalado por la SFC (`qd_strAffectedField`) o, si no vino, el mensaje de error completo. */
  readonly strSenalado = input('');

  /** Se emite cuando el gestor marca o desmarca "Editar" en una fila. La pantalla no necesita saber más. */
  readonly editableCambiado = output<{ variable: string; activo: boolean }>();

  private readonly objCatalogos = inject(CatalogosService);
  protected readonly objMatriz = inject(MatrizMotivosService);

  /** Para poder cablear desde el `effect()`, que ya no es contexto de inyección. Ver el constructor. */
  private readonly objInjector = inject(Injector);

  /** El descriptor, expuesto a la plantilla. Es el mismo array que el script PHP recorre. */
  protected readonly cllCampos = SCR003_PAYLOAD_M2_FIELDS;

  /** Estado de UI de los checkboxes "Editar", indexado por variable. */
  private readonly dicEditables = signal<Record<string, boolean>>({});

  /**
   * Controles de los checkboxes y del picker de producto. Nunca se mezcla con el form de la pantalla
   * (ver el encabezado): lo que vive acá no viaja a PM4.
   */
  protected readonly objGrupoEdicion = new FormGroup<Record<string, FormControl<unknown>>>({});

  /** Valor del satélite del producto, como signal. Ver el constructor y `sembrarPickerDeProducto()`. */
  private readonly sigSateliteProducto: Signal<unknown>;

  constructor() {
    for (const objDef of this.cllCampos) {
      if (!objDef.variable) continue;
      this.objGrupoEdicion.addControl(
        this.nombreEdicion(objDef.variable),
        new FormControl<unknown>(false) as FormControl<unknown>,
      );
    }
    this.objGrupoEdicion.addControl(
      this.nombreUi(QD.strSfcProduct),
      new FormControl<unknown>('') as FormControl<unknown>,
    );

    // El satélite como signal: es la dependencia de `sembrarPickerDeProducto()`. Ver el ⚠ de ahí para
    // por qué es este control y no el del código.
    this.sigSateliteProducto = toSignal(
      this.objGrupoEdicion.get(this.nombreUi(QD.strSfcProduct))!.valueChanges,
      { initialValue: '' as unknown },
    );

    // El resto del cableado necesita el `form` y el `sigValores` del padre, y los `input()` no tienen
    // valor todavía en el constructor. Va en un `effect()` con guarda de una sola vez, que es la
    // primera oportunidad en la que los inputs están disponibles.
    //
    // ⚠ El cuerpo de un `effect()` **NO** es contexto de inyección — se declara dentro de uno, pero
    // corre después, en la detección de cambios. `sincronizarDesc()` hace `inject(DestroyRef)` para su
    // `takeUntilDestroyed()`, así que llamarlo directo desde acá tira **NG0203** al primer render (no
    // al compilar: lo encontró la sonda de montaje, no `tsc`). De ahí el `runInInjectionContext` con el
    // `Injector` capturado en el constructor, que es donde sí hay contexto.
    //
    // Es el mismo problema que SCR-012 no tiene: ahí el `FormGroup` es un campo de instancia de la
    // pantalla, así que su constructor ya lo ve y llama `sincronizarDesc()` directo. Acá el form llega
    // por `input()`, y esa diferencia es la que obliga a diferir el cableado.
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });

    // Las cascadas y el gobierno de habilitación, cada una en su propio efecto. Ver `vincular()`.
    effect(() => this.sembrarPickerDeProducto());
    effect(() => this.aplicarCascadaMunicipio());
    effect(() => this.aplicarCascadaMomento());
    effect(() => this.aplicarCascadaServicio());
    effect(() => this.aplicarCascadaMotivo());
    effect(() => this.sincronizarHabilitacion());
  }

  /** Guarda del efecto de vinculación: `vincular()` es idempotente pero cargar 10 catálogos no. */
  private blnVinculado = false;

  /**
   * Ata el form del padre: carga los 13 catálogos, engancha los `_desc` y traduce el picker.
   *
   * ⚠ **Tiene que correr dentro de un contexto de inyección**: `sincronizarDesc()` hace
   * `inject(DestroyRef)` y `MatrizMotivosService.vincular()` lo llama a su vez. El único llamador es el
   * `effect()` del constructor, que lo envuelve en `runInInjectionContext()` — ver el comentario de ahí.
   */
  private vincular(in_objForm: FormGroup): void {
    // La cascada de la matriz se ata primero: su `vincular()` arranca los 3 catálogos `matriz:*` y
    // sincroniza el `_desc` del motivo, que ninguna otra pieza puede resolver.
    this.objMatriz.vincular(in_objForm, this.sigValores());

    for (const objDef of this.cllCampos) {
      if (objDef.control !== 'select' || !objDef.collection || objDef.cascade) continue;
      const strClave = objDef.collection;
      // Tercer argumento como **función**: si se pasara el array se capturaría el `[]` del primer
      // instante (antes de que el GET responda) y el `_desc` nunca se escribiría.
      sincronizarDesc(in_objForm, objDef.variable as string, () => this.cllOpcionesDe(strClave));
      void this.objCatalogos.cargar(strClave, QD_COLLECTIONS[strClave], in_objForm.getRawValue());
    }

    // Los checkboxes "Editar": la reacción del gestor va por el `valueChanges` del control satélite
    // y **no** por un `(output)` de la plantilla, porque `ZdsCheckboxField` no expone ninguno — es un
    // CVA puro, y su único canal de salida es el control (ver el docstring de ese wrapper).
    //
    // Es además lo correcto y no solo lo posible: `marcarEditable()` escribe con `emitEvent: false`,
    // así que las escrituras programáticas de las cascadas **no** reentran acá y no pisan el valor que
    // la cascada acaba de limpiar. Lo único que llega a este handler es un click del gestor.
    for (const objDef of this.cllCampos) {
      if (!objDef.variable) continue;
      const objEdit = this.objGrupoEdicion.get(this.nombreEdicion(objDef.variable));
      objEdit?.valueChanges.subscribe((in_genOn: unknown) => this.alCambiarEditable(objDef, in_genOn));
    }

    // El picker del producto: el control satélite guarda `código::etiqueta` y acá se traduce al
    // control real, que sigue guardando el código puro (contrato con PM4).
    const objUi = this.objGrupoEdicion.get(this.nombreUi(QD.strSfcProduct));
    objUi?.valueChanges.subscribe((in_genUi: unknown) => {
      const strUi = String(in_genUi ?? '');
      in_objForm.get(QD.strSfcProduct)?.setValue(codeFromUiValue(strUi));
      // El `_desc` del producto NO sale de `sincronizarDesc`: la colección 16 repite códigos, así
      // que la única fuente correcta de la etiqueta es lo que el usuario eligió. Ver el servicio.
      this.objMatriz.syncProductDesc(strUi);
    });
  }

  // ── Cascadas ──────────────────────────────────────────────────────────────────────────────────

  /**
   * Limpia un campo cuyo valor quedó fuera de sus opciones y lo deja **editable**.
   *
   * La doble acción es deliberada: limpiar sin re-marcar el checkbox dejaría el campo vacío y
   * bloqueado, o sea imposible de arreglar desde la pantalla. Y `in_blnActivo` evita tocar un campo
   * que el gestor no pidió editar — al montar, un valor precargado que no está en las opciones
   * todavía es sencillamente un catálogo que no cargó, no un dato inválido.
   */
  private limpiarSiFuera(
    in_strCampo: string,
    in_cllOpciones: readonly CollectionOption[],
    in_blnActivo: boolean,
  ): void {
    if (!in_blnActivo || in_cllOpciones.length === 0) return;
    const strValor = this.leer(in_strCampo);
    if (!strValor || in_cllOpciones.some((in_objO) => in_objO.value === strValor)) return;
    this.form().get(in_strCampo)?.setValue('');
    this.marcarEditable(in_strCampo, true);
  }

  /**
   * Siembra el picker de producto con el value de UI del código **precargado**.
   *
   * ── El defecto que arregla: la cascada entera salía vacía en un caso real ──────────────────────
   * El satélite `ui-qd_strSfcProduct` traduce **UI → form** por su `valueChanges` (ver `vincular()`),
   * y esa es la única dirección que existía. Faltaba la inversa, y sin ella la traducción no era un
   * puente sino una purga: el satélite nace en `''`, y su emisión escribe
   * `codeFromUiValue('') === ''` **sobre el código que `precargar()` acababa de poner**.
   *
   * Con `qd_strSfcProduct` en `''`, `strInsuranceUiValue` → `''` → `strProductLabel` → `''`, y como
   * ese label es uno de los dos criterios de `cllRowsForProduct`, el nivel 1 de la matriz queda en
   * `[]` y los **tres** selects de abajo (momento, servicio, motivo) salen vacíos. Medido en el caso
   * 33964: `dicOriginales` traía `"101"`, el form tenía `""`, y momento/servicio/motivo pintaban 0/0/0
   * contra los 8/7/7 de React. Escribir `"101"` a mano en el control encendía los tres al instante,
   * lo que confirma que el corte era este y no la cascada.
   *
   * ⚠ **No hay ningún `setValue('')` espurio que buscar, y por eso el defecto costaba de ver.** Se
   * instrumentó el control y la traza de escrituras salió **vacía**: nadie lo pisa dos veces. El
   * borrado es la *primera* emisión del satélite, que llega **después** de `precargar()` porque
   * `ngOnInit` es `async` (`await objTareas.cargar()` cede el hilo, así que la sección ya se pintó una
   * vez con el satélite vacío antes de que la precarga corra).
   *
   * ── Por qué se siembra el satélite y no se blinda el `valueChanges` ────────────────────────────
   * Ignorar el `''` en el suscriptor haría **imposible vaciar** el producto a mano, y volver al
   * placeholder es una acción legítima del gestor (el prompt es elegible — ver `ZdsSelect`). Sembrar
   * ataca la causa: el satélite deja de mentir sobre lo que hay elegido.
   *
   * ── ⚠ Por qué esto SIGUE haciendo falta con el arreglo de la fachada puesto ─────────────────────
   * La fachada ya cierra el mismo defecto de raíz para todos los campos: `CampoBase.genModeloParaVendor`
   * hace que el `lib-*-z` nunca reciba un `''` que borraría un valor que el control ya tiene (ver ese
   * getter en [campo-base.ts](../../../../components/fields/campo-base.ts)). Se intentó quitar este
   * efecto apoyándose en eso y **dos casos de este spec se pusieron rojos**: *"un producto SFC
   * precargado enciende la cascada del motivo y no se autoborra"* (`expected '' to be '101::Autos'`) y
   * *"siembra desde task.data aunque el código del form ya esté borrado"* (`expected '' to be '101'`).
   *
   * La razón es estructural y vale entenderla antes de volver a intentarlo: la fachada **defiende** un
   * valor precargado, y este satélite **no tiene ninguno que defender**. Nace en `''` en el constructor
   * y `precargar()` no lo toca —hace `form.patchValue()` sobre el form real, y el satélite vive en
   * `objGrupoEdicion`—, así que `genModeloParaVendor` encuentra `model` vacío *y* el control vacío, y
   * devuelve `''` con toda razón. Lo que falta no es protección: es que **alguien escriba** el valor de
   * UI (`101::Autos`) que ningún otro escritor produce. Eso es este efecto, y es un trabajo distinto.
   *
   * En la SCR-0051 el reparto es el otro: ahí el satélite se siembra desde `strInsuranceUiValue()` y lo
   * que hacía falta era justamente la protección del código precargado, que ahora da la fachada.
   *
   * ── ⚠ Por qué la fuente es `dicOriginales` y NO `strInsuranceUiValue()` ───────────────────────
   * Porque derivar del form es **circular**, y la primera versión de este arreglo lo hacía: cuando
   * este efecto corre, el borrado ya pasó y `qd_strSfcProduct` está en `''`. Y `strInsuranceUiValue`
   * se computa leyendo *ese* control (ver el servicio), así que devuelve `''` y no hay nada que
   * sembrar. Medido en el navegador con esa versión puesta: colección 16 resuelta (12 opciones, con
   * `101::Autos` entre ellas), `dicOriginales` con `"101"`, y aun así `uiValue: ''`, satélite `''`,
   * cascadas **0/0/0**. El spec no lo detectó porque bajo jsdom el borrado nunca ocurre, así que el
   * form todavía tenía el código y la derivación funcionaba (ver el bloque de mutación más abajo).
   *
   * `dicOriginales` es la única fuente que **sobrevive al borrado**: es la foto de `task.data`.
   *
   * El `_desc` se pasa pero puede faltar (en el caso 33964 llega `undefined`): `uiValueFromCode` cae
   * entonces al primer registro con ese código, que es su contrato documentado y alcanza acá.
   *
   * ── ⚠ Se escribe UN solo control, y el otro se repone solo ─────────────────────────────────────
   * Solo se escribe el satélite, y **emitiendo**. El código en el form no se toca acá aunque sea lo
   * que la matriz lee: el suscriptor del satélite en `vincular()` ya hace
   * `setValue(codeFromUiValue(strUi))` + `syncProductDesc(strUi)`, o sea el código **y** el `_desc`.
   * Hubo una versión con un `objCodigo.setValue(strCodigo, { emitEvent: false })` explícito y se
   * quitó: **ninguna mutación la ponía roja**, ni en el spec ni en el navegador sobre el caso 33964.
   * Era código muerto que parecía defensivo.
   *
   * Emitir es además lo que hace que la siembra sea visible para su **propia dependencia** (ver el ⚠
   * de abajo). No marca la fila como "Modificado" porque el valor que se escribe es el del caso.
   *
   * ── ⚠ La dependencia es el satélite, y NO el código — medido ───────────────────────────────────
   * Es contraintuitivo: lo que cambia de valor en el borrado es el código (`'101'` → `''`), así que
   * la lectura natural es depender de él vía `sigValores`. **Es falso, y deja el arreglo sin efecto
   * exactamente en el caso que vino a cubrir.** El control del código está **deshabilitado** mientras
   * la fila no tenga "Editar" marcado —el estado normal, medido `disabled === true` tanto en el spec
   * como en el navegador— y un control deshabilitado **no emite**: su `setValue('')` no dispara el
   * `valueChanges` del form, `sigValores` no se actualiza y el efecto **no corre ni una vez** (sonda:
   * cero ejecuciones tras el borrado). El satélite sí está habilitado, y es la única señal fiable.
   *
   * Corolario del punto anterior: si la siembra escribiera con `emitEvent: false`, el `toSignal` del
   * satélite se quedaría en `''` para siempre y el `''` del borrado siguiente sería "el mismo valor"
   * — sin notificación y sin reposición. Las dos decisiones se sostienen mutuamente.
   *
   * ── ⚠ Qué cubre el spec de esto, medido por mutación ──────────────────────────────────────────
   * Cinco mutaciones, cinco casos rojos con nombre:
   *  - `objUi.setValue(strUi)` → `{ emitEvent: false }` → rojo en *"siembra desde task.data aunque el
   *    código del form ya esté borrado"* (`expected '' to be '101'`).
   *  - quitar `this.sigSateliteProducto()` (la dependencia) → rojo en el mismo caso.
   *  - quitar el `setValue` entero → rojo en **dos**: ese caso y *"un producto SFC precargado enciende
   *    la cascada del motivo y no se autoborra"* (`expected '' to be '101::Autos'`).
   *  - quitar la guarda `dicEditables` → rojo en *"el gestor todavía puede vaciar el producto desde el
   *    picker"* (`expected '101' to be ''`).
   *  - cambiar la fuente de `dicOriginales` al form (la circularidad original) → rojo en el caso de la
   *    siembra tras borrado.
   *
   * Lo que el spec **no** puede cubrir es el borrado *espontáneo* del widget: **jsdom no lo
   * reproduce**, porque `lib-input-select-z` no emite su `modelChange` inicial. El caso lo simula a
   * mano escribiendo `''` en el satélite, que es su efecto exacto (verificado en el navegador: la
   * traza real y la del spec coinciden control por control). El síntoma de negocio (0/0/0 → 8/7/7) es
   * verificación de navegador — mismo límite de entorno que el arreglo de `zds-select`, ver el bloque
   * equivalente en su cabecera.
   *
   * El blindaje descartado sí tiene guarda propia: el caso *"el gestor todavía puede vaciar el
   * producto desde el picker"* se pone rojo (`expected '101' to be ''`) al agregar un
   * `if (!strUi) return` en el `valueChanges` de `vincular()`.
   */
  private sembrarPickerDeProducto(): void {
    // Las tres lecturas van primero y SIEMPRE: son las dependencias del efecto, y una lectura
    // después de un `return` no queda registrada. Las dos primeras lo despiertan cuando la colección
    // 16 resuelve y cuando la precarga llena `dicOriginales`.
    const cllOpciones = this.objMatriz.cllInsurance();
    const dicOrig = this.dicOriginales();
    // La tercera: es la que despierta al efecto cuando el widget borra. Va el satélite y **no** el
    // código, aunque sea el código el que cambia de valor — el porqué está en el ⚠ del docstring, y
    // es lo que costó dos intentos.
    this.sigSateliteProducto();

    // ⚠ El código sale de `dicOriginales`, **no** del form ni de `strInsuranceUiValue()`. Ver el
    // docstring: cuando este efecto corre, el borrado ya pasó y el form está en `''`, así que
    // derivar de ahí es circular — la siembra dependería del dato que el borrado destruyó.
    const strCodigo = dicOrig[QD.strSfcProduct] ?? '';
    if (!strCodigo || cllOpciones.length === 0) return;

    const strUi = uiValueFromCode(cllOpciones, strCodigo, dicOrig[`${QD.strSfcProduct}_desc`]);
    if (!strUi) return;

    // ⚠ La fila en edición es la frontera entre "el widget borró" y "el gestor vació", y sin ella el
    // arreglo no puede tener las dos cosas. Los dos casos escriben `''` en el satélite y son
    // indistinguibles por el valor; lo que los separa es que **vaciar exige marcar "Editar" primero**
    // (la fila arranca deshabilitada, ver `sincronizarHabilitacion()`). Así que mientras la fila esté
    // bloqueada un `''` solo puede venir del `updateControl` de `lib-input-select-z` —medido: es el
    // emisor real, con ese nombre en el stack— y se repone; en cuanto el gestor la abre, la siembra se
    // retira y no vuelve a tocar nada.
    if (this.dicEditables()[QD.strSfcProduct]) return;

    const objUi = this.objGrupoEdicion.get(this.nombreUi(QD.strSfcProduct));
    if (!objUi) return;

    // Idempotencia: sin esta guarda el efecto se re-dispararía con cada escritura y quedaría en loop.
    if (objUi.value === strUi) return;

    // ⚠ **Emite a propósito, y las dos consecuencias son necesarias.**
    //
    // 1. Es lo que hace que la siembra sea visible para su propia dependencia. Con `emitEvent: false`
    //    el `toSignal` del satélite se quedaría en `''` para siempre, así que el `''` del borrado
    //    siguiente sería "el mismo valor": sin notificación, sin efecto, sin reposición. Medido con
    //    sonda: el efecto corría **cero** veces tras el borrado.
    // 2. Es lo que repone el código, sin necesidad de escribirlo acá. El suscriptor del satélite en
    //    `vincular()` hace `setValue(codeFromUiValue(strUi))` y `syncProductDesc(strUi)`, o sea el
    //    código **y** el `_desc` — que es exactamente lo que hay que restaurar. Se intentó la versión
    //    con un `objCodigo.setValue(strCodigo, { emitEvent: false })` explícito: ninguna mutación la
    //    ponía roja, ni acá ni en el navegador (medido sobre el caso 33964), porque era código muerto.
    objUi.setValue(strUi);
  }

  /** El municipio depende del departamento, así que su catálogo se recarga cuando ese cambia. */
  private aplicarCascadaMunicipio(): void {
    const strDepto = this.leer(QD.strDepartment);
    // `cargar()` ya cortea solo si el `dependsOn` viene vacío; el `void` descarta la promesa igual
    // que en el resto del proyecto.
    void this.objCatalogos.cargar('city', QD_COLLECTIONS.city, { [QD.strDepartment]: strDepto });
    this.limpiarSiFuera(QD.strCity, this.cllOpcionesDe('city'), this.blnEditable(QD.strDepartment));
  }

  private aplicarCascadaMomento(): void {
    this.limpiarSiFuera(
      QD.strInteraction, this.objMatriz.cllInteraction(), this.blnEditable(QD.strSfcProduct),
    );
  }

  /**
   * Fuera de "Asistencias" el servicio prestado **no aplica**, así que se vacía sin mirar opciones:
   * `limpiarSiFuera()` no alcanza porque con `cllService() === []` corta antes de limpiar, y el
   * valor viejo de un momento anterior se quedaría viajando en la cascada del motivo.
   */
  private aplicarCascadaServicio(): void {
    if (!this.blnCascadaTocada()) return;
    if (!this.objMatriz.blnIsAsistencias()) {
      if (this.leer(QD.strServiceProvided)) this.form().get(QD.strServiceProvided)?.setValue('');
      return;
    }
    this.limpiarSiFuera(QD.strServiceProvided, this.objMatriz.cllService(), true);
  }

  private aplicarCascadaMotivo(): void {
    this.limpiarSiFuera(QD.strSfcReason, this.objMatriz.cllReason(), this.blnCascadaTocada());
  }

  /** Marcar cualquiera de los tres niveles de arriba invalida el motivo elegido. */
  private blnCascadaTocada(): boolean {
    return this.blnEditable(QD.strSfcProduct)
      || this.blnEditable(QD.strInteraction)
      || this.blnEditable(QD.strServiceProvided);
  }

  // ── Habilitación por fila ─────────────────────────────────────────────────────────────────────

  /**
   * Habilita o deshabilita cada control del payload según su checkbox "Editar".
   *
   * ⚠ Va por `control.disable()`/`enable()` y **no** por un `[disabled]` en el template, porque
   * `zds-select` **no se puede deshabilitar**: tiene un input `disable` (sin "d" final) que existe
   * pero no se lee en ninguna parte de la lib, y `disabled` tampoco. React usaba `disabled={!blnEdit}`
   * en cada select del payload; el equivalente real acá es el estado del `FormControl`.
   *
   * **Corolario para la pantalla, que es la parte fácil de olvidar:** un control deshabilitado
   * **desaparece de `form.value`**. O sea que el armado del payload y el `lstCambios()` tienen que
   * leer `form.getRawValue()`, o los campos que el gestor no tocó viajarían vacíos a PM4 — que es
   * peor que el error que la pantalla vino a corregir.
   */
  private sincronizarHabilitacion(): void {
    const objForm = this.form();
    for (const objDef of this.cllCampos) {
      if (!objDef.variable) continue;
      const objControl = objForm.get(objDef.variable);
      if (!objControl) continue;
      const blnEdit = this.blnEditable(objDef.variable);
      if (blnEdit === objControl.enabled) continue;
      // `emitEvent: false`: esto corre dentro de un efecto que depende de `sigValores`, y ese signal
      // se alimenta de `valueChanges` — emitir reentraría en el mismo efecto.
      if (blnEdit) objControl.enable({ emitEvent: false });
      else objControl.disable({ emitEvent: false });
    }
  }

  // ── El checkbox "Editar" ──────────────────────────────────────────────────────────────────────

  /** Escribe el flag de edición y avisa al padre. Idempotente: no reemite si no cambió. */
  private marcarEditable(in_strVar: string, in_blnOn: boolean): void {
    if (this.blnEditable(in_strVar) === in_blnOn) return;
    this.dicEditables.update((in_dic) => ({ ...in_dic, [in_strVar]: in_blnOn }));
    this.objGrupoEdicion.get(this.nombreEdicion(in_strVar))?.setValue(in_blnOn, { emitEvent: false });
    this.editableCambiado.emit({ variable: in_strVar, activo: in_blnOn });
  }

  /**
   * Handler del checkbox de una fila.
   *
   * Al **desmarcar** se restaura el valor original: "sin marcar" significa "sin tocar", y dejar un
   * valor a medio editar en un campo bloqueado lo haría viajar a la SFC sin que nadie lo revisara.
   * Al **marcar** se desbloquean las filas aguas abajo (`unlocks`), porque cambiar el producto
   * invalida el momento, el servicio y el motivo, y quedarían bloqueados con datos incoherentes.
   */
  protected alCambiarEditable(in_objDef: PayloadFieldDef, in_genOn: unknown): void {
    const strVar = in_objDef.variable as string;
    const blnOn = !!in_genOn;
    this.marcarEditable(strVar, blnOn);
    if (!blnOn) this.form().get(strVar)?.setValue(this.strOriginalDe(strVar));
    if (blnOn) for (const strAguasAbajo of in_objDef.unlocks ?? []) this.marcarEditable(strAguasAbajo, true);
  }

  /** Nombre del control satélite del checkbox de una variable. */
  protected nombreEdicion(in_strVar: string): string {
    return `edit-${in_strVar}`;
  }

  /** Nombre del control satélite que guarda el value de UI desambiguado de una variable. */
  protected nombreUi(in_strVar: string): string {
    return `ui-${in_strVar}`;
  }

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  protected leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }

  protected blnEditable(in_strVar: string): boolean {
    return !!this.dicEditables()[in_strVar];
  }

  // ── Catálogos planos ──────────────────────────────────────────────────────────────────────────

  /**
   * Las opciones de un catálogo plano, por su clave del descriptor.
   *
   * Se llama desde la plantilla, así que **no puede disparar red**: `CatalogosService.de()` está
   * diseñado justo para eso (obtener y cargar están separados). La carga la hace `cargarCatalogos()`.
   */
  protected cllOpcionesDe(in_strClave: string | undefined): readonly CollectionOption[] {
    if (!in_strClave) return [];
    return this.objCatalogos.de(in_strClave).options();
  }

  // ── Cascada de la matriz ──────────────────────────────────────────────────────────────────────

  /** Las opciones de una fila `select`, resolviendo la cascada cuando corresponde. */
  protected cllOpcionesDeFila(in_objDef: PayloadFieldDef): readonly CollectionOption[] {
    if (in_objDef.variable === QD.strSfcProduct) return this.objMatriz.cllInsuranceUi();
    if (in_objDef.cascade) {
      if (in_objDef.variable === QD.strInteraction) return this.objMatriz.cllInteraction();
      if (in_objDef.variable === QD.strServiceProvided) return this.objMatriz.cllService();
      return this.objMatriz.cllReason();
    }
    return this.cllOpcionesDe(in_objDef.collection);
  }

  /**
   * Descripción legible del valor actual, para el resumen de la fila.
   *
   * ⚠ Momento y servicio devuelven el valor **crudo**: sus columnas de la matriz guardan el TEXTO, no
   * un código, así que `descOf()` resolvería una etiqueta contra opciones cuyo `value === label` — el
   * mismo resultado por un camino más largo, y engañoso de leer. Ver `cllService` en
   * `MatrizMotivosService`.
   */
  protected descActual(in_objDef: PayloadFieldDef): string {
    const strCodigo = this.leer(in_objDef.variable as string);
    if (in_objDef.variable === QD.strSfcProduct) return descOf(this.objMatriz.cllInsurance(), strCodigo);
    if (in_objDef.cascade) {
      return in_objDef.variable === QD.strSfcReason
        ? descOf(this.objMatriz.cllReason(), strCodigo)
        : (strCodigo || '—');
    }
    if (in_objDef.control === 'select') return descOf(this.cllOpcionesDe(in_objDef.collection), strCodigo);
    return strCodigo || '—';
  }

  // ── Estado por fila, para los dos badges y el resumen ─────────────────────────────────────────

  protected blnModificado(in_strVar: string): boolean {
    return this.leer(in_strVar) !== (this.dicOriginales()[in_strVar] ?? '');
  }

  protected blnSenalado(in_objDef: PayloadFieldDef, in_strVar: string): boolean {
    return esSenalado(this.strSenalado(), in_objDef, in_strVar);
  }

  protected strOriginalDe(in_strVar: string): string {
    return this.dicOriginales()[in_strVar] ?? '';
  }

  /** Valor del payload enviado para una fila de constante del CORE (las tres sin variable). */
  protected strDelPayload(in_strClave: string): string {
    return fmtPayload(this.objPayloadEnviado()?.[in_strClave]);
  }

  protected readonly OPTIONS_SI_NO = OPTIONS_SI_NO;

  /**
   * `QD` expuesto a la plantilla: la rama del picker de producto se decide comparando contra
   * `QD.strSfcProduct`, y escribir el literal `'qd_strSfcProduct'` en el HTML rompería la regla 1
   * (los `qd_*` son contrato con PM4 y viven en un solo lugar).
   */
  protected readonly QD = QD;
}
