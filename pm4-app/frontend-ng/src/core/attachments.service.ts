import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';

// Convención COMPAÑERA para adjuntos: el campo base guarda el nombre del archivo y `<field>_id`
// guarda el fileUploadId que PM4 asigna al subirlo (para poder descargarlo/referenciarlo con
// precisión). Mismo criterio que `_desc` en `sincronizar-desc.ts`: sufijo fijo aplicado por un
// helper único, no una constante declarada a mano por cada campo.
const STR_ATTACH_ID_SUFFIX = '_id';

/**
 * Nombre del campo compañero que guarda el fileUploadId de un adjunto.
 *
 * Va **fuera** del servicio a propósito, igual que en React: es una función pura sobre un string y
 * la usa la definición de campos de cada pantalla, que no tiene un inyector a mano. Meterla como
 * método obligaría a inyectar el servicio entero para concatenar un sufijo.
 */
export function claveIdAdjunto(in_strDocKey: string): string {
  return `${in_strDocKey}${STR_ATTACH_ID_SUFFIX}`;
}

/**
 * Convierte un mapa docKey → fileUploadId en el payload plano `<docKey>_id` → fileUploadId.
 *
 * También queda como función pura (ver el comentario de `claveIdAdjunto`): la pantalla la usa para
 * armar el objeto que va dentro del `data` del PUT, y no necesita HTTP.
 */
export function idsAdjuntosAPayload(in_dicIds: Record<string, number>): Record<string, unknown> {
  const objPayload: Record<string, unknown> = {};
  Object.entries(in_dicIds).forEach(([strDocKey, intId]) => {
    objPayload[claveIdAdjunto(strDocKey)] = intId;
  });
  return objPayload;
}

/**
 * Sube a PM4 los binarios que juntó `FileRegistryService` y devuelve sus fileUploadId. Port de
 * `core/attachments.ts` de React.
 *
 * ── Por qué es un servicio y no una función suelta, a diferencia de las dos de arriba ───────────
 * Necesita `HttpClient`, y en Angular eso solo se obtiene por inyección. La alternativa era una
 * función que recibiera el `HttpClient` por parámetro; se descartó porque la llaman los handlers de
 * submit de 4 pantallas, que ya son inyectables y no ganan nada pasando la dependencia a mano.
 *
 * ── `providedIn: 'root'` acá **sí**, al contrario de `FileRegistryService` y `CollectionService` ──
 * No es inconsistencia: la diferencia es que este servicio **no tiene estado**. Es una función
 * asíncrona con un `HttpClient` adentro, así que dos pantallas compartiendo la instancia no pueden
 * pisarse nada — no hay `options` ni un `Map` de archivos que contaminar. Los otros dos no son de
 * root justamente porque su estado pertenece a *una* pantalla o a *un* campo.
 *
 * ── La subida es **secuencial**, y es deliberado ────────────────────────────────────────────────
 * El `for` recorre los archivos de a uno y espera cada `POST` antes del siguiente, tal como el
 * `for...of` con `await` de React. No se paraleliza con `Promise.all` por dos razones: PM4 asocia
 * cada archivo al request por `?data_name=`, y un lote de POST simultáneos sobre el mismo request ha
 * dado 500 en esta instancia; y el orden de subida es el que el usuario ve reflejado en la lista de
 * adjuntos del caso. Un `Promise.all` sería más rápido y menos predecible — va con caso de test que
 * asevera el orden.
 *
 * ── Un archivo que falla **no** aborta los demás… ni se reporta ─────────────────────────────────
 * Se preserva textual la semántica de React: `if (typeof intId === 'number')` — si la respuesta no
 * trae `fileUploadId`, ese docKey simplemente **no entra** en el mapa devuelto y el bucle sigue. La
 * pantalla completa la tarea con los adjuntos que sí subieron. Es discutible como decisión de
 * producto (el usuario no se entera de que un documento no quedó), pero cambiarlo acá sería un
 * cambio funcional encubierto en una migración de framework: queda documentado y con test que fija
 * el comportamiento, para que el día que se decida cambiarlo se vea que es una decisión y no un fix.
 *
 * **Ojo con el otro caso, que sí lanza:** si el `POST` falla con un error HTTP (500, 413 de archivo
 * muy grande), la excepción **sube** y corta el bucle — no queda atrapada. Los adjuntos anteriores
 * ya están en PM4 y los siguientes no se intentan. También es el comportamiento de React, y también
 * va con test, porque es la diferencia entre "PM4 respondió raro" y "PM4 no respondió".
 */
@Injectable({ providedIn: 'root' })
export class AttachmentsService {
  private readonly objHttp = inject(HttpClient);

  /**
   * Sube cada archivo del registro a `POST /requests/{id}/files?data_name=<docKey>`.
   *
   * @param in_intRequestId `process_request_id` del caso. La pantalla lo saca de `TaskService`.
   * @param in_mapFiles Los pares docKey → File. Se declara `Iterable` y no `Map` para poder recibir
   *   directamente el `mapArchivos` de `FileRegistryService`, un `Map` armado a mano en un test, o
   *   un array de tuplas — lo único que se usa de él es recorrerlo una vez.
   * @returns Solo los docKey cuyo POST devolvió un `fileUploadId` numérico (ver el bloque de arriba).
   */
  public async subir(
    in_intRequestId: number,
    in_mapFiles: Iterable<[string, File]>,
  ): Promise<Record<string, number>> {
    const dicIds: Record<string, number> = {};
    for (const [strDocKey, objFile] of in_mapFiles) {
      const objFormData = new FormData();
      objFormData.append('file', objFile);
      // El `data_name` va en la query string, no en el FormData: es así como PM4 asocia el binario
      // al campo del caso. `HttpClient` no le pone `Content-Type` a un FormData (deja que el
      // navegador arme el boundary del multipart), que es lo que se necesita.
      const genResp = await firstValueFrom(
        this.objHttp.post<{ fileUploadId?: number }>(
          urlApi(`/requests/${in_intRequestId}/files?data_name=${strDocKey}`),
          objFormData,
        ),
      );
      const intId = genResp?.fileUploadId;
      if (typeof intId === 'number') dicIds[strDocKey] = intId;
    }
    return dicIds;
  }
}
