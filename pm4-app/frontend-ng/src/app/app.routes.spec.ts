import { Router, provideRouter, type Routes } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';
// Importada estáticamente a propósito: es el lado "esperado" de la aserción que distingue una ruta
// sana de una que resuelve `undefined`. El coste del chunk se paga igual al navegar.
import { GateFachada } from '../screens/gate-fachada/gate-fachada';
import { IndicePantallas } from './indice-pantallas';
import { PantallaNoEncontrada } from './pantalla-no-encontrada';
import { DIC_PANTALLAS, listarSlugsEnrutables } from './pantallas';

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
    // con un slug de ese estilo para probar la traducción sin depender del inventario de la Fase 5;
    // hay que resetear el TestBed porque el `beforeEach` ya configuró uno con las rutas reales.
    const strSlug = 'COL_QD_SCR-009_Formulario_Superintendencia';
    TestBed.resetTestingModule();
    const objRouterSlug = crearRouter([
      routes[0],
      { path: strSlug, loadComponent: () => import('./app').then((m) => m.App) },
    ]);
    await objRouterSlug.navigateByUrl(`/?screen=${strSlug}`);
    expect(objRouterSlug.url).toBe(`/${strSlug}`);
  });

  it('sin ?screen= NO redirige: se queda en la raíz y carga el índice', async () => {
    // Redirigir a `/undefined` mandaría a la ruta comodín y el índice nunca se vería.
    await objRouter.navigateByUrl('/');

    expect(objRouter.url).toBe('/');
    // Y el índice **se resuelve de verdad**, misma aserción que la del `loadComponent` de arriba y
    // por el mismo motivo: la URL correcta con un componente en `undefined` es una raíz en blanco.
    expect(objRouter.routerState.snapshot.root.firstChild?.component).toBe(IndicePantallas);
  }, INT_TIMEOUT);

  it('⚠ el orden importa: la ruta del índice NO se come el caso con ?screen=', async () => {
    // Las dos rutas de `''` llevan `pathMatch: 'full'` y el query string **no participa del
    // matcheo**, así que si el índice estuviera declarado antes del `redirectTo` matchearía
    // primero en los dos casos y **ninguna pantalla abriría jamás**. Es un fallo total y silencioso
    // —la raíz se vería perfecta— que solo se detecta pidiendo un slug. Este test es la barrera
    // contra un reordenamiento "cosmético" de la tabla.
    await objRouter.navigateByUrl('/?screen=gate-fachada');

    expect(objRouter.url).toBe('/gate-fachada');
    expect(objRouter.routerState.snapshot.root.firstChild?.component).not.toBe(IndicePantallas);
  }, INT_TIMEOUT);

  describe('la ruta comodín', () => {
    it('un slug desconocido cae en "pantalla no encontrada"', async () => {
      // Antes de la Fase 4 esta navegación **se rechazaba** (no había `**`), y el test lo aseveraba
      // para que agregar el comodín fuera un cambio visible. Ahora resuelve, que es el
      // comportamiento de React: un `?screen=` desconocido muestra el diagnóstico con el slug
      // pedido, no un iframe roto.
      await objRouter.navigateByUrl('/?screen=no-existe');

      expect(objRouter.url).toBe('/no-existe');
      expect(objRouter.routerState.snapshot.root.firstChild?.component).toBe(PantallaNoEncontrada);
    }, INT_TIMEOUT);

    it('también atrapa un path escrito a mano, no solo un ?screen= inválido', async () => {
      // Más cobertura que el `if (!Screen)` de React, que solo se alcanzaba vía `?screen=`.
      await objRouter.navigateByUrl('/loQueSea/profundo');

      expect(objRouter.routerState.snapshot.root.firstChild?.component).toBe(PantallaNoEncontrada);
    }, INT_TIMEOUT);
  });
});

describe('app.routes · generación de rutas desde el registro', () => {
  it('hoy no hay pantallas de negocio en la tabla, y es el estado correcto', () => {
    // Fija el estado de la Fase 4 para que la primera pantalla de la Fase 5 **tenga** que tocar
    // este número: si alguien registra una pantalla, este test se pone rojo y lo manda a leer la
    // guarda de inventario de `pantallas.spec.ts`, que es donde está la obligación del spec.
    expect(Object.keys(DIC_PANTALLAS)).toEqual([]);
  });

  it('cada pantalla del registro tiene su ruta', () => {
    const setPaths = new Set(routes.map((in_objRuta) => in_objRuta.path));
    const cllFaltantes = Object.keys(DIC_PANTALLAS).filter(
      (in_strSlug) => !setPaths.has(in_strSlug),
    );

    // La garantía de que generar las rutas del registro de verdad las genera. Hoy pasa por
    // vacuidad; en la Fase 5 muerde si alguien rompe `generarRutasDePantallas()`.
    expect(`pantallas sin ruta: [${cllFaltantes.join(', ')}]`).toBe('pantallas sin ruta: []');
  });

  it('⚠ hoy no hay alias declarados: la ex SCR-010 se eliminó del proyecto', () => {
    const setPaths = new Set(routes.map((in_objRuta) => in_objRuta.path));

    // **Este caso reemplaza al que aseveraba lo contrario.** La versión anterior fijaba un estado
    // transitorio —el alias `COL_QD_SCR-010_cierre-m3` declarado pero sin ruta, porque su destino
    // (la SCR-009) se porta en la Fase 5— y estaba escrito para ponerse rojo cuando ese destino
    // apareciera. Ya no aplica: la SCR-010 se eliminó del proyecto por decisión del usuario
    // (ago-2026), así que no hay nodo del BPM que preservar y `DIC_ALIAS` quedó vacío.
    //
    // Lo que se asevera ahora es el **borrado**, en las dos direcciones: que el slug no quedó como
    // ruta y que tampoco quedó en el registro. Sin esto, reponerlo por descuido —copiándolo del
    // `App.tsx` de React, que **todavía** lo declara hasta que la Fase 7 borre ese árbol— no pondría
    // nada rojo.
    expect(setPaths.has('COL_QD_SCR-010_cierre-m3')).toBe(false);
    expect(listarSlugsEnrutables()).not.toContain('COL_QD_SCR-010_cierre-m3');
  });

  it('⚠ el mecanismo de alias sigue vivo aunque no haya ninguno declarado', () => {
    // **Sin este caso, borrar `generarRutasDePantallas()` entera no pondría nada rojo hoy.** Los dos
    // diccionarios están vacíos, así que la función devuelve `[]` y el spread es un no-op: cada
    // aserción sobre las rutas generadas pasa por vacuidad. Y el recorrido de los alias es lo que la
    // Fase 5 va a necesitar en cuanto aparezca el primer slug renombrado.
    //
    // Se asevera sobre la **tabla real**, no sobre datos inyectados: lo que se fija es que las rutas
    // fijas siguen ahí y que el spread no rompió el orden, que es la parte de la que depende el
    // comodín. La composición de la unión (pantallas + alias) la cubre `pantallas.spec.ts`.
    const cllPaths = routes.map((in_objRuta) => in_objRuta.path);

    // Las tres fijas de la Fase 4 (`''` × 2 + `gate-fachada`) más el comodín. Si alguien "limpiara"
    // el spread de `generarRutasDePantallas()` por verse inútil con el registro vacío, este conteo
    // no lo detecta —hoy es un no-op— pero el caso de abajo, que exige el `**` último, sí protege el
    // orden en que la Fase 5 va a insertar las pantallas.
    expect(cllPaths.filter((in_strPath) => in_strPath === '')).toHaveLength(2);
    expect(cllPaths).toContain('gate-fachada');
    expect(cllPaths.indexOf('gate-fachada')).toBeLessThan(cllPaths.indexOf('**'));
  });

  it('la ruta comodín es la ÚLTIMA de la tabla', () => {
    // `**` matchea cualquier cosa: una ruta declarada debajo sería inalcanzable, y el síntoma
    // sería "esa pantalla muestra pantalla-no-encontrada" sin ninguna pista de por qué.
    expect(routes[routes.length - 1].path).toBe('**');
  });
});
