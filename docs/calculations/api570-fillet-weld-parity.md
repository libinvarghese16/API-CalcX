# API 570 Fillet Weld Sizing parity

Status: protected original-web golden, mixed-unit, dependency, and boundary cases captured and engine regression passed on 13 August 2026. This is Other Piping Calculation 6 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Fillet Weld Sizing
- DOM inputs: `api570-other-fillet-throat`, `api570-other-fillet-leg`, `api570-other-fillet-t`, `api570-other-fillet-hub`, `api570-other-fillet-tb`
- DOM outputs: `api570-other-fillet-leg-out`, `api570-other-fillet-throat-out`, `api570-other-fillet-xmin`, `api570-other-fillet-tc`
- Source function: `calculateApi570OtherCalculations`
- Formula label: B31.3 328.5.2 / 328.5.4 as identified by the protected application
- Engine identity: `api570.support.fillet-weld-sizing`
- Engine version: `0.1.0-original-web-parity`

The mobile application contains the audited equations and original explanatory text only. It does not bundle a standards PDF or either excluded API 570 bulk calculation table.

## Equations and dependencies preserved

- Leg from known throat: `leg = 1.414 × throat`.
- Throat from known leg: `throat = 0.707 × leg`.
- Slip-on flange minimum: `Xmin = lesser positive value of 1.4T and hub thickness`.
- If only one positive Xmin candidate is provided, the protected calculator uses that candidate.
- Branch throat: `tc = lesser of 0.7Tb and 6 mm`.
- Blank and zero inputs produce zero for their dependent result.

The typed engine retains protected zero behavior. Negative and non-finite dimensions are normalized to zero for calculation safety and produce visible input errors.

## Controlled golden input and original result

| Input | Value |
| --- | ---: |
| Known throat | 5 mm |
| Known leg | 8 mm |
| Pipe thickness T | 10 mm |
| Hub thickness | 12 mm |
| Branch thickness Tb | 10 mm |

| Output | Original display |
| --- | ---: |
| Leg from throat | 7.070 mm |
| Throat from leg | 5.656 mm |
| Slip-on flange Xmin | 12.000 mm |
| Branch throat tc | 6.000 mm |

## Mixed-unit equivalence

The protected application reproduced the same four results when the inputs were entered as `0.196850394 in`, `0.31496063 in`, `0.393700787 in`, `0.472440945 in`, and `0.393700787 in`. The mobile field selectors normalize equivalent mm, cm, m, in, or ft values before the typed engine runs.

## Dependency and boundary cases

| Case | Original result |
| --- | ---: |
| T = 10 mm, hub = 20 mm | Xmin = 14.000 mm |
| T = 0, hub = 12 mm | Xmin = 12.000 mm |
| Tb = 8 mm | tc = 5.600 mm |
| Tb = 10 mm | tc = 6.000 mm |
| Tb = 0 | tc = 0.000 mm |

## Mobile acceptance

- Exact three-decimal protected display parity for the controlled SI case.
- Equivalent inch inputs reproduce each SI result within conversion tolerance.
- Global Metric/U.S. selection changes all featured outputs without changing normalized geometry.
- Each of five input fields has an independent live unit selector.
- The known-throat and known-leg routes remain independent.
- Xmin discloses whether 1.4T, hub thickness, both, or neither governs.
- The result trace discloses the uncapped `0.7Tb` value and whether the fixed 6 mm cap governs.
- Negative inputs produce visible errors and never produce negative weld dimensions.
- Light and dark themes render without horizontal overflow or browser-console errors.

The formula identity is recorded for original-application parity. Joint applicability, material, loading, weld procedure, examination, controlled-code confirmation, and responsible welding-engineering approval remain external requirements.
