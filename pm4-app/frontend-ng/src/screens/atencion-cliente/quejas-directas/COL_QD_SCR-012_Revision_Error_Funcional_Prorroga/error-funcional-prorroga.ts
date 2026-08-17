import { Component, computed, inject, type OnDestroy, type OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionBarComponent } from '../../../../components/action-bar';
import { ZdsDate } from '../../../../components/fields/zds-date';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { ZdsTextarea } from '../../../../components/fields/zds-textarea';
import {
  ZrAlertInline,
  ZrButton,
  ZrLoader,
} from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { CollectionService } from '../../../../core/collection.service';
import { scrollToFirstError } from '../../../../core/scroll-to-first-error';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { TaskService } from '../../../../core/task.service';
import {
  type AccionErrorFuncionalProrroga,
  QD,
  QD_COLLECTIONS,
  SCR012_DEFAULTS,
} from '../fields/fields';

/** FLD-207 · el mismo tope que el contador visual del DS y el validador. Ver `strErrorJustif`. */
const INT_MAX_TEXTO = 2000;

/**
 * FLD-206 · el contador de prórroga viaja como string pero solo admite dígitos.
 *
 * ⚠ Es una restricción **de campo**, no una regla del anexo: SCR-012 tiene exactamente **una**
 * (`RUL-012-01`, la fecha posterior a hoy). Un borrador de este archivo la citaba como `RUL-012-02`
 * y ese identificador **no existe** en `insumos/.../screens/SCR-012.md` — queda anotado porque un
 * ID inventado en un comentario contamina la trazabilidad del `DOCUMENTACION` río abajo.
 */
const RGX_SOLO_DIGITOS = /^\d+$/;

/**
 * Fecha de hoy en ISO `YYYY-MM-DD`, que es el formato del modelo de `ZdsDate` y el que viaja a PM4.
 *
 * ⚠ **Es UTC, no Bogotá**, igual que el `hoyISO()` de la fachada React que porta. La diferencia se
 * manifiesta entre las 19:00 y las 23:59 de Bogotá, cuando UTC ya pasó de día: en esa franja "hoy"
 * para esta función es el día siguiente al del reloj del usuario, así que RUL-012-01 acepta una fecha
 * que el usuario lee como *hoy*. Se porta el comportamiento tal cual **a propósito** — corregirlo sería
 * un cambio funcional de contrabando (la regla de la migración), y además el script del BPM que valida
 * del otro lado usa la misma referencia. Queda anotado como divergencia conocida, no como defecto de
 * este archivo.
 */
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * SCR-012 · Corrección Error Funcional Prórroga — task **SP4-T06** del proceso SP4.
 *
 * Port de `frontend/src/screens/.../ErrorFuncionalProrroga.tsx`. Es la pantalla donde el gestor
 * corrige los datos de una solicitud de prórroga que Smart Supervision rechazó por **error funcional**
 * (a diferencia de SCR-011, que atiende el error **técnico** de la misma solicitud), y la reenvía o la
 * cancela. El caso vuelve a SP4-T01 en los dos casos; lo que cambia es el `qd_strAction`.
 *
 * ── Las tres cosas que esta pantalla estrena en el proyecto ───────────────────────────────────────
 *
 * **1. `ZdsDate` (FLD-205) y su pérdida de paridad heredada.** Es el primer uso real del calendario
 * del DS. `lib-input-date-z` **no tiene `helpText`** (verificado, ver el docstring de `zds-date.ts`),
 * así que un `[error]` en este campo pinta el borde en rojo y **el mensaje nunca se muestra**. React sí
 * lo mostraba. No se compensa inventando un texto al lado del campo: MSG-012-01 ya es una alerta
 * separada del anexo y cubre la mitad visible para el usuario. Por eso `strErrorFecha()` existe (el
 * pintado del borde depende de él) pero su string no llega a ningún lado — y eso está aseverado en el
 * spec, para que nadie "arregle" el campo agregando un `helpText` que el DS descarta en silencio.
 *
 * **2. `CollectionService` + `sincronizarDesc()` en una pantalla portada** (FLD-204). Dos detalles de
 * uso que no son obvios y que el spec fija:
 *  - El servicio **no** es `providedIn: 'root'`: se provee acá, una instancia por select. Con un
 *    singleton, la próxima pantalla con dos colecciones se pisaría las opciones a sí misma.
 *  - `sincronizarDesc()` va en el **constructor**, no en `ngOnInit`: hace `inject(DestroyRef)` para su
 *    `takeUntilDestroyed()`, y fuera de un contexto de inyección eso tira `NG0203`. Su tercer
 *    parámetro es una **función** y no el array porque cuando se llama la colección todavía no cargó;
 *    pasar `objColeccion.options()` congelaría `[]` para siempre.
 *
 * **3. RUL-012-01 con su borde.** `blnFechaValida` compara **estrictamente mayor** contra hoy: la
 * regla es *"posterior"*, no *"hoy o posterior"*. El caso de la fecha de hoy es el que delata un `>=`
 * puesto donde va un `>`, y por eso tiene un `it()` propio en el spec en vez de confiarse al caso de la
 * fecha pasada — que pasa igual con las dos implementaciones.
 *
 * ── Por qué `cancelar()` NO valida nada, y por qué eso es la mitad importante del archivo ────────
 * ACT-012-02 es la salida de excepción: cancelar la prórroga tiene que funcionar **con los campos de
 * S2 vacíos**, porque el escenario real es justamente "no se puede corregir". Si alguien le metiera la
 * guarda de `reenviar()` —que es lo que parece correcto leyendo solo RUL-012-01— la salida quedaría
 * inalcanzable con la suite en verde. Consecuencia directa: los cuatro campos de S2 llevan
 * `Validators.required` **igual** (a diferencia de SCR-011, donde no lo llevan), y eso es válido acá
 * porque `cancelar()` no mira `form.valid` en ningún momento: manda el PUT y listo.
 */
@Component({
  selector: 'app-error-funcional-prorroga',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    ActionBarComponent,
    ZdsInput,
    ZdsTextarea,
    ZdsSelect,
    ZdsDate,
    ZrAlertInline,
    ZrButton,
    ZrLoader,
  ],
  // Una instancia de `CollectionService` para el select de FLD-204. Ver el punto 2 de la cabecera.
  providers: [CollectionService],
  templateUrl: './error-funcional-prorroga.html',
})
export class ErrorFuncionalProrroga implements OnInit, OnDestroy {
  private readonly objTareas = inject(TaskService);
  private readonly objMotivos = inject(CollectionService);

  readonly blnCargando = this.objTareas.cargando;
  readonly strError = this.objTareas.error;
  readonly blnEnviando = this.objTareas.enviando;

  /** Opciones de FLD-204 (`CAT-MOTIVO-PRORR`). `label` lo recoge el `??` de `ZdsSelect`. */
  readonly cllMotivos = this.objMotivos.options;

  /**
   * Va al `[loading]` del select, que lo traduce a "Cargando opciones..." como help-text. **No**
   * deshabilita el campo: `lib-input-select-z` no lo permite (su input `disable` está muerto), así que
   * el usuario puede abrir el desplegable mientras carga y verlo vacío. Es una limitación del DS que la
   * fachada documenta y no oculta; el texto es la única afordancia disponible.
   */
  readonly blnCargandoMotivos = this.objMotivos.cargando;

  /**
   * Hoy, congelado al construir la pantalla. **No es un `computed`** a propósito: el `[min]` del
   * calendario y la comparación de RUL-012-01 tienen que usar el **mismo** valor durante toda la
   * sesión del formulario. Si se recalculara, un formulario abierto a las 23:59 cambiaría de referencia
   * a medianoche y una fecha que era válida al elegirla dejaría de serlo al enviar, sin que el usuario
   * tocara nada.
   */
  readonly strHoy = hoyISO();

  readonly form = new FormGroup({
    // ── S1 · Panel de Error (SEC-039) — los cuatro readOnly, sin validadores: son datos que el
    //    script de Smart Supervision dejó en el caso, no entrada del usuario.
    [QD.strExtErrorCode]: new FormControl(''),
    [QD.strExtAffectedField]: new FormControl(''),
    [QD.strExtCurrentAttempt]: new FormControl(''),
    [QD.strExtErrorMessage]: new FormControl(''),

    // ── S2 · Campos a Corregir (SEC-040) — los cuatro obligatorios (FLD-204…207).
    [QD.strExtensionReason]: new FormControl('', [Validators.required]),
    [QD.strNewDeadline]: new FormControl('', [Validators.required]),
    [QD.strExtensionCounter]: new FormControl('', [
      Validators.required,
      Validators.pattern(RGX_SOLO_DIGITOS),
    ]),
    [QD.strExtensionJustif]: new FormControl('', [
      Validators.required,
      Validators.maxLength(INT_MAX_TEXTO),
    ]),
  });

  /**
   * Espejo en signal del valor del form, para que los `computed` de abajo se recalculen.
   *
   * Se siembra con `getRawValue()` y **no** con `{}`: los computeds se leen en el primer render, antes
   * de que ningún `valueChanges` haya emitido, así que con `{}` la primera pasada evaluaría todo como
   * vacío. Es el mismo patrón de las tres pantallas ya portadas.
   */
  private readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());

  private readonly objSuscripcion = this.form.valueChanges.subscribe(() => {
    this.sigValores.set(this.form.getRawValue());
  });

  /** Se levanta al primer intento de reenvío. Hasta entonces no se pinta ningún mensaje de error. */
  readonly blnIntentoEnvio = signal(false);

  /** FLD-203 · el intento acumulado que la alerta de S1 nombra, si vino en el caso. */
  readonly strIntentoActual = computed(() =>
    String(this.sigValores()[QD.strExtCurrentAttempt] ?? ''),
  );

  private readonly strFechaElegida = computed(() =>
    String(this.sigValores()[QD.strNewDeadline] ?? ''),
  );

  /**
   * **RUL-012-01 (🔴 BLOQUEA)** · la nueva fecha límite tiene que ser **posterior** a hoy.
   *
   * El `>` es estricto y es el corazón de la regla: la fecha de **hoy también bloquea**. Comparar
   * strings ISO `YYYY-MM-DD` con `>` es correcto porque el formato es lexicográficamente ordenable —
   * no hace falta parsear a `Date`, y no parsear evita de paso el desfase de zona horaria que un
   * `new Date('2026-08-16')` introduce (lo interpreta como medianoche **UTC**).
   */
  readonly blnFechaValida = computed(() => {
    const strFecha = this.strFechaElegida();
    return !!strFecha && strFecha > this.strHoy;
  });

  /**
   * **MSG-012-01** · la alerta condicional del anexo: aparece cuando hay una fecha elegida y no cumple
   * RUL-012-01. Con el campo vacío **no** se muestra (el vacío es "todavía no eligió", no "eligió mal").
   */
  readonly blnMostrarAvisoFecha = computed(() => !!this.strFechaElegida() && !this.blnFechaValida());

  /**
   * ACT-012-01 · el reenvío exige los cuatro campos de S2 **y** RUL-012-01.
   *
   * ⚠ **No se puede escribir `this.form.valid && this.blnFechaValida()`**, y el defecto es invisible:
   * `valid` es un *getter* de `AbstractControl`, no un signal, así que leerlo dentro de un `computed`
   * no crea ninguna dependencia reactiva. El computed quedaría con una sola dependencia real
   * (`blnFechaValida` → `sigValores`) y devolvería el valor cacheado de la primera evaluación — la del
   * primer render, cuando el form está vacío y por lo tanto inválido. Medido: tras la precarga se
   * llegaba a `form.valid === true`, `blnFechaValida() === true` y **`blnPuedeReenviar() === false`**,
   * con los `errors` de los 9 controles en `null`. Consecuencia en la pantalla real: el botón
   * "Reenviar Prórroga ▶" no se habilita nunca y `reenviar()` se va por su rama de early-return para
   * siempre, o sea que la acción principal queda inalcanzable. SCR-004 y SCR-011 ya traen la
   * advertencia en el comentario de su propio gate; esta pantalla es la que la aprendió a los golpes.
   *
   * La validez se deriva entonces de `sigValores()`, que **sí** es un signal (lo alimenta la
   * suscripción a `valueChanges`). Los tres chequeos espejan los `Validators` declarados arriba en el
   * `FormGroup`, que siguen siendo la obligatoriedad ejecutable — esto es el gate de la afordancia,
   * no un segundo juego de reglas. El `trim()` va más allá del `Validators.required` a propósito, por
   * el mismo motivo que en SCR-011: `required` solo rechaza `''` y `null`, así que un textarea con
   * espacios dejaría reenviar sin justificación.
   */
  readonly blnPuedeReenviar = computed(() => {
    const dicValores = this.sigValores();
    const strDe = (in_strCampo: string): string => String(dicValores[in_strCampo] ?? '').trim();

    const strContador = strDe(QD.strExtensionCounter);
    const strJustif = strDe(QD.strExtensionJustif);

    return (
      !!strDe(QD.strExtensionReason) &&
      RGX_SOLO_DIGITOS.test(strContador) &&
      !!strJustif &&
      strJustif.length <= INT_MAX_TEXTO &&
      this.blnFechaValida()
    );
  });

  readonly strErrorMotivo = computed(() => this.mensajeDeError(QD.strExtensionReason));
  readonly strErrorContador = computed(() => this.mensajeDeError(QD.strExtensionCounter));
  readonly strErrorJustif = computed(() => this.mensajeDeError(QD.strExtensionJustif));

  /**
   * Mensaje del campo de fecha. **Su string no se muestra en ninguna parte** — ver el punto 1 de la
   * cabecera: `lib-input-date-z` no tiene `helpText`. Se calcula igualmente porque el `[error]` del
   * wrapper es lo que pinta el borde en rojo, que sí se ve. El texto visible lo aporta MSG-012-01.
   */
  readonly strErrorFecha = computed(() => {
    if (!this.blnIntentoEnvio()) return '';
    if (!this.strFechaElegida()) return 'Campo requerido';
    if (!this.blnFechaValida()) return 'La fecha debe ser posterior a hoy';
    return '';
  });

  constructor() {
    // ⚠ Va acá y no en `ngOnInit`: `sincronizarDesc()` hace `inject(DestroyRef)`. Ver el punto 2 de la
    // cabecera. El tercer argumento es una **función** porque la colección todavía no cargó.
    sincronizarDesc(this.form, QD.strExtensionReason, () => this.cllMotivos());
  }

  async ngOnInit(): Promise<void> {
    // Las dos peticiones salen sin encadenarse: el select puede pintar sus opciones mientras la tarea
    // viaja, y la precarga no necesita las opciones (guarda el **código**, no la etiqueta).
    void this.objMotivos.cargar(QD_COLLECTIONS.extensionReason);

    await this.objTareas.cargar();
    this.precargar();
  }

  ngOnDestroy(): void {
    this.objSuscripcion.unsubscribe();
  }

  /**
   * Vuelca `task.data` al form, **filtrando por las claves que el form declara**.
   *
   * El filtro no es defensivo: `task.data` trae el caso **entero** (decenas de `qd_*` de las pantallas
   * anteriores del proceso), y un `patchValue` con claves que el `FormGroup` no declara las descarta en
   * silencio — pero además dejaría pasar cualquier renombre futuro sin que nada se note. Iterar sobre
   * `this.form.controls` deja explícito que esta pantalla solo toca sus 8 campos.
   */
  private precargar(): void {
    const objTarea = this.objTareas.tarea();
    if (!objTarea?.data) return;

    const dicDatos = objTarea.data as Record<string, unknown>;
    const dicParche: Record<string, unknown> = {};
    for (const strClave of Object.keys(this.form.controls)) {
      if (strClave in dicDatos) dicParche[strClave] = dicDatos[strClave];
    }

    this.form.patchValue({ ...SCR012_DEFAULTS, ...dicParche });
  }

  /**
   * Mensaje de un campo de S2. Solo habla después del primer intento de envío — antes, un formulario
   * recién montado con los obligatorios vacíos se pintaría entero en rojo sin que el usuario hiciera
   * nada.
   */
  private mensajeDeError(in_strCampo: string): string {
    if (!this.blnIntentoEnvio()) return '';

    const objControl = this.form.get(in_strCampo);
    if (!objControl) return '';

    if (objControl.hasError('maxlength')) return `Máximo ${INT_MAX_TEXTO} caracteres`;
    if (objControl.hasError('pattern')) return 'Solo dígitos';
    if (objControl.hasError('required')) return 'Campo requerido';
    return '';
  }

  /** ACT-012-01 · reenviar la prórroga corregida. Valida RUL-012-01 y los cuatro campos de S2. */
  reenviar(): void {
    this.blnIntentoEnvio.set(true);

    if (!this.blnPuedeReenviar()) {
      this.form.markAllAsTouched();
      scrollToFirstError(this.form);
      return;
    }

    void this.enviar('REENVIAR');
  }

  /**
   * ACT-012-02 · cancelar la prórroga. **No valida nada, y eso es el contrato** — ver el bloque de la
   * cabecera. Es la salida de excepción y el escenario real es tener S2 sin completar.
   */
  cancelar(): void {
    void this.enviar('CANCELAR');
  }

  private async enviar(in_strAccion: AccionErrorFuncionalProrroga): Promise<void> {
    const dicPayload: Record<string, unknown> = {
      ...this.form.getRawValue(),
      [QD.strAction]: in_strAccion,
    };

    try {
      await this.objTareas.completarTarea(dicPayload);
    } catch (excError) {
      // El cartel de error lo pinta `strError()` desde el servicio; acá solo queda el rastro para dev.
      console.error('[ErrorFuncionalProrroga] Error al enviar:', excError);
    }
  }
}
