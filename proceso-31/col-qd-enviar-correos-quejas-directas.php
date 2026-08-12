<?php
/*return [
      'email_respuesta_envio'   => "200",              // p.ej. '200'
    'email_correos_exitosos'  => 'extpablo.palacios@zurich.com',    // p.ej. 'jcchachalo@gmail.com'
    'email_correos_fallidos'  => '',    // p.ej. 'alex.vargas@zurich.com'
    'email_titulo_envio'      => (string) $subject
];*/

/**
 * Convierte un array anidado en claves planas con notación de punto.
 * ['_user' => ['fullname' => 'Juan']]  =>  ['_user.fullname' => 'Juan']
 * Además guarda el nodo completo como JSON por si la plantilla usa {{_user}}.
 */
function flatten_para_plantilla($arr, $prefijo = '') {
    $resultado = [];
    foreach ($arr as $clave => $valor) {
        $nuevaClave = $prefijo === '' ? (string)$clave : $prefijo . '.' . $clave;

        if (is_object($valor)) {
            $valor = (array) $valor;
        }

        if (is_array($valor)) {
            // Versión JSON del nodo completo (para {{_user}} directo)
            $resultado[$nuevaClave] = json_encode(
                $valor,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
            // Recorremos hacia adentro para exponer {{_user.fullname}}
            $resultado += flatten_para_plantilla($valor, $nuevaClave);
        } else {
            $resultado[$nuevaClave] = $valor;
        }
    }
    return $resultado;
}

/**
 * Devuelve el email del primer usuario (preferentemente ACTIVE) de un grupo,
 * buscandolo por su nombre EXACTO. Devuelve '' si no encuentra el grupo,
 * si no tiene usuarios o si ocurre un error de API.
 */
function primer_email_de_grupo($api, $nombreGrupo) {
    try {
        $groupsApi = $api->groups();

        // Firma real: getGroups($status, $filter, $order_by, $order_direction, $per_page, $include)
        // El filtro es tipo "contiene", por eso luego exigimos coincidencia EXACTA del nombre.
        $resp   = $groupsApi->getGroups(null, $nombreGrupo, null, 'asc', 200);
        $grupos = method_exists($resp, 'getData') ? $resp->getData() : $resp;

        $grupoId = null;
        foreach ((array)$grupos as $g) {
            if ($g->getName() === $nombreGrupo) {
                $grupoId = $g->getId();
                break;
            }
        }

        if ($grupoId === null) {
            error_log('[Script 81 - primer_email_de_grupo] grupo no encontrado: "'.$nombreGrupo.'"');
            return '';
        }

        $usersResp = $groupsApi->getGroupUsers($grupoId);
        $usuarios  = method_exists($usersResp, 'getData') ? $usersResp->getData() : $usersResp;

        $primerEmail = '';
        foreach ((array)$usuarios as $u) {
            $email = trim((string)$u->getEmail());
            if ($email === '') {
                continue;
            }
            // Preferimos el primer usuario ACTIVE
            if ($u->getStatus() === 'ACTIVE') {
                return $email;
            }
            // Guardamos el primero con email por si ninguno esta ACTIVE
            if ($primerEmail === '') {
                $primerEmail = $email;
            }
        }

        return $primerEmail;
    } catch (\Throwable $e) {
        error_log('[Script 81 - primer_email_de_grupo] grupo="'.$nombreGrupo.'" -> '.$e->getMessage());
        return '';
    }
}

$url = getenv("API_GATEWAY_URL");
$auth = getenv("API_AUTH_MAILING");

$token_html = getenv("TOKEN_PM");
$plantilla_correo = $config['plantilla_correo'];

$subject = trim((string)($config["titulo_correo"] ?? ""));
$frm_gen_num_cotizacion = trim((string)($data["frm_gen_num_cotizacion"] ?? ""));

if ($frm_gen_num_cotizacion !== "") {
    $subject .= " - " . $frm_gen_num_cotizacion;
}

$email_to = trim((string)($data["qd_strEmail"] ?? ""));
$email_to_test = trim((string)($data["qd_strEmail"] ?? ""));

$decision_negociacion = trim((string)($data["frm_decision_negociacion"] ?? ""));
$num_cotizacion_cuw_col = trim((string)($data["frm_num_cotizacion_cuw_col"] ?? ""));

$flag = getenv('DEBUG_FLAG');
//$flag =""; //descomentar para apagar el switch

/**
 * Si la negociación fue aprobada, existe número de cotización
 * y el correo principal viene vacío, usar el correo test.
 */
if (
    $decision_negociacion === "COTIZACION_APROBADA" &&
    $num_cotizacion_cuw_col !== "" &&
    $email_to === ""
) {
    $email_to = $email_to_test;
}

if (!$flag) {
    $email_to = $email_to_test;
}

/**
 * Guardia de dominios permitidos (interruptor).
 * - ACTIVO cuando DEBUG_FLAG trae un valor "truthy": solo se envia a los
 *   dominios de $dominios_permitidos; el resto se reporta como fallido.
 * - APAGADO cuando DEBUG_FLAG viene vacio/falso: se envia a cualquier correo.
 */
$guardia_dominios_activo = (bool) $flag;
$guardia_dominios_activo = false;
$dominios_permitidos     = ['zurich', 'beesmart'];

$envio_nota = $config['envio_nota'];

// >>> Flags de destinatarios que vienen desde la config de ProcessMaker
$enviar_sac                  = filter_var($config['enviarSAC'] ?? false, FILTER_VALIDATE_BOOLEAN);
$enviar_asignado             = filter_var($config['enviarAsignado'] ?? false, FILTER_VALIDATE_BOOLEAN);
$enviar_consumidor_financiero = filter_var($config['enviarConsumidorFinanciero'] ?? false, FILTER_VALIDATE_BOOLEAN);
$enviar_gestor_experiencia   = filter_var($config['enviarGestorExperiencia'] ?? false, FILTER_VALIDATE_BOOLEAN);
$agregar_pdf                 = filter_var($config['agregarPDF'] ?? false, FILTER_VALIDATE_BOOLEAN);
$enviar_cc_inicial           = filter_var($config['enviarCCInicial'] ?? false, FILTER_VALIDATE_BOOLEAN);

// >>> Emails del area SAC: primer usuario (ACTIVE) de cada grupo.
//     Solo consultamos la API si realmente vamos a enviar al SAC.
//     - Analista SAC -> grupo SAC_ANALYST
//     - Lider SAC    -> grupo SAC_SUPERVISOR
$email_analista_sac = '';
$email_lider_sac    = '';
if ($enviar_sac) {
    $email_analista_sac = primer_email_de_grupo($api, 'SAC_ANALYST');
    $email_lider_sac    = primer_email_de_grupo($api, 'SAC_SUPERVISOR');
}

// Gestor de experiencia: aun no hay grupo definido, se mantiene el dummy por ahora
$email_gestor_experiencia = 'gestor.experiencia@zurich.com';
//$email_to = 'brenda.alazanez@mx.zurich.com';
//$email_to_2 = 'jean.chachalo@zurich.com';
//$email_to_3 = 'alex.vargas1@zurich.com';
$processRequestId = $data['_request']['id'];

$path = "/api/send-email/z/c4e/s/mailjet/v1/messages/send";

$url_full = $url . "". $path;
$curl = curl_init($url_full);

// >>> APLANAMOS $data para exponer variables anidadas como _user.fullname
$datos_a_reemplazar = flatten_para_plantilla($data);

/**
 * Armamos el nombre del cliente segun el tipo de identificacion.
 * - Si qd_strIdType == 7, el nombre viene en qd_strContactFirstName / qd_strContactLastName.
 * - En cualquier otro caso, viene en qd_strFirstName / qd_strLastName.
 * Se expone como {{nombre_cliente}} para reutilizarlo en cualquier plantilla.
 */
$tipo_identificacion = trim((string)($data['qd_strIdType'] ?? ''));

if ($tipo_identificacion === '7') {
    $nombre_pila = trim((string)($data['qd_strContactFirstName'] ?? ''));
    $apellido    = trim((string)($data['qd_strContactLastName'] ?? ''));
} else {
    $nombre_pila = trim((string)($data['qd_strFirstName'] ?? ''));
    $apellido    = trim((string)($data['qd_strLastName'] ?? ''));
}

$nombre_cliente = trim($nombre_pila . ' ' . $apellido);

$datos_a_reemplazar['nombre_cliente'] = $nombre_cliente;

$collectionsApi = $api->collections();

// Definir la consulta PMQL para filtrar por el campo HTML_Nombre
$pmqlQuery = 'data.nombre_HTML="'.$plantilla_correo.'"';

$catalogo_mails = getenv('ID_CATALOGO_MAILS_QD');

// Obtener los registros de la colección 7 que cumplan con el filtro PMQL
$response = $collectionsApi->getRecords($catalogo_mails, $pmqlQuery);

// Extraer los datos de registros de la respuesta
$records = $response->getData();

// Si existe al menos un registro que coincide, obtener el primero
if (!empty($records)) {
    $record = $records[0];
    // Acceder a los campos del registro (dentro de $record->getData())
    $datosRegistro = $record->getData();
    // Ejemplo: mostrar el campo HTML_Nombre del registro obtenido
    $html = $datosRegistro['HTML_completo'];
} else {
    return [
        'email_respuesta_envio'   => "0",
        'email_correos_exitosos'  => '',
        'email_correos_fallidos'  => '',
        'email_titulo_envio'      => (string) $subject,
        'email_error_detalle'     => 'No se encontro la plantilla de correo "'.$plantilla_correo.'" en el catalogo '.$catalogo_mails,
    ];
}

// >>> Normalizamos placeholders con espacios: {{ _user.fullname }} => {{_user.fullname}}
$html = preg_replace('/\{\{\s*(.*?)\s*\}\}/', '{{$1}}', $html);

// >>> Aceptamos tambien la notacion con corchetes dobles: [[ clave ]] => {{clave}}
$html    = preg_replace('/\[\[\s*(.*?)\s*\]\]/', '{{$1}}', $html);

// Normalizamos placeholders con espacios tambien en el asunto: {{ x }} => {{x}}
$subject = preg_replace('/\{\{\s*(.*?)\s*\}\}/', '{{$1}}', $subject);

// >>> Aceptamos tambien la notacion con corchetes dobles en el asunto: [[ clave ]] => {{clave}}
$subject = preg_replace('/\[\[\s*(.*?)\s*\]\]/', '{{$1}}', $subject);

// Reemplaza {{clave}} por el valor correspondiente en $data (ya aplanado)
if (is_array($datos_a_reemplazar)) {
    foreach ($datos_a_reemplazar as $campo => $valor) {

        if (
            $campo === 'frm_lista_documentos_observaciones' ||
            $campo === 'frm_lista_documentos_perfil' ||
            $campo === 'lista_documentos_perfil_cliente'
        ) {
            $valor_html = nl2br(htmlspecialchars((string)$valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
        } else {
            $valor_html = htmlspecialchars((string)$valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }

        $placeholder = '{{' . $campo . '}}';

        // En el HTML usamos el valor escapado
        $html = str_replace($placeholder, $valor_html, $html);

        // En el asunto (texto plano) usamos el valor crudo, sin escapar
        $subject = str_replace($placeholder, (string)$valor, $subject);
    }
}

$file = '';

if ($envio_nota) {
    $apiInstance = $api->requestFiles();
    $result      = $apiInstance->getRequestFiles($processRequestId);

    $docNotas = null;

    // Buscar el adjunto output_notasCoberturaCo
    foreach ($result->getData() as $fileItem) {
        // Por nombre lógico del documento
        if ($fileItem->getName() === 'output_notasCoberturaCo') {
            // Obtener el archivo completo por ID
            $docNotas = $apiInstance->getRequestFilesById($processRequestId, $fileItem->getId());
            break;
        }
    }

    if ($docNotas) {
        $fileContents = file_get_contents($docNotas->getPathname());
        $file = base64_encode($fileContents);
    }
}

// >>> Si agregarPDF es true, adjuntamos el archivo cuyo ID esta en qd_strFinalReplyPdf
$file_pdf      = '';
$file_pdf_name = trim((string)($data['pdf_filename'] ?? ''));
if ($file_pdf_name === '') {
    $file_pdf_name = 'Respuesta.pdf';
}

if ($agregar_pdf) {
    $pdf_file_id = $data['qd_strFinalReplyPdf'] ?? null;

    if (!empty($pdf_file_id)) {
        $apiInstancePdf = $api->requestFiles();
        $docPdf         = $apiInstancePdf->getRequestFilesById($processRequestId, $pdf_file_id);

        if ($docPdf) {
            $fileContents = file_get_contents($docPdf->getPathname());
            $file_pdf     = base64_encode($fileContents);
        }
    }
}

// >>> Armamos la lista de destinatarios segun los flags recibidos desde la config
$destinatarios = [];

// SAC: Analista SAC (grupo SAC_ANALYST) + Lider SAC (grupo SAC_SUPERVISOR)
if ($enviar_sac) {
    if ($email_analista_sac !== '') {
        $destinatarios[] = ['email' => $email_analista_sac, 'name' => 'Analista SAC'];
    }
    if ($email_lider_sac !== '') {
        $destinatarios[] = ['email' => $email_lider_sac, 'name' => 'Lider SAC'];
    }
}

// Asignado: correo que viene en _user.email
if ($enviar_asignado) {
    $email_asignado = trim((string)($data['_user']['email'] ?? ''));
    if ($email_asignado !== '') {
        $destinatarios[] = ['email' => $email_asignado, 'name' => $email_asignado];
    }
}

// Consumidor financiero: correo que viene en qd_strEmail
if ($enviar_consumidor_financiero) {
    if ($email_to !== '') {
        $destinatarios[] = ['email' => $email_to, 'name' => $email_to];
    }
}

// Gestor de experiencia: correo dummy por ahora
if ($enviar_gestor_experiencia) {
    $destinatarios[] = ['email' => $email_gestor_experiencia, 'name' => 'Gestor de Experiencia'];
}

// Fallback: si ningun flag genero destinatarios, se mantiene el comportamiento previo
if (empty($destinatarios) && $email_to !== '') {
    $destinatarios[] = ['email' => $email_to, 'name' => $email_to];
}

// Eliminamos duplicados por correo (p.ej. si asignado y consumidor son el mismo)
$destinatarios = array_values(
    array_reduce($destinatarios, function ($acc, $item) {
        $acc[strtolower($item['email'])] = $item;
        return $acc;
    }, [])
);

// >>> Aplicamos el guardia de dominios (si esta activo)
$correos_bloqueados = [];
if ($guardia_dominios_activo) {
    $destinatarios_permitidos = [];

    foreach ($destinatarios as $item) {
        $email_lower = strtolower($item['email']);
        $permitido   = false;

        foreach ($dominios_permitidos as $dominio) {
            if (strpos($email_lower, $dominio) !== false) {
                $permitido = true;
                break;
            }
        }

        if ($permitido) {
            $destinatarios_permitidos[] = $item;
        } else {
            $correos_bloqueados[] = $item['email'];
        }
    }

    $destinatarios = $destinatarios_permitidos;
}

// Si tras el guardia no queda a quien enviar, salimos reportando los bloqueados
if (empty($destinatarios)) {
    $detalle_bloqueo = 'No quedaron destinatarios validos para enviar. '
        . 'Guardia de dominios ACTIVO (DEBUG_FLAG='.var_export($flag, true).'), '
        . 'solo se permiten dominios ['.implode(', ', $dominios_permitidos).']. '
        . 'Correos bloqueados: '.implode(', ', $correos_bloqueados);

    error_log('[Script 81 - Envio correos QD] request_id='.$processRequestId.' -> '.$detalle_bloqueo);

    return [
        'email_respuesta_envio'   => "0",
        'email_correos_exitosos'  => '',
        'email_correos_fallidos'  => implode(', ', $correos_bloqueados),
        'email_titulo_envio'      => (string) $subject,
        'email_error_detalle'     => $detalle_bloqueo,
    ];
}

// >>> Armamos el CC inicial si el flag lo pide y llega un correo en qd_strCcEmail
$copias = [];
if ($enviar_cc_inicial) {
    $email_cc = strtolower(trim((string)($data['qd_strCcEmail'] ?? '')));

    if ($email_cc !== '') {
        $cc_permitido = true;

        // Aplicamos el mismo guardia de dominios que a los destinatarios
        if ($guardia_dominios_activo) {
            $cc_permitido = false;
            foreach ($dominios_permitidos as $dominio) {
                if (strpos($email_cc, $dominio) !== false) {
                    $cc_permitido = true;
                    break;
                }
            }
        }

        if ($cc_permitido) {
            $copias[] = ['email' => $email_cc, 'name' => $email_cc];
        } else {
            $correos_bloqueados[] = $email_cc;
        }
    }
}

$payload = [
    "messages" => [
        [
            "subject"  => $subject,
            "to" => $destinatarios,
            "from" => [
                "email" => "no-reply@zurich.com",
                "name"  => "Notificaciones Zurich",
            ],
            "htmlPart" => $html,
        ]
    ]
];

// Agregamos el CC al mensaje solo si quedo algun correo valido
if (!empty($copias)) {
    $payload["messages"][0]["cc"] = $copias;
}

// Armamos los adjuntos del correo
$attachments = [];

// Nota de cobertura (si envio_nota trajo el documento)
if ($file != '') {
    $attachments[] = [
        "filename"       => 'Nota de cobertura.pdf',
        "contentType"    => 'pdf/application',
        "base64Content"  => $file,
    ];
}

// PDF de respuesta final (si agregarPDF es true y se obtuvo el archivo)
if ($file_pdf != '') {
    $attachments[] = [
        "filename"       => $file_pdf_name,
        "contentType"    => 'application/pdf',
        "base64Content"  => $file_pdf,
    ];
}

if (!empty($attachments)) {
    $payload["messages"][0]["attachments"] = $attachments;
}

curl_setopt_array($curl, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_CONNECTTIMEOUT => 30,
    CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
    // En pruebas puedes dejarlo en false, pero lo ideal es true/2 con el CA bien instalado
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Basic '.$auth
    ],
]);

$res         = curl_exec($curl);
$http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_errno  = curl_errno($curl);
$curl_error  = curl_error($curl);
curl_close($curl);

$response = json_decode($res, true);

$correos_exitosos = [];
$correos_fallidos = [];
$errores_detalle  = [];   // >>> Aqui acumulamos el motivo de cada fallo

// 1) Error de transporte (curl): timeout, DNS, SSL, conexion rechazada, etc.
if ($res === false || $curl_errno !== 0) {
    $errores_detalle[] = 'CURL error ('.$curl_errno.'): '.$curl_error;
}

// 2) HTTP fuera del rango 2xx
if ($http_status < 200 || $http_status >= 300) {
    $errores_detalle[] = 'HTTP status '.$http_status;
}

// 3) La respuesta no se pudo decodificar como JSON valido
if ($res !== false && $response === null) {
    $errores_detalle[] = 'Respuesta no-JSON: '.substr((string)$res, 0, 500);
}

if (isset($response['messages']) && is_array($response['messages'])) {
    foreach ($response['messages'] as $msg) {
        $status = $msg['status'] ?? null;

        // >>> Si el mensaje no fue exitoso, guardamos el detalle que devuelva la API
        if ($status !== 'success') {
            $motivo = $msg['errors']
                ?? $msg['error']
                ?? $msg['errorMessage']
                ?? $msg;
            $errores_detalle[] = 'Msg status "'.(string)$status.'": '
                . (is_string($motivo) ? $motivo : json_encode($motivo, JSON_UNESCAPED_UNICODE));
        }

        if (!isset($msg['to']) || !is_array($msg['to'])) {
            continue;
        }

        foreach ($msg['to'] as $to) {
            $email = $to['email'] ?? null;
            if (!$email) {
                continue;
            }

            if ($status === 'success') {
                $correos_exitosos[] = $email;
            } else {
                $correos_fallidos[] = $email;
            }
        }
    }
} else {
    // >>> No vino la estructura esperada: reportamos los destinatarios como fallidos
    foreach ($destinatarios as $item) {
        $correos_fallidos[] = $item['email'];
    }
    if (empty($errores_detalle)) {
        $errores_detalle[] = 'Respuesta sin nodo "messages". Body: '.substr((string)$res, 0, 500);
    }
}

// >>> Si hubo correos bloqueados por el guardia de dominios, lo dejamos claro
if (!empty($correos_bloqueados)) {
    $errores_detalle[] = 'Bloqueados por guardia de dominios: '.implode(', ', $correos_bloqueados);
}

$error_detalle = implode(' | ', $errores_detalle);

// Log en el servidor para poder revisarlo en los logs del ejecutor
if ($error_detalle !== '') {
    error_log('[Script 81 - Envio correos QD] request_id='.$processRequestId.' -> '.$error_detalle);
}

return [
    'email_respuesta_envio'   => (string) $http_status,
    'email_correos_exitosos'  => implode(', ', $correos_exitosos),
    'email_correos_fallidos'  => implode(', ', array_merge($correos_fallidos, $correos_bloqueados)),
    'email_titulo_envio'      => (string) $subject,
    'email_error_detalle'     => $error_detalle,   // >>> NUEVO: motivo del fallo
];
