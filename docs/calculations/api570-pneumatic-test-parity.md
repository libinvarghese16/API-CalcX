# API 570 Pneumatic Test Pressure parity

Status: protected original-web golden and invalid-input cases captured and engine regression passed on 13 August 2026. This is Other Piping Calculation 5 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Pneumatic Test Pressure
- DOM input: `api570-other-pneumatic-p`
- DOM output: `api570-other-pneumatic-pt`
- Source function: `calculateApi570OtherCalculations`
- Formula label: B31.3 345.5.4 as identified by the protected application
- Equation: `PT = 1.1 P`
- Engine identity: `api570.support.pneumatic-test-pressure`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains the audited equation and original explanatory text only. It does not bundle a standards PDF or either excluded API 570 bulk calculation table.

## Equation and behavior preserved

- Positive design pressure: `PT = 1.1 × P`.
- Blank, zero or non-positive protected inputs display `0.000 MPa`.
- The typed mobile engine preserves the zero result but also raises a visible input error for non-positive or non-finite values.
- Calculation is normalized into MPa; the featured mobile result follows the selected Metric or U.S. customary unit system.

## Original website golden cases

| Entered value | Selected input unit | Original displayed result |
| --- | --- | ---: |
| 2.5 | MPa | 2.750 MPa |
| 25 | bar | 2.750 MPa |
| 362.594344 | psi | 2.750 MPa |
| 0 | MPa | 0.000 MPa |

The equivalent positive inputs confirm that the protected field selector converts to the same SI calculation basis before applying the multiplier.

## Mobile acceptance

- The engine reproduces `2.75 MPa` from the three protected equivalent inputs within conversion tolerance.
- Metric featured display is `2.750 MPa`.
- U.S. customary featured display is `398.9 psi`.
- Live field-unit changes preserve the physical design pressure and final result.
- Zero, negative and non-finite values produce a zero result and a visible input error.
- The result trace identifies the engine, version, equation, normalized design pressure and normalized test pressure.
- The screen remains usable in light and dark themes without horizontal overflow.

This equation identity is recorded for original-application parity. Pneumatic testing involves significant stored energy; code-edition confirmation, component limits, an approved test procedure, site safety controls and responsible engineering approval remain external requirements.
