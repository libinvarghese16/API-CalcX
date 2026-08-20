# Local mobile and device-readiness gate

Status: local web, Android source synchronization, native compilation, debug packaging, phone-emulator, tablet-emulator, and offline cold-start gates passed on 20 August 2026. Physical Android hardware, release signing/store, iOS, identity, billing, encrypted-storage, and synchronization gates remain open.

## Completed locally

- Exercised Home, Calculators, Projects, Reports, and Account.
- Opened API 510, API 570, and API 653 workspaces, including the Annular Plate calculator.
- Verified the identity and lifetime-purchase controls remain disconnected previews rather than false production services.
- Verified phone safe areas, five-item bottom navigation, tablet side navigation, keyboard search, light/dark appearance, and Android hardware Back behavior.
- Replaced the default Capacitor Android icon/splash resources with generated resources from the approved API Calc Pro mark.
- Built, aligned, debug-signed, inspected, installed, and launched the APK.
- Ran the app-only Android instrumented identity test on both API 36 phone and tablet AVDs.
- Disabled Wi-Fi and mobile data, confirmed `Active default network: none`, force-stopped the app, and verified the packaged application cold-starts from local assets.
- Reserved dedicated spacing for module-card count labels after native tablet evidence exposed an overlap risk.

No equation, lookup, unit conversion, or result rule changed during this native milestone.

## Automated gate

- Protected source baseline: 6 files verified.
- Material catalog: 61 specifications verified.
- Mobile tests: 55 passed.
- Calculation-engine tests: 163 passed.
- Strict TypeScript checks: passed.
- Production build: passed.
- Offline precache inventory: 38 URLs generated.
- Android native sync: 40 production files verified byte-for-byte, plus two known Capacitor bridge stubs.
- Native JVM test: passed.
- Android lint: passed with no new app issue.
- App-only connected Android test: 1 passed on phone and 1 passed on tablet.
- APK alignment, v2 debug signature, package/version/SDK/label checks: passed.
- APK embedded-web verification: 40 production files match `dist` byte-for-byte.

## Artifact and evidence

The local debug artifact is `artifacts/android/api-calc-pro-debug.apk`. It is debug-signed and not suitable for a store upload.

Phone and tablet screenshots are indexed at `docs/evidence/android/README.md`.

## Remaining gates

1. Physical Android phone and tablet validation.
2. Complete accessibility checks with TalkBack and enlarged system text.
3. File import/export, sharing, printing, deep-link, process-death, low-memory, and long-duration offline validation on hardware.
4. Representative protected-source golden cases entered through the physical-device UI.
5. Release application ID/version approval, protected keystore, Play App Signing, AAB, Play internal/closed test, store listing, Data Safety, privacy and phased rollout.
6. macOS/Xcode iOS project creation, signing, simulator/physical-device testing, TestFlight, and App Store submission.
7. Server-side identity, one-time purchase verification/restoration, encrypted SQLite, entitlement enforcement, and cloud sync.
8. Keep API 579 outside Version 1 and keep remote publication disabled until explicitly authorized.
