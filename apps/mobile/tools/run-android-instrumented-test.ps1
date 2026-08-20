$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "android-environment.ps1")
$environment = Set-ApiCalcAndroidEnvironment
$appDirectory = Split-Path $PSScriptRoot -Parent
$androidDirectory = Join-Path $appDirectory "android"
$gradle = Join-Path $androidDirectory "gradlew.bat"
$adb = Join-Path $environment.AndroidSdk "platform-tools\adb.exe"

$devices = & $adb devices
$onlineDevices = @($devices | Select-String "\sdevice$")
if ($onlineDevices.Count -eq 0) {
    throw "No online Android emulator or device is available."
}

Push-Location $androidDirectory
try {
    & $gradle --no-daemon :app:connectedDebugAndroidTest
    if ($LASTEXITCODE -ne 0) { throw "App instrumented test failed." }
}
finally {
    Pop-Location
}

$platformDirectory = Split-Path (Split-Path $appDirectory -Parent) -Parent
$apk = Join-Path $platformDirectory "artifacts\android\api-calc-pro-debug.apk"
if (-not (Test-Path -LiteralPath $apk)) {
    throw "Verified debug APK not found. Run android:build-debug first."
}
& $adb install -r $apk
if ($LASTEXITCODE -ne 0) { throw "Debug APK installation failed." }

$launchOutput = (& $adb shell am start -W -n com.libinvarghese.apicalcpro/.MainActivity) -join "`n"
if ($LASTEXITCODE -ne 0 -or -not $launchOutput.Contains("Status: ok")) {
    throw "Installed app did not launch successfully."
}

Write-Host "App instrumented test passed on $($onlineDevices.Count) online Android target(s)."
Write-Host "Installed and launched com.libinvarghese.apicalcpro/.MainActivity."
