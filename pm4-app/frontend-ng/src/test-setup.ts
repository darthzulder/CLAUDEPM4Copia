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
/**
 * **La zona horaria, fijada acá y no en el `package.json`.**
 *
 * Varios specs de `core/business-days.ts` aseveran horas concretas —`parsePm4Date` sobre un ISO cae
 * al `Date` nativo, que interpreta en UTC, así que el `getHours()` que sale depende de la TZ del
 * proceso—. El proyecto la fijaba con `cross-env TZ=America/Bogota ng test` en el script `test`, y
 * eso funciona… **solo si se entra por `npm test`**. Con `ng test` pelado (o `npx ng test --include
 * ...`, que es como se corre un archivo suelto mientras se programa) la TZ es la de la máquina y
 * `business-days.spec.ts` sale rojo — medido en Windows con `America/La_Paz`: `expected 20 to be 19`,
 * un fallo de una hora que parece un bug de la lógica de días hábiles y no lo es.
 *
 * Un test que se pone rojo según **cómo lo invocaste** es peor que un test que falla: enseña a
 * desconfiar del rojo. Y el `cross-env` no se puede quitar del `package.json` sin romper `verify`, así
 * que la corrección no es mover la variable de lugar sino **ponerla donde corre el código que la
 * necesita**: `setupFiles` se ejecuta dentro de cada worker de Vitest, antes de cargar los specs, sea
 * quien sea el que lanzó el comando.
 *
 * Reasignar `process.env.TZ` en runtime **sí** reconfigura `Date` en Node 24 (verificado: un `Date`
 * construido antes y otro después dan `GMT-0400` y `GMT-0500`). En versiones viejas no era así, de ahí
 * la costumbre de fijarla desde afuera.
 *
 * El `throw` no es defensivo por costumbre: si un Node futuro volviera a cachear la TZ, el síntoma
 * sería otra vez un rojo de una hora en un spec de negocio. Preferimos que la suite muera nombrando la
 * causa.
 */
const STR_TZ_ESPERADA = 'America/Bogota';
if (Intl.DateTimeFormat().resolvedOptions().timeZone !== STR_TZ_ESPERADA) {
  // ⚠ `process.env` por `globalThis` y no directo: este archivo lo barren **los dos** proyectos de
  // TypeScript, y `tsconfig.app.json` no declara los tipos de Node (es el proyecto del navegador). Un
  // `process.env` pelado compila bajo `tsconfig.spec.json` y rompe el `lint` con
  // `TS2591: Cannot find name 'process'` — medido. El acceso indexado no necesita `@types/node`, y
  // agregarlos al proyecto de la app sería peor: habilitaría las APIs de Node en el código de pantalla.
  const objGlobal = globalThis as { process?: { env: Record<string, string | undefined> } };
  if (objGlobal.process) {
    objGlobal.process.env['TZ'] = STR_TZ_ESPERADA;
  }
  const strTzReal = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (strTzReal !== STR_TZ_ESPERADA) {
    throw new Error(
      `No se pudo fijar la zona horaria de la suite: se pidió ${STR_TZ_ESPERADA} y el runtime ` +
        `reporta ${strTzReal}. Los specs que aseveran horas (core/business-days.spec.ts) van a ` +
        `fallar por desfase, no por lógica. Correr con \`npm test\` (usa cross-env) hasta resolverlo.`,
    );
  }
}

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
