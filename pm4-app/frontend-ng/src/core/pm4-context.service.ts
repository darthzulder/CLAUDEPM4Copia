import { inject, Injectable, InjectionToken } from '@angular/core';
import { VITE_CASE_ID, VITE_PM4_TOKEN, VITE_TASK_ID } from '../env.generated';

/** Los tres fallbacks de entorno, tal como los deja `scripts/gen-env-define.mjs`. */
export interface Pm4EnvFallbacks {
  readonly token: string;
  readonly taskId: string;
  readonly caseId: string;
}

/**
 * Los fallbacks de entorno, inyectables.
 *
 * **Por qué un token de DI y no leer `env.generated` directo desde el servicio:** el builder de
 * Angular 21 **prohíbe `vi.mock()` sobre imports relativos** (`Error: The "vi.mock" and related
 * methods are not supported for relative imports with the Angular unit-test system. Please use
 * Angular TestBed for mocking dependencies.`), así que un `import` directo del módulo generado sería
 * imposible de sustituir en un spec. Y testearlo contra el archivo real no sirve: en este árbol sale
 * con los tres valores en `''` porque no hay `.env`, de modo que "el fallback funciona" y "el fallback
 * no existe" darían el mismo verde — y en la máquina de un dev con `.env` cargado, los casos de
 * ausencia se pondrían rojos por estado local.
 *
 * Con el token, el spec provee los valores que quiere y el default de producción sigue viniendo del
 * archivo generado sin que ninguna pantalla tenga que enterarse.
 */
export const PM4_ENV_FALLBACKS = new InjectionToken<Pm4EnvFallbacks>('PM4_ENV_FALLBACKS', {
  providedIn: 'root',
  factory: (): Pm4EnvFallbacks => ({
    token: VITE_PM4_TOKEN,
    taskId: VITE_TASK_ID,
    caseId: VITE_CASE_ID,
  }),
});

/**
 * Contexto de la sesión PM4: de dónde salen el token, el `task_id`, el `case_id`, el `process_id` y
 * el `event_id` con los que la app arranca. Reemplaza a `core/useToken.ts` de React (los cinco hooks
 * `useToken`/`useTaskId`/`useCaseId`/`useProcessId`/`useEventId` más `pm4TasksUrl`).
 *
 * ── Por qué un servicio y no cinco funciones sueltas ────────────────────────────────────────────
 * En React eran hooks porque era la única forma de que un componente los llamara. Acá no hacen falta
 * hooks, pero tampoco conviene dejarlas como funciones exportadas: al ser un `@Injectable`, un spec
 * de pantalla puede sustituir el contexto entero con `provideZ`/`useValue` en vez de mockear
 * `window.location`, que es global y frágil. Los servicios que vienen en esta misma fase
 * (`TaskService` y compañía) lo inyectan en lugar de leer la query string cada uno por su cuenta.
 *
 * ── El orden de resolución es contrato, no preferencia ──────────────────────────────────────────
 * **Query string primero, entorno después.** En producción PM4 arma la URL del iframe con
 * `?token=&task_id=...`; el fallback de entorno existe **solo** para desarrollo local, donde no hay
 * PM4 emitiendo esa URL. Invertido, un `.env` olvidado pisaría el token real de la tarea en
 * producción — un fallo que se manifestaría como "la pantalla carga la tarea de otro".
 *
 * ── El matiz del `??`, que hay que preservar tal cual ───────────────────────────────────────────
 * `URLSearchParams.get()` devuelve `''` para un parámetro **presente pero vacío** (`?token=`) y
 * `null` solo si **falta**. Como el operador es `??` y no `||`, `?token=` resuelve a `''` y **no**
 * consulta el entorno. Es el comportamiento que tiene React hoy y se porta sin cambios: un
 * `?token=` vacío en la URL es una señal de que PM4 mandó la URL sin token, y taparlo con el
 * `.env` de dev escondería el problema en vez de mostrarlo. Va con caso de test dedicado, porque es
 * exactamente la clase de detalle que un "refactor de limpieza" a `||` rompe sin que nada se note.
 *
 * ── Por qué `process_id`/`event_id` no tienen fallback de entorno ────────────────────────────────
 * `useToken.ts` los lee de `VITE_PROCESS_ID`/`VITE_EVENT_ID`, pero **esas variables no existen**:
 * no están declaradas en `.env.example`, cuyas líneas 15-19 dicen que los IDs de proceso/colección/
 * script ya no se configuran por entorno — viven en `pm4-registry.json` y se resuelven por nombre
 * (regla 6 de pm4-app/CLAUDE.md). O sea que en React esa rama de fallback está muerta por diseño:
 * lee siempre `undefined` y cae al `?? ''`. Portarla sería recrear deuda que el proyecto ya sacó, así
 * que estos dos métodos leen **solo** la query string. Si algún día hace falta un default, el lugar
 * es el registro, no una variable de entorno nueva.
 */
@Injectable({ providedIn: 'root' })
export class Pm4ContextService {
  // Los fallbacks entran por DI para que un spec pueda fijarlos — ver el comentario de
  // `PM4_ENV_FALLBACKS`. En producción los provee su factory desde `env.generated.ts`.
  private readonly objEnv = inject(PM4_ENV_FALLBACKS);

  /**
   * Lee un parámetro de la query string actual.
   *
   * Se relee `window.location.search` en cada llamada en vez de cachearlo en el constructor: el
   * servicio es singleton (`providedIn: 'root'`), así que un valor capturado al arrancar quedaría
   * pegado para toda la vida de la app. Hoy nada cambia la URL sin recargar, pero cachear crearía un
   * acoplamiento invisible a ese supuesto.
   */
  private leerParam(in_strClave: string): string | null {
    return new URLSearchParams(window.location.search).get(in_strClave);
  }

  /** Token PM4 de la sesión. `?token=` → `VITE_PM4_TOKEN` → `''`. */
  public token(): string {
    return this.leerParam('token') ?? this.objEnv.token;
  }

  /**
   * `true` cuando el token en uso salió del `.env` y no de la URL — o sea, el token de desarrollo.
   *
   * Es lo que dispara el banner de advertencia de la raíz, portado de
   * `frontend/src/App.tsx:126`:
   *
   *     const blnUsingDebugToken = !objParams.get('token') && !!import.meta.env.VITE_PM4_TOKEN;
   *
   * ── Por qué vive acá y no en el componente raíz ─────────────────────────────────────────────
   * Porque es la **única** pregunta que necesita ver los dos lados por separado, y `token()` ya los
   * colapsó en un string: desde afuera no hay forma de saber si un token no vacío vino del query
   * param o del entorno. Ponerlo en el componente obligaría a leer `window.location.search` ahí y a
   * importar `env.generated` fuera de este servicio, que es justo el acoplamiento que el token de DI
   * existe para evitar.
   *
   * ⚠ **Es `!` y no `?? ''`, a diferencia de `token()` — y ahí hay un defecto preexistente que se
   * porta a propósito.** Con un `?token=` presente pero vacío los dos métodos divergen:
   *
   * - `token()` usa `??`, así que el `''` se conserva y el entorno **no** se consulta: no hay token.
   * - este método usa `!`, y `!''` es `true`, así que **sí** reporta token de debug.
   *
   * O sea que con `?token=` el banner dice "estás usando el token de debug" cuando en realidad no se
   * está usando **ninguno**, y todas las llamadas a PM4 van a fallar por falta de credencial. El
   * banner manda a mirar el `.env` cuando el problema está en la URL que emitió PM4.
   *
   * Es exactamente lo que hace React hoy (`!objParams.get('token')` con `''` da `true`), y se porta
   * igual porque esto es una migración de framework: arreglarlo acá sería un cambio funcional de
   * contrabando. Queda fijado por spec para que el arreglo, cuando se decida, sea explícito.
   */
  public usandoTokenDeDebug(): boolean {
    return !this.leerParam('token') && !!this.objEnv.token;
  }

  /** Id de la tarea a cargar. `?task_id=` → `VITE_TASK_ID` → `''`. */
  public taskId(): string {
    return this.leerParam('task_id') ?? this.objEnv.taskId;
  }

  /**
   * Id del caso. `?case_id=` → `VITE_CASE_ID` → `''`.
   *
   * Es la vía alternativa a `task_id`: PM4 manda uno o el otro según el nodo, y `TaskService`
   * resuelve la tarea activa a partir del caso cuando llega por acá.
   */
  public caseId(): string {
    return this.leerParam('case_id') ?? this.objEnv.caseId;
  }

  /** Id del proceso a iniciar (web entry). Solo query string — ver el encabezado. */
  public processId(): string {
    return this.leerParam('process_id') ?? '';
  }

  /** Id del nodo BPMN de arranque (web entry). Solo query string — ver el encabezado. */
  public eventId(): string {
    return this.leerParam('event_id') ?? '';
  }

  /**
   * URL de la bandeja de tareas de PM4. Cuatro pantallas de la Fase 5 (SCR-003 de Otras Solicitudes,
   * SCR-0051, SCR-0052 y SCR-009) la usan para sacar al usuario del iframe con
   * `window.top.location.href = ...` una vez completada la tarea.
   *
   * ⚠ **DEFECTO PREEXISTENTE DE LA APP REACT, portado a propósito sin arreglar.** El original
   * (`useToken.ts:47`) arma la URL así:
   *
   *     const base = (import.meta.env.VITE_PM4_BASE_URL ?? '').replace(/\/$/, '');
   *     return `${base}/tasks`;
   *
   * y **`VITE_PM4_BASE_URL` no existe**: no está declarada en `.env.example` ni en ningún `.env` del
   * repo, y es el único lugar del código que la lee (verificado por grep sobre `frontend/src`; la que
   * sí existe es `PM4_BASE_URL`, sin el prefijo `VITE_`, y es del backend — el front no la ve). O sea
   * que `base` es siempre `''` y esto devuelve **`'/tasks'`**, una ruta relativa que el navegador
   * resuelve contra el host de *esta app*, no contra PM4: desde Render termina en
   * `https://<host-de-la-app>/tasks`, que no es la bandeja.
   *
   * Se porta **con el mismo comportamiento** porque esta es una migración de framework y arreglarlo
   * acá sería un cambio funcional de contrabando (el plan lo prohíbe explícitamente: un bug de la app
   * React se reporta y se decide aparte). El fix real no es una variable de entorno nueva sino
   * resolver la instancia contra el backend, que es el único que conoce `PM4_BASE_URL` — regla 3.
   *
   * El spec fija el `'/tasks'` actual, así que si alguien lo arregla el test se pone rojo y obliga a
   * decidirlo de frente en vez de que el cambio pase inadvertido.
   */
  public urlBandejaTareas(): string {
    return '/tasks';
  }
}
