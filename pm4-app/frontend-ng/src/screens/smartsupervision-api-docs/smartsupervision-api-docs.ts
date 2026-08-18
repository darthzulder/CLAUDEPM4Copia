import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Documentación estilo Swagger del Web Service Smartsupervisión (SFC).
 *
 * Es la única pantalla enrutada que **no es un formulario PM4**: no recibe `task_id` ni `case_id`, no
 * consume `TaskService` ni la fachada `zds-*`, y no completa ninguna tarea. Es un visor: la
 * documentación es una página HTML autónoma (tema oscuro, con sus propios estilos y su propio JS)
 * servida como asset estático desde `public/docs/`.
 *
 * ── ⚠ El iframe es AISLAMIENTO, no un atajo ────────────────────────────────────────────────────
 * Se embebe en un `<iframe>` a propósito, y el motivo pesa más en Angular que en React: el CSS global
 * del proyecto (`shared.css` + los tokens `base.css` del DS) se carga por el array `styles` de
 * `angular.json`, o sea **para todo el documento**. Inyectar el HTML de la doc en el árbol de la app
 * lo dejaría bajo esas reglas: la doc trae su propio tema oscuro y sus propios `<style>`, y las dos
 * hojas se pisarían en los dos sentidos. El iframe le da un documento aparte, que es exactamente el
 * límite que hace falta.
 *
 * Y no hay alternativa razonable: `[innerHTML]` no sirve —el `DomSanitizer` de Angular **borra** los
 * `<style>` y los `<script>` de la doc, así que llegaría sin tema y sin comportamiento— y el
 * `bypassSecurityTrustHtml` que lo evitaría sería inyectar HTML sin sanear para reimplementar peor el
 * aislamiento que el iframe ya da gratis.
 *
 * ── ⚠ Por qué el `src` va como ATRIBUTO ESTÁTICO y no como `[src]` ─────────────────────────────
 * Angular clasifica `iframe[src]` como contexto **`RESOURCE_URL`**, el más estricto: cualquier valor
 * **enlazado** que no haya pasado por el sanitizador lanza `NG0904: unsafe value used in a resource
 * URL context` en tiempo de render. Es lo que obligó a `pdf-viewer.ts` a usar
 * `bypassSecurityTrustResourceUrl` para su `blob:` URL (ver el ⚠⚠ de esa clase).
 *
 * Acá no hace falta, y la razón es la que importa: un atributo **estático** no es un binding, así que
 * no hay nada que sanear ni que saltear. `DOC_URL` es un literal fijo del código, no una entrada — no
 * existe ninguna cadena externa que pueda llegar a ese `src`. Importar `DomSanitizer` para envolver
 * una constante sería agregar la llamada que hay que justificar caso por caso justamente donde no se
 * necesita, y dejaría el precedente de un bypass sobre algo que mañana alguien podría volver
 * interpolable. La ruta vive en la plantilla, en un solo lugar.
 *
 * ── El `position: fixed` ────────────────────────────────────────────────────────────────────────
 * El iframe cubre el viewport entero (`.doc-viewer-frame`), igual que en React. Eso tapa el banner de
 * token de debug de `app.html` cuando se corre en dev con token de fallback; es el mismo
 * comportamiento que en React (allá el `position: fixed` va en un `style` en línea) y se preserva por
 * paridad. No es un defecto nuevo de este port.
 */

/**
 * La ruta de la doc, servida desde `public/docs/`.
 *
 * ⚠ **La plantilla la repite como literal, y tiene que ser así:** el `src` va estático (ver el ⚠ de la
 * clase), y un atributo estático no puede leer una constante del módulo. Esta copia existe para que el
 * spec asevere el `src` del DOM **contra ella** en vez de contra un literal escrito en el test, que
 * compararía una copia consigo misma. O sea: si alguien cambia la ruta en la plantilla y no acá, el
 * caso se pone rojo — que es justo lo que se quiere, porque el archivo del otro lado tiene que existir.
 *
 * Relativa **sin** barra inicial, igual que en React: la app vive embebida en un iframe de PM4 y no
 * siempre en la raíz del host, así que un `/docs/...` absoluto rompería en cuanto se despliegue bajo un
 * subpath. Los 7 archivos de `public/docs/` (la doc, el OpenAPI y el bundle de Swagger UI 5.17.14) se
 * referencian entre sí igual de relativo, así que el directorio funciona como unidad.
 */
export const DOC_URL = 'docs/smartsupervision-webservice.html';

/**
 * El nombre accesible del iframe.
 *
 * No es cosmético: un `<iframe>` sin nombre accesible se anuncia como "marco" y un lector de pantalla
 * no puede distinguirlo de cualquier otro. Y es el único asidero estable que tiene el spec para
 * encontrarlo, porque el elemento no tiene rol, ni texto, ni contenido propio que consultar.
 *
 * Va **enlazado** (`[title]`) y no como atributo estático, al revés que el `src`: `iframe[title]` no es
 * contexto `RESOURCE_URL` —es un atributo de texto, no una URL— así que el binding no necesita
 * sanitizador ninguno. Y enlazado sirve de algo: el spec lee la constante y asevera el DOM, así que
 * renombrar el título acá y no en la doc pone el caso rojo. Con el título estático en la plantilla, el
 * spec tendría que repetir el literal y compararía una copia consigo misma.
 */
export const DOC_TITULO = 'Documentación Web Service Smartsupervisión (SFC)';

@Component({
  selector: 'app-smartsupervision-api-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './smartsupervision-api-docs.html',
})
export class SmartsupervisionApiDocsComponent {
  /** Ver `DOC_TITULO`: enlazado a propósito, para que el spec pueda aseverarlo contra la constante. */
  protected readonly STR_TITULO = DOC_TITULO;
}
