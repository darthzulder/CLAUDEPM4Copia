/**
 * Arranque único de Zurich DS (composition root del Design System).
 *
 * Importa los ASSETS GLOBALES del DS, una sola vez al bootstrap de la app:
 *   - base.css      → tokens (--zc-*, --zg-*, --zs-*, --zf-*) + CSS de componentes
 *   - javascript.js → comportamientos progresivos de los CSS-components
 *                     (ejecuta runCSSComponentsJS(); NO registra custom elements)
 *
 * Los WEB COMPONENTS (z-text-input, z-select, z-table, …) NO se registran aquí:
 * se auto-registran de forma idempotente al importar sus wrappers React desde la
 * fachada `components/fields/ZdsFields`. El helper registerComponent() del DS
 * guarda con `customElements.get()`, por lo que el registro:
 *   - ocurre UNA vez (el módulo ES se evalúa una sola vez), y
 *   - es a prueba de doble-registro (no lanza "already defined").
 *
 * El registro es perezoso respecto a la fachada: un elemento se define solo si
 * su wrapper se re-exporta en ZdsFields. Como toda pantalla consume la fachada,
 * el catálogo completo queda registrado al primer render. Para usar un z-* nuevo
 * basta re-exportar su wrapper en ZdsFields (ver Jerarquía de decisión de UI).
 *
 * Este módulo (assets globales) + ZdsFields (componentes) son los DOS únicos
 * puntos autorizados a importar `@zurich/*` — enforced en eslint.config.mjs.
 *
 * IMPORTANTE: importar antes que shared.css para preservar la cascada.
 */
import '@zurich/css-components/base.css';
import '@zurich/css-components/javascript.js';
