# Google and Apple authentication

## Current implementation

API Calc Pro now has one Firebase Authentication adapter for Google and Apple across the web and Capacitor applications. It provides:

- Google and Apple provider actions instead of preview-only buttons.
- Persistent web sessions through IndexedDB.
- Native Google Credential Manager support on Android.
- Native Apple provider support for the future iOS wrapper.
- Session restoration, authentication-state observation, profile display, and sign-out.
- A configuration guard that keeps authentication inactive until the required platform registration is complete.

Authentication does not enable cloud synchronization or lifetime purchase ownership by itself. Calculations and project records remain local until those separately authorized services are implemented.

## Security boundary

- Never commit `google-services.json`, `GoogleService-Info.plist`, an Apple `.p8` private key, a service-account file, signing keys, or production credentials.
- Firebase web configuration values use `VITE_FIREBASE_*` variables. They identify the Firebase application but do not replace Firestore security rules or server-side entitlement verification.
- The registered Firebase Web app's public identification is committed as the production fallback so Vercel builds work without copying public values into every deployment. `VITE_FIREBASE_*` variables remain optional build-specific overrides; no Apple private key, OAuth client secret, service-account credential, or native configuration file is committed.
- The Apple private key, key ID, Team ID, and Service ID belong in the Apple Developer and Firebase consoles. They must not be placed in Vite variables.
- Account merging, purchase verification, entitlement changes, and user-owned cloud record authorization remain server-side operations.

## 1. Create the Firebase project

1. Open the Firebase console and create the API Calc Pro project.
2. Open **Authentication → Sign-in method**.
3. Enable **Google**.
4. Register a web application and copy its generated Firebase configuration.
5. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local`.
6. Replace the placeholder `VITE_FIREBASE_*` values in `.env.local`.
7. Under **Authentication → Settings → Authorized domains**, add the local development host and the eventual production domains. The current local host is `127.0.0.1`; the current Vercel domains must only be added when remote authentication testing is authorized.

## Access policy

- A signed-out visitor sees the Google and Apple provider choices before the workspace opens.
- **Continue without sign in** starts a non-persistent guest session limited to the API 570 Piping Systems module and its calculators.
- Guest mode does not expose API 510, API 653, API 571, Projects, Reports, Account settings, or existing local project records.
- Selecting a restricted destination returns the visitor to the sign-in gate. Reloading the website also shows the gate again unless Firebase restores a signed-in session.
- This client-side navigation policy controls the local application experience. Future paid entitlements and cloud data authorization must also be enforced by trusted server-side rules.

Run the app locally and open **Account → Sign in → Continue with Google**. Google sign-in should return to the app and the account profile should show the authenticated user.

## 2. Configure Google for Android

1. In Firebase, register an Android application with package name `com.libinvarghese.apicalcpro`.
2. Add the debug SHA-1 certificate for local testing. Add the Play App Signing SHA-1 and SHA-256 certificates before production release.
3. Download `google-services.json`.
4. Place it at `apps/mobile/android/app/google-services.json`. This path is ignored by Git.
5. Confirm Google is enabled in Firebase Authentication.
6. Set `VITE_NATIVE_FIREBASE_AUTH_ENABLED=true` only for a build that has the matching native configuration file.
7. Run `npm run android:sync --workspace @api-calc-pro/mobile`.
8. Build and test on an Android device or emulator with Google Play services.

The Capacitor configuration already loads `google.com`, and `android/variables.gradle` already enables the required Credential Manager dependency.

## 3. Configure Sign in with Apple

Apple provider activation requires active Apple Developer Program membership.

1. Register the API Calc Pro App ID using bundle ID `com.libinvarghese.apicalcpro`.
2. Enable the **Sign in with Apple** capability for that App ID.
3. Create the required Apple Service ID and Sign in with Apple private key.
4. In Firebase Authentication, enable **Apple** and enter the Service ID, Apple Team ID, private key, and key ID.
5. Register Firebase's callback URL in the Apple configuration: `https://YOUR_FIREBASE_PROJECT_ID.firebaseapp.com/__/auth/handler`.
6. Register the iOS Firebase application using bundle ID `com.libinvarghese.apicalcpro`.
7. Download `GoogleService-Info.plist` after the iOS wrapper is created and add it to `apps/mobile/ios/App/App/GoogleService-Info.plist` through Xcode. This file is ignored by Git.
8. Add **Sign in with Apple** under the iOS target's **Signing & Capabilities** section.
9. Add the Google reversed client ID URL scheme if Google login will also be available on iOS.
10. Set `VITE_NATIVE_FIREBASE_AUTH_ENABLED=true` only after the native configuration is present, then synchronize and test the iOS project on macOS/Xcode.

Apple may provide a private relay email and normally provides the user's name only on the first authorization. The UI therefore supports an account with no photo, no public email, or no returned display name.

## 4. Production verification gate

Before publishing authentication:

1. Verify Google sign-in, cancelled sign-in, sign-out, and restored sessions on web, Android, and iOS.
2. Verify Apple sign-in with both shared and hidden email options.
3. Confirm authorized domains and OAuth callback URLs exactly match production.
4. Confirm no secrets or platform configuration files are tracked by Git.
5. Publish a privacy policy that discloses Firebase Authentication and the provider SDKs.
6. Complete Google Play Data safety and Apple App Privacy declarations from the actual SDK behavior.
7. Implement server-authorized cloud records and purchase entitlement verification before representing account sign-in as cloud backup or paid-access proof.
