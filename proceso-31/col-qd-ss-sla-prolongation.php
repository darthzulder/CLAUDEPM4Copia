<?php
/**
 * =============================================================================
 * SFC Smart Supervisión — PRÓRROGA (SP4)
 * ProcessMaker 4 (Script Task, ejecutor PHP).
 * =============================================================================
 *
 * Este script DECIDE y EJECUTA únicamente la solicitud de PRÓRROGA de la queja
 * (PUT /api/queja/{codigo}/). El CIERRE de la queja vive en OTRO script; aquí
 * NO hay lógica de cierre.
 *
 * Es el primer paso del BPM para la prórroga; después el proceso ejecuta el
 * script 71 (COL_QD_Asignar_SLA), que aplica el SLA resultante y recalcula la
 * fecha de vencimiento.
 *
 * -----------------------------------------------------------------------------
 * CONSUMO DE LA SFC — SIEMPRE VÍA CORE
 * -----------------------------------------------------------------------------
 * Este script NO abre cURL contra la Superfinanciera. TODA llamada a la SFC
 * (incluido el PUT de prórroga) se delega al CORE con operacion="request", que
 * hace login + firma + HTTP y registra la respuesta en su bitácora
 * _sfc_respons_logs. Ese log se propaga aquí y se devuelve en la salida, de modo
 * que PM4 lo funde en $data para trazabilidad.
 *
 * La config pública (fraud_macros, URLs) se lee del CORE con operacion="config",
 * que NO toca la red: así el ÚNICO login de la prórroga es el que hace el propio
 * CORE al ejecutar el PUT (operacion="request").
 *
 * PORTABILIDAD: el CORE NO se referencia por su id numérico (cambia al migrar de
 * instancia), sino por su UUID, que el export/import de paquetes de PM4
 * preserva. El id real se resuelve en runtime (ver resolveScriptId() más abajo,
 * idéntica a la del script 77 COL_QD_Check_SLA_Expire) y se cachea en proceso.
 *
 * -----------------------------------------------------------------------------
 * BITÁCORA ACUMULATIVA (_sfc_respons_logs) — EL CORE ES LA FUENTE ÚNICA
 * -----------------------------------------------------------------------------
 * El CORE es acumulativo: precarga el _sfc_respons_logs que le llega en
 * $data y le AGREGA las respuestas de su propia ejecución. Para aprovecharlo sin
 * duplicar, este script REENVÍA su acumulador al CORE en cada llamada
 * (sfcCallScript) y, cuando el CORE responde, ADOPTA la bitácora devuelta tal
 * cual (previo + nuevo) en lugar de concatenar de este lado. Así las llamadas al
 * CORE de una misma ejecución (config, request PUT) encadenan la misma bitácora,
 * y si el caso le pasa a este script un _sfc_respons_logs previo, se conserva y
 * crece. El dispatcher siembra el punto de partida desde $data['_sfc_respons_logs'].
 *
 * -----------------------------------------------------------------------------
 * REGLAS DE NEGOCIO DE LA PRÓRROGA
 * -----------------------------------------------------------------------------
 * El SLA de una queja escala de 15 en 15 días hábiles por cada prórroga
 * (15, 30, 45 ... 180 = 12 prórrogas máximo). qd_strExtensionDays es el
 * contador persistente que viaja entre pasos del BPM: su valor ENTRANTE indica
 * en qué número de prórroga está el caso (1 = 1ra prórroga, 2 = 2da, ...).
 *
 * IMPORTANTE — este script SÍ INCREMENTA qd_strExtensionDays en los caminos de
 * ÉXITO: devuelve (entrante + 1), dejando el contador listo para la siguiente
 * prórroga. En los caminos de RECHAZO/FALLO (tope alcanzado, error SFC o
 * excepción) NO incrementa: devuelve el MISMO valor entrante, porque no hubo
 * prórroga efectiva. El script 71 calcula el SLA de ESTA prórroga como
 * 15 * (qd_strExtensionDays - 1) usando el valor YA incrementado, de modo que
 * el SLA aplicado equivale a 15 * (valor entrante).
 *
 *   - qd_strExtensionDays entrante = 1  -> 1ra prórroga: ajuste LOCAL, sin
 *     notificar a la SFC. Devuelve qd_strExtensionDays = '2' y
 *     qd_strM3FailedStep = ''.
 *   - qd_strExtensionDays entrante entre 2 y 12 -> se NOTIFICA a la SFC (PUT
 *     /api/queja/{codigo}/). Si la SFC responde 2xx, devuelve
 *     qd_strM3FailedStep = '' y qd_strExtensionDays = (entrante + 1); si falla,
 *     reporta error técnico (SCR-004) y devuelve el contador SIN cambio.
 *   - qd_strExtensionDays entrante > 12 (13+) -> máximo alcanzado: se RECHAZA
 *     localmente, sin llamar a la SFC, y el contador se devuelve SIN cambio. Se
 *     señaliza con clasificación PRORROGA_MAXIMA.
 *
 * IMPORTANTE — VALOR DE prorroga_queja QUE VE LA SFC:
 * La 1ra prórroga (entrante = 1) es LOCAL: la SFC no se entera de ella. Por eso
 * la primera prórroga que la SFC realmente recibe es la 2da (entrante = 2), y
 * para la SFC esa es su prórroga número 1. El campo prorroga_queja del body por
 * tanto se envía como (valor ENTRANTE - 1): entrante 2 -> prorroga_queja 1,
 * entrante 3 -> prorroga_queja 2, ..., entrante 12 -> prorroga_queja 11. Este
 * cálculo usa el valor ENTRANTE (antes de incrementar), leído directo de $data,
 * así que el incremento del contador de salida no lo afecta. Como
 * buildBodyProrroga solo se invoca con entrante >= 2, (entrante-1) siempre es
 * >= 1.
 *
 * -----------------------------------------------------------------------------
 * CONTRATO CON EL SCRIPT 71
 * -----------------------------------------------------------------------------
 *   qd_strExtensionDays  contador (entrante+1 en éxito; entrante sin cambio en fallo/tope)
 *   qd_strM3FailedStep   '' = éxito | 'PRORROGA' = fallo SFC | 'PRORROGA_MAXIMA' = tope
 *
 * El script 71 calcula el SLA nuevo como 15 * (qd_strExtensionDays - 1) cuando
 * qd_strM3FailedStep === '' (el contador ya viene incrementado por 78); si no,
 * conserva el SLA existente del caso. Este script NO calcula fechas ni SLA: esa
 * responsabilidad es del 71.
 *
 * -----------------------------------------------------------------------------
 * ENTRADAS CLAVE
 * -----------------------------------------------------------------------------
 *   qd_strSfcCode        codigo_queja ya calculado (no se reconstruye aquí).
 *   qd_strExtensionDays  contador de prórroga (ver arriba).
 *
 * El código de respuesta HTTP de la prórroga se refleja en qd_SSHTTPSP4 /
 * qd_SSHTTPSP4_message (qd_SSHTTPSP3 es del flujo de CIERRE, que está en otro
 * script).
 *
 * -----------------------------------------------------------------------------
 * PAYLOAD CORREGIDO EN SCR-004
 * -----------------------------------------------------------------------------
 * Si el analista marcó "¿Requiere ajuste en payload? = SI" en SCR-004 y editó
 * el JSON de qd_strPayloadSent, ese JSON se envía tal cual (ver
 * sfcPayloadCorregido): manda sobre la reconstrucción desde los campos del caso.
 * Si el flag está en NO o el JSON no es válido, el body se reconstruye con
 * buildBodyProrroga para que un error de tipeo no bloquee el reenvío. El
 * codigo_queja del path siempre se toma del body, así path y cuerpo coinciden.
 *
 * -----------------------------------------------------------------------------
 * SALIDA DE ERROR -> pantalla SCR-004 (Revisión Error Técnico API)
 * -----------------------------------------------------------------------------
 *   qd_strHttpCode        FLD-050  código HTTP de la última respuesta real
 *   qd_strErrorType       FLD-051  código de clasificación (ver sfcClasificarError)
 *   qd_strEndpointCalled  FLD-053  "METODO url" de la llamada que falló
 *   qd_strApiTechMessage  FLD-052  mensaje de la API
 *   qd_strCompleteLogAPI  (nuevo)  log técnico completo (modal "Ver Log Completo")
 *   qd_strPayloadSent     FLD-054  payload realmente enviado, JSON legible
 *   qd_strAttemptNum      FLD-055  intento acumulado (previo + 1)
 */

// UUID estable del script CORE (COL - QD - Core SFC) — no cambia entre instancias.
const CORE_SCRIPT_UUID     = 'a2560610-9409-4931-bcc7-172aa91f56a9';
// Título de respaldo por si el UUID no estuviera (p.ej. CORE recreado a mano).
const CORE_SCRIPT_TITLE    = 'COL - QD - Core SFC';
// Último recurso: id conocido en la instancia de referencia (PM4_BASE_URL actual).
const CORE_SCRIPT_FALLBACK = 84;

/**
 * Resuelve el ID actual de un script por su UUID (estable entre instancias),
 * con fallback al título. Cachea el resultado en proceso para no repetir la
 * búsqueda si se invoca al mismo script varias veces en esta ejecución.
 * Idéntica a resolveScriptId() del script 77 (COL_QD_Check_SLA_Expire) — misma
 * firma y misma estrategia, para que ambas convivan sin sorpresas si algún día
 * se comparten en un include común.
 */
function resolveScriptId($api, $uuid, $title) {
    static $cache = [];
    $cacheKey = $uuid ?: $title;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    $scripts = $api->scripts();

    // Acotamos la búsqueda por título (filtro liviano) y confirmamos por UUID.
    // Si el título cambió tras migrar, caemos a un listado más amplio.
    $tryLists = [];
    $tryLists[] = $scripts->getScripts($title);   // filter = título
    $tryLists[] = $scripts->getScripts($uuid);    // por si el filtro indexa uuid

    foreach ($tryLists as $resp) {
        $list = ($resp && method_exists($resp, 'getData')) ? $resp->getData() : [];
        // 1º intento: match EXACTO por UUID (fuente de verdad).
        foreach (($list ?: []) as $s) {
            $sUuid = method_exists($s, 'getUuid') ? $s->getUuid() : ($s['uuid'] ?? null);
            if ($uuid && $sUuid === $uuid) {
                return $cache[$cacheKey] = (int)(method_exists($s, 'getId') ? $s->getId() : $s['id']);
            }
        }
    }
    // 2º intento (fallback): match exacto por título si el UUID no apareció.
    $resp = $scripts->getScripts($title);
    $list = ($resp && method_exists($resp, 'getData')) ? $resp->getData() : [];
    foreach (($list ?: []) as $s) {
        $sTitle = method_exists($s, 'getTitle') ? $s->getTitle() : ($s['title'] ?? null);
        if ($sTitle === $title) {
            return $cache[$cacheKey] = (int)(method_exists($s, 'getId') ? $s->getId() : $s['id']);
        }
    }

    return null; // no se encontró
}

// Resolución dinámica del CORE: id numérico solo como último recurso.
$SFC_CORE_SCRIPT_ID = resolveScriptId($api, CORE_SCRIPT_UUID, CORE_SCRIPT_TITLE) ?? CORE_SCRIPT_FALLBACK;

// Máximo valor permitido para qd_strExtensionDays (12 prórrogas).
const PRORROGA_MAX_EXTENSION_DAYS = 12;

// -----------------------------------------------------------------------------
// LOG DE RESPUESTAS SFC
// -----------------------------------------------------------------------------
// Bitácora propagada DESDE el CORE. El CORE es quien realmente habla con la SFC
// y arma _sfc_respons_logs; aquí lo acumulamos para devolverlo en la salida (y
// que quede disponible incluso si luego se lanza una excepción).
$_sfc_respons_logs = [];

// =============================================================================
// Cliente del CORE (config + login + request)
// =============================================================================

function sfcCallScript(int $intScriptId, array $dicPayload)
{
    global $api, $_sfc_respons_logs;

    // Reenviamos la bitácora acumulada AL CORE: es acumulativo (precarga
    // lo que recibe y le agrega lo nuevo), así que le pasamos lo que llevamos
    // para que la salida vuelva con previo + nuevo. NO la concatenamos de este
    // lado (eso duplicaría): al recibir, REEMPLAZAMOS el acumulador con lo que
    // el CORE devuelva. Respetamos un _sfc_respons_logs ya puesto en el payload.
    if (!array_key_exists('_sfc_respons_logs', $dicPayload)) {
        $dicPayload['_sfc_respons_logs'] = $_sfc_respons_logs;
    }

    $objResponse = $api->scripts()->executeScript($intScriptId, [
        'data'   => json_encode($dicPayload),
        'config' => "{}",
        'sync'   => true,
    ]);
    // getOutput() devuelve la salida del CORE como objeto; la pasamos a arreglo asociativo
    $dicOut = json_decode(json_encode($objResponse->getOutput()), true);

    // El CORE devuelve la bitácora ya acumulada (lo que le reenviamos + lo de
    // esta llamada). La ADOPTAMOS tal cual como nuevo acumulador — no hacemos
    // foreach/append, para no duplicar las entradas que ya le habíamos mandado.
    if (is_array($dicOut) && isset($dicOut['_sfc_respons_logs']) && is_array($dicOut['_sfc_respons_logs'])) {
        $_sfc_respons_logs = $dicOut['_sfc_respons_logs'];
    }

    // Si el CORE devolvió un error, lo lanzamos para verlo
    if (is_array($dicOut) && !empty($dicOut['error'])) {
        throw new RuntimeException("CORE {$intScriptId}: " . ($dicOut['message'] ?? 'error desconocido'));
    }
    return $dicOut;
}

/**
 * Config pública del CORE (fraud_macros, URLs, entidad). NO toca la red — así
 * armamos el body de la prórroga sin gastar un login extra; el login real lo
 * hace el propio CORE al ejecutar el PUT (operacion="request").
 */
function sfcCoreConfig(): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicRes = sfcCallScript($SFC_CORE_SCRIPT_ID, ['operacion' => 'config']);
    if (!is_array($dicRes) || !isset($dicRes['config']) || !is_array($dicRes['config'])) {
        throw new RuntimeException('CORE config sin config. Respuesta del core: ' . json_encode($dicRes));
    }
    return $dicRes['config'];
}

function sfcCoreLogin(): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicRes = sfcCallScript($SFC_CORE_SCRIPT_ID, ['operacion' => 'login']);
    // Si el core no devolvio access, propagamos su respuesta real
    if (!is_array($dicRes) || !array_key_exists('access', $dicRes)) {
        throw new RuntimeException('CORE login sin access. Respuesta del core: ' . json_encode($dicRes));
    }
    return $dicRes;
}

/**
 * Delega al CORE una llamada HTTP a la SFC (login + firma + HTTP los hace el
 * CORE). Devuelve la salida del CORE para operacion="request".
 */
function sfcCoreRequest(string $strMetodo, string $strUrlKey, string $strPathSuffix, array $dicBody): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicRes = sfcCallScript($SFC_CORE_SCRIPT_ID, [
        'operacion'   => 'request',
        'metodo'      => $strMetodo,
        'url_key'     => $strUrlKey,
        'path_suffix' => $strPathSuffix,
        'contenido'   => json_encode($dicBody),
    ]);
    if (!is_array($dicRes) || !array_key_exists('http_code', $dicRes)) {
        throw new RuntimeException('CORE request sin http_code. Respuesta del core: ' . json_encode($dicRes));
    }
    return $dicRes;
}

// =============================================================================
// Helpers locales (transformación de campos del caso)
// =============================================================================

function sfcVal(array $data, string $strKey)
{
    return array_key_exists($strKey, $data) ? $data[$strKey] : null;
}

function sfcToInt($genVal)
{
    if ($genVal === null || $genVal === '') {
        return null;
    }
    return (int) $genVal;
}

function sfcToNumber($genVal)
{
    if ($genVal === null || $genVal === '') {
        return null;
    }
    return is_numeric($genVal) ? ($genVal + 0) : $genVal;
}

/** Código de catálogo como entero (rechaza string en campos de clave primaria). */
function sfcCode($genVal)
{
    return sfcToInt($genVal);
}

function sfcToBoolSI($genVal): bool
{
    if (is_string($genVal)) {
        return strtoupper(trim($genVal)) === 'SI';
    }
    return (bool) $genVal;
}

/** Fecha/hora actual en zona horaria de Colombia, formato ISO Y-m-d\TH:i:s. */
function sfcAhoraColombia(): string
{
    $objAhora = new DateTime('now', new DateTimeZone('America/Bogota'));
    return $objAhora->format('Y-m-d\TH:i:s');
}

/** Extrae un mensaje humano de la respuesta de la API (json {message:...} o texto plano). */
function sfcMensajeRespuesta($genResponse): ?string
{
    if (is_array($genResponse)) {
        $genMsg = $genResponse['message'] ?? $genResponse['detail'] ?? $genResponse['error'] ?? null;
        if ($genMsg !== null) {
            return is_string($genMsg) ? $genMsg : json_encode($genMsg);
        }
        return json_encode($genResponse);
    }
    if (is_string($genResponse) && trim($genResponse) !== '') {
        return $genResponse;
    }
    return null;
}

// =============================================================================
// Diagnóstico de error técnico (alimenta la pantalla SCR-004)
// =============================================================================

/**
 * Contexto de la ÚLTIMA llamada intentada. Se va sobreescribiendo paso a paso
 * (core -> prórroga) para que, si algo falla, sepamos exactamente qué se invocó,
 * con qué payload y qué contestó la SFC — incluso si el fallo fue una excepción
 * lanzada desde el CORE antes de tocar la red.
 */
$GLOBALS['SFC_DIAG'] = [
    'paso'           => 'core',       // core | prorroga | prorroga_maxima
    'endpoint'       => null,         // "METODO url"
    'payload'        => null,         // string JSON o arreglo
    'payload_origen' => null,         // de dónde salió el payload de la prórroga
    'http_code'      => null,         // int|null (null = no hubo respuesta HTTP)
    'curl_error'     => null,         // error de transporte, si lo hubo
    'raw'            => null,         // cuerpo crudo de la respuesta
];

function sfcDiag(array $dicPatch): void
{
    $GLOBALS['SFC_DIAG'] = array_merge($GLOBALS['SFC_DIAG'], $dicPatch);
}

/** Recorta textos largos para no inflar la data del caso en PM4. */
function sfcTruncar($genTexto, int $intMax = 8000): string
{
    $strTexto = is_string($genTexto) ? $genTexto : json_encode($genTexto);
    if (!is_string($strTexto) || $strTexto === '') {
        return '';
    }
    if (strlen($strTexto) <= $intMax) {
        return $strTexto;
    }
    $strCorte = function_exists('mb_substr') ? mb_substr($strTexto, 0, $intMax, 'UTF-8') : substr($strTexto, 0, $intMax);
    return $strCorte . "\n… [truncado — " . strlen($strTexto) . ' bytes en total]';
}

/**
 * Payload en JSON indentado para que el analista pueda leerlo/editarlo en el
 * textarea de SCR-004. No es el byte-exacto que se firmó (la firma se
 * recalcula en el reenvío), solo la representación legible.
 */
function sfcPayloadLegible($genPayload): string
{
    if ($genPayload === null || $genPayload === '') {
        return '';
    }
    $genDic = is_array($genPayload) ? $genPayload : json_decode((string) $genPayload, true);
    if (is_array($genDic)) {
        return (string) json_encode($genDic, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    return (string) $genPayload;
}

/**
 * Clasifica el fallo en un código estable (qd_strErrorType) + su descripción.
 * El código es corto a propósito: cabe en el input de una línea de SCR-004 y
 * sirve para comparar en una compuerta del BPM.
 */
function sfcClasificarError(array $dicDiag, ?string $strExcMessage): array
{
    // Rechazo por máximo de prórrogas: no hubo llamada de red, es una regla local.
    if (($dicDiag['paso'] ?? '') === 'prorroga_maxima') {
        return [
            'codigo'  => 'PRORROGA_MAXIMA',
            'detalle' => 'Se alcanzó el máximo de ' . PRORROGA_MAX_EXTENSION_DAYS . ' prórrogas permitidas para esta queja.',
        ];
    }

    $intCode  = $dicDiag['http_code'] !== null ? (int) $dicDiag['http_code'] : null;
    $strCurl  = (string) ($dicDiag['curl_error'] ?? '');

    if ($strCurl !== '') {
        $blnTimeout = stripos($strCurl, 'timed out') !== false || stripos($strCurl, 'timeout') !== false;
        return $blnTimeout
            ? ['codigo' => 'TIMEOUT', 'detalle' => 'La API no respondió dentro del tiempo de espera: ' . $strCurl]
            : ['codigo' => 'RED', 'detalle' => 'Fallo de transporte/conexión con la API: ' . $strCurl];
    }

    if ($intCode === null || $intCode === 0) {
        return [
            'codigo'  => 'CORE_PM4',
            'detalle' => 'No hubo respuesta HTTP de la SFC; el flujo se detuvo antes (login o firma vía CORE). '
                . ($strExcMessage !== null && $strExcMessage !== '' ? $strExcMessage : 'Sin mensaje de excepción.'),
        ];
    }

    if ($intCode >= 200 && $intCode < 300) {
        // La llamada registrada respondió bien: el fallo ocurrió después.
        return [
            'codigo'  => 'CORE_PM4',
            'detalle' => 'La última llamada registrada respondió HTTP ' . $intCode
                . ', el fallo se produjo en un paso posterior del CORE. '
                . ($strExcMessage !== null && $strExcMessage !== '' ? $strExcMessage : ''),
        ];
    }

    if ($intCode === 401) {
        return ['codigo' => 'AUTENTICACION', 'detalle' => 'HTTP 401 — credenciales ausentes o rechazadas. Renovar el token antes de reenviar.'];
    }
    if ($intCode === 403) {
        return ['codigo' => 'PERMISOS', 'detalle' => 'HTTP 403 — el usuario de integración no tiene permiso sobre el recurso.'];
    }
    if ($intCode === 404) {
        return ['codigo' => 'NO_ENCONTRADO', 'detalle' => 'HTTP 404 — la SFC no encontró la queja con ese codigo_queja.'];
    }
    if ($intCode === 429) {
        return ['codigo' => 'LIMITE_TASA', 'detalle' => 'HTTP 429 — se excedió el límite de peticiones; reintentar más tarde.'];
    }
    if ($intCode === 400 || $intCode === 422) {
        return ['codigo' => 'ESTRUCTURA_PAYLOAD', 'detalle' => 'HTTP ' . $intCode . ' — la SFC rechazó la estructura o los valores del payload.'];
    }
    if ($intCode >= 500) {
        return ['codigo' => 'SERVIDOR', 'detalle' => 'HTTP ' . $intCode . ' — error interno de la API (incluye JSON que no coincide con la definición del servicio).'];
    }
    if ($intCode >= 400) {
        return ['codigo' => 'ESTRUCTURA_PAYLOAD', 'detalle' => 'HTTP ' . $intCode . ' — petición rechazada por la SFC.'];
    }

    return ['codigo' => 'DESCONOCIDO', 'detalle' => 'HTTP ' . $intCode . ' — respuesta no clasificada.'];
}

/**
 * Log técnico completo (qd_strCompleteLogAPI). Es lo que SCR-004 abre con
 * "Ver Log Completo"; el textarea "Mensaje Técnico de la API" solo lleva el
 * mensaje corto de la API.
 */
function sfcLogCompleto(array $dicDiag, array $dicTipo, ?string $strExcMessage): string
{
    $lstLineas = [
        'Paso: ' . ($dicDiag['paso'] ?? 'core'),
        'Endpoint: ' . ($dicDiag['endpoint'] !== null ? $dicDiag['endpoint'] : '(no se alcanzó a invocar)'),
        'HTTP: ' . ($dicDiag['http_code'] !== null ? (string) $dicDiag['http_code'] : '(sin respuesta HTTP)'),
        'Tipo: ' . $dicTipo['codigo'] . ' — ' . $dicTipo['detalle'],
    ];
    if (!empty($dicDiag['payload_origen'])) {
        $lstLineas[] = 'Origen del payload: ' . $dicDiag['payload_origen'];
    }
    if (!empty($dicDiag['curl_error'])) {
        $lstLineas[] = 'cURL: ' . $dicDiag['curl_error'];
    }
    if ($strExcMessage !== null && $strExcMessage !== '') {
        $lstLineas[] = 'Excepción PM4: ' . $strExcMessage;
    }
    $lstLineas[] = '';
    $lstLineas[] = 'Respuesta de la API:';
    $strRaw = sfcTruncar($dicDiag['raw'] ?? '');
    $lstLineas[] = $strRaw !== '' ? $strRaw : '(vacía)';

    return implode("\n", $lstLineas);
}

/** Intento acumulado siguiente (FLD-055). Arranca en 1 si el caso no traía contador. */
function sfcIntentoSiguiente(array $data): int
{
    $intPrev = sfcToInt(sfcVal($data, 'qd_strAttemptNum'));
    if ($intPrev === null) {
        $intPrev = sfcToInt(sfcVal($data, 'qd_strM3ClosureAttempts'));
    }
    return ($intPrev === null ? 0 : $intPrev) + 1;
}

/**
 * Los campos de la sección "Detalle del Error Técnico" de SCR-004.
 * Se arman desde el contexto de diagnóstico, así que sirven igual para un
 * fallo HTTP como para una excepción del CORE.
 *
 * $strApiMessage es el mensaje que la API (o la excepción) devolvió: se guarda
 * tal cual en qd_strApiTechMessage para que coincida con qd_SSHTTPSP4_message.
 */
function sfcCamposErrorTecnico(array $data, ?string $strApiMessage = null, ?string $strExcMessage = null): array
{
    $dicDiag = $GLOBALS['SFC_DIAG'];
    $dicTipo = sfcClasificarError($dicDiag, $strExcMessage);

    return [
        'qd_strHttpCode'       => $dicDiag['http_code'] !== null ? (string) $dicDiag['http_code'] : '',
        'qd_strErrorType'      => $dicTipo['codigo'],
        'qd_strEndpointCalled' => (string) ($dicDiag['endpoint'] ?? ''),
        // Mismo valor que qd_SSHTTPSP4_message (mensaje corto de la API).
        'qd_strApiTechMessage' => (string) ($strApiMessage !== null ? $strApiMessage : ''),
        // Log completo — lo consume el modal "Ver Log Completo" de SCR-004.
        'qd_strCompleteLogAPI' => sfcLogCompleto($dicDiag, $dicTipo, $strExcMessage),
        'qd_strPayloadSent'    => sfcPayloadLegible($dicDiag['payload'] ?? null),
        'qd_strAttemptNum'     => (string) sfcIntentoSiguiente($data),
    ];
}

// =============================================================================
// Builders
// =============================================================================

/**
 * Payload corregido a mano en SCR-004, si aplica.
 * Solo manda cuando el analista marcó "¿Requiere ajuste en payload? = SI" Y el
 * textarea trae un objeto JSON válido. Cualquier otra cosa (flag en NO, texto
 * vacío, JSON roto) devuelve null y el body se reconstruye desde los campos del
 * caso, para que un error de tipeo no bloquee el reenvío.
 */
function sfcPayloadCorregido(array $data): ?array
{
    if (!sfcToBoolSI(sfcVal($data, 'qd_strPayloadAdjustNeeded'))) {
        return null;
    }
    $genRaw = sfcVal($data, 'qd_strPayloadSent');
    if (!is_string($genRaw) || trim($genRaw) === '') {
        return null;
    }
    $genDic = json_decode($genRaw, true);
    if (!is_array($genDic) || $genDic === []) {
        return null;
    }
    // Un JSON tipo lista no es un body de prórroga.
    $blnAsociativo = false;
    foreach (array_keys($genDic) as $genKey) {
        if (is_string($genKey)) {
            $blnAsociativo = true;
            break;
        }
    }
    if (!$blnAsociativo) {
        return null;
    }
    return $genDic;
}

/**
 * Body de la PRÓRROGA — 23 campos base + 4 de fraude si aplica.
 *
 * Diferencias respecto al cierre (que está en otro script):
 *   - codigo_queja llega ya calculado en qd_strSfcCode.
 *   - fecha_actualizacion = fecha/hora actual en zona horaria de Colombia.
 *   - NO se envía fecha_cierre (no aplica a una prórroga).
 *
 * prorroga_queja = número de prórroga QUE VE LA SFC. Como la 1ra prórroga es
 * local (no se notifica a la SFC), la primera que la SFC recibe es la 2da, y
 * para ella es su prórroga 1. Por eso se envía (valor ENTRANTE - 1), leído
 * directo de qd_strExtensionDays en $data (antes de cualquier incremento de
 * salida). Este builder solo se invoca con entrante >= 2, así que
 * (entrante-1) siempre es >= 1.
 */
function buildBodyProrroga(array $data, array $dicCfg): array
{
    $genMacro = sfcVal($data, 'qd_strSfcReason');

    // Número de prórroga desde la óptica de la SFC: el contador ENTRANTE menos 1
    // (la 1ra prórroga fue local y la SFC nunca la vio). Se usa el valor de $data,
    // que es el entrante; el incremento del contador de salida ocurre en opProrroga.
    $intExtensionDays = sfcToInt(sfcVal($data, 'qd_strExtensionDays'));
    $intProrrogaSfc   = ($intExtensionDays !== null ? $intExtensionDays : 1) - 1;

    // La SFC valida estos campos como códigos de catálogo (entero). Si alguna
    // qd_* llega como "SI"/"NO" hay que mapearla a su código numérico antes.
    $dicBody = [
        'codigo_queja'            => (string) sfcVal($data, 'qd_strSfcCode'),
        'sexo'                    => sfcCode(sfcVal($data, 'qd_strSex')),
        'lgbtiq'                  => sfcCode(sfcVal($data, 'qd_strLgbtiq')),
        'condicion_especial'      => sfcCode(sfcVal($data, 'qd_strSpecialCondition')),
        'canal_cod'               => sfcCode(sfcVal($data, 'qd_strChannel')),
        'producto_cod'            => sfcCode(sfcVal($data, 'qd_strSfcProduct')),
        'macro_motivo_cod'        => sfcCode($genMacro),
        'estado_cod'              => sfcCode(sfcVal($data, 'qd_strComplaintStatus')),
        'fecha_actualizacion'     => sfcAhoraColombia(),
        'producto_digital'        => sfcCode(sfcVal($data, 'qd_strDigitalProduct')),
        'a_favor_de'              => sfcCode(sfcVal($data, 'qd_strFavorability')),
        'aceptacion_queja'        => sfcCode(sfcVal($data, 'qd_strAcceptance')),
        'rectificacion_queja'     => sfcCode(sfcVal($data, 'qd_strRectification')),
        'desistimiento_queja'     => sfcCode(sfcVal($data, 'qd_strWithdrawal')),
        // Número de prórroga desde la óptica de la SFC (entrante - 1).
        'prorroga_queja'          => $intProrrogaSfc,
        'admision'                => sfcCode(sfcVal($data, 'qd_strAdmission')),
        'documentacion_rta_final' => sfcToBoolSI(sfcVal($data, 'qd_strIncludesReplyAttach')),
        'anexo_queja'             => sfcToBoolSI(sfcVal($data, 'qd_strFinalReplyAttach')),
        'tutela'                  => sfcCode(sfcVal($data, 'qd_strTutela')),
        'ente_control'            => sfcCode(sfcVal($data, 'qd_strControlEntity')),
        'marcacion'               => sfcCode(sfcVal($data, 'qd_strMarking')),
        'queja_expres'            => sfcCode(sfcVal($data, 'qd_strExpressComplaint')),
    ];

    // Campos de fraude: solo si el macro-motivo lo exige, y SIEMPRE al final
    if (in_array((string) $genMacro, $dicCfg['fraud_macros'], true)) {
        $dicBody['tipo_fraude']      = sfcToInt(sfcVal($data, 'qd_strFraudType'));
        $dicBody['modalidad_fraude'] = sfcToInt(sfcVal($data, 'qd_strFraudModality'));
        $dicBody['monto_reclamado']  = sfcToNumber(sfcVal($data, 'qd_strClaimedAmount'));
        $dicBody['monto_reconocido'] = sfcToNumber(sfcVal($data, 'qd_strAcknowledgedAmount'));
    }

    return $dicBody;
}

// =============================================================================
// Notificación a la SFC (prórroga) — DELEGADA AL CORE
// =============================================================================

/**
 * Notifica la prórroga a la SFC — PUT /api/queja/{codigo}/.
 * El login, la firma y el PUT los ejecuta el CORE (operacion="request"): este
 * script solo arma el body y decide el codigo_queja del path. Así todo el
 * tráfico SFC y su bitácora _sfc_respons_logs quedan centralizados en el CORE.
 */
function sfcNotificarProrroga(array $data): array
{
    sfcDiag([
        'paso'           => 'prorroga',
        'endpoint'       => null,
        'payload'        => null,
        'payload_origen' => null,
        'http_code'      => null,
        'curl_error'     => null,
        'raw'            => null,
    ]);

    // Config pública del CORE (fraud_macros, url QUEJA) para armar el body.
    // Se lee con operacion="config", que NO toca la red: el único login de esta
    // prórroga es el que hace el propio CORE al ejecutar el PUT (request).
    $dicCfg = sfcCoreConfig();

    // El payload editado en SCR-004 manda sobre la reconstrucción desde los campos.
    $dicCorregido = sfcPayloadCorregido($data);
    $blnCorregido = $dicCorregido !== null;
    $dicBody      = $blnCorregido ? $dicCorregido : buildBodyProrroga($data, $dicCfg);
    $strOrigen    = $blnCorregido
        ? 'pantalla SCR-004 (payload corregido por el analista)'
        : 'campos del caso (reconstruido por buildBodyProrroga)';

    // codigo_queja va en el path y también dentro del body: se toma del body
    // para que ambos coincidan. Si el payload corregido no lo trae, se toma de
    // qd_strSfcCode y se inserta primero.
    if (!isset($dicBody['codigo_queja']) || (string) $dicBody['codigo_queja'] === '') {
        $dicBody = array_merge(['codigo_queja' => (string) sfcVal($data, 'qd_strSfcCode')], $dicBody);
    }
    $strCodigo = (string) $dicBody['codigo_queja'];

    // Delegamos el PUT al CORE: login + firma + HTTP + log ocurren allí.
    $strPathSuffix = rawurlencode($strCodigo) . '/';
    $dicRes        = sfcCoreRequest('PUT', 'QUEJA', $strPathSuffix, $dicBody);

    sfcDiag([
        'endpoint'       => 'PUT ' . ($dicRes['url'] ?? ($dicCfg['urls']['QUEJA'] . $strPathSuffix)),
        'payload'        => $dicRes['body_firma_json'] ?? json_encode($dicBody),
        'payload_origen' => $strOrigen,
        'http_code'      => $dicRes['http_code'] ?? null,
        'curl_error'     => $dicRes['error'] ?? null,
        'raw'            => $dicRes['raw'] ?? null,
    ]);

    return [
        'operacion'       => 'prorroga',
        'firma'           => $dicRes['firma'] ?? null,
        'body_firma_json' => $dicRes['body_firma_json'] ?? null,
        'payload_origen'  => $strOrigen,
        'http_code'       => $dicRes['http_code'] ?? null,
        'response'        => $dicRes['response'] ?? null,
    ];
}

/**
 * PRÓRROGA — decide si aplica localmente, notifica a la SFC, o rechaza por tope.
 *
 * INCREMENTA qd_strExtensionDays SOLO en los caminos de ÉXITO: devuelve
 * (entrante + 1), dejando el contador listo para la siguiente prórroga. En los
 * caminos de RECHAZO/FALLO (tope, error SFC) devuelve el MISMO valor entrante,
 * porque no hubo prórroga efectiva. El SLA/fecha los calcula el 71 como
 * 15 * (qd_strExtensionDays - 1) usando el valor ya incrementado, de modo que
 * equivale a 15 * (valor entrante) para la prórroga que se acaba de aplicar.
 *
 * La 1ra prórroga (entrante = 1) es LOCAL, sin SFC. Desde la 2da (entrante >= 2)
 * se notifica a la SFC; buildBodyProrroga envía prorroga_queja = (entrante - 1)
 * porque la SFC no vio la 1ra prórroga (para ella la 2da es su prórroga número 1).
 * Ese cálculo usa el valor entrante de $data, no el incrementado de salida.
 *
 * El código HTTP de la prórroga se refleja en qd_SSHTTPSP4 (qd_SSHTTPSP3 es del
 * cierre, que vive en otro script).
 */
function opProrroga(array $data): array
{
    global $_sfc_respons_logs;

    $intExtensionDays = sfcToInt(sfcVal($data, 'qd_strExtensionDays'));
    if ($intExtensionDays === null || $intExtensionDays < 1) {
        $intExtensionDays = 1;
    }

    // Contador de salida para los caminos de ÉXITO: entrante + 1.
    $intExtensionDaysNext = $intExtensionDays + 1;

    // Máximo de prórrogas alcanzado (> 12): rechazo local, sin SFC. No incrementa.
    if ($intExtensionDays > PRORROGA_MAX_EXTENSION_DAYS) {
        sfcDiag([
            'paso' => 'prorroga_maxima', 'endpoint' => null, 'payload' => null,
            'payload_origen' => null, 'http_code' => null, 'curl_error' => null, 'raw' => null,
        ]);
        $strMotivo = 'Máximo de ' . PRORROGA_MAX_EXTENSION_DAYS . ' prórrogas alcanzado para esta queja.';
        return array_merge(
            [
                'operacion' => 'prorroga', 'ok' => false, 'error' => true,
                'qd_strExtensionDays' => (string) $intExtensionDays,
                'qd_strM3FailedStep' => 'PRORROGA_MAXIMA',
                '_sfc_respons_logs' => $_sfc_respons_logs,
            ],
            sfcCamposErrorTecnico($data, $strMotivo)
        );
    }

    // Primera prórroga (entrante = 1): ajuste local, sin notificar a la SFC.
    // Éxito -> incrementa: devuelve entrante + 1 (= 2).
    if ($intExtensionDays === 1) {
        return [
            'operacion' => 'prorroga', 'ok' => true, 'error' => false,
            'qd_strExtensionDays' => (string) $intExtensionDaysNext,
            'qd_SSHTTPSP4' => '200',
            'qd_SSHTTPSP4_message' => 'Primera prórroga aplicada localmente, sin notificación a la SFC.',
            '_sfc_respons_logs' => $_sfc_respons_logs,
        ];
    }

    // Segunda prórroga en adelante (entrante entre 2 y 12): se notifica a la SFC.
    $dicSfcOut     = sfcNotificarProrroga($data);
    $strHttpCode   = isset($dicSfcOut['http_code']) ? (string) $dicSfcOut['http_code'] : null;
    $strMensajeApi = sfcMensajeRespuesta($dicSfcOut['response'] ?? null);
    $intUltimoCode = isset($dicSfcOut['http_code']) ? (int) $dicSfcOut['http_code'] : 0;
    $blnFinalOk    = $intUltimoCode >= 200 && $intUltimoCode < 300;

    $dicSfcOut['operacion']            = 'prorroga';
    $dicSfcOut['ok']                   = $blnFinalOk;
    $dicSfcOut['error']                = !$blnFinalOk;
    $dicSfcOut['qd_SSHTTPSP4']         = $strHttpCode;
    $dicSfcOut['qd_SSHTTPSP4_message'] = $strMensajeApi;
    // Bitácora de respuestas SFC acumulada desde el CORE.
    $dicSfcOut['_sfc_respons_logs']    = $_sfc_respons_logs;

    if ($blnFinalOk) {
        // Éxito -> incrementa el contador (entrante + 1) para la siguiente prórroga.
        $dicSfcOut['qd_strExtensionDays']       = (string) $intExtensionDaysNext;
        $dicSfcOut['qd_strM3FailedStep']        = '';
        $dicSfcOut['qd_strPayloadAdjustNeeded'] = 'NO';
    } else {
        // Fallo SFC -> NO incrementa: devuelve el contador entrante sin cambio.
        $dicSfcOut['qd_strExtensionDays'] = (string) $intExtensionDays;
        $dicSfcOut['qd_strM3FailedStep'] = 'PRORROGA';
        $dicSfcOut = array_merge($dicSfcOut, sfcCamposErrorTecnico($data, $strMensajeApi));
        // array_merge pudo pisar la bitácora: la reafirmamos.
        $dicSfcOut['_sfc_respons_logs'] = $_sfc_respons_logs;
    }

    return $dicSfcOut;
}

// =============================================================================
// DISPATCHER — solo prórroga
// =============================================================================

if (isset($data) && is_array($data)) {
    global $_sfc_respons_logs;

    // Precarga de la bitácora acumulativa: si el caso ya trae _sfc_respons_logs
    // de un momento anterior, arrancamos desde ahí para seguir sumando (el CORE
    // hace lo propio en cada llamada; aquí solo sembramos el punto de partida).
    if (isset($data['_sfc_respons_logs']) && is_array($data['_sfc_respons_logs'])) {
        $_sfc_respons_logs = $data['_sfc_respons_logs'];
    }

    try {
        return opProrroga($data);
    } catch (\Throwable $excError) {
        // Excepción (CORE caído, login/firma sin respuesta válida):
        // el detalle técnico se arma con lo último que quedó en el contexto de
        // diagnóstico más el mensaje de la excepción.
        $dicCampos   = sfcCamposErrorTecnico($data, $excError->getMessage(), $excError->getMessage());
        $strHttpCode = $dicCampos['qd_strHttpCode'] !== '' ? $dicCampos['qd_strHttpCode'] : null;

        return array_merge([
            'operacion'            => 'prorroga',
            'ok'                   => false,
            'error'                => true,
            'message'              => $excError->getMessage(),
            'qd_SSHTTPSP4'         => $strHttpCode,
            'qd_SSHTTPSP4_message' => $excError->getMessage(),
            // Fallo -> el contador se devuelve SIN cambio (no hubo prórroga efectiva).
            'qd_strExtensionDays'  => (string) sfcVal($data, 'qd_strExtensionDays'),
            'qd_strM3FailedStep'   => 'PRORROGA',
            // Bitácora de lo que alcanzó a registrar el CORE antes de fallar.
            '_sfc_respons_logs'    => $_sfc_respons_logs,
        ], $dicCampos);
    }
}
