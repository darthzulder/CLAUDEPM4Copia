import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PM4_ENV_FALLBACKS, Pm4ContextService } from './pm4-context.service';

/**
 * **Spec nuevo, no portado: `core/useToken.ts` NO tenía tests en React** (verificado buscando
 * `*[Tt]oken*test*` en `frontend/src/core/` — no existe ninguno). Así que acá no hay paridad de casos
 * que medir; lo que hay es cobertura de lo que el original nunca cubrió y que la migración no puede
 * permitirse romper en silencio:
 *
 * 1. **El orden query string → entorno**, que es el contrato de producción.
 * 2. **El matiz del `??`**: `?token=` presente-pero-vacío resuelve a `''` y NO consulta el entorno.
 *    Es la diferencia entre `??` y `||`, y es exactamente lo que un "refactor de limpieza" rompe.
 * 3. **Que `process_id`/`event_id` NO tengan fallback de entorno**, porque sus variables no existen
 *    (ver el encabezado del servicio).
 * 4. **El defecto preexistente de `urlBandejaTareas()`**, fijado para que arreglarlo sea una decisión
 *    explícita y no un cambio silencioso.
 *
 * ── Cómo se sustituye el entorno, y por qué NO con `vi.mock` ────────────────────────────────────
 * Los tres fallbacks vienen de `src/env.generated.ts`, un archivo **generado** por
 * `scripts/gen-env-define.mjs` que en este árbol sale con los tres valores en `''` (no hay `.env`
 * local, está gitignoreado). Testear el fallback contra el archivo real sería testear "vacío devuelve
 * vacío", que no distingue un fallback que funciona de uno que no existe; y en la máquina de un dev
 * con `.env` cargado, los casos de ausencia se pondrían rojos por estado local.
 *
 * La vía obvia sería `vi.mock('../env.generated', ...)`, y **no funciona**: el builder de Angular 21
 * la rechaza con `Error: The "vi.mock" and related methods are not supported for relative imports with
 * the Angular unit-test system. Please use Angular TestBed for mocking dependencies.` Es una
 * restricción del runner, no un error de configuración — vale saberlo porque el mensaje aparece como
 * fallo de la **suite entera** (`0 test`), que se lee como si el archivo estuviera roto.
 *
 * Por eso el servicio recibe los fallbacks por `PM4_ENV_FALLBACKS` y acá se proveen con `useValue`.
 * Los valores son deliberadamente reconocibles para que una aserción que pasa por casualidad (p. ej.
 * contra `''`) no se confunda con una que prueba el fallback de verdad.
 */

const OBJ_ENV_FALSO = {
  token: 'token-de-entorno',
  taskId: 'task-de-entorno',
  caseId: 'case-de-entorno',
} as const;

/**
 * Reemplaza el query string del `window.location` de jsdom.
 *
 * Mismo mecanismo que `api/pm4Client.spec.ts`: jsdom permite navegar dentro del mismo origen sin
 * recargar, así que `history.replaceState` alcanza y evita stubear `window.location` entero (que en
 * jsdom es propiedad no configurable y obliga a `Object.defineProperty` con efectos colaterales).
 */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

let objCtx: Pm4ContextService;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [{ provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_FALSO }],
  });
  objCtx = TestBed.inject(Pm4ContextService);
});

afterEach(() => {
  // Se deja la URL limpia: es estado global del entorno de jsdom y se comparte con el resto del
  // archivo, así que una query string colgada haría que el orden de ejecución importe.
  fijarQueryString('');
});

describe('Pm4ContextService · la query string gana sobre el entorno', () => {
  it('token/task_id/case_id salen de la URL cuando están presentes', () => {
    fijarQueryString('?token=tok-url&task_id=77&case_id=cas-url');
    expect(objCtx.token()).toBe('tok-url');
    expect(objCtx.taskId()).toBe('77');
    expect(objCtx.caseId()).toBe('cas-url');
  });

  it('un valor de la URL pisa al del entorno, no se combinan', () => {
    // Vale aseverarlo explícitamente: si el orden estuviera invertido, el test de arriba pasaría
    // igual cuando el entorno estuviera vacío. Acá los dos existen y solo uno puede ganar.
    fijarQueryString('?token=tok-url');
    expect(objCtx.token()).toBe('tok-url');
    expect(objCtx.token()).not.toBe('token-de-entorno');
  });
});

describe('Pm4ContextService · el entorno es el fallback de desarrollo', () => {
  it('sin parámetro en la URL, los tres caen a su variable de entorno', () => {
    fijarQueryString('');
    expect(objCtx.token()).toBe('token-de-entorno');
    expect(objCtx.taskId()).toBe('task-de-entorno');
    expect(objCtx.caseId()).toBe('case-de-entorno');
  });

  it('cada parámetro resuelve por separado: uno en la URL no arrastra a los otros', () => {
    fijarQueryString('?task_id=42');
    expect(objCtx.taskId()).toBe('42');
    expect(objCtx.token()).toBe('token-de-entorno');
    expect(objCtx.caseId()).toBe('case-de-entorno');
  });
});

describe('Pm4ContextService · el matiz del ?? (presente pero vacío)', () => {
  it('`?token=` vacío devuelve \'\' y NO consulta el entorno', () => {
    // `URLSearchParams.get()` devuelve '' para un parámetro presente-pero-vacío y null solo si
    // falta. Con `??` el '' se conserva; con `||` caería al entorno. La diferencia importa: un
    // `?token=` vacío significa que PM4 emitió la URL sin token, y taparlo con el `.env` de dev
    // esconde ese problema en producción en vez de mostrarlo.
    fijarQueryString('?token=');
    expect(objCtx.token()).toBe('');
  });

  it('lo mismo para task_id y case_id vacíos', () => {
    fijarQueryString('?task_id=&case_id=');
    expect(objCtx.taskId()).toBe('');
    expect(objCtx.caseId()).toBe('');
  });
});

describe('Pm4ContextService · usandoTokenDeDebug (el banner de la raíz)', () => {
  /**
   * Port de `frontend/src/App.tsx:126`:
   *
   *     const blnUsingDebugToken = !objParams.get('token') && !!import.meta.env.VITE_PM4_TOKEN;
   *
   * Es la única pregunta del servicio que necesita ver los dos lados **sin colapsar**: `token()` ya
   * los fusionó en un string, así que desde afuera no hay forma de distinguir un token que vino de la
   * URL de uno que vino del `.env`. De ahí que viva acá y no en el componente raíz.
   *
   * Los cuatro casos son las cuatro combinaciones de (token en URL) × (token en entorno), y el que
   * importa de verdad es el tercero.
   */
  it('sin token en la URL y con token en el entorno: SÍ es token de debug', () => {
    fijarQueryString('');
    expect(objCtx.usandoTokenDeDebug()).toBe(true);
  });

  it('con token en la URL: NO es token de debug, aunque el entorno también tenga uno', () => {
    // El caso de producción: PM4 mandó el token en el iframe. Que el `.env` de la máquina tenga uno
    // es irrelevante — `token()` ni lo mira — y pintar el banner acá sería una advertencia falsa.
    fijarQueryString('?token=token-real-de-pm4');
    expect(objCtx.usandoTokenDeDebug()).toBe(false);
  });

  it('⚠ `?token=` presente pero VACÍO: SÍ pinta el banner, y el banner MIENTE', () => {
    // **El caso donde este método y `token()` divergen, y hay que tenerlo claro para no "arreglarlo".**
    //
    // `token()` usa `??`, así que un `?token=` presente-pero-vacío resuelve a `''` y **no** consulta
    // el entorno: la app se queda sin token. Pero este método usa `!`, y `!''` es `true`, así que
    // reporta que se está usando el token de debug — cuando en realidad no se está usando **ninguno**.
    //
    // Es un **defecto preexistente de la app React**, portado a propósito sin arreglar
    // (`frontend/src/App.tsx:126` hace exactamente `!objParams.get('token') && !!VITE_PM4_TOKEN`).
    // Consecuencia real: con un `?token=` vacío el iframe muestra "usando token de debug" mientras
    // todas las llamadas a PM4 fallan por falta de credencial — el banner manda a mirar el `.env`
    // cuando el problema está en la URL que emitió PM4.
    //
    // Se fija tal cual porque esto es una migración de framework: arreglarlo acá sería un cambio
    // funcional de contrabando (el plan lo prohíbe explícitamente). Este test es lo que hace que el
    // arreglo, cuando se decida, sea una decisión explícita y no un cambio silencioso — igual que el
    // de `urlBandejaTareas()` más abajo.
    fijarQueryString('?token=');
    expect(objCtx.usandoTokenDeDebug()).toBe(true);
  });

  it('sin token en ningún lado: NO es token de debug', () => {
    // Se re-provee el entorno vacío para este caso puntual: el `OBJ_ENV_FALSO` del `beforeEach` trae
    // token, y sin sustituirlo esta rama del `&&` no se ejercitaría nunca.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PM4_ENV_FALLBACKS, useValue: { token: '', taskId: '', caseId: '' } }],
    });
    fijarQueryString('');

    // No hay token de debug porque no hay token: el banner advierte de estar usando el de desarrollo,
    // no de la ausencia de credenciales (que se manifiesta sola, como un 401 de PM4).
    expect(TestBed.inject(Pm4ContextService).usandoTokenDeDebug()).toBe(false);
  });
});

describe('Pm4ContextService · process_id y event_id son solo query string', () => {
  it('los lee de la URL cuando están', () => {
    fijarQueryString('?process_id=31&event_id=node_12');
    expect(objCtx.processId()).toBe('31');
    expect(objCtx.eventId()).toBe('node_12');
  });

  it('sin URL devuelven \'\' — no existe VITE_PROCESS_ID/VITE_EVENT_ID a la cual caer', () => {
    // `useToken.ts` de React lee `VITE_PROCESS_ID`/`VITE_EVENT_ID`, pero esas variables no están
    // declaradas en `.env.example` (cuyas líneas 15-19 dicen que los IDs de proceso/colección/script
    // ya no se configuran por entorno: viven en `pm4-registry.json`, regla 6). O sea que esa rama de
    // fallback está muerta por diseño en el original, y no se porta. Este test lo fija: si alguien
    // "completa" el port agregando esas dos variables, se pone rojo y obliga a leer el porqué.
    fijarQueryString('');
    expect(objCtx.processId()).toBe('');
    expect(objCtx.eventId()).toBe('');
  });
});

describe('Pm4ContextService · urlBandejaTareas (defecto preexistente fijado)', () => {
  it('devuelve \'/tasks\' — el mismo valor que produce hoy la app React', () => {
    // NO es el comportamiento deseable, es el comportamiento ACTUAL. En React la URL se arma con
    // `VITE_PM4_BASE_URL`, que no está declarada en ningún `.env` del repo y es leída en un único
    // lugar, así que la base queda en '' y el resultado es la ruta relativa '/tasks' — que el
    // navegador resuelve contra el host de esta app, no contra PM4. Se porta igual porque esto es
    // una migración de framework: arreglarlo acá sería un cambio funcional de contrabando.
    // Este test existe para que el arreglo, cuando se decida, sea explícito y no silencioso.
    expect(objCtx.urlBandejaTareas()).toBe('/tasks');
  });

  it('no depende de la query string ni del entorno', () => {
    fijarQueryString('?token=tok&task_id=1');
    expect(objCtx.urlBandejaTareas()).toBe('/tasks');
  });
});

describe('Pm4ContextService · relee la URL en cada llamada', () => {
  it('un cambio de query string se refleja sin recrear el servicio', () => {
    // El servicio es singleton (`providedIn: 'root'`), así que si cacheara la query string en el
    // constructor el primer valor quedaría pegado para toda la vida de la app. Hoy nada cambia la
    // URL sin recargar, pero cachear crearía un acoplamiento invisible a ese supuesto.
    fijarQueryString('?task_id=1');
    expect(objCtx.taskId()).toBe('1');
    fijarQueryString('?task_id=2');
    expect(objCtx.taskId()).toBe('2');
  });
});
