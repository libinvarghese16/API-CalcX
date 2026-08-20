import type {
  Api570PneumaticTestInputSI,
  Api570PneumaticTestResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.pneumatic-test-pressure" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

/** Pure SI extraction of the protected B31.3 345.5.4 Pneumatic Test Pressure Other Piping Calculation. */
export function calculateApi570PneumaticTest(input: Api570PneumaticTestInputSI): Api570PneumaticTestResultSI {
  const issues: CalculationIssue[] = [];
  const designPressureMpaUsed = Number.isFinite(input.designPressureMpa) ? Number(input.designPressureMpa) : 0;

  if (!Number.isFinite(input.designPressureMpa) || input.designPressureMpa <= 0) {
    issues.push({
      code: "positive-value-required",
      field: "designPressureMpa",
      severity: "error",
      message: "Design pressure must be a finite value greater than zero.",
    });
  }

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    designPressureMpaUsed,
    pneumaticTestPressureMpa: designPressureMpaUsed > 0 ? 1.1 * designPressureMpaUsed : 0,
  };
}
