// Descubrimiento de qué scripts pertenecen a un proceso PM4.
//
// El alcance del historial es POR PROCESO, no toda la instancia: en una instancia conviven varios
// proyectos (FAST-FLOW, CUW, pruebas) cuyos scripts no interesan y solo agregan ruido.
//
// El problema es que "los scripts del proceso 31" no es una lista que PM4 devuelva. Hay tres
// fuentes distintas y solo la primera es automática:
//
//   1. Los `pm:scriptRef` de los scriptTask del BPMN — incluidos los de sus subprocesos, que se
//      alcanzan siguiendo los `callActivity`. Esto se descubre solo.
//   2. Los que un script invoca en runtime vía `$api->scripts()->executeScript(...)`. No aparecen
//      en ningún BPMN: el CORE SFC (84) y la utilidad de días hábiles (95) entran por acá.
//   3. Los que invoca el frontend como watcher. Tampoco están en el BPMN: COL_QD_Check_Similitud
//      (70) entra por acá.
//
// Las fuentes 2 y 3 se declaran a mano en `pm4-scripts.config.json` (con su motivo), porque
// detectarlas exigiría analizar el PHP y el TSX — frágil y con falsos negativos justo en los
// scripts más críticos.

/**
 * Ids de script referenciados por los `scriptTask` de un BPMN.
 *
 * Los `pm:scriptRef=""` (tarea declarada sin script asignado) se descartan: no apuntan a nada.
 *
 * @param {string} strXml contenido del BPMN
 * @returns {number[]} ids únicos, en orden de aparición
 */
export function extraerScriptRefs(strXml) {
  const setIds = new Set();
  for (const objMatch of String(strXml).matchAll(/pm:scriptRef="(\d+)"/g)) {
    setIds.add(Number(objMatch[1]));
  }
  return [...setIds];
}

/**
 * Ids de los subprocesos invocados con `callActivity`.
 *
 * PM4 los expresa como `calledElement="ProcessId-32"`. Se lee ese atributo y no el `processId` del
 * `pm:config` adjunto porque `calledElement` es BPMN estándar y siempre está presente.
 *
 * @param {string} strXml contenido del BPMN
 * @returns {number[]} ids únicos de proceso
 */
export function extraerSubprocesos(strXml) {
  const setIds = new Set();
  for (const objMatch of String(strXml).matchAll(/calledElement="ProcessId-(\d+)"/g)) {
    setIds.add(Number(objMatch[1]));
  }
  return [...setIds];
}

/**
 * Recorre un proceso y sus subprocesos, acumulando los ids de script de todo el árbol.
 *
 * @param {number} intProcesoRaiz
 * @param {(intId: number) => Promise<string>} fnTraerBpmn descarga el BPMN de un proceso
 * @returns {Promise<{scriptIds: number[], procesos: number[]}>}
 */
export async function descubrirArbol(intProcesoRaiz, fnTraerBpmn) {
  const setScripts = new Set();
  const setProcesosVistos = new Set();
  const lstPendientes = [intProcesoRaiz];

  while (lstPendientes.length > 0) {
    const intProceso = lstPendientes.shift();
    // Guarda contra ciclos: un subproceso que (directa o indirectamente) se llame a sí mismo
    // colgaría el recorrido.
    if (setProcesosVistos.has(intProceso)) continue;
    setProcesosVistos.add(intProceso);

    let strXml;
    try {
      strXml = await fnTraerBpmn(intProceso);
    } catch {
      // Un subproceso borrado o sin permisos no debe tumbar el descubrimiento del resto.
      continue;
    }

    for (const intScript of extraerScriptRefs(strXml)) setScripts.add(intScript);
    for (const intSub of extraerSubprocesos(strXml)) lstPendientes.push(intSub);
  }

  return {
    scriptIds: [...setScripts].sort((a, b) => a - b),
    procesos: [...setProcesosVistos].sort((a, b) => a - b),
  };
}

/**
 * Resuelve el conjunto final de uuids vigilados para un proceso configurado.
 *
 * Los ids descubiertos del BPMN se traducen a uuid contra el listado de la instancia, porque el id
 * cambia entre instancias y el uuid no. Un id que no resuelve (script borrado de PM4 pero aún
 * referenciado por el BPMN) se reporta en `noResueltos` en vez de fallar en silencio.
 *
 * @param {number[]} lstScriptIds ids salidos del BPMN
 * @param {Array<{uuid: string, motivo?: string}>} lstExtra scripts declarados a mano
 * @param {Array<{id: number, uuid: string}>} lstRemotos scripts de la instancia
 * @returns {{uuids: Set<string>, noResueltos: number[]}}
 */
export function resolverUuidsVigilados(lstScriptIds, lstExtra, lstRemotos) {
  const dicPorId = new Map(lstRemotos.map((objScript) => [objScript.id, objScript.uuid]));
  const setUuids = new Set();
  const lstNoResueltos = [];

  for (const intId of lstScriptIds) {
    const strUuid = dicPorId.get(intId);
    if (strUuid) setUuids.add(strUuid);
    else lstNoResueltos.push(intId);
  }

  for (const objExtra of lstExtra ?? []) {
    if (objExtra?.uuid) setUuids.add(objExtra.uuid);
  }

  return { uuids: setUuids, noResueltos: lstNoResueltos };
}
