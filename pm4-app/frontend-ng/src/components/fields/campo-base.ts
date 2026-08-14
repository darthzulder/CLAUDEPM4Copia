import {
  ApplicationRef,
  Directive,
  inject,
  Injector,
  input,
  signal,
  type OnInit,
  type WritableSignal,
} from '@angular/core';
import {
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
  readonly required = input(false);
  readonly readOnly = input(false);
  readonly helpText = input<string>('');
  readonly placeholder = input<string>('');

  /**
   * NO hay input `maxLength` acá a propósito, aunque la fachada React lo tenga.
   *
   * En `lib-input-text-z` el input homónimo está tipado **`boolean`** (el largo iría en `maxNumber`)
   * y ninguno de los dos llega al `za-text-input`: su template no los pasa y la única referencia en
   * la clase está comentada. Exponerlo acá daría un prop que se acepta, no falla y no limita nada.
   * El límite se declara como `Validators.maxLength(n)` en el control, que es efectivo y además es
   * donde el proyecto ya lo tiene.
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

  ngOnInit(): void {
    this.ngControl = this.objInjector.get(NgControl, null, { optional: true, self: true });
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
      [this.name()]: new FormControl(this.model(), this.required() ? [Validators.required] : []),
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
   * ── Por qué va en el `<div class="zds-field-wrap">` y no en el `lib-*-z` ────────────────────
   * La fachada React lo pone directo sobre el componente del DS (`<ZrTextInput id="field-...">`).
   * Acá no se puede: `lib-input-text-z` cablea `[id]="name"` sobre su `za-text-input` interno y no
   * expone input para sobrescribirlo, así que poner `[id]` en el `<lib-input-text-z>` dejaría DOS
   * elementos con id distinto para el mismo campo. Verificado en el DOM real bajo jsdom: el único
   * `[id]` que emite es `za-text-input#qd_strChannel`.
   *
   * El wrap además scrollea mejor: `block:'center'` centra el campo completo (label + control +
   * help-text), no el input pelado.
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
