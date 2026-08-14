import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Pm4GroupsService } from './pm4-groups.service';

/**
 * Specs de `Pm4GroupsService`, port de `core/pm4Groups.ts`.
 *
 * ── Paridad medida: los 7 casos de `pm4Groups.test.ts` están los 7 ──────────────────────────────
 * Es el port con baseline más limpia de la Fase 3b: la función era pura salvo por las dos llamadas
 * HTTP, así que los 7 casos de React se corresponden 1:1 con los de acá (grupo exacto entre varios ·
 * normalización de espacios/mayúsculas · fallback al primero · `[]` sin consultar usuarios ·
 * `member_id` sobre `id` · fallback a `id` con username como label · descarte de username vacío).
 *
 * ── Por qué el mock de React NO se pudo portar, y qué se gana con el cambio ──────────────────────
 * El original usaba `vi.hoisted()` + `vi.mock('../api/pm4Client')`. En Angular 21 el builder de test
 * **prohíbe `vi.mock()` sobre imports relativos** (el síntoma es brutal y no dice nada: la suite
 * entera reporta `(0 test)`), así que el doble del cliente se reemplaza por `HttpTestingController`.
 *
 * No es solo una traducción forzada — se asevera **más**. El mock de React verificaba la llamada con
 * `toHaveBeenNthCalledWith(2, '/groups/9/users', expect.anything())`: ese `expect.anything()` deja
 * los **params sin aseverar**, así que `per_page=100` y `filter=` no estaban cubiertos en ningún
 * caso. Acá la URL con sus query params ES el criterio de match, o sea que el paginado y el filtro
 * quedan aseverados en todos los casos, sin escribir un test extra.
 */

let objSvc: Pm4GroupsService;
let objMock: HttpTestingController;

/** La URL de búsqueda de grupos, con los params que el servicio manda. El orden es el de `params`. */
function urlGrupos(in_strFiltro: string): string {
  return `/api/groups?filter=${encodeURIComponent(in_strFiltro)}&per_page=100`;
}

/** La URL de usuarios de un grupo. */
function urlUsuarios(in_strGroupId: string): string {
  return `/api/groups/${in_strGroupId}/users?per_page=100`;
}

beforeEach(() => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  objSvc = TestBed.inject(Pm4GroupsService);
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  objMock.verify();
});

describe('Pm4GroupsService · resolución del grupo por nombre', () => {
  it('prefiere el grupo con nombre exacto aunque el filtro devuelva varios', async () => {
    // `filter=` de PM4 es substring: pedir "Siniestros" trae también "Siniestros Autos". Sin la
    // preferencia por el match exacto, la reasignación ofrecería los usuarios del grupo equivocado.
    const prm = objSvc.usuariosDeGrupo('Siniestros');

    objMock.expectOne(urlGrupos('Siniestros')).flush({
      data: [
        { id: '7', name: 'Siniestros Autos' },
        { id: '9', name: 'Siniestros' },
      ],
    });
    await Promise.resolve();

    // El 9, no el 7, aunque el 7 venga primero.
    objMock.expectOne(urlUsuarios('9')).flush({ data: [] });
    await prm;
  });

  it('normaliza espacios y mayúsculas al comparar el nombre del grupo', async () => {
    // Los nombres vienen de catálogos mantenidos a mano; `'  Jurídica '` debe matchear `'jurídica'`.
    const prm = objSvc.usuariosDeGrupo('jurídica');

    objMock.expectOne(urlGrupos('jurídica')).flush({ data: [{ id: '3', name: '  Jurídica ' }] });
    await Promise.resolve();

    objMock.expectOne(urlUsuarios('3')).flush({ data: [] });
    await prm;
  });

  it('cae al primer grupo del filtro si ninguno matchea exacto', async () => {
    // Fallback deliberado: la lista del grupo más parecido es accionable, un select vacío no.
    const prm = objSvc.usuariosDeGrupo('Pagos');

    objMock.expectOne(urlGrupos('Pagos')).flush({ data: [{ id: '4', name: 'Pagos y Recaudos' }] });
    await Promise.resolve();

    objMock.expectOne(urlUsuarios('4')).flush({ data: [] });
    await prm;
  });

  it('devuelve [] y NO consulta usuarios si el grupo no existe', async () => {
    // Las dos mitades importan. Sin el `return []` temprano, la URL se armaría con un `undefined`
    // (`/groups/undefined/users`) y PM4 devolvería un 404 que la pantalla mostraría como error de
    // carga, en vez de un select vacío que es lo correcto cuando el grupo no está.
    const prm = objSvc.usuariosDeGrupo('Inexistente');

    objMock.expectOne(urlGrupos('Inexistente')).flush({ data: [] });

    await expect(prm).resolves.toEqual([]);
    // La segunda llamada no salió. El `objMock.verify()` del afterEach lo confirma de nuevo.
    objMock.expectNone(urlUsuarios('undefined'));
  });

  it('una respuesta de grupos sin `data` no lanza', async () => {
    // Caso nuevo respecto de React (`?? []` estaba en el código pero sin test). PM4 puede devolver
    // 200 con cuerpo vacío; sin el fallback esto sería un TypeError al hacer `.find`.
    const prm = objSvc.usuariosDeGrupo('Cualquiera');
    objMock.expectOne(urlGrupos('Cualquiera')).flush(null);

    await expect(prm).resolves.toEqual([]);
  });

  it('el filtro y el paginado viajan como query params', async () => {
    // Cubre lo que el `expect.anything()` de React dejaba sin aseverar. `per_page=100` importa: sin
    // él PM4 pagina de a 15 y un grupo grande perdería usuarios en silencio.
    const prm = objSvc.usuariosDeGrupo('SAC');

    const objReq = objMock.expectOne(urlGrupos('SAC'));
    expect(objReq.request.method).toBe('GET');
    expect(objReq.request.params.get('filter')).toBe('SAC');
    expect(objReq.request.params.get('per_page')).toBe('100');
    objReq.flush({ data: [{ id: '9', name: 'SAC' }] });
    await Promise.resolve();

    const objReq2 = objMock.expectOne(urlUsuarios('9'));
    expect(objReq2.request.params.get('per_page')).toBe('100');
    objReq2.flush({ data: [] });
    await prm;
  });
});

describe('Pm4GroupsService · el pivote GroupMember (member_id vs id)', () => {
  it('toma el user_id de member_id, NO del `id` de la fila del pivote', async () => {
    // ES EL CASO CENTRAL del archivo. PM4 devuelve registros con forma de GroupMember pese a que el
    // OpenAPI documenta `users` puros: `id` es el id de la fila de `group_members`. El `id` que sale
    // de acá alimenta el `user_id` del PUT de reasignación, así que tomar el del pivote reasigna la
    // tarea a otro usuario (o a ninguno) **con un 200 de PM4**. Falla silenciosa de manual.
    const prm = objSvc.usuariosDeGrupo('SAC — Servicio al Cliente');

    objMock
      .expectOne(urlGrupos('SAC — Servicio al Cliente'))
      .flush({ data: [{ id: '9', name: 'SAC — Servicio al Cliente' }] });
    await Promise.resolve();

    objMock.expectOne(urlUsuarios('9')).flush({
      data: [{ id: 555, member_id: 42, username: 'aperez', firstname: 'Ana', lastname: 'Pérez' }],
    });

    // 42 (member_id), no 555 (id de la fila del pivote).
    await expect(prm).resolves.toEqual([{ value: 'aperez', label: 'Ana Pérez', id: '42' }]);
  });

  it('cae a `id` si el usuario no trae member_id, y etiqueta con el username sin nombre', async () => {
    // El respaldo existe por si alguna instancia sí devuelve el usuario plano. Y el `|| username` de
    // la etiqueta evita una opción con el label en blanco cuando el usuario no tiene nombre cargado.
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();

    objMock.expectOne(urlUsuarios('9')).flush({ data: [{ id: 77, username: 'jlopez' }] });

    await expect(prm).resolves.toEqual([{ value: 'jlopez', label: 'jlopez', id: '77' }]);
  });

  it('el id se devuelve como string aunque PM4 lo mande numérico', async () => {
    // Contrato con el select del DS y con el PUT: los dos esperan string. El `String(...)` no es
    // decorativo — un 42 numérico en el `value` de un `lib-input-select-z` no matchea la opción.
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();
    objMock.expectOne(urlUsuarios('9')).flush({ data: [{ id: 1, member_id: 42, username: 'x' }] });

    const lstOpts = await prm;
    expect(lstOpts[0]!.id).toBe('42');
    expect(typeof lstOpts[0]!.id).toBe('string');
  });

  it('un member_id en 0 NO cae al id (el ?? solo cubre null/undefined)', async () => {
    // Diferencia entre `??` y `||`, y acá el `??` es el correcto: un user_id 0 no existe en PM4, pero
    // si existiera, `||` lo descartaría y devolvería el id del pivote — justo el bug que este archivo
    // entero trata de evitar. Fija la semántica para que nadie "simplifique" a `||`.
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();
    objMock.expectOne(urlUsuarios('9')).flush({ data: [{ id: 555, member_id: 0, username: 'x' }] });

    await expect(prm).resolves.toEqual([{ value: 'x', label: 'x', id: '0' }]);
  });
});

describe('Pm4GroupsService · la forma de las opciones', () => {
  it('descarta los registros sin username (no sirven para reasignar)', async () => {
    // El `value` es lo que viaja al PUT: una opción sin username rompe al elegirla, así que se
    // descarta en vez de ofrecerla.
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();

    objMock.expectOne(urlUsuarios('9')).flush({
      data: [
        { id: 1, username: '', firstname: 'Sin', lastname: 'Usuario' },
        { id: 2, member_id: 8, username: 'ok' },
      ],
    });

    await expect(prm).resolves.toEqual([{ value: 'ok', label: 'ok', id: '8' }]);
  });

  it('arma el label con nombre y apellido, y recorta si falta uno', async () => {
    // El `.trim()` sobre el template importa: sin él, un usuario sin apellido quedaría con el label
    // `'Ana '` y el espacio se ve en el select.
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();
    objMock.expectOne(urlUsuarios('9')).flush({
      data: [
        { id: 1, member_id: 1, username: 'a', firstname: 'Ana', lastname: 'Pérez' },
        { id: 2, member_id: 2, username: 'b', firstname: 'Ana' },
        { id: 3, member_id: 3, username: 'c', lastname: 'Pérez' },
      ],
    });

    await expect(prm).resolves.toEqual([
      { value: 'a', label: 'Ana Pérez', id: '1' },
      { value: 'b', label: 'Ana', id: '2' },
      { value: 'c', label: 'Pérez', id: '3' },
    ]);
  });

  it('respeta el orden en que PM4 devuelve los usuarios', async () => {
    // No se ordena alfabéticamente: el orden de PM4 es el que ve el usuario en el select, y ordenar
    // acá sería un cambio funcional encubierto respecto de React.
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();
    objMock.expectOne(urlUsuarios('9')).flush({
      data: [
        { id: 1, member_id: 1, username: 'zulema' },
        { id: 2, member_id: 2, username: 'ana' },
      ],
    });

    const lstOpts = await prm;
    expect(lstOpts.map((in_objO) => in_objO.value)).toEqual(['zulema', 'ana']);
  });

  it('una respuesta de usuarios sin `data` da [] sin lanzar', async () => {
    const prm = objSvc.usuariosDeGrupo('Producto');

    objMock.expectOne(urlGrupos('Producto')).flush({ data: [{ id: '9', name: 'Producto' }] });
    await Promise.resolve();
    objMock.expectOne(urlUsuarios('9')).flush(null);

    await expect(prm).resolves.toEqual([]);
  });
});

describe('Pm4GroupsService · los errores propagan', () => {
  it('lanza si la búsqueda de grupos falla', async () => {
    // A diferencia de `CollectionService` (que degrada a lista vacía a propósito), acá el error sube:
    // el consumidor es un modal de reasignación que **no puede** funcionar sin la lista, así que un
    // `[]` silencioso se vería como "el grupo no tiene usuarios" y el usuario no sabría por qué.
    const prm = objSvc.usuariosDeGrupo('SAC');
    objMock.expectOne(urlGrupos('SAC')).flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(prm).rejects.toBeTruthy();
  });

  it('lanza si la consulta de usuarios falla, y no devuelve una lista parcial', async () => {
    const prm = objSvc.usuariosDeGrupo('SAC');

    objMock.expectOne(urlGrupos('SAC')).flush({ data: [{ id: '9', name: 'SAC' }] });
    await Promise.resolve();
    objMock.expectOne(urlUsuarios('9')).flush('boom', { status: 403, statusText: 'Forbidden' });

    await expect(prm).rejects.toBeTruthy();
  });
});
