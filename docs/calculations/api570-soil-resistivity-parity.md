# API 570 Soil Resistivity parity

Status: protected original-web spacing, resistance, mixed-unit, rounding, zero, and negative-input cases captured and engine regression passed on 13 August 2026. This is Other Piping Calculation 8 of 8 and completes the controlled API 570 Other Piping Calculations migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Soil Resistivity
- DOM inputs: `api570-other-soil-d`, `api570-other-soil-r`
- DOM output: `api570-other-soil-rho`
- Source function: `calculateApi570OtherCalculations`
- Formula label: API 574 10.10.1.4.3 as identified by the protected application
- Equation: `ρ = 191.5 d R`
- Engine identity: `api570.support.soil-resistivity`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains the audited equation and original explanatory text only. It does not bundle a standards PDF or either excluded API 570 bulk calculation table.

## Equation and behavior preserved

- `d` is normalized to feet.
- `R` is normalized to ohms.
- Positive inputs: `ρ = 191.5 × d(ft) × R(Ω)` in ohm-centimetres.
- Output is displayed to two decimal places.
- Blank, zero, or non-positive protected dependencies display `0.00`.
- The typed engine preserves the zero result and adds a visible error for non-positive or non-finite values.

## Protected golden and mixed-unit cases

| Entered spacing | Entered resistance | Original displayed result |
| --- | --- | ---: |
| 5 ft | 20 Ω | 19,150.00 Ω·cm |
| 1.524 m | 20 Ω | 19,150.00 Ω·cm |
| 60 in | 0.02 kΩ | 19,150.00 Ω·cm |
| 152.4 cm | 0.00002 MΩ | 19,150.00 Ω·cm |

The protected rounding case `d = 1.2345 ft` and `R = 7.89 Ω` displays `1,865.25 Ω·cm`.

## Mobile acceptance

- Exact two-decimal protected display parity for golden and rounding cases.
- Equivalent ft, m, mm, cm, and in spacing inputs reproduce the same normalized feet value.
- Equivalent Ω, kΩ, and MΩ resistance inputs reproduce the same normalized ohms value.
- Both inputs retain independent live unit selectors.
- Metric/U.S. context changes the displayed normalized spacing between metres and feet; the protected Ω·cm output basis remains explicit.
- Zero, negative, and non-finite dependencies produce a zero result and visible errors.
- Result trace identifies engine, version, equation, normalized spacing, normalized resistance, and final resistivity.
- Light and dark themes render without horizontal overflow or browser-console errors.

This equation identity is recorded for original-application parity. Probe arrangement, instrument calibration, soil condition, moisture, interference, testing coverage, corrosion-control interpretation, and responsible engineering approval remain external requirements.
