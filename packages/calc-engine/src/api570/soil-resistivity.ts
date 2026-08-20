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

/** Pure extraction of the protected API 574 four-pin Soil Resistivity Other Piping Calculation. */
export function calculateApi570SoilResistivity(input: Api570SoilResistivityInputSI): Api570SoilResistivityResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveIssue(issues, "pinSpacingFt", input.pinSpacingFt, "Pin spacing");
  addPositiveIssue(issues, "resistanceOhm", input.resistanceOhm, "Resistance");
  const pinSpacingFtUsed = Number.isFinite(input.pinSpacingFt) ? Math.max(input.pinSpacingFt, 0) : 0;
  const resistanceOhmUsed = Number.isFinite(input.resistanceOhm) ? Math.max(input.resistanceOhm, 0) : 0;

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    pinSpacingFtUsed,
    resistanceOhmUsed,
    soilResistivityOhmCm: pinSpacingFtUsed > 0 && resistanceOhmUsed > 0 ? 191.5 * pinSpacingFtUsed * resistanceOhmUsed : 0,
  };
}
