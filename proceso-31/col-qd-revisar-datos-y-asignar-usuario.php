<?php 
/*  
 *  COL QD - Revisar datos y Asignar usuario
 *  Deriva el rol/grupo responsable de la queja.
 */

/** trim + lowercase para comparar columnas de la matriz (traen espacios sobrantes). */
function qd_norm($v) {
    return strtolower(trim((string) $v));
}

/**
 * Deriva el rolResponsable leyendo la colección cat_matriz_motivos (id 45).
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

    try {
        $res = $api->collections()->getRecords(45);
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
// (colección 45) antes de buscar el grupo.
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
