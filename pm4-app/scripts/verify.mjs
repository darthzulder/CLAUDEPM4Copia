#!/usr/bin/env node
/**
 * ÚNICA definición de "verde" del proyecto.
 *
 * Los tres anillos de verificación —`.githooks/pre-commit`, `.githooks/pre-push` y
 * `.github/workflows/ci.yml`— invocan ESTE script y nada más. La razón es histórica y
 * concreta: antes cada uno mantenía su propia lista de pasos y ya habían divergido (el hook
 * corría build+lint+test de los workspaces de Node, pero NO el `pytest` del microservicio
 * Python que entonces vivía en el árbol, que sí corría CI). El resultado era el clásico "en mi
 * máquina pasaba": commit verde en local, rojo en CI. Con un solo script, esa divergencia es
 * imposible por construcción — y el motivo sigue en pie aunque desde `d4e63a4` todos los pasos
 * sean de Node: la próxima lista paralela volvería a divergir igual.
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
 *
 * Runner de los pasos de Node/npm (ver `detectarRunnerNode`): host si tiene la versión
 * correcta, `pm4-app-container` si no. Se decide POR PASO, no una vez para todo el script, así
 * que también beneficia un `npm run verify` corrido a mano, no solo el de los hooks. El host
 * se prefiere sobre Docker cuando los dos están disponibles: trae la misma versión de Node sin
 * el costo de I/O del bind mount de Windows. El contenedor sigue siendo un respaldo válido
 * —también garantiza el major correcto— nunca la primera opción.
 *
 * CORREGIDO (ago-2026): este encabezado atribuía la intermitencia de `App.smoke.test.tsx` al
 * contenedor, y por lo tanto la preferencia por el host se leía como su mitigación. Era un
 * diagnóstico equivocado. La causa real vivía en el propio test: sus `waitFor` usaban el
 * default de 1000 ms de RTL mientras el `testTimeout` de vitest.config.ts es 15_000, así que
 * bajo contención del pool de workers abandonaban la espera con 14 s de presupuesto sin usar.
 * Reprodujo también en host al sumar los pasos de `frontend-ng` (más carga en la misma
 * máquina), lo que descartó a Docker como factor. Arreglado alineando los dos timeouts, con la
 * mutación que lo confirma documentada en el comentario de ese `waitFor`. Si vuelve a aparecer
 * intermitencia ahí, el sospechoso ya no es el contenedor.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STR_DIR_RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Igual que `Dockerfile` (`node:24-alpine`), `.github/workflows/ci.yml` (`actions/setup-node`)
// y el runtime de Render — las cuatro superficies fijan el mismo major a propósito (ver el
// comentario de Node 24 en ci.yml). Un host con un major distinto no es "probablemente
// compatible": es el mismo tipo de drift que ya costó la migración de Node 20 a 24.
const NUM_NODE_MAJOR_REQUERIDO = 24;
const STR_CONTENEDOR = 'pm4-app-container';

const blnVerbose = process.argv.includes('--verbose');
const blnSoloListar = process.argv.includes('--list');

/**
 * Dónde correr los pasos de Node/npm: host si tiene la versión correcta, `pm4-app-container`
 * si no. Antes esta decisión la tomaba cada `.githooks/*` por su cuenta, y solo miraba si
 * HABÍA un `npm` en el PATH — nunca si era la versión correcta, así que un host con Node 18/20
 * pasaba el chequeo igual y corría todo ahí. Acá se valida la versión real.
 */
function detectarRunnerNode() {
  const objVersion = spawnSync('node', ['--version'], { encoding: 'utf8' });
  if (objVersion.status === 0) {
    // parseInt corta en el primer '.', así que "24.19.0" → 24 sin partir el string a mano.
    const numMajor = parseInt(objVersion.stdout.trim().replace(/^v/, ''), 10);
    if (numMajor === NUM_NODE_MAJOR_REQUERIDO) return { modo: 'host', detalle: objVersion.stdout.trim() };
  }

  // Host ausente o con la versión equivocada: se prueba el contenedor, que SIEMPRE trae la
  // correcta (Dockerfile fija `node:24-alpine`) — es un respaldo confiable, no una apuesta.
  const objDocker = spawnSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' });
  const cllNombres = objDocker.status === 0 ? objDocker.stdout.split('\n').map((s) => s.trim()) : [];
  if (cllNombres.includes(STR_CONTENEDOR)) return { modo: 'docker', detalle: STR_CONTENEDOR };

  return { modo: null, detalle: null };
}

const OBJ_RUNNER_NODE = detectarRunnerNode();

/**
 * Los pasos, en orden de costo creciente: lo que falla barato falla primero.
 *
 * `lint` y `typecheck` tardan segundos y atrapan la mayoría de los errores de tipeo, así que
 * van antes de los builds y de los ~13s de la suite de jsdom.
 */
/**
 * ── El estado de los DOS frontends después de la Fase 7 ─────────────────────────────────────────
 *
 * La Fase 7 cerró la migración: **el frontend desplegado es Angular** (`frontend-ng`). React
 * (`frontend`) ya no se buildea en el deploy —salió del script `build` de la raíz— ni lo sirve el
 * backend, pero **sigue en el árbol** como referencia de paridad viva mientras el usuario valida el
 * despliegue en la nube.
 *
 * Por eso sus tres pasos siguen acá y no se borraron: mientras el código exista, tiene que compilar
 * y pasar sus tests, porque un React roto silenciosamente deja de servir para comparar justo cuando
 * hace falta. Van con `saltarPorque` condicionado a que la carpeta exista, así que el día que se
 * borre el gate sigue verde sin tener que tocar este archivo en ese mismo commit — que es
 * exactamente el tipo de acoplamiento que hace que un borrado "simple" salga rojo por otra causa.
 *
 * El `lint` de `frontend-ng` incluye su propio `tsc --noEmit`, así que no necesita paso de typecheck
 * aparte.
 */
// `STR_DIR_RAIZ` es `pm4-app/` (este script vive en `pm4-app/scripts/`), no la raíz del repo.
const STR_DIR_REACT = path.join(STR_DIR_RAIZ, 'frontend');
const STR_SALTO_REACT = !existsSync(STR_DIR_REACT)
  ? 'el workspace `frontend` (React) ya no está en el árbol — retirado tras la Fase 7'
  : null;

const CLL_PASOS = [
  { nombre: 'lint · frontend',     cmd: 'npm run lint --workspace=frontend',  saltarPorque: STR_SALTO_REACT },
  { nombre: 'lint · frontend-ng',  cmd: 'npm run lint --workspace=frontend-ng' },
  { nombre: 'lint · backend',      cmd: 'npm run lint --workspace=backend' },
  { nombre: 'typecheck · backend', cmd: 'npm run typecheck --workspace=backend' },
  { nombre: 'build · frontend',    cmd: 'npm run build --workspace=frontend', saltarPorque: STR_SALTO_REACT },
  { nombre: 'build · frontend-ng', cmd: 'npm run build --workspace=frontend-ng' },
  { nombre: 'build · backend',     cmd: 'npm run build --workspace=backend' },
  { nombre: 'test · frontend',     cmd: 'npm run test --workspace=frontend',  saltarPorque: STR_SALTO_REACT },
  { nombre: 'test · frontend-ng',  cmd: 'npm run test --workspace=frontend-ng' },
  { nombre: 'test · backend',      cmd: 'npm run test --workspace=backend' },
  // Los utilitarios de scripts/ no pertenecen a ningún workspace, así que necesitan su propio
  // paso: agregarlos al script `test` del package.json no tendría efecto acá, porque esta lista
  // no invoca `npm run test` sino cada workspace por separado.
  { nombre: 'test · scripts',      cmd: 'npm run test:scripts' },
];

// Sin runner Node válido (ni host con la versión correcta, ni el contenedor arriba) se saltan
// TODOS los pasos, con aviso fuerte y siguiendo — CI, que sí tiene el runtime garantizado, es la
// red que no se puede saltar. Desde `d4e63a4` la lista es 100% Node (el `pytest` del microservicio
// de cotización salió del árbol junto con el servicio), así que ya no hay pasos exentos: si mañana
// vuelve a entrar un paso con otro runtime, necesita su propia bandera acá.
if (OBJ_RUNNER_NODE.modo === null) {
  for (const objPaso of CLL_PASOS) {
    objPaso.saltarPorque = `sin runner Node disponible: el host no tiene Node ${NUM_NODE_MAJOR_REQUERIDO} y '${STR_CONTENEDOR}' no está corriendo`;
  }
}

if (blnSoloListar) {
  for (const objPaso of CLL_PASOS) {
    console.log(`${objPaso.saltarPorque ? '⏭ ' : '• '}${objPaso.nombre}${objPaso.saltarPorque ? `  (se salta: ${objPaso.saltarPorque})` : ''}`);
  }
  process.exit(0);
}

const strRunnerNode = OBJ_RUNNER_NODE.modo === 'host'
  ? `host (${OBJ_RUNNER_NODE.detalle})`
  : OBJ_RUNNER_NODE.modo === 'docker'
    ? `docker (${OBJ_RUNNER_NODE.detalle})`
    : 'SIN RUNNER — pasos Node saltados';
console.log(`[verify] ${CLL_PASOS.length} pasos · node/npm: ${strRunnerNode}`);

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

  // Delegado a `pm4-app-container` cuando el host no tiene la versión correcta de Node (ver
  // detectarRunnerNode). El `cd /app` es seguro sin importar `objPaso.cwd`: ningún paso pisa el
  // cwd por defecto (STR_DIR_RAIZ ≡ /app dentro del contenedor, por el bind mount de
  // docker-compose.yml).
  const strCmd = OBJ_RUNNER_NODE.modo === 'docker'
    ? `docker exec ${STR_CONTENEDOR} sh -c "cd /app && ${objPaso.cmd}"`
    : objPaso.cmd;

  // En modo silencioso se bufferea la salida y solo se imprime si el paso falla: en verde el
  // gate no tiene por qué escupir 200 líneas de build, y en rojo se ve todo lo necesario.
  // Comando como STRING con `shell: true`, no como (cmd, args[]): en Windows `npm` es un
  // `npm.cmd`, y desde la corrección de CVE-2024-27980 Node se niega a ejecutar `.cmd`/`.bat`
  // sin shell (falla con EINVAL). Pasar además un array de args con shell activo emite
  // DEP0190, porque los argumentos se concatenan sin escapar. La forma sancionada es un único
  // string, y acá es segura porque todos los comandos (incluido el `docker exec` que los
  // envuelve) son literales de este archivo: no hay ninguna entrada externa que interpolar.
  const objRes = spawnSync(strCmd, {
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
