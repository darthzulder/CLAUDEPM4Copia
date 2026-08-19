import { inject } from '@angular/core';
import { Route, Router, Routes } from '@angular/router';
import { DIC_ALIAS, DIC_PANTALLAS } from './pantallas';

/**
 * Rutas de la app. Las **pantallas de negocio** se pueblan en la **Fase 4**; hoy la tabla
 * tiene una sola entrada, la pantalla de verificación del gate 2, y eso es deliberado.
 *
 * Contrato que la Fase 4 tiene que respetar, anotado acá porque es donde se va a leer:
 *
 * - **El slug viaja en `?screen=`, no en el path.** PM4 genera la URL del iframe y ese
 *   formato es contrato con el BPM (`?screen=<slug>&task_id=<id>&token=<jwt>`); no se puede
 *   cambiar a `/pantalla/<slug>` sin tocar cada nodo del proceso. Así que el router de
 *   Angular resuelve por query param, no por segmento de ruta.
 * - **Una ruta por slug con `loadComponent`**, que es el equivalente del `React.lazy` +
 *   `Suspense` de `App.tsx`: el iframe renderiza una sola pantalla a la vez, así que
 *   descargar las ~15 en un bundle único no tiene sentido.
 * - **Los alias de slugs viejos se generan igual que las pantallas** (ver `DIC_ALIAS`). Hoy no
 *   hay ninguno vigente —la ex SCR-010 se eliminó del proyecto— pero el mecanismo queda, porque
 *   el próximo slug renombrado lo va a necesitar y es una entrada en un objeto, no código nuevo.
 * - **La guarda de inventario** (un spec que compara las rutas declaradas contra la lista de
 *   pantallas con spec) es parte del gate de la Fase 4 y es el único mecanismo del proyecto
 *   que no depende de la buena voluntad de quien programa. Ver el `SCREENS` exportado en
 *   `frontend/src/App.tsx`, que existe solo para eso.
 *
 * ── Por qué el slug se resuelve con `redirectTo` y no con un componente despachador ───────
 * El router de Angular **matchea por path, nunca por query param**: no existe una `Route`
 * que se active "cuando `?screen=X`". Las dos salidas son un componente raíz que lea el
 * query string y haga el switch a mano (lo que hace `App.tsx` en React), o traducir el
 * query param a un path en el borde y dejar que el router haga su trabajo. Se elige la
 * segunda: `redirectTo` recibe la rama con `queryParams` ya parseados, así que la traducción
 * vive en un solo lugar y cada pantalla queda como una ruta normal — con `loadComponent` de
 * verdad, que es lo que da el lazy chunk. Un despachador con `@switch` cargaría las ~15
 * pantallas en el bundle inicial y perdería exactamente lo que la Fase 4 necesita.
 *
 * La Fase 4 extiende esto agregando entradas a la tabla, sin tocar el `redirectTo`: el
 * mecanismo ya es el definitivo, lo único provisorio es que hoy hay un solo slug.
 *
 * ── ⚠ El `redirectTo` DEVUELVE UN `UrlTree`, NO UN STRING — y no es una preferencia ────────
 * Es el hallazgo más caro de esta tabla, medido con un spec antes de que costara un
 * diagnóstico dentro de un iframe. Devolver el string `/gate-fachada` **descarta todo el
 * query string**: la URL final queda en `/gate-fachada` pelada, con `task_id` y `token`
 * perdidos (verificado: `router.url` → `"/gate-fachada"`, `queryParams` → `{}`). Angular no
 * arrastra los params de una redirección por su cuenta.
 *
 * Y ese es el peor modo de falla posible para este proyecto: **PM4 manda el `task_id` y el
 * JWT justamente ahí** (`?screen=<slug>&task_id=<id>&token=<jwt>`). Con el string, cada
 * pantalla de la Fase 4 montaría bien y después fallaría al cargar el caso, con un síntoma
 * ("no hay task") a tres capas de distancia de la causa (una redirección del router). Por eso
 * se construye un `UrlTree` con `queryParams` explícitos.
 */
/**
 * Convierte el registro de pantallas en entradas de ruta, una por slug.
 *
 * Es el único lugar donde `DIC_PANTALLAS` se recorre para producir `Routes`, y por eso la ruta y el
 * inventario **no pueden desincronizarse**: registrar la pantalla ya la enruta. En React esto era
 * manual —una entrada en `SCREENS` y el `lazy()` arriba— y era el punto exacto donde un olvido daba
 * un iframe en blanco sin ningún test rojo.
 *
 * Los alias apuntan al **mismo** cargador que su destino en vez de hacer `redirectTo`. Es a
 * propósito: un `redirectTo` cambiaría la URL visible del iframe, y el slug de la URL es lo que se
 * mira para saber qué nodo del BPM abrió la tarea. Con el cargador compartido, la ex SCR-010 sigue
 * mostrándose como SCR-010 y renderiza el formulario unificado.
 */
function generarRutasDePantallas(): Route[] {
  const cllRutas: Route[] = Object.entries(DIC_PANTALLAS).map(([in_strSlug, in_fnCargar]) => ({
    path: in_strSlug,
    loadComponent: in_fnCargar,
  }));

  for (const [strAlias, strDestino] of Object.entries(DIC_ALIAS)) {
    const fnCargar = DIC_PANTALLAS[strDestino];

    if (!fnCargar) {
      /**
       * ⚠ **Un alias sin destino se SALTEA, y esto es distinto de tolerar un error de registro.**
       *
       * La primera versión de esta rama lanzaba, con el argumento de que un `loadComponent` en
       * `undefined` es el defecto #3 del gate 2 (suite verde, iframe en blanco). El razonamiento
       * era bueno y la conclusión estaba mal: **hoy la app no arrancaría**. El alias de la ex
       * SCR-010 tiene que estar declarado desde ya —es contrato con nodos del BPM que ya existen—
       * pero su destino, la SCR-009, se porta en la Fase 5. Lanzar hacía que `app.routes.ts`
       * reventara al importarse, y con él la suite entera (medido: `app.routes.spec.ts`, 0 tests
       * ejecutados).
       *
       * La garantía se conserva sin bloquear la Fase 4: se saltea, así que **no se crea la ruta**
       * —que es lo importante: una ruta con `loadComponent: undefined` es el modo de falla
       * silencioso, y no crearla manda el slug al comodín, que dice qué pasa—, y `pantallas.spec.ts`
       * asevera que ningún alias quede huérfano en cuanto haya pantallas registradas.
       *
       * Sin `console.warn` a propósito: hoy este camino se recorre **siempre**, así que avisar
       * sería ruido garantizado en cada arranque y en cada spec, y un aviso que suena siempre deja
       * de leerse justo cuando empieza a significar algo.
       */
      continue;
    }

    cllRutas.push({ path: strAlias, loadComponent: fnCargar });
  }

  return cllRutas;
}

export const routes: Routes = [
  {
    // El borde: `/?screen=<slug>` → `/<slug>`, **preservando el resto del query string**.
    // Sin `?screen=` no redirige y cae al índice de pantallas, que pone la Fase 4.
    path: '',
    pathMatch: 'full',
    redirectTo: (in_objRuta) => {
      const strSlug = in_objRuta.queryParams['screen'];
      if (!strSlug) {
        return '';
      }
      // `createUrlTree` es lo que permite mantener los params; ver el bloque de la cabecera.
      // El `screen` se saca del destino: ya viajó en el path, y dejarlo duplicaría el dato en
      // la URL final (`/<slug>?screen=<slug>`), que es ruido para depurar dentro del iframe.
      const { screen: _strYaEnElPath, ...objResto } = in_objRuta.queryParams;
      return inject(Router).createUrlTree([strSlug], { queryParams: objResto });
    },
  },
  {
    /**
     * El índice, para la raíz **sin** `?screen=`.
     *
     * Va después del `redirectTo` de `''` y **también** con `pathMatch: 'full'`. El orden importa:
     * el router toma la primera ruta que matchea, así que si esta estuviera primero se comería el
     * caso con `?screen=` (el query string no participa del matcheo) y ninguna pantalla abriría
     * jamás. El `redirectTo` de arriba devuelve `''` cuando no hay slug, y ese `''` cae acá.
     */
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./indice-pantallas').then((m) => m.IndicePantallas),
  },
  {
    /**
     * Pantalla de verificación del **gate 2**, no una pantalla de negocio.
     *
     * Está acá y no en la Fase 4 porque el gate 2 exige verificación manual en un navegador
     * real (jsdom no hace upgrade de los custom elements de Lit, así que ningún spec de la
     * fachada asevera pintado) y para eso la pantalla tiene que ser **alcanzable**. No entra
     * en la guarda de inventario de la Fase 4: esa guarda compara rutas contra pantallas con
     * spec de RUL, y esta no implementa ningún anexo.
     */
    path: 'gate-fachada',
    loadComponent: () => import('../screens/gate-fachada/gate-fachada').then((m) => m.GateFachada),
  },

  // Las pantallas de negocio, generadas del registro. Hoy son cero (la Fase 5 las porta de a una)
  // y el spread de un array vacío es un no-op, así que la tabla es válida igual.
  ...generarRutasDePantallas(),

  {
    /**
     * El comodín, **último a propósito**: `**` matchea cualquier cosa, así que cualquier ruta
     * escrita debajo sería inalcanzable.
     *
     * Reemplaza el `if (!Screen)` de React. Nótese que atrapa más que ese `if`: en React solo se
     * llegaba ahí con un `?screen=` desconocido, porque no había otros paths; acá también cubre un
     * `/loQueSea` escrito a mano. Es más cobertura, no menos, y el mensaje sirve para los dos.
     */
    path: '**',
    loadComponent: () => import('./pantalla-no-encontrada').then((m) => m.PantallaNoEncontrada),
  },
];
