/**
 * Guarda del cableado del CSS global — el spec que se pone rojo si alguien deshace el arreglo.
 *
 * **Por qué existe.** El defecto que este spec protege NO se manifiesta como un build rojo: con el
 * CSS importado desde un `.ts`, `@angular/build:application` lo compila correcto y lo deja
 * **huérfano** (sin `<link>` en el `index.html`), con el build en verde y ningún aviso. En el
 * navegador `shared.css` daba **0 reglas** y `--z-blue` resolvía a vacío. El porqué medido está en
 * el comentario de `src/zds-setup.ts`. O sea: ni `lint`, ni `build`, ni ningún spec de componente
 * detectan la regresión, porque el pintado real de un custom element de Lit no es observable en
 * jsdom. La única vía que queda es aseverar sobre la **configuración del builder**, que es lo que
 * decide si el `<link>` se emite.
 *
 * **Por qué el orden también se asevera, y no es cosmético.** Los entries string del array `styles`
 * se concatenan en UN solo bundle en orden de array (`normalizeGlobalEntries` → `global-styles.js`
 * los emite como `@import` en secuencia), así que el orden ES la cascada. Medido: entre las dos
 * hojas hay **exactamente una** propiedad declarada en ambas, `--z-bg` — `base.css` del DS la pone
 * en `var(--z-sf-base)` (blanco) y `shared.css` en `var(--zg-white-zurich)` (gris #ECEEEF). A igual
 * especificidad gana la última declaración, así que invertir el array **cambia un color de fondo
 * visible** sin romper nada más. Un cambio que se ve en el navegador y en ningún test es
 * exactamente el que necesita una guarda.
 *
 * Precedente y familia: `zona-horaria.spec.ts` hace lo mismo con la TZ (guarda sobre config de
 * build, no sobre lógica de la app). Si este spec falla, el defecto está en `angular.json`, no acá.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `process.cwd()` es la raíz del workspace `frontend-ng` cuando el builder invoca Vitest, que es
 * donde vive `angular.json`. Se lee crudo y se parsea a mano en vez de `import`arlo: un JSON
 * importado entraría al grafo de módulos del bundle de la app, y este archivo describe el build —
 * no es un dato de runtime.
 */
const OBJ_ANGULAR_JSON = JSON.parse(
  readFileSync(join(process.cwd(), 'angular.json'), 'utf8'),
) as {
  projects: Record<string, { architect: Record<string, { options: { styles?: string[] } }> }>;
};

const CLL_STYLES = OBJ_ANGULAR_JSON.projects['frontend-ng'].architect['build'].options.styles;

const RUTA_BASE_DS = 'node_modules/@zurich/css-components/dist/base.css';
const RUTA_SHARED = 'src/shared.css';

describe('guarda del CSS global (array `styles` de angular.json)', () => {
  it('el CSS global entra por el array `styles`, no por un import desde un `.ts`', () => {
    // Sin esta clave el `index.html` no recibe NINGÚN `<link>` de hoja global y la app se sirve
    // sin estilos, con el build en verde.
    expect(CLL_STYLES).toBeDefined();
    expect(CLL_STYLES).toContain(RUTA_BASE_DS);
    expect(CLL_STYLES).toContain(RUTA_SHARED);
  });

  it('`base.css` del DS va ANTES de `shared.css` — el orden del array ES la cascada', () => {
    const numBase = CLL_STYLES!.indexOf(RUTA_BASE_DS);
    const numShared = CLL_STYLES!.indexOf(RUTA_SHARED);

    // `toBeLessThan` sobre los índices y no `toEqual` sobre el array entero: lo que el contrato
    // exige es el orden relativo de estas dos hojas. Sumar una tercera hoja al final es un cambio
    // legítimo que no debería poner esto rojo.
    expect(numBase).toBeLessThan(numShared);
  });

  it('no hay más hojas globales que estas dos (una tercera cambiaría la cascada sin aviso)', () => {
    // Este caso es el que evita la vacuidad del anterior: con `toContain` + `toBeLessThan`, un
    // array de 5 entries podría meter una hoja entre las dos y los dos casos de arriba seguirían
    // verdes. Si algún día hace falta una tercera hoja, se agrega acá a propósito y se documenta
    // dónde cae en la cascada — que es justo la conversación que este caso fuerza.
    expect(CLL_STYLES).toEqual([RUTA_BASE_DS, RUTA_SHARED]);
  });
});
