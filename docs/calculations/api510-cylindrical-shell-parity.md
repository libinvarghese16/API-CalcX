# API 510 cylindrical-shell parity baseline

Status: implemented as a typed, UI-independent engine and connected to the local preview.

## Legacy source audited

- Original calculation entry point: parent `scripts.js`, `calculatePVCyl()`.
- Original field block: parent `index.html`, API 510 cylindrical-shell tab.
- The parent application remains read-only and is protected by the source-baseline hash check.

## SI input contract

- Inside diameter, mm
- Internal design pressure, MPa
- Allowable stress at the calculation temperature, MPa
- Weld joint efficiency, dimensionless and limited to `(0, 1]`
- Original, previous, and actual measured thickness, mm
- Optional manually controlled minimum thickness, mm
- Years in service and years since the previous inspection
- Future inspection interval, normalized to a whole number from 1 to 10 years

Material-table selection remains outside the geometry engine as a controlled adapter. The mobile workflow now uses all 61 specifications from the protected legacy dataset, filters grade records by material, and reproduces the legacy first-table-limit-at-or-above-temperature lookup without interpolation or extrapolation.

The screen accepts either Metric (`MPa`, `mm`, `°C`) or U.S. customary (`psi`, `in`, `°F`) values. The unit adapter normalizes all values to SI before calling the calculation and material engines, then converts results back for display.

Years in service defaults to the shared service-year rule: `current year - build year`. Build years before 1900, partial years, and future years are rejected while automatic mode is active.

Years since the previous inspection defaults to `current year - previous inspection year`. The recorded previous year must be a whole year from the build year through the current year. The derived interval is used by the short-term corrosion-rate path.

Automatically resolved values expose a highlighted Auto/Manual control. Auto is the default. A manual value replaces the automatic value at the calculation-engine boundary, changes the highlight to amber, and is disclosed in the result trace. The connected overrides are Years in service, Years since previous inspection, and Allowable stress.

## Extracted results

- Circumferential and longitudinal required thickness
- Governing required thickness
- Long-term, short-term, and governing corrosion rates
- Remaining corrosion allowance and remaining life
- Circumferential, longitudinal, and governing current MAWP
- Hydrostatic and pneumatic test-pressure multipliers used by the legacy source
- Projected thickness, future MAWP thickness, and governing future MAWP

## Verification gate

Seven automated cases cover the captured legacy golden result, manual minimum thickness, zero corrosion, invalid joint efficiency, the 1-to-10-year future interval, and both long-term- and short-term-governing corrosion propagation. The visible result trace exposes both rates, the governing rate, corrosion allowance, projection thickness, future-MAWP thickness, and future MAWP. This proves code parity with the captured application baseline; it does not replace confirmation against the owner's controlled standard edition and engineering procedure.
