import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogosService } from './catalogos.service';
import { CollectionService } from './collection.service';
import type { CollectionDef } from './collection.types';

/**
 * Specs de `CatalogosService`.
 *
 * ── Lo único que esta clase tiene que probar, y es lo que casi nadie testea ──────────────────────
 * El servicio existe por **un** motivo: dar N instancias distintas de `CollectionService` en una sola
 * pantalla. La vía obvia —repetir el token en el array `providers`— **no funciona**, y no falla
 * ruidosamente: devuelve una sola instancia y el síntoma aparece recién en runtime como "todos los
 * selects muestran las opciones del último catálogo que cargó".
 *
 * Por eso el caso central no es "devuelve un CollectionService" sino **"dos claves distintas dan dos
 * instancias con estado independiente"**, aseverado sobre las `options()` después de cargar cada una
 * con datos distintos. Un test que solo mirara `toBeInstanceOf(CollectionService)` pasaría igual con
 * un singleton compartido, que es exactamente el bug.
 *
 * El caso espejo —misma clave, misma instancia— es igual de necesario: sin él, una implementación que
 * creara un injector nuevo en cada llamada a `de()` pasaría el primer caso y rompería la pantalla de
 * otra forma (un GET por detección de cambios y opciones que se resetean solas).
 */

const OBJ_DEF_A: CollectionDef = { id: 11, valueField: 'data.codigo', labelField: 'data.nombre' };
const OBJ_DEF_B: CollectionDef = { id: 22, valueField: 'data.codigo', labelField: 'data.nombre' };

let objSvc: CatalogosService;
let objMock: HttpTestingController;

beforeEach(() => {
  TestBed.resetTestingModule();
  // El servicio de colecciones loguea el conteo de registros; es diagnóstico deliberado (ver su spec).
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), CatalogosService],
  });
  objSvc = TestBed.inject(CatalogosService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  objMock.verify();
  vi.restoreAllMocks();
});

/** Responde el GET de una colección con un único registro, para distinguir instancias por su label. */
function responder(in_objDef: CollectionDef, in_strNombre: string): void {
  const objReq = objMock.expectOne((in_objR) => in_objR.url.includes(`/collections/${in_objDef.id}/records`));
  objReq.flush({ data: [{ id: 1, data: { codigo: '1', nombre: in_strNombre } }] });
}

describe('CatalogosService', () => {
  it('devuelve un CollectionService funcional para una clave', () => {
    const objCol = objSvc.de('city');

    expect(objCol).toBeInstanceOf(CollectionService);
    // Recién creado: sin opciones y sin nada en vuelo. `cargando` arranca en `false` a propósito
    // (ver el docstring de `CollectionService`), así que un `true` acá sería una regresión real.
    expect(objCol.options()).toEqual([]);
    expect(objCol.cargando()).toBe(false);
  });

  it('la misma clave devuelve la MISMA instancia (caché por pantalla)', () => {
    // Es lo que permite llamar `de()` desde una plantilla sin crear una instancia por render.
    expect(objSvc.de('city')).toBe(objSvc.de('city'));
  });

  it('⚠ dos claves distintas dan instancias con estado INDEPENDIENTE', async () => {
    // El caso que justifica la clase entera: con `providers: [CollectionService, CollectionService]`
    // ambas claves serían el mismo objeto y el segundo `cargar()` le pisaría las opciones al primero.
    const objA = objSvc.de('department');
    const objB = objSvc.de('city');
    expect(objA).not.toBe(objB);

    const prmA = objA.cargar(OBJ_DEF_A);
    const prmB = objB.cargar(OBJ_DEF_B);
    responder(OBJ_DEF_A, 'Antioquia');
    responder(OBJ_DEF_B, 'Medellín');
    await Promise.all([prmA, prmB]);

    expect(objA.options()).toEqual([{ value: '1', label: 'Antioquia' }]);
    expect(objB.options()).toEqual([{ value: '1', label: 'Medellín' }]);
  });

  it('escala a 13 claves con 13 instancias distintas', async () => {
    // SCR-003 pide 13 catálogos en una pantalla. El conteo por `Set` es lo que se pondría rojo si la
    // implementación volviera a resolver por token: un `Set` de 13 referencias al mismo objeto vale 1.
    const cllClaves = Array.from({ length: 13 }, (_, in_intI) => `catalogo-${in_intI}`);
    const setInstancias = new Set(cllClaves.map((in_strK) => objSvc.de(in_strK)));

    expect(setInstancias.size).toBe(13);
  });

  it('`de()` NO dispara ninguna petición — obtener y cargar están separados', () => {
    // Es el contrato que hace seguro llamar `de('city').options()` desde una plantilla, que se evalúa
    // en cada detección de cambios. Si `de()` cargara, serían N GET por frame.
    objSvc.de('city');
    objSvc.de('department');

    objMock.expectNone(() => true);
  });

  it('`cargar()` es el atajo de `de(clave).cargar(def)` y llena ESA instancia', async () => {
    const prm = objSvc.cargar('city', OBJ_DEF_A);
    responder(OBJ_DEF_A, 'Bogotá');
    await prm;

    expect(objSvc.de('city').options()).toEqual([{ value: '1', label: 'Bogotá' }]);
  });

  it('`cargar()` reenvía los valores del form (gating por `dependsOn`)', () => {
    // Sin valor para el campo del que depende, `CollectionService` corta antes del HTTP. Acá lo que se
    // asevera es que el tercer argumento **llega**: si `cargar()` lo perdiera, el gating no se
    // aplicaría y la colección saldría a pedir el catálogo entero del país.
    const objDefDep: CollectionDef = { ...OBJ_DEF_A, dependsOn: 'qd_strDepartment' };

    void objSvc.cargar('city', objDefDep, { qd_strDepartment: '' });

    objMock.expectNone(() => true);
  });
});
