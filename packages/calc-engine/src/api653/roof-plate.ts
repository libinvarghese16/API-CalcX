import type {
  Api653RoofPlateField,
  Api653RoofPlateInputSI,
  Api653RoofPlateResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api653.roof-plate" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function positiveIssue(issues: CalculationIssue[], field: Api653RoofPlateField, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function nonNegativeIssue(issues: CalculationIssue[], field: Api653RoofPlateField, value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

/** Pure SI extraction of the protected original website's API 653 Roof Plate Remaining Life calculator. */
export function calculateApi653RoofPlate(input: Api653RoofPlateInputSI): Api653RoofPlateResultSI {
  const issues: CalculationIssue[] = [];
  nonNegativeIssue(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  nonNegativeIssue(issues, "previousThicknessMm", input.previousThicknessMm, "Previous measured thickness");
  positiveIssue(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  if (input.minimumThicknessBasis === "manual-controlled") positiveIssue(issues, "minimumThicknessMm", input.minimumThicknessMm, "Controlled minimum required thickness");
  if (input.minimumThicknessBasis === "api653-2.2mm-area-average") {
    if (!input.areaAverageConfirmed) issues.push({ code: "roof-area-average-not-confirmed", field: "areaAverageConfirmed", severity: "error", message: "Confirm the reported thickness is the average over a 250 mm by 250 mm roof area before applying the 2.2 mm criterion." });
    if (input.roofType !== "supported-cone") issues.push({ code: "roof-type-requires-controlled-basis", field: "roofType", severity: "error", message: "Self-supporting or other roof types require a controlled structural minimum-thickness basis; the 2.2 mm area-average route alone is insufficient." });
  }
  if (input.holesPresent) issues.push({ code: "roof-holes-present", field: "holesPresent", severity: "error", message: "Roof holes are present; remaining-life arithmetic alone cannot establish acceptability and a repair/engineering assessment is required." });
  nonNegativeIssue(issues, "yearsInService", input.yearsInService, "Years in service");
  nonNegativeIssue(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");

  const originalThicknessMmUsed = finiteNonNegative(input.originalThicknessMm);
  const previousThicknessMmUsed = finiteNonNegative(input.previousThicknessMm);
  const actualThicknessMmUsed = finiteNonNegative(input.actualThicknessMm);
  const minimumThicknessMmUsed = input.minimumThicknessBasis === "api653-2.2mm-area-average" ? 2.2 : finiteNonNegative(input.minimumThicknessMm);
  const yearsInServiceUsed = finiteNonNegative(input.yearsInService);
  const yearsSincePreviousInspectionUsed = finiteNonNegative(input.yearsSincePreviousInspection);
  const longRouteAvailable = yearsInServiceUsed > 0 && originalThicknessMmUsed > 0 && actualThicknessMmUsed > 0;
  const shortRouteAvailable = yearsSincePreviousInspectionUsed > 0 && previousThicknessMmUsed > 0 && actualThicknessMmUsed > 0;
  if (!longRouteAvailable && !shortRouteAvailable) {
    issues.push({ code: "corrosion-rate-basis-required", field: "calculation", severity: "error", message: "Enter a valid long-term or previous-inspection thickness and time basis." });
  }

  const longTermMetalLossMm = longRouteAvailable ? Math.max(originalThicknessMmUsed - actualThicknessMmUsed, 0) : 0;
  const thicknessLossSincePreviousMm = shortRouteAvailable ? Math.max(previousThicknessMmUsed - actualThicknessMmUsed, 0) : 0;
  const corrosionAllowanceMm = actualThicknessMmUsed > 0 && minimumThicknessMmUsed > 0 ? actualThicknessMmUsed - minimumThicknessMmUsed : 0;
  const longTermCorrosionRateMmPerYear = longRouteAvailable ? longTermMetalLossMm / yearsInServiceUsed : 0;
  const shortTermCorrosionRateMmPerYear = shortRouteAvailable ? thicknessLossSincePreviousMm / yearsSincePreviousInspectionUsed : 0;
  const governingCorrosionRateMmPerYear = Math.max(longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear);
  const remainingLifeYears = corrosionAllowanceMm > 0 && governingCorrosionRateMmPerYear > 0 ? corrosionAllowanceMm / governingCorrosionRateMmPerYear : 0;
  const remainingLifeOpenEnded = corrosionAllowanceMm > 0
    && governingCorrosionRateMmPerYear === 0
    && actualThicknessMmUsed > minimumThicknessMmUsed;
  const remainingLifeOver99Years = !remainingLifeOpenEnded && remainingLifeYears > 99;
  const belowProtectedAlertThreshold = remainingLifeYears < 11
    && (remainingLifeYears > 0 || governingCorrosionRateMmPerYear > 0)
    && !remainingLifeOpenEnded;

  if (actualThicknessMmUsed > 0 && minimumThicknessMmUsed > 0 && corrosionAllowanceMm <= 0) {
    issues.push({ code: "minimum-thickness-reached", field: "actualThicknessMm", severity: "warning", message: "Actual roof thickness is at or below the entered minimum required thickness." });
  }

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((entry) => entry.severity === "error"),
    issues,
    roofType: input.roofType,
    minimumThicknessBasis: input.minimumThicknessBasis,
    areaAverageConfirmed: input.areaAverageConfirmed,
    holesPresent: input.holesPresent,
    originalThicknessMmUsed,
    previousThicknessMmUsed,
    actualThicknessMmUsed,
    minimumThicknessMmUsed,
    yearsInServiceUsed,
    yearsSincePreviousInspectionUsed,
    longTermMetalLossMm,
    thicknessLossSincePreviousMm,
    corrosionAllowanceMm,
    longTermCorrosionRateMmPerYear,
    shortTermCorrosionRateMmPerYear,
    governingCorrosionRateMmPerYear,
    remainingLifeYears,
    remainingLifeOpenEnded,
    remainingLifeOver99Years,
    belowProtectedAlertThreshold,
  };
}
