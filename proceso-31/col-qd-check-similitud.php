<?php

/**
 * Script para ProcessMaker 4 (PHP 7)
 *
 * Detecta si ya existe otro caso ACTIVO con la misma combinación de motivo SFC +
 * producto SFC + número de identificación, para marcar la queja como similar.
 *
 * DÓNDE SE FILTRA: en el servidor, vía PMQL (`process_id`, `status` y `data.qd_strIdNumber`).
 * La versión anterior traía TODOS los casos del proceso con `include=data` y comparaba en PHP:
 * medido sobre el proceso 31 con 184 casos, 2 requests / 2577 KB / mediana 15,7 s, creciendo
 * lineal con el histórico hasta pegarle al timeout de 60 s. La consulta filtrada equivalente es
 * 1 request / 0,4 KB / mediana 6,1 s (ese resto es el costo fijo del endpoint `/requests`, que
 * tarda lo mismo sin ningún filtro).
 *
 * `qd_strSfcReason` y `qd_strSfcProduct` se siguen comparando en PHP con `==` a propósito: así
 * se conserva la tolerancia de tipo del comportamiento original (ej: "123" vs 123).
 *
 * Contrato de salida idéntico al de la versión anterior: el frontend deriva la marcación y la
 * escalación por reconsideración de `qd_intCountSimilarCases`, y resuelve el detalle de cada
 * caso por su cuenta (por eso acá nunca se devuelve la data de los casos coincidentes).
 */

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

try {
    // 1. Obtener variables de entrada
    $qd_motivoSFC = $data['qd_strSfcReason'] ?? null;
    $qd_productoSFC = $data['qd_strSfcProduct'] ?? null;
    $qd_numeroIdentificacion = $data['qd_strIdNumber'] ?? null;
    $currentCaseId = $data['_request']['id'] ?? null;

    // Validar que las variables de entrada requeridas estén presentes
    if ($qd_motivoSFC === null || $qd_productoSFC === null || $qd_numeroIdentificacion === null) {
        return [
            'status' => 'ERROR',
            'message' => 'Faltan variables de entrada obligatorias: qd_strSfcReason, qd_strSfcProduct, o qd_strIdNumber.',
            'casos_encontrados' => [],
            'ids_casos_encontrados' => []
        ];
    }

    // 2. Determinar el Process ID para acotar la búsqueda
    $processId = null;
    if (isset($data['process_id']) && $data['process_id'] !== 'all') {
        $processId = $data['process_id'];
    } elseif (isset($data['_request']['process_id'])) {
        $processId = $data['_request']['process_id'];
    }

    // 3. Configurar el cliente HTTP (Guzzle)
    $appUrl = getenv('APP_URL') ?: getenv('HOST_URL') ?: 'https://cozurich.dev.cloud.processmaker.net';
    $apiToken = getenv('API_TOKEN');

    if (empty($apiToken)) {
        return [
            'status' => 'ERROR',
            'message' => 'No se pudo encontrar el token de la API de ProcessMaker (API_TOKEN).',
            'casos_encontrados' => [],
            'ids_casos_encontrados' => []
        ];
    }

    $client = new Client([
        'base_uri' => rtrim($appUrl, '/') . '/',
        'verify' => false,
        // La consulta filtrada responde en ~6 s; 20 s cubre de sobra incluso el barrido
        // degradado, y deja margen contra el timeout de 60 s del script.
        'timeout' => 20.0
    ]);

    $headers = [
        'Accept' => 'application/json',
        'Authorization' => 'Bearer ' . $apiToken,
        'Content-Type' => 'application/json'
    ];

    // 4. Armar el PMQL. Estas condiciones se resuelven siempre en el servidor.
    $arrCondBase = ['status = "ACTIVE"'];
    if ($processId !== null) {
        // Numérico sin comillas para no forzar un cast en la base; string entre comillas.
        $arrCondBase[] = is_numeric($processId)
            ? "process_id = {$processId}"
            : sprintf('process_id = "%s"', str_replace(['"', '\\'], '', $processId));
    }

    // Condición sobre el JSON de `data`. Si el valor es numérico se prueban las dos formas:
    // un caso viejo puede tenerlo guardado como número y otro como string. Medido: el OR no
    // cuesta nada frente a la forma simple.
    $strIdBuscado = str_replace(['"', '\\'], '', $qd_numeroIdentificacion);
    $strCondData = is_numeric($strIdBuscado)
        ? sprintf('(data.qd_strIdNumber = "%s" OR data.qd_strIdNumber = %s)', $strIdBuscado, $strIdBuscado)
        : sprintf('data.qd_strIdNumber = "%s"', $strIdBuscado);

    /**
     * Trae los casos que la API considera candidatos y se queda con los que coinciden.
     *
     * @param bool $blnFiltrarPorIdEnServidor false = modo degradado: la instancia no pudo filtrar
     *                                        por `data.*`, así que se barre el proceso completo y
     *                                        el número de identificación se compara en PHP.
     * @return int[] ids de los casos coincidentes
     */
    $fnBuscarCoincidencias = function ($blnFiltrarPorIdEnServidor) use (
        $client,
        $headers,
        $arrCondBase,
        $strCondData,
        $qd_motivoSFC,
        $qd_productoSFC,
        $qd_numeroIdentificacion,
        $currentCaseId
    ) {
        $arrCond = $arrCondBase;
        if ($blnFiltrarPorIdEnServidor) {
            $arrCond[] = $strCondData;
        }
        $strPmql = implode(' AND ', $arrCond);

        $matchedIds = [];
        $page = 1;

        // Con el filtro puesto esto casi siempre es una sola vuelta, pero se pagina igual: nunca
        // hay que truncar en silencio, ni acá ni en el modo degradado.
        do {
            $response = $client->request('GET', 'api/1.0/requests', [
                'headers' => $headers,
                'query' => [
                    'include' => 'data',
                    'per_page' => 200,
                    'page' => $page,
                    'type' => 'all',
                    'pmql' => $strPmql
                ]
            ]);

            if ($response->getStatusCode() !== 200) {
                throw new Exception("Error al consultar la API de ProcessMaker. Status Code: " . $response->getStatusCode());
            }

            $responseBody = json_decode($response->getBody()->getContents(), true);
            $cases = $responseBody['data'] ?? [];

            // 5. Filtrar casos comparando las variables
            foreach ($cases as $case) {
                // EXCLUIR EL CASO ACTUAL QUE ESTÁ EJECUTANDO ESTE SCRIPT
                if ($currentCaseId !== null && $case['id'] == $currentCaseId) {
                    continue;
                }
                // Redundante con el PMQL, a propósito: garantiza que el criterio no se afloje
                // si algún día cambia la semántica de `status` en la API.
                if (($case['status'] ?? null) != "ACTIVE") {
                    continue;
                }

                $caseData = $case['data'] ?? [];

                // Las 3 variables deben aparecer en el caso para que se lo tome en cuenta
                if (!array_key_exists('qd_strSfcReason', $caseData) ||
                    !array_key_exists('qd_strSfcProduct', $caseData) ||
                    !array_key_exists('qd_strIdNumber', $caseData)) {
                    continue;
                }

                // Comparación flexible de valores (==) para ignorar discrepancias de tipo
                if ($caseData['qd_strSfcReason'] == $qd_motivoSFC &&
                    $caseData['qd_strSfcProduct'] == $qd_productoSFC &&
                    $caseData['qd_strIdNumber'] == $qd_numeroIdentificacion) {

                    $matchedIds[] = $case['id'];
                }
            }

            // Control de paginación
            $meta = $responseBody['meta'] ?? [];
            $lastPage = $meta['last_page'] ?? 1;
            $page++;

        } while ($page <= $lastPage);

        return $matchedIds;
    };

    try {
        $matchedIds = $fnBuscarCoincidencias(true);
    } catch (RequestException $e) {
        // Si la instancia no soporta filtrar por `data.*`, se degrada al barrido del proceso: es
        // el comportamiento anterior — lento, pero correcto. Lo que NO se hace más es caer al
        // barrido de toda la instancia, que era el peor escenario de la versión previa.
        echo "[PM4 Script] Advertencia: el filtro PMQL sobre data falló ({$e->getMessage()}). Degradando a barrido del proceso...\n";
        $matchedIds = $fnBuscarCoincidencias(false);
    }

    $countSimilar = count($matchedIds);

    return [
        'similar_check_status' => 'SUCCESS',
        'qd_arridSimilarCases' => $matchedIds,
        'qd_intCountSimilarCases' => $countSimilar
    ];

} catch (RequestException $e) {
    $errorMessage = $e->getMessage();
    if ($e->hasResponse()) {
        $errorMessage .= " | Response: " . $e->getResponse()->getBody()->getContents();
    }
    return [
        'similar_check_status' => 'ERROR',
        'message' => 'Error de red/API Guzzle: ' . $errorMessage,
        'qd_arridSimilarCases' => []
    ];
} catch (\Throwable $e) {
    return [
        'similar_check_status' => 'ERROR',
        'message' => 'Excepción en script: ' . $e->getMessage(),
        'qd_arridSimilarCases' => []
    ];
}
