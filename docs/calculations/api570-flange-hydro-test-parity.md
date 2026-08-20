# API 570 Flange Hydro Test parity

Status: protected original-web golden and boundary cases captured and engine regression passed on 13 August 2026. This is Other Piping Calculation 4 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Flange and Flanged Fittings Hydro Test
- DOM inputs: `api570-other-flange-rating-bar`, `api570-other-flange-rating-psi`, `api570-other-flange-nps`
- DOM outputs: `api570-other-flange-pt-bar`, `api570-other-flange-pt-psi`, `api570-other-flange-duration`
- Source function: `calculateApi570OtherCalculations`
- Formula label: B16.5 2.6 / 8.2.2 / 8.2.4 as identified by the protected application
- Engine identity: `api570.support.flange-hydro-test`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains the audited equations and original explanatory text only. It does not bundle a standards PDF or either excluded API 570 bulk calculation table.

## Equations and dependencies preserved

- Metric pressure route: `PTbar = ceil(1.5 × rating38Cbar)`.
- U.S. pressure route: `PTpsi = ceil((1.5 × rating100Fpsi) / 25) × 25`.
- NPS greater than zero through 2 inches: minimum duration `60 seconds`.
- NPS greater than 2 through 8 inches: minimum duration `120 seconds`.
- NPS greater than 8 inches: minimum duration `180 seconds`.
- Blank, zero or non-positive source values produce zero for their dependent output.

The 38°C bar rating and 100°F psi rating are independent protected inputs. Live unit conversion preserves each physical value but does not substitute one temperature-specific rating basis for the other.

## Controlled golden input

| Input | Value |
| --- | ---: |
| 38°C pressure rating | 17 bar |
| 100°F pressure rating | 250 psi |
| Nominal pipe size | NPS 6 in |

## Original website displayed result

| Output | Original display |
| --- | ---: |
| Metric hydro test pressure | 26 bar |
| U.S. hydro test pressure | 375 psi |
| Minimum duration | 120 seconds |

## Rounding and duration boundaries

| Case | Original result |
| --- | ---: |
| 16.67 bar rating | 26 bar |
| 251 psi rating | 400 psi |
| NPS 2 | 60 seconds |
| NPS just above 2 | 120 seconds |
| NPS 8 | 120 seconds |
| NPS just above 8 | 180 seconds |

## Mixed-unit equivalence

The protected application reproduced the golden results when the 38°C rating was entered as 246.564154 psi, the 100°F rating as 17.236893 bar, and NPS as 152.4 mm. The mobile field selectors normalize the same values into the SI engine before applying the protected bar, psi and inch dependencies.

## Acceptance

- Exact integer parity for the rounded bar, rounded psi and duration outputs.
- Live field-unit changes preserve the normalized physical inputs and final outputs.
- Metric/U.S. global selection changes the featured result without hiding the alternate protected route.
- The two pressure routes remain independent when either rating is omitted.
- Negative ratings or NPS produce zero dependent outputs and visible input errors.
- Result trace identifies both rating bases, NPS in inches, both rounded pressures and minimum duration.

The formula identity is recorded for parity only. Test planning, component eligibility, test limits, controlled-code confirmation and responsible engineering approval remain external requirements.
