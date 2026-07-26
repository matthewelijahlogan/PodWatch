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

  if ($content -match "startCommand:\s*gunicorn\s+--chdir\s+backend\s+app:app") {
    Write-Host "OK   render startCommand uses backend/app.py"
  } else {
    Write-Host "FAIL render startCommand does not use backend/app.py" -ForegroundColor Red
    $failed = $true
  }

  if ($content -match "healthCheckPath:\s*/api/health") {
    Write-Host "OK   healthCheckPath is /api/health"
  } else {
    Write-Host "WARN healthCheckPath is not /api/health" -ForegroundColor Yellow
  }

  if ($content -match "plan:\s*free") {
    Write-Host "OK   Render instance plan is free"
  } else {
    Write-Host "FAIL Render instance plan is not free" -ForegroundColor Red
    $failed = $true
  }

  if ($content -match "(?m)^\s*rootDir:") {
    Write-Host "FAIL rootDir would prevent frontend-only auto-deploys" -ForegroundColor Red
    $failed = $true
  } else {
    Write-Host "OK   repository-root deploy watches frontend and backend"
  }
}

$backend = Join-Path $root "backend"
$compile = & python -m compileall -q $backend 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK   backend Python files compile"
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
Write-Host "YOUTUBE_API_KEY is optional; public channel feeds are the primary source."
