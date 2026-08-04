#!/usr/bin/env node
// pm4-registry-sync.mjs — verifica/genera frontend/src/config/pm4-registry.json contra
// la instancia PM4 real (PM4_BASE_URL + PM4_TOKEN de pm4-app/.env).
//
// Modos:
//   --check   (default) reporta drift, NUNCA escribe el registro.
//   --init    primera generación — igual que --check, pero además escribe los scripts
//             resueltos automáticamente por uuid (las collections nunca se auto-escriben,
//             no hay uuid nativo para confirmarlas sin ojo humano).
//   --update  aplica los mismatches de scripts resueltos por uuid al registro existente.
//             Los mismatches de collections (por nombre) NUNCA se auto-aplican — siempre
//             requieren edición manual de pm4-registry.json tras revisar el reporte.
//
// Uso:
//   node scripts/pm4-registry-sync.mjs --check
//   node scripts/pm4-registry-sync.mjs --init
//   node scripts/pm4-registry-sync.mjs --update
//
// Ver frontend/src/config/pm4Registry.types.ts para el shape del registro y
// MIGRACION_PANTALLAS.md para el mecanismo paralelo de id-mapping.json (screens completas).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REGISTRY_PATH = join(ROOT, 'frontend', 'src', 'config', 'pm4-registry.json');
const ENV_PATH = join(ROOT, '.env');

const MODE = process.argv.includes('--init')
  ? 'init'
  : process.argv.includes('--update')
    ? 'update'
    : 'check';

// ── .env mínimo (sin dependencias) — solo necesitamos PM4_BASE_URL y PM4_TOKEN ──────
function loadEnv(path) {
  const dicEnv = {};
  let strRaw;
  try {
    strRaw = readFileSync(path, 'utf8');
  } catch {
    console.error(`No se pudo leer ${path} — ¿existe pm4-app/.env?`);
    process.exit(1);
  }
  for (const strLine of strRaw.split(/\r?\n/)) {
    const strTrimmed = strLine.trim();
    if (!strTrimmed || strTrimmed.startsWith('#')) continue;
    const intEq = strTrimmed.indexOf('=');
    if (intEq === -1) continue;
    const strKey = strTrimmed.slice(0, intEq).trim();
    const strValue = strTrimmed.slice(intEq + 1).trim();
    dicEnv[strKey] = strValue;
  }
  return dicEnv;
}

const dicEnv = loadEnv(ENV_PATH);
const PM4_BASE_URL = (dicEnv.PM4_BASE_URL ?? '').replace(/\/$/, '');
const PM4_TOKEN = dicEnv.PM4_TOKEN ?? '';

if (!PM4_BASE_URL || !PM4_TOKEN) {
  console.error('PM4_BASE_URL y/o PM4_TOKEN no están definidos en pm4-app/.env — no se puede continuar.');
  process.exit(1);
}

async function pm4Get(strPath, dicParams = {}) {
  const objUrl = new URL(`${PM4_BASE_URL}/api/1.0${strPath}`);
  for (const [strKey, strValue] of Object.entries(dicParams)) {
    objUrl.searchParams.set(strKey, String(strValue));
  }
  const objResponse = await fetch(objUrl, {
    headers: { Authorization: `Bearer ${PM4_TOKEN}`, Accept: 'application/json' },
  });
  if (!objResponse.ok) {
    throw new Error(`GET ${strPath} → HTTP ${objResponse.status}`);
  }
  return objResponse.json();
}

function loadRegistry() {
  const strRaw = readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(strRaw);
}

function saveRegistry(objRegistry) {
  objRegistry.instance = PM4_BASE_URL;
  objRegistry.generatedAt = new Date().toISOString();
  writeFileSync(REGISTRY_PATH, JSON.stringify(objRegistry, null, 2) + '\n', 'utf8');
  console.log(`\n✓ ${REGISTRY_PATH} actualizado.`);
}

// ── Collections — sin uuid nativo, match por título ─────────────────────────────────
async function syncCollections(objRegistry) {
  console.log('\n=== Collections ===');
  const objList = await pm4Get('/collections', { per_page: 200 });
  const lstRemote = objList.data ?? [];
  const dicRemoteById = new Map(lstRemote.map((c) => [c.id, c]));
  const dicRemoteByTitle = new Map(lstRemote.map((c) => [c.name ?? c.title, c]));

  const lstOk = [];
  const lstMismatched = [];
  const lstMissing = [];
  const lstDriftCandidates = [];

  for (const [strSlug, objEntry] of Object.entries(objRegistry.collections)) {
    const objRemote = dicRemoteById.get(objEntry.id);
    if (!objRemote) {
      lstMissing.push({ slug: strSlug, expectedId: objEntry.id, expectedTitle: objEntry.title });
      continue;
    }
    const strRemoteTitle = objRemote.name ?? objRemote.title;
    if (strRemoteTitle !== objEntry.title) {
      lstMismatched.push({ slug: strSlug, id: objEntry.id, expectedTitle: objEntry.title, actualTitle: strRemoteTitle });
      const objCandidate = dicRemoteByTitle.get(objEntry.title);
      if (objCandidate && objCandidate.id !== objEntry.id) {
        lstDriftCandidates.push({ slug: strSlug, oldId: objEntry.id, newId: objCandidate.id, title: objEntry.title });
      }
    } else {
      lstOk.push(strSlug);
    }
  }

  console.log(`[OK] ${lstOk.length} colecciones sin cambios.`);
  for (const m of lstMismatched) {
    console.log(`[MISMATCH] collections.${m.slug}\n  id registrado: ${m.id}\n  título esperado: "${m.expectedTitle}"\n  título real en id=${m.id}: "${m.actualTitle}"`);
  }
  for (const m of lstMissing) {
    console.log(`[MISSING] collections.${m.slug}\n  id registrado: ${m.expectedId} (título esperado "${m.expectedTitle}") ya no existe en esta instancia.`);
  }
  for (const d of lstDriftCandidates) {
    console.log(`[DRIFT CANDIDATE] collections.${d.slug} — "${d.title}" ahora está en id=${d.newId} (era ${d.oldId}). Revisar manualmente antes de aplicar.`);
  }

  // Las collections NUNCA se auto-escriben — siempre requieren edición manual de
  // pm4-registry.json tras revisar el reporte (no hay uuid nativo que garantice el match).
  return { ok: lstOk.length, mismatched: lstMismatched, missing: lstMissing, driftCandidates: lstDriftCandidates };
}

// ── Scripts — resolución por uuid ────────────────────────────────────────────────────
// GET /scripts (list) ya expone `uuid` directamente en cada registro (verificado contra
// la instancia real 2026-08-04) — no hace falta pasar por POST /screens/{id}/export
// (que además solo devuelve una URL de descarga, no el JSON del paquete directamente).
async function harvestScriptUuids() {
  const objList = await pm4Get('/scripts', { per_page: 500 });
  const lstScripts = objList.data ?? [];
  const dicUuidMap = new Map(); // uuid -> {id, title}
  for (const objScript of lstScripts) {
    if (objScript.uuid) {
      dicUuidMap.set(objScript.uuid, { id: objScript.id, title: objScript.title });
    }
  }
  return dicUuidMap;
}

async function syncScripts(objRegistry) {
  console.log('\n=== Scripts (por uuid) ===');
  const dicUuidMap = await harvestScriptUuids();

  const lstOk = [];
  const lstMismatched = [];
  const lstNotFound = [];
  const lstSkippedNoUuid = [];

  for (const [strSlug, objEntry] of Object.entries(objRegistry.scripts)) {
    if (!objEntry.uuid) {
      lstSkippedNoUuid.push(strSlug);
      continue;
    }
    const objResolved = dicUuidMap.get(objEntry.uuid);
    if (!objResolved) {
      lstNotFound.push({ slug: strSlug, uuid: objEntry.uuid, registeredId: objEntry.id });
      continue;
    }
    if (objResolved.id !== objEntry.id) {
      lstMismatched.push({ slug: strSlug, uuid: objEntry.uuid, oldId: objEntry.id, newId: objResolved.id, title: objResolved.title });
      if (MODE === 'init' || MODE === 'update') {
        objRegistry.scripts[strSlug].id = objResolved.id;
        objRegistry.scripts[strSlug].title = objResolved.title;
      }
    } else {
      lstOk.push(strSlug);
    }
  }

  console.log(`[OK] ${lstOk.length} scripts sin cambios.`);
  for (const m of lstMismatched) {
    const strAction = MODE === 'init' || MODE === 'update' ? ' → actualizado en el registro.' : ' → correr con --init/--update para aplicar.';
    console.log(`[MISMATCH] scripts.${m.slug} — uuid ${m.uuid}: id ${m.oldId} → ${m.newId} ("${m.title}")${strAction}`);
  }
  for (const n of lstNotFound) {
    console.log(`[MISSING] scripts.${n.slug} — uuid ${n.uuid} no encontrado en ningún watcher de esta instancia (registrado id=${n.registeredId}).`);
  }
  if (lstSkippedNoUuid.length) {
    console.log(`[SIN UUID] ${lstSkippedNoUuid.join(', ')} — nunca se vio un uuid para estos, no se pueden resolver automáticamente. Verificar manualmente.`);
  }

  return { ok: lstOk.length, mismatched: lstMismatched, notFound: lstNotFound, skippedNoUuid: lstSkippedNoUuid };
}

// ── Processes — verificación simple por id + presencia del eventId entre start_events ──
async function syncProcesses(objRegistry) {
  console.log('\n=== Processes ===');
  const lstOk = [];
  const lstIssues = [];

  for (const [strSlug, objEntry] of Object.entries(objRegistry.processes)) {
    try {
      const objProcess = await pm4Get(`/processes/${objEntry.processId}`);
      const strRemoteTitle = objProcess.name ?? objProcess.title;
      const lstStartEvents = objProcess.start_events ?? [];
      const blnEventExists = lstStartEvents.some((e) => e.id === objEntry.eventId);
      if (strRemoteTitle !== objEntry.title || !blnEventExists) {
        lstIssues.push({ slug: strSlug, processId: objEntry.processId, expectedTitle: objEntry.title, actualTitle: strRemoteTitle, eventFound: blnEventExists });
      } else {
        lstOk.push(strSlug);
      }
    } catch (excError) {
      lstIssues.push({ slug: strSlug, processId: objEntry.processId, error: excError.message });
    }
  }

  console.log(`[OK] ${lstOk.length} procesos sin cambios.`);
  for (const i of lstIssues) {
    if (i.error) {
      console.log(`[MISSING] processes.${i.slug} — process ${i.processId}: ${i.error}`);
    } else {
      console.log(`[MISMATCH] processes.${i.slug} — process ${i.processId}: título esperado "${i.expectedTitle}", real "${i.actualTitle}", eventId "${objRegistry.processes[i.slug].eventId}" encontrado=${i.eventFound}`);
    }
  }

  return { ok: lstOk.length, issues: lstIssues };
}

async function main() {
  console.log(`pm4-registry-sync — modo: --${MODE} — instancia: ${PM4_BASE_URL}`);
  const objRegistry = loadRegistry();

  const objCollectionsReport = await syncCollections(objRegistry);
  const objScriptsReport = await syncScripts(objRegistry);
  const objProcessesReport = await syncProcesses(objRegistry);

  if (MODE === 'init' || MODE === 'update') {
    saveRegistry(objRegistry);
  } else {
    console.log('\n(modo --check: no se escribió nada. Usar --init o --update para aplicar los scripts resueltos por uuid.)');
  }

  const blnHasBlockingIssues =
    objCollectionsReport.mismatched.length > 0 ||
    objCollectionsReport.missing.length > 0 ||
    objScriptsReport.notFound.length > 0 ||
    objProcessesReport.issues.length > 0;

  console.log('\n=== Resumen ===');
  console.log(`Collections: ${objCollectionsReport.ok} OK, ${objCollectionsReport.mismatched.length} mismatch, ${objCollectionsReport.missing.length} missing`);
  console.log(`Scripts:     ${objScriptsReport.ok} OK, ${objScriptsReport.mismatched.length} mismatch, ${objScriptsReport.notFound.length} not-found, ${objScriptsReport.skippedNoUuid.length} sin uuid`);
  console.log(`Processes:   ${objProcessesReport.ok} OK, ${objProcessesReport.issues.length} con problema`);

  process.exitCode = blnHasBlockingIssues ? 1 : 0;
}

main().catch((excError) => {
  console.error('Error fatal:', excError);
  process.exitCode = 1;
});
