$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "android-environment.ps1")
$environment = Set-ApiCalcAndroidEnvironment
$appDirectory = Split-Path $PSScriptRoot -Parent
$gradle = Join-Path $appDirectory "android\gradlew.bat"

Write-Host "Using JDK: $($environment.JavaHome)"
Write-Host "Using Android SDK: $($environment.AndroidSdk)"
Write-Host "Using local Gradle output: $($environment.BuildRoot)"

Push-Location (Join-Path $appDirectory "android")
try {
    & $gradle --no-daemon testDebugUnitTest assembleDebug lintDebug
    if ($LASTEXITCODE -ne 0) { throw "Android debug build or validation failed." }
}
finally {
    Pop-Location
}

$builtApk = Join-Path $environment.BuildRoot "app\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path -LiteralPath $builtApk)) { throw "Gradle did not produce the expected debug APK: $builtApk" }

$platformDirectory = Split-Path (Split-Path $appDirectory -Parent) -Parent
$artifactDirectory = Join-Path $platformDirectory "artifacts\android"
$artifactApk = Join-Path $artifactDirectory "api-calc-pro-debug.apk"
New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
Copy-Item -LiteralPath $builtApk -Destination $artifactApk -Force

& (Join-Path $PSScriptRoot "verify-debug-apk.ps1") -ApkPath $artifactApk
