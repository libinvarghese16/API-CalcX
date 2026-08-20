# API 653 Bottom Plate remaining-life parity

Status: protected original-web inputs, result route, mixed units, automatic/manual periods, and regression cases passed locally on 13 August 2026. This is API 653 calculator 1 of 6.

## Protected source identity

- Workspace: API 653 > Bottom and Annular
- Calculator card: Bottom Plate remaining life
- Source function: `calculateBottom`
- Engine identity: `api653.bottom-plate`
- Engine version: `0.1.0-original-web-parity`
- Test tolerance: `1e-12` for normalized engine values; displayed values use the shared precision policy

The mobile application contains only the audited calculation behavior and original explanatory text. It does not include a standards PDF, copyrighted standard table, or protected reference image.

## Equation behavior preserved

- Bottom-side total loss is the positive difference between original and current thickness.
- Bottom-side short-term loss is the positive difference between previous and current thickness.
- Top-side loss is the entered pitting depth; top-side remaining thickness is original thickness less that depth, never below zero.
- Long-term bottom and top rates use years in service.
- Short-term bottom and top rates use years since the previous inspection.
- Maximum long- and short-term routes take the larger bottom-side or top-side rate.
- The governing corrosion rate is the larger of the maximum long- and short-term rates.
- Governing current thickness is the lesser of current measured bottom thickness and calculated top-side remaining thickness.
- Available thickness is governing current thickness less the editable minimum thickness, never below zero.
- Remaining life is available thickness divided by the governing corrosion rate; zero rate preserves the protected zero-corrosion behavior.

## Captured protected golden case

| Input | Value |
| --- | ---: |
| Build year | 2006 |
| Previous inspection year | 2021 |
| Years in service | 20 years |
| Years since previous inspection | 5 years |
| Original bottom thickness | 8.00 mm |
| Previous measured thickness | 7.40 mm |
| Current measured thickness | 7.00 mm |
| Minimum required thickness | 2.54 mm |
| Pitting depth | 1.20 mm |

| Result | Protected original | Mobile browser |
| --- | ---: | ---: |
| Bottom-side metal loss | 1.00 mm | 1.00 mm |
| Top-side thickness remaining | 6.80 mm | 6.80 mm |
| Bottom rate, long term | 0.050 mm/yr | 0.050 mm/yr |
| Bottom rate, short term | 0.080 mm/yr | 0.080 mm/yr |
| Top rate, long term | 0.060 mm/yr | 0.060 mm/yr |
| Top rate, short term | 0.240 mm/yr | 0.240 mm/yr |
| Maximum rate, long term | 0.060 mm/yr | 0.060 mm/yr |
| Maximum rate, short term | 0.240 mm/yr | 0.240 mm/yr |
| Remaining life | 17.75 years | 17.75 years |

## Mobile acceptance verified

- Build year automatically produces years in service and remains manually editable with a highlighted override state.
- Previous inspection year automatically produces years since the previous inspection and remains manually editable with a highlighted override state.
- Every thickness and pitting input has its own live unit selector.
- Switching the global result system from Metric to U.S. customary converts the fields and result display without changing the normalized calculation or 17.75-year result.
- Standard thickness and life values display two decimals; corrosion rates display three decimals.
- The visible trace identifies all four corrosion routes, governing rate, governing thickness, available thickness, minimum thickness, engine ID, and validation state.
- Light and dark themes were opened in the local browser with no calculation error or horizontal content overflow observed at the available application viewport.

This parity record verifies the original application calculation path. Inspection coverage, bottom scanning interpretation, pitting characterization, applicable controlled minimum thickness, code edition, and responsible engineering approval remain external requirements.
