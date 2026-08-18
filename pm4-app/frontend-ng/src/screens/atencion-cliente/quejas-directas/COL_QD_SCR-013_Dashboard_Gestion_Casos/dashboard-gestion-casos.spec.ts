import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZrKpiValue, ZrPagination } from '../../../../components/fields/zds-reexports';
import { GLOBAL_COLLECTIONS } from '../../../../core/collections';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { SCR013_PAGE_SIZE, SCR013_PROCESS_ID } from '../fields/fields';
import type { CasoDashboard } from '../fields/types';
import { DashboardGestionCasos } from './dashboard-gestion-casos';
import { SAMPLE_CASES } from './dashboard-helpers';

/**
 * SCR-013 · Dashboard — Gestión de Casos: **un caso por regla de la pantalla**, no un smoke.
 *
 * ── Qué cubre este archivo y qué NO, porque son cuatro y conviene no repetirse ────────────────────
 * La pantalla tiene cuatro archivos de test (es la primera del proyecto con cuatro). El reparto:
 * - `dashboard-helpers.spec.ts` — la matemática pura (KPIs, variantes, texto de días, CSV, mapeo).
 * - `casos-dashboard.service.spec.ts` — el paginado, el fallback de PMQL, el cruce por `case_title`.
 * - `detalle-caso-modal.spec.ts` — la píldora de Estado por `TemplateRef` y el `(close)`.
 * - **este** — el cableado: draft vs aplicado, la paginación, el semáforo de KPIs, el CSV y el modal.
 * Nada de lo que ya está aseverado en los otros tres se repite acá: probarlo dos veces no lo prueba
 * mejor, y sí hace que un cambio de regla exija editar dos archivos.
 *
 * ── ⚠ Los DOS casos que el spec de React declaró IMPOSIBLES, acá sí se cubren ─────────────────────
 * `DashboardGestionCasos.test.tsx` cierra con una nota textual: la rama
 * *"filtro sin resultados ⇒ Descargar bloqueado + 'Sin casos'"* **no se cubre a propósito**, porque
 * llegar ahí exige escribir en un control del DS y en jsdom eso no es interactuable. En Angular el
 * filtro es un `FormControl`: se escribe con `patchValue`, sin tocar el shadow DOM del select. Esa es
 * la brecha que se cierra —y es la más caliente de la pantalla, porque es exactamente el agujero por
 * el que pasó el bug de Área que ningún test de React podía ver (ver el `it` marcado `⚠ bug heredado`).
 *
 * ── Por qué se monta con HTTP real y no con `vi.mock` del servicio ────────────────────────────────
 * React mockeaba `useCasosDashboard` entero, así que sus casos probaban la pantalla contra una lista
 * inyectada a mano y el cableado real —¿la pantalla llama a `cargar()`? ¿lee `casos()` o
 * `sigRequests()`?— nunca se ejercitó. Acá el servicio es el real y las respuestas entran por
 * `HttpTestingController`: si alguien desconecta `ngOnInit` de la carga, los casos se ponen rojos.
 * El precio es el drenado de las cuatro peticiones que la pantalla dispara sola, y eso es un helper.
 *
 * ── `console.error` silenciado: el servicio lo usa como parte de una rama de diseño ───────────────
 * Cuando `/tasks` falla, `CasosDashboardService` **degrada a propósito** y lo registra con
 * `console.error` sin tocar `error` (la vista sigue siendo utilizable). Ese camino se recorre en cada
 * montaje porque el drenado responde `/tasks` con `{data: []}`, no con un error — así que el spy es
 * solo para que un fallo real de otra cosa no se pierda entre ruido esperado.
 */

/** El proceso no importa para estos casos, pero la URL con PMQL es el criterio de match del mock. */
const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

let objFixture: ComponentFixture<DashboardGestionCasos>;
let objPantalla: DashboardGestionCasos;
let objMock: HttpTestingController;

/**
 * ⚠ **`await whenStable()` por sí solo NO repinta** bajo `provideZonelessChangeDetection()`. Sin el
 * `detectChanges()` la plantilla se queda en la rama `@if (blnCargando())` para siempre y ni la tabla
 * ni los filtros existen. Mismo helper que los seis specs de pantalla anteriores.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

const INT_MAX_VUELTAS_DRENADO = 8;

/**
 * Cede dos turnos de microtareas para que la petición **siguiente** de una cadena quede registrada en
 * el mock antes de mirarlo.
 *
 * ⚠ **Dos, no uno, y no es margen de seguridad.** Entre responder una petición y que salga la que la
 * sigue hay dos `await` encadenados: el `firstValueFrom` de la que se acaba de responder y el del
 * bucle que dispara la próxima. Con un solo `Promise.resolve()` el `match()` corre en el medio, no ve
 * nada y el drenado se corta creyendo que terminó. Mismo helper que `casos-dashboard.service.spec.ts`,
 * donde se estableció el motivo.
 */
async function vuelta(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * Consume las peticiones que la pantalla dispara por su cuenta: los dos catálogos (Tipo id 18, Área
 * id 35), los feriados (colección 48) y el `/tasks` de la segunda pasada del servicio.
 *
 * **No drena `/requests`**, y ese hueco es deliberado: la lista de casos es el insumo de casi todos
 * los casos de abajo, así que la responde `montar()` con el fixture que cada caso pide. Drenarla acá
 * con `{data: []}` dejaría a todos los casos corriendo sobre `SAMPLE_CASES` sin que se note.
 *
 * ⚠ El filtro `method === 'GET'` es lo que mantiene honestas las aserciones de payload: drenar a
 * ciegas se comería cualquier PUT que un caso quisiera aseverar. Esta pantalla no escribe nada, pero
 * el helper se mantiene igual que en las nueve anteriores para que copiarlo no introduzca el agujero.
 *
 * ⚠ `/tasks` sale **después** de que `/requests` se responde (es la segunda pasada del servicio), así
 * que el drenado tiene que seguir dando vueltas después de la primera tanda: por eso el bucle vuelve
 * a `asentar()` y a mirar en cada iteración en vez de hacer un solo barrido.
 *
 * ⚠ **Y por eso una vuelta vacía no significa que terminó: hacen falta DOS seguidas.** Cuando
 * `montar()` responde `/requests`, `cargar()` está todavía en medio de su cadena de `await` y el
 * `/tasks` no salió; la vuelta ve solo las tres colecciones, las responde, y la siguiente —si cortara
 * ahí— dejaría a `cargar()` esperando para siempre: `sigCargando` no baja nunca, la plantilla se queda
 * en `@if (blnCargando())` y **ni la tabla ni los KPIs ni el paginador existen**. Ese fue exactamente
 * el modo de falla: diez casos rojos con `dicKpis()` vacío y `dispatchEvent` sobre `null`, todos con
 * una sola causa. El `vuelta()` de arriba cede los dos turnos que necesita la cadena, y el contador de
 * vacías exige que dos rondas consecutivas no encuentren nada antes de dar el drenado por cerrado.
 */
async function drenarPeticiones(): Promise<void> {
  let intVacias = 0;
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    await asentar();
    await vuelta();
    const cllPendientes = objMock.match(
      (in_objReq) => in_objReq.method === 'GET' && !in_objReq.url.endsWith('/requests'),
    );
    if (cllPendientes.length === 0) {
      intVacias += 1;
      if (intVacias >= 2) {
        await asentar();
        return;
      }
      continue;
    }
    intVacias = 0;
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
    }
  }
  throw new Error(
    `El drenado no convergió en ${INT_MAX_VUELTAS_DRENADO} vueltas: ` +
      objMock
        .match(() => true)
        .map((in_objPet) => `${in_objPet.request.method} ${in_objPet.request.urlWithParams}`)
        .join(', '),
  );
}

/**
 * Responde y descarta **todo** lo que quede en vuelo, sin aseverar nada.
 *
 * Es solo para el caso del loader, que corta a propósito antes de responder: sin esto el `verify()`
 * del `afterEach` reportaría las peticiones en vuelo como un olvido, cuando son el punto del caso.
 */
async function descartarTodo(): Promise<void> {
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    const cllPendientes = objMock.match(() => true);
    if (cllPendientes.length === 0) return;
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [], meta: { last_page: 1 } });
    }
    await asentar();
  }
}

/** Un request crudo de PM4 tal como lo devuelve `/requests?include=data`. */
function request(in_intId: number, in_dicData: Record<string, unknown>, in_strStatus = 'ACTIVE') {
  return {
    id: in_intId,
    case_number: in_intId,
    process_id: SCR013_PROCESS_ID,
    status: in_strStatus,
    data: in_dicData,
  };
}

/**
 * Monta la pantalla y responde `/requests` con los requests dados.
 *
 * El orden es contrato: `detectChanges()` **entre** `createComponent` y el `expectOne`, porque bajo
 * `provideZonelessChangeDetection()` `createComponent()` por sí solo no corre `ngOnInit` — y es
 * `ngOnInit` el que dispara las cuatro cargas.
 */
async function montar(in_cllRequests: unknown[] = []): Promise<void> {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
    ],
  });
  objFixture = TestBed.createComponent(DashboardGestionCasos);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();

  objMock
    .expectOne((in_objReq) => in_objReq.url.endsWith('/requests'))
    .flush({ data: in_cllRequests, meta: { last_page: 1 } });

  await drenarPeticiones();
}

/** Responde los dos catálogos con registros reales, para los casos que necesitan código→descripción. */
async function montarConCatalogos(in_cllRequests: unknown[] = []): Promise<void> {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
    ],
  });
  objFixture = TestBed.createComponent(DashboardGestionCasos);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();

  objMock
    .expectOne((in_objReq) => in_objReq.url.endsWith('/requests'))
    .flush({ data: in_cllRequests, meta: { last_page: 1 } });
  await asentar();

  // Los dos catálogos van por su id real: el `labelField`/`valueField` de cada uno es distinto
  // (`descripcion`/`codigo` vs `nombre_area`/`codigo_area`), así que un registro genérico no sirve.
  objMock
    .expectOne((in_objReq) => in_objReq.url.endsWith(`/collections/${GLOBAL_COLLECTIONS.requestType.id}/records`))
    .flush({ data: [{ data: { codigo: '1', descripcion: 'Queja' } }, { data: { codigo: '2', descripcion: 'Petición' } }] });
  objMock
    .expectOne((in_objReq) => in_objReq.url.endsWith(`/collections/${GLOBAL_COLLECTIONS.area.id}/records`))
    .flush({ data: [{ data: { codigo_area: '35', nombre_area: 'Siniestros Autos' } }] });

  await drenarPeticiones();
}

/** El texto completo de la pantalla. Sujeto de las aserciones de rótulo y de resumen. */
function strTexto(): string {
  return ((objFixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
}

/**
 * Los KPIs como `rótulo → valor`.
 *
 * ⚠ Se lee la **instancia** de cada `ZrKpiValue` y no el DOM: `amount` y `header` son `@Input()` de
 * Angular, así que `getAttribute('amount')` devuelve `null` aunque el binding funcione. En React esto
 * se leía como propiedad del custom element (`objKpi.amount`), que es el equivalente de allá.
 */
function dicKpis(): Record<string, number> {
  return Object.fromEntries(
    objFixture.debugElement
      .queryAll((in_objNodo) => in_objNodo.componentInstance instanceof ZrKpiValue)
      .map((in_objNodo) => {
        const objKpi = in_objNodo.componentInstance as ZrKpiValue;
        return [String(objKpi.header), Number(objKpi.amount)];
      }),
  );
}

/** El `# Caso` de cada fila pintada por `lib-table-z`, en orden. Es lo que el supervisor ve. */
function cllNumerosDeCaso(): string[] {
  return Array.from(
    objFixture.nativeElement.querySelectorAll('lib-table-z tbody tr') as NodeListOf<HTMLElement>,
  )
    .map((in_objTr) => (in_objTr.querySelectorAll('td')[1]?.textContent ?? '').trim())
    .filter((in_str) => in_str !== '');
}

/** Escribe en los cuatro filtros (el borrador) sin tocar el shadow DOM del DS. */
function escribirFiltros(in_dicValores: Partial<Record<string, string>>): void {
  objPantalla.form.patchValue(in_dicValores);
  objFixture.detectChanges();
}

/** Dispara un `(eventClick)` sobre el `lib-button-z` cuyo `label` coincide. */
function apretar(in_strLabel: string): void {
  const objBoton = Array.from(
    objFixture.nativeElement.querySelectorAll('lib-button-z') as NodeListOf<HTMLElement>,
  ).find((in_objB) => in_objB.getAttribute('label') === in_strLabel);
  if (!objBoton) throw new Error(`No existe un lib-button-z con label="${in_strLabel}"`);
  objBoton.dispatchEvent(new CustomEvent('eventClick'));
  objFixture.detectChanges();
}

beforeEach(() => {
  TestBed.resetTestingModule();
  // Ver la nota de cabecera: la degradación de `/tasks` registra por `console.error` a propósito.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  objMock?.verify();
  vi.restoreAllMocks();
});

describe('DashboardGestionCasos (SCR-013)', () => {
  describe('carga y fallback', () => {
    it('mientras carga muestra el loader, sin KPIs ni tabla', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
        ],
      });
      objFixture = TestBed.createComponent(DashboardGestionCasos);
      objMock = TestBed.inject(HttpTestingController);
      objFixture.detectChanges();

      // Deliberadamente sin responder nada: es el estado en vuelo. `cargando` arranca en `true` en el
      // servicio justamente para que este frame no pinte "no hay casos".
      expect(objFixture.nativeElement.querySelector('.screen-loading')).not.toBeNull();
      expect(strTexto()).not.toContain('Gestión de Casos');

      // Se responden y descartan las peticiones en vuelo para que el `verify()` del `afterEach` no
      // las reporte: no llegaron a responderse porque el caso es sobre el estado previo, no un olvido.
      await descartarTodo();
    });

    it('⚠ sin casos desde la API cae a los 8 SAMPLE_CASES y calcula los KPIs sobre ellos', async () => {
      await montar([]);

      // Los KPIs se aseveran por VALOR y no por rótulo, igual que en React: el rótulo es texto fijo
      // de la plantilla, así que `calcularKpis()` podría devolver todo en cero y pasar igual.
      // SAMPLE_CASES: 2 Abierta · 2 Por Vencer · 2 Vencida · 1 Cerrada — la 8ª es Cancelada y no suma
      // en ningún KPI (regla fijada en `dashboard-helpers.spec.ts`).
      expect(dicKpis()).toEqual({
        'Casos abiertos': 2,
        'Próximos a vencer': 2,
        Vencidos: 2,
        Cerrados: 1,
      });
      expect(strTexto()).toContain('Mostrando 1–8 de 8 casos');

      // ⚠ El fallback se dispara con la lista **vacía**, no solo con error: un tenant legítimamente
      // sin casos ve datos de ejemplo y NO ve el cartel de "datos de ejemplo" (ese solo aparece con
      // error). Se replica de React tal cual y queda anotado en la ficha 2.0 — este `it` fija el
      // comportamiento actual para que, si negocio decide cambiarlo, se ponga rojo acá.
      expect(strTexto()).not.toContain('Mostrando datos de ejemplo');
    });

    it('con error de PM4 muestra el aviso y sigue mostrando los datos de ejemplo', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
        ],
      });
      objFixture = TestBed.createComponent(DashboardGestionCasos);
      objMock = TestBed.inject(HttpTestingController);
      objFixture.detectChanges();

      // Dos veces: el servicio reintenta sin PMQL antes de rendirse (auto-recuperación), así que un
      // solo error no llega a `sigError`. Esa rama está aseverada en el spec del servicio; acá se la
      // recorre para llegar al estado que la pantalla tiene que pintar.
      objMock.expectOne((in_objReq) => in_objReq.url.endsWith('/requests')).error(new ProgressEvent('error'));
      await asentar();
      objMock
        .expectOne((in_objReq) => in_objReq.url.endsWith('/requests'))
        .flush({ message: 'Network Error' }, { status: 500, statusText: 'Server Error' });
      await drenarPeticiones();

      // La pantalla NO se reemplaza por el error: degrada y sigue usable. Es la divergencia
      // deliberada con las nueve pantallas anteriores, donde el error sí es rama exclusiva.
      expect(strTexto()).toContain('No se pudieron cargar los casos desde PM4');
      expect(strTexto()).toContain('Mostrando datos de ejemplo');
      expect(cllNumerosDeCaso()).toHaveLength(SCR013_PAGE_SIZE);
    });

    it('con casos reales de PM4 NO usa los de ejemplo', async () => {
      // La otra mitad del fallback, y la que distingue `cllApi.length > 0 ? cllApi : SAMPLE_CASES` de
      // un `SAMPLE_CASES` fijo: con un solo caso real la tabla muestra ese, no los ocho de mentira.
      await montar([request(4321, { qd_strSfcCode: 'QD-REAL-001' })]);

      expect(cllNumerosDeCaso()).toEqual(['QD-REAL-001']);
      expect(strTexto()).toContain('Mostrando 1–1 de 1 casos');
    });
  });

  describe('KPIs', () => {
    it('cada KPI cuenta SU estado (conteos asimétricos, y Cancelada no suma)', async () => {
      // Conteos distintos por estado a propósito: con SAMPLE_CASES hay 2 Abierta y 2 Por Vencer, así
      // que un swap entre esos dos filtros daría el mismo número y pasaría desapercibido.
      // El estado se deriva de `status` + SLA en `mapRequestToCaso`, así que se fabrica por `status`:
      // COMPLETED → Cerrada, CANCELED → Cancelada, ACTIVE sin fecha de radicación → Abierta.
      await montar([
        request(1, {}), request(2, {}), request(3, {}),
        request(11, {}, 'COMPLETED'), request(12, {}, 'COMPLETED'),
        request(21, {}, 'CANCELED'),
      ]);

      expect(dicKpis()).toEqual({
        'Casos abiertos': 3,
        'Próximos a vencer': 0,
        Vencidos: 0,
        Cerrados: 2,
      });
    });

    it('⚠ los KPIs se calculan sobre la lista COMPLETA, no sobre la filtrada', async () => {
      await montar([request(1, {}), request(2, {}), request(11, {}, 'COMPLETED')]);
      expect(dicKpis()['Casos abiertos']).toBe(2);

      // **Es la decisión de diseño de §9 de la ficha, y sin este caso se pierde en silencio.** Si los
      // KPIs siguieran al filtro, elegir "Cerrada" mostraría "Casos abiertos: 0" y el supervisor
      // leería que no hay nada abierto. El filtro recorta la TABLA, no los contadores.
      escribirFiltros({ filtroEstado: 'Cerrada' });
      apretar('Aplicar filtros');

      expect(cllNumerosDeCaso()).toHaveLength(1);
      expect(dicKpis()['Casos abiertos']).toBe(2);
    });
  });

  describe('filtros: draft vs aplicado', () => {
    it('⚠ escribir en el filtro NO filtra hasta apretar "Aplicar filtros"', async () => {
      await montar([request(1, {}), request(2, {}), request(11, {}, 'COMPLETED')]);
      expect(cllNumerosDeCaso()).toHaveLength(3);

      // La mitad que se rompe sola: si alguien "simplifica" el `sigAplicados` leyendo el form
      // directamente, la tabla filtra en cada tecla y este caso se pone rojo. Es el motivo entero de
      // que haya dos estados y no uno.
      escribirFiltros({ filtroEstado: 'Cerrada' });
      expect(cllNumerosDeCaso()).toHaveLength(3);

      apretar('Aplicar filtros');
      expect(cllNumerosDeCaso()).toHaveLength(1);
    });

    it('la búsqueda libre mira número de caso, responsable y la DESCRIPCIÓN del tipo', async () => {
      await montarConCatalogos([
        request(1, { qd_strSfcCode: 'AAA-1', qd_strRequestType: '1', _user: { fullname: 'Laura González' } }),
        request(2, { qd_strSfcCode: 'BBB-2', qd_strRequestType: '2', _user: { fullname: 'Pedro Ramírez' } }),
      ]);

      // Por descripción del tipo, no por su código: es lo que el usuario ve en la tabla, así que es lo
      // que espera poder tipear. Buscar "Petición" tiene que encontrar el caso cuyo código es '2'.
      escribirFiltros({ filtroBuscar: 'Petición' });
      apretar('Aplicar filtros');
      expect(cllNumerosDeCaso()).toEqual(['BBB-2']);

      // Por responsable.
      escribirFiltros({ filtroBuscar: 'laura' });
      apretar('Aplicar filtros');
      expect(cllNumerosDeCaso()).toEqual(['AAA-1']);
    });

    it('la búsqueda ignora mayúsculas y espacios de sobra', async () => {
      // El `trim().toLowerCase()`: sin él, un espacio final pegado al pegar desde otra ventana vacía
      // la tabla y el usuario no entiende por qué.
      await montar([request(1, { qd_strSfcCode: 'AAA-1' })]);

      escribirFiltros({ filtroBuscar: '  aaa-1  ' });
      apretar('Aplicar filtros');
      expect(cllNumerosDeCaso()).toEqual(['AAA-1']);
    });

    it('⚠ [React lo declaró imposible] un filtro sin resultados bloquea "Descargar" y dice "Sin casos"', async () => {
      await montar([request(1, {}), request(2, {})]);

      // **Esta es la rama que el spec de React dejó explícitamente sin cubrir** ("exige escribir en un
      // control del DS, que en jsdom no es interactuable"). Acá el filtro es un `FormControl` y se
      // escribe con `patchValue`: la brecha se cierra sin tocar el shadow DOM.
      escribirFiltros({ filtroBuscar: 'no-existe-este-caso' });
      apretar('Aplicar filtros');

      expect(cllNumerosDeCaso()).toEqual([]);
      expect(strTexto()).toContain('Sin casos');
      expect(strTexto()).toContain('No hay casos que coincidan con los filtros seleccionados');

      // Y el botón queda bloqueado: sin casos no hay CSV que bajar. Se lee el atributo del host
      // porque `[disabled]` es un binding a un input del componente — se busca por label como el
      // helper `apretar`, y se asevera sobre el input de la instancia.
      expect(objPantalla['blnDescargaBloqueada']()).toBe(true);
    });

    it('"Limpiar" resetea el borrador Y lo aplicado, y vuelve a la primera página', async () => {
      const cllMuchos = Array.from({ length: SCR013_PAGE_SIZE + 3 }, (_, in_intI) =>
        request(in_intI + 1, { qd_strSfcCode: `C-${String(in_intI + 1).padStart(2, '0')}` }),
      );
      await montar(cllMuchos);

      objPantalla['irAPagina'](2);
      objFixture.detectChanges();
      expect(strTexto()).toContain(`Mostrando ${SCR013_PAGE_SIZE + 1}–${SCR013_PAGE_SIZE + 3} de ${SCR013_PAGE_SIZE + 3} casos`);

      escribirFiltros({ filtroBuscar: 'C-01' });
      apretar('Aplicar filtros');
      apretar('Limpiar');

      // Las tres cosas, porque son tres líneas distintas del método y cada una puede faltar sola:
      // el borrador vacío, lo aplicado vacío (la tabla completa otra vez) y la página en 1.
      expect(objPantalla.form.getRawValue().filtroBuscar).toBe('');
      expect(cllNumerosDeCaso()).toHaveLength(SCR013_PAGE_SIZE);
      expect(strTexto()).toContain(`Mostrando 1–${SCR013_PAGE_SIZE} de ${SCR013_PAGE_SIZE + 3} casos`);
    });

    it('⚠ BUG HEREDADO DE REACT — filtrar por Área no devuelve NADA', async () => {
      // **Este `it` asevera el comportamiento ROTO a propósito, y es el hallazgo de mayor prioridad
      // del reporte de SCR-013.**
      //
      // `filtroArea` trae el *código* de la colección de Área (id 35, p.ej. '35'), pero
      // `mapRequestToCaso` llena `caso.areaResponsable` desde **`qd_strResponsableRole`**, que es un
      // ROL ("Analista SAC"), no un código. Comparar '35' contra 'Analista SAC' da falso siempre, así
      // que elegir cualquier área vacía la tabla.
      //
      // El port lo replica tal cual: qué campo debe gobernar el filtro —¿área o rol?— es una decisión
      // de negocio, y arreglarlo acá sería un cambio funcional encubierto en una migración de
      // framework. **El campo que haría falta es `qd_strAssigneeArea`** (el que §4.2 de la ficha dice
      // que se usa, y no se usa). El día que negocio lo decida, este caso se pone rojo y señala
      // exactamente la línea de `cllFiltrados` que hay que cambiar.
      await montarConCatalogos([
        request(1, { qd_strSfcCode: 'AAA-1', qd_strResponsableRole: 'Analista SAC' }),
      ]);

      // El caso ES del área 35 según el rol que trae, y el filtro se elige por el código de esa área.
      escribirFiltros({ filtroArea: '35' });
      apretar('Aplicar filtros');

      expect(cllNumerosDeCaso()).toEqual([]); // ⚠ debería ser ['AAA-1']
      expect(strTexto()).toContain('Sin casos');
    });
  });

  describe('paginación', () => {
    it(`pagina de ${SCR013_PAGE_SIZE} en ${SCR013_PAGE_SIZE} y el resumen cuenta desde 1`, async () => {
      const cllMuchos = Array.from({ length: SCR013_PAGE_SIZE + 2 }, (_, in_intI) =>
        request(in_intI + 1, { qd_strSfcCode: `C-${String(in_intI + 1).padStart(2, '0')}` }),
      );
      await montar(cllMuchos);

      expect(cllNumerosDeCaso()).toHaveLength(SCR013_PAGE_SIZE);
      expect(cllNumerosDeCaso()[0]).toBe('C-01');
      expect(strTexto()).toContain(`Mostrando 1–${SCR013_PAGE_SIZE} de ${SCR013_PAGE_SIZE + 2} casos`);

      // ⚠ `za-pagination` lleva su página por `[ngModel]`/`(ngModelChange)` y NO es un
      // ControlValueAccessor (hereda de `ZaModelElement`, donde `ngModel` es un `@Input` común). Se
      // dispara el output del componente, que es el camino real que la plantilla escucha.
      const objPag = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrPagination,
      ).componentInstance as ZrPagination;
      expect(objPag.pages).toBe(2);

      objPantalla['irAPagina'](2);
      objFixture.detectChanges();

      // El `padStart(2, '0')` es el mismo del fixture de arriba: los números van a dos dígitos para
      // que el orden alfabético coincida con el numérico y la aserción de "los DOS que sobran" no
      // dependa de cómo ordene el navegador.
      expect(cllNumerosDeCaso()).toEqual([
        `C-${String(SCR013_PAGE_SIZE + 1).padStart(2, '0')}`,
        `C-${String(SCR013_PAGE_SIZE + 2).padStart(2, '0')}`,
      ]);
      expect(strTexto()).toContain(
        `Mostrando ${SCR013_PAGE_SIZE + 1}–${SCR013_PAGE_SIZE + 2} de ${SCR013_PAGE_SIZE + 2} casos`,
      );
    });

    it('⚠ al filtrar desde una página alta la página se ACOTA al nuevo total', async () => {
      const cllMuchos = Array.from({ length: SCR013_PAGE_SIZE + 2 }, (_, in_intI) =>
        request(in_intI + 1, { qd_strSfcCode: `C-${String(in_intI + 1).padStart(2, '0')}` }),
      );
      await montar(cllMuchos);

      objPantalla['irAPagina'](2);
      objFixture.detectChanges();
      expect(cllNumerosDeCaso()).toHaveLength(2);

      // El `Math.min(pagina, totalPaginas)` de `intPaginaActual`. Sin él, un filtro que deja 1 sola
      // página con la página guardada en 2 mostraría la tabla VACÍA y la paginación marcando una
      // página que ya no existe — y el resumen diría "Mostrando 9–1 de 1 casos".
      // Nótese que este filtro NO pasa por "Aplicar": se escribe y se aplica, y el reset de página que
      // hace `aplicarFiltros()` taparía el `min`. Por eso se mueve `sigAplicados` sin resetear.
      objPantalla['sigAplicados'].set({
        filtroTipo: '', filtroEstado: '', filtroArea: '', filtroBuscar: 'C-01',
      });
      objFixture.detectChanges();

      expect(cllNumerosDeCaso()).toEqual(['C-01']);
      expect(strTexto()).toContain('Mostrando 1–1 de 1 casos');
    });
  });

  describe('modal de detalle', () => {
    it('el modal nace cerrado y "Ver" abre el del caso de ESA fila', async () => {
      await montar([
        request(1, { qd_strSfcCode: 'AAA-1' }),
        request(2, { qd_strSfcCode: 'BBB-2' }),
      ]);
      expect(objFixture.nativeElement.querySelector('app-detalle-caso-modal')).toBeNull();

      // Se abre por la SEGUNDA fila: con la primera, un `abrirDetalle(casos()[0])` fijo pasaría igual.
      const cllBotonesVer = Array.from(
        objFixture.nativeElement.querySelectorAll('lib-table-z lib-button-z') as NodeListOf<HTMLElement>,
      );
      expect(cllBotonesVer).toHaveLength(2);
      cllBotonesVer[1].dispatchEvent(new CustomEvent('eventClick'));
      objFixture.detectChanges();

      expect(objFixture.nativeElement.querySelector('app-detalle-caso-modal')).not.toBeNull();
      expect(strTexto()).toContain('Caso #BBB-2');
    });

    it('el `(cerrar)` del modal lo saca del DOM, así que "Ver" vuelve a abrirlo', async () => {
      await montar([request(1, { qd_strSfcCode: 'AAA-1' })]);

      const objVer = objFixture.nativeElement.querySelector('lib-table-z lib-button-z') as HTMLElement;
      objVer.dispatchEvent(new CustomEvent('eventClick'));
      objFixture.detectChanges();
      expect(objFixture.nativeElement.querySelector('app-detalle-caso-modal')).not.toBeNull();

      // La otra mitad del gotcha de `ModalZ`: el modal avisa (eso lo fija `detalle-caso-modal.spec.ts`)
      // y **la pantalla tiene que poner `sigCasoSel` en null**. Sin el handler, el `@if` sigue en true
      // y el segundo clic en "Ver" no hace nada visible.
      const objModal = objFixture.nativeElement.querySelector('lib-modal-z') as HTMLElement;
      objModal.dispatchEvent(new CustomEvent('close'));
      objFixture.detectChanges();

      expect(objFixture.nativeElement.querySelector('app-detalle-caso-modal')).toBeNull();
    });
  });

  describe('descarga del CSV', () => {
    it('baja los casos FILTRADOS, con BOM y el nombre de archivo de React', async () => {
      await montar([
        request(1, { qd_strSfcCode: 'AAA-1' }),
        request(2, { qd_strSfcCode: 'BBB-2' }),
      ]);

      // Se espía la fábrica del blob y el `click` del ancla: es la única forma de ver qué se bajó sin
      // un navegador real.
      //
      // ⚠⚠ **`vi.spyOn` y NUNCA una asignación cruda `URL.createObjectURL = vi.fn()`, aunque las dos
      // funcionen dentro de este archivo.** La versión anterior asignaba directo, con el motivo de que
      // "`URL.createObjectURL` no existe en jsdom, así que se define". **Ese motivo es falso**: se midió
      // y jsdom trae las dos como `function`. Lo que sí falta en jsdom es `Blob.prototype.arrayBuffer`,
      // que está shimmeado en `test-setup.ts` — probablemente de ahí venía la confusión.
      //
      // Y la asignación cruda costaba un test flaky **en otro archivo**: `URL` es un global del
      // entorno, compartido por todos los specs que caen en el mismo worker de Vitest.
      // `restoreAllMocks()` deshace lo que registró `vi.spyOn`, pero no puede deshacer una asignación
      // que nunca vio, así que este `vi.fn()` quedaba clavado en `URL` para todo archivo posterior —
      // con su contador de llamadas ya cargado. El síntoma aparecía en
      // `components/request-file-list.spec.ts`: su caso *"un fallo de descarga NO pinta ningún
      // mensaje"* asevera `expect(fnRevocar).not.toHaveBeenCalled()` y recibía
      // `LLAMADAS=[["blob:fake"]]` — el `blob:fake` de ACÁ. Verde el archivo solo, rojo en la suite
      // completa, y solo cuando el scheduler ponía los dos archivos en el mismo worker: 2 de 3
      // corridas con `VITEST_MAX_WORKERS=1`, intermitente sin forzarlo.
      const cllBlobs: Blob[] = [];
      vi.spyOn(URL, 'createObjectURL').mockImplementation((in_objBlob: Blob | MediaSource) => {
        cllBlobs.push(in_objBlob as Blob);
        return 'blob:fake';
      });
      const fnRevocar = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
      let strDescarga = '';
      const fnClick = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          strDescarga = this.download;
        });

      escribirFiltros({ filtroBuscar: 'BBB' });
      apretar('Aplicar filtros');
      apretar('Descargar reporte');

      expect(fnClick).toHaveBeenCalledOnce();
      expect(strDescarga).toBe('reporte-casos-quejas-directas.csv');
      expect(cllBlobs).toHaveLength(1);

      // ⚠ **El BOM se asevera sobre los BYTES, no sobre el texto, y no es una preferencia.** El BOM es
      // DATO —sin él Excel abre el CSV en ANSI y las tildes salen mal—, pero `blob.text()` decodifica
      // con un `TextDecoder` que **se come el U+FEFF inicial**: sobre un blob que empieza con
      // `EF BB BF` devuelve el texto ya pelado. La primera versión de esta línea era
      // `expect(strCsv.startsWith('﻿')).toBe(true)` y **no podía pasar nunca**, y lo peor es la
      // otra mitad: al invertirla a `false` habría quedado verde igual con el BOM borrado de la
      // implementación, o sea vigilando nada. Los tres bytes se leen del `arrayBuffer()`, que es lo que
      // el navegador realmente escribe en el archivo.
      const cllBytes = new Uint8Array(await cllBlobs[0].arrayBuffer());
      expect([...cllBytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

      const strCsv = await cllBlobs[0].text();
      // Y baja lo FILTRADO, no todo: es la diferencia entre `cllFiltrados()` y `cllCasos()`.
      expect(strCsv).toContain('BBB-2');
      expect(strCsv).not.toContain('AAA-1');

      // El blob se libera siempre. Sin el `finally`, un `click()` que tire deja el blob retenido.
      expect(fnRevocar).toHaveBeenCalledWith('blob:fake');
    });
  });

  describe('rótulos y catálogos', () => {
    it('los cuatro filtros existen como controles del FormGroup, con los nombres del port', async () => {
      await montar([]);

      // Los nombres son contrato con la plantilla (`formControlName`): renombrar uno rompe el binding
      // en silencio —Angular no falla, el campo simplemente no se ata al form— y este caso lo nombra.
      expect(Object.keys(objPantalla.form.controls).sort()).toEqual([
        'filtroArea', 'filtroBuscar', 'filtroEstado', 'filtroTipo',
      ]);
    });

    it('Tipo y Área ofrecen "Todos"/"Todas" adelante, con el género de cada uno', async () => {
      await montarConCatalogos([]);

      // El rótulo difiere por género, igual que en React: no es un descuido que valga unificar.
      expect(objPantalla['cllOpcionesTipo']()).toEqual([
        { value: '', label: 'Todos' },
        { value: '1', label: 'Queja' },
        { value: '2', label: 'Petición' },
      ]);
      expect(objPantalla['cllOpcionesArea']()).toEqual([
        { value: '', label: 'Todas' },
        { value: '35', label: 'Siniestros Autos' },
      ]);
    });

    it('la tabla resuelve el Tipo a su descripción, no al código', async () => {
      await montarConCatalogos([request(1, { qd_strSfcCode: 'AAA-1', qd_strRequestType: '1' })]);

      // El mapa código→descripción llega hasta la celda. Con el catálogo sin cargar caería al código,
      // que es información pero no la que el supervisor lee.
      const cllCeldas = Array.from(
        objFixture.nativeElement.querySelectorAll('lib-table-z tbody tr td') as NodeListOf<HTMLElement>,
      ).map((in_objTd) => (in_objTd.textContent ?? '').trim());
      expect(cllCeldas).toContain('Queja');
      expect(cllCeldas).not.toContain('1');
    });
  });

  it('el conteo de SAMPLE_CASES sigue siendo 8, que es lo que asumen los casos de arriba', () => {
    // Guarda de fixture, no una regla de la pantalla: varios casos de este archivo aseveran
    // "Mostrando 1–8 de 8 casos" contra el fallback. Si alguien agrega un noveno caso de ejemplo,
    // esos casos fallarían con un diff de texto que no dice por qué — este lo dice.
    expect(SAMPLE_CASES).toHaveLength(SCR013_PAGE_SIZE);
    const cllEstados = SAMPLE_CASES.map((in_objC: CasoDashboard) => in_objC.estado);
    expect(cllEstados.filter((in_str) => in_str === 'Cancelada')).toHaveLength(1);
  });
});
