# Native Android wrapper

Status: the isolated Capacitor Android application was compiled, packaged, inspected, installed, and exercised on API 36 phone and tablet emulators on 20 August 2026. Physical-device testing, release signing, Android App Bundle generation, Play Console work, and iOS remain open gates.

## Locked architecture

- Native runtime: Capacitor 8.5.0.
- Native project: `apps/mobile/android`. The older root-level Android WebView package is not reused.
- Application ID: `com.libinvarghese.apicalcpro` (provisional until confirmed before the first Play Console upload).
- Application name: `API Calc Pro`.
- Web source: tested Vite production output in `apps/mobile/dist`.
- Android support: minimum SDK 24, compile SDK 36, target SDK 36.
- Registered native plugin: `@capacitor/app` 8.1.1 for hardware-Back handling.
- Branding: the approved `public/brand/api-calc-mark.png` is the checked native icon source; generated adaptive, legacy, round, light-splash, and dark-splash resources are stored in the Android project.
- Local-data protection: Android automatic backup is disabled while browser storage is still the development adapter.
- Network state: only Android's standard Internet permission is present. There is no cleartext opt-in, identity provider, billing SDK, analytics SDK, remote API, or cloud sync service.
- Gradle output: generated build state is written to `%LOCALAPPDATA%\ApiCalcPro\gradle-build` to avoid OneDrive file locking. The finished APK is copied back to `artifacts/android`.

No equation, lookup, unit conversion, decimal rule, selection rule, saved calculation schema, or report calculation was changed by the native-wrapper work. The single presentation correction reserves space between calculator module descriptions and their bottom count labels.

## Verified workstation toolchain

| Component | Verified local version |
| --- | --- |
| Android Studio | 2026.1 (installed package 2026.1.3.7) |
| Microsoft OpenJDK | 21.0.12.1 LTS |
| Android command-line tools | 22.0 |
| Android Platform | API 36 revision 2 |
| Android Build Tools | 35.0.0 and 36.0.0 |
| Android Platform Tools | 37.0.1 |
| Android Emulator | 37.1.11 |
| Emulator image | API 36 Google APIs x86_64 revision 7 |

The Android Studio bundled Java 25 runtime is not used for this wrapper because its Gradle 8.14.3 wrapper is run with JDK 21.

## Repeatable local commands

From `api-calc-pro-platform`:

```powershell
npm.cmd run check
npm.cmd run android:build-debug --workspace @api-calc-pro/mobile
```

`android:build-debug` performs all of the following:

1. Strict TypeScript and Vite production build.
2. Exact offline-precache generation.
3. Capacitor Android synchronization.
4. Path and SHA-256 comparison between all production files in `dist` and the native asset directory.
5. Native JVM test, debug compilation, Android lint, and APK assembly.
6. APK alignment and debug-signature verification.
7. `aapt` checks for package, version, label, minimum SDK, and target SDK.
8. Direct ZIP inspection proving every production file inside the APK matches `dist` byte-for-byte and that only the two expected Capacitor bridge stubs are additional web files.
9. Branding-source hash comparison against the approved API Calc Pro mark.

With an emulator or controlled Android device already online:

```powershell
npm.cmd run android:instrumented-test --workspace @api-calc-pro/mobile
```

That command deliberately targets `:app:connectedDebugAndroidTest`, installs the already verified artifact, and launches `com.libinvarghese.apicalcpro/.MainActivity`. The aggregate Gradle instrumentation task is not used because the generated empty Cordova compatibility module carries an unrelated Kotlin-stdlib dependency conflict.

## Current local artifact

- File: `artifacts/android/api-calc-pro-debug.apk`
- Package: `com.libinvarghese.apicalcpro`
- Version: `1.0` (`versionCode` 1)
- Minimum/target SDK: 24/36
- Size: 12,382,964 bytes
- SHA-256: `5515c311051a36cc8d0f88d703a89bd9b7d62dc14ca142842d5d9681d2da2d20`
- Signature: Android Debug certificate, APK Signature Scheme v2
- Web contents: 40 production files verified byte-for-byte, plus `cordova.js` and `cordova_plugins.js`

This APK is for local testing only. It is not a release binary and must not be uploaded to Google Play.

## Emulator validation matrix

| Target | Native checks completed |
| --- | --- |
| Pixel 7 phone AVD, API 36, 1080 x 2400 | Cold/warm launch, approved launcher mark, light and dark UI, all five bottom tabs, keyboard search, Projects, Reports, Account, Annular Plate workspace, hardware Back to library/Home, exit to launcher, no application-fatal log entry |
| Pixel Tablet AVD, API 36, 2560 x 1600 | Landscape tablet shell, light and dark UI, calculator grid, long-card spacing correction, app-only instrumented identity test, installation and launch, offline cold start with no active default network |

The phone and tablet AVDs are named `API_Calc_Pro_Pixel_7_API_36` and `API_Calc_Pro_Pixel_Tablet_API_36`. Screenshots are indexed in `docs/evidence/android/README.md`.

The native hardware-Back policy verified on the phone is:

1. Close an open navigation menu.
2. Return any API 510/API 570/API 653 workspace to Calculators.
3. Return Projects, Reports, Account, or Calculators to Home.
4. Hand control to the Android launcher only when already on Home.

## Remaining Android gates

1. Install the exact verified APK on at least one controlled physical phone and one controlled physical tablet.
2. Repeat calculator entry, keyboard, Back gesture, light/dark, orientation, offline cold start, file import/export, process restoration, and low-memory restoration.
3. Run TalkBack, font-scaling, contrast, focus-order, and switch-access checks; the current emulator pass verifies layout and touch sizing but is not a complete assistive-technology certification.
4. Re-run representative protected-source golden cases inside the installed physical-device build before engineering release.
5. Approve the final application ID and versioning policy.
6. Create and protect a release keystore, enable Play App Signing, produce a release AAB, and test through Play internal/closed tracks.
7. Complete privacy policy, Data Safety, content rating, store listing, screenshots, support URL, crash/ANR monitoring decision, and phased rollout plan.
8. Connect identity, lifetime purchase verification/restoration, encrypted SQLite, and cloud synchronization only after the server-side security design is approved.

## iOS boundary

Capacitor 8 iOS compilation requires macOS with Xcode. No iOS project is compiled or signed on this Windows workstation. The shared web bundle can be wrapped later, but Apple sign-in, StoreKit lifetime purchase and restoration, safe areas, keyboard behavior, offline files, process restoration, TestFlight, accessibility, signing, and App Store submission must be tested on controlled Apple hardware.

## Security and dependency note

`npm audit --omit=dev` reports zero production vulnerabilities. The Capacitor CLI development dependency currently reports moderate transitive advisories and is not part of the application runtime. No forced downgrade or unsafe audit fix was applied.

## Official references

- [Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor Android workflow](https://capacitorjs.com/docs/android)
- [Capacitor App plugin and Android Back button](https://capacitorjs.com/docs/apis/app)
- [Android SDK command-line package manager](https://developer.android.com/tools/sdkmanager)
- [Capacitor splash screens and icons](https://github.com/ionic-team/capacitor-docs/blob/main/docs/main/guides/splash-screens-and-icons.md)
