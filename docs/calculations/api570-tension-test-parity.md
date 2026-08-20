# API 570 Tension Test parity

Status: protected original-web Metric, U.S., area-source, precedence, radius/diameter, and missing-source cases captured and engine regression passed on 13 August 2026. This is Other Piping Calculation 7 of 8 in the controlled mobile migration.

## Protected source identity

- Workspace: API 570 > Other Calculations
- Card: Tension Test
- Reference label: ASME Section IX as identified by the protected application
- Source function: `calculateApi570OtherCalculations`
- Engine identity: `api570.support.tension-test`
- Engine version: `0.1.0-original-web-parity`
- Outputs: turned specimen area, reduced specimen area, selected area, tensile strength, and required load

The mobile application contains the audited equations and original explanatory text only. It does not bundle a standards PDF, reproduce qualification tables, or include either excluded API 570 bulk calculation table.

## Equations and dependencies preserved

- Effective turned radius uses positive radius R first; otherwise positive diameter / 2; otherwise zero.
- Turned specimen area: `TSA = πR²` in mm².
- Reduced specimen area: `RSA = width × thickness` when both dimensions are positive.
- Explicit TSA, RSA, or Manual selection uses only that source and does not fall back.
- Auto selection uses positive Manual area first, then RSA, then TSA.
- Tensile strength: `TS = test load kN × 1000 / selected area mm²`, producing MPa.
- Required load: `required load kN = target TS MPa × selected area mm² / 1000`.
- Missing, blank, or zero dependencies produce zero for their dependent outputs.

The typed engine preserves protected zero behavior. Negative and non-finite dimensional, area, force, or strength inputs produce visible errors and never produce negative outputs.

## Controlled Metric golden case

| Input | Value |
| --- | ---: |
| Turned radius | 6 mm |
| Turned diameter | 10 mm |
| Reduced width | 12.5 mm |
| Reduced thickness | 6 mm |
| Manual area | 80 mm² |
| Test load | 40 kN |
| Target tensile strength | 450 MPa |

| Area source | TSA | RSA | Selected area | Tensile strength | Required load |
| --- | ---: | ---: | ---: | ---: | ---: |
| Auto | 113.10 mm² | 75.00 mm² | 80.00 mm² | 500.00 MPa | 36.00 kN |
| TSA | 113.10 mm² | 75.00 mm² | 113.10 mm² | 353.68 MPa | 50.89 kN |
| RSA | 113.10 mm² | 75.00 mm² | 75.00 mm² | 533.33 MPa | 33.75 kN |
| Manual | 113.10 mm² | 75.00 mm² | 80.00 mm² | 500.00 MPa | 36.00 kN |

## Automatic precedence and radius fallback

- Auto with manual area zero selects RSA = 75.00 mm².
- Auto with manual area zero and reduced width zero selects TSA = 113.10 mm².
- With radius zero and diameter 10 mm, TSA uses effective radius 5 mm and displays 78.54 mm².
- Explicit Manual with manual area zero selects zero and produces zero TS and required load; it does not fall back to an available TSA.

## Equivalent U.S. customary case

The original displayed the same SI results from equivalent inch, square-inch, lbf, and psi inputs, including approximately `0.236220472 in` radius, `0.124000248 in²` manual area, `8992.357 lbf` load, and `65266.982 psi` target strength.

## Mobile acceptance

- Exact two-decimal protected display parity for every controlled SI output.
- Equivalent U.S. inputs reproduce selected area, tensile strength, and required load within conversion tolerance.
- Global Metric/U.S. selection displays mm²/MPa/kN or in²/psi/lbf without changing normalized inputs.
- Seven measured inputs retain independent live unit selectors.
- Auto versus explicit source is highlighted and the resolved source remains visible.
- Result trace discloses radius versus diameter use, TSA, RSA, requested/resolved source, selected area, TS, and required load.
- Explicit unavailable sources generate a visible warning and zero dependent outputs.
- Light and dark themes render without horizontal overflow or browser-console errors.

The formula identity is recorded for original-application parity. Specimen applicability, test-machine calibration, material acceptance criteria, controlled-code confirmation, qualification records, and responsible welding-engineering approval remain external requirements.
