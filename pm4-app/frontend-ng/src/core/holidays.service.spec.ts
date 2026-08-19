import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addBusinessDays, diasHabilesRestantes, isBusinessDay } from './business-days';
import { CollectionService } from './collection.service';
import { GLOBAL_COLLECTIONS } from './collections';
import { HolidaysService } from './holidays.service';

/**
 * Specs de `HolidaysService`, el port de `useHolidaySet()` de React.
 *
 * ── Sin baseline, y esta vez está dicho en el propio test de React ──────────────────────────────
 * `frontend/src/core/businessDays.test.ts:15` lo declara textual: *"esto es puro — no hace falta
 * tocar useHolidaySet() ni la colección 48"*. O sea que los 40+ casos de días hábiles de React
 * cubren la matemática con un set literal y **nunca** ejercitan la carga del set. Cobertura nueva
 * sobre comportamiento portado, igual que `CollectionService` y `RequestFilesService`.
 *
 * ── Qué se asevera acá que no se puede aseverar en `business-days.spec.ts` ──────────────────────
 * La matemática ya está cubierta y recibe el set por parámetro. Lo propio de este archivo es la
 * **juntura**: que el `valueField` de la colección (`data.holyday_date`) produzca exactamente el
 * formato que `isBusinessDay` consulta (`YYYY-MM-DD`). Es una dependencia entre dos archivos que
 * ninguno de los dos puede verificar solo, y su modo de falla es silencioso: desalineados, no se
 * encuentra **ningún** feriado y el cálculo sigue devolviendo un número, solo que equivocado. El
 * último describe cierra ese hueco pasando el set real a los helpers reales.
 *
 * ── Por qué el HTTP se ejercita de verdad en vez de mockear CollectionService ───────────────────
 * Se podría proveer un doble de `CollectionService` con un `options()` fijo, pero entonces el test
 * no probaría lo que este servicio hace de interesante: pedir **la** colección correcta y mapear su
 * `valueField`. Con `HttpTestingController` se asevera sobre la URL real (que sale del registro PM4,
 * nunca de un id hardcodeado — regla 6) y sobre el mapeo real de los records.
 */

/** Un record de `cat-feriados-colombia` como lo devuelve PM4. */
function feriado(in_strFecha: string, in_strNombre: string): Record<string, unknown> {
  return { id: 1, data: { holyday_date: in_strFecha, holyday_name: in_strNombre } };
}

const STR_URL = `/api/collections/${GLOBAL_COLLECTIONS.holidaysColombia.id}/records?per_page=500`;

let objSvc: HolidaysService;
let objMock: HttpTestingController;

beforeEach(() => {
  TestBed.resetTestingModule();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      CollectionService,
      HolidaysService,
    ],
  });
  objSvc = TestBed.inject(HolidaysService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  objMock.verify();
  vi.restoreAllMocks();
});

describe('HolidaysService · la forma expuesta', () => {
  it('arranca con un set vacío y sin cargar', () => {
    // La pantalla lee `feriados()` en el primer render, antes de que la colección llegue. Un
    // undefined ahí rompería `isBusinessDay` con un TypeError en vez de degradar.
    expect(objSvc.feriados().size).toBe(0);
    expect(objSvc.cargando()).toBe(false);
  });

  it('no expone error, igual que el hook de React', () => {
    // Deliberado: si los feriados no llegan, el cálculo sigue andando contándolos como hábiles. Un
    // SLA corrido un día es menos grave que una pantalla que no abre. Ver el encabezado del servicio.
    expect('error' in objSvc).toBe(false);
  });
});

describe('HolidaysService · la carga de la colección', () => {
  it('pide la colección de feriados resuelta por el registro, no un id suelto', async () => {
    // Regla 6: el id sale de `resolveCollectionId('holidaysColombia', 48)`. Este test se pone rojo si
    // alguien hardcodea un 48 en el servicio, porque compara contra el valor del registro.
    const prm = objSvc.cargar();
    const objReq = objMock.expectOne(STR_URL);
    expect(objReq.request.method).toBe('GET');
    objReq.flush({ data: [] });
    await prm;
  });

  it('arma el set con las fechas del valueField', async () => {
    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({
      data: [feriado('2026-01-01', 'Año Nuevo'), feriado('2026-01-12', 'Reyes Magos')],
    });
    await prm;

    expect(objSvc.feriados()).toEqual(new Set(['2026-01-01', '2026-01-12']));
  });

  it('el set NO contiene los nombres, solo las fechas', () => {
    // `labelField` es el nombre del feriado y no tiene que filtrarse al set: `isBusinessDay` compara
    // contra una fecha ISO, así que un 'Año Nuevo' adentro sería basura silenciosa.
    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-01-01', 'Año Nuevo')] });
    return prm.then(() => {
      expect(objSvc.feriados().has('Año Nuevo')).toBe(false);
      expect(objSvc.feriados().has('2026-01-01')).toBe(true);
    });
  });

  it('deduplica: dos records con la misma fecha dan una sola entrada', async () => {
    // Es un Set, no un array. Pasa de verdad: la colección tiene un feriado por año y algunos se
    // cargaron dos veces en PM4 con nombres distintos.
    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({
      data: [feriado('2026-01-01', 'Año Nuevo'), feriado('2026-01-01', 'Primero de Enero')],
    });
    await prm;

    expect(objSvc.feriados().size).toBe(1);
  });

  it('cargando pasa a true durante la petición y vuelve a false al terminar', async () => {
    const prm = objSvc.cargar();
    expect(objSvc.cargando()).toBe(true);
    objMock.expectOne(STR_URL).flush({ data: [] });
    await prm;
    expect(objSvc.cargando()).toBe(false);
  });

  it('un fallo deja el set vacío sin lanzar', async () => {
    // Degradación gradual, heredada de React. La pantalla sigue calculando días hábiles.
    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await expect(prm).resolves.toBeUndefined();
    expect(objSvc.feriados().size).toBe(0);
    expect(objSvc.cargando()).toBe(false);
  });

  it('recargar reemplaza el set, no lo acumula', async () => {
    const prm1 = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-01-01', 'Año Nuevo')] });
    await prm1;

    const prm2 = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-05-01', 'Día del Trabajo')] });
    await prm2;

    expect(objSvc.feriados()).toEqual(new Set(['2026-05-01']));
  });

  it('el set es reactivo: cambia cuando la colección llega', async () => {
    // Es el `useMemo([options])` de React. La pantalla lee `feriados()` en el template sin
    // suscribirse: si no fuera un computed, el primer set vacío quedaría congelado.
    //
    // ⚠ Este test **no distingue** un `computed` de un `signal` escrito a mano dentro de `cargar()`:
    // verificado con mutación, pasa igual con las dos implementaciones, porque las dos actualizan
    // cuando se pasa por `cargar()`. Lo que sí las distingue es el test de abajo. Se mantiene igual
    // porque cubre lo que dice cubrir (que el set no queda congelado en el vacío inicial).
    const setAntes = objSvc.feriados();
    expect(setAntes.size).toBe(0);

    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-01-01', 'Año Nuevo')] });
    await prm;

    expect(objSvc.feriados().size).toBe(1);
  });

  it('el set se DERIVA de la colección, no se copia al pasar por cargar()', async () => {
    // ES EL CASO que prueba que `feriados` es un `computed` sobre `options()` y no un `signal` que
    // `cargar()` escribe. La diferencia se ve recargando la colección **por afuera** de este
    // servicio: `CollectionService` es la misma instancia inyectada, así que la pantalla que ya la
    // tiene en sus `providers` puede llamarle `cargar()` directo (para refrescar el catálogo, o
    // porque otro campo comparte la instancia). Un `signal` copiado en el `cargar()` de
    // HolidaysService se quedaría con el set viejo y el cálculo de SLA seguiría usando feriados que
    // la colección ya no tiene — sin ningún error a la vista.
    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-01-01', 'Año Nuevo')] });
    await prm;
    expect(objSvc.feriados()).toEqual(new Set(['2026-01-01']));

    // Recarga por la colección directamente, sin pasar por HolidaysService.
    const objColeccion = TestBed.inject(CollectionService);
    const prm2 = objColeccion.cargar(GLOBAL_COLLECTIONS.holidaysColombia);
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-05-01', 'Día del Trabajo')] });
    await prm2;

    expect(objSvc.feriados()).toEqual(new Set(['2026-05-01']));
  });
});

describe('HolidaysService · la juntura con business-days', () => {
  it('el formato del set es el que isBusinessDay consulta', async () => {
    // ES EL CASO CENTRAL de este archivo, y el único que cubre la dependencia entre dos módulos que
    // ninguno de los dos puede verificar solo. Si el `valueField` de la colección dejara de ser
    // `YYYY-MM-DD` (o `toIsoDate` cambiara de formato), NO habría error: no se encontraría ningún
    // feriado y el cálculo devolvería un número igual, solo que equivocado.
    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado('2026-01-01', 'Año Nuevo')] });
    await prm;

    // 1-ene-2026 es jueves: hábil por calendario, feriado por colección.
    const dtFeriado = new Date(2026, 0, 1);
    expect(dtFeriado.getDay()).toBe(4); // jueves, no cae en fin de semana
    expect(isBusinessDay(dtFeriado, objSvc.feriados())).toBe(false);

    // Y el día siguiente sí es hábil, para que el test no pase por decir "no" a todo.
    expect(isBusinessDay(new Date(2026, 0, 2), objSvc.feriados())).toBe(true);
  });

  it('un set vacío hace que el feriado cuente como hábil', () => {
    // La contracara del anterior: documenta qué pasa si la colección falla, y de paso prueba que el
    // test de arriba mide el efecto del set y no un comportamiento fijo del helper.
    expect(isBusinessDay(new Date(2026, 0, 1), new Set())).toBe(true);
  });

  it('el set alimenta el cálculo de SLA, corriendo el vencimiento un día de calendario', async () => {
    // Cierra el circuito con el helper que las pantallas realmente llaman (SCR-0051 y SCR-013), y
    // asevera la propiedad que **solo** se ve pasando el set real por los dos usos que hace de él.
    //
    // ⚠ Dos cosas que se corrigieron midiendo, porque las dos intuiciones eran falsas:
    //
    // 1. El inicio va **relativo a hoy**, no con una fecha literal: `diasHabilesRestantes` cuenta
    //    desde `new Date()`, así que un inicio de dic-2025 daba -159/-158 — un caso ya vencido, no
    //    el escenario que este test dice medir.
    // 2. Con el feriado adentro **no quedan más días hábiles restantes**: quedan los MISMOS. El
    //    feriado entra dos veces y los efectos se cancelan — `addBusinessDays` corre el vencimiento
    //    un día de calendario más allá, y `countBusinessDaysBetween` no cuenta ese día justamente
    //    porque es feriado. Lo que se mueve es la FECHA de vencimiento, no el conteo.
    //
    // Por eso se aseveran las dos mitades por separado: el conteo igual (arriba) sería un test que
    // pasa con un set vacío, y la fecha corrida (abajo) es lo que prueba que el set llegó y se usó.
    const dtHoy = new Date();
    const dtInicio = new Date(dtHoy.getFullYear(), dtHoy.getMonth(), dtHoy.getDate());

    // El feriado se planta en el primer día hábil después del inicio, para que caiga DENTRO de la
    // ventana del SLA. Plantado afuera, el set no cambiaría nada y el test no probaría nada.
    const dtFeriado = new Date(dtInicio);
    do {
      dtFeriado.setDate(dtFeriado.getDate() + 1);
    } while (!isBusinessDay(dtFeriado, new Set()));
    const strFeriado = `${dtFeriado.getFullYear()}-${String(dtFeriado.getMonth() + 1).padStart(2, '0')}-${String(dtFeriado.getDate()).padStart(2, '0')}`;

    const prm = objSvc.cargar();
    objMock.expectOne(STR_URL).flush({ data: [feriado(strFeriado, 'Feriado de prueba')] });
    await prm;

    // El feriado que llegó por HTTP es el que el helper efectivamente saltea.
    expect(objSvc.feriados().has(strFeriado)).toBe(true);
    expect(isBusinessDay(dtFeriado, objSvc.feriados())).toBe(false);

    // Mitad 1 · la fecha de vencimiento se corre un día de calendario. ES la aserción que se pone
    // roja si el set no llega (o llega con otro formato): sin feriado las dos fechas coinciden.
    const dtVenceConFeriado = addBusinessDays(dtInicio, 5, objSvc.feriados());
    const dtVenceSinFeriado = addBusinessDays(dtInicio, 5, new Set());
    expect(dtVenceConFeriado.getTime()).toBeGreaterThan(dtVenceSinFeriado.getTime());

    // Mitad 2 · los días hábiles restantes son los MISMOS, por la cancelación explicada arriba. Es
    // lo que la pantalla pinta, y documenta que un feriado nuevo en la colección NO mueve el badge
    // de SLA de un caso: mueve la fecha límite.
    const intConFeriado = diasHabilesRestantes(dtInicio, 5, objSvc.feriados());
    const intSinFeriado = diasHabilesRestantes(dtInicio, 5, new Set());
    expect(intConFeriado).toBe(intSinFeriado);
    expect(intSinFeriado).toBeGreaterThan(0); // el caso está abierto, no vencido
  });
});
