import type {
  Api653Other432CheckStatus,
  Api653Other432Field,
  Api653Other432InputSI,
  Api653Other432PitStatus,
  Api653Other432ResultSI,
  Api653Other432ValueMode,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api653.other-4-3-2" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function positiveIssue(issues: CalculationIssue[], field: Api653Other432Field, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function nonNegativeIssue(issues: CalculationIssue[], field: Api653Other432Field, value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

function safeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function validMode(mode: Api653Other432ValueMode): boolean {
  return mode === "auto" || mode === "manual";
}

function selectedValue(mode: Api653Other432ValueMode, automaticValue: number, manualValue: number): number {
  return mode === "manual" ? safeNonNegative(manualValue) : automaticValue;
}

/** Pure SI extraction of the protected original website's API 653 4.3.2 local-thin-area screening. */
export function calculateApi653Other432(input: Api653Other432InputSI): Api653Other432ResultSI {
  const issues: CalculationIssue[] = [];
  positiveIssue(issues, "diameterM", input.diameterM, "Tank diameter");
  positiveIssue(issues, "leastThicknessMm", input.leastThicknessMm, "Least thickness in the area");
  positiveIssue(issues, "minimumRequiredThicknessMm", input.minimumRequiredThicknessMm, "Minimum required thickness");
  nonNegativeIssue(issues, "corrosionAllowanceMm", input.corrosionAllowanceMm, "Corrosion allowance");

  const profileThicknessesMmUsed = input.profileThicknessesMm.slice(0, 5).map(safeNonNegative);
  const hasAllProfilePoints = input.profileThicknessesMm.length === 5
    && input.profileThicknessesMm.every((value) => Number.isFinite(value) && value > 0);
  if (!hasAllProfilePoints) {
    issues.push({ code: "five-profile-points-required", field: "profileThicknessesMm", severity: "error", message: "Enter exactly five finite profile thickness readings greater than zero." });
  }

  if (input.deepestPitRemainingThicknessMm !== null) {
    nonNegativeIssue(issues, "deepestPitRemainingThicknessMm", input.deepestPitRemainingThicknessMm, "Deepest pit remaining thickness");
  }
  if (input.pitDimensionSumMm !== null) {
    nonNegativeIssue(issues, "pitDimensionSumMm", input.pitDimensionSumMm, "Pit dimension sum");
  }

  const modes: Array<[Api653Other432Field, Api653Other432ValueMode, number, string]> = [
    ["criticalLengthMode", input.criticalLengthMode, input.manualCriticalLengthMm, "Critical length"],
    ["averageThicknessMode", input.averageThicknessMode, input.manualAverageThicknessMm, "Average thickness"],
    ["adjustedMinimumMode", input.adjustedMinimumMode, input.manualAdjustedMinimumMm, "Adjusted minimum thickness"],
    ["adjustedSixtyPercentMode", input.adjustedSixtyPercentMode, input.manualAdjustedSixtyPercentMm, "Adjusted 60% minimum thickness"],
  ];
  for (const [field, mode, manualValue, label] of modes) {
    if (!validMode(mode)) {
      issues.push({ code: "value-mode-invalid", field, severity: "error", message: `${label} mode must be auto or manual.` });
    } else if (mode === "manual") {
      positiveIssue(issues, field === "criticalLengthMode" ? "manualCriticalLengthMm" : field === "averageThicknessMode" ? "manualAverageThicknessMm" : field === "adjustedMinimumMode" ? "manualAdjustedMinimumMm" : "manualAdjustedSixtyPercentMm", manualValue, `Manual ${label.toLowerCase()}`);
    }
  }

  const diameterMUsed = safeNonNegative(input.diameterM);
  const leastThicknessMmUsed = safeNonNegative(input.leastThicknessMm);
  const minimumRequiredThicknessMmUsed = safeNonNegative(input.minimumRequiredThicknessMm);
  const corrosionAllowanceMmUsed = safeNonNegative(input.corrosionAllowanceMm);
  const deepestPitRemainingThicknessMmUsed = input.deepestPitRemainingThicknessMm === null ? null : safeNonNegative(input.deepestPitRemainingThicknessMm);
  const pitDimensionSumMmUsed = input.pitDimensionSumMm === null ? null : safeNonNegative(input.pitDimensionSumMm);

  const automaticCriticalLengthRawMm = diameterMUsed > 0 && leastThicknessMmUsed > 0
    ? 34 * Math.sqrt(diameterMUsed * leastThicknessMmUsed)
    : 0;
  const automaticCriticalLengthMm = Math.min(automaticCriticalLengthRawMm, 1000);
  const automaticAverageThicknessMm = hasAllProfilePoints
    ? profileThicknessesMmUsed.reduce((sum, value) => sum + value, 0) / 5
    : 0;
  const automaticAdjustedMinimumMm = minimumRequiredThicknessMmUsed > 0
    ? minimumRequiredThicknessMmUsed + corrosionAllowanceMmUsed
    : 0;
  const automaticAdjustedSixtyPercentMm = minimumRequiredThicknessMmUsed > 0
    ? (0.6 * minimumRequiredThicknessMmUsed) + corrosionAllowanceMmUsed
    : 0;

  const criticalLengthMmUsed = selectedValue(input.criticalLengthMode, automaticCriticalLengthMm, input.manualCriticalLengthMm);
  const averageThicknessMmUsed = selectedValue(input.averageThicknessMode, automaticAverageThicknessMm, input.manualAverageThicknessMm);
  const adjustedMinimumMmUsed = selectedValue(input.adjustedMinimumMode, automaticAdjustedMinimumMm, input.manualAdjustedMinimumMm);
  const adjustedSixtyPercentMmUsed = selectedValue(input.adjustedSixtyPercentMode, automaticAdjustedSixtyPercentMm, input.manualAdjustedSixtyPercentMm);

  const check1Ready = averageThicknessMmUsed > 0 && adjustedMinimumMmUsed > 0
    && (input.averageThicknessMode === "manual" || hasAllProfilePoints);
  const check2Ready = leastThicknessMmUsed > 0 && adjustedSixtyPercentMmUsed > 0;
  const check1Status: Api653Other432CheckStatus = !check1Ready ? "pending" : averageThicknessMmUsed >= adjustedMinimumMmUsed ? "pass" : "fail";
  const check2Status: Api653Other432CheckStatus = !check2Ready ? "pending" : leastThicknessMmUsed >= adjustedSixtyPercentMmUsed ? "pass" : "fail";

  const pitCheckAReady = deepestPitRemainingThicknessMmUsed !== null && minimumRequiredThicknessMmUsed > 0;
  const pitCheckAPass = pitCheckAReady && deepestPitRemainingThicknessMmUsed >= (0.5 * minimumRequiredThicknessMmUsed);
  const pitCheckBReady = pitDimensionSumMmUsed !== null;
  const pitCheckBPass = pitCheckBReady && pitDimensionSumMmUsed <= 50;
  const pitChecksEvaluated = pitCheckAReady && pitCheckBReady;
  let pitStatus: Api653Other432PitStatus = "optional";
  if (pitChecksEvaluated) pitStatus = pitCheckAPass && pitCheckBPass ? "pass" : "fail";
  else if (deepestPitRemainingThicknessMmUsed !== null || pitDimensionSumMmUsed !== null) pitStatus = "pending";

  if (pitStatus === "pending") {
    issues.push({ code: "pit-screen-incomplete", field: "calculation", severity: "warning", message: "Enter tmin and both optional pit values to complete the pit screen." });
  }

  let overallStatus: Api653Other432CheckStatus = "pending";
  if (check1Status !== "pending" && check2Status !== "pending") {
    overallStatus = check1Status === "fail" || check2Status === "fail" || pitStatus === "fail" ? "fail" : "pass";
  }

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((entry) => entry.severity === "error"),
    issues,
    diameterMUsed,
    leastThicknessMmUsed,
    minimumRequiredThicknessMmUsed,
    corrosionAllowanceMmUsed,
    profileThicknessesMmUsed,
    hasAllProfilePoints,
    deepestPitRemainingThicknessMmUsed,
    pitDimensionSumMmUsed,
    automaticCriticalLengthRawMm,
    automaticCriticalLengthMm,
    criticalLengthMode: input.criticalLengthMode,
    criticalLengthMmUsed,
    criticalLengthCapApplied: automaticCriticalLengthRawMm > 1000,
    automaticAverageThicknessMm,
    averageThicknessMode: input.averageThicknessMode,
    averageThicknessMmUsed,
    automaticAdjustedMinimumMm,
    adjustedMinimumMode: input.adjustedMinimumMode,
    adjustedMinimumMmUsed,
    automaticAdjustedSixtyPercentMm,
    adjustedSixtyPercentMode: input.adjustedSixtyPercentMode,
    adjustedSixtyPercentMmUsed,
    check1Status,
    check2Status,
    pitCheckAReady,
    pitCheckAPass,
    pitCheckBReady,
    pitCheckBPass,
    pitStatus,
    overallStatus,
  };
}
