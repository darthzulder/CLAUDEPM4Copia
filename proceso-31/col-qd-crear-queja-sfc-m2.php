<?php
/**
 * =============================================================================
 * SFC Smart Supervisión — MOMENTO 2 (radicar queja) + ATTACHMENTS
 * ProcessMaker 4 (Script Task, ejecutor PHP).
 * =============================================================================
 *
 * Este script ES el Momento 2 y tiene dos pasos encadenados:
 *   1. Radica la queja (POST /api/queja/, firma el body, 20 campos)   -> momento2
 *   2. Si (1) responde 2xx, sube hasta 5 anexos                       -> momento2_attachments
 *      vía POST /api/storage/ (multipart, 1 llamada por anexo).
 * La creación va PRIMERO: sin queja radicada no tiene sentido subir anexos.
 *
 * -----------------------------------------------------------------------------
 * ACCESO A LA SFC CENTRALIZADO EN EL CORE
 * -----------------------------------------------------------------------------
 * M2 ya NO abre cURL contra la SFC ni hace login/firma local. La radicación de
 * la queja se delega al CORE con operacion="request" (login + firma + HTTP allá)
 * y los anexos con operacion="storage" (multipart allá). El token de login nunca
 * cruza el borde executeScript hacia M2. La config pública (urls, tipo_entidad…)
 * se pide con operacion="config".
 *
 * PORTABILIDAD: el CORE NO se referencia por su id numérico (cambia al migrar de
 * instancia), sino por su UUID, que el export/import de paquetes de PM4
 * preserva. El id real se resuelve en runtime (ver resolveScriptId() más abajo,
 * idéntica a la del script 77 COL_QD_Check_SLA_Expire) y se cachea en proceso.
 *
 * Momento 2 puede traer hasta 5 anexos, en slots qd_strAttach01..05 (nombre)
 * + qd_strAttach01..05_id (ID de file en PM4). Cada slot presente se traduce
 * al contrato genérico del CORE (attachment_filename/attachment_file_id) y
 * dispara UNA llamada independiente a /api/storage/ (la SFC no acepta lotes).
 *
 * -----------------------------------------------------------------------------
 * REINTENTOS POR PASO (el script recuerda dónde se quedó)
 * -----------------------------------------------------------------------------
 *   qd_blnM2CreateDone  true  = la queja YA se radicó (en este intento o uno
 *                               anterior). Al reingresar NO se repite el POST
 *                               /api/queja/ (evita duplicar la queja) y va
 *                               directo a los anexos. false = (re)intentar crear.
 *   qd_strM2AttachDone  "01,03" = slots de anexos ya subidos OK; se omiten en el
 *                               reintento para no duplicar el soporte en la SFC.
 *   qd_strM2FailedStep  'CREACION' | 'ATTACHMENTS' | '' (vacío en éxito) — paso
 *                       donde se detuvo el flujo; para la compuerta del BPM.
 * Tras un éxito total el script deja el caso limpio (los tres anteriores
 * vacíos/false, qd_strPayloadSent='' y qd_strPayloadAdjustNeeded='NO').
 *
 * -----------------------------------------------------------------------------
 * CORRECCIÓN DEL PAYLOAD DESDE SCR-004 (igual que Momento 3)
 * -----------------------------------------------------------------------------
 * qd_strPayloadSent es el body de la CREACIÓN que SCR-004 muestra y deja editar.
 * En cada corrida se genera el body desde los campos del caso y se compara con
 * qd_strPayloadSent: si DIFIERE se envía el editado; si coincide (o está vacío)
 * se envía el generado. Se revierten las entidades HTML que la sanitización de
 * PM4 introduce al guardar el textarea (si no, la edición se descartaría). La
 * salida informa qué se usó en 'payload_origen'.
 *
 * -----------------------------------------------------------------------------
 * SALIDA DE ERROR -> pantalla SCR-004 (Revisión Error Técnico API)
 * -----------------------------------------------------------------------------
 * Cuando el flujo termina en error (excepción del CORE o http_code fuera de 2xx
 * en la creación o en algún anexo), el script emite los data_name que SCR-004
 * lee: qd_strHttpCode, qd_strErrorType, qd_strEndpointCalled, qd_strApiTechMessage,
 * qd_strCompleteLogAPI, qd_strAttemptNum y —solo si el paso fallido fue la
 * CREACION— qd_strPayloadSent (el body editable). En un fallo de anexo el error
 * reportado es el del PRIMER anexo que falló.
 *
 * Delega login, firma, HTTP y subida de anexos al script CORE vía executeScript.
 * Toda la lógica del anexo (descarga del binario, multipart, firma) vive en el
 * CORE (operacion="storage") para no duplicarla entre M2/M3; el binario nunca
 * cruza el borde executeScript.
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
 * Idéntica a resolveScriptId() del script 77 (COL_QD_Check_SLA_Expire).
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

// Bitácora de respuestas SFC acumulada de todas las llamadas al CORE en esta
// ejecución (cada salida del CORE trae su _sfc_respons_logs; las vamos fusionando
// para exponerlas en $data y poder auditar el flujo completo de M2).
$_sfc_respons_logs = [];

// =============================================================================
// Cliente del CORE (login + firma + request + storage viven en el CORE)
// =============================================================================

function sfcCallScript(int $intScriptId, array $dicPayload)
{
    global $api, $_sfc_respons_logs;
    $objResponse = $api->scripts()->executeScript($intScriptId, [
        'data'   => json_encode($dicPayload),
        'config' => "{}",
        'sync'   => true,
    ]);
    // getOutput() devuelve la salida del CORE como objeto; la pasamos a arreglo asociativo
    $dicOut = json_decode(json_encode($objResponse->getOutput()), true);
    // Acumulamos la bitácora que el CORE trae en cada salida.
    if (is_array($dicOut) && !empty($dicOut['_sfc_respons_logs']) && is_array($dicOut['_sfc_respons_logs'])) {
        foreach ($dicOut['_sfc_respons_logs'] as $dicLog) {
            $_sfc_respons_logs[] = $dicLog;
        }
    }
    // Si el CORE devolvió un error, lo lanzamos para verlo
    if (is_array($dicOut) && !empty($dicOut['error'])) {
        throw new RuntimeException("CORE {$intScriptId}: " . ($dicOut['message'] ?? 'error desconocido'));
    }
    return $dicOut;
}

/**
 * Config pública del CORE (urls, tipo_entidad, entidad_cod, fraud_macros).
 * Antes se obtenía como efecto colateral de sfcCoreLogin()['config']; ahora que
 * la creación de la queja va por operacion="request" (que hace su propio login
 * internamente), se pide la config por separado con operacion="config".
 */
function sfcCoreConfig(): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicRes = sfcCallScript($SFC_CORE_SCRIPT_ID, ['operacion' => 'config']);
    if (!is_array($dicRes) || !isset($dicRes['config']) || !is_array($dicRes['config'])) {
        throw new RuntimeException('CORE no devolvió config. Respuesta del core: ' . json_encode($dicRes));
    }
    return $dicRes['config'];
}

/**
 * Llamada HTTP genérica a la SFC vía CORE (operacion="request"). El CORE hace
 * login + firma + HTTP y devuelve http_code/response (+ _sfc_respons_logs). Este
 * es el ÚNICO punto por el que M2 toca la red de la SFC para radicar la queja:
 * ya no se hace login/firma/cURL local (el token de login nunca cruza a M2).
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

/** Delega la subida del anexo al CORE (operacion="storage"). */
function sfcCoreStorage(array $data): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicPayload = $data;
    $dicPayload['operacion'] = 'storage';
    return sfcCallScript($SFC_CORE_SCRIPT_ID, $dicPayload);
}

/**
 * Mapea el slot NN (qd_strAttachNN + qd_strAttachNN_id) al contrato genérico
 * de anexos que espera el CORE (attachment_filename, attachment_file_id). El
 * CORE no conoce nombres de campos de un momento en particular; cada momento
 * traduce los suyos antes de delegar.
 */
function sfcPayloadAnexoCore(array $data, string $strSlot): array
{
    $dicPayload = $data;
    $dicPayload['attachment_filename'] = sfcVal($data, "qd_strAttach{$strSlot}");
    $dicPayload['attachment_file_id']  = sfcVal($data, "qd_strAttach{$strSlot}_id");
    return $dicPayload;
}

// =============================================================================
// Helpers locales (transformación) para la operación momento2
// =============================================================================

function sfcVal(array $data, string $strKey)
{
    return array_key_exists($strKey, $data) ? $data[$strKey] : null;
}

/** Coerciona a int; null/'' quedan como null. */
function sfcToInt($genVal)
{
    if ($genVal === null || $genVal === '') {
        return null;
    }
    return (int) $genVal;
}

/** Código de catálogo como entero (M2 acepta int o string; se usa int). */
function sfcCode($genVal)
{
    return sfcToInt($genVal);
}

/** "SI" -> true; cualquier otra cosa -> false. */
function sfcToBoolSI($genVal): bool
{
    if (is_string($genVal)) {
        return strtoupper(trim($genVal)) === 'SI';
    }
    return (bool) $genVal;
}

/**
 * DD/MM/YYYY -> YYYY-MM-DDTHH:MM:SS. Si ya viene en ISO se devuelve igual.
 * TODO: la hora se fija en 00:00:00; definir la hora real más adelante.
 */
function sfcFechaIso($genFecha, string $strHora = '00:00:00')
{
    if (!is_string($genFecha) || trim($genFecha) === '') {
        return null;
    }
    $strFecha = trim($genFecha);
    if (preg_match('#^(\d{2})/(\d{2})/(\d{4})$#', $strFecha, $arrMatch)) {
        return sprintf('%s-%s-%sT%s', $arrMatch[3], $arrMatch[2], $arrMatch[1], $strHora);
    }
    return $strFecha;
}

/** nombres: persona jurídica -> razón social; natural -> nombre + apellido. */
function sfcNombres(array $data): string
{
    $genCompany = sfcVal($data, 'qd_strCompanyName');
    if (is_string($genCompany) && trim($genCompany) !== '') {
        return trim($genCompany);
    }
    $strFirstName = (string) sfcVal($data, 'qd_strFirstName');
    $strLastName  = (string) sfcVal($data, 'qd_strLastName');
    return trim($strFirstName . ' ' . $strLastName);
}

/** codigo_queja compuesto = tipo_entidad + entidad_cod + numero de queja (bpm). */
function sfcCodigoQueja(array $data, array $dicCfg): string
{
    $strNumero = (string) sfcVal($data, 'qd_strBpmCaseId');
    return (string) $dicCfg['tipo_entidad'] . (string) $dicCfg['entidad_cod'] . $strNumero;
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

/**
 * Resume http_code + mensaje de UN resultado de sfcCoreStorage (usado para el
 * detalle de anexos), que puede ser el output normal del CORE (con su propio
 * 'response') o un array de error capturado en catch (con 'message' directo).
 */
function sfcResumenLlamadaStorage($dicRes): array
{
    if (!is_array($dicRes)) {
        return ['http_code' => null, 'message' => sfcMensajeRespuesta($dicRes)];
    }
    if (isset($dicRes['message']) && !array_key_exists('response', $dicRes)) {
        return ['http_code' => $dicRes['http_code'] ?? null, 'message' => (string) $dicRes['message']];
    }
    return ['http_code' => $dicRes['http_code'] ?? null, 'message' => sfcMensajeRespuesta($dicRes['response'] ?? null)];
}

/**
 * Verdadero tolerante con el formato: PM4 puede devolver el mismo flag como
 * booleano, número o string según por dónde se haya escrito en la data del caso.
 */
function sfcEsVerdadero($genVal): bool
{
    if (is_bool($genVal)) {
        return $genVal;
    }
    if (is_int($genVal) || is_float($genVal)) {
        return $genVal != 0;
    }
    if (is_string($genVal)) {
        return in_array(strtoupper(trim($genVal)), ['SI', 'S', 'TRUE', '1', 'YES', 'Y'], true);
    }
    return false;
}

/** Parsea la lista CSV de slots ya subidos ("01,03") en un arreglo (['01','03']). */
function sfcParseSlots($genVal): array
{
    if (is_array($genVal)) {
        return array_values(array_filter(array_map('strval', $genVal), function ($s) { return $s !== ''; }));
    }
    if (!is_string($genVal) || trim($genVal) === '') {
        return [];
    }
    return array_values(array_filter(array_map('trim', explode(',', $genVal)), function ($s) { return $s !== ''; }));
}

// =============================================================================
// Diagnóstico de error técnico (alimenta la pantalla SCR-004)
// =============================================================================

/**
 * Contexto de la ÚLTIMA llamada intentada. Se va sobreescribiendo paso a paso
 * (core -> creación -> anexo) para que, si algo falla, sepamos exactamente qué
 * se invocó, con qué payload y qué contestó la SFC — incluso si el fallo fue
 * una excepción lanzada desde el CORE antes de tocar la red.
 */
$GLOBALS['SFC_DIAG'] = [
    'paso'           => 'core',       // core | momento2 | momento2_attachments
    'endpoint'       => null,         // "METODO url"
    'payload'        => null,         // string JSON o arreglo
    'payload_origen' => null,         // de dónde salió el payload de la creación
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
    $intCode = $dicDiag['http_code'] !== null ? (int) $dicDiag['http_code'] : null;
    $strCurl = (string) ($dicDiag['curl_error'] ?? '');

    if ($strCurl !== '') {
        $blnTimeout = stripos($strCurl, 'timed out') !== false || stripos($strCurl, 'timeout') !== false;
        return $blnTimeout
            ? ['codigo' => 'TIMEOUT', 'detalle' => 'La API no respondió dentro del tiempo de espera: ' . $strCurl]
            : ['codigo' => 'RED', 'detalle' => 'Fallo de transporte/conexión con la API: ' . $strCurl];
    }

    if ($intCode === null || $intCode === 0) {
        return [
            'codigo'  => 'CORE_PM4',
            'detalle' => 'No hubo respuesta HTTP de la SFC; el flujo se detuvo antes (login, firma o subida del anexo vía CORE). '
                . ($strExcMessage !== null && $strExcMessage !== '' ? $strExcMessage : 'Sin mensaje de excepción.'),
        ];
    }

    if ($intCode >= 200 && $intCode < 300) {
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
        return ['codigo' => 'NO_ENCONTRADO', 'detalle' => 'HTTP 404 — la SFC no encontró el recurso.'];
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
    $lstLineas[] = 'Payload enviado:';
    $strPayload  = sfcTruncar(sfcPayloadLegible($dicDiag['payload'] ?? null), 4000);
    $lstLineas[] = $strPayload !== '' ? $strPayload : '(ninguno)';
    $lstLineas[] = '';
    $lstLineas[] = 'Respuesta de la API:';
    $strRaw = sfcTruncar($dicDiag['raw'] ?? '');
    $lstLineas[] = $strRaw !== '' ? $strRaw : '(vacía)';

    return implode("\n", $lstLineas);
}

/**
 * Paso donde se detuvo el flujo, en el vocabulario del BPM. Se deduce del
 * contexto de diagnóstico: 'momento2' ⇒ CREACION; cualquier otro ⇒ ATTACHMENTS.
 * opMomento2 marca 'momento2' en cuanto entra, antes de llamar al CORE.
 */
function sfcPasoFallido(): string
{
    return (($GLOBALS['SFC_DIAG']['paso'] ?? '') === 'momento2') ? 'CREACION' : 'ATTACHMENTS';
}

/** Intento acumulado siguiente (FLD-055). Arranca en 1 si el caso no traía contador. */
function sfcIntentoSiguiente(array $data): int
{
    $intPrev = sfcToInt(sfcVal($data, 'qd_strAttemptNum'));
    if ($intPrev === null) {
        $intPrev = sfcToInt(sfcVal($data, 'qd_strM1M2Attempts'));
    }
    return ($intPrev === null ? 0 : $intPrev) + 1;
}

/**
 * Los campos de la sección "Detalle del Error Técnico" de SCR-004.
 * Se arman desde el contexto de diagnóstico, así que sirven igual para un
 * fallo HTTP como para una excepción del CORE.
 *
 * $strApiMessage es el mensaje que la API (o la excepción) devolvió: se guarda
 * tal cual en qd_strApiTechMessage para que coincida con qd_SSHTTPSP1_message.
 */
function sfcCamposErrorTecnico(array $data, ?string $strApiMessage = null, ?string $strExcMessage = null): array
{
    $dicDiag = $GLOBALS['SFC_DIAG'];
    $dicTipo = sfcClasificarError($dicDiag, $strExcMessage);

    $dicCampos = [
        'qd_strHttpCode'       => $dicDiag['http_code'] !== null ? (string) $dicDiag['http_code'] : '',
        'qd_strErrorType'      => $dicTipo['codigo'],
        'qd_strEndpointCalled' => (string) ($dicDiag['endpoint'] ?? ''),
        // Mismo valor que qd_SSHTTPSP1_message (mensaje corto de la API).
        'qd_strApiTechMessage' => (string) ($strApiMessage !== null ? $strApiMessage : ''),
        // Log completo — lo consume el modal "Ver Log Completo" de SCR-004.
        'qd_strCompleteLogAPI' => sfcLogCompleto($dicDiag, $dicTipo, $strExcMessage),
        'qd_strAttemptNum'     => (string) sfcIntentoSiguiente($data),
    ];

    // qd_strPayloadSent es EL BODY DE LA CREACIÓN y nada más: es la variable que
    // el analista edita en SCR-004 para reenviar. Si el fallo fue en un anexo, su
    // "payload" es el descriptor del archivo (no un body de creación), así que no
    // se toca la variable — el descriptor queda visible en el log completo.
    if (sfcPasoFallido() === 'CREACION') {
        $dicCampos['qd_strPayloadSent'] = sfcPayloadLegible($dicDiag['payload'] ?? null);
    }

    return $dicCampos;
}

// =============================================================================
// Builders
// =============================================================================

/** Momento 2 — 20 campos (tipo_entidad y entidad_cod separados). */
function buildBodyMomento2(array $data, array $dicCfg): array
{
    return [
        'tipo_entidad'     => $dicCfg['tipo_entidad'],           // const (int)
        'entidad_cod'      => $dicCfg['entidad_cod'],            // const (string)
        'codigo_queja'     => sfcCodigoQueja($data, $dicCfg),    // compuesto
        'codigo_pais'      => sfcVal($data, 'qd_strCountryCode'),
        'departamento_cod' => sfcVal($data, 'qd_strDepartment'), // DANE en prod
        'municipio_cod'    => sfcVal($data, 'qd_strCity'),       // DANE en prod
        'canal_cod'        => sfcCode(sfcVal($data, 'qd_strChannel')),
        'producto_cod'     => sfcCode(sfcVal($data, 'qd_strSfcProduct')),
        'macro_motivo_cod' => sfcCode(sfcVal($data, 'qd_strSfcReason')),
        'fecha_creacion'   => sfcFechaIso(sfcVal($data, 'qd_strFilingDate')),
        'nombres'          => sfcNombres($data),
        'tipo_id_CF'       => sfcCode(sfcVal($data, 'qd_strIdType')),
        'numero_id_CF'     => sfcVal($data, 'qd_strIdNumber'),
        'tipo_persona'     => sfcCode(sfcVal($data, 'qd_strPersonType')),
        'insta_recepcion'  => sfcCode(sfcVal($data, 'qd_strReceptionInstance')),
        'punto_recepcion'  => sfcCode(sfcVal($data, 'qd_strReceptionPoint')),
        'admision'         => sfcCode(sfcVal($data, 'qd_strAdmission')),
        'texto_queja'      => sfcVal($data, 'qd_strComplaintText'),
        'anexo_queja'      => sfcToBoolSI(sfcVal($data, 'qd_strFinalReplyAttach')),
        'ente_control'     => sfcCode(sfcVal($data, 'qd_strControlEntity')),
    ];
}

/**
 * Contenido de qd_strPayloadSent como arreglo, si es un body de creación usable.
 * Es la corrección que el analista escribe en SCR-004. Quién decide si se envía
 * es la comparación contra el body generado (ver opMomento2): si difiere, manda
 * la variable. Devuelve null si está vacío, si el JSON está roto o si es una lista.
 */
function sfcPayloadEditado(array $data): ?array
{
    $genRaw = sfcVal($data, 'qd_strPayloadSent');

    if (is_array($genRaw)) {
        // PM4 puede entregar la variable ya decodificada como arreglo (variable
        // tipada JSON) en lugar de string: se usa tal cual.
        $genDic = $genRaw;
    } else {
        if (!is_string($genRaw) || trim($genRaw) === '') {
            return null;
        }
        $strRaw = trim($genRaw);
        // ⚠ PM4 SANEA la data del formulario al completar la tarea (SCR-004): las
        // comillas del JSON llegan escapadas como entidades HTML (&quot; / &#34; /
        // &amp;…) y rompen json_decode → la edición del analista se descartaba y se
        // reenviaba el body regenerado. Revertimos las entidades antes de parsear; si
        // no venía escapado, html_entity_decode es un no-op. Respaldo: string crudo.
        $strDecoded = html_entity_decode($strRaw, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $genDic = json_decode($strDecoded, true);
        if (!is_array($genDic)) {
            $genDic = json_decode($strRaw, true);
        }
    }

    if (!is_array($genDic) || $genDic === []) {
        return null;
    }
    // Un JSON tipo lista no es un body de creación.
    $blnAsociativo = false;
    foreach (array_keys($genDic) as $genKey) {
        if (is_string($genKey)) {
            $blnAsociativo = true;
            break;
        }
    }
    return $blnAsociativo ? $genDic : null;
}

/**
 * ¿Dos bodies tienen el mismo contenido? Se comparan normalizados (json_encode
 * del arreglo decodificado), así que indentación y saltos de línea no cuentan
 * como cambio: solo importa el contenido real.
 */
function sfcMismoJson(array $dicA, array $dicB): bool
{
    return json_encode($dicA) === json_encode($dicB);
}

// =============================================================================
// Operaciones
// =============================================================================

/** Momento 2 — radicar queja (POST /api/queja/) vía CORE (operacion="request"). */
function opMomento2(array $data): array
{
    // Entramos al paso de creación: cualquier fallo (login/firma/HTTP en el CORE)
    // se atribuye a 'momento2' → CREACION en el diagnóstico.
    sfcDiag([
        'paso'           => 'momento2',
        'endpoint'       => null,
        'payload'        => null,
        'payload_origen' => null,
        'http_code'      => null,
        'curl_error'     => null,
        'raw'            => null,
    ]);

    // Config pública (urls, tipo_entidad, entidad_cod…) desde el CORE.
    $dicCfg = sfcCoreConfig();

    // Regla del payload: se genera SIEMPRE el body desde los campos del caso y se
    // compara con la variable qd_strPayloadSent. Si el contenido difiere, el
    // analista lo editó en SCR-004 y manda su versión; si coincide (o está vacía /
    // rota), se envía el generado. Igual que Momento 3.
    $dicGenerado  = buildBodyMomento2($data, $dicCfg);
    $dicEditado   = sfcPayloadEditado($data);
    $blnCorregido = $dicEditado !== null && !sfcMismoJson($dicEditado, $dicGenerado);
    $dicBody      = $blnCorregido ? $dicEditado : $dicGenerado;
    $strOrigen    = $blnCorregido
        ? 'variable qd_strPayloadSent (editada en SCR-004: difiere del body generado)'
        : 'campos del caso (reconstruido por buildBodyMomento2)';

    $strUrl = (string) ($dicCfg['urls']['QUEJA'] ?? 'QUEJA');
    sfcDiag([
        'endpoint'       => 'POST ' . $strUrl,
        'payload'        => $dicBody,
        'payload_origen' => $strOrigen,
    ]);

    // El CORE hace login + firma + POST y devuelve http_code/response.
    $dicRes = sfcCoreRequest('POST', 'QUEJA', '', $dicBody);

    sfcDiag([
        'http_code'  => $dicRes['http_code'],
        'curl_error' => $dicRes['error'] ?? null,
        'raw'        => $dicRes['raw'] ?? (isset($dicRes['response']) ? json_encode($dicRes['response']) : null),
    ]);

    return [
        'operacion'       => 'momento2',
        'payload_origen'  => $strOrigen,
        'http_code'       => $dicRes['http_code'],
        'response'        => $dicRes['response'] ?? null,
    ];
}

/**
 * Sube hasta 5 anexos del Momento 2 (multipart POST /api/storage/).
 * PM4 entrega los anexos en slots qd_strAttach01..05 + su _id; cada slot
 * presente es UNA llamada distinta al CORE (y por tanto a la API de la SFC:
 * el endpoint /api/storage/ no acepta lotes). Los fallos se aíslan por anexo
 * para que uno fallido no bloquee la subida de los demás.
 *
 * $lstYaHechos = slots subidos OK en intentos anteriores (qd_strM2AttachDone):
 * se OMITEN para no duplicar el soporte en la SFC (igual criterio anti-duplicado
 * que qd_blnM3AttachDone en Momento 3). Devuelve en 'hechos' la lista acumulada
 * de slots subidos, y deja en el diagnóstico el PRIMER anexo que falló (SCR-004).
 */
function opMomento2Attachments(array $data, array $lstYaHechos = []): array
{
    $lstDetalle   = [];
    $intOk        = 0;
    $intError     = 0;
    $lstHechos    = $lstYaHechos;   // slots subidos OK (previos + los de este intento)
    $dicDiagFallo = null;           // diag del PRIMER anexo que falla → SCR-004

    for ($intIdx = 1; $intIdx <= 5; $intIdx++) {
        $strSlot   = str_pad((string) $intIdx, 2, '0', STR_PAD_LEFT);
        $genNombre = sfcVal($data, "qd_strAttach{$strSlot}");
        $genId     = sfcVal($data, "qd_strAttach{$strSlot}_id");

        // Slot vacío (no siempre vienen los 5 llenos): se omite sin error.
        if (($genNombre === null || trim((string) $genNombre) === '')
            && ($genId === null || (string) $genId === '')) {
            continue;
        }

        // Slot ya subido en un intento anterior: se omite para no duplicar en la SFC.
        if (in_array($strSlot, $lstHechos, true)) {
            $lstDetalle[] = [
                'slot'    => $strSlot,
                'nombre'  => $genNombre,
                'file_id' => $genId,
                'ok'      => true,
                'omitido' => true,
                'motivo'  => 'Anexo ya subido en un intento anterior (qd_strM2AttachDone).',
            ];
            continue;
        }

        // Descriptor legible del anexo (el binario/multipart vive en el CORE).
        sfcDiag([
            'paso'           => 'momento2_attachments',
            'endpoint'       => 'POST /api/storage/ (delegado al CORE)',
            'payload'        => [
                'operacion'           => 'storage',
                'slot'                => $strSlot,
                'attachment_filename' => $genNombre,
                'attachment_file_id'  => $genId,
                'qd_strBpmCaseId'     => sfcVal($data, 'qd_strBpmCaseId'),
            ],
            'payload_origen' => null,
            'http_code'      => null,
            'curl_error'     => null,
            'raw'            => null,
        ]);

        try {
            $dicRes = sfcCoreStorage(sfcPayloadAnexoCore($data, $strSlot));
        } catch (\Throwable $excError) {
            $dicRes = ['error' => true, 'message' => $excError->getMessage()];
        }

        $intCode = is_array($dicRes) && isset($dicRes['http_code']) ? (int) $dicRes['http_code'] : 0;
        // OK = sin error del CORE y (sin http_code, o http 2xx).
        $blnOk = is_array($dicRes) && empty($dicRes['error'])
            && ($intCode === 0 || ($intCode >= 200 && $intCode < 300));

        // Reflejamos en el diag lo que respondió este anexo (por si es el que falla).
        if (is_array($dicRes)) {
            sfcDiag([
                'endpoint'   => isset($dicRes['url']) && $dicRes['url'] !== ''
                    ? 'POST ' . (string) $dicRes['url']
                    : 'POST /api/storage/ (delegado al CORE)',
                'http_code'  => isset($dicRes['http_code']) ? (int) $dicRes['http_code'] : null,
                'curl_error' => isset($dicRes['error']) && is_string($dicRes['error']) ? $dicRes['error'] : null,
                'raw'        => isset($dicRes['raw']) && is_string($dicRes['raw']) && $dicRes['raw'] !== ''
                    ? $dicRes['raw']
                    : json_encode($dicRes),
            ]);
        }

        if ($blnOk) {
            $intOk++;
            if (!in_array($strSlot, $lstHechos, true)) {
                $lstHechos[] = $strSlot;
            }
        } else {
            $intError++;
            if ($dicDiagFallo === null) {
                $dicDiagFallo = $GLOBALS['SFC_DIAG']; // congelamos el PRIMER fallo
            }
        }

        $lstDetalle[] = [
            'slot'      => $strSlot,
            'nombre'    => $genNombre,
            'file_id'   => $genId,
            'ok'        => $blnOk,
            'http_code' => is_array($dicRes) ? ($dicRes['http_code'] ?? null) : null,
            'response'  => $dicRes,
        ];
    }

    // Si hubo algún fallo, dejamos el diag en el PRIMER anexo que falló, así
    // SCR-004 muestra ese detalle aunque después se procesaran otros slots.
    if ($dicDiagFallo !== null) {
        $GLOBALS['SFC_DIAG'] = $dicDiagFallo;
    }

    return [
        'operacion' => 'momento2_attachments',
        'total'     => count($lstDetalle),
        'ok'        => $intOk,
        'fallidos'  => $intError,
        'hechos'    => $lstHechos,   // slots subidos OK acumulados (para el reintento)
        'detalle'   => $lstDetalle,
    ];
}

/**
 * Momento 2 completo: PRIMERO radica la queja, LUEGO sube los anexos. Cada paso
 * es reintentable por separado y el script recuerda dónde se quedó:
 *
 *   · qd_blnM2CreateDone true  → la queja YA se radicó (en este intento o uno
 *     anterior); al reingresar NO se repite el POST /api/queja/ y se va directo
 *     a los anexos. false → hay que (re)intentar la creación.
 *   · qd_strM2AttachDone "01,03" → slots de anexos ya subidos OK; se omiten en
 *     el reintento para no duplicar el soporte en la SFC.
 *   · qd_strM2FailedStep 'CREACION' | 'ATTACHMENTS' | '' (vacío en éxito) → paso
 *     donde se detuvo el flujo; sirve para la compuerta del BPM y para SCR-004.
 *
 * Si la creación falla, los anexos se omiten (no se suben adjuntos de una queja
 * que no quedó radicada) y el error reportado es el de la creación. Si la
 * creación pasa y falla algún anexo, el error reportado es el del PRIMER anexo
 * fallido y qd_blnM2CreateDone queda true para no recrear en el reintento.
 *
 * Tras un éxito total el script deja el caso limpio (create/attach done vacíos,
 * qd_strPayloadSent vacío, qd_strPayloadAdjustNeeded='NO') para que una futura
 * ejecución de M2 arranque desde cero.
 *
 * qd_SSHTTPSP1 / qd_SSHTTPSP1_message reflejan la ÚLTIMA respuesta real de la
 * SFC (el último anexo procesado si lo hubo; si no, la creación).
 */
function opMomento2Completo(array $data): array
{
    // ── Paso 1 · creación (se salta si un intento anterior ya la hizo) ───────
    $blnCreatePrevio = sfcEsVerdadero(sfcVal($data, 'qd_blnM2CreateDone'));

    if ($blnCreatePrevio) {
        $dicMomento2 = [
            'operacion' => 'momento2',
            'omitido'   => true,
            'motivo'    => 'La queja ya se radicó en un intento anterior (qd_blnM2CreateDone); se va directo a los anexos.',
        ];
        $blnCreateOk = true;
        // Vamos directo a anexos: el diag por defecto apunta a ese paso.
        sfcDiag(['paso' => 'momento2_attachments']);
    } else {
        $dicMomento2 = opMomento2($data);
        $intCode     = isset($dicMomento2['http_code']) ? (int) $dicMomento2['http_code'] : 0;
        $blnCreateOk = $intCode >= 200 && $intCode < 300;
    }

    // ── Paso 2 · anexos (solo si la queja quedó radicada) ────────────────────
    $lstYaHechos = sfcParseSlots(sfcVal($data, 'qd_strM2AttachDone'));
    if ($blnCreateOk) {
        $dicAttachments = opMomento2Attachments($data, $lstYaHechos);
        $blnAttachOk    = ((int) ($dicAttachments['fallidos'] ?? 0)) === 0;
    } else {
        $dicAttachments = [
            'operacion' => 'momento2_attachments',
            'omitido'   => true,
            'motivo'    => 'La creación no respondió 2xx; no se suben anexos.',
            'hechos'    => $lstYaHechos,
        ];
        $blnAttachOk = false;
    }

    $dicMomento2['attachments']      = $dicAttachments;
    $dicMomento2['creacion_omitida'] = $blnCreatePrevio;

    // La "última respuesta real" es la del último anexo que EFECTIVAMENTE llamó a
    // la API. Se recorre el detalle de atrás hacia adelante para SALTAR los anexos
    // omitidos (ya subidos en un intento previo → sin clave 'response') y los que
    // el CORE devolvió sin http_code; cualquiera de esos dejaba qd_SSHTTPSP1 en
    // null aunque hubiera habido una respuesta HTTP válida. Si ningún anexo aporta
    // un código, se cae al de la creación de la queja.
    $dicResumen = null;
    if (!empty($dicAttachments['detalle']) && is_array($dicAttachments['detalle'])) {
        for ($intDet = count($dicAttachments['detalle']) - 1; $intDet >= 0; $intDet--) {
            $dicDet = $dicAttachments['detalle'][$intDet];
            if (is_array($dicDet) && array_key_exists('response', $dicDet)) {
                $dicTmp = sfcResumenLlamadaStorage($dicDet['response']);
                if ($dicTmp['http_code'] !== null) {
                    $dicResumen = $dicTmp;
                    break;
                }
            }
        }
    }
    if ($dicResumen === null) {
        $dicResumen = [
            'http_code' => $dicMomento2['http_code'] ?? null,
            'message'   => sfcMensajeRespuesta($dicMomento2['response'] ?? null),
        ];
    }
    // Último respaldo: si ni los anexos ni la creación aportaron un código (p. ej.
    // reingreso con creación omitida y anexo que falló por excepción del CORE),
    // se toma el del contexto de diagnóstico —misma fuente que qd_strHttpCode— para
    // que qd_SSHTTPSP1 SIEMPRE traiga un código HTTP cuando la SFC llegó a responder.
    if ($dicResumen['http_code'] === null && ($GLOBALS['SFC_DIAG']['http_code'] ?? null) !== null) {
        $dicResumen['http_code'] = $GLOBALS['SFC_DIAG']['http_code'];
        if (($dicResumen['message'] ?? null) === null) {
            $dicResumen['message'] = sfcMensajeRespuesta($GLOBALS['SFC_DIAG']['raw'] ?? null);
        }
    }

    $dicMomento2['qd_SSHTTPSP1']         = $dicResumen['http_code'] !== null ? (string) $dicResumen['http_code'] : null;
    $dicMomento2['qd_SSHTTPSP1_message'] = $dicResumen['message'];

    // ── Resultado global + estado de reintento ───────────────────────────────
    $blnFinalOk = $blnCreateOk && $blnAttachOk;
    $dicMomento2['ok']    = $blnFinalOk;
    $dicMomento2['error'] = !$blnFinalOk;

    if ($blnFinalOk) {
        // Todo OK: limpiamos el estado para una futura ejecución desde cero y
        // cerramos el ciclo de corrección (qd_strPayloadSent vacío para que un
        // payload viejo no se reenvíe como "editado" en una ejecución posterior).
        $dicMomento2['qd_strM2FailedStep']        = '';
        $dicMomento2['qd_blnM2CreateDone']        = false;
        $dicMomento2['qd_strM2AttachDone']        = '';
        $dicMomento2['qd_strPayloadAdjustNeeded'] = 'NO';
        $dicMomento2['qd_strPayloadSent']         = '';
    } else {
        // Persistimos lo ya logrado + el detalle técnico del paso que falló (SCR-004).
        $dicMomento2['qd_blnM2CreateDone'] = $blnCreateOk; // si la creación pasó, no repetir
        $dicMomento2['qd_strM2AttachDone'] = implode(',', $dicAttachments['hechos'] ?? $lstYaHechos);
        $dicMomento2['qd_strM2FailedStep'] = $blnCreateOk ? 'ATTACHMENTS' : 'CREACION';
        $dicMomento2 = array_merge(
            $dicMomento2,
            sfcCamposErrorTecnico($data, $dicMomento2['qd_SSHTTPSP1_message'])
        );
    }

    return $dicMomento2;
}

// =============================================================================
// DISPATCHER — siempre momento2 + momento2_attachments encadenados
// =============================================================================

if (isset($data) && is_array($data)) {
    global $_sfc_respons_logs;
    try {
        $dicSalida = opMomento2Completo($data);
        // Exponemos la bitácora acumulada de todas las llamadas al CORE.
        $dicSalida['_sfc_respons_logs'] = $_sfc_respons_logs;
        return $dicSalida;
    } catch (\Throwable $excError) {
        // Excepción (CORE caído, login/firma sin respuesta válida, anexo fallido):
        // el detalle técnico se arma con lo último que quedó en el contexto de
        // diagnóstico más el mensaje de la excepción, para que SCR-004 lo muestre.
        $dicCampos = sfcCamposErrorTecnico($data, $excError->getMessage(), $excError->getMessage());
        $strPaso   = sfcPasoFallido();

        return array_merge([
            'operacion'            => 'momento2',
            'ok'                   => false,
            'error'                => true,
            'message'              => $excError->getMessage(),
            // Si alcanzamos a recibir un HTTP antes de la excepción, lo conservamos.
            'qd_SSHTTPSP1'         => $dicCampos['qd_strHttpCode'] !== '' ? $dicCampos['qd_strHttpCode'] : null,
            'qd_SSHTTPSP1_message' => $excError->getMessage(),
            // Si la excepción ocurrió ya en los anexos, la creación había pasado.
            'qd_strM2FailedStep'   => $strPaso,
            'qd_blnM2CreateDone'   => $strPaso === 'ATTACHMENTS',
            '_sfc_respons_logs'    => $_sfc_respons_logs,
        ], $dicCampos);
    }
}
