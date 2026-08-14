/**
 * Genera `src/env.generated.ts` a partir del `.env` de `pm4-app/`, para que los tres fallbacks de
 * entorno que hoy usa React (`VITE_PM4_TOKEN`, `VITE_TASK_ID`, `VITE_CASE_ID`) existan también en
 * Angular sin que la app tenga que leer `process.env` en el navegador.
 *
 * ── Por qué un archivo generado y no `define` de `angular.json` a secas ──────────────────────────
 * Se intentó primero con `define`, que es el equivalente directo del `define` de Vite. **No sirve
 * solo**, y el modo de falla es silencioso en desarrollo: el schema del builder de Angular dice
 * textualmente *"The value will be used directly. String values must be put in quotes"* — o sea que
 * `define` hace sustitución de **texto**, no evaluación. Poner
 *
 *     "define": { "VITE_TASK_ID": "process.env.VITE_TASK_ID" }
 *
 * inyecta en el bundle la expresión literal `process.env.VITE_TASK_ID`, que en el navegador es
 * `ReferenceError: process is not defined` y tumba la pantalla entera, no solo el fallback.
 * Verificado dumpeando el bundle emitido (`--dump-virtual-files`): la salida contenía
 * `process.env.VITE_TASK_ID` tal cual. **Y pasaba los tests**, porque jsdom corre sobre Node y ahí
 * `process` sí existe — el caso exacto de un verde que no prueba lo que parece probar.
 *
 * Para que `define` funcione habría que escribir el valor ya serializado (`"'abc'"`), y `angular.json`
 * es JSON estático: no puede computar `JSON.stringify(process.env.X)`. De ahí este generador, que es
 * lo que Vite hace internamente antes de sustituir.
 *
 * ── Contrato ────────────────────────────────────────────────────────────────────────────────────
 * - Los valores se serializan con `JSON.stringify`, así que lo que llega al bundle es un **literal**
 *   de string, sin ninguna referencia a `process`.
 * - Una variable ausente sale como `''`, no como `undefined`: replica el `?? ''` de `useToken.ts` y
 *   evita que el tipo del servicio tenga que ser `string | undefined`.
 * - Se generan **solo estas tres**. `VITE_PROCESS_ID`/`VITE_EVENT_ID` los lee `useToken.ts` en React
 *   pero **no están declarados en `.env.example`**, cuyas líneas 15-19 dicen explícitamente que los
 *   IDs de proceso/colección/script ya no se configuran por variable de entorno — viven en
 *   `pm4-registry.json` (regla 6). Portarlos sería recrear deuda que el proyecto ya sacó.
 * - El archivo generado está gitignoreado y **puede contener un token de dev**: nunca commitearlo.
 *
 * ── Por qué este script está enganchado también a `lint` ─────────────────────────────────────────
 * Porque el archivo está gitignoreado, en una clonada limpia **no existe**, y `lint` no es solo
 * ESLint: corre `tsc -p tsconfig.app.json --noEmit`, que resuelve el `import` de `../env.generated`
 * desde `core/pm4-context.service.ts`. Sin generar, muere con
 * `error TS2307: Cannot find module '../env.generated'` y exit 2 — verificado moviendo el archivo
 * fuera y corriendo `npm run lint`. O sea que `verify` nacería rojo en cualquier máquina que no
 * hubiera corrido `build`/`test` antes, por una causa que no es un defecto del código.
 *
 * Por eso va prependeado en **los 8 scripts** que tocan el árbol de fuentes (`dev`, `start`, `build`,
 * `watch`, `lint`, `test`, `test:watch`, `coverage`) y no en un `prepare`/`postinstall`: un hook de
 * install corre una sola vez y no cubre el caso de que alguien edite el `.env` y vuelva a buildear.
 * Es idempotente y cuesta milisegundos, así que repetirlo es más barato que razonar sobre cuándo hace
 * falta.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STR_DIR = dirname(fileURLToPath(import.meta.url));
const STR_ENV = resolve(STR_DIR, '../../.env');
const STR_SALIDA = resolve(STR_DIR, '../src/env.generated.ts');

// Las únicas tres con fallback por entorno (ver el bloque de contrato arriba).
const LST_CLAVES = ['VITE_PM4_TOKEN', 'VITE_TASK_ID', 'VITE_CASE_ID'];

/**
 * Parser mínimo de `.env`. No se usa `dotenv` a propósito: es dependencia de `backend/`, no de este
 * workspace, y hacer que el build de `frontend-ng` dependa de un paquete de otro workspace es
 * acoplamiento gratuito para leer `CLAVE=valor`.
 *
 * Soporta comentarios (`#`), líneas vacías, y comillas alrededor del valor (simples o dobles), que es
 * lo que `.env.example` usa. No soporta multilínea ni escapes — si algún día hace falta, acá se ve.
 */
function parsearEnv(in_strContenido) {
  const dicSalida = {};
  for (const strLinea of in_strContenido.split(/\r?\n/)) {
    const strLimpia = strLinea.trim();
    if (!strLimpia || strLimpia.startsWith('#')) continue;
    const intIgual = strLimpia.indexOf('=');
    if (intIgual === -1) continue;
    const strClave = strLimpia.slice(0, intIgual).trim();
    let strValor = strLimpia.slice(intIgual + 1).trim();
    // Desenvolvemos las comillas si el valor viene entrecomillado
    if (
      (strValor.startsWith('"') && strValor.endsWith('"')) ||
      (strValor.startsWith("'") && strValor.endsWith("'"))
    ) {
      strValor = strValor.slice(1, -1);
    }
    dicSalida[strClave] = strValor;
  }
  return dicSalida;
}

const dicEnv = existsSync(STR_ENV) ? parsearEnv(readFileSync(STR_ENV, 'utf8')) : {};

// `process.env` gana sobre el `.env`: es lo que permite `VITE_TASK_ID=123 npm run build` en CI y en
// una corrida puntual, sin editar el archivo. Mismo orden de precedencia que usa Vite.
const dicValores = {};
for (const strClave of LST_CLAVES) {
  dicValores[strClave] = process.env[strClave] ?? dicEnv[strClave] ?? '';
}

const strContenido = `// ARCHIVO GENERADO por scripts/gen-env-define.mjs — NO EDITAR NI COMMITEAR.
// Se regenera en cada build/dev/test desde \`pm4-app/.env\` (o desde process.env, que gana).
// El porqué de que esto sea un archivo generado y no un \`define\` de angular.json está en el
// encabezado del generador: \`define\` sustituye TEXTO, no evalúa, así que dejar
// \`process.env.VITE_TASK_ID\` ahí inyecta esa expresión cruda en el bundle del navegador.
${LST_CLAVES.map((in_strClave) => `export const ${in_strClave} = ${JSON.stringify(dicValores[in_strClave])};`).join('\n')}
`;

writeFileSync(STR_SALIDA, strContenido, 'utf8');

// Se reporta solo la presencia, jamás el valor: uno de los tres es un token PM4.
const strResumen = LST_CLAVES.map(
  (in_strClave) => `${in_strClave}=${dicValores[in_strClave] ? '<presente>' : '<vacío>'}`,
).join(' · ');
// eslint-disable-next-line no-console
console.log(`env.generated.ts → ${strResumen}`);
