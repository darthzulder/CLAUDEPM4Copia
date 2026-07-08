import { useEffect, useState } from 'react';
import pm4 from '../../../../api/pm4Client';
import { SCR013_PROCESS_ID } from '../fields/fields';
import type { CasoDashboard, RequestRaw } from '../fields/types';
import { mapRequestToCaso } from './dashboardHelpers';

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
    let blnCancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const lstAcumulados: RequestRaw[] = [];
        let intPage = 1;
        let intLastPage = 1;
        let blnSkipPmql = false;

        do {
          const dicBaseParams: Record<string, unknown> = {
            include: 'data', per_page: 100, page: intPage, type: 'all',
          };
          const dicParams = blnSkipPmql ? dicBaseParams : { ...dicBaseParams, pmql: `process_id = ${SCR013_PROCESS_ID}` };

          let objResp;
          try {
            objResp = await pm4.get<RequestsResponse>('/requests', { params: dicParams });
          } catch (exc) {
            // Auto-recuperación: si el PMQL falla, reintenta sin él (filtro en cliente).
            if (!blnSkipPmql) {
              blnSkipPmql = true;
              objResp = await pm4.get<RequestsResponse>('/requests', { params: dicBaseParams });
            } else {
              throw exc;
            }
          }

          const objBody = objResp.data ?? {};
          for (const objRequest of objBody.data ?? []) {
            if (blnSkipPmql && String(objRequest.process_id) !== String(SCR013_PROCESS_ID)) continue;
            lstAcumulados.push(objRequest);
          }
          intLastPage = objBody.meta?.last_page ?? 1;
          intPage += 1;
        } while (intPage <= intLastPage);

        if (!blnCancelled) setCasos(lstAcumulados.map(mapRequestToCaso));
      } catch (exc) {
        const objErr = exc as { response?: { data?: { message?: string } }; message?: string };
        if (!blnCancelled) setError(objErr.response?.data?.message ?? objErr.message ?? 'Error desconocido');
      } finally {
        if (!blnCancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { blnCancelled = true; };
  }, []);

  return { casos, loading, error };
}
