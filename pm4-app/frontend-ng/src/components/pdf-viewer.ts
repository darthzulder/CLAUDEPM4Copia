import { BotonHabilitado } from './fields/boton-habilitado';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';
import { mensajeDeError } from '../core/http-error';
import { ZrButton, ZrLoader } from './fields/zds-reexports';

/** Alto del visor por defecto, en px. Heredado textual de React. */
const INT_ALTO = 640;

/** Nombre con el que se descarga el archivo si la pantalla no pasó `label`. */
const STR_NOMBRE_DEFECTO = 'documento.pdf';

/**
 * Visor de un archivo de PM4: baja el binario por el BFF y lo pinta como `<img>` o `<iframe>` según su
 * tipo, con un botón de descarga. Port de `components/PdfViewer.tsx`.
 *
 * ```html
 * <app-pdf-viewer [fileId]="intIdArchivo()" label="Soporte.pdf" [height]="820" />
 * ```
 *
 * ── Por qué pasa por un blob URL y no por el `src` directo ────────────────────────────────────────
 * La ruta real es `GET /api/files/{id}/contents`, y esa petición **necesita el header `x-pm4-token`**
 * que inyecta el interceptor del BFF. Un `<iframe src="/api/files/…">` lo pide el navegador por su
 * cuenta, sin pasar por `HttpClient`, así que iría **sin token** y PM4 devolvería 401. Bajar el binario
 * con `HttpClient` y exponerlo como `blob:` es lo que hace que el visor funcione autenticado, y es el
 * mismo motivo que tenía React.
 *
 * ── ⚠ Cada blob URL hay que revocarla, y hay DOS momentos en que toca ────────────────────────────
 * `URL.createObjectURL()` ancla el blob en memoria hasta que alguien llama `revokeObjectURL()`: el
 * recolector de basura **no** lo libera solo, porque la URL es una referencia global viva. Un visor que
 * no revoca filtra el archivo entero (varios MB por documento) cada vez que cambia de archivo, y en una
 * pantalla donde el usuario abre la vista previa de seis adjuntos seguidos eso se acumula sin techo.
 *
 * Los dos momentos son distintos y **hacen falta los dos**:
 * 1. **Al traer un archivo nuevo** — se revoca el anterior antes de guardar el nuevo. Si no, cada
 *    cambio de `fileId` deja huérfano el blob previo.
 * 2. **Al destruirse el componente** — con `DestroyRef`. Si no, cerrar el modal se lleva el nodo del
 *    DOM pero deja el blob del último archivo colgado para siempre.
 *
 * Va con caso de test para cada uno, espiando `URL.revokeObjectURL`.
 *
 * ── La guarda contra respuestas que llegan tarde (el `blnActive` de React) ───────────────────────
 * React usaba una bandera de cierre en el `useEffect` para descartar la respuesta de un `fileId` que
 * ya no es el actual. Acá el equivalente es comparar contra el `fileId` vigente al resolver: si el
 * usuario pasa del documento 1 al 2 y la petición del 1 vuelve después, escribir su blob pintaría el
 * documento **equivocado** con el label correcto. Es el mismo tipo de defecto silencioso que el
 * desplazamiento de slots del uploader, y va con su caso de test.
 *
 * ── El `@if (fileId())` reemplaza al `if (!fileId) return null` ───────────────────────────────────
 * React devolvía `null` sin fileId, así que el contenedor `.pdf-viewer` tampoco existía. Se preserva:
 * ese div tiene `border` y `background` propios en `shared.css`, así que montarlo vacío dejaría un
 * recuadro gris flotando donde no hay nada que ver.
 *
 * ── ⚠⚠ Angular BLOQUEA una `blob:` URL en `[src]` de un iframe: hay que pasar por `DomSanitizer` ──
 * Es la diferencia con React que más caro sale, porque **no existe del otro lado**: React pone el
 * atributo y listo. Angular sanea todo binding y clasifica `iframe[src]` como contexto
 * **`RESOURCE_URL`**, el más estricto de todos — solo admite valores que pasaron explícitamente por el
 * sanitizador. Con una `blob:` URL cruda lanza en tiempo de render:
 *
 * ```
 * NG0904: unsafe value used in a resource URL context
 * ```
 *
 * Verificado, no leído: el spec de este componente falló con ese error antes de existir el
 * `bypassSecurityTrustResourceUrl` de abajo, y por eso la aserción del `src` del iframe se quedó en el
 * spec con un comentario propio — es la única guarda de que esto sigue funcionando.
 *
 * **Por qué el bypass es seguro acá, que es la pregunta correcta al ver esa llamada:** el valor no
 * viene del usuario ni de PM4. Lo produce `URL.createObjectURL()` en esta misma clase, sobre un `Blob`
 * que acaba de bajar por el BFF, y su forma es siempre `blob:<origen>/<uuid>` generada por el
 * navegador. No hay ninguna cadena de entrada externa que pueda llegar a ese punto, que es exactamente
 * la condición bajo la cual el bypass es correcto en vez de un agujero. Lo que **no** se debe hacer es
 * mover este bypass a un input o a un valor que venga de la respuesta HTTP.
 *
 * El `<img>` no necesita nada: `img[src]` es contexto `URL`, no `RESOURCE_URL`, y `blob:` está en su
 * lista de esquemas seguros. Se sanea igual por consistencia y para que las dos ramas se lean iguales.
 */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (fileId()) {
      <div class="pdf-viewer" [class]="className()">
        @if (label()) {
          <div class="pdf-viewer-label">{{ label() }}</div>
        }

        @if (cargando()) {
          <div class="pdf-viewer-state">
            <!-- El tamaño va por variable CSS inline y no por un input: lib-loader-z NO tiene input de
                 tamaño (sus inputs son customStr y label, verificado en los metadatos). React fijaba
                 exactamente esta variable, así que se preserva el mecanismo. -->
            <lib-loader-z style="--z-loader--size: 20px" />
            <span>Cargando documento…</span>
          </div>
        }

        @if (error() && !cargando()) {
          <div class="pdf-viewer-state pdf-viewer-error">
            No se pudo cargar el documento: {{ error() }}
          </div>
        }

        @if (urlSegura() && !cargando()) {
          @if (esImagen()) {
            <img
              [src]="urlSegura()"
              [alt]="label() || 'Documento'"
              class="pdf-viewer-media"
              [style.height.px]="height()"
            />
          } @else {
            <!-- Ver el ⚠⚠ del componente: sin el saneado explícito esto lanza NG0904 y el visor no
                 pinta. El valor lo produce URL.createObjectURL acá mismo, no viene de afuera. -->
            <iframe
              [src]="urlSegura()"
              [title]="label() || 'Documento'"
              class="pdf-viewer-frame"
              [style.height.px]="height()"
            ></iframe>
          }
          <div class="pdf-viewer-actions">
            <lib-button-z
              type="secondary:s"
              label="Descargar"
              icon="download:line"
              [disabled]="false"
              (eventClick)="descargar()"
            />
          </div>
        }
      </div>
    }
  `,
  styles: `
    /* Los dos únicos estilos que React tenía inline y no en shared.css. Van acá porque son del
       componente, no del proyecto: describen cómo se encaja el medio dentro del visor. El alto lo pone
       la pantalla por [height], así que no está fijado. */
    .pdf-viewer-media {
      display: block;
      width: 100%;
      object-fit: contain;
      border-radius: 4px;
      background: var(--zg-white-zurich);
    }

    .pdf-viewer-frame {
      display: block;
      width: 100%;
      border: none;
      border-radius: 4px;
    }
  `,
  imports: [ZrButton, BotonHabilitado, ZrLoader],
})
export class PdfViewerComponent {
  private readonly objHttp = inject(HttpClient);
  private readonly objSanitizador = inject(DomSanitizer);

  /** Id del archivo en PM4. `null` (o `0`) no monta nada: ver el bloque del `@if`. */
  public readonly fileId = input.required<number | null>();

  /** Nombre visible arriba del visor, y el nombre con el que se descarga. */
  public readonly label = input<string>('');

  public readonly height = input<number>(INT_ALTO);

  /** Clase extra para el contenedor, para que la pantalla ajuste el encaje. */
  public readonly className = input<string>('');

  /**
   * La URL del blob ya saneada, que es la única forma que el template puede bindear.
   *
   * Hay **dos** representaciones de la misma URL y las dos hacen falta: esta para pintar, y
   * `strUrlPrevia` (string crudo) para `revokeObjectURL` y para el `href` del enlace de descarga, que
   * necesitan la cadena de verdad — un `SafeResourceUrl` es un objeto opaco y no sirve para ninguna de
   * las dos cosas.
   */
  protected readonly urlSegura = signal<SafeResourceUrl | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly esImagen = signal(false);

  /**
   * La última URL creada, en crudo: para revocarla y para descargarla. Es un campo suelto y no un
   * signal a propósito: no se lee desde el template, y como signal invitaría a bindearlo, que es
   * justamente lo que lanza NG0904.
   */
  private strUrlPrevia: string | null = null;

  public constructor() {
    // Momento 2 de la revocación (ver el ⚠ del componente): el desmontaje.
    inject(DestroyRef).onDestroy(() => this.revocarPrevia());

    // El equivalente del `useEffect([fileId])`. Un `effect` y no un `computed` porque esto tiene un
    // efecto secundario real (una petición HTTP y una URL de blob), que es justamente lo que un
    // `computed` no debe hacer.
    effect(() => {
      const intId = this.fileId();
      if (!intId) {
        // Igual que React: sin archivo se limpia el visor. Y se revoca, si había algo.
        this.revocarPrevia();
        this.urlSegura.set(null);
        return;
      }
      void this.traer(intId);
    });
  }

  /**
   * Baja el binario y lo publica como blob URL.
   *
   * No lanza: el fallo se muestra en el visor (`error`), porque el archivo es una parte de la pantalla
   * y no la pantalla entera — un throw acá tumbaría el formulario completo por un adjunto que no
   * abrió.
   */
  private async traer(in_intId: number): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const objBlob = await firstValueFrom(
        this.objHttp.get(urlApi(`/files/${in_intId}/contents`), { responseType: 'blob' }),
      );

      // La guarda contra respuestas tardías (ver el bloque del componente): si el `fileId` cambió
      // mientras esto viajaba, esta respuesta ya no corresponde a lo que el usuario está mirando.
      if (this.fileId() !== in_intId) return;

      this.revocarPrevia();
      this.esImagen.set(objBlob.type.startsWith('image/'));
      const strUrl = URL.createObjectURL(objBlob);
      this.strUrlPrevia = strUrl;
      this.urlSegura.set(this.objSanitizador.bypassSecurityTrustResourceUrl(strUrl));
    } catch (in_excError: unknown) {
      if (this.fileId() !== in_intId) return;
      this.error.set(mensajeDeError(in_excError));
    } finally {
      if (this.fileId() === in_intId) this.cargando.set(false);
    }
  }

  /** Momento 1 de la revocación: antes de reemplazar la URL, y al quedarse sin archivo. */
  private revocarPrevia(): void {
    if (this.strUrlPrevia) {
      URL.revokeObjectURL(this.strUrlPrevia);
      this.strUrlPrevia = null;
    }
  }

  /**
   * Dispara la descarga del blob que ya está en memoria.
   *
   * Va con un `<a download>` temporal y no con `window.open`: el nombre del archivo solo se puede
   * fijar por el atributo `download`, y sin él el navegador guardaría el documento con el UUID de la
   * URL `blob:` como nombre. Es el mismo mecanismo que usaba React.
   */
  protected descargar(): void {
    // Usa la URL CRUDA, no la saneada: `href` necesita la cadena real y un `SafeResourceUrl` se
    // serializaría como "[object Object]", dejando un enlace que no descarga nada.
    const strUrl = this.strUrlPrevia;
    if (!strUrl) return;

    const objEnlace = document.createElement('a');
    objEnlace.href = strUrl;
    objEnlace.download = this.label() || STR_NOMBRE_DEFECTO;
    document.body.appendChild(objEnlace);
    objEnlace.click();
    objEnlace.remove();
  }
}
