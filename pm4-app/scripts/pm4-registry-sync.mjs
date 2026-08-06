#!/usr/bin/env node
// pm4-registry-sync.mjs — verifica/genera frontend/src/config/pm4-registry.json contra
// la instancia PM4 real (PM4_BASE_URL + PM4_TOKEN de pm4-app/.env o del entorno).
//
// Modos:
//   --check          reporta drift, NUNCA escribe el registro.
//   --init/--update  resuelve y ESCRIBE automáticamente collections/scripts/processes
//                    en el registro (mismo comportamiento en ambos flags — se mantienen
//                    los dos nombres por costumbre de uso, no hay diferencia funcional).
//   --ci             pensado para correr como `prebuild` en el deploy (Render). Cambia
//                    la política de fallas: NUNCA bloquea el build/deploy —
//                    - si no hay PM4_BASE_URL/PM4_TOKEN disponibles, o PM4 no responde
//                      (red, auth, instancia caída), se omite el sync (con un aviso) y
//                      el build sigue con el registro ya commiteado.
//                    - si PM4 SÍ responde pero hay collections/scripts/processes sin
//                      resolver, igual se imprime un banner bien visible en el log de
//                      build, pero el exit code queda en 0 (no tira el deploy).
//                    Sin --ci, el exit code SÍ refleja problemas reales (uso interactivo
//                    por una persona, o un pipeline que quiera fallar a propósito).
//
// ⚠️ SUPUESTO DE AUTOMATIZACIÓN (asumido explícitamente por el usuario del proyecto):
// la migración entre instancias PM4 preserva los NOMBRES exactos (título de colección,
// nombre de proceso, nombre de evento BPMN) — solo los IDs numéricos cambian. Si en
// origen hay un nombre que ya existe en destino (colisión), se debe renombrar en origen
// ANTES de migrar para que los nombres sigan siendo idénticos 1:1 entre instancias.
// Bajo ese supuesto, el nombre es una clave de resolución confiable y este script
// resuelve TODO por nombre (collections, processes) o por uuid (scripts, más confiable
// aún cuando existe) sin pedir confirmación humana.
//
// Si esa garantía no se cumple en algún caso puntual (nombre duplicado no resuelto,
// colección renombrada sin querer, etc.), el reporte igual lo muestra como [MISSING]
// (nombre no encontrado en destino) — no falla en silencio.
//
// Uso:
//   node scripts/pm4-registry-sync.mjs --check
//   node scripts/pm4-registry-sync.mjs --update
//   node scripts/pm4-registry-sync.mjs --update --ci   # invocado por `npm run prebuild`
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

// --init se acepta como alias de --update (mismo comportamiento) por costumbre de uso.
const MODE = (process.argv.includes('--init') || process.argv.includes('--update'))
  ? 'update'
  : 'check';
const CI_MODE = process.argv.includes('--ci');

// ── .env mínimo (sin dependencias) — solo necesitamos PM4_BASE_URL y PM4_TOKEN.
// En Render (y cualquier entorno de deploy) no hay archivo .env — las env vars ya están
// en process.env directamente. Si el archivo no existe, seguimos con {} y confiamos en
// process.env; solo es un error real cuando NINGUNA de las dos fuentes trae credenciales.
function loadEnv(path) {
  const dicEnv = {};
  let strRaw;
  try {
    strRaw = readFileSync(path, 'utf8');
  } catch {
    return dicEnv;
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
// process.env manda sobre .env — es la fuente correcta en un entorno de deploy (Render
// inyecta env vars reales, no un archivo .env empaquetado).
const PM4_BASE_URL = (process.env.PM4_BASE_URL ?? dicEnv.PM4_BASE_URL ?? '').replace(/\/$/, '');
const PM4_TOKEN = process.env.PM4_TOKEN ?? dicEnv.PM4_TOKEN ?? '';

if (!PM4_BASE_URL || !PM4_TOKEN) {
  if (CI_MODE) {
    console.warn('[pm4-registry-sync] PM4_BASE_URL/PM4_TOKEN no disponibles en este build — se omite el sync y se usa pm4-registry.json tal cual está commiteado.');
    process.exit(0);
  }
  console.error('PM4_BASE_URL y/o PM4_TOKEN no están definidos (ni en .env ni en el entorno) — no se puede continuar.');
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

// ── Collections — sin uuid nativo, resolución por título (nombre garantizado estable
// entre instancias — ver supuesto documentado arriba) ───────────────────────────────
async function syncCollections(objRegistry) {
  console.log('\n=== Collections ===');
  const objList = await pm4Get('/collections', { per_page: 200 });
  const lstRemote = objList.data ?? [];
  const dicRemoteByTitle = new Map(lstRemote.map((c) => [c.name ?? c.title, c]));

  const lstOk = [];
  const lstUpdated = [];
  const lstMissing = [];

  for (const [strSlug, objEntry] of Object.entries(objRegistry.collections)) {
    const objRemote = dicRemoteByTitle.get(objEntry.title);
    if (!objRemote) {
      lstMissing.push({ slug: strSlug, expectedTitle: objEntry.title, lastKnownId: objEntry.id });
      continue;
    }
    if (objRemote.id !== objEntry.id) {
      lstUpdated.push({ slug: strSlug, title: objEntry.title, oldId: objEntry.id, newId: objRemote.id });
      if (MODE === 'update') {
        objRegistry.collections[strSlug].id = objRemote.id;
      }
    } else {
      lstOk.push(strSlug);
    }
  }

  console.log(`[OK] ${lstOk.length} colecciones sin cambios.`);
  for (const u of lstUpdated) {
    const strAction = MODE === 'update' ? ' → actualizado en el registro.' : ' → correr con --update para aplicar.';
    console.log(`[RESUELTO POR NOMBRE] collections.${u.slug} — "${u.title}": id ${u.oldId} → ${u.newId}${strAction}`);
  }
  for (const m of lstMissing) {
    console.log(`[MISSING] collections.${m.slug} — título "${m.expectedTitle}" (último id conocido ${m.lastKnownId}) no existe en esta instancia. Requiere revisión manual — ¿no se migró, o cambió de nombre?`);
  }

  return { ok: lstOk.length, updated: lstUpdated, missing: lstMissing };
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
      if (MODE === 'update') {
        objRegistry.scripts[strSlug].id = objResolved.id;
        objRegistry.scripts[strSlug].title = objResolved.title;
      }
    } else {
      lstOk.push(strSlug);
    }
  }

  console.log(`[OK] ${lstOk.length} scripts sin cambios.`);
  for (const m of lstMismatched) {
    const strAction = MODE === 'update' ? ' → actualizado en el registro.' : ' → correr con --update para aplicar.';
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

// ── Processes — resolución por nombre (proceso y evento), igual supuesto que collections ──
// El processId es una PK de la instancia (cambia al migrar) — se resuelve por `title`.
// El eventId ('node_661') es un id interno de nodo BPMN — para resolverlo con la misma
// confianza que el proceso, el registro puede declarar `eventName` (nombre del start event,
// ej. "Comenzar caso por WE") y este script lo busca por nombre entre los start_events del
// proceso ya resuelto. Si `eventName` no está declarado, solo se verifica que el eventId
// registrado siga existiendo (no se puede auto-resolver sin un nombre de referencia).
async function syncProcesses(objRegistry) {
  console.log('\n=== Processes ===');
  const objList = await pm4Get('/processes', { per_page: 500 });
  const lstRemote = objList.data ?? [];
  const dicRemoteByTitle = new Map(lstRemote.map((p) => [p.name ?? p.title, p]));

  const lstOk = [];
  const lstUpdated = [];
  const lstMissing = [];
  const lstEventIssues = [];

  for (const [strSlug, objEntry] of Object.entries(objRegistry.processes)) {
    const objProcess = dicRemoteByTitle.get(objEntry.title);
    if (!objProcess) {
      lstMissing.push({ slug: strSlug, expectedTitle: objEntry.title, lastKnownId: objEntry.processId });
      continue;
    }

    let blnChanged = false;
    if (objProcess.id !== objEntry.processId) {
      lstUpdated.push({ slug: strSlug, title: objEntry.title, field: 'processId', oldValue: objEntry.processId, newValue: objProcess.id });
      if (MODE === 'update') { objRegistry.processes[strSlug].processId = objProcess.id; }
      blnChanged = true;
    }

    const lstStartEvents = objProcess.start_events ?? [];
    if (objEntry.eventName) {
      const objEvent = lstStartEvents.find((e) => e.name === objEntry.eventName);
      if (!objEvent) {
        lstEventIssues.push({ slug: strSlug, eventName: objEntry.eventName, reason: 'no se encontró ningún start event con ese nombre' });
      } else if (objEvent.id !== objEntry.eventId) {
        lstUpdated.push({ slug: strSlug, title: objEntry.title, field: 'eventId', oldValue: objEntry.eventId, newValue: objEvent.id });
        if (MODE === 'update') { objRegistry.processes[strSlug].eventId = objEvent.id; }
        blnChanged = true;
      }
    } else {
      const blnEventExists = lstStartEvents.some((e) => e.id === objEntry.eventId);
      if (!blnEventExists) {
        lstEventIssues.push({ slug: strSlug, eventName: null, reason: `eventId "${objEntry.eventId}" ya no existe entre los start_events y no hay "eventName" declarado para resolverlo por nombre — agregarlo al registro` });
      }
    }

    if (!blnChanged && lstEventIssues.every((i) => i.slug !== strSlug)) lstOk.push(strSlug);
  }

  console.log(`[OK] ${lstOk.length} procesos sin cambios.`);
  for (const u of lstUpdated) {
    const strAction = MODE === 'update' ? ' → actualizado en el registro.' : ' → correr con --update para aplicar.';
    console.log(`[RESUELTO POR NOMBRE] processes.${u.slug}.${u.field} — "${u.title}": ${u.oldValue} → ${u.newValue}${strAction}`);
  }
  for (const m of lstMissing) {
    console.log(`[MISSING] processes.${m.slug} — título "${m.expectedTitle}" (último processId conocido ${m.lastKnownId}) no existe en esta instancia.`);
  }
  for (const e of lstEventIssues) {
    console.log(`[EVENTO NO RESUELTO] processes.${e.slug} — ${e.reason}`);
  }

  return { ok: lstOk.length, updated: lstUpdated, missing: lstMissing, eventIssues: lstEventIssues };
}

async function runSync() {
  console.log(`pm4-registry-sync — modo: --${MODE}${CI_MODE ? ' --ci' : ''} — instancia: ${PM4_BASE_URL}`);
  const objRegistry = loadRegistry();

  const objCollectionsReport = await syncCollections(objRegistry);
  const objScriptsReport = await syncScripts(objRegistry);
  const objProcessesReport = await syncProcesses(objRegistry);

  if (MODE === 'update') {
    saveRegistry(objRegistry);
  } else {
    console.log('\n(modo --check: no se escribió nada. Usar --update para aplicar todo lo resuelto por nombre/uuid.)');
  }

  console.log('\n=== Resumen ===');
  console.log(`Collections: ${objCollectionsReport.ok} OK, ${objCollectionsReport.updated.length} resueltas por nombre, ${objCollectionsReport.missing.length} missing`);
  console.log(`Scripts:     ${objScriptsReport.ok} OK, ${objScriptsReport.mismatched.length} resueltos por uuid, ${objScriptsReport.notFound.length} not-found, ${objScriptsReport.skippedNoUuid.length} sin uuid`);
  console.log(`Processes:   ${objProcessesReport.ok} OK, ${objProcessesReport.updated.length} resueltos por nombre, ${objProcessesReport.missing.length} missing, ${objProcessesReport.eventIssues.length} eventos sin resolver`);

  return {
    hasBlockingIssues:
      objCollectionsReport.missing.length > 0 ||
      objScriptsReport.notFound.length > 0 ||
      objProcessesReport.missing.length > 0 ||
      objProcessesReport.eventIssues.length > 0,
  };
}

async function main() {
  if (CI_MODE) {
    // Política de build: nunca bloquear el deploy. Si algo revienta (red, auth, instancia
    // caída, cambio de shape en la API), lo avisamos fuerte y seguimos con el registro
    // que ya está commiteado — es preferible deployar con IDs potencialmente
    // desactualizados a que un problema de PM4 (ajeno al código) tumbe el deploy entero.
    try {
      const { hasBlockingIssues } = await runSync();
      if (hasBlockingIssues) {
        console.warn('\n⚠️⚠️⚠️  ACCIÓN REQUERIDA — pm4-registry.json tiene entradas sin resolver (ver arriba).');
        console.warn('⚠️⚠️⚠️  El build continúa igual (--ci nunca bloquea el deploy), pero revisar antes de confiar en el resultado.\n');
      }
    } catch (excError) {
      console.warn(`[pm4-registry-sync] no se pudo sincronizar contra PM4 (${excError.message}) — se continúa con el registro ya commiteado.`);
    }
    process.exitCode = 0;
    return;
  }

  const { hasBlockingIssues } = await runSync();
  process.exitCode = hasBlockingIssues ? 1 : 0;
}

main().catch((excError) => {
  if (CI_MODE) {
    console.warn(`[pm4-registry-sync] error inesperado (${excError.message}) — se continúa con el registro ya commiteado.`);
    process.exitCode = 0;
    return;
  }
  console.error('Error fatal:', excError);
  process.exitCode = 1;
});
