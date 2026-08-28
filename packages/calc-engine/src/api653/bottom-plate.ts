import type {
  Api653BottomPlateField,
  Api653BottomPlateInputSI,
  Api653BottomPlateResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api653.bottom-plate" as const;
const ENGINE_VERSION = "0.2.0-api653-mrt" as const;

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
  positive(issues, "bottomRemainingThicknessMm", input.bottomRemainingThicknessMm, "Current bottom remaining thickness RTbc");
  positive(issues, "internalPittingRemainingThicknessMm", input.internalPittingRemainingThicknessMm, "Current internal-pitting remaining thickness RTip");
  nonNegative(issues, "projectionYears", input.projectionYears, "Projection interval Or");

  if (!Number.isFinite(input.previousThicknessMm) || input.previousThicknessMm < 0) {
    issues.push({ code: "non-negative-value-required", field: "previousThicknessMm", severity: "error", message: "Previous bottom remaining thickness must be zero when unavailable or a finite positive value." });
  }
  if (!Number.isFinite(input.previousInternalPittingRemainingThicknessMm) || input.previousInternalPittingRemainingThicknessMm < 0) {
    issues.push({ code: "non-negative-value-required", field: "previousInternalPittingRemainingThicknessMm", severity: "error", message: "Previous internal-pitting remaining thickness must be zero when unavailable or a finite positive value." });
  }
  if (!Number.isFinite(input.yearsInService) || input.yearsInService < 0) {
    issues.push({ code: "non-negative-value-required", field: "yearsInService", severity: "error", message: "Years in service must be zero when unavailable or a finite positive value." });
  }
  if (!Number.isFinite(input.yearsSincePreviousInspection) || input.yearsSincePreviousInspection < 0) {
    issues.push({ code: "non-negative-value-required", field: "yearsSincePreviousInspection", severity: "error", message: "Years since previous inspection must be zero when unavailable or a finite positive value." });
  }

  const originalThicknessMmUsed = safe(input.originalThicknessMm);
  const previousThicknessMmUsed = safe(input.previousThicknessMm);
  const bottomRemainingThicknessMmUsed = safe(input.bottomRemainingThicknessMm);
  const previousInternalPittingRemainingThicknessMmUsed = safe(input.previousInternalPittingRemainingThicknessMm);
  const internalPittingRemainingThicknessMmUsed = safe(input.internalPittingRemainingThicknessMm);
  const yearsInServiceUsed = safe(input.yearsInService);
  const yearsSincePreviousInspectionUsed = safe(input.yearsSincePreviousInspection);
  const projectionYearsUsed = safe(input.projectionYears);

  const undersideLongBasisAvailable = originalThicknessMmUsed > 0 && bottomRemainingThicknessMmUsed > 0 && yearsInServiceUsed > 0;
  const undersideShortBasisAvailable = previousThicknessMmUsed > 0 && bottomRemainingThicknessMmUsed > 0 && yearsSincePreviousInspectionUsed > 0;
  const topSideLongBasisAvailable = originalThicknessMmUsed > 0 && internalPittingRemainingThicknessMmUsed > 0 && yearsInServiceUsed > 0;
  const topSideShortBasisAvailable = previousInternalPittingRemainingThicknessMmUsed > 0 && internalPittingRemainingThicknessMmUsed > 0 && yearsSincePreviousInspectionUsed > 0;

  const undersideLongTermCorrosionRateMmPerYear = undersideLongBasisAvailable
    ? Math.max(originalThicknessMmUsed - bottomRemainingThicknessMmUsed, 0) / yearsInServiceUsed : 0;
  const undersideShortTermCorrosionRateMmPerYear = undersideShortBasisAvailable
    ? Math.max(previousThicknessMmUsed - bottomRemainingThicknessMmUsed, 0) / yearsSincePreviousInspectionUsed : 0;
  const topSideLongTermCorrosionRateMmPerYear = topSideLongBasisAvailable
    ? Math.max(originalThicknessMmUsed - internalPittingRemainingThicknessMmUsed, 0) / yearsInServiceUsed : 0;
  const topSideShortTermCorrosionRateMmPerYear = topSideShortBasisAvailable
    ? Math.max(previousInternalPittingRemainingThicknessMmUsed - internalPittingRemainingThicknessMmUsed, 0) / yearsSincePreviousInspectionUsed : 0;
  const automaticUndersideCorrosionRateMmPerYear = Math.max(undersideLongTermCorrosionRateMmPerYear, undersideShortTermCorrosionRateMmPerYear);
  const automaticTopSideCorrosionRateMmPerYear = Math.max(topSideLongTermCorrosionRateMmPerYear, topSideShortTermCorrosionRateMmPerYear);

  if (input.undersideCorrosionRateMode === "auto" && !undersideLongBasisAvailable && !undersideShortBasisAvailable) {
    issues.push({ code: "underside-rate-basis-required", field: "undersideCorrosionRateMmPerYear", severity: "error", message: "Automatic UPr needs a valid long-term or comparable previous-inspection bottom-thickness basis. Enter the missing history or use a controlled manual UPr." });
  }
  if (input.topSideCorrosionRateMode === "auto" && !topSideLongBasisAvailable && !topSideShortBasisAvailable) {
    issues.push({ code: "top-side-rate-basis-required", field: "topSideCorrosionRateMmPerYear", severity: "error", message: "Automatic StPr needs a valid long-term or comparable previous-inspection RTip basis. Enter the missing history or use a controlled manual StPr." });
  }
  if (input.topSideCorrosionRateMode === "auto" && topSideLongBasisAvailable && !topSideShortBasisAvailable) {
    issues.push({ code: "top-side-short-term-basis-unavailable", field: "previousInternalPittingRemainingThicknessMm", severity: "warning", message: "StPr uses the long-term RTip route only because comparable previous internal-pitting thickness is unavailable; no short-term rate was manufactured." });
  }

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

  const manualUndersideValid = input.undersideCorrosionRateMode !== "manual" || Number.isFinite(input.manualUndersideCorrosionRateMmPerYear) && input.manualUndersideCorrosionRateMmPerYear >= 0;
  const manualTopSideValid = input.topSideCorrosionRateMode !== "manual" || Number.isFinite(input.manualTopSideCorrosionRateMmPerYear) && input.manualTopSideCorrosionRateMmPerYear >= 0;
  const minimumBasisReady = minimumThicknessMmUsed > 0
    && (input.minimumThicknessBasis !== "table-4.4-reduced" || input.reducedMinimumCriteriaConfirmed);
  const undersideRateReady = input.undersideCorrosionRateMode === "manual" ? manualUndersideValid : undersideLongBasisAvailable || undersideShortBasisAvailable;
  const topSideRateReady = input.topSideCorrosionRateMode === "manual" ? manualTopSideValid : topSideLongBasisAvailable || topSideShortBasisAvailable;
  const generalBottomAssessmentReady = originalThicknessMmUsed > 0
    && bottomRemainingThicknessMmUsed > 0
    && internalPittingRemainingThicknessMmUsed > 0
    && Number.isFinite(input.projectionYears) && input.projectionYears >= 0
    && minimumBasisReady && undersideRateReady && topSideRateReady;

  const governingThicknessMm = generalBottomAssessmentReady ? Math.min(bottomRemainingThicknessMmUsed, internalPittingRemainingThicknessMmUsed) : 0;
  const projectedMinimumRemainingThicknessMm = generalBottomAssessmentReady
    ? governingThicknessMm - projectionYearsUsed * combinedCorrosionRateMmPerYear : 0;
  const availableThicknessMm = generalBottomAssessmentReady ? Math.max(governingThicknessMm - minimumThicknessMmUsed, 0) : 0;
  const remainingLifeOpenEnded = generalBottomAssessmentReady && availableThicknessMm > 0 && combinedCorrosionRateMmPerYear === 0;
  const remainingLifeYears = !generalBottomAssessmentReady || availableThicknessMm <= 0
    ? 0 : remainingLifeOpenEnded ? Number.POSITIVE_INFINITY : availableThicknessMm / combinedCorrosionRateMmPerYear;
  const projectedMrtAdequate = generalBottomAssessmentReady && projectedMinimumRemainingThicknessMm >= minimumThicknessMmUsed;

  const lowerShellMinimumThicknessMmUsed = safe(input.lowerShellMinimumThicknessMm);
  const criticalZoneActualThicknessMmUsed = safe(input.criticalZoneActualThicknessMm);
  const lowerShellProvided = Number.isFinite(input.lowerShellMinimumThicknessMm) && input.lowerShellMinimumThicknessMm > 0;
  const criticalZoneActualProvided = Number.isFinite(input.criticalZoneActualThicknessMm) && input.criticalZoneActualThicknessMm > 0;
  const criticalZoneAssessmentComplete = lowerShellProvided && criticalZoneActualProvided;
  const criticalZoneMinimumThicknessMm = criticalZoneAssessmentComplete
    ? Math.max(2.5, Math.min(0.5 * lowerShellMinimumThicknessMmUsed, 3)) : 0;
  const criticalZoneAdequate = criticalZoneAssessmentComplete && criticalZoneActualThicknessMmUsed >= criticalZoneMinimumThicknessMm;
  if (!criticalZoneAssessmentComplete) {
    issues.push({ code: "critical-zone-assessment-incomplete", field: "criticalZoneActualThicknessMm", severity: "warning", message: "General bottom MRT is calculated separately, but the critical-zone assessment needs both the lower-shell required thickness and the measured critical-zone thickness." });
  } else if (!criticalZoneAdequate) {
    issues.push({ code: "critical-zone-below-minimum", field: "criticalZoneActualThicknessMm", severity: "error", message: "Critical-zone measured thickness is below max(2.5 mm, min(3.0 mm, 50% of lower-shell tmin))." });
  }
  if (generalBottomAssessmentReady && !projectedMrtAdequate) issues.push({ code: "projected-mrt-below-minimum", field: "calculation", severity: "warning", message: "Projected MRT is below the selected bottom minimum at the entered operating interval Or." });

  return {
    engineId: ENGINE_ID, engineVersion: ENGINE_VERSION, ok: !issues.some((issue) => issue.severity === "error"), issues,
    generalBottomAssessmentReady,
    originalThicknessMmUsed, previousThicknessMmUsed, bottomRemainingThicknessMmUsed,
    previousInternalPittingRemainingThicknessMmUsed, internalPittingRemainingThicknessMmUsed,
    minimumThicknessBasis: input.minimumThicknessBasis, minimumThicknessMmUsed, projectionYearsUsed,
    yearsInServiceUsed, yearsSincePreviousInspectionUsed,
    undersideLongTermCorrosionRateMmPerYear, undersideShortTermCorrosionRateMmPerYear,
    automaticUndersideCorrosionRateMmPerYear, undersideCorrosionRateMmPerYear,
    topSideLongTermCorrosionRateMmPerYear, topSideShortTermCorrosionRateMmPerYear,
    automaticTopSideCorrosionRateMmPerYear, topSideCorrosionRateMmPerYear, combinedCorrosionRateMmPerYear,
    projectedMinimumRemainingThicknessMm, projectedMrtAdequate,
    lowerShellMinimumThicknessMmUsed, criticalZoneActualThicknessMmUsed,
    criticalZoneAssessmentComplete, criticalZoneMinimumThicknessMm, criticalZoneAdequate,
    maximumCorrosionRateLongMmPerYear: Math.max(undersideLongTermCorrosionRateMmPerYear, topSideLongTermCorrosionRateMmPerYear),
    maximumCorrosionRateShortMmPerYear: Math.max(undersideShortTermCorrosionRateMmPerYear, topSideShortTermCorrosionRateMmPerYear),
    governingCorrosionRateMmPerYear: combinedCorrosionRateMmPerYear,
    governingThicknessMm, availableThicknessMm, remainingLifeYears, remainingLifeOpenEnded,
  };
}
