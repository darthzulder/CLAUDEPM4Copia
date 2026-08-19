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

// Imagen del fallback de `pytest` (ver detectarPython). Versión fijada, no `python:alpine`: un
// tag flotante haría que el gate cambie de intérprete sin que nadie lo decida, que es
// exactamente el drift que el major fijo de Node evita del otro lado.
const STR_IMAGEN_PYTHON = 'python:3.12-alpine';

const blnVerbose = process.argv.includes('--verbose');
const blnSoloListar = process.argv.includes('--list');

/**
 * Dónde correr `pytest`: host si hay un intérprete con pytest, imagen efímera de Docker si no.
 * Devuelve `{ modo, detalle }` con `modo: null` cuando no hay ninguna de las dos.
 *
 * Se sondea en vez de asumirlo: en Windows es normal no tener Python instalado, y bloquear
 * cada commit del frontend por eso sería absurdo.
 *
 * ── Por qué hay fallback a Docker, y por qué es una imagen efímera y no un contenedor ────────
 * Este comentario decía que no había fallback porque "el cotizador vive en su propio contenedor
 * (`cotizador-service-container`, ver docker-compose.yml)". **Eso ya no es cierto**: hoy
 * `docker-compose.yml` declara UN solo servicio (`pm4-app`), así que ese contenedor no existe y
 * la razón para no tener fallback se cayó con él. En una máquina sin permisos para instalar
 * Python —el caso real que motivó esto— el paso quedaba saltado para siempre.
 *
 * Por eso el fallback usa `docker run --rm python:3.12-alpine`, que no depende de que ningún
 * servicio esté levantado: monta el directorio del cotizador y se borra al terminar. Instala las
 * dependencias en el mismo comando porque la imagen base no las trae (ver `STR_CMD_PYTEST_DOCKER`),
 * lo que cuesta unos segundos por corrida — aceptable para un paso que hoy no corre nunca, y el
 * lugar natural para optimizarlo es una imagen propia si algún día molesta.
 *
 * El orden host → docker → skip es el mismo de `detectarRunnerNode`, a propósito: dos criterios
 * distintos para "dónde corro esto" serían una divergencia más para mantener.
 */
function detectarPython() {
  for (const strCmd of ['python', 'python3', 'py']) {
    const objProbe = spawnSync(`${strCmd} -m pytest --version`, { stdio: 'ignore', shell: true });
    if (objProbe.status === 0) return { modo: 'host', detalle: strCmd };
  }

  // `docker info` y no `docker --version`: el binario puede existir con el daemon apagado, y en
  // ese caso el `docker run` de abajo fallaría con un error que parecería un test roto.
  const objDocker = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (objDocker.status === 0) return { modo: 'docker', detalle: STR_IMAGEN_PYTHON };

  return { modo: null, detalle: null };
}

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

const OBJ_RUNNER_PYTHON = detectarPython();
const OBJ_RUNNER_NODE = detectarRunnerNode();
const STR_DIR_COTIZADOR = path.join(STR_DIR_RAIZ, 'cotizador-service');

/**
 * El `pytest` del cotizador dentro de una imagen efímera (ver detectarPython).
 *
 * Tres decisiones que no son obvias al leerlo:
 * - **`-v "<dir>:/app"`** monta el cotizador del host, así que el contenedor corre el código del
 *   working tree — no una copia. Es lo que hace que el paso sirva como gate y no como museo.
 * - **`sh -c` con el `pip install` adelante** porque `python:3.12-alpine` no trae pytest ni las
 *   dependencias del servicio. `-q` en los dos comandos para no ensuciar la salida del gate.
 * - **`requirements-dev.txt` si existe, si no `requirements.txt`**, resuelto DENTRO del shell del
 *   contenedor (`[ -f ... ]`) y no acá con `existsSync`: así la decisión la toma el árbol montado
 *   en el momento de correr, que es el único estado que importa.
 *
 * Verificado que el `-f` llega a `pytest` en los tres casos (sin ningún requirements, solo
 * `requirements.txt`, y ambos): el `&&`/`||` está agrupado en `{ ... }` para que un `[ -f ]` falso
 * no aborte la cadena, y el exit code que sale es el de `pytest`, que es el que lee el gate.
 *
 * **Ojo si lo copiás a mano en Git Bash:** MSYS reescribe `/app` a una ruta de Windows y docker
 * responde `the working directory '...' is invalid`. Hay que prefijar `MSYS_NO_PATHCONV=1`. Desde
 * acá no pasa —`spawnSync` no pasa por ese shell— así que es una trampa de depuración manual, no
 * del script.
 */
const STR_CMD_PYTEST_DOCKER = [
  `docker run --rm -v "${STR_DIR_COTIZADOR}:/app" -w /app ${STR_IMAGEN_PYTHON}`,
  `sh -c "pip install -q pytest && { [ -f requirements-dev.txt ] && pip install -q -r requirements-dev.txt`,
  `|| { [ -f requirements.txt ] && pip install -q -r requirements.txt; }; }; python -m pytest -q"`,
].join(' ');

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
  {
    nombre: 'test · cotizador (pytest)',
    // Host: el intérprete detectado, con el cwd del servicio. Docker: una imagen efímera que monta
    // ese mismo directorio (el `-w /app` de adentro hace de cwd, así que `cwd` acá es indistinto).
    cmd: OBJ_RUNNER_PYTHON.modo === 'docker'
      ? STR_CMD_PYTEST_DOCKER
      : `${OBJ_RUNNER_PYTHON.detalle ?? 'python'} -m pytest -q`,
    cwd: STR_DIR_COTIZADOR,
    // Nunca se delega a `pm4-app-container` (ver detectarRunnerNode): ese contenedor no trae
    // Python. Este paso tiene su propio runner —host o imagen efímera— resuelto en el `cmd`.
    blnEsPython: true,
    // Se salta —con aviso— si el servicio no está en el árbol, o si no hay NI Python NI Docker.
    // El orden importa: sin el directorio, qué runner haya es irrelevante.
    saltarPorque: !existsSync(STR_DIR_COTIZADOR)
      ? 'no existe cotizador-service/ en este árbol'
      : OBJ_RUNNER_PYTHON.modo === null
        ? 'no hay Python con pytest en el PATH ni Docker disponible (CI sí lo corre; instalá: pip install -r cotizador-service/requirements-dev.txt, o levantá Docker)'
        : null,
  },
];

// Sin runner Node válido (ni host con la versión correcta, ni el contenedor arriba), los
// pasos de Node/npm se saltan con el mismo criterio que el de pytest sin intérprete: aviso
// fuerte y seguir — CI, que sí tiene el runtime garantizado, es la red que no se puede saltar.
if (OBJ_RUNNER_NODE.modo === null) {
  for (const objPaso of CLL_PASOS) {
    if (!objPaso.blnEsPython) {
      objPaso.saltarPorque = `sin runner Node disponible: el host no tiene Node ${NUM_NODE_MAJOR_REQUERIDO} y '${STR_CONTENEDOR}' no está corriendo`;
    }
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
// El runner de Python se nombra igual que el de Node —modo + detalle— para que el banner diga de
// dónde salió cada mitad del gate sin tener que leer el script.
const strRunnerPython = OBJ_RUNNER_PYTHON.modo
  ? ` · python: ${OBJ_RUNNER_PYTHON.modo} (${OBJ_RUNNER_PYTHON.detalle})`
  : '';
console.log(`[verify] ${CLL_PASOS.length} pasos · node/npm: ${strRunnerNode}${strRunnerPython}`);

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
  // detectarRunnerNode) — el de pytest nunca se delega, tiene su propio criterio host-only.
  // El `cd /app` es seguro sin importar `objPaso.cwd`: los pasos que se delegan son siempre
  // los de Node/npm, y ninguno de ellos pisa el cwd por defecto (STR_DIR_RAIZ ≡ /app dentro
  // del contenedor, por el bind mount de docker-compose.yml).
  const strCmd = (!objPaso.blnEsPython && OBJ_RUNNER_NODE.modo === 'docker')
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
