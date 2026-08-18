import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ZrStageBanner } from '../../../../components/fields/zds-reexports';

/**
 * Chrome de la página pública de radicación (`PqrPage` de React): barra navy, banner azul con
 * titular + descripción, la hoja de secciones proyectada, y el footer corporativo.
 *
 * Solo lo usa SCR-000, la única pantalla que se publica como **página web** en vez de embeberse
 * como tarea de PM4 (las demás usan `app-screen-header` + `app-form-section`). Los estilos viven
 * en `shared.css` (`.pqr-*`), tokenizados.
 *
 * ── ⚠ Divergencia 1: el logo NO va en un slot del componente de navegación ──────────────────────
 * React hace `<ZrNavigation><img slot="logo" …/></ZrNavigation>`. Acá no se puede, y no es una
 * limitación del port sino del wrapper de Colombia. Verificado sobre la plantilla compilada de
 * `lib-navigation-z` (`fesm2022/zurich-col-lib-zurich.mjs`), que es entera:
 *
 * ```html
 * <za-navigation config="" [routes]="routes" [social]="social"></za-navigation>
 * ```
 *
 * No hay `<ng-content>` en ninguna parte (coherente con el `never` en la posición de
 * `ngContentSelectors` de su `ɵcmp`), así que un hijo `<img slot="logo">` no tiene dónde
 * proyectarse: Angular lo descartaría en silencio y la barra saldría sin logo. Peor: el wrapper
 * tampoco reenvía `isotype`, `menu`, `with-top` ni `custom` — de los ocho inputs que `za-navigation`
 * declara, pasa tres (`config` fijo en `""`, `routes`, `social`), y ninguno sirve para un logo.
 *
 * Por eso la barra se maqueta acá con el `<img>` directo sobre `.pqr-topnav` + `.pqr-topnav-logo`,
 * y **no** se usa `lib-navigation-z`. Es la excepción de layout que la política de `shared.css`
 * contempla ("layout o estructura → CSS propio"): lo que se necesita es una barra de altura fija
 * con un logo, no la navegación con rutas y redes que ese componente sabe pintar.
 *
 * ── ⚠ Divergencia 2: el banner pierde la composición de React y GANA la tipografía del DS ───────
 * React compone el titular y el párrafo *dentro* de `content`, con `font` inline
 * (`--zf-h-44` y `--zf-body-20--300`), aprovechando que su wrapper tipa
 * `content: string | ReactNode`. El wrapper Angular tipa `content: string` y su plantilla lo rinde
 * como interpolación de texto (`{{ content }}`), así que un `TemplateRef` no compila y un string
 * con markup se escaparía como texto literal.
 *
 * El `z-stage-banner` de abajo **sí** tiene dos slots reales y su orden es fijo
 * (`web-components/dist/stage-banner.js`):
 *
 * ```js
 * <main>
 *   <h6>${this._slot(this.category, "category")}</h6>   // font: --zf-body-20--600
 *   <h3>${this._slot(this.content)}</h3>                // font: --zf-h-48
 * </main>
 * ```
 *
 * `<h6>` va **arriba** del `<h3>`, o sea que el slot chico es el de arriba. Meter el intro en
 * `category` pintaría el párrafo chico sobre el titular grande — invertido respecto del diseño
 * aprobado. Y `z-stage-banner` no es alcanzable como tag suelto: `zds-setup.ts` importa
 * `css-components/javascript.js`, que registra los custom elements de **css-components**; los de
 * **web-components** se registran solo cuando un wrapper los importa.
 *
 * Así que el titular viaja por `content` (el slot grande, que es donde el diseño lo quiere) y el
 * intro sale del banner: va como `.pqr-note` en la hoja de secciones. Lo que se pierde es que el
 * párrafo deje de estar sobre el fondo azul; lo que se gana es que el titular pase a
 * **`--zf-h-48`**, que es exactamente lo que usaba `.pqr-banner-title` antes de las dos
 * migraciones — React lo había bajado a `--zf-h-44` al forzar el font inline. Sobre el eje de
 * paridad del proyecto ("si el componente del DS se ve algo distinto del CSS a mano, gana el
 * componente del DS") esto es el DS acercándose al diseño, no alejándose.
 *
 * `shape="3"` y los dos tokens de color se conservan tal cual de React.
 */
@Component({
  selector: 'app-pqr-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZrStageBanner],
  templateUrl: './pqr-page.html',
})
export class PqrPageComponent {
  /** Titular del banner azul. Viaja por el slot `content` — ver la ⚠ Divergencia 2 de la clase. */
  public readonly titulo = input.required<string>();

  /**
   * Texto de apoyo bajo el titular. Se rinde **fuera** del banner, como `.pqr-note`, porque el
   * wrapper del DS no admite dos piezas de texto en el orden que pide el diseño — ver la clase.
   */
  public readonly intro = input.required<string>();

  /**
   * Ruta del logo, relativa a la raíz servida. Mismo idioma que `screen-header.ts`: `angular.json`
   * publica `public/` como assets, y un `import … from '*.png'` necesitaría una declaración de
   * módulo que el tsconfig no tiene.
   */
  protected readonly rutaLogo = 'resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

  /**
   * Colores del banner, por el canal que el DS define para esto.
   *
   * ── ⚠ Divergencia 3: los colores van por `customStr`, no por un `style` del host ───────────────
   * React los seteaba como estilo inline del wrapper (`--z-stage-banner--bg`/`--color`) porque su
   * wrapper no ofrecía otra vía. El de Colombia sí: expone `customStr`, que reenvía a
   * `[custom-str]` del `z-stage-banner`, y ahí el getter `_cssTokens`
   * (`web-components/dist/base.js`) lo convierte en tokens `--z-{nombre}--{clave}` puestos como
   * estilo inline del `<section>` interno:
   *
   * ```js
   * return this["custom-str"].split(";").reduce((acc, v) => {
   *   const [k, val] = v.trim().split(":");
   *   return val ? `${acc}--z-${this._name}--${k.trim()}:${val.trim()};` : acc;
   * }, "");
   * ```
   *
   * Se usa esa vía y no el `style` heredado porque el token termina declarado **sobre el elemento
   * que lo consume** en vez de heredado desde el host — si mañana el DS agrega su propio
   * `custom-str` por default, un `style` en el host perdería contra él en silencio. El getter parte
   * por `;` y por `:` tomando dos trozos, así que un `var(--…)` pasa entero (no lleva `:` adentro) y
   * las claves quedan sin prefijo: `bg` → `--z-stage-banner--bg`.
   *
   * ── ⚠ Y los defaults que SÍ pintan solos ───────────────────────────────────────────────────────
   * Leídos del código del wrapper (no de sus comentarios, que describen initializers viejos —el
   * comentario de `customStr` menciona un cian `#73DCE6` que el código no tiene):
   * `category = 'Category Header'` y `content = 'CONTENT'`. Los dos son literales en inglés que se
   * pintan si el input queda sin atar, así que `category=""` en la plantilla **es obligatorio**, no
   * cosmético: sin él sale "Category Header" arriba del titular. `content` siempre se ata.
   */
  protected readonly strTokensBanner = 'bg: var(--z-blue); color: var(--zg-white-zurich);';
}
