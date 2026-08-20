# API Calc Pro Platform

Local-first development workspace for the new API Calc Pro mobile application.

## Current milestone

- Isolated from the existing production web application
- Modern React and TypeScript mobile UI preview
- API 510, API 570, API 653, and API 571 product navigation
- API 570 mobile scope limited to four individual workspaces; the bulk Piping calculation table and Tube calculation table are explicitly excluded
- Individual API 570 Piping workspace connected to the `api570.piping` typed engine with protected-source Metric parity, equivalent U.S. input coverage, mixed-unit entry, code-route guards and visible result tracing
- Individual API 570 Tube workspace connected to the `api570.tube` typed engine with welded/expanded end dependency, editable automatic minimum thickness, mixed-unit entry, corrosion projections and protected-source result parity
- Individual API 570 Header workspace connected to the `api570.header` typed engine with PG-27.2.2 formula parity, editable automatic years/minimum thickness, mixed-unit entry, corrosion projections and visible result tracing
- API 570 Other Piping Calculations library completed with all eight typed engines through `api570.support.soil-resistivity`; every route has protected-source parity, mixed-unit entry, disclosed edge behavior and visible result tracing
- All 11 individual API 570 project workflows connected end to end: exact UI and normalized engine snapshots, local save/update/reopen, fingerprinted Draft/Reviewed/Approved revision control, correctly labelled project history, and original text-only report previews sourced from each displayed structured result
- API 653 controlled migration is complete across Bottom, corrected Annular, Shell Course, Nozzle Assessment, Roof Plate, and Other 4.3.2 Calculations; every workspace has protected-source parity, mixed units, editable automatic dependencies, and no displayed standards table or PDF
- Shared calculation presentation policy: all standard API 510/API 570/API 653 engineering values use two decimal places and corrosion rates use three, while engine values, saved snapshots, and live unit-conversion inputs retain full calculation precision
- Projects, reports, account, authentication, and lifetime-access UI previews
- Original reference-writing pattern with no bundled standards PDFs
- Source-baseline verification for the existing application
- Typed shared calculation-engine package
- API 510 cylindrical-shell, spherical-shell, ellipsoidal-head, torispherical-head, hemispherical-head, conical-head, and flat circular-head engines connected; the shared calculation package now passes 163 API 510/API 570/API 653 parity, dependency, selection-boundary, auto/manual override, inspection-year, service-year, material-catalog, and unit-conversion cases
- Direct searchable library access to all seven validated API 510 geometry calculators with correct component and geometry-field presets
- Protected original-web comparison gate and retrospective parity matrix recorded for all seven current API 510 geometries
- Synchronized 61-specification pressure-vessel material catalog with dependent grade and temperature/stress lookup
- Functional Metric and U.S. customary input/output conversion through one SI calculation engine
- Highlighted Auto/Manual controls for calculated values, including years in service and years since the previous inspection, with overrides disclosed in the result trace
- Functional versioned local project workspace with project creation, equipment records, API 510 and API 570 Piping save/update/reopen history, Draft/Reviewed/Approved revision control, malformed-data recovery, and safe JSON backup/restore
- Versioned whole-workspace and single-project JSON export with validated merge-only import, duplicate protection and impact preview
- Browser-local development adapter verified across refresh; encrypted SQLite remains the native storage milestone
- Local install shell includes Android/iOS web-app metadata, dynamic viewport and safe-area handling, larger phone touch targets, a production-only service worker, and an exact generated 38-file offline precache list
- Isolated Capacitor 8.5 Android source wrapper under `apps/mobile/android`, with the API Calc Pro application identity, native hardware-back policy, Android automatic backup disabled, and byte-for-byte production-asset verification after every native sync
- Compiled Android debug APK with approved launcher/splash branding, repeatable local build and verification scripts, and API 36 phone/tablet emulator validation

Authentication, billing, synchronization, encrypted SQLite, and the iOS wrapper are intentionally not connected yet. The Android debug package is compiled and emulator-validated, but it is not release-signed, Play-ready, or physically device-validated. The browser-local repository is a development adapter, not production encrypted storage. The shared API 510/API 570/API 653 engines match the protected legacy routes; the applicable controlled code edition still requires engineering confirmation before report issue.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local address printed by Vite. The default requested address is `http://127.0.0.1:4310`.

## Validate

```powershell
npm.cmd run check
```

Synchronize the tested production bundle into the local Android project and verify every copied asset:

```powershell
npm.cmd run android:sync --workspace @api-calc-pro/mobile
```

Build and fully inspect the local Android debug APK:

```powershell
npm.cmd run android:build-debug --workspace @api-calc-pro/mobile
```

With an emulator or Android device already online, run the native identity test, install the verified APK, and launch it:

```powershell
npm.cmd run android:instrumented-test --workspace @api-calc-pro/mobile
```

The current local artifact is `artifacts/android/api-calc-pro-debug.apk`. It is debug-signed for local testing only.

See [docs/architecture/native-android-wrapper.md](docs/architecture/native-android-wrapper.md) for the verified Android matrix and the physical-device, release-signing, store, and iOS gates that remain.
