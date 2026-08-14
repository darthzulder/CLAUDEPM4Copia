/**
 * Tipo y helper puro de los archivos de un request PM4, separados del servicio que los pide por red.
 *
 * En React `Pm4File`, `resolveFileId` y el hook `useRequestFiles` compartían archivo. `resolveFileId`
 * no toca la red —solo normaliza formatos— así que acá vive con el tipo y no con
 * `RequestFilesService` (Fase 3b), que es el que va a `inject(HttpClient)`. Mismo criterio que
 * `collection.types.ts` + `collection-helpers.ts`: lo puro se testea sin `TestBed`.
 */

/** Un archivo ya subido al request, tal como lo devuelve `GET /requests/{id}/files`. */
export interface Pm4File {
  id: number;
  file_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  // PM4 guarda el data_name del campo que originó el archivo dentro de custom_properties.
  custom_properties?: Record<string, unknown>;
}

/**
 * Extrae un file_id de un campo output de PM4 (puede ser number, string, u objeto `{id}`).
 *
 * Las ramas raras no son defensivas por gusto: **PM4 devuelve el file_id en formatos distintos según
 * el nodo del proceso** que escribió el campo, y esta función es el único punto que los normaliza.
 *
 * ⚠ Contrato conocido e inconsistente para el id **0** — ver el caso dedicado en el spec. Se
 * preserva tal cual por "cero cambios de lógica"; el test lo fija para que si PM4 alguna vez usa 0
 * como file_id, salte acá y no como un adjunto que no descarga.
 */
export function resolveFileId(in_genValue: unknown): number | null {
  // Sin valor no hay id que resolver
  if (!in_genValue) return null;
  // Si ya es numero lo devolvemos directo
  if (typeof in_genValue === 'number') return in_genValue;
  // Si es texto intentamos convertirlo a entero
  if (typeof in_genValue === 'string') {
    const intParsed = parseInt(in_genValue, 10);
    return isNaN(intParsed) ? null : intParsed;
  }
  // Si es objeto buscamos el id dentro
  if (typeof in_genValue === 'object') {
    const dicValue = in_genValue as Record<string, unknown>;
    if (dicValue['id']) return resolveFileId(dicValue['id']);
    // Array con un elemento
    if (Array.isArray(in_genValue) && in_genValue.length > 0) return resolveFileId(in_genValue[0]);
  }
  return null;
}
