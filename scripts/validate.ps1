param(
  [switch]$Smoke,
  [int]$Port = 3010
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$portableNode = Join-Path $env:LOCALAPPDATA 'Programs\nodejs-portable\node-v22.22.2-win-x64'
$cursorNode = Join-Path $env:LOCALAPPDATA 'Programs\cursor\resources\app\resources\helpers'

if (Test-Path (Join-Path $portableNode 'node.exe')) {
  $nodeDir = $portableNode
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
  $nodeDir = Split-Path -Parent (Get-Command node).Source
} elseif (Test-Path (Join-Path $cursorNode 'node.exe')) {
  $nodeDir = $cursorNode
} else {
  throw 'Node.js was not found. Install Node.js or run the portable Node setup in NPM_FIX.md.'
}

$env:Path = "$nodeDir;$repo\node_modules\.bin;$env:Path"
Set-Location $repo

Write-Host "Using Node: $(node --version)"
if (Get-Command npm -ErrorAction SilentlyContinue) {
  Write-Host "Using npm: $(npm --version)"
  npm run validate
} else {
  Write-Host 'npm was not found; running local tools directly.'
  if (Test-Path .test-build) { Remove-Item -Recurse -Force .test-build }
  tsc --noEmit
  next lint
  next build
  tsc -p tsconfig.test.json
  node --test .test-build/tests/*.test.js
}

if ($Smoke) {
  $job = Start-Job -ScriptBlock {
    param($wd, $nodeDir, $port)
    Set-Location $wd
    $env:Path = "$nodeDir;$wd\node_modules\.bin;$env:Path"
    next start -p $port
  } -ArgumentList $repo, $nodeDir, $Port

  try {
    for ($i = 0; $i -lt 30; $i += 1) {
      Start-Sleep -Seconds 1
      try {
        $homeResponse = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$Port/" -TimeoutSec 3
        if ($homeResponse.StatusCode -ne 200) { throw "Unexpected status $($homeResponse.StatusCode)" }
        Write-Host "Smoke test passed: http://127.0.0.1:$Port/ returned 200"
        break
      } catch {
        if ($i -eq 29) { throw }
      }
    }
  } finally {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
  }
}
