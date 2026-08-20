# API 570 mobile scope audit

Status: scope approved on 13 August 2026. The individual Piping, Tube, Header, and all eight Other Piping Calculations have completed their controlled migration gates.

## Owner correction

The mobile application will use individual API 570 calculators. It will not include either bulk spreadsheet-style calculation table:

- Piping calculation table
- Tube calculation table

The protected original website remains unchanged. The exclusion applies only to the new mobile application.

## Protected-source findings

The protected website exposes six API 570 tabs in `index.html`. Four remain in the mobile scope and two are excluded.

| Protected tab | Mobile decision | Protected calculation identity | Mobile intent |
| --- | --- | --- | --- |
| Piping calculator | Included and locally validated | `calculatePipe` | Individual pipe assessment using `api570.piping` |
| Piping calculation table | Exclude | `calculatePipeBulk` | No bulk table, row workflow or table export |
| Tubes | Included and locally validated | `calculateTube` | Individual tube assessment using `api570.tube` |
| Tube calculation table | Exclude | `calculateTubeTable` | No bulk table, row workflow or table export |
| Headers | Included and locally validated | `calculateHeader` | Individual header assessment using `api570.header` |
| Other Piping Calculations | Included; 8 of 8 locally validated | `calculateApi570OtherCalculations` | All eight individual engines are connected through the completed Other Piping Calculations library |

The retained individual workspaces cover pipe, tube and header thickness/MAWP/inspection workflows plus the existing support-calculation group. The support group contains individual tools for pressure-design thickness, valve and flanged-fitting thickness, hydrostatic and pneumatic test pressure, fillet-weld sizing, tension testing and soil resistivity.

## Exclusion boundary

The mobile project must not add the excluded tables or their table-only behavior:

- Multi-row add and delete controls
- Enter-key row navigation
- Bulk reset
- Copy values or formulas
- Spreadsheet/table download
- Bulk-table persistence or restoration

This decision does not remove the individual Piping, Tubes or Headers calculators and does not authorize any calculation change.

## Controlled migration order

1. Completed: extract and compare the individual Piping calculator.
2. Completed: record Metric and U.S. customary golden cases and numerical tolerances.
3. Completed: connect the typed piping engine after original-web parity and local browser checks passed.
4. Completed: repeat the full gate for the individual Tube calculator, including welded/expanded dependency checks.
5. Completed: repeat the full gate for the individual Header calculator, including E/y defaults, mixed units and editable automatic values.
6. Completed: capture, implement and browser-verify Pressure Design Thickness as Other Piping Calculation 1 of 8.
7. Completed: capture, implement and browser-verify Valve and Flanged Fittings Thickness as Other Piping Calculation 2 of 8.
8. Completed: add the eight-tool Other Piping Calculations library with validated routes enabled and pending routes locked.
9. Completed: capture, implement and browser-verify Hydro Test Pressure as Other Piping Calculation 3 of 8, including ST/S automatic mode, manual Rr and the protected 6.50 cap.
10. Completed: capture, implement and browser-verify Flange Hydro Test as Other Piping Calculation 4 of 8, including separate bar/psi rounding and NPS duration bands.
11. Completed: capture, implement and browser-verify Pneumatic Test Pressure as Other Piping Calculation 5 of 8, including MPa/bar/psi equivalence and protected zero-output behavior.
12. Completed: capture, implement and browser-verify Fillet Weld Sizing as Other Piping Calculation 6 of 8, including four independent geometry dependencies, mixed units, Xmin selection and the 6 mm branch-throat cap.
13. Completed: capture, implement and browser-verify Tension Test as Other Piping Calculation 7 of 8, including TSA/RSA/manual/Auto sources, automatic precedence, radius fallback, mixed area/force units and missing-source behavior.
14. Completed: capture, implement and browser-verify Soil Resistivity as Other Piping Calculation 8 of 8, including spacing and resistance conversions, two-decimal rounding, and non-positive input behavior.
15. Completed: verify the full eight-tool Other Piping Calculations library while retaining both bulk calculation-table exclusions.

Every engine remains subject to `original-web-verification-gate.md`. The Piping, Tube, Header and all eight support routes are locally parity-validated, not substitutes for controlled-code confirmation or responsible engineering approval.
