# API 570 Other Piping Calculation pressure-design parity

Status: protected original-web golden case captured and passed on 13 August 2026. This is Other Piping Calculation 1 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Pressure Design Thickness (Barlow)
- DOM inputs: `api570-other-barlow-p`, `api570-other-barlow-d`, `api570-other-barlow-s`, `api570-other-barlow-e`, `api570-other-barlow-t`
- Source function: `calculateApi570OtherCalculations`
- Formula label: API 574 11.1.2 as identified by the protected application
- Engine identity: `api570.support.pressure-design`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains this individual calculator only. It does not add either excluded bulk calculation table or bundle a standards PDF.

## Equations preserved from the protected application

- Pressure design thickness: `t = PD / (2SE)`
- Allowable working pressure from available corroded thickness: `P = 2SEt / D`
- Blank or non-positive quality factor: protected fallback `E = 1.00`

## Controlled Metric input

| Input | Value |
| --- | ---: |
| Design pressure, P | 2.500 MPa |
| Outside diameter, D | 219.100 mm |
| Allowable stress, S | 138.000 MPa |
| Longitudinal quality factor, E | 0.850 |
| Available corroded thickness, t | 8.800 mm |

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Pressure design thickness | 2.335 mm |
| Allowable working pressure | 9.423 MPa |

The full-precision SI results are 2.334825234441603 mm and 9.422546782291191 MPa.

## U.S. customary equivalence

The protected application reproduced the Metric display when entered with 362.594344 psi, 8.625984 in, 20015.207803 psi and 0.346457 in. The mobile global U.S. result view displays 0.0919 in required thickness and 1366.6 psi allowable working pressure.

## Acceptance

- Metric full-precision regression tolerance: `1e-12`.
- Equivalent U.S. customary input tolerance after SI normalization: `1e-9`.
- Live input-unit changes preserve the normalized physical result; 2.500 MPa becomes 25 bar while U.S. result output remains selected.
- Available corroded thickness can be zero or blank without blocking the independent required-thickness result.
- A non-positive explicit E preserves the original numerical fallback and adds a visible warning.
- All five mobile numeric inputs have accessible names; light and dark desktop views have no horizontal overflow or browser-console warnings.

The formula identity is recorded for parity only. The applicable controlled code edition and all input values still require responsible engineering confirmation.
