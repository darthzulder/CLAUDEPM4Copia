import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollectionService } from '../../../../core/collection.service';
import { HolidaysService } from '../../../../core/holidays.service';
import { SCR013_CASE_TITLE, SCR013_PROCESS_ID } from '../fields/fields';
import { CasosDashboardService } from './casos-dashboard.service';

/**
 * Specs de `CasosDashboardService`, port de `useCasosDashboard.ts`.
 *
 * ── El hook de React NO tenía spec propio: estos casos son cobertura nueva ───────────────────────
 * Y es justo la lógica donde un fallo es silencioso y caro: el paginado, el fallback de PMQL, el
 * cruce de tareas activas por `case_title` y la degradación cuando `/tasks` revienta. Ninguna de esas
 * cuatro ramas estaba aseverada en React; el smoke de la pantalla montaba con la lista vacía.
 *
 * La URL con sus query params ES el criterio de match de `expectOne`, así que el paginado
 * (`page`/`per_page`) y el PMQL quedan aseverados en cada caso sin escribir un test extra.
 */

let objSvc: CasosDashboardService;
let objMock: HttpTestingController;

/**
 * La URL de requests con PMQL, tal como la arma el servicio. El orden es el de `HttpParams`.
 *
 * ⚠ El PMQL va con los espacios como `%20` pero el `=` **crudo**: `HttpParams` no escapa `=` dentro
 * del valor de un parámetro. Usar `encodeURIComponent` acá daría `%3D` y ningún `expectOne`
 * matchearía (el mensaje de error muestra las dos URLs casi idénticas y cuesta verlo).
 */
function urlRequests(in_intPage: number): string {
  return (
    `/api/requests?include=data&per_page=100&page=${in_intPage}&type=all` +
    `&pmql=process_id%20=%20${SCR013_PROCESS_ID}`
  );
}

/** La misma URL, sin el PMQL (el reintento de auto-recuperación). */
function urlRequestsSinPmql(in_intPage: number): string {
  return `/api/requests?include=data&per_page=100&page=${in_intPage}&type=all`;
}

/** La URL de tareas activas. */
function urlTareas(in_intPage: number): string {
  return `/api/tasks?status=ACTIVE&per_page=100&page=${in_intPage}&include=data`;
}

/**
 * Le da al `await` de la implementación la vuelta que necesita para emitir la petición siguiente.
 *
 * `flush()` resuelve el observable pero el `await` del servicio se retoma en un microtask posterior,
 * así que la petición de la página 2 (o la de `/tasks`) **todavía no existe** cuando la línea de
 * abajo corre. Sin esta espera, `expectOne` reporta "found none" sobre una URL que el servicio sí
 * pide, un par de microtasks después — el mismo idioma que usan `pm4-groups.service.spec.ts` y
 * `attachments.service.spec.ts`. Dos vueltas porque entre petición y petición hay dos `await`
 * encadenados (el `firstValueFrom` y el del bucle).
 */
async function vuelta(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Un request crudo del proceso QD, con lo mínimo que el mapeo mira. */
function request(in_dicOverrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    case_number: 100,
    process_id: SCR013_PROCESS_ID,
    status: 'ACTIVE',
    data: { qd_strSfcCode: '13950001' },
    ...in_dicOverrides,
  };
}

beforeEach(() => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      // `HolidaysService` necesita su `CollectionService`; no se carga en estos casos, así que el
      // set de feriados queda vacío y los días hábiles cuentan sábados/domingos como no hábiles
      // igual (esa matemática ya está cubierta en business-days.spec.ts).
      CollectionService,
      HolidaysService,
      CasosDashboardService,
    ],
  });
  objSvc = TestBed.inject(CasosDashboardService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  objMock.verify();
});

describe('CasosDashboardService · paginado de requests', () => {
  it('sigue paginando hasta last_page y acumula los casos de todas las páginas', async () => {
    // Sin el bucle, el dashboard mostraría solo los primeros 100 casos y nadie lo notaría:
    // la tabla se ve perfectamente bien, simplemente le faltan filas.
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({
      data: [request({ id: 1, case_number: 100 })],
      meta: { last_page: 2 },
    });
    await vuelta();
    objMock.expectOne(urlRequests(2)).flush({
      data: [request({ id: 2, case_number: 200 })],
      meta: { last_page: 2 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({ data: [], meta: { last_page: 1 } });
    await prm;

    expect(objSvc.casos()).toHaveLength(2);
    expect(objSvc.casos().map((c) => c.id)).toEqual([1, 2]);
    expect(objSvc.cargando()).toBe(false);
    expect(objSvc.error()).toBeNull();
  });

  it('sin meta.last_page pide una sola página (no entra en bucle infinito)', async () => {
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({ data: [request()] });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({ data: [] });
    await prm;

    expect(objSvc.casos()).toHaveLength(1);
  });
});

describe('CasosDashboardService · auto-recuperación del PMQL', () => {
  it('si el servidor rechaza el PMQL, reintenta sin él y filtra el process_id en cliente', async () => {
    // Réplica de la lógica del script PHP de PM4. Sin el filtro en cliente, el reintento traería
    // los requests de TODOS los procesos del tenant al tablero de Quejas Directas.
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({ message: 'PMQL inválido' }, { status: 422, statusText: 'Unprocessable' });
    await vuelta();
    objMock.expectOne(urlRequestsSinPmql(1)).flush({
      data: [
        request({ id: 1, case_number: 100, process_id: SCR013_PROCESS_ID }),
        request({ id: 9, case_number: 900, process_id: 999 }), // de otro proceso: se descarta
      ],
      meta: { last_page: 1 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({ data: [] });
    await prm;

    expect(objSvc.casos().map((c) => c.id)).toEqual([1]);
    expect(objSvc.error()).toBeNull();
  });

  it('una vez que el PMQL falló, las páginas siguientes ya van sin PMQL', async () => {
    // Si el servidor no lo acepta en la página 1, no lo va a aceptar en la 2: reintentar con PMQL
    // en cada página duplicaría las llamadas para nada.
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush(null, { status: 422, statusText: 'Unprocessable' });
    await vuelta();
    objMock.expectOne(urlRequestsSinPmql(1)).flush({
      data: [request({ id: 1, case_number: 100 })],
      meta: { last_page: 2 },
    });
    // La página 2 se pide directamente sin PMQL — si el servicio volviera a intentar con PMQL,
    // este `expectOne` no encontraría la petición y el caso se pondría rojo.
    await vuelta();
    objMock.expectOne(urlRequestsSinPmql(2)).flush({
      data: [request({ id: 2, case_number: 200 })],
      meta: { last_page: 2 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({ data: [] });
    await prm;

    expect(objSvc.casos()).toHaveLength(2);
  });

  it('si también falla el reintento sin PMQL, expone el mensaje de PM4 en error', async () => {
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush(null, { status: 500, statusText: 'Server Error' });
    await vuelta();
    objMock
      .expectOne(urlRequestsSinPmql(1))
      .flush({ message: 'Token vencido' }, { status: 401, statusText: 'Unauthorized' });
    await prm;

    expect(objSvc.error()).toBe('Token vencido');
    expect(objSvc.casos()).toEqual([]);
    expect(objSvc.cargando()).toBe(false);
  });
});

describe('CasosDashboardService · cruce con la tarea activa del caso', () => {
  it('usa la data de la tarea activa en vez de la del request raíz', async () => {
    // El caso está parado en un sub-proceso, que tiene su propia copia de los campos qd_*. Mostrar
    // la del raíz mostraría el valor de cuando arrancó el caso.
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({
      data: [request({ id: 1, case_number: 100, data: { qd_strSfcCode: 'VIEJO' } })],
      meta: { last_page: 1 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({
      data: [
        {
          id: 55,
          status: 'ACTIVE',
          data: {
            qd_strSfcCode: 'VIGENTE',
            _request: { case_number: 100, case_title: SCR013_CASE_TITLE },
          },
        },
      ],
      meta: { last_page: 1 },
    });
    await prm;

    expect(objSvc.casos()[0].numeroCaso).toBe('VIGENTE');
  });

  it('⚠ un case_number que coincide pero con OTRO case_title no pisa la fila', async () => {
    // PM4 numera case_number por colaboración, no globalmente: sin exigir el título, una tarea de
    // otra colección de procesos con el mismo número reemplazaría los datos del caso QD por los
    // de un proceso ajeno. Es la clase de bug que solo se ve con datos de producción.
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({
      data: [request({ id: 1, case_number: 100, data: { qd_strSfcCode: 'DEL-CASO-QD' } })],
      meta: { last_page: 1 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({
      data: [
        {
          id: 55,
          status: 'ACTIVE',
          data: {
            qd_strSfcCode: 'DE-OTRO-PROCESO',
            _request: { case_number: 100, case_title: 'COL - Otro Proceso Cualquiera' },
          },
        },
      ],
      meta: { last_page: 1 },
    });
    await prm;

    expect(objSvc.casos()[0].numeroCaso).toBe('DEL-CASO-QD');
  });

  it('pagina también las tareas activas', async () => {
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({
      data: [request({ id: 1, case_number: 100 }), request({ id: 2, case_number: 200 })],
      meta: { last_page: 1 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({
      data: [{ id: 51, data: { qd_strSfcCode: 'T1', _request: { case_number: 100, case_title: SCR013_CASE_TITLE } } }],
      meta: { last_page: 2 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(2)).flush({
      data: [{ id: 52, data: { qd_strSfcCode: 'T2', _request: { case_number: 200, case_title: SCR013_CASE_TITLE } } }],
      meta: { last_page: 2 },
    });
    await prm;

    expect(objSvc.casos().map((c) => c.numeroCaso)).toEqual(['T1', 'T2']);
  });

  it('si /tasks falla, DEGRADA a los datos del request raíz y NO reporta error', async () => {
    // Decisión de diseño heredada: la tabla es utilizable con los datos del raíz. Un cartel rojo
    // haría creer que no sirve. El fallo se registra por consola (diagnóstico), no en `error`.
    const fnConsola = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({
      data: [request({ id: 1, case_number: 100, data: { qd_strSfcCode: 'DEL-RAIZ' } })],
      meta: { last_page: 1 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush(null, { status: 500, statusText: 'Server Error' });
    await prm;

    expect(objSvc.error()).toBeNull(); // la clave del caso: NO es un error de pantalla
    expect(objSvc.casos()[0].numeroCaso).toBe('DEL-RAIZ');
    expect(fnConsola).toHaveBeenCalled();
    fnConsola.mockRestore();
  });

  it('un request sin case_number no rompe el cruce', async () => {
    const prm = objSvc.cargar();

    objMock.expectOne(urlRequests(1)).flush({
      data: [request({ id: 1, case_number: undefined })],
      meta: { last_page: 1 },
    });
    await vuelta();
    objMock.expectOne(urlTareas(1)).flush({ data: [] });
    await prm;

    expect(objSvc.casos()).toHaveLength(1);
  });
});
