<?php
// Script PM4 (watcher) — Quejas Directas.
// Asigna/recalcula el SLA y la fecha de vencimiento de la queja.
//
// - Caso nuevo (sin prórroga): SLA=9 días hábiles, o SLA=2 si hay casos
//   similares. Inicializa qd_strExtensionDays='1' (primera prórroga posible).
// - Prórroga (qd_strAction == 'SOLICITAR_PRORROGA'): el script 78
//   (COL_QD_SS_Sla_Prolongation) ya decidió/ejecutó la prórroga en el paso
//   anterior del BPM y devolvió qd_strExtensionDays (YA INCREMENTADO en éxito)
//   y qd_strM3FailedStep ('' = éxito; cualquier otro valor = rechazo/fallo).
//   Si fue éxito, el SLA nuevo es PRORROGA_SLA_STEP_DAYS * (qd_strExtensionDays
//   - 1), porque 78 ya incrementó el contador (entrante 1 -> 78 devuelve 2 ->
//   SLA = 15 * (2 - 1) = 15). Si fue rechazo/fallo, el SLA existente del caso
//   se conserva.
//
// La fecha de vencimiento se calcula siempre como
// qd_strFilingDate + SLA días HÁBILES, excluyendo fines de semana y los
// feriados de Colombia (colección cat-feriados-colombia), usando las
// variables de entorno nativas de PM4 (HOST_URL / API_TOKEN).
//
// qd_strFilingDate puede llegar en formato d/m/Y (p.ej. "05/08/2026", que es
// el que envía actualmente el proceso) o en ISO 8601 (Y-m-d\TH:i:s). El
// parseo acepta ambos.
//
// PORTABILIDAD: la colección de feriados NO se referencia por su id numérico
// (cambia al migrar de instancia), sino por su UUID nativo, que el export/import
// de paquetes de PM4 preserva. El id real se resuelve en runtime contra
// GET /collections y se cachea en proceso (mismo criterio que resolveScriptId()
// del script 77 COL_QD_Check_SLA_Expire — acá es resolveCollectionId(), su
// equivalente para colecciones). El id 48 solo queda como FALLBACK si la
// resolución dinámica no encuentra nada.

// UUID estable de la colección cat-feriados-colombia (no cambia entre instancias).
const FERIADOS_COLLECTION_UUID     = 'a2421287-eefe-4ff6-88a8-7f7040a2d10e';
// Nombre de respaldo por si el UUID no apareciera (p.ej. colección recreada a mano).
const FERIADOS_COLLECTION_NAME     = 'cat-feriados-colombia';
// Último recurso: id conocido en la instancia de referencia (PM4_BASE_URL actual).
const FERIADOS_COLLECTION_FALLBACK = 48;

const PRORROGA_SLA_STEP_DAYS = 15;

/**
 * Resuelve el ID actual de una colección por su UUID (estable entre instancias),
 * con fallback a su nombre y, si tampoco aparece, al id conocido de la instancia
 * de referencia. Cachea el resultado en proceso para no repetir la búsqueda si se
 * invoca más de una vez en esta ejecución. Mismo criterio que resolveScriptId()
 * del script COL_QD_Check_SLA_Expire (77), adaptado a colecciones: GET /collections
 * no acepta uuid como filtro directo, así que se trae por nombre (filtro liviano)
 * y se confirma por uuid antes de aceptar el match.
 */
function resolveCollectionId($baseUrl, $token, $uuid, $name, $fallback) {
    static $cache = [];
    $cacheKey = $uuid ?: $name;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    if ($baseUrl && $token) {
        $url = rtrim($baseUrl, '/') . '/api/1.0/collections?per_page=500&filter=' . rawurlencode($name);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if (!$curlError && $httpCode === 200 && $response) {
            $payload = json_decode($response, true);
            $list = $payload['data'] ?? [];

            // 1º intento: match EXACTO por UUID (fuente de verdad).
            foreach ($list as $c) {
                if ($uuid && ($c['uuid'] ?? null) === $uuid) {
                    return $cache[$cacheKey] = (int)$c['id'];
                }
            }
            // 2º intento (fallback): match exacto por nombre si el UUID no apareció.
            foreach ($list as $c) {
                if (($c['name'] ?? null) === $name) {
                    return $cache[$cacheKey] = (int)$c['id'];
                }
            }
        }
    }

    // Último recurso: id conocido de la instancia de referencia. No se degrada a
    // null porque sin esta colección el cálculo de días hábiles pierde TODOS los
    // feriados (silenciosamente correcto solo en fines de semana), un costo mayor
    // al de arriesgar un id potencialmente desactualizado.
    error_log("[COL_QD_Asignar_SLA] resolveCollectionId: no se resolvió '{$name}' (uuid={$uuid}) dinámicamente; usando fallback id={$fallback}.");
    return $cache[$cacheKey] = (int)$fallback;
}

function fetchHolidaySet($baseUrl, $token) {
    $holidaySet = [];
    if (!$baseUrl || !$token) {
        return $holidaySet;
    }

    $collectionId = resolveCollectionId(
        $baseUrl,
        $token,
        FERIADOS_COLLECTION_UUID,
        FERIADOS_COLLECTION_NAME,
        FERIADOS_COLLECTION_FALLBACK
    );

    $url = rtrim($baseUrl, '/') . '/api/1.0/collections/' . $collectionId . '/records?per_page=500';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError || $httpCode !== 200 || !$response) {
        return $holidaySet;
    }

    $payload = json_decode($response, true);
    foreach (($payload['data'] ?? []) as $record) {
        $fecha = $record['data']['holyday_date'] ?? null;
        if ($fecha) {
            $holidaySet[$fecha] = true;
        }
    }
    return $holidaySet;
}

/** Parsea qd_strFilingDate aceptando d/m/Y o ISO 8601 (Y-m-d\TH:i:s). */
function parseFilingDate($strFilingDate, DateTimeZone $timezone) {
    if (!$strFilingDate) {
        return false;
    }
    foreach (['d/m/Y', 'Y-m-d\TH:i:s', 'Y-m-d'] as $format) {
        $date = DateTime::createFromFormat($format, $strFilingDate, $timezone);
        if ($date !== false) {
            $date->setTime(0, 0, 0);
            return $date;
        }
    }
    return false;
}

function isBusinessDay(DateTime $date, array $holidaySet) {
    $weekday = (int)$date->format('N'); // 1=lunes ... 7=domingo
    if ($weekday >= 6) {
        return false; // sábado o domingo
    }
    return !isset($holidaySet[$date->format('Y-m-d')]);
}

/** Suma $days días HÁBILES a $start (el propio $start no cuenta). */
function addBusinessDays(DateTime $start, $days, array $holidaySet) {
    $result = clone $start;
    $added = 0;
    while ($added < $days) {
        $result->modify('+1 day');
        if (isBusinessDay($result, $holidaySet)) {
            $added++;
        }
    }
    return $result;
}

$timezone = new DateTimeZone('America/Bogota');

// 1. Asignación de variables limpias
$intCountSimilar = $data['qd_intCountSimilarCases'] ?? null;
$strFilingDate = $data['qd_strFilingDate'] ?? null;
$strAction = (string)($data['qd_strAction'] ?? '');
$strM3FailedStep = (string)($data['qd_strM3FailedStep'] ?? '');
$intExtensionDaysIn = is_numeric($data['qd_strExtensionDays'] ?? null) ? (int)$data['qd_strExtensionDays'] : null;

$objFilingDate = parseFilingDate($strFilingDate, $timezone);

$arrHolidaySet = fetchHolidaySet(getenv('HOST_URL') ?: null, getenv('API_TOKEN') ?: null);

// 2. Lógica de negocio
if ($strAction === 'SOLICITAR_PRORROGA') {
    if ($strM3FailedStep === '') {
        // 78 aplicó la prórroga con éxito (local o vía SFC). qd_strExtensionDays
        // YA viene incrementado por 78; el SLA se calcula sobre el número de
        // prórroga real = qd_strExtensionDays - 1 (entrante 1 -> 78 devuelve 2
        // -> SLA = 15 * (2 - 1) = 15).
        $intSlaAssigned = PRORROGA_SLA_STEP_DAYS * ($intExtensionDaysIn - 1);
    } else {
        // Rechazo por máximo o fallo SFC: no tocar el SLA existente del caso.
        $intSlaAssigned = (int)($data['qd_strSlaAssigned'] ?? 0);
    }
    $intSlaDaysProlongated = $intSlaAssigned;
    $strExtensionDaysOut = (string)($intExtensionDaysIn ?? 1);
} else {
    // Sin prórroga: asigna SLA por similaridad (2 días hábiles si hay casos similares, 9 si no).
    $intSlaAssigned = ((int)$intCountSimilar > 0) ? 2 : 9;
    $intSlaDaysProlongated = 0;
    $strExtensionDaysOut = '1';
}

$intDaysToExpire = $intSlaAssigned;
$strExpireDate = $objFilingDate ? addBusinessDays($objFilingDate, $intSlaAssigned, $arrHolidaySet)->format('d/m/Y') : null;

// 3. Retorno único y limpio
return [
    'qd_strSlaAssigned' => $intSlaAssigned,
    //'qd_strdaysToExpire' => $intDaysToExpire,
    //'qd_strSlaDaysProlongated' => $intSlaDaysProlongated,
    'qd_strExpireDate' => $strExpireDate,
    'qd_strExtensionDays' => $strExtensionDaysOut,
];
