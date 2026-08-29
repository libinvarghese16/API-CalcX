import type {
  CalculationIssue,
  CylindricalShellInputSI,
  SphericalShellResultSI,
} from "../contracts.ts";

function addPositiveIssue(issues: CalculationIssue[], field: "insideDiameterMm" | "designPressureMpa" | "allowableStressMpa" | "jointEfficiency", value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function addNonNegativeIssue(issues: CalculationIssue[], field: "originalThicknessMm" | "previousThicknessMm" | "actualThicknessMm" | "minimumThicknessMm" | "yearsInService" | "yearsSincePreviousInspection", value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

/** Pure extraction of the protected legacy API 510 spherical-shell path. */
export function calculateSphericalShell(input: CylindricalShellInputSI): SphericalShellResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveIssue(issues, "insideDiameterMm", input.insideDiameterMm, "Inside diameter");
  addPositiveIssue(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");
  addPositiveIssue(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");
  addPositiveIssue(issues, "jointEfficiency", input.jointEfficiency, "Joint efficiency");
  addNonNegativeIssue(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  addNonNegativeIssue(issues, "previousThicknessMm", input.previousThicknessMm, "Previous thickness");
  addNonNegativeIssue(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  addNonNegativeIssue(issues, "yearsInService", input.yearsInService, "Years in service");
  addNonNegativeIssue(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");
  if (input.minimumThicknessMm !== undefined) addNonNegativeIssue(issues, "minimumThicknessMm", input.minimumThicknessMm, "Minimum thickness");
  if (Number.isFinite(input.jointEfficiency) && input.jointEfficiency > 1) {
    issues.push({ code: "joint-efficiency-out-of-range", field: "jointEfficiency", severity: "error", message: "Joint efficiency must not exceed 1.0." });
  }

  const rawInterval = Number.isInteger(input.nextInspectionYears) ? input.nextInspectionYears : 5;
  const intervalYears = Math.min(Math.max(rawInterval, 1), 10);
  if (rawInterval !== input.nextInspectionYears || rawInterval !== intervalYears) {
    issues.push({ code: "inspection-interval-normalized", field: "nextInspectionYears", severity: "warning", message: "Next inspection interval was normalized to a whole number from 1 to 10 years." });
  }

  const pressureBasisValid = !issues.some((issue) => issue.severity === "error" && ["insideDiameterMm", "designPressureMpa", "allowableStressMpa", "jointEfficiency"].includes(issue.field));
  const radiusMm = Number.isFinite(input.insideDiameterMm) ? input.insideDiameterMm / 2 : 0;
  let requiredThicknessMm = 0;
  if (pressureBasisValid) {
    const denominator = (input.allowableStressMpa * input.jointEfficiency) - (0.6 * input.designPressureMpa);
    if (denominator > 0) requiredThicknessMm = (input.designPressureMpa * radiusMm) / denominator;
    else issues.push({ code: "spherical-denominator-not-positive", field: "calculation", severity: "error", message: "The spherical-shell required-thickness denominator must be greater than zero." });
  }

  const minimumThicknessUsedMm = input.minimumThicknessMm === undefined ? Math.round(requiredThicknessMm * 100) / 100 : Math.max(input.minimumThicknessMm, 0);
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
    if (!(pressureBasisValid && thicknessMm > 0 && radiusMm > 0)) return 0;
    const denominator = radiusMm + (0.6 * thicknessMm);
    const pressure = denominator > 0 ? (input.allowableStressMpa * input.jointEfficiency * thicknessMm) / denominator : 0;
    return Number.isFinite(pressure) && pressure > 0 ? pressure : 0;
  };
  const governingMawpMpa = mawpFromThickness(actualThicknessMm);
  const projectedThicknessMm = actualThicknessMm > 0 ? Math.max(actualThicknessMm - (governingCorrosionRateMmPerYear * intervalYears), 0) : 0;
  const futureMawpThicknessMm = actualThicknessMm > 0 ? Math.max(actualThicknessMm - (2 * governingCorrosionRateMmPerYear * intervalYears), 0) : 0;

  issues.push({ code: "thin-sphere-scope-review", field: "calculation", severity: "warning", message: "The live-reference spherical-shell equation is active. Confirm geometry and equation applicability against the controlled engineering basis." });
  issues.push({ code: "test-pressure-basis-review", field: "calculation", severity: "warning", message: "Displayed hydrostatic and pneumatic pressures are planning values; the construction code, edition, stress ratio, and component limits govern the test." });
  return {
    engineId: "api510.spherical-shell",
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
