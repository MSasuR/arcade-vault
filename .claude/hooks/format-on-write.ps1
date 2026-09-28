# PostToolUse hook: formatea con Prettier (y ESLint --fix para codigo, no markdown)
# el archivo que Claude Code acaba de crear o editar. Nunca debe bloquear el flujo:
# cualquier error se traga y el script siempre sale con codigo 0.

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json -ErrorAction Stop

    $filePath = $payload.tool_input.file_path
    if (-not $filePath) { exit 0 }
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) { exit 0 }

    $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $codeExtensions = @(".tsx", ".jsx")
    $markdownExtensions = @(".md")

    if (-not ($codeExtensions -contains $ext -or $markdownExtensions -contains $ext)) {
        exit 0
    }

    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
    Push-Location $projectRoot
    try {
        try {
            & npx --no-install prettier --write --log-level warn -- "$filePath" 2>$null | Out-Null
        } catch { }

        if ($codeExtensions -contains $ext) {
            try {
                & npx --no-install eslint --fix -- "$filePath" 2>$null | Out-Null
            } catch { }
        }
    } finally {
        Pop-Location
    }
} catch {
    # Silencioso a proposito: este hook nunca debe romper el turno de Claude Code.
}

exit 0
