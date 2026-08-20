# API 510 review and report workflow

Status: implemented for the local web/mobile preview on 13 August 2026, including persisted review and approval control.

## Scope

The API 510 vertical slice now has functional Basis, Inputs, Review, and Report steps. This milestone creates an original screen-and-text report preview only. It does not generate or bundle standards PDFs, copied code paragraphs, scanned figures, or copyrighted reference tables.

## Single-result data flow

The calculation engine creates one structured result object. The live result card, review dialog, saved calculation record, Reports page, report preview, and copied text all consume that same result snapshot. The report formatter performs display-unit conversion and rounding only; it does not run geometry, corrosion, remaining-life, MAWP, projection, or test-pressure equations.

The persisted input snapshot now also records the already-resolved automatic values for allowable stress, years in service, and years since previous inspection. This lets a later report show the exact resolved values that were used without independently deriving them again. Older local records remain readable and show the relevant automatic source when a resolved value is unavailable.

## Review behavior

- Review displays project, equipment, entered field units, material and geometry basis, the complete governing result summary, engine issues, manual overrides, engine identity, and protected parity status.
- Continue to report remains disabled until the calculation is valid and the user confirms the local review statement.
- Reviewer name and optional review notes are stored with the exact calculation fingerprint, timestamp, revision, and history event.
- The confirmation is tied to the complete record fingerprint. Any input, unit, project assignment, title, equipment, or result change immediately returns the workflow to Draft and invalidates current review/approval sign-off.
- Review confirmation is a local workflow marker only. It is explicitly not engineering approval, code certification, or report issue.

## Controlled local status workflow

The calculation status cannot be selected directly in the general Save dialog. Valid transitions are:

| From | Action | To | Required local metadata |
| --- | --- | --- | --- |
| New or edited | Save | Draft | Preparer name |
| Draft | Record review | Reviewed | Reviewer name, confirmation, optional notes, current fingerprint |
| Reviewed | Approve | Approved | Approver name, confirmation, optional notes, matching reviewed fingerprint |
| Reviewed or Approved | Edit calculation content | Draft, next revision | Preparer identity and revision event |

Every saved record has a workflow object with the current revision and append-only local event history. Review and approval methods reject stale fingerprints, invalid engine results, missing names, and out-of-order transitions. Editing an already reviewed or approved record increments the revision, clears current sign-off fields, and preserves the previous events in history.

Existing records from the earlier `completed` status are migrated locally to `reviewed` with a visible migration note. No data is uploaded or sent to a remote service.

## Report content

The report preview includes:

1. Report number, working status, preparer, and timestamp.
2. Project, client, site, equipment tag, and equipment name.
3. Component geometry, pressure, temperature, material, stress, efficiency, and selected input units.
4. Thickness history, build year, inspection year, resolved service periods, and next interval.
5. Required thickness, minimum thickness used, current MAWP, remaining life, all corrosion rates, and corrosion allowance.
6. Projected thickness, future-MAWP thickness, future MAWP, and hydrostatic/pneumatic planning pressures.
7. Engine ID/version, source parity statement, issues, and overrides.
8. Draft/Reviewed/Approved status, revision, preparer, reviewer, approver, notes, timestamps, signatures, and event history.

The text-copy action exports this same report view model as plain text. No separate formula path exists.

## Validation

Automated report tests prove Metric output, U.S. output from the same result snapshot, mixed field-unit preservation, issue/override visibility, text rendering, workflow metadata, revision history, and direct consumption of supplied result values. Repository tests cover ordered transitions, stale-sign-off invalidation, revised drafts, duplication, migration, and malformed-storage recovery. The permanent 45-test calculation suite remains unchanged and must continue to pass before this UI/report workflow is accepted.
