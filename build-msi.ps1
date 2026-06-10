param(
    [string]$SourceDir = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallerDir = Join-Path $RepoRoot "installer"
$DistDir = Join-Path $RepoRoot "dist"
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

if ([string]::IsNullOrWhiteSpace($SourceDir)) {
    $candidates = Get-ChildItem -Path $RepoRoot -Recurse -File -Filter "index.html" |
        Where-Object {
            (Test-Path (Join-Path $_.DirectoryName "style.css")) -and
            (Test-Path (Join-Path $_.DirectoryName "shop.js"))
        }

    if ($candidates.Count -eq 0) {
        throw "Не найдена папка сайта. Нужна папка, где лежат index.html, style.css и shop.js."
    }

    $SourceDir = $candidates[0].DirectoryName
}

$SourceDir = (Resolve-Path $SourceDir).Path
Write-Host "SourceDir = $SourceDir"

$heat = Get-Command heat.exe -ErrorAction SilentlyContinue
$candle = Get-Command candle.exe -ErrorAction SilentlyContinue
$light = Get-Command light.exe -ErrorAction SilentlyContinue

if (-not $heat -or -not $candle -or -not $light) {
    $wixBin = Get-ChildItem "${env:ProgramFiles(x86)}" -Recurse -Filter "heat.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty DirectoryName

    if (-not $wixBin) {
        throw "WiX Toolset не найден. Установи WiX Toolset v3 или запусти сборку через GitHub Actions из файла .github/workflows/build-msi.yml."
    }

    $env:PATH = "$wixBin;$env:PATH"
}

Push-Location $InstallerDir
try {
    Remove-Item -Force -ErrorAction SilentlyContinue .\AppFiles.wxs, .\*.wixobj, .\*.wixpdb

    heat.exe dir "$SourceDir" `
        -cg AppFiles `
        -dr INSTALLFOLDER `
        -srd `
        -sreg `
        -gg `
        -var var.SourceDir `
        -out .\AppFiles.wxs

    candle.exe -dSourceDir="$SourceDir" .\Product.wxs .\AppFiles.wxs

    light.exe `
        -ext WixUIExtension `
        -cultures:ru-ru `
        -out "$DistDir\WEASLEYS_WIZARD_WHEEZES_Setup.msi" `
        .\Product.wixobj .\AppFiles.wixobj
}
finally {
    Pop-Location
}

Write-Host "MSI готов: $DistDir\WEASLEYS_WIZARD_WHEEZES_Setup.msi"
