# API 653 Roof Plate protected-original parity record

Status: complete visible-workspace dependency chain passed locally on 20 August 2026.

## Protected source chain

The activated mobile workflow reproduces the complete visible `calculateRoof` chain:

1. build-year service period
2. previous-inspection period
3. original, previous, actual, and minimum thickness normalization
4. thickness loss since the previous inspection
5. long-term and short-term corrosion rates
6. corrosion allowance and governing rate
7. remaining life and protected long-life display state

The mobile application adds the requested highlighted Auto/Manual control for years since previous inspection. This changes only the time basis supplied to the same protected short-term equation.

## Equations and display behavior preserved

- `Thickness loss = max(t previous − t actual, 0)`.
- `CR long = max(t original − t actual, 0) ÷ years in service`.
- `CR short = thickness loss ÷ years since previous inspection`.
- `CR governing = max(CR long, CR short)`.
- `CA = t actual − t minimum`.
- `RL = CA ÷ CR governing` when allowance and corrosion rate are positive.
- A positive allowance with zero governing corrosion rate retains the protected open-ended `>99` display.
- A finite result above 99 years retains `>99` while the calculated value remains visible in the result trace.
- A non-positive allowance stays visible, returns 0.00 years, and raises the minimum-thickness review state.

## Controlled Metric golden case

- Current year: 2026
- Build year: 2006
- Previous inspection year: 2021
- Original thickness: 6.00 mm
- Previous thickness: 5.50 mm
- Actual thickness: 5.00 mm
- Minimum required thickness: 2.29 mm

| Result | Protected original | Mobile |
| --- | ---: | ---: |
| Years in service | 20 years | 20 years |
| Years since previous inspection | 5 years | 5 years |
| Thickness loss since previous | 0.50 mm | 0.50 mm |
| Corrosion allowance | 2.71 mm | 2.71 mm |
| Long-term corrosion rate | 0.050 mm/year | 0.050 mm/year |
| Short-term corrosion rate | 0.100 mm/year | 0.100 mm/year |
| Governing corrosion rate | 0.100 mm/year | 0.100 mm/year |
| Remaining life | 27.10 years | 27.10 years |

## Dependency and boundary evidence

- Setting the previous-inspection period manually to 10 years changes CR short to 0.050 mm/year and remaining life to 54.20 years.
- Equivalent inch entries preserve the 27.10-year SI result; global U.S. output displays 0.02 in loss, 0.11 in allowance, and 0.002/0.004 in/year at the established precision.
- Original, previous, and actual thickness all equal to 5.00 mm produces zero rates and the protected open-ended `>99` display.
- Original 5.20 mm, previous 5.10 mm, and actual 5.00 mm produces a finite 135.50-year result displayed as `>99 (135.50)`.
- Actual thickness 2.00 mm against minimum 2.29 mm preserves the −0.29 mm allowance and returns 0.00 years with a warning.
- Either a complete long-term route or a complete short-term route can independently drive the calculation.
- Standard engineering results display two decimals; corrosion rates display three; the SI engine retains full precision.

## Browser and build gate

- The running protected original and mobile preview were directly compared at displayed precision.
- Bottom, Annular, Shell, Nozzle, and Roof retain the shared header, workflow, basis card, Unit system selector, Design and inspection card, mixed-unit note, result card, and trace treatment.
- Automatic and manual period changes, Metric/U.S. conversion, open-ended life, finite life above 99 years, and minimum-reached behavior were exercised in the browser.
- Light and dark themes were inspected.
- No standards PDF, protected reference image, or wide calculation table is displayed or bundled.
- Engine golden, equivalent-unit, governing-route, independent-period, long-life, below-minimum, and invalid-input tests pass.
