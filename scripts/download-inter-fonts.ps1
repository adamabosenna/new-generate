# Download Inter fonts from Google Fonts GitHub and place them in assets/fonts/
$repoRoot = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $repoRoot 'assets\fonts'
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

$files = @{
  'Inter-Regular.ttf' = 'https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf'
  'Inter-Bold.ttf'    = 'https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf'
}

foreach ($name in $files.Keys) {
  $out = Join-Path $dest $name
  Write-Host "Downloading $name..."
  try {
    Invoke-WebRequest -Uri $files[$name] -OutFile $out -UseBasicParsing -ErrorAction Stop
    Write-Host "Saved: $out"
  } catch {
    Write-Warning ("Failed to download {0}: {1}" -f $name, ($_.Exception.Message))
  }
}

Write-Host "Done. Add/commit the files and push to your repo, then redeploy on Railway."