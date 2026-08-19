import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';
import { mensajeDeError } from './http-error';
import type { Pm4File } from './request-files.types';

/**
 * Lista los archivos ya subidos a un request PM4. Reemplaza al hook `useRequestFiles()` de React
 * (`core/useRequestFiles.ts`).
 *
 * ── Acá **sí** hay `error`, al contrario de `CollectionService` ──────────────────────────────────
 * La diferencia no es de estilo: es que el consumidor lo pinta. `RequestFileList` muestra el mensaje
 * de error cuando la lista falla, y tiene que hacerlo porque **un fallo acá es un hueco visible**: el
 * usuario ve una sección de adjuntos vacía y no puede distinguir "este caso no tiene documentos" de
 * "no se pudieron traer". En un select de catálogo esa distinción no importa (no hay opciones y punto);
 * en una lista de documentos de una queja, sí — alguien podría gestionar el caso creyendo que no hay
 * soportes adjuntos.
 *
 * ── Las dos formas de respuesta son un contrato real de PM4, no paranoia ────────────────────────
 * `GET /requests/{id}/files` devuelve **a veces** `{ data: [...] }` y a veces el array pelado, según
 * la versión del endpoint que atienda. El hook de React ya lo manejaba (`Array.isArray(resp.data) ?
 * resp.data : resp.data?.data ?? []`) y se preserva idéntico: si se asumiera una sola forma, la lista
 * de adjuntos quedaría vacía **sin error** contra la mitad de los entornos. Va con caso de test para
 * cada forma.
 *
 * ── Instancia por pantalla, no singleton ───────────────────────────────────────────────────────
 * Sin `providedIn: 'root'`, mismo criterio que `CollectionService` y `FileRegistryService`: el estado
 * pertenece a **un** request. Un singleton dejaría los archivos del caso anterior visibles mientras
 * carga el siguiente dentro del mismo iframe.
 */
@Injectable()
export class RequestFilesService {
  private readonly objHttp = inject(HttpClient);

  private readonly sigFiles = signal<Pm4File[]>([]);
  private readonly sigCargando = signal(false);
  private readonly sigError = signal<string | null>(null);

  /** Los archivos del request. `RequestFileList` filtra después por `data_name`. */
  public readonly files: Signal<Pm4File[]> = this.sigFiles.asReadonly();
  /**
   * `true` mientras hay una petición en vuelo. Arranca en **`false`**, igual que
   * `CollectionService` y a diferencia de `TaskService`: hay pantallas que se montan sin
   * `process_request_id` (un caso que arranca en el primer nodo), así que nunca llaman `cargar()` y un
   * `true` inicial les dejaría un spinner eterno en la sección de adjuntos.
   */
  public readonly cargando: Signal<boolean> = this.sigCargando.asReadonly();
  /** Mensaje del fallo, para pintarlo. Ver el bloque de arriba sobre por qué acá sí existe. */
  public readonly error: Signal<string | null> = this.sigError.asReadonly();

  /**
   * Trae los archivos del request.
   *
   * Un `requestId` ausente, `null` o **`0`** no hace nada y **no limpia**: preserva el `if
   * (!in_intRequestId) return` de React. Es el estado normal de una pantalla que se monta antes de que
   * `TaskService` resuelva la tarea, y limpiar ahí haría titilar la lista ya cargada.
   *
   * No lanza: un fallo deja `files` vacío y el mensaje en `error`.
   */
  public async cargar(in_intRequestId: number | null | undefined): Promise<void> {
    if (!in_intRequestId) return;

    this.sigCargando.set(true);
    this.sigError.set(null);
    try {
      const genResp = await firstValueFrom(
        this.objHttp.get<Pm4File[] | { data?: Pm4File[] }>(
          urlApi(`/requests/${in_intRequestId}/files`),
        ),
      );
      // Las dos formas de respuesta de PM4 — ver el bloque del encabezado.
      const cllFiles: Pm4File[] = Array.isArray(genResp) ? genResp : (genResp?.data ?? []);
      console.log(
        `[RequestFilesService] request_id=${in_intRequestId} → ${cllFiles.length} archivos`,
        cllFiles.map((in_objFile) => in_objFile.file_name),
      );
      this.sigFiles.set(cllFiles);
    } catch (in_excError: unknown) {
      // `mensajeDeError` es compartido con `TaskService` a propósito — ver su encabezado en
      // `http-error.ts`: los dos servicios que exponen `error` traducen el fallo con el mismo orden
      // de precedencia porque la pantalla lo pinta igual.
      const strMsg = mensajeDeError(in_excError);
      console.error('[RequestFilesService] Error:', strMsg);
      this.sigError.set(strMsg);
      this.sigFiles.set([]);
    } finally {
      this.sigCargando.set(false);
    }
  }
}
