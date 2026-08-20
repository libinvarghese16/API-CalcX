# API 510 hemispherical-head parity baseline

Status: implemented as a typed, UI-independent engine and connected to the shared API 510 mobile workflow.

## Legacy source audited

- Original calculation entry point: parent `scripts.js`, `calculatePVHem()`.
- Original geometry field: inside spherical radius `L`.
- The parent application remains read-only and is protected by the source-baseline hash check.

## Extracted equations

- Required thickness: `(P * L) / ((2 * S * E) - (0.2 * P))`
- MAWP from thickness: `(2 * S * E * t) / (L + (0.2 * t))`

The engine also preserves the shared long-term, short-term, and governing corrosion-rate chain; corrosion allowance; remaining life; projected thickness; future-MAWP thickness; future MAWP; and hydrostatic and pneumatic multipliers.

The UI reveals the inside spherical radius only for the hemispherical geometry and reuses the material/grade dependency, temperature-based allowable-stress lookup, Metric/U.S. customary conversion, build-year and previous-inspection-year calculations, and highlighted Auto/Manual override controls.

Two automated cases cover the captured golden result and an invalid spherical-radius basis. Confirmation against the owner's controlled standard edition and engineering procedure remains required before report issue.
