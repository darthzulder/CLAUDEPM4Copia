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

/**
 * Shim de `Blob.prototype.arrayBuffer` / `.text()`.
 *
 * **jsdom implementa `Blob` y `File` pero no sus métodos de lectura asíncrona** — el `Blob` de jsdom
 * quedó en la especificación anterior, donde el contenido solo se leía con `FileReader`. Es una
 * ausencia silenciosa: `new File([...])` funciona perfecto y falla recién al leerlo, con
 * `TypeError: in_objFile.arrayBuffer is not a function`.
 *
 * Hace falta para `core/file-hash.ts`, que hashea el contenido del adjunto con
 * `file.arrayBuffer()` → `crypto.subtle.digest`. Sin el shim, la detección de duplicados por
 * contenido —la razón de existir de ese módulo— no se puede testear en absoluto.
 *
 * Se implementa sobre `FileReader`, que jsdom **sí** trae, así que se lee el mismo contenido real que
 * en el navegador: el shim no simula bytes, los extrae. Por eso los hashes que salen en los tests son
 * los verdaderos y un test de "mismo contenido → mismo hash" prueba lo que dice probar.
 */
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function leerComoArrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((in_fnResolver, in_fnRechazar) => {
      const objLector = new FileReader();
      objLector.onload = () => in_fnResolver(objLector.result as ArrayBuffer);
      objLector.onerror = () => in_fnRechazar(objLector.error);
      objLector.readAsArrayBuffer(this);
    });
  };
}

if (!Blob.prototype.text) {
  Blob.prototype.text = function leerComoTexto(this: Blob): Promise<string> {
    return new Promise((in_fnResolver, in_fnRechazar) => {
      const objLector = new FileReader();
      objLector.onload = () => in_fnResolver(objLector.result as string);
      objLector.onerror = () => in_fnRechazar(objLector.error);
      objLector.readAsText(this);
    });
  };
}
