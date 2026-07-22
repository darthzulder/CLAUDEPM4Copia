import { useState, useEffect } from 'react';
import pm4 from '../api/pm4Client';

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

export function useRequestFiles(in_intRequestId: number | null | undefined) {
  const [files, setFiles] = useState<Pm4File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sin request no hay nada que consultar
    if (!in_intRequestId) return;
    setLoading(true);
    setError(null);

    // Pedimos los archivos asociados al request
    pm4.get(`/requests/${in_intRequestId}/files`)
      .then((in_objResp) => {
        // PM4 puede devolver { data: [...] } o directamente un array
        const lstFiles: Pm4File[] = Array.isArray(in_objResp.data) ? in_objResp.data : (in_objResp.data?.data ?? []);
        console.log(`[useRequestFiles] request_id=${in_intRequestId} → ${lstFiles.length} archivos`, lstFiles.map(in_objFile => in_objFile.file_name));
        setFiles(lstFiles);
      })
      .catch((in_excError) => {
        // Guardamos el mensaje de error para mostrarlo
        const strMsg = in_excError.response?.data?.message ?? in_excError.message;
        console.error('[useRequestFiles] Error:', strMsg);
        setError(strMsg);
      })
      .finally(() => setLoading(false));
  }, [in_intRequestId]);

  return { files, loading, error };
}

/** Extrae un file_id de un campo output de PM4 (puede ser number, string, u objeto {id}) */
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
    if (dicValue.id) return resolveFileId(dicValue.id);
    // Array con un elemento
    if (Array.isArray(in_genValue) && in_genValue.length > 0) return resolveFileId(in_genValue[0]);
  }
  return null;
}
