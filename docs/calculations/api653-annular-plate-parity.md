# API 653 Annular Plate remaining-life parity

Status: corrected complete dependency chain and shared mobile structure passed locally on 20 August 2026. The earlier manual-only 4.50 mm minimum and 21.50-year result were incomplete and are withdrawn. This record supersedes that result.

## Protected source identity

- Workspace: API 653 > Bottom and Annular
- Calculator card: Annular plate remaining life
- Base inputs: `base-D`, `base-H`, `base-tshell`, `base-G`, `base-stress`
- Annular inputs: `ann-years`, `ann-original`, `ann-prev`, `ann-act`, `ann-min`, `ann-pitting`
- Protected functions: `updateCalculatedStress`, `updateAnnularMinimumThickness`, `getAnnularMinimumThicknessSelection`, `calculateAnnular`
- Engine identity: `api653.annular-plate`
- Engine version: `0.1.0-original-web-parity`

## Correct complete calculation chain

1. Convert tank diameter and maximum liquid height to feet and first shell thickness to inches.
2. Calculate shell stress on the protected USC basis: `S = [2.34 × D(ft) × max(H(ft) − 1, 0)] ÷ t(in)`.
3. Convert calculated stress from psi to MPa.
4. Allow calculated shell stress to be manually overridden while continuing to retain and disclose the automatic recommendation.
5. Calculate effective product height `H × G` and reject automatic lookup when it exceeds 23 m.
6. Route specific gravity below 1.0 and specific gravity of 1.0 or above through their separate protected minimum-selection paths.
7. Select Annular minimum thickness from first-shell-thickness and the automatic or manually entered stress band.
8. Allow the selected minimum to be manually overridden while continuing to show the automatic recommendation and manual status.
9. Apply the selected or manually entered minimum to the audited corrosion-rate and remaining-life equation.

The application implements the protected lookup behavior internally. It does not display or bundle a standards table, standards PDF, or protected reference image.

## Corrected protected golden case

| Input | Value |
| --- | ---: |
| Tank diameter | 30.00 m |
| Maximum liquid height | 18.00 m |
| First shell thickness | 20.00 mm |
| Specific gravity | 0.900 |
| Build year | 2006 |
| Previous inspection year | 2021 |
| Original Annular thickness | 10.00 mm |
| Previous measured thickness | 9.30 mm |
| Current measured thickness | 8.80 mm |
| Pitting depth | 1.00 mm |

| Dependency/result | Protected original | Corrected mobile browser |
| --- | ---: | ---: |
| Calculated shell stress | 117.081 MPa | 117.081 MPa internal; 117.08 MPa display |
| Effective H × G | 16.20 m | 16.20 m |
| Selection route | API 653 Table 4.5a | API 653 Table 4.5a |
| Selection band | 19 < t ≤ 25 mm; stress < 168 MPa | Same |
| Automatic Annular minimum | 4.32 mm | 4.32 mm |
| Bottom-side metal loss | 1.20 mm | 1.20 mm |
| Top-side thickness remaining | 9.00 mm | 9.00 mm |
| Maximum rate, long term | 0.060 mm/yr | 0.060 mm/yr |
| Maximum rate, short term | 0.200 mm/yr | 0.200 mm/yr |
| Governing thickness | 8.80 mm | 8.80 mm |
| Available thickness | 4.48 mm | 4.48 mm |
| Remaining life | 22.40 years | 22.40 years |

## Second protected selection route

With the same geometry and inspection inputs but specific gravity changed to 1.100:

- Calculated stress remains 117.081 MPa.
- Effective H × G becomes 19.80 m.
- The protected alternate selection route returns a 6.00 mm Annular minimum.
- Protected original and corrected mobile remaining life both become 14.00 years.

## Manual calculated-stress case

With the corrected golden case held constant and calculated shell stress changed from automatic to a highlighted manual value of 190.00 MPa:

- The automatic stress recommendation remains visible at 117.08 MPa.
- The protected low-specific-gravity route moves to the `stress < 205 MPa` band.
- Automatic Annular minimum thickness changes from 4.32 mm to 7.88 mm.
- Available thickness changes to 0.92 mm and remaining life changes to 4.60 years.
- Changing only the stress input unit from MPa to psi converts 190.00 MPa to 27557.170163 psi without changing Tmin or remaining life.

## Regression and browser acceptance

- Exact automatic selection values and inequality boundaries are tested for both specific-gravity routes.
- H × G above 23 m blocks automatic selection and exposes a visible error.
- First-shell-thickness and stress values outside protected selection ranges expose errors.
- Manual minimum mode remains highlighted, uses the entered value, and preserves the automatic suggestion for review.
- Manual shell-stress mode remains highlighted, uses the entered value for Tmin selection, and preserves the automatic stress recommendation for review.
- Equivalent U.S. customary diameter, height, shell, Annular, and pitting inputs reproduce the same normalized stress, selection, corrosion rates, and remaining life.
- Metric and U.S. result systems preserve the 22.40-year result.
- Build year, previous inspection year, service periods, calculated stress mode/value/recommendation, and Annular minimum are all visible and traceable.
- Bottom, Annular, and Shell use the same calculator header, parity badge, workflow indicator, Calculation basis card, Unit system selector, Design and inspection card, mixed-unit note, result card, and trace treatment.
- Light and dark themes were opened in the local browser with the corrected result active.
- Bottom Plate was regression-checked after the shared UI change and retains its separate 17.75-year golden result.

This parity record verifies the original application calculation chain. Tank geometry, liquid level, product properties, settlement, shell-to-bottom junction condition, inspection coverage, pitting characterization, controlled code edition, and responsible engineering approval remain external requirements.
