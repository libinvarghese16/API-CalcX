# Phase 0 baseline

Recorded on 12 August 2026 before creating the isolated mobile-platform scaffold.

## Existing application

The current application remains in the parent workspace and is not modified by this platform scaffold. The recorded source includes the working HTML shell, presentation layer, calculation script, API 571 data, and piping/vessel material datasets.

The baseline hashes are stored in `tools/source-baseline.json` and verified with `npm run verify:baseline`.

## Version 1 boundaries

Included:

- API 510 pressure-vessel calculators
- API 570 individual piping, tube, header, and Other Piping Calculations; bulk Piping calculation table and Tube calculation table are excluded from mobile
- API 653 storage-tank calculators
- API 571 original damage-mechanism reference content
- Engineering tools and unit conversion
- Accounts, projects, reports, offline storage, synchronization, and lifetime ownership

Excluded:

- API 579
- Bundled standards PDFs
- Copied standards pages, figures, tables, and long verbatim extracts

## First vertical slice

The first production vertical slice will cover welcome, authentication, home, project creation, one approved API 510 calculator, local persistence, cloud synchronization, report generation, lifetime entitlement, sign-out, and restoration on another device.

The current UI milestone precedes calculation extraction and therefore labels calculation output as a prototype.
