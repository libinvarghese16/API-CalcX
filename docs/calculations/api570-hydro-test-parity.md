# API 570 Hydro Test Pressure parity

Status: protected original-web golden cases captured and engine regression passed on 13 August 2026. This is Other Piping Calculation 3 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Hydro Test Pressure
- DOM inputs: `api570-other-hydro-p`, `api570-other-hydro-s`, `api570-other-hydro-st`, `api570-other-hydro-rr`
- DOM outputs: `api570-other-hydro-rr-used`, `api570-other-hydro-pt`
- Source function: `calculateApi570OtherCalculations`
- Formula label: B31.3 345.4.2 as identified by the protected application
- Engine identity: `api570.support.hydro-test-pressure`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains the audited equation and original explanatory text only. It does not bundle a standards PDF or either excluded API 570 bulk calculation table.

## Equation and dependency order preserved

- Calculated stress ratio: `Rr = ST / S` when both stresses are positive.
- A positive manual `Rr` overrides the calculated ratio.
- When neither route supplies a positive ratio, the protected fallback is `Rr = 1.00`.
- The ratio used is limited to `6.50`.
- Minimum hydro test pressure: `PT = 1.5 P Rr` when design pressure is positive; otherwise zero.

The mobile Auto/Manual control exposes this dependency order. Automatic mode displays the live `ST / S` result; Manual mode highlights the override and retains the protected cap.

## Controlled Metric input

| Input | Value |
| --- | ---: |
| Design pressure, P | 2.500 MPa |
| S at design temperature | 138.000 MPa |
| ST at test temperature | 165.000 MPa |
| Manual Rr | Blank / automatic |

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Rr used | 1.196 |
| Minimum hydro test pressure | 4.484 MPa |

The full-precision SI results are `Rr = 1.1956521739130435` and `PT = 4.483695652173913 MPa`.

## Manual and cap cases

| Case | Original Rr used | Original pressure |
| --- | ---: | ---: |
| Manual Rr = 1.25 | 1.250 | 4.688 MPa |
| Manual Rr = 8.00 | 6.500 | 24.375 MPa |
| No valid manual/S/ST ratio | 1.000 | 3.750 MPa |

## U.S. customary equivalence

The protected application reproduced the Metric result when entered with 362.594344 psi design pressure, 20015.207803 psi design-temperature stress and 23931.226720 psi test-temperature stress. The mobile U.S. result view displays 650.3 psi for the same physical result.

## Acceptance

- Metric full-precision regression tolerance: `1e-12`.
- Equivalent U.S. customary input tolerance after SI normalization: `1e-9`.
- Positive manual Rr has priority over ST/S; a non-positive manual value follows the protected automatic/default fallback.
- Manual and calculated ratios above 6.50 are capped and disclosed as warnings.
- Live field-unit changes preserve the normalized physical result.
- A non-positive design pressure returns zero and an input error.
- The mobile result trace identifies the ratio source, automatic ratio, Rr used, design pressure and final pressure.

The formula identity is recorded for parity only. Test planning, test limits, controlled-code confirmation and responsible engineering approval remain external requirements.
