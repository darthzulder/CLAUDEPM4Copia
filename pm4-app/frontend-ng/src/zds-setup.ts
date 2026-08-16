/**
 * Bootstrap de assets globales del Zurich Design System — la parte de **código**.
 *
 * Este archivo y `components/fields/` son los DOS únicos puntos autorizados a importar
 * `@zurich/*` o `@zurich-col/*` — enforced en eslint.config.mjs (`no-restricted-imports`).
 *
 * `javascript.js` registra los custom elements de css-components de forma idempotente
 * (guarda con `customElements.get()`), así que importar este módulo dos veces no lanza
 * "already defined".
 *
 * ---
 *
 * El CSS del DS (`base.css`, los tokens `--zc-*`/`--zg-*`/`--zs-*`/`--zf-*`) **ya no se
 * importa acá**, y el motivo es un defecto silencioso del builder que costó una sesión de
 * diagnóstico. `@angular/build:application` **no enlaza un `.css` importado desde un `.ts`**:
 * esbuild lo emite como *sidecar* del entrypoint (un `main.css` correcto y completo) y anota
 * la relación en el output JS bajo `cssBundle`, pero el output CSS queda con
 * `entryPoint: undefined`. Angular arma su lista de archivos iniciales con un `if (entryPoint)`
 * (`@angular/build/src/tools/esbuild/bundler-context.js`) y el generador de `index.html` solo
 * emite `<link>` para lo que está en esa lista — así que el CSS se compila y queda **huérfano**,
 * con el build en verde. `grep -rn cssBundle` sobre todo `@angular/build` da 0 ocurrencias: el
 * builder nunca lee el campo donde esbuild dejó la relación.
 *
 * Por eso `base.css` y `shared.css` viven en el array `styles` de angular.json, **en ese orden**,
 * que es la única vía soportada. El orden del array ES la cascada: los entries string se
 * concatenan en UN solo bundle en orden de array (`normalizeGlobalEntries` → `global-styles.js`
 * los emite como `@import` en secuencia), así que los tokens del DS quedan antes que los alias
 * semánticos del proyecto (`--z-blue` → `--zc-blue-zurich`), que es lo que esos alias necesitan
 * para no resolver a `unset`. **Si alguien reordena ese array, rompe los colores del proyecto.**
 *
 * Corolario para no diagnosticar en el lugar equivocado: en `ng serve` sirve **Vite**, que
 * resuelve los imports de CSS con su propio pipeline. Un `import '…/base.css'` parece funcionar
 * en dev y no llegar nunca en build — el dev-server no es evidencia sobre el bundle.
 */
import '@zurich/css-components/javascript.js';
