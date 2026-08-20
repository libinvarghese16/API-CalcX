import type {
  Api653BottomPlateField,
  Api653BottomPlateInputSI,
  Api653BottomPlateResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api653.bottom-plate" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function addPositiveIssue(issues: CalculationIssue[], field: Api653BottomPlateField, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function addNonNegativeIssue(issues: CalculationIssue[], field: Api653BottomPlateField, value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

/** Pure SI extraction of the protected original website's API 653 Bottom Plate Remaining Life calculator. */
export function calculateApi653BottomPlate(input: Api653BottomPlateInputSI): Api653BottomPlateResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveIssue(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  addNonNegativeIssue(issues, "previousThicknessMm", input.previousThicknessMm, "Previous measured thickness");
  addPositiveIssue(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  addNonNegativeIssue(issues, "minimumThicknessMm", input.minimumThicknessMm, "Minimum required thickness");
  addNonNegativeIssue(issues, "pittingDepthMm", input.pittingDepthMm, "Pitting depth");
  addNonNegativeIssue(issues, "yearsInService", input.yearsInService, "Years in service");
  addNonNegativeIssue(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");

  if (!(input.yearsInService > 0 || input.yearsSincePreviousInspection > 0)) {
    issues.push({ code: "corrosion-rate-period-required", field: "calculation", severity: "error", message: "Years in service or years since previous inspection must be greater than zero." });
  }

  const originalThicknessMmUsed = finiteNonNegative(input.originalThicknessMm);
  const previousThicknessMmUsed = finiteNonNegative(input.previousThicknessMm);
  const actualThicknessMmUsed = finiteNonNegative(input.actualThicknessMm);
  const minimumThicknessMmUsed = finiteNonNegative(input.minimumThicknessMm);
  const pittingDepthMmUsed = finiteNonNegative(input.pittingDepthMm);
  const yearsInServiceUsed = finiteNonNegative(input.yearsInService);
  const yearsSincePreviousInspectionUsed = finiteNonNegative(input.yearsSincePreviousInspection);
  const hasRequiredBasis = originalThicknessMmUsed > 0
    && actualThicknessMmUsed > 0
    && (yearsInServiceUsed > 0 || yearsSincePreviousInspectionUsed > 0);

  const bottomSideMetalLossMm = hasRequiredBasis ? Math.max(originalThicknessMmUsed - actualThicknessMmUsed, 0) : 0;
  const bottomSideMetalLossShortMm = hasRequiredBasis ? Math.max(previousThicknessMmUsed - actualThicknessMmUsed, 0) : 0;
  const topSideThicknessRemainingMm = hasRequiredBasis ? Math.max(originalThicknessMmUsed - pittingDepthMmUsed, 0) : 0;
  const bottomSideCorrosionRateLongMmPerYear = hasRequiredBasis && yearsInServiceUsed > 0
    ? bottomSideMetalLossMm / yearsInServiceUsed : 0;
  const bottomSideCorrosionRateShortMmPerYear = hasRequiredBasis && yearsSincePreviousInspectionUsed > 0
    ? bottomSideMetalLossShortMm / yearsSincePreviousInspectionUsed : 0;
  const topSideCorrosionRateLongMmPerYear = hasRequiredBasis && yearsInServiceUsed > 0
    ? pittingDepthMmUsed / yearsInServiceUsed : 0;
  const topSideCorrosionRateShortMmPerYear = hasRequiredBasis && yearsSincePreviousInspectionUsed > 0
    ? pittingDepthMmUsed / yearsSincePreviousInspectionUsed : 0;
  const maximumCorrosionRateLongMmPerYear = Math.max(bottomSideCorrosionRateLongMmPerYear, topSideCorrosionRateLongMmPerYear);
  const maximumCorrosionRateShortMmPerYear = Math.max(bottomSideCorrosionRateShortMmPerYear, topSideCorrosionRateShortMmPerYear);
  const governingCorrosionRateMmPerYear = Math.max(maximumCorrosionRateLongMmPerYear, maximumCorrosionRateShortMmPerYear);
  const governingThicknessMm = hasRequiredBasis ? Math.min(actualThicknessMmUsed, topSideThicknessRemainingMm) : 0;
  const availableThicknessMm = Math.max(governingThicknessMm - minimumThicknessMmUsed, 0);
  const remainingLifeYears = governingCorrosionRateMmPerYear > 0 ? availableThicknessMm / governingCorrosionRateMmPerYear : 0;

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    originalThicknessMmUsed,
    previousThicknessMmUsed,
    actualThicknessMmUsed,
    minimumThicknessMmUsed,
    pittingDepthMmUsed,
    yearsInServiceUsed,
    yearsSincePreviousInspectionUsed,
    bottomSideMetalLossMm,
    bottomSideMetalLossShortMm,
    topSideThicknessRemainingMm,
    bottomSideCorrosionRateLongMmPerYear,
    bottomSideCorrosionRateShortMmPerYear,
    topSideCorrosionRateLongMmPerYear,
    topSideCorrosionRateShortMmPerYear,
    maximumCorrosionRateLongMmPerYear,
    maximumCorrosionRateShortMmPerYear,
    governingCorrosionRateMmPerYear,
    governingThicknessMm,
    availableThicknessMm,
    remainingLifeYears,
  };
}
