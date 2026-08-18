#!/usr/bin/env node
/**
 * Cobertura de las LÍNEAS QUE CAMBIASTE, no del proyecto.
 *
 * La pregunta útil en un PR no es "¿cuánto cubre el repo?" —un número global se mueve tan
 * poco que nadie lo mira— sino "¿qué parte de MI cambio no está ejercitada por ningún test?".
 * Este script cruza dos cosas:
 *
 *   1. las líneas añadidas/modificadas según `git diff <base>...HEAD`, y
 *   2. el `coverage/lcov.info` que produce `npm run coverage`.
 *
 * Es una SEÑAL, deliberadamente NO un gate. Un umbral de cobertura obligatorio premia el test
 * que ejecuta la línea sin asertar nada, y este proyecto ya pagó esa deuda: había aserciones
 * que pasaban con un componente vacío. El criterio de aceptación sigue siendo el de
 * docs/guides/testing-conventions.md (romper el código y ver el test en rojo); esto solo
 * señala dónde mirar.
 *
 * Uso:
 *   node scripts/coverage-diff.mjs                          # base = la de integración de la rama
 *   node scripts/coverage-diff.mjs --base origin/main
 *   node scripts/coverage-diff.mjs --summary "$GITHUB_STEP_SUMMARY"   # además escribe Markdown
 *
 * La base por defecto NO es `main`: la resuelve integration-base.mjs según la rama (`develop` para las
 * ramas de trabajo). Cuando estaba fija en `main`, una rama salida de `develop` se llevaba puestos como
 * "propios" todos los commits que `develop` tiene de más que `main`, y el informe era inservible.
 *
 * Sin dependencias ni actions de terceros: parsea lcov (formato trivial) y usa git.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseEfectiva, STR_RAMA_DESARROLLO } from './integration-base.mjs';

const STR_DIR_RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STR_DIR_REPO = path.resolve(STR_DIR_RAIZ, '..');

/**
 * Un lcov por workspace. Las rutas dentro de cada archivo son relativas a su workspace, así que
 * hay que recordar de cuál vino cada uno para resolverlas.
 */
const CLL_LCOV = [
  { base: path.join(STR_DIR_RAIZ, 'frontend'), lcov: path.join(STR_DIR_RAIZ, 'frontend', 'coverage', 'lcov.info') },
  // `frontend-ng` anida un nivel más: `@angular/build:unit-test` escribe en
  // `coverage/<nombre-del-proyecto>/`, no en `coverage/` como hace Vitest invocado a mano. Apuntar
  // a `coverage/lcov.info` acá no falla con error — el `existsSync` de abajo lo saltea en silencio
  // y el workspace queda invisible en el informe, que es justo el modo de falla que este script
  // existe para evitar.
  {
    base: path.join(STR_DIR_RAIZ, 'frontend-ng'),
    lcov: path.join(STR_DIR_RAIZ, 'frontend-ng', 'coverage', 'frontend-ng', 'lcov.info'),
  },
  { base: path.join(STR_DIR_RAIZ, 'backend'), lcov: path.join(STR_DIR_RAIZ, 'backend', 'coverage', 'lcov.info') },
];

/**
 * Archivos que la cobertura excluye A PROPÓSITO.
 *
 * Hay que distinguir dos ausencias que se ven idénticas en el lcov: un archivo que ningún test
 * carga (hallazgo real, hay que avisar) y uno que se excluyó de la medición (ruido). Sin este
 * filtro, el informe marcaba como "sin tests" a los propios `*.test.ts` — que son el instrumento
 * de medición, no el sujeto.
 *
 * Debe mantenerse alineado con los `coverage.exclude` de frontend/vitest.config.ts,
 * backend/vitest.config.ts y el `coverageExclude` del target `test` de frontend-ng/angular.json,
 * donde está el porqué de cada uno.
 */
const CLL_EXCLUIDOS = [
  /\.test\.tsx?$/,
  // Angular usa `*.spec.ts` (default del CLI) donde React usa `*.test.tsx`. Sin esta línea, los
  // specs nuevos se reportarían a sí mismos como "ningún test carga este archivo".
  /\.spec\.ts$/,
  /\/test-setup\.ts$/,
  /\/main\.tsx$/,
  /\/main\.ts$/,
  /\/zds-setup\.ts$/,
  /\/app\.config\.ts$/,
  /\/variables\.ts$/,
  /\.types\.ts$/,
  /\/backend\/src\/server\.ts$/,
];

/** Solo el código fuente de los workspaces: configs, scripts y docs no tienen cobertura que medir. */
const RGX_FUENTE = /^pm4-app\/(frontend|frontend-ng|backend)\/src\//;

function estaExcluido(in_strRuta) {
  return CLL_EXCLUIDOS.some((in_rgx) => in_rgx.test(in_strRuta));
}

function leerArg(in_strFlag, in_strDefecto) {
  const intIdx = process.argv.indexOf(in_strFlag);
  return intIdx !== -1 && process.argv[intIdx + 1] ? process.argv[intIdx + 1] : in_strDefecto;
}

// Sin `--base`, la base sale de la rama actual. Si el HEAD está desprendido o la rama es la punta
// del flujo (`main`), no hay base deducible: se cae a `develop`, que es contra lo que se integra el
// trabajo diario, en vez de fallar.
const STR_BASE = leerArg('--base', `origin/${baseEfectiva() ?? STR_RAMA_DESARROLLO}`);
const STR_SUMMARY = leerArg('--summary', null);

function git(...in_cllArgs) {
  const objRes = spawnSync('git', in_cllArgs, { cwd: STR_DIR_RAIZ, encoding: 'utf8', shell: false });
  if (objRes.status !== 0) throw new Error(`git ${in_cllArgs.join(' ')} falló: ${objRes.stderr?.trim()}`);
  return objRes.stdout;
}

/**
 * Líneas añadidas o modificadas por el diff, como `Map<rutaRelativaAlRepo, Set<nroLinea>>`.
 *
 * Se usa `<base>...HEAD` (tres puntos) y no `<base>..HEAD`: con tres puntos git diffea contra
 * el ancestro común, así que los commits que main sumó DESPUÉS de que salió la rama no
 * aparecen como si fueran tuyos.
 *
 * Solo se miran las líneas `+` del unified diff, que son las que este cambio introduce. Las
 * borradas no tienen cobertura que medir.
 */
function lineasDelDiff() {
  const strDiff = git('diff', '--unified=0', '--diff-filter=AM', `${STR_BASE}...HEAD`, '--', '*.ts', '*.tsx');
  const objPorArchivo = new Map();
  let strArchivo = null;
  let intLinea = 0;

  for (const strFila of strDiff.split('\n')) {
    if (strFila.startsWith('+++ b/')) {
      strArchivo = strFila.slice('+++ b/'.length).trim();
      continue;
    }
    // Cabecera de hunk: @@ -viejo,n +nuevo,n @@ — de ahí sale el número de la primera línea.
    const objHunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(strFila);
    if (objHunk) {
      intLinea = Number(objHunk[1]);
      continue;
    }
    if (!strArchivo) continue;
    if (strFila.startsWith('+') && !strFila.startsWith('+++')) {
      if (!objPorArchivo.has(strArchivo)) objPorArchivo.set(strArchivo, new Set());
      objPorArchivo.get(strArchivo).add(intLinea);
      intLinea += 1;
    }
  }
  return objPorArchivo;
}

/**
 * Cobertura por archivo, uniendo los lcov de todos los workspaces:
 * `Map<rutaRelativaAlRepo, Map<nroLinea, vecesEjecutada>>`.
 *
 * Del formato solo interesan dos registros: `SF:<ruta>` abre un archivo y `DA:<linea>,<hits>`
 * da los hits de una línea ejecutable. Las rutas de lcov son relativas al workspace, así que se
 * normalizan a rutas relativas a la raíz del REPO, que es el vocabulario en el que habla
 * `git diff`.
 */
function coberturaPorArchivo() {
  const objPorArchivo = new Map();

  for (const objFuente of CLL_LCOV) {
    if (!existsSync(objFuente.lcov)) continue;
    let objActual = null;

    for (const strFila of readFileSync(objFuente.lcov, 'utf8').split('\n')) {
      if (strFila.startsWith('SF:')) {
        const strAbs = path.resolve(objFuente.base, strFila.slice(3).trim());
        const strRel = path.relative(STR_DIR_REPO, strAbs).split(path.sep).join('/');
        objActual = new Map();
        objPorArchivo.set(strRel, objActual);
        continue;
      }
      if (strFila.startsWith('DA:') && objActual) {
        const [strLinea, strHits] = strFila.slice(3).split(',');
        objActual.set(Number(strLinea), Number(strHits));
      }
    }
  }
  return objPorArchivo;
}

// ── Informe ───────────────────────────────────────────────────────────────────────────────

if (!CLL_LCOV.some((in_objFuente) => existsSync(in_objFuente.lcov))) {
  console.error('[coverage-diff] No hay ningún lcov.info. Corré antes: npm run coverage');
  process.exit(1);
}

const objDiff = lineasDelDiff();
const objCobertura = coberturaPorArchivo();

const cllFilas = [];
const cllOmitidos = [];
let intTotalMedibles = 0;
let intTotalCubiertas = 0;

for (const [strArchivo, objLineas] of [...objDiff].sort()) {
  // Fuera del `src/` de un workspace no hay cobertura que medir (configs, scripts, docs), y los
  // excluidos deliberadamente se cuentan aparte para no disfrazarlos de hallazgo.
  if (!RGX_FUENTE.test(strArchivo) || estaExcluido(strArchivo)) {
    cllOmitidos.push(strArchivo);
    continue;
  }

  const objHits = objCobertura.get(strArchivo);
  // Sin entrada en lcov el archivo no lo carga ningún test: no es 0% de líneas medibles, es
  // "ningún test lo toca", y conviene decirlo distinto.
  if (!objHits) {
    cllFilas.push({ archivo: strArchivo, medibles: 0, cubiertas: 0, sinTests: true, descubiertas: [] });
    continue;
  }

  // Solo cuentan las líneas del diff que lcov considera EJECUTABLES: comentarios, tipos,
  // imports y llaves no aparecen en `DA:` y contarlas como descubiertas sería ruido.
  const cllMedibles = [...objLineas].filter((in_intLinea) => objHits.has(in_intLinea));
  const cllDescubiertas = cllMedibles.filter((in_intLinea) => objHits.get(in_intLinea) === 0);

  intTotalMedibles += cllMedibles.length;
  intTotalCubiertas += cllMedibles.length - cllDescubiertas.length;

  if (cllMedibles.length > 0) {
    cllFilas.push({
      archivo: strArchivo,
      medibles: cllMedibles.length,
      cubiertas: cllMedibles.length - cllDescubiertas.length,
      sinTests: false,
      descubiertas: cllDescubiertas.sort((a, b) => a - b),
    });
  }
}

const strPct = intTotalMedibles === 0 ? 'n/d' : `${((intTotalCubiertas / intTotalMedibles) * 100).toFixed(1)}%`;

console.log(`\n[coverage-diff] base: ${STR_BASE}`);
console.log(`[coverage-diff] líneas nuevas ejecutables: ${intTotalMedibles} · cubiertas: ${intTotalCubiertas} (${strPct})\n`);

for (const objFila of cllFilas) {
  if (objFila.sinTests) {
    console.log(`  ⚠️  ${objFila.archivo} — ningún test carga este archivo`);
    continue;
  }
  const strEstado = objFila.descubiertas.length === 0 ? '✅' : '⚠️ ';
  console.log(`  ${strEstado} ${objFila.archivo} — ${objFila.cubiertas}/${objFila.medibles}`);
  if (objFila.descubiertas.length > 0) {
    console.log(`       sin cubrir: ${objFila.descubiertas.join(', ')}`);
  }
}

if (cllFilas.length === 0) console.log('  (el diff no toca líneas ejecutables de TS/TSX)');

if (cllOmitidos.length > 0) {
  console.log(`\n  ${cllOmitidos.length} archivo(s) del diff sin cobertura que medir (tests, config, bootstrap).`);
}

// En CI se escribe además al job summary, que es donde se lee sin abrir los logs.
if (STR_SUMMARY) {
  const cllMd = [
    '## Cobertura del diff',
    '',
    `Base: \`${STR_BASE}\` · líneas nuevas ejecutables: **${intTotalMedibles}** · cubiertas: **${intTotalCubiertas}** (${strPct})`,
    '',
    '> Señal, no gate. Que una línea esté cubierta significa que un test la ejecutó, **no** que la asserte.',
    '',
  ];
  if (cllFilas.length === 0) {
    cllMd.push('_El diff no toca líneas ejecutables de TS/TSX._');
  } else {
    cllMd.push('| Archivo | Cubiertas | Líneas sin cubrir |', '|---|---|---|');
    for (const objFila of cllFilas) {
      cllMd.push(objFila.sinTests
        ? `| \`${objFila.archivo}\` | — | ⚠️ ningún test carga este archivo |`
        : `| \`${objFila.archivo}\` | ${objFila.cubiertas}/${objFila.medibles} | ${objFila.descubiertas.join(', ') || '—'} |`);
    }
  }
  appendFileSync(STR_SUMMARY, cllMd.join('\n') + '\n');
}
