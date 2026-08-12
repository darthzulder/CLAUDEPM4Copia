<?php
// =============================================================================
// COL_UTIL_Dias_Habiles — días hábiles de Colombia (utilidad general)
// =============================================================================
//
// Único lugar donde vive el cálculo de días hábiles: excluye fines de semana y
// los feriados de la colección cat-feriados-colombia. No contiene reglas de
// negocio de ningún proceso — cualquier script o pantalla puede invocarlo.
//
// ⚠️ HAY UN GEMELO EN EL FRONTEND: frontend/src/core/businessDays.ts replica esta
// misma regla del lado del cliente. Son dos implementaciones de un mismo cálculo;
// si cambiás la regla acá, hay que cambiarla allá o el SLA que ve el usuario
// dejará de coincidir con el que aplica el proceso.
//
// -----------------------------------------------------------------------------
// CONTRATO
// -----------------------------------------------------------------------------
// Entradas comunes en $data:
//   op        'diff' (default) | 'add'
//   formato   formato de fecha PHP, para entrada Y salida (default 'd/m/Y')
//
// op = 'diff' — días hábiles entre dos fechas, CON SIGNO
//   fecha_inicio   EXCLUSIVA (no se cuenta a sí misma). Acepta 'today'
//   fecha_fin      INCLUSIVA (sí se cuenta). Acepta 'today'
//   devuelve       { "dias": <int> }  — negativo si fecha_fin ya pasó
//
// op = 'add' — corre una fecha N días hábiles
//   fecha     fecha base, que no se cuenta. Acepta 'today'
//   dias      entero; negativo retrocede
//   devuelve  { "fecha": "<Y-m-d>", "fecha_fmt": "<en 'formato'>" }
//
// Ante una fecha inválida devuelve { "error": "<detalle>" } en vez de lanzar, para
// que el llamador decida cómo degradar (el script 77 lo usa para caer a 0 días).
//
// 'today' se resuelve SIEMPRE en America/Bogota, no en la zona del servidor: un
// caso radicado a las 20:00 en Colombia no debe contarse como del día siguiente.
//
// Corre dentro del ejecutor PHP de PM4: $data lo inyecta el runtime, y HOST_URL /
// API_TOKEN vienen de las variables de entorno de la instancia.
//
// PORTABILIDAD: la colección de feriados NO se referencia por su id numérico
// (cambia al migrar de instancia), sino por su UUID nativo, que el export/import
// de paquetes de PM4 preserva. El id real se resuelve en runtime contra
// GET /collections y se cachea en proceso (mismo criterio que resolveScriptId()
// del script 77 — acá es resolveCollectionId(), su equivalente para colecciones).
// El id 48 solo queda como FALLBACK si la resolución dinámica no encuentra nada
// (instancia sin red, colección renombrada Y con uuid distinto, etc.).

// UUID estable de la colección cat-feriados-colombia (no cambia entre instancias).
const FERIADOS_COLLECTION_UUID     = 'a2421287-eefe-4ff6-88a8-7f7040a2d10e';
// Nombre de respaldo por si el UUID no apareciera (p.ej. colección recreada a mano).
const FERIADOS_COLLECTION_NAME     = 'cat-feriados-colombia';
// Último recurso: id conocido en la instancia de referencia (PM4_BASE_URL actual).
const FERIADOS_COLLECTION_FALLBACK = 48;

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
            // 2º intento (fallback): match exacto por nombre si el UUID no apareció
            // (p.ej. el filtro de texto trajo resultados parciales/similares).
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
    error_log("[COL_UTIL_Dias_Habiles] resolveCollectionId: no se resolvió '{$name}' (uuid={$uuid}) dinámicamente; usando fallback id={$fallback}.");
    return $cache[$cacheKey] = (int)$fallback;
}

/**
 * Feriados de Colombia como set de fechas 'Y-m-d' listas para consultar.
 *
 * Devuelve un mapa (fecha => true) y no una lista porque isBusinessDay() se llama
 * una vez por día recorrido: con isset() la consulta es O(1) en vez de recorrer
 * el arreglo entero en cada iteración.
 *
 * DEGRADA SEGURO: ante falta de credenciales, error de red, timeout o respuesta
 * inesperada devuelve un set vacío en lugar de fallar. La consecuencia es que solo
 * se excluyen sábados y domingos — el SLA sale algo más corto de lo real, que es
 * preferible a que el proceso se caiga por un feriado no consultado.
 */
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
        // ⚠️ 'holyday_date' está así, mal escrito, en la colección de PM4. No es un
        // typo de este archivo: corregirlo acá deja de encontrar el campo y el set
        // sale vacío EN SILENCIO (sin error, solo un SLA mal calculado).
        $fecha = $record['data']['holyday_date'] ?? null;
        if ($fecha) {
            $holidaySet[$fecha] = true;
        }
    }

    return $holidaySet;
}

/**
 * ¿Es día laborable? Base de todo el cálculo: las otras funciones solo recorren
 * fechas y preguntan acá.
 */
function isBusinessDay(DateTime $date, array $holidaySet) {
    // 'N' es el día ISO-8601: 1=lunes … 6=sábado, 7=domingo. Se usa en vez de 'w'
    // (0=domingo) justamente porque deja el fin de semana como un rango contiguo.
    $weekday = (int)$date->format('N');
    if ($weekday >= 6) {
        return false;
    }
    return !isset($holidaySet[$date->format('Y-m-d')]);
}

/**
 * Corre $start en $days días hábiles y devuelve la fecha resultante.
 *
 * $start NO cuenta: sumar 1 día hábil a un viernes da el lunes siguiente. $days
 * negativo retrocede; 0 devuelve la misma fecha sin tocarla.
 *
 * Avanza día por día en vez de estimar semanas porque los feriados no siguen
 * ningún patrón: solo se puede saber cuántos hay consultándolos uno a uno.
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
        // Solo los días hábiles descuentan del objetivo; los demás se saltan.
        if (isBusinessDay($result, $holidaySet)) {
            $added++;
        }
    }
    return $result;
}

/**
 * Días hábiles entre $from (exclusivo) y $to (inclusivo), con signo: positivo si
 * $to está en el futuro respecto de $from, negativo si ya pasó.
 *
 * El signo es lo que permite al llamador distinguir "faltan 3 días" de "venció
 * hace 3" con un solo número. Para lograrlo se ordenan las fechas y se cuenta
 * siempre hacia adelante, guardando aparte si hubo que invertirlas: así el
 * recorrido es uno solo y no se duplica la lógica para cada dirección.
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
    // Se avanza ANTES de contar: por eso $start queda excluido y $end incluido.
    while ($cursor < $end) {
        $cursor->modify('+1 day');
        if (isBusinessDay($cursor, $holidaySet)) {
            $count++;
        }
    }

    return $sign * $count;
}

/**
 * Convierte un valor de entrada en DateTime, o null si no es una fecha válida.
 *
 * Acepta la palabra 'today' (hoy en Bogotá) además del $formato declarado. La hora
 * se fuerza a medianoche para que dos fechas del mismo día siempre comparen igual:
 * sin eso, un 'today' con hora actual contra una fecha parseada a las 00:00 daría
 * una diferencia espuria en las comparaciones de countBusinessDaysBetween().
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

// =============================================================================
// Punto de entrada — despacha según $data['op']
// =============================================================================

$op = strtolower((string)($data['op'] ?? 'diff'));
$formato = (string)($data['formato'] ?? 'd/m/Y');
$tz = new DateTimeZone('America/Bogota');

// Los feriados se traen UNA vez y se pasan a las funciones: son la misma lista para
// todo el cálculo, y hacerlo acá evita repetir la llamada HTTP por cada día.
$pm4BaseUrl = getenv('HOST_URL') ?: null;
$pm4Token = getenv('API_TOKEN') ?: null;
$holidaySet = fetchHolidaySet($pm4BaseUrl, $pm4Token);

// op = 'add' — correr una fecha N días hábiles.
if ($op === 'add') {
    $base = parseDate($data['fecha'] ?? null, $formato, $tz);
    if (!$base) {
        return ["error" => "Fecha 'fecha' inválida o formato no coincide ({$formato})."];
    }
    $result = addBusinessDays($base, $data['dias'] ?? 0, $holidaySet);
    // Se devuelven los dos formatos: 'fecha' en ISO para comparar o guardar, y
    // 'fecha_fmt' en el formato pedido para mostrar o reenviar a otro script.
    return [
        "fecha"     => $result->format('Y-m-d'),
        "fecha_fmt" => $result->format($formato),
    ];
}

// op = 'diff' — es el default: cualquier op no reconocida cae acá.
$from = parseDate($data['fecha_inicio'] ?? null, $formato, $tz);
$to   = parseDate($data['fecha_fin'] ?? null, $formato, $tz);
if (!$from || !$to) {
    return ["error" => "Fechas 'fecha_inicio'/'fecha_fin' inválidas o formato no coincide ({$formato})."];
}

return [
    "dias" => countBusinessDaysBetween($from, $to, $holidaySet),
];
