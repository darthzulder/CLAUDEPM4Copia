/**
 * Re-exports **sin CVA** de la fachada: los componentes del DS que no son campos de formulario y por
 * lo tanto no necesitan `ControlValueAccessor` ni `FormControl`. Una pantalla los importa desde acá
 * (nunca desde `@zurich-col/*` ni `@zurich/*` — lo bloquea el `no-restricted-imports` de ESLint) y
 * los usa con el selector nativo del DS.
 *
 * ```ts
 * import { BotonHabilitado } from '../../components/fields/boton-habilitado';
 * import { ZrButton, ZrTable } from '../../components/fields/zds-reexports';
 * // @Component({ imports: [ZrButton, BotonHabilitado, ZrTable], ... })
 * ```
 * ```html
 * <lib-button-z label="Enviar" (eventClick)="enviar()" />
 * ```
 *
 * `BotonHabilitado` va junto a `ZrButton` **siempre** —lo exige una guarda— porque el `disabled` del
 * vendor arranca en `true`. Ver el gotcha 1.
 *
 * ── Por qué son alias y no wrappers, y dónde está el límite de esa decisión ────────────────────
 * Un alias (`export { ButtonZ as ZrButton }`) no puede neutralizar un default ni renombrar un input:
 * la pantalla sigue escribiendo el selector y los inputs reales del DS. Se eligió alias igual porque
 * la alternativa —un componente envoltorio— **rompería la proyección de contenido** de la mitad de
 * esta lista: `ModalZ`, `TableZ` y `TileZ` leen sus slots con
 * `@ContentChildren(ZTemplate)` sobre `<ng-template libZTemplate id="...">`
 * (verificado: `selector: 'ng-template[libZTemplate]'`, y el `id` se inyecta con
 * `@Attribute('id')`). Un envoltorio intermedio se quedaría con esos `ng-template` en **su** propio
 * `ContentChildren` y el componente del DS recibiría cero slots — un modal que monta vacío, sin error.
 *
 * La consecuencia asumida: los gotchas de abajo **no se pueden esconder** dentro de la fachada como
 * sí se hizo con los campos. Se documentan acá y se aseveran en `zds-reexports.spec.ts`, que es lo
 * que los convierte en algo que se rompe en rojo en vez de en una sorpresa en runtime.
 *
 * ── Los cinco gotchas medidos en el bundle (no leídos de la doc) ───────────────────────────────
 *
 * **1. `ButtonZ.disabled` arranca en `true` — ya envuelto, ver [`boton-habilitado.ts`](./boton-habilitado.ts).**
 * Verificado: `disabled = true` en el campo de la clase, así que `<lib-button-z label="Enviar" />`
 * **monta deshabilitado**, pintado y sin responder al clic. Es el único gotcha de esta lista que el plan
 * de migración ya anticipaba y que resultó exacto.
 *
 * Es también el único que **sí** se pudo esconder detrás de la fachada, a pesar de la restricción del
 * párrafo anterior: la directiva `BotonHabilitado` invierte el default sin envolver el componente, así
 * que no hay `ContentChildren` que interceptar. Una pantalla la suma a sus `imports` —nada que escribir
 * en la plantilla— y sus botones quedan habilitados por omisión. **No hace falta seguir escribiendo
 * `[disabled]="false"`**; los 43 que ya existen quedan y siguen mandando. La guarda
 * `guarda-boton-habilitado.spec.ts` pone rojo si una pantalla importa `ZrButton` sin la directiva.
 *
 * **2. `LoaderZ.customStr` es un input MUERTO.** El plan decía "tiene un `custom-str` hardcodeado
 * verde además del bindeado → el wrapper decide y documenta cuál gana". Medido: el wrapper **no puede
 * decidir**, porque la plantilla del DS pone las dos cosas sobre el mismo elemento:
 *
 * ```html
 * <za-loader [custom-str]="customStr"
 *            custom-str="color:#06e7a3; size: 50px; stroke: 10px; fill: #06e7a3;">
 * ```
 *
 * El `[custom-str]` escribe una **propiedad** del DOM y el atributo estático escribe el **atributo**;
 * el `za-loader` de Lit lee el atributo. Verificado en runtime con un spec desechable que bindeó
 * `customStr="color:#ff0000; size: 99px;"` y midió el elemento resultante:
 * `{ attr: 'color:#06e7a3; size: 50px; stroke: 10px; fill: #06e7a3;', prop: 'SIN-PROP' }`.
 * O sea que el verde hardcodeado gana **siempre** y la propiedad ni existe. **El loader del DS es
 * verde y de 50 px, y no hay input que lo cambie** — si una pantalla necesita otro tamaño o color, va
 * por CSS sobre el `za-loader`, no por `customStr`. `label` sí funciona (es interpolación de texto).
 *
 * **3. `ModalZ` NO bloquea el scroll del body, así que NO hay que restaurarlo.** El plan pedía que el
 * wrapper "mantenga el `ngOnDestroy` que restaura `document.body.style.overflow`". **Portarlo sería un
 * bug:** `document.body.style` tiene **0 ocurrencias** en toda la librería, y el único `overflow` que
 * existe es CSS de su propia hoja (`.overflow_content { max-height: 53vh; overflow-y: auto }`, que
 * scrollea el *contenido* del modal). El `body.style.overflow` de
 * `frontend/src/components/fields/ZdsFields.tsx` era un workaround del componente **React**; acá no
 * hay nada que bloquear, y un `ngOnDestroy` que escriba `document.body.style.overflow = ''`
 * **desbloquearía** un scroll que nadie bloqueó (pisando, por ejemplo, el de un modal externo).
 *
 * Lo que `ModalZ` sí hace y conviene saber: `ShowBackdrop` **con S mayúscula** (default `true`), y su
 * `change()` hace `this.open = false` — muta su **propio input** además de emitir `(close)`. Con
 * `[open]="blnAbierto"` de una sola vía, el componente y la pantalla quedan desincronizados tras
 * cerrar desde el backdrop o la X; hay que escuchar `(close)` y bajar la bandera de la pantalla.
 * No tiene `ngOnDestroy`, así que no limpia nada al desmontarse.
 *
 * **3-bis. ⚠⚠ `ZrModal` es `ModalZ`, y NO envuelve ningún `z-modal`. Su ancho es un `vw` FIJO.**
 * Este alias (`ModalZ as ZrModal`, más abajo) engañó a dos diagnósticos seguidos del tamaño de la
 * vista previa, así que queda acá y no solo en el componente. `ModalZ` es un modal escrito a mano —sin
 * shadow DOM, sin `z-modal` adentro— y su CSS propio es:
 *
 * ```css
 * .modal-window{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:2rem;
 *   border-radius:1.5rem;min-width:300px;max-width:90vw}
 * .modal-window--l{width:60vw} .modal-window--m{width:50vw}
 * .modal-window--s{width:40vw} .modal-window--xs{width:30vw}
 * .modal-backdrop{position:fixed;inset:0;background:#00000080}
 * ```
 *
 * Las tres consecuencias que hay que tener presentes al escribir una modal nueva:
 * - **`tamanio` NO es inerte** (es un `@Input()`, y sus cinco miembros son `open`, `close`, `tamanio`,
 *   `ShowBackdrop`, `template`). Alimenta un `[ngClass]` y su **default es `xs` = 30vw**. Omitirlo
 *   deja la modal a un tercio del ancho: es exactamente lo que le pasó a `preview-modal.ts`, el único
 *   sitio que no lo pasaba.
 * - **⚠⚠ Pero elegir bien el `tamanio` NO da paridad con React, y esto es lo que más cuesta ver.** Los
 *   dos modales dimensionan al revés: el `<section>` del `z-modal` del DS **no declara ancho** (es un
 *   ítem de grilla que se mide por su contenido, así que el marco iguala al contenido siempre),
 *   mientras `ModalZ` fija un `vw`. Un contenido de ancho propio —los `min(1080px, 94vw)` de
 *   `.preview-modal` y `.modal-wide`— **desborda el marco** en cualquier viewport donde el `vw` no
 *   coincida: medido a 1600x900, marco 960px contra contenido 1080px. Y **no se ve como scroll**
 *   (`.modal-window` tiene `padding: 2rem` y no declara `overflow`, así que el hijo se escapa sin que
 *   `scrollWidth` lo registre), de ahí que un chequeo anterior lo diera por bueno. La salida, cuando el
 *   contenido tiene ancho propio, es que **el contenido mande**: ver la regla `:has()` al final de
 *   `shared.css`, hoy acotada a la vista previa (los otros dos modales anchos son deuda medida).
 * - **Las custom properties `--z-modal--*` del DS no aplican acá.** El padding (`2rem`) y el backdrop
 *   (`#00000080`) están hardcodeados en su hoja. Portar el `style` de un `ZrModal` de React —que sí
 *   monta el `z-modal` del DS y sí declara esos `var(--z-modal--…)`— no hace nada.
 *
 * **4. `TableZ.generciEndName` — el typo es real y hay que escribirlo así.** Verificado en el campo de
 * la clase. Su hermano `genericStartName` sí está bien escrito, lo que hace el error más fácil de
 * cometer. Y el límite que el plan anticipaba también es real: `checkAll` se resuelve con un query
 * global, así que **dos `lib-table-z` con `tableCheck` en la misma pantalla colisionan**. Hoy ninguna
 * pantalla lo hace; queda documentado para que no se descubra en producción.
 *
 * **5. `AlertZ` no tiene ningún `@Input`: las alertas son IMPERATIVAS.** No es un componente al que se
 * le pasa un mensaje — es un **contenedor de render** que se suscribe a `AlertZService.alerts$` (un
 * `BehaviorSubject`) y pinta la cola. El contrato real: se monta `<lib-alert-z />` **una vez** por
 * pantalla y los mensajes se disparan con el servicio, que es `providedIn: 'root'`:
 *
 * ```ts
 * private readonly objAlertas = inject(AlertZService);
 * this.objAlertas.negative('No se pudo guardar');   // .info() .positive() .alert() .show() .remove() .clear()
 * ```
 *
 * Coincide con la fila del plan (`lib-alert-z` + **`AlertZService`**), y es la razón por la que el
 * servicio se re-exporta acá junto con los componentes: sin él el componente no muestra nada.
 *
 * **5b. Y por eso hay DOS alertas, no una: `ZrAlert` (cola imperativa) y `ZrAlertInline` (caja
 * declarativa).** El hallazgo del punto 5 tiene una consecuencia que no se ve hasta que hay que portar
 * una pantalla: React usa la alerta de las **dos** formas, y `lib-alert-z` solo cubre una.
 *
 * `RequestFileList.tsx` escribe `<ZrAlert config="negative">{strError}</ZrAlert>` **dentro** de su
 * markup, en el lugar exacto donde va el mensaje, y lo mismo con `config="info"` para el estado vacío.
 * Eso es una **caja inline**: vive donde está el contenido que describe, aparece y desaparece con un
 * `@if`, y no tiene cola ni ciclo de vida propio. Mandarlo por `AlertZService` cambiaría el
 * comportamiento —el mensaje saltaría al contenedor global de la pantalla en vez de quedar debajo del
 * título de la lista— y además obligaría a llamar `.remove()` a mano cada vez que el error se resuelve,
 * porque el servicio **acumula**: dos cargas fallidas seguidas dejarían dos alertas apiladas.
 *
 * `za-alert` sí es esa caja, y su contrato coincide **input por input** con el de React (verificado en
 * `dist/fesm2022/angular.mjs`, no supuesto):
 * `inputs: { config, icon, hideClose: ["hide-close", …], confirmText: ["confirm-text", …], custom }`,
 * `outputs: { close, confirm }`, y `<ng-content>` para el cuerpo. Así que el port es literal:
 *
 * ```html
 * <za-alert config="negative" hide-close>No se pudo cargar…</za-alert>
 * ```
 *
 * Ojo con `hide-close`: el template de `za-alert` lo pasa hacia abajo como
 * `[hide-close]="hideClose || undefined"`, o sea que un `false` viaja como **`undefined`**, no como
 * `false`. Para el custom element es lo mismo (ausente = no ocultar), pero explica por qué el atributo
 * no aparece en el DOM cuando se le pasa `false` — no es que el binding no funcione.
 *
 * Las dos se exportan y **ninguna reemplaza a la otra**: `ZrAlert` para avisos de resultado de una
 * acción (guardar, reasignar), que es lo que corresponde mandar a una cola global; `ZrAlertInline` para
 * el estado de un bloque de la pantalla. Es la única entrada de esta fachada donde un mismo nombre de
 * React se abre en dos componentes, y el motivo es que `lib-zurich` fusionó dos conceptos que el DS de
 * React tenía separados.
 *
 * ── Qué NO existe en `lib-zurich` y por lo tanto baja al nivel `za-*` ─────────────────────────
 * La librería exporta **26** selectores `lib-*-z`, y entre ellos **no hay** `lib-icon-z`,
 * `lib-switch-z`, `lib-kpi-value-z` ni `lib-pagination-z`. Por la jerarquía de fuentes vigente
 * (`InsumosZurich` → `vendor/zurich-angular` → preguntar) esos cuatro se toman de
 * `@zurich/angular-components`, que está en el **mismo** nivel 1 — así que no hubo que escalar nada.
 *
 * `ZaKpiValue` y `ZaPagination` son campos-menos, puro display; `ZaSwitch` **sí** tiene CVA nativo
 * (hereda de `ZaBaseInput`), así que una pantalla puede usarlo con `[formControl]` directo sin pasar
 * por un wrapper — es el único de esta lista que toca un formulario, y por eso no necesita uno.
 *
 * ── Ojo con el nombre del input de los `za-*` ────────────────────────────────────────────────
 * `za-icon` usa **`icon`**, no `name`, y Angular 21 lo hace fallar duro (`NG8008: Required input
 * 'icon' must be specified`). Es el hallazgo 2 del gate 0 y vale como recordatorio general: los
 * inputs de `za-*` se verifican contra `dist/fesm2022/angular.mjs` antes de escribirlos, nunca se
 * asumen por el nombre que tendrían en otra librería.
 *
 * ── ⚠ Y ojo con el ALIAS KEBAB: el input existe, tipa bien, y el camelCase no llega ───────────
 * Varios inputs de `za-*` **solo** se pueden bindear por su alias en kebab-case. El nombre de la
 * propiedad TypeScript no es un binding válido: `[calendarType]="'range'"` **compila y no hace nada**
 * (Angular no encuentra un input con ese nombre público y lo trata como propiedad del DOM). El
 * síntoma es el peor posible — cero error, componente montado, comportamiento default.
 *
 * Verificado contra los `.d.ts` por componente (la lista de `ɵɵComponentDeclaration`, que es donde
 * viven los alias reales), no por grep sobre el `.mjs`:
 *
 * | Componente | Alias kebab obligatorios |
 * |---|---|
 * | `ZrCalendar` | `calendar-type`, `first-weekday`, `today-nav`, `selected-nav`, `today-text`, `selected-text` |
 * | `ZrProgressBar` | `progress-bar-title`, `no-percentage` |
 * | `ZrTextInput` | `input-type`, `max-length`, `data-list`, `align-right` |
 * | *(todos los que heredan de `ZaBaseInput`)* | `help-text` |
 *
 * O sea: `<za-calendar calendar-type="range" />`, no `[calendarType]`. Los demás inputs de esos
 * componentes (`wide`, `progress`, `config`, `max`, `placeholder`, `pattern`, `icon`…) sí coinciden con
 * su nombre de propiedad. Es la misma familia de defecto que el `[attr.x]` de más abajo: el DOM se ve
 * bien y el render está mal.
 *
 * ── CVA nativo: cuatro `za-*` son campos de formulario y NO necesitan wrapper ──────────────────
 * `ZaBaseInput` implementa `ControlValueAccessor` **completo** (`writeValue`, `registerOnChange`,
 * `registerOnTouched`, `setDisabledState`) y aporta `label`, `disabled`, `required`, `invalid`,
 * `locale`, `helpText`, `(blur)` y `(validated)`. `ZaInput` agrega `config`, `readonly`,
 * `autocomplete` y `(enter)`.
 *
 * `ZrSegmented` y `ZrTextInput` extienden `ZaInput`; `ZrStepper` y `ZrCalendar` extienden
 * `ZaBaseInput`. Los cuatro se usan con **`[formControl]` directo**:
 *
 * ```html
 * <za-stepper [formControl]="objPaso" [steps]="5" label="Paso" />
 * ```
 *
 * Por eso llevan prefijo `Zr` (re-export pelado) y no `Zds` (wrapper con CVA), aunque el plan de
 * migración los bautizara `ZdsSegmented`/`ZdsStepper`/`ZdsCalendar`: **no hay CVA que agregar**. Es la
 * misma decisión —y por el mismo motivo— que ya se había tomado con `ZrSwitch`. Los `Zds*` de
 * `components/fields/` siguen existiendo para los campos donde el wrapper sí aporta (el CVA de los
 * `lib-*-z`, que no lo traen, más label/error/`_desc`).
 *
 * ── ⚠ El `[ngModel]` de `ZaModelElement` va por `[(modeloZa)]` ────────────────────────────────
 * Afecta a **`ZrTabs`, `ZrSidebar` y `ZrPagination`**, los tres `ZaModelElement` de esta fachada (la
 * otra familia, `ZaBaseInput`, no tiene el problema: va por `[formControl]`, sección de arriba).
 *
 * El vendor declara su input con el **nombre pelado** `ngModel`, el mismo que la directiva `NgModel`
 * de Angular, así que un `[ngModel]` en la plantilla hace matchear a `NgControlStatus` (que
 * `ReactiveFormsModule` re-exporta) y tira **`NG0201` montando la pantalla entera**. Los tres se
 * bindean con la directiva [`ModeloZa`](./modelo-za.ts):
 *
 * ```html
 * <za-tabs [(modeloZa)]="sigTab" [tabs]="cllTabs" />
 * ```
 *
 * **Toda la explicación vive en `modelo-za.ts`** —causa raíz leída del fuente del vendor, la tabla de
 * las cuatro variantes medidas, por qué hacen falta las dos mitades y la alternativa descartada— y
 * **no se repite acá ni en las pantallas**: estaba duplicada en cuatro lugares, y eso fue la deuda
 * que la directiva cerró. La guarda [`guarda-ngmodel.spec.ts`](./guarda-ngmodel.spec.ts) pone rojo si
 * un `[ngModel]` reaparece en cualquier `.html`.
 *
 * ── ⚠ `ZrStageBanner` usa `imageSrc` camelCase, y ni él ni `ZrNavigation` proyectan contenido ──
 * Dos trampas de lo que esta fachada ya exportaba, que recién se ven al montar el catálogo porque
 * ninguna pantalla de negocio los usa así:
 *
 * 1. `StageBannerZ` declara **`imageSrc`** (camelCase), no el `image-src` kebab que escribe React.
 *    No es inconsistencia nuestra: React le habla al custom element de Lit (atributo), mientras
 *    `lib-stage-banner-z` es un componente de Angular (input). Igual con `addImage` y `roundedBanner`.
 * 2. `NavigationZ` y `StageBannerZ` tienen **`ngContentSelectors: never`** — cero slots. Así que el
 *    `<img slot="logo">` que React proyecta dentro de `ZrNavigation` **no tiene equivalente**: no hay
 *    dónde ponerlo. `routes`/`social` sí existen y funcionan.
 *
 *    ✅ **Y resulta que no hace falta, medido en el navegador:** el logo de Zurich igual aparece,
 *    porque lo pinta el `z-navigation` interno desde su **propio shadow DOM, por CSS** — no es un
 *    `<img>` ni un `<svg>` (se verificó enumerando el shadow root: cero elementos de imagen, y cero
 *    `<img>` proyectados por nosotros). O sea que la ausencia de slots no cuesta nada acá, y el
 *    resultado queda **mejor** que en React, donde ese logo proyectado se ve gris tenue. Sigue siendo
 *    cierto que no se puede proyectar nada; lo que era falso era suponer que por eso el logo faltaría.
 *
 * ── Card / Tile / Tabs / Footer bajan a `za-*`; Tooltip se queda en `lib-zurich` ───────────────
 * La jerarquía es `lib-zurich` → `za-*` → CSS propio, y acá se aplicó con una excepción **medida y
 * aprobada**, no por comodidad: para estos cuatro las dos librerías exponen APIs **incompatibles**, y
 * la de `lib-zurich` no puede expresar lo que la pantalla necesita.
 *
 * | | `lib-zurich` | `za-*` (el que se usa) |
 * |---|---|---|
 * | Card | `CardZ`: `showHeader`, `showFooter`, `bgColor` + slots `ZTemplate` | `ZaCard`: `content`, `level`, `size`, `config`, `clickable` |
 * | Tile | `TileZ`: `img`, `nameButton`, `imgLeft`, `disabled` + slots | `ZaTile`: `header`, `content` |
 * | Tabs | `TabsZ`: `headers[{title,key}]` + `data{}` | `ZaTabs`: `tabs[]`, `disabled` |
 * | Footer | `FooterZ`: **`{}` — cero inputs, cero slots** | `ZaFooter`: `columns`, `social`, `social-text`, `footer` |
 *
 * **`FooterZ` está vacía: no renderiza nada configurable.** Es el defecto que la nota de
 * `pm4-app/CLAUDE.md` advierte (se le había atribuido un `routes`/`social` que no tiene) — y la
 * contracara del mismo hallazgo es que **`ZaFooter` sí tiene ese `columns`/`social`**. El paquete
 * equivocado era el `lib-*`, no la prop.
 *
 * `ZrTooltip` **sí** sale de `lib-zurich`: `TooltipZ` y `ZaTooltip` exponen el mismo `text`/`config`,
 * así que ahí el primer escalón de la jerarquía no cuesta nada. Es la razón por la que la excepción es
 * de cuatro componentes y no de cinco.
 *
 * ── Y ojo con CÓMO los `lib-*-z` reenvían a los `za-*`: `[attr.x]` no cablea un input ─────────
 * Un input de `lib-*-z` puede existir, tipar bien, aceptar el valor **y no llegar a destino**. El caso
 * medido: `TextareaZ` reenvía el límite del contador con `[attr.max-length]="maxLength ? maxNumber : ''"`
 * —un binding de **atributo**— mientras `ZaTextarea` declara ese input como **propiedad**
 * (`inputs: { maxLength: ["max-length", "maxLength"] }`). En Angular un `[attr.x]` escribe el atributo
 * del DOM y **no** ejecuta el setter del input del hijo, así que la propiedad queda `undefined` y lo
 * que el `za-*` reenvía hacia abajo (al `z-*` de Lit, que es el que pinta) es `undefined`.
 *
 * Lo insidioso es el síntoma: el atributo **sí** queda visible en el `za-*` al inspeccionar el DOM, así
 * que la cadena parece cableada. Solo se ve que está roto comparando el render con React, que escribe
 * el atributo directo sobre el `z-*`. Y ningún spec que asevere el input del `lib-*-z` lo detecta —
 * hay que aseverar el atributo **sobre el `z-*`**, que es el final real de la cadena (y que bajo jsdom
 * existe en el DOM, porque lo pinta el template de un componente de Angular; lo que no ocurre ahí es
 * el upgrade de Lit, o sea que el contador en el shadow root no es aseverable, pero el atributo sí).
 * Ver `zds-textarea.ts`, que repone el atributo con un `afterRenderEffect`.
 */

/**
 * Forma de cada cabecera de `ZrTable`. Se re-exporta con nombre propio porque una pantalla **no puede
 * importar `TableModel` de `@zurich-col/lib-zurich`** (lo bloquea ESLint) y sin el tipo no hay forma de
 * declarar el array de cabeceras.
 *
 * El campo que importa: `title` es la etiqueta visible y **`key` es la propiedad que se lee de cada
 * fila de `data`**. Pasar `string[]` —el error natural— falla en compilación con `TS2322`, que es la
 * forma correcta de enterarse. Ojo también con `statuData` (otro typo de la lib, sin la `s`).
 */
export type { TableModel as ModeloTablaZr } from '@zurich-col/lib-zurich';

export {
  AlertZ as ZrAlert,
  AlertZService,
  ButtonZ as ZrButton,
  LoaderZ as ZrLoader,
  ModalZ as ZrModal,
  NavigationZ as ZrNavigation,
  StageBannerZ as ZrStageBanner,
  TableZ as ZrTable,
  // El único de los cinco Card/Tile/Tabs/Tooltip/Footer que se queda en `lib-zurich`: su API
  // (`text`/`config`) es idéntica a la de `ZaTooltip`, así que respetar el primer escalón de la
  // jerarquía no cuesta paridad. Ver la tabla de comparación en el docstring.
  TooltipZ as ZrTooltip,
  ZTemplate as ZrTemplate,
} from '@zurich-col/lib-zurich';

export {
  // Ver el punto 5b del docstring: la caja de alerta INLINE, que es la forma en que React usaba
  // `ZrAlert` dentro del markup. No sustituye a `ZrAlert` (la cola imperativa de `lib-alert-z`) —
  // son dos usos distintos y las dos siguen vivas.
  ZaAlert as ZrAlertInline,
  // ── Los cuatro con CVA nativo: se usan con `[formControl]` directo, sin wrapper ──────────────
  // Heredan `ControlValueAccessor` de `ZaBaseInput`, así que un `Zds*` no tendría nada que agregar.
  // Ver la sección "CVA nativo" del docstring para por qué el prefijo es `Zr` y no `Zds`.
  //
  // ⚠ Sus inputs con alias kebab (`calendar-type`, `first-weekday`, `input-type`, `max-length`…) NO
  // se pueden bindear por el nombre de la propiedad: `[calendarType]` compila y no hace nada.
  ZaCalendar as ZrCalendar,
  ZaSegmentedControl as ZrSegmented,
  ZaStepper as ZrStepper,
  ZaTextInput as ZrTextInput,
  // ── Card / Tile / Tabs / Footer: bajan a `za-*` por API incompatible con `lib-zurich` ────────
  // No es un atajo. `CardZ`/`TileZ`/`TabsZ` piden otra forma de datos y `FooterZ` está VACÍA (cero
  // inputs, cero slots: no renderiza nada). Ver la tabla del docstring.
  ZaCard as ZrCard,
  ZaFooter as ZrFooter,
  // ⚠ `ZaModelElement`: se bindea con `[(modeloZa)]`, NO con `[ngModel]` (que tira `NG0201` y deja la
  // pantalla sin montar). Ver `modelo-za.ts`.
  ZaTabs as ZrTabs,
  ZaTile as ZrTile,
  // ── Display y layout que `lib-zurich` no tiene ──────────────────────────────────────────────
  ZaBadge as ZrBadge,
  ZaChip as ZrChip,
  ZaEmptyState as ZrEmptyState,
  ZaIcon as ZrIcon,
  ZaInputGroup as ZrInputGroup,
  ZaKpiValue as ZrKpiValue,
  // ⚠ `ZaModelElement`, igual que `ZrTabs`: va con `[(modeloZa)]`. Ver `modelo-za.ts`.
  ZaPagination as ZrPagination,
  ZaProgressBar as ZrProgressBar,
  ZaPromo as ZrPromo,
  // ⚠ `ZaModelElement`, igual que `ZrTabs`: va con `[(modeloZa)]`. Ver `modelo-za.ts`.
  ZaSidebar as ZrSidebar,
  ZaSwitch as ZrSwitch,
  // ⚠ **No se consume en ninguna plantilla: existe para que los SPECS puedan tiparlo.** La píldora
  // de estado se usa siempre por `zds-status-badge`, que es quien envuelve `za-tag` y decide el
  // `fill`. Pero aseverar que ese `fill` llegó de verdad exige la INSTANCIA del componente del DS
  // —`fill` es un `input()`, no un atributo reflejado, así que `getAttribute()` devuelve `null`— y
  // para buscarla por tipo (`instanceof`) hace falta la clase. Sin esta línea el spec importaría
  // `@zurich/angular-components` directo, que es exactamente lo que la fachada existe para evitar:
  // la exención de `no-restricted-imports` es de `components/fields/**`, no de los specs de pantalla.
  ZaTag as ZrTag,
} from '@zurich/angular-components';
