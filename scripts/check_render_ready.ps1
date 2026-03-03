$ErrorActionPreference = "Stop"

Write-Host "PodWatch Render readiness check" -ForegroundColor Cyan

$root = Split-Path -Parent $PSScriptRoot
$requiredFiles = @(
  "render.yaml",
  "backend/app.py",
  "backend/requirements.txt"
)

$failed = $false

foreach ($file in $requiredFiles) {
  $full = Join-Path $root $file
  if (Test-Path $full) {
    Write-Host "OK   $file"
  } else {
    Write-Host "MISS $file" -ForegroundColor Red
    $failed = $true
  }
}

$renderYaml = Join-Path $root "render.yaml"
if (Test-Path $renderYaml) {
  $content = Get-Content -Raw $renderYaml

  if ($content -match "startCommand:\s*gunicorn\s+app:app") {
    Write-Host "OK   render startCommand uses gunicorn app:app"
  } else {
    Write-Host "WARN render startCommand does not look like gunicorn app:app" -ForegroundColor Yellow
  }

  if ($content -match "healthCheckPath:\s*/api/health") {
    Write-Host "OK   healthCheckPath is /api/health"
  } else {
    Write-Host "WARN healthCheckPath is not /api/health" -ForegroundColor Yellow
  }
}

$compile = & python -m py_compile (Join-Path $root "backend/app.py") 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK   backend/app.py compiles"
} else {
  Write-Host "FAIL backend/app.py failed to compile" -ForegroundColor Red
  $compile | ForEach-Object { Write-Host $_ }
  $failed = $true
}

Write-Host ""
if ($failed) {
  Write-Host "Readiness check failed." -ForegroundColor Red
  exit 1
}

Write-Host "Readiness check passed." -ForegroundColor Green
Write-Host "Reminder: set YOUTUBE_API_KEY in Render Environment (optional, recommended)."
