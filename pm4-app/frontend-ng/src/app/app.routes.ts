import { Routes } from '@angular/router';

/**
 * Rutas de la app. Se pueblan en la **Fase 4** de la migración, cuando existan pantallas
 * que enrutar; hoy está vacío a propósito y no es un TODO olvidado.
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
 */
export const routes: Routes = [];
