import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { interceptorPm4Token } from '../api/pm4Client';
import { ManejadorDeErrores } from './error-render.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Zoneless es lo que usa el propio harness de desarrollo de Zurich
    // (`InsumosZurich/fe-lib-zurich/src/app/app.config.ts`): los componentes del DS son
    // bindings sobre custom elements de Lit, que emiten eventos nativos y no dependen de
    // que zone.js parchee nada. Con zoneless, la detección de cambios la disparan las
    // señales y los eventos del template, no un monkey-patch global de las APIs del
    // navegador — menos ciclos por interacción y sin zone.js en el bundle.
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([interceptorPm4Token])),

    /**
     * El reemplazo del `ErrorBoundary` de React. Son **dos** providers para la **misma**
     * instancia, y esa es la parte que importa:
     *
     * - `ManejadorDeErrores` es lo que inyecta el componente raíz para leer la señal del error.
     * - `ErrorHandler` es lo que usa Angular internamente para reportar excepciones no atrapadas.
     *
     * ⚠ **Tiene que ser `useExisting`, no `useClass`.** Con `useClass` Angular crearía una
     * instancia **distinta** para cada token: reportaría los errores en una y el componente raíz
     * leería la señal de la otra, que nunca se llena. El resultado sería una app que loguea
     * `[ErrorBoundary]` en consola y **no pinta nada** — un fallo silencioso, porque el log da la
     * impresión de que el mecanismo funciona. El spec lo asevera por identidad de instancia.
     */
    ManejadorDeErrores,
    { provide: ErrorHandler, useExisting: ManejadorDeErrores },
  ],
};
