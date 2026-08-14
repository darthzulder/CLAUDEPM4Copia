import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

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
 * - **El alias `COL_QD_SCR-010_cierre-m3` → `FormularioSuperintendencia`** hay que
 *   preservarlo: la ex SCR-010 se fusionó en la SCR-009 y hay nodos del BPM que todavía
 *   apuntan al slug viejo.
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
];
