import type {
  Api653AnnularMinimumSelectionSI,
  Api653AnnularPlateField,
  Api653AnnularPlateInputSI,
  Api653AnnularPlateResultSI,
  Api653AnnularStressResultSI,
  CalculationIssue,
} from "../contracts.ts";
import { convertSIToUnit, convertUnitToSI } from "../units/unit-conversion.ts";

const ENGINE_ID = "api653.annular-plate" as const;

function positiveIssue(field: Api653AnnularPlateField, value: number, label: string): CalculationIssue | null {
  return Number.isFinite(value) && value > 0 ? null : {
    code: "positive-value-required",
    field,
    severity: "error",
    message: `${label} must be a finite value greater than zero.`,
  };
}

function nonNegativeIssue(field: Api653AnnularPlateField, value: number, label: string): CalculationIssue | null {
  return Number.isFinite(value) && value >= 0 ? null : {
    code: "non-negative-value-required",
    field,
    severity: "error",
    message: `${label} must be a finite value of zero or greater.`,
  };
}

function collectIssues(...issues: Array<CalculationIssue | null>): CalculationIssue[] {
  return issues.filter((issue): issue is CalculationIssue => issue !== null);
}

/** Reproduces the protected USC-basis shell stress calculation used by Annular Tmin selection. */
export function calculateApi653AnnularStress(input: Pick<Api653AnnularPlateInputSI, "diameterM" | "liquidHeightM" | "firstShellThicknessMm">): Api653AnnularStressResultSI {
  const issues = collectIssues(
    positiveIssue("diameterM", input.diameterM, "Tank diameter"),
    positiveIssue("liquidHeightM", input.liquidHeightM, "Maximum liquid height"),
    positiveIssue("firstShellThicknessMm", input.firstShellThicknessMm, "First shell thickness"),
  );
  const diameterMUsed = Number.isFinite(input.diameterM) ? Math.max(input.diameterM, 0) : 0;
  const liquidHeightMUsed = Number.isFinite(input.liquidHeightM) ? Math.max(input.liquidHeightM, 0) : 0;
  const firstShellThicknessMmUsed = Number.isFinite(input.firstShellThicknessMm) ? Math.max(input.firstShellThicknessMm, 0) : 0;
  const diameterFt = convertSIToUnit(diameterMUsed * 1000, "length", "ft");
  const liquidHeightFt = convertSIToUnit(liquidHeightMUsed * 1000, "length", "ft");
  const firstShellThicknessIn = convertSIToUnit(firstShellThicknessMmUsed, "length", "in");
  const effectiveHeightFt = Math.max(liquidHeightFt - 1, 0);
  const calculatedStressPsi = issues.length === 0 && firstShellThicknessIn > 0
    ? (2.34 * diameterFt * effectiveHeightFt) / firstShellThicknessIn
    : 0;
  const calculatedStressMpa = calculatedStressPsi > 0
    ? convertUnitToSI(calculatedStressPsi, "pressure", "psi")
    : 0;

  if (issues.length === 0 && calculatedStressMpa <= 0) {
    issues.push({
      code: "positive-calculated-stress-required",
      field: "liquidHeightM",
      severity: "error",
      message: "The calculated shell stress must be greater than zero; verify that the liquid height exceeds the protected one-foot deduction.",
    });
  }

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    diameterMUsed,
    liquidHeightMUsed,
    firstShellThicknessMmUsed,
    effectiveHeightFt,
    calculatedStressPsi,
    calculatedStressMpa,
  };
}

/** Reproduces the protected original application's automatic Annular Tmin lookup behavior without rendering a standards table. */
export function selectApi653AnnularMinimumThickness(input: Pick<Api653AnnularPlateInputSI, "specificGravity" | "liquidHeightM" | "firstShellThicknessMm"> & { calculatedStressMpa: number }): Api653AnnularMinimumSelectionSI {
  const issues = collectIssues(
    positiveIssue("specificGravity", input.specificGravity, "Specific gravity"),
    positiveIssue("liquidHeightM", input.liquidHeightM, "Maximum liquid height"),
    positiveIssue("firstShellThicknessMm", input.firstShellThicknessMm, "First shell thickness"),
    positiveIssue("calculation", input.calculatedStressMpa, "Calculated shell stress"),
  );
  const effectiveProductHeightM = Number.isFinite(input.liquidHeightM) && Number.isFinite(input.specificGravity)
    ? Math.max(input.liquidHeightM, 0) * Math.max(input.specificGravity, 0)
    : 0;

  const unavailable = (message: string): Api653AnnularMinimumSelectionSI => ({
    ok: false,
    issues,
    effectiveProductHeightM,
    valueMm: null,
    tableLabel: null,
    rowLabel: null,
    columnLabel: null,
    message,
  });

  if (issues.length) return unavailable("Complete tank diameter, liquid height, first shell thickness, specific gravity, and calculated stress to select Annular Tmin.");
  if (effectiveProductHeightM > 23) {
    issues.push({ code: "annular-table-not-applicable", field: "liquidHeightM", severity: "error", message: `H × G = ${effectiveProductHeightM.toFixed(3)} m exceeds 23 m; the protected table route is not applicable and an alternate controlled analysis is required.` });
    return unavailable(issues[issues.length - 1]?.message ?? "The protected table route is not applicable.");
  }

  let tableLabel: string;
  let rowLabel: string;
  let columnLabel: string;
  let valueMm: number | null = null;

  if (input.specificGravity < 1) {
    tableLabel = "API 653 Table 4.5a";
    const row = input.firstShellThicknessMm <= 19
      ? { label: "t ≤ 19 mm", values: [4.32, 5.08, 5.84, 7.62] }
      : input.firstShellThicknessMm <= 25
        ? { label: "19 < t ≤ 25 mm", values: [4.32, 5.59, 7.88, 9.65] }
        : input.firstShellThicknessMm <= 32
          ? { label: "25 < t ≤ 32 mm", values: [4.32, 6.60, 9.65, 12.19] }
          : input.firstShellThicknessMm <= 38
            ? { label: "32 < t ≤ 38 mm", values: [5.59, 8.64, 11.94, 14.99] }
            : { label: "t > 38 mm", values: [6.86, 10.16, 13.46, 17.27] };
    rowLabel = row.label;
    if (input.calculatedStressMpa < 168) [columnLabel, valueMm] = ["stress < 168 MPa", row.values[0] ?? null];
    else if (input.calculatedStressMpa < 186) [columnLabel, valueMm] = ["stress < 186 MPa", row.values[1] ?? null];
    else if (input.calculatedStressMpa < 205) [columnLabel, valueMm] = ["stress < 205 MPa", row.values[2] ?? null];
    else if (input.calculatedStressMpa < 223) [columnLabel, valueMm] = ["stress < 223 MPa", row.values[3] ?? null];
    else {
      issues.push({ code: "annular-stress-outside-selection-range", field: "calculation", severity: "error", message: `Calculated stress ${input.calculatedStressMpa.toFixed(3)} MPa is outside the protected ${tableLabel} selection range (< 223 MPa).` });
      return unavailable(issues[issues.length - 1]?.message ?? "Calculated stress is outside the selection range.");
    }
  } else {
    tableLabel = "API 650 Table 5.1a";
    const row = input.firstShellThicknessMm <= 19
      ? { label: "t ≤ 19 mm", values: [6, 6, 7, 9] }
      : input.firstShellThicknessMm <= 25
        ? { label: "19 < t ≤ 25 mm", values: [6, 7, 10, 11] }
        : input.firstShellThicknessMm <= 32
          ? { label: "25 < t ≤ 32 mm", values: [6, 9, 12, 14] }
          : input.firstShellThicknessMm <= 40
            ? { label: "32 < t ≤ 40 mm", values: [8, 11, 14, 17] }
            : input.firstShellThicknessMm <= 45
              ? { label: "40 < t ≤ 45 mm", values: [9, 13, 16, 19] }
              : null;
    if (!row) {
      issues.push({ code: "annular-shell-thickness-outside-selection-range", field: "firstShellThicknessMm", severity: "error", message: `First shell thickness ${input.firstShellThicknessMm.toFixed(3)} mm is outside the protected ${tableLabel} selection range (t ≤ 45 mm).` });
      return unavailable(issues[issues.length - 1]?.message ?? "First shell thickness is outside the selection range.");
    }
    rowLabel = row.label;
    if (input.calculatedStressMpa <= 190) [columnLabel, valueMm] = ["stress ≤ 190 MPa", row.values[0] ?? null];
    else if (input.calculatedStressMpa <= 210) [columnLabel, valueMm] = ["stress ≤ 210 MPa", row.values[1] ?? null];
    else if (input.calculatedStressMpa <= 220) [columnLabel, valueMm] = ["stress ≤ 220 MPa", row.values[2] ?? null];
    else if (input.calculatedStressMpa <= 250) [columnLabel, valueMm] = ["stress ≤ 250 MPa", row.values[3] ?? null];
    else {
      issues.push({ code: "annular-stress-outside-selection-range", field: "calculation", severity: "error", message: `Calculated stress ${input.calculatedStressMpa.toFixed(3)} MPa is outside the protected ${tableLabel} selection range (≤ 250 MPa).` });
      return unavailable(issues[issues.length - 1]?.message ?? "Calculated stress is outside the selection range.");
    }
  }

  return {
    ok: true,
    issues,
    effectiveProductHeightM,
    valueMm,
    tableLabel,
    rowLabel,
    columnLabel,
    message: `${tableLabel}: ${rowLabel}, ${columnLabel}. Automatically selected Tmin ${valueMm?.toFixed(2)} mm.`,
  };
}

/** Annular structural chain: shell stress -> controlled Tmin basis -> annular metal-loss remaining life. */
export function calculateApi653AnnularPlate(input: Api653AnnularPlateInputSI): Api653AnnularPlateResultSI {
  const stress = calculateApi653AnnularStress(input);
  const manualStressIssue = input.calculatedStressMode === "manual"
    ? positiveIssue("manualCalculatedStressMpa", input.manualCalculatedStressMpa, "Manual calculated shell stress")
    : null;
  const calculatedStressMpa = input.calculatedStressMode === "auto"
    ? stress.calculatedStressMpa
    : Number.isFinite(input.manualCalculatedStressMpa) ? Math.max(input.manualCalculatedStressMpa, 0) : 0;
  const calculatedStressPsi = calculatedStressMpa > 0
    ? convertSIToUnit(calculatedStressMpa, "pressure", "psi")
    : 0;
  const selection = selectApi653AnnularMinimumThickness({
    specificGravity: input.specificGravity,
    liquidHeightM: input.liquidHeightM,
    firstShellThicknessMm: input.firstShellThicknessMm,
    calculatedStressMpa,
  });
  const manualMinimumIssue = input.minimumThicknessMode === "manual" && (!Number.isFinite(input.manualMinimumThicknessMm) || input.manualMinimumThicknessMm < 0)
    ? { code: "non-negative-value-required", field: "manualMinimumThicknessMm", severity: "error", message: "Manual minimum required thickness must be a finite value of zero or greater." } as const
    : null;
  const minimumThicknessMm = input.minimumThicknessMode === "auto"
    ? selection.valueMm ?? 0
    : Number.isFinite(input.manualMinimumThicknessMm) ? Math.max(input.manualMinimumThicknessMm, 0) : 0;
  const plateIssues = collectIssues(
    positiveIssue("originalThicknessMm", input.originalThicknessMm, "Original annular thickness"),
    positiveIssue("previousThicknessMm", input.previousThicknessMm, "Previous annular thickness"),
    positiveIssue("actualThicknessMm", input.actualThicknessMm, "Current annular thickness"),
    nonNegativeIssue("previousInternalPittingDepthMm", input.previousInternalPittingDepthMm, "Previous internal-pitting depth"),
    nonNegativeIssue("currentInternalPittingDepthMm", input.currentInternalPittingDepthMm, "Current internal-pitting depth"),
    positiveIssue("yearsInService", input.yearsInService, "Years in service"),
    positiveIssue("yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection"),
  );
  const originalThicknessMmUsed = Number.isFinite(input.originalThicknessMm) ? Math.max(input.originalThicknessMm, 0) : 0;
  const previousThicknessMmUsed = Number.isFinite(input.previousThicknessMm) ? Math.max(input.previousThicknessMm, 0) : 0;
  const actualThicknessMmUsed = Number.isFinite(input.actualThicknessMm) ? Math.max(input.actualThicknessMm, 0) : 0;
  const previousInternalPittingDepthMmUsed = Number.isFinite(input.previousInternalPittingDepthMm) ? Math.max(input.previousInternalPittingDepthMm, 0) : 0;
  const currentInternalPittingDepthMmUsed = Number.isFinite(input.currentInternalPittingDepthMm) ? Math.max(input.currentInternalPittingDepthMm, 0) : 0;
  if (originalThicknessMmUsed > 0 && previousInternalPittingDepthMmUsed > originalThicknessMmUsed) {
    plateIssues.push({ code: "pitting-depth-exceeds-original", field: "previousInternalPittingDepthMm", severity: "error", message: "Previous internal-pitting depth cannot exceed the original annular thickness." });
  }
  if (originalThicknessMmUsed > 0 && currentInternalPittingDepthMmUsed > originalThicknessMmUsed) {
    plateIssues.push({ code: "pitting-depth-exceeds-original", field: "currentInternalPittingDepthMm", severity: "error", message: "Current internal-pitting depth cannot exceed the original annular thickness." });
  }
  const previousInternalPittingRemainingThicknessMmUsed = Math.max(originalThicknessMmUsed - previousInternalPittingDepthMmUsed, 0);
  const internalPittingRemainingThicknessMmUsed = Math.max(originalThicknessMmUsed - currentInternalPittingDepthMmUsed, 0);
  const yearsInServiceUsed = Number.isFinite(input.yearsInService) ? Math.max(input.yearsInService, 0) : 0;
  const yearsSincePreviousInspectionUsed = Number.isFinite(input.yearsSincePreviousInspection) ? Math.max(input.yearsSincePreviousInspection, 0) : 0;
  const metalLossLongMm = Math.max(originalThicknessMmUsed - actualThicknessMmUsed, 0);
  const metalLossShortMm = Math.max(previousThicknessMmUsed - actualThicknessMmUsed, 0);
  const bottomSideLongTermCorrosionRateMmPerYear = yearsInServiceUsed > 0 ? metalLossLongMm / yearsInServiceUsed : 0;
  const bottomSideShortTermCorrosionRateMmPerYear = yearsSincePreviousInspectionUsed > 0 ? metalLossShortMm / yearsSincePreviousInspectionUsed : 0;
  const topSideLongTermCorrosionRateMmPerYear = yearsInServiceUsed > 0 ? currentInternalPittingDepthMmUsed / yearsInServiceUsed : 0;
  const topSideShortTermCorrosionRateMmPerYear = yearsSincePreviousInspectionUsed > 0
    ? Math.max(currentInternalPittingDepthMmUsed - previousInternalPittingDepthMmUsed, 0) / yearsSincePreviousInspectionUsed : 0;
  const longTermCorrosionRateMmPerYear = Math.max(bottomSideLongTermCorrosionRateMmPerYear, topSideLongTermCorrosionRateMmPerYear);
  const shortTermCorrosionRateMmPerYear = Math.max(bottomSideShortTermCorrosionRateMmPerYear, topSideShortTermCorrosionRateMmPerYear);
  const governingCorrosionRateMmPerYear = Math.max(longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear);
  const governingThicknessMm = Math.min(actualThicknessMmUsed, internalPittingRemainingThicknessMmUsed);
  const availableThicknessMm = Math.max(governingThicknessMm - minimumThicknessMm, 0);
  const remainingLifeYears = governingCorrosionRateMmPerYear > 0 ? availableThicknessMm / governingCorrosionRateMmPerYear : 0;
  const selectionIssues = input.minimumThicknessMode === "auto"
    ? selection.issues
    : selection.issues.map((issue) => ({ ...issue, severity: "warning" as const }));
  const stressIssues = input.calculatedStressMode === "auto"
    ? stress.issues
    : stress.issues.map((issue) => ({ ...issue, severity: "warning" as const }));
  const issues = [
    ...plateIssues,
    ...stressIssues,
    ...selectionIssues,
    ...(manualStressIssue ? [manualStressIssue] : []),
    ...(manualMinimumIssue ? [manualMinimumIssue] : []),
  ];
  if (input.specificGravity >= 1 && input.minimumThicknessMode === "auto" && !input.highSpecificGravityBasisConfirmed) {
    issues.push({ code: "high-specific-gravity-basis-not-confirmed", field: "highSpecificGravityBasisConfirmed", severity: "error", message: "For specific gravity 1.0 or greater, confirm the controlled API 650 table/elastic-analysis basis before using the automatic annular minimum." });
  }

  return {
    engineId: ENGINE_ID,
    engineVersion: "0.2.0-pit-depth-parity",
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    originalThicknessMmUsed,
    previousThicknessMmUsed,
    actualThicknessMmUsed,
    previousInternalPittingDepthMmUsed,
    currentInternalPittingDepthMmUsed,
    previousInternalPittingRemainingThicknessMmUsed,
    internalPittingRemainingThicknessMmUsed,
    minimumThicknessMmUsed: minimumThicknessMm,
    yearsInServiceUsed,
    yearsSincePreviousInspectionUsed,
    metalLossLongMm,
    metalLossShortMm,
    bottomSideLongTermCorrosionRateMmPerYear,
    bottomSideShortTermCorrosionRateMmPerYear,
    topSideLongTermCorrosionRateMmPerYear,
    topSideShortTermCorrosionRateMmPerYear,
    longTermCorrosionRateMmPerYear,
    shortTermCorrosionRateMmPerYear,
    maximumCorrosionRateLongMmPerYear: longTermCorrosionRateMmPerYear,
    maximumCorrosionRateShortMmPerYear: shortTermCorrosionRateMmPerYear,
    governingCorrosionRateMmPerYear,
    governingThicknessMm,
    availableThicknessMm,
    remainingLifeYears,
    diameterMUsed: stress.diameterMUsed,
    liquidHeightMUsed: stress.liquidHeightMUsed,
    firstShellThicknessMmUsed: stress.firstShellThicknessMmUsed,
    specificGravityUsed: Number.isFinite(input.specificGravity) ? Math.max(input.specificGravity, 0) : 0,
    effectiveHeightFt: stress.effectiveHeightFt,
    effectiveProductHeightM: selection.effectiveProductHeightM,
    calculatedStressMode: input.calculatedStressMode,
    automaticCalculatedStressPsi: stress.calculatedStressPsi,
    automaticCalculatedStressMpa: stress.calculatedStressMpa,
    calculatedStressPsi,
    calculatedStressMpa,
    minimumThicknessMode: input.minimumThicknessMode,
    automaticMinimumThicknessMm: selection.valueMm,
    minimumSelectionTableLabel: selection.tableLabel,
    minimumSelectionRowLabel: selection.rowLabel,
    minimumSelectionColumnLabel: selection.columnLabel,
    minimumSelectionMessage: selection.message,
  };
}
