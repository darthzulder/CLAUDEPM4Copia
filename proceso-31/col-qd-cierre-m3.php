<?php
/**
 * =============================================================================
 * SFC Smart Supervisión — MOMENTO 3 (gestión/cierre) + ATTACHMENTS
 * ProcessMaker 4 (Script Task, ejecutor PHP).
 * =============================================================================
 *
 * Este script ES el Momento 3 y tiene dos pasos encadenados:
 *   1. Sube el anexo (POST /api/storage/, multipart, delega en el CORE)  -> momento3_attachments
 *   2. Si (1) responde 2xx, ejecuta la gestión/cierre                    -> momento3
 *      (PUT /api/queja/{codigo}/, firma el body; +fraude)
 * A diferencia de Momento 2, aquí el anexo va PRIMERO: el cierre referencia
 * el documento subido (documentacion_rta_final/anexo_queja), así que si el
 * anexo falla no tiene sentido cerrar la queja.
 *
 * -----------------------------------------------------------------------------
 * ACCESO A LA SFC CENTRALIZADO EN EL CORE (script 84)
 * -----------------------------------------------------------------------------
 * M3 ya NO hace login, firma ni cURL contra la SFC. El cierre (PUT) va por el
 * CORE con operacion="request" (login + firma del body + HTTP allá) y el anexo
 * por operacion="storage"; el token de login nunca cruza el borde executeScript.
 * Esto es obligatorio desde que el CORE redacta el 'access' en login OK: los
 * scripts que hacían login local se quedaban sin token → el cierre reventaba.
 *
 * -----------------------------------------------------------------------------
 * BITÁCORA ACUMULATIVA (_sfc_respons_logs) — EL CORE ES LA FUENTE ÚNICA
 * -----------------------------------------------------------------------------
 * El CORE (84) es acumulativo: precarga el _sfc_respons_logs que le llega en
 * $data y le AGREGA las respuestas de su propia ejecución. Para aprovecharlo sin
 * duplicar, M3 REENVÍA su acumulador al CORE en cada llamada (sfcCallScript) y,
 * cuando el CORE responde, ADOPTA la bitácora devuelta tal cual (previo + nuevo)
 * en lugar de concatenar de este lado. Así las 3 llamadas al CORE de una misma
 * ejecución (config, storage, request) van encadenando la misma bitácora, y si
 * el caso le pasa a M3 un _sfc_respons_logs de un momento anterior, también se
 * conserva y crece.
 *
 * -----------------------------------------------------------------------------
 * REINTENTOS POR PASO (el script recuerda dónde se quedó)
 * -----------------------------------------------------------------------------
 * El error se reporta SIEMPRE del paso que falló: si murió en el anexo se
 * devuelve el payload/endpoint/respuesta del anexo; si el anexo pasó y murió el
 * cierre, se devuelven los del cierre. Para eso el script escribe dos variables
 * de control en el caso:
 *
 *   qd_blnM3AttachDone  true  = el anexo ya subió OK (en este intento o en uno
 *                               anterior). Al volver a entrar, el script NO
 *                               repite el POST /api/storage/ (evita duplicar el
 *                               soporte en la SFC) y va directo al cierre.
 *                       false = hay que (re)intentar el anexo.
 *   qd_strM3FailedStep  'ATTACHMENTS' | 'CIERRE' | '' (vacío en éxito) — paso
 *                       donde se detuvo el flujo; sirve para la compuerta del BPM.
 *
 * Tras un cierre aceptado (2xx) el script deja el caso limpio:
 * qd_blnM3AttachDone = false, qd_strM3FailedStep = '' y
 * qd_strPayloadAdjustNeeded = 'NO', para que una futura ejecución de M3 en el
 * mismo caso arranque desde cero (anexo incluido) y no reutilice un payload
 * corregido viejo. Además marca qd_strComplaintStatus = '4' (queja cerrada).
 *
 * Toda la lógica del anexo (descarga del binario, multipart, firma) vive en el
 * CORE (operacion="storage") para no duplicarla entre M2/M3; el binario nunca
 * cruza el borde executeScript.
 * Para cierre el archivo debe llevar el sufijo RESP_FINAL_SFC; para fraude
 * INV_FRAUDE_SFC (el nombre lo provee el caller en pdf_filename).
 * Ajusta $SFC_CORE_SCRIPT_ID con el ID real del CORE en PM4.
 *
 * -----------------------------------------------------------------------------
 * estado_cod DEL CIERRE
 * -----------------------------------------------------------------------------
 * Este script ES el cierre, así que el body fija estado_cod = 4 (queja cerrada)
 * SIEMPRE — no lee qd_strComplaintStatus para armarlo. Si el analista editó
 * qd_strPayloadSent en SCR-004 con otro estado_cod, su versión prevalece (misma
 * regla de payload editado que el resto del body). Cuando el cierre responde
 * 2xx, el script devuelve además qd_strComplaintStatus = '4' para dejar el caso
 * marcado como cerrado.
 *
 * -----------------------------------------------------------------------------
 * prorroga_queja QUE VE LA SFC EN EL CIERRE
 * -----------------------------------------------------------------------------
 * Igual que en el script 78 (prórroga), la SFC NO vio la 1ra prórroga (fue
 * local), así que el número de prórroga que ella conoce es qd_strExtensionDays
 * menos 1. Pero SOLO se descuenta ese 1 cuando el caso realmente pasó por una
 * prórroga aplicada: la señal es qd_SSHTTPSP4 === '200' (código HTTP que el 78
 * escribe cuando la prórroga se aplicó, local o vía SFC).
 *
 *   - qd_SSHTTPSP4 === '200'  -> prorroga_queja = qd_strExtensionDays - 1.
 *   - qd_SSHTTPSP4 ausente, o presente con cualquier otro valor (fallo SFC,
 *     tope PRORROGA_MAXIMA, etc.) -> prorroga_queja = qd_strExtensionDays tal
 *     cual (no hubo prórroga efectiva que descontar).
 *
 * -----------------------------------------------------------------------------
 * PAYLOAD DEL CIERRE: la variable qd_strPayloadSent manda si tiene cambios
 * -----------------------------------------------------------------------------
 * qd_strPayloadSent es la variable del body del cierre — la que SCR-004 muestra
 * y deja editar. En cada ejecución el script:
 *   1. genera el body desde los campos del caso (buildBodyMomento3);
 *   2. lee qd_strPayloadSent y lo compara con el generado (contenido, no formato);
 *   3. si DIFIERE  -> envía el de la variable (el analista lo corrigió);
 *      si COINCIDE (o está vacía / no es JSON de objeto) -> envía el generado.
 * Ya NO se exige qd_strPayloadAdjustNeeded = SI: ese flag solo controla que la
 * pantalla habilite el textarea. El codigo_queja del path se toma del body, así
 * path y cuerpo siempre coinciden. La salida informa qué se usó en
 * 'payload_origen'.
 *
 * IMPORTANTE: qd_strPayloadSent solo se sobrescribe cuando falla el CIERRE. Si
 * falla el anexo, su "payload" es el descriptor del archivo, que iría a esta
 * variable y luego se enviaría como body — por eso en ese caso no se toca y el
 * descriptor queda visible en qd_strCompleteLogAPI.
 * Tras un cierre 2xx la variable se vacía, para que un payload viejo no se
 * reenvíe como "editado" en una ejecución posterior de M3.
 *
 * -----------------------------------------------------------------------------
 * SALIDA DE ERROR -> pantalla SCR-004 (Revisión Error Técnico API)
 * -----------------------------------------------------------------------------
 * Cuando el flujo termina en error (excepción del CORE o http_code fuera de
 * 2xx en cualquiera de los dos pasos), el script devuelve además los
 * data_name que la sección "Detalle del Error Técnico" de SCR-004 lee de
 * task.data — todos solo lectura en la pantalla salvo el payload:
 *
 *   qd_strHttpCode        FLD-050  código HTTP de la última respuesta real
 *   qd_strErrorType       FLD-051  código de clasificación (ver sfcClasificarError)
 *   qd_strEndpointCalled  FLD-053  "METODO url" de la llamada que falló
 *   qd_strApiTechMessage  FLD-052  mensaje de la API — MISMO valor que qd_SSHTTPSP3_message
 *   qd_strCompleteLogAPI  (nuevo)  log técnico completo (paso, HTTP, cURL, cuerpo crudo);
 *                                  SCR-004 lo muestra en el modal "Ver Log Completo"
 *   qd_strPayloadSent     FLD-054  body del cierre realmente enviado, JSON legible
 *                                  (solo cuando el paso que falló fue el CIERRE)
 *   qd_strAttemptNum      FLD-055  intento acumulado (previo + 1)
 *
 * En éxito NO se emiten estos campos, para no borrar el detalle del intento
 * anterior que la pantalla pueda seguir necesitando.
 */

$SFC_CORE_SCRIPT_ID = 84; // TODO: reemplazar por el ID real del script CORE

// Estado destino de la queja al cerrar (estado_cod en el body del cierre).
const CIERRE_ESTADO_COD = 4;

// Bitácora acumulada de todas las llamadas al CORE en esta ejecución.
$_sfc_respons_logs = [];

// =============================================================================
// Cliente del CORE (login + firma + HTTP + storage viven en el CORE)
// =============================================================================

function sfcCallScript(int $intScriptId, array $dicPayload)
{
    global $api, $_sfc_respons_logs;

    // Reenviamos la bitácora acumulada AL CORE: el 84 es acumulativo (precarga
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
    if (is_array($dicOut) && !empty($dicOut['_sfc_respons_logs']) && is_array($dicOut['_sfc_respons_logs'])) {
        $_sfc_respons_logs = $dicOut['_sfc_respons_logs'];
    }
    // Si el CORE devolvió un error, lo lanzamos para verlo
    if (is_array($dicOut) && !empty($dicOut['error'])) {
        throw new RuntimeException("CORE {$intScriptId}: " . ($dicOut['message'] ?? 'error desconocido'));
    }
    return $dicOut;
}

/** Pide al CORE SOLO la config pública (urls, tipo_entidad, entidad_cod, fraud_macros). */
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
 * Llamada HTTP a la SFC vía CORE (operacion="request"). El CORE hace login +
 * firma (URL para GET/DELETE, body para POST/PUT) + HTTP y devuelve
 * http_code/response (+ _sfc_respons_logs). Único punto por el que M3 toca la
 * red de la SFC para el cierre: ya no se hace login/firma/cURL local.
 */
function sfcCoreRequest(string $strMetodo, string $strUrlKey, string $strPathSuffix, ?array $dicBody = null): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicPayload = [
        'operacion'   => 'request',
        'metodo'      => $strMetodo,
        'url_key'     => $strUrlKey,
        'path_suffix' => $strPathSuffix,
    ];
    if ($dicBody !== null) {
        $dicPayload['contenido'] = json_encode($dicBody);
    }
    $dicRes = sfcCallScript($SFC_CORE_SCRIPT_ID, $dicPayload);
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
 * Mapea los campos reales de PM4 (pdf_filename, qd_strFinalReplyPdf) al
 * contrato genérico de anexos que espera el CORE (attachment_filename,
 * attachment_file_id). El CORE no conoce nombres de campos de un momento
 * en particular; cada momento traduce los suyos antes de delegar.
 */
function sfcPayloadAnexoCore(array $data): array
{
    $dicPayload = $data;
    $dicPayload['attachment_filename'] = sfcVal($data, 'pdf_filename');
    $dicPayload['attachment_file_id']  = sfcVal($data, 'qd_strFinalReplyPdf');
    return $dicPayload;
}

// =============================================================================
// Helpers locales (transformación) para la operación momento3
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

/** Código de catálogo como entero (M3 rechaza string en campos de clave primaria). */
function sfcCode($genVal)
{
    return sfcToInt($genVal);
}

/**
 * prorroga_queja QUE VE LA SFC en el cierre.
 * Solo se descuenta 1 cuando el caso pasó por una prórroga aplicada, señalada
 * por qd_SSHTTPSP4 === '200' (código que el script 78 escribe al aplicar la
 * prórroga, local o vía SFC). En cualquier otro caso — qd_SSHTTPSP4 ausente, o
 * presente con otro valor (fallo SFC, tope PRORROGA_MAXIMA) — se envía
 * qd_strExtensionDays tal cual, porque no hubo prórroga efectiva que descontar.
 */
function sfcProrrogaQueja(array $data)
{
    $intExtensionDays = sfcToInt(sfcVal($data, 'qd_strExtensionDays'));
    if ($intExtensionDays === null) {
        return null;
    }
    $strHttpProrroga = (string) sfcVal($data, 'qd_SSHTTPSP4');
    if ($strHttpProrroga === '200') {
        return $intExtensionDays - 1;
    }
    return $intExtensionDays;
}

function sfcToBoolSI($genVal): bool
{
    if (is_string($genVal)) {
        return strtoupper(trim($genVal)) === 'SI';
    }
    return (bool) $genVal;
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

// =============================================================================
// Diagnóstico de error técnico (alimenta la pantalla SCR-004)
// =============================================================================

/**
 * Contexto de la ÚLTIMA llamada intentada. Se va sobreescribiendo paso a paso
 * (core -> anexo -> cierre) para que, si algo falla, sepamos exactamente qué
 * se invocó, con qué payload y qué contestó la SFC — incluso si el fallo fue
 * una excepción lanzada desde el CORE antes de tocar la red.
 */
$GLOBALS['SFC_DIAG'] = [
    'paso'           => 'core',       // core | momento3_attachments | momento3
    'endpoint'       => null,         // "METODO url"
    'payload'        => null,         // string JSON o arreglo
    'payload_origen' => null,         // de dónde salió el payload del cierre
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
            'detalle' => 'No hubo respuesta HTTP de la SFC; el flujo se detuvo antes (login, firma o subida del anexo vía CORE). '
                . ($strExcMessage !== null && $strExcMessage !== '' ? $strExcMessage : 'Sin mensaje de excepción.'),
        ];
    }

    if ($intCode >= 200 && $intCode < 300) {
        // La llamada registrada respondió bien: el fallo ocurrió después (p. ej.
        // el anexo subió 201 y el cierre reventó en login/firma del CORE).
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
 * contexto de diagnóstico, así que también funciona desde el catch: opMomento3
 * marca 'momento3' en cuanto entra, antes de llamar al CORE.
 */
function sfcPasoFallido(): string
{
    return (($GLOBALS['SFC_DIAG']['paso'] ?? '') === 'momento3') ? 'CIERRE' : 'ATTACHMENTS';
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
 * tal cual en qd_strApiTechMessage para que coincida con qd_SSHTTPSP3_message.
 */
function sfcCamposErrorTecnico(array $data, ?string $strApiMessage = null, ?string $strExcMessage = null): array
{
    $dicDiag = $GLOBALS['SFC_DIAG'];
    $dicTipo = sfcClasificarError($dicDiag, $strExcMessage);

    $dicCampos = [
        'qd_strHttpCode'       => $dicDiag['http_code'] !== null ? (string) $dicDiag['http_code'] : '',
        'qd_strErrorType'      => $dicTipo['codigo'],
        'qd_strEndpointCalled' => (string) ($dicDiag['endpoint'] ?? ''),
        // Mismo valor que qd_SSHTTPSP3_message (mensaje corto de la API).
        'qd_strApiTechMessage' => (string) ($strApiMessage !== null ? $strApiMessage : ''),
        // Log completo — lo consume el modal "Ver Log Completo" de SCR-004.
        'qd_strCompleteLogAPI' => sfcLogCompleto($dicDiag, $dicTipo, $strExcMessage),
        'qd_strAttemptNum'     => (string) sfcIntentoSiguiente($data),
    ];

    // qd_strPayloadSent es EL BODY DEL CIERRE y nada más: es la variable que el
    // analista edita en SCR-004 para reenviar. Si el fallo fue en el anexo, su
    // "payload" es el descriptor del archivo (no un body de cierre), así que no
    // se toca la variable — el descriptor queda visible en el log completo.
    if (sfcPasoFallido() === 'CIERRE') {
        $dicCampos['qd_strPayloadSent'] = sfcPayloadLegible($dicDiag['payload'] ?? null);
    }

    return $dicCampos;
}

// =============================================================================
// Builders
// =============================================================================

/**
 * Contenido de qd_strPayloadSent como arreglo, si es un body de cierre usable.
 * NO mira qd_strPayloadAdjustNeeded: ese flag solo gobierna si la pantalla deja
 * editar el textarea. Quién decide si se envía es la comparación contra el body
 * generado (ver opMomento3): si difiere, manda la variable.
 * Devuelve null si está vacío, si el JSON está roto, si es una lista o si es el
 * descriptor del anexo.
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
        // reenviaba el body regenerado (bug "sigue con los mismos datos"). Revertimos
        // las entidades antes de parsear; si no venía escapado, html_entity_decode es
        // un no-op. Como respaldo, se reintenta sobre el string crudo.
        $strDecoded = html_entity_decode($strRaw, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $genDic = json_decode($strDecoded, true);
        if (!is_array($genDic)) {
            $genDic = json_decode($strRaw, true);
        }
    }

    if (!is_array($genDic) || $genDic === []) {
        return null;
    }
    // Un JSON tipo lista no es un body de cierre.
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
    // Salvaguarda por si un caso viejo dejó el descriptor del anexo aquí.
    if (isset($genDic['operacion']) && (string) $genDic['operacion'] === 'storage') {
        return null;
    }
    return $genDic;
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

/** Momento 3 — 23 campos base + 4 de fraude si aplica. */
function buildBodyMomento3(array $data, array $dicCfg): array
{
    $genMacro = sfcVal($data, 'qd_strSfcReason');

    // La SFC valida estos campos como códigos de catálogo (entero). Si alguna
    // qd_* llega como "SI"/"NO" hay que mapearla a su código numérico antes.
    $dicBody = [
        'codigo_queja'            => sfcCodigoQueja($data, $dicCfg),
        'sexo'                    => sfcCode(sfcVal($data, 'qd_strSex')),
        'lgbtiq'                  => sfcCode(sfcVal($data, 'qd_strLgbtiq')),
        'condicion_especial'      => sfcCode(sfcVal($data, 'qd_strSpecialCondition')),
        'canal_cod'               => sfcCode(sfcVal($data, 'qd_strChannel')),
        'producto_cod'            => sfcCode(sfcVal($data, 'qd_strSfcProduct')),
        'macro_motivo_cod'        => sfcCode($genMacro),
        // Cierre: el estado destino de la queja es SIEMPRE 4 (cerrada); no se
        // lee qd_strComplaintStatus para armar el body. Si el analista editó
        // qd_strPayloadSent con otro estado_cod, su versión prevalece (regla de
        // payload editado en opMomento3).
        'estado_cod'              => CIERRE_ESTADO_COD,
        'fecha_actualizacion'     => sfcFechaIso(sfcVal($data, 'qd_strClosureDate')),
        'producto_digital'        => sfcCode(sfcVal($data, 'qd_strDigitalProduct')),
        'a_favor_de'              => sfcCode(sfcVal($data, 'qd_strFavorability')),
        'aceptacion_queja'        => sfcCode(sfcVal($data, 'qd_strAcceptance')),
        'rectificacion_queja'     => sfcCode(sfcVal($data, 'qd_strRectification')),
        'desistimiento_queja'     => sfcCode(sfcVal($data, 'qd_strWithdrawal')),
        // Número de prórroga desde la óptica de la SFC: se descuenta 1 solo si
        // el caso pasó por una prórroga aplicada (qd_SSHTTPSP4 === '200').
        'prorroga_queja'          => sfcProrrogaQueja($data),
        'admision'                => sfcCode(sfcVal($data, 'qd_strAdmission')),
        'documentacion_rta_final' => sfcToBoolSI(sfcVal($data, 'qd_strIncludesReplyAttach')),
        'anexo_queja'             => sfcToBoolSI(sfcVal($data, 'qd_strFinalReplyAttach')),
        'fecha_cierre'            => sfcFechaIso(sfcVal($data, 'qd_strClosureDate')),
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
// Operaciones
// =============================================================================

/** Momento 3 — gestión/cierre (PUT /api/queja/{codigo}/) vía CORE. */
function opMomento3(array $data): array
{
    // Entramos al paso de cierre: limpiamos el resultado del anexo del contexto
    // para no atribuirle a este paso el 201 del anexo si login/firma fallan.
    sfcDiag([
        'paso'           => 'momento3',
        'endpoint'       => null,
        'payload'        => null,
        'payload_origen' => null,
        'http_code'      => null,
        'curl_error'     => null,
        'raw'            => null,
    ]);

    // La config (urls, tipo_entidad, entidad_cod, fraud_macros) viene del CORE
    // sin exponer el token. El login + firma del body + PUT los hace el CORE.
    $dicCfg = sfcCoreConfig();

    // Regla del payload: se genera SIEMPRE el body desde los campos del caso y se
    // compara con lo que traiga la variable qd_strPayloadSent. Si el contenido
    // difiere, el analista lo editó en SCR-004 y manda su versión; si coincide
    // (o la variable está vacía / rota), se envía el generado.
    $dicGenerado = buildBodyMomento3($data, $dicCfg);
    $dicEditado  = sfcPayloadEditado($data);
    $blnCorregido = $dicEditado !== null && !sfcMismoJson($dicEditado, $dicGenerado);
    $dicBody      = $blnCorregido ? $dicEditado : $dicGenerado;
    $strOrigen    = $blnCorregido
        ? 'variable qd_strPayloadSent (editada en SCR-004: difiere del body generado)'
        : 'campos del caso (reconstruido por buildBodyMomento3)';

    // El codigo_queja va en el path y también dentro del body: se toma del body
    // para que ambos coincidan aunque el analista lo haya editado. Si el payload
    // corregido no lo trae, se calcula y se inserta primero (mismo orden de
    // claves que buildBodyMomento3, porque los campos de fraude van al final).
    if (!isset($dicBody['codigo_queja']) || (string) $dicBody['codigo_queja'] === '') {
        $dicBody = array_merge(['codigo_queja' => sfcCodigoQueja($data, $dicCfg)], $dicBody);
    }
    $strCodigo = (string) $dicBody['codigo_queja'];

    // path_suffix = "{codigo}/" sobre la URL QUEJA que el CORE ya conoce.
    $strPathSuffix = rawurlencode($strCodigo) . '/';
    $strUrlLog     = (string) ($dicCfg['urls']['QUEJA'] ?? '') . $strPathSuffix;

    sfcDiag([
        'endpoint'       => 'PUT ' . $strUrlLog,
        'payload'        => $dicBody,
        'payload_origen' => $strOrigen,
    ]);

    // El CORE firma el body (PUT) + adjunta Bearer + HTTP.
    $dicRes = sfcCoreRequest('PUT', 'QUEJA', $strPathSuffix, $dicBody);

    sfcDiag([
        'http_code'  => $dicRes['http_code'] ?? null,
        'curl_error' => (isset($dicRes['error']) && is_string($dicRes['error'])) ? $dicRes['error'] : null,
        'raw'        => (isset($dicRes['raw']) && is_string($dicRes['raw']) && $dicRes['raw'] !== '')
            ? $dicRes['raw']
            : json_encode($dicRes['response'] ?? null),
    ]);

    return [
        'operacion'      => 'momento3',
        'payload_origen' => $strOrigen,
        'http_code'      => $dicRes['http_code'] ?? null,
        'response'       => $dicRes['response'] ?? null,
    ];
}

/**
 * Subir anexo del Momento 3 (multipart POST /api/storage/).
 * Toda la mecánica vive en el CORE (operacion="storage"); aquí solo delegamos
 * y re-etiquetamos la operación para el retorno.
 */
function opMomento3Attachments(array $data): array
{
    // Descriptor legible del anexo: el binario y el multipart viven en el CORE,
    // así que lo que registramos como "payload enviado" es su descripción.
    sfcDiag([
        'paso'           => 'momento3_attachments',
        'endpoint'       => 'POST /api/storage/ (delegado al CORE)',
        'payload'        => [
            'operacion'           => 'storage',
            'attachment_filename' => sfcVal($data, 'pdf_filename'),
            'attachment_file_id'  => sfcVal($data, 'qd_strFinalReplyPdf'),
            'qd_strBpmCaseId'     => sfcVal($data, 'qd_strBpmCaseId'),
        ],
        'payload_origen' => null,
        'http_code'      => null,
        'curl_error'     => null,
        'raw'            => null,
    ]);

    $dicRes = sfcCoreStorage(sfcPayloadAnexoCore($data));

    if (is_array($dicRes)) {
        $dicRes['operacion'] = 'momento3_attachments';
        // El CORE puede devolver la URL real que usó; si viene, prevalece.
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

    return $dicRes;
}

/**
 * Momento 3 completo: anexo y luego cierre, cada uno reintentable por separado.
 *
 *   · Si qd_blnM3AttachDone ya venía en true, el anexo se OMITE (el archivo ya
 *     está en la SFC) y se va directo al cierre.
 *   · Si el anexo falla, el cierre no se ejecuta y el error reportado es el del
 *     anexo (payload/endpoint/respuesta del POST /api/storage/).
 *   · Si el anexo pasa y falla el cierre, el error reportado es el del cierre y
 *     qd_blnM3AttachDone queda en true para que el reintento no repita el anexo.
 *
 * qd_SSHTTPSP3 / qd_SSHTTPSP3_message reflejan siempre la ÚLTIMA respuesta
 * real recibida de la API (la de momento3 si llegó a ejecutarse; si no, la
 * del anexo), para que PM4 pueda mostrar el código/mensaje más reciente sin
 * importar en qué paso terminó el flujo.
 */
function opMomento3Completo(array $data): array
{
    // ── Paso 1 · anexo (se salta si un intento anterior ya lo subió) ─────────
    $blnAnexoPrevio = sfcEsVerdadero(sfcVal($data, 'qd_blnM3AttachDone'));

    if ($blnAnexoPrevio) {
        $dicAttachments = [
            'operacion' => 'momento3_attachments',
            'omitido'   => true,
            'motivo'    => 'El anexo ya se subió en un intento anterior (qd_blnM3AttachDone); se va directo al cierre.',
        ];
        $blnAnexoOk = true;
    } else {
        $dicAttachments = opMomento3Attachments($data);
        $intAnexoCode   = isset($dicAttachments['http_code']) ? (int) $dicAttachments['http_code'] : 0;
        $blnAnexoOk     = $intAnexoCode >= 200 && $intAnexoCode < 300;
    }

    // ── Paso 2 · cierre ─────────────────────────────────────────────────────
    $dicMomento3 = $blnAnexoOk
        ? opMomento3($data)
        : [
            'operacion' => 'momento3',
            'omitido'   => true,
            'motivo'    => 'El anexo no respondió 2xx; no se ejecuta momento3.',
        ];

    // La "última respuesta real" es la del cierre si se ejecutó; si no, la del anexo.
    $dicUltimo = $blnAnexoOk ? $dicMomento3 : $dicAttachments;

    $dicMomento3['attachments']          = $dicAttachments;
    $dicMomento3['anexo_omitido']        = $blnAnexoPrevio;
    $dicMomento3['qd_SSHTTPSP3']         = isset($dicUltimo['http_code']) ? (string) $dicUltimo['http_code'] : null;
    $dicMomento3['qd_SSHTTPSP3_message'] = sfcMensajeRespuesta($dicUltimo['response'] ?? null);

    // ¿Terminó bien el paso que realmente se ejecutó al final?
    $intUltimoCode = isset($dicUltimo['http_code']) ? (int) $dicUltimo['http_code'] : 0;
    $blnFinalOk    = $intUltimoCode >= 200 && $intUltimoCode < 300;
    $dicMomento3['ok']    = $blnFinalOk;
    $dicMomento3['error'] = !$blnFinalOk;

    if ($blnFinalOk) {
        // Cierre aceptado: dejamos el caso limpio para una eventual ejecución
        // futura de M3 (anexo incluido) y cerramos el ciclo de corrección.
        // qd_strPayloadSent se vacía para que un payload viejo no se reenvíe
        // como "editado" en una ejecución posterior.
        $dicMomento3['qd_strM3FailedStep']        = '';
        $dicMomento3['qd_blnM3AttachDone']        = false;
        $dicMomento3['qd_strPayloadAdjustNeeded'] = 'NO';
        $dicMomento3['qd_strPayloadSent']         = '';
        // Cierre logrado: la queja queda en estado 4 (cerrada), coherente con
        // el estado_cod = 4 que se envió en el body.
        $dicMomento3['qd_strComplaintStatus']     = (string) CIERRE_ESTADO_COD;
    } else {
        // Estado del reintento + detalle técnico del paso que falló (SCR-004).
        $dicMomento3['qd_strM3FailedStep'] = $blnAnexoOk ? 'CIERRE' : 'ATTACHMENTS';
        $dicMomento3['qd_blnM3AttachDone'] = $blnAnexoOk;
        $dicMomento3 = array_merge(
            $dicMomento3,
            sfcCamposErrorTecnico($data, $dicMomento3['qd_SSHTTPSP3_message'])
        );
    }

    return $dicMomento3;
}

// =============================================================================
// DISPATCHER — momento3_attachments (si falta) + momento3 encadenados
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
        $dicSalida = opMomento3Completo($data);
        $dicSalida['_sfc_respons_logs'] = $_sfc_respons_logs;
        return $dicSalida;
    } catch (\Throwable $excError) {
        // Excepción (CORE caído, login/firma sin respuesta válida, anexo fallido):
        // el detalle técnico se arma con lo último que quedó en el contexto de
        // diagnóstico más el mensaje de la excepción.
        $dicCampos = sfcCamposErrorTecnico($data, $excError->getMessage(), $excError->getMessage());
        $strPaso   = sfcPasoFallido();

        return array_merge([
            'operacion'            => 'momento3',
            'ok'                   => false,
            'error'                => true,
            'message'              => $excError->getMessage(),
            // Si alcanzamos a recibir un HTTP antes de la excepción, lo conservamos.
            'qd_SSHTTPSP3'         => $dicCampos['qd_strHttpCode'] !== '' ? $dicCampos['qd_strHttpCode'] : null,
            'qd_SSHTTPSP3_message' => $excError->getMessage(),
            // Si la excepción ocurrió ya en el cierre, el anexo había pasado.
            'qd_strM3FailedStep'   => $strPaso,
            'qd_blnM3AttachDone'   => $strPaso === 'CIERRE',
            '_sfc_respons_logs'    => $_sfc_respons_logs,
        ], $dicCampos);
    }
}
