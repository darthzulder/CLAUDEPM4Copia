/**
 * Re-exports **sin CVA** de la fachada: los componentes del DS que no son campos de formulario y por
 * lo tanto no necesitan `ControlValueAccessor` ni `FormControl`. Una pantalla los importa desde acá
 * (nunca desde `@zurich-col/*` ni `@zurich/*` — lo bloquea el `no-restricted-imports` de ESLint) y
 * los usa con el selector nativo del DS.
 *
 * ```ts
 * import { ZrButton, ZrTable } from '../../components/fields/zds-reexports';
 * // @Component({ imports: [ZrButton, ZrTable], ... })
 * ```
 * ```html
 * <lib-button-z label="Enviar" [disabled]="false" (eventClick)="enviar()" />
 * ```
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
 * **1. `ButtonZ.disabled` arranca en `true`.** Verificado: `disabled = true` en el campo de la clase.
 * O sea que `<lib-button-z label="Enviar" />` **monta deshabilitado**. Toda pantalla tiene que pasar
 * `[disabled]="false"` (o la expresión real) de forma explícita. Es el único gotcha de esta lista que
 * el plan de migración ya anticipaba y que resultó exacto.
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
  ZTemplate as ZrTemplate,
} from '@zurich-col/lib-zurich';

export {
  // Ver el punto 5b del docstring: la caja de alerta INLINE, que es la forma en que React usaba
  // `ZrAlert` dentro del markup. No sustituye a `ZrAlert` (la cola imperativa de `lib-alert-z`) —
  // son dos usos distintos y las dos siguen vivas.
  ZaAlert as ZrAlertInline,
  ZaIcon as ZrIcon,
  ZaKpiValue as ZrKpiValue,
  ZaPagination as ZrPagination,
  ZaSwitch as ZrSwitch,
} from '@zurich/angular-components';
