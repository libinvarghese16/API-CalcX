import type {
  Api570SoilResistivityField,
  Api570SoilResistivityInputSI,
  Api570SoilResistivityResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.soil-resistivity" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function addPositiveIssue(issues: CalculationIssue[], field: Api570SoilResistivityField, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

/** Wenner four-electrode calculation in coherent SI units: rho (ohm-m) = 2 pi a (m) R (ohm). */
export function calculateApi570SoilResistivity(input: Api570SoilResistivityInputSI): Api570SoilResistivityResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveIssue(issues, "pinSpacingM", input.pinSpacingM, "Pin spacing");
  addPositiveIssue(issues, "resistanceOhm", input.resistanceOhm, "Resistance");
  const pinSpacingMUsed = Number.isFinite(input.pinSpacingM) ? Math.max(input.pinSpacingM, 0) : 0;
  const resistanceOhmUsed = Number.isFinite(input.resistanceOhm) ? Math.max(input.resistanceOhm, 0) : 0;
  const soilResistivityOhmM = pinSpacingMUsed > 0 && resistanceOhmUsed > 0
    ? 2 * Math.PI * pinSpacingMUsed * resistanceOhmUsed
    : 0;

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    pinSpacingMUsed,
    resistanceOhmUsed,
    soilResistivityOhmM,
    soilResistivityOhmCm: soilResistivityOhmM * 100,
  };
}
