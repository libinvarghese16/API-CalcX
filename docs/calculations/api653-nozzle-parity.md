# API 653 Nozzle Assessment protected-original parity record

Status: complete visible-workspace dependency chain passed locally on 20 August 2026.

## Protected source chain

The mobile workflow reproduces the complete visible Nozzle chain from the protected website:

1. material normalization and temperature-table routing in `getNozzleMinimumThicknessContext`
2. flange pressure-class validation
3. exact, lowest-listed, or next-lower NPS routing in `resolveNozzleStructuralLookup`
4. automatic structural minimum thickness
5. long-term and short-term corrosion rates
6. corrosion allowance and remaining life
7. minimum-life, maximum-life, and maximum-rate summary selection in `updateNozzleWorkspace`

The protected structural values remain internal engine data. The mobile application does not reproduce the wide pipe-schedule table, wide nozzle review table, standards PDF, or protected reference images.

## Equations and selection behavior preserved

- `CR long = max[(t original − t actual) ÷ years in service, 0]`.
- `CR short = max[(t previous − t actual) ÷ years since previous inspection, 0]`.
- `CR governing = max(CR long, CR short)`.
- `CA = t actual − t minimum`.
- `RL = CA ÷ CR governing` when allowance and corrosion rate are positive.
- A non-positive allowance produces zero remaining life.
- A positive allowance with zero governing corrosion rate retains open-ended life.
- The first protected material table whose temperature limit is at or above the operating temperature is used; values are not interpolated or extrapolated.
- Exact listed NPS uses its own row. Sizes below the listed range use the lowest row. Other unlisted sizes use the next-lower listed row.

Every automatic minimum remains manually editable. Manual mode is highlighted, retains the automatic recommendation in the visible trace, and recalculates the complete downstream chain.

## Controlled Metric golden case

- Current year: 2026
- Build year: 2006
- Previous inspection year: 2021
- Material: Carbon steel
- Operating temperature: 200 °C
- Flange pressure class: 300
- Nozzle size: NPS 4
- Original / previous / actual thickness: 10.00 / 9.50 / 9.00 mm

| Result | Protected original | Mobile |
| --- | ---: | ---: |
| Automatic minimum thickness | 2.41 mm | 2.41 mm |
| Corrosion allowance | 6.59 mm | 6.59 mm |
| Long-term corrosion rate | 0.050 mm/year | 0.050 mm/year |
| Short-term corrosion rate | 0.100 mm/year | 0.100 mm/year |
| Governing corrosion rate | 0.100 mm/year | 0.100 mm/year |
| Remaining life | 65.90 years | 65.90 years |

## Dependency and boundary evidence

- Carbon steel at 200 °C, Class 300, NPS 4 selects the protected D.2b route and 2.41 mm.
- Raising temperature to 206 °C selects the next protected D.2d route and 3.18 mm without interpolation.
- At 206 °C, NPS 1 1/4 uses the next-lower NPS 1 value of 1.27 mm.
- At 206 °C, NPS 1/8 uses the lowest listed NPS 1/2 value of 1.27 mm.
- Carbon steel above 400 °C is reported unavailable rather than extrapolated.
- Unsupported pressure classes and blank protected cells are reported unavailable.
- A manual minimum of 4.00 mm preserves the 2.41 mm automatic recommendation and changes remaining life to 50.00 years in the golden time basis.
- Equivalent 392 °F and inch thickness entries reproduce the same SI result.
- Standard results display two decimals; corrosion rates display three; engine calculations retain full precision.

## Browser and build gate

- The running protected original and mobile preview were directly compared at displayed precision.
- Bottom, Annular, Shell, and Nozzle use the same header, parity badge, workflow, basis card, in-card Unit system selector, Design and inspection card, mixed-unit note, result card, and trace treatment.
- Nozzle entries use responsive stacked cards rather than a wide mobile calculation table.
- Automatic Tmin, next-lower lookup, manual Tmin, and live Metric/U.S. conversion were exercised in the running mobile preview.
- Engine golden, routing-boundary, manual, open-ended-life, multi-nozzle summary, equivalent-unit, and unavailable-selection tests pass.
