import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { interceptorPm4Token } from '../api/pm4Client';

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
  ],
};
