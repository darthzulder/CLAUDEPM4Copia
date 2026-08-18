import { Directive, inject } from '@angular/core';
import { ButtonZ } from '@zurich-col/lib-zurich';

/**
 * Invierte el default de `ButtonZ.disabled`, que el vendor deja en **`true`**: un `<lib-button-z>` sin
 * `[disabled]` monta **inerte**. Con esta directiva importada, un botón sin binding queda habilitado,
 * que es lo que cualquiera espera.
 *
 * No hay nada que escribir en la plantilla: el selector es el del componente, así que aplica sola a
 * todos los `lib-button-z` de la pantalla que la importe.
 *
 * ```ts
 * // @Component({ imports: [ZrButton, BotonHabilitado], … })
 * ```
 * ```html
 * <lib-button-z label="Enviar" (eventClick)="enviar()" />          <!-- habilitado -->
 * <lib-button-z label="Enviar" [disabled]="blnEnviando()" />       <!-- el binding manda -->
 * ```
 *
 * ── El defecto, leído de la fuente ────────────────────────────────────────────────────────────
 * `@zurich-col/lib-zurich/fesm2022/zurich-col-lib-zurich.mjs`, `class ButtonZ`:
 *
 * ```js
 * class ButtonZ {
 *   label = '';
 *   type = 'primary';
 *   disabled = true;      // ← acá
 *   …
 * }
 * ```
 *
 * Es un campo de clase con valor inicial, no un `input(false)` idiomático, y el `inputs` del
 * `ɵɵngDeclareComponent` lo declara sin alias (`disabled: "disabled"`). O sea que el default vive en la
 * instancia y solo se pisa si la plantilla escribe el binding.
 *
 * Lo insidioso es que **no hay ningún síntoma**: el botón se pinta, se ve normal y no hace nada al
 * hacer clic. Medido en `src`: **65 de 65** `<lib-button-z>` escriben `[disabled]`, y **43 de ellos
 * escriben literalmente `[disabled]="false"`** — o sea que dos tercios del binding existente es puro
 * contrapeso del default. Ninguna pantalla está rota hoy; la deuda es que el sitio 66 tiene que
 * saberlo, y nada se lo dice.
 *
 * ── Por qué una directiva y no un componente envoltorio ───────────────────────────────────────
 * `zds-reexports.ts` explica por qué la fachada usa **alias y no wrappers**: `ModalZ`, `TableZ` y
 * `TileZ` leen sus slots con `@ContentChildren(ZTemplate)`, y un envoltorio intermedio se quedaría con
 * esos `ng-template` en su propio `ContentChildren` dejando al componente del DS sin slots. `ButtonZ`
 * es la excepción a esa restricción —verificado: cero `ng-content`, cero `ContentChild`, cero
 * `queries`; su contenido entra por el input `label`—, así que un envoltorio **sí** sería viable acá.
 *
 * Se descartó igual, por costo: obligaría a cambiar el selector en los 65 sitios y a re-declarar los 8
 * inputs y el `eventClick`, contra una directiva que **no toca ninguna plantilla**. Y re-declarar
 * inputs es precisamente cómo se pierde uno en silencio cuando el vendor agregue el noveno.
 *
 * ── Por qué la escritura va en el constructor, y por qué eso es seguro ────────────────────────
 * Medido con una sonda desechable (`SondaCtor`/`SondaInit` sobre cuatro botones: sin binding,
 * `[disabled]="true"`, `[disabled]="false"` y una expresión). Resultado, en este orden exacto:
 *
 * ```
 * ctor:leyó=true  ctor:leyó=true  ctor:leyó=true  ctor:leyó=true     ← los 4 constructores primero
 * init:leyó=false init:leyó=true  init:leyó=false init:leyó=true     ← recién ahí, el valor final
 * ```
 *
 * Los cuatro constructores corren **antes** de que Angular escriba un solo binding. Así que escribir
 * `disabled = false` en el constructor no compite con la plantilla: Angular pisa después con el valor
 * bindeado si hay binding, y si no hay, queda el `false` de acá. Los cuatro botones de la sonda
 * terminaron en `false / true / false / true`, o sea **el binding explícito siempre gana** — incluido
 * un `[disabled]="true"` deliberado, que es el caso que haría inservible a la directiva si perdiera.
 *
 * Esto es lo que descartó la alternativa que el plan dejaba abierta ("si el envoltorio resulta frágil
 * frente al orden de escritura de inputs, la alternativa es una guarda de spec"): no es frágil, el
 * orden está garantizado por el ciclo de vida de Angular y medido acá. La guarda de spec se escribió
 * igual, pero para otra cosa (ver abajo).
 *
 * ── Su única grieta, y cómo se cierra ─────────────────────────────────────────────────────────
 * La directiva solo actúa si la pantalla la tiene en `imports`. Una pantalla que importe `ZrButton` y
 * se olvide de `BotonHabilitado` vuelve al default `true` **sin ningún error** — el mismo tipo de fallo
 * silencioso que el defecto original. Por eso existe
 * [`guarda-boton-habilitado.spec.ts`](./guarda-boton-habilitado.spec.ts), que pone rojo si un `.ts`
 * declara `ZrButton` en `imports` sin declarar también esta directiva. Es la misma clase de guarda
 * cross-pantalla que `guarda-ngmodel.spec.ts` y `guarda-formcontrolname.spec.ts`, y por el mismo
 * motivo: un spec por pantalla asevera lo que la pantalla declara, no lo que olvidó declarar.
 *
 * ── Qué NO hace ───────────────────────────────────────────────────────────────────────────────
 * No toca los 43 `[disabled]="false"` que ya existen. Son explícitos y correctos, y borrarlos sería un
 * cambio masivo de plantillas sin ganancia funcional: quedan como están y su valor sigue mandando. Lo
 * que cambia es que a partir de acá **no hace falta escribirlos**.
 *
 * Tampoco cambia `ZaButton` (el `za-button` de `@zurich/angular-components`, que `ButtonZ` renderiza
 * por dentro): el default problemático es del componente de Colombia, y su plantilla pasa
 * `[disabled]="disabled"` hacia abajo, así que arreglar el de arriba alcanza.
 */
@Directive({
  selector: 'lib-button-z',
})
export class BotonHabilitado {
  /**
   * `{ self: true }` y no opcional: el selector garantiza que el host **es** un `lib-button-z`, así que
   * si esto no resolviera sería un cambio de selector del vendor y corresponde el `NG0201` ruidoso en
   * vez de un `if` que lo tape.
   */
  private readonly objBoton = inject(ButtonZ, { self: true });

  constructor() {
    // Ver "Por qué la escritura va en el constructor": corre antes de todo binding, así que la
    // plantilla siempre puede pisarlo. No va en `ngOnInit` justamente porque ahí ya es tarde —
    // pisaría el valor que la pantalla bindeó.
    this.objBoton.disabled = false;
  }
}
