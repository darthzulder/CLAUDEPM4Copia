import {
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  type OnInit,
} from '@angular/core';
import { ZaPagination, ZaSidebar, ZaTabs } from '@zurich/angular-components';

/**
 * Two-way sobre los `ZaModelElement` del DS (`za-tabs`, `za-sidebar`, `za-pagination`), envolviendo
 * un defecto del vendor que hace **inescribible** su input `ngModel` desde una plantilla.
 *
 * Se usa con la sintaxis normal de Angular, y eso es todo lo que una pantalla necesita saber:
 *
 * ```html
 * <za-tabs [(modeloZa)]="sigTab" [tabs]="cllTabs" />
 * <za-pagination [(modeloZa)]="intPagina" [pages]="intTotal" />
 * <za-sidebar [(modeloZa)]="blnAbierto" [content]="objContenido" />
 * ```
 *
 * ── El defecto del vendor, leído de la fuente ─────────────────────────────────────────────────
 * `@zurich/angular-components/dist/esm2022/_shared/za-base.mjs`, clase
 * `ZaModelElement extends ZaElement`, declara su input así:
 *
 * ```js
 * inputs: { ngModel: "ngModel" }
 * ```
 *
 * **El nombre pelado, sin alias** — o sea, exactamente el mismo nombre que la directiva `NgModel` de
 * Angular. Y `ReactiveFormsModule` re-exporta `NgControlStatus`, cuyo selector es
 * `[formControlName],[ngModel],[formControl]`: matchea el **atributo**, y su `NgControl` es
 * `{self: true}` y **no opcional**. Escribir `[ngModel]="…"` en la plantilla hace que
 * `NgControlStatus` se enganche, no encuentre ningún `NgControl` y tire **`NG0201` tirando la
 * pantalla entera** — no el componente, la pantalla.
 *
 * Las cuatro variantes, **medidas** con una sonda aislada y no deducidas del mensaje de error:
 *
 * | Módulo de forms importado | Binding | Resultado |
 * |---|---|---|
 * | `FormsModule` | `[ngModel]` | ❌ `NG01203` (ahí matchea `NgModel` y exige un CVA) |
 * | `ReactiveFormsModule` | `[ngModel]` | ❌ `NG0201` — con y sin `<form>` alrededor |
 * | **ninguno** | `[ngModel]` | ✅ el input llega |
 * | `ReactiveFormsModule` | solo `(ngModelChange)` | ✅ monta, el output funciona |
 *
 * Dos conclusiones que cuestan si se asumen al revés: **no es culpa de `FormsModule`** (quitarlo no
 * arregla nada, solo cambia el error), y el problema es el **atributo del input**, no el output — un
 * binding de output no crea atributo, así que `(ngModelChange)` siempre fue seguro.
 *
 * ── Por qué esta directiva lo resuelve por construcción ───────────────────────────────────────
 * El atributo que la pantalla escribe es **`modeloZa`, nuestro**, no `ngModel`. `NgControlStatus` no
 * lo matchea, así que el `NG0201` no puede ocurrir: desaparece por diseño y no por disciplina de
 * quien escribe la plantilla. El `ngModel` del vendor se escribe **sobre la instancia**, que es un
 * canal que ninguna directiva de `@angular/forms` observa.
 *
 * Esto es la política del proyecto para los defectos de vendor en Angular, decidida por el usuario:
 * las librerías son accesibles pero **no se editan ni se vendorizan** (a diferencia de React, donde
 * `@zurich/web-components` es un `.tgz` parcheado) — el defecto se envuelve en nuestro código, acá,
 * documentado. Misma familia que [`CampoZaBase`](./campo-za-base.ts) y [`CampoBase`](./campo-base.ts).
 *
 * ── Las DOS mitades hacen falta, y la de vuelta es la que se olvida ───────────────────────────
 * `ZaModelElement._onChange` no solo emite: **pisa el atributo `model` del elemento interno por su
 * cuenta**, tomando el valor del evento del DOM y no del input:
 *
 * ```js
 * const element = this.templateRef.nativeElement;
 * const currentValue = element.getAttribute('model') || '';
 * if (JSON.stringify(currentValue) !== JSON.stringify(e.detail))
 *     element.setAttribute('model', e.detail);
 * ```
 *
 * O sea que el DS **ya movió** su estado visible antes de que nadie le avise a la pantalla. Sin la
 * mitad de vuelta, el signal se queda en el valor viejo mientras la pantalla muestra el nuevo: el
 * sidebar se cierra y `blnAbierto` sigue en `true`, así que el próximo "abrir" no abre nada **y no hay
 * ningún error**. Es el mismo defecto de forma que el `(close)` de `ModalZ`.
 *
 * ── Por qué la vuelta va por el `EventEmitter` y no por `@HostListener` ───────────────────────
 * `ngModelChange` es un `@Output()` del componente de Angular (medido: `typeof … === 'object'`, un
 * `EventEmitter`), **no** un evento del DOM que burbujee. Un `@HostListener('ngModelChange')`
 * escucharía en el elemento y dependería de que algo despache un evento con ese nombre, que es
 * justamente lo que no pasa. Suscribirse al emitter es el canal real, y además funciona bajo jsdom,
 * donde los custom elements de Lit no se ejecutan.
 *
 * ── Por qué se inyectan las tres clases concretas y no la base ────────────────────────────────
 * Lo natural sería `inject(ZaModelElement)`, una sola vez. **No se puede:** el `exports` de
 * `@zurich/angular-components/package.json` expone únicamente `"."`, así que
 * `dist/_shared/za-base` no es importable (`TS2307`, verificado) y la clase base no existe como token
 * en nuestro lado. Se inyectan las tres subclases con `{optional: true, self: true}` y se toma la que
 * resuelva.
 *
 * El costo es una lista explícita; el beneficio es que **la lista está chequeada por el compilador**.
 * Si el DS suma un cuarto `ZaModelElement`, esto no lo cubre en silencio: `modeloZa` sobre él tira el
 * error de abajo al montar, nombrando el problema. Un `inject` de la base habría aceptado cualquier
 * cosa y fallado más lejos.
 */
@Directive({
  selector: '[modeloZa]',
  exportAs: 'modeloZa',
})
export class ModeloZa<T> implements OnInit {
  /**
   * Valor que entra al componente del DS. El nombre del atributo es **nuestro** a propósito: es lo que
   * evita el `NG0201` del encabezado. Con el `output` de abajo habilita `[(modeloZa)]="miSignal"`.
   */
  readonly modeloZa = input<T>();

  /** La mitad de vuelta del two-way. El nombre `modeloZaChange` es lo que Angular exige para el `[()]`. */
  readonly modeloZaChange = output<T>();

  /**
   * El componente del DS que está en este mismo elemento. Los tres `inject` son mutuamente exclusivos
   * —un elemento es un `za-tabs` **o** un `za-pagination` **o** un `za-sidebar`—, así que exactamente
   * uno resuelve y los otros dan `null`. Ver "Por qué se inyectan las tres clases concretas".
   */
  private readonly objAnfitrion =
    inject(ZaTabs, { optional: true, self: true }) ??
    inject(ZaSidebar, { optional: true, self: true }) ??
    inject(ZaPagination, { optional: true, self: true });

  private readonly objDestroy = inject(DestroyRef);

  constructor() {
    // La mitad de ida. Va en un `effect` para seguir al signal de la pantalla: `input()` es reactivo,
    // así que esto se re-ejecuta en cada cambio del valor de afuera. Es escritura directa sobre la
    // instancia, que es el único canal que el vendor deja abierto (ver el encabezado).
    effect(() => {
      const objDs = this.objAnfitrion;
      if (!objDs) return;
      // Los dos casts de este archivo son la frontera de tipos entre una directiva **genérica en `T`**
      // y tres componentes cuyo `ngModel` está tipado distinto (`number` en `za-pagination`, `boolean`
      // en `za-sidebar`). Es deliberado que la frontera esté acá y no en las pantallas: `T` se infiere
      // del signal de cada una, así que la pantalla conserva su tipo real —`irAPagina($event)` recibe
      // un `number` de verdad— y ningún `.html` necesita un cast. Tipar el input con la unión de los
      // tres sería peor: le impondría a cada pantalla los tipos de los otros dos.
      (objDs as { ngModel?: unknown }).ngModel = this.modeloZa();
    });
  }

  ngOnInit(): void {
    // El fallo va acá y no en el constructor porque en el constructor los `inject` ya corrieron pero
    // el mensaje sería idéntico y el stack menos útil: `ngOnInit` deja el elemento ya creado, así que
    // el error de Angular apunta a la plantilla que lo escribió.
    if (!this.objAnfitrion) {
      throw new Error(
        '`modeloZa` se puso sobre un elemento que no es `za-tabs`, `za-sidebar` ni `za-pagination`. ' +
          'La directiva escribe el `ngModel` de `ZaModelElement` por instancia, así que solo sirve en ' +
          'esos tres. Si el DS agregó un `ZaModelElement` nuevo, hay que sumarlo a los `inject` de ' +
          'components/fields/modelo-za.ts.',
      );
    }

    // La mitad de vuelta. Por el `EventEmitter` y no por un evento del DOM — ver el encabezado.
    const objSub = this.objAnfitrion.ngModelChange.subscribe((in_valor: unknown) => {
      this.modeloZaChange.emit(in_valor as T);
    });
    this.objDestroy.onDestroy(() => objSub.unsubscribe());
  }
}
