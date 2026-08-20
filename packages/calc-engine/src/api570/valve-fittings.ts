import type {
  Api570ValveFittingsField,
  Api570ValveFittingsInputSI,
  Api570ValveFittingsResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.valve-flanged-fittings" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addPositiveIssue(
  issues: CalculationIssue[],
  field: Api570ValveFittingsField,
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

/** Pure SI extraction of the protected API 574 11.2 valve/fittings Other Piping Calculation. */
export function calculateApi570ValveFittings(input: Api570ValveFittingsInputSI): Api570ValveFittingsResultSI {
  const issues: CalculationIssue[] = [];
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

  const rawAllowance = finiteOrZero(input.allowanceMm);
  const allowanceUsedMm = Math.max(rawAllowance, 0);
  if (rawAllowance < 0) {
    issues.push({
      code: "allowance-clamped",
      field: "allowanceMm",
      severity: "warning",
      message: "The protected calculator clamps a negative allowance to zero.",
    });
  }

  const availableWallThicknessMm = finiteOrZero(input.availableWallThicknessMm);
  if (availableWallThicknessMm < 0) {
    issues.push({
      code: "non-negative-value-required",
      field: "availableWallThicknessMm",
      severity: "error",
      message: "Available wall thickness must be a finite value of zero or greater.",
    });
  }

  const P = finiteOrZero(input.designPressureMpa);
  const D = finiteOrZero(input.outsideDiameterMm);
  const S = finiteOrZero(input.allowableStressMpa);
  const thicknessBasisValid = P > 0 && D > 0 && S > 0;
  const inverseBasisValid = D > 0 && S > 0 && availableWallThicknessMm >= 0;
  const pressureDesignThicknessMm = thicknessBasisValid
    ? 1.5 * ((P * D) / (2 * S * qualityFactorUsed))
    : 0;
  const netAvailableThicknessMm = Math.max(availableWallThicknessMm - allowanceUsedMm, 0);

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    qualityFactorUsed,
    allowanceUsedMm,
    netAvailableThicknessMm,
    pressureDesignThicknessMm,
    minimumRequiredThicknessMm: pressureDesignThicknessMm > 0 ? pressureDesignThicknessMm + allowanceUsedMm : 0,
    allowableWorkingPressureMpa: inverseBasisValid && availableWallThicknessMm > allowanceUsedMm
      ? (2 * S * qualityFactorUsed * netAvailableThicknessMm) / (1.5 * D)
      : 0,
  };
}
