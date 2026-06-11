$ErrorActionPreference = "Stop"

$AppName = "Weasleys Wizard Wheezes"
$Manufacturer = "Weasleys Wizard Wheezes"
$Version = "1.0.0"

$UpgradeCode = "B17E3D1D-B1B4-47D1-8E4C-0F83B661C5F8"
$ShortcutComponentGuid = "7A7C5C2B-62A1-4D12-A343-0D8C7F83C6C2"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Build = Join-Path $Root "build"
$Stage = Join-Path $Build "app"
$Dist = Join-Path $Root "dist"

$WxsPath = Join-Path $Build "Product.wxs"
$MsiPath = Join-Path $Dist "WeasleysWizardWheezes-Setup.msi"

Remove-Item $Build, $Dist -Recurse -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Path $Stage -Force | Out-Null
New-Item -ItemType Directory -Path $Dist -Force | Out-Null

$ItemsToPackage = @(
    "index.html",
    "product.html",
    "cart.html",
    "payment.html",
    "tracking.html",
    "style.css",
    "shop.js",
    "assets"
)

foreach ($item in $ItemsToPackage) {
    $source = Join-Path $Root $item

    if (-not (Test-Path $source)) {
        Write-Host "Пропущено, не найдено: $item"
        continue
    }

    $destination = Join-Path $Stage $item

    if (Test-Path $source -PathType Container) {
        Copy-Item $source $destination -Recurse -Force
    }
    else {
        Copy-Item $source $destination -Force
    }
}

$IndexPath = Join-Path $Stage "index.html"

if (-not (Test-Path $IndexPath)) {
    throw "Файл index.html не найден. Без него инсталлятор сайта собрать нельзя."
}

dotnet tool update --global wix --version 5.0.2

if ($LASTEXITCODE -ne 0) {
    throw "Не удалось установить WiX Toolset."
}

$DotnetToolsPath = Join-Path $env:USERPROFILE ".dotnet\tools"

if ($env:PATH -notlike "*$DotnetToolsPath*") {
    $env:PATH = "$env:PATH;$DotnetToolsPath"
}

function Escape-Xml {
    param(
        [string]$Text
    )

    return [System.Security.SecurityElement]::Escape($Text)
}

$StageItem = Get-Item $Stage
$AllDirs = @($StageItem) + @(Get-ChildItem $Stage -Directory -Recurse | Sort-Object FullName)

$DirIds = @{}
$DirIds[$StageItem.FullName] = "INSTALLFOLDER"

$DirNumber = 1

foreach ($dir in $AllDirs) {
    if ($dir.FullName -eq $StageItem.FullName) {
        continue
    }

    $DirIds[$dir.FullName] = "DIR$DirNumber"
    $DirNumber++
}

$script:DirIds = $DirIds
$script:DirectoryXml = ""

function Add-DirectoryXml {
    param(
        [string]$Path,
        [int]$Indent
    )

    $pad = " " * $Indent
    $children = Get-ChildItem $Path -Directory | Sort-Object Name

    foreach ($child in $children) {
        $id = $script:DirIds[$child.FullName]
        $name = Escape-Xml $child.Name

        $script:DirectoryXml += "$pad<Directory Id=`"$id`" Name=`"$name`">`r`n"
        Add-DirectoryXml -Path $child.FullName -Indent ($Indent + 2)
        $script:DirectoryXml += "$pad</Directory>`r`n"
    }
}

Add-DirectoryXml -Path $Stage -Indent 8

$Files = Get-ChildItem $Stage -File -Recurse | Sort-Object FullName

$ComponentsXml = ""
$ComponentRefsXml = ""

$FileNumber = 1

foreach ($file in $Files) {
    $componentId = "CMP$FileNumber"
    $fileId = "FIL$FileNumber"
    $dirId = $DirIds[$file.DirectoryName]
    $source = Escape-Xml $file.FullName

    $ComponentsXml += "    <Component Id=`"$componentId`" Directory=`"$dirId`" Guid=`"*`">`r`n"
    $ComponentsXml += "      <File Id=`"$fileId`" Source=`"$source`" KeyPath=`"yes`" />`r`n"
    $ComponentsXml += "    </Component>`r`n"
    $ComponentRefsXml += "      <ComponentRef Id=`"$componentId`" />`r`n"

    $FileNumber++
}

$AppNameXml = Escape-Xml $AppName
$ManufacturerXml = Escape-Xml $Manufacturer

$Wxs = @"
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Package
    Name="$AppNameXml"
    Manufacturer="$ManufacturerXml"
    Version="$Version"
    UpgradeCode="$UpgradeCode"
    Scope="perMachine">

    <MajorUpgrade DowngradeErrorMessage="На компьютере уже установлена более новая версия $AppNameXml." />
    <MediaTemplate EmbedCab="yes" />

    <StandardDirectory Id="ProgramFiles64Folder">
      <Directory Id="INSTALLFOLDER" Name="$AppNameXml">
$DirectoryXml
      </Directory>
    </StandardDirectory>

    <StandardDirectory Id="ProgramMenuFolder">
      <Directory Id="ProgramMenuDir" Name="$AppNameXml" />
    </StandardDirectory>

$ComponentsXml

    <Component Id="ApplicationShortcut" Directory="ProgramMenuDir" Guid="$ShortcutComponentGuid">
      <Shortcut
        Id="StartMenuShortcut"
        Name="$AppNameXml"
        Description="Открыть сайт $AppNameXml"
        Target="[INSTALLFOLDER]index.html"
        WorkingDirectory="INSTALLFOLDER" />

      <RemoveFolder Id="ProgramMenuDir" On="uninstall" />

      <RegistryValue
        Root="HKLM"
        Key="Software\WeasleysWizardWheezes"
        Name="installed"
        Type="integer"
        Value="1"
        KeyPath="yes" />
    </Component>

    <Feature Id="MainFeature" Title="$AppNameXml" Level="1">
$ComponentRefsXml
      <ComponentRef Id="ApplicationShortcut" />
    </Feature>
  </Package>
</Wix>
"@

Set-Content -Path $WxsPath -Value $Wxs -Encoding UTF8

wix build $WxsPath -arch x64 -out $MsiPath

if ($LASTEXITCODE -ne 0) {
    throw "WiX build failed with exit code $LASTEXITCODE"
}

if (-not (Test-Path $MsiPath)) {
    throw "MSI-файл не был создан."
}

Write-Host ""
Write-Host "Готово:"
Write-Host $MsiPath
