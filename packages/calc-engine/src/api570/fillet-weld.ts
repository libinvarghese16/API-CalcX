import type {
  Api570FilletWeldField,
  Api570FilletWeldInputSI,
  Api570FilletWeldResultSI,
  Api570FilletWeldXminSource,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.support.fillet-weld-sizing" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addNonNegativeIssue(
  issues: CalculationIssue[],
  field: Api570FilletWeldField,
  value: number | undefined,
  label: string,
): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    issues.push({
      code: "non-negative-value-required",
      field,
      severity: "error",
      message: `${label} must be a finite value equal to or greater than zero.`,
    });
  }
}

function resolveXminSource(pipeCandidate: number, hubThickness: number): Api570FilletWeldXminSource {
  if (pipeCandidate <= 0 && hubThickness <= 0) return "none";
  if (pipeCandidate > 0 && hubThickness <= 0) return "pipe-thickness";
  if (hubThickness > 0 && pipeCandidate <= 0) return "hub-thickness";
  if (pipeCandidate === hubThickness) return "equal";
  return pipeCandidate < hubThickness ? "pipe-thickness" : "hub-thickness";
}

/** Pure SI extraction of the protected B31.3 328.5.2 / 328.5.4 Fillet Weld Sizing Other Piping Calculation. */
export function calculateApi570FilletWeld(input: Api570FilletWeldInputSI): Api570FilletWeldResultSI {
  const issues: CalculationIssue[] = [];
  addNonNegativeIssue(issues, "knownThroatMm", input.knownThroatMm, "Known throat");
  addNonNegativeIssue(issues, "knownLegMm", input.knownLegMm, "Known leg");
  addNonNegativeIssue(issues, "pipeThicknessMm", input.pipeThicknessMm, "Pipe thickness");
  addNonNegativeIssue(issues, "hubThicknessMm", input.hubThicknessMm, "Hub thickness");
  addNonNegativeIssue(issues, "branchThicknessMm", input.branchThicknessMm, "Branch thickness");

  const knownThroatMmUsed = Math.max(finiteOrZero(input.knownThroatMm), 0);
  const knownLegMmUsed = Math.max(finiteOrZero(input.knownLegMm), 0);
  const pipeThicknessMmUsed = Math.max(finiteOrZero(input.pipeThicknessMm), 0);
  const hubThicknessMmUsed = Math.max(finiteOrZero(input.hubThicknessMm), 0);
  const branchThicknessMmUsed = Math.max(finiteOrZero(input.branchThicknessMm), 0);

  const pipeThicknessCandidateMm = pipeThicknessMmUsed > 0 ? 1.4 * pipeThicknessMmUsed : 0;
  const xminCandidates = [pipeThicknessCandidateMm, hubThicknessMmUsed].filter((value) => value > 0);
  const slipOnFlangeXminMm = xminCandidates.length ? Math.min(...xminCandidates) : 0;
  const uncappedBranchThroatMm = branchThicknessMmUsed > 0 ? 0.7 * branchThicknessMmUsed : 0;

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    knownThroatMmUsed,
    knownLegMmUsed,
    pipeThicknessMmUsed,
    hubThicknessMmUsed,
    branchThicknessMmUsed,
    legFromThroatMm: knownThroatMmUsed > 0 ? 1.414 * knownThroatMmUsed : 0,
    throatFromLegMm: knownLegMmUsed > 0 ? 0.707 * knownLegMmUsed : 0,
    pipeThicknessCandidateMm,
    slipOnFlangeXminMm,
    slipOnFlangeXminSource: resolveXminSource(pipeThicknessCandidateMm, hubThicknessMmUsed),
    uncappedBranchThroatMm,
    branchThroatTcMm: uncappedBranchThroatMm > 0 ? Math.min(uncappedBranchThroatMm, 6) : 0,
    branchThroatCappedAt6Mm: uncappedBranchThroatMm > 6,
  };
}
