import type {
  CalculationIssue,
  ConicalHeadInputSI,
  ConicalHeadResultSI,
} from "../contracts.ts";

function requirePositive(
  issues: CalculationIssue[],
  field: "outsideDiameterMm" | "designPressureMpa" | "allowableStressMpa" | "jointEfficiency",
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function requireNonNegative(
  issues: CalculationIssue[],
  field: "originalThicknessMm" | "previousThicknessMm" | "actualThicknessMm" | "minimumThicknessMm" | "yearsInService" | "yearsSincePreviousInspection",
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

/** Pure extraction of the protected legacy API 510 conical-head path. */
export function calculateConicalHead(input: ConicalHeadInputSI): ConicalHeadResultSI {
  const issues: CalculationIssue[] = [];
  requirePositive(issues, "outsideDiameterMm", input.outsideDiameterMm, "Outside diameter");
  requirePositive(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");
  requirePositive(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");
  requirePositive(issues, "jointEfficiency", input.jointEfficiency, "Joint efficiency");
  requireNonNegative(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  requireNonNegative(issues, "previousThicknessMm", input.previousThicknessMm, "Previous thickness");
  requireNonNegative(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  requireNonNegative(issues, "yearsInService", input.yearsInService, "Years in service");
  requireNonNegative(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");
  if (input.minimumThicknessMm !== undefined) requireNonNegative(issues, "minimumThicknessMm", input.minimumThicknessMm, "Minimum thickness");
  if (Number.isFinite(input.jointEfficiency) && input.jointEfficiency > 1) {
    issues.push({ code: "joint-efficiency-out-of-range", field: "jointEfficiency", severity: "error", message: "Joint efficiency must not exceed 1.0." });
  }
  if (!Number.isFinite(input.halfApexAngleDeg) || input.halfApexAngleDeg < 0 || input.halfApexAngleDeg >= 90) {
    issues.push({ code: "half-apex-angle-out-of-range", field: "halfApexAngleDeg", severity: "error", message: "Cone half-apex angle must be from 0 degrees up to, but not including, 90 degrees." });
  }

  const rawInterval = Number.isInteger(input.nextInspectionYears) ? input.nextInspectionYears : 5;
  const intervalYears = Math.min(Math.max(rawInterval, 1), 10);
  if (rawInterval !== input.nextInspectionYears || rawInterval !== intervalYears) {
    issues.push({ code: "inspection-interval-normalized", field: "nextInspectionYears", severity: "warning", message: "Next inspection interval was normalized to a whole number from 1 to 10 years." });
  }

  const pressureBasisValid = !issues.some((issue) => issue.severity === "error" && ["outsideDiameterMm", "designPressureMpa", "allowableStressMpa", "jointEfficiency", "halfApexAngleDeg"].includes(issue.field));
  const halfApexAngleRad = input.halfApexAngleDeg * (Math.PI / 180);
  const cosHalfApexAngle = pressureBasisValid ? Math.cos(halfApexAngleRad) : 0;
  let requiredThicknessMm = 0;
  if (pressureBasisValid && cosHalfApexAngle > 0) {
    const denominator = 2 * cosHalfApexAngle * ((input.allowableStressMpa * input.jointEfficiency) - (0.6 * input.designPressureMpa));
    if (denominator > 0) requiredThicknessMm = (input.designPressureMpa * input.outsideDiameterMm) / denominator;
    else issues.push({ code: "conical-denominator-not-positive", field: "calculation", severity: "error", message: "The conical-head required-thickness denominator must be greater than zero." });
  }

  const minimumThicknessUsedMm = input.minimumThicknessMm === undefined ? requiredThicknessMm : Math.max(input.minimumThicknessMm, 0);
  const originalThicknessMm = Math.max(Number.isFinite(input.originalThicknessMm) ? input.originalThicknessMm : 0, 0);
  const previousThicknessMm = Math.max(Number.isFinite(input.previousThicknessMm) ? input.previousThicknessMm : 0, 0);
  const actualThicknessMm = Math.max(Number.isFinite(input.actualThicknessMm) ? input.actualThicknessMm : 0, 0);
  const longTermLossMm = originalThicknessMm > 0 && actualThicknessMm > 0 ? Math.max(originalThicknessMm - actualThicknessMm, 0) : 0;
  const shortTermLossMm = previousThicknessMm > 0 && actualThicknessMm > 0 ? Math.max(previousThicknessMm - actualThicknessMm, 0) : 0;
  const longTermCorrosionRateMmPerYear = input.yearsInService > 0 ? longTermLossMm / input.yearsInService : 0;
  const shortTermCorrosionRateMmPerYear = input.yearsSincePreviousInspection > 0 ? shortTermLossMm / input.yearsSincePreviousInspection : 0;
  const governingCorrosionRateMmPerYear = Math.max(longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear);
  const corrosionAllowanceMm = actualThicknessMm > 0 && minimumThicknessUsedMm > 0 ? Math.max(actualThicknessMm - minimumThicknessUsedMm, 0) : 0;
  const remainingLifeYears = governingCorrosionRateMmPerYear > 0 ? corrosionAllowanceMm / governingCorrosionRateMmPerYear : 0;

  const mawpFromThickness = (thicknessMm: number): number => {
    if (!(pressureBasisValid && thicknessMm > 0 && input.outsideDiameterMm > 0 && cosHalfApexAngle > 0)) return 0;
    const denominator = input.outsideDiameterMm + (1.2 * thicknessMm * cosHalfApexAngle);
    const pressure = denominator > 0 ? (2 * input.allowableStressMpa * input.jointEfficiency * thicknessMm * cosHalfApexAngle) / denominator : 0;
    return Number.isFinite(pressure) && pressure > 0 ? pressure : 0;
  };
  const governingMawpMpa = mawpFromThickness(actualThicknessMm);
  const projectedThicknessMm = actualThicknessMm > 0 ? Math.max(actualThicknessMm - (governingCorrosionRateMmPerYear * intervalYears), 0) : 0;
  const futureMawpThicknessMm = actualThicknessMm > 0 ? Math.max(actualThicknessMm - (2 * governingCorrosionRateMmPerYear * intervalYears), 0) : 0;

  return {
    engineId: "api510.conical-head",
    engineVersion: "0.1.0-legacy-parity",
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    intervalYears,
    requiredThicknessMm,
    minimumThicknessUsedMm,
    longTermCorrosionRateMmPerYear,
    shortTermCorrosionRateMmPerYear,
    governingCorrosionRateMmPerYear,
    corrosionAllowanceMm,
    remainingLifeYears,
    governingMawpMpa,
    hydrostaticTestPressureMpa: governingMawpMpa > 0 ? 1.3 * governingMawpMpa : 0,
    pneumaticTestPressureMpa: governingMawpMpa > 0 ? 1.1 * governingMawpMpa : 0,
    projectedThicknessMm,
    futureMawpThicknessMm,
    futureMawpMpa: mawpFromThickness(futureMawpThicknessMm),
  };
}
