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
// Las tres fuentes se resuelven automáticamente:
//   1 → extraerScriptRefs / extraerSubprocesos, leyendo el BPMN.
//   2 → extraerDependenciasDeCodigo, leyendo el PHP de los scripts ya vigilados.
//   3 → extraerSlugsInvocadosPorFrontend + uuidsDesdeRegistro, leyendo el TSX de las pantallas
//       del proceso y traduciendo el slug con pm4-registry.json.
//
// La inferencia de 2 y 3 es CONSERVADORA: un identificador solo cuenta si resuelve a un script
// que existe en la instancia. Eso descarta solo los falsos positivos obvios (un uuid de colección
// como FERIADOS_COLLECTION_UUID no resuelve a script, así que se ignora) sin inventar relaciones.
//
// Lo que NO se puede inferir —un id armado en runtime, o que venga de una variable de entorno—
// sigue declarándose en `scriptsExtra`, que queda como escape y no como mecanismo principal.

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
 * Scripts que el CÓDIGO de un script referencia — dependencias que ningún BPMN muestra.
 *
 * Reconoce los dos patrones que usan los scripts de este proyecto:
 *   · un uuid literal, como `const UTIL_DIAS_HABILES_UUID = 'a26a713d-…'`
 *   · una constante de id, como `$SFC_CORE_SCRIPT_ID = 84`
 *
 * Solo cuenta si el identificador RESUELVE a un script de la instancia. Ese filtro es lo que hace
 * segura la inferencia: un uuid de colección (`FERIADOS_COLLECTION_UUID`) no resuelve a script y
 * se descarta solo, sin necesidad de adivinar por el nombre de la constante.
 *
 * @param {string} strCodigo código PHP del script
 * @param {{dicPorUuid: Map<string,object>, dicPorId: Map<number,object>}} dicIndices de la instancia
 * @returns {Set<string>} uuids de los scripts referenciados
 */
export function extraerDependenciasDeCodigo(strCodigo, { dicPorUuid, dicPorId }) {
  const setUuids = new Set();
  const strFuente = String(strCodigo ?? '');

  for (const objMatch of strFuente.matchAll(/['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi)) {
    const strUuid = objMatch[1].toLowerCase();
    if (dicPorUuid.has(strUuid)) setUuids.add(strUuid);
  }

  for (const objMatch of strFuente.matchAll(/\w*SCRIPT_ID\w*\s*=\s*(\d+)/gi)) {
    const objScript = dicPorId.get(Number(objMatch[1]));
    if (objScript?.uuid) setUuids.add(objScript.uuid);
  }

  return setUuids;
}

/**
 * Slugs de script que invoca el frontend de este repo.
 *
 * Las pantallas nunca usan el id numérico: llaman `resolveScriptId('slug', fallback)` contra
 * `pm4-registry.json` (regla #6 de CLAUDE.md). Ese slug es la pista, y hay que traducirlo con
 * uuidsDesdeRegistro() para llegar al script.
 *
 * @param {string} strFuente contenido de un .ts/.tsx
 * @returns {Set<string>} slugs encontrados
 */
export function extraerSlugsInvocadosPorFrontend(strFuente) {
  const setSlugs = new Set();
  for (const objMatch of String(strFuente ?? '').matchAll(/resolveScriptId\(\s*['"]([^'"]+)['"]/g)) {
    setSlugs.add(objMatch[1]);
  }
  return setSlugs;
}

/**
 * Traduce slugs de negocio a uuid usando pm4-registry.json.
 *
 * Se resuelve por uuid y no por el `id` del registro porque el id es de la instancia activa: si el
 * registro quedó desactualizado tras una migración, el uuid sigue apuntando al script correcto.
 *
 * @param {Iterable<string>} lstSlugs
 * @param {{scripts?: Record<string, {uuid?: string}>}} objRegistro contenido de pm4-registry.json
 * @returns {{uuids: Set<string>, sinRegistrar: string[]}}
 */
export function uuidsDesdeRegistro(lstSlugs, objRegistro) {
  const setUuids = new Set();
  const lstSinRegistrar = [];

  for (const strSlug of lstSlugs) {
    const strUuid = objRegistro?.scripts?.[strSlug]?.uuid;
    if (strUuid) setUuids.add(strUuid);
    else lstSinRegistrar.push(strSlug);
  }

  return { uuids: setUuids, sinRegistrar: lstSinRegistrar };
}

/**
 * Cierra transitivamente el conjunto de scripts vigilados siguiendo las dependencias del código.
 *
 * Hace falta iterar y no una sola pasada: si A (del BPMN) llama a B y B llama a C, C solo aparece
 * al mirar el código de B, que recién entró al conjunto en la vuelta anterior.
 *
 * @param {Set<string>} setUuidsIniciales punto de partida (BPMN + frontend + extras)
 * @param {Map<string,object>} dicPorUuid scripts de la instancia por uuid
 * @param {Map<number,object>} dicPorId scripts de la instancia por id
 * @returns {{uuids: Set<string>, agregados: Array<{uuid: string, desde: string}>}}
 */
export function cerrarDependencias(setUuidsIniciales, dicPorUuid, dicPorId) {
  const setUuids = new Set(setUuidsIniciales);
  const lstAgregados = [];
  const lstPendientes = [...setUuids];

  while (lstPendientes.length > 0) {
    const strUuid = lstPendientes.shift();
    const objScript = dicPorUuid.get(strUuid);
    if (!objScript) continue;

    // `codigo` o `code` según de dónde venga el script: la CLI trabaja con la forma normalizada
    // (`codigo`, ya canonicalizada) y la respuesta cruda de la API trae `code`. Aceptar ambas evita
    // que el descubrimiento quede mudo por un nombre de campo — que es exactamente lo que pasó la
    // primera vez que se conectó: detectaba las dependencias con datos crudos y ninguna con los
    // normalizados, dejando fuera al CORE SFC y a la utilidad de días hábiles sin ningún error.
    const strCodigo = objScript.codigo ?? objScript.code ?? '';

    for (const strDep of extraerDependenciasDeCodigo(strCodigo, { dicPorUuid, dicPorId })) {
      if (strDep === strUuid || setUuids.has(strDep)) continue;
      setUuids.add(strDep);
      lstPendientes.push(strDep);
      lstAgregados.push({ uuid: strDep, desde: objScript.title ?? strUuid });
    }
  }

  return { uuids: setUuids, agregados: lstAgregados };
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
