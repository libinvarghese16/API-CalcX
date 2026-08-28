import type {
  Api570PressureDesignField,
  Api570PressureDesignInputSI,
  Api570PressureDesignResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.pressure-design" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addPositiveIssue(
  issues: CalculationIssue[],
  field: Api570PressureDesignField,
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({
      code: "positive-value-required",
      field,
      severity: "error",
      message: `${label} must be a finite value greater than zero.`,
    });
  }
}

/** Pure SI extraction of the protected API 574 11.1.2 Barlow Other Piping Calculation. */
export function calculateApi570PressureDesign(input: Api570PressureDesignInputSI): Api570PressureDesignResultSI {
  const issues: CalculationIssue[] = [];
  issues.push({ code: "barlow-screening-only", field: "calculation", severity: "warning", message: "Barlow thickness is a hoop-stress utility only; it is not a complete API 570 or construction-code minimum-thickness assessment." });
  addPositiveIssue(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");
  addPositiveIssue(issues, "outsideDiameterMm", input.outsideDiameterMm, "Outside diameter");
  addPositiveIssue(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");

  const rawQualityFactor = finiteOrZero(input.qualityFactor);
  const qualityFactorUsed = rawQualityFactor > 0 ? rawQualityFactor : 1;
  if (input.qualityFactor !== undefined && rawQualityFactor <= 0) {
    issues.push({
      code: "quality-factor-defaulted",
      field: "qualityFactor",
      severity: "warning",
      message: "The protected calculator defaults a blank or non-positive quality factor to E = 1.00.",
    });
  }

  const availableThickness = finiteOrZero(input.availableCorrodedThicknessMm);
  if (availableThickness < 0) {
    issues.push({
      code: "non-negative-value-required",
      field: "availableCorrodedThicknessMm",
      severity: "error",
      message: "Available corroded thickness must be a finite value of zero or greater.",
    });
  }

  const pressureBasisValid = !issues.some((issue) => issue.severity === "error" && [
    "designPressureMpa",
    "outsideDiameterMm",
    "allowableStressMpa",
  ].includes(issue.field));
  const P = finiteOrZero(input.designPressureMpa);
  const D = finiteOrZero(input.outsideDiameterMm);
  const S = finiteOrZero(input.allowableStressMpa);
  const t = Math.max(availableThickness, 0);

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    qualityFactorUsed,
    requiredThicknessMm: pressureBasisValid ? (P * D) / (2 * S * qualityFactorUsed) : 0,
    allowableWorkingPressureMpa: pressureBasisValid && t > 0 ? (2 * S * qualityFactorUsed * t) / D : 0,
  };
}
