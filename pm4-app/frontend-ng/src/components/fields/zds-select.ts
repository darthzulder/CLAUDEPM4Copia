import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputSelectZ } from '@zurich-col/lib-zurich';
import { CampoBase } from './campo-base';

/** Opción tal como la escriben las pantallas hoy (contrato de la fachada React). */
export interface OpcionZds {
  readonly value: string;
  readonly text?: string;
  readonly label?: string;
  readonly disabled?: boolean;
}

/** La forma que `lib-input-select-z` espera en `[options]`: `value` + `description`. */
interface OpcionLib {
  value: string;
  description: string;
}

/**
 * Select de la fachada. Envuelve `lib-input-select-z` y preserva el contrato de `ZdsSelect` de la
 * fachada React (`options` con `text`/`label`, `placeholder`, `loading`, `withSearch`).
 *
 * ```html
 * <zds-select formControlName="qd_strChannel" name="qd_strChannel" label="Canal"
 *             [options]="cllCanales" placeholder="Seleccione..." />
 * ```
 *
 * ── Gotchas de `lib-input-select-z`, TODOS distintos a los de `lib-input-text-z` ─────────────
 * Verificados en `fesm2022/zurich-col-lib-zurich.mjs`. Este componente **no** es el mismo caso que
 * el input de texto, y asumir que sí era el error más fácil de cometer acá:
 *
 *  - **`invalid` significa `invalid`.** A diferencia de `lib-input-text-z`/`lib-textarea-z`/
 *    `lib-input-date-z` —donde el input se llama `valid` y se pasa como `[invalid]`— acá el input
 *    ya se llama `invalid` y llega como `[invalid]="invalid"`. **La polaridad NO se invierte.**
 *    Se le pasa `blnEnError` derecho, sin negar.
 *  - **`options` usa `description`, no `text` ni `label`.** Su template hace
 *    `<option [value]="item.value">{{item.description}}</option>`; una opción con `text` renderiza
 *    la etiqueta **vacía** sin fallar — falso verde silencioso. Por eso `cllOpcionesLib` traduce.
 *  - **`disable` (sin "d" final) es un input MUERTO.** Existe y arranca en `false`, pero no se lee
 *    en ninguna parte de la clase ni del template (verificado: 3 ocurrencias, todas de la
 *    declaración). O sea que ni `disable` ni `disabled` deshabilitan este select. Se documenta y
 *    **no se bindea**, para no ofrecer un prop que no hace nada. El plan decía "usa `disable`, no
 *    `disabled`" — es cierto en cuanto al nombre, pero incompleto: ninguno de los dos funciona.
 *    **Consecuencia visual, encontrada comparando contra React:** `control.disable()` sí bloquea el
 *    campo de verdad (Angular no propaga el valor y el listado no abre — verificado en el navegador
 *    sobre los 21 controles bloqueados de SCR-003), pero el widget **se sigue viendo habilitado**,
 *    porque nada llega al `za-select`. El `z-select` de React resuelve esto en el propio DS:
 *    con el atributo `disabled` puesto, el host computa `opacity: .5`. Se replica con
 *    `.zds-select-wrap--deshabilitado` sobre el envoltorio que ya existía, alimentada por la señal
 *    `deshabilitado` que el CVA llena en `setDisabledState`. Es CSS propio como último recurso
 *    legítimo: no hay input del DS que lo haga, y el valor no se inventa — es el del DS de React.
 *  - **`manualValidation` SÍ existe acá** (a diferencia de textarea/checkbox), y hace falta por el
 *    mismo motivo que en el input de texto: sin él, `ngOnChanges` hace
 *    `if (!manualValidation && group.status == 'INVALID') this.invalid = true`, marcando en error un
 *    select correcto porque otro campo del form es inválido.
 *  - **`multiSelect` cambia el elemento interno**, no solo el modo: `za-multiselect` en vez de
 *    `za-select`, y esa rama **no** pasa `help-text`. Se expone igual porque las pantallas lo usan,
 *    con el límite documentado.
 *  - **`typeLine`, no `lineType`.** El textarea y el date usan `lineType`; este usa `typeLine`. Los
 *    tres significan lo mismo. No hay razón, hay que escribirlo como está.
 *
 * ── ⚠ El gotcha GRAVE, y el que dejaba selects EN BLANCO en el navegador ────────────────────
 * **Una opción que llega después del primer render no se pinta nunca.** El widget se queda con el
 * vacío del DS ("No se encontraron opciones", texto del propio `ZDS_LOCALES`) y no hay un solo error
 * en consola. En la SCR-000 pasaba en 2 de sus 10 selects, y en la SCR-003 en todos.
 *
 * `lib-input-select-z` alimenta el `za-select` por **slot**, no por propiedad: su template hace
 * `<za-select …>@for (item of options; …) { <option [value]="item.value">{{item.description}}</option> }`.
 * Y el elemento de Lit del otro lado resuelve así (`@zurich/web-components/dist/options-input.js`):
 *
 * ```js
 * get _targetOptionsArray() {
 *   const slottedOptions = [...this.querySelectorAll("option[value]") || []];
 *   return slottedOptions.length ? slottedOptions : this.options || [];
 * }
 * ```
 *
 * ⚠ **Es un getter, no una foto**, y la distinción importa porque la lectura intuitiva —"el DS
 * cachea los hijos al montar"— es falsa y llevaría al arreglo equivocado. Los hijos se releen en
 * cada render y **ganan** sobre la propiedad. El defecto no es la lectura: es que **nadie agenda el
 * render**. Los `<option>` son hijos de light DOM, no una propiedad reactiva de Lit, así que
 * agregarlos no ensucia el componente y el getter —correcto— nunca se vuelve a evaluar.
 *
 * ── Por qué el mismo componente andaba en unos campos y no en otros ─────────────────────────
 * Lo que decide es **cuándo llega el catálogo respecto del primer render**, y por eso parecía un
 * defecto de una pantalla. En la SCR-000 el `@if (blnCargando())` de `crear-recibir-queja.html:9`
 * tapa el form entero: los catálogos que pide el **padre** ya tienen sus `<option>` puestos cuando la
 * guarda se abre (esos andaban), y los que pide un **hijo** en su `ngOnInit` —que corre *mientras* la
 * guarda se abre— llegan tarde (esos quedaban en blanco).
 *
 * ── Falsificado por medición, no descartado por lectura ─────────────────────────────────────
 * Cuatro hipótesis se cayeron, y quedan escritas para que nadie las re-derive:
 *  - **el número de opciones** (12 andaba, 7 fallaba);
 *  - **estáticas vs. asíncronas** (los dos lados salían de colecciones PM4 por `objCatalogos`);
 *  - **un HTTP 500 en la colección 15** (con todas en 200, los selects seguían vacíos);
 *  - **"`za-select` solo lee `options` e ignora los hijos"** — falso por el getter de arriba, y
 *    medido: los selects que **sí** andaban también tenían `options === undefined`.
 * Y al revés: agregar un `<option>` clonado al DOM no hacía nada (no agenda render), y quitar y
 * reinsertar el elemento tampoco. Lo único que recuperaba el listado era **asignar `options`**.
 *
 * ── Por qué asignar `options` alcanza, aunque los hijos le ganen ─────────────────────────────
 * Porque `options` sí es propiedad reactiva (`@property({ type: Array })`), así que la asignación
 * **agenda el render** que faltaba. Cuando ese render corre, los `<option>` ya están en el DOM y
 * ganan el getter — o sea que lo que se pinta sigue saliendo del slot, y `options` termina siendo el
 * disparador, no la fuente. Que sea redundante como *dato* es lo que hace que el arreglo sea seguro:
 * no compite con la lib por quién manda.
 *
 * ⚠ **Pero se le pasa la forma correcta igual, y no es cosmético.** El elemento normaliza con
 * `{ value, text: (innerText ?? opt.text) || opt.value, disabled, hide }`, o sea que la clave es
 * **`text`**, no `description`. Empujar los pares `{value, description}` de la lib dejaría cada
 * etiqueta en el `value` crudo (`"170"` en vez de `"Colombia"`) el día que el slot llegue vacío y la
 * propiedad pase a ser la fuente de verdad — el mismo modo de falla silencioso que el gotcha de
 * `description` de más arriba, en el otro sentido.
 *
 * Nótese que la fachada React no golpea nada de esto: allá `ZdsSelect` pasa `options={allOptions}`
 * como **propiedad** del `z-select` (`ZdsFields.tsx:431`), nunca por slot. Por eso la comparación
 * lado a lado no ayudaba a encontrarlo — son dos mecanismos distintos.
 *
 * ── ⚠ Este arreglo NO lo cubre ningún test automatizado, y no por falta de intento ──────────
 * **jsdom no reproduce el defecto.** Se comprobó mutando: quitando el `afterRenderEffect` entero,
 * el caso de catálogo tardío de `zds-select.spec.ts` sigue pintando todas las etiquetas. Es
 * coherente con el mecanismo — bajo jsdom los `<option>` del slot alcanzan a estar en el DOM antes
 * del render de Lit, así que el getter los encuentra y no hace falta agendar nada. En el navegador
 * el catálogo llega *después* de ese render, que es justo el caso que no tiene quien lo despierte.
 * Corolario medido: la mutación `text` → `description` deja la suite **verde**, porque acá la
 * propiedad nunca llega a ser la fuente de los datos.
 *
 * O sea que **la verificación de esto es de navegador**, y así se hizo: `qd_strIdType` (7 opciones)
 * y `qd_strDepartment` (33) de la SCR-000, que pintaban **0**, pintan todas. El spec deja una guarda
 * de no-regresión del camino feliz y el arnés que hace observable el listado, nada más. Quien lea
 * esa suite en verde **no debe** concluir que este arreglo está cubierto.
 *
 * El arreglo vive **acá**, en la fachada, y no en las pantallas: es lo que esta capa existe para
 * hacer (ver la cabecera de `CampoBase` — "neutraliza sus gotchas para que ninguna pantalla los
 * vea"), y con un solo cambio quedan cubiertos los 37 `<zds-select>` de las 7 pantallas portadas,
 * sin trabajo por pantalla. Es también lo que pide la política del proyecto: todas las pantallas usan
 * el mismo elemento base, y donde el DS falla se neutraliza en un solo lugar.
 */
@Component({
  selector: 'zds-select',
  standalone: true,
  imports: [InputSelectZ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZdsSelect),
      multi: true,
    },
  ],
  template: `
    <div
      class="zds-select-wrap"
      [class.zds-select-wrap--deshabilitado]="deshabilitado()"
      [id]="strId"
      tabindex="-1"
    >
      <lib-input-select-z
        [group]="grupo"
        [name]="name()"
        [label]="label()"
        [model]="model() ?? ''"
        (modelChange)="alCambiarModelo($event)"
        [options]="cllOpcionesLib()"
        [multiSelect]="multiSelect()"
        [required]="obligatorio()"
        [helpText]="strTextoAyudaSelect"
        [invalid]="blnEnError"
        [manualValidation]="true"
      />
    </div>
  `,
})
export class ZdsSelect extends CampoBase<string> {
  readonly options = input<readonly OpcionZds[]>([]);

  /**
   * Prompt del select. **Redeclara el `placeholder` de `CampoBase` a propósito** (de ahí el
   * `override`): en los demás campos el placeholder es un passthrough al atributo del input, pero
   * `lib-input-select-z` no tiene ningún input de placeholder — acá se implementa como una primera
   * `<option>` de valor vacío, que es el mismo truco que usa la fachada React.
   *
   * Diferencia con React que vale conocer: allá esa opción va con `disabled: true` para que no se
   * pueda re-seleccionar. Acá la lib emite `<option [value]="...">` **sin** `[disabled]`, así que el
   * prompt es elegible y volver a elegirlo deja el campo vacío. Eso lo atrapa `Validators.required`
   * en el control, que es donde el proyecto ya declara la obligatoriedad.
   */
  override readonly placeholder = input<string>('');

  readonly multiSelect = input(false);

  /**
   * `true` mientras las opciones se cargan de una colección PM4. En React deshabilitaba el select y
   * mostraba "Cargando opciones..." como help-text. Acá **solo** hace lo segundo: el select no se
   * puede deshabilitar (ver el gotcha de `disable` arriba). Se deja el prop porque el texto de carga
   * sí es visible y las pantallas lo pasan; lo que no se puede es prometer el disabled.
   */
  readonly loading = input(false);

  /**
   * Traduce las opciones de la fachada al par `{value, description}` que la lib renderiza.
   *
   * `text ?? label ?? value` replica exactamente el orden de la fachada React, así que una pantalla
   * portada no cambia de etiqueta. `disabled` por opción **se descarta**: la lib emite un
   * `<option>` pelado sin `[disabled]`, así que no hay dónde ponerlo — salvo el placeholder, que la
   * lib tampoco puede deshabilitar y por eso queda como primera opción de valor vacío.
   */
  protected readonly cllOpcionesLib = computed<OpcionLib[]>(() => {
    const cllBase: OpcionLib[] = this.options().map((in_objOpcion) => ({
      value: in_objOpcion.value,
      description: in_objOpcion.text ?? in_objOpcion.label ?? in_objOpcion.value,
    }));

    return this.placeholder()
      ? [{ value: '', description: this.placeholder() }, ...cllBase]
      : cllBase;
  });

  private readonly objAnfitrion: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    super();

    // Repone las opciones sobre el `z-select`, que es lo que despierta el render que el DS no agenda
    // cuando los `<option>` del slot llegan tarde. Ver el bloque "El gotcha GRAVE" de la cabecera:
    // sin esto, un catálogo que resuelve después del primer render deja el select vacío para siempre
    // y sin ningún síntoma en consola.
    //
    // ⚠ **El elemento es el `z-select`, NO el `za-select`, y confundirlos deja el arreglo sin efecto
    // con toda la pinta de estar funcionando.** Se midió: escribir la propiedad en el `za-select`
    // dejaba `options.length === 33` en ese elemento y **0 opciones pintadas** en el listado que ve
    // el usuario. El `za-select` es el envoltorio de Angular —no tiene shadow root ni reactividad de
    // Lit—, así que ahí `options` es una propiedad muerta: nadie la lee. El elemento de Lit es el
    // `z-select` que ese envoltorio rinde adentro, y es también quien tiene los `<option>` como
    // hijos directos. Asignarle `options` a **él** pintó las 33 al instante.
    //
    // Va en `afterRenderEffect` por los mismos dos motivos que el `max-length` de `zds-textarea`: el
    // `z-select` lo pinta el template del `za-*` —dos niveles abajo, no garantizado en el primer
    // pasaje— y `cllOpcionesLib()` es un derivado de un signal input, así que el efecto se
    // re-ejecuta solo en cuanto el catálogo llega. Es DOM directo porque la lib no expone ninguna
    // palanca: su único canal hacia el DS es el slot, que es justo el que no despierta a Lit.
    afterRenderEffect(() => {
      // La lectura va primero y SIEMPRE: es lo que suscribe el efecto al catálogo. Leerla después
      // del `if` de abajo lo dejaría sin dependencia en el primer pasaje —cuando el elemento
      // todavía no existe— y entonces no volvería a correr al llegar las opciones, que es
      // exactamente el caso que este efecto existe para cubrir.
      const cllOpciones = this.cllOpcionesLib();

      // `z-multiselect` cuando `multiSelect` está puesto: la lib cambia el elemento, no el modo.
      const objSelect = this.objAnfitrion.nativeElement.querySelector<HTMLElement>(
        'z-select, z-multiselect',
      );
      if (!objSelect) return;

      // ⚠ `text`, no `description`. El elemento del DS normaliza con
      // `text: (innerText ?? opt.text) || opt.value`, así que un `description` acá dejaría cada
      // etiqueta en el `value` crudo. Ver la cabecera.
      (objSelect as HTMLElement & { options?: unknown }).options = cllOpciones.map(
        (in_objOpcion) => ({
          value: in_objOpcion.value,
          text: in_objOpcion.description,
        }),
      );
    });
  }

  /** El error explícito manda; si no, el texto de carga; si no, el `helpText`. Orden de React. */
  protected get strTextoAyudaSelect(): string {
    if (this.error()) return this.error();
    if (this.loading()) return 'Cargando opciones...';
    return this.helpText();
  }
}
