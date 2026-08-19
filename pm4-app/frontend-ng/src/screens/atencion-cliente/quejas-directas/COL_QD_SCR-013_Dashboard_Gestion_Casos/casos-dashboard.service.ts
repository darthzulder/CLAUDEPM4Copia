import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../../../../api/pm4Client';
import { HolidaysService } from '../../../../core/holidays.service';
import { SCR013_CASE_TITLE, SCR013_PROCESS_ID } from '../fields/fields';
import type { CasoDashboard, RequestRaw } from '../fields/types';
import { mapRequestToCaso } from './dashboard-helpers';

/** Cuántos requests/tareas se piden por página. PM4 topea en 100. */
const INT_PER_PAGE = 100;

interface RequestsResponse {
  data?: RequestRaw[];
  meta?: { last_page?: number };
}

// Forma mínima de una tarea PM4 (GET /tasks?include=data): PM4 anida en data._request el
// request al que pertenece esa tarea (con case_number/case_title) — ver buscarDataActivaPorCaso().
interface TaskRaw {
  id: number;
  status?: string;
  data?: Record<string, unknown> & { _request?: { case_number?: number | string; case_title?: string } };
}

interface TasksResponse {
  data?: TaskRaw[];
  meta?: { last_page?: number };
}

/**
 * Todos los casos del proceso QD, ya mapeados a `CasoDashboard`. Reemplaza al hook
 * `useCasosDashboard()` de React.
 *
 * ── Esta pantalla no tiene `task_id`, y por eso no usa `TaskService` ────────────────────────────
 * SCR-013 es el único tablero del proceso: no completa ninguna tarea, lista **todos** los casos.
 * Su fuente es `GET /requests?include=data` paginado, no un task puntual, así que la carga vive acá
 * y no en el servicio de tareas.
 *
 * ── Instancia por pantalla, no singleton ───────────────────────────────────────────────────────
 * Sin `providedIn: 'root'`: el estado (`casos`, `cargando`, `error`) es el de *este* tablero, y
 * además depende de `HolidaysService`, que tampoco es singleton. La pantalla lo declara en sus
 * `providers`.
 *
 * ── `casos` es un `computed`, y eso resuelve gratis un problema que React resolvía a mano ───────
 * Los días hábiles necesitan los feriados, que llegan por su propia petición y pueden llegar
 * **después** que los requests. En React eso era un `useMemo` con deps `[requests, activeDataByCase,
 * holidays]`; acá el `computed` se recalcula solo cuando cualquiera de los tres signals cambia, sin
 * lista de dependencias que se pueda quedar corta.
 */
@Injectable()
export class CasosDashboardService {
  private readonly objHttp = inject(HttpClient);
  private readonly objFeriados = inject(HolidaysService);

  private readonly sigRequests = signal<RequestRaw[]>([]);
  private readonly sigDataActivaPorCaso = signal<ReadonlyMap<number, Record<string, unknown>>>(new Map());
  private readonly sigCargando = signal(true);
  private readonly sigError = signal<string | null>(null);

  /**
   * `true` mientras los requests están en vuelo. Arranca en **`true`** (no como
   * `CollectionService`): este servicio siempre carga, y arrancar en `false` haría que la tabla
   * pintara "no hay casos" durante el primer frame.
   */
  public readonly cargando: Signal<boolean> = this.sigCargando.asReadonly();

  /** Mensaje de error de la carga de requests, o `null`. Ver `cargar()` sobre qué NO llega acá. */
  public readonly error: Signal<string | null> = this.sigError.asReadonly();

  /**
   * Los casos listos para la tabla. Para cada request se usa la data de su tarea ACTIVA si se pudo
   * ubicar, y si no la del request raíz — ver `buscarDataActivaPorCaso()`.
   *
   * La sustitución es del objeto `data` **completo**, no una mezcla campo por campo: la data del
   * sub-proceso es un snapshot coherente de ese punto del flujo, y combinarla con la del raíz daría
   * una fila que no corresponde a ningún estado real del caso.
   */
  public readonly casos: Signal<CasoDashboard[]> = computed(() => {
    const dicActiva = this.sigDataActivaPorCaso();
    const setFeriados = this.objFeriados.feriados();
    return this.sigRequests().map((in_objRequest) => {
      const dicDataVigente = dicActiva.get(Number(in_objRequest.case_number));
      const objEfectivo: RequestRaw = dicDataVigente
        ? { ...in_objRequest, data: dicDataVigente }
        : in_objRequest;
      return mapRequestToCaso(objEfectivo, setFeriados);
    });
  });

  /**
   * Trae todos los casos del proceso y, para cada uno, ubica dónde está parado su flujo.
   *
   * **Réplica de la lógica del script PHP de PM4:** acota con PMQL `process_id = N` y, si el
   * servidor rechaza el PMQL, reintenta sin él filtrando el `process_id` en el cliente. El
   * reintento se hace **una sola vez** y a partir de ahí todas las páginas van sin PMQL: si el
   * servidor no lo acepta en la página 1, no lo va a aceptar en la 2.
   *
   * No lanza. Un fallo de los requests deja `error` con el mensaje; un fallo al ubicar las tareas
   * activas **no** llega a `error` a propósito (ver el `catch` interno).
   */
  public async cargar(): Promise<void> {
    this.sigCargando.set(true);
    this.sigError.set(null);
    try {
      const cllAcumulados: RequestRaw[] = [];
      let intPage = 1;
      let intLastPage = 1;
      let blnSaltarPmql = false;

      do {
        let objResp: RequestsResponse | undefined;
        try {
          objResp = await this.pedirRequests(intPage, blnSaltarPmql);
        } catch (in_excError: unknown) {
          // Auto-recuperación: si el PMQL falla, reintenta sin él (filtro en cliente).
          if (blnSaltarPmql) throw in_excError;
          blnSaltarPmql = true;
          objResp = await this.pedirRequests(intPage, true);
        }

        const objBody = objResp ?? {};
        for (const objRequest of objBody.data ?? []) {
          // Sin PMQL vienen los requests de TODOS los procesos: el filtro que el servidor no hizo
          // se hace acá.
          if (blnSaltarPmql && String(objRequest.process_id) !== String(SCR013_PROCESS_ID)) continue;
          cllAcumulados.push(objRequest);
        }
        intLastPage = objBody.meta?.last_page ?? 1;
        intPage += 1;
      } while (intPage <= intLastPage);

      this.sigRequests.set(cllAcumulados);

      // Mejora sobre los datos ya reales de arriba: si falla, NO se tira el dashboard — se sigue
      // mostrando el dato del request raíz. Por eso este `catch` no toca `sigError`: la vista es
      // utilizable, solo que algún caso parado en un sub-proceso puede mostrar un valor de cuando
      // arrancó. Un cartel rojo acá haría creer que la tabla no sirve, y sí sirve.
      try {
        const setCaseNumbers = new Set(
          cllAcumulados.map((in_objReq) => Number(in_objReq.case_number)).filter((in_intN) => Number.isFinite(in_intN)),
        );
        this.sigDataActivaPorCaso.set(await this.buscarDataActivaPorCaso(setCaseNumbers));
      } catch (in_excTareas: unknown) {
        console.error(
          '[CasosDashboardService] No se pudo ubicar la tarea activa por caso (se muestra el dato del request raíz):',
          in_excTareas,
        );
      }
    } catch (in_excError: unknown) {
      this.sigError.set(this.mensajeDeError(in_excError));
    } finally {
      this.sigCargando.set(false);
    }
  }

  /** Una página de `/requests`, con o sin el PMQL de process_id. */
  private pedirRequests(in_intPage: number, in_blnSaltarPmql: boolean): Promise<RequestsResponse> {
    let objParams = new HttpParams()
      .set('include', 'data')
      .set('per_page', String(INT_PER_PAGE))
      .set('page', String(in_intPage))
      .set('type', 'all');
    if (!in_blnSaltarPmql) {
      objParams = objParams.set('pmql', `process_id = ${SCR013_PROCESS_ID}`);
    }
    return firstValueFrom(this.objHttp.get<RequestsResponse>(urlApi('/requests'), { params: objParams }));
  }

  /**
   * Ubica, para cada caso, la data de su tarea ACTIVA — sea del request raíz o de un sub-proceso.
   *
   * El flujo de Quejas Directas dispara sub-procesos (SP1/SP2/SP3…) para pasos puntuales del caso
   * (p.ej. "Gestionar Respuesta Interna y Revisión SAC"). Mientras uno está corriendo, el request
   * RAÍZ (`process_id = SCR013_PROCESS_ID`) queda SIN tarea propia — el caso está "parado" dentro
   * del sub-proceso, que tiene su PROPIA copia de los campos `qd_*` tomada al crearse. Mostrar el
   * dato del raíz en ese caso muestra un valor obsoleto (p.ej. el `qd_strFilingDate` de cuando
   * arrancó el caso, no el vigente donde realmente está corriendo ahora).
   *
   * **Por qué se traen TODAS las tareas activas en vez de consultar caso por caso:** PM4 no permite
   * filtrar tareas por `case_number` vía query param (solo por PMQL, y consultarlo caso por caso
   * serían 100+ llamadas). El total de tareas ACTIVAS del tenant en cambio es chico (~150 paginado),
   * así que se traen todas y se cruzan contra los casos QD ya conocidos.
   *
   * **El filtro por `case_title` no es redundante:** PM4 numera `case_number` por colaboración, no
   * globalmente, así que un `case_number` de OTRA colección de procesos puede coincidir por
   * accidente con uno QD. Sin exigir el título, ese cruce pisaría la fila con datos de otro proceso.
   */
  private async buscarDataActivaPorCaso(
    in_setCaseNumbers: ReadonlySet<number>,
  ): Promise<ReadonlyMap<number, Record<string, unknown>>> {
    const dicPorCaso = new Map<number, Record<string, unknown>>();
    let intPage = 1;
    let intLastPage = 1;

    do {
      const objParams = new HttpParams()
        .set('status', 'ACTIVE')
        .set('per_page', String(INT_PER_PAGE))
        .set('page', String(intPage))
        .set('include', 'data');
      const objBody =
        (await firstValueFrom(this.objHttp.get<TasksResponse>(urlApi('/tasks'), { params: objParams }))) ?? {};

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

  /** Mensaje que PM4 manda en el cuerpo, si lo manda; si no, el del error de transporte. */
  private mensajeDeError(in_excError: unknown): string {
    const objErr = in_excError as { error?: { message?: string }; message?: string };
    return objErr?.error?.message ?? objErr?.message ?? 'Error desconocido';
  }
}
