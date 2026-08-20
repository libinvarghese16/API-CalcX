param(
    [string]$ApkPath = ""
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "android-environment.ps1")
$environment = Set-ApiCalcAndroidEnvironment

function Get-ApiCalcSha256 {
    param([string]$Path)

    $stream = [System.IO.File]::OpenRead($Path)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hashBytes = $sha256.ComputeHash($stream)
        return ([BitConverter]::ToString($hashBytes)).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $sha256.Dispose()
        $stream.Dispose()
    }
}

$appDirectory = Split-Path $PSScriptRoot -Parent
if (-not $ApkPath) {
    $platformDirectory = Split-Path (Split-Path $appDirectory -Parent) -Parent
    $ApkPath = Join-Path $platformDirectory "artifacts\android\api-calc-pro-debug.apk"
}
$ApkPath = (Resolve-Path -LiteralPath $ApkPath).Path

$buildTools = Get-ChildItem -LiteralPath (Join-Path $environment.AndroidSdk "build-tools") -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "apksigner.bat") } |
    Sort-Object { [version]$_.Name } -Descending |
    Select-Object -First 1
if (-not $buildTools) {
    throw "No Android build-tools directory containing apksigner was found."
}

$zipalign = Join-Path $buildTools.FullName "zipalign.exe"
$apksigner = Join-Path $buildTools.FullName "apksigner.bat"
$aapt = Join-Path $buildTools.FullName "aapt.exe"

& $zipalign -c -P 16 4 $ApkPath
if ($LASTEXITCODE -ne 0) { throw "zipalign verification failed." }

& $apksigner verify --verbose --print-certs $ApkPath
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed." }

$badging = (& $aapt dump badging $ApkPath) -join "`n"
if ($LASTEXITCODE -ne 0) { throw "aapt could not inspect the APK." }

$expectedBadging = @(
    "name='com.libinvarghese.apicalcpro'",
    "versionCode='1'",
    "versionName='1.0'",
    "sdkVersion:'24'",
    "targetSdkVersion:'36'",
    "application-label:'API Calc Pro'"
)
foreach ($expected in $expectedBadging) {
    if (-not $badging.Contains($expected)) {
        throw "APK badging does not contain the expected value: $expected"
    }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($ApkPath)
try {
    $distDirectory = Join-Path $appDirectory "dist"
    $distRootPrefix = (Resolve-Path -LiteralPath $distDirectory).Path.TrimEnd("\") + "\"
    $distFiles = Get-ChildItem -LiteralPath $distDirectory -File -Recurse
    $distRelativePaths = @($distFiles | ForEach-Object {
        $_.FullName.Substring($distRootPrefix.Length).Replace("\", "/")
    })
    $expectedPublicEntries = @($distRelativePaths | ForEach-Object { "assets/public/$_" })
    $allowedBridgeEntries = @("assets/public/cordova.js", "assets/public/cordova_plugins.js")
    $actualPublicEntries = @($archive.Entries |
        Where-Object { -not $_.FullName.EndsWith("/") -and $_.FullName.StartsWith("assets/public/") } |
        Select-Object -ExpandProperty FullName)

    $missing = @($expectedPublicEntries | Where-Object { $_ -notin $actualPublicEntries })
    $unexpected = @($actualPublicEntries | Where-Object {
        $_ -notin $expectedPublicEntries -and $_ -notin $allowedBridgeEntries
    })
    if ($missing.Count -gt 0 -or $unexpected.Count -gt 0) {
        throw "APK web asset inventory mismatch. Missing: $($missing -join ', '); unexpected: $($unexpected -join ', ')."
    }

    foreach ($distFile in $distFiles) {
        $relativePath = $distFile.FullName.Substring($distRootPrefix.Length).Replace("\", "/")
        $entry = $archive.GetEntry("assets/public/$relativePath")
        if (-not $entry) { throw "APK asset is missing: $relativePath" }

        $stream = $entry.Open()
        $memory = [System.IO.MemoryStream]::new()
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        try {
            $stream.CopyTo($memory)
            $hashBytes = $sha256.ComputeHash($memory.ToArray())
            $apkHash = ([BitConverter]::ToString($hashBytes)).Replace("-", "").ToLowerInvariant()
        }
        finally {
            $sha256.Dispose()
            $memory.Dispose()
            $stream.Dispose()
        }

        $distHash = Get-ApiCalcSha256 $distFile.FullName
        if ($apkHash -ne $distHash) {
            throw "APK asset differs from dist: $relativePath"
        }
    }

    foreach ($registry in @("assets/capacitor.config.json", "assets/capacitor.plugins.json")) {
        if (-not $archive.GetEntry($registry)) { throw "APK is missing $registry" }
    }
}
finally {
    $archive.Dispose()
}

$brandSource = Join-Path $appDirectory "public\brand\api-calc-mark.png"
$nativeBrandSource = Join-Path $appDirectory "resources\logo.png"
if ((Get-ApiCalcSha256 $brandSource) -ne (Get-ApiCalcSha256 $nativeBrandSource)) {
    throw "The native branding source does not match the approved API Calc Pro mark."
}

$apkItem = Get-Item -LiteralPath $ApkPath
$apkHash = Get-ApiCalcSha256 $ApkPath
Write-Host "Verified Android debug APK: $($apkItem.FullName)"
Write-Host "Package com.libinvarghese.apicalcpro, version 1.0 (1), min SDK 24, target SDK 36."
Write-Host "Verified $($distFiles.Count) production assets byte-for-byte inside the APK plus two Capacitor bridge stubs."
Write-Host "APK bytes: $($apkItem.Length)"
Write-Host "APK SHA-256: $apkHash"
