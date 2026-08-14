/**
 * Setup global de la suite (Vitest + jsdom, vía `@angular/build:unit-test`).
 *
 * Deliberadamente NO importa `zds-setup.ts`: los assets del DS son CSS y un bundle de
 * comportamientos sobre custom elements de Lit, y jsdom no ejecuta custom elements de
 * verdad. Importarlos acá sumaría ~500 kB de parseo por worker sin cambiar ninguna
 * aserción posible (ver docs/guides/testing-conventions.md: un control del DS
 * deshabilitado igual dispara su handler bajo jsdom).
 *
 * Lo que sí hace falta es el shim de `matchMedia`, que jsdom no implementa y que varios
 * componentes de `lib-zurich`/`angular-components` consultan al construirse para decidir
 * su layout responsive. Sin esto, montar cualquier wrapper de la fachada explota con
 * "matchMedia is not a function" antes de llegar a la aserción.
 */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (in_strQuery: string) => ({
      matches: false,
      media: in_strQuery,
      onchange: null,
      // Los cuatro listeners son no-op a propósito: el shim reporta `matches: false` fijo,
      // así que nunca hay un cambio de media query que notificar. Un cuerpo vacío es el
      // comportamiento correcto, no un pendiente — de ahí el disable puntual.
      /* eslint-disable @typescript-eslint/no-empty-function */
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      /* eslint-enable @typescript-eslint/no-empty-function */
      dispatchEvent: () => false,
    }),
  });
}
