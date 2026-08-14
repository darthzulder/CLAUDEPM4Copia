/**
 * Bootstrap de assets globales del Zurich Design System.
 *
 * Este archivo y `components/fields/` son los DOS únicos puntos autorizados a importar
 * `@zurich/*` o `@zurich-col/*` — enforced en eslint.config.mjs (`no-restricted-imports`).
 * Réplica exacta del contrato que ya tiene `frontend/src/zds-setup.ts` en React.
 *
 * `@zurich/css-components` es el paquete que trae los **tokens** (`--zc-*`, `--zg-*`,
 * `--zs-*`, `--zf-*`), y es **dependencia de nadie**: ningún `npm install` lo arrastraría
 * solo, y su ausencia no rompe la instalación — se manifiesta como estilos base faltantes
 * en runtime. Por eso está declarado explícitamente en package.json y se importa acá.
 *
 * `javascript.js` registra los custom elements de css-components de forma idempotente
 * (guarda con `customElements.get()`), así que importar este módulo dos veces no lanza
 * "already defined".
 *
 * IMPORTANTE: importar antes que shared.css para preservar la cascada — los alias
 * semánticos del proyecto (`--z-blue`, `--z-bg`, …) apuntan a tokens del DS, así que los
 * tokens tienen que existir primero.
 */
import '@zurich/css-components/base.css';
import '@zurich/css-components/javascript.js';
