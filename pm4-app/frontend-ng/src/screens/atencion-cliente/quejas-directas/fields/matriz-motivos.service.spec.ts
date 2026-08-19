import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogosService } from '../../../../core/catalogos.service';
import { QD, QD_COLLECTIONS } from './fields';
import { leerColumnaMatriz, MatrizMotivosService, normalizarMatriz } from './matriz-motivos.service';

/**
 * Specs de `MatrizMotivosService` — el port del hook `useMatrizMotivos()` de React.
 *
 * ── Este servicio NO tiene baseline de tests en React, y hay que decirlo ─────────────────────────
 * `useMatrizMotivos.ts` (146 líneas) **no tiene ningún test** en el árbol React: su cascada se
 * ejercitaba solo de rebote, a través del smoke de SCR-000. O sea que este archivo no es un port de
 * casos: es cobertura nueva sobre la única pieza genuinamente net-new de SCR-003.
 *
 * ── Por qué los fixtures traen espacios de más, y no es descuido ─────────────────────────────────
 * Las columnas de texto de `cat_matriz_motivos` vienen con espacios sobrantes de la carga real
 * (`"Hogar "`, `"No aplica "`), y es **el motivo entero** por el que la cascada filtra en cliente en vez
 * de por PMQL. Un fixture prolijo dejaría pasar una implementación que compare sin `trim()`, que es
 * exactamente la regresión que rompería la pantalla contra los datos de producción. Por eso hay filas
 * con espacios y mayúsculas mezcladas a propósito.
 *
 * ── Qué se asevera sobre la reactividad ─────────────────────────────────────────────────────────
 * La cascada cuelga de un `Signal` de valores, no de `form.value` (que **no** es un signal). Los casos
 * mueven ese signal y aseveran que las listas derivadas cambian: sin eso, un `computed()` que leyera
 * `form.get()` directo pasaría el primer nivel y quedaría congelado para siempre.
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Filas de la matriz con la forma real de PM4 (payload bajo `data`).
 *
 * Los espacios sobrantes y el `AUTOS` en mayúsculas son deliberados: ver el encabezado.
 */
const CLL_MATRIZ = [
  // Queja / Autos → dos momentos, uno de ellos "Asistencias" con dos servicios.
  {
    id: 1,
    data: {
      tipoSolicitud: 'Queja', productoZurich: 'AUTOS ', interaccion: 'Asistencias',
      servicioPrestado: 'Grúa ', codigoMotivoSFC: 'M01', motivoSFC: 'Demora en la grúa',
    },
  },
  {
    id: 2,
    data: {
      tipoSolicitud: 'Queja ', productoZurich: 'Autos', interaccion: 'Asistencias ',
      servicioPrestado: 'Cerrajería', codigoMotivoSFC: 'M02', motivoSFC: 'Cerrajería no llegó',
    },
  },
  // Misma interacción y servicio que la fila 1: existe para que la deduplicación tenga algo que hacer.
  {
    id: 3,
    data: {
      tipoSolicitud: 'Queja', productoZurich: 'Autos', interaccion: 'Asistencias',
      servicioPrestado: 'Grúa', codigoMotivoSFC: 'M03', motivoSFC: 'Grúa dañó el vehículo',
    },
  },
  // Interacción distinta, SIN servicio: fuera de Asistencias la columna no aplica.
  {
    id: 4,
    data: {
      tipoSolicitud: 'Queja', productoZurich: 'Autos', interaccion: 'Siniestros',
      servicioPrestado: '', codigoMotivoSFC: 'M04', motivoSFC: 'Demora en la indemnización',
    },
  },
  // Otro producto: no debe aparecer nunca mientras el producto elegido sea Autos.
  {
    id: 5,
    data: {
      tipoSolicitud: 'Queja', productoZurich: 'Hogar ', interaccion: 'Siniestros',
      servicioPrestado: '', codigoMotivoSFC: 'M05', motivoSFC: 'Motivo de Hogar',
    },
  },
  // Mismo producto pero OTRO tipo de solicitud: prueba el segundo criterio del filtro de nivel 1.
  {
    id: 6,
    data: {
      tipoSolicitud: 'Petición', productoZurich: 'Autos', interaccion: 'Ventas',
      servicioPrestado: '', codigoMotivoSFC: 'M06', motivoSFC: 'Motivo de Petición',
    },
  },
  /**
   * Fuera de Asistencias PERO con la columna de servicio cargada — y es la única fila que hace
   * falsable el caso de la rama de `cllRowsForReason`.
   *
   * La fila 4 no alcanza: su `servicioPrestado` está vacío igual que el valor del form, así que
   * `'' === ''` la deja pasar **con o sin** el `return` temprano y las dos ramas dan el mismo
   * resultado. Con esta fila, filtrar por un servicio vacío la descartaría, así que el caso
   * distingue de verdad "no aplica el filtro" de "el filtro casualmente no molesta".
   */
  {
    id: 7,
    data: {
      tipoSolicitud: 'Queja', productoZurich: 'Autos', interaccion: 'Siniestros',
      servicioPrestado: 'Inspección', codigoMotivoSFC: 'M07', motivoSFC: 'Inspección tardía',
    },
  },
];

/** Colección 16: el código 104 se repite, que es lo que obliga a los values de UI. */
const CLL_PRODUCTOS = [
  { id: 1, data: { codigo_producto_sfc: '101', nombre_producto_sfc: 'Autos' } },
  { id: 2, data: { codigo_producto_sfc: '104', nombre_producto_sfc: 'Garantía extendida' } },
  { id: 3, data: { codigo_producto_sfc: '104', nombre_producto_sfc: 'Copropiedades' } },
  { id: 4, data: { codigo_producto_sfc: '200', nombre_producto_sfc: 'Hogar' } },
];

const CLL_TIPOS = [
  { id: 1, data: { codigo: '1', descripcion: 'Queja' } },
  { id: 2, data: { codigo: '2', descripcion: 'Petición' } },
];

/**
 * Host mínimo: `vincular()` llama a `sincronizarDesc()`, que hace `inject(DestroyRef)` y por lo tanto
 * exige un contexto de inyección. Un `TestBed.inject()` suelto no lo da; el constructor de un
 * componente sí, y además le da al `takeUntilDestroyed` un ciclo de vida real que cerrar.
 */
@Component({ template: '', providers: [CatalogosService, MatrizMotivosService] })
class HostPrueba {
  public readonly form = new FormGroup({
    [QD.strRequestType]: new FormControl(''),
    [QD.strSfcProduct]: new FormControl(''),
    [`${QD.strSfcProduct}_desc`]: new FormControl(''),
    [QD.strInteraction]: new FormControl(''),
    [QD.strServiceProvided]: new FormControl(''),
    [QD.strSfcReason]: new FormControl(''),
  });
}

let objSvc: MatrizMotivosService;
/** `undefined` en los casos de helpers puros, que no montan nada — de ahí la guarda del `afterEach`. */
let objMock: HttpTestingController | undefined;
let sigValores: ReturnType<typeof signal<Record<string, unknown>>>;
let objHost: HostPrueba;

/**
 * Monta el host, vincula el servicio y responde los tres GET de catálogo.
 *
 * ⚠ **Es `async` por necesidad, no por prolijidad.** `CollectionService.cargar()` publica sus signals
 * después de un `await firstValueFrom(...)`, así que el `flush()` de `HttpTestingController` **no**
 * deja el estado listo en el mismo tick: encola una microtarea. Sin el `await` de abajo, todos los
 * `computed()` de la cascada se leen antes de que las opciones existan y cada caso ve `[]` — un modo
 * de falla que se lee como "la cascada no filtra" cuando en realidad es "el test se adelantó".
 *
 * `vincular()` **no** devuelve las promesas a propósito (la pantalla no debe esperar los catálogos
 * para pintar), así que no hay nada que encadenar desde afuera: se cede la cola de microtareas.
 */
async function armar(in_dicValoresIniciales: Record<string, unknown> = {}): Promise<void> {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const objFixture = TestBed.createComponent(HostPrueba);
  objHost = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objSvc = objFixture.debugElement.injector.get(MatrizMotivosService);
  sigValores = signal<Record<string, unknown>>(in_dicValoresIniciales);

  // `vincular()` corre dentro de `runInInjectionContext` del componente: es lo que `sincronizarDesc`
  // necesita, y replica cómo la pantalla lo llamará (desde su constructor).
  TestBed.runInInjectionContext(() => {
    objSvc.vincular(objHost.form, sigValores as Signal<Record<string, unknown>>);
  });

  responder(QD_COLLECTIONS.sfcProduct.id, CLL_PRODUCTOS);
  responder(QD_COLLECTIONS.requestType.id, CLL_TIPOS);
  responder(QD_COLLECTIONS.matrixMotivos.id, CLL_MATRIZ);

  // Dos vueltas: la del `await` de `cargar()` y la del `finally` que baja `cargando`.
  await Promise.resolve();
  await Promise.resolve();
}

function responder(in_intId: number, in_cllData: unknown[]): void {
  const objReq = objMock!.expectOne((in_objR) => in_objR.url.includes(`/collections/${in_intId}/records`));
  objReq.flush({ data: in_cllData });
}

/** Mueve el signal de valores, que es la única vía por la que la cascada se recalcula. */
function poner(in_dicParcial: Record<string, unknown>): void {
  sigValores.update((in_dicPrev) => ({ ...in_dicPrev, ...in_dicParcial }));
}

/** Los valores que dejan la cascada en "Queja / Autos", el escenario base de casi todos los casos. */
const DIC_QUEJA_AUTOS = {
  [QD.strRequestType]: '1',
  [QD.strSfcProduct]: '101',
  [`${QD.strSfcProduct}_desc`]: 'Autos',
};

beforeEach(() => {
  TestBed.resetTestingModule();
  objMock = undefined;
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  // Los describes de helpers puros no montan nada, así que no hay controller que verificar.
  objMock?.verify();
  vi.restoreAllMocks();
});

// ── Helpers puros ─────────────────────────────────────────────────────────────────────────────────

describe('normalizarMatriz', () => {
  it('recorta y baja a minúsculas — es lo que hace comparables las columnas de la matriz', () => {
    expect(normalizarMatriz('  AUTOS ')).toBe('autos');
    expect(normalizarMatriz('Autos')).toBe('autos');
  });

  it('nulo, indefinido y número salen como texto (nunca "null"/"undefined")', () => {
    expect(normalizarMatriz(null)).toBe('');
    expect(normalizarMatriz(undefined)).toBe('');
    expect(normalizarMatriz(104)).toBe('104');
  });
});

describe('leerColumnaMatriz', () => {
  it('lee bajo `data` y recorta', () => {
    expect(leerColumnaMatriz({ data: { interaccion: ' Asistencias ' } }, 'interaccion')).toBe('Asistencias');
  });

  it('acepta el registro plano como fallback', () => {
    expect(leerColumnaMatriz({ interaccion: 'Siniestros' }, 'interaccion')).toBe('Siniestros');
  });

  it('una columna ausente da `""`, no `"undefined"`', () => {
    expect(leerColumnaMatriz({ data: {} }, 'noExiste')).toBe('');
  });
});

// ── La cascada ────────────────────────────────────────────────────────────────────────────────────

describe('MatrizMotivosService · antes de vincular', () => {
  it('las listas derivadas salen vacías en vez de lanzar', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const objFixture = TestBed.createComponent(HostPrueba);
    objMock = TestBed.inject(HttpTestingController);
    const objSinVincular = objFixture.debugElement.injector.get(MatrizMotivosService);

    // Es el mismo estado que "la matriz todavía no cargó": la pantalla pinta selects vacíos, no explota.
    expect(objSinVincular.cllInteraction()).toEqual([]);
    expect(objSinVincular.cllReason()).toEqual([]);
    expect(objSinVincular.objSelectedReasonRow()).toBeUndefined();
    // Y sin `vincular()` no sale ninguna petición: la carga la dispara el vínculo, no el constructor.
    objMock.expectNone(() => true);
  });
});

describe('MatrizMotivosService · nivel 1 (tipo de solicitud + producto)', () => {
  it('sin producto elegido no hay interacciones', async () => {
    await armar({ [QD.strRequestType]: '1' });

    // ⚠ Las dos aserciones de arriba son inseparables. Sola, `toEqual([])` se cumple también cuando
    // los catálogos **nunca llegaron** —el modo de falla real de este archivo, ver el docstring de
    // `armar()`—, o sea que pasaría con la cascada entera rota. Aseverar primero que la matriz SÍ
    // cargó es lo que convierte el vacío en "filtró bien" en vez de "no había nada que filtrar".
    expect(objSvc.cllInsurance().length).toBeGreaterThan(0);
    expect(objSvc.cllInteraction()).toEqual([]);
  });

  it('filtra por producto comparando TEXTO normalizado (tolera "AUTOS " con espacio)', async () => {
    await armar(DIC_QUEJA_AUTOS);

    // Las filas 1-4 son de Autos/Queja; la 1 dice "AUTOS " y la 2 "Queja ". Si se comparara sin
    // normalizar, esas dos filas caerían y "Asistencias" desaparecería del select.
    expect(objSvc.cllInteraction().map((in_o) => in_o.value)).toEqual(['Asistencias', 'Siniestros']);
  });

  it('el tipo de solicitud es el SEGUNDO criterio y descarta filas del mismo producto', async () => {
    await armar(DIC_QUEJA_AUTOS);
    // La fila 6 es Autos pero de "Petición": no debe aparecer con tipo = Queja.
    expect(objSvc.cllInteraction().map((in_o) => in_o.value)).not.toContain('Ventas');

    poner({ [QD.strRequestType]: '2' });
    expect(objSvc.cllInteraction().map((in_o) => in_o.value)).toEqual(['Ventas']);
  });

  it('un producto de otra familia no arrastra las filas de Autos', async () => {
    await armar({ ...DIC_QUEJA_AUTOS, [QD.strSfcProduct]: '200', [`${QD.strSfcProduct}_desc`]: 'Hogar' });

    expect(objSvc.cllInteraction().map((in_o) => in_o.value)).toEqual(['Siniestros']);
    expect(objSvc.cllReason()).toEqual([]);
  });
});

describe('MatrizMotivosService · nivel 2 y 3 (interacción → servicio)', () => {
  it('deduplica las interacciones repetidas entre filas', async () => {
    await armar(DIC_QUEJA_AUTOS);

    // Tres filas dicen "Asistencias"; el select tiene que mostrarla UNA vez.
    const cllValores = objSvc.cllInteraction().map((in_o) => in_o.value);
    expect(cllValores.filter((in_s) => in_s === 'Asistencias')).toHaveLength(1);
  });

  it('el servicio se deriva de la interacción elegida y también se deduplica', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Asistencias' });

    // "Grúa " (fila 1) y "Grúa" (fila 3) son el mismo servicio con distinto espaciado — pero el value
    // se guarda recortado, así que colapsan en una sola opción.
    expect(objSvc.cllService()).toEqual([
      { value: 'Grúa', label: 'Grúa' },
      { value: 'Cerrajería', label: 'Cerrajería' },
    ]);
  });

  it('el servicio guarda TEXTO, no código (value === label)', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Asistencias' });

    // Es lo que obliga a la pantalla a pintar el valor crudo en la columna de descripción de ese campo.
    for (const objOpt of objSvc.cllService()) expect(objOpt.value).toBe(objOpt.label);
    expect(objSvc.cllService().length).toBeGreaterThan(0);
  });

  it('una interacción sin servicios da lista vacía', async () => {
    // Se usa "Ventas" (fila 6, tipo Petición) y no "Siniestros": Siniestros incluye la fila 7, que sí
    // trae servicio, así que su lista no es vacía. La única interacción cuyas filas TODAS tienen la
    // columna vacía es Ventas, y es la que ejercita el descarte de vacíos de `opcionesUnicas`.
    await armar({ ...DIC_QUEJA_AUTOS, [QD.strRequestType]: '2' });
    poner({ [QD.strInteraction]: 'Ventas' });

    // La aserción positiva de al lado impide que este vacío se cumpla por "no cargó nada".
    expect(objSvc.cllInteraction().map((in_o) => in_o.value)).toEqual(['Ventas']);
    expect(objSvc.cllService()).toEqual([]);
  });

  it('`blnIsAsistencias` se deriva de la interacción, sin distinguir mayúsculas', async () => {
    await armar(DIC_QUEJA_AUTOS);
    expect(objSvc.blnIsAsistencias()).toBe(false);

    poner({ [QD.strInteraction]: 'ASISTENCIAS' });
    expect(objSvc.blnIsAsistencias()).toBe(true);
  });

  it('`blnIsAutos` se deriva de la ETIQUETA del producto, no de su código', async () => {
    await armar(DIC_QUEJA_AUTOS);
    expect(objSvc.blnIsAutos()).toBe(true);

    poner({ [QD.strSfcProduct]: '200', [`${QD.strSfcProduct}_desc`]: 'Hogar' });
    expect(objSvc.blnIsAutos()).toBe(false);
  });
});

describe('MatrizMotivosService · nivel 4 (motivo)', () => {
  it('dentro de Asistencias el servicio ESTRECHA los motivos', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Asistencias', [QD.strServiceProvided]: 'Grúa' });

    // Filas 1 y 3 son de Grúa; la 2 es de Cerrajería y no debe aparecer.
    expect(objSvc.cllReason().map((in_o) => in_o.value)).toEqual(['M01', 'M03']);
  });

  it('⚠ FUERA de Asistencias el servicio NO filtra — si filtrara, no habría motivos nunca', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Siniestros' });

    // Las filas 4 y 7 son de Siniestros; la 7 trae "Inspección" en la columna de servicio y el form
    // no tiene servicio elegido. Si el filtro se aplicara igual, la 7 se caería — y es justamente la
    // fila que hace que este caso pueda ponerse rojo (ver su comentario en el fixture).
    expect(objSvc.cllReason()).toEqual([
      { value: 'M04', label: 'Demora en la indemnización' },
      { value: 'M07', label: 'Inspección tardía' },
    ]);
  });

  it('el motivo es el único nivel cuyo `value` es un CÓDIGO', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Asistencias', [QD.strServiceProvided]: 'Cerrajería' });

    // `value` = codigoMotivoSFC (lo que espera la Superintendencia), `label` = motivoSFC.
    expect(objSvc.cllReason()).toEqual([{ value: 'M02', label: 'Cerrajería no llegó' }]);
  });

  it('`objSelectedReasonRow` devuelve la FILA completa del motivo elegido', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({
      [QD.strInteraction]: 'Asistencias',
      [QD.strServiceProvided]: 'Grúa',
      [QD.strSfcReason]: 'M03',
    });

    // La pantalla la usa para re-derivar los campos regulatorios que cuelgan del motivo; por eso el
    // servicio expone la fila y no solo el código.
    const objFila = objSvc.objSelectedReasonRow();
    expect(objFila).toBeDefined();
    expect(leerColumnaMatriz(objFila!, 'motivoSFC')).toBe('Grúa dañó el vehículo');
  });

  it('un motivo que no está entre las filas candidatas da `undefined`', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Siniestros', [QD.strSfcReason]: 'M01' });

    // M01 existe en la matriz, pero pertenece a Asistencias: fuera de sus filas no se resuelve.
    expect(objSvc.objSelectedReasonRow()).toBeUndefined();
  });
});

describe('MatrizMotivosService · producto con código repetido', () => {
  it('`cllInsuranceUi` desambigua los values del picker', async () => {
    await armar(DIC_QUEJA_AUTOS);

    // Los dos productos que comparten el 104 tienen que salir con values distintos, o el picker no
    // puede saber cuál se clickeó.
    const cllUi = objSvc.cllInsuranceUi().map((in_o) => in_o.value);
    expect(new Set(cllUi).size).toBe(cllUi.length);
    expect(cllUi).toContain('104::Garantía extendida');
    expect(cllUi).toContain('104::Copropiedades');
  });

  it('el `_desc` guardado desempata el 104 al reconstruir el value de UI', async () => {
    await armar({ ...DIC_QUEJA_AUTOS, [QD.strSfcProduct]: '104', [`${QD.strSfcProduct}_desc`]: 'Copropiedades' });

    // Sin el `_desc` caería en el primer 104 ("Garantía extendida") y la etiqueta del producto —que es
    // lo que compara contra la matriz— quedaría equivocada.
    expect(objSvc.strInsuranceUiValue()).toBe('104::Copropiedades');
    expect(objSvc.strProductLabel()).toBe('Copropiedades');
  });

  it('`syncProductDesc` escribe la etiqueta elegida, no la resuelta por código', async () => {
    await armar(DIC_QUEJA_AUTOS);

    objSvc.syncProductDesc('104::Copropiedades');

    expect(objHost.form.get(`${QD.strSfcProduct}_desc`)!.value).toBe('Copropiedades');
  });

  it('`syncProductDesc` no emite: el `_desc` no participa de la cascada', async () => {
    await armar(DIC_QUEJA_AUTOS);
    const fnEspia = vi.fn();
    objHost.form.valueChanges.subscribe(fnEspia);

    objSvc.syncProductDesc('104::Garantía extendida');

    // Con emisión, cada escritura de `_desc` volvería a disparar los efectos de la pantalla.
    expect(fnEspia).not.toHaveBeenCalled();
  });
});

describe('MatrizMotivosService · `_desc` del motivo', () => {
  it('escribe el `_desc` del motivo cuando el código ya viene precargado', async () => {
    // `sincronizarDesc` usa `startWith`, así que la primera pasada ya resuelve el valor precargado.
    // Acá el control se setea antes de que la matriz responda, que es el orden real de una precarga.
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Siniestros' });
    objHost.form.get(QD.strSfcReason)!.setValue('M04');

    expect(objHost.form.get(`${QD.strSfcReason}_desc`)!.value).toBe('Demora en la indemnización');
  });

  it('un motivo vacío escribe `""`, no `"—"` (el valor VIAJA a PM4)', async () => {
    await armar(DIC_QUEJA_AUTOS);
    poner({ [QD.strInteraction]: 'Siniestros' });
    objHost.form.get(QD.strSfcReason)!.setValue('M04');
    objHost.form.get(QD.strSfcReason)!.setValue('');

    // Un guión literal en la base del BPM aparecería después en un reporte como si fuera una
    // descripción real. La asimetría con `descOf` es deliberada.
    expect(objHost.form.get(`${QD.strSfcReason}_desc`)!.value).toBe('');
  });
});

describe('MatrizMotivosService · carga de catálogos', () => {
  it('`vincular()` pide los TRES catálogos', async () => {
    // Si faltara el de tipo de solicitud, la cascada quedaría muda sin ningún error visible: es el
    // criterio cuyo campo no tiene widget en SCR-003.
    await armar(DIC_QUEJA_AUTOS);

    expect(objSvc.cllInsurance()).toHaveLength(4);
    expect(objSvc.blnCargando()).toBe(false);
  });
});
