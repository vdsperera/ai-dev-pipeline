# Cross-platform compatibility shim: forward to Node.js security gate
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $input | node "$PSScriptRoot/security-gate.js"
} else {
    @{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
}

