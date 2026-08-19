/**
 * Specs del cliente HTTP del BFF.
 *
 * El valor de estos tests no es "el interceptor pone un header" (trivial), sino las dos
 * cosas que la regla 3 de CLAUDE.md prohíbe y que un interceptor global hace fácil romper
 * sin darse cuenta: que el token viaje hacia un host externo, y que el orden de resolución
 * del token se invierta y un `.env` de desarrollo pise el token real de la tarea.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PM4_ENV_FALLBACKS, Pm4ContextService } from '../core/pm4-context.service';
import { interceptorPm4Token, resolverToken, urlApi, STR_BASE_API } from './pm4Client';

/**
 * El entorno se fija vacío por DI, y **no** es redundante con que hoy salga vacío igual.
 *
 * `resolverToken()` delega en `Pm4ContextService`, que cae a los fallbacks de `PM4_ENV_FALLBACKS` —
 * cuyo default lee `src/env.generated.ts`, un archivo generado desde `pm4-app/.env`. En este árbol
 * sale vacío (no hay `.env`, está gitignoreado), así que los casos de "no hay token" pasarían solos;
 * **en la máquina de un dev con `VITE_PM4_TOKEN` cargado se pondrían rojos**, por estado local ajeno
 * al código. Proveerlo vacío hace que estos tests dependan solo de la query string, que es lo que
 * dicen probar.
 *
 * (`vi.mock('../env.generated')` sería la vía obvia y el builder de Angular 21 la **prohíbe** para
 * imports relativos: obliga a `TestBed`, que es justamente lo que se usa acá. El fallback de entorno
 * en sí se cubre en `core/pm4-context.service.spec.ts`, que es su dueño.)
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;
const LST_PROVIDERS_ENV = [{ provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO }];

/**
 * Reemplaza el query string del `window.location` de jsdom.
 *
 * `resolverToken()` lee `window.location.search` directo (igual que el `useToken` de React),
 * y jsdom permite navegar dentro del mismo origen sin recargar, así que `history.replaceState`
 * es suficiente y no hace falta stubear `window.location` entero — que en jsdom es propiedad
 * no configurable y obliga a `Object.defineProperty` con efectos colaterales.
 */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

describe('urlApi', () => {
  it('prefija con /api', () => {
    expect(urlApi('tasks/1')).toBe('/api/tasks/1');
  });

  it('acepta la ruta con barra inicial y no duplica la barra', () => {
    // Es el caso que axios normalizaba solo y HttpClient no: el código portado desde React
    // usa las dos formas indistintamente, y `//api//tasks` no lo proxea el dev-server.
    expect(urlApi('/tasks/1')).toBe('/api/tasks/1');
    expect(urlApi('///tasks/1')).toBe('/api/tasks/1');
  });
});

describe('resolverToken', () => {
  let objCtx: Pm4ContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: LST_PROVIDERS_ENV });
    objCtx = TestBed.inject(Pm4ContextService);
  });

  afterEach(() => fijarQueryString(''));

  it('devuelve el token del query string del iframe', () => {
    fijarQueryString('?token=eyJabc&task_id=123');
    expect(resolverToken(objCtx)).toBe('eyJabc');
  });

  it('devuelve cadena vacía —no null— cuando no hay token en la URL ni en el entorno', () => {
    // El interceptor decide con un truthy check; un `null` acá lo obligaría a un chequeo
    // distinto y un `undefined` terminaría como header literal "undefined".
    fijarQueryString('?task_id=123');
    expect(resolverToken(objCtx)).toBe('');
  });

  it('delega en Pm4ContextService: hereda su fallback de entorno', () => {
    // Cuando este archivo se escribió (Fase 1) `resolverToken()` leía SOLO la query string, aunque su
    // comentario ya prometía el fallback de entorno — un contrato documentado que el código no
    // cumplía. Ahora delega de verdad, y esto lo asevera: sin token en la URL, sale el del entorno
    // que provee el TestBed. Es el único caso del archivo que necesita un entorno NO vacío, así que
    // arma su propio contexto en vez de usar el de arriba.
    fijarQueryString('');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PM4_ENV_FALLBACKS,
          useValue: { token: 'token-de-entorno', taskId: '', caseId: '' },
        },
      ],
    });
    expect(resolverToken(TestBed.inject(Pm4ContextService))).toBe('token-de-entorno');
  });
});

describe('interceptorPm4Token', () => {
  let objHttp: HttpClient;
  let objMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([interceptorPm4Token])),
        provideHttpClientTesting(),
        ...LST_PROVIDERS_ENV,
      ],
    });
    objHttp = TestBed.inject(HttpClient);
    objMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    objMock.verify();
    fijarQueryString('');
  });

  it('inyecta x-pm4-token en peticiones a /api/*', () => {
    fijarQueryString('?token=eyJabc');
    objHttp.get(urlApi('tasks/1')).subscribe();

    const objReq = objMock.expectOne(`${STR_BASE_API}/tasks/1`);
    expect(objReq.request.headers.get('x-pm4-token')).toBe('eyJabc');
  });

  it('NO inyecta el token en una petición a un host externo', () => {
    // Este es el test que justifica el filtro por prefijo. Un interceptor global se aplica a
    // TODA petición de HttpClient: sin el filtro, cargar un recurso de terceros (p. ej. el
    // reCAPTCHA de la Fase 4) mandaría el token de PM4 fuera del BFF. Es exactamente el modo
    // de falla que la regla 3 de CLAUDE.md existe para prevenir.
    fijarQueryString('?token=eyJabc');
    objHttp.get('https://www.google.com/recaptcha/api.js').subscribe();

    const objReq = objMock.expectOne('https://www.google.com/recaptcha/api.js');
    expect(objReq.request.headers.has('x-pm4-token')).toBe(false);
  });

  it('NO inyecta un header vacío cuando no hay token', () => {
    // Un `x-pm4-token: ''` no es inocuo: el backend lo vería presente y no caería a su
    // fallback de `PM4_TOKEN` del entorno, que es lo que sostiene el desarrollo local.
    fijarQueryString('');
    objHttp.get(urlApi('tasks/1')).subscribe();

    const objReq = objMock.expectOne(`${STR_BASE_API}/tasks/1`);
    expect(objReq.request.headers.has('x-pm4-token')).toBe(false);
  });

  it('no confunde una URL que apenas empieza parecido con /api', () => {
    // `startsWith('/api')` a secas dejaría pasar `/apiexterna/...`. El código usa
    // `startsWith('/api/')` con la barra, y esto lo fija.
    fijarQueryString('?token=eyJabc');
    objHttp.get('/apiexterna/cosa').subscribe();

    const objReq = objMock.expectOne('/apiexterna/cosa');
    expect(objReq.request.headers.has('x-pm4-token')).toBe(false);
  });
});
