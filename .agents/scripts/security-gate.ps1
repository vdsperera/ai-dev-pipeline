$inputJson = [Console]::In.ReadToEnd() | ConvertFrom-Json

# Default to allowing the tool
$output = @{ decision = "allow" }

# If the AI is trying to run a shell command
if ($inputJson.toolCall.name -eq "run_command") {
    $command = $inputJson.toolCall.args.CommandLine
    
    # If the command contains 'git commit'
    if ($command -match "git commit") {
        $output = @{
            decision = "ask"
            reason = "Security Gate: You are attempting to commit code. Have you run the 'sdlc-review' skill to check for vulnerabilities first?"
        }
    }
}

$output | ConvertTo-Json -Compress | Write-Output
