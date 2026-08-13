#!/usr/bin/env node
/**
 * ÚNICA definición de "verde" del proyecto.
 *
 * Los tres anillos de verificación —`.githooks/pre-commit`, `.githooks/pre-push` y
 * `.github/workflows/ci.yml`— invocan ESTE script y nada más. La razón es histórica y
 * concreta: antes cada uno mantenía su propia lista de pasos y ya habían divergido (el hook
 * corría build+lint+test de los workspaces de Node, pero NO el `pytest` del
 * `cotizador-service`, que sí corría CI). El resultado era el clásico "en mi máquina
 * pasaba": commit verde en local, rojo en CI. Con un solo script, esa divergencia es
 * imposible por construcción.
 *
 * Uso:
 *   node scripts/verify.mjs              # salida silenciosa: solo imprime lo que falla
 *   node scripts/verify.mjs --verbose    # stream en vivo de cada paso (para CI)
 *   node scripts/verify.mjs --list       # enumera los pasos sin ejecutarlos
 *
 * Falla rápido: el primer paso rojo aborta el resto. En un gate no interesa el inventario
 * completo de roturas, interesa que no pase.
 *
 * Los builds se corren POR WORKSPACE a propósito, salteando el script `build` de la raíz:
 * ese dispara `prebuild` (pm4-registry-sync contra la instancia PM4 real), que haría una
 * llamada de red y podría reescribir pm4-registry.json en medio de un commit.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STR_DIR_RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const blnVerbose = process.argv.includes('--verbose');
const blnSoloListar = process.argv.includes('--list');

/**
 * Intérprete de Python con `pytest` disponible, o `null` si no hay ninguno.
 *
 * Se sondea en vez de asumirlo: en Windows es normal no tener Python instalado, y bloquear
 * cada commit del frontend por eso sería absurdo. Si no está, el paso se SALTA con aviso
 * ruidoso — CI siempre lo corre, así que la cobertura del cotizador nunca se pierde de
 * verdad, solo se retrasa hasta el PR.
 */
function detectarPython() {
  for (const strCmd of ['python', 'python3', 'py']) {
    const objProbe = spawnSync(`${strCmd} -m pytest --version`, { stdio: 'ignore', shell: true });
    if (objProbe.status === 0) return strCmd;
  }
  return null;
}

const STR_PYTHON = detectarPython();
const STR_DIR_COTIZADOR = path.join(STR_DIR_RAIZ, 'cotizador-service');

/**
 * Los pasos, en orden de costo creciente: lo que falla barato falla primero.
 *
 * `lint` y `typecheck` tardan segundos y atrapan la mayoría de los errores de tipeo, así que
 * van antes de los builds y de los ~13s de la suite de jsdom.
 */
const CLL_PASOS = [
  { nombre: 'lint · frontend',     cmd: 'npm run lint --workspace=frontend' },
  { nombre: 'lint · backend',      cmd: 'npm run lint --workspace=backend' },
  { nombre: 'typecheck · backend', cmd: 'npm run typecheck --workspace=backend' },
  { nombre: 'build · frontend',    cmd: 'npm run build --workspace=frontend' },
  { nombre: 'build · backend',     cmd: 'npm run build --workspace=backend' },
  { nombre: 'test · frontend',     cmd: 'npm run test --workspace=frontend' },
  { nombre: 'test · backend',      cmd: 'npm run test --workspace=backend' },
  // Los utilitarios de scripts/ no pertenecen a ningún workspace, así que necesitan su propio
  // paso: agregarlos al script `test` del package.json no tendría efecto acá, porque esta lista
  // no invoca `npm run test` sino cada workspace por separado.
  { nombre: 'test · scripts',      cmd: 'npm run test:scripts' },
  {
    nombre: 'test · cotizador (pytest)',
    cmd: `${STR_PYTHON ?? 'python'} -m pytest -q`,
    cwd: STR_DIR_COTIZADOR,
    // Se salta —con aviso— si no hay Python con pytest, o si el servicio no está en el árbol.
    saltarPorque: !existsSync(STR_DIR_COTIZADOR)
      ? 'no existe cotizador-service/ en este árbol'
      : !STR_PYTHON
        ? 'no hay Python con pytest en el PATH (CI sí lo corre; instalá: pip install -r cotizador-service/requirements-dev.txt)'
        : null,
  },
];

if (blnSoloListar) {
  for (const objPaso of CLL_PASOS) {
    console.log(`${objPaso.saltarPorque ? '⏭ ' : '• '}${objPaso.nombre}${objPaso.saltarPorque ? `  (se salta: ${objPaso.saltarPorque})` : ''}`);
  }
  process.exit(0);
}

console.log(`[verify] ${CLL_PASOS.length} pasos · node ${process.version}${STR_PYTHON ? ` · ${STR_PYTHON}` : ''}`);

const cllSaltados = [];
const intInicioTotal = Date.now();

for (const objPaso of CLL_PASOS) {
  if (objPaso.saltarPorque) {
    cllSaltados.push(objPaso);
    console.log(`⏭  ${objPaso.nombre} — SALTADO: ${objPaso.saltarPorque}`);
    continue;
  }

  const intInicio = Date.now();
  if (blnVerbose) console.log(`\n──────── ${objPaso.nombre} ────────`);

  // En modo silencioso se bufferea la salida y solo se imprime si el paso falla: en verde el
  // gate no tiene por qué escupir 200 líneas de build, y en rojo se ve todo lo necesario.
  // Comando como STRING con `shell: true`, no como (cmd, args[]): en Windows `npm` es un
  // `npm.cmd`, y desde la corrección de CVE-2024-27980 Node se niega a ejecutar `.cmd`/`.bat`
  // sin shell (falla con EINVAL). Pasar además un array de args con shell activo emite
  // DEP0190, porque los argumentos se concatenan sin escapar. La forma sancionada es un único
  // string, y acá es segura porque todos los comandos son literales de este archivo: no hay
  // ninguna entrada externa que interpolar.
  const objRes = spawnSync(objPaso.cmd, {
    cwd: objPaso.cwd ?? STR_DIR_RAIZ,
    stdio: blnVerbose ? 'inherit' : 'pipe',
    encoding: 'utf8',
    shell: true,
  });

  const strSegundos = ((Date.now() - intInicio) / 1000).toFixed(1);

  if (objRes.error || objRes.status !== 0) {
    console.error(`\n❌ ${objPaso.nombre} — FALLÓ (${strSegundos}s)`);
    if (!blnVerbose) {
      if (objRes.stdout) process.stdout.write(objRes.stdout);
      if (objRes.stderr) process.stderr.write(objRes.stderr);
    }
    if (objRes.error) console.error(String(objRes.error.message ?? objRes.error));
    console.error(`\n[verify] ❌ Rojo en: ${objPaso.nombre}`);
    process.exit(1);
  }

  console.log(`✅ ${objPaso.nombre} (${strSegundos}s)`);
}

const strTotal = ((Date.now() - intInicioTotal) / 1000).toFixed(1);
console.log(`\n[verify] ✅ Todo verde en ${strTotal}s.`);

if (cllSaltados.length > 0) {
  console.log(`[verify] ⚠️  ${cllSaltados.length} paso(s) saltado(s) — la verificación NO fue completa:`);
  for (const objPaso of cllSaltados) console.log(`[verify] ⚠️    · ${objPaso.nombre}: ${objPaso.saltarPorque}`);
  console.log('[verify] ⚠️  CI los corre igual; si dan rojo allá, es por esto.');
}
