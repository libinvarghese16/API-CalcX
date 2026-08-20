# API 570 individual Piping calculator parity

Status: protected original-web golden case captured and passed on 13 August 2026. The individual mobile route is locally validated against this record.

## Protected source identity

- Workspace: API 570 > Piping calculator
- DOM section: `api570-tab-piping`
- Code selection: ASME B31.3 Process Piping
- Source functions: `getPipeCodeConfig`, `calculatePipePressureThicknessByCode`, `calculatePipeMawpByCode`, and `calculatePipe`
- Engine identity: `api570.piping`
- Engine version: `0.1.0-original-web-parity`

The bulk `calculatePipeBulk` and `calculateTubeTable` workflows are excluded from the mobile project.

## Controlled Metric input

| Input | Value |
| --- | ---: |
| Effective standard outside diameter | 323.85 mm |
| Internal design pressure | 2.000 MPa |
| Allowable stress | 138 MPa |
| Longitudinal quality factor E | 0.85 |
| Weld strength factor W | 1.00 |
| Y coefficient | 0.40 |
| Corrosion/mechanical allowance | 3.00 mm |
| Original thickness | 18.00 mm |
| Previous thickness | 16.50 mm |
| Current thickness | 15.80 mm |
| Years in service | 20 years |
| Years since previous inspection | 5 years |
| Future interval | 5 years |

The original website input of 323.9 mm resolves to the standard NPS 12 outside diameter of 323.85 mm before calculation. The mobile engine receives the effective outside diameter explicitly and does not bundle a copied pipe-schedule table.

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Minimum required pressure thickness | 5.74 mm |
| Hydrostatic test pressure | 3.000 MPa |
| Pneumatic test pressure | 2.200 MPa |
| Current MAWP | 9.575 MPa |
| MAWP at 5 years | 8.498 MPa |
| Projected thickness | 15.10 mm |
| Future-MAWP thickness | 14.40 mm |
| Corrosion allowance | 10.06 mm |
| Long-term corrosion rate | 0.110 mm/year |
| Short-term corrosion rate | 0.140 mm/year |
| Governing corrosion rate | 0.140 mm/year |
| Remaining life | 71.86 years |

The protected Metric workflow writes the automatic minimum thickness to its editable field at 0.01 mm precision before calculating corrosion allowance and remaining life. The typed engine preserves that audited step, while required pressure thickness, MAWP, corrosion rates and projections retain full precision. The controlled Metric regression tolerance is `1e-12`.

## U.S. customary display check

Changing the original website field and result selectors to U.S. customary units produced these displayed values: 0.2260 in required thickness, 435 psi hydrostatic pressure, 319 psi pneumatic pressure, 1389 psi current MAWP, 1232 psi future MAWP, 0.5944 in projected thickness, 0.5668 in future-MAWP thickness, and 0.0055 in/year governing corrosion rate.

The original interface rounds editable values when changing units, so its recalculated remaining-life display becomes 71.74 years after the switch. The new mobile workflow keeps one SI result object and converts only field/display values; its unit test confirms the unrounded physical case remains numerically invariant.

## Acceptance

- Metric original display parity: required outputs match at original display precision.
- Full-precision engine tolerance: `1e-12` for the controlled Metric case.
- Equivalent U.S. customary input tolerance: `1e-9` after unit normalization.
- All protected active B31 routes are retained; withdrawn/superseded inactive routes remain blocked.
- No material-stress, Y-coefficient, structural-thickness, or pipe-schedule standard table is bundled into the mobile engine.
- Allowable stress, Y, E, W, factors, allowance, effective diameter, and optional structural minimum remain visible engineering inputs.

## Local application verification

- The controlled Metric default displays 5.74 mm required thickness, 9.575 MPa current MAWP, 8.498 MPa future MAWP, 0.140 mm/year governing corrosion rate and 71.86 years remaining life.
- A 2 MPa pressure input converted live to 20 bar without changing the result object.
- Metric and U.S. customary output switching, automatic and manual year modes, manual minimum-thickness mode, and inactive-code blocking were exercised in the running application.
- Phone (390 x 844) and tablet (834 x 1112) layouts have no horizontal overflow in light or dark theme.
- The validated page emitted no browser console warnings/errors and exposed no unlabeled input, select, or button controls in the local accessibility check.
