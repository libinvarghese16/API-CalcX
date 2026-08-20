# Calculation display precision policy

Status: active across the API 510 and API 570 mobile calculation workspaces, result traces, review/report previews, and copied report text.

## Presentation rule

- Standard engineering values display with exactly **two decimal places**.
- Long-term, short-term, and governing **corrosion rates display with exactly three decimal places**.
- Whole-number identifiers and calendar values, such as build year, inspection year, workflow revision, and interval-year labels, remain whole numbers.
- Equation constants shown as reference text retain their audited notation.

## Calculation integrity

Display formatting is applied only after the protected calculation engine returns its structured result and, where applicable, after that value is converted to the selected Metric or U.S. customary output unit. Engine inputs, normalized SI values, saved result snapshots, fingerprints, and report source objects retain full numerical precision. Unit-bearing input fields also retain the precision needed to preserve the physical value during live conversion.

Reports consume the same structured result already shown in the calculator. They apply this presentation rule but do not recalculate, round, or write formatted values back into the engine or saved record.

## Verification rule

Every future calculation update must pass both checks:

1. Raw equation and normalized-SI results remain within the recorded protected-source tolerance.
2. Mobile result, trace, and report presentation follows the two-decimal standard and three-decimal corrosion-rate rule in both Metric and U.S. customary views.

Parity documents that quote an original website display remain historical evidence of that source interface. Current mobile display examples are governed by this policy.
