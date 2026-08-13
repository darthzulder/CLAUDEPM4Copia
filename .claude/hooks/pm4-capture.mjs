#!/usr/bin/env node
// Hook de captura del historial de scripts PM4. Atiende DOS eventos:
//
//   PreToolUse   → guarda el estado ANTERIOR, antes de que la escritura lo pise.
//                  Es lo que rescata un cambio hecho por otra persona en la UI de PM4.
//
//   PostToolUse  → guarda el estado NUEVO, apenas la escritura terminó.
//                  Sin esto, una sesión interrumpida dejaba en PM4 versiones que git nunca
//                  registró: el Pre solo guarda lo viejo, y lo nuevo esperaba a un
//                  `capture --all` final que podía no llegar nunca.
//
// Los dos juntos cierran la ventana: cada versión que existió en PM4 queda registrada en el
// momento, sin depender de que la sesión termine bien.
//
// Herramientas que escriben (el matcher cubre ambas):
//   · pm4_update_script            — sobrescribe el código.
//   · pm4_run_script + code_adhoc  — guarda el código temporal y luego restaura. Capturar
//                                    DESPUÉS también detecta una restauración fallida, que
//                                    dejaría el script con el código de prueba.
// Un pm4_run_script sin code_adhoc es lectura pura: se ignora en ambos eventos.
//
// POR QUÉ NODE Y NO POWERSHELL: la política de ejecución de esta máquina es `AllSigned`, así
// que un .ps1 sin firma digital no corre. Node no tiene esa restricción y evita además las
// trampas de encoding UTF-8 de PowerShell 5.1.
//
// Escape de emergencia: PM4_CAPTURE_SKIP=1 salta la captura, dejándolo anotado.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Emite la decisión y termina. Siempre exit 0: lo que decide viaja en el JSON.
 *
 * El shape difiere por evento y no es intercambiable: `hookSpecificOutput.permissionDecision`
 * solo lo interpreta PreToolUse (es lo único que puede permitir o denegar). En PostToolUse la
 * herramienta ya corrió, así que el contexto va como `additionalContext` de primer nivel.
 */
function decidir({ blnEsPost, strDecision, strContexto }) {
  const objSalida = blnEsPost
    ? { additionalContext: strContexto }
    : {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: strDecision,
          permissionDecisionReason: strContexto,
          additionalContext: strContexto,
        },
      };
  process.stdout.write(JSON.stringify(objSalida));
  process.exit(0);
}

function leerStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let blnEsPost = false;

try {
  const strEntrada = leerStdin();
  if (!strEntrada.trim()) decidir({ blnEsPost, strDecision: 'allow', strContexto: 'Hook sin entrada; no se capturó.' });

  const objEntrada = JSON.parse(strEntrada);
  blnEsPost = objEntrada.hook_event_name === 'PostToolUse';

  const strTool = String(objEntrada.tool_name ?? '');
  const objArgs = objEntrada.tool_input ?? {};

  // Lectura pura: no hay estado que preservar ni que registrar.
  if (strTool.includes('pm4_run_script') && !String(objArgs.code_adhoc ?? '').trim()) {
    decidir({ blnEsPost, strDecision: 'allow', strContexto: 'Ejecución sin code_adhoc: no modifica el script.' });
  }

  const intId = objArgs.id;
  if (!intId) decidir({ blnEsPost, strDecision: 'allow', strContexto: 'La llamada no trae id de script; no hay qué capturar.' });

  // Si la escritura falló, PM4 quedó como estaba y no hay estado nuevo que registrar. Se exige
  // evidencia EXPLÍCITA de fallo (`success === false`) en vez de asumirlo: capturar de más es
  // inocuo —la captura es idempotente— y capturar de menos pierde historial.
  if (blnEsPost && objEntrada.tool_response?.success === false) {
    decidir({ blnEsPost, strDecision: 'allow', strContexto: `La escritura del script ${intId} falló; no hay estado nuevo que registrar.` });
  }

  if (process.env.PM4_CAPTURE_SKIP === '1') {
    decidir({
      blnEsPost,
      strDecision: 'allow',
      strContexto: `PM4_CAPTURE_SKIP=1 — se OMITIÓ la captura del script ${intId}. Su estado ${blnEsPost ? 'nuevo' : 'previo'} NO quedó registrado.`,
    });
  }

  // $CLAUDE_PROJECT_DIR lo inyecta Claude Code; el fallback cubre una ejecución manual.
  const strRaiz = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const strCli = join(strRaiz, 'pm4-app', 'scripts', 'pm4-scripts', 'pm4-scripts.mjs');

  if (!existsSync(strCli)) {
    decidir({
      blnEsPost,
      strDecision: 'deny',
      strContexto: `No se encontró la CLI de captura en ${strCli}. No se sobrescribe un script sin poder registrar su estado previo.`,
    });
  }

  const strMotivo = blnEsPost ? `post-escritura IA (${strTool})` : `pre-escritura IA (${strTool})`;

  let strSalida;
  try {
    strSalida = execFileSync(
      process.execPath,
      [strCli, 'capture', '--id', String(intId), '--json', '--reason', strMotivo],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 },
    );
  } catch (excError) {
    const strDetalle = (String(excError.stdout ?? '') + String(excError.stderr ?? '')).trim().slice(0, 500);
    // En Post la escritura ya ocurrió: denegar no la desharía, solo escondería el problema.
    // Lo que corresponde es avisar fuerte de que ese estado quedó SIN registrar.
    decidir({
      blnEsPost,
      strDecision: 'deny',
      strContexto: blnEsPost
        ? `⚠️ El script ${intId} se modificó en PM4 pero NO se pudo registrar en el historial: ${strDetalle}. Corré 'npm run pm4:capture -- --all' cuando se resuelva.`
        : `La captura del script ${intId} falló: ${strDetalle}. Corregilo, o usá PM4_CAPTURE_SKIP=1 si aceptás perder el historial de este cambio.`,
    });
  }

  // En modo --json la CLI emite una sola línea JSON; se toma la última por si hubo ruido previo.
  const strJson = strSalida.split('\n').map((s) => s.trim()).filter((s) => s.startsWith('{')).pop();
  const objRes = strJson ? JSON.parse(strJson) : null;

  if (objRes?.capturados > 0) {
    const strSha = String(objRes.commit).slice(0, 7);
    decidir({
      blnEsPost,
      strDecision: 'allow',
      strContexto: blnEsPost
        ? `Script ${intId} registrado en ${objRes.rama}@${strSha}.`
        : `Estado previo del script ${intId} guardado en ${objRes.rama}@${strSha}.`,
    });
  }

  // Fuera de alcance NO es lo mismo que "ya capturado": este script no pertenece a ningún proceso
  // vigilado, así que su historial NO se está registrando. Decirlo importa — el mensaje genérico
  // haría creer que hay respaldo donde no lo hay.
  if (objRes?.fueraDeAlcance) {
    decidir({
      blnEsPost,
      strDecision: 'allow',
      strContexto: `El script ${intId} no pertenece a ningún proceso vigilado: se modificó SIN registrar historial. Si querés versionarlo, agregá su proceso a pm4-scripts.config.json.`,
    });
  }

  decidir({
    blnEsPost,
    strDecision: 'allow',
    strContexto: blnEsPost
      ? `El script ${intId} quedó igual que la última captura; no hizo falta un commit nuevo.`
      : `El script ${intId} ya estaba capturado; su estado previo está en el historial.`,
  });
} catch (excError) {
  // Un fallo del propio hook no debe dejar pasar una escritura sin registro (en Pre), ni quedar
  // mudo cuando el estado nuevo no se guardó (en Post).
  decidir({
    blnEsPost,
    strDecision: 'deny',
    strContexto: `El hook de captura falló: ${excError?.message ?? excError}. Usá PM4_CAPTURE_SKIP=1 para saltarlo asumiendo la pérdida de historial.`,
  });
}
