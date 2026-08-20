import type {
  Api570HydroTestField,
  Api570HydroTestInputSI,
  Api570HydroTestResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.hydro-test-pressure" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;
const MAX_STRESS_RATIO = 6.5;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addPositiveIssue(
  issues: CalculationIssue[],
  field: Api570HydroTestField,
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

/** Pure SI extraction of the protected B31.3 345.4.2 Hydro Test Pressure Other Piping Calculation. */
export function calculateApi570HydroTest(input: Api570HydroTestInputSI): Api570HydroTestResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveIssue(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");

  const P = finiteOrZero(input.designPressureMpa);
  const S = finiteOrZero(input.allowableStressDesignMpa);
  const ST = finiteOrZero(input.allowableStressTestMpa);
  const manual = finiteOrZero(input.manualStressRatio);
  const calculatedStressRatio = S > 0 && ST > 0 ? ST / S : 0;
  const hasManual = manual > 0;
  const rawStressRatio = hasManual ? manual : (calculatedStressRatio > 0 ? calculatedStressRatio : 1);
  const stressRatioUsed = Math.min(Math.max(rawStressRatio, 0), MAX_STRESS_RATIO);
  const stressRatioSource = hasManual ? "manual" : (calculatedStressRatio > 0 ? "stress-ratio" : "default");

  if (input.manualStressRatio !== undefined && manual <= 0) {
    issues.push({
      code: "manual-ratio-ignored",
      field: "manualStressRatio",
      severity: "warning",
      message: "The protected calculator ignores a non-positive manual Rr and uses ST / S or the default Rr = 1.00.",
    });
  }
  if (rawStressRatio > MAX_STRESS_RATIO) {
    issues.push({
      code: "stress-ratio-capped",
      field: hasManual ? "manualStressRatio" : "calculation",
      severity: "warning",
      message: "The protected calculator caps Rr at 6.50.",
    });
  }
  if (!hasManual && calculatedStressRatio <= 0) {
    issues.push({
      code: "stress-ratio-defaulted",
      field: "calculation",
      severity: "warning",
      message: "S and ST are optional; without both positive values, the protected calculator uses Rr = 1.00.",
    });
  }

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    calculatedStressRatio,
    stressRatioUsed,
    stressRatioSource,
    minimumHydroTestPressureMpa: P > 0 ? 1.5 * P * stressRatioUsed : 0,
  };
}
