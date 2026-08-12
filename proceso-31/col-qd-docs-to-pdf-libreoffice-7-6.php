<?php
require_once __DIR__ . '/vendor/autoload.php';

use PhpOffice\PhpWord\TemplateProcessor;
use GuzzleHttp\Client as GuzzleClient;

/**
 * Custom TemplateProcessor subclass to support double curly braces {{variable}}
 * and dynamically repair XML fragmentation inside placeholders.
 */
class CustomTemplateProcessor extends TemplateProcessor
{
    protected static $macroOpeningChars = '{{';
    protected static $macroClosingChars = '}}';

    public function __construct($documentTemplate)
    {
        parent::__construct($documentTemplate);

        // Repair XML fragmentation in placeholders
        $this->tempDocumentMainPart = $this->repairMacros($this->tempDocumentMainPart);

        foreach ($this->tempDocumentHeaders as $index => $content) {
            $this->tempDocumentHeaders[$index] = $this->repairMacros($content);
        }

        foreach ($this->tempDocumentFooters as $index => $content) {
            $this->tempDocumentFooters[$index] = $this->repairMacros($content);
        }
    }

    /**
     * Finds curly braced blocks and strips all inner XML tags.
     */
    private function repairMacros(string $xml): string
    {
        return preg_replace_callback('/\{\{(.*?)\}\}/s', function($matches) {
            $clean = preg_replace('/<[^>]+>/', '', $matches[1]);
            return '{{' . trim($clean) . '}}';
        }, $xml);
    }

    /**
     * Overridden to search for double curly braced variables.
     */
    protected function getVariablesForPart($documentPartXML)
    {
        $matches = [];
        preg_match_all("/\{\{(.*?)\}\}/i", $documentPartXML, $matches);
        return $matches[1];
    }

    /**
     * Overridden to bypass PHPWord's built-in fixBrokenMacros method, which contains
     * a regex bug that strips table structural tags and merges tables.
     * We already perform a safe and precise cleanup using our own repairMacros method.
     */
    protected function fixBrokenMacros($documentPartXML)
    {
        return $documentPartXML;
    }

    /**
     * Overridden to enforce late static binding on double curly braces.
     */
    protected static function ensureMacroCompleted($macro)
    {
        if (substr($macro, 0, 2) !== '{{' && substr($macro, -2) !== '}}') {
            $macro = '{{' . $macro . '}}';
        }
        return $macro;
    }
}

/**
 * Fills the official Word slip template using PHPWord and converts it to PDF.
 */
class DocxSlipGenerator
{
    private $data;
    private $templatePath;

    /**
     * Bookmarks condicionales: mapea nombre del marcador Word => clave en $data.
     * Si la clave está ausente o es falsy, el bloque se elimina del DOCX.
     * Por defecto (clave ausente del array $data) se considera true (se muestra).
     */
    private const CONDITIONAL_BOOKMARKS = [
        'PROPHORZ5_9' => 'PHORIZONTAL',
    ];

    public function __construct(array $data)
    {
        $this->data = $data;
        $this->templatePath = $data['template_path'] ?? __DIR__ . '/templates/SLIP_PI_FF_ACTUALIZADO_2026_V1_VAR.docx';
        $this->flattenData();
    }

    /**
     * Aplana los arreglos anidados enviados por el frontend (como alternativas)
     * a variables planas e independientes (ej. limite1, deducible1, etc.)
     */
    private function flattenData(): void
    {
        // Aplanar alternativas de la propuesta económica
        if (isset($this->data['alternativas']) && is_array($this->data['alternativas'])) {
            foreach ($this->data['alternativas'] as $index => $alt) {
                $num = $index + 1;
                $this->data['limite' . $num] = $alt['limite'] ?? '';
                $this->data['primab' . $num] = $alt['prima_bruta'] ?? '';

                // Formatear el deducible de forma plana
                $dedA = trim((string)($alt['deducible_a'] ?? ''));
                $dedB = trim((string)($alt['deducible_b'] ?? ''));
                if ($dedA === '' && $dedB === '') {
                    $ded = 'Ninguno';
                } elseif ($dedA === $dedB) {
                    $ded = $dedA;
                } else {
                    $ded = "Cobertura A: {$dedA}\nCobertura B: {$dedB}";
                }
                $this->data['deducible' . $num] = $ded;
            }
        }

        // Aplanar alternativas de cobertura a la entidad
        if (isset($this->data['entidad_alternativas']) && is_array($this->data['entidad_alternativas'])) {
            foreach ($this->data['entidad_alternativas'] as $index => $ea) {
                $num = $index + 1;
                $this->data['sublimite' . $num] = $ea['sublimite'] ?? '';
                $this->data['deducible_entidad' . $num] = $ea['deducible'] ?? 'Ninguno';
            }
        }
    }

    public function generate(string $outputPath, string $dest = 'F'): void
    {
        if (!is_file($this->templatePath)) {
            throw new RuntimeException('No se encontró la plantilla DOCX base.');
        }

        $workDir = $this->makeWorkDir();

        try {
            $docxPath = $workDir . '/slip_filled.docx';
            $this->fillTemplate($docxPath);

            $pdfPath = $this->convertDocxToPdf($docxPath, $workDir);
            $this->deliverPdf($pdfPath, $outputPath, $dest);
        } finally {
            $this->removeDirectory($workDir);
        }
    }

    private function fillTemplate(string $outputDocx): void
    {
        $template = new CustomTemplateProcessor($this->templatePath);

        // Obtener todas las variables presentes en el documento Word (dentro de {{ ... }})
        $variables = $template->getVariables();

        // Mapa de alias/sinónimos para compatibilidad con nombres históricos de la plantilla
        $aliases = [
            'serviciosprofecionales' => 'detalle_actividad',
            'serviciosprofesionales' => 'detalle_actividad',
            'nombrerepsolicitante'   => 'nombre_representante',
            'cargo'                  => 'cargo_representante',
            'fechahoy'               => 'fecha_firma',
            'vigenciadesde'          => 'vigencia_desde',
            'vigenciahasta'          => 'vigencia_hasta',
        ];

        // Recorrer cada variable detectada en la plantilla
        foreach ($variables as $variable) {
            $keyLower = strtolower($variable);
            $keyUpper = strtoupper($variable);

            // 1. Intentar coincidencia directa (ej: {{tomador}} o {{TOMADOR}} -> $data['tomador'])
            if (array_key_exists($keyLower, $this->data)) {
                $template->setValue($variable, $this->value($keyLower));
            } elseif (array_key_exists($keyUpper, $this->data)) {
                $template->setValue($variable, $this->value($keyUpper));
            } elseif (array_key_exists($variable, $this->data)) {
                $template->setValue($variable, $this->value($variable));
            }
            // 2. Intentar a través del mapa de alias (ej: {{NOMBREREPSOLICITANTE}} -> $data['nombre_representante'])
            elseif (array_key_exists($keyLower, $aliases) && array_key_exists($aliases[$keyLower], $this->data)) {
                $template->setValue($variable, $this->value($aliases[$keyLower]));
            }
            else {
                // Si la variable no está en el array de datos, la dejamos vacía para evitar que queden llaves rotas en el PDF.
                $template->setValue($variable, '');
            }
        }

        $template->saveAs($outputDocx);

        // Procesar bloques condicionales controlados por bookmarks de Word
        $this->processConditionalBookmarks($outputDocx);
    }

    /**
     * Recorre los bookmarks condicionales definidos en CONDITIONAL_BOOKMARKS.
     * Para cada uno, si el valor correspondiente en $data es falsy (false, '0', 'false', ''),
     * elimina del document.xml del DOCX todo el contenido XML que queda envuelto entre
     * <w:bookmarkStart w:name="NOMBRE"> y el <w:bookmarkEnd> correspondiente.
     *
     * Comportamiento:
     *  - Si la clave NO existe en $data => se considera true => bloque se muestra.
     *  - Si la clave existe y es falsy  => bloque se elimina.
     *  - En ambos casos, las etiquetas del propio bookmark se limpian del XML final.
     */
    private function processConditionalBookmarks(string $docxPath): void
    {
        $needsUpdate = false;

        $zip = new ZipArchive();
        if ($zip->open($docxPath) !== true) {
            throw new RuntimeException('No se pudo abrir el DOCX para procesar bookmarks condicionales.');
        }

        $xmlContent = $zip->getFromName('word/document.xml');
        if ($xmlContent === false) {
            $zip->close();
            return;
        }

        // Descubrir dinámicamente todos los marcadores en el documento XML
        preg_match_all('/<w:bookmarkStart\b[^>]*\bw:name="([^"]+)"/', $xmlContent, $matches);
        $foundBookmarks = array_unique($matches[1] ?? []);

        foreach ($foundBookmarks as $bookmarkName) {
            // Ignorar marcadores ocultos de Word (comienzan con _)
            if (strncmp($bookmarkName, '_', 1) === 0) {
                continue;
            }

            // Comprobar si el bookmark está en $this->data (por su mismo nombre)
            // O si está mapeado en CONDITIONAL_BOOKMARKS para retrocompatibilidad
            $dataKey = null;
            if (array_key_exists($bookmarkName, $this->data)) {
                $dataKey = $bookmarkName;
            } elseif (array_key_exists($bookmarkName, self::CONDITIONAL_BOOKMARKS)) {
                $mappedKey = self::CONDITIONAL_BOOKMARKS[$bookmarkName];
                if (array_key_exists($mappedKey, $this->data)) {
                    $dataKey = $mappedKey;
                }
            }

            // Si no hay datos específicos para este marcador condicional, lo conservamos por defecto
            if ($dataKey === null) {
                continue;
            }

            $needsUpdate = true;
            $show = $this->resolveConditionalValue($dataKey);

            if ($show) {
                // Conservar contenido y remover solo etiquetas de marcador
                $xmlContent = $this->stripBookmarkTags($xmlContent, $bookmarkName);
            } else {
                // Remover el bloque de contenido completo
                $xmlContent = $this->removeBookmarkedBlock($xmlContent, $bookmarkName);
            }
        }

        if ($needsUpdate) {
            $zip->addFromString('word/document.xml', $xmlContent);
        }

        $zip->close();
    }

    /**
     * Resuelve si un bloque condicional debe mostrarse según el valor en $data.
     * Valores falsy: false, 0, '0', 'false', 'no', '' — todo lo demás es true.
     * Si la clave no existe en $data se asume true (mostrar por defecto).
     */
    private function resolveConditionalValue(string $dataKey): bool
    {
        if (!array_key_exists($dataKey, $this->data)) {
            return true; // No especificado => mostrar por defecto
        }

        $val = $this->data[$dataKey];

        if (is_bool($val)) {
            return $val;
        }

        $str = strtolower(trim((string)$val));
        return !in_array($str, ['false', '0', 'no', ''], true);
    }

    /**
     * Elimina solo las etiquetas <w:bookmarkStart> y <w:bookmarkEnd> del bookmark dado,
     * conservando intacto el contenido XML que estaba entre ellas.
     */
    private function stripBookmarkTags(string $xml, string $bookmarkName): string
    {
        // Paso 1: Extraer el w:id del bookmarkStart ANTES de eliminarlo
        $bookmarkId = null;
        if (preg_match(
            '/<w:bookmarkStart\b[^>]*\bw:name="' . preg_quote($bookmarkName, '/') . '"[^>]*\bw:id="(\d+)"/',
            $xml,
            $idMatch
        )) {
            $bookmarkId = $idMatch[1];
        }

        // Paso 2: Eliminar el bookmarkStart
        $xml = preg_replace(
            '/<w:bookmarkStart\b[^>]*\bw:name="' . preg_quote($bookmarkName, '/') . '"[^>]*\/?>/',
            '',
            $xml
        );

        // Paso 3: Eliminar el bookmarkEnd correspondiente (por su id)
        if ($bookmarkId !== null) {
            $xml = preg_replace(
                '/<w:bookmarkEnd\b[^>]*\bw:id="' . preg_quote($bookmarkId, '/') . '"[^>]*\/?>/',
                '',
                $xml
            );
        }

        return $xml;
    }

    /**
     * Elimina el bookmark Y todo el contenido XML entre bookmarkStart y bookmarkEnd.
     *
     * Si el bookmark está dentro de una o varias filas de una tabla (<w:tr>),
     * elimina las filas completas correspondientes para evitar romper la estructura de la tabla.
     */
    private function removeBookmarkedBlock(string $xml, string $bookmarkName): string
    {
        // Paso 1: Encontrar el bookmarkStart y extraer su id
        $startPattern = '/<w:bookmarkStart\b[^>]*\bw:name="' . preg_quote($bookmarkName, '/') . '"[^>]*\/?>/';
        if (!preg_match($startPattern, $xml, $startMatch, PREG_OFFSET_CAPTURE)) {
            return $xml;
        }

        $startTagPos  = $startMatch[0][1];
        $startTagFull = $startMatch[0][0];

        if (!preg_match('/\bw:id="(\d+)"/', $startTagFull, $idMatch)) {
            return $xml;
        }
        $bookmarkId = $idMatch[1];

        // Paso 2: Encontrar el bookmarkEnd
        $endPattern = '/<w:bookmarkEnd\b[^>]*\bw:id="' . preg_quote($bookmarkId, '/') . '"[^>]*\/?>/';
        if (!preg_match($endPattern, $xml, $endMatch, PREG_OFFSET_CAPTURE)) {
            return $xml;
        }

        $endTagPos    = $endMatch[0][1];
        $endTagLength = strlen($endMatch[0][0]);

        // Paso 3: Identificar límites de corte
        $beforeStart = substr($xml, 0, $startTagPos);
        $blockStart  = $this->findEnclosingTrStart($beforeStart);

        if ($blockStart === -1) {
            // No está dentro de una fila de tabla, corte de caracteres simples (párrafo a párrafo)
            $blockStart = $startTagPos;
            $blockEnd   = $endTagPos + $endTagLength;
        } else {
            // Está dentro de una fila de tabla. Encontrar el final del tr correspondiente para bookmarkEnd.
            $beforeEnd = substr($xml, 0, $endTagPos);
            $isEndInsideTr = false;
            $lastTrOpen = strrpos($beforeEnd, '<w:tr');
            $lastTrClose = strrpos($beforeEnd, '</w:tr>');
            if ($lastTrOpen !== false && ($lastTrClose === false || $lastTrOpen > $lastTrClose)) {
                $isEndInsideTr = true;
            }

            if ($isEndInsideTr) {
                // Si el bookmarkEnd está dentro de una fila, el corte debe terminar después del </w:tr> de esa fila
                $afterEnd = substr($xml, $endTagPos);
                $posTrClose = strpos($afterEnd, '</w:tr>');
                if ($posTrClose !== false) {
                    $blockEnd = $endTagPos + $posTrClose + strlen('</w:tr>');
                } else {
                    $blockEnd = $endTagPos + $endTagLength;
                }
            } else {
                // Si el bookmarkEnd ya está fuera de la fila, el corte termina justo en el bookmarkEnd
                $blockEnd = $endTagPos + $endTagLength;
            }
        }

        return substr($xml, 0, $blockStart) . substr($xml, $blockEnd);
    }

    /**
     * Retrocede en $before usando balance de tags <w:tr>/</w:tr> para encontrar
     * la posición del <w:tr> que contiene el bookmarkStart.
     * Retorna -1 si no se encuentra un <w:tr> contenedor.
     */
    private function findEnclosingTrStart(string $before): int
    {
        $depth = 0;
        $pos   = strlen($before);

        while ($pos > 0) {
            $sub      = substr($before, 0, $pos);
            $closePos = strrpos($sub, '</w:tr>');
            $openPos  = strrpos($sub, '<w:tr');

            if ($closePos === false && $openPos === false) {
                break;
            }

            $useClose = ($closePos !== false) && ($openPos === false || $closePos > $openPos);

            if ($useClose) {
                $depth++;
                $pos = $closePos;
            } else {
                // Verificar que sea un <w:tr> real y no <w:trPr> o <w:trHeight>
                $charAfter = substr($before, $openPos + 5, 1);
                if ($charAfter !== ' ' && $charAfter !== '>' && $charAfter !== '/') {
                    $pos = $openPos;
                    continue;
                }

                if ($depth === 0) {
                    return $openPos; // Este <w:tr> contiene el bookmarkStart
                }
                $depth--;
                $pos = $openPos;
            }
        }

        return -1;
    }


    private function convertDocxToPdf(string $docxPath, string $workDir): string
    {
        $office = $this->officeBinary();
        $outputDir = $workDir . '/pdf';
        mkdir($outputDir, 0775, true);

        // --- CONFIGURACIÓN DE PERFIL ISOLADO DE LIBREOFFICE ---
        // LibreOffice 6.1 no soporta parámetros de filtros en formato JSON en CLI (--convert-to).
        // Para asegurar la exclusión total de campos de formulario activos a nivel de renderizador,
        // inicializamos un perfil de configuración local con `registrymodifications.xcu`
        // forzando la opción ExportFormFields a false de forma nativa.
        $loProfileDir = $workDir . '/lo_profile';
        $loUserDir = $loProfileDir . '/user';
        mkdir($loUserDir, 0775, true);

        $registryXcu = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" .
            '<oor:items xmlns:oor="http://openoffice.org/2001/registry"' .
            ' xmlns:xs="http://www.w3.org/2001/XMLSchema"' .
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' . "\n" .
            '<item oor:path="/org.openoffice.Office.Common/Filter/PDF/Export">' .
            '<prop oor:name="ExportFormFields" oor:op="fuse"><value>false</value></prop>' .
            '</item>' . "\n" .
            '</oor:items>' . "\n";

        file_put_contents($loUserDir . '/registrymodifications.xcu', $registryXcu);

        // Definir e inicializar variables de comando
        $userInstallation = 'file://' . $loProfileDir;
        $commandString = escapeshellarg($office) . ' ' .
            '--headless ' .
            '--nologo ' .
            '--nofirststartwizard ' .
            escapeshellarg('-env:UserInstallation=' . $userInstallation) . ' ' .
            '--convert-to pdf ' .
            '--outdir ' . escapeshellarg($outputDir) . ' ' .
            escapeshellarg($docxPath);

        $descriptorSpec = [
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'], // stderr
        ];

        // Abrir proceso de forma controlada y segura compatible con PHP < 7.4
        $process = proc_open($commandString, $descriptorSpec, $pipes, __DIR__, ['HOME' => $workDir]);
        if (!is_resource($process)) {
            throw new RuntimeException('No se pudo iniciar LibreOffice para convertir el DOCX.');
        }

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);
        $pdfPath = $outputDir . '/' . pathinfo($docxPath, PATHINFO_FILENAME) . '.pdf';

        if ($exitCode !== 0 || !is_file($pdfPath) || filesize($pdfPath) === 0) {
            $message = trim($stderr . "\n" . $stdout);
            throw new RuntimeException('LibreOffice no pudo convertir el DOCX a PDF. ' . $message);
        }

        return $pdfPath;
    }

    private function deliverPdf(string $pdfPath, string $outputPath, string $dest): void
    {
        if ($dest === 'F') {
            $pdfBytes = file_get_contents($pdfPath);
            if ($pdfBytes === false || file_put_contents($outputPath, $pdfBytes) === false) {
                throw new RuntimeException('No se pudo guardar el PDF generado.');
            }
            return;
        }

        $filename = basename($outputPath);
        $disposition = $dest === 'D' ? 'attachment' : 'inline';

        header('Content-Type: application/pdf');
        header('Content-Disposition: ' . $disposition . '; filename="' . addslashes($filename) . '"');
        header('Content-Length: ' . filesize($pdfPath));
        readfile($pdfPath);
    }

    private function officeBinary(): string
    {
        foreach (['/usr/bin/libreoffice', '/usr/bin/soffice', 'libreoffice', 'soffice'] as $binary) {
            if (strncmp($binary, '/', 1) === 0 && is_executable($binary)) {
                return $binary;
            }
        }

        return 'libreoffice';
    }

    private function value(string $key, string $default = ''): string
    {
        return trim((string)($this->data[$key] ?? $default));
    }

    private function makeWorkDir(): string
    {
        $dir = sys_get_temp_dir() . '/slip_docx_' . bin2hex(random_bytes(8));
        if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('No se pudo crear el directorio temporal.');
        }

        return $dir;
    }

    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $items = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($items as $item) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }

        rmdir($dir);
    }
}

// =========================================================================
// INTEGRACIÓN CON EL SCRIPT EXECUTOR DE PROCESSMAKER 4 (PM4)
// Genera un slip PDF por cada línea de producto activa en el proceso.
// =========================================================================

if (!isset($data) || !is_array($data)) {
    $data = [];
}

/**
 * Descarga un archivo DOCX desde el File Manager de PM4 y lo guarda en una ruta temporal.
 * Retorna la ruta local del archivo descargado.
 */
function downloadTemplate(int $fileId, string $hostUrl, string $apiToken, $api = null): string
{
    $tempPath = sys_get_temp_dir() . '/template_' . $fileId . '_' . uniqid() . '.docx';

    try {
        $guzzle = new GuzzleClient(['base_uri' => $hostUrl, 'verify' => false]);

        $response = $guzzle->request('GET', '/api/1.0/files/' . $fileId . '/contents', [
            'headers' => ['Authorization' => 'Bearer ' . $apiToken],
        ]);
        $content = $response->getBody()->getContents();

        if (strpos(trim($content), '{"') === 0) {
            $meta = json_decode($content, true);
            if (isset($meta['download_url'])) {
                $content = $guzzle->request('GET', $meta['download_url'], [
                    'headers' => ['Authorization' => 'Bearer ' . $apiToken],
                ])->getBody()->getContents();
            } else {
                $content = $guzzle->request('GET', '/api/1.0/files/' . $fileId . '/content', [
                    'headers' => ['Authorization' => 'Bearer ' . $apiToken],
                ])->getBody()->getContents();
            }
        }

        file_put_contents($tempPath, $content);
    } catch (\Exception $exGuzzle) {
        if (isset($api) && method_exists($api, 'requestFiles')) {
            $doc      = $api->requestFiles()->getRequestFilesById('', $fileId);
            $pathname = $doc->getPathname();
            if ($pathname && file_exists($pathname)) {
                copy($pathname, $tempPath);
            } else {
                throw new RuntimeException('Fallback SDK falló para file_id=' . $fileId . ': ' . $exGuzzle->getMessage());
            }
        } else {
            throw new RuntimeException('Descarga fallida para file_id=' . $fileId . ': ' . $exGuzzle->getMessage());
        }
    }

    if (!file_exists($tempPath) || filesize($tempPath) === 0) {
        throw new RuntimeException('La plantilla descargada está vacía para file_id=' . $fileId);
    }

    return $tempPath;
}

/**
 * Sube un archivo PDF local a PM4 y retorna el ID de archivo asignado por PM4.
 */
function uploadPdf(string $pdfPath, string $pdfFilename, string $requestId, string $hostUrl, string $apiToken): int
{
    $guzzle   = new GuzzleClient(['base_uri' => $hostUrl, 'verify' => false]);
    $response = $guzzle->request('POST', '/api/1.0/requests/' . $requestId . '/files', [
        'headers'   => ['Authorization' => 'Bearer ' . $apiToken, 'Accept' => 'application/json'],
        'multipart' => [
            ['name' => 'file',     'contents' => fopen($pdfPath, 'rb'), 'filename' => $pdfFilename],
            ['name' => 'name',     'contents' => $pdfFilename],
        ],
    ]);

    $body = json_decode($response->getBody()->getContents(), true);
    return (int)($body['fileUploadId'] ?? 0);
}

// UUID estable de la colección "COL - QD - DocTemplates" (no cambia entre instancias).
const DOCTEMPLATES_COLLECTION_UUID     = 'a2406cb8-b276-4267-be32-df872ab408e6';
// Nombre de respaldo por si el UUID no apareciera (p.ej. colección recreada a mano).
const DOCTEMPLATES_COLLECTION_NAME     = 'COL - QD - DocTemplates';
// Último recurso: id conocido en la instancia de referencia (PM4_BASE_URL actual).
const DOCTEMPLATES_COLLECTION_FALLBACK = 47;

/**
 * Resuelve el ID actual de una colección por su UUID (estable entre instancias),
 * con fallback a su nombre y, si tampoco aparece, al id conocido de la instancia
 * de referencia. Cachea el resultado en proceso. Mismo criterio que
 * resolveScriptId() del script 77 (COL_QD_Check_SLA_Expire), adaptado a
 * colecciones — este script ya habla con la API de PM4 vía Guzzle (no usa el SDK
 * $api para esta parte), así que la resolución sigue el mismo canal.
 */
function resolveCollectionId(string $apiHost, string $apiToken, string $uuid, string $name, int $fallback): int
{
    static $cache = [];
    $cacheKey = $uuid ?: $name;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    try {
        $client = new GuzzleHttp\Client(['verify' => false]);
        $res = $client->request('GET', $apiHost . '/collections', [
            'headers' => [
                'Authorization' => 'Bearer ' . $apiToken,
                'Accept'        => 'application/json',
            ],
            'query' => ['filter' => $name, 'per_page' => 500],
        ]);
        $list = json_decode($res->getBody(), true)['data'] ?? [];

        // 1º intento: match EXACTO por UUID (fuente de verdad).
        foreach ($list as $c) {
            if (($c['uuid'] ?? null) === $uuid) {
                return $cache[$cacheKey] = (int)$c['id'];
            }
        }
        // 2º intento (fallback): match exacto por nombre si el UUID no apareció.
        foreach ($list as $c) {
            if (($c['name'] ?? null) === $name) {
                return $cache[$cacheKey] = (int)$c['id'];
            }
        }
    } catch (\Exception $e) {
        // sigue al fallback de abajo
    }

    error_log("[COL - QD - Docs to PDF] resolveCollectionId: no se resolvió '{$name}' (uuid={$uuid}) dinámicamente; usando fallback id={$fallback}.");
    return $cache[$cacheKey] = $fallback;
}

try {
    // 1. Datos de conexión
    $processRequestId = (string)($data['_request']['id'] ?? '');
    if ($processRequestId === '') {
        throw new RuntimeException('No se encontró _request.id en los datos del proceso.');
    }

    $hostUrl  = $_SERVER['HOST_URL'] ?? getenv('HOST_URL') ?? '';
    $apiToken = getenv('API_TOKEN') ?? '';

    if ($hostUrl  === '') throw new RuntimeException('HOST_URL no está configurado.');
    if ($apiToken === '') throw new RuntimeException('API_TOKEN no está configurado.');

    // ----- 2. Obtener las variables de entorno nativas de ProcessMaker 4
    $apiHost  = getenv('API_HOST');
    $apiToken = getenv('API_TOKEN'); // Token dinámico inyectado por PM4 para la sesión del proceso

    //  ID de la colección de plantillas — resuelto dinámicamente (ver PORTABILIDAD
    //  arriba): no se referencia por su id numérico porque cambia al migrar de
    //  instancia. El 47 solo queda como fallback dentro de resolveCollectionId().
    $collectionId = resolveCollectionId(
        $apiHost,
        $apiToken,
        DOCTEMPLATES_COLLECTION_UUID,
        DOCTEMPLATES_COLLECTION_NAME,
        DOCTEMPLATES_COLLECTION_FALLBACK
    );

    //  Construir las cabeceras requeridas por la API REST de PM4
    $headers = [
        'Authorization' => 'Bearer ' . $apiToken,
        'Accept'        => 'application/json',
        'Content-Type'  => 'application/json'
    ];

    try {
        // 5. Instanciar Guzzle desactivando la verificación SSL (tal como tu imagen)
        $client = new GuzzleHttp\Client(['verify' => false]);

        // Realizar la petición GET al endpoint de registros de la colección
        $url = $apiHost . "/collections/" . $collectionId . "/records";
        $res = $client->request("GET", $url, [
            "headers" => $headers
        ]);

        // Decodificar la respuesta JSON del servidor
        $respuesta = json_decode($res->getBody(), true);

        // Extraer los datos si la colección no está vacía
        if (!empty($respuesta) && isset($respuesta['data']) && count($respuesta['data']) > 0) {

            // Tomar la primera fila (configuración global)
            $primerRegistro = $respuesta['data'][0];

            // Extraer los inputs mapeados en el sub-nodo 'data'
            $campos = $primerRegistro['data'] ?? [];

            // Asignar los IDs a tus variables
            $template_id   = $campos['template']['id']  ?? null;
        }

    } catch (\Exception $e) {
        return [
            'error_status' => true,
            'message' => $e->getMessage()
        ];
    }
    //----fin obetener variables

    // 3. Construir el nombre del único archivo final requerido por PM4:
    //    {NOMBRES+APELLIDOS o RAZONSOCIAL}_{ID}_RESP_FINAL_SFC_{CASEID}
    //    Ejemplo: NELSONBRAVO_6139406_RESP_FINAL_SFC_001
    $qdNombres     = trim((string)($data['qd_strFirstName'] ?? ''));
    $qdApellidos   = trim((string)($data['qd_strLastName'] ?? ''));
    $qdRazonSocial = trim((string)($data['qd_strCompanyName'] ?? ''));

    $nombreCompleto = ($qdNombres !== '' || $qdApellidos !== '')
        ? $qdNombres . $qdApellidos
        : $qdRazonSocial;

    $qdIdNumber  = trim((string)($data['qd_strIdNumber'] ?? ''));
    $qdCaseId    = trim((string)($data['qd_strBpmCaseId'] ?? ''));

    $sanitizeForFilename = function (string $value): string {
        $value = preg_replace('/\s+/', '', $value);         // eliminar espacios
        $value = preg_replace('/[^A-Za-z0-9]/', '', $value); // solo alfanumérico
        return strtoupper($value);
    };

    $pdfFilename = sprintf(
        '%s_%s_RESP_FINAL_SFC_%s.pdf',
        $sanitizeForFilename($nombreCompleto),
        $sanitizeForFilename($qdIdNumber),
        $sanitizeForFilename($qdCaseId)
    );

    // 4. Generar y subir un único template PDF usando la plantilla template_id
    $templateId = $template_id;
    if (empty($templateId)) {
        throw new RuntimeException('No se encontró template_id en la colección de plantillas.');
    }

    $tempTemplatePath = downloadTemplate((int)$templateId, $hostUrl, $apiToken, $api ?? null);

    try {
        $slipData                  = $data;
        $slipData['template_path'] = $tempTemplatePath;

        $tempPdfPath = sys_get_temp_dir() . '/slip_qd_' . uniqid() . '.pdf';

        $generator = new DocxSlipGenerator($slipData);
        $generator->generate($tempPdfPath, 'F');

        @unlink($tempTemplatePath);

        $fileId = uploadPdf($tempPdfPath, $pdfFilename, $processRequestId, $hostUrl, $apiToken);

        @unlink($tempPdfPath);
    } catch (\Exception $eSlip) {
        @unlink($tempTemplatePath);
        throw new RuntimeException('Error al generar el slip: ' . $eSlip->getMessage());
    }

    // 5. Retornar resultado consolidado para PM4
    return [
        'status'       => 'success',
        'pdf_filename' => $pdfFilename,
        'qd_strFinalReplyPdf'      => $fileId,
        'request_id'   => $processRequestId,
    ];

} catch (\Exception $e) {
    return [
        'status'      => 'error',
        'message'     => 'Error al generar slips PDF: ' . $e->getMessage(),
        'error_trace' => $e->getTraceAsString(),
    ];
}
