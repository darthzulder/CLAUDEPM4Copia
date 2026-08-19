import {
  afterNextRender,
  ApplicationRef,
  Directive,
  inject,
  Injector,
  input,
  isDevMode,
  signal,
  type OnInit,
  type WritableSignal,
} from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  NgControl,
  Validators,
  type ControlValueAccessor,
} from '@angular/forms';

/**
 * Base de los wrappers CVA sobre `lib-*-z`. Traduce Reactive Forms ↔ el par `model`/`group` que
 * usan los componentes de `@zurich-col/lib-zurich`, y neutraliza sus gotchas para que ninguna
 * pantalla los vea.
 *
 * ── Por qué existe esta capa ───────────────────────────────────────────────────────────────
 * `lib-*-z` **no** implementa `ControlValueAccessor` (0 ocurrencias de `NG_VALUE_ACCESSOR` en su
 * `fesm2022/*.mjs`), así que `formControlName` no funciona sobre uno directamente. En su lugar cada
 * campo pide `@Input() model` + `@Output() modelChange` + `@Input() group: FormGroup`, y **genera
 * su propio nombre de control** con `UtilService.getControlName()` → `name-<ts><ms>-<n>`.
 *
 * El resquicio que hace viable la fachada (verificado en runtime en el gate 0, no leído):
 * `generateControl()` solo inventa ese nombre si el control **no existe ya** en el group. Así que
 * si acá se pre-crea el control con el `name` real (`qd_*`) antes del `ngOnInit` del hijo, la lib
 * lo **adopta** — y desde la pantalla se escribe `formControlName="qd_strChannel"` como en
 * cualquier form idiomático de Angular.
 *
 * ── `writeValue` escribe `model` y fuerza el barrido — las dos cosas ───────────────────────
 * El `updateControl()` de la lib hace `group.get(name).setValue(this.model)` dentro de un
 * `setTimeout`, detrás de un `if (changes.model)`. O sea que **la autoridad es `model`**: cuando
 * cambia, la lib sincroniza el control sola.
 *
 * El valor llega bien igual — eso está aseverado y **no** es lo que se rompe. Lo que necesita el
 * barrido forzado es la **validez**: el validador que la lib compone lee `this.model` **del hijo**, y
 * si el binding no le llegó todavía marca `errorRequired` sobre un campo que sí tiene dato. Se corrige
 * solo dos macrotasks después, pero la pantalla lee `form.valid` mucho antes. Medido en la pantalla
 * del gate 2 — la traza está en el comentario de `writeValue`, y el guardián en
 * [precarga-patchvalue.spec.ts](./precarga-patchvalue.spec.ts).
 *
 * ── Corrección: agregar un `setValue` acá NO produce una carrera (se intentó probar y no existe) ─
 * Una versión anterior de este comentario decía que un `setValue` extra en `writeValue` haría que
 * "el orden de los timers decidiera el valor final". **Es falso**, y vale dejar escrito por qué,
 * porque suena plausible y volvería a escribirse.
 *
 * La mutación del gate 2 lo desmintió: se agregó
 * `this.grupo.get(this.name())?.setValue(in_valor)` a `writeValue` y la suite quedó **verde**. Se
 * buscó el escenario que lo pusiera rojo en tres formas distintas —mismo valor, valores divergentes
 * en el mismo tick, y escritura del usuario intercalada entre el `writeValue` y el vencimiento del
 * timer— y **ninguna** distinguió el código correcto del mutado: valor final idéntico en los tres.
 *
 * La razón está en el `.mjs`: el `setTimeout` no captura el valor al agendarse, sino que
 * `updateControl()` lee `this.model` **al vencer**. Por lo tanto el timer nunca puede escribir un
 * valor obsoleto — escribe el `model` vigente al final del tick. El `setValue` extra es
 * **redundante, no destructivo**.
 *
 * Se mantiene la línea única igual, por dos razones que sí se sostienen: un solo escritor es más
 * simple de razonar, y un `setValue` desde `writeValue` emitiría un `valueChanges` que la pantalla
 * no pidió (`setValue` sin `emitEvent:false` dispara los watchers, y en este proyecto los watchers
 * ejecutan scripts PM4). Pero **no hay test que lo guarde**, y no se escribe uno de adorno: si
 * alguien agrega ese `setValue`, la suite no se va a poner roja. Lo que sí está aseverado, en
 * [colision-escritores.spec.ts](./colision-escritores.spec.ts), es el contrato de la lib del que
 * depende este diseño: que escribir `model` propaga al control, y que `model` gana ante conflicto.
 */
@Directive()
export abstract class CampoBase<T> implements ControlValueAccessor, OnInit {
  /**
   * Nombre real del campo en PM4 (`qd_*`). Es contrato con el proceso (regla 1 de CLAUDE.md), y
   * además la clave con la que la lib adopta el control en vez de generar un nombre aleatorio.
   */
  readonly name = input.required<string>();

  readonly label = input<string>('');

  /**
   * Marca visual de obligatoriedad: el **asterisco del rótulo**, nada más. La obligatoriedad que
   * *invalida* se declara donde siempre — `Validators.required` en el `FormControl` de la pantalla.
   *
   * ── ⚠ Por qué NO se llama `required`, y no es cosmético ──────────────────────────────────────
   * Porque `RequiredValidator`, el directivo **estándar de Angular**, tiene selector
   * `:not([type=checkbox])[required][formControlName]` (más las variantes `[formControl]`/`[ngModel]`).
   * Un input llamado `required` obliga a la pantalla a escribir
   *
   *     <zds-textarea formControlName="qd_strRootCause" [required]="true" />
   *
   * y eso es **exactamente** el selector: Angular engancha su `RequiredValidator` en el elemento de
   * la pantalla y le suma `{required: true}` al control — un validador que la pantalla nunca declaró.
   * El asterisco y la validación quedan pegados sin que nadie lo haya pedido.
   *
   * Nótese dónde vive el defecto: **en la plantilla de la pantalla**, no en la lib ni en el `[group]`.
   * Cambiar el nombre del input lo cierra **por estructura** — sin el atributo literal `required` el
   * selector no puede matchear— en vez de por disciplina de quien escribe la pantalla. Es la única de
   * las opciones consideradas que no depende de que nadie se olvide: neutralizar el validador después
   * de montado sería pelear contra un directivo que sigue enganchado, y derivar el asterisco de
   * `hasValidator(Validators.required)` le quitaría el asterisco a los campos que lo necesitan **sin**
   * validador (la ex SCR-011 escalaba con los campos vacíos a propósito; el caso sigue siendo posible
   * y por eso la decisión no cambia).
   *
   * `zds-required.spec.ts` es la guarda: se pone roja si un wrapper vuelve a aceptar `required`.
   *
   * ⚠ El `[required]` que los wrappers ponen **adentro**, sobre el `lib-*-z`/`za-*`, sí va y es
   * correcto: es el input del DS que pinta el asterisco, y ahí no hay `formControlName` en el mismo
   * elemento, así que el selector de Angular no matchea.
   */
  readonly obligatorio = input(false);
  readonly readOnly = input(false);
  readonly helpText = input<string>('');
  readonly placeholder = input<string>('');

  /**
   * NO hay input `maxLength` acá a propósito — pero el motivo es **más angosto** de lo que este
   * comentario decía antes, y la diferencia costó los tres contadores de la SCR-008.
   *
   * Lo que sigue siendo cierto es sobre **`lib-input-text-z`**: su input homónimo está tipado
   * `boolean` (el largo iría en `maxNumber`) y ninguno de los dos llega al `za-text-input` — su
   * template no los pasa y la única referencia en la clase está comentada. Ahí sí es un prop muerto.
   *
   * ⚠ **Lo que era falso: la generalización a todos los campos.** Este comentario afirmaba que
   * exponer `maxLength` "no limita nada", sin acotarlo al input de texto, y de ahí se leyó que en
   * cualquier wrapper sería un falso verde. En `lib-textarea-z` **no** es así: su template hace
   * `[attr.max-length]="maxLength ? maxNumber : ''"`, y aunque ese binding de atributo muere antes
   * del `z-textarea` (bug de la lib), [`zds-textarea`](./zds-textarea.ts) lo **neutraliza** reponiendo
   * el atributo con un `afterRenderEffect`. Así que ese wrapper sí expone `maxLength`, y funciona: el
   * DS pinta el contador (`9/5000`).
   *
   * Por eso el input vive en `ZdsTextarea` y no acá: es un contrato de **un** wrapper, no de la base.
   * Y sigue habiendo dos contratos distintos, que no se sustituyen — el límite **efectivo** es
   * `Validators.maxLength(n)` en el control (lo único que invalida), y el **contador visual** es el
   * `[maxLength]` del template. Aseverar uno no detecta la falta del otro.
   */

  /**
   * Mensaje de error explícito. Cuando viene, gobierna sobre el estado del control — es el caso de
   * `setError()` de la fachada React (validaciones de servidor, p.ej. "el caso ya existe").
   */
  readonly error = input<string>('');

  /** Espejo local de lo que el `lib-*-z` recibe por `[model]`. Único destino de `writeValue`. */
  readonly model: WritableSignal<T | null> = signal<T | null>(null);

  /** `true` mientras el CVA esté deshabilitado por `control.disable()`. */
  readonly deshabilitado = signal(false);

  /**
   * Group de respaldo para el uso **suelto** (sin `formControlName`): el `lib-*-z` exige un
   * `FormGroup` donde registrarse, así que si no hay padre se le da uno propio.
   *
   * No se usa cuando el wrapper vive dentro de un form — ver `grupo`.
   */
  private objGrupoPropio: FormGroup<Record<string, FormControl>> | null = null;

  /**
   * El `NgControl` NO se puede inyectar en el constructor: este componente **es** el
   * `NG_VALUE_ACCESSOR` del `NgControl`, así que pedírselo mientras se construye cierra el ciclo y
   * Angular tira `NG0200: Circular dependency detected`. (Pasó de verdad acá, con los 9 specs en
   * rojo a la vez.)
   *
   * Se resuelve con el `Injector` —que no tiene esa dependencia— y se busca el `NgControl` recién en
   * `ngOnInit`, cuando la directiva ya terminó de instanciarse. Es el patrón estándar para un CVA
   * que además necesita leer su propio control (acá hace falta para `invalid && touched`).
   */
  private readonly objInjector = inject(Injector);

  /** Para el barrido sincrónico de `writeValue` — ver el comentario de ese método. */
  private readonly objAppRef = inject(ApplicationRef);

  protected ngControl: NgControl | null = null;

  /**
   * Callbacks del CVA. Arrancan como no-ops **a propósito**, no por descuido: Angular las provee
   * recién en `registerOnChange`/`registerOnTouched`, que corren después del constructor, y el
   * wrapper puede usarse suelto (sin `formControlName`) — ahí nunca se registran. Sin este valor
   * inicial, un `(modelChange)` que llegue antes del registro, o en un uso sin form, explotaría con
   * "is not a function". La alternativa (`?.()` en cada llamada) mueve la guarda a tres puntos de
   * uso en vez de tenerla en uno.
   *
   * Esto SÍ tiene test, y con mutación verificada: el spec "un modelChange sin `formControlName` no
   * tira" de [zds-input.spec.ts](./zds-input.spec.ts). Se puso **rojo** al quitar estos dos
   * inicializadores (`expected [ Array(1) ] to deeply equal []`) y verde al reponerlos. Asevera
   * sobre un `ErrorHandler` inyectado, no sobre estado, porque Angular **se come** la excepción que
   * tira un handler de `@Output()`: un `try/catch` alrededor del `emit()` no la ve. O sea que sin
   * estos no-ops la rotura sería invisible en producción salvo por la consola.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- ver el comentario de arriba
  private fnAlCambiar: (in_valor: T | null) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- idem
  private fnAlTocar: () => void = () => {};

  /**
   * Solo para la guarda de dev: el `ControlContainer` del ancestro, que es lo que provee
   * `[formGroup]`/`[formGroupName]`/`ngForm`. `{ optional: true }` porque el uso suelto —sin ningún
   * form alrededor— es legítimo y ahí no hay nada que inyectar.
   *
   * ⚠ Se pregunta por **DI y no por el DOM**, y la diferencia es la que hizo que la primera versión
   * de esta guarda fuera inútil. Ver el bloque de `guardarFormControlNameEnDev()`.
   */
  private readonly objContenedorAncestro = inject(ControlContainer, { optional: true });

  constructor() {
    this.guardarFormControlNameEnDev();
  }

  ngOnInit(): void {
    this.ngControl = this.objInjector.get(NgControl, null, { optional: true, self: true });
  }

  /**
   * ⚠ **La red que atrapa el `formControlName` olvidado — en dev, en el navegador y en cualquier spec
   * que monte la pantalla.** Es la guarda cross-pantalla de la que nace todo este bloque.
   *
   * ── Por qué existe: tres defectos del mismo tipo, ninguno visto por el spec de su pantalla ──────
   * La SCR-008 nació con `[formGroup]` y `name="qd_*"` en sus 9 `zds-*` y **sin `formControlName` en
   * ninguno**. Los 9 campos quedaron muertos —React pintaba 8 de 9 con datos reales, Angular los 9
   * vacíos— y los 10 casos de su spec estaban **verdes**, porque todos empujaban el `FormGroup` a mano
   * y ninguno preguntaba si el valor llegaba al componente.
   *
   * La lección que obligó a subir la guarda acá: **un spec por pantalla asevera lo que la pantalla
   * declara; no puede aseverar lo que la pantalla olvidó declarar.** Sumar un caso más por pantalla no
   * cierra eso — lo escribe la misma persona que acaba de olvidar el binding, en el mismo momento.
   * Vive en la fachada porque acá la condición es **universal**: todo `zds-*` dentro de un form
   * necesita `formControlName`, sin excepción, así que se puede decidir sin saber nada de la pantalla.
   *
   * ── Por qué `throw` y no `console.error` ───────────────────────────────────────────────────────
   * Un `console.error` no pone rojo ningún spec, y entonces no sirve para este propósito: el defecto
   * volvería a viajar con la suite en verde, que es exactamente lo que pasó. El `throw` cambia un
   * campo **silenciosamente muerto** por un fallo ruidoso y nombrado — la operación correcta, porque
   * de los dos el silencioso es el que llega al navegador de un usuario.
   *
   * Va detrás de `isDevMode()`: en producción no rompe una pantalla por un binding faltante (el
   * `ng build` de prod lo elimina del bundle). O sea que la guarda es un detector de errores de
   * autor, no una validación de runtime.
   *
   * ── Por qué `afterNextRender` y no `ngOnInit` ──────────────────────────────────────────────────
   * `formControlName` engancha el control en el `ngOnChanges` de **su** directiva, que corre después
   * del `ngOnInit` de este componente — es el mismo desfase que ya documenta el getter `grupo`, y por
   * el que ahí la resolución es perezosa. Preguntar en `ngOnInit` daría un falso positivo en **todos**
   * los campos, incluidos los correctos. `afterNextRender` corre una sola vez, después del primer
   * render, cuando el `NgControl` ya está resuelto y el DOM ya existe para poder buscar el form.
   *
   * ── Por qué la condición incluye "hay un form ancestro" ────────────────────────────────────────
   * Porque el uso **suelto** es legítimo y está aseverado: sin `NgControl` el wrapper cae a
   * `grupoPropio()`, que es lo que usan los usos de solo lectura y varios specs de la fachada. Un
   * `zds-*` sin `formControlName` **fuera** de un form no es un defecto; adentro, sí. Esa condición
   * es lo que distingue los dos casos, y sin ella esta guarda rompería media suite de la fachada.
   *
   * ── ⚠ Por qué se pregunta por DI y NO por el DOM (la primera versión de esta guarda no servía) ──
   * El primer intento preguntaba
   * `objAnfitrion.closest('[formGroup],[formGroupName],form[ngForm]')`, y **falló abierto**: la
   * mutación de la SCR-008 —quitarle el `formControlName` a `qd_strClientResponse`— no la puso roja.
   * Medido con una sonda antes de creerle a la lectura: el callback **sí** corría (18 veces, una por
   * `CampoBase` montado), el `ngControl` del campo mutado **sí** era `null`… y el `closest()`
   * devolvía `false`.
   *
   * El motivo: **`[formGroup]="form"` es un binding de propiedad, así que Angular no lo deja en el
   * DOM.** El `<form>` renderizado tiene exactamente `["novalidate","class"]` como atributos — el
   * `formGroup` no está ahí en runtime, aunque se lea en el template. La guarda estaba aseverando un
   * atributo que no existe, y por eso perdonaba justo el defecto para el que se escribió.
   *
   * Eso es peor que no tener guarda: 13 pantallas cubiertas por algo que nunca se pone rojo. Y es el
   * mismo error que el defecto 3 de la SCR-004 —aseverar el eslabón que *parece* el contrato en vez
   * del que existe—, cometido en el código escrito para no volver a cometerlo.
   *
   * La versión correcta pregunta por el **`ControlContainer` ancestro**, que es lo que
   * `[formGroup]`/`[formGroupName]`/`ngForm` proveen por DI, y es el mismo canal por el que
   * `formControlName` encuentra su group. No depende de que nada quede escrito en el DOM.
   */
  private guardarFormControlNameEnDev(): void {
    if (!isDevMode()) return;

    afterNextRender(() => {
      // El `NgControl` ya está resuelto acá: `ngOnInit` corrió y `formControlName` enganchó su
      // control. Si existe, el campo está bien cableado y no hay nada que decir.
      if (this.ngControl) return;

      // Uso suelto legítimo (solo lectura, specs de la fachada): sin form ancestro no hay contrato
      // que incumplir. Ver el bloque de arriba.
      if (!this.objContenedorAncestro) return;

      throw new Error(
        `[fachada ZDS] ${this.constructor.name}(name="${this.name()}") está dentro de un form ` +
          `reactivo pero no tiene [formControlName]. Sin él no hay NgControl: el wrapper cae a su ` +
          `group de respaldo, writeValue() nunca corre (la precarga escribe controles que nadie ` +
          `escucha) y el (modelChange) de vuelta muere en un no-op. O sea: el campo queda MUERTO en ` +
          `las dos direcciones, sin ningún síntoma en consola. Agregá ` +
          `formControlName="${this.name()}". Precedente: la SCR-008 se portó así con sus 9 campos y ` +
          `su spec quedó verde — ver el bloque de esta guarda en campo-base.ts.`,
      );
    });
  }

  /**
   * El `FormGroup` que se le pasa al `lib-*-z` por `[group]`. Es el group REAL de la pantalla
   * cuando el wrapper vive dentro de uno, así que la validación del hijo opera sobre el form de
   * verdad y no sobre una copia.
   *
   * ── Por qué es un getter perezoso y NO un campo asignado en `ngOnInit` ──────────────────────
   * Acá hubo un bug real, y estuvo verde un rato largo. La primera versión resolvía el group **una
   * sola vez** en el `ngOnInit` del wrapper, leyendo `this.ngControl.control.parent`. **Ahí ese
   * `parent` todavía es `null`**: `formControlName` engancha el control al `FormGroup` del padre en
   * el `ngOnChanges` de su propia directiva, que corre *después* del `ngOnInit` de este componente.
   * O sea que la rama "dentro de un form" **nunca se ejecutaba**, y los cinco wrappers le pasaban al
   * `lib-*-z` un group privado con un único control.
   *
   * Lo peligroso no fue el bug sino que **los tests no lo veían**: el spec de "el control conserva su
   * `name` real" comparaba las claves del `FormGroup` del host y pasaba… porque el hijo nunca tocaba
   * ese group. Pasaba por la razón opuesta a la que decía cubrir. Se descubrió midiendo
   * `objHijo.group === host.form` de casualidad, persiguiendo otra cosa (el validador invertido del
   * checkbox), y dio `false` en los **cinco** wrappers. Por eso el spec de adopción ahora asevera la
   * identidad del group, no solo las claves — ver `adopcion-grupo.spec.ts`.
   *
   * Resolverlo perezosamente es lo correcto además de lo simple: el template lee `grupo` durante la
   * detección de cambios, que siempre ocurre después de que `formControlName` hizo su trabajo.
   *
   * ── Qué está aseverado y qué no (mutación del gate 2, con un resultado incómodo) ─────────────
   * **Sí** está aseverado que la resolución sea perezosa: al reemplazar este getter por uno que
   * devuelve siempre el group propio —el efecto neto del bug original— `adopcion-grupo.spec.ts` se
   * pone **rojo** en el test de identidad, y solo en ése. Verificado y revertido.
   *
   * **No** está aseverado que el resultado quede sin cachear. Se mutó a una versión que resuelve el
   * padre perezosamente pero memoiza (`this.objCache ??= ...`) y la suite quedó **verde, 73/73**.
   * O sea que la razón para no cachear —un `FormControl` puede cambiar de padre vía `setControl` o
   * un `@if` que reconstruye el form, y la caché volvería a congelar un group obsoleto— es un
   * argumento de diseño, **no** un invariante que la suite defienda hoy. Se deja sin caché porque
   * cuesta lo mismo y elimina la clase de bug entera, pero no se escribe un test de adorno para
   * decorar la afirmación: el escenario que lo distinguiría (reparentar el control en vivo) no
   * ocurre en ninguna pantalla de este proyecto, así que sería un test sin caso de uso real. Si
   * alguna pantalla llega a reconstruir su `FormGroup` con los wrappers montados, **ese** es el
   * momento de escribirlo, y este párrafo es el que hay que leer.
   *
   * Dos escenarios, y los dos tienen que funcionar:
   *  - **Dentro de un form** (`formControlName="qd_*"`): se reusa el `FormGroup` del padre y su
   *    control tal cual, con los validadores que la pantalla le puso. `generateControl()` los
   *    **compone**, no los reemplaza (`setValidators(compose([previo, generateValidation]))`), así
   *    que `required`/`maxLength` siguen viviendo en la definición del form.
   *  - **Suelto** (sin `NgControl`): se fabrica un group mínimo —una sola vez— para que el hijo
   *    tenga dónde registrarse. Pasa en usos de solo lectura y en algunos specs.
   */
  protected get grupo(): FormGroup<Record<string, FormControl>> {
    const objPadre = this.ngControl?.control?.parent;
    if (objPadre instanceof FormGroup) {
      return objPadre as FormGroup<Record<string, FormControl>>;
    }

    return this.grupoPropio();
  }

  /**
   * El group de respaldo, creado una sola vez. Protegido porque `ZdsCheckboxField` lo usa **siempre**
   * y no solo como fallback — ver el bloque "group satélite" de ese componente.
   */
  protected grupoPropio(): FormGroup<Record<string, FormControl>> {
    this.objGrupoPropio ??= new FormGroup<Record<string, FormControl>>({
      [this.name()]: new FormControl(this.model(), this.obligatorio() ? [Validators.required] : []),
    });
    return this.objGrupoPropio;
  }

  // ── ControlValueAccessor ────────────────────────────────────────────────────────────────

  /**
   * Escribe `model` y **fuerza la detección de cambios en el mismo tick**. Las dos cosas, y la
   * segunda no es una optimización: sin ella un `patchValue` deja los campos **inválidos con el dato
   * correcto puesto**.
   *
   * ── El bug que esto arregla (medido en la pantalla del gate 2, no supuesto) ──────────────────
   * **El valor NO se pierde.** Conviene decirlo primero porque la lectura intuitiva es la contraria y
   * costó una diagnosis equivocada: la primera versión de este comentario afirmaba que
   * `updateControl()` pisaba el control y destruía el `patchValue`. **Es falso**, y el spec escrito
   * para aseverarlo pasaba con este `tick()` mutado, o sea que no guardaba nada. Traza real sobre
   * `precargar()` con el `tick()` quitado:
   * ```
   * inmediato         → 3 controles inválidos · valores CORRECTOS
   * tras microtask    → los mismos 3          · valores CORRECTOS
   * tras 1 macrotask  → los mismos 3          · valores CORRECTOS
   * tras 2 macrotasks → ninguno inválido      · valores CORRECTOS
   * ```
   * Lo que se rompe es la **validez**, y de forma transitoria: el control queda con
   * `{errorRequired: true}` sosteniendo un valor válido, y se arregla solo dos macrotasks después.
   *
   * ── Por qué ─────────────────────────────────────────────────────────────────────────────────
   * `generateControl()` **compone** su validador sobre los del padre, y ese validador lee
   * **`this.model` del hijo**, no el valor del control: `return this.required && !String(this.model
   * || '').trim();`. Encima `UtilService.updateControlValitor` difiere el `updateValueAndValidity()`
   * en un `setTimeout`. Bajo `provideZonelessChangeDetection()` un `patchValue` que no venga de un
   * handler no propaga `[model]` al hijo antes de que ese timer venza, así que el validador corre
   * leyendo el `model` viejo (`''`) y marca `errorRequired` sobre un campo que sí tiene dato.
   *
   * ── Por qué importa igual, siendo transitorio ────────────────────────────────────────────────
   * Porque `TaskService` va a llamar `patchValue` desde una respuesta HTTP y la pantalla lee el estado
   * **enseguida**: un `form.valid` consultado en la misma vuelta —para habilitar el submit, para
   * decidir si mostrar el resumen— ve `false` con los datos correctos. Y el síntoma no señala la
   * causa: `errorRequired` es la clave del DS, no de Angular.
   *
   * ── Por qué los specs de la fachada no lo veían ──────────────────────────────────────────────
   * Porque todos propagan `model` a mano con un `detectChanges()` antes de drenar los timers — ver
   * [colision-escritores.spec.ts](./colision-escritores.spec.ts). Un `patchValue` real no hace eso.
   * O sea que la suite verificaba el contrato de la lib con la carrera ya resuelta a favor, y el
   * hueco solo aparecía al montar una pantalla de verdad. Es exactamente lo que la pantalla del
   * gate 2 existe para encontrar. El guardián dedicado es
   * [precarga-patchvalue.spec.ts](./precarga-patchvalue.spec.ts).
   *
   * ── Por qué `ApplicationRef.tick()` y no otra cosa ───────────────────────────────────────────
   * Hace falta CD **sincrónica**, acá y ahora: la que agenda el signal es asincrónica —corre en una
   * microtask— y aunque eso le gana a un `setTimeout(0)`, no le gana al código que sigue en la misma
   * vuelta, que es justo quien lee `form.valid`. `markForCheck()` no sirve (solo marca sucio) y
   * `detectChanges()` sobre este componente no bastaría: el binding `[model]` lo evalúa la vista
   * **del wrapper**, pero quien tiene que recibirlo es el hijo, así que el barrido tiene que llegar
   * a los dos.
   *
   * El `tick()` es reentrante si se lo llama durante un barrido en curso, y Angular avisa con
   * `NG0101`. Pasa cuando el `patchValue` sale de una expresión de template, que en este proyecto no
   * es el caso (sale de un handler o de una respuesta HTTP), pero se guarda igual: dejar el form
   * inválido en silencio es peor que no forzar el tick, y si ya hay un barrido corriendo el binding
   * se va a propagar en ése.
   */
  writeValue(in_valor: T | null): void {
    this.model.set(in_valor);

    try {
      this.objAppRef.tick();
    } catch {
      // Ya había un barrido en curso: el binding se propaga en ése, no hace falta forzar otro.
    }
  }

  registerOnChange(in_fn: (in_valor: T | null) => void): void {
    this.fnAlCambiar = in_fn;
  }

  registerOnTouched(in_fn: () => void): void {
    this.fnAlTocar = in_fn;
  }

  setDisabledState(in_blnDeshabilitado: boolean): void {
    this.deshabilitado.set(in_blnDeshabilitado);
  }

  /** Puente del `(modelChange)` del `lib-*-z` hacia Reactive Forms. */
  protected alCambiarModelo(in_valor: T | null): void {
    this.model.set(in_valor);
    this.fnAlCambiar(in_valor);
    this.fnAlTocar();
  }

  // ── Derivados que consumen los templates ────────────────────────────────────────────────

  /**
   * `id` del campo. Contrato con `scrollToFirstError`, que hace
   * `document.getElementById('field-<path>')` → `scrollIntoView` → `focus?.()`.
   *
   * ── Por qué va en el `<div>` envolvente y no en el `lib-*-z` ────────────────────────────────
   * La fachada React lo pone directo sobre el componente del DS (`<ZrTextInput id="field-...">`).
   * Acá no se puede: `lib-input-text-z` cablea `[id]="name"` sobre su `za-text-input` interno y no
   * expone input para sobrescribirlo, así que poner `[id]` en el `<lib-input-text-z>` dejaría DOS
   * elementos con id distinto para el mismo campo. Verificado en el DOM real bajo jsdom: el único
   * `[id]` que emite es `za-text-input#qd_strChannel`.
   *
   * El wrap además scrollea mejor: `block:'center'` centra el campo completo (label + control +
   * help-text), no el input pelado.
   *
   * **La clase de ese div no es la misma en todos los wrappers, y no es cosmético.**
   * `.zds-field-wrap` impone `min-height: 68px` (pill de 48 + línea de helpText) y es lo que alinea
   * los pills de una `form-row` exista o no el helpText — corresponde donde React también envuelve:
   * input, textarea, date y select. Los que React rinde **pelados** (checkbox de esta base; radio y
   * file-input de `CampoZaBase`) usan `.zds-field-bare`, sin piso, porque el piso les agregaba aire
   * que React no tiene. El `id` va igual en los dos casos: lo que cambia es el alto. Ver el bloque
   * de `.zds-field-bare` al final de `shared.css` para la tabla medida.
   *
   * ── Lo que el `focus?.()` NO hace, ni acá ni en React (límite preexistente) ─────────────────
   * `scrollToFirstError` intenta enfocar el elemento después de scrollear. Eso **no enfoca el input
   * de verdad** en ninguna de las dos apps: los custom elements del DS no declaran
   * `delegatesFocus` (0 ocurrencias, medido en `@zurich/angular-components` y en
   * `@zurich/web-components`), así que el foco queda en el host y no baja al `<input>` del shadow
   * root. O sea que hoy el helper scrollea y no enfoca. **No se arregla en esta migración** — es un
   * comportamiento de la app React que se porta tal cual; cambiarlo sería un cambio funcional de
   * contrabando. Se deja anotado acá porque es justo el lugar donde alguien lo va a buscar.
   *
   * El `tabindex="-1"` del template existe por eso: hace el wrap focusable programáticamente (sin
   * meterlo en el orden de tabulación con Tab), así que el `focus()` cae en un elemento válido en
   * vez de ser un no-op sobre un `<div>` — y el día que el DS agregue `delegatesFocus` no hay que
   * tocar nada acá.
   */
  protected get strId(): string {
    return `field-${this.name()}`;
  }

  /**
   * ¿Hay que pintar el campo en error?
   *
   * Un `error` explícito manda. Si no, el criterio es el mismo que ya usa la fachada React:
   * inválido **y** tocado — nunca inválido a secas, que pintaría todo en rojo al montar un form de
   * ~20 obligatorios como la SCR-000.
   *
   * Este getter es la razón por la que los wrappers pasan `manualValidation = true` donde el input
   * existe: sin eso, `ngOnChanges` de la lib hace
   * `if (!manualValidation && group.status == 'INVALID') this.valid = true`, y como en esos
   * componentes `valid` **significa `invalid`**, un campo correcto se pinta en error porque OTRO
   * campo del group lo es.
   */
  protected get blnEnError(): boolean {
    if (this.error()) return true;
    const objControl = this.ngControl?.control;
    return !!objControl && objControl.invalid && objControl.touched;
  }

  /** Texto de ayuda: el error explícito desplaza al `helpText`, igual que en React. */
  protected get strTextoAyuda(): string {
    return this.error() || this.helpText();
  }
}
