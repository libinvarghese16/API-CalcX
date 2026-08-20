# API 510 ellipsoidal-head parity baseline

Status: implemented as a typed, UI-independent engine and connected to the shared API 510 mobile workflow.

## Legacy source audited

- Original calculation entry point: parent `scripts.js`, `calculatePVEll()`.
- The parent application remains read-only and is protected by the source-baseline hash check.

The engine reproduces the protected legacy ellipsoidal-head required-thickness and inverse MAWP equations. It also preserves the shared long-term, short-term, and governing corrosion-rate chain; corrosion allowance; remaining life; projected thickness; future-MAWP thickness; future MAWP; and hydrostatic and pneumatic multipliers.

The UI reuses the same material and grade dependency, temperature-based allowable-stress lookup, Metric/U.S. customary conversion, build-year and previous-inspection-year calculations, and highlighted Auto/Manual override controls.

Two automated cases cover the captured golden result and an invalid pressure basis. Confirmation against the owner's controlled standard edition and engineering procedure remains required before report issue.
