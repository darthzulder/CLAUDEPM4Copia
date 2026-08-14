import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';
import { RequestFilesService } from '../core/request-files.service';
import type { Pm4File } from '../core/request-files.types';
import { DocCardComponent } from './doc-card';
import { PreviewModalComponent, type DocumentoVistaPrevia } from './preview-modal';
import { ZrAlertInline, ZrButton, ZrLoader } from './fields/zds-reexports';

/** Escalones de la unidad de tamaño. `1024` y no `1000`: es la cuenta que hacía React. */
const INT_KB = 1024;
const INT_MB = INT_KB * INT_KB;

/**
 * Lista de solo lectura de los archivos adjuntos de un caso, con vista previa y descarga.
 * Port de `components/RequestFileList.tsx`.
 *
 * ```html
 * <app-request-file-list [requestId]="intIdCaso()" [docKeys]="['qd_strAttach01']" />
 * <app-request-file-list [requestId]="intIdCaso()" [fileIds]="[intIdRespuesta()]" label="Respuesta" />
 * ```
 *
 * Lo usan SCR-0051 (documentos del radicador), SCR-008 (soportes internos del área) y SCR-009 (el PDF
 * de respuesta final, que llega por id y no por `data_name`).
 *
 * ── ⚠ El filtro es OBLIGATORIO, y por eso el default de `docKeys`/`fileIds` es vacío ─────────────
 * `GET /requests/{id}/files` devuelve **todos** los adjuntos del caso, incluidos los que subieron otras
 * tareas del mismo proceso. Sin filtro, la sección "Documentos del radicador" de la SCR-0051 mostraría
 * también los soportes internos del área que gestionó antes — información de otra etapa, a la vista de
 * quien no corresponde.
 *
 * Los dos filtros son **unión**, no intersección (`setIds.has(id) || setKeys.has(data_name)`), igual que
 * React: una pantalla puede pasar los dos y ve la suma. Y con ambos vacíos la lista queda **vacía**, no
 * completa: es el default seguro, y lo fija un caso de test para que un futuro `?? files` "de comodidad"
 * se ponga rojo.
 *
 * ── Los tres estados son mutuamente excluyentes, y el vacío NO se pinta mientras carga ───────────
 * Se preserva la lógica exacta de las cuatro guardas de React, que no es simétrica y conviene leerla
 * junta:
 *
 * | Estado                              | Qué se pinta                        |
 * |-------------------------------------|-------------------------------------|
 * | `cargando`                          | loader + `loadingText`              |
 * | `error && !cargando`                | caja negativa con el mensaje        |
 * | `!cargando && !error && sin docs`   | caja informativa con `emptyText`    |
 * | `!cargando && con docs`             | la lista de cards                   |
 *
 * El detalle que importa: el estado vacío exige `!cargando` **y** `!error`. Sin el `!cargando`, cada
 * carga arrancaría mostrando "No hay documentos adjuntos" durante el viaje de la petición — un mensaje
 * que afirma algo falso justo cuando todavía no se sabe. Y sin el `!error` se verían las **dos** cajas
 * apiladas, contradiciéndose. Van con caso de test las dos.
 *
 * La lista, en cambio, solo exige `!cargando`, y las dos mitades de esa asimetría importan:
 * - **No exige `!error`** porque sería redundante: el servicio hace `sigFiles.set([])` en su `catch`,
 *   así que con error la lista está vacía de todas formas (verificado en su `cargar()`).
 * - **Sí exige `!cargando`**, y no es decorativo: el servicio **no limpia** los archivos al empezar
 *   una carga nueva (tampoco es un descuido — limpiar haría parpadear la lista en cada recarga). O sea
 *   que durante una recarga el servicio todavía tiene los archivos de la vuelta anterior, y sin este
 *   término se verían el loader y esos archivos viejos al mismo tiempo: datos que ya se están
 *   reemplazando, presentados como vigentes. Va con caso de test, y hubo que reforzarlo — ver el ⚠ del
 *   caso del `loadingText`, cuya primera versión no cargaba archivos y por lo tanto no lo cubría.
 *
 * ── ⚠ La alerta va por `ZrAlertInline` (`za-alert`), NO por `ZrAlert` + `AlertZService` ──────────
 * Es el punto 5b del docstring de la fachada, y este componente es el caso que lo motivó. `lib-alert-z`
 * no tiene inputs: es un contenedor que pinta la **cola** de `AlertZService`. Mandar estos dos mensajes
 * por ahí cambiaría el comportamiento de dos formas: el aviso saltaría al contenedor global de la
 * pantalla en vez de quedar debajo del título de esta lista, y —peor— el servicio **acumula**, así que
 * dos cargas fallidas seguidas dejarían dos alertas apiladas y habría que llamar `.remove()` a mano cada
 * vez que el error se resuelve. `za-alert` es la caja declarativa: aparece y desaparece con su `@if`,
 * donde está el contenido que describe.
 *
 * ── La descarga: `HttpClient`, y por qué NO se reusa la de `app-pdf-viewer` ───────────────────────
 * Tiene que pasar por `HttpClient` por el mismo motivo que el visor: `GET /files/{id}/contents` necesita
 * el header `x-pm4-token` que inyecta el interceptor del BFF, y un `<a href="/api/files/…">` lo pediría
 * el navegador por su cuenta, sin token, contra un 401.
 *
 * Y es descarga **propia** aunque `app-pdf-viewer` ya tenga un `descargar()`, porque el suyo baja del
 * blob que **ya tiene en memoria** por estar mostrando ese archivo. Acá se descarga desde la fila de la
 * lista, sin visor montado: no hay blob que reusar, hay que pedir el binario. Reusar el del visor
 * obligaría a montar un visor invisible por cada fila solo para poder descargar.
 *
 * ⚠ La URL del blob se revoca en el `finally`, no después del `click()`. React revocaba en la línea
 * siguiente al click y **eso es una carrera**: en Firefox y en Chrome viejo la descarga se cancela si la
 * URL muere antes de que el navegador empiece a leerla. Acá se revoca igual (no filtrar es lo que
 * importa) pero desde el `finally`, así que también corre si el click lanza.
 *
 * ── Un fallo de descarga NO se pinta, igual que en React ─────────────────────────────────────────
 * El `catch` solo hace `console.error`. Es una decisión heredada que vale nombrar en vez de "mejorar" de
 * contrabando: el usuario ve que el archivo no se bajó, y el mensaje de error de la lista (`error`)
 * describe la **carga de la lista**, no una descarga puntual. Pintarlo ahí diría que la lista falló
 * cuando la lista está bien. Si alguna pantalla necesita el aviso, es un cambio funcional con su pedido.
 */
@Component({
  selector: 'app-request-file-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="zds-field-wrap">
      <span class="info-bar-label">{{ label() }}</span>

      @if (objArchivos.cargando()) {
        <div
          z-flex="col:75"
          z-align="center:center"
          class="request-file-list-state"
        >
          <!-- El tamaño va por variable CSS y no por input: el customStr de lib-loader-z es un input
               MUERTO (el atributo estático de su plantilla gana siempre). Ver el punto 2 de la
               fachada. -->
          <lib-loader-z style="--z-loader--size: 20px" />
          <p>{{ loadingText() }}</p>
        </div>
      }

      @if (objArchivos.error() && !objArchivos.cargando()) {
        <!-- Caja INLINE (za-alert), no la cola de AlertZService. Ver el ⚠ del componente.
             El hide-close va como BINDING y no como atributo pelado: su input está tipado boolean,
             así que un hide-close suelto llega como '' y no compila (TS2322). -->
        <za-alert config="negative" [hide-close]="true">
          No se pudieron cargar los documentos: {{ objArchivos.error() }}
        </za-alert>
      }

      @if (!objArchivos.cargando() && !objArchivos.error() && cllDocs().length === 0) {
        <!-- Las dos guardas de adelante no son de más: sin el !cargando esto afirmaría que no hay
             documentos mientras todavía se están buscando. Ver la tabla del componente. -->
        <za-alert config="info" [hide-close]="true">{{ emptyText() }}</za-alert>
      }

      @if (!objArchivos.cargando() && cllDocs().length > 0) {
        <div z-flex="col:75" class="request-file-list-items">
          @for (objFile of cllDocs(); track objFile.id) {
            <app-doc-card [fileName]="objFile.file_name">
              <span meta>{{ formatearBytes(objFile.size) }}</span>
              <ng-container actions>
                <!-- Botón solo-ícono: el nombre accesible va en title/aria-label porque ButtonZ
                     PROYECTA su label como texto visible (ver doc-support-uploader). Y el
                     [disabled]="false" es obligatorio: su default es true. -->
                <lib-button-z
                  type="secondary:s"
                  icon="visibility-on:line"
                  title="Vista previa"
                  aria-label="Vista previa"
                  [disabled]="false"
                  (eventClick)="verPrevia(objFile)"
                />
                <lib-button-z
                  type="secondary:s"
                  icon="download:line"
                  label="Descargar"
                  [disabled]="false"
                  (eventClick)="descargar(objFile)"
                />
              </ng-container>
            </app-doc-card>
          }
        </div>
      }

      <!-- El modal se declara SIEMPRE, fuera de todo @if, y monta CERRADO. Ver el aviso doble de
           preview-modal.ts: ModalZ resuelve sus slots en un ngAfterContentInit que corre una sola vez.

           ⚠ Medido, y matiza lo que este comentario decía antes ("obligatorio, un @if lo dejaría vacío
           PARA SIEMPRE"): envolverlo en @if (objPrevia() !== null) NO rompe nada hoy, y por eso esa
           mutación sobrevive legítimamente. Sonda desechable sobre el ciclo completo (lista → click en
           vista previa): {"modal":true,"cuerpo":true,"visor":true}. El motivo es el mismo que documenta
           preview-modal.ts: con el @if por fuera el modal NACE con abierto=true, así que la captura de
           slots ocurre con el template ya montado y sale bien.

           Se queda sin @if de todas formas, por dos razones que no son esa: (a) es el contrato que el
           spec de preview-modal fija —su caso "monta CERRADO" existe justamente porque montar cerrado
           es el estado inicial real de una pantalla—, y (b) con el @if la instancia se destruye y se
           recrea en cada previa, así que cualquier estado futuro del modal (o un ModalZ que algún día
           capture distinto) volvería a depender de un detalle interno de la librería. -->
      <app-preview-modal
        [abierto]="objPrevia() !== null"
        [documento]="objPrevia()"
        (cerrar)="objPrevia.set(null)"
      />
    </div>
  `,
  styles: `
    /* Los dos bloques que React tenía inline. Van acá y no en shared.css porque describen el encaje
       interno de este componente, no un patrón del proyecto. Solo tokens, sin px ni hex crudos. */
    .request-file-list-state {
      padding: var(--zs-300) var(--zs-200);
      color: var(--z-muted);
      text-align: center;
    }

    .request-file-list-state p {
      margin: 0;
    }

    .request-file-list-items {
      margin-top: var(--zs-50);
    }
  `,
  imports: [
    DocCardComponent,
    PreviewModalComponent,
    ZrAlertInline,
    ZrButton,
    ZrLoader,
  ],
  // El servicio se provee ACÁ, no en la pantalla: su estado es "los archivos de este request" y este
  // componente es su único consumidor. Ver su encabezado sobre por qué no es singleton — dos listas en
  // la misma pantalla (SCR-009 muestra soportes y respuesta final) necesitan estados separados.
  providers: [RequestFilesService],
})
export class RequestFileListComponent {
  private readonly objHttp = inject(HttpClient);
  protected readonly objArchivos = inject(RequestFilesService);

  /** El caso del que se listan los adjuntos. `null` o `0` no dispara ninguna petición. */
  public readonly requestId = input<number | null>(null);

  /**
   * `data_name` de los adjuntos a mostrar. Son nombres `qd_*`: contrato con PM4, los declara la
   * pantalla.
   *
   * Ver el ⚠ del componente: vacío significa **no mostrar nada**, no "mostrar todo".
   */
  public readonly docKeys = input<readonly string[]>([]);

  /**
   * Ids de archivo de PM4 ya resueltos, alternativa a `docKeys` cuando el caso trae el id en el payload
   * en vez de un `data_name` fijo (el PDF de respuesta de la SCR-009).
   *
   * Acepta `null`/`undefined` entre los elementos porque es lo que devuelve `resolveFileId` cuando el
   * campo del payload viene vacío: así la pantalla pasa `[resolveFileId(dic['qd_strPdf'])]` sin filtrar
   * a mano.
   */
  public readonly fileIds = input<readonly (number | null | undefined)[]>([]);

  public readonly label = input<string>('Documentos adjuntos');
  public readonly emptyText = input<string>('No hay documentos adjuntos.');
  public readonly loadingText = input<string>('Buscando documentos del caso…');

  /** El documento que el modal está mostrando, o `null`. Gobierna la apertura. */
  protected readonly objPrevia = signal<DocumentoVistaPrevia | null>(null);

  /**
   * Los archivos que pasan el filtro. Ver el ⚠ del componente: es la **unión** de los dos criterios.
   *
   * Los `Set` se rearman en cada evaluación y no se memoizan por separado: `computed` ya no reevalúa si
   * las señales no cambiaron, así que el `useMemo` de React con su array de dependencias no tiene
   * equivalente que valga la pena escribir acá.
   */
  protected readonly cllDocs = computed<Pm4File[]>(() => {
    const setClaves = new Set<string>(this.docKeys());
    const setIds = new Set<number>(
      this.fileIds().filter((in_genId): in_genId is number => typeof in_genId === 'number'),
    );

    return this.objArchivos.files().filter((in_objFile) => {
      if (setIds.has(in_objFile.id)) return true;
      const genDataName = in_objFile.custom_properties?.['data_name'];
      return typeof genDataName === 'string' && setClaves.has(genDataName);
    });
  });

  public constructor() {
    // El equivalente del `useRequestFiles(requestId)` de React, que recargaba al cambiar la prop. Es un
    // `effect` y no un `computed` porque dispara una petición HTTP, que es justo lo que un `computed` no
    // debe hacer. El propio servicio ignora un id ausente o 0.
    effect(() => {
      void this.objArchivos.cargar(this.requestId());
    });
  }

  /** Tamaño legible. Se preserva la cuenta de React, incluido el `toFixed(1)`. */
  protected formatearBytes(in_intBytes: number): string {
    if (in_intBytes < INT_KB) return `${in_intBytes} B`;
    if (in_intBytes < INT_MB) return `${(in_intBytes / INT_KB).toFixed(1)} KB`;
    return `${(in_intBytes / INT_MB).toFixed(1)} MB`;
  }

  /**
   * Abre la vista previa del archivo.
   *
   * Se pasa `fileId` y **no** `blobUrl`: el modal delega en `app-pdf-viewer`, que baja el binario
   * autenticado por el BFF. Un `blobUrl` obligaría a descargarlo acá primero y a gestionar su
   * revocación, que es exactamente lo que el visor ya hace.
   */
  protected verPrevia(in_objFile: Pm4File): void {
    this.objPrevia.set({ fileName: in_objFile.file_name, fileId: in_objFile.id });
  }

  /**
   * Baja el binario y lo guarda con su nombre real.
   *
   * Ver el docstring: va por `HttpClient` (el header del BFF), es propia y no la del visor (no hay blob
   * en memoria desde una fila), y un fallo **no** se pinta. La revocación va en el `finally` para que
   * también corra si el click lanza.
   */
  protected async descargar(in_objFile: Pm4File): Promise<void> {
    let strUrl: string | null = null;
    try {
      const objBlob = await firstValueFrom(
        this.objHttp.get(urlApi(`/files/${in_objFile.id}/contents`), { responseType: 'blob' }),
      );

      strUrl = URL.createObjectURL(objBlob);
      const objEnlace = document.createElement('a');
      objEnlace.href = strUrl;
      // El atributo `download` es lo único que fija el nombre: sin él el navegador guarda el archivo
      // con el UUID de la URL `blob:`, que para el usuario es ilegible.
      objEnlace.download = in_objFile.file_name;
      objEnlace.click();
    } catch (in_excError: unknown) {
      console.error('[RequestFileList] Error al descargar:', in_excError);
    } finally {
      if (strUrl) URL.revokeObjectURL(strUrl);
    }
  }
}
