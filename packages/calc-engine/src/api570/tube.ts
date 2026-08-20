import type {
  Api570TubeField,
  Api570TubeInputSI,
  Api570TubeResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.tube" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addPositiveIssue(issues: CalculationIssue[], field: Api570TubeField, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function addNonNegativeIssue(issues: CalculationIssue[], field: Api570TubeField, value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

function mawpFromThickness(thicknessMm: number, values: { D: number; S: number; W: number; e: number }): number {
  const { D, S, W, e } = values;
  if (!(D > 0 && S > 0 && W > 0 && thicknessMm > 0)) return 0;
  const effectiveThickness = thicknessMm - (0.005 * D) - e;
  if (!(effectiveThickness > 0)) return 0;
  const denominator = D - effectiveThickness;
  return denominator > 0 ? (2 * S * W * effectiveThickness) / denominator : 0;
}

/** Pure SI extraction of the protected original website's individual API 570 Tube calculator. */
export function calculateApi570Tube(input: Api570TubeInputSI): Api570TubeResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveIssue(issues, "outsideDiameterMm", input.outsideDiameterMm, "Outside diameter");
  addPositiveIssue(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");
  addPositiveIssue(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");
  addNonNegativeIssue(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  addNonNegativeIssue(issues, "previousThicknessMm", input.previousThicknessMm, "Previous thickness");
  addNonNegativeIssue(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  addNonNegativeIssue(issues, "yearsInService", input.yearsInService, "Years in service");
  addNonNegativeIssue(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");

  const W = input.weldStrengthReductionFactor === undefined
    ? 1
    : finiteOrZero(input.weldStrengthReductionFactor);
  addPositiveIssue(issues, "weldStrengthReductionFactor", W, "Weld strength reduction factor");
  if (input.endCondition !== "welded" && input.endCondition !== "expanded") {
    issues.push({ code: "invalid-end-condition", field: "endCondition", severity: "error", message: "Tube end condition must be welded or expanded." });
  }
  if (input.endCondition === "expanded") {
    addNonNegativeIssue(issues, "expandedEndThicknessFactorMm", finiteOrZero(input.expandedEndThicknessFactorMm), "Expanded-end thickness factor");
  }
  if (input.minimumThicknessMm !== undefined) {
    addNonNegativeIssue(issues, "minimumThicknessMm", input.minimumThicknessMm, "Minimum thickness");
  }

  const rawInterval = Number.isInteger(input.nextInspectionYears) ? input.nextInspectionYears : 5;
  const intervalYears = Math.min(Math.max(rawInterval, 1), 20);
  if (rawInterval !== input.nextInspectionYears || rawInterval !== intervalYears) {
    issues.push({ code: "inspection-interval-normalized", field: "nextInspectionYears", severity: "warning", message: "Future interval was normalized to a whole number from 1 to 20 years." });
  }

  const P = finiteOrZero(input.designPressureMpa);
  const D = finiteOrZero(input.outsideDiameterMm);
  const S = finiteOrZero(input.allowableStressMpa);
  const endCondition = input.endCondition === "expanded" ? "expanded" : "welded";
  const e = endCondition === "expanded" ? Math.max(finiteOrZero(input.expandedEndThicknessFactorMm), 0) : 0;
  const pressureBasisValid = !issues.some((issue) => issue.severity === "error" && [
    "outsideDiameterMm", "designPressureMpa", "allowableStressMpa", "weldStrengthReductionFactor",
    "endCondition", "expandedEndThicknessFactorMm",
  ].includes(issue.field));
  const denominator = (2 * S * W) + P;
  const requiredThicknessMm = pressureBasisValid && denominator > 0
    ? ((P * D) / denominator) + (0.005 * D) + e
    : 0;
  // The protected Metric workflow writes the auto value into a 0.01 mm editable
  // field before remaining-life calculations. Keep this step SI and unit-invariant.
  const automaticMinimumThicknessMm = Math.round((requiredThicknessMm + Number.EPSILON) * 100) / 100;
  const minimumThicknessUsedMm = input.minimumThicknessMm === undefined
    ? automaticMinimumThicknessMm
    : Math.max(finiteOrZero(input.minimumThicknessMm), 0);

  const originalThicknessMm = Math.max(finiteOrZero(input.originalThicknessMm), 0);
  const previousThicknessMm = Math.max(finiteOrZero(input.previousThicknessMm), 0);
  const actualThicknessMm = Math.max(finiteOrZero(input.actualThicknessMm), 0);
  const yearsInService = Math.max(finiteOrZero(input.yearsInService), 0);
  const yearsSincePreviousInspection = Math.max(finiteOrZero(input.yearsSincePreviousInspection), 0);
  const longTermCorrosionRateMmPerYear = yearsInService > 0 && originalThicknessMm > 0 && actualThicknessMm > 0
    ? Math.max(originalThicknessMm - actualThicknessMm, 0) / yearsInService : 0;
  const shortTermCorrosionRateMmPerYear = yearsSincePreviousInspection > 0 && previousThicknessMm > 0 && actualThicknessMm > 0
    ? Math.max(previousThicknessMm - actualThicknessMm, 0) / yearsSincePreviousInspection : 0;
  const governingCorrosionRateMmPerYear = Math.max(longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear);
  const corrosionAllowanceMm = actualThicknessMm > 0 && minimumThicknessUsedMm > 0
    ? Math.max(actualThicknessMm - minimumThicknessUsedMm, 0) : 0;
  const remainingLifeYears = governingCorrosionRateMmPerYear > 0
    ? corrosionAllowanceMm / governingCorrosionRateMmPerYear : 0;
  const projectedThicknessMm = actualThicknessMm > 0
    ? Math.max(actualThicknessMm - (governingCorrosionRateMmPerYear * intervalYears), 0) : 0;
  const futureMawpThicknessMm = actualThicknessMm > 0
    ? Math.max(actualThicknessMm - (2 * governingCorrosionRateMmPerYear * intervalYears), 0) : 0;
  const mawpValues = { D, S, W, e };

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    endCondition,
    intervalYears,
    expandedEndThicknessFactorUsedMm: e,
    requiredThicknessMm,
    automaticMinimumThicknessMm,
    minimumThicknessUsedMm,
    longTermCorrosionRateMmPerYear,
    shortTermCorrosionRateMmPerYear,
    governingCorrosionRateMmPerYear,
    corrosionAllowanceMm,
    remainingLifeYears,
    governingMawpMpa: pressureBasisValid ? mawpFromThickness(actualThicknessMm, mawpValues) : 0,
    hydrostaticTestPressureMpa: P > 0 ? 1.5 * P : 0,
    pneumaticTestPressureMpa: P > 0 ? 1.1 * P : 0,
    projectedThicknessMm,
    futureMawpThicknessMm,
    futureMawpMpa: pressureBasisValid ? mawpFromThickness(futureMawpThicknessMm, mawpValues) : 0,
  };
}
