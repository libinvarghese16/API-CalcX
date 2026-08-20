# API 653 mobile scope audit

Status: source inventory completed and all 6 API 653 calculators locally parity-validated through 20 August 2026.

## Protected-source inventory

The protected website exposes six API 653 calculation workspaces. The mobile library keeps this order so each calculator can pass the same audit gate before activation.

| Order | Mobile workspace | Protected source identity | Migration state |
| ---: | --- | --- | --- |
| 1 | Bottom plate remaining life | `calculateBottom` | Active and locally parity-validated |
| 2 | Annular plate remaining life | `updateCalculatedStress` → `updateAnnularMinimumThickness` → `calculateAnnular` | Corrected complete chain active and locally parity-validated |
| 3 | Shell course assessment | material stress dependencies → course elevation accumulation → `updateShellWorkspace` | Active and locally parity-validated |
| 4 | Nozzle assessment | minimum-thickness context → size fallback → `updateNozzleWorkspace` | Active and locally parity-validated |
| 5 | Roof plate remaining life | inspection periods → `calculateRoof` → long-life display route | Active and locally parity-validated |
| 6 | Other 4.3.2 calculations | `calculateApi653Other432` | Active and locally parity-validated |

Bottom Plate, Annular Plate, Shell Course, Nozzle Assessment, Roof Plate, and Other 4.3.2 Calculations are enabled. All six cards open an independently audited calculation workspace.

## Content boundary

The mobile application contains calculator inputs, equations needed by the engine, result traces, and original explanatory safety text. It does not bundle a standards PDF, copyrighted standard table, protected reference image, or copied standard narrative.

## Controlled migration gate

Every API 653 workspace must complete these steps before activation:

1. Identify the protected page controls, function, dependencies, and display precision.
2. Capture at least one complete Metric golden case in the running original website.
3. Record zero, invalid, optional, automatic/manual, and governing-route behavior.
4. Implement one SI-normalized typed calculation engine without changing the protected equation.
5. Add exact golden regression, equivalent-unit, governing-route, and invalid-input tests.
6. Connect live per-field units, global Metric/U.S. results, visible assumptions, and the original explanatory reference pattern.
7. Browser-compare the mobile result with the running protected source and verify light/dark rendering.
8. Keep the next calculator locked until its own gate is complete.

All six calculators have completed the controlled activation gate. Roof validation includes automatic/editable service periods, mixed thickness units, long/short/governing corrosion rates, negative allowance, open-ended life, finite life above 99 years, and minimum-thickness warning. Other 4.3.2 validation includes the capped critical length, five-point average, two adjusted thresholds, core acceptance checks, optional two-part pit screening, explicit manual overrides, and direct running-browser comparison. The dormant `updateShellLocalArea` handler has no controls in the protected HTML and is not represented as an activated parity result.
