// Servido del build del frontend en producción, extraído de server.ts para poder testearlo:
// `server.ts` llama `app.listen()` en el nivel superior, así que importarlo desde un test
// levantaría un puerto. Acá viven las dos decisiones del bloque estático —QUÉ carpeta se sirve y
// CUÁNDO corresponde el fallback de la SPA—, que son justo las dos que la Fase 7 cambió y las dos
// que fallan de forma difícil de diagnosticar cuando están mal.

import path from 'path';

/**
 * Ruta del build del frontend que se sirve en producción.
 *
 * **Es Angular (`frontend-ng`), no React.** Hasta la Fase 7 esto apuntaba a `frontend/dist` y era
 * lo único que Render entregaba; el workspace de React sigue en el árbol como referencia de paridad
 * pero ya no se buildea ni se despliega (ver `pm4-app/package.json`, script `build`).
 *
 * ── De dónde sale `dist/frontend-ng/browser`, que no es una ruta que uno adivine ────────────────
 * El builder `@angular/build:application` emite a **`dist/<nombre-del-proyecto>/browser`** cuando
 * `angular.json` no declara `outputPath` — y no lo declara (ver el `architect.build.options` del
 * proyecto `frontend-ng`, que solo trae `browser`, `tsConfig`, `assets` y `styles`). El segmento
 * `browser/` no es opcional ni cosmético: el builder reserva el nivel de arriba para separar la
 * salida de navegador de la de servidor (SSR/prerender), así que `dist/frontend-ng/index.html` **no
 * existe**. Apuntar un nivel más arriba da un `express.static` que no encuentra nada y un
 * `sendFile` que responde 404 para todo, con la app entera en blanco y sin ningún error de build.
 *
 * `in_strDirBase` es `__dirname`, que en ejecución es `pm4-app/backend/dist` (el `outDir` del
 * `backend/tsconfig.json`) — de ahí los dos `..` para llegar a `pm4-app/`. Se recibe por parámetro
 * en vez de leerlo acá para que el test pueda fijar la base y aseverar la ruta completa.
 */
export function resolverRaizEstatica(in_strDirBase: string): string {
  return path.join(in_strDirBase, '../../frontend-ng/dist/frontend-ng/browser');
}

/**
 * ¿Este request merece el `index.html` de la SPA?
 *
 * El fallback existe porque el router de Angular usa paths de verdad
 * (`/COL_QD_SCR-003_Correccion_Error_Funcional`), así que un refresh o un enlace directo pega
 * contra Express en una ruta que no es un archivo. Sin fallback: 404 y pantalla en blanco.
 *
 * ── Por qué está ACOTADO, y no es una precaución teórica ────────────────────────────────────────
 * La versión previa era `app.use((_req, res) => res.sendFile(index.html))` — sin path y sin
 * condición, o sea que respondía HTML con **200** a *cualquier* cosa que llegara hasta ahí. Dos
 * modos de falla concretos, los dos especialmente caros porque este frontend vive dentro de un
 * iframe de PM4 donde no hay barra de direcciones ni forma cómoda de mirar la red:
 *
 * 1. **`/api/loQueSea` inexistente devolvía HTML con 200.** El cliente hacía `JSON.parse` de un
 *    `<!doctype html>`, así que un endpoint mal escrito se manifestaba como un error de parseo en
 *    el frontend en vez de como el 404 que era. La causa (una ruta que no existe en el backend)
 *    quedaba a tres capas del síntoma.
 * 2. **Un asset faltante devolvía HTML con 200.** Tras un deploy, un navegador con el `index.html`
 *    viejo en cache pide `/chunk-ABC123.js`, que ya no existe con ese hash (`outputHashing: "all"`
 *    en la configuración de producción de `angular.json`). En vez de un 404 —que el navegador
 *    reporta claramente— recibía HTML y fallaba con `Unexpected token '<'`, el error que no dice
 *    nada sobre el deploy que lo causó. Verificado contra el servidor levantado en modo producción:
 *    `GET /chunk-VIEJO123.js` → `200 text/html`.
 *
 * Las dos condiciones, entonces:
 * - **No empieza con `/api`**: esas rutas son del backend y su 404 es información, no un caso de
 *   SPA. Se chequea con `startsWith('/api/')` y además `/api` exacto, para no dejar afuera un
 *   request a `/api` pelado ni tomar por API un `/apiario`.
 * - **El path no parece un archivo**: si tiene extensión (`.js`, `.css`, `.svg`, `.woff2`…), es un
 *   asset. Y si llegó hasta este middleware, `express.static` ya no lo encontró, así que la
 *   respuesta correcta es 404 y no un HTML que el navegador va a intentar parsear como JavaScript.
 *
 * ── ⚠ Por qué NO se usa `req.accepts('html')`, que es el reflejo obvio ──────────────────────────
 * La primera versión de esta función guardaba por `Accept: text/html`, con el argumento de que eso
 * distingue una navegación de un pedido de asset. **Medido contra Express: no lo distingue.**
 * `req.accepts('html')` devuelve `'html'` para el `Accept` comodín que manda un `fetch()`, y también
 * para `Accept: text/css` seguido del comodín con `q=0.1`, porque ese comodín de cola matchea todo.
 * Lo único que filtra es un `Accept` explícitamente sin HTML, como `application/json`.
 * (El comodín se describe en palabras porque escribirlo literal cerraría este comentario.)
 *
 * O sea que la guarda existía y el chunk faltante seguía devolviendo HTML con 200 — el modo de falla
 * #2 seguía abierto con un test verde al lado, porque el test le pasaba `false` a mano y nunca medía
 * qué valor produce Express de verdad. Se descubrió levantando el servidor en modo producción y
 * pidiendo `/chunk-VIEJO123.js`: 200 y `text/html`.
 *
 * La extensión del path sí es una señal fiable, y además no depende de qué manda el cliente: la
 * decisión pasa a estar del lado del servidor, que es donde se sabe qué se puede servir.
 */
export function correspondeFallbackSpa(in_strPath: string): boolean {
  if (in_strPath === '/api' || in_strPath.startsWith('/api/')) return false;
  if (pareceArchivo(in_strPath)) return false;
  return true;
}

/**
 * ¿El último segmento del path parece un nombre de archivo con extensión?
 *
 * El criterio es una extensión de 1 a 8 caracteres alfanuméricos al final del último segmento
 * (`/main-ABC123.js` → sí, `/COL_QD_SCR-003_Correccion_Error_Funcional` → no).
 *
 * Los dos límites son deliberados:
 * - **Se mira solo el último segmento**, no el path entero. Un directorio con punto en el nombre
 *   (`/v1.2/pantalla`) no convierte la ruta en un archivo.
 * - **Hasta 8 caracteres** cubre todas las extensiones reales del build de Angular (`js`, `css`,
 *   `map`, `svg`, `woff2`, `ico`, `json`, `webmanifest` es la única que se pasa y no se sirve por
 *   navegación de todos modos). Un tope explícito evita tomar por extensión el final de un slug con
 *   punto, que sería el falso positivo caro: dejaría una pantalla en 404.
 *
 * ⚠ Ningún slug de `DIC_PANTALLAS` tiene punto hoy (son `COL_QD_SCR-0NN_Nombre_Con_Underscores`), y
 * si algún día alguno lo tuviera, el síntoma sería "esa pantalla da 404 al refrescar" — de ahí que
 * quede escrito acá y con test.
 */
function pareceArchivo(in_strPath: string): boolean {
  const strUltimoSegmento = in_strPath.slice(in_strPath.lastIndexOf('/') + 1);
  return /\.[A-Za-z0-9]{1,8}$/.test(strUltimoSegmento);
}
