# backend/start-dev.example.ps1
# Copy to start-dev.ps1 and fill in your real keys.
# start-dev.ps1 is in .gitignore — NEVER commit your real secrets.

$env:JWT__SigningKey  = "<your-jwt-signing-key-at-least-32-chars>"
$env:LLM__BaseUrl     = "<your-llm-base-url>"
$env:LLM__ApiKey      = "<your-llm-api-key>"
$env:LLM__ModelName   = "gpt-4.1-mini"
$env:ASR__BaseUrl     = "<your-asr-base-url>"
$env:ASR__ApiKey      = "<your-asr-api-key>"
$env:ASR__ModelName   = "whisper-1"
$env:TTS__BaseUrl     = "<your-tts-base-url>"
$env:TTS__ApiKey      = "<your-tts-api-key>"
$env:TTS__ModelName   = "gpt-4o-mini-tts"
$env:TTS__Voice       = "alloy"

Write-Host "[start-dev] Environment variables set. Starting backend..." -ForegroundColor Cyan
dotnet run --launch-profile https
