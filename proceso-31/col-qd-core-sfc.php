<?php
/**
 * =============================================================================
 * SFC Smart Supervisión — CORE (variables de entorno + Login + Firma)
 * ProcessMaker 4 (Script Task, ejecutor PHP).
 * =============================================================================
 *
 * Único script que conoce el SECRET y las credenciales, y ÚNICO que habla con
 * la SFC por HTTP. Los demás scripts de momento lo invocan con
 * $api->scripts()->executeScript(<ID_CORE>, ...) para:
 *   - operacion = "login"   -> devuelve el access token (+ config no sensible).
 *   - operacion = "firmar"  -> firma un body (JSON) o una URL y devuelve la firma.
 *   - operacion = "request" -> login + firma + llamada HTTP a la SFC (genérica).
 *   - operacion = "storage" -> sube un anexo (multipart) a /api/storage/.
 *   - operacion = "config"  -> devuelve la config pública.
 *
 * Entradas ($data):
 *   operacion : "login" | "firmar" | "request" | "storage" | "config"
 *   tipo      : (firmar) "body" | "url"
 *   contenido : (firmar) el body como objeto/array  |  la URL como string
 *
 * Salidas:
 *   login   -> { access, firma, http_code, response, config }
 *   firmar  -> { firma, body_firma_json? }
 *   request -> { operacion, metodo, url, firma, body_firma_json?, http_code, response }
 *   config  -> { config }
 *
 * TODAS las salidas incluyen además _sfc_respons_logs: bitácora ACUMULATIVA de
 * las respuestas de la SFC. Cada invocación del CORE PRECARGA las entradas que
 * el llamador le reenvía en $data['_sfc_respons_logs'] y AGREGA las de esta
 * ejecución, de modo que la bitácora crece llamada a llamada en lugar de
 * sobrescribirse (ver el bloque de precarga en el dispatcher).
 *
 * -----------------------------------------------------------------------------
 * PRIVACIDAD / DATOS SENSIBLES EN LA BITÁCORA Y LAS SALIDAS
 * -----------------------------------------------------------------------------
 * La bitácora y las salidas NO deben filtrar secretos cuando todo salió bien.
 * Regla (ver sfcEsOk / sfcRedactarLog / campos condicionados en el dispatcher):
 *   - Si la llamada fue EXITOSA (HTTP 2xx y sin error de transporte):
 *       * En _sfc_respons_logs se OMITE el cuerpo con tokens (login): response
 *         y raw se sustituyen por un marcador "[omitido: respuesta OK]".
 *       * En la salida de nivel superior NO se devuelven firma, body_firma_json,
 *         bearer, access, headers_out ni headers_in.
 *   - Si la llamada FALLÓ (HTTP != 2xx o error de red):
 *       * Se conserva TODO el detalle (response, raw, firma, headers, ...) porque
 *         es justo lo que se necesita para diagnosticar en SCR-004.
 * Esto no altera ninguna lógica: la firma y el HTTP se calculan igual; solo se
 * filtra QUÉ se registra y QUÉ se devuelve.
 *
 * La firma replica Python json.dumps(obj, ensure_ascii=False) byte-por-byte.
 *
 * CONFIGURACIÓN — reemplazar por variables de entorno:
 *   APP_ENV (QA|PROD), SFC_SECRET_KEY_QA/_PROD, SFC_USER_QA/_PROD, SFC_PASS_QA/_PROD
 */

// =============================================================================
// 1) CONFIGURACIÓN  (constantes al inicio; reemplazar por env vars)
// =============================================================================

$APP_ENV = strtoupper(getenv('APP_ENV') ?: 'QA');

$SFC_SECRET_KEY = [
    'QA'   => getenv('SFC_SECRET_KEY_QA')   ?: '<<SFC_SECRET_KEY_QA>>',
    'PROD' => getenv('SFC_SECRET_KEY_PROD') ?: '<<SFC_SECRET_KEY_PROD>>',
];

$SFC_CREDENTIALS = [
    'QA'   => [
        'username' => getenv('SFC_USER_QA') ?: '<<SFC_USER_QA>>',
        'password' => getenv('SFC_PASS_QA') ?: '<<SFC_PASS_QA>>',
    ],
    'PROD' => [
        'username' => getenv('SFC_USER_PROD') ?: '<<SFC_USER_PROD>>',
        'password' => getenv('SFC_PASS_PROD') ?: '<<SFC_PASS_PROD>>',
    ],
];

$SFC_URLS = [
    'QA' => [
        'LOGIN'         => 'https://qasmart.superfinanciera.gov.co/api/login/',
        'QUEJA'         => 'https://qasmart.superfinanciera.gov.co/api/queja/',
        'STORAGE'       => 'https://qasmart.superfinanciera.gov.co/api/storage/',
        'USERS'         => 'https://qasmart.superfinanciera.gov.co/api/usuarios/info/',
        'USERS_ACK'     => 'https://qasmart.superfinanciera.gov.co/api/usuarios/ack/',
        'COMPLAINT_ACK' => 'https://qasmart.superfinanciera.gov.co/api/complaint/ack/',
    ],
    'PROD' => [
        'LOGIN'         => 'https://smart.superfinanciera.gov.co/api/login/',
        'QUEJA'         => 'https://smart.superfinanciera.gov.co/api/queja/',
        'STORAGE'       => 'https://smart.superfinanciera.gov.co/api/storage/',
        'USERS'         => 'https://smart.superfinanciera.gov.co/api/usuarios/info/',
        'USERS_ACK'     => 'https://smart.superfinanciera.gov.co/api/usuarios/ack/',
        'COMPLAINT_ACK' => 'https://smart.superfinanciera.gov.co/api/complaint/ack/',
    ],
];

// Constantes de entidad (Zurich). Se exponen en la config para que los scripts
// de momento compongan codigo_queja y armen el body M2.
$SFC_TIPO_ENTIDAD = 13;    // int
$SFC_ENTIDAD_COD  = '9';   // string

// Macro-motivos que obligan a incluir los campos de fraude en Momento 3.
$SFC_FRAUD_MACROS = ['144', '104', '114', '203', '206', '215', '302', '354'];

// -----------------------------------------------------------------------------
// CONFIGURACIÓN ProcessMaker 4  (destino de la ingesta)
// -----------------------------------------------------------------------------
// Por cada queja capturada en Momento 1 se inicia un caso nuevo del proceso
// COL - QD (Quejas Directas), con el MISMO endpoint que usa la pantalla
// SCR-000 (radicación web):  POST /process_events/{process_id}?event={event_id}.
//
//   - PM4_BASE_URL : instancia PM4 (sin barra final).
//   - API_TOKEN    : Bearer token de un usuario/servicio con permiso para iniciar
//                    el proceso. El Script Task NO tiene token ambiente, hay que
//                    proveerlo por variable de entorno (o pegarlo aquí en dev).
//   - PM4_PROCESS_ID / PM4_EVENT_ID: proceso y nodo de arranque web (los mismos
//                    que SCR000_WEB_ENTRY_PROCESS_ID / _EVENT_ID del frontend: 31 / node_661).
//   - PM4_CREATE_CASES: interruptor global. Si es false, Momento 1 solo captura y
//                    devuelve las quejas SIN crear casos (útil para depurar el mapeo).
$PM4_BASE_URL     = rtrim(getenv('HOST_URL') ?: 'https://cozurich.dev.cloud.processmaker.net/', '/');
$PM4_API_BASE     = '/api/1.0';
$API_TOKEN        = getenv('API_TOKEN') ?: '<<API_TOKEN>>';
$PM4_PROCESS_ID   = (int) (getenv('PM4_PROCESS_ID') ?: 31);
$PM4_EVENT_ID     = getenv('PM4_EVENT_ID') ?: 'node_661';

$strCreateEnv = getenv('PM4_CREATE_CASES');
if ($strCreateEnv !== false && $strCreateEnv !== '') {
    $PM4_CREATE_CASES = in_array(strtolower(trim($strCreateEnv)), ['1', 'true', 'on', 'yes', 'si', 'sí'], true);
} else {
    $PM4_CREATE_CASES = true; // por defecto: capturar Y crear casos
}

// -----------------------------------------------------------------------------
// LOG DE RESPUESTAS SFC  (ACUMULATIVO entre llamadas al CORE)
// -----------------------------------------------------------------------------
// Acumulador global: cada respuesta de la SFC se registra aquí con fecha/hora,
// método, URL, código HTTP y cuerpo de la respuesta, a modo de bitácora
// profesional. Se puebla automáticamente en sfcHttp() (único punto por donde
// pasan TODAS las peticiones a la SFC) y se devuelve en cada salida del CORE.
//
// ACUMULACIÓN: la PRIMERA vez que se invoca el CORE, esta variable NO llega en
// $data y la bitácora arranca vacía. A partir de ahí, el llamador reenvía el
// _sfc_respons_logs que recibió y el dispatcher lo PRECARGA aquí (ver el bloque
// de precarga tras normalizar $data), de forma que las entradas nuevas se
// AGREGAN a las anteriores en lugar de sobrescribirlas.
//
// PRIVACIDAD: en respuestas EXITOSAS se redacta el cuerpo que trae tokens
// (login) para no filtrar secretos; en respuestas con error se conserva todo
// (ver sfcRedactarLog). No cambia la lógica, solo lo que se registra.
$_sfc_respons_logs = [];


// =============================================================================
// 2) HELPERS DE FIRMA + HTTP
// =============================================================================

/** Devuelve $data[$strKey] o null si no existe. */
function sfcVal(array $data, string $strKey)
{
    return array_key_exists($strKey, $data) ? $data[$strKey] : null;
}

/**
 * Normaliza a array de entradas la bitácora que el llamador reenvía en $data.
 * Acepta array PHP, string JSON o objeto (stdClass). Cualquier otra cosa (o un
 * JSON que no decodifica a lista) se descarta y se devuelve [] para no romper
 * la acumulación. Es el punto que permite que la bitácora sea acumulativa.
 */
function sfcNormalizarLogsPrevios($genLogs): array
{
    if (is_string($genLogs) && trim($genLogs) !== '') {
        $genLogs = json_decode($genLogs, true);
    } elseif (is_object($genLogs)) {
        $genLogs = json_decode(json_encode($genLogs), true);
    }
    if (!is_array($genLogs)) {
        return [];
    }
    // Solo conservamos los elementos que son entradas de log (arrays); así un
    // objeto asociativo mal formado no contamina la bitácora.
    $lstEntradas = [];
    foreach ($genLogs as $genEntry) {
        if (is_array($genEntry)) {
            $lstEntradas[] = $genEntry;
        }
    }
    return $lstEntradas;
}

/**
 * ¿La respuesta HTTP fue exitosa? (2xx y sin error de transporte).
 * Es el interruptor que decide si se redactan o se conservan los datos
 * sensibles, tanto en la bitácora como en las salidas del CORE.
 */
function sfcEsOk(array $dicRes): bool
{
    $intCode = isset($dicRes['http_code']) ? (int) $dicRes['http_code'] : 0;
    $blnSinError = empty($dicRes['error']);
    return $blnSinError && $intCode >= 200 && $intCode < 300;
}

/**
 * ¿El cuerpo (decodificado o crudo) contiene tokens de sesión? Se usa para
 * redactar la respuesta del login en la bitácora aunque venga por una URL
 * distinta a la esperada.
 */
function sfcTieneTokens($genResponse, $strRaw): bool
{
    if (is_array($genResponse)) {
        if (array_key_exists('access', $genResponse) || array_key_exists('refresh', $genResponse)) {
            return true;
        }
    }
    if (is_string($strRaw) && $strRaw !== '') {
        if (strpos($strRaw, '"access"') !== false || strpos($strRaw, '"refresh"') !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Filtra una entrada de bitácora para no filtrar secretos.
 * Regla: si la llamada fue OK y su cuerpo trae tokens (login), se sustituye
 * response/raw por un marcador; el resto (timestamp, método, url, http_code,
 * ok) se conserva. Si la llamada FALLÓ, se devuelve intacta para diagnóstico.
 */
function sfcRedactarLog(array $dicEntry): array
{
    $blnOk = !empty($dicEntry['ok']);
    if ($blnOk && sfcTieneTokens($dicEntry['response'] ?? null, $dicEntry['raw'] ?? null)) {
        $dicEntry['response'] = '[omitido: login OK — tokens no registrados]';
        $dicEntry['raw']      = '[omitido: login OK — tokens no registrados]';
    }
    return $dicEntry;
}

/**
 * Registra una interacción con la SFC en la bitácora global $_sfc_respons_logs.
 * NO altera ninguna lógica: solo observa la respuesta y la acumula con su
 * marca de tiempo. Cada entrada es un registro de log autocontenido. Antes de
 * guardar aplica sfcRedactarLog para no filtrar tokens en llamadas exitosas.
 */
function sfcLog(string $strMethod, string $strUrl, array $dicRes): void
{
    global $_sfc_respons_logs;

    $intHttpCode = $dicRes['http_code'] ?? null;
    $dicEntry = [
        'timestamp' => date('Y-m-d\TH:i:sP'),                 // ISO-8601 con zona horaria
        'metodo'    => strtoupper($strMethod),
        'url'       => $strUrl,
        'http_code' => $intHttpCode,
        'ok'        => $intHttpCode !== null && $intHttpCode >= 200 && $intHttpCode < 300 && empty($dicRes['error']),
        'error'     => $dicRes['error'] ?? null,
        'response'  => $dicRes['response'] ?? null,
        'raw'       => $dicRes['raw'] ?? null,
    ];

    $_sfc_respons_logs[] = sfcRedactarLog($dicEntry);
}

/** Resuelve la configuración efectiva para el APP_ENV actual. */
function sfcResolverConfig(): array
{
    global $APP_ENV, $SFC_SECRET_KEY, $SFC_CREDENTIALS, $SFC_URLS,
           $SFC_TIPO_ENTIDAD, $SFC_ENTIDAD_COD, $SFC_FRAUD_MACROS,
           $PM4_BASE_URL, $PM4_API_BASE, $API_TOKEN, $PM4_PROCESS_ID,
           $PM4_EVENT_ID, $PM4_CREATE_CASES;

    $strEnv = strtoupper($APP_ENV);
    if (!isset($SFC_URLS[$strEnv])) {
        throw new RuntimeException("APP_ENV inválido: '{$strEnv}'. Use QA o PROD.");
    }

    // Validamos que el secret esté configurado (no el placeholder)
    $strSecret = $SFC_SECRET_KEY[$strEnv] ?? '';
    if ($strSecret === '' || strpos($strSecret, '<<') === 0) {
        throw new RuntimeException("Secret key no configurada para {$strEnv} (SFC_SECRET_KEY_{$strEnv}).");
    }

    return [
        'env'          => $strEnv,
        'secret'       => $strSecret,
        'creds'        => $SFC_CREDENTIALS[$strEnv],
        'urls'         => $SFC_URLS[$strEnv],
        'tipo_entidad' => $SFC_TIPO_ENTIDAD,
        'entidad_cod'  => $SFC_ENTIDAD_COD,
        'fraud_macros' => $SFC_FRAUD_MACROS,
        // Destino ProcessMaker 4 para la ingesta de Momento 1.
        'pm4'          => [
            'base_url'     => $PM4_BASE_URL,
            'api_base'     => $PM4_API_BASE,
            'api_token'    => $API_TOKEN,
            'process_id'   => $PM4_PROCESS_ID,
            'event_id'     => $PM4_EVENT_ID,
            'create_cases' => $PM4_CREATE_CASES,
        ],
    ];
}

/** Config pública (sin secret ni credenciales) que consumen los scripts de momento. */
function sfcConfigPublica(array $dicCfg): array
{
    return [
        'env'          => $dicCfg['env'],
        'urls'         => $dicCfg['urls'],
        'tipo_entidad' => $dicCfg['tipo_entidad'],
        'entidad_cod'  => $dicCfg['entidad_cod'],
        'fraud_macros' => $dicCfg['fraud_macros'],
        // Destino PM4 (base, token, proceso/evento y switch) para que Momento 1
        // cree los casos sin volver a leer variables de entorno.
        'pm4'          => $dicCfg['pm4'],
    ];
}

/** HMAC-SHA256 en hex MAYÚSCULAS. */
function generarFirma(string $strSecretKey, string $strValor): string
{
    return strtoupper(hash_hmac('sha256', $strValor, $strSecretKey));
}

/**
 * Serializa a JSON EXACTAMENTE como Python json.dumps(obj, ensure_ascii=False):
 * espacio tras cada `,` y `:`, unicode literal, sin escapar `/`, preservando el
 * orden de las claves. Un solo espacio de diferencia invalida la firma.
 */
function pythonJsonEncode($genValue): string
{
    if (is_array($genValue)) {
        // Detectamos si el array es lista (índices 0..n) u objeto asociativo
        $blnIsList = ($genValue === []) ? true : (array_keys($genValue) === range(0, count($genValue) - 1));

        if ($blnIsList) {
            $lstParts = [];
            foreach ($genValue as $genItem) {
                $lstParts[] = pythonJsonEncode($genItem);
            }
            return '[' . implode(', ', $lstParts) . ']';
        }

        $lstParts = [];
        foreach ($genValue as $strKey => $genItem) {
            $strKeyJson = json_encode((string) $strKey, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $lstParts[] = $strKeyJson . ': ' . pythonJsonEncode($genItem);
        }
        return '{' . implode(', ', $lstParts) . '}';
    }

    return json_encode($genValue, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/** Firma un body (POST/PUT): devuelve firma + cadena firmada. */
function firmarBody(string $strSecret, array $dicBody): array
{
    $strJson = pythonJsonEncode($dicBody);
    return [
        'firma'           => generarFirma($strSecret, $strJson),
        'body_firma_json' => $strJson,
    ];
}

/** Firma una URL (GET/DELETE). */
function firmarUrl(string $strSecret, string $strUrl): string
{
    return generarFirma($strSecret, $strUrl);
}

/**
 * Ejecuta una petición HTTP y devuelve la respuesta decodificada.
 * $genBody: string (JSON o multipart crudo) o null.
 */
function sfcHttp(string $strMethod, string $strUrl, array $lstHeaders, $genBody = null): array
{
    $objCh   = curl_init($strUrl);
    $strVerb = strtoupper($strMethod);
    curl_setopt($objCh, CURLOPT_RETURNTRANSFER, true);
    // CURLOPT_POST activa la lógica interna de cURL para POST; CURLOPT_CUSTOMREQUEST
    // la desactiva y sirve para PUT/GET/DELETE.
    if ($strVerb === 'POST') {
        curl_setopt($objCh, CURLOPT_POST, true);
    } else {
        curl_setopt($objCh, CURLOPT_CUSTOMREQUEST, $strVerb);
    }
    if ($genBody !== null) {
        curl_setopt($objCh, CURLOPT_POSTFIELDS, $genBody);
    }
    curl_setopt($objCh, CURLOPT_HTTPHEADER, $lstHeaders);
    curl_setopt($objCh, CURLOPT_HEADER, true);
    curl_setopt($objCh, CURLINFO_HEADER_OUT, true);

    $strRawFull   = curl_exec($objCh);
    $intHttpCode  = (int) curl_getinfo($objCh, CURLINFO_HTTP_CODE);
    $strError     = curl_error($objCh);
    $strHeaderOut = (string) curl_getinfo($objCh, CURLINFO_HEADER_OUT);
    $intHeaderLen = (int) curl_getinfo($objCh, CURLINFO_HEADER_SIZE);
    curl_close($objCh);

    $strRaw      = is_string($strRawFull) ? substr($strRawFull, $intHeaderLen) : '';
    $strHeaderIn = is_string($strRawFull) ? substr($strRawFull, 0, $intHeaderLen) : '';

    $genDecoded = json_decode($strRaw, true);

    $dicRes = [
        'http_code'   => $intHttpCode,
        'error'       => $strError !== '' ? $strError : null,
        'raw'         => $strRaw,
        'response'    => $genDecoded !== null ? $genDecoded : $strRaw,
        'headers_out' => $strHeaderOut,
        'headers_in'  => $strHeaderIn,
    ];

    // Bitácora: registramos TODA respuesta de la SFC en el log global.
    sfcLog($strVerb, $strUrl, $dicRes);

    return $dicRes;
}

/** Cabeceras estándar para un POST/PUT JSON firmado. */
function sfcJsonHeaders(?string $strBearer, string $strFirma, int $intContentLength): array
{
    $lstHeaders = [];
    if ($strBearer !== null && $strBearer !== '') {
        $lstHeaders[] = 'Authorization: Bearer ' . $strBearer;
    }
    $lstHeaders[] = 'X-SFC-Signature: ' . $strFirma;
    $lstHeaders[] = 'Content-Type: application/json';
    $lstHeaders[] = 'Content-Length: ' . $intContentLength;
    return $lstHeaders;
}


// =============================================================================
// 3) LOGIN  (genera el access token)
// =============================================================================

function loginAccessKey(array $dicCfg): array
{
    // Armamos el cuerpo de credenciales y lo firmamos
    $dicBody  = [
        'username' => $dicCfg['creds']['username'],
        'password' => $dicCfg['creds']['password'],
    ];
    $dicFirma = firmarBody($dicCfg['secret'], $dicBody);

    $lstHeaders = sfcJsonHeaders(null, $dicFirma['firma'], strlen($dicFirma['body_firma_json']));
    $dicRes     = sfcHttp('POST', $dicCfg['urls']['LOGIN'], $lstHeaders, $dicFirma['body_firma_json']);

    // Extraemos el access token de la respuesta
    $strAccess = null;
    if (is_array($dicRes['response']) && isset($dicRes['response']['access'])) {
        $strAccess = $dicRes['response']['access'];
    }

    return ['access' => $strAccess, 'firma' => $dicFirma['firma'], 'http' => $dicRes];
}


// =============================================================================
// 3.0) REQUEST GENÉRICA  — login + firma + llamada HTTP a la SFC
// =============================================================================
//
// Punto ÚNICO por el que los scripts de momento (M2/M3, prórroga, cierre, etc.)
// llaman a cualquier endpoint JSON de la SFC. Así ningún otro script vuelve a
// abrir cURL contra la Superfinanciera: todo el tráfico (y por tanto todo el
// log _sfc_respons_logs) pasa por aquí.
//
// Entradas ($data):
//   metodo      : "GET" | "POST" | "PUT" | "DELETE"  (def. POST)
//   url_key     : clave de $SFC_URLS (ej. "QUEJA", "USERS", "COMPLAINT_ACK").
//   url         : URL absoluta (alternativa a url_key; url_key tiene prioridad).
//   path_suffix : se concatena a la URL base (ej. "139<numero>/" para /queja/{codigo}/).
//   contenido   : body como objeto/array o string JSON (para POST/PUT).
//   con_auth    : bool, si adjunta Authorization: Bearer (def. true).
//
// La firma se calcula así (igual que el resto del sistema):
//   - POST/PUT  -> firmarBody sobre el body normalizado (json estilo Python).
//   - GET/DELETE-> firmarUrl sobre la URL final (base + path_suffix).
//
// PRIVACIDAD: la salida incluye firma/body_firma_json/bearer/headers solo si la
// llamada FALLÓ (para diagnóstico). Si fue OK, esos campos van redactados/omitidos
// (ver el filtro al final de la función). El HTTP y la firma se calculan igual.
function opRequest(array $data, array $dicCfg): array
{
    $strMetodo = strtoupper((string) (sfcVal($data, 'metodo') ?: 'POST'));
    if (!in_array($strMetodo, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
        throw new RuntimeException("request: método no soportado '{$strMetodo}'. Use GET|POST|PUT|DELETE.");
    }

    // Resolvemos la URL base: por clave del catálogo o absoluta.
    $strUrlKey = (string) (sfcVal($data, 'url_key') ?: '');
    $strUrl    = (string) (sfcVal($data, 'url') ?: '');
    if ($strUrlKey !== '') {
        if (!isset($dicCfg['urls'][$strUrlKey])) {
            throw new RuntimeException("request: url_key desconocida '{$strUrlKey}'.");
        }
        $strUrl = $dicCfg['urls'][$strUrlKey];
    }
    if ($strUrl === '') {
        throw new RuntimeException("request: falta 'url_key' o 'url'.");
    }

    // Sufijo de path (ej. el codigo_queja para PUT /api/queja/{codigo}/).
    $strSuffix = (string) (sfcVal($data, 'path_suffix') ?: '');
    if ($strSuffix !== '') {
        $strUrl .= $strSuffix;
    }

    // ¿Adjuntamos bearer? (login) — por defecto sí.
    $genConAuth = sfcVal($data, 'con_auth');
    $blnConAuth = ($genConAuth === null) ? true : (bool) $genConAuth;
    $strBearer  = null;
    if ($blnConAuth) {
        $dicLogin  = loginAccessKey($dicCfg);
        $strBearer = $dicLogin['access'];
    }

    // Normalizamos el body si viene como string JSON u objeto.
    $genContenido = sfcVal($data, 'contenido');
    if (is_string($genContenido)) {
        $genDec = json_decode($genContenido, true);
        $genContenido = ($genDec !== null) ? $genDec : $genContenido;
    } elseif (is_object($genContenido)) {
        $genContenido = json_decode(json_encode($genContenido), true);
    }

    $strFirma       = '';
    $strBodyFirma   = null;
    $genBodyEnviar  = null;

    if ($strMetodo === 'GET' || $strMetodo === 'DELETE') {
        // Firma sobre la URL final.
        $strFirma   = firmarUrl($dicCfg['secret'], $strUrl);
        $lstHeaders = [];
        if ($strBearer !== null && $strBearer !== '') {
            $lstHeaders[] = 'Authorization: Bearer ' . $strBearer;
        }
        $lstHeaders[] = 'X-SFC-Signature: ' . $strFirma;
        $lstHeaders[] = 'Accept: application/json';
    } else {
        // POST/PUT: firma sobre el body.
        if (!is_array($genContenido)) {
            throw new RuntimeException("request: 'contenido' debe ser el body (objeto) para {$strMetodo}.");
        }
        $dicFirma      = firmarBody($dicCfg['secret'], $genContenido);
        $strFirma      = $dicFirma['firma'];
        $strBodyFirma  = $dicFirma['body_firma_json'];
        $genBodyEnviar = $strBodyFirma;
        $lstHeaders    = sfcJsonHeaders($strBearer, $strFirma, strlen($strBodyFirma));
    }

    // La llamada HTTP: sfcHttp registra la respuesta en $_sfc_respons_logs.
    $dicRes = sfcHttp($strMetodo, $strUrl, $lstHeaders, $genBodyEnviar);

    $blnOk = sfcEsOk($dicRes);

    $dicSalida = [
        'operacion' => 'request',
        'metodo'    => $strMetodo,
        'url'       => $strUrl,
        'http_code' => $dicRes['http_code'],
        'response'  => $dicRes['response'],
        'error'     => $dicRes['error'],
    ];

    // Datos sensibles / de diagnóstico: solo si la llamada FALLÓ. En OK se
    // omiten para no filtrar bearer, firma ni cabeceras con Authorization.
    if (!$blnOk) {
        $dicSalida['bearer']          = $strBearer;
        $dicSalida['firma']           = $strFirma;
        $dicSalida['body_firma_json'] = $strBodyFirma;
        $dicSalida['raw']             = $dicRes['raw'];
        $dicSalida['headers_out']     = $dicRes['headers_out'] ?? null;
        $dicSalida['headers_in']      = $dicRes['headers_in'] ?? null;
    }

    return $dicSalida;
}


// =============================================================================
// 3.1) ANEXOS (multipart)  — toda la lógica del adjunto vive aquí para que
//      M2 y M3 no la dupliquen. Se invoca con operacion="storage".
// =============================================================================

/** Extensión (minúsculas) de un nombre de archivo, o null. */
function sfcExtension($genFileName)
{
    if (!is_string($genFileName) || $genFileName === '') {
        return null;
    }
    $strExt = pathinfo($genFileName, PATHINFO_EXTENSION);
    return $strExt !== '' ? strtolower($strExt) : null;
}

/** codigo_queja compuesto = tipo_entidad + entidad_cod + numero de queja (bpm). */
function sfcCodigoQueja(array $data, array $dicCfg): string
{
    $strNumero = (string) sfcVal($data, 'qd_strBpmCaseId');
    return (string) $dicCfg['tipo_entidad'] . (string) $dicCfg['entidad_cod'] . $strNumero;
}

/** MIME según extensión del nombre; por defecto application/pdf. */
function sfcMimePorNombre(string $strFileName): string
{
    $strExt = strtolower(pathinfo($strFileName, PATHINFO_EXTENSION));
    $dicMap = [
        'pdf'  => 'application/pdf',
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls'  => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
    ];
    return $dicMap[$strExt] ?? 'application/pdf';
}

/**
 * Descarga el contenido de un file de ProcessMaker por su ID, usando la API 1.0.
 * URL base en env HOST_URL y bearer en env API_TOKEN. Devuelve los bytes.
 *   GET {HOST_URL}/api/1.0/files/{id}/contents
 */
function sfcDescargarFilePM(string $strFileId): string
{
    $strHost = rtrim((string) getenv('HOST_URL'), '/');
    if ($strHost === '') {
        throw new RuntimeException('HOST_URL no está definida (URL base de ProcessMaker).');
    }
    $strToken = (string) getenv('API_TOKEN');
    if ($strToken === '') {
        throw new RuntimeException('API_TOKEN no está definida (token de ProcessMaker).');
    }

    $strUrl = $strHost . '/api/1.0/files/' . rawurlencode($strFileId) . '/contents';
    $objCh  = curl_init($strUrl);
    curl_setopt($objCh, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($objCh, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($objCh, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $strToken,
        'Accept: */*',
    ]);
    $strBin  = curl_exec($objCh);
    $intCode = (int) curl_getinfo($objCh, CURLINFO_HTTP_CODE);
    $strErr  = curl_error($objCh);
    curl_close($objCh);

    if (!is_string($strBin) || $strBin === '' || $intCode >= 400) {
        throw new RuntimeException("No se pudo descargar el file {$strFileId} de PM (HTTP {$intCode}) {$strErr}");
    }
    return $strBin;
}

/**
 * Resuelve el binario del anexo. Devuelve ['bin' => <bytes>, 'diag' => [...]]
 * o null si no hay archivo.
 *
 * Contrato GENÉRICO del CORE (momento-agnóstico; cada script de momento mapea
 * sus propios campos qd_* a estas dos claves antes de llamar operacion="storage"):
 *   - attachment_filename : nombre del archivo (para tipo/mime).
 *   - attachment_file_id  : ID del file en PM4 (RECOMENDADO, se descarga vía API 1.0).
 *
 * Origen del archivo (en orden de preferencia):
 *   1) $data['attachment_file_id'] — ID del file en PM4 (RECOMENDADO).
 *   2) $data['attachment_base64']  — contenido del file en base64.
 *   3) $data['attachment_path'] como URL http(s): se descarga en memoria.
 *   4) $data['attachment_path'] como ruta LOCAL existente en disco.
 */
function sfcResolverArchivo(array $data)
{
    $strFileName = (string) (sfcVal($data, 'attachment_filename') ?: 'anexo.pdf');

    $fnEmpaquetar = function (string $strBin, string $strOrigen) use ($strFileName) {
        $strHead = substr($strBin, 0, 8);
        return [
            'bin'  => $strBin,
            'diag' => [
                'origen'    => $strOrigen,
                'bytes'     => strlen($strBin),
                'es_pdf'    => (substr($strBin, 0, 5) === '%PDF-'),
                'magic_hex' => bin2hex($strHead),
                'mime'      => sfcMimePorNombre($strFileName),
            ],
        ];
    };

    // 1) ID de file en PM4: lo descargamos por la API de ProcessMaker
    $genFileId = sfcVal($data, 'attachment_file_id');
    if ($genFileId !== null && (string) $genFileId !== '') {
        $strBin = sfcDescargarFilePM((string) $genFileId);
        return $fnEmpaquetar($strBin, 'pm_file_id');
    }

    // 2) Base64 (lo que entrega PM4 al leer el file del caso)
    $genB64 = sfcVal($data, 'attachment_base64');
    if (is_string($genB64) && trim($genB64) !== '') {
        $strB64 = preg_replace('#^data:[^;]+;base64,#', '', trim($genB64));
        $strBin = base64_decode($strB64, true);
        if ($strBin === false) {
            throw new RuntimeException('attachment_base64 no es base64 válido.');
        }
        return $fnEmpaquetar($strBin, 'base64');
    }

    $strPath = sfcVal($data, 'attachment_path');

    // 3) URL http(s): descargamos en memoria (sin temporal)
    if (is_string($strPath) && preg_match('#^https?://#i', $strPath)) {
        $objCh = curl_init($strPath);
        curl_setopt($objCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($objCh, CURLOPT_FOLLOWLOCATION, true);
        $strBin  = curl_exec($objCh);
        $intCode = (int) curl_getinfo($objCh, CURLINFO_HTTP_CODE);
        curl_close($objCh);
        if (!is_string($strBin) || $strBin === '' || $intCode >= 400) {
            throw new RuntimeException("No se pudo descargar attachment_path (HTTP {$intCode}).");
        }
        return $fnEmpaquetar($strBin, 'url');
    }

    // 4) Ruta local existente
    if (is_string($strPath) && $strPath !== '' && file_exists($strPath)) {
        $strBin = file_get_contents($strPath);
        if ($strBin === false) {
            throw new RuntimeException("No se pudo leer attachment_path: {$strPath}");
        }
        return $fnEmpaquetar($strBin, 'ruta_local');
    }

    return null;
}

/**
 * Arma el cuerpo multipart/form-data A MANO (boundary propio) para garantizar
 * Content-Type/Content-Length correctos en el runtime de PM4.
 */
function sfcMultipartBody(array $dicCampos, string $strFileField, string $strFileName, string $strFileMime, string $strFileBin): array
{
    $strBoundary = '----SFCBoundary' . bin2hex(random_bytes(16));
    $strEol      = "\r\n";
    $strBody     = '';

    foreach ($dicCampos as $strKey => $strValue) {
        $strBody .= '--' . $strBoundary . $strEol;
        $strBody .= 'Content-Disposition: form-data; name="' . $strKey . '"' . $strEol . $strEol;
        $strBody .= $strValue . $strEol;
    }

    $strBody .= '--' . $strBoundary . $strEol;
    $strBody .= 'Content-Disposition: form-data; name="' . $strFileField . '"; filename="' . $strFileName . '"' . $strEol;
    $strBody .= 'Content-Type: ' . $strFileMime . $strEol . $strEol;
    $strBody .= $strFileBin . $strEol;

    $strBody .= '--' . $strBoundary . '--' . $strEol;

    return [
        'body'         => $strBody,
        'content_type' => 'multipart/form-data; boundary=' . $strBoundary,
    ];
}

/**
 * Cadena a firmar del anexo (codigo_queja + type). Seleccionable vía
 * qd_strSignatureFormat para probar formatos sin editar código:
 *   json         {"codigo_queja": "X", "type": "Y"}   (formato Python)  [default]
 *   json_compact {"codigo_queja":"X","type":"Y"}
 *   concat       XY
 *   concat_pipe  X|Y
 *   querystring  codigo_queja=X&type=Y
 */
function sfcCadenaFirmaAttachment(array $dicBody, string $strFormato): string
{
    $strCodigo = (string) $dicBody['codigo_queja'];
    $strType   = (string) $dicBody['type'];

    switch ($strFormato) {
        case 'json_compact':
            return '{"codigo_queja":"' . $strCodigo . '","type":"' . $strType . '"}';
        case 'concat':
            return $strCodigo . $strType;
        case 'concat_pipe':
            return $strCodigo . '|' . $strType;
        case 'querystring':
            return 'codigo_queja=' . $strCodigo . '&type=' . $strType;
        case 'json':
        default:
            return pythonJsonEncode($dicBody);
    }
}

/**
 * Anexo (multipart) — la firma usa solo codigo_queja + type (omite file).
 * ORDEN: codigo_queja primero, type después (orden canónico del doc SFC).
 * 'type' se puede forzar con qd_strAttachmentType; si no, cae a la extensión
 * de attachment_filename (contrato genérico del CORE).
 */
function buildBodyAttachment(array $data, array $dicCfg): array
{
    $genTypeOverride = sfcVal($data, 'qd_strAttachmentType');
    $strType = (is_string($genTypeOverride) && trim($genTypeOverride) !== '')
        ? trim($genTypeOverride)
        : sfcExtension(sfcVal($data, 'attachment_filename'));

    return [
        'codigo_queja' => sfcCodigoQueja($data, $dicCfg),
        'type'         => $strType,
    ];
}

/**
 * Sube el anexo a /api/storage/ (multipart). Login + firma + descarga del
 * binario + POST ocurren TODO aquí, de modo que el binario nunca cruza el
 * borde executeScript y M2/M3 solo delegan. Devuelve el resultado completo.
 *
 * PRIVACIDAD: bearer/firma/body_firma_json/headers solo se devuelven si la
 * subida FALLÓ (diagnóstico). En OK se omiten para no filtrar el token.
 */
function opStorage(array $data, array $dicCfg): array
{
    $dicLogin = loginAccessKey($dicCfg);
    $dicBody  = buildBodyAttachment($data, $dicCfg);

    // Formato de firma seleccionable; default 'json'.
    $strFormatoFirma = (string) (sfcVal($data, 'qd_strSignatureFormat') ?: 'json');
    $strCadenaFirma  = sfcCadenaFirmaAttachment($dicBody, $strFormatoFirma);
    $strFirma        = generarFirma($dicCfg['secret'], $strCadenaFirma);

    $dicArchivo = sfcResolverArchivo($data);
    if ($dicArchivo === null) {
        throw new RuntimeException('No se encontró ningún archivo para adjuntar (attachment_file_id/attachment_base64/attachment_path).');
    }

    $strFileName = (string) (sfcVal($data, 'attachment_filename') ?: 'anexo.pdf');
    $strFileMime = sfcMimePorNombre($strFileName);

    $dicMultipart = sfcMultipartBody(
        [
            'codigo_queja' => (string) $dicBody['codigo_queja'],
            'type'         => (string) $dicBody['type'],
        ],
        'file',
        $strFileName,
        $strFileMime,
        $dicArchivo['bin']
    );

    $lstHeaders = [
        'Authorization: Bearer ' . $dicLogin['access'],
        'X-SFC-Signature: ' . $strFirma,
        'Content-Type: ' . $dicMultipart['content_type'],
        'Content-Length: ' . strlen($dicMultipart['body']),
    ];
    $dicRes = sfcHttp('POST', $dicCfg['urls']['STORAGE'], $lstHeaders, $dicMultipart['body']);

    $blnOk = sfcEsOk($dicRes);

    $dicSalida = [
        'operacion'      => 'storage',
        'formato_firma'  => $strFormatoFirma,
        'file_adjuntado' => true,
        'file_diag'      => $dicArchivo['diag'] ?? null,
        'http_code'      => $dicRes['http_code'],
        'response'       => $dicRes['response'],
    ];

    // Datos sensibles / de diagnóstico: solo si la subida FALLÓ.
    if (!$blnOk) {
        $dicSalida['bearer']          = $dicLogin['access'];
        $dicSalida['firma']           = $strFirma;
        $dicSalida['body_firma_json'] = $strCadenaFirma;
        $dicSalida['error']           = $dicRes['error'] ?? null;
        $dicSalida['raw']             = $dicRes['raw'] ?? null;
        $dicSalida['headers_out']     = $dicRes['headers_out'] ?? null;
        $dicSalida['headers_in']      = $dicRes['headers_in'] ?? null;
    }

    return $dicSalida;
}


// =============================================================================
// 4) DISPATCHER  — login | firmar | request | config | storage
// =============================================================================

// El CORE se invoca vía executeScript; PM4 puede entregar el payload como string
// JSON, objeto (stdClass) o anidado bajo la clave 'data'. Lo normalizamos a un
// arreglo asociativo con 'operacion' al primer nivel.
if (isset($data)) {
    if (is_string($data)) {
        $data = json_decode($data, true);
    } elseif (is_object($data)) {
        $data = json_decode(json_encode($data), true);
    }
    if (is_array($data) && !isset($data['operacion']) && isset($data['data'])) {
        $genInner = $data['data'];
        if (is_string($genInner)) {
            $genInner = json_decode($genInner, true);
        } elseif (is_object($genInner)) {
            $genInner = json_decode(json_encode($genInner), true);
        }
        if (is_array($genInner)) {
            // Conservamos la bitácora que pudiera venir al primer nivel (fuera de
            // 'data') para no perderla al desanidar: la propagamos al $data
            // efectivo si el interior no trae la suya.
            if (!isset($genInner['_sfc_respons_logs']) && isset($data['_sfc_respons_logs'])) {
                $genInner['_sfc_respons_logs'] = $data['_sfc_respons_logs'];
            }
            $data = $genInner;
        }
    }
}

// -----------------------------------------------------------------------------
// PRECARGA DE LA BITÁCORA ACUMULATIVA
// -----------------------------------------------------------------------------
// La PRIMERA vez que se llama al CORE, $data['_sfc_respons_logs'] no existe y la
// bitácora arranca vacía. En las llamadas siguientes el llamador reenvía el
// _sfc_respons_logs que recibió: lo precargamos aquí para que sfcLog() AGREGUE
// las respuestas de esta ejecución a las anteriores (en vez de sobrescribir).
if (isset($data) && is_array($data) && isset($data['_sfc_respons_logs'])) {
    $_sfc_respons_logs = sfcNormalizarLogsPrevios($data['_sfc_respons_logs']);
}

if (isset($data) && is_array($data)) {
    // Exponemos la bitácora global de respuestas SFC en el ámbito del dispatcher
    // para adjuntarla a cada salida del CORE.
    global $_sfc_respons_logs;

    $strOp = '';
    try {
        $dicCfg = sfcResolverConfig();
        $strOp  = strtolower((string) sfcVal($data, 'operacion'));

        switch ($strOp) {

            case 'login':
                $dicLogin  = loginAccessKey($dicCfg);
                $blnOkLogin = sfcEsOk($dicLogin['http']);
                $dicSalida = [
                    'http_code'         => $dicLogin['http']['http_code'],
                    'config'            => sfcConfigPublica($dicCfg),
                    '_sfc_respons_logs' => $_sfc_respons_logs,
                ];
                // El access token y la firma solo se devuelven cuando el login
                // falla (diagnóstico). En OK, quien necesita autenticarse usa
                // operacion="request", que hace su propio login internamente.
                if ($blnOkLogin) {
                    $dicSalida['ok']       = true;
                    // response redactado: no exponemos access/refresh en OK.
                    $dicSalida['response'] = '[omitido: login OK — tokens no expuestos]';
                } else {
                    $dicSalida['ok']       = false;
                    $dicSalida['access']   = $dicLogin['access'];
                    $dicSalida['firma']    = $dicLogin['firma'];
                    $dicSalida['response'] = $dicLogin['http']['response'];
                }
                return $dicSalida;

            case 'firmar':
                $strTipo      = strtolower((string) sfcVal($data, 'tipo'));
                $genContenido = sfcVal($data, 'contenido');

                if ($strTipo === 'url') {
                    return [
                        'firma'             => firmarUrl($dicCfg['secret'], (string) $genContenido),
                        '_sfc_respons_logs' => $_sfc_respons_logs,
                    ];
                }
                // Por defecto firmamos un body; normalizamos por si llega como
                // string JSON u objeto (stdClass) desde el script de momento.
                if (is_string($genContenido)) {
                    $genContenido = json_decode($genContenido, true);
                } elseif (is_object($genContenido)) {
                    $genContenido = json_decode(json_encode($genContenido), true);
                }
                if (!is_array($genContenido)) {
                    throw new RuntimeException("firmar: 'contenido' debe ser el body (objeto) para tipo=body.");
                }
                $dicFirma = firmarBody($dicCfg['secret'], $genContenido);
                return [
                    'firma'             => $dicFirma['firma'],
                    'body_firma_json'   => $dicFirma['body_firma_json'],
                    '_sfc_respons_logs' => $_sfc_respons_logs,
                ];

            case 'request':
                $dicRequest = opRequest($data, $dicCfg);
                $dicRequest['_sfc_respons_logs'] = $_sfc_respons_logs;
                return $dicRequest;

            case 'storage':
                $dicStorage = opStorage($data, $dicCfg);
                $dicStorage['_sfc_respons_logs'] = $_sfc_respons_logs;
                return $dicStorage;

            case 'config':
                return [
                    'config'            => sfcConfigPublica($dicCfg),
                    '_sfc_respons_logs' => $_sfc_respons_logs,
                ];

            case 'debug':
                // Muestra qué credenciales lee ESTE script (sin exponer valores completos)
                return [
                    'env'               => $dicCfg['env'],
                    'user'              => $dicCfg['creds']['username'],
                    'pass_len'          => strlen((string) $dicCfg['creds']['password']),
                    'secret_len'        => strlen((string) $dicCfg['secret']),
                    'secret_md5'        => md5((string) $dicCfg['secret']),
                    '_sfc_respons_logs' => $_sfc_respons_logs,
                ];

            default:
                // Mostramos las claves recibidas para diagnosticar cómo entrega la data PM4
                $strKeys = is_array($data) ? implode(', ', array_keys($data)) : gettype($data);
                throw new RuntimeException("Operación no soportada por el core: '{$strOp}'. Claves recibidas: [{$strKeys}]. Use login|firmar|request|config|storage.");
        }
    } catch (\Throwable $excError) {
        return [
            'operacion'         => $strOp,
            'error'             => true,
            'message'           => $excError->getMessage(),
            '_sfc_respons_logs' => $_sfc_respons_logs,
        ];
    }
}
