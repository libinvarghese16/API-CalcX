# API 570 individual Header calculator parity

Status: protected original-web golden case captured and passed on 13 August 2026. The individual mobile Header route is locally validated against this record.

## Protected source identity

- Workspace: API 570 > Headers
- DOM section: `api570-tab-headers`
- Source function: `calculateHeader`
- Formula route: ASME Section I PG-27.2.2 as identified by the protected application
- Engine identity: `api570.header`
- Engine version: `0.1.0-original-web-parity`

The mobile application continues to exclude both bulk calculation tables.

## Controlled Metric input

| Input | Value |
| --- | ---: |
| Header outside diameter | 219.10 mm |
| Design pressure | 2.500 MPa |
| Allowable stress | 138 MPa |
| Joint or ligament efficiency E | 0.85 |
| Coefficient y | 0.40 |
| Original thickness | 10.00 mm |
| Previous thickness | 9.20 mm |
| Current thickness | 8.80 mm |
| Years in service | 20 years |
| Years since previous inspection | 5 years |
| Future interval | 5 years |

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Minimum required thickness | 2.32 mm |
| Hydrostatic test pressure | 3.750 MPa |
| Pneumatic test pressure | 2.750 MPa |
| Current MAWP | 9.735 MPa |
| MAWP at 5 years | 8.824 MPa |
| Projected thickness | 8.40 mm |
| Future-MAWP thickness | 8.00 mm |
| Corrosion allowance | 6.48 mm |
| Long-term corrosion rate | 0.060 mm/year |
| Short-term corrosion rate | 0.080 mm/year |
| Governing corrosion rate | 0.080 mm/year |
| Remaining life | 81.00 years |

The protected Metric workflow writes the automatic minimum thickness to its editable field at 0.01 mm precision before calculating corrosion allowance and remaining life. The engine preserves this audited SI step.

## U.S. customary display check

Converting the result selectors on the protected website displayed 0.0911 in required thickness, 544 psi hydrostatic pressure, 399 psi pneumatic pressure, 1412 psi current MAWP, 1280 psi future MAWP, 0.3307 in projected thickness, 0.3150 in future-MAWP thickness, 0.2551 in corrosion allowance, and 0.0031 in/year governing corrosion rate.

## Acceptance

- Metric full-precision regression tolerance: `1e-12`.
- Equivalent U.S. customary input tolerance after SI normalization: `1e-9`.
- Blank joint efficiency retains the protected default of E = 1; blank y retains y = 0.
- Automatic and manual minimum thickness paths remain explicit and tested.
- No standards PDF or copied material/coefficient table is bundled into the mobile engine.

## Local verification

- The typed engine passes six Header-specific Metric, U.S., default-factor, manual-minimum, governing-rate, interval-normalization and validation cases.
- The mobile route reproduces the protected Metric display values and the same U.S. physical results, retaining one decimal place for pressure instead of the protected website's whole-psi display.
- A 2.500 MPa design pressure can be changed live to 25 bar while the U.S. result system remains selected without changing the normalized calculation result.
- Years in service, years since previous inspection and minimum thickness each switch between highlighted automatic and manual modes and recalculate the dependent corrosion and remaining-life results.
- All fourteen Header numeric controls have accessible names; light and dark desktop views have no horizontal overflow or browser-console warnings.
