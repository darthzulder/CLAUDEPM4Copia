import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Specs del generador de `src/env.generated.ts`.
 *
 * ── Por qué se ejecuta el generador de verdad, en un subproceso ──────────────────────────────────
 * Porque `gen-env-define.mjs` es un script de nivel superior: **no exporta nada**, corre al
 * importarse y escribe el archivo. No hay función que llamar. Importarlo desde el spec sobrescribiría
 * el `env.generated.ts` real de la máquina —que contiene un token de dev— con lo que el test invente,
 * así que se lo corre con `execFileSync` apuntando su salida a un directorio temporal.
 *
 * ── ⚠ Los valores se INYECTAN por `process.env`, no se leen del `.env` ──────────────────────────
 * Y es la parte que hace que estos casos valgan algo. Un spec que leyera `VITE_LOCK_COUNTRY` del
 * módulo generado aseveraría sobre **lo que tenga el `.env` de esta máquina**: hoy `'true'`, mañana
 * lo que alguien configure, y en una clonada limpia el string vacío. O sea que pasaría o fallaría por
 * una causa que no es el código — y en el caso vacío pasaría *por vacuidad*, que es exactamente la
 * trampa que ya desarmó casos en `indice-pantallas.spec.ts` y `pantalla-no-encontrada.spec.ts`.
 *
 * El generador ya define que `process.env` gana sobre el `.env` (para permitir
 * `VITE_TASK_ID=123 npm run build`), así que inyectar por entorno no es un atajo del test: es el
 * mismo camino que usan CI y una corrida puntual.
 */

/**
 * ⚠ Este archivo vive en `src/` y no al lado del generador, en `scripts/`, **porque ahí no se
 * ejecutaba**. El builder `@angular/build:unit-test` descubre los specs desde el `buildTarget` de la
 * aplicación, o sea dentro de `src/`: un `scripts/gen-env-define.spec.ts` no lo levanta nadie y
 * un `--include` que lo apunte falla con *"No tests found matching the following patterns"*. Un
 * archivo de specs que nunca corre es peor que no tenerlo — se ve como una guarda y no guarda nada,
 * que es la misma clase de defecto que los casos vacuos de la Fase 4.
 *
 * ── Los tipos de Node se sumaron a `tsconfig.spec.json`, no al de la app ────────────────────────
 * Este es el primer spec del workspace que importa `node:*`, así que hizo falta agregar `"node"` a los
 * `types` de `tsconfig.spec.json` (antes solo `vitest/globals`). Va **solo** ahí a propósito: los
 * specs corren en Node y ahí `fs`/`process` existen de verdad, mientras el código que se bundlea para
 * el navegador sigue compilando contra `tsconfig.app.json`, donde `process` no está declarado. Es lo
 * que mantiene en pie el defecto que el propio generador documenta —un `process.env` que pasa los
 * tests porque jsdom corre sobre Node y explota en el navegador— como error de compilación.
 *
 * ── ⚠ La ruta sale de `process.cwd()`, NO de `import.meta.url` ─────────────────────────────────
 * Fue el primer intento y falla en runtime con `TypeError: The URL must be of scheme file`: el spec no
 * se ejecuta desde el disco, lo **bundlea** el builder de Angular, así que su `import.meta.url` no es
 * un `file://` sino la URL del módulo virtual. O sea que no sirve para ubicar nada del árbol de
 * fuentes. `__dirname` tampoco existe (el bundle es ESM).
 *
 * `cwd()` sí es estable acá: el builder corre Vitest con el raíz del workspace como directorio de
 * trabajo (lo confirma el encabezado `RUN v4.1.10 .../pm4-app/frontend-ng` de la corrida). Si algún
 * día dejara de serlo, este spec falla al arrancar con "no such file" nombrando la ruta — un modo de
 * falla ruidoso, no un caso que pasa por vacuidad.
 */
const STR_GENERADOR = resolve(process.cwd(), 'scripts', 'gen-env-define.mjs');

/** Directorio temporal donde el generador escribe, para no pisar el `env.generated.ts` real. */
let strDirTmp: string;

/**
 * Corre el generador con las variables dadas y devuelve el contenido del archivo emitido.
 *
 * El `cwd` no alcanza para redirigir la salida: el generador resuelve `STR_SALIDA` desde
 * `import.meta.url`, o sea contra su propia ubicación. Por eso se copia el `.mjs` al temporal con la
 * misma estructura relativa (`<tmp>/scripts/gen-env-define.mjs` → escribe en `<tmp>/src/`), que es la
 * única forma de moverlo sin agregarle un parámetro al script solo para el test.
 */
function generarCon(in_dicEnv: Record<string, string>, in_cllBorrar: string[] = []): string {
  const strScript = join(strDirTmp, 'scripts', 'gen-env-define.mjs');
  const dicEnv: Record<string, string | undefined> = {
    // `RENDER_GIT_COMMIT` fijo: si no, el generador invoca git y el hash cambia entre corridas.
    ...process.env,
    RENDER_GIT_COMMIT: 'commit-de-prueba',
    ...in_dicEnv,
  };
  // ⚠ Borrar una clave NO es lo mismo que pasarla vacía, y la diferencia es la que hace que el caso
  // del default valga algo: el generador resuelve con `process.env[k] ?? dicEnv[k] ?? ''`, y `''` **no
  // es nullish**, así que un `{ VITE_LOCK_COUNTRY: '' }` cortocircuita en el primer `??` y nunca llega
  // al default. Verificado por mutación: con el default cambiado a `'false'` el caso seguía **verde**.
  // Para ejercitar la tercera rama la clave tiene que estar ausente de verdad — y ausente también del
  // `process.env` heredado de esta máquina, que es lo que este parámetro se encarga de sacar.
  for (const strClave of in_cllBorrar) delete dicEnv[strClave];
  execFileSync(process.execPath, [strScript], {
    env: dicEnv,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  return readFileSync(join(strDirTmp, 'src', 'env.generated.ts'), 'utf8');
}

beforeAll(() => {
  strDirTmp = mkdtempSync(join(tmpdir(), 'gen-env-'));
  mkdirSync(join(strDirTmp, 'scripts'), { recursive: true });
  mkdirSync(join(strDirTmp, 'src'), { recursive: true });
  cpSync(STR_GENERADOR, join(strDirTmp, 'scripts', 'gen-env-define.mjs'));
});

afterAll(() => {
  rmSync(strDirTmp, { recursive: true, force: true });
});

describe('gen-env-define', () => {
  it('⚠ anota cada constante con `: string`, para que el tipo no sea el literal del valor', () => {
    // **La aserción central de este archivo, y la razón por la que existe.** Sin el `: string`, un
    // `export const X = "true"` tiene el tipo **literal** `"true"`, y `tsc` rechaza `X !== 'false'`
    // con `TS2367` ("los tipos no tienen overlap") porque cree que el valor es un hecho de
    // compilación. No lo es: sale del `.env` de quien buildea. Bajo Vite el mismo código compilaba
    // porque `import.meta.env.X` es `string | undefined`, o sea ya ancho.
    //
    // Lo encontró el port de `fields/fields.ts` (Fase 5), cuyo `LOCK_COUNTRY` es un flag *opt-out*
    // (`VITE_LOCK_COUNTRY !== 'false'`). El caso de abajo fija esa semántica; este fija que se pueda
    // **compilar**, que es el requisito previo.
    const strSalida = generarCon({ VITE_LOCK_COUNTRY: 'true' });

    expect(strSalida).toContain('export const VITE_LOCK_COUNTRY: string = "true";');
    // Y el hash del commit también, que es el que se compara contra literales en un banner de debug.
    expect(strSalida).toContain('export const STR_COMMIT_HASH: string =');

    // Ninguna constante sin anotar: si mañana se agrega una clave a mano en el template, esto la ve.
    const cllSinAnotar = [...strSalida.matchAll(/^export const (\w+) =/gm)].map(
      (in_objMatch) => in_objMatch[1],
    );
    expect(`sin anotar: [${cllSinAnotar.join(', ')}]`).toBe('sin anotar: []');
  });

  it('⚠ una variable ausente sale como string vacío, NO como "false" ni undefined', () => {
    // **Esto no es cosmética del default: gobierna un feature flag.** `LOCK_COUNTRY` se deriva con
    // `VITE_LOCK_COUNTRY !== 'false'`, así que el `''` de una variable ausente da `true` — igual que
    // el `undefined !== 'false'` que hace Vite hoy. Si alguien "mejorara" el default a `'false'`, el
    // país quedaría **desbloqueado** en todo entorno que no declare la variable, y sería un cambio
    // funcional invisible en el diff de un generador.
    //
    // ⚠ La clave se **borra** del entorno del subproceso, no se pasa vacía — y la primera versión de
    // este caso hacía lo segundo, que es lo que lo volvía vacuo. Con `{ VITE_LOCK_COUNTRY: '' }` el
    // `??` cortocircuita en el primer operando (`''` no es nullish) y el default jamás se evalúa:
    // comprobado mutando el generador a `?? 'false'`, con lo que el caso seguía **verde** mientras el
    // flag quedaba invertido en todo entorno que no declare la variable. Borrarla es la única forma
    // de llegar a la tercera rama, y hay que borrarla también del `process.env` heredado de esta
    // máquina —que la trae puesta— o el `...process.env` del helper la repone.
    const strSalida = generarCon({}, ['VITE_LOCK_COUNTRY', 'VITE_DEFAULT_COUNTRY_CODE']);

    expect(strSalida).toContain('export const VITE_LOCK_COUNTRY: string = "";');
    expect(strSalida).toContain('export const VITE_DEFAULT_COUNTRY_CODE: string = "";');

    // Y la clave presente-pero-vacía por separado: es un camino distinto del generador (corta en el
    // primer `??`) y llega al mismo `""`. Vale fijar los dos, porque `fields.ts` deriva `LOCK_COUNTRY`
    // sin poder distinguirlos y el día que uno cambie hay que enterarse por acá.
    const strSalidaVacia = generarCon({ VITE_LOCK_COUNTRY: '' });
    expect(strSalidaVacia).toContain('export const VITE_LOCK_COUNTRY: string = "";');

    // ⚠ Acá había un `expect('' !== 'false').toBe(true)` que pretendía "replicar la derivación de
    // `fields.ts`". Se quitó por dos motivos, y el segundo es gracioso: (1) no aseveraba nada del
    // generador, solo que `''` y `'false'` son strings distintos — un hecho de TypeScript, no de este
    // código; (2) **fallaba a compilar con el mismísimo `TS2367`** que motivó todo este arreglo, porque
    // los dos operandos son literales sin overlap. Quien quiera fijar esa semántica tiene que hacerlo
    // donde el valor sea de tipo `string`, o sea en un spec de `fields.ts`, no acá.
  });

  it('⚠ la lista de claves es cerrada: ningún secreto del backend llega al bundle', () => {
    // La contraprueba del contrato de seguridad del generador. Se le pasan los tres secretos que
    // viven en el mismo `.env` —y que el navegador nunca debe ver— y se asevera que **no** salen.
    // Sin este caso, cambiar el generador a volcar el `.env` entero (que es la "simplificación"
    // obvia: menos código, una lista menos que mantener) no pondría nada rojo.
    const strSalida = generarCon({
      PM4_TOKEN: 'secreto-del-backend',
      RECAPTCHA_SECRET_KEY: 'secreto-de-recaptcha',
      IFRAME_ENCRYPTION_KEY: 'secreto-de-iframe',
    });

    // ⚠ **Se asevera por VALOR, no por nombre de clave**, y el intento anterior de hacerlo por nombre
    // vale como advertencia: `expect(strSalida).not.toContain('PM4_TOKEN:')` **no puede pasar nunca**,
    // porque el archivo declara legítimamente `VITE_PM4_TOKEN:` y esa cadena contiene a la otra como
    // sufijo. El caso salía rojo sin que el generador tuviera nada malo. Por valor no hay ambigüedad:
    // si el secreto no está en el archivo, no se filtró, se llame como se llame la constante.
    expect(strSalida).not.toContain('secreto-del-backend');
    expect(strSalida).not.toContain('secreto-de-recaptcha');
    expect(strSalida).not.toContain('secreto-de-iframe');

    // Y las declaraciones exactas que **no** deben existir, ancladas al `export const` para que el
    // prefijado de `VITE_*` no las haga coincidir sin querer.
    expect(strSalida).not.toContain('export const PM4_TOKEN');
    expect(strSalida).not.toContain('export const RECAPTCHA_SECRET_KEY');
    expect(strSalida).not.toContain('export const IFRAME_ENCRYPTION_KEY');

    // El `VITE_PM4_TOKEN` sí va: es el fallback de dev del iframe, y es una clave distinta del
    // `PM4_TOKEN` del backend. Aseverar que está presente es lo que evita que este caso se "arregle"
    // algún día borrando la clave buena junto con las malas.
    expect(strSalida).toContain('export const VITE_PM4_TOKEN: string =');
  });

  it('process.env gana sobre el .env, que es lo que permite VITE_TASK_ID=123 npm run build', () => {
    // El orden de precedencia que el generador documenta y que CI usa. Es también el mecanismo del
    // que dependen los tres casos de arriba, así que conviene que esté aseverado por su cuenta: si
    // se invirtiera, los otros pasarían a leer el `.env` real y volverían a depender de la máquina.
    const strSalida = generarCon({ VITE_TASK_ID: '999-desde-el-entorno' });

    expect(strSalida).toContain('export const VITE_TASK_ID: string = "999-desde-el-entorno";');
  });
});
