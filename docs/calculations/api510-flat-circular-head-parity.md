# API 510 flat circular-head parity baseline

Status: implemented as a typed, UI-independent engine and connected to the shared API 510 mobile workflow.

## Protected original source audited

- Original calculation entry point: parent `scripts.js`, `calculatePVFlat()`.
- Original geometry fields: diameter or short span `d` and attachment factor `C`.
- Original site route checked locally through the read-only source server at `http://127.0.0.1:4311/`.
- The parent application remains read-only and is protected by the source-baseline hash check.

## Extracted equations

- Required thickness: `d * sqrt((C * P) / (S * E))`
- MAWP from thickness: `(S * E * t^2) / (C * d^2)`
- Long-term corrosion rate: `max(t original - t actual, 0) / years in service`
- Short-term corrosion rate: `max(t previous - t actual, 0) / years since previous inspection`
- Governing corrosion rate: `max(long-term rate, short-term rate)`
- Projected thickness: `max(t actual - governing rate * interval, 0)`
- Future-MAWP thickness: `max(t actual - 2 * governing rate * interval, 0)`

The typed boundary requires positive finite values for `d`, `C`, pressure, allowable stress, and joint efficiency. Joint efficiency must not exceed 1.0. The shared future interval remains normalized to a whole number from 1 to 10 years.

## Controlled original-site comparison

Comparison date: 13 August 2026. Units: MPa, mm, degrees Celsius, and years.

Inputs: `d = 200`, `C = 0.3`, `P = 1.5`, `S = 138`, `E = 0.85`, `t original = 18`, `t previous = 16.5`, `t actual = 15.8`, build year `2006`, previous inspection year `2021`, and next interval `5`.

| Result | Protected original site | Typed engine/mobile | Gate |
| --- | ---: | ---: | --- |
| Required thickness | 12.39 mm | 12.39 mm | Pass |
| Current MAWP | 2.440 MPa | 2.440 MPa | Pass |
| Hydrostatic test pressure | 3.172 MPa | 3.172 MPa | Pass |
| Pneumatic test pressure | 2.684 MPa | 2.684 MPa | Pass |
| Long-term corrosion rate | 0.110 mm/yr | 0.110 mm/yr | Pass |
| Short-term corrosion rate | 0.140 mm/yr | 0.140 mm/yr | Pass |
| Governing corrosion rate | 0.140 mm/yr | 0.140 mm/yr | Pass |
| Projected thickness at 5 years | 15.10 mm | 15.10 mm | Pass |
| Future-MAWP thickness at 5 years | 14.40 mm | 14.40 mm | Pass |
| Future MAWP | 2.027 MPa | 2.027 MPa | Pass |

The protected site formats the automatic minimum-thickness input to two decimal places and then reads that displayed value back for corrosion allowance and remaining life. The typed engine keeps the equation result at full precision and rounds only for display. This produces no difference in the two-decimal corrosion allowance and a maximum observed remaining-life display difference of 0.02 year for this case. The recorded original-site comparison tolerance is therefore 0.005 mm for displayed length, 0.0005 MPa for displayed pressure, 0.0005 mm/yr for displayed corrosion rate, and 0.05 year for remaining life. The raw equation golden cases use `1e-12` numerical tolerance.

The mobile Metric-to-U.S.-customary round trip was also checked. It preserved the SI result while displaying 0.488 in required thickness, 353.9 psi current MAWP, and 294.0 psi future MAWP.

Three automated cases cover the protected original-site golden result, a non-positive attachment factor, and an invalid diameter or short span. Confirmation against the owner's controlled standard edition and engineering procedure remains required before report issue.
