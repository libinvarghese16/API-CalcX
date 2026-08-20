# Local project workspace

Status: first browser-local implementation completed for local development.

## Current capability

- Create a project with name, client, site, and description.
- Archive, restore, or intentionally delete a project.
- Save an API 510 calculation beneath a pressure-vessel equipment tag.
- Store the complete display-input snapshot, unit system, automatic/manual modes, structured engine result, issues, and engine version.
- Update, reopen, duplicate, and delete calculation records.
- Recover the workspace after browser refresh or application restart.
- Quarantine malformed workspace JSON under a separate recovery key instead of crashing or overwriting the malformed value.
- Preserve Draft/Reviewed/Approved workflow metadata and revision history.
- Export the complete workspace or one project as a versioned JSON backup.
- Preview and safely merge missing records from a validated backup without overwriting local IDs.

## Development storage boundary

The current browser preview uses a versioned `localStorage` adapter behind `LocalProjectRepository`. This is suitable for the local web-development milestone and makes the UI workflow testable now. It is not represented as encrypted production storage.

The repository boundary is intentionally independent of React and the calculation engine. The native milestone will replace the browser adapter with encrypted SQLite while preserving the same project, equipment, and calculation record contracts. Platform encryption keys must be stored through Keychain/Keystore-backed secure storage rather than source code or ordinary preferences.

## Schema version 1

```text
Workspace
  Project
    Equipment
      Saved API 510 calculation
        Input snapshot
        Structured result
        Engine version
        Workflow status and revision history
```

All records use stable local IDs and ISO timestamps. Calculation records carry their project and equipment IDs so they can later participate in a controlled sync queue without changing the engineering result object.

## Verification

- Repository tests cover create/reload, save/update, equipment reuse, duplication, archive/delete, malformed-data quarantine, workflow transitions, migration and backup/restore.
- The local browser workflow was verified as create project → calculate → save → refresh → reopen → update.
- The saved flat circular-head case reopened with `d = 200 mm`, `C = 0.3`, required thickness `12.39 mm`, and future MAWP `2.027 MPa`.
- The project workspace was checked at a 390 × 844 viewport in light and dark themes with no horizontal overflow.

No engineering equation or lookup table changed in this milestone. The existing 45 calculation regressions remain the calculation acceptance gate.
