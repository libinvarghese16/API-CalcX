# API 570 local project workflow

Status: All 11 individual API 570 workflows completed and browser-verified locally on 13 August 2026.

## Completed calculators

1. Individual Piping
2. Individual Tube
3. Individual Header
4. Pressure Design Thickness
5. Valve and Flanged Fittings Thickness
6. Hydro Test Pressure
7. Flange Hydro Test
8. Pneumatic Test Pressure
9. Fillet Weld Sizing
10. Tension Test
11. Soil Resistivity

The Piping calculation table and Tube calculation table remain intentionally excluded from the mobile application.

## Shared local project workflow

- Saves the exact visible UI input snapshot, selected input units, automatic/manual modes, and the normalized SI engine input.
- Stores the exact typed structured result displayed by the selected calculator. Every saved calculator discriminator is bound to its protected engine ID; reports do not recalculate values independently.
- Reopens the saved record into the editable calculator with the recorded values and units restored.
- Records Draft, Reviewed, and Approved transitions with revision number, actor, note, timestamp, and a deterministic content fingerprint.
- Returns a changed reviewed or approved record to a new Draft revision and clears stale review and approval signatures.
- Lists every API 570 record with its correct calculator label in the selected local project and includes it in versioned JSON backup counts and merge behavior.
- Provides an original text-only report preview and clipboard export. No PDF, copied standard text, or copyrighted table is included.
- Applies the shared display policy to the calculator and report: standard engineering values use two decimal places, corrosion rates use three, and the stored structured result remains full precision.

## Browser verification

The local workflow was exercised from the Piping calculator through save, Projects listing, reopen, engineering review, report preview, and local approval. The reopened default record retained 2 MPa design pressure, 323.85 mm outside diameter, the B31.3 basis, Metric units, and the same 5.742168 mm structured required-thickness result.

The same local workflow was then exercised from the Tube calculator through save, project history, reopen, engineering review, report preview, and local approval. The reopened record retained the expanded-end condition, 3.5 MPa design pressure, 50.8 mm outside diameter, 0.5 mm expanded-end factor, Metric units, and the same `api570.tube` structured result. The Tube report displays 1.56 mm required thickness, 0.060 mm/yr governing corrosion rate, 45.67 years remaining life, 16.21 MPa current MAWP, and 13.30 MPa future MAWP under the shared precision policy.

Header and all eight Other Piping Calculations were then exercised individually through local save, project listing, text-report preview, and project reopen. Each reopened record retained its own calculator route, exact R1 snapshot, calculator label, and protected engine ID. Header was additionally exercised through Draft, Reviewed, and Approved R1 transitions, and its report retained the same `api570.header` structured result throughout.

The final automated verification passed 117 calculation-engine cases and 35 mobile workflow cases, followed by mobile type-check and production build. Future formula or UI work must continue to run those regressions and compare the affected protected parity record before completion.
