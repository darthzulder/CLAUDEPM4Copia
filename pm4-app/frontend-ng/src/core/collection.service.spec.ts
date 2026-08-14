import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollectionService } from './collection.service';
import type { CollectionDef } from './collection.types';

/**
 * Specs de `CollectionService`, el port del hook `useCollection()` de React.
 *
 * ── Este servicio NO tiene baseline de tests, y hay que decirlo ─────────────────────────────────
 * `core/useCollection.test.ts` de React tiene **26 casos y ninguno toca el hook**: cubre solo los 8
 * helpers puros (`resolvePath`, `resolvePmql`, `descOf`, `toUiValue`/`codeFromUiValue`/
 * `labelFromUiValue`, `toUiOptions`, `uiValueFromCode`). Esos 26 ya se portaron 1:1 en la Fase 3a
 * (`collection-helpers.spec.ts`, **26 casos**, paridad medida corriendo las dos suites).
 *
 * O sea que **la parte HTTP del hook —el gating por `dependsOn`, el `per_page=500`, el PMQL, el
 * filtrado de opciones vacías, el manejo del fallo— nunca estuvo cubierta en React.** Este archivo no
 * es un port de tests: es cobertura nueva sobre comportamiento portado. Vale registrarlo porque el
 * gate de la Fase 3 pide paridad 1:1 archivo por archivo, y acá la comparación honesta es 26↔26 en
 * los helpers **más** este archivo entero como ganancia neta.
 *
 * ── Qué se asevera y por qué es aseverable acá ──────────────────────────────────────────────────
 * `HttpTestingController` permite aseverar sobre la **petición real** (método, URL, query params), que
 * es donde viven los tres contratos que importan: que `per_page` sea 500, que el PMQL resuelto viaje
 * en `pmql`, y —el más valioso— que cuando el gating corta **no salga ninguna petición**. Ese último
 * es un `expectNone`, y con un mock de módulo estilo React habría que confiar en un `not.toHaveBeenCalled`
 * sobre el espía; acá `objMock.verify()` en el `afterEach` lo respalda además desde el otro lado.
 */

const OBJ_DEF: CollectionDef = { id: 42, valueField: 'data.codigo', labelField: 'data.nombre' };

/** Records con la forma real de PM4: el payload útil vive bajo `data`. */
const CLL_RECORDS = [
  { id: 1, data: { codigo: '05', nombre: 'Antioquia' } },
  { id: 2, data: { codigo: '11', nombre: 'Bogotá' } },
];

let objSvc: CollectionService;
let objMock: HttpTestingController;

function armar(): void {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), CollectionService],
  });
  objSvc = TestBed.inject(CollectionService);
  objMock = TestBed.inject(HttpTestingController);
}

beforeEach(() => {
  TestBed.resetTestingModule();
  // Los `console.log`/`console.error` del servicio son diagnóstico portado a propósito (imprimen el
  // PMQL resuelto, que es lo primero que se mira cuando un select sale vacío). Se silencian acá para
  // no ensuciar la salida de la suite, no porque estorben en producción.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  armar();
});

afterEach(() => {
  objMock.verify();
  vi.restoreAllMocks();
});

/** Resuelve la petición pendiente de la colección con los records dados. */
function responder(in_cllRecords: unknown[], in_intId = OBJ_DEF.id): void {
  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/collections/${in_intId}/records`)
    .flush({ data: in_cllRecords });
}

describe('CollectionService · la forma expuesta', () => {
  it('arranca con las cuatro piezas vacías y cargando en false', () => {
    // `cargando` arranca en false y no en true (a diferencia de TaskService) porque una colección
    // con `dependsOn` puede no cargarse nunca: un true inicial dejaría un spinner eterno.
    expect(objSvc.options()).toEqual([]);
    expect(objSvc.rawMap()).toEqual({});
    expect(objSvc.records()).toEqual([]);
    expect(objSvc.cargando()).toBe(false);
  });

  it('expone exactamente cuatro piezas de estado, y ninguna se llama error', () => {
    // El gate de la Fase 3 pide la forma exacta `{options, cargando, rawMap, records}` **sin error**.
    // Que no haya `error` es contrato, no omisión: un fallo de catálogo no es un error de pantalla.
    // Ver el bloque de encabezado del servicio.
    const lstPublicas = ['options', 'cargando', 'rawMap', 'records'] as const;
    for (const strPieza of lstPublicas) {
      expect(typeof objSvc[strPieza]).toBe('function');
    }
    expect('error' in objSvc).toBe(false);
  });
});

describe('CollectionService · la petición que sale', () => {
  it('pide per_page=500', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    const objReq = objMock.expectOne((in_objReq) => in_objReq.url === '/api/collections/42/records');
    expect(objReq.request.method).toBe('GET');
    expect(objReq.request.params.get('per_page')).toBe('500');
    objReq.flush({ data: [] });
    await prm;
  });

  it('no manda pmql cuando la definición no tiene template', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    const objReq = objMock.expectOne((in_objReq) => in_objReq.url === '/api/collections/42/records');
    expect(objReq.request.params.has('pmql')).toBe(false);
    objReq.flush({ data: [] });
    await prm;
  });

  it('resuelve el pmqlTemplate con los valores del form y lo manda', async () => {
    const objDef: CollectionDef = {
      ...OBJ_DEF,
      pmqlTemplate: 'data.depto = "{{qd_strDepartment}}"',
    };
    const prm = objSvc.cargar(objDef, { qd_strDepartment: '05' });
    const objReq = objMock.expectOne((in_objReq) => in_objReq.url === '/api/collections/42/records');
    expect(objReq.request.params.get('pmql')).toBe('data.depto = "05"');
    objReq.flush({ data: [] });
    await prm;
  });

  it('sin valores del form NO aplica el pmqlTemplate', async () => {
    // Mismo `if (pmqlTemplate && watchValues)` que React. Mandar el template crudo haría que PM4
    // filtrara por el literal `{{qd_strDepartment}}` y devolviera 0 registros en silencio.
    const objDef: CollectionDef = {
      ...OBJ_DEF,
      pmqlTemplate: 'data.depto = "{{qd_strDepartment}}"',
    };
    const prm = objSvc.cargar(objDef);
    const objReq = objMock.expectOne((in_objReq) => in_objReq.url === '/api/collections/42/records');
    expect(objReq.request.params.has('pmql')).toBe(false);
    objReq.flush({ data: [] });
    await prm;
  });

  it('usa el id de la definición en la URL', async () => {
    const prm = objSvc.cargar({ ...OBJ_DEF, id: 777 });
    objMock.expectOne('/api/collections/777/records?per_page=500').flush({ data: [] });
    await prm;
  });
});

describe('CollectionService · el gating por dependsOn', () => {
  const OBJ_DEF_DEP: CollectionDef = { ...OBJ_DEF, dependsOn: 'qd_strDepartment' };

  it('NO pide nada cuando el campo del que depende está vacío', async () => {
    await objSvc.cargar(OBJ_DEF_DEP, { qd_strDepartment: '' });
    // Es la mitad del contrato de la cascada Departamento → Municipio: sin Departamento, pedir
    // municipios traería el catálogo del país entero.
    objMock.expectNone(() => true);
  });

  it('NO pide nada cuando no llegan valores del form', async () => {
    await objSvc.cargar(OBJ_DEF_DEP);
    objMock.expectNone(() => true);
  });

  it('limpia las opciones ya cargadas cuando la dependencia se vacía', async () => {
    // La otra mitad del contrato: si el usuario cambia el Departamento a vacío, los municipios del
    // anterior tienen que desaparecer, no quedar seleccionables con datos de otro depto.
    const prm = objSvc.cargar(OBJ_DEF_DEP, { qd_strDepartment: '05' });
    responder(CLL_RECORDS);
    await prm;
    expect(objSvc.options()).toHaveLength(2);

    await objSvc.cargar(OBJ_DEF_DEP, { qd_strDepartment: '' });
    expect(objSvc.options()).toEqual([]);
    expect(objSvc.rawMap()).toEqual({});
    expect(objSvc.records()).toEqual([]);
  });

  it('SÍ pide cuando la dependencia tiene valor', async () => {
    const prm = objSvc.cargar(OBJ_DEF_DEP, { qd_strDepartment: '05' });
    responder(CLL_RECORDS);
    await prm;
    expect(objSvc.options()).toHaveLength(2);
  });

  it('una definición null no pide nada y NO limpia lo ya cargado', async () => {
    // El hook de React salía con `if (!def) return` **sin** limpiar, y se preserva: hay pantallas que
    // pasan null mientras resuelven qué colección corresponde, y limpiar ahí borraría opciones
    // válidas ya cargadas.
    const prm = objSvc.cargar(OBJ_DEF);
    responder(CLL_RECORDS);
    await prm;
    expect(objSvc.options()).toHaveLength(2);

    await objSvc.cargar(null);
    objMock.expectNone(() => true);
    expect(objSvc.options()).toHaveLength(2);
  });
});

describe('CollectionService · el mapeo de la respuesta', () => {
  it('mapea cada record a su par value/label por dotted path', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    responder(CLL_RECORDS);
    await prm;
    expect(objSvc.options()).toEqual([
      { value: '05', label: 'Antioquia' },
      { value: '11', label: 'Bogotá' },
    ]);
  });

  it('indexa el record completo por su value en rawMap', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    responder(CLL_RECORDS);
    await prm;
    // El record entero, no solo value/label: es lo que permite leer otra columna del registro
    // elegido (p. ej. el email del área responsable).
    expect(objSvc.rawMap()['05']).toEqual({ id: 1, data: { codigo: '05', nombre: 'Antioquia' } });
  });

  it('deja los records crudos tal como llegaron', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    responder(CLL_RECORDS);
    await prm;
    expect(objSvc.records()).toEqual(CLL_RECORDS);
  });

  it('descarta las opciones cuyo value resuelve a vacío', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    responder([
      { id: 1, data: { codigo: '05', nombre: 'Antioquia' } },
      { id: 2, data: { nombre: 'Sin código' } },
    ]);
    await prm;
    // Un value vacío haría que el select guardara '' en el form, indistinguible de "sin elegir".
    expect(objSvc.options()).toEqual([{ value: '05', label: 'Antioquia' }]);
  });

  it('descarta las opciones cuyo label resuelve a vacío', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    responder([
      { id: 1, data: { codigo: '05', nombre: 'Antioquia' } },
      { id: 2, data: { codigo: '11' } },
    ]);
    await prm;
    // Un label vacío daría una fila clickeable en blanco en el desplegable.
    expect(objSvc.options()).toEqual([{ value: '05', label: 'Antioquia' }]);
  });

  it('el record descartado NO entra al rawMap pero SÍ sigue en records', async () => {
    // La asimetría es el contrato: `records` es crudo por definición (lo consume la cascada por
    // varias columnas de SCR-000), mientras que `rawMap` necesita una clave con la que indexar.
    const cllConVacio = [
      { id: 1, data: { codigo: '05', nombre: 'Antioquia' } },
      { id: 2, data: { nombre: 'Sin código' } },
    ];
    const prm = objSvc.cargar(OBJ_DEF);
    responder(cllConVacio);
    await prm;
    expect(Object.keys(objSvc.rawMap())).toEqual(['05']);
    expect(objSvc.records()).toHaveLength(2);
  });

  it('con código duplicado el rawMap conserva el ÚLTIMO record, y options conserva los dos', async () => {
    // Este es el defecto que motiva todo el mecanismo de `toUiOptions`/`uiValueFromCode`: la
    // colección 16 "Producto SFC" repite el código 104 en dos registros distintos. `Object.fromEntries`
    // deja el último, así que `rawMap['104']` NO puede desambiguar. Se fija acá para que quede
    // explícito por qué las pantallas con catálogos duplicados usan los helpers de UI value en vez
    // de leer el rawMap.
    const prm = objSvc.cargar(OBJ_DEF);
    responder([
      { id: 1, data: { codigo: '104', nombre: 'Garantía extendida' } },
      { id: 2, data: { codigo: '104', nombre: 'Copropiedades' } },
    ]);
    await prm;
    expect(objSvc.options()).toHaveLength(2);
    expect(Object.keys(objSvc.rawMap())).toEqual(['104']);
    expect(objSvc.rawMap()['104']).toEqual({ id: 2, data: { codigo: '104', nombre: 'Copropiedades' } });
  });

  it('una respuesta sin la clave data deja todo vacío sin lanzar', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    objMock.expectOne('/api/collections/42/records?per_page=500').flush({});
    await prm;
    // PM4 devuelve `{data:[...]}`; el `?? []` cubre una respuesta degradada del gateway.
    expect(objSvc.options()).toEqual([]);
    expect(objSvc.records()).toEqual([]);
  });

  it('convierte a texto un value numérico', async () => {
    const prm = objSvc.cargar({ id: 42, valueField: 'id', labelField: 'data.nombre' });
    responder([{ id: 7, data: { nombre: 'Siete' } }]);
    await prm;
    // Contrato de `resolvePath`: siempre string, porque los value se comparan como texto contra lo
    // que el form guarda.
    expect(objSvc.options()).toEqual([{ value: '7', label: 'Siete' }]);
  });
});

describe('CollectionService · el estado de carga y el fallo', () => {
  it('cargando pasa a true durante la petición y vuelve a false al terminar', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    expect(objSvc.cargando()).toBe(true);
    responder(CLL_RECORDS);
    await prm;
    expect(objSvc.cargando()).toBe(false);
  });

  it('un fallo HTTP deja las cuatro piezas vacías sin lanzar', async () => {
    const prm = objSvc.cargar(OBJ_DEF);
    objMock
      .expectOne('/api/collections/42/records?per_page=500')
      .flush({ message: 'Collection not found' }, { status: 404, statusText: 'Not Found' });
    // No lanza a propósito: un catálogo que no responde deja el select vacío, no rompe la pantalla.
    await expect(prm).resolves.toBeUndefined();
    expect(objSvc.options()).toEqual([]);
    expect(objSvc.rawMap()).toEqual({});
    expect(objSvc.records()).toEqual([]);
    expect(objSvc.cargando()).toBe(false);
  });

  it('un fallo borra las opciones de una carga anterior exitosa', async () => {
    const prmOk = objSvc.cargar(OBJ_DEF);
    responder(CLL_RECORDS);
    await prmOk;
    expect(objSvc.options()).toHaveLength(2);

    const prmFalla = objSvc.cargar(OBJ_DEF);
    objMock
      .expectOne('/api/collections/42/records?per_page=500')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await prmFalla;
    // No dejar opciones viejas de un catálogo que ya no resolvió: seguirían siendo seleccionables.
    expect(objSvc.options()).toEqual([]);
  });

  it('registra el fallo por consola con el id de la colección', async () => {
    const spyError = vi.spyOn(console, 'error');
    const prm = objSvc.cargar(OBJ_DEF);
    objMock
      .expectOne('/api/collections/42/records?per_page=500')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await prm;
    // El diagnóstico es el único canal de este servicio ante un fallo (no hay `error` expuesto), así
    // que aseverar que sale, y que nombra la colección, es aseverar el contrato de arriba.
    expect(spyError).toHaveBeenCalled();
    expect(String(spyError.mock.calls[0]?.[0])).toContain('id=42');
  });
});
