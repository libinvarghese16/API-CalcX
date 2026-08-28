import type {
  Api653BottomPlateField,
  Api653BottomPlateInputSI,
  Api653BottomPlateResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api653.bottom-plate" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function positive(issues: CalculationIssue[], field: Api653BottomPlateField, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
}

function nonNegative(issues: CalculationIssue[], field: Api653BottomPlateField, value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
}

function safe(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

/** API 653 bottom projection: MRT = min(RTbc, RTip) - Or(StPr + UPr). */
export function calculateApi653BottomPlate(input: Api653BottomPlateInputSI): Api653BottomPlateResultSI {
  const issues: CalculationIssue[] = [];
  positive(issues, "originalThicknessMm", input.originalThicknessMm, "Original bottom thickness");
  positive(issues, "previousThicknessMm", input.previousThicknessMm, "Previous bottom remaining thickness");
  positive(issues, "bottomRemainingThicknessMm", input.bottomRemainingThicknessMm, "Current bottom remaining thickness RTbc");
  positive(issues, "previousInternalPittingRemainingThicknessMm", input.previousInternalPittingRemainingThicknessMm, "Previous internal-pitting remaining thickness");
  positive(issues, "internalPittingRemainingThicknessMm", input.internalPittingRemainingThicknessMm, "Current internal-pitting remaining thickness RTip");
  positive(issues, "yearsInService", input.yearsInService, "Years in service");
  positive(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");
  nonNegative(issues, "projectionYears", input.projectionYears, "Projection interval Or");
  positive(issues, "lowerShellMinimumThicknessMm", input.lowerShellMinimumThicknessMm, "Lower shell minimum thickness");
  positive(issues, "criticalZoneActualThicknessMm", input.criticalZoneActualThicknessMm, "Critical-zone actual thickness");

  const originalThicknessMmUsed = safe(input.originalThicknessMm);
  const previousThicknessMmUsed = safe(input.previousThicknessMm);
  const bottomRemainingThicknessMmUsed = safe(input.bottomRemainingThicknessMm);
  const previousInternalPittingRemainingThicknessMmUsed = safe(input.previousInternalPittingRemainingThicknessMm);
  const internalPittingRemainingThicknessMmUsed = safe(input.internalPittingRemainingThicknessMm);
  const yearsInServiceUsed = safe(input.yearsInService);
  const yearsSincePreviousInspectionUsed = safe(input.yearsSincePreviousInspection);
  const projectionYearsUsed = safe(input.projectionYears);

  const undersideLong = yearsInServiceUsed > 0 ? Math.max(originalThicknessMmUsed - bottomRemainingThicknessMmUsed, 0) / yearsInServiceUsed : 0;
  const undersideShort = yearsSincePreviousInspectionUsed > 0 ? Math.max(previousThicknessMmUsed - bottomRemainingThicknessMmUsed, 0) / yearsSincePreviousInspectionUsed : 0;
  const automaticUndersideCorrosionRateMmPerYear = Math.max(undersideLong, undersideShort);
  const automaticTopSideCorrosionRateMmPerYear = yearsSincePreviousInspectionUsed > 0
    ? Math.max(previousInternalPittingRemainingThicknessMmUsed - internalPittingRemainingThicknessMmUsed, 0) / yearsSincePreviousInspectionUsed
    : 0;

  if (input.undersideCorrosionRateMode === "manual") nonNegative(issues, "undersideCorrosionRateMmPerYear", input.manualUndersideCorrosionRateMmPerYear, "Manual underside corrosion rate UPr");
  if (input.topSideCorrosionRateMode === "manual") nonNegative(issues, "topSideCorrosionRateMmPerYear", input.manualTopSideCorrosionRateMmPerYear, "Manual top-side corrosion rate StPr");
  const undersideCorrosionRateMmPerYear = input.undersideCorrosionRateMode === "manual" ? safe(input.manualUndersideCorrosionRateMmPerYear) : automaticUndersideCorrosionRateMmPerYear;
  const topSideCorrosionRateMmPerYear = input.topSideCorrosionRateMode === "manual" ? safe(input.manualTopSideCorrosionRateMmPerYear) : automaticTopSideCorrosionRateMmPerYear;
  const combinedCorrosionRateMmPerYear = undersideCorrosionRateMmPerYear + topSideCorrosionRateMmPerYear;

  let minimumThicknessMmUsed = 0;
  if (input.minimumThicknessBasis === "table-4.4-standard") minimumThicknessMmUsed = 2.54;
  else if (input.minimumThicknessBasis === "table-4.4-reduced") {
    minimumThicknessMmUsed = 1.27;
    if (!input.reducedMinimumCriteriaConfirmed) issues.push({ code: "reduced-bottom-minimum-not-confirmed", field: "minimumThicknessBasis", severity: "error", message: "The 1.27 mm Table 4.4 route requires explicit confirmation that every reduced-minimum condition is satisfied." });
  } else if (input.minimumThicknessBasis === "manual-controlled") {
    positive(issues, "minimumThicknessMm", input.manualMinimumThicknessMm, "Controlled manual minimum thickness");
    minimumThicknessMmUsed = safe(input.manualMinimumThicknessMm);
    issues.push({ code: "manual-minimum-basis", field: "minimumThicknessBasis", severity: "warning", message: "Confirm the manually entered bottom minimum against the controlled API 653 edition and project assessment basis." });
  } else issues.push({ code: "minimum-basis-required", field: "minimumThicknessBasis", severity: "error", message: "Select the applicable API 653 bottom minimum-thickness basis." });

  const governingThicknessMm = Math.min(bottomRemainingThicknessMmUsed, internalPittingRemainingThicknessMmUsed);
  const projectedMinimumRemainingThicknessMm = Math.max(governingThicknessMm - projectionYearsUsed * combinedCorrosionRateMmPerYear, 0);
  const availableThicknessMm = Math.max(governingThicknessMm - minimumThicknessMmUsed, 0);
  const remainingLifeYears = combinedCorrosionRateMmPerYear > 0 ? availableThicknessMm / combinedCorrosionRateMmPerYear : 0;
  const lowerShellMinimumThicknessMmUsed = safe(input.lowerShellMinimumThicknessMm);
  const criticalZoneActualThicknessMmUsed = safe(input.criticalZoneActualThicknessMm);
  const criticalZoneMinimumThicknessMm = Math.max(2.5, Math.min(0.5 * lowerShellMinimumThicknessMmUsed, 3));
  const criticalZoneAdequate = criticalZoneActualThicknessMmUsed >= criticalZoneMinimumThicknessMm;
  if (criticalZoneActualThicknessMmUsed > 0 && !criticalZoneAdequate) issues.push({ code: "critical-zone-below-minimum", field: "criticalZoneActualThicknessMm", severity: "error", message: "Critical-zone actual thickness is below the separately calculated critical-zone minimum." });
  if (projectedMinimumRemainingThicknessMm < minimumThicknessMmUsed) issues.push({ code: "projected-mrt-below-minimum", field: "calculation", severity: "warning", message: "Projected MRT is below the selected minimum at the entered projection interval." });

  return {
    engineId: ENGINE_ID, engineVersion: ENGINE_VERSION, ok: !issues.some((issue) => issue.severity === "error"), issues,
    originalThicknessMmUsed, previousThicknessMmUsed, bottomRemainingThicknessMmUsed,
    previousInternalPittingRemainingThicknessMmUsed, internalPittingRemainingThicknessMmUsed,
    minimumThicknessBasis: input.minimumThicknessBasis, minimumThicknessMmUsed, projectionYearsUsed,
    yearsInServiceUsed, yearsSincePreviousInspectionUsed,
    automaticUndersideCorrosionRateMmPerYear, undersideCorrosionRateMmPerYear,
    automaticTopSideCorrosionRateMmPerYear, topSideCorrosionRateMmPerYear, combinedCorrosionRateMmPerYear,
    projectedMinimumRemainingThicknessMm, lowerShellMinimumThicknessMmUsed, criticalZoneActualThicknessMmUsed,
    criticalZoneMinimumThicknessMm, criticalZoneAdequate,
    maximumCorrosionRateLongMmPerYear: undersideLong,
    maximumCorrosionRateShortMmPerYear: Math.max(undersideShort, automaticTopSideCorrosionRateMmPerYear),
    governingCorrosionRateMmPerYear: combinedCorrosionRateMmPerYear,
    governingThicknessMm, availableThicknessMm, remainingLifeYears,
  };
}
