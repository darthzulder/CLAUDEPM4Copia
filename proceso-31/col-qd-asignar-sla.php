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
// feriados de Colombia (colección cat-feriados-colombia, id 48), usando las
// variables de entorno nativas de PM4 (HOST_URL / API_TOKEN).
//
// qd_strFilingDate puede llegar en formato d/m/Y (p.ej. "05/08/2026", que es
// el que envía actualmente el proceso) o en ISO 8601 (Y-m-d\TH:i:s). El
// parseo acepta ambos.

const FERIADOS_COLLECTION_ID = 48;
const PRORROGA_SLA_STEP_DAYS = 15;

function fetchHolidaySet($baseUrl, $token) {
    $holidaySet = [];
    if (!$baseUrl || !$token) {
        return $holidaySet;
    }
    $url = rtrim($baseUrl, '/') . '/api/1.0/collections/' . FERIADOS_COLLECTION_ID . '/records?per_page=500';

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
