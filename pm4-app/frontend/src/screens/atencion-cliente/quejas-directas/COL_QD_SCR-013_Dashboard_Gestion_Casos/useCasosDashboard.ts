import { useEffect, useMemo, useState } from 'react';
import pm4 from '../../../../api/pm4Client';
import { useHolidaySet } from '../../../../core/businessDays';
import { SCR013_PROCESS_ID, SCR013_CASE_TITLE } from '../fields/fields';
import type { RequestRaw } from '../fields/types';
import { mapRequestToCaso } from './dashboardHelpers';

interface RequestsResponse {
  data?: RequestRaw[];
  meta?: { last_page?: number };
}

// Forma mínima de una tarea PM4 (GET /tasks?include=data): PM4 anida en data._request el
// request al que pertenece esa tarea (con case_number/case_title) — ver fetchActiveDataByCase().
interface TaskRaw {
  id: number;
  status?: string;
  data?: Record<string, unknown> & { _request?: { case_number?: number | string; case_title?: string } };
}

interface TasksResponse {
  data?: TaskRaw[];
  meta?: { last_page?: number };
}

// El flujo de Quejas Directas dispara sub-procesos (SP1/SP2/SP3…) para pasos puntuales del
// caso (p.ej. "Gestionar Respuesta Interna y Revisión SAC"). Mientras uno está corriendo, el
// request RAÍZ (process_id = SCR013_PROCESS_ID) queda SIN tarea propia — el caso está
// "parado" dentro del sub-proceso, que tiene su PROPIA copia de los campos qd_* tomada al
// crearse (puede diferir de la del raíz si algo cambió después). Mostrar el dato del raíz en
// ese caso muestra un valor obsoleto (p.ej. qd_strFilingDate de cuando arrancó el caso, no el
// valor vigente en el sub-proceso donde realmente está corriendo ahora).
//
// Para mostrar el dato vigente hay que ubicar la tarea ACTIVA real del caso (raíz o cualquier
// sub-proceso) y usar SU data. PM4 no permite filtrar tareas por case_number vía query param
// (solo por PMQL, y consultarlo caso por caso serían 100+ llamadas). En cambio el total de
// tareas ACTIVAS en todo el tenant es pequeño (paginado, ~150), así que se traen todas de una
// vez y se cruzan por case_number contra los casos QD ya conocidos (requests raíz) —
// exigiendo también que el case_title coincida, para no cruzar por accidente con un
// case_number de OTRA colección de procesos (PM4 numera case_number por colaboración, no
// globalmente).
async function fetchActiveDataByCase(
  in_setCaseNumbers: ReadonlySet<number>,
): Promise<Map<number, Record<string, unknown>>> {
  const dicPorCaso = new Map<number, Record<string, unknown>>();
  let intPage = 1;
  let intLastPage = 1;

  do {
    const objResp = await pm4.get<TasksResponse>('/tasks', {
      params: { status: 'ACTIVE', per_page: 100, page: intPage, include: 'data' },
    });
    const objBody = objResp.data ?? {};
    for (const objTask of objBody.data ?? []) {
      const objReq = objTask.data?._request;
      const intCaso = Number(objReq?.case_number);
      if (
        objTask.data &&
        Number.isFinite(intCaso) &&
        in_setCaseNumbers.has(intCaso) &&
        objReq?.case_title === SCR013_CASE_TITLE
      ) {
        dicPorCaso.set(intCaso, objTask.data);
      }
    }
    intLastPage = objBody.meta?.last_page ?? 1;
    intPage += 1;
  } while (intPage <= intLastPage);

  return dicPorCaso;
}

/**
 * Obtiene TODOS los casos del proceso QD desde GET /api/1.0/requests?include=data
 * (paginando hasta last_page) y los mapea a CasoDashboard. Réplica de la lógica del
 * script PHP de PM4: intenta acotar con PMQL `process_id = N` y, si el servidor rechaza
 * el PMQL, reintenta sin él filtrando el process_id en el cliente.
 *
 * Además, para cada caso ubica dónde está "parado" realmente su flujo (root o sub-proceso,
 * ver fetchActiveDataByCase()) y usa esos datos en vez de los del request raíz cuando existen
 * — así qd_strFilingDate/qd_strSlaAssigned/etc. reflejan el punto vigente del proceso, no un
 * snapshot desactualizado tomado cuando arrancó el caso. Si esa segunda consulta falla, el
 * dashboard sigue mostrando los datos del request raíz (degradación, no se cae la vista).
 *
 * Los "días restantes" se calculan en días HÁBILES (feriados de Colombia vía
 * useHolidaySet); el mapeo se recalcula si la colección de feriados llega después
 * que los requests.
 */
export function useCasosDashboard() {
  const [requests, setRequests] = useState<RequestRaw[]>([]);
  const [activeDataByCase, setActiveDataByCase] = useState<Map<number, Record<string, unknown>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { holidays } = useHolidaySet();

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

        if (blnCancelled) return;
        setRequests(lstAcumulados);

        // Mejora sobre los datos ya reales de arriba: si falla, no tiramos el dashboard —
        // simplemente se sigue mostrando el dato del request raíz (comportamiento previo).
        try {
          const setCaseNumbers = new Set(
            lstAcumulados.map((r) => Number(r.case_number)).filter((n) => Number.isFinite(n)),
          );
          const dicActiveData = await fetchActiveDataByCase(setCaseNumbers);
          if (!blnCancelled) setActiveDataByCase(dicActiveData);
        } catch (excTareas) {
          console.error('[useCasosDashboard] No se pudo ubicar la tarea activa por caso (se muestra el dato del request raíz):', excTareas);
        }
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

  const casos = useMemo(
    () => requests.map((objRequest) => {
      const objDataVigente = activeDataByCase.get(Number(objRequest.case_number));
      const objEfectivo: RequestRaw = objDataVigente ? { ...objRequest, data: objDataVigente } : objRequest;
      return mapRequestToCaso(objEfectivo, holidays);
    }),
    [requests, activeDataByCase, holidays],
  );

  return { casos, loading, error };
}
