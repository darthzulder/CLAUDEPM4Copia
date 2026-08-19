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
import { LOCALES as DIC_LOCALES_ES } from '@zurich/dev-utils/locales/es';

/**
 * Idioma de los textos propios del DS. **Sin esto, los componentes de Zurich rinden en inglés**, y el
 * síntoma es un warning fácil de leer como cosmético: `Locale "es" not found. Fallback to 'en'`.
 *
 * ── Por qué hace falta escribir un global, que es lo que más chirría de este bloque ─────────────
 * El DS resuelve sus textos en `web-components/dist/localized.js`:
 *
 * ```js
 * get computedLocale() { return this.locale || document.documentElement.lang || navigator.language || "en"; }
 * _getLocaleMap(locale) {
 *   const MAP = window.ZDS_LOCALES?.[locale || this.computedLocale] || null;
 *   if (MAP) return MAP;
 *   ...console.warn(`Locale "${$locale}" not found...`);
 *   return LOCALES;                       // ← el `en` que viene importado de fábrica
 * }
 * ```
 *
 * O sea que **`window.ZDS_LOCALES` es la API que la librería define para esto**: no hay input, ni
 * provider, ni función de configuración. El `<html lang="es">` de `index.html` ya está puesto y hace
 * su parte (`computedLocale` devuelve `"es"`, verificado en el navegador) — lo que falta es el
 * diccionario que ese `lang` sirve para elegir. Escribir el global no es un parche sobre la librería,
 * es el mecanismo previsto.
 *
 * El diccionario **ya viene instalado** (`@zurich/dev-utils/locales/es`, 22 idiomas en ese directorio),
 * así que no se traduce nada a mano: sería duplicar strings que el DS mantiene.
 *
 * ── Alcance: son 16 componentes, y uno de ellos es `base-input` ────────────────────────────────
 * Consumen locale `base-calendar, base-input, calendar, currency, date, file-input, kpi-value,
 * language-selector, loader, locale, localized, multi-file-input, number, placeholder-input, time,
 * vertical-stepper`. Como **`base-input` está en la lista, esto alcanza a TODOS los campos del DS**
 * (`inputs.requiredHelpText` → "Campo requerido", `invalidHelpText` → "Campo inválido"), no solo a los
 * de fecha o archivo.
 *
 * ── Por qué es global y no por componente ─────────────────────────────────────────────────────
 * Los `lib-*-z` de Colombia —la base de cinco de los siete wrappers de la fachada— **no exponen un
 * input `locale`**: 0 ocurrencias en `lib-zurich-2.6.16/package/types/zurich-col-lib-zurich.d.ts`. Así
 * que para esa mitad de la fachada el global no es una comodidad, es la única vía. La capa `za-*` sí
 * lo expone (heredado de `ZaBaseInput`) y ahí se usa **además**, por un motivo distinto que está
 * documentado en `CampoZaBase.locale`.
 *
 * ── ⚠ Divergencia deliberada con React, autorizada por el usuario (ago-2026) ───────────────────
 * **React tiene este mismo defecto** (`ZDS_LOCALES` no aparece en `frontend/src/`), así que hoy sus
 * pantallas muestran los textos del DS en inglés. Arreglarlo solo acá hace que Angular **no** sea
 * visualmente idéntico a React, y eso es intencional: es una mejora funcional, no una omisión del
 * port. Se decidió no replicar el arreglo en `frontend/`, que la Fase 7 elimina.
 *
 * Al comparar paridad visual de una pantalla portada, entonces, los textos **del DS** (botón "Hoy" del
 * calendario, "Examinar archivo", "No se encontraron opciones") van a diferir a propósito. Los textos
 * **del negocio** los pasa la pantalla por input y no pasan por acá.
 */
(globalThis as { ZDS_LOCALES?: Record<string, unknown> }).ZDS_LOCALES = {
  ...(globalThis as { ZDS_LOCALES?: Record<string, unknown> }).ZDS_LOCALES,
  es: DIC_LOCALES_ES,
};
