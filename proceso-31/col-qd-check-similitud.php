<?php

/**
 * Script para ProcessMaker 4 (PHP 7)
 * 
 * Recupera todos los casos (Requests) de la instancia y filtra aquellos que pertenecen
 * al proceso especificado y que contienen y coinciden con las variables:
 * - qd_motivoSFC
 * - qd_productoSFC
 * - qd_numeroIdentificacion
 * 
 * Retorna los casos que coinciden (incluyendo su data) y la lista de IDs de dichos casos.
 * Cuenta con un mecanismo de auto-recuperación si la consulta PMQL falla en el servidor.
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
        'timeout' => 60.0
    ]);

    $page = 1;
    $perPage = 100;
    $matchedCases = [];
    $matchedIds = [];
    
    // Indicador si debemos omitir PMQL en reintentos futuros
    $skipPmql = false;

    do {
        $queryParams = [
            'include' => 'data',
            'per_page' => $perPage,
            'page' => $page,
            'type' => 'all'
        ];

        // Construir PMQL optimizado si tenemos processId y no hemos decidido omitirlo
        if ($processId && !$skipPmql) {
            // Si el ID es numérico (ej. 31), se pasa sin comillas para evitar errores de tipo en la base de datos.
            // Si es un UUID u otra cadena, se pasa con comillas dobles.
            if (is_numeric($processId)) {
                $queryParams['pmql'] = "process_id = {$processId}";
            } else {
                $queryParams['pmql'] = "process_id = \"{$processId}\"";
            }
        }

        $headers = [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . $apiToken,
            'Content-Type' => 'application/json'
        ];

        try {
            // Intentar realizar la petición a la API
            $response = $client->request('GET', 'api/1.0/requests', [
                'headers' => $headers,
                'query' => $queryParams
            ]);
        } catch (RequestException $e) {
            // MECANISMO DE AUTO-RECUPERACIÓN:
            // Si la llamada con PMQL falla (error 500 por tipo de dato, etc.),
            // reintentamos inmediatamente quitando el parámetro pmql y haciendo el filtro en PHP.
            if (isset($queryParams['pmql'])) {
                echo "[PM4 Script] Advertencia: La consulta con PMQL falló ({$e->getMessage()}). Reintentando filtrado manual en PHP...\n";
                $skipPmql = true;
                unset($queryParams['pmql']);
                
                $response = $client->request('GET', 'api/1.0/requests', [
                    'headers' => $headers,
                    'query' => $queryParams
                ]);
            } else {
                // Si falla incluso sin el filtro PMQL, propagamos la excepción
                throw $e;
            }
        }

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
            if ($case['status'] != "ACTIVE"){
                continue;
            }
            // Si falló PMQL y tuvimos que traer todos los casos, comprobamos manualmente el process_id en PHP
            if ($processId && $skipPmql) {
                $caseProcessId = $case['process_id'] ?? null;
                if ($caseProcessId != $processId) {
                    continue; // Saltar casos que no pertenecen al proceso buscado
                }
            }

            $caseData = $case['data'] ?? [];
            
            // Las 3 variables deben aparecer en el caso para que se lo tome en cuenta
            $hasMotivo = array_key_exists('qd_strSfcReason', $caseData);
            $hasProducto = array_key_exists('qd_strSfcProduct', $caseData);
            $hasIdentificacion = array_key_exists('qd_strIdNumber', $caseData);

            if ($hasMotivo && $hasProducto && $hasIdentificacion) {
                // Comparación flexible de valores (==) para ignorar discrepancias de tipo (ej: string "123" vs int 123)
                if ($caseData['qd_strSfcReason'] == $qd_motivoSFC &&
                    $caseData['qd_strSfcProduct'] == $qd_productoSFC &&
                    $caseData['qd_strIdNumber'] == $qd_numeroIdentificacion) {
                    
                    $matchedCases[] = [
                        'id' => $case['id'],
                        'case_number' => $case['case_number'] ?? null,
                        'process_id' => $case['process_id'] ?? null,
                        'status' => $case['status'] ?? null,
                        'created_at' => $case['created_at'] ?? null,
                        'updated_at' => $case['updated_at'] ?? null,
                        'data' => $caseData
                    ];
                    
                    $matchedIds[] = $case['id'];
                }
            }
        }

        // Control de paginación
        $meta = $responseBody['meta'] ?? [];
        $lastPage = $meta['last_page'] ?? 1;
        $page++;

    } while ($page <= $lastPage);

    $countSimilar = count($matchedIds);
    return [
        'similar_check_status' => 'SUCCESS',
        'qd_arridSimilarCases' => $matchedIds,
        'qd_intCountSimilarCases' => $countSimilar,
        //'qd_arrSimilarCases' => $matchedCases
    ];

} catch (RequestException $e) {
    $errorMessage = $e->getMessage();
    if ($e->hasResponse()) {
        $errorMessage .= " | Response: " . $e->getResponse()->getBody()->getContents();
    }
    return [
        'similar_check_status' => 'ERROR',
        'message' => 'Error de red/API Guzzle: ' . $errorMessage,
        //'qd_arrSimilarCases' => [],
        'qd_arridSimilarCases' => []
    ];
} catch (\Throwable $e) {
    return [
        'similar_check_status' => 'ERROR',
        'message' => 'Excepción en script: ' . $e->getMessage(),
        //'qd_arrSimilarCases' => [],
        'qd_arridSimilarCases' => []
    ];
}
