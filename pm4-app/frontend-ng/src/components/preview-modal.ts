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
 */
@Component({
  selector: 'app-preview-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
