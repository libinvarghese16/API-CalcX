import type {
  CalculationIssue,
  CylindricalShellField,
  CylindricalShellInputSI,
  CylindricalShellResultSI,
  GoverningCase,
} from "../contracts.ts";

const ENGINE_ID = "api510.cylindrical-shell" as const;
const ENGINE_VERSION = "0.1.0-legacy-parity" as const;

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function addPositiveInputIssue(
  issues: CalculationIssue[],
  field: CylindricalShellField,
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

function addNonNegativeInputIssue(
  issues: CalculationIssue[],
  field: CylindricalShellField,
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({
      code: "non-negative-value-required",
      field,
      severity: "error",
      message: `${label} must be a finite value of zero or greater.`,
    });
  }
}

function selectGoverningCase(circumferential: number, longitudinal: number, useMinimum: boolean): GoverningCase {
  if (!(circumferential > 0) && !(longitudinal > 0)) return "none";
  if (circumferential === longitudinal) return "equal";
  if (useMinimum) return circumferential < longitudinal ? "circumferential" : "longitudinal";
  return circumferential > longitudinal ? "circumferential" : "longitudinal";
}

function mawpFromThickness(
  thicknessMm: number,
  insideRadiusMm: number,
  allowableStressMpa: number,
  jointEfficiency: number,
): { circumferential: number; longitudinal: number; governing: number; governingCase: GoverningCase } {
  if (!(thicknessMm > 0 && insideRadiusMm > 0 && allowableStressMpa > 0 && jointEfficiency > 0)) {
    return { circumferential: 0, longitudinal: 0, governing: 0, governingCase: "none" };
  }

  const circumferentialDenominator = insideRadiusMm + (0.6 * thicknessMm);
  const circumferential = circumferentialDenominator > 0
    ? (allowableStressMpa * jointEfficiency * thicknessMm) / circumferentialDenominator
    : 0;

  const longitudinalDenominator = insideRadiusMm - (0.4 * thicknessMm);
  const longitudinal = longitudinalDenominator > 0
    ? (2 * allowableStressMpa * jointEfficiency * thicknessMm) / longitudinalDenominator
    : 0;

  const candidates = [circumferential, longitudinal].filter((value) => Number.isFinite(value) && value > 0);
  return {
    circumferential,
    longitudinal,
    governing: candidates.length > 0 ? Math.min(...candidates) : 0,
    governingCase: selectGoverningCase(circumferential, longitudinal, true),
  };
}

/**
 * Pure extraction of the existing API Calc Pro API 510 cylindrical-shell
 * calculation. It intentionally performs no DOM, date, unit, or storage work.
 */
export function calculateCylindricalShell(input: CylindricalShellInputSI): CylindricalShellResultSI {
  const issues: CalculationIssue[] = [];
  addPositiveInputIssue(issues, "insideDiameterMm", input.insideDiameterMm, "Inside diameter");
  addPositiveInputIssue(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");
  addPositiveInputIssue(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");
  addPositiveInputIssue(issues, "jointEfficiency", input.jointEfficiency, "Joint efficiency");
  addNonNegativeInputIssue(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  addNonNegativeInputIssue(issues, "previousThicknessMm", input.previousThicknessMm, "Previous thickness");
  addNonNegativeInputIssue(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  addNonNegativeInputIssue(issues, "yearsInService", input.yearsInService, "Years in service");
  addNonNegativeInputIssue(
    issues,
    "yearsSincePreviousInspection",
    input.yearsSincePreviousInspection,
    "Years since previous inspection",
  );

  if (input.minimumThicknessMm !== undefined) {
    addNonNegativeInputIssue(issues, "minimumThicknessMm", input.minimumThicknessMm, "Minimum thickness");
  }

  if (Number.isFinite(input.jointEfficiency) && input.jointEfficiency > 1) {
    issues.push({
      code: "joint-efficiency-out-of-range",
      field: "jointEfficiency",
      severity: "error",
      message: "Joint efficiency must not exceed 1.0.",
    });
  }

  const rawInterval = Number.isInteger(input.nextInspectionYears) ? input.nextInspectionYears : 5;
  const intervalYears = Math.min(Math.max(rawInterval, 1), 10);
  if (rawInterval !== input.nextInspectionYears || rawInterval !== intervalYears) {
    issues.push({
      code: "inspection-interval-normalized",
      field: "nextInspectionYears",
      severity: "warning",
      message: "Next inspection interval was normalized to a whole number from 1 to 10 years.",
    });
  }

  const pressureBasisValid = !issues.some((issue) => issue.severity === "error" && [
    "insideDiameterMm",
    "designPressureMpa",
    "allowableStressMpa",
    "jointEfficiency",
  ].includes(issue.field));

  const insideDiameterMm = finiteOrZero(input.insideDiameterMm);
  const designPressureMpa = finiteOrZero(input.designPressureMpa);
  const allowableStressMpa = finiteOrZero(input.allowableStressMpa);
  const jointEfficiency = finiteOrZero(input.jointEfficiency);
  const insideRadiusMm = insideDiameterMm / 2;

  let circumferentialRequiredThicknessMm = 0;
  let longitudinalRequiredThicknessMm = 0;

  if (pressureBasisValid) {
    const circumferentialDenominator = (allowableStressMpa * jointEfficiency) - (0.6 * designPressureMpa);
    const longitudinalDenominator = (2 * allowableStressMpa * jointEfficiency) + (0.4 * designPressureMpa);

    if (circumferentialDenominator > 0) {
      circumferentialRequiredThicknessMm = (designPressureMpa * insideRadiusMm) / circumferentialDenominator;
    } else {
      issues.push({
        code: "circumferential-denominator-not-positive",
        field: "calculation",
        severity: "error",
        message: "The circumferential required-thickness denominator must be greater than zero.",
      });
    }

    if (longitudinalDenominator > 0) {
      longitudinalRequiredThicknessMm = (designPressureMpa * insideRadiusMm) / longitudinalDenominator;
    } else {
      issues.push({
        code: "longitudinal-denominator-not-positive",
        field: "calculation",
        severity: "error",
        message: "The longitudinal required-thickness denominator must be greater than zero.",
      });
    }
  }

  const requiredThicknessMm = Math.max(
    circumferentialRequiredThicknessMm,
    longitudinalRequiredThicknessMm,
  );
  const minimumThicknessUsedMm = input.minimumThicknessMm === undefined
    ? Math.round(requiredThicknessMm * 100) / 100
    : Math.max(finiteOrZero(input.minimumThicknessMm), 0);

  const originalThicknessMm = Math.max(finiteOrZero(input.originalThicknessMm), 0);
  const previousThicknessMm = Math.max(finiteOrZero(input.previousThicknessMm), 0);
  const actualThicknessMm = Math.max(finiteOrZero(input.actualThicknessMm), 0);
  const yearsInService = Math.max(finiteOrZero(input.yearsInService), 0);
  const yearsSincePreviousInspection = Math.max(finiteOrZero(input.yearsSincePreviousInspection), 0);

  const longTermLossMm = originalThicknessMm > 0 && actualThicknessMm > 0
    ? Math.max(originalThicknessMm - actualThicknessMm, 0)
    : 0;
  const shortTermLossMm = previousThicknessMm > 0 && actualThicknessMm > 0
    ? Math.max(previousThicknessMm - actualThicknessMm, 0)
    : 0;
  const longTermCorrosionRateMmPerYear = yearsInService > 0 ? longTermLossMm / yearsInService : 0;
  const shortTermCorrosionRateMmPerYear = yearsSincePreviousInspection > 0
    ? shortTermLossMm / yearsSincePreviousInspection
    : 0;
  const governingCorrosionRateMmPerYear = Math.max(
    longTermCorrosionRateMmPerYear,
    shortTermCorrosionRateMmPerYear,
  );
  const corrosionAllowanceMm = actualThicknessMm > 0 && minimumThicknessUsedMm > 0
    ? Math.max(actualThicknessMm - minimumThicknessUsedMm, 0)
    : 0;
  const remainingLifeYears = governingCorrosionRateMmPerYear > 0
    ? corrosionAllowanceMm / governingCorrosionRateMmPerYear
    : 0;

  const mawpNow = pressureBasisValid
    ? mawpFromThickness(actualThicknessMm, insideRadiusMm, allowableStressMpa, jointEfficiency)
    : { circumferential: 0, longitudinal: 0, governing: 0, governingCase: "none" as const };
  const projectedThicknessMm = actualThicknessMm > 0
    ? Math.max(actualThicknessMm - (governingCorrosionRateMmPerYear * intervalYears), 0)
    : 0;
  const futureMawpThicknessMm = actualThicknessMm > 0
    ? Math.max(actualThicknessMm - (2 * governingCorrosionRateMmPerYear * intervalYears), 0)
    : 0;
  const mawpFuture = pressureBasisValid
    ? mawpFromThickness(futureMawpThicknessMm, insideRadiusMm, allowableStressMpa, jointEfficiency)
    : { circumferential: 0, longitudinal: 0, governing: 0, governingCase: "none" as const };

  issues.push({ code: "thin-wall-scope-review", field: "calculation", severity: "warning", message: "Thin-wall cylinder equations are active. Confirm equation applicability or use a controlled thick-wall/alternate analysis when the limits are not satisfied." });
  issues.push({ code: "test-pressure-basis-review", field: "calculation", severity: "warning", message: "Displayed hydrostatic and pneumatic pressures are planning values; the construction code, edition, stress ratio, and component limits govern the test." });
  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    intervalYears,
    circumferentialRequiredThicknessMm,
    longitudinalRequiredThicknessMm,
    requiredThicknessMm,
    governingThicknessCase: selectGoverningCase(
      circumferentialRequiredThicknessMm,
      longitudinalRequiredThicknessMm,
      false,
    ),
    minimumThicknessUsedMm,
    longTermCorrosionRateMmPerYear,
    shortTermCorrosionRateMmPerYear,
    governingCorrosionRateMmPerYear,
    corrosionAllowanceMm,
    remainingLifeYears,
    circumferentialMawpMpa: mawpNow.circumferential,
    longitudinalMawpMpa: mawpNow.longitudinal,
    governingMawpMpa: mawpNow.governing,
    governingMawpCase: mawpNow.governingCase,
    hydrostaticTestPressureMpa: mawpNow.governing > 0 ? 1.3 * mawpNow.governing : 0,
    pneumaticTestPressureMpa: mawpNow.governing > 0 ? 1.1 * mawpNow.governing : 0,
    projectedThicknessMm,
    futureMawpThicknessMm,
    futureMawpMpa: mawpFuture.governing,
  };
}
