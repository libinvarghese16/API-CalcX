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
  if (input.assessmentBasis === "screening-only") {
    addPositiveIssue(issues, "outsideDiameterMm", input.outsideDiameterMm, "Outside diameter");
    addPositiveIssue(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");
  }

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
  const componentRatedPressureMpaUsed = Math.max(finiteOrZero(input.componentRatedPressureMpa), 0);
  const codeRequiredThicknessMmUsed = Math.max(finiteOrZero(input.codeRequiredThicknessMm), 0);
  let minimumRequiredThicknessMm = 0;
  let allowableWorkingPressureMpa = 0;
  let componentAdequate: boolean | null = null;
  let assessmentStatus: "complete" | "screening" = "complete";
  if (input.assessmentBasis === "listed-rating") {
    addPositiveIssue(issues, "componentRatedPressureMpa", componentRatedPressureMpaUsed, "Listed component pressure rating");
    allowableWorkingPressureMpa = componentRatedPressureMpaUsed;
    componentAdequate = componentRatedPressureMpaUsed > 0 ? componentRatedPressureMpaUsed >= P : null;
  } else if (input.assessmentBasis === "code-derived-thickness") {
    addPositiveIssue(issues, "codeRequiredThicknessMm", codeRequiredThicknessMmUsed, "Code-derived minimum thickness");
    minimumRequiredThicknessMm = codeRequiredThicknessMmUsed;
    componentAdequate = codeRequiredThicknessMmUsed > 0 ? availableWallThicknessMm >= codeRequiredThicknessMmUsed : null;
  } else if (input.assessmentBasis === "screening-only") {
    assessmentStatus = "screening";
    minimumRequiredThicknessMm = pressureDesignThicknessMm > 0 ? pressureDesignThicknessMm + allowanceUsedMm : 0;
    allowableWorkingPressureMpa = inverseBasisValid && availableWallThicknessMm > allowanceUsedMm
      ? (2 * S * qualityFactorUsed * netAvailableThicknessMm) / (1.5 * D)
      : 0;
    componentAdequate = null;
    issues.push({ code: "screening-only-basis", field: "assessmentBasis", severity: "warning", message: "The 1.5 x Barlow route is a screening calculation only and is not a universal final code minimum for valves or flanged fittings." });
  } else issues.push({ code: "assessment-basis-required", field: "assessmentBasis", severity: "error", message: "Select a listed-rating, code-derived thickness, or screening-only assessment basis." });

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    assessmentBasis: input.assessmentBasis,
    assessmentStatus,
    componentRatedPressureMpaUsed,
    codeRequiredThicknessMmUsed,
    componentAdequate,
    qualityFactorUsed,
    allowanceUsedMm,
    netAvailableThicknessMm,
    pressureDesignThicknessMm,
    minimumRequiredThicknessMm,
    allowableWorkingPressureMpa,
  };
}
