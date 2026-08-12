<?php 
/*  
 *  COL QD - Revisar datos y Asignar usuario
 *  Deriva el rol/grupo responsable de la queja.
 *
 *  PORTABILIDAD: la colección cat_matriz_motivos NO se referencia por su id
 *  numérico (cambia al migrar de instancia), sino por su UUID nativo, que el
 *  export/import de paquetes de PM4 preserva. El id real se resuelve en runtime
 *  vía $api->collections() y se cachea en proceso (mismo criterio que
 *  resolveScriptId() del script 77 COL_QD_Check_SLA_Expire — acá es
 *  resolveCollectionId(), su equivalente para colecciones). El id 45 solo queda
 *  como FALLBACK si la resolución dinámica no encuentra nada.
 */

// UUID estable de la colección cat_matriz_motivos (no cambia entre instancias).
const MATRIZ_MOTIVOS_COLLECTION_UUID     = 'a23663f3-e045-47ab-8859-30aca6876380';
// Nombre de respaldo por si el UUID no apareciera (p.ej. colección recreada a mano).
const MATRIZ_MOTIVOS_COLLECTION_NAME     = 'cat_matriz_motivos';
// Último recurso: id conocido en la instancia de referencia (PM4_BASE_URL actual).
const MATRIZ_MOTIVOS_COLLECTION_FALLBACK = 45;

/**
 * Resuelve el ID actual de una colección por su UUID (estable entre instancias),
 * con fallback a su nombre y, si tampoco aparece, al id conocido de la instancia
 * de referencia. Cachea el resultado en proceso para no repetir la búsqueda si se
 * invoca más de una vez en esta ejecución. Mismo criterio que resolveScriptId()
 * del script 77 (COL_QD_Check_SLA_Expire), adaptado a colecciones:
 * $api->collections()->getCollections($filter) es el equivalente de
 * $api->scripts()->getScripts($filter) — se acota por nombre (filtro liviano) y
 * se confirma por uuid antes de aceptar el match.
 */
function resolveCollectionId($api, $uuid, $name, $fallback) {
    static $cache = [];
    $cacheKey = $uuid ?: $name;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    try {
        $collections = $api->collections();
        $resp = $collections->getCollections($name);
        $list = ($resp && method_exists($resp, 'getData')) ? $resp->getData() : [];

        // 1º intento: match EXACTO por UUID (fuente de verdad).
        foreach (($list ?: []) as $c) {
            $cUuid = method_exists($c, 'getUuid') ? $c->getUuid() : ($c['uuid'] ?? null);
            if ($uuid && $cUuid === $uuid) {
                return $cache[$cacheKey] = (int)(method_exists($c, 'getId') ? $c->getId() : $c['id']);
            }
        }
        // 2º intento (fallback): match exacto por nombre si el UUID no apareció.
        foreach (($list ?: []) as $c) {
            $cName = method_exists($c, 'getName') ? $c->getName() : ($c['name'] ?? null);
            if ($cName === $name) {
                return $cache[$cacheKey] = (int)(method_exists($c, 'getId') ? $c->getId() : $c['id']);
            }
        }
    } catch (\Throwable $e) {
        // sigue al fallback de abajo
    }

    // Último recurso: id conocido de la instancia de referencia. No se degrada a
    // '' porque sin esta colección no hay forma de derivar el rol responsable en
    // los casos SmartSupervision, un costo mayor al de arriesgar un id
    // potencialmente desactualizado.
    error_log("[COL QD - Revisar datos y Asignar usuario] resolveCollectionId: no se resolvió '{$name}' (uuid={$uuid}) dinámicamente; usando fallback id={$fallback}.");
    return $cache[$cacheKey] = (int)$fallback;
}

/** trim + lowercase para comparar columnas de la matriz (traen espacios sobrantes). */
function qd_norm($v) {
    return strtolower(trim((string) $v));
}

/**
 * Deriva el rolResponsable leyendo la colección cat_matriz_motivos.
 * Mismo criterio que M1 (derivarClasificacion): match por
 * tipoSolicitud + productoZurich (labels) + codigoMotivoSFC.
 * OJO: el codigoMotivoSFC NO es único (un mismo código aparece para varios
 * productos/tipos de solicitud con roles distintos), por eso se combinan los 3
 * campos. Devuelve '' si no encuentra fila o si falta el código de motivo.
 */
function qd_derivarRolResponsable($api, array $data) {
    $requestLabel = isset($data['qd_strRequestType_desc']) ? (string) $data['qd_strRequestType_desc'] : '';
    if (trim($requestLabel) === '') { $requestLabel = 'Queja'; }
    $productLabel = isset($data['qd_strSfcProduct_desc']) ? (string) $data['qd_strSfcProduct_desc'] : '';
    $reasonCode   = isset($data['qd_strSfcReason']) ? (string) $data['qd_strSfcReason'] : '';
    if ($reasonCode === '') { return ''; }

    $intMatrizId = resolveCollectionId(
        $api,
        MATRIZ_MOTIVOS_COLLECTION_UUID,
        MATRIZ_MOTIVOS_COLLECTION_NAME,
        MATRIZ_MOTIVOS_COLLECTION_FALLBACK
    );

    try {
        $res = $api->collections()->getRecords($intMatrizId);
    } catch (\Throwable $e) {
        return '';
    }
    foreach ($res->getData() as $rec) {
        $d = $rec->getData();
        if (!is_array($d)) { continue; }
        $rowRequest = isset($d['tipoSolicitud'])  ? $d['tipoSolicitud']  : '';
        $rowProduct = isset($d['productoZurich']) ? $d['productoZurich'] : '';
        $rowCode    = isset($d['codigoMotivoSFC']) ? (string) $d['codigoMotivoSFC'] : '';
        if (qd_norm($rowRequest) === qd_norm($requestLabel)
            && qd_norm($rowProduct) === qd_norm($productLabel)
            && $rowCode === $reasonCode) {
            return trim((string) (isset($d['rolResponsable']) ? $d['rolResponsable'] : ''));
        }
    }
    return '';
}

//los datos son validados en el form 000
$qd_blnValidData = true;

// Rol responsable que viene del payload de ProcessMaker.
// Puede llegar vacío en casos originados en SmartSupervision (M1 directo).
$grupoAsignado = isset($data['qd_strResponsableRole']) ? trim((string) $data['qd_strResponsableRole']) : '';

// Casos SmartSupervision (qd_blnSmartSupervisionCase = true) pueden llegar SIN
// qd_strResponsableRole. En ese caso lo derivamos desde la matriz de motivos
// antes de buscar el grupo.
$esSmartCase = !empty($data['qd_blnSmartSupervisionCase'])
    && $data['qd_blnSmartSupervisionCase'] !== 'false'
    && $data['qd_blnSmartSupervisionCase'] !== '0';

if ($esSmartCase && $grupoAsignado === '') {
    $grupoAsignado = qd_derivarRolResponsable($api, $data);
}

// Buscar el grupo cuyo nombre coincide con el rol responsable y guardar su id
// para asignar la tarea dinámicamente más adelante.
// per_page alto: getGroups() está paginado y por defecto omite grupos (devuelve
// solo la primera página), lo que dejaba grupos válidos sin resolver.
$qd_intResponsableGroupID = null;
if ($grupoAsignado !== '') {
    $result = $api->groups()->getGroups(null, null, null, 'asc', 500);
    foreach ($result->getData() as $group) {
        // Comparación insensible a mayúsculas/minúsculas y espacios
        if (strcasecmp(trim($group->getName()), $grupoAsignado) === 0) {
            $qd_intResponsableGroupID = (int) $group->getId();
            break;
        }
    }
}

return array(
    'qd_strResponsableRole'    => $grupoAsignado,
    'qd_intResponsableGroupID' => $qd_intResponsableGroupID,
);
