# API 653 Other 4.3.2 protected-original parity record

Status: complete visible-workspace dependency chain passed locally on 20 August 2026.

## Protected source chain

The activated mobile workflow reproduces the complete visible `calculateApi653Other432` chain:

1. tank diameter and least local thickness normalization
2. uncapped critical length and protected 1000 mm cap
3. five positive profile readings and their average thickness t1
4. tmin plus corrosion allowance threshold
5. 60% tmin plus corrosion allowance threshold
6. the two core acceptance comparisons
7. optional deepest-pit and pit-dimension-sum checks
8. overall pass, fail, or pending state

The mobile application adds highlighted Auto/Manual controls for critical length, t1, adjusted tmin, and adjusted 60% tmin. Automatic mode preserves the protected equations. Manual mode is an explicit, visible engineering override; the automatic recommendation remains in the help text and result trace.

## Equations and boundaries preserved

- `L raw = 34 × sqrt(D(m) × t2(mm))`.
- `L = min(L raw, 1000 mm)`.
- `t1 = average of exactly five positive profile readings`.
- Check (i) passes when `t1 >= tmin + CA`.
- Check (ii) passes when `t2 >= (0.6 × tmin) + CA`.
- Optional pit clause (a) passes when deepest-pit remaining thickness is at least `0.5 × tmin`.
- Optional pit clause (b) passes when the pit-dimension sum is no more than `50 mm` in the recorded 200 mm band.
- Both optional pit values must be present for a pit pass/fail result. One entered value produces Pit Pending without blocking an otherwise passing core result, matching the protected original.
- The overall result fails when either ready core check fails or when a fully evaluated pit screen fails.

## Controlled Metric golden case

- Tank diameter: 30.00 m
- Least local thickness t2: 8.00 mm
- Minimum required thickness tmin: 6.00 mm
- Corrosion allowance CA: 1.00 mm
- Profile readings: 8.00, 8.00, 7.50, 8.50, and 8.00 mm
- Pit inputs: omitted

| Result | Protected original | Mobile |
| --- | ---: | ---: |
| Critical length L raw | 526.73 mm | 526.73 mm |
| Critical length L capped | 526.73 mm | 526.73 mm |
| Average thickness t1 | 8.00 mm | 8.00 mm |
| tmin + CA | 7.00 mm | 7.00 mm |
| 0.6 tmin + CA | 4.60 mm | 4.60 mm |
| Check (i) | Pass | Pass |
| Check (ii) | Pass | Pass |
| Pit screen | Optional | Optional |
| Overall | Pass | Pass |

## Dependency and boundary evidence

- At pit remaining thickness 3.00 mm and pit sum 50.00 mm, both equality boundaries pass and overall remains Pass.
- At pit remaining thickness 2.99 mm or pit sum 50.01 mm, the evaluated pit route fails.
- Diameter 1500 m with t2 = 1.00 mm produces 1316.81 mm raw critical length and the protected 1000.00 mm cap.
- Five 6.00 mm profile readings against adjusted tmin 7.00 mm fail check (i).
- t2 = 1.00 mm against the 4.60 mm adjusted 60% threshold fails check (ii).
- A missing or zero profile point keeps check (i) and the overall core result Pending.
- Equivalent foot, inch, and centimetre entries preserve the same SI engine values.
- Global U.S. output shows the golden critical length as 20.74 in while preserving the Pass state.
- A manual adjusted-60% threshold of 8.10 mm changes check (ii) to Fail while retaining the automatic 4.60 mm recommendation.
- Standard engineering results display two decimals; this workspace has no corrosion-rate output.

## Browser and build gate

- The running protected original and mobile preview were directly compared for pending, pass, fail, pit equality, cap, and mixed-unit states.
- The workspace retains the same API 653 header, workflow, calculation basis, Unit system selector, Design and inspection card, mixed-unit note, result card, and trace treatment.
- Build year, years in service, previous inspection year, and years since previous inspection are retained as automatic/editable record context. The UI states that time is not used by the protected 4.3.2 equations.
- Profile readings and results use stacked responsive cards; no wide calculation table is present.
- No standards PDF, protected reference image, or standards table is displayed or bundled.
- Engine golden, cap, equality, fail, pending, equivalent-unit, manual-override, and invalid-input tests pass.
