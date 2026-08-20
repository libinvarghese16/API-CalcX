# API 510 conical-head parity baseline

Status: implemented as a typed, UI-independent engine and connected to the shared API 510 mobile workflow.

## Legacy source audited

- Original calculation entry point: parent `scripts.js`, `calculatePVCone()`.
- Original geometry fields: outside diameter `D` and cone half-apex angle `alpha` in degrees.
- The parent application remains read-only and is protected by the source-baseline hash check.

## Extracted equations

- Required thickness: `(P * D) / (2 * cos(alpha) * ((S * E) - (0.6 * P)))`
- MAWP from thickness: `(2 * S * E * t * cos(alpha)) / (D + (1.2 * t * cos(alpha)))`

The typed boundary requires a positive outside diameter and a finite half-apex angle from 0 degrees up to, but not including, 90 degrees. The engine also preserves the shared corrosion-rate, corrosion-allowance, remaining-life, future-projection, future-MAWP, and test-pressure paths.

The mobile UI changes the shared diameter label to Outside diameter and reveals the half-apex angle only for the conical geometry. Material selection, allowable-stress lookup, units, build year, previous inspection year, and highlighted Auto/Manual controls remain shared.

Three automated cases cover the captured golden result, the 90-degree angle boundary, and an invalid outside diameter. Confirmation against the owner's controlled standard edition and engineering procedure remains required before report issue.
