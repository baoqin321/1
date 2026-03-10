$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseRoot = Join-Path $projectRoot "release"
$packageRoot = Join-Path $releaseRoot "site"
$zipPath = Join-Path $releaseRoot "watermark-studio.zip"

$files = @(
  "index.html",
  "404.html",
  "styles.css",
  "app.js",
  "page.png",
  "favicon.svg",
  "site.webmanifest",
  "edgeone.json",
  "robots.txt"
)

if (Test-Path $packageRoot) {
  Remove-Item $packageRoot -Recurse -Force
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

foreach ($file in $files) {
  $source = Join-Path $projectRoot $file
  if (Test-Path $source) {
    Copy-Item $source -Destination $packageRoot
  }
}

Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Release directory: $packageRoot"
Write-Host "Zip package: $zipPath"
