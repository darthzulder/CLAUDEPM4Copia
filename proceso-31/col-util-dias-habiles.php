<?php
// COL_UTIL_Dias_Habiles — Utilidad GENERAL de días hábiles de Colombia.
//
// Centraliza TODA la lógica de días hábiles (fines de semana + feriados de la
// colección cat-feriados-colombia id 48) para reutilizarla desde cualquier
// script o screen. NO contiene reglas de negocio de ningún proceso concreto.
//
// Entrada ($data):
//   op            'diff' (default) | 'add'
//   formato       formato de fecha PHP (default 'd/m/Y'); aplica a entrada y salida
//
//   op = 'diff'  -> días HÁBILES entre dos fechas, CON SIGNO
//                   (negativo si fecha_fin ya pasó respecto a fecha_inicio):
//     fecha_inicio   fecha inicial, EXCLUSIVA. Acepta 'today' (hoy en Bogotá).
//     fecha_fin      fecha final, INCLUSIVA.   Acepta 'today'.
//     salida: { "dias": <int con signo> }
//
//   op = 'add'   -> suma/resta N días HÁBILES a una fecha -> nueva fecha:
//     fecha          fecha base. Acepta 'today'.
//     dias           entero; negativo = restar (retroceder).
//     salida: { "fecha": "<Y-m-d>", "fecha_fmt": "<en 'formato'>" }
//
// En error de formato devuelve { "error": "<detalle>" } para que el llamador
// decida cómo degradar.
//
// Corre como Script de PM4: usa HOST_URL y API_TOKEN inyectados por el entorno.

const FERIADOS_COLLECTION_ID = 48;

/**
 * Trae las fechas de feriados (YYYY-MM-DD) desde la colección cat-feriados-colombia.
 * Degrada seguro devolviendo set vacío (solo se excluyen fines de semana) si falla.
 */
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

function isBusinessDay(DateTime $date, array $holidaySet) {
    $weekday = (int)$date->format('N'); // 1=lunes ... 7=domingo
    if ($weekday >= 6) {
        return false; // sábado o domingo
    }
    return !isset($holidaySet[$date->format('Y-m-d')]);
}

/**
 * Suma $days días HÁBILES a $start. El propio $start no cuenta.
 * $days negativo retrocede (resta días hábiles). $days == 0 devuelve $start.
 */
function addBusinessDays(DateTime $start, $days, array $holidaySet) {
    $result = clone $start;
    $days = (int)$days;
    if ($days === 0) {
        return $result;
    }
    $step = $days > 0 ? '+1 day' : '-1 day';
    $target = abs($days);
    $added = 0;
    while ($added < $target) {
        $result->modify($step);
        if (isBusinessDay($result, $holidaySet)) {
            $added++;
        }
    }
    return $result;
}

/**
 * Cuenta días HÁBILES entre $from (exclusivo) y $to (inclusivo), con signo:
 * positivo si $to es posterior a $from, negativo si $to ya pasó.
 */
function countBusinessDaysBetween(DateTime $from, DateTime $to, array $holidaySet) {
    $sign = 1;
    $start = clone $from;
    $end = clone $to;

    if ($end < $start) {
        $sign = -1;
        $tmp = $start;
        $start = $end;
        $end = $tmp;
    }

    $count = 0;
    $cursor = clone $start;
    while ($cursor < $end) {
        $cursor->modify('+1 day');
        if (isBusinessDay($cursor, $holidaySet)) {
            $count++;
        }
    }

    return $sign * $count;
}

/**
 * Parsea una fecha respetando 'today' (hoy en Bogotá) o el $formato dado.
 * Devuelve DateTime a medianoche, o null si el formato no coincide.
 */
function parseDate($value, $formato, DateTimeZone $tz) {
    if ($value === null || $value === '') {
        return null;
    }
    if (is_string($value) && strtolower(trim($value)) === 'today') {
        return new DateTime('today', $tz);
    }
    $dt = DateTime::createFromFormat($formato, (string)$value, $tz);
    if (!$dt) {
        return null;
    }
    $dt->setTime(0, 0, 0);
    return $dt;
}

// ---- Entrada ----
$op = strtolower((string)($data['op'] ?? 'diff'));
$formato = (string)($data['formato'] ?? 'd/m/Y');
$tz = new DateTimeZone('America/Bogota');

$pm4BaseUrl = getenv('HOST_URL') ?: null;
$pm4Token = getenv('API_TOKEN') ?: null;
$holidaySet = fetchHolidaySet($pm4BaseUrl, $pm4Token);

if ($op === 'add') {
    $base = parseDate($data['fecha'] ?? null, $formato, $tz);
    if (!$base) {
        return ["error" => "Fecha 'fecha' inválida o formato no coincide ({$formato})."];
    }
    $result = addBusinessDays($base, $data['dias'] ?? 0, $holidaySet);
    return [
        "fecha"     => $result->format('Y-m-d'),
        "fecha_fmt" => $result->format($formato),
    ];
}

// op = 'diff' (default)
$from = parseDate($data['fecha_inicio'] ?? null, $formato, $tz);
$to   = parseDate($data['fecha_fin'] ?? null, $formato, $tz);
if (!$from || !$to) {
    return ["error" => "Fechas 'fecha_inicio'/'fecha_fin' inválidas o formato no coincide ({$formato})."];
}

return [
    "dias" => countBusinessDaysBetween($from, $to, $holidaySet),
];
