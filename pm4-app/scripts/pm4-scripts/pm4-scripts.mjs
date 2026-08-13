#!/usr/bin/env node
// pm4-scripts.mjs — grabadora de historial de los scripts PHP de ProcessMaker 4.
//
// PROBLEMA QUE RESUELVE: los scripts se editan en la UI de PM4 o por API, y la API no expone
// historial de versiones — cada escritura pisa la anterior sin dejar rastro. No hay forma de saber
// qué código corría ayer ni de volver atrás.
//
// MODELO: git NO gobierna a PM4, lo REGISTRA. PM4 sigue siendo la fuente de verdad y el lugar donde
// se trabaja; esta herramienta solo se asegura de que ningún estado se pierda antes de ser pisado.
// Por eso no hay gate, ni bloqueo por divergencia, ni "publicar": hay `capture`.
//
// DÓNDE VIVE EL HISTORIAL: en la rama huérfana `pm4-scripts-historial`, escrita con plumbing de git
// (ver core/historial.mjs). Los .php NUNCA aparecen en el working tree de la rama activa: capturar
// no puede interferir con lo que estés haciendo, ni dispara el hook pre-commit.
//
// Uso:
//   node scripts/pm4-scripts/pm4-scripts.mjs capture --all
//   node scripts/pm4-scripts/pm4-scripts.mjs capture --id 84 --reason "pre-escritura IA"
//   node scripts/pm4-scripts/pm4-scripts.mjs status
//
// Exit codes: 0 OK · 2 uso inválido · 4 red/auth PM4 · 5 error de git.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizar } from './core/canonicalizar.mjs';
import { compararInstancia, detectarCambiosDeId, slugDesdeTitulo } from './core/estado.mjs';
import { commitearCaptura, leerIndice, validarIdentidadGit } from './core/historial.mjs';
import { descubrirArbol, resolverUuidsVigilados } from './core/descubrir.mjs';
import { escribirEspejo } from './core/espejo.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STR_REPO = join(__dirname, '..', '..', '..');
const STR_ENV_PATH = join(__dirname, '..', '..', '.env');
const STR_CONFIG_PATH = join(__dirname, 'pm4-scripts.config.json');

// Copia navegable, en la raíz del repo e ignorada por git. El respaldo versionado es la rama;
// esto es solo para poder abrir y grepear los scripts como archivos normales.
const STR_DIR_ESPEJO = join(STR_REPO, 'pm4-scripts');

const STR_RAMA = 'pm4-scripts-historial';
const STR_RUTA_INDICE = 'pm4-scripts.index.json';

// ── Entorno ─────────────────────────────────────────────────────────────────────────────────
// Mismo parser mínimo que scripts/pm4-registry-sync.mjs: sin dependencias, y process.env manda
// sobre .env para que un entorno de CI pueda inyectar credenciales sin archivo.
function loadEnv(strPath) {
  const dicEnv = {};
  let strRaw;
  try {
    strRaw = readFileSync(strPath, 'utf8');
  } catch {
    return dicEnv;
  }
  for (const strLine of strRaw.split(/\r?\n/)) {
    const strTrimmed = strLine.trim();
    if (!strTrimmed || strTrimmed.startsWith('#')) continue;
    const intEq = strTrimmed.indexOf('=');
    if (intEq === -1) continue;
    dicEnv[strTrimmed.slice(0, intEq).trim()] = strTrimmed.slice(intEq + 1).trim();
  }
  return dicEnv;
}

const dicEnv = loadEnv(STR_ENV_PATH);
const PM4_BASE_URL = (process.env.PM4_BASE_URL ?? dicEnv.PM4_BASE_URL ?? '').replace(/\/$/, '');
const PM4_TOKEN = process.env.PM4_TOKEN ?? dicEnv.PM4_TOKEN ?? '';

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────
const STR_COMANDO = process.argv[2] ?? '';
const BLN_ALL = process.argv.includes('--all');
const BLN_JSON = process.argv.includes('--json');

/** Valor de un flag `--x valor`, o null si no está. */
function flag(strNombre) {
  const intIdx = process.argv.indexOf(strNombre);
  return intIdx !== -1 && process.argv[intIdx + 1] ? process.argv[intIdx + 1] : null;
}

const INT_ID = flag('--id') ? Number(flag('--id')) : null;
const STR_MOTIVO = flag('--reason') ?? 'captura manual';

/** Salida: silenciosa en modo --json, para que el hook reciba solo el JSON. */
function log(strMensaje) {
  if (!BLN_JSON) console.log(strMensaje);
}

function salir(intCodigo, objResultado) {
  if (BLN_JSON) console.log(JSON.stringify(objResultado));
  process.exitCode = intCodigo;
}

async function pm4Get(strPath, dicParams = {}) {
  const objUrl = new URL(`${PM4_BASE_URL}/api/1.0${strPath}`);
  for (const [strKey, strValue] of Object.entries(dicParams)) {
    objUrl.searchParams.set(strKey, String(strValue));
  }
  const objResponse = await fetch(objUrl, {
    headers: { Authorization: `Bearer ${PM4_TOKEN}`, Accept: 'application/json' },
  });
  if (!objResponse.ok) throw new Error(`GET ${strPath} → HTTP ${objResponse.status}`);
  return objResponse.json();
}

/**
 * Trae los scripts de la instancia ya normalizados.
 *
 * Un solo GET alcanza para toda la instancia: `/scripts?per_page=500` ya incluye `code` y `uuid`,
 * así que capturar 62 scripts cuesta exactamente lo mismo que capturar uno.
 */
async function obtenerScriptsRemotos() {
  const objLista = await pm4Get('/scripts', { per_page: 500 });
  return (objLista.data ?? [])
    .filter((objScript) => objScript.uuid)
    .map((objScript) => {
      const objNorm = normalizar(objScript.code ?? '');
      return {
        uuid: objScript.uuid,
        id: objScript.id,
        title: objScript.title ?? '',
        language: objScript.language ?? '',
        codigo: objNorm.codigo,
        sha256: objNorm.sha256,
        vacio: objNorm.vacio,
      };
    });
}

/**
 * Descarga el BPMN de un proceso. Se usa para descubrir sus scriptTask.
 * Devuelve texto plano, no JSON: el endpoint entrega el XML del diagrama.
 */
async function pm4GetBpmn(intProcesoId) {
  const objResponse = await fetch(`${PM4_BASE_URL}/api/1.0/processes/${intProcesoId}/bpmn`, {
    headers: { Authorization: `Bearer ${PM4_TOKEN}` },
  });
  if (!objResponse.ok) throw new Error(`GET /processes/${intProcesoId}/bpmn → HTTP ${objResponse.status}`);
  return objResponse.text();
}

/** Los procesos vigilados, desde pm4-scripts.config.json. */
function leerConfig() {
  try {
    const objConfig = JSON.parse(readFileSync(STR_CONFIG_PATH, 'utf8'));
    return objConfig.procesos ?? [];
  } catch (excError) {
    throw new Error(`no se pudo leer ${STR_CONFIG_PATH}: ${excError.message}`);
  }
}

/**
 * Resuelve qué scripts se vigilan y en qué carpeta va cada uno.
 *
 * Recorre cada proceso configurado y su árbol de subprocesos leyendo los BPMN, traduce los ids
 * descubiertos a uuid, y le suma los `scriptsExtra` declarados (los que ningún BPMN referencia).
 *
 * @returns {Promise<{dicCarpetaPorUuid: Map<string,string>, lstAvisos: string[]}>}
 */
async function resolverAlcance(lstRemotos) {
  const dicCarpetaPorUuid = new Map();
  const lstAvisos = [];

  for (const objProceso of leerConfig()) {
    const objArbol = await descubrirArbol(objProceso.id, pm4GetBpmn);
    const objRes = resolverUuidsVigilados(objArbol.scriptIds, objProceso.scriptsExtra, lstRemotos);

    for (const strUuid of objRes.uuids) dicCarpetaPorUuid.set(strUuid, objProceso.carpeta);

    lstAvisos.push(
      `[ALCANCE] ${objProceso.carpeta} — proceso ${objProceso.id} + ${objArbol.procesos.length - 1} subproceso(s): ` +
      `${objRes.uuids.size} script(s) vigilado(s).`,
    );
    if (objRes.noResueltos.length > 0) {
      lstAvisos.push(
        `[SIN RESOLVER] el BPMN de ${objProceso.carpeta} referencia ids que ya no existen en la ` +
        `instancia: ${objRes.noResueltos.join(', ')}.`,
      );
    }
  }

  return { dicCarpetaPorUuid, lstAvisos };
}

/** Ruta del archivo en la rama de historial. Estable: no lleva el id, que cambia entre instancias. */
function rutaDeScript(objScript, dicIndice, dicCarpetaPorUuid) {
  // Si ya se capturó antes, se respeta la ruta existente aunque el título haya cambiado en PM4:
  // renombrar el archivo por un cambio cosmético rompería `git log --follow`.
  const objEntrada = dicIndice[objScript.uuid];
  if (objEntrada?.file) return objEntrada.file;

  const strCarpeta = dicCarpetaPorUuid.get(objScript.uuid) ?? 'otros';
  return `${strCarpeta}/${slugDesdeTitulo(objScript.title)}.php`;
}

/** Título del commit: legible en `git log --oneline`. */
function tituloCommit(lstCapturados, strMotivo) {
  if (lstCapturados.length === 1) {
    return `chore(captura): ${lstCapturados[0].slug} — ${strMotivo}`;
  }
  return `chore(captura): ${lstCapturados.length} scripts — ${strMotivo}`;
}

function cuerpoCommit(lstCapturados, strMotivo) {
  const lstLineas = [`instancia: ${PM4_BASE_URL}`, `motivo:    ${strMotivo}`, ''];
  for (const objCap of lstCapturados) {
    const strCambio = objCap.shaPrevio
      ? `${objCap.shaPrevio.slice(0, 12)} → ${objCap.sha256.slice(0, 12)}`
      : `nuevo (${objCap.sha256.slice(0, 12)})`;
    lstLineas.push(`${objCap.slug} (id ${objCap.id}, uuid ${objCap.uuid})`);
    lstLineas.push(`  ${strCambio}`);
  }
  return lstLineas.join('\n');
}

// ── capture ─────────────────────────────────────────────────────────────────────────────────
async function cmdCapture() {
  if (!BLN_ALL && INT_ID === null) {
    log('Uso: capture --all | capture --id <id> [--reason "..."]');
    return salir(2, { ok: false, error: 'uso inválido' });
  }

  const strProblemaGit = validarIdentidadGit(STR_REPO);
  if (strProblemaGit) {
    log(`[pm4-scripts] ${strProblemaGit}`);
    return salir(5, { ok: false, error: strProblemaGit });
  }

  const objIndice = leerIndice(STR_REPO, STR_RAMA, STR_RUTA_INDICE);
  const dicIndice = objIndice.scripts;

  const lstTodos = await obtenerScriptsRemotos();
  const { dicCarpetaPorUuid, lstAvisos } = await resolverAlcance(lstTodos);
  for (const strAviso of lstAvisos) log(strAviso);

  // Solo se captura lo que pertenece a un proceso vigilado: la instancia tiene scripts de otros
  // proyectos (FAST-FLOW, CUW, pruebas) que solo agregarían ruido al historial.
  let lstRemotos = lstTodos.filter((objScript) => dicCarpetaPorUuid.has(objScript.uuid));

  if (INT_ID !== null) {
    const objPedido = lstTodos.find((objScript) => objScript.id === INT_ID);
    if (!objPedido) {
      log(`[pm4-scripts] no existe un script con id ${INT_ID} en ${PM4_BASE_URL}`);
      return salir(4, { ok: false, error: `script ${INT_ID} no encontrado` });
    }
    // Un script fuera de alcance no es un error: se informa y se sigue. Que el hook dispare sobre
    // un script de otro proyecto no debe bloquear la escritura.
    if (!dicCarpetaPorUuid.has(objPedido.uuid)) {
      log(`[FUERA DE ALCANCE] ${objPedido.title} (id ${INT_ID}) no pertenece a ningún proceso vigilado.`);
      return salir(0, { ok: true, capturados: 0, commit: null, fueraDeAlcance: true });
    }
    lstRemotos = [objPedido];
  }

  // Un script vacío no se captura: registrarlo sobreescribiría el último estado bueno del historial
  // con nada, que es justo lo que este sistema existe para impedir.
  const lstVacios = lstRemotos.filter((objScript) => objScript.vacio);
  lstRemotos = lstRemotos.filter((objScript) => !objScript.vacio);
  for (const objVacio of lstVacios) {
    log(`[VACIO] ${objVacio.title} (id ${objVacio.id}) — sin código en PM4, no se captura.`);
  }

  // Con --id, el barrido es parcial: comparar contra el índice completo marcaría como "borrados"
  // los 61 scripts que no pedimos. Se acota el índice a los uuid presentes en este barrido.
  const dicIndiceComparable = INT_ID === null
    ? dicIndice
    : Object.fromEntries(Object.entries(dicIndice).filter(([strUuid]) =>
        lstRemotos.some((objScript) => objScript.uuid === strUuid)));

  const objComp = compararInstancia(lstRemotos, dicIndiceComparable);

  for (const objCambio of detectarCambiosDeId(lstRemotos, dicIndice)) {
    log(`[ID] ${objCambio.title}: id ${objCambio.idPrevio} → ${objCambio.idNuevo} (uuid estable).`);
  }
  for (const objBorrado of objComp.borrados) {
    log(`[BORRADO EN PM4] ${objBorrado.title} — se conserva en el historial.`);
  }

  // El espejo se refresca SIEMPRE, aunque no haya nada que commitear: así se regenera solo si
  // alguien lo borró o si el repo se acaba de clonar.
  const dicEspejo = Object.fromEntries(lstRemotos.map((objScript) => [
    rutaDeScript(objScript, dicIndice, dicCarpetaPorUuid),
    objScript.codigo,
  ]));
  escribirEspejo(STR_DIR_ESPEJO, dicEspejo);

  if (!objComp.hayCambios) {
    log(`[pm4-scripts] sin cambios — ${objComp.sinCambios.length} script(s) ya estaban capturados.`);
    return salir(0, { ok: true, capturados: 0, commit: null });
  }

  // Archivos del commit: los .php que cambiaron, más el índice actualizado.
  const dicArchivos = {};
  const lstCapturados = [];

  for (const objScript of [...objComp.nuevos, ...objComp.modificados]) {
    const strRuta = rutaDeScript(objScript, dicIndice, dicCarpetaPorUuid);
    dicArchivos[strRuta] = objScript.codigo;

    dicIndice[objScript.uuid] = {
      slug: strRuta.split('/').pop().replace(/\.php$/, ''),
      file: strRuta,
      title: objScript.title,
      language: objScript.language,
      lastKnownId: objScript.id,
      sha256: objScript.sha256,
      capturadoEn: new Date().toISOString(),
    };

    lstCapturados.push({
      slug: dicIndice[objScript.uuid].slug,
      uuid: objScript.uuid,
      id: objScript.id,
      sha256: objScript.sha256,
      shaPrevio: objScript.previo?.sha256 ?? null,
    });
    log(`[${objScript.previo ? 'MODIFICADO' : 'NUEVO'}] ${strRuta}`);
  }

  const objIndiceNuevo = {
    version: 1,
    instance: PM4_BASE_URL,
    generatedAt: new Date().toISOString(),
    normalization: { encoding: 'utf-8', bom: false, eol: 'lf', finalNewline: true },
    // Ordenado por uuid para que el diff del índice sea estable entre corridas.
    scripts: Object.fromEntries(Object.entries(dicIndice).sort(([a], [b]) => a.localeCompare(b))),
  };
  dicArchivos[STR_RUTA_INDICE] = `${JSON.stringify(objIndiceNuevo, null, 2)}\n`;

  const strMensaje = `${tituloCommit(lstCapturados, STR_MOTIVO)}\n\n${cuerpoCommit(lstCapturados, STR_MOTIVO)}\n`;

  let objCommit;
  try {
    objCommit = commitearCaptura({ strRepo: STR_REPO, strRama: STR_RAMA, dicArchivos, strMensaje });
  } catch (excError) {
    log(`[pm4-scripts] no se pudo escribir el historial: ${excError.message}`);
    return salir(5, { ok: false, error: excError.message });
  }

  log(`\n✓ ${lstCapturados.length} script(s) capturado(s) en ${STR_RAMA}@${objCommit.sha.slice(0, 7)}`);
  if (objCommit.esPrimerCommit) log(`  (rama ${STR_RAMA} creada)`);

  return salir(0, {
    ok: true,
    capturados: lstCapturados.length,
    commit: objCommit.sha,
    rama: STR_RAMA,
    scripts: lstCapturados.map((o) => o.slug),
  });
}

// ── status ──────────────────────────────────────────────────────────────────────────────────
async function cmdStatus() {
  const objIndice = leerIndice(STR_REPO, STR_RAMA, STR_RUTA_INDICE);
  const lstTodos = await obtenerScriptsRemotos();
  const { dicCarpetaPorUuid, lstAvisos } = await resolverAlcance(lstTodos);
  for (const strAviso of lstAvisos) log(strAviso);

  const lstRemotos = lstTodos.filter((objScript) => dicCarpetaPorUuid.has(objScript.uuid));
  const objComp = compararInstancia(lstRemotos, objIndice.scripts);

  log('\n=== Estado frente a la última captura ===');
  for (const objScript of objComp.nuevos) log(`[NUEVO]      ${objScript.title} (id ${objScript.id})`);
  for (const objScript of objComp.modificados) log(`[MODIFICADO] ${objScript.title} (id ${objScript.id})`);
  for (const objScript of objComp.borrados) log(`[BORRADO]    ${objScript.title} — solo en el historial`);

  log(`\n${lstRemotos.length} script(s) vigilado(s) de ${lstTodos.length} en la instancia · ` +
      `${objComp.sinCambios.length} sin cambios · ${objComp.nuevos.length} nuevo(s) · ` +
      `${objComp.modificados.length} modificado(s)`);
  if (objComp.hayCambios) log('\nCorré `capture --all` para registrarlos.');

  return salir(0, {
    ok: true,
    nuevos: objComp.nuevos.length,
    modificados: objComp.modificados.length,
    sinCambios: objComp.sinCambios.length,
  });
}

// ── Dispatcher ──────────────────────────────────────────────────────────────────────────────
async function main() {
  if (!PM4_BASE_URL || !PM4_TOKEN) {
    log('[pm4-scripts] faltan PM4_BASE_URL / PM4_TOKEN (pm4-app/.env o entorno).');
    return salir(4, { ok: false, error: 'faltan credenciales PM4' });
  }

  log(`pm4-scripts ${STR_COMANDO} — instancia: ${PM4_BASE_URL}`);

  switch (STR_COMANDO) {
    case 'capture': return cmdCapture();
    case 'status': return cmdStatus();
    default:
      log('Comandos: capture [--all | --id N] [--reason "..."] · status');
      return salir(2, { ok: false, error: `comando desconocido: '${STR_COMANDO}'` });
  }
}

main().catch((excError) => {
  const strMensaje = excError?.message ?? String(excError);
  log(`[pm4-scripts] error: ${strMensaje}`);
  salir(4, { ok: false, error: strMensaje });
});
