import type {
  Api570TensionAreaSource,
  Api570TensionResolvedAreaSource,
  Api570TensionTestField,
  Api570TensionTestInputSI,
  Api570TensionTestResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.tension-test" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addNonNegativeIssue(issues: CalculationIssue[], field: Api570TensionTestField, value: number | undefined, label: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value equal to or greater than zero.` });
  }
}

function selectArea(
  requested: Api570TensionAreaSource,
  tsa: number,
  rsa: number,
  manual: number,
): { area: number; source: Api570TensionResolvedAreaSource } {
  if (requested === "tsa") return { area: tsa, source: tsa > 0 ? "tsa" : "none" };
  if (requested === "rsa") return { area: rsa, source: rsa > 0 ? "rsa" : "none" };
  if (requested === "manual") return { area: manual, source: manual > 0 ? "manual" : "none" };
  if (manual > 0) return { area: manual, source: "manual" };
  if (rsa > 0) return { area: rsa, source: "rsa" };
  if (tsa > 0) return { area: tsa, source: "tsa" };
  return { area: 0, source: "none" };
}

/** Pure SI extraction of the protected ASME Section IX Tension Test Other Piping Calculation. */
export function calculateApi570TensionTest(input: Api570TensionTestInputSI): Api570TensionTestResultSI {
  const issues: CalculationIssue[] = [];
  addNonNegativeIssue(issues, "turnedSpecimenRadiusMm", input.turnedSpecimenRadiusMm, "Turned specimen radius");
  addNonNegativeIssue(issues, "turnedSpecimenDiameterMm", input.turnedSpecimenDiameterMm, "Turned specimen diameter");
  addNonNegativeIssue(issues, "reducedSpecimenWidthMm", input.reducedSpecimenWidthMm, "Reduced specimen width");
  addNonNegativeIssue(issues, "reducedSpecimenThicknessMm", input.reducedSpecimenThicknessMm, "Reduced specimen thickness");
  addNonNegativeIssue(issues, "manualAreaMm2", input.manualAreaMm2, "Manual area");
  addNonNegativeIssue(issues, "testLoadKn", input.testLoadKn, "Test load");
  addNonNegativeIssue(issues, "targetTensileStrengthMpa", input.targetTensileStrengthMpa, "Target tensile strength");

  const radius = Math.max(finiteOrZero(input.turnedSpecimenRadiusMm), 0);
  const diameter = Math.max(finiteOrZero(input.turnedSpecimenDiameterMm), 0);
  const width = Math.max(finiteOrZero(input.reducedSpecimenWidthMm), 0);
  const thickness = Math.max(finiteOrZero(input.reducedSpecimenThicknessMm), 0);
  const manualAreaMm2Used = Math.max(finiteOrZero(input.manualAreaMm2), 0);
  const testLoadKnUsed = Math.max(finiteOrZero(input.testLoadKn), 0);
  const targetTensileStrengthMpaUsed = Math.max(finiteOrZero(input.targetTensileStrengthMpa), 0);
  const effectiveTurnedRadiusMm = radius > 0 ? radius : (diameter > 0 ? diameter / 2 : 0);
  const effectiveTurnedRadiusSource = radius > 0 ? "radius" : (diameter > 0 ? "diameter" : "none");
  const turnedSpecimenAreaMm2 = effectiveTurnedRadiusMm > 0 ? Math.PI * effectiveTurnedRadiusMm * effectiveTurnedRadiusMm : 0;
  const reducedSpecimenAreaMm2 = width > 0 && thickness > 0 ? width * thickness : 0;
  const selected = selectArea(input.areaSource, turnedSpecimenAreaMm2, reducedSpecimenAreaMm2, manualAreaMm2Used);

  if (input.areaSource !== "auto" && selected.area <= 0) {
    issues.push({
      code: "selected-area-unavailable",
      field: "areaSource",
      severity: "warning",
      message: `The selected ${input.areaSource.toUpperCase()} area is not available; dependent outputs remain zero.`,
    });
  }

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    effectiveTurnedRadiusMm,
    effectiveTurnedRadiusSource,
    turnedSpecimenAreaMm2,
    reducedSpecimenAreaMm2,
    manualAreaMm2Used,
    requestedAreaSource: input.areaSource,
    resolvedAreaSource: selected.source,
    selectedAreaMm2: selected.area,
    testLoadKnUsed,
    targetTensileStrengthMpaUsed,
    tensileStrengthMpa: testLoadKnUsed > 0 && selected.area > 0 ? (testLoadKnUsed * 1000) / selected.area : 0,
    requiredLoadKn: targetTensileStrengthMpaUsed > 0 && selected.area > 0 ? (targetTensileStrengthMpaUsed * selected.area) / 1000 : 0,
  };
}
