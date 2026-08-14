import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestFilesService } from './request-files.service';
import type { Pm4File } from './request-files.types';

/**
 * Specs de `RequestFilesService`, el port del hook `useRequestFiles()` de React.
 *
 * ── Sin baseline de tests sobre la parte HTTP, igual que `CollectionService` ─────────────────────
 * `core/useRequestFiles.test.ts` tiene **8 casos y los 8 son de `resolveFileId`**, el helper puro que
 * ya se portó 1:1 en la Fase 3a (`request-files.types.spec.ts`, **8 casos**, paridad medida). El hook
 * en sí —las dos formas de respuesta, el gate por `requestId`, el mensaje del fallo— nunca estuvo
 * cubierto. Este archivo es cobertura nueva sobre comportamiento portado.
 *
 * ── La divergencia deliberada respecto de React, declarada ──────────────────────────────────────
 * React **no** limpiaba `files` en el `catch`: una lista ya cargada sobrevivía al fallo de una recarga
 * posterior. Acá sí se limpia, y es el único cambio de comportamiento del port. El motivo es que
 * `RequestFileList` pinta `error` **y** la lista a la vez: conservar los archivos viejos junto a un
 * cartel de error le diría al usuario dos cosas contradictorias sobre el mismo caso. Va con caso de
 * test para que sea una decisión visible y no un accidente.
 */

const OBJ_ARCHIVO: Pm4File = {
  id: 501,
  file_name: 'cedula.pdf',
  mime_type: 'application/pdf',
  size: 12345,
  created_at: '2026-08-01T10:00:00+00:00',
  updated_at: '2026-08-01T10:00:00+00:00',
  custom_properties: { data_name: 'qd_docCedula' },
};

const OBJ_ARCHIVO_2: Pm4File = { ...OBJ_ARCHIVO, id: 502, file_name: 'contrato.pdf' };

const STR_URL = '/api/requests/77/files';

let objSvc: RequestFilesService;
let objMock: HttpTestingController;

beforeEach(() => {
  TestBed.resetTestingModule();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), RequestFilesService],
  });
  objSvc = TestBed.inject(RequestFilesService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  objMock.verify();
  vi.restoreAllMocks();
});

describe('RequestFilesService · la forma expuesta', () => {
  it('arranca vacío, sin cargar y sin error', () => {
    // `cargando` arranca en false y no en true: hay pantallas que se montan sin
    // `process_request_id` y nunca llaman a cargar(), así que un true inicial dejaría un spinner
    // eterno en la sección de adjuntos.
    expect(objSvc.files()).toEqual([]);
    expect(objSvc.cargando()).toBe(false);
    expect(objSvc.error()).toBeNull();
  });

  it('expone error, al contrario de CollectionService', () => {
    // No es simetría rota por descuido: `RequestFileList` lo pinta, porque un fallo acá es un hueco
    // visible (no se puede distinguir "sin adjuntos" de "no se pudieron traer"). Ver el encabezado
    // del servicio.
    expect('error' in objSvc).toBe(true);
    expect(typeof objSvc.error).toBe('function');
  });
});

describe('RequestFilesService · las dos formas de respuesta de PM4', () => {
  it('acepta la respuesta envuelta en data', async () => {
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush({ data: [OBJ_ARCHIVO, OBJ_ARCHIVO_2] });
    await prm;
    expect(objSvc.files()).toEqual([OBJ_ARCHIVO, OBJ_ARCHIVO_2]);
  });

  it('acepta el array pelado', async () => {
    // Es la otra forma real del endpoint, no un caso hipotético: el hook de React ya ramificaba con
    // `Array.isArray`. Asumir una sola forma dejaría la lista vacía SIN error contra la mitad de los
    // entornos, que es el peor modo de falla posible acá (parece "no hay adjuntos").
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush([OBJ_ARCHIVO]);
    await prm;
    expect(objSvc.files()).toEqual([OBJ_ARCHIVO]);
  });

  it('un objeto sin la clave data deja la lista vacía sin lanzar', async () => {
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush({});
    await prm;
    expect(objSvc.files()).toEqual([]);
    expect(objSvc.error()).toBeNull();
  });

  it('un array vacío es una respuesta válida, no un error', async () => {
    // Un caso sin adjuntos es el estado normal de una queja recién creada.
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush([]);
    await prm;
    expect(objSvc.files()).toEqual([]);
    expect(objSvc.error()).toBeNull();
  });

  it('usa el request_id en la URL', async () => {
    const prm = objSvc.cargar(999);
    objMock.expectOne('/api/requests/999/files').flush([]);
    await prm;
  });

  it('pide por GET', async () => {
    const prm = objSvc.cargar(77);
    const objReq = objMock.expectOne(STR_URL);
    expect(objReq.request.method).toBe('GET');
    objReq.flush([]);
    await prm;
  });
});

describe('RequestFilesService · el gate por requestId', () => {
  it('no pide nada con requestId undefined', async () => {
    // Es el estado normal de una pantalla que se monta antes de que TaskService resuelva la tarea.
    await objSvc.cargar(undefined);
    objMock.expectNone(() => true);
  });

  it('no pide nada con requestId null', async () => {
    await objSvc.cargar(null);
    objMock.expectNone(() => true);
  });

  it('no pide nada con requestId 0', async () => {
    // El `if (!in_intRequestId)` de React trata el 0 como ausente. Se preserva: PM4 no usa 0 como
    // request_id, así que un 0 acá significa "todavía no resuelto", no "el request cero".
    await objSvc.cargar(0);
    objMock.expectNone(() => true);
  });

  it('un requestId ausente NO limpia la lista ya cargada', async () => {
    // Preserva el `return` sin limpiar de React: limpiar acá haría titilar la lista cada vez que la
    // pantalla re-evalúa con el id todavía sin resolver.
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush([OBJ_ARCHIVO]);
    await prm;
    expect(objSvc.files()).toHaveLength(1);

    await objSvc.cargar(null);
    expect(objSvc.files()).toHaveLength(1);
  });
});

describe('RequestFilesService · el estado de carga y el fallo', () => {
  it('cargando pasa a true durante la petición y vuelve a false al terminar', async () => {
    const prm = objSvc.cargar(77);
    expect(objSvc.cargando()).toBe(true);
    objMock.expectOne(STR_URL).flush([]);
    await prm;
    expect(objSvc.cargando()).toBe(false);
  });

  it('cargando vuelve a false aunque la petición falle', async () => {
    // El `finally`. Sin él, la sección queda con "Buscando documentos del caso…" para siempre y el
    // usuario no tiene forma de saber que ya terminó.
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await prm;
    expect(objSvc.cargando()).toBe(false);
  });

  it('prefiere el message que manda PM4 en el cuerpo', async () => {
    const prm = objSvc.cargar(77);
    objMock
      .expectOne(STR_URL)
      .flush({ message: 'The request does not exist' }, { status: 404, statusText: 'Not Found' });
    await prm;
    // El genérico del transporte diría solo "Http failure response … 404"; el de PM4 dice qué pasó.
    expect(objSvc.error()).toBe('The request does not exist');
  });

  it('cae al mensaje del transporte cuando el cuerpo no es un objeto con message', async () => {
    // Un 502 de gateway devuelve texto plano. Sin la guarda de tipo, leer `.message` de un string
    // daría undefined y el usuario vería un cartel de error vacío.
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' });
    await prm;
    expect(objSvc.error()).toContain('502');
  });

  it('no lanza: el fallo se resuelve normal', async () => {
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    // La pantalla lee `error()`; una promesa rechazada obligaría a cada llamador a envolver en
    // try/catch para algo que ya está expuesto como estado.
    await expect(prm).resolves.toBeUndefined();
  });

  it('un fallo LIMPIA la lista de una carga anterior exitosa', async () => {
    // ÚNICA divergencia deliberada respecto de React, que no limpiaba. Conservar los archivos viejos
    // junto al cartel de error le diría al usuario dos cosas contradictorias sobre el mismo caso.
    const prmOk = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush([OBJ_ARCHIVO]);
    await prmOk;
    expect(objSvc.files()).toHaveLength(1);

    const prmFalla = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await prmFalla;
    expect(objSvc.files()).toEqual([]);
    expect(objSvc.error()).not.toBeNull();
  });

  it('una carga exitosa borra el error de un intento anterior', async () => {
    // El `setError(null)` al arrancar. Sin él, el cartel de error queda pegado sobre una lista que
    // ya cargó bien, y el usuario desconfía de datos correctos.
    const prmFalla = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await prmFalla;
    expect(objSvc.error()).not.toBeNull();

    const prmOk = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush([OBJ_ARCHIVO]);
    await prmOk;
    expect(objSvc.error()).toBeNull();
    expect(objSvc.files()).toHaveLength(1);
  });

  it('registra el fallo por consola', async () => {
    const spyError = vi.spyOn(console, 'error');
    const prm = objSvc.cargar(77);
    objMock.expectOne(STR_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await prm;
    expect(spyError).toHaveBeenCalled();
  });
});
