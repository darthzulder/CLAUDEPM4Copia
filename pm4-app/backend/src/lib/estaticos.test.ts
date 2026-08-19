import path from 'path';
import { describe, expect, it } from 'vitest';
import { correspondeFallbackSpa, resolverRaizEstatica } from './estaticos';

/**
 * Las dos decisiones del bloque estático de `server.ts`, que es lo que la Fase 7 cambió.
 *
 * Ninguna de las dos tiene síntoma en el build: se equivocan en runtime y en producción, que es el
 * único entorno donde el bloque se ejecuta (`if (blnIsProd)`). De ahí que se testeen acá y no por
 * inspección.
 */

describe('resolverRaizEstatica', () => {
  // `__dirname` real del backend compilado: el `outDir` de backend/tsconfig.json.
  const STR_DIR_DIST = path.join('/app', 'pm4-app', 'backend', 'dist');

  it('sirve el build de Angular, no el de React', () => {
    const strRaiz = resolverRaizEstatica(STR_DIR_DIST);

    /**
     * ⚠ **El caso central de la Fase 7.** Hasta acá el servidor montaba `frontend/dist` (React) y el
     * build de Angular no llegaba a ningún lado. La mutación es literalmente el estado anterior:
     * devolver `'../../frontend/dist'` pone rojo esta aserción y la de abajo.
     *
     * Se asevera con `path.join` en vez de un string literal porque en Windows el separador es `\`:
     * comparar contra `'/app/pm4-app/frontend-ng/...'` daría rojo en la máquina de desarrollo por el
     * separador y no por la ruta, que es el peor tipo de test rojo.
     */
    expect(strRaiz).toBe(path.join('/app', 'pm4-app', 'frontend-ng', 'dist', 'frontend-ng', 'browser'));
    expect(strRaiz).not.toContain(`${path.sep}frontend${path.sep}dist`);
  });

  it('incluye el segmento `browser/`, que es donde el builder de Angular emite de verdad', () => {
    /**
     * Separado del caso anterior a propósito: es un modo de falla **distinto** y con otra causa.
     * Apuntar a `dist/frontend-ng` (sin `browser`) es el error natural de quien conoce el
     * `dist/` plano de Vite —el que usaba React— y no sabe que `@angular/build:application` reserva
     * ese nivel para separar la salida de navegador de la de servidor.
     *
     * Y falla en silencio: la carpeta `dist/frontend-ng` **existe**, así que `express.static` monta
     * sin queja y no encuentra ningún archivo; el `sendFile` del fallback responde 404 para todo. La
     * app queda en blanco con el backend sano y los logs limpios.
     *
     * Mutación: quitarle `/browser` a la ruta → rojo acá, verde en el caso de arriba (que solo
     * pregunta por Angular vs React). Por eso son dos casos y no uno.
     */
    expect(resolverRaizEstatica(STR_DIR_DIST).endsWith(path.join('dist', 'frontend-ng', 'browser'))).toBe(true);
  });

  it('resuelve relativo a la base que recibe, sin leer `__dirname` por su cuenta', () => {
    // Es lo que permite testear la ruta completa. Si la función usara `__dirname` internamente, el
    // test solo podría aseverar el sufijo y el `..` de más quedaría sin cubrir.
    expect(resolverRaizEstatica(path.join('/otro', 'sitio', 'dist'))).toBe(
      path.join('/otro', 'frontend-ng', 'dist', 'frontend-ng', 'browser'),
    );
  });
});

describe('correspondeFallbackSpa', () => {
  it('una navegación a una ruta de pantalla recibe el index.html', () => {
    // El caso que justifica que el fallback exista: refresh o enlace directo a un slug. El router de
    // Angular resuelve el path del lado del cliente, pero el request pega contra Express primero.
    // Verificado end-to-end contra el servidor en modo producción: 200 + text/html con <app-root>.
    expect(correspondeFallbackSpa('/COL_QD_SCR-003_Correccion_Error_Funcional')).toBe(true);
    expect(correspondeFallbackSpa('/COL_QD_SCR-013_Dashboard_Gestion_Casos')).toBe(true);
    expect(correspondeFallbackSpa('/gate-fachada')).toBe(true);
    expect(correspondeFallbackSpa('/')).toBe(true);
  });

  it('⚠ una ruta /api inexistente NO recibe el index.html', () => {
    /**
     * Antes de la Fase 7 esto devolvía HTML con **200**, así que un endpoint mal escrito llegaba al
     * cliente como un `JSON.parse` de `<!doctype html>` — la causa a tres capas del síntoma, y dentro
     * de un iframe de PM4 donde no hay barra de direcciones para notarlo.
     *
     * Mutación: quitar la guarda de `/api` de `correspondeFallbackSpa` → rojo en las tres
     * aserciones de este caso.
     */
    expect(correspondeFallbackSpa('/api/inexistente')).toBe(false);
    expect(correspondeFallbackSpa('/api/tasks/999')).toBe(false);
    // `/api` pelado también: el `startsWith('/api/')` solo no lo cubriría.
    expect(correspondeFallbackSpa('/api')).toBe(false);
  });

  it('pero una pantalla cuyo slug empieza con "api" sí lo recibe', () => {
    // El `startsWith('/api')` a secas —sin la barra ni la igualdad exacta— se comería esto y dejaría
    // la pantalla en 404. No hay hoy un slug así, y justamente por eso conviene que esté fijado:
    // el día que exista, el test dice qué se rompió.
    expect(correspondeFallbackSpa('/apiario')).toBe(true);
  });

  it('⚠ un asset faltante NO recibe el index.html: se decide por la extensión del path', () => {
    /**
     * El otro modo de falla que el fallback abierto producía: tras un deploy, un navegador con el
     * `index.html` viejo en cache pide un chunk que ya no existe con ese hash (`outputHashing: "all"`
     * en producción). Con HTML y 200 el navegador falla con `Unexpected token '<'`; con 404 dice
     * exactamente qué pasó.
     *
     * ⚠ **Este caso ya existía y pasaba en verde mientras el bug seguía abierto**, y eso es lo más
     * instructivo del archivo. La versión previa guardaba por `Accept: text/html` y el test le pasaba
     * `false` a mano — nunca medía qué produce Express de verdad. Medido: `req.accepts('html')`
     * devuelve `'html'` para el `Accept` comodín que manda un `fetch`, y también para un
     * `Accept: text/css` seguido del comodín con `q=0.1`, porque ese comodín de cola matchea todo.
     * Solo filtra un `Accept` explícitamente sin HTML. O sea que la guarda no separaba navegación de
     * asset, y el servidor en
     * modo producción devolvía `200 text/html` para `/chunk-VIEJO123.js` con este test en verde.
     *
     * Por eso ahora la decisión se toma sobre el path, del lado del servidor, y no sobre un header
     * que el cliente controla. Mutación: quitar el `if (pareceArchivo(...)) return false;` → rojo en
     * todas las aserciones de este caso.
     */
    expect(correspondeFallbackSpa('/chunk-VIEJO123.js')).toBe(false);
    expect(correspondeFallbackSpa('/main-PP4P5SKB.js')).toBe(false);
    expect(correspondeFallbackSpa('/styles-ABC.css')).toBe(false);
    expect(correspondeFallbackSpa('/assets/logo.svg')).toBe(false);
    expect(correspondeFallbackSpa('/media/fuente.woff2')).toBe(false);
    expect(correspondeFallbackSpa('/favicon.ico')).toBe(false);
    expect(correspondeFallbackSpa('/main-ABC.js.map')).toBe(false);
  });

  it('un punto en un segmento intermedio no convierte la ruta en un archivo', () => {
    // Se mira solo el último segmento: `/v1.2/pantalla` es una navegación, no un asset. Con un
    // `includes('.')` sobre el path entero esta pantalla daría 404 al refrescar.
    expect(correspondeFallbackSpa('/v1.2/COL_QD_SCR-003_Correccion_Error_Funcional')).toBe(true);
  });

  it('las dos guardas son independientes: un asset bajo /api también es false', () => {
    expect(correspondeFallbackSpa('/api/algo.json')).toBe(false);
  });
});
