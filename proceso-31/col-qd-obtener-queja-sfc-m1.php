<?php
/**
 * =============================================================================
 * SFC Smart Supervisión — MOMENTO 1 (capturar quejas) + ACK
 * ProcessMaker 4 (Script Task, ejecutor PHP).
 * =============================================================================
 *
 * Este script ES el Momento 1: si no llega 'operacion' asume 'momento1'.
 *
 * Operaciones ($data['operacion']):
 *   (vacío)  -> momento1 (por defecto, este script ya sabe que es el Momento 1)
 *   momento1 -> GET  /api/queja/            · captura de quejas
 *   ack      -> POST /api/complaint/ack/    · {pqrs:[codigo]}  · (caso aparte)
 *
 * ACCESO A LA SFC CENTRALIZADO EN EL CORE: M1 ya NO hace login,
 * firma ni cURL contra la SFC. Las dos llamadas a la SFC (GET /api/queja/ y
 * POST /api/complaint/ack/) van por el CORE con operacion="request" (login +
 * firma + HTTP allá); el token de login nunca cruza el borde executeScript.
 * Esto es obligatorio desde que el CORE redacta el 'access' en login OK: los
 * scripts que hacían login local se quedaban con Bearer null → 401.
 *
 * OJO: la creación de casos en PM4 (crearCasoPm4 / colecciones) es OTRA cosa —
 * usa el token de PM4 ($API_TOKEN) y su propio sfcHttp local, que se conserva.
 *
 * PORTABILIDAD: el CORE y las colecciones QD_COLL NO se referencian por su id
 * numérico (cambia al migrar de instancia), sino por su UUID nativo. Los ids
 * reales se resuelven en runtime — resolveScriptId() para el CORE (idéntica al
 * script 77 COL_QD_Check_SLA_Expire) y resolveCollectionId() para las
 * colecciones — y se cachean en proceso. Los ids numéricos que quedan en
 * QD_COLL/CORE_SCRIPT_FALLBACK son solo el último recurso si la resolución
 * dinámica no encuentra nada.
 *
 * -----------------------------------------------------------------------------
 * BITÁCORA ACUMULATIVA (_sfc_respons_logs) — EL CORE ES LA FUENTE ÚNICA
 * -----------------------------------------------------------------------------
 * El CORE es acumulativo: precarga el _sfc_respons_logs que le llega en
 * $data y le AGREGA las respuestas de su propia ejecución. Para aprovecharlo sin
 * duplicar, M1 REENVÍA su acumulador al CORE en cada llamada (sfcCallScript) y,
 * cuando el CORE responde, ADOPTA la bitácora devuelta tal cual (previo + nuevo)
 * en lugar de concatenar de este lado. Así las llamadas al CORE de una misma
 * ejecución (config, request GET, ack) encadenan la misma bitácora, y si el
 * caso le pasa a M1 un _sfc_respons_logs previo, también se conserva y crece.
 */

// UUID estable del script CORE (COL - QD - Core SFC) — no cambia entre instancias.
const CORE_SCRIPT_UUID     = 'a2560610-9409-4931-bcc7-172aa91f56a9';
// Título de respaldo por si el UUID no estuviera (p.ej. CORE recreado a mano).
const CORE_SCRIPT_TITLE    = 'COL - QD - Core SFC';
// Último recurso: id conocido en la instancia de referencia (PM4_BASE_URL actual).
const CORE_SCRIPT_FALLBACK = 84;

/**
 * Resuelve el ID actual de un script por su UUID (estable entre instancias),
 * con fallback al título. Cachea el resultado en proceso. Idéntica a
 * resolveScriptId() del script 77 (COL_QD_Check_SLA_Expire).
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

// -----------------------------------------------------------------------------
// Destino ProcessMaker 4 — la configuración vive en el CORE (sección 'pm4').
// opMomento1() la trae vía executeScript y la vuelca en estos globals con
// sfcAplicarConfigPm4() antes de crear casos. NO se editan aquí.
// -----------------------------------------------------------------------------
$PM4_BASE_URL     = '';
$PM4_API_BASE     = '/api/1.0';
$API_TOKEN        = '';
$PM4_PROCESS_ID   = '';
$PM4_EVENT_ID     = '';
$PM4_CREATE_CASES = true;

// Bitácora acumulada de todas las llamadas al CORE en esta ejecución.
$_sfc_respons_logs = [];

// =============================================================================
// Cliente del CORE (login + firma + HTTP a la SFC viven en el CORE)
// =============================================================================

/** Llama a otro script de PM4 y devuelve su salida decodificada. */
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

/** Pide al CORE SOLO la config pública (sin login a la SFC). */
function sfcCoreConfig(): array
{
    global $SFC_CORE_SCRIPT_ID;
    $dicOut = sfcCallScript($SFC_CORE_SCRIPT_ID, ['operacion' => 'config']);
    return is_array($dicOut) && isset($dicOut['config']) ? $dicOut['config'] : [];
}

/**
 * Llamada HTTP a la SFC vía CORE (operacion="request"). El CORE hace login +
 * firma (URL para GET/DELETE, body para POST/PUT) + HTTP y devuelve
 * http_code/response (+ _sfc_respons_logs). Único punto por el que M1 toca la
 * red de la SFC: ya no se hace login/firma/cURL local contra la SFC.
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

/**
 * Vuelca la sección 'pm4' de la config del CORE en los globals que consume
 * crearCasoPm4(). Centraliza el destino PM4 en un solo lugar (el CORE).
 */
function sfcAplicarConfigPm4(array $dicCfg): void
{
    global $PM4_BASE_URL, $PM4_API_BASE, $API_TOKEN, $PM4_PROCESS_ID,
           $PM4_EVENT_ID, $PM4_CREATE_CASES;

    $dicPm4 = (isset($dicCfg['pm4']) && is_array($dicCfg['pm4'])) ? $dicCfg['pm4'] : [];

    $PM4_BASE_URL     = rtrim((string) ($dicPm4['base_url'] ?? ''), '/');
    $PM4_API_BASE     = (string) ($dicPm4['api_base'] ?? '/api/1.0');
    $API_TOKEN        = (string) ($dicPm4['api_token'] ?? '');
    $PM4_PROCESS_ID   = $dicPm4['process_id'] ?? '';
    $PM4_EVENT_ID     = (string) ($dicPm4['event_id'] ?? '');
    $PM4_CREATE_CASES = (bool) ($dicPm4['create_cases'] ?? true);
}

// =============================================================================
// Helpers locales (datos + HTTP a PM4)
// =============================================================================

/** Devuelve $data[$strKey] o null si no existe. */
function sfcVal(array $data, string $strKey)
{
    return array_key_exists($strKey, $data) ? $data[$strKey] : null;
}

/** codigo_queja compuesto = tipo_entidad + entidad_cod + numero de queja (bpm). */
function sfcCodigoQueja(array $data, array $dicCfg): string
{
    $strNumero = (string) sfcVal($data, 'qd_strBpmCaseId');
    return (string) $dicCfg['tipo_entidad'] . (string) $dicCfg['entidad_cod'] . $strNumero;
}

/**
 * Ejecuta una petición HTTP y devuelve la respuesta decodificada.
 * USADO SOLO PARA PM4 (creación de casos + lectura de colecciones), con el
 * token de PM4. La SFC ya NO se llama por aquí (va por el CORE).
 */
function sfcHttp(string $strMethod, string $strUrl, array $lstHeaders, $genBody = null): array
{
    $objCh = curl_init($strUrl);
    curl_setopt($objCh, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($objCh, CURLOPT_CUSTOMREQUEST, strtoupper($strMethod));
    if ($genBody !== null) {
        curl_setopt($objCh, CURLOPT_POSTFIELDS, $genBody);
    }
    curl_setopt($objCh, CURLOPT_HTTPHEADER, $lstHeaders);

    $strRaw      = curl_exec($objCh);
    $intHttpCode = (int) curl_getinfo($objCh, CURLINFO_HTTP_CODE);
    $strError    = curl_error($objCh);
    curl_close($objCh);

    $genDecoded = json_decode(is_string($strRaw) ? $strRaw : '', true);

    return [
        'http_code' => $intHttpCode,
        'error'     => $strError !== '' ? $strError : null,
        'raw'       => is_string($strRaw) ? $strRaw : '',
        'response'  => $genDecoded !== null ? $genDecoded : $strRaw,
    ];
}

// =============================================================================
// Builders
// =============================================================================

/** ACK de queja — {pqrs: [codigo_queja]} (array, máx 100). */
function buildBodyAck(array $data, array $dicCfg): array
{
    return ['pqrs' => [sfcCodigoQueja($data, $dicCfg)]];
}

// =============================================================================
// 5) MOCK DE RESULTADOS SFC  (dos quejas de ejemplo para ejercitar la ingesta)
// =============================================================================

/**
 * Construye un "results" MOCK con la estructura EXACTA de la documentación
 * (Momento 1: campos tipo_entidad..queja_expres). Dos registros de ejemplo,
 * uno persona natural y otro persona jurídica, con valores plausibles para
 * ejercitar el mapeo hacia ProcessMaker.
 */
function sfcMockResultados(): array
{
    // Los códigos usan valores REALES de los catálogos del proceso (CATALOGOS v2)
    // para que la ingesta produzca payloads aceptados por PM4:
    //   · producto_cod    → cat-producto-sfc (101=Autos, 104=Copropiedades)
    //   · macro_motivo_cod→ cat-motivo-sfc   (116=No atención del siniestro, 133=No prestación del servicio)
    //   · tipo_id_CF      → cat-tipo-id      (3=Cédula de Ciudadanía, 7=NIT)
    //   · tipo_persona    → cat-tipo-persona (1=Natural, 2=Jurídica)
    //   · departamento_cod / municipio_cod: van tal cual al payload (passthrough).
    //     OJO: el mock trae DANE (08 / 08758). Si PM4 espera otro código en esos
    //     campos, ajusta aquí los valores del mock — ya no hay traducción intermedia.
    return [
        'count'        => 2,
        'pages'        => 1,
        'current_page' => 1,
        'next'         => null,
        'previous'     => null,
        'results'      => [
            [
                'tipo_entidad'       => 13,
                'entidad_cod'        => 423,
                'fecha_creacion'     => '2026-07-20T09:15:30',
                'codigo_queja'       => 'QJ-2026-000001',
                'codigo_pais'        => '170',
                'departamento_cod'   => '08',
                'municipio_cod'      => '08758',
                'nombres'            => 'Juan Pérez Gómez',
                'tipo_id_CF'         => 3,      // Cédula de Ciudadanía (CC)
                'numero_id_CF'       => '1020304050',
                'telefono'           => '3001234567',
                'correo'             => 'juan.perez@example.com',
                'direccion'          => 'Calle 100 # 15-20 Apto 301, Soledad',
                'tipo_persona'       => 1,      // Natural
                'sexo'               => 0,      // No informa → No Aplica
                'lgbtiq'             => 0,      // No
                'canal_cod'          => 1,      // Internet
                'condicion_especial' => 0,      // No aplica
                'producto_cod'       => 101,    // Autos
                'producto_nombre'    => 'Autos',
                'macro_motivo_cod'   => 116,    // No atención del siniestro
                'texto_queja'        => 'El cliente reporta que la aseguradora no ha atendido el siniestro de su vehículo reportado hace tres semanas.',
                'anexo_queja'        => true,
                'tutela'             => 0,
                'ente_control'       => 0,
                'escalamiento_DCF'   => 0,
                'replica'            => 0,
                'argumento_replica'  => '',
                'desistimiento_queja' => 0,
                'queja_expres'       => 2,
            ],
            /*[
                'tipo_entidad'       => 1,
                'entidad_cod'        => 423,
                'fecha_creacion'     => '2026-07-22T14:48:05',
                'codigo_queja'       => 'QJ-2026-000002',
                'codigo_pais'        => '170',
                'departamento_cod'   => '08',
                'municipio_cod'      => '08001',
                'nombres'            => 'Comercializadora Andina S.A.S.',
                'tipo_id_CF'         => 7,      // NIT
                'numero_id_CF'       => '900123456',
                'telefono'           => '6024567890',
                'correo'             => 'contacto@andina.com',
                'direccion'          => 'Av. 6N # 25-30 Oficina 12, Barranquilla',
                'tipo_persona'       => 2,      // Jurídica
                'sexo'               => 0,      // No informa → No Aplica
                'lgbtiq'             => 0,      // No
                'canal_cod'          => 1,      // Internet
                'condicion_especial' => 0,      // No aplica
                'producto_cod'       => 104,    // Copropiedades
                'producto_nombre'    => 'Copropiedades',
                'macro_motivo_cod'   => 133,    // No prestación del servicio
                'texto_queja'        => 'La entidad no ha prestado el servicio contratado en la póliza de copropiedades pese a los requerimientos enviados.',
                'anexo_queja'        => false,
                'tutela'             => 0,
                'ente_control'       => 0,
                'escalamiento_DCF'   => 0,
                'replica'            => 0,
                'argumento_replica'  => '',
                'desistimiento_queja' => 0,
                'queja_expres'       => 0,
            ],*/
        ],
    ];
}

// =============================================================================
// 6) MAPEO SFC → PM4  (traducción de cada queja al payload qd_* del proceso)
// =============================================================================
//
// PASSTHROUGH DE CÓDIGOS: los códigos de catálogo que llegan en la queja se
// copian TAL CUAL al payload qd_*. Se asume que el llamado real de la SFC ya
// entrega los códigos en el formato que espera PM4, por lo que NO se hace
// ninguna tabla de equivalencia. (Los datos MOCK deben usar códigos válidos.)
//
// Lo único que este mapeo transforma son cuestiones ESTRUCTURALES, no catálogos:
//   - Persona natural (tipo_persona=1): `nombres` se parte en nombre/apellido.
//   - Persona jurídica (tipo_persona=2): `nombres` va a razón social.
//   - Flags 0/1 → 'SI'/'NO' donde el campo PM4 es Sí/No de texto.
//   - Constantes de origen (tipo de solicitud, rol, instancia de recepción).

/**
 * Convierte UNA queja SFC (un elemento de results[]) en el payload qd_* que
 * espera el proceso PM4. Devuelve el array de datos listo para POST.
 */
function sfcQuejaToPm4Payload(array $dicQueja): array
{
    $intTipoPersona = (int) ($dicQueja['tipo_persona'] ?? 1);
    $blnJuridica    = ($intTipoPersona === 2);
    $strNombres     = trim((string) ($dicQueja['nombres'] ?? ''));

    // Partición de nombre para persona natural: primer token = nombre, resto = apellidos.
    $strFirstName = '';
    $strLastName  = '';
    if (!$blnJuridica && $strNombres !== '') {
        $lstPartes    = preg_split('/\s+/', $strNombres);
        $strFirstName = array_shift($lstPartes) ?: '';
        $strLastName  = implode(' ', $lstPartes);
    }

    return [
        // ── S1 · Clasificación (origen SFC) ──────────────────────────────────
        'qd_strRequestType'        => '3',                 // "Queja" (cat-tipo-sol: 3=Queja).
        'qd_strFilerRole'          => '1',                 // "Cliente" (cat-rol-radicador: 1=Cliente).
        'qd_strReceptionInstance'  => '1',                 // "SFC" — la queja llega por la integración SmartSupervision.
        'qd_strChannel'            => (string) ($dicQueja['canal_cod'] ?? ''),

        // ── S2 · Consumidor Financiero ───────────────────────────────────────
        'qd_strIdType'             => (string) ($dicQueja['tipo_id_CF'] ?? ''),
        'qd_strIdNumber'           => (string) ($dicQueja['numero_id_CF'] ?? ''),
        'qd_strPersonType'         => (string) $intTipoPersona,
        'qd_strFirstName'          => $strFirstName,
        'qd_strLastName'           => $strLastName,
        'qd_strCompanyName'        => $blnJuridica ? $strNombres : '',
        'qd_strPhone'              => (string) ($dicQueja['telefono'] ?? ''),
        'qd_strEmail'              => (string) ($dicQueja['correo'] ?? ''),
        'qd_strAddress'            => (string) ($dicQueja['direccion'] ?? ''),
        'qd_strCountryCode'        => (string) ($dicQueja['codigo_pais'] ?? '170'),
        'qd_strDepartment'         => (string) ($dicQueja['departamento_cod'] ?? ''),
        'qd_strCity'               => (string) ($dicQueja['municipio_cod'] ?? ''),
        'qd_strSex'                => (string) ($dicQueja['sexo'] ?? ''),
        'qd_strLgbtiq'             => (string) ($dicQueja['lgbtiq'] ?? ''),
        'qd_strSpecialCondition'   => (string) ($dicQueja['condicion_especial'] ?? ''),

        // ── S3 · Detalle de la queja ─────────────────────────────────────────
        'qd_strSfcProduct'         => (string) ($dicQueja['producto_cod'] ?? ''),
        'qd_strSfcReason'          => (string) ($dicQueja['macro_motivo_cod'] ?? ''),
        'qd_strComplaintText'      => (string) ($dicQueja['texto_queja'] ?? ''),
        'qd_strReply'              => ((int) ($dicQueja['replica'] ?? 0) === 1) ? 'SI' : 'NO',
        'qd_strReplyArgument'      => (string) ($dicQueja['argumento_replica'] ?? ''),
        'qd_strTutela'             => (string) ($dicQueja['tutela'] ?? ''),
        'qd_strControlEntity'      => (string) ($dicQueja['ente_control'] ?? ''),
        'qd_strExpressComplaint'   => (string) ($dicQueja['queja_expres'] ?? ''),
        'qd_strOmbudsmanEscalation' => ((int) ($dicQueja['escalamiento_DCF'] ?? 0) === 1) ? 'SI' : 'NO',
        'qd_strIncludesComplaintAnnex' => !empty($dicQueja['anexo_queja']) ? 'SI' : 'NO',

        // ── Metadata de origen SFC ───────────────────────────────────────────
        'qd_strSfcCode'            => (string) ($dicQueja['codigo_queja'] ?? ''),   // código de la queja en SFC
        'qd_strSfcFilingDate'      => (string) ($dicQueja['fecha_creacion'] ?? ''),
        'qd_strEntityType'         => (string) ($dicQueja['tipo_entidad'] ?? ''),
        'qd_strEntityCode'         => (string) ($dicQueja['entidad_cod'] ?? ''),
        'qd_blnSmartSupervisionCase' => true,   // marca de caso originado en SmartSupervision (M1 directo)
        'qd_intCountSimilarCases'  => 0,       // siempre array vacío al iniciar el caso
        // Escalamiento manual a SAC por reconsideración: siempre false en la ingesta M1.
        // En SCR-000 se deriva (réplica "Sí" + 0 casos similares); aquí la queja llega ya
        // radicada en la SFC y sin chequeo de similares, así que no se marca para SAC.
        // Booleano (no texto), igual que en SCR-000 → CrearRecibirQueja.tsx.
        'qd_strReconsiderationSACEscalation' => false,

        // ── Autorización (radicación automática: ya autorizada en SFC) ───────
        'qd_blnDataAuth'           => true,
        'qd_blnCaptcha'            => true,      // radicación server-to-server, sin captcha humano
    ];
}

// =============================================================================
// 6b) ENRIQUECIMIENTO CON COLECCIONES PM4
//     Resuelve los companion `<campo>_desc` (descripción legible del código) y la
//     Clasificación Regulatoria (momento/servicio + regulatorios) leyendo las MISMAS
//     colecciones que consume SCR-000 / SCR-0051, para que el caso llegue a la
//     pantalla 0051 con los dropdowns y los textos ya poblados.
//     Usa el mismo destino PM4 (base_url + api_token) que crearCasoPm4, ya volcado
//     en los globals por sfcAplicarConfigPm4() antes de la ingesta.
// =============================================================================

// Definición de cada colección QD: [uuid, name, fallbackId, valueField, labelField]
// (dotted-path sobre el record PM4 {id, data:{...}}). Espejo de core/collections.ts
// (GLOBAL_COLLECTIONS), adaptado a resolución dinámica: el id numérico NO se usa
// directo (cambia al migrar de instancia) — se resuelve en runtime vía
// resolveCollectionId() por uuid, con fallback a nombre y, en último caso, al id
// conocido de la instancia de referencia.
const QD_COLL = [
    'idType'            => ['a21de141-8626-4bcb-8f5d-404726aa924d', 'cat-tipo-id', 11, 'data.codigo', 'data.descripcion'],
    'personType'        => ['a21de14a-2850-47ae-9c62-2c24314d46a6', 'cat-tipo-persona', 12, 'data.codigo', 'data.descripcion'],
    'countryCode'       => ['a21de14f-5b31-4d4c-846c-923c72707a34', 'cat-pais', 13, 'data.codigo', 'data.descripcion'],
    'department'        => ['a21de15b-360c-452d-9e35-24abd8cdedb1', 'cat-dpto', 14, 'data.codigo_departamento', 'data.nombre_departamento'],
    'sex'               => ['a21de1ee-f98e-4192-8065-2acec6ed93cc', 'cat-sexo', 23, 'data.codigo', 'data.descripcion'],
    'lgbtiq'            => ['a21de372-8096-4dc1-abd7-e919ec79e00d', 'cat-lgbtiq', 41, 'data.codigo', 'data.descripcion'],
    'specialCondition'  => ['a21de1f5-fb8c-44ed-a576-d9eac8a7be66', 'cat-cond-esp', 24, 'data.codigo', 'data.descripcion'],
    'channel'           => ['a21de139-83bf-4c40-8cc3-eb2091c5b775', 'cat-canal', 10, 'data.codigo', 'data.descripcion'],
    'receptionInstance' => ['a21de1bf-7c35-494c-a28b-b5aef1b6061a', 'cat-instancia', 19, 'data.codigo', 'data.descripcion'],
    'requestType'       => ['a21de1ae-594f-4a15-896e-df64ec4f81a6', 'cat-tipo-sol', 18, 'data.codigo', 'data.descripcion'],
    'filerRole'         => ['a21de29c-eb80-4c91-88b2-b2b676889809', 'cat-rol-radicador', 39, 'data.codigo_rol_radicador', 'data.nombre_rol_radicador'],
    'sfcProduct'        => ['a21de19d-0acc-4229-a084-14956fb2f23e', 'cat-producto-sfc', 16, 'data.codigo_producto_sfc', 'data.nombre_producto_sfc'],
    'sfcReason'         => ['a21de1a5-73ca-467b-9027-4ed1820133c0', 'cat-motivo-sfc', 17, 'data.codigo', 'data.descripcion'],
    'admission'         => ['a21de1e1-f8fb-4edd-a4bf-6afc3136590a', 'cat-admision', 21, 'data.codigo', 'data.descripcion'],
    'controlEntity'     => ['a21de1e8-d6e2-4686-a470-fafcc5aafbe9', 'cat-ente', 22, 'data.codigo', 'data.descripcion'],
    'tutela'            => ['a21de23a-7553-4c6c-ac9e-39f7693521f8', 'cat-tutela', 30, 'data.codigo', 'data.descripcion'],
    'expressComplaint'  => ['a21de253-e37d-464a-81d5-c82636674ef8', 'cat-expres', 32, 'data.codigo', 'data.descripcion'],
    'matrixMotivos'     => ['a23663f3-e045-47ab-8859-30aca6876380', 'cat_matriz_motivos', 45, 'data.codigoMotivoSFC', 'data.motivoSFC'],
];

// Colección de municipios (usada solo por descCity, filtrada por departamento vía PMQL):
// NO está en QD_COLL porque su valueField/labelField dependen del PMQL, no del código plano.
const MUNICIPIO_COLLECTION_UUID     = 'a21de17e-7c60-4d03-91e6-5af9b026de43';
const MUNICIPIO_COLLECTION_NAME     = 'cat-mpio';
const MUNICIPIO_COLLECTION_FALLBACK = 15;

/** trim + lowercase para comparar columnas de la matriz (traen espacios sobrantes). */
function sfcNorm($genVal): string
{
    return strtolower(trim((string) $genVal));
}

/** Baja por un path con puntos ('data.descripcion') sobre un record; '' si no existe. */
function resolvePath(array $dicRec, string $strPath): string
{
    $genAcc = $dicRec;
    foreach (explode('.', $strPath) as $strKey) {
        if (is_array($genAcc) && array_key_exists($strKey, $genAcc)) {
            $genAcc = $genAcc[$strKey];
        } else {
            return '';
        }
    }
    return is_scalar($genAcc) ? (string) $genAcc : '';
}

/**
 * Resuelve el ID actual de una colección por su UUID (estable entre instancias),
 * con fallback a su nombre y, si tampoco aparece, al id conocido de la instancia
 * de referencia. Cachea el resultado en proceso. Mismo criterio que
 * resolveScriptId() del script 77 (COL_QD_Check_SLA_Expire), adaptado a
 * colecciones — usa el mismo canal HTTP que pm4GetCollectionRecords() (curl +
 * $PM4_BASE_URL/$API_TOKEN, ya poblados por sfcAplicarConfigPm4() antes de que
 * se resuelva la primera colección).
 */
function resolveCollectionId(string $uuid, string $name, int $fallback): int
{
    global $PM4_BASE_URL, $PM4_API_BASE, $API_TOKEN;
    static $cache = [];
    $cacheKey = $uuid ?: $name;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    if ($API_TOKEN !== '' && $PM4_BASE_URL !== '') {
        $strUrl = $PM4_BASE_URL . $PM4_API_BASE . '/collections?per_page=500&filter=' . rawurlencode($name);
        $dicRes = sfcHttp('GET', $strUrl, ['Authorization: Bearer ' . $API_TOKEN, 'Accept: application/json']);
        $lstColecciones = (is_array($dicRes['response']) && isset($dicRes['response']['data']) && is_array($dicRes['response']['data']))
            ? $dicRes['response']['data']
            : [];

        // 1º intento: match EXACTO por UUID (fuente de verdad).
        foreach ($lstColecciones as $dicColeccion) {
            if (($dicColeccion['uuid'] ?? null) === $uuid) {
                return $cache[$cacheKey] = (int) $dicColeccion['id'];
            }
        }
        // 2º intento (fallback): match exacto por nombre si el UUID no apareció.
        foreach ($lstColecciones as $dicColeccion) {
            if (($dicColeccion['name'] ?? null) === $name) {
                return $cache[$cacheKey] = (int) $dicColeccion['id'];
            }
        }
    }

    // Último recurso: id conocido de la instancia de referencia.
    error_log("[COL - QD - Obtener Queja SFC - M1] resolveCollectionId: no se resolvió '{$name}' (uuid={$uuid}) dinámicamente; usando fallback id={$fallback}.");
    return $cache[$cacheKey] = $fallback;
}

/** GET /collections/{id}/records?per_page=500[&pmql=...] → array de records ([] si falla). */
function pm4GetCollectionRecords(int $intCollId, ?string $strPmql = null): array
{
    global $PM4_BASE_URL, $PM4_API_BASE, $API_TOKEN;
    if ($API_TOKEN === '' || $PM4_BASE_URL === '') {
        return [];
    }
    $strUrl = $PM4_BASE_URL . $PM4_API_BASE . '/collections/' . $intCollId . '/records?per_page=500';
    if ($strPmql !== null && $strPmql !== '') {
        $strUrl .= '&pmql=' . rawurlencode($strPmql);
    }
    $dicRes = sfcHttp('GET', $strUrl, ['Authorization: Bearer ' . $API_TOKEN, 'Accept: application/json']);
    if (is_array($dicRes['response']) && isset($dicRes['response']['data']) && is_array($dicRes['response']['data'])) {
        return $dicRes['response']['data'];
    }
    return [];
}

/** Records de una colección QD (por nombre), cacheados por ejecución del script. */
function catRecords(string $strName): array
{
    static $dicCache = [];
    if (array_key_exists($strName, $dicCache)) {
        return $dicCache[$strName];
    }
    $dicDef = QD_COLL[$strName] ?? null;
    if (!$dicDef) {
        return $dicCache[$strName] = [];
    }
    $intCollId = resolveCollectionId($dicDef[0], $dicDef[1], $dicDef[2]);
    $dicCache[$strName] = pm4GetCollectionRecords($intCollId);
    return $dicCache[$strName];
}

/** Descripción (label) del código guardado, resuelta contra la colección indicada. */
function descByCat(string $strName, string $strCode): string
{
    $dicDef = QD_COLL[$strName] ?? null;
    if (!$dicDef || $strCode === '') {
        return '';
    }
    foreach (catRecords($strName) as $dicRec) {
        if (resolvePath($dicRec, $dicDef[3]) === $strCode) {
            return resolvePath($dicRec, $dicDef[4]);
        }
    }
    return '';
}

/** Municipio (colección cat-mpio) filtrado por departamento vía PMQL, cacheado por depto. */
function descCity(string $strCityCode, string $strDeptCode): string
{
    static $dicCache = [];
    if ($strCityCode === '' || $strDeptCode === '') {
        return '';
    }
    if (!array_key_exists($strDeptCode, $dicCache)) {
        $intMunicipioId = resolveCollectionId(MUNICIPIO_COLLECTION_UUID, MUNICIPIO_COLLECTION_NAME, MUNICIPIO_COLLECTION_FALLBACK);
        $dicCache[$strDeptCode] = pm4GetCollectionRecords($intMunicipioId, 'data.codigo_departamento = "' . $strDeptCode . '"');
    }
    foreach ($dicCache[$strDeptCode] as $dicRec) {
        if (resolvePath($dicRec, 'data.codigo_municipio') === $strCityCode) {
            return resolvePath($dicRec, 'data.nombre_municipio');
        }
    }
    return '';
}

/**
 * Cascada cat_matriz_motivos (colección 45): a partir del tipo de solicitud + producto
 * (por LABEL) y el motivo (por código SFC), encuentra la fila y devuelve momento,
 * servicio y los regulatorios. Misma lógica de SCR-000/SeccionDetalleQueja pero inversa:
 * en la pantalla el usuario elige momento→servicio→motivo; aquí ya tenemos el motivo y
 * derivamos su momento/servicio. Toma la primera fila que coincide (best-effort).
 */
function derivarClasificacion(string $strRequestLabel, string $strProductLabel, string $strReasonCode): array
{
    if ($strReasonCode === '') {
        return ['found' => false, 'match' => 'ninguna'];
    }

    // La fila se busca en tres pasadas, de la más estricta a la más laxa. Motivo: las
    // columnas tipoSolicitud/productoZurich son TEXTO sucio de la matriz y el label del
    // producto llega de la SFC (`producto_nombre`), así que una diferencia de redacción
    // dejaría sin rolResponsable / sla / resarcimiento / relacionFraude a un caso que sí
    // tiene fila. El código de motivo (codigoMotivoSFC) es la única llave confiable y por
    // eso se exige en todas las pasadas.
    //   1) tipoSolicitud + productoZurich + motivo  → equivalente exacto a SCR-000
    //   2) productoZurich + motivo                  → ignora el tipo de solicitud
    //   3) motivo                                   → último recurso (best-effort)
    $lstRows = catRecords('matrixMotivos');
    foreach (['solicitud+producto+motivo', 'producto+motivo', 'motivo'] as $strEstrategia) {
        foreach ($lstRows as $dicRow) {
            $dicData = isset($dicRow['data']) && is_array($dicRow['data']) ? $dicRow['data'] : $dicRow;

            if ((string) ($dicData['codigoMotivoSFC'] ?? '') !== $strReasonCode) {
                continue;
            }
            if ($strEstrategia !== 'motivo'
                && sfcNorm($dicData['productoZurich'] ?? '') !== sfcNorm($strProductLabel)) {
                continue;
            }
            if ($strEstrategia === 'solicitud+producto+motivo'
                && sfcNorm($dicData['tipoSolicitud'] ?? '') !== sfcNorm($strRequestLabel)) {
                continue;
            }

            return [
                'found'                      => true,
                'match'                      => $strEstrategia,   // qué pasada resolvió la fila
                'interaccion'                => trim((string) ($dicData['interaccion'] ?? '')),
                'servicioPrestado'           => trim((string) ($dicData['servicioPrestado'] ?? '')),
                'motivoSFC'                  => trim((string) ($dicData['motivoSFC'] ?? '')),
                'rolResponsable'             => trim((string) ($dicData['rolResponsable'] ?? '')),
                'escalamientoAdministrador'  => trim((string) ($dicData['escalamientoAdministrador'] ?? '')),
                'resarcimientoAdministrador' => trim((string) ($dicData['resarcimientoAdministrador'] ?? '')),
                'sla'                        => trim((string) ($dicData['sla'] ?? '')),
                'relacionFraude'             => trim((string) ($dicData['relacionFraude'] ?? '')),
            ];
        }
    }
    return ['found' => false, 'match' => 'ninguna'];
}

/**
 * Añade al payload base los companion `_desc`, la Admisión y la Clasificación
 * Regulatoria (momento/servicio + regulatorios). Devuelve el payload enriquecido.
 * $strMatchMatriz (por referencia) sale con la pasada que resolvió la fila de la
 * matriz ('solicitud+producto+motivo' | 'producto+motivo' | 'motivo' | 'ninguna'),
 * para poder diagnosticar desde la salida del script por qué un caso vino vacío.
 */
function enriquecerPayload(array $dicData, array $dicQueja, ?string &$strMatchMatriz = null): array
{
    // ── Companion <campo>_desc (descripción legible que muestran las pantallas M2/M3) ──
    $dicData['qd_strIdType_desc']            = descByCat('idType', $dicData['qd_strIdType']);
    $dicData['qd_strPersonType_desc']        = descByCat('personType', $dicData['qd_strPersonType']);
    $dicData['qd_strCountryCode_desc']       = descByCat('countryCode', $dicData['qd_strCountryCode']);
    $dicData['qd_strDepartment_desc']        = descByCat('department', $dicData['qd_strDepartment']);
    $dicData['qd_strCity_desc']              = descCity($dicData['qd_strCity'], $dicData['qd_strDepartment']);
    $dicData['qd_strSex_desc']               = descByCat('sex', $dicData['qd_strSex']);
    $dicData['qd_strLgbtiq_desc']            = descByCat('lgbtiq', $dicData['qd_strLgbtiq']);
    $dicData['qd_strSpecialCondition_desc']  = descByCat('specialCondition', $dicData['qd_strSpecialCondition']);
    $dicData['qd_strChannel_desc']           = descByCat('channel', $dicData['qd_strChannel']);
    $dicData['qd_strReceptionInstance_desc'] = descByCat('receptionInstance', $dicData['qd_strReceptionInstance']);
    $dicData['qd_strRequestType_desc']       = descByCat('requestType', $dicData['qd_strRequestType']);
    $dicData['qd_strFilerRole_desc']         = descByCat('filerRole', $dicData['qd_strFilerRole']);
    $dicData['qd_strControlEntity_desc']     = descByCat('controlEntity', $dicData['qd_strControlEntity']);
    $dicData['qd_strTutela_desc']            = descByCat('tutela', $dicData['qd_strTutela']);
    $dicData['qd_strExpressComplaint_desc']  = descByCat('expressComplaint', $dicData['qd_strExpressComplaint']);

    // ── Admisión: rol Cliente ⇒ "No aplica" (código 9, CAT-ADMISION) ──
    $dicData['qd_strAdmission']      = '9';
    $dicData['qd_strAdmission_desc'] = descByCat('admission', '9');

    // ── Producto SFC (desc): la queja ya trae producto_nombre (label); desambigua el
    //     código duplicado 104. Fallback al catálogo 16 por código. ──
    $strProductLabel = trim((string) ($dicQueja['producto_nombre'] ?? ''));
    if ($strProductLabel === '') {
        $strProductLabel = descByCat('sfcProduct', $dicData['qd_strSfcProduct']);
    }
    $dicData['qd_strSfcProduct_desc'] = $strProductLabel;

    // ── Clasificación Regulatoria desde cat_matriz_motivos (id 45) ──
    $strRequestLabel = $dicData['qd_strRequestType_desc'] !== '' ? $dicData['qd_strRequestType_desc'] : 'Queja';
    $dicMatrix = derivarClasificacion($strRequestLabel, $strProductLabel, $dicData['qd_strSfcReason']);
    $strMatchMatriz = (string) ($dicMatrix['match'] ?? 'ninguna');

    // Las 7 variables de la matriz se escriben SIEMPRE (con o sin fila) para que el caso
    // llegue a M2/M3 con la clave presente en el request data — nunca ausente. Mismas
    // columnas que el effect de SCR-000/SeccionDetalleQueja.
    if (!empty($dicMatrix['found'])) {
        $dicData['qd_strInteraction']         = $dicMatrix['interaccion'];        // Momento
        $dicData['qd_strServiceProvided']     = $dicMatrix['servicioPrestado'];   // Servicio (si momento = Asistencias)
        $dicData['qd_strResponsableRole']     = $dicMatrix['rolResponsable'];             // rolResponsable
        $dicData['qd_strOmbudsmanEscalation'] = $dicMatrix['escalamientoAdministrador'];  // escalamientoAdministrador
        $dicData['qd_strCompensation']        = $dicMatrix['resarcimientoAdministrador']; // resarcimientoAdministrador
        $dicData['qd_strSlaAssigned']         = $dicMatrix['sla'];                        // sla
        $dicData['qd_strFraudRelated']        = (sfcNorm($dicMatrix['relacionFraude']) === 'si') ? 'SI' : 'NO';
        $dicData['qd_strSfcReason_desc']      = $dicMatrix['motivoSFC'];          // Asunto de la Queja
    } else {
        // Sin fila en la matriz (ni por motivo suelto): momento/servicio y los regulatorios
        // quedan vacíos y el desc del motivo cae al catálogo 17.
        // qd_strOmbudsmanEscalation NO se pisa: conserva el valor que trajo la SFC
        // (escalamiento_DCF → 'SI'/'NO' en sfcQuejaToPm4Payload), que es mejor dato que vacío.
        $dicData['qd_strInteraction']     = '';
        $dicData['qd_strServiceProvided'] = '';
        $dicData['qd_strResponsableRole'] = '';
        $dicData['qd_strCompensation']    = '';
        $dicData['qd_strSlaAssigned']     = '';
        $dicData['qd_strFraudRelated']    = 'NO';
        $dicData['qd_strSfcReason_desc']  = descByCat('sfcReason', $dicData['qd_strSfcReason']);
    }

    return $dicData;
}

// =============================================================================
// 7) CREACIÓN DE CASOS PM4  (POST /process_events/{id}?event=, firmado con Bearer)
// =============================================================================

/**
 * Inicia UN caso del proceso PM4 con el payload dado (web entry), igual que la
 * pantalla SCR-000. Devuelve la respuesta cruda de PM4 + el request_id creado.
 */
function crearCasoPm4(array $dicPayload): array
{
    global $PM4_BASE_URL, $PM4_API_BASE, $API_TOKEN, $PM4_PROCESS_ID, $PM4_EVENT_ID;

    if ($API_TOKEN === '' || strpos($API_TOKEN, '<<') === 0) {
        return ['ok' => false, 'http_code' => 0, 'error' => 'API_TOKEN no configurado', 'request_id' => null];
    }
    if ($PM4_BASE_URL === '') {
        return ['ok' => false, 'http_code' => 0, 'error' => 'HOST_URL (PM4_BASE_URL) no configurado', 'request_id' => null];
    }
    if ((string) $PM4_PROCESS_ID === '' || strpos((string) $PM4_PROCESS_ID, '<<') === 0
        || (string) $PM4_EVENT_ID === '' || strpos((string) $PM4_EVENT_ID, '<<') === 0) {
        return ['ok' => false, 'http_code' => 0, 'error' => 'PM4_PROCESS_ID / PM4_EVENT_ID no configurados', 'request_id' => null];
    }

    $strUrl  = $PM4_BASE_URL . $PM4_API_BASE . '/process_events/' . $PM4_PROCESS_ID
             . '?event=' . rawurlencode($PM4_EVENT_ID);
    $strBody = json_encode($dicPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $lstHeaders = [
        'Authorization: Bearer ' . $API_TOKEN,
        'Content-Type: application/json',
        'Accept: application/json',
        'Content-Length: ' . strlen($strBody),
    ];

    $dicRes = sfcHttp('POST', $strUrl, $lstHeaders, $strBody);

    // PM4 devuelve el request creado; el id puede venir como request_id o id.
    $intRequestId = null;
    if (is_array($dicRes['response'])) {
        $intRequestId = $dicRes['response']['request_id'] ?? $dicRes['response']['id'] ?? null;
    }
    $blnOk = ($dicRes['http_code'] >= 200 && $dicRes['http_code'] < 300);

    return [
        'ok'         => $blnOk,
        'http_code'  => $dicRes['http_code'],
        'error'      => $dicRes['error'],
        'request_id' => $intRequestId,
        'response'   => $dicRes['response'],
    ];
}

/**
 * Recorre results[] y crea un caso PM4 por cada queja. Devuelve un resumen con
 * el detalle por queja (código SFC, request_id creado, error).
 * No aborta el lote si una queja falla: registra el error y sigue con la siguiente.
 */
function ingestarQuejasEnPm4(array $lstResultados): array
{
    $lstDetalle = [];
    $intCreados = 0;
    $intFallidos = 0;

    foreach ($lstResultados as $intIdx => $dicQueja) {
        // Mapeo base (passthrough) + enriquecimiento con colecciones (_desc + momento/servicio).
        $strMatchMatriz = null;
        $dicPayload = enriquecerPayload(sfcQuejaToPm4Payload($dicQueja), $dicQueja, $strMatchMatriz);
        $dicCreate  = crearCasoPm4($dicPayload);

        if ($dicCreate['ok']) {
            $intCreados++;
        } else {
            $intFallidos++;
        }

        $lstDetalle[] = [
            'indice'       => $intIdx,
            'codigo_queja' => $dicQueja['codigo_queja'] ?? null,
            'ok'           => $dicCreate['ok'],
            'request_id'   => $dicCreate['request_id'],
            'http_code'    => $dicCreate['http_code'],
            'error'        => $dicCreate['error'],
            // Clasificación regulatoria derivada de la matriz (id 45): vacío ⇒ no se
            // encontró la fila producto+motivo (revisar el mapeo del catálogo).
            // 'match_matriz' dice con qué pasada se resolvió la fila; 'ninguna' ⇒ el
            // codigoMotivoSFC de la queja no existe en la matriz.
            'match_matriz' => $strMatchMatriz,
            'momento'      => $dicPayload['qd_strInteraction'] ?? '',
            'servicio'     => $dicPayload['qd_strServiceProvided'] ?? '',
            'regulatorios' => [
                'qd_strResponsableRole'     => $dicPayload['qd_strResponsableRole'] ?? '',
                'qd_strOmbudsmanEscalation' => $dicPayload['qd_strOmbudsmanEscalation'] ?? '',
                'qd_strCompensation'        => $dicPayload['qd_strCompensation'] ?? '',
                'qd_strSlaAssigned'         => $dicPayload['qd_strSlaAssigned'] ?? '',
                'qd_strFraudRelated'        => $dicPayload['qd_strFraudRelated'] ?? '',
            ],
            // Cuerpo de la respuesta de PM4: aquí PM4 explica el porqué de un 4xx
            // (p. ej. {"message":"Unauthenticated."} en un 401). Solo lo incluimos
            // cuando la creación falla, para no inflar la salida en el caso feliz.
            'pm4_response' => $dicCreate['ok'] ? null : ($dicCreate['response'] ?? null),
        ];
    }

    return [
        'total'    => count($lstResultados),
        'creados'  => $intCreados,
        'fallidos' => $intFallidos,
        'detalle'  => $lstDetalle,
    ];
}

// =============================================================================
// Operaciones
// =============================================================================

/**
 * Momento 1 — capturar quejas y crear un caso PM4 por cada una.
 *
 * Fuente de las quejas:
 *   - $data['usar_mock'] truthy → dos quejas MOCK (persona natural + jurídica),
 *     útil para ejercitar el mapeo y la creación de casos sin depender de la SFC.
 *   - por defecto → GET real a /api/queja/ vía CORE (operacion="request") y se
 *     toman response['results'].
 */
function opMomento1(array $data): array
{
    $blnMock = !empty(sfcVal($data, 'usar_mock'));

    $lstResultados = [];
    $intHttpCode   = null;
    $genResponse   = null;

    // La config pública (destino PM4, urls) siempre viene del CORE sin exponer token.
    $dicCfg = sfcCoreConfig();

    if ($blnMock) {
        // Modo mock: no dependemos de la SFC.
        $dicMock       = sfcMockResultados();
        $lstResultados = $dicMock['results'];
        $genResponse   = $dicMock;
    } else {
        // GET real a la SFC vía CORE: el CORE hace login + firma de URL + HTTP.
        $dicRes      = sfcCoreRequest('GET', 'QUEJA', '');
        $intHttpCode = $dicRes['http_code'];
        $genResponse = $dicRes['response'];
        if (is_array($dicRes['response']) && isset($dicRes['response']['results'])
            && is_array($dicRes['response']['results'])) {
            $lstResultados = $dicRes['response']['results'];
        }
    }

    // Volcamos el destino PM4 (definido en el CORE) a los globals de creación.
    sfcAplicarConfigPm4($dicCfg);
    $blnCrear = (bool) (($dicCfg['pm4']['create_cases'] ?? true));

    // Crea un caso PM4 por cada queja capturada, salvo que el switch lo desactive.
    if ($blnCrear) {
        $dicIngesta = ingestarQuejasEnPm4($lstResultados);
    } else {
        $dicIngesta = [
            'omitido' => true,
            'motivo'  => 'PM4_CREATE_CASES=false: solo captura, sin crear casos.',
            'total'   => count($lstResultados),
        ];
    }

    return [
        'operacion'   => 'momento1',
        'fuente'      => $blnMock ? 'mock' : 'sfc',
        'http_code'   => $intHttpCode,
        'response'    => $genResponse,
        'ingesta_pm4' => $dicIngesta,
    ];
}

/** ACK de queja — POST /api/complaint/ack/ vía CORE. */
function opAck(array $data): array
{
    // Necesitamos la config solo para componer el codigo_queja (tipo_entidad+entidad_cod).
    $dicCfg  = sfcCoreConfig();
    $dicBody = buildBodyAck($data, $dicCfg);
    // El CORE firma el body (POST) + adjunta Bearer + HTTP.
    $dicRes  = sfcCoreRequest('POST', 'COMPLAINT_ACK', '', $dicBody);

    return [
        'operacion' => 'ack',
        'http_code' => $dicRes['http_code'],
        'response'  => $dicRes['response'] ?? null,
    ];
}

// =============================================================================
// DISPATCHER — (por defecto) momento1 | ack
// =============================================================================

if (isset($data) && is_array($data)) {
    global $_sfc_respons_logs;

    // Precarga de la bitácora acumulativa: si el caso ya trae _sfc_respons_logs
    // de un momento anterior, arrancamos desde ahí para seguir sumando (el CORE
    // hace lo propio en cada llamada; aquí solo sembramos el punto de partida).
    if (isset($data['_sfc_respons_logs']) && is_array($data['_sfc_respons_logs'])) {
        $_sfc_respons_logs = $data['_sfc_respons_logs'];
    }

    $strOp = '';
    try {
        // Este script ES el Momento 1: sin 'operacion' asume 'momento1'.
        $strOp = strtolower((string) sfcVal($data, 'operacion'));
        switch ($strOp) {
            case '':         // fallthrough: sin operacion => Momento 1
            case 'momento1': $dicSalida = opMomento1($data); break;
            case 'ack':      $dicSalida = opAck($data); break;
            default:
                throw new RuntimeException("Este script maneja momento1 (por defecto) | ack. Recibido: '{$strOp}'.");
        }
        $dicSalida['_sfc_respons_logs'] = $_sfc_respons_logs;
        return $dicSalida;
    } catch (\Throwable $excError) {
        return [
            'operacion'         => $strOp,
            'error'             => true,
            'message'           => $excError->getMessage(),
            '_sfc_respons_logs' => $_sfc_respons_logs,
        ];
    }
}
