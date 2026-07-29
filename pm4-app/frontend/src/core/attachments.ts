import pm4 from '../api/pm4Client';

// Convención COMPAÑERA para adjuntos: el campo base guarda el nombre del archivo
// y `<field>_id` guarda el fileUploadId que PM4 asigna al subirlo (para poder
// descargarlo/referenciarlo con precisión). Mismo criterio que `_desc` en
// useSyncDesc (core/useCollection.ts): sufijo fijo aplicado por un helper único,
// no una constante declarada a mano por cada campo.
const ATTACH_ID_SUFFIX = '_id';

/** Nombre del campo compañero que guarda el fileUploadId de un adjunto. */
export function attachIdKey(in_strDocKey: string): string {
  return `${in_strDocKey}${ATTACH_ID_SUFFIX}`;
}

/**
 * Sube cada archivo del registro a PM4 (`POST /requests/{id}/files?data_name=<docKey>`)
 * y devuelve un mapa docKey → fileUploadId con los adjuntos subidos correctamente.
 */
export async function uploadAttachments(
  in_intRequestId: number,
  in_mapFiles: Iterable<[string, File]>,
): Promise<Record<string, number>> {
  const dicIds: Record<string, number> = {};
  for (const [strDocKey, objFile] of in_mapFiles) {
    const objFormData = new FormData();
    objFormData.append('file', objFile);
    const objResponse = await pm4.post(`/requests/${in_intRequestId}/files?data_name=${strDocKey}`, objFormData);
    const intId = (objResponse.data as { fileUploadId?: number })?.fileUploadId;
    if (typeof intId === 'number') dicIds[strDocKey] = intId;
  }
  return dicIds;
}

/** Convierte un mapa docKey → fileUploadId en el payload plano `<docKey>_id` → fileUploadId. */
export function attachIdsToPayload(in_dicIds: Record<string, number>): Record<string, unknown> {
  const objPayload: Record<string, unknown> = {};
  Object.entries(in_dicIds).forEach(([strDocKey, intId]) => {
    objPayload[attachIdKey(strDocKey)] = intId;
  });
  return objPayload;
}
