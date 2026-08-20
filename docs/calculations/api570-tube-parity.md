# API 570 individual Tube calculator parity

Status: protected original-web golden case captured and passed on 13 August 2026. The individual mobile Tube route is locally validated against this record.

## Protected source identity

- Workspace: API 570 > Tubes
- DOM section: `api570-tab-tubes`
- Source function: `calculateTube`
- Formula route: ASME Section I PG-27.2.1 as identified by the protected application
- Engine identity: `api570.tube`
- Engine version: `0.1.0-original-web-parity`

The separate `calculateTubeTable` bulk workflow remains excluded from the mobile application.

## Controlled Metric input

| Input | Value |
| --- | ---: |
| Tube end condition | Expanded |
| Tube outside diameter | 50.80 mm |
| Design pressure | 3.500 MPa |
| Allowable stress | 120 MPa |
| Weld strength reduction factor | 0.90 |
| Expanded-end thickness factor | 0.50 mm |
| Original thickness | 5.00 mm |
| Previous thickness | 4.60 mm |
| Current thickness | 4.30 mm |
| Years in service | 20 years |
| Years since previous inspection | 5 years |
| Future interval | 5 years |

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Minimum required thickness | 1.56 mm |
| Hydrostatic test pressure | 5.250 MPa |
| Pneumatic test pressure | 3.850 MPa |
| Current MAWP | 16.209 MPa |
| MAWP at 5 years | 13.297 MPa |
| Projected thickness | 4.00 mm |
| Future-MAWP thickness | 3.70 mm |
| Corrosion allowance | 2.74 mm |
| Long-term corrosion rate | 0.035 mm/year |
| Short-term corrosion rate | 0.060 mm/year |
| Governing corrosion rate | 0.060 mm/year |
| Remaining life | 45.67 years |

The protected Metric workflow writes the automatic minimum thickness to its editable field at 0.01 mm precision before calculating corrosion allowance and remaining life. The engine preserves this audited SI step.

## U.S. customary display check

Converting the result selectors on the protected website displayed 0.0616 in required thickness, 761 psi hydrostatic pressure, 558 psi pneumatic pressure, 2351 psi current MAWP, 1929 psi future MAWP, 0.1575 in projected thickness, 0.1457 in future-MAWP thickness, 0.1079 in corrosion allowance, and 0.0024 in/year governing corrosion rate.

## Acceptance

- Metric full-precision regression tolerance: `1e-12`.
- Equivalent U.S. customary input tolerance after SI normalization: `1e-9`.
- Welded ends force the expanded-end thickness factor to zero; expanded ends expose it as a visible manual engineering input.
- Automatic and manual minimum thickness paths remain explicit and tested.
- No standards PDF, material-stress table or Tube calculation table is bundled into the mobile engine.

## Local application verification

- The controlled expanded-end Metric default displays 1.56 mm required thickness, 16.209 MPa current MAWP, 13.297 MPa future MAWP, 0.060 mm/year governing corrosion rate and 45.67 years remaining life.
- Switching to welded ends makes the expanded-end factor read-only at zero and recalculates the controlled equation route.
- A 3.5 MPa pressure input converted live to 35 bar without changing the result object; equivalent U.S. outputs were also verified.
- Automatic/manual inspection years and automatic/manual minimum thickness were exercised in the running application.
- Phone (390 x 844) and tablet (834 x 1112) layouts have no horizontal overflow in light or dark theme.
- The page emitted no browser console warnings/errors and exposed no unlabeled input, select, or button controls in the local accessibility check.
