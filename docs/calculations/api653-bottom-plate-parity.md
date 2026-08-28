# API 653 bottom-plate MRT audit record

Status: corrected mobile calculation route verified locally on 29 August 2026 against the protected master application's input identities and the supplied proof-audit correction register. The mobile engine intentionally corrects the master application's former generic maximum-rate remaining-life route.

## Engine identity

- Workspace: API 653 > Bottom and Annular
- Calculator: Bottom plate remaining life
- Engine identity: `api653.bottom-plate`
- Engine version: `0.3.0-api653-pit-depth`
- Display policy: two decimals for thickness/life and three decimals for corrosion rates

No standards PDF, displayed standard table, or copyrighted reference image is bundled with the application.

## Corrected general-bottom route

1. `RTbc` is the current bottom-side remaining thickness after the applicable inspection/repair basis.
2. The user enters only the current internal-pitting **depth**. It defaults to `0`, which represents no measured internal-pitting depth.
3. Current `RTip` is derived internally as `original thickness - current pit depth`; pit depth cannot exceed the original thickness. The hidden previous-depth baseline remains zero so removing the field does not change the protected single-depth calculation route.
4. Automatic `UPr` is the larger available long- or short-term bottom-side corrosion rate.
5. Automatic `StPr` is the larger of `current pit depth / years in service` and `current pit depth / years since previous inspection`.
6. A controlled manual `UPr` or `StPr` may be used without requiring unavailable historical thickness data; the interface highlights the override.
7. Projected minimum remaining thickness:

   `MRT = min(RTbc, RTip) - Or × (StPr + UPr)`

8. Calculated time to the selected bottom minimum:

   `Remaining life = [min(RTbc, RTip) - Tmin] / (StPr + UPr)`

9. When available thickness is positive and `StPr + UPr` is zero, remaining life is reported as open-ended rather than zero years.
10. Invalid or incomplete general-bottom inputs display an unavailable result rather than a misleading numerical zero.

## Separate critical-zone route

The critical-zone assessment does not replace the general bottom MRT calculation. It requires:

- lower shell course required thickness `tmin`; and
- actual measured remaining thickness in the shell-to-bottom critical zone.

The controlled minimum implemented for this audit route is:

`Critical-zone minimum = max(2.5 mm, min(3.0 mm, 0.5 × lower-shell tmin))`

An incomplete critical-zone assessment is reported separately without suppressing an otherwise valid general bottom MRT/remaining-life result. A completed assessment below the calculated critical-zone minimum is reported as an error while retaining the general-bottom result for traceability.

## Golden metric case

| Input | Value |
| --- | ---: |
| Years in service | 20 yr |
| Years since previous inspection | 5 yr |
| Original bottom thickness | 8.00 mm |
| Previous bottom thickness | 7.40 mm |
| Current `RTbc` | 7.00 mm |
| Current internal-pitting depth | 1.20 mm |
| Derived current `RTip` | 6.80 mm |
| Projection interval `Or` | 10 yr |
| Bottom minimum | 2.54 mm |
| Lower-shell `tmin` | 6.00 mm |
| Critical-zone measured thickness | 4.00 mm |

| Result | Expected |
| --- | ---: |
| `UPr` long / short / used | 0.050 / 0.080 / 0.080 mm/yr |
| `StPr` long / short / used | 0.060 / 0.240 / 0.240 mm/yr |
| `StPr + UPr` | 0.320 mm/yr |
| Governing current thickness | 6.80 mm |
| Projected MRT at 10 years | 3.60 mm |
| Remaining life to 2.54 mm | 13.3125 yr |
| Critical-zone minimum | 3.00 mm |
| Critical-zone status | Adequate |

## Regression coverage

- Correct `StPr + UPr` MRT arithmetic.
- Independent long- and short-term `UPr` and `StPr` traces.
- Zero-depth defaults remain valid and calculate a zero top-side pitting rate.
- Current pit depth alone derives `RTip` and the protected single-depth `StPr` routes.
- Pit depths greater than original thickness are blocked.
- Manual rates without irrelevant history-field blocking.
- Standard, reduced-confirmed, and controlled-manual bottom minimum routes.
- Separate complete, incomplete, and below-minimum critical-zone assessments.
- Open-ended remaining life for a confirmed zero combined corrosion rate.
- Equivalent mixed-unit input normalization in the shared engineering-unit system.
