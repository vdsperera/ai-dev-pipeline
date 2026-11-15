# Cross-platform compatibility shim: forward to Node.js security gate
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $scriptPath = Join-Path (Get-Location) ".agents/scripts/security-gate.js"
    if (Test-Path $scriptPath) {
        $input | node $scriptPath
    } else {
        @{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
    }
} else {
    @{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
}

