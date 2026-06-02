import { useState, useEffect } from 'react';
import pm4 from '../api/pm4Client';

export interface Pm4File {
  id: number;
  name: string;
  file_name: string;
  custom_properties?: {
    data_name?: string;
    [key: string]: unknown;
  };
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export function useRequestFiles(
  requestId: number | null | undefined,
  parentRequestId?: number | null,
) {
  const [files, setFiles] = useState<Pm4File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setError(null);

    const fetches = [
      pm4.get(`/requests/${requestId}/files`),
      ...(parentRequestId ? [pm4.get(`/requests/${parentRequestId}/files`)] : []),
    ];

    Promise.all(fetches)
      .then((responses) => {
        const all = responses.flatMap((r) =>
          Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        ) as Pm4File[];
        // Deduplicar por id
        const seen = new Set<number>();
        const deduped = all.filter((f) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
        console.log(`[useRequestFiles] request_id=${requestId} parent=${parentRequestId ?? '-'} → ${deduped.length} archivos (raw):`, responses[0].data);
        console.log(`[useRequestFiles] keys del primer archivo:`, deduped[0] ? Object.keys(deduped[0] as object) : []);
        setFiles(deduped);
      })
      .catch((e) => {
        const msg = e.response?.data?.message ?? e.message;
        console.error('[useRequestFiles] Error:', msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [requestId, parentRequestId]);

  return { files, loading, error };
}

/** Extrae el parent_request_id del _request del task data (subprocesos PM4) */
export function resolveParentRequestId(taskData: Record<string, unknown>): number | null {
  const req = taskData['_request'] as Record<string, unknown> | undefined;
  const pid = req?.['parent_request_id'];
  if (typeof pid === 'number') return pid;
  if (typeof pid === 'string') { const n = parseInt(pid, 10); return isNaN(n) ? null : n; }
  return null;
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
