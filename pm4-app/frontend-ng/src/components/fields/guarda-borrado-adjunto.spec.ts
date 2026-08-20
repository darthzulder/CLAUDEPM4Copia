import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STR_REGLA_BORRADO } from './zds-file-input';

/**
 * Guarda con **fecha de vencimiento** para el workaround de `revivirBotonDeBorrado()` de
 * [`zds-file-input.ts`](./zds-file-input.ts).
 *
 * ── Qué custodia, y por qué al revés de lo habitual ───────────────────────────────────────────
 * Las guardas de este directorio (`guarda-boton-habilitado`, `guarda-ngmodel`,
 * `guarda-formcontrolname`) se ponen rojas cuando **nuestro** código se olvida de algo. Esta se pone
 * roja cuando **el DS se arregla**, y eso es deliberado: es lo que separa "workaround con fecha de
 * vencimiento" de "deuda técnica".
 *
 * El wrapper inyecta `pointer-events: auto` en el shadow root del `z-file-input` porque el CSS del
 * propio paquete deja el botón de eliminar adjunto inerte —el detalle completo, con las dos reglas
 * citadas y por qué no hay salida por configuración, está en la cabecera de `zds-file-input.ts`—. **Es
 * un defecto que hay que reportar a Zurich.** El día que lo corrijan y este proyecto suba de versión,
 * el workaround se vuelve código muerto: inofensivo (`pointer-events: auto` sobre algo que ya es
 * `auto` es un no-op) y por eso mismo **invisible**. Nadie lo borraría nunca.
 *
 * Este spec fuerza el borrado: lee el SCSS del paquete instalado y falla si las reglas ofensoras
 * desaparecieron. Su mensaje de fallo es la instrucción de qué hacer.
 *
 * ── Por qué se lee `node_modules` y no se mockea ──────────────────────────────────────────────
 * La fuente de verdad es el paquete que realmente se instala del feed de Azure. Un fixture copiado
 * congelaría el estado de hoy y la guarda no notaría nunca la corrección — que es su único trabajo.
 * Angular consume `@zurich/web-components` directo del feed, sin vendorizar y sin `patch-package`, así
 * que este archivo es exactamente lo que corre en producción.
 *
 * ── El límite honesto ─────────────────────────────────────────────────────────────────────────
 * Esta guarda detecta que las reglas **desaparecieron**. No detecta que Zurich las reescriba de una
 * forma distinta que siga rompiendo el botón (por ejemplo, renombrando `data-input`): en ese caso
 * seguiría verde mientras el workaround dejó de aplicar, porque nuestro selector tampoco matchearía.
 * Ese caso solo lo agarra una medición en navegador real, y no hay forma de cubrirlo desde jsdom (ni
 * computa `pointer-events` ni hace hit-testing). Se documenta en vez de fingir cobertura.
 */
describe('guarda del workaround de borrado de adjunto (defecto del z-file-input)', () => {
  const STR_RUTA_SCSS = 'node_modules/@zurich/web-components/dist/z-file-input.js';
  const STR_RUTA_PLANTILLA = 'node_modules/@zurich/web-components/dist/file-input.js';

  /** El SCSS del shadow DOM vive como un string literal en el `.js` del componente. */
  function strScssDelDs(): string {
    const strFuente = readFileSync(STR_RUTA_SCSS, 'utf8');

    // Piso de cordura: si el paquete cambiara de forma (bundle distinto, SCSS en otro archivo), leer
    // un string vacío haría pasar todas las aserciones de abajo por vacuidad.
    expect(
      strFuente.length,
      `No se pudo leer el SCSS de ${STR_RUTA_SCSS}. Si el DS cambió la forma del bundle, hay que ` +
        `re-localizar la hoja de estilos antes de confiar en esta guarda.`,
    ).toBeGreaterThan(500);

    return strFuente;
  }

  it('⚠ la regla que mata el z-button SIGUE en el paquete (si no, borrar el workaround)', () => {
    // Es la regla que gobierna, y la que hace que `[droppable]="false"` no sea salida: no menciona
    // `droppable`, así que aplica siempre.
    expect(
      strScssDelDs(),
      `La regla \`div[data-input]:not(:has(~div[part=output-text] z-icon)) z-button{pointer-events:none}\` ` +
        `YA NO ESTÁ en ${STR_RUTA_SCSS}.\n\n` +
        `Si Zurich corrigió el defecto: BORRAR el workaround completo — ` +
        `\`revivirBotonDeBorrado()\`, \`STR_REGLA_BORRADO\`, el \`afterRenderEffect\` que lo llama, ` +
        `el bloque "DEFECTO DEL DS" de la cabecera de zds-file-input.ts, y este archivo de guarda. ` +
        `Verificar en navegador real (no jsdom) que el botón de eliminar adjunto borra el archivo ` +
        `sin abrir el explorador.`,
    ).toContain('div[data-input]:not(:has(~div[part=output-text] z-icon)) z-button{pointer-events:none}');
  });

  it('⚠ la regla de :host([droppable]) SIGUE poniendo pointer-events:none', () => {
    // La segunda mitad del defecto. Aplica porque `droppable` es `true` por defecto en el wrapper
    // (paridad con React), así que mata el área entera además del botón.
    expect(
      strScssDelDs(),
      `La regla \`:host([droppable]) div[data-input]{…;pointer-events:none}\` ya no está. Ver el ` +
        `mensaje del caso anterior: probablemente corresponde borrar el workaround.`,
    ).toContain(':host([droppable]) div[data-input]');
    expect(strScssDelDs()).toMatch(/:host\(\[droppable\]\) div\[data-input\]\{[^}]*pointer-events:none/);
  });

  it('⚠ el DS sigue sin renderizar `output-text`, así que su :not(:has()) nunca escapa', () => {
    // **Este es el bug a reportar a Zurich, reducido a una aserción.** La regla de arriba se
    // desactivaría si existiera un `div[part=output-text]` con un `z-icon` hermano — pero ese nodo
    // aparece SOLO en la hoja de estilos: ninguna plantilla del DS lo emite. O sea que la condición
    // de escape que el autor de la regla imaginó no existe, y el `pointer-events:none` es
    // incondicional en la práctica.
    //
    // Si este caso se pone rojo, el DS empezó a renderizar el nodo y la regla pasó a ser
    // condicional: hay que re-medir en navegador antes de decidir si el workaround sigue haciendo
    // falta.
    expect(
      readFileSync(STR_RUTA_PLANTILLA, 'utf8'),
      `\`file-input.js\` AHORA menciona \`output-text\`. La condición de escape de la regla del DS ` +
        `podría existir por fin; re-medir en navegador real si el botón funciona sin el workaround.`,
    ).not.toContain('output-text');
  });

  it('el workaround apunta al botón de acción y NO al link del nombre de archivo', () => {
    // `config="link"` es el nombre del archivo: su `pointer-events:none` es deliberado del DS (al
    // hacerle clic abre el blob en otra pestaña). Revivirlo introduciría un defecto nuevo. Este caso
    // existe para que un ensanchamiento del selector —"total, revivo todos los z-button"— se ponga
    // rojo acá en vez de descubrirse en producción.
    expect(STR_REGLA_BORRADO).toContain('z-button[config="secondary"]');
    expect(STR_REGLA_BORRADO).not.toContain('link');
    expect(STR_REGLA_BORRADO).toContain('pointer-events:auto');

    // Y que siga siendo una regla acotada al `div[data-input]` del label, no un selector global que
    // pise cualquier `z-button` que el componente agregue en el futuro.
    expect(STR_REGLA_BORRADO).toContain('label div[data-input]');
  });
});
