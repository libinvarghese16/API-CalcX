import type {
  Api570FlangeHydroTestField,
  Api570FlangeHydroTestInputSI,
  Api570FlangeHydroTestResultSI,
  CalculationIssue,
} from "../contracts.ts";
import { convertSIToUnit, convertUnitToSI } from "../units/unit-conversion.ts";

const ENGINE_ID = "api570.support.flange-hydro-test" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addNonNegativeIssue(
  issues: CalculationIssue[],
  field: Api570FlangeHydroTestField,
  value: number | undefined,
  label: string,
): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

/** Pure SI extraction of the protected B16.5 flange hydro-test Other Piping Calculation. */
export function calculateApi570FlangeHydroTest(input: Api570FlangeHydroTestInputSI): Api570FlangeHydroTestResultSI {
  const issues: CalculationIssue[] = [];
  addNonNegativeIssue(issues, "pressureRating38CMpa", input.pressureRating38CMpa, "38°C pressure rating");
  addNonNegativeIssue(issues, "pressureRating100FMpa", input.pressureRating100FMpa, "100°F pressure rating");
  addNonNegativeIssue(issues, "nominalPipeSizeMm", input.nominalPipeSizeMm, "Nominal pipe size");

  const rating38CMpa = finiteOrZero(input.pressureRating38CMpa);
  const rating100FMpa = finiteOrZero(input.pressureRating100FMpa);
  const nominalPipeSizeMm = finiteOrZero(input.nominalPipeSizeMm);
  const pressureRating38CBarUsed = rating38CMpa > 0 ? convertSIToUnit(rating38CMpa, "pressure", "Bar") : 0;
  const pressureRating100FPsiUsed = rating100FMpa > 0 ? convertSIToUnit(rating100FMpa, "pressure", "psi") : 0;
  const nominalPipeSizeInUsed = nominalPipeSizeMm > 0 ? convertSIToUnit(nominalPipeSizeMm, "length", "in") : 0;
  const hydroTestPressureBar = pressureRating38CBarUsed > 0 ? Math.ceil(1.5 * pressureRating38CBarUsed) : 0;
  const hydroTestPressurePsi = pressureRating100FPsiUsed > 0 ? Math.ceil((1.5 * pressureRating100FPsiUsed) / 25) * 25 : 0;
  const minimumTestDurationSeconds = nominalPipeSizeInUsed > 0 && nominalPipeSizeInUsed <= 2
    ? 60
    : nominalPipeSizeInUsed > 2 && nominalPipeSizeInUsed <= 8 ? 120 : nominalPipeSizeInUsed > 8 ? 180 : 0;

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    pressureRating38CBarUsed,
    pressureRating100FPsiUsed,
    nominalPipeSizeInUsed,
    hydroTestPressureBar,
    hydroTestPressurePsi,
    metricHydroTestPressureMpa: hydroTestPressureBar > 0 ? convertUnitToSI(hydroTestPressureBar, "pressure", "Bar") : 0,
    usHydroTestPressureMpa: hydroTestPressurePsi > 0 ? convertUnitToSI(hydroTestPressurePsi, "pressure", "psi") : 0,
    minimumTestDurationSeconds,
  };
}
