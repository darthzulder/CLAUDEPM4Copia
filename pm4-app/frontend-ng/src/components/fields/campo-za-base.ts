import { Directive, forwardRef, inject, Injector, input, type OnInit } from '@angular/core';
import { type ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';

/**
 * Accessor de paso para los wrappers `za-*`. Se exporta como constante para que cada subclase lo
 * ponga en sus `providers` con su **propio** tipo: `NG_VALUE_ACCESSOR` se resuelve en el injector del
 * elemento, así que el `useExisting` tiene que apuntar a la clase concreta que Angular instanció, no
 * a la base abstracta.
 *
 * Ver la cabecera de `CampoZaBase` para el porqué de que los cuatro métodos estén vacíos.
 */
export function proveerAccessorDePaso(in_fnTipo: () => unknown) {
  return {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(in_fnTipo),
    multi: true,
  };
}

/**
 * Base de los wrappers sobre `@zurich/angular-components` (`za-*`). Es la **contraparte** de
 * [`CampoBase`](./campo-base.ts), y la diferencia entre las dos es toda la razón por la que existen
 * ambas.
 *
 * ── El CVA real es el del componente de Zurich, no el de este wrapper ─────────────────────────
 * `lib-*-z` no trae CVA, así que `CampoBase` lo aporta a mano (`writeValue` → `model`,
 * `modelChange` → `onChange`). `za-*` es el caso opuesto: **cada componente registra su propio
 * `NG_VALUE_ACCESSOR`** con `useExisting`, y hereda de `ZaBaseInput` un `writeValue` /
 * `registerOnChange` / `registerOnTouched` / `setDisabledState` completos. Verificado en el
 * `providers` del `ɵɵngDeclareComponent` de `ZaRadioSelect` y `ZaFileInput`, en
 * `@zurich/angular-components/dist/fesm2022/angular.mjs`.
 *
 * Si este wrapper aportara un CVA **con cuerpo**, habría **dos** accessors escribiendo el mismo
 * control (el del wrapper y el del `za-*` de adentro), y el de adentro estaría manteniendo un espejo
 * que nadie lee — un campo que se ve bien y no guarda.
 *
 * ── Pero un accessor SÍ hace falta, y este es el punto no obvio ───────────────────────────────
 * `formControlName` sobre el wrapper **exige un `NG_VALUE_ACCESSOR` en el propio host**. Sin él
 * Angular no engancha nada y tira `NG01203: No value accessor for form control name` al montar. O
 * sea que las dos restricciones tiran para lados opuestos: la simetría de la fachada pide
 * `formControlName` en la pantalla, y la corrección pide no escribir el control desde dos lados.
 *
 * Se resuelven con un **accessor de paso**: registrado (Angular queda satisfecho y el control es
 * localizable) pero con los cuatro métodos **vacíos a propósito**. No es un stub pendiente de
 * completar: el wrapper no tiene ningún estado propio que sincronizar, porque el `[formControl]` del
 * template le entrega al `za-*` **el mismo objeto `FormControl`** de la pantalla. El valor no viaja
 * por este accessor, viaja por el control compartido.
 *
 * El costo de este diseño es que `control.setValue()` **no** marca `touched`/`dirty` a través de este
 * wrapper — lo hace el CVA nativo del `za-*` directamente sobre el control, que es donde corresponde.
 * Los specs de `zds-radio` aseveran justamente eso (ida, vuelta y `touched` vía `_onBlur`).
 *
 * ── Cómo llega el control al `za-*` de adentro ────────────────────────────────────────────────
 * La pantalla escribe `formControlName="qd_*"` sobre el wrapper, igual que en los otros cinco
 * campos — la simetría de la fachada se mantiene, que es lo que pidió el usuario. Ese
 * `formControlName` se usa para *localizar* el `FormControl`, y el template se lo pasa al `za-*` con
 * `[formControl]`. O sea que el control es **el mismo objeto**, no una copia sincronizada, y el CVA
 * nativo de Zurich opera sobre el control real de la pantalla.
 *
 * ── `NgControl` por `Injector`, no por constructor ────────────────────────────────────────────
 * Igual que en `CampoBase`, y por un motivo parecido aunque no idéntico. Allá el ciclo era real
 * (`NG0200`: el componente *es* el accessor de su `NgControl`). Acá el wrapper no es accessor, así
 * que el ciclo no se daría — pero pedir `NgControl` en el constructor **falla igual**, con
 * `NG0201: No provider for NgControl`, en cualquier uso suelto sin `formControlName` (los specs de
 * solo lectura, y el `ZdsFileInput` cuando se usa fuera de un form). Se resuelve con el `Injector`
 * y `{ optional: true, self: true }` en `ngOnInit`, que además deja el mismo patrón en las dos
 * bases y una sola forma de leerlo.
 */
@Directive()
export abstract class CampoZaBase implements ControlValueAccessor, OnInit {
  /** Nombre real del campo en PM4 (`qd_*`). Contrato con el proceso (regla 1 de CLAUDE.md). */
  readonly name = input.required<string>();

  readonly label = input<string>('');

  /**
   * Marca visual de obligatoriedad — el **asterisco del rótulo**, nada más. Se llama `obligatorio` y
   * no `required` por el mismo motivo estructural que en [`CampoBase`](./campo-base.ts), cuyo
   * docstring tiene el detalle completo: el atributo literal `required` junto a `formControlName`
   * matchea el selector del `RequiredValidator` de Angular y le pega un `{required: true}` al control
   * que la pantalla nunca declaró.
   *
   * ⚠ **Y acá la exposición es mayor, no menor — y no fue teórica.** En `CampoBase` el control que
   * Angular contaminaría es el de la pantalla porque el wrapper lo localiza; en esta base el
   * `[formControl]` del template le entrega al `za-*` **el mismo objeto** `FormControl`. Como el
   * selector del `RequiredValidator` cubre **`[required][formControl]`** además de la variante con
   * `formControlName`, un `[required]` en el elemento **interno** —el `za-*`, no el host— alcanza para
   * filtrar el validador, que en `CampoBase` era imposible. `zds-required.spec.ts` lo encontró en los
   * dos wrappers de esta base.
   *
   * Por eso, en las subclases de acá, `obligatorio` **no se bindea en la plantilla**: se escribe sobre
   * la instancia del hijo con `viewChild` + `effect`. El detalle de por qué `[attr.required]` y clonar
   * el control no eran salidas está en el docstring de `ZdsRadio.objHijo`. La obligatoriedad que
   * *invalida* se declara donde siempre: en el `FormControl` de la pantalla.
   *
   * La guarda es [`zds-required.spec.ts`](./zds-required.spec.ts), que cubre los 7 wrappers de las
   * dos bases con un control pelado.
   */
  readonly obligatorio = input(false);
  readonly helpText = input<string>('');

  /**
   * Mensaje de error explícito. Cuando viene, gobierna: es el caso de `setError()` de la fachada
   * React (validaciones de servidor, p.ej. "el archivo ya fue adjuntado").
   */
  readonly error = input<string>('');

  /**
   * Idioma que se le pasa al `za-*` de adentro. Fijo en `'es'`, y **no** es redundante con el
   * `ZDS_LOCALES` global que pone [`zds-setup.ts`](../../zds-setup.ts): los dos hacen falta porque
   * atacan dos mecanismos distintos del DS, y uno de ellos es un **defecto de la librería**.
   *
   * ── El global cubre los textos; esto cubre lo que el global no alcanza ────────────────────────
   * `localized.js` resuelve los textos con `computedLocale`, que cae al `<html lang="es">` cuando la
   * propiedad `locale` está vacía — así que para los strings el global basta y esto no cambia nada.
   *
   * Pero `file-input.js` formatea la lista de extensiones con
   * `new Intl.ListFormat(this.locale, { type: "disjunction" })`: usa **la propiedad cruda, nunca
   * `computedLocale`** (verificado: 3 ocurrencias de `this.locale`, 0 de `computedLocale` en ese
   * archivo). Con `locale` sin setear, `Intl` recibe `undefined`, cae al idioma del navegador y el
   * conector sale en inglés **aunque el resto de la frase esté traducida**:
   *
   * ```
   * sin esto:  "Sólo se permiten archivos PDF, JPG, or PNG"   ← el "or" delata el bug
   * con esto:  "Sólo se permiten archivos PDF, JPG o PNG"
   * ```
   *
   * Medido en el navegador sobre la pantalla del gate, no inferido de la lectura.
   *
   * ── Por qué constante y no `input()` ─────────────────────────────────────────────────────────
   * La app corre en una sola instancia de PM4 Colombia; un campo en otro idioma que el resto de la
   * pantalla sería un defecto, no una opción. Se declara acá —una vez, en la base— en lugar de
   * repetir `locale="es"` en cada plantilla, que es exactamente el tipo de dato que se copia mal.
   * Si algún día hiciera falta multiidioma, esto pasa a `input()` con `'es'` de default y ninguna
   * plantilla cambia.
   *
   * Los `lib-*-z` de Colombia **no tienen** este input (0 ocurrencias de `locale` en su `.d.ts`), así
   * que esta mitad de la fachada es la única que puede aprovecharlo. Para la otra mitad manda el
   * global.
   */
  protected readonly strLocale = 'es';

  private readonly objInjector = inject(Injector);

  protected ngControl: NgControl | null = null;

  /**
   * Control de respaldo para el uso **suelto** (sin `formControlName`). El `[formControl]` del
   * template necesita un `FormControl` real siempre: pasarle `null` tira
   * `NG01050: formControl expects a FormControl instance`. Se crea uno vacío y desconectado, que es
   * lo correcto para un campo que nadie está gobernando.
   */
  private readonly objControlSuelto = new FormControl<string | null>(null);

  ngOnInit(): void {
    this.ngControl = this.objInjector.get(NgControl, null, { optional: true, self: true });
  }

  /* ── ControlValueAccessor de paso ─────────────────────────────────────────────────────────────
   * Los cuatro métodos están vacíos **a propósito**, no pendientes. Existen para que Angular pueda
   * resolver el `formControlName` que la pantalla escribe sobre el wrapper (sin un accessor en el
   * host tira `NG01203`); el valor no pasa por acá, porque el `[formControl]` del template le entrega
   * al `za-*` de adentro el **mismo objeto `FormControl`** y el CVA nativo de Zurich lo gobierna
   * directo. Ver el bloque "Pero un accessor SÍ hace falta" de la cabecera.
   *
   * Un cuerpo con lógica acá sería un segundo escritor del mismo control: el espejo que nadie lee.
   * Por eso el `eslint-disable` es puntual y no se ensancha a la clase entera. */
  /* eslint-disable @typescript-eslint/no-empty-function */
  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
  setDisabledState(): void {}
  /* eslint-enable @typescript-eslint/no-empty-function */

  /**
   * El `FormControl` que el template le presta al `za-*`. Es el control **real** de la pantalla
   * cuando hay `formControlName`, así que el CVA nativo de Zurich escribe donde tiene que escribir.
   *
   * Getter perezoso, no campo asignado en `ngOnInit`, por el mismo motivo documentado en el `grupo`
   * de `CampoBase`: en el `ngOnInit` de este componente el `formControlName` del padre todavía no
   * terminó de enganchar nada. El template lee esto durante la detección de cambios, que siempre
   * ocurre después.
   */
  protected get control(): FormControl {
    const objControl = this.ngControl?.control;
    return objControl instanceof FormControl ? objControl : this.objControlSuelto;
  }

  /**
   * Contrato con `scrollToFirstError`: `document.getElementById('field-<name>')` → `scrollIntoView`.
   * Va en el `<div>` envolvente por la misma razón que en `CampoBase`: los `za-*` cablean su propio
   * `id`/`name` sobre el web component de adentro, así que ponerlo en el componente del DS sería
   * pisado.
   *
   * **La clase de ese div no es la misma en los siete wrappers**, y la diferencia es de paridad
   * visual, no de estilo: `.zds-field-wrap` impone `min-height: 68px` (la caja pill+helpText que
   * alinea los inputs de una `form-row`) y solo corresponde donde React también envuelve —input,
   * textarea, date y select. Los tres que React rinde **pelados** (radio, checkbox, file-input) usan
   * `.zds-field-bare`, que no tiene piso. El `id` va igual en los dos casos: lo que cambia es el alto.
   */
  protected get strId(): string {
    return `field-${this.name()}`;
  }

  /**
   * ¿Pintar el campo en error? Un `error` explícito manda; si no, inválido **y** tocado, que es el
   * criterio de la fachada React.
   *
   * **No hay nada que neutralizar acá**, a diferencia de los `lib-*-z`: la capa `za-*` no mira el
   * estado del group entero (no recibe `[group]`), así que no existe el contagio que obliga a pasar
   * `manualValidation = true` en los otros cinco wrappers. Y su input se llama `invalid` y
   * **significa `invalid`** — la polaridad no se invierte.
   */
  protected get blnEnError(): boolean {
    if (this.error()) return true;
    const objControl = this.ngControl?.control;
    return !!objControl && objControl.invalid && objControl.touched;
  }

  /** El error explícito desplaza al `helpText`, igual que en React. */
  protected get strTextoAyuda(): string {
    return this.error() || this.helpText();
  }
}
