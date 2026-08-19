import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParentRequestService } from './parent-request.service';

/**
 * Specs de `ParentRequestService`, extraído del `pm4.get(...)` inline de `RespuestaAreaResponsable.tsx`
 * al portar SCR-0052.
 *
 * ── Cobertura nueva: en React esto no tenía ni un test ──────────────────────────────────────────
 * La lógica vivía dentro de `registrarRespuesta`, que el smoke de la pantalla no ejercita (los 3 casos
 * de `RespuestaAreaResponsable.test.tsx` son montaje, precarga y el gate del botón). O sea que la
 * relectura del padre —lo único que evita **borrar** las ayudas posteriores de un caso— nunca estuvo
 * cubierta. Extraerla a un servicio es lo que la hace testeable sin montar la pantalla entera.
 *
 * ── Los dos casos que muerden ──────────────────────────────────────────────────────────────────
 * 1. **`include=data`**: sin ese parámetro PM4 responde 200 con el request pero sin variables, así que
 *    el historial llega vacío y es indistinguible de "el padre no tiene ayudas". Se asevera el param.
 * 2. **El fallo devuelve `null` y no lanza**: si lanzara, un ayudante no podría enviar su comentario
 *    por un problema de red ajeno. El modo de falla tiene que **degradar** al snapshot local.
 */

let objSvc: ParentRequestService;
let objMock: HttpTestingController;

beforeEach(() => {
  TestBed.resetTestingModule();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  objSvc = TestBed.inject(ParentRequestService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  // El `try/finally` por el mismo motivo que los specs de pantalla: un `verify()` que tira aborta el
  // hook y dejaría el TestBed instanciado, convirtiendo un caso roto en todos los siguientes rojos.
  try {
    objMock.verify();
  } finally {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  }
});

describe('ParentRequestService · idDelPadre', () => {
  it('resuelve la forma _request.parent_request_id', () => {
    expect(objSvc.idDelPadre({ _request: { parent_request_id: 4321 } })).toBe(4321);
  });

  it('resuelve la forma _parent.request_id como respaldo', () => {
    // PM4 publica el padre de dos maneras según la configuración del subproceso. Sin esta rama, los
    // casos de la segunda forma caerían al snapshot local sin que nada avise.
    expect(objSvc.idDelPadre({ _parent: { request_id: 99 } })).toBe(99);
  });

  it('⚠ prefiere _request sobre _parent cuando vienen las dos', () => {
    // El orden es el de React y se conserva: es el que la instancia real usa hoy. Si algún día las dos
    // formas discrepan, esta línea es la que decide, así que tiene que estar aseverada y no ser el
    // resultado accidental de cómo quedó escrito el `??`.
    expect(objSvc.idDelPadre({ _request: { parent_request_id: 7 }, _parent: { request_id: 8 } })).toBe(7);
  });

  it('devuelve null cuando la pantalla NO corre en un subproceso', () => {
    // Es el caso **normal** de la mayoría de las pantallas, no un error: sin padre no hay nada que
    // releer y la pantalla usa su propio `task.data`.
    expect(objSvc.idDelPadre({ qd_strAreaComment: 'hola' })).toBeNull();
    expect(objSvc.idDelPadre(undefined)).toBeNull();
  });

  it('devuelve null si la clave existe pero viene sin el id adentro', () => {
    // PM4 puede mandar `_request` con otros metadatos y sin `parent_request_id`. Sin esta guarda se
    // armaría una URL `/requests/undefined`, que es un 404 disfrazado de bug de red.
    expect(objSvc.idDelPadre({ _request: {} })).toBeNull();
  });
});

describe('ParentRequestService · leerVariables', () => {
  it('⚠ pide include=data, sin lo cual PM4 no devuelve las variables del caso', async () => {
    const objPromesa = objSvc.leerVariables(4321);

    const objPet = objMock.expectOne(
      (in_objReq) => in_objReq.method === 'GET' && in_objReq.url.endsWith('/requests/4321'),
    );
    // El caso entero existe por esta línea: sin el param la respuesta llega 200 y vacía, así que el
    // historial del padre se leería como "no hay ayudas" y la fusión no repararía nada.
    expect(objPet.request.params.get('include')).toBe('data');

    objPet.flush({ data: { qd_lstAssignHistory: [{ fecha: '2026-08-01' }] } });
    await expect(objPromesa).resolves.toEqual({
      qd_lstAssignHistory: [{ fecha: '2026-08-01' }],
    });
  });

  it('desempaqueta la respuesta cuando las variables vienen SIN envoltorio data', async () => {
    // El proxy devuelve las dos formas según el endpoint; el `?? ` de React se conserva y acá se fija.
    const objPromesa = objSvc.leerVariables(50);
    objMock.expectOne((in_objReq) => in_objReq.url.endsWith('/requests/50')).flush({
      qd_lstHelpResponses: [{ numero: 1 }],
    });

    await expect(objPromesa).resolves.toEqual({ qd_lstHelpResponses: [{ numero: 1 }] });
  });

  it('⚠ si la lectura falla devuelve null y NO lanza', async () => {
    const objPromesa = objSvc.leerVariables(4321);
    objMock
      .expectOne((in_objReq) => in_objReq.url.endsWith('/requests/4321'))
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    // Si esto lanzara, el ayudante no podría enviar su comentario por un fallo de red que no es suyo.
    // `null` deja que la pantalla caiga al snapshot local: peor dato, pero la respuesta no se pierde.
    await expect(objPromesa).resolves.toBeNull();
  });
});
