import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AttachmentsService, claveIdAdjunto, idsAdjuntosAPayload } from './attachments.service';
import { FileRegistryService } from './file-registry.service';

/**
 * Specs de `AttachmentsService` y sus dos helpers puros, port de `core/attachments.ts`.
 *
 * ── Sin baseline: `attachments.ts` NO tenía archivo de test en React ────────────────────────────
 * Medido, no supuesto: no existe `frontend/src/core/attachments.test.ts`. La subida se ejercitaba
 * solo de refilón desde los specs de las 4 pantallas que la llaman (SCR-000, SCR-0051, SCR-0052 y
 * OS-SCR-003), y en todas ellas mockeada. O sea que **el bucle de subida nunca corrió en un test**:
 * ni el orden secuencial, ni el descarte de respuestas sin `fileUploadId`, ni qué pasa cuando un
 * POST falla en el medio. Cobertura nueva sobre comportamiento portado, igual que `HolidaysService`.
 *
 * ── Por qué se ejercita el HTTP de verdad ───────────────────────────────────────────────────────
 * Lo interesante de este servicio **es** la forma de las peticiones: que el `data_name` viaje en la
 * query string (no en el FormData), que el body sea un FormData con la clave `file`, y que los POST
 * salgan de a uno. Con un doble del cliente no quedaría nada que probar. `HttpTestingController`
 * permite además aseverar el **orden**, que es la decisión no obvia del servicio.
 */

/** Un `File` real; jsdom lo soporta y el FormData necesita una instancia de verdad. */
function archivo(in_strNombre: string): File {
  return new File(['contenido'], in_strNombre, { type: 'application/pdf' });
}

const INT_REQUEST = 4321;

/** La URL que arma el servicio para un docKey. Se repite en casi todos los casos. */
function url(in_strDocKey: string): string {
  return `/api/requests/${INT_REQUEST}/files?data_name=${in_strDocKey}`;
}

let objSvc: AttachmentsService;
let objMock: HttpTestingController;

beforeEach(() => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  objSvc = TestBed.inject(AttachmentsService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  objMock.verify();
});

describe('claveIdAdjunto', () => {
  it('agrega el sufijo _id al docKey', () => {
    // El sufijo es contrato con PM4: el proceso lee `<campo>_id` para resolver el adjunto.
    expect(claveIdAdjunto('qd_docCedula')).toBe('qd_docCedula_id');
  });

  it('no interpreta el docKey: lo concatena tal cual', () => {
    // Documenta que no hay normalización. Si el docKey ya terminara en `_id`, se duplicaría — y es
    // el comportamiento correcto, porque el nombre del campo lo define el proceso PM4, no este
    // helper (regla 1: los `qd_*` son contrato y no se reescriben).
    expect(claveIdAdjunto('qd_docRaro_id')).toBe('qd_docRaro_id_id');
  });
});

describe('idsAdjuntosAPayload', () => {
  it('convierte el mapa de ids al payload plano con sufijo', () => {
    expect(idsAdjuntosAPayload({ qd_docCedula: 91, qd_docContrato: 92 })).toEqual({
      qd_docCedula_id: 91,
      qd_docContrato_id: 92,
    });
  });

  it('un mapa vacío da un payload vacío, no undefined', () => {
    // Importa porque la pantalla hace `{ ...idsAdjuntosAPayload(ids), ...resto }` sin condicional:
    // un undefined ahí rompería el spread.
    expect(idsAdjuntosAPayload({})).toEqual({});
  });

  it('usa claveIdAdjunto, así que el sufijo no está duplicado en dos lugares', () => {
    // Si alguien cambiara el sufijo en un solo sitio, este test lo detecta.
    const strClave = claveIdAdjunto('qd_docX');
    expect(idsAdjuntosAPayload({ qd_docX: 1 })).toEqual({ [strClave]: 1 });
  });
});

describe('AttachmentsService · la forma de la petición', () => {
  it('manda el docKey como data_name en la query string, no en el body', async () => {
    // ES el contrato con PM4: `?data_name=` es cómo el binario se asocia al campo del caso. Si
    // viajara dentro del FormData, PM4 subiría el archivo sin asociarlo a nada — y responde 200
    // igual, así que el fallo sería invisible.
    const prm = objSvc.subir(INT_REQUEST, [['qd_docCedula', archivo('cedula.pdf')]]);

    const objReq = objMock.expectOne(url('qd_docCedula'));
    expect(objReq.request.method).toBe('POST');
    expect(objReq.request.urlWithParams).toContain('data_name=qd_docCedula');
    objReq.flush({ fileUploadId: 77 });

    await prm;
  });

  it('el body es un FormData con el binario bajo la clave `file`', async () => {
    // `file` es el nombre que espera el multer del BFF (`.single('file')`). Con otra clave, el
    // backend recibe la petición pero `req.file` queda undefined.
    const objArchivo = archivo('contrato.pdf');
    const prm = objSvc.subir(INT_REQUEST, [['qd_docContrato', objArchivo]]);

    const objReq = objMock.expectOne(url('qd_docContrato'));
    const objBody = objReq.request.body as FormData;
    expect(objBody).toBeInstanceOf(FormData);
    expect(objBody.get('file')).toBe(objArchivo);
    objReq.flush({ fileUploadId: 78 });

    await prm;
  });

  it('no fija Content-Type a mano', async () => {
    // Deliberado: un multipart necesita un boundary generado, y ponerlo a mano lo rompe. Angular
    // deja que el navegador lo arme cuando el body es FormData; escribir el header lo impediría.
    const prm = objSvc.subir(INT_REQUEST, [['qd_docA', archivo('a.pdf')]]);

    const objReq = objMock.expectOne(url('qd_docA'));
    expect(objReq.request.headers.get('Content-Type')).toBeNull();
    objReq.flush({ fileUploadId: 1 });

    await prm;
  });

  it('devuelve el mapa docKey → fileUploadId', async () => {
    const prm = objSvc.subir(INT_REQUEST, [['qd_docCedula', archivo('cedula.pdf')]]);
    objMock.expectOne(url('qd_docCedula')).flush({ fileUploadId: 555 });

    await expect(prm).resolves.toEqual({ qd_docCedula: 555 });
  });

  it('un registro vacío no hace ninguna petición', async () => {
    // La pantalla llama `subir()` solo si `intCantidad > 0`, pero el servicio no debe depender de
    // que el consumidor se acuerde: un POST con el registro vacío sería una petición inútil.
    await expect(objSvc.subir(INT_REQUEST, [])).resolves.toEqual({});
    objMock.expectNone(url('qd_docCedula'));
  });
});

describe('AttachmentsService · la subida es secuencial y en orden', () => {
  it('espera cada POST antes de mandar el siguiente', async () => {
    // ES EL CASO CENTRAL del archivo, y el que un `Promise.all` pondría en rojo. Se asevera
    // observando que la segunda petición **no existe todavía** hasta que la primera se responde:
    // con subida paralela, las tres estarían en vuelo desde el arranque.
    const prm = objSvc.subir(INT_REQUEST, [
      ['qd_docA', archivo('a.pdf')],
      ['qd_docB', archivo('b.pdf')],
    ]);

    // Solo la primera está en vuelo.
    objMock.expectNone(url('qd_docB'));
    const objReq1 = objMock.expectOne(url('qd_docA'));
    objReq1.flush({ fileUploadId: 1 });

    // Recién ahora sale la segunda. El await intermedio deja correr la microtask del for.
    await Promise.resolve();
    const objReq2 = objMock.expectOne(url('qd_docB'));
    objReq2.flush({ fileUploadId: 2 });

    await expect(prm).resolves.toEqual({ qd_docA: 1, qd_docB: 2 });
  });

  it('respeta el orden de inserción del registro', async () => {
    // El orden importa porque es el que el usuario ve en la lista de adjuntos del caso. Un `Map`
    // itera por orden de inserción, así que el contrato se sostiene si el servicio no reordena.
    //
    // ⚠ Este test **no guarda el secuenciamiento**: verificado con mutación, queda verde con un
    // `Promise.all`. Con subida paralela las tres peticiones existen desde el arranque, así que el
    // bucle de abajo las encuentra todas y mide el orden en que **él** las consume, no el orden en
    // que salieron. El que sí guarda el secuenciamiento es el test de arriba. Este se mantiene
    // porque cubre otra cosa: que el servicio no reordene el registro (alfabéticamente, p.ej.).
    const objMap = new Map<string, File>();
    objMap.set('qd_docTercero', archivo('c.pdf'));
    objMap.set('qd_docPrimero', archivo('a.pdf'));
    objMap.set('qd_docSegundo', archivo('b.pdf'));

    const prm = objSvc.subir(INT_REQUEST, objMap);
    const lstOrden: string[] = [];

    for (const strClave of ['qd_docTercero', 'qd_docPrimero', 'qd_docSegundo']) {
      const objReq = objMock.expectOne(url(strClave));
      lstOrden.push(strClave);
      objReq.flush({ fileUploadId: lstOrden.length });
      await Promise.resolve();
    }

    await prm;
    // El orden de subida es el de inserción, no el alfabético.
    expect(lstOrden).toEqual(['qd_docTercero', 'qd_docPrimero', 'qd_docSegundo']);
  });

  it('sube el mapArchivos de FileRegistryService tal como llega', async () => {
    // Es el consumidor real: la pantalla pasa `objRegistro.mapArchivos` directo. Este test fija que
    // el `Iterable<[string, File]>` de la firma acepta ese Map sin conversión — si la firma se
    // cambiara a un array de tuplas, la pantalla dejaría de compilar y esto lo muestra acá.
    const objRegistro = TestBed.runInInjectionContext(() => new FileRegistryService());
    objRegistro.registrar('qd_docCedula', archivo('cedula.pdf'));
    objRegistro.registrar('qd_docContrato', archivo('contrato.pdf'));

    const prm = objSvc.subir(INT_REQUEST, objRegistro.mapArchivos);

    objMock.expectOne(url('qd_docCedula')).flush({ fileUploadId: 10 });
    await Promise.resolve();
    objMock.expectOne(url('qd_docContrato')).flush({ fileUploadId: 11 });

    await expect(prm).resolves.toEqual({ qd_docCedula: 10, qd_docContrato: 11 });
  });
});

describe('AttachmentsService · respuestas que no traen fileUploadId', () => {
  // ⚠ LEER ANTES DE TOCAR LOS TESTS DE ESTE BLOQUE. `toEqual({})` **no alcanza** para aseverar el
  // descarte, y se descubrió con mutación: al quitar el `typeof intId === 'number'` del servicio,
  // `dicIds[strDocKey]` queda en `undefined` y Vitest trata una clave con valor `undefined` como
  // **ausente**, así que `toEqual({})` pasa igual. Tres de los cuatro tests de acá quedaron verdes
  // con el guard roto (el del string sobrevivió solo porque `'77'` sí es un valor distinguible).
  //
  // Por eso cada caso lleva además `expect(Object.keys(...))` o `not.toHaveProperty`: la clave no
  // debe **existir**, no basta con que no tenga valor. La diferencia importa de verdad, porque el
  // resultado va a `idsAdjuntosAPayload` y de ahí al `data` del PUT: una clave `qd_docA_id: undefined`
  // se serializa y PM4 recibiría un adjunto declarado sin id.

  it('descarta el docKey si la respuesta no trae fileUploadId', async () => {
    // Semántica portada textual de React (`if (typeof intId === 'number')`). El archivo se subió
    // (PM4 respondió 200) pero sin id no se puede referenciar, así que no entra al payload.
    const prm = objSvc.subir(INT_REQUEST, [['qd_docA', archivo('a.pdf')]]);
    objMock.expectOne(url('qd_docA')).flush({ message: 'The file was uploaded.' });

    const dicIds = await prm;
    expect(dicIds).toEqual({});
    // La clave no existe; ver el ⚠ del encabezado del bloque.
    expect(Object.keys(dicIds)).toEqual([]);
  });

  it('descarta un fileUploadId que no es número', async () => {
    // PM4 devuelve el id como número; un string sería un cambio de contrato silencioso. Sin el
    // `typeof`, un `"77"` entraría al payload y el proceso PM4 recibiría el tipo equivocado.
    const prm = objSvc.subir(INT_REQUEST, [['qd_docA', archivo('a.pdf')]]);
    objMock.expectOne(url('qd_docA')).flush({ fileUploadId: '77' });

    const dicIds = await prm;
    expect(dicIds).toEqual({});
    expect(dicIds).not.toHaveProperty('qd_docA');
  });

  it('un descarte NO corta el bucle: los demás archivos se suben igual', async () => {
    // La otra mitad del contrato. Es la decisión de producto discutible que el encabezado del
    // servicio documenta: la tarea se completa con los adjuntos que sí subieron, sin avisar.
    const prm = objSvc.subir(INT_REQUEST, [
      ['qd_docA', archivo('a.pdf')],
      ['qd_docB', archivo('b.pdf')],
    ]);

    objMock.expectOne(url('qd_docA')).flush({ message: 'sin id' });
    await Promise.resolve();
    objMock.expectOne(url('qd_docB')).flush({ fileUploadId: 2 });

    const dicIds = await prm;
    expect(dicIds).toEqual({ qd_docB: 2 });
    // El descartado no aparece ni como clave vacía; ver el ⚠ del encabezado del bloque.
    expect(Object.keys(dicIds)).toEqual(['qd_docB']);
  });

  it('una respuesta null no lanza', async () => {
    // PM4 puede devolver 200 con cuerpo vacío. Sin el `?.`, esto sería un TypeError que rompe el
    // submit entero de la pantalla en vez de saltear un adjunto.
    const prm = objSvc.subir(INT_REQUEST, [['qd_docA', archivo('a.pdf')]]);
    objMock.expectOne(url('qd_docA')).flush(null);

    const dicIds = await prm;
    expect(dicIds).toEqual({});
    expect(dicIds).not.toHaveProperty('qd_docA');
  });
});

describe('AttachmentsService · un POST que falla SÍ propaga', () => {
  it('lanza si PM4 responde con error HTTP', async () => {
    // Diferencia deliberada con el caso de arriba, y la distinción importa: "PM4 respondió raro"
    // (sin id) se saltea, pero "PM4 no respondió" corta. Si esto se tragara el error, la pantalla
    // completaría la tarea creyendo que subió todo.
    const prm = objSvc.subir(INT_REQUEST, [['qd_docA', archivo('a.pdf')]]);
    objMock.expectOne(url('qd_docA')).flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(prm).rejects.toBeTruthy();
  });

  it('un fallo en el medio no intenta los archivos siguientes', async () => {
    // Consecuencia de que la excepción suba: el bucle se corta. Los anteriores ya están en PM4 (no
    // hay rollback) y los posteriores no se intentan — es el estado parcial que la pantalla tiene
    // que asumir, y por eso queda aseverado en vez de descubrirse en producción.
    const prm = objSvc.subir(INT_REQUEST, [
      ['qd_docA', archivo('a.pdf')],
      ['qd_docB', archivo('b.pdf')],
    ]);

    objMock.expectOne(url('qd_docA')).flush('boom', { status: 413, statusText: 'Payload Too Large' });

    await expect(prm).rejects.toBeTruthy();
    // El segundo nunca salió.
    objMock.expectNone(url('qd_docB'));
  });
});
