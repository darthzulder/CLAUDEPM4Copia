import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfViewerComponent } from './pdf-viewer';
import { ZrIcon, ZrModal, ZrTemplate } from './fields/zds-reexports';

/** Alto del visor dentro del modal. Ver el bloque sobre `window.innerHeight` más abajo. */
const INT_ALTO_MAX = 820;
const NUM_FRACCION_ALTO = 0.82;

/** Título cuando el documento no trae nombre. Heredado textual de React. */
const STR_TITULO_DEFECTO = 'Vista previa';

/** Forma del documento que la pantalla manda a previsualizar. */
export interface DocumentoVistaPrevia {
  fileName: string;
  descripcion?: string;
  /**
   * URL `blob:` de un archivo que la pantalla ya bajó por su cuenta (el caso de un adjunto que el
   * usuario acaba de elegir y todavía no está en PM4). Ver el ⚠⚠ del componente: **tiene que ser
   * `blob:`**, y el componente lo verifica en vez de confiar.
   */
  blobUrl?: string | null;
  /** Id del archivo en PM4. Si viene, gana sobre `blobUrl` y lo pinta `app-pdf-viewer`. */
  fileId?: number | null;
}

/**
 * Modal de vista previa de un documento. Port de `components/PreviewModal.tsx`.
 *
 * ```html
 * <app-preview-modal
 *   [abierto]="blnVerPrevia()"
 *   [documento]="objDocPrevia()"
 *   (cerrar)="blnVerPrevia.set(false)"
 * />
 * ```
 *
 * ── ⚠⚠ `ModalZ` recibe el contenido por slots NOMBRADOS, no por `ng-content` ─────────────────────
 * Es la diferencia estructural con React y no se puede portar el markup tal cual. `ModalZ` no
 * proyecta contenido: lo lee con `@ContentChildren(ZTemplate)` y lo reparte en tres
 * `ngTemplateOutlet` según el **`id`** de cada template (`title`, `content`, `buttons`, verificado en
 * su `ngAfterContentInit`). O sea que el contenido va así:
 *
 * ```html
 * <lib-modal-z [open]="…"><ng-template libZTemplate id="content">…</ng-template></lib-modal-z>
 * ```
 *
 * Un `<div>` suelto adentro del `lib-modal-z` **no se pinta y no da error**: el modal monta con su
 * marco, su X y su backdrop, y el cuerpo vacío. Es el modo de falla que hace que valga un test que
 * asevera el contenido y no solo que el modal existe.
 *
 * Y el `id` va como **atributo estático**: `ZTemplate` lo recibe por `@Attribute('id')`, que se
 * resuelve una única vez al construir la directiva. Un `[id]="expresión"` llegaría como `null` y el
 * slot quedaría sin asignar — mismo síntoma de modal vacío y silencioso.
 *
 * ── ⚠ Los `ng-template` NO pueden ir dentro de un `@if` ──────────────────────────────────────────
 * Consecuencia directa de lo anterior, y la razón por la que el `if (!isOpen) return null` de React
 * **no** se porta como un `@if` alrededor del modal. `ngAfterContentInit` corre **una sola vez**: si
 * en ese momento los templates no existen porque un `@if` los tiene apagados, `ModalZ` guarda
 * `undefined` en sus tres slots y **no vuelve a mirar nunca más**. El modal quedaría vacío para
 * siempre a partir del primer cierre.
 *
 * Por eso el `@if` va **adentro** del slot `content`: los templates siempre están montados y lo que
 * aparece y desaparece es su contenido. `ModalZ` ya gobierna la visibilidad del marco con su propio
 * `@if (open)`, así que no hace falta desmontarlo desde acá.
 *
 * El detalle de **cuándo** se manifiesta, que importa para poder testearlo: `ngAfterContentInit`
 * guarda el `TemplateRef` en `this.content` y el modal lo pinta con
 * `<ng-template [ngTemplateOutlet]="content">`. Una vez capturada la **referencia**, que el nodo
 * fuente siga montado o no da igual — el outlet la reinstancia en cada apertura. O sea que el defecto
 * **no** aparece en un ciclo abrir→cerrar→reabrir si el modal montó abierto: ahí la captura salió
 * bien. Rompe cuando el modal monta **cerrado**, que es justamente el estado inicial real de una
 * pantalla (la bandera arranca en `false` y se abre al elegir un documento): la captura corre sin
 * template y no hay segunda oportunidad. Su caso de test parte de ahí, y por eso.
 *
 * ── Lo que el desmontaje de React SÍ hacía, y hay que preservar por otra vía ──────────────────────
 * El comentario de React decía que desmontaba para que `ZrModal` liberara su backdrop y su
 * scroll-lock. Eso acá **no aplica**: está verificado que `ModalZ` no toca `document.body.style` (ver
 * el punto 3 de la fachada), así que no hay nada que liberar y portar ese `ngOnDestroy` sería un bug.
 *
 * Pero el desmontaje hacía algo más que ese comentario no nombra y sí importa: **destruía el
 * `PdfViewer`**, y con él se disparaba la revocación de la blob URL del documento. Eso acá se
 * preserva, y **quien lo garantiza es `ModalZ`, no este componente**: su propia plantilla envuelve
 * los tres outlets en un `@if (open)`, así que al cerrarse baja toda la `.modal-window` y el visor se
 * destruye con ella. Su `DestroyRef` corre y el blob se libera.
 *
 * ⚠ Medido, y corrige lo que este bloque afirmaba antes. Decía que el `@if (abierto())` de adentro
 * del slot era lo que sostenía la revocación; **no es cierto**. Al mutarlo a `@if (true)` el visor
 * **igual** se destruye al cerrar (sonda desechable sobre el `ngOnDestroy` del visor:
 * `{"eventos":["creado","destruido"],"ventana":false,"visor":false}`), y por eso esa mutación
 * sobrevive sin que sea un agujero del test — no hay cambio de comportamiento que detectar.
 *
 * El `@if` de adentro se queda igual, por dos motivos que no son la revocación: evita evaluar
 * `intAlto()` (que lee `window.innerHeight`) y las interpolaciones de la cabecera mientras el modal
 * está cerrado, y hace explícito en este archivo que el cuerpo no vive fuera de la apertura, sin
 * depender de un detalle interno de la librería. Lo que **no** hay que hacer es sacar el
 * `@if (fileId)` del visor: eso sí lo pintaría con `fileId` nulo.
 *
 * ── El cierre: hay que escuchar `(close)` porque `ModalZ` MUTA su propio input ────────────────────
 * `change()` hace `this.open = false` además de emitir. Con un `[open]` de una sola vía el
 * componente y la pantalla quedan desincronizados tras cerrar desde el backdrop o la X: el modal se
 * esconde pero la bandera de la pantalla sigue en `true`, y el segundo intento de abrir no hace nada
 * porque el valor no cambió. De ahí que este componente reemita `(cerrar)` y la pantalla baje su
 * bandera.
 *
 * ── ⚠⚠ El `blobUrl` también choca con el sanitizador, y acá el bypass NO se justifica igual ──────
 * `iframe[src]` es contexto `RESOURCE_URL` siempre, así que sin sanear lanza
 * `NG0904: unsafe value used in a resource URL context` — el mismo error que `app-pdf-viewer`.
 *
 * Pero el argumento que justifica el bypass allá **no se puede copiar acá**, y esa es la diferencia
 * que importa. En `app-pdf-viewer` el valor lo produce `URL.createObjectURL()` en esa misma clase, o
 * sea que no existe forma de que una cadena externa llegue al bypass. Acá el valor **entra por un
 * input**: bypassearlo a ciegas convertiría este componente en el agujero exacto contra el que
 * advierte el docstring del visor ("lo que **no** se debe hacer es mover este bypass a un input").
 * Una pantalla que algún día pase ahí una cadena que venga de PM4 tendría un `javascript:` o un
 * `data:text/html` ejecutándose con el origen de la app, y este componente lo habría habilitado.
 *
 * La salida no es confiar ni prohibir, sino **verificar**: se sanea solo si la cadena empieza con
 * `blob:`, y si no, no se pinta nada. El esquema es lo que hace inofensiva a la URL (un blob no puede
 * ser otro origen ni ejecutar script en este), así que comprobarlo restituye localmente la garantía
 * que en el visor venía dada por la construcción. Los dos productores de hoy pasan un
 * `URL.createObjectURL()` local (verificado en SCR-008 y SCR-0051), así que la comprobación no cambia
 * el comportamiento vigente — cambia lo que pasa el día que alguien pase otra cosa. Va con caso de
 * test para las dos ramas.
 *
 * ── ⚠⚠ El tamaño: `ZrModal` acá NO es el `z-modal` del DS, es `ModalZ` — y `tamanio` SÍ existe ────
 * Este bloque contradice lo que decía antes, y la corrección es la que importa para entender el
 * ancho. **`ZrModal` en Angular es un alias de `ModalZ`** (`zds-reexports.ts:277`:
 * `ModalZ as ZrModal`), o sea `lib-modal-z` de `@zurich-col/lib-zurich` — **no** el `z-modal` de
 * `@zurich/web-components`. Los dos razonamientos anteriores sobre el ancho apuntaban al componente
 * equivocado, y por eso los dos fallaron.
 *
 * `ModalZ` no envuelve ningún `z-modal`: es un modal escrito a mano, sin shadow DOM, y su plantilla
 * y su CSS son (extraídos del `.mjs`, `class ModalZ`):
 *
 * ```css
 * .modal-window{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;
 *   padding:2rem;border-radius:1.5rem;min-width:300px;max-width:90vw}
 * .modal-window--l{width:60vw} .modal-window--m{width:50vw}
 * .modal-window--s{width:40vw} .modal-window--xs{width:30vw}
 * .overflow_content{max-height:53vh;overflow-y:auto}
 * ```
 *
 * De ahí las tres consecuencias medidas:
 *
 * 1. **`tamanio` NO es inerte.** Es un `@Input()` de `ModalZ` (sus cinco miembros son `open`, `close`,
 *    `tamanio`, `ShowBackdrop` y `template`) y alimenta un `[ngClass]` que elige
 *    `.modal-window--{l,m,s,xs}`. Su **default es `xs`**, o sea `width: 30vw`. Este componente era el
 *    **único** de los ocho sitios vivos que no lo pasaba —se lo quitó cuando se creyó que no hacía
 *    nada— así que su vista previa venía saliendo a 30vw. Sonda sobre el DOM montado:
 *    `className = "modal-window modal-window--xs"`. Eso es lo que el usuario veía como "muy chica".
 * 2. **`--z-modal--padding` y `--z-modal--backdrop` son inertes acá.** Nada en `ModalZ` las lee: su
 *    padding es un `2rem` hardcodeado y su backdrop un `#00000080` hardcodeado. Eran un port fiel del
 *    `style` de React (`PreviewModal.tsx:27-31`), pero React sí monta el `z-modal` del DS, que es
 *    quien declara esos `var(--z-modal--…)`. Acá no había nada que anular, así que se quitan.
 * 3. **El alto lo recorta `.overflow_content`, no nosotros.** `ModalZ` envuelve el slot `content` en
 *    `<div class="grid overflow_content">` con `max-height: 53vh`. `intAlto()` pide
 *    `min(82vh, 820px)` como React, así que dentro de una caja de 53vh el visor queda con scroll
 *    propio. Se conserva la cuenta de React por paridad de intención y porque el recorte es del
 *    contenedor de la librería; **no** se compensa bajando `intAlto()`, que solo movería el síntoma a
 *    un visor más chico.
 *
 * ── ⚠⚠ Y `tamanio="l"` NO alcanza: los dos modales dimensionan al REVÉS ──────────────────────────
 * Corrige lo que este bloque afirmaba hasta acá. Decía que con `tamanio="l"` la ventana mide `60vw` y
 * el contenido "pide su ancho adentro", y **medido en navegador es falso**: el contenido se sale. A
 * 1600x900, con `.preview-modal` idéntico byte a byte en los dos frontends:
 *
 * ```
 * React, `z-modal` del DS   → marco 1080px · contenido 1080px · desborde 0
 * Angular, `ModalZ` con `l` → marco  960px · contenido 1080px · desborde 152px
 * Angular, `ModalZ` sin él  → marco  480px · contenido 1080px · desborde 632px
 * ```
 *
 * La diferencia estructural: el `<section>` del `z-modal` del DS **no declara ancho** —es un ítem de
 * grilla que se mide por su contenido— así que el marco iguala al contenido en cualquier viewport.
 * `ModalZ` hardcodea un `vw` fijo, que no puede coincidir con el `min(1080px, 94vw)` del contenido
 * salvo por casualidad. Elegir un `tamanio` más grande hace el marco *menos* equivocado, no correcto.
 *
 * ⚠ Y el desborde **no se ve como scroll**: `.modal-window` tiene `padding: 2rem` y no declara
 * `overflow`, así que el hijo se escapa por la derecha sin que `scrollWidth` lo registre. Un chequeo
 * anterior daba `desborda: false` por eso y dio el ancho por bueno.
 *
 * Lo que iguala los dos frontends es una regla en `shared.css` que restituye el comportamiento del DS
 * solo acá (ver el bloque `⚠⚠ El marco de ModalZ se mide por su CONTENIDO` al final de la hoja):
 *
 * ```css
 * .modal-window:has(> .grid .preview-modal) { width: max-content; max-width: 90vw; }
 * .modal-window > .grid .preview-modal     { width: min(1080px, 90vw - 4rem); }
 * ```
 *
 * ⚠ Son **dos** reglas y las dos hacen falta; el `max-content` solo no alcanza. En viewports chicos el
 * `94vw` que `.preview-modal` pide en su regla base no deja lugar para los `4rem` de padding del marco,
 * así que el contenido tiene que ceder esos `4rem` contra el MISMO `90vw` que topea el marco. Con
 * `94vw - 4rem` el padding derecho se comprimía a 0 sin desbordar —invisible para un chequeo de
 * desborde—; el detalle medido está en el bloque de `shared.css`.
 *
 * Verificado en Chrome sobre el `shared.css` real: a 1600px marco 1144 / contenido 1080 (el número de
 * React) · a 800px marco 720 / contenido 656, en los dos con 32px de padding a cada lado. El
 * `tamanio="l"` de la plantilla **se queda igual, como piso**: si esa regla no aplicara —por un cambio
 * de plantilla del vendor— el modal cae en 60vw en vez de en los 30vw del default.
 *
 * ⚠ Deuda medida, no descubierta a medias: `expediente-completo-modal.html` y `detalle-caso-modal.html`
 * tienen el **mismo** defecto (usan `tamanio="l"` con `.modal-wide`, que pide el mismo
 * `min(1080px, 94vw)`). La regla va acotada a `.preview-modal` por decisión de alcance, no porque esos
 * dos casos estén sanos.
 *
 * Va con dos tests, y con la aclaración de qué cubre cada uno: uno asevera la **clase** que termina en
 * el DOM (no el atributo — el modo de falla era justamente que el atributo faltaba acá y estaba en los
 * otros ocho sitios sin que nada se pusiera rojo), y otro asevera la **estructura**
 * `.modal-window > .grid` de la que depende el `:has()`, que es la que rompería en silencio si el
 * vendor cambia su plantilla. El `max-content` en sí **jsdom no lo puede verificar** (no aplica CSS de
 * librería ni resuelve layout): eso se verificó con sonda en navegador.
 */
@Component({
  selector: 'app-preview-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- tamanio="l" (60vw) NO es decorativo ni inerte, pero tampoco es lo que arregla el ancho: es el
         PISO. Quien iguala el marco al contenido, como en React, son las DOS reglas de shared.css:
         .modal-window:has(> .grid .preview-modal){width:max-content} y la que acota el contenido a
         min(1080px, 90vw - 4rem) para dejarle lugar al padding del marco. Sin ellas el modal cae en
         60vw (y sin este atributo, en los 30vw del default). Ver el doble aviso del componente. -->
    <lib-modal-z [open]="abierto()" tamanio="l" (close)="cerrar.emit()">
      <!-- Ver el doble aviso del componente: el id va como atributo ESTATICO y este template no
           puede quedar dentro de un @if, porque ModalZ lee los slots una sola vez. -->
      <ng-template libZTemplate id="content">
        @if (abierto()) {
          <div class="preview-modal">
            <div class="preview-modal-header">
              <div class="preview-modal-title">
                <za-icon icon="file-blank:line" config="l" />
                <div>
                  <div class="preview-modal-doc-name">{{ titulo() }}</div>
                  @if (documento()?.descripcion) {
                    <div class="preview-modal-doc-desc">{{ documento()?.descripcion }}</div>
                  }
                </div>
              </div>
            </div>

            @if (intFileId(); as intId) {
              <!-- El visor se monta solo con el modal abierto: al cerrarse se destruye y revoca su
                   blob URL. Ver el bloque del componente sobre lo que hacía el desmontaje de React. -->
              <app-pdf-viewer [fileId]="intId" [height]="intAlto()" />
            } @else if (urlSegura(); as objUrl) {
              <iframe [src]="objUrl" [title]="titulo()" class="preview-modal-iframe"></iframe>
            }
          </div>
        }
      </ng-template>
    </lib-modal-z>
  `,
  imports: [PdfViewerComponent, ZrIcon, ZrModal, ZrTemplate],
})
export class PreviewModalComponent {
  private readonly objSanitizador = inject(DomSanitizer);

  public readonly abierto = input<boolean>(false);
  public readonly documento = input<DocumentoVistaPrevia | null>(null);

  /**
   * Se emite cuando el usuario cierra desde el backdrop o la X.
   *
   * La pantalla **tiene que** bajar su propia bandera acá: ver el bloque del componente sobre el
   * input mutado de `ModalZ`.
   */
  public readonly cerrar = output<void>();

  protected readonly titulo = computed(() => this.documento()?.fileName || STR_TITULO_DEFECTO);

  /**
   * El `fileId` cuando la pantalla lo pasó, o `null`. Normaliza el `undefined` a `null` para que el
   * `@if (…; as …)` del template sea una sola comparación.
   */
  protected readonly intFileId = computed(() => this.documento()?.fileId ?? null);

  /**
   * La `blobUrl` saneada, o `null` si no hay o si **no es una `blob:`**.
   *
   * Ver el ⚠⚠ del componente: la comprobación del esquema es lo que hace legítimo el bypass sobre un
   * valor que entra por input. No se puede reemplazar por un bypass directo.
   */
  protected readonly urlSegura = computed<SafeResourceUrl | null>(() => {
    const strUrl = this.documento()?.blobUrl;
    if (!strUrl || !strUrl.startsWith('blob:')) return null;
    return this.objSanitizador.bypassSecurityTrustResourceUrl(strUrl);
  });

  /**
   * Alto del visor, con la misma cuenta que React (`min(innerHeight * 0.82, 820)`).
   *
   * Se lee `window.innerHeight` en cada evaluación y no una vez en el constructor: el modal vive
   * mientras la pantalla está montada, así que fijarlo al construir dejaría el visor con el alto de
   * la ventana de hace diez minutos si el usuario la redimensionó. No hay listener de `resize`
   * porque tampoco lo tenía React y el recálculo ocurre igual al reabrir el modal.
   */
  protected intAlto(): number {
    return Math.min(window.innerHeight * NUM_FRACCION_ALTO, INT_ALTO_MAX);
  }
}
