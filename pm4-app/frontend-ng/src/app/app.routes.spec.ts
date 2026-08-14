import { Router, provideRouter, type Routes } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';
// Importada estáticamente a propósito: es el lado "esperado" de la aserción que distingue una ruta
// sana de una que resuelve `undefined`. El coste del chunk se paga igual al navegar.
import { GateFachada } from '../screens/gate-fachada/gate-fachada';

/**
 * Specs del **mecanismo** de enrutado, no del inventario de pantallas.
 *
 * La tabla tiene hoy una sola pantalla (la del gate 2) y se llena en la Fase 4. Lo que se asevera acá
 * es la pieza que la Fase 4 va a heredar y que no es obvia: la traducción de `?screen=<slug>` a un
 * path, **preservando el resto del query string**. Sin estos tests eso se descubriría con un iframe
 * que monta bien y después no encuentra la tarea, que es tres capas de distancia entre síntoma y
 * causa.
 *
 * ── Por qué todo se prueba sobre el `Router` real y no invocando el `redirectTo` a mano ─────────
 * La primera versión de este archivo llamaba a la función con un `PartialMatchRouteSnapshot` armado
 * a mano. Se descartó por dos razones: la función usa `inject(Router)` (así que necesita contexto de
 * inyección de todos modos) y, sobre todo, **el stub no puede probar lo que importa**. El bug real
 * —que devolver un string descarta el query string— vive en cómo el *router* consume el valor
 * devuelto, no en el valor en sí. Un test del valor lo habría dado por bueno.
 *
 * ── Por qué estos tests llevan `INT_TIMEOUT` y no el default de 5 s ──────────────────────────────
 * Porque navegar acá **evalúa el chunk del DS entero**, y eso no entra en 5 s. Medido, separando el
 * `import()` de la navegación en sí:
 * ```
 * import('../screens/gate-fachada/gate-fachada')  → 5804 ms   ← el coste real
 * navigateByUrl(...) con el módulo ya en caché    →   42 ms
 * ```
 * O sea que el `loadComponent` de la ruta arrastra `lib-*-z` + `za-*` y bajo jsdom la evaluación de
 * esos módulos es lo que consume el presupuesto; el router no tiene nada que ver.
 *
 * **Y por eso parecía intermitente, que es la parte que importa no volver a diagnosticar mal.** Si
 * otro spec del mismo worker ya importó el chunk, la caché de ESM lo deja en ~5 ms y el test pasa con
 * el default; si este archivo corre primero, paga los 5.8 s y se pone rojo. Dependía del orden de
 * ejecución, no de la carga de la máquina — durante un rato se anotó como "flake bajo carga, verde al
 * reintentar", y era falso: al sumar archivos de spec pasó a fallar de forma determinista, 3 de 3.
 *
 * El timeout más alto no tapa nada por sí mismo, pero al mutarlo apareció un agujero que **sí** era
 * real y que no tenía nada que ver con el tiempo: ver el test del componente resuelto, abajo.
 *
 * ── El agujero que la mutación del timeout destapó ───────────────────────────────────────────────
 * Se mutó el `loadComponent` para que resolviera a un símbolo inexistente **sin romper la
 * compilación** (`.then((m) => m['NoExiste'])`, que es `undefined` en runtime) y **la suite entera
 * quedó verde, 142/142**. O sea que este archivo aseveraba la redirección pero no que la pantalla
 * exista: el `redirectTo` actualiza la URL *antes* de que el `loadComponent` resuelva, así que
 * `objRouter.url` da bien con el componente en `undefined`. Dentro del iframe eso es una pantalla en
 * blanco — exactamente el "monta bien pero nunca carga el caso" que la cabecera dice cuidar.
 *
 * (La variante obvia —apuntar el `import()` a un archivo que no existe— la ataja `tsc` en el build,
 * así que no prueba nada sobre la suite. La que compila y falla en runtime es la que importaba.)
 *
 * Se cierra aseverando `snapshot.root.firstChild.component`, que es la clase real cuando la ruta está
 * sana y `undefined` cuando no.
 */

/**
 * Presupuesto para los tests que navegan de verdad: el `import()` del chunk del DS ronda los 6 s en
 * frío, así que 30 s dan margen para una máquina cargada sin volverse una espera indefinida.
 */
const INT_TIMEOUT = 30_000;
describe('app.routes · traducción de ?screen= a path', () => {
  let objRouter: Router;

  function crearRouter(in_cllRutas: Routes = routes): Router {
    TestBed.configureTestingModule({ providers: [provideRouter(in_cllRutas)] });
    return TestBed.inject(Router);
  }

  beforeEach(() => {
    objRouter = crearRouter();
  });

  it('traduce el slug del query param a un segmento de path', async () => {
    await objRouter.navigateByUrl('/?screen=gate-fachada');
    expect(objRouter.url).toBe('/gate-fachada');
  }, INT_TIMEOUT);

  it('⚠ el loadComponent resuelve una clase de verdad, no undefined', async () => {
    await objRouter.navigateByUrl('/?screen=gate-fachada');

    // **La aserción que faltaba.** Navegar bien y cargar la pantalla son dos cosas distintas: con un
    // `loadComponent` que resuelve a `undefined` la URL queda igual de correcta y el iframe muestra una
    // pantalla en blanco. Se compara contra la clase importada estáticamente, así que un rename del
    // símbolo exportado también se ve acá.
    const objComponente = TestBed.inject(Router).routerState.snapshot.root.firstChild?.component;
    expect(objComponente).toBe(GateFachada);
  }, INT_TIMEOUT);

  it('⚠ preserva el task_id y el token al redirigir', async () => {
    await objRouter.navigateByUrl('/?screen=gate-fachada&task_id=123&token=eyJ');

    // **El test más importante de este archivo.** PM4 manda el id de la tarea y el JWT en el query
    // string del iframe, y Angular **no** los arrastra por una redirección: con un `redirectTo` que
    // devuelve el string `/gate-fachada`, la URL final queda pelada y los dos se pierden (medido:
    // `url` → "/gate-fachada", `queryParams` → {}). Por eso la ruta devuelve un `UrlTree` con los
    // params explícitos. Si alguien lo simplifica a un string, este test se pone rojo — y es la
    // única barrera entre ese cambio y una pantalla que monta bien pero nunca carga el caso.
    expect(objRouter.url).toContain('task_id=123');
    expect(objRouter.url).toContain('token=eyJ');

    const objParams = objRouter.routerState.snapshot.root.firstChild?.queryParams ?? {};
    expect(objParams['task_id']).toBe('123');
    expect(objParams['token']).toBe('eyJ');
  }, INT_TIMEOUT);

  it('no duplica el screen en el destino', async () => {
    await objRouter.navigateByUrl('/?screen=gate-fachada&task_id=123');
    // El slug ya viajó en el path; dejarlo también en el query string daría
    // `/gate-fachada?screen=gate-fachada`, que es ruido al depurar dentro del iframe.
    expect(objRouter.url).not.toContain('screen=');
  }, INT_TIMEOUT);

  it('preserva el slug tal cual, con guiones y mayúsculas', async () => {
    // Los slugs reales de PM4 son de esta forma (`COL_QD_SCR-009_...`) y son contrato con el BPM:
    // normalizarlos a minúsculas o a kebab rompería la URL que genera el proceso. Se usa una tabla
    // con un slug de ese estilo para probar la traducción sin depender del inventario de la Fase 4;
    // hay que resetear el TestBed porque el `beforeEach` ya configuró uno con las rutas reales.
    TestBed.resetTestingModule();
    const objRouterAlias = crearRouter([
      routes[0],
      { path: 'COL_QD_SCR-010_cierre-m3', loadComponent: () => import('./app').then((m) => m.App) },
    ]);
    await objRouterAlias.navigateByUrl('/?screen=COL_QD_SCR-010_cierre-m3');
    expect(objRouterAlias.url).toBe('/COL_QD_SCR-010_cierre-m3');
  });

  it('sin ?screen= NO redirige: se queda en la raíz', async () => {
    // Es el caso del índice de pantallas del `App.tsx` de React, que pone la Fase 4. Redirigir a
    // `/undefined` mandaría a la ruta comodín y el índice nunca se vería.
    await objRouter.navigateByUrl('/');
    expect(objRouter.url).toBe('/');
  });

  it('un slug desconocido no matchea ninguna ruta', async () => {
    // Sin ruta comodín todavía (la agrega la Fase 4 con el componente de "pantalla no encontrada"),
    // así que la navegación se rechaza. El test asevera el estado de HOY para que agregar el `**`
    // sea un cambio deliberado y visible, no un efecto colateral.
    await expect(objRouter.navigateByUrl('/?screen=no-existe')).rejects.toThrow();
  });
});
