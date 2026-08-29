import {
  convertFromSI,
  convertSIToUnit,
  defaultUnitForSystem,
  isEngineeringUnitForQuantity,
  unitLabel,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type { EngineeringQuantity, EngineeringUnit } from "@api-calc-pro/calc-engine";
import { formatDisplayNumber } from "../display-precision.ts";
import type { Api510InputSnapshot, Api510ResultSnapshot, CalculationWorkflow, CalculationWorkflowStatus, PressureVesselComponent } from "../local-data/models.ts";

export interface Api510ReportContext {
  projectName: string;
  client: string;
  site: string;
  equipmentTag: string;
  equipmentName: string;
  calculationId?: string;
  title: string;
  status: CalculationWorkflowStatus;
  workflow?: CalculationWorkflow;
  preparedBy: string;
  updatedAt?: string;
  inputs: Api510InputSnapshot;
  result: Api510ResultSnapshot;
}

export interface ReportRow {
  label: string;
  value: string;
  emphasis?: "normal" | "primary" | "warning";
}

export interface Api510ReportModel {
  reportNumber: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  preparedBy: string;
  preparedAt: string;
  projectRows: ReportRow[];
  basisRows: ReportRow[];
  inspectionRows: ReportRow[];
  resultRows: ReportRow[];
  planningRows: ReportRow[];
  traceRows: ReportRow[];
  workflowRows: ReportRow[];
  revisionHistory: Array<{ event: string; actor: string; note: string; timestamp: string }>;
  workflowStatus: CalculationWorkflowStatus;
  reviewerName: string;
  reviewNotes: string;
  approverName: string;
  approvalNotes: string;
  issues: Array<{ severity: "error" | "warning"; message: string }>;
  overrides: string[];
  resultOk: boolean;
  conclusion: string;
}

const componentLabels: Record<PressureVesselComponent, string> = {
  cylindrical: "Cylindrical shell",
  spherical: "Spherical shell",
  ellipsoidal: "Ellipsoidal head",
  torispherical: "Torispherical head",
  hemispherical: "Hemispherical head",
  conical: "Conical head",
  "flat-circular": "Flat circular head",
};

function resolveUnit(value: unknown, quantity: EngineeringQuantity, fallbackSystem: Api510InputSnapshot["unitSystem"]): EngineeringUnit {
  return isEngineeringUnitForQuantity(value, quantity) ? value : defaultUnitForSystem(quantity, fallbackSystem);
}

function inputValue(value: string, unit: EngineeringUnit): string {
  if (!value.trim()) return "Not entered";
  const numericValue = Number(value);
  return `${Number.isFinite(numericValue) ? formatDisplayNumber(numericValue) : value} ${unitSymbol(unit)}`;
}

function enteredNumber(value: string): string {
  if (!value.trim()) return "—";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? formatDisplayNumber(numericValue) : value;
}

function formatDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return "Local working preview";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(parsed);
}

function reportNumber(calculationId?: string): string {
  if (!calculationId) return "ACP-510-LIVE-DRAFT";
  const suffix = calculationId.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase() || "LOCAL";
  return `ACP-510-${suffix}`;
}

function geometryRows(inputs: Api510InputSnapshot): ReportRow[] {
  const lengthSystem = inputs.unitSystem;
  if (inputs.component === "flat-circular") {
    const unit = resolveUnit(inputs.diameterOrShortSpanUnit, "length", lengthSystem);
    return [
      { label: "Diameter or short span", value: inputValue(inputs.diameterOrShortSpan, unit) },
      { label: "Attachment factor C", value: inputs.attachmentFactor ? enteredNumber(inputs.attachmentFactor) : "Not entered" },
    ];
  }
  const diameterUnit = resolveUnit(inputs.diameterUnit, "length", lengthSystem);
  const rows: ReportRow[] = [{ label: inputs.component === "conical" ? "Outside diameter" : "Inside diameter", value: inputValue(inputs.diameter, diameterUnit) }];
  if (inputs.component === "torispherical") rows.push({ label: "Inside crown radius", value: inputValue(inputs.crownRadius, resolveUnit(inputs.crownRadiusUnit, "length", lengthSystem)) });
  if (inputs.component === "hemispherical") rows.push({ label: "Inside spherical radius", value: inputValue(inputs.sphericalRadius, resolveUnit(inputs.sphericalRadiusUnit, "length", lengthSystem)) });
  if (inputs.component === "conical") rows.push({ label: "Cone half-apex angle", value: `${enteredNumber(inputs.halfApexAngle)}°` });
  return rows;
}

function resolvedStress(inputs: Api510InputSnapshot): string {
  const unit = resolveUnit(inputs.allowableStressUnit, "pressure", inputs.unitSystem);
  if (inputs.stressMode === "manual") return `${inputValue(inputs.manualStress, unit)} · Manual override`;
  if (inputs.resolvedAllowableStressMpa === null || inputs.resolvedAllowableStressMpa === undefined) return "Automatic from material catalog";
  return `${formatDisplayNumber(convertSIToUnit(inputs.resolvedAllowableStressMpa, "pressure", unit))} ${unitSymbol(unit)} · Automatic`;
}

function resolvedYears(mode: Api510InputSnapshot["serviceYearsMode"], manual: string, resolved: number | null | undefined, source: string): string {
  if (mode === "manual") return `${manual || "—"} yr · Manual override`;
  return resolved === null || resolved === undefined ? `Automatic from ${source}` : `${resolved} yr · Automatic`;
}

export function createApi510ReportModel(context: Api510ReportContext): Api510ReportModel {
  const { inputs, result } = context;
  const lengthUnit = unitLabel("length", inputs.unitSystem);
  const pressureUnit = unitLabel("pressure", inputs.unitSystem);
  const pressureInputUnit = resolveUnit(inputs.pressureUnit, "pressure", inputs.unitSystem);
  const temperatureInputUnit = resolveUnit(inputs.designTemperatureUnit, "temperature", inputs.unitSystem);
  const originalThicknessUnit = resolveUnit(inputs.originalThicknessUnit, "length", inputs.unitSystem);
  const previousThicknessUnit = resolveUnit(inputs.previousThicknessUnit, "length", inputs.unitSystem);
  const actualThicknessUnit = resolveUnit(inputs.actualThicknessUnit, "length", inputs.unitSystem);
  const minimumThicknessUnit = resolveUnit(inputs.minimumThicknessUnit, "length", inputs.unitSystem);
  const overrides = [
    inputs.stressMode === "manual" ? "Allowable stress" : null,
    inputs.minimumMode === "manual" ? "Minimum thickness" : null,
    inputs.serviceYearsMode === "manual" ? "Years in service" : null,
    inputs.inspectionYearsMode === "manual" ? "Years since previous inspection" : null,
  ].filter((value): value is string => Boolean(value));
  const issues = result.issues.map((issue) => ({ severity: issue.severity, message: issue.message }));
  const hasWarnings = issues.some((issue) => issue.severity === "warning");
  const workflow = context.workflow;
  const preparedBy = workflow?.preparedBy || context.preparedBy;
  const statusLabels: Record<CalculationWorkflowStatus, string> = {
    draft: "Draft working record",
    reviewed: "Reviewed local record",
    approved: "Approved local record",
  };

  return {
    reportNumber: reportNumber(context.calculationId),
    title: context.title,
    subtitle: `${componentLabels[inputs.component]} · API 510 local calculation record`,
    statusLabel: statusLabels[context.status],
    preparedBy,
    preparedAt: formatDate(context.updatedAt),
    projectRows: [
      { label: "Project", value: context.projectName || "Unassigned local calculation" },
      { label: "Client", value: context.client || "Not entered" },
      { label: "Site / facility", value: context.site || "Not entered" },
      { label: "Equipment", value: `${context.equipmentTag || "No tag"} · ${context.equipmentName || "Pressure vessel"}` },
    ],
    basisRows: [
      { label: "Component", value: componentLabels[inputs.component] },
      { label: "Output unit system", value: inputs.unitSystem === "metric" ? "Metric · MPa / mm / °C" : "U.S. customary · psi / in / °F" },
      { label: "Internal design pressure", value: inputValue(inputs.pressure, pressureInputUnit) },
      ...geometryRows(inputs),
      { label: "Design temperature", value: inputValue(inputs.designTemperature, temperatureInputUnit) },
      { label: "Material", value: `${inputs.materialSpec} · ${inputs.gradeKey.split("|")[1] ?? inputs.gradeKey}` },
      { label: "Allowable stress", value: resolvedStress(inputs), emphasis: inputs.stressMode === "manual" ? "warning" : "normal" },
      { label: "Joint efficiency", value: inputs.efficiency ? enteredNumber(inputs.efficiency) : "Not entered" },
    ],
    inspectionRows: [
      { label: "Original thickness", value: inputValue(inputs.originalThickness, originalThicknessUnit) },
      { label: "Previous measured thickness", value: inputValue(inputs.previousThickness, previousThicknessUnit) },
      { label: "Current measured thickness", value: inputValue(inputs.actualThickness, actualThicknessUnit) },
      { label: "Minimum thickness basis", value: inputs.minimumMode === "manual" ? `${inputValue(inputs.manualMinimumThickness ?? "", minimumThicknessUnit)} · Manual override` : "Automatic from calculated required thickness", emphasis: inputs.minimumMode === "manual" ? "warning" : "normal" },
      { label: "Build year", value: inputs.buildYear || "Not entered" },
      { label: "Years in service", value: resolvedYears(inputs.serviceYearsMode, inputs.manualServiceYears, inputs.resolvedYearsInService, "build year"), emphasis: inputs.serviceYearsMode === "manual" ? "warning" : "normal" },
      { label: "Previous inspection year", value: inputs.previousInspectionYear || "Not entered" },
      { label: "Years since previous inspection", value: resolvedYears(inputs.inspectionYearsMode, inputs.manualInspectionYears, inputs.resolvedYearsSincePreviousInspection, "previous inspection year"), emphasis: inputs.inspectionYearsMode === "manual" ? "warning" : "normal" },
      { label: "Next inspection interval", value: `${inputs.nextInspectionYears || "—"} yr` },
    ],
    resultRows: [
      { label: "Required thickness", value: `${formatDisplayNumber(convertFromSI(result.requiredThicknessMm, "length", inputs.unitSystem))} ${lengthUnit}`, emphasis: "primary" },
      { label: "Minimum thickness used", value: `${formatDisplayNumber(convertFromSI(result.minimumThicknessUsedMm, "length", inputs.unitSystem))} ${lengthUnit}${inputs.minimumMode === "manual" ? " · Manual override" : ""}`, emphasis: inputs.minimumMode === "manual" ? "warning" : "normal" },
      { label: "Governing MAWP", value: `${formatDisplayNumber(convertFromSI(result.governingMawpMpa, "pressure", inputs.unitSystem))} ${pressureUnit}`, emphasis: "primary" },
      { label: "Remaining life", value: `${formatDisplayNumber(result.remainingLifeYears)} yr`, emphasis: "primary" },
      { label: "Long-term corrosion rate", value: `${formatDisplayNumber(convertFromSI(result.longTermCorrosionRateMmPerYear, "length", inputs.unitSystem), "corrosion-rate")} ${lengthUnit}/yr` },
      { label: "Short-term corrosion rate", value: `${formatDisplayNumber(convertFromSI(result.shortTermCorrosionRateMmPerYear, "length", inputs.unitSystem), "corrosion-rate")} ${lengthUnit}/yr` },
      { label: "Governing corrosion rate", value: `${formatDisplayNumber(convertFromSI(result.governingCorrosionRateMmPerYear, "length", inputs.unitSystem), "corrosion-rate")} ${lengthUnit}/yr`, emphasis: "primary" },
      { label: "Corrosion allowance", value: `${formatDisplayNumber(convertFromSI(result.corrosionAllowanceMm, "length", inputs.unitSystem))} ${lengthUnit}` },
    ],
    planningRows: [
      { label: `Projected thickness (${result.intervalYears} yr)`, value: `${formatDisplayNumber(convertFromSI(result.projectedThicknessMm, "length", inputs.unitSystem))} ${lengthUnit}` },
      { label: `Future MAWP thickness (${result.intervalYears} yr)`, value: `${formatDisplayNumber(convertFromSI(result.futureMawpThicknessMm, "length", inputs.unitSystem))} ${lengthUnit}` },
      { label: "Future MAWP", value: `${formatDisplayNumber(convertFromSI(result.futureMawpMpa, "pressure", inputs.unitSystem))} ${pressureUnit}`, emphasis: "primary" },
      { label: "Hydrostatic planning pressure", value: `${formatDisplayNumber(convertFromSI(result.hydrostaticTestPressureMpa, "pressure", inputs.unitSystem))} ${pressureUnit}` },
      { label: "Pneumatic planning pressure", value: `${formatDisplayNumber(convertFromSI(result.pneumaticTestPressureMpa, "pressure", inputs.unitSystem))} ${pressureUnit}` },
    ],
    traceRows: [
      { label: "Calculation status", value: result.ok ? "Completed without calculation errors" : "Input review required" },
      { label: "Input source", value: "Visible project, design, and inspection values" },
      { label: "Report source", value: "Same calculated result snapshot shown in the application" },
    ],
    workflowRows: [
      { label: "Workflow status", value: context.status.toUpperCase(), emphasis: context.status === "draft" ? "warning" : "primary" },
      { label: "Revision", value: `R${workflow?.revision ?? 1}` },
      { label: "Prepared by", value: preparedBy || "Not entered" },
      { label: "Reviewed by", value: workflow?.reviewedBy || "Pending qualified reviewer" },
      { label: "Reviewed at", value: workflow?.reviewedAt ? formatDate(workflow.reviewedAt) : "Pending" },
      { label: "Approved by", value: workflow?.approvedBy || "Pending engineering approval" },
      { label: "Approved at", value: workflow?.approvedAt ? formatDate(workflow.approvedAt) : "Pending" },
    ],
    revisionHistory: (workflow?.history ?? []).slice().reverse().map((event) => ({
      event: `R${event.revision} · ${event.type.toUpperCase()}`,
      actor: event.actor,
      note: event.note,
      timestamp: formatDate(event.timestamp),
    })),
    workflowStatus: context.status,
    reviewerName: workflow?.reviewedBy ?? "",
    reviewNotes: workflow?.reviewNotes ?? "",
    approverName: workflow?.approvedBy ?? "",
    approvalNotes: workflow?.approvalNotes ?? "",
    issues,
    overrides,
    resultOk: result.ok,
    conclusion: !result.ok
      ? "The result contains validation errors and is not ready for engineering review. Correct the listed inputs and regenerate this preview."
      : overrides.length > 0
        ? `The calculation completed with ${overrides.length} manual override${overrides.length === 1 ? "" : "s"}. Verify each highlighted value against the controlled engineering basis before approval or issue.`
        : hasWarnings
          ? "The arithmetic completed without input errors, but engineering scope warnings remain. A qualified engineer must confirm equation applicability, geometry, the controlled code edition, material data, test-pressure basis, and final disposition before issue."
          : "The calculation completed successfully. A qualified engineer must still confirm applicability, the controlled code edition, inspection data, and final disposition before issue.",
  };
}

export function buildApi510ReportText(model: Api510ReportModel): string {
  const section = (title: string, rows: ReportRow[]) => [`\n${title.toUpperCase()}`, ...rows.map((row) => `${row.label}: ${row.value}`)].join("\n");
  return [
    "API CALC PRO · API 510 CALCULATION REPORT",
    model.reportNumber,
    model.title,
    model.subtitle,
    `Status: ${model.statusLabel}`,
    `Prepared by: ${model.preparedBy}`,
    `Prepared at: ${model.preparedAt}`,
    section("Project and equipment", model.projectRows),
    section("Calculation basis", model.basisRows),
    section("Inspection history", model.inspectionRows),
    section("Calculated results", model.resultRows),
    section("Inspection planning", model.planningRows),
    section("Traceability", model.traceRows),
    section("Workflow and sign-off", model.workflowRows),
    `\nREVIEW NOTES\n${model.reviewNotes || "None"}`,
    `\nAPPROVAL NOTES\n${model.approvalNotes || "None"}`,
    `\nREVISION HISTORY\n${model.revisionHistory.length ? model.revisionHistory.map((entry) => `${entry.event} | ${entry.timestamp} | ${entry.actor} | ${entry.note}`).join("\n") : "No persisted workflow events"}`,
    `\nOVERRIDES\n${model.overrides.length ? model.overrides.join(", ") : "None"}`,
    `\nISSUES\n${model.issues.length ? model.issues.map((issue) => `${issue.severity.toUpperCase()}: ${issue.message}`).join("\n") : "None"}`,
    `\nENGINEERING REVIEW NOTE\n${model.conclusion}`,
    "\nWorking local preview. Not an issued engineering document.",
  ].join("\n");
}
