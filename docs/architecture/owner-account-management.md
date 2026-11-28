# Owner account management

Scope: the mobile web application at https://api-calc-x-mobile.vercel.app/. Native Capacitor builds retain their existing access behavior until a separately configured server connection is available.

Owner: `libinvarghese16@gmail.com`. This is only a visibility hint in the frontend. Every administrative request verifies a non-revoked Firebase ID token, the current user's enabled status, verified email, and a separately configured immutable owner UID. An email match alone never grants authority.

## Activation required

The implementation is inactive until the server is configured. No credentials are committed. Publishing the frontend does not grant administrator authority or claim that the production backend has been tested.

1. In Firebase project **api-calc-x**, find this verified owner's account in Authentication / Users. Copy its UID to the Vercel **server environment variable** `ADMIN_OWNER_UID`.
2. Use the newly created **Firestore Standard / Native mode `(default)` database** in project api-calc-x. The console was checked before provisioning: there was no existing Firestore database. It uses production-mode deny-all client rules from `server/firestore-admin.rules`, and is reserved for server administration. Do not later open client access to the security collection.
3. Create a dedicated service account with Firebase Authentication Admin permissions and Firestore access for this administration backend. Configure its JSON credential as the sensitive Vercel server environment variable `FIREBASE_ADMIN_SERVICE_ACCOUNT`. Never use a `VITE_` prefix or commit/paste the credential into chat. Restrict the credential to the production mobile project and rotate it if exposed. Workload identity can replace the credential in a future deployment setup.
4. Set `ADMIN_ALLOWED_ORIGINS=https://api-calc-x-mobile.vercel.app`. Additional explicitly approved origins can be comma-separated. Preview deployments should remain unconfigured by default.
5. After confirming the private database denies client reads/writes, set server variable `ACCOUNT_ADMIN_ENABLED=true` and redeploy **api-calc-x-mobile**. Until then the existing sign-in flow continues and the owner's management section explains that setup is required. If enabled but credentials are missing, access checks fail closed.
6. Sign out and sign back in with the verified owner account. Within five minutes, create your private 8–12 digit PIN in the app. Do not share the PIN with the developer or put it in environment variables.
7. Verify with a disposable test account: list/search, disable/enable, revoke sessions, paid grant/revoke; verify that the test account cannot call administrative actions. Confirm server audit records and sign-in revocation before managing real customers.

## Behavior

- The owner enters a PIN after sign-in / reload and again to enter Account → Account management. The PIN does not replace Google/Apple authentication. PIN expiry hides and disables the workspace while retaining unsaved calculator inputs in memory.
- Login and management unlock tokens are distinct, random, purpose-bound, UID-bound and expire after 15 minutes. Only token hashes are stored in Firestore. Tokens and PINs are never persisted in browser storage.
- Closing management explicitly revokes its token. Sign-out attempts to revoke the in-memory login and management unlock tokens before clearing Firebase authentication. If connectivity fails, the tokens still expire after 15 minutes and require a valid owner Firebase ID token. Token expiry caps residual access. Changing the PIN invalidates all existing owner PIN sessions through a version check.
- PINs use salted scrypt hashing and timing-safe comparison. Five failed attempts in a 15-minute window block further attempts until the window expires. Rate state uses a Firestore transaction and survives serverless restarts. Successful PIN verification resets the failure window.
- Initial PIN creation and PIN changes require Firebase authentication within the last five minutes. Changing the PIN also requires the current PIN and an unlocked management session. If forgotten, an infrastructure administrator must remove only `security/pin_OWNER_UID` through the private database console, then have the owner freshly authenticate and set a new PIN; the new version invalidates old unlock sessions. There is no client reset bypass.
- Account lists contain only UID, email, display name, enabled state, paid-access override, and creation/last-login dates. No passwords, tokens, PIN records or other users' local projects are exposed.
- Controls: enable, disable, revoke refresh tokens, grant paid access, revoke paid access. Destructive account deletion, owner-role transfer, and editing other people's personal data are not included.
- Paid grants are manual `paidAccess` custom claims, not store receipt verification, payments or refunds. Other claims are retained. Unmanaged existing users keep their prior access. Explicitly revoked users are blocked from the signed-in workspace; grants restore it. Guest piping remains public as before.
- Access status comes from the server on entry, every minute and window focus. Disabled/revoked Firebase sessions fail checks; revoked paid access also revokes refresh tokens. Protected server requests verify token revocation immediately. Already-rendered/offline JavaScript calculators and local exports cannot be made confidential by a UI gate; no confidential server operation trusts the gate. Active managed sessions need connectivity for access checks.
- Audit records are created before user mutations and updated on success/failure. Auth API mutations and Firestore auditing cannot form one atomic transaction; `failed-or-partial` records require inspection rather than assuming rollback.
- API responses use `no-store`, and the service worker excludes `/api/`. No request body, PIN, token, credential or account record is logged.
- Expired token/attempt records can be cleaned up by a scheduled server task later; security checks enforce expiration independently of cleanup. Preserve audit records under your retention policy.

## Verification

`npm test` includes existing calculator suites and server security regression tests. `tools/test-account-management-browser.cjs` checks owner visibility, PIN flows, confirmations, expiry behavior, and responsive UI using local mocked backend responses. These tests do not substitute for the production activation checks above.

Sources: [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Firebase session revocation](https://firebase.google.com/docs/auth/admin/manage-sessions), [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [Firestore server access and rules](https://firebase.google.com/docs/firestore/security/rules-conditions).
