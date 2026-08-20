# API 570 valve and flanged-fittings parity

Status: protected original-web golden case captured and passed on 13 August 2026. This is Other Piping Calculation 2 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Valve and Flanged Fittings Thickness
- DOM inputs: `api570-other-valve-p`, `api570-other-valve-d`, `api570-other-valve-s`, `api570-other-valve-e`, `api570-other-valve-c`, `api570-other-valve-tavail`
- Source function: `calculateApi570OtherCalculations`
- Formula label: API 574 11.2 as identified by the protected application
- Engine identity: `api570.support.valve-flanged-fittings`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains this individual calculator and the gated eight-tool Other Piping Calculations library. It does not add either excluded bulk calculation table or bundle a standards PDF.

## Equations and dependencies preserved

- Pressure design thickness: `t = 1.5(PD / 2SE)`
- Minimum required thickness: `tm = t + c`
- Allowable pressure from available wall: `P = 2SE(tavailable − c) / (1.5D)`
- Blank or non-positive quality factor: protected fallback `E = 1.00`
- Negative allowance: protected clamp `c = 0`
- Allowable pressure is independent of design pressure and requires available wall greater than allowance.

## Controlled Metric input

| Input | Value |
| --- | ---: |
| Design pressure, P | 2.500 MPa |
| Outside diameter, D | 219.100 mm |
| Allowable stress, S | 138.000 MPa |
| Longitudinal quality factor, E | 0.850 |
| Allowance, c | 1.200 mm |
| Available wall thickness | 8.800 mm |

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Pressure design thickness | 3.502 mm |
| Minimum required thickness | 4.702 mm |
| Allowable pressure from available wall | 5.425 MPa |

The full-precision SI results are 3.5022378516624047 mm, 4.702237851662405 mm and 5.425102692834322 MPa.

## U.S. customary equivalence

The protected application reproduced the Metric display when entered with 362.594344 psi, 8.625984 in, 20015.207803 psi, 0.047244 in allowance and 0.346457 in available wall. The mobile global U.S. result view displays 0.1379 in pressure thickness, 0.1851 in minimum required thickness and 786.8 psi allowable pressure.

## Acceptance

- Metric full-precision regression tolerance: `1e-12`.
- Equivalent U.S. customary input tolerance after SI normalization: `1e-9`.
- Live input-unit changes preserve the normalized physical result; 2.500 MPa becomes 25 bar while U.S. result output remains selected.
- E fallback and negative-allowance clamping remain visible warnings.
- When design pressure is invalid, the independent available-wall allowable pressure remains calculable, matching the protected dependency.
- Available wall equal to or less than allowance returns zero allowable pressure without changing the pressure-thickness output.
- All six mobile numeric inputs have accessible names; light and dark desktop views have no horizontal overflow or browser-console warnings.

The formula identity is recorded for parity only. The applicable controlled code edition and all input values still require responsible engineering confirmation.
