import { useEffect, useState } from 'react';
import pm4 from '../../../../api/pm4Client';
import { QD_PROCESS_ID, mapRequestToCaso, type CasoDashboard, type RequestRaw } from './variables';

interface RequestsResponse {
  data?: RequestRaw[];
  meta?: { last_page?: number };
}

/**
 * Obtiene TODOS los casos del proceso QD desde GET /api/1.0/requests?include=data
 * (paginando hasta last_page) y los mapea a CasoDashboard. Réplica de la lógica del
 * script PHP de PM4: intenta acotar con PMQL `process_id = N` y, si el servidor rechaza
 * el PMQL, reintenta sin él filtrando el process_id en el cliente.
 */
export function useCasosDashboard() {
  const [casos, setCasos] = useState<CasoDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const acumulados: RequestRaw[] = [];
        let page = 1;
        let lastPage = 1;
        let skipPmql = false;

        do {
          const baseParams: Record<string, unknown> = {
            include: 'data', per_page: 100, page, type: 'all',
          };
          const params = skipPmql ? baseParams : { ...baseParams, pmql: `process_id = ${QD_PROCESS_ID}` };

          let resp;
          try {
            resp = await pm4.get<RequestsResponse>('/requests', { params });
          } catch (e) {
            // Auto-recuperación: si el PMQL falla, reintenta sin él (filtro en cliente).
            if (!skipPmql) {
              skipPmql = true;
              resp = await pm4.get<RequestsResponse>('/requests', { params: baseParams });
            } else {
              throw e;
            }
          }

          const body = resp.data ?? {};
          for (const r of body.data ?? []) {
            if (skipPmql && String(r.process_id) !== String(QD_PROCESS_ID)) continue;
            acumulados.push(r);
          }
          lastPage = body.meta?.last_page ?? 1;
          page += 1;
        } while (page <= lastPage);

        if (!cancelled) setCasos(acumulados.map(mapRequestToCaso));
      } catch (e) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        if (!cancelled) setError(err.response?.data?.message ?? err.message ?? 'Error desconocido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { casos, loading, error };
}
