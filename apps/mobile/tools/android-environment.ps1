$ErrorActionPreference = "Stop"

function Get-ApiCalcJavaHome {
    $candidates = @()

    if ($env:JAVA_HOME) {
        $candidates += $env:JAVA_HOME
    }

    $candidates += Join-Path $env:LOCALAPPDATA "Programs\Microsoft\OpenJDK-21.0.12.1-portable\jdk-21.0.12.1+1"

    $programFilesJava = Join-Path $env:ProgramFiles "Microsoft\jdk-*"
    $candidates += Get-Item $programFilesJava -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -ExpandProperty FullName

    foreach ($candidate in $candidates | Where-Object { $_ } | Select-Object -Unique) {
        $javaExecutable = Join-Path $candidate "bin\java.exe"
        $releaseFile = Join-Path $candidate "release"
        if (-not (Test-Path -LiteralPath $javaExecutable) -or -not (Test-Path -LiteralPath $releaseFile)) {
            continue
        }

        $release = Get-Content -LiteralPath $releaseFile -Raw
        if ($release -match 'JAVA_VERSION="21(?:\.|\")') {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "Microsoft OpenJDK 21 was not found. Install JDK 21 or set JAVA_HOME to a JDK 21 directory."
}

function Get-ApiCalcAndroidSdk {
    $candidates = @(
        $env:ANDROID_SDK_ROOT,
        $env:ANDROID_HOME,
        (Join-Path $env:LOCALAPPDATA "Android\Sdk")
    )

    foreach ($candidate in $candidates | Where-Object { $_ } | Select-Object -Unique) {
        if (Test-Path -LiteralPath (Join-Path $candidate "platform-tools\adb.exe")) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "Android SDK Platform Tools were not found. Install the Android SDK or set ANDROID_SDK_ROOT."
}

function Get-ApiCalcAndroidBuildRoot {
    if ($env:API_CALC_PRO_ANDROID_BUILD_ROOT) {
        return [System.IO.Path]::GetFullPath($env:API_CALC_PRO_ANDROID_BUILD_ROOT)
    }

    return Join-Path $env:LOCALAPPDATA "ApiCalcPro\gradle-build"
}

function Set-ApiCalcAndroidEnvironment {
    $javaHome = Get-ApiCalcJavaHome
    $androidSdk = Get-ApiCalcAndroidSdk
    $buildRoot = Get-ApiCalcAndroidBuildRoot

    $env:JAVA_HOME = $javaHome
    $env:ANDROID_HOME = $androidSdk
    $env:ANDROID_SDK_ROOT = $androidSdk
    $env:API_CALC_PRO_ANDROID_BUILD_ROOT = $buildRoot

    [pscustomobject]@{
        JavaHome = $javaHome
        AndroidSdk = $androidSdk
        BuildRoot = $buildRoot
    }
}
