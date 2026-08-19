// Escritura de commits en la rama de historial usando PLUMBING de git.
//
// Por qué plumbing y no `git add` + `git commit`, que sería mucho más corto:
//
// 1. La captura se dispara EN MEDIO del trabajo del usuario (un hook PreToolUse, antes de que una
//    IA sobrescriba un script). Un `git add`/`git commit` porcelain tocaría el índice y la rama
//    activa, ensuciando `develop`, metiendo commits automáticos dentro de PRs ajenos y pudiendo
//    corromper un `git add -p` a medio hacer.
//
// 2. `.githooks/pre-commit` de este repo corre `npm run verify` COMPLETO (lint + typecheck +
//    builds + tests, decenas de segundos). Con porcelain, cada escritura a un script dispararía
//    ese gate. Y peor: a mitad de un cambio el árbol suele estar rojo, así que el commit de
//    captura FALLARÍA y se perdería justo el registro que el sistema existe para conservar.
//    `commit-tree`/`update-ref` no invocan hooks de git. No es un efecto colateral afortunado:
//    es el requisito que hace viable capturar sin fricción.
//
// El precio es ~80 líneas de fontanería en vez de dos comandos. Vale la pena: la invariante que
// compra —"capturar no puede romper nada de lo que estás haciendo"— es la que sostiene el diseño.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Modo de archivo regular no ejecutable, el único que usamos. */
const STR_MODO_BLOB = '100644';

/**
 * ÚNICA rama que este módulo puede pushear.
 *
 * El push automático está autorizado exclusivamente para la rama de historial: es un canal de
 * registro compartido, no trabajo de nadie, y nunca se mergea. Sobre cualquier otra rama el push
 * sigue siendo decisión del usuario (regla #8 de CLAUDE.md).
 *
 * La restricción es estructural, no una convención: `pushearHistorial` compara contra esta
 * constante y lanza si no coincide, y usa un refspec explícito para que la configuración de
 * `push.default` de cada máquina no pueda hacer que se suba la rama activa por accidente.
 */
export const STR_RAMA_HISTORIAL = 'pm4-scripts-historial';

/**
 * Remoto por defecto del canal de historial.
 *
 * Es un parámetro y no un literal repetido porque el remoto correcto depende del equipo: hoy es el
 * fork donde vive el trabajo, pero este proyecto ya convive con más de un remoto (un upstream y el
 * de la organización) y ya sufrió una migración de instancia PM4. Que se pueda cambiar desde
 * `pm4-scripts.config.json` evita tener que tocar código el día que la respuesta cambie.
 */
export const STR_REMOTO_POR_DEFECTO = 'origin';

/**
 * Corre git y devuelve stdout como string.
 *
 * `stdio` se declara explícitamente porque el default de execFileSync **reenvía stderr al proceso
 * padre**: sin esto, los fallos esperados y ya capturados (un `git show` sobre una rama que aún no
 * existe, que es el camino normal de la primera corrida) escupen `fatal: …` en la consola del
 * usuario como si algo hubiera salido mal.
 *
 * A cambio de silenciarlo, el stderr se adjunta al Error cuando el comando falla de verdad — si no,
 * un fallo real quedaría sin ninguna pista.
 *
 * `maxBuffer` subido porque un script PM4 puede rondar los 45 KB y el índice JSON crece con ellos.
 */
function git(lstArgs, { strRepo, dicEnv = {}, bufInput } = {}) {
  try {
    return execFileSync('git', lstArgs, {
      cwd: strRepo,
      input: bufInput,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...dicEnv },
    });
  } catch (excError) {
    const strStderr = String(excError.stderr ?? '').trim();
    if (strStderr) excError.message = `git ${lstArgs[0]}: ${strStderr}`;
    throw excError;
  }
}

/**
 * ¿Existe la rama en este repo?
 * @returns {boolean}
 */
export function ramaExiste(strRepo, strRama) {
  try {
    git(['rev-parse', '--verify', '--quiet', `refs/heads/${strRama}`], { strRepo });
    return true;
  } catch {
    return false;
  }
}

/**
 * Lee el contenido de un archivo tal como quedó en la punta de una rama.
 * Devuelve null si la rama o el archivo no existen todavía — el caso normal en la primera corrida.
 *
 * @returns {string | null}
 */
export function leerArchivoDeRama(strRepo, strRama, strRuta) {
  try {
    return git(['show', `${strRama}:${strRuta}`], { strRepo });
  } catch {
    return null;
  }
}

/**
 * Lee y parsea el índice de capturas desde la rama de historial.
 * Un índice ausente o corrupto degrada a `{}` (todo se verá como NUEVO y se recapturará), que es
 * la falla segura: se registra de más, nunca de menos.
 *
 * @returns {{scripts: Record<string, object>, instance?: string}}
 */
export function leerIndice(strRepo, strRama, strRutaIndice) {
  const strRaw = leerArchivoDeRama(strRepo, strRama, strRutaIndice);
  if (!strRaw) return { scripts: {} };
  try {
    const objIndice = JSON.parse(strRaw);
    return { ...objIndice, scripts: objIndice.scripts ?? {} };
  } catch {
    return { scripts: {} };
  }
}

/** ¿Hay un remoto `origin` configurado? Sin él, todo el modo compartido se omite en silencio. */
export function hayRemoto(strRepo, strRemoto = STR_REMOTO_POR_DEFECTO) {
  try {
    return git(['remote', 'get-url', strRemoto], { strRepo }).trim() !== '';
  } catch {
    return false;
  }
}

/**
 * Trae la rama de historial del remoto. No toca la rama local: solo actualiza
 * `refs/remotes/origin/<rama>` para poder comparar.
 *
 * @returns {boolean} true si el fetch se hizo; false si no hay remoto o falló (sin red, por ej.)
 */
export function traerRemoto(strRepo, strRama, strRemoto = STR_REMOTO_POR_DEFECTO) {
  if (!hayRemoto(strRepo, strRemoto)) return false;
  try {
    git(['fetch', strRemoto, `${strRama}:refs/remotes/${strRemoto}/${strRama}`], { strRepo });
    return true;
  } catch {
    // La rama puede no existir aún en el remoto (primera vez), o no haber red. Ninguno es fatal:
    // se captura igual en local y el push posterior creará la rama si corresponde.
    return false;
  }
}

/** Punta de la rama en el remoto ya fetcheado, o null si no existe. */
export function puntaRemota(strRepo, strRama, strRemoto = STR_REMOTO_POR_DEFECTO) {
  try {
    return git(['rev-parse', '--verify', '--quiet', `refs/remotes/${strRemoto}/${strRama}`], { strRepo }).trim() || null;
  } catch {
    return null;
  }
}

/** Punta de la rama local, o null. */
export function puntaLocal(strRepo, strRama) {
  try {
    return git(['rev-parse', '--verify', '--quiet', `refs/heads/${strRama}`], { strRepo }).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Relación entre la rama local y la del remoto.
 *
 * Distinguir `detras` de `divergido` es lo que decide la estrategia de la captura: en el primer
 * caso alcanza con adelantar la local (fast-forward); en el segundo hay que registrar ambas
 * historias en el commit nuevo para no perder lo que el compañero ya había capturado.
 *
 * @returns {'sin-local'|'sin-remoto'|'al-dia'|'detras'|'adelante'|'divergido'}
 */
export function estadoSincronizacion(strRepo, strRama, strRemoto = STR_REMOTO_POR_DEFECTO) {
  const strLocal = puntaLocal(strRepo, strRama);
  const strRemoto_ = puntaRemota(strRepo, strRama, strRemoto);

  if (!strLocal && !strRemoto_) return 'sin-local';
  if (!strLocal) return 'sin-local';
  if (!strRemoto_) return 'sin-remoto';
  if (strLocal === strRemoto_) return 'al-dia';

  const blnRemotoEsAncestro = esAncestro(strRepo, strRemoto_, strLocal);
  const blnLocalEsAncestro = esAncestro(strRepo, strLocal, strRemoto_);

  if (blnLocalEsAncestro) return 'detras';
  if (blnRemotoEsAncestro) return 'adelante';
  return 'divergido';
}

function esAncestro(strRepo, strPosibleAncestro, strDescendiente) {
  try {
    git(['merge-base', '--is-ancestor', strPosibleAncestro, strDescendiente], { strRepo });
    return true;
  } catch {
    return false;
  }
}

/** Mueve la rama local a un commit dado. Se usa para adelantarla al remoto (fast-forward). */
export function moverRamaA(strRepo, strRama, strSha) {
  git(['update-ref', `refs/heads/${strRama}`, strSha], { strRepo });
}

/**
 * Sube la rama de historial al remoto.
 *
 * Dos guardas deliberadas:
 *   · solo acepta STR_RAMA_HISTORIAL — sobre cualquier otra rama lanza, así que este módulo no
 *     puede publicar trabajo de nadie aunque se lo invoque mal;
 *   · refspec explícito `<rama>:<rama>` en vez de `git push` a secas, para que la configuración
 *     de `push.default` de la máquina no pueda subir la rama activa por accidente.
 *
 * @returns {{ok: boolean, rechazado: boolean, mensaje: string}} `rechazado` indica que el remoto
 *   avanzó y hay que reconciliar; cualquier otro fallo (sin red, sin permisos) viene con ok=false
 *   y rechazado=false, y NO es fatal: el commit ya está en local y se subirá en la próxima captura.
 */
export function pushearHistorial(strRepo, strRama, strRemoto = STR_REMOTO_POR_DEFECTO) {
  if (strRama !== STR_RAMA_HISTORIAL) {
    throw new Error(
      `pushearHistorial solo puede pushear '${STR_RAMA_HISTORIAL}'; se pidió '${strRama}'. ` +
      'El push automático está autorizado únicamente para la rama de historial.',
    );
  }
  if (!hayRemoto(strRepo, strRemoto)) {
    return { ok: false, rechazado: false, mensaje: `no hay remoto '${strRemoto}' configurado` };
  }

  try {
    git(['push', strRemoto, `refs/heads/${strRama}:refs/heads/${strRama}`], { strRepo });
    return { ok: true, rechazado: false, mensaje: '' };
  } catch (excError) {
    const strMensaje = String(excError.message ?? '');
    const blnRechazado = /non-fast-forward|rejected|fetch first|behind/i.test(strMensaje);
    return { ok: false, rechazado: blnRechazado, mensaje: strMensaje.slice(0, 300) };
  }
}

/**
 * Crea un commit en `strRama` con los archivos dados, sin tocar el working tree ni el índice real.
 *
 * Los archivos se fusionan sobre el árbol que ya tenía la rama: lo que no se pasa se conserva. No
 * hay forma de borrar archivos por esta vía, y es deliberado — el historial de un script que
 * existió es justamente lo que hay que preservar.
 *
 * @param {object} objArgs
 * @param {string} objArgs.strRepo raíz del repo
 * @param {string} objArgs.strRama rama destino (se crea huérfana si no existe)
 * @param {Record<string, string>} objArgs.dicArchivos ruta en la rama (con `/`) → contenido
 * @param {string} objArgs.strMensaje mensaje completo del commit (título + cuerpo)
 * @param {string[]} [objArgs.lstPadres] padres explícitos. Con dos, el commit es un merge: se usa
 *   al reconciliar una divergencia, para que la historia del compañero quede en el grafo en vez de
 *   descartarse. Si se omite, el padre es la punta actual de la rama.
 * @param {string} [objArgs.strTreeBase] árbol de partida. Al reconciliar se pasa el del REMOTO, no
 *   el de la rama local: así los archivos que el compañero capturó y nosotros no tocamos sobreviven.
 * @returns {{sha: string, esPrimerCommit: boolean}}
 */
export function commitearCaptura({ strRepo, strRama, dicArchivos, strMensaje, lstPadres, strTreeBase }) {
  const lstRutas = Object.keys(dicArchivos);
  if (lstRutas.length === 0) {
    throw new Error('commitearCaptura: no se recibió ningún archivo que commitear.');
  }

  // Índice temporal fuera del repo: es lo que aísla la operación del índice real de git.
  const strDirTmp = mkdtempSync(join(tmpdir(), 'pm4-captura-'));
  const strIndiceTmp = join(strDirTmp, 'index');
  const dicEnv = { GIT_INDEX_FILE: strIndiceTmp };

  try {
    const blnExiste = ramaExiste(strRepo, strRama);

    // Punto de partida del árbol: el que se indique (reconciliación), lo que la rama ya tenía, o
    // vacío si es la primera captura.
    if (strTreeBase) {
      git(['read-tree', strTreeBase], { strRepo, dicEnv });
    } else if (blnExiste) {
      git(['read-tree', strRama], { strRepo, dicEnv });
    } else {
      git(['read-tree', '--empty'], { strRepo, dicEnv });
    }

    // Cada archivo entra como blob y se registra en el índice temporal.
    for (const [strRuta, strContenido] of Object.entries(dicArchivos)) {
      const strBlobSha = git(['hash-object', '-w', '--stdin'], {
        strRepo,
        bufInput: Buffer.from(strContenido, 'utf8'),
      }).trim();

      git(['update-index', '--add', '--cacheinfo', `${STR_MODO_BLOB},${strBlobSha},${strRuta}`], {
        strRepo,
        dicEnv,
      });
    }

    const strTreeSha = git(['write-tree'], { strRepo, dicEnv }).trim();

    // El mensaje va por stdin y no por -m: evita todo el problema de escapado de comillas y saltos
    // de línea al pasar un mensaje multilínea por la línea de comandos en Windows.
    const lstArgsCommit = ['commit-tree', strTreeSha];
    if (lstPadres?.length) {
      // Dos padres = commit de merge. Es la forma de reconciliar una divergencia sin perder nada:
      // el árbol lo generamos nosotros desde PM4 (que es la verdad), y ambas historias quedan
      // alcanzables en el grafo. No hay conflicto de texto que resolver porque no fusionamos
      // contenido: lo reemplazamos por el estado real.
      for (const strPadre of lstPadres) lstArgsCommit.push('-p', strPadre);
    } else if (blnExiste) {
      const strPadre = git(['rev-parse', strRama], { strRepo }).trim();
      lstArgsCommit.push('-p', strPadre);
    }

    const strCommitSha = git(lstArgsCommit, {
      strRepo,
      bufInput: Buffer.from(strMensaje, 'utf8'),
    }).trim();

    // Mover la ref es lo único que "publica" el commit. Hasta acá nada era visible.
    git(['update-ref', `refs/heads/${strRama}`, strCommitSha], { strRepo });

    return { sha: strCommitSha, esPrimerCommit: !blnExiste };
  } finally {
    rmSync(strDirTmp, { recursive: true, force: true });
  }
}

/**
 * Commits de la rama de historial, opcionalmente acotados a un archivo.
 * @returns {Array<{sha: string, fecha: string, titulo: string}>}
 */
export function listarCapturas(strRepo, strRama, { strRuta = null, intMax = 20 } = {}) {
  if (!ramaExiste(strRepo, strRama)) return [];

  // %x1f = separador de unidad: no aparece en un mensaje de commit real, a diferencia de | o tab.
  const lstArgs = ['log', strRama, `--max-count=${intMax}`, '--format=%H%x1f%aI%x1f%s'];
  if (strRuta) lstArgs.push('--', strRuta);

  const strSalida = git(lstArgs, { strRepo }).trim();
  if (!strSalida) return [];

  return strSalida.split('\n').map((strLinea) => {
    const [strSha, strFecha, strTitulo] = strLinea.split('');
    return { sha: strSha, fecha: strFecha, titulo: strTitulo };
  });
}

/**
 * Verifica que git tenga identidad configurada.
 * `commit-tree` falla con un mensaje poco claro si falta, y conviene detectarlo antes de haber
 * escrito blobs a medias.
 *
 * @returns {string | null} descripción del problema, o null si está todo bien
 */
export function validarIdentidadGit(strRepo) {
  for (const strClave of ['user.name', 'user.email']) {
    try {
      const strValor = git(['config', '--get', strClave], { strRepo }).trim();
      if (!strValor) return `git ${strClave} está vacío`;
    } catch {
      return `git ${strClave} no está configurado (git config --global ${strClave} "...")`;
    }
  }
  return null;
}
