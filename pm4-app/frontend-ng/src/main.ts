// `zds-setup` registra los custom elements del DS. El CSS global NO entra por acá: va en el
// array `styles` de angular.json, que es la única vía que `@angular/build` enlaza de verdad
// en el index.html (ver el comentario de zds-setup.ts para el porqué medido).
import './zds-setup';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
