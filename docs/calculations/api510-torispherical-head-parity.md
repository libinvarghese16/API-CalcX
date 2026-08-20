# API 510 torispherical-head parity baseline

Status: implemented as a typed, UI-independent engine and connected to the shared API 510 mobile workflow.

## Legacy source audited

- Original calculation entry point: parent `scripts.js`, `calculatePVTor()`.
- Original geometry field: inside spherical or crown radius `L`.
- The parent application remains read-only and is protected by the source-baseline hash check.

## Extracted equations

- Required thickness: `0.885 * P * L / ((S * E) - (0.1 * P))`
- MAWP from thickness: `(S * E * t) / ((0.885 * L) + (0.1 * t))`

The engine also preserves the shared long-term, short-term, and governing corrosion-rate chain; corrosion allowance; remaining life; projected thickness; future-MAWP thickness; future MAWP; and hydrostatic and pneumatic multipliers.

The UI reveals the crown-radius input only for the torispherical geometry and reuses the material/grade dependency, temperature-based allowable-stress lookup, Metric/U.S. customary conversion, build-year and previous-inspection-year calculations, and highlighted Auto/Manual override controls.

Two automated cases cover the captured golden result and an invalid crown-radius basis. Confirmation against the owner's controlled standard edition and engineering procedure remains required before report issue.
