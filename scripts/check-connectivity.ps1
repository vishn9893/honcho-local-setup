param(
    [Parameter(Mandatory = $true)]
    [string]$HostLanIp,

    [int]$HonchoPort = 8000,
    [int]$OllamaPort = 11434
)

$ErrorActionPreference = "Stop"

function Test-Url {
    param(
        [string]$Name,
        [string]$Url
    )

    Write-Host "Checking $Name at $Url"
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        Write-Host "OK $Name returned HTTP $($response.StatusCode)"
    }
    catch {
        Write-Host "FAIL ${Name}: $($_.Exception.Message)"
        exit 1
    }
}

Test-Url -Name "Honcho local health" -Url "http://localhost:$HonchoPort/health"
Test-Url -Name "Honcho LAN health" -Url "http://$HostLanIp`:$HonchoPort/health"
Test-Url -Name "Ollama local models" -Url "http://localhost:$OllamaPort/v1/models"

Write-Host "Connectivity checks completed."
