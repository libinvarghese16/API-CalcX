# API Calc Pro development rules

## Product boundaries

1. Version 1 includes API 510, API 570, API 653, API 571, engineering tools, projects, reports, accounts, offline storage, cloud sync, and lifetime purchase ownership.
2. Do not add API 579 to Version 1.
3. Do not add copyrighted API or ASME standards PDFs, scanned pages, copied figures, or copied standards tables.
4. Reference content must be original explanatory writing with a citation to the applicable standard, edition, clause, table, or figure where appropriate.

## Calculation safety

1. Never modify an engineering equation, lookup value, result rule, unit conversion, or dropdown dependency without explicit approval.
2. A calculation change requires a golden regression case, a unit test, an existing-web comparison, and recorded numerical tolerance.
3. UI-only tasks must not change calculation behavior.
4. Reports must consume the same structured result object shown in the application. Do not recalculate independently in a report template.
5. Until the shared engine is validated, prototype calculations must be visibly labeled and must not be represented as production engineering results.

## Security and data

1. Never commit secrets, service-account files, signing keys, Apple private keys, Android keystores, or production credentials.
2. Never trust lifetime entitlement state supplied only by a client.
3. Purchase verification, entitlement changes, account merging, administrator roles, and audit deletion are server-side operations.
4. All user-owned cloud records must enforce owner authorization.
5. Production Firestore or storage rules must never use unconditional read or write access.
6. Validate every user-controlled field and imported file.
7. Preserve offline access without bypassing purchase revocation checks when the device reconnects.

## Delivery quality

1. TypeScript strict mode stays enabled.
2. Every feature includes proportional tests.
3. Validate phone, tablet, light, dark, keyboard, and accessibility behavior.
4. Keep production web source isolated until the extracted calculation engine passes regression checks.
5. Work locally until the user explicitly authorizes remote services or publishing.
