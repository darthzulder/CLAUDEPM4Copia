import { useState, useEffect } from 'react';
import pm4 from '../api/pm4Client';

export interface Pm4File {
  id: number;
  file_name: string;
  data_name?: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export function useRequestFiles(requestId: number | null | undefined) {
  const [files, setFiles] = useState<Pm4File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setError(null);

    pm4.get(`/requests/${requestId}/files`)
      .then((r) => {
        // PM4 puede devolver { data: [...] } o directamente un array
        const list: Pm4File[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        console.log(`[useRequestFiles] request_id=${requestId} → ${list.length} archivos (raw):`, r.data);
        console.log(`[useRequestFiles] primeros 3 campos de cada archivo:`, list.slice(0, 5).map(f => Object.keys(f as object)));
        setFiles(list);
      })
      .catch((e) => {
        const msg = e.response?.data?.message ?? e.message;
        console.error('[useRequestFiles] Error:', msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [requestId]);

  return { files, loading, error };
}

/** Extrae un file_id de un campo output de PM4 (puede ser number, string, u objeto {id}) */
export function resolveFileId(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.id) return resolveFileId(obj.id);
    // Array con un elemento
    if (Array.isArray(value) && value.length > 0) return resolveFileId(value[0]);
  }
  return null;
}
