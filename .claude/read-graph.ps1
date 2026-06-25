# Lee el grafo generado por graphify desde graphify-out/ e inyecta contexto.
# Archivos esperados (relativos a la raíz del repo):
#   graphify-out/GRAPH_REPORT.md  — resumen legible del grafo
#   graphify-out/graph.json       — datos estructurados del grafo
$root       = Split-Path $PSScriptRoot -Parent
$reportPath = Join-Path $root "graphify-out\GRAPH_REPORT.md"
$graphPath  = Join-Path $root "graphify-out\graph.json"

if (-not (Test-Path $reportPath)) {
    Write-Output "{}"
    exit 0
}

$ctx = "=== GRAPH_REPORT ===`n$(Get-Content $reportPath -Raw)"

$result = [PSCustomObject]@{
    hookSpecificOutput = [PSCustomObject]@{
        hookEventName     = "UserPromptSubmit"
        additionalContext = $ctx
    }
}

$result | ConvertTo-Json -Compress -Depth 10
