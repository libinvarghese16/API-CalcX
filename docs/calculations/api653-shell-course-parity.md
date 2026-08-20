# API 653 Shell Course protected-original parity record

Status: complete visible-workspace dependency chain passed locally on 20 August 2026.

## Protected source chain

The protected website calculation is not a single terminal formula. The activated mobile workflow reproduces this complete visible dependency chain:

1. `getShellMaterialRecord`
2. `getShellProductStressRule`
3. `getShellHydroStressRule`
4. `syncShellMaterialStress`
5. course-height accumulation and H-to-Top calculation inside `updateShellWorkspace`
6. required minimum thickness with the 2.50 mm floor
7. hydrostatic test height and operating fill height
8. long-term and short-term corrosion rates
9. corrosion allowance and remaining life

The protected script also contains `updateShellLocalArea`, but the current protected HTML contains no `shell-local-*` input or result controls. That dormant handler is not exposed or represented as a visible-workspace parity result. It requires its own visible controlled-source gate if those controls are activated later.

## Equations preserved

- Course H to Top: tank height minus the accumulated heights of all preceding courses.
- `tmin = [4.9 × max(H to Top − 0.3, 0) × D × G] ÷ (S × E)`, with a protected minimum of 2.50 mm.
- `Ht = [(St × E × t actual) ÷ (4.9 × D × G)] + 0.3`.
- `Operating H = [(S × E × t actual) ÷ (4.9 × D × G)] + 0.3`.
- `CR long = max[(t as-built − t actual) ÷ years in service, 0]`.
- `CR short = max[(t previous − t actual) ÷ years since previous inspection, 0]`.
- `CR governing = max(CR long, CR short)`.
- `CA = t actual − tmin`.
- `RL = CA ÷ CR governing` when allowance and corrosion rate are positive. Positive allowance with a zero governing rate retains the protected infinite-life display.

Lower courses 1 and 2 use the protected lower-course material values and background stress routes. Course 3 and above use the upper-course routes. Named materials provide automatic S and St values. Every automatic stress remains manually editable and highlighted. The `Known` material route starts in manual mode because no numeric recommendation is available.

## Controlled Metric golden case

Shared tank inputs:

- Current year: 2026
- Build year: 2006
- Previous inspection year: 2021
- Diameter: 30 m
- Tank height: 18 m
- Specific gravity: 1.1
- Joint efficiency: 0.85
- Three visible courses, each 3 m high
- Material: A36 for all three courses

| Result | Protected original C1 / C2 / C3 | Mobile C1 / C2 / C3 |
| --- | --- | --- |
| H to Top | 18.00 / 15.00 / 12.00 m | 18.00 / 15.00 / 12.00 m |
| Automatic S | 172 / 172 / 189 MPa | 172 / 172 / 189 MPa |
| Automatic St | 189 / 189 / 208 MPa | 189 / 189 / 208 MPa |
| tmin | 19.58 / 16.26 / 11.78 mm | 19.58 / 16.26 / 11.78 mm |
| Hydrostatic Ht | 21.16 / 20.17 / 18.34 m | 21.16 / 20.17 / 18.34 m |
| Operating fill H | 19.29 / 18.38 / 16.69 m | 19.29 / 18.38 / 16.69 m |
| As-built thickness | 24.00 / 22.00 / 18.00 mm | 24.00 / 22.00 / 18.00 mm |
| Previous thickness | 22.00 / 20.50 / 17.00 mm | 22.00 / 20.50 / 17.00 mm |
| Actual thickness | 21.00 / 20.00 / 16.50 mm | 21.00 / 20.00 / 16.50 mm |
| Corrosion allowance | 1.42 / 3.74 / 4.72 mm | 1.42 / 3.74 / 4.72 mm |
| CR long | 0.150 / 0.100 / 0.075 mm/year | 0.150 / 0.100 / 0.075 mm/year |
| CR short | 0.200 / 0.100 / 0.100 mm/year | 0.200 / 0.100 / 0.100 mm/year |
| Remaining life | 7.12 / 37.42 / 47.24 years | 7.12 / 37.42 / 47.24 years |

The governing mobile summary correctly selects Course 1 at 7.12 years and 0.200 mm/year. Course 3 controls the lowest operating fill height at 16.69 m.

## Dependency and boundary evidence

- A36 lower-course background routes: S `min(0.80Y, 0.429T)` and St `min(0.88Y, 0.472T)`.
- A36 upper-course background routes: S `min(0.88Y, 0.472T)` and St `min(0.9Y, 0.519T)`.
- With tank height 6.50 m, Course 3 H to Top is 0.50 m and both applications raise the raw 0.20 mm result to 2.50 mm.
- The protected `Known` manual case with S 160 MPa and St 180 MPa produces tmin 21.04 mm, Ht 20.17 m, and operating H 17.96 m in both applications.
- Switching each mobile stress between automatic and manual mode preserves its automatic recommendation and visibly highlights the override.
- Equivalent U.S. inputs convert 30 m to 98.425197 ft and 21 mm to 0.826772 in while preserving the 7.12-year governing result.
- Standard results display two decimals; corrosion rates display three; the SI engine retains unrounded values.

## Browser and build gate

- Original and mobile values were compared in the running local browser at displayed precision.
- Bottom, Annular, and Shell use the same calculator header, parity badge, workflow indicator, Calculation basis card, in-card Unit system selector, separate Design and inspection card, mixed-unit note, result card, and trace treatment.
- Phone-width layout has no horizontal page overflow and uses stacked course cards rather than a wide calculation table.
- Light and dark themes were inspected at phone width.
- Material values are used internally by the calculation engine; no standards table, figure, or PDF is displayed or bundled.
- Engine golden, material-route, floor, manual, zero-rate, equivalent-unit, and invalid-input tests pass.
