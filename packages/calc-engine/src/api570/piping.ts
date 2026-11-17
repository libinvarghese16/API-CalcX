import type {
  Api570PipingCode,
  Api570PipingField,
  Api570PipingInputSI,
  Api570PipingResultSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api570.piping" as const;
const ENGINE_VERSION = "0.4.0-api574-nps-minimum" as const;

export type Api574PipingMinimumSelection = {
  nominalPipeSizeIn: number;
  structuralThicknessMm: number | null;
  alertThicknessMm: number | null;
  selectedThicknessMm: number | null;
  selectedBasis: "api574-structural" | "api574-alert" | "unavailable";
};

/**
 * Reproduces the protected master site's API RP 574 Table 5 selection rule
 * without exposing or rendering the standards table. The master route uses
 * the more conservative of the structural and alert columns.
 */
export function selectApi574PipingMinimumThickness(nominalPipeSizeIn: number): Api574PipingMinimumSelection {
  const nps = finiteOrZero(nominalPipeSizeIn);
  let structuralThicknessMm: number | null = null;
  let alertThicknessMm: number | null = null;

  if (nps >= 0.5 && nps <= 1) {
    structuralThicknessMm = 1.8; alertThicknessMm = 2;
  } else if (Math.abs(nps - 1.5) < 1e-9) {
    structuralThicknessMm = 1.8; alertThicknessMm = 2.3;
  } else if (Math.abs(nps - 2) < 1e-9) {
    structuralThicknessMm = 1.8; alertThicknessMm = 2.5;
  } else if (Math.abs(nps - 3) < 1e-9) {
    structuralThicknessMm = 2; alertThicknessMm = 2.8;
  } else if (Math.abs(nps - 4) < 1e-9) {
    structuralThicknessMm = 2.3; alertThicknessMm = 3.1;
  } else if (nps >= 6 && nps <= 18) {
    structuralThicknessMm = 2.8; alertThicknessMm = 3.3;
  } else if (nps >= 20 && nps <= 24) {
    structuralThicknessMm = 3.1; alertThicknessMm = 3.6;
  } else if (nps > 24) {
    // Protected master-site rule: use the maximum available value above NPS 24.
    structuralThicknessMm = 3.1; alertThicknessMm = 3.6;
  }

  if (structuralThicknessMm === null && alertThicknessMm === null) {
    return { nominalPipeSizeIn: nps, structuralThicknessMm, alertThicknessMm, selectedThicknessMm: null, selectedBasis: "unavailable" };
  }
  if ((alertThicknessMm ?? -Infinity) >= (structuralThicknessMm ?? -Infinity)) {
    return { nominalPipeSizeIn: nps, structuralThicknessMm, alertThicknessMm, selectedThicknessMm: alertThicknessMm, selectedBasis: "api574-alert" };
  }
  return { nominalPipeSizeIn: nps, structuralThicknessMm, alertThicknessMm, selectedThicknessMm: structuralThicknessMm, selectedBasis: "api574-structural" };
}

type PipingCalculationMode = "b31.1" | "b31.3" | "b31.4" | "b31.5" | "b31.8" | "b31.9" | "b31.12-ip" | "b31.12-pl";

export type Api570PipingCodeDefinition = {
  code: Api570PipingCode;
  label: string;
  calculationMode: PipingCalculationMode | null;
  usesAllowance: boolean;
  status: string;
};

export const API570_PIPING_CODE_DEFINITIONS: readonly Api570PipingCodeDefinition[] = [
  { code: "b31.3", label: "ASME B31.3 Process Piping", calculationMode: "b31.3", usesAllowance: true, status: "ASME B31.3 Para. 304.1.2" },
  { code: "b31.1", label: "ASME B31.1 Power Piping", calculationMode: "b31.1", usesAllowance: true, status: "ASME B31.1 Para. 104.1.2" },
  { code: "b31.4", label: "ASME B31.4 Liquid / Slurry Pipelines", calculationMode: "b31.4", usesAllowance: true, status: "ASME B31.4 Para. 403.2.1" },
  { code: "b31.5", label: "ASME B31.5 Refrigeration Piping", calculationMode: "b31.5", usesAllowance: true, status: "ASME B31.5 Para. 504.1.2" },
  { code: "b31.8", label: "ASME B31.8 Gas Transmission & Distribution", calculationMode: "b31.8", usesAllowance: false, status: "ASME B31.8 Para. 841.1.1" },
  { code: "b31.9", label: "ASME B31.9 Building Services Piping", calculationMode: "b31.9", usesAllowance: true, status: "ASME B31.9 Para. 904.1.1" },
  { code: "b31.12-ip", label: "ASME B31.12 Part IP Hydrogen Industrial Piping", calculationMode: "b31.12-ip", usesAllowance: true, status: "ASME B31.12 Part IP IP-3.2 / IP-3.2.1" },
  { code: "b31.12-pl", label: "ASME B31.12 Part PL Hydrogen Pipelines", calculationMode: "b31.12-pl", usesAllowance: false, status: "ASME B31.12 Part PL PL-3.7.1(a)" },
  { code: "b31.2", label: "ASME B31.2 Fuel Gas Piping (withdrawn)", calculationMode: null, usesAllowance: false, status: "ASME B31.2 withdrawn" },
  { code: "b31.6", label: "ASME B31.6 Chemical Plant Piping (use B31.3)", calculationMode: "b31.3", usesAllowance: true, status: "ASME B31.6 routed to ASME B31.3 Para. 304.1.2" },
  { code: "b31.7", label: "ASME B31.7 Nuclear Power Piping (ASME III)", calculationMode: null, usesAllowance: false, status: "ASME B31.7 superseded" },
  { code: "b31.8s", label: "ASME B31.8S Integrity Management (use B31.8)", calculationMode: "b31.8", usesAllowance: false, status: "ASME B31.8S routed to ASME B31.8 Para. 841.1.1" },
  { code: "b31.10", label: "ASME B31.10 Cryogenic Piping (route by service)", calculationMode: "b31.3", usesAllowance: true, status: "ASME B31.10 routed to ASME B31.3 Para. 304.1.2" },
  { code: "b31.11", label: "ASME B31.11 Slurry Transportation (use B31.4)", calculationMode: "b31.4", usesAllowance: true, status: "ASME B31.11 Historical Para. 1104.1.2 / B31.4 Chapter XI" },
] as const;

export function api570PipingCodeDefinitionFor(code: string): Api570PipingCodeDefinition {
  return API570_PIPING_CODE_DEFINITIONS.find((definition) => definition.code === code)
    ?? API570_PIPING_CODE_DEFINITIONS[0]!;
}

function finiteOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function positiveOrFallback(value: number | undefined, fallback = 1): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

function addPositiveIssue(issues: CalculationIssue[], field: Api570PipingField, value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` });
  }
}

function addNonNegativeIssue(issues: CalculationIssue[], field: Api570PipingField, value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` });
  }
}

function requiredFactorFields(mode: PipingCalculationMode | null): Api570PipingField[] {
  switch (mode) {
    case "b31.1":
    case "b31.3": return ["longitudinalQualityFactor", "weldStrengthReductionFactor"];
    case "b31.8": return ["longitudinalQualityFactor", "designFactor", "temperatureDeratingFactor"];
    case "b31.9": return ["longitudinalQualityFactor"];
    case "b31.12-ip": return ["longitudinalQualityFactor", "hydrogenMaterialFactor"];
    case "b31.12-pl": return ["longitudinalQualityFactor", "designFactor", "temperatureDeratingFactor", "hydrogenFactor"];
    default: return [];
  }
}

function pressureThickness(
  mode: PipingCalculationMode | null,
  values: { P: number; D: number; S: number; E: number; W: number; Y: number; F: number; T: number; Mf: number; Hf: number },
): number {
  const { P, D, S, E, W, Y, F, T, Mf, Hf } = values;
  switch (mode) {
    case "b31.1":
    case "b31.3": {
      const denominator = 2 * ((S * E * W) + (P * Y));
      return denominator > 0 ? (P * D) / denominator : 0;
    }
    case "b31.4": return S > 0 ? (P * D) / (2 * S) : 0;
    case "b31.5": {
      const denominator = 2 * (S + (P * Y));
      return denominator > 0 ? (P * D) / denominator : 0;
    }
    case "b31.8": return S > 0 && F > 0 && E > 0 && T > 0 ? (P * D) / (2 * S * F * E * T) : 0;
    case "b31.9": return S > 0 && E > 0 ? (P * D) / (2 * S * E) : 0;
    case "b31.12-ip": {
      const denominator = 2 * ((S * E * Mf) + (P * Y));
      return denominator > 0 ? (P * D) / denominator : 0;
    }
    case "b31.12-pl": return S > 0 && F > 0 && E > 0 && T > 0 && Hf > 0 ? (P * D) / (2 * S * F * E * T * Hf) : 0;
    default: return 0;
  }
}

function mawpFromThickness(
  mode: PipingCalculationMode | null,
  thicknessMm: number,
  usesAllowance: boolean,
  allowanceMm: number,
  values: { D: number; S: number; E: number; W: number; Y: number; F: number; T: number; Mf: number; Hf: number },
): number {
  const { D, S, E, W, Y, F, T, Mf, Hf } = values;
  if (!(D > 0 && S > 0 && thicknessMm > 0)) return 0;
  const t = Math.max(thicknessMm - (usesAllowance ? allowanceMm : 0), 0);
  if (!(t > 0)) return 0;
  switch (mode) {
    case "b31.1":
    case "b31.3": {
      const denominator = D - (2 * Y * t);
      return E > 0 && denominator > 0 ? (2 * S * E * W * t) / denominator : 0;
    }
    case "b31.4": return (2 * S * t) / D;
    case "b31.5": {
      const denominator = D - (2 * Y * t);
      return denominator > 0 ? (2 * S * t) / denominator : 0;
    }
    case "b31.8": return E > 0 && F > 0 && T > 0 ? (2 * S * F * E * T * t) / D : 0;
    case "b31.9": return E > 0 ? (2 * S * E * t) / D : 0;
    case "b31.12-ip": {
      const denominator = D - (2 * Y * t);
      return E > 0 && Mf > 0 && denominator > 0 ? (2 * S * E * Mf * t) / denominator : 0;
    }
    case "b31.12-pl": return E > 0 && F > 0 && T > 0 && Hf > 0 ? (2 * S * F * E * T * Hf * t) / D : 0;
    default: return 0;
  }
}

/** Pure SI extraction of the protected original website's individual API 570 Piping calculator. */
export function calculateApi570Piping(input: Api570PipingInputSI): Api570PipingResultSI {
  const issues: CalculationIssue[] = [];
  const definition = api570PipingCodeDefinitionFor(input.pipingCode);
  if (input.nominalPipeSizeIn !== undefined) addPositiveIssue(issues, "nominalPipeSizeIn", input.nominalPipeSizeIn, "Nominal pipe size");
  if (input.designTemperatureC !== undefined && !Number.isFinite(input.designTemperatureC)) {
    issues.push({ code: "finite-value-required", field: "designTemperatureC", severity: "error", message: "Design temperature must be finite." });
  }
  addPositiveIssue(issues, "outsideDiameterMm", input.outsideDiameterMm, "Outside diameter");
  addPositiveIssue(issues, "designPressureMpa", input.designPressureMpa, "Design pressure");
  addPositiveIssue(issues, "allowableStressMpa", input.allowableStressMpa, "Allowable stress");
  addNonNegativeIssue(issues, "originalThicknessMm", input.originalThicknessMm, "Original thickness");
  addNonNegativeIssue(issues, "previousThicknessMm", input.previousThicknessMm, "Previous thickness");
  addNonNegativeIssue(issues, "actualThicknessMm", input.actualThicknessMm, "Actual thickness");
  addNonNegativeIssue(issues, "yearsInService", input.yearsInService, "Years in service");
  addNonNegativeIssue(issues, "yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection");
  addNonNegativeIssue(issues, "allowanceMm", finiteOrZero(input.allowanceMm), "Allowance");
  if (input.structuralMinimumThicknessMm !== undefined) addNonNegativeIssue(issues, "structuralMinimumThicknessMm", input.structuralMinimumThicknessMm, "Structural minimum thickness");
  if ((input.structuralMinimumThicknessMm ?? 0) > 0) issues.push({ code: "structural-minimum-applicability-review", field: "structuralMinimumThicknessMm", severity: "warning", message: "The manual structural minimum requires confirmation of NPS, span, supports, vibration, external loading, pressure class, and controlled-table applicability." });
  if (input.minimumThicknessMm !== undefined) addNonNegativeIssue(issues, "minimumThicknessMm", input.minimumThicknessMm, "Minimum thickness");

  if (!definition.calculationMode) {
    issues.push({ code: "inactive-piping-code", field: "pipingCode", severity: "error", message: `${definition.label} has no active pressure-thickness equation in the protected original calculator.` });
  }

  const E = finiteOrZero(input.longitudinalQualityFactor);
  const W = positiveOrFallback(input.weldStrengthReductionFactor);
  const Y = Math.max(finiteOrZero(input.yCoefficient), 0);
  const F = positiveOrFallback(input.designFactor);
  const T = positiveOrFallback(input.temperatureDeratingFactor);
  const Mf = positiveOrFallback(input.hydrogenMaterialFactor);
  const Hf = positiveOrFallback(input.hydrogenFactor);
  const factorValues: Record<Api570PipingField, number> = {
    pipingCode: 1, nominalPipeSizeIn: finiteOrZero(input.nominalPipeSizeIn), designTemperatureC: finiteOrZero(input.designTemperatureC), outsideDiameterMm: input.outsideDiameterMm, designPressureMpa: input.designPressureMpa,
    allowableStressMpa: input.allowableStressMpa, longitudinalQualityFactor: E, weldStrengthReductionFactor: W,
    yCoefficient: Y, allowanceMm: finiteOrZero(input.allowanceMm), designFactor: F, temperatureDeratingFactor: T,
    hydrogenMaterialFactor: Mf, hydrogenFactor: Hf, originalThicknessMm: input.originalThicknessMm,
    previousThicknessMm: input.previousThicknessMm, actualThicknessMm: input.actualThicknessMm,
    structuralMinimumThicknessMm: finiteOrZero(input.structuralMinimumThicknessMm), minimumThicknessMm: finiteOrZero(input.minimumThicknessMm),
    yearsInService: input.yearsInService, yearsSincePreviousInspection: input.yearsSincePreviousInspection,
    nextInspectionYears: input.nextInspectionYears, calculation: 1,
  };
  for (const field of requiredFactorFields(definition.calculationMode)) addPositiveIssue(issues, field, factorValues[field], field.replace(/([A-Z])/g, " $1").toLowerCase());

  const rawInterval = Number.isInteger(input.nextInspectionYears) ? input.nextInspectionYears : 5;
  const intervalYears = Math.min(Math.max(rawInterval, 1), 20);
  if (rawInterval !== input.nextInspectionYears || rawInterval !== intervalYears) {
    issues.push({ code: "inspection-interval-normalized", field: "nextInspectionYears", severity: "warning", message: "Future interval was normalized to a whole number from 1 to 20 years." });
  }

  const P = finiteOrZero(input.designPressureMpa);
  const D = finiteOrZero(input.outsideDiameterMm);
  const S = finiteOrZero(input.allowableStressMpa);
  const allowance = Math.max(finiteOrZero(input.allowanceMm), 0);
  const pressureBasisValid = !issues.some((issue) => issue.severity === "error" && [
    "pipingCode", "outsideDiameterMm", "designPressureMpa", "allowableStressMpa",
    ...requiredFactorFields(definition.calculationMode),
  ].includes(issue.field));
  const sharedValues = { P, D, S, E, W, Y, F, T, Mf, Hf };
  const pressureDesignThicknessMm = pressureBasisValid ? pressureThickness(definition.calculationMode, sharedValues) : 0;
  const requiredThicknessMm = pressureDesignThicknessMm > 0 ? pressureDesignThicknessMm + (definition.usesAllowance ? allowance : 0) : 0;
  const nominalPipeSizeInUsed = Math.max(finiteOrZero(input.nominalPipeSizeIn), 0);
  const api574Selection = selectApi574PipingMinimumThickness(nominalPipeSizeInUsed);
  const automaticApi574Allowed = input.designTemperatureC === undefined || input.designTemperatureC <= 205;
  const api574StructuralColumnThicknessMm = automaticApi574Allowed ? api574Selection.structuralThicknessMm ?? 0 : 0;
  const api574AlertColumnThicknessMm = automaticApi574Allowed ? api574Selection.alertThicknessMm ?? 0 : 0;
  const usesManualStructuralMinimum = input.structuralMinimumThicknessMm !== undefined;
  const structuralMinimumThicknessMm = usesManualStructuralMinimum
    ? Math.max(finiteOrZero(input.structuralMinimumThicknessMm), 0)
    : automaticApi574Allowed ? api574Selection.selectedThicknessMm ?? 0 : 0;
  const structuralMinimumBasis = usesManualStructuralMinimum
    ? "manual" as const
    : automaticApi574Allowed ? api574Selection.selectedBasis : "unavailable" as const;
  if (!usesManualStructuralMinimum && nominalPipeSizeInUsed > 0 && !automaticApi574Allowed) {
    issues.push({ code: "api574-table5-temperature-outside-range", field: "designTemperatureC", severity: "warning", message: "The supplied API RP 574 Table 5 lookup is limited to temperatures at or below 205 °C. Enter a controlled manual structural minimum for this temperature." });
  } else if (!usesManualStructuralMinimum && nominalPipeSizeInUsed > 0 && structuralMinimumBasis === "unavailable") {
    issues.push({ code: "api574-table5-nps-unavailable", field: "nominalPipeSizeIn", severity: "warning", message: "The selected NPS has no matching row in the supplied API RP 574 Table 5 reference. Enter a controlled manual structural minimum." });
  } else if (!usesManualStructuralMinimum && structuralMinimumThicknessMm > 0) {
    issues.push({ code: "api574-table5-auto-selection", field: "structuralMinimumThicknessMm", severity: "warning", message: `API RP 574 Table 5 auto-selection used the more conservative ${structuralMinimumBasis === "api574-alert" ? "minimum alert" : "structural minimum"} value for NPS ${nominalPipeSizeInUsed}. Confirm applicability against the controlled edition and service conditions.` });
  }
  // Keep the pressure/structural result at full SI precision. Presentation code
  // rounds for display, while corrosion allowance and remaining life use the
  // unrounded engineering value reproduced by the HRSG report calculation chain.
  const automaticMinimumThicknessMm = Math.max(requiredThicknessMm, structuralMinimumThicknessMm);
  const minimumThicknessUsedMm = input.minimumThicknessMm === undefined
    ? automaticMinimumThicknessMm
    : Math.max(finiteOrZero(input.minimumThicknessMm), 0);

  const originalThicknessMm = Math.max(finiteOrZero(input.originalThicknessMm), 0);
  const previousThicknessMm = Math.max(finiteOrZero(input.previousThicknessMm), 0);
  const actualThicknessMm = Math.max(finiteOrZero(input.actualThicknessMm), 0);
  const yearsInService = Math.max(finiteOrZero(input.yearsInService), 0);
  const yearsSincePreviousInspection = Math.max(finiteOrZero(input.yearsSincePreviousInspection), 0);
  const longTermCorrosionRateMmPerYear = yearsInService > 0 && originalThicknessMm > 0 && actualThicknessMm > 0
    ? Math.max(originalThicknessMm - actualThicknessMm, 0) / yearsInService : 0;
  const shortTermCorrosionRateMmPerYear = yearsSincePreviousInspection > 0 && previousThicknessMm > 0 && actualThicknessMm > 0
    ? Math.max(previousThicknessMm - actualThicknessMm, 0) / yearsSincePreviousInspection : 0;
  const governingCorrosionRateMmPerYear = Math.max(longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear);
  const corrosionAllowanceMm = actualThicknessMm > 0 && minimumThicknessUsedMm > 0 ? Math.max(actualThicknessMm - minimumThicknessUsedMm, 0) : 0;
  const futureCorrosionAllowanceMm = governingCorrosionRateMmPerYear * intervalYears;
  const remainingCorrosionAllowanceMm = Math.max(corrosionAllowanceMm - futureCorrosionAllowanceMm, 0);
  const remainingLifeYears = governingCorrosionRateMmPerYear > 0 ? corrosionAllowanceMm / governingCorrosionRateMmPerYear : 0;
  const projectedThicknessMm = actualThicknessMm > 0 ? Math.max(actualThicknessMm - (governingCorrosionRateMmPerYear * intervalYears), 0) : 0;
  const futureMawpThicknessMm = projectedThicknessMm;
  const mawpValues = { D, S, E, W, Y, F, T, Mf, Hf };
  const governingMawpMpa = pressureBasisValid ? mawpFromThickness(definition.calculationMode, actualThicknessMm, definition.usesAllowance, allowance, mawpValues) : 0;
  const futureMawpMpa = pressureBasisValid ? mawpFromThickness(definition.calculationMode, futureMawpThicknessMm, definition.usesAllowance, allowance, mawpValues) : 0;

  issues.push({ code: "test-pressure-planning-only", field: "calculation", severity: "warning", message: "Displayed hydrostatic and pneumatic pressures are planning multipliers only; use the dedicated code-specific test route and confirm the controlled code edition, stress ratios, component limits, and approved procedure." });

  return {
    engineId: ENGINE_ID, engineVersion: ENGINE_VERSION, ok: !issues.some((issue) => issue.severity === "error"), issues,
    pipingCode: definition.code, codeLabel: definition.label, codeStatus: definition.status, intervalYears,
    pressureDesignThicknessMm, requiredThicknessMm, nominalPipeSizeInUsed,
    api574StructuralColumnThicknessMm, api574AlertColumnThicknessMm, structuralMinimumBasis,
    structuralMinimumThicknessMm, automaticMinimumThicknessMm,
    minimumThicknessUsedMm, longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear,
    governingCorrosionRateMmPerYear, corrosionAllowanceMm, futureCorrosionAllowanceMm,
    remainingCorrosionAllowanceMm, remainingLifeYears, governingMawpMpa,
    hydrostaticTestPressureMpa: P > 0 ? 1.5 * P : 0, pneumaticTestPressureMpa: P > 0 ? 1.1 * P : 0,
    projectedThicknessMm, futureMawpThicknessMm, futureMawpMpa,
  };
}
