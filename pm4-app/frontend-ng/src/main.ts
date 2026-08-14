// El orden de estos dos imports NO es cosmético: `zds-setup` trae los tokens del DS y
// `shared.css` define alias semánticos que apuntan a esos tokens (`--z-blue` → `--zc-*`).
// Invertirlos deja los alias en `unset`. Mismo contrato que `frontend/src/main.tsx`.
import './zds-setup';
import './shared.css';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
