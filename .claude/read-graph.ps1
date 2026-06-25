# Lee graph.json (si existe) e inyecta su contenido como contexto adicional para Claude.
# Coloca el grafo generado en: .claude/graph.json
$graphPath = Join-Path $PSScriptRoot "graph.json"

if (Test-Path $graphPath) {
    $graphContent = Get-Content $graphPath -Raw
    $ctx = "=== GRAFO DEL PROYECTO ===`n$graphContent`n=== FIN GRAFO ==="
    $result = [PSCustomObject]@{
        hookSpecificOutput = [PSCustomObject]@{
            hookEventName     = "UserPromptSubmit"
            additionalContext = $ctx
        }
    }
    $result | ConvertTo-Json -Compress -Depth 10
} else {
    Write-Output "{}"
}
