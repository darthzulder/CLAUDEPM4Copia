import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PM4_ENV_FALLBACKS } from './pm4-context.service';
import { DatosTarea, TaskService } from './task.service';

/**
 * Specs de `TaskService`, portados 1:1 de `core/useTask.test.tsx` de React.
 *
 * **Paridad medida corriendo las dos suites, no contando bloques a ojo:** React da **15** casos y este
 * archivo **21** — los 15 con contraparte uno a uno (mismo `describe`, mismo escenario) más 6 propios.
 * El conteo importa porque el gate de la Fase 3 exige que ningún caso que existía en `frontend` quede
 * sin portar, y contar `it`s leyendo el archivo ya falló varias veces en esta migración.
 *
 * ── Qué cambia respecto del spec de React, y por qué ────────────────────────────────────────────
 * React mockeaba el módulo entero (`vi.mock('../api/pm4Client')`) y aseveraba sobre `fnGet`/`fnPut`.
 * Acá eso no se puede: el builder de Angular 21 **prohíbe `vi.mock()` sobre imports relativos**
 * (`Error: The "vi.mock" and related methods are not supported for relative imports with the Angular
 * unit-test system. Please use Angular TestBed for mocking dependencies.`) y el modo de falla es
 * traicionero — la suite entera reporta `(0 test)`, que se lee como un archivo roto.
 *
 * El reemplazo es `HttpTestingController`, y **es mejor que el mock de módulo** para lo que hay que
 * probar: en vez de aseverar que se llamó una función con ciertos argumentos, se asevera sobre la
 * **petición HTTP real** que salió — método, URL completa y cuerpo. El contrato de los dos PUT de
 * `reasignarTarea` es justamente un contrato de peticiones, así que se prueba más de frente que antes.
 * Y `objMock.verify()` en cada `afterEach` es una guarda que React no tenía: falla si quedó una
 * petición sin atender, o sea si el servicio pidió algo que el test no esperaba.
 *
 * ── Los 6 casos que no existían en React ────────────────────────────────────────────────────────
 * 1. **`case_id` gana sobre `task_id` cuando llegan los dos.** En el hook eso era un `if (strCaseId)`
 *    antes de la rama clásica, y ningún test lo fijaba porque el mock de `useToken` devolvía uno solo
 *    por vez. Es un orden de precedencia y merece quedar clavado.
 * 2. **El error con un cuerpo que no es un objeto con `message`** (PM4 devuelve texto plano en un 502
 *    de gateway). En axios `response.data.message` daba `undefined` y el `??` caía al mensaje nativo;
 *    la traducción a `HttpErrorResponse.error` tenía que replicarlo sin terminar mostrando
 *    `"undefined"` al usuario.
 * 3. **`cargando()` arranca en `true`** antes de que salga cualquier petición, o la pantalla parpadearía
 *    "sin datos" antes del loader.
 * 4. **`enviando` en `true` durante la petición** y de vuelta en `false` al terminar. React solo
 *    aseveraba el `false` final, que también se cumple si el flag nunca se prendió.
 * 5. **`enviando` vuelve a `false` aunque el PUT falle** (el `finally`). Sin eso, un error de red deja
 *    los botones muertos y la única salida del usuario es recargar el iframe.
 * 6. **El segundo PUT de `reasignarTarea` va después del primero, no en paralelo.** Si el guardado
 *    saliera primero y la reasignación fallara, el caso quedaría con datos nuevos y responsable viejo.
 *
 * ── El entorno se provee vacío ──────────────────────────────────────────────────────────────────
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado
 * desde `pm4-app/.env`). En este árbol sale vacío, así que los casos "sin task_id" pasarían solos —
 * pero **en la máquina de un dev con `VITE_TASK_ID` cargado se pondrían rojos**, por estado local
 * ajeno al código. Proveerlo vacío hace que estos tests dependan solo de la query string.
 */

const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

/** Igual que en `pm4-context.service.spec.ts`: jsdom navega dentro del mismo origen sin recargar. */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

const OBJ_TAREA: DatosTarea = {
  id: 55,
  status: 'ACTIVE',
  process_request_id: 9,
  data: { qd_x: '1' },
};

let objSvc: TaskService;
let objMock: HttpTestingController;

/**
 * Arma el TestBed. Se llama **después** de fijar la query string en cada test y no en un `beforeEach`
 * global: `Pm4ContextService` relee la URL en cada llamada, pero `cargar()` la consulta al principio,
 * así que el orden importa y dejarlo explícito en cada caso evita un acoplamiento invisible al orden.
 */
function armar(): void {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
    ],
  });
  objSvc = TestBed.inject(TaskService);
  objMock = TestBed.inject(HttpTestingController);
}

/**
 * Cede el turno a la cola de microtasks para que el `await` que sigue al `flush()` dentro del servicio
 * llegue a ejecutarse.
 *
 * **Hace falta y no es una espera arbitraria.** `flush()` resuelve la promesa del primer PUT de forma
 * sincrónica, pero el código que continúa después de ese `await` en `reasignarTarea()` es un microtask
 * que todavía no corrió: en el instante siguiente al `flush()`, el **segundo** PUT literalmente no se
 * ha emitido. Sin este `await`, el test falla con `Expected one matching request ... found none` y el
 * síntoma parece un defecto del servicio (ocurrió: 2 de 21 en rojo la primera corrida) cuando es puro
 * timing del propio spec.
 *
 * Es un `await` de un microtask, no un temporizador: no introduce ni flakiness ni espera real.
 */
function cederMicrotask(): Promise<void> {
  return Promise.resolve();
}

/** Deja el servicio con una tarea cargada, que es la precondición de los 3 métodos de escritura. */
async function cargarTarea(in_objTarea: DatosTarea = OBJ_TAREA): Promise<void> {
  fijarQueryString(`?task_id=${in_objTarea.id}`);
  armar();
  const prmCarga = objSvc.cargar();
  objMock.expectOne((in_objReq) => in_objReq.url === '/api/tasks/' + in_objTarea.id).flush(in_objTarea);
  await prmCarga;
}

beforeEach(() => {
  TestBed.resetTestingModule();
  fijarQueryString('');
});

// `verify()` falla si algún test dejó una petición sin atender, o sea si el servicio pidió algo que el
// test no esperaba. React no tenía equivalente: un `fnGet` de más pasaba inadvertido.
afterEach(() => {
  objMock.verify();
  fijarQueryString('');
});

describe('TaskService · carga inicial', () => {
  it('sin task_id ni case_id no golpea PM4 y expone blnEsWebEntry', async () => {
    fijarQueryString('');
    armar();
    await objSvc.cargar();

    expect(objSvc.tarea()).toBeNull();
    expect(objSvc.blnEsWebEntry).toBe(true);
    expect(objSvc.cargando()).toBe(false);
    // `verify()` del afterEach ya falla si hubiera salido una petición, pero aseverarlo acá nombra el
    // motivo: una web entry no tiene nada que cargar y pedirlo sería un 404 en cada arranque público.
    objMock.expectNone(() => true);
  });

  it('con task_id resuelve GET /tasks/{id}?include=data', async () => {
    fijarQueryString('?task_id=55');
    armar();
    const prmCarga = objSvc.cargar();

    const objReq = objMock.expectOne('/api/tasks/55?include=data');
    expect(objReq.request.method).toBe('GET');
    expect(objReq.request.params.get('include')).toBe('data');
    objReq.flush(OBJ_TAREA);
    await prmCarga;

    expect(objSvc.tarea()).toEqual(OBJ_TAREA);
    expect(objSvc.blnEsWebEntry).toBe(false);
    expect(objSvc.cargando()).toBe(false);
  });

  it('con case_id resuelve el task activo vía GET /cases/{id}/task', async () => {
    fijarQueryString('?case_id=C-1');
    armar();
    const prmCarga = objSvc.cargar();

    const objTareaDeCaso = { ...OBJ_TAREA, id: 77, process_request_id: 3, data: {} };
    const objReq = objMock.expectOne('/api/cases/C-1/task');
    expect(objReq.request.method).toBe('GET');
    objReq.flush(objTareaDeCaso);
    await prmCarga;

    expect(objSvc.tarea()).toEqual(objTareaDeCaso);
  });

  it('con AMBOS, case_id gana sobre task_id', async () => {
    // Caso nuevo (React no lo cubría). Es un orden de precedencia del hook original —el `if
    // (strCaseId)` va antes de la rama clásica— y no era observable allá porque el mock de `useToken`
    // devolvía un identificador por vez. Importa: cuando PM4 manda el caso, el task_id de la URL
    // puede ser de una tarea ya cerrada, y resolver por caso es lo que trae la ACTIVA.
    fijarQueryString('?task_id=55&case_id=C-1');
    armar();
    const prmCarga = objSvc.cargar();

    objMock.expectNone('/api/tasks/55?include=data');
    objMock.expectOne('/api/cases/C-1/task').flush({ ...OBJ_TAREA, id: 77 });
    await prmCarga;

    expect(objSvc.tarea()?.id).toBe(77);
  });

  it('un error con cuerpo {message} expone ese mensaje, no el genérico del transporte', async () => {
    fijarQueryString('?task_id=55');
    armar();
    const prmCarga = objSvc.cargar();

    objMock.expectOne('/api/tasks/55?include=data').flush(
      { message: 'Task no encontrada' },
      { status: 404, statusText: 'Not Found' },
    );
    await prmCarga;

    // El genérico sería "Http failure response for /api/tasks/55: 404 Not Found", que no le dice nada
    // al usuario. Lo que PM4 explica en el cuerpo es lo que se muestra.
    expect(objSvc.error()).toBe('Task no encontrada');
    expect(objSvc.tarea()).toBeNull();
    expect(objSvc.cargando()).toBe(false);
  });

  it('sin cuerpo {message} cae al mensaje del transporte', async () => {
    fijarQueryString('?task_id=55');
    armar();
    const prmCarga = objSvc.cargar();

    objMock
      .expectOne('/api/tasks/55?include=data')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await prmCarga;

    expect(objSvc.error()).toContain('Http failure response');
  });

  it('un cuerpo de error que NO es objeto con message no termina en "undefined"', async () => {
    // Caso nuevo. PM4 detrás de un gateway devuelve texto plano en un 502, y ahí `error` es un string.
    // En axios `response.data.message` daba `undefined` y el `??` salvaba la situación; al traducir a
    // `HttpErrorResponse.error` había que replicar esa guarda o el usuario vería "undefined".
    fijarQueryString('?task_id=55');
    armar();
    const prmCarga = objSvc.cargar();

    objMock.expectOne('/api/tasks/55?include=data').flush('<html>502 Bad Gateway</html>', {
      status: 502,
      statusText: 'Bad Gateway',
    });
    await prmCarga;

    expect(objSvc.error()).not.toContain('undefined');
    expect(objSvc.error()).toContain('Http failure response');
  });

  it('cargando() arranca en true antes de cualquier carga', () => {
    // Es el `useState(true)` de React: la pantalla pinta el loader desde el primer render, sin un
    // parpadeo de "no hay datos" antes de que la petición salga.
    fijarQueryString('?task_id=55');
    armar();
    expect(objSvc.cargando()).toBe(true);
    objMock.expectNone(() => true);
  });
});

describe('TaskService · completarTarea', () => {
  it('lanza si no hay tarea resuelta', async () => {
    fijarQueryString('');
    armar();
    await objSvc.cargar();

    await expect(objSvc.completarTarea({})).rejects.toThrow('No hay task_id resuelto');
  });

  it('PUT /tasks/{id} con status COMPLETED + los datos del form', async () => {
    await cargarTarea();

    const prmEnvio = objSvc.completarTarea({ qd_x: '2' });
    const objReq = objMock.expectOne('/api/tasks/55');
    expect(objReq.request.method).toBe('PUT');
    expect(objReq.request.body).toEqual({ status: 'COMPLETED', data: { qd_x: '2' } });
    objReq.flush({ ok: true });

    await expect(prmEnvio).resolves.toEqual({ ok: true });
    expect(objSvc.enviando()).toBe(false);
  });

  it('enviando() es true MIENTRAS la petición está en vuelo', async () => {
    // Caso nuevo: React solo aseveraba el `false` final, que también se cumple si el flag nunca se
    // prendió. Este es el estado que deshabilita los botones del ActionBar y evita el doble submit,
    // así que hay que ver el true, no solo el false.
    await cargarTarea();

    const prmEnvio = objSvc.completarTarea({});
    expect(objSvc.enviando()).toBe(true);

    objMock.expectOne('/api/tasks/55').flush({});
    await prmEnvio;
    expect(objSvc.enviando()).toBe(false);
  });

  it('un fallo del PUT deja enviando() en false (el finally corre igual)', async () => {
    // Sin el `finally`, un error de red dejaría los botones deshabilitados para siempre y la única
    // salida del usuario sería recargar el iframe.
    await cargarTarea();

    const prmEnvio = objSvc.completarTarea({});
    objMock.expectOne('/api/tasks/55').flush({}, { status: 500, statusText: 'Server Error' });

    await expect(prmEnvio).rejects.toBeDefined();
    expect(objSvc.enviando()).toBe(false);
  });
});

describe('TaskService · reasignarTarea (contrato de DOS PUT)', () => {
  it('lanza si no hay tarea resuelta', async () => {
    fijarQueryString('');
    armar();
    await objSvc.cargar();

    await expect(objSvc.reasignarTarea({}, 'user-1')).rejects.toThrow('No hay task_id resuelto');
  });

  it('reasigna con SOLO user_id y guarda los datos aparte vía PUT /requests/{id}', async () => {
    await cargarTarea();

    const prmEnvio = objSvc.reasignarTarea({ qd_x: '3' }, 'user-99');

    // Verificado contra el curl de la UI real de PM4: el PUT que reasigna lleva SOLO { user_id }.
    // Mezclarlo con status/data hace que PM4 acepte la petición y NO reasigne — sin error visible,
    // que es lo que lo vuelve caro de diagnosticar. De ahí que se asevere el cuerpo exacto.
    const objReqReasignar = objMock.expectOne('/api/tasks/55');
    expect(objReqReasignar.request.method).toBe('PUT');
    expect(objReqReasignar.request.body).toEqual({ user_id: 'user-99' });
    objReqReasignar.flush({ reasignado: true });
    await cederMicrotask();

    // Y los datos van en una petición aparte, al request, sin tocar el status de la tarea.
    const objReqDatos = objMock.expectOne('/api/requests/9');
    expect(objReqDatos.request.method).toBe('PUT');
    expect(objReqDatos.request.body).toEqual({ data: { qd_x: '3' } });
    objReqDatos.flush({ guardado: true });

    // Devuelve la respuesta de la REASIGNACIÓN, no la del guardado: es la que dice si salió bien lo
    // que la pantalla pidió.
    await expect(prmEnvio).resolves.toEqual({ reasignado: true });
  });

  it('el PUT de datos va DESPUÉS del de reasignación, no en paralelo', async () => {
    // El orden es parte del contrato: si el guardado saliera primero (o a la vez) y la reasignación
    // fallara, el caso quedaría con datos nuevos y el responsable viejo. Se asevera con el mock sin
    // atender el primer PUT: el segundo no puede existir todavía.
    await cargarTarea();

    const prmEnvio = objSvc.reasignarTarea({ qd_x: '3' }, 'user-99');
    objMock.expectNone('/api/requests/9');

    objMock.expectOne('/api/tasks/55').flush({ reasignado: true });
    await cederMicrotask();
    objMock.expectOne('/api/requests/9').flush({});
    await prmEnvio;
  });

  it('sin process_request_id NO intenta el segundo PUT', async () => {
    await cargarTarea({ ...OBJ_TAREA, process_request_id: 0 });

    const prmEnvio = objSvc.reasignarTarea({ qd_x: '3' }, 'user-99');
    objMock.expectOne('/api/tasks/55').flush({ reasignado: true });
    // El `cederMicrotask()` es imprescindible acá, más que en los otros dos casos: sin él, el
    // `expectNone` de abajo pasaría simplemente porque el servicio todavía no llegó a la línea del
    // segundo PUT, y el test daría verde con el guard borrado. Es la diferencia entre aseverar que NO
    // se emite y aseverar que no se emitió TODAVÍA.
    await cederMicrotask();

    // Sin el guard, la URL sería /api/requests/0 y PM4 devolvería un 404 que la pantalla mostraría
    // como si la reasignación hubiera fallado, cuando en realidad salió bien.
    objMock.expectNone((in_objReq) => in_objReq.url.startsWith('/api/requests/'));
    await prmEnvio;
  });
});

describe('TaskService · guardarBorrador', () => {
  it('lanza si no hay process_request_id resuelto', async () => {
    // El mensaje nombra `process_request_id`, no `task_id`: se escribe sobre el request (el caso), no
    // sobre la tarea, y confundirlos manda a buscar el problema al lugar equivocado.
    await cargarTarea({ ...OBJ_TAREA, process_request_id: 0 });

    await expect(objSvc.guardarBorrador({})).rejects.toThrow('No hay process_request_id resuelto');
  });

  it('PUT /requests/{id} con los datos, sin tocar el status de la tarea', async () => {
    await cargarTarea();

    const prmEnvio = objSvc.guardarBorrador({ qd_x: '4' });
    const objReq = objMock.expectOne('/api/requests/9');
    expect(objReq.request.method).toBe('PUT');
    expect(objReq.request.body).toEqual({ data: { qd_x: '4' } });
    // Que no haya `status` en el cuerpo es el punto: un borrador que completara la tarea avanzaría el
    // proceso a espaldas del usuario.
    expect(objReq.request.body).not.toHaveProperty('status');
    objReq.flush({ ok: true });

    await prmEnvio;
    objMock.expectNone('/api/tasks/55');
  });
});

describe('TaskService · iniciarProceso', () => {
  it('lanza si no hay process_id', async () => {
    fijarQueryString('');
    armar();
    await objSvc.cargar();

    await expect(objSvc.iniciarProceso({})).rejects.toThrow(
      'No hay process_id para iniciar el proceso',
    );
  });

  it('POST /process_events/{id} con el event_id como parámetro cuando existe', async () => {
    fijarQueryString('?process_id=31&event_id=node_661');
    armar();
    await objSvc.cargar();

    const prmEnvio = objSvc.iniciarProceso({ qd_x: '5' });
    const objReq = objMock.expectOne('/api/process_events/31?event=node_661');
    expect(objReq.request.method).toBe('POST');
    expect(objReq.request.body).toEqual({ qd_x: '5' });
    expect(objReq.request.params.get('event')).toBe('node_661');
    objReq.flush({ case_number: 100 });

    await expect(prmEnvio).resolves.toEqual({ case_number: 100 });
  });

  it('sin event_id no manda el parámetro event', async () => {
    // No es lo mismo omitirlo que mandarlo vacío: `event=` lo leería PM4 como un nodo llamado cadena
    // vacía en vez de usar el evento de inicio por defecto.
    fijarQueryString('?process_id=31');
    armar();
    await objSvc.cargar();

    const prmEnvio = objSvc.iniciarProceso({});
    const objReq = objMock.expectOne('/api/process_events/31');
    expect(objReq.request.params.has('event')).toBe(false);
    objReq.flush({});

    await prmEnvio;
  });
});
