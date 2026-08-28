import type {
  Api570PneumaticTestInputSI,
  Api570PneumaticTestResultSI,
  Api570PneumaticTestCode,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.pneumatic-test-pressure" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

const CODE_LABELS: Record<Api570PneumaticTestCode, string> = {
  "asme-b31.3": "ASME B31.3 pneumatic test",
  "asme-b31.1": "ASME B31.1 pneumatic test",
  "manual-controlled": "Controlled project test factor",
};

/** Code-routed pneumatic test pressure calculation. Component limits and the approved test procedure still govern. */
export function calculateApi570PneumaticTest(input: Api570PneumaticTestInputSI): Api570PneumaticTestResultSI {
  const issues: CalculationIssue[] = [];
  const designPressureMpaUsed = Number.isFinite(input.designPressureMpa) ? Number(input.designPressureMpa) : 0;
  const codeValid = Object.hasOwn(CODE_LABELS, input.pipingCode);

  if (!Number.isFinite(input.designPressureMpa) || input.designPressureMpa <= 0) {
    issues.push({
      code: "positive-value-required",
      field: "designPressureMpa",
      severity: "error",
      message: "Design pressure must be a finite value greater than zero.",
    });
  }

  if (!codeValid) {
    issues.push({ code: "unsupported-piping-code", field: "pipingCode", severity: "error", message: "Select a supported pneumatic-test code basis." });
  }

  const enteredFactor = Number.isFinite(input.testFactor) ? Number(input.testFactor) : 0;
  let testFactorUsed = 0;
  let minimumFactor = 0;
  let maximumFactor = 0;
  if (input.pipingCode === "asme-b31.3") {
    testFactorUsed = 1.1;
    minimumFactor = 1.1;
    maximumFactor = 1.1;
  } else if (input.pipingCode === "asme-b31.1") {
    minimumFactor = 1.2;
    maximumFactor = 1.5;
    testFactorUsed = enteredFactor || minimumFactor;
    if (testFactorUsed < minimumFactor || testFactorUsed > maximumFactor) {
      issues.push({ code: "b31.1-test-factor-out-of-range", field: "testFactor", severity: "error", message: "ASME B31.1 pneumatic test factor must be between 1.20 and 1.50; component limits may further restrict the permitted pressure." });
    }
  } else if (input.pipingCode === "manual-controlled") {
    testFactorUsed = enteredFactor;
    minimumFactor = enteredFactor;
    maximumFactor = enteredFactor;
    if (!(enteredFactor > 0)) {
      issues.push({ code: "positive-value-required", field: "testFactor", severity: "error", message: "The controlled project test factor must be greater than zero." });
    } else {
      issues.push({ code: "manual-code-basis", field: "testFactor", severity: "warning", message: "Confirm the manually entered factor against the controlled construction code, edition, component limits, and approved test procedure." });
    }
  }

  const pressureBasisValid = designPressureMpaUsed > 0 && codeValid && testFactorUsed > 0
    && !issues.some((issue) => issue.severity === "error");

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    pipingCode: input.pipingCode,
    codeLabel: CODE_LABELS[input.pipingCode] ?? "Unsupported code basis",
    designPressureMpaUsed,
    testFactorUsed,
    minimumPneumaticTestPressureMpa: pressureBasisValid ? minimumFactor * designPressureMpaUsed : 0,
    maximumPneumaticTestPressureMpa: pressureBasisValid ? maximumFactor * designPressureMpaUsed : 0,
    pneumaticTestPressureMpa: pressureBasisValid ? testFactorUsed * designPressureMpaUsed : 0,
  };
}
