# Local workspace backup and restore

Status: implemented for the browser-local development adapter on 13 August 2026.

## Purpose

The local user-backup milestone provides a portable JSON copy of API Calc Pro projects before encrypted native SQLite and cloud synchronization are connected. It is a device-local data portability feature, not a substitute for production encrypted storage or cloud backup.

## Backup envelope

Every download uses the explicit `api-calc-pro-workspace-backup` format with backup version `1` and workspace schema version `1`. The envelope records:

- Workspace or single-project scope.
- Export timestamp and local application version.
- Projects, equipment, calculations, input snapshots, exact structured result snapshots and engine versions.
- Draft/Reviewed/Approved workflow state, reviewer/approver metadata and revision history.

The JSON contains user-entered engineering project data. Users should store it in an appropriately controlled location. The application does not upload the file or add standards PDFs, copied standards text, credentials or secrets.

## Restore validation

Restore accepts only JSON files up to the local UI limit of 5 MB. Before the import button is enabled, the repository verifies the format identifier, backup version, schema version, scope, timestamp, metadata and every nested project/equipment/calculation record. Legacy `completed` records are normalized through the same migration used by normal local workspace loading.

The preview reports source counts and the exact merge impact. A separate confirmation is required before import.

## Safe merge behavior

Import is merge-only in this milestone:

1. A project ID not present locally is added with its complete equipment and calculation records.
2. A matching project ID keeps local project metadata.
3. Missing equipment IDs are added beneath the matching project.
4. Missing calculation IDs are added beneath matching equipment.
5. Existing calculation IDs are counted and skipped without overwrite.
6. No existing project, equipment, calculation, result, sign-off or revision event is deleted or replaced.

There is intentionally no destructive replace-workspace mode.

## User surfaces

- Account → Backup and restore exports the complete workspace and previews/imports a selected file, with a paste-JSON fallback for platforms where file picking is inconvenient.
- A selected project has an Export JSON action for a single-project backup.
- Export uses the browser/native download surface; import uses the platform file picker.

## Verification

Repository tests cover complete-workspace export, single-project export, exact result/workflow preservation, preview counts, first import, duplicate re-import and malformed/unsupported file rejection. The unchanged API 510 calculation regression suite remains the numerical acceptance gate.
