import type {
  Api570PipingCode,
  Api570PipingInputSI,
  Api570PipingResultSI,
  Api570FilletWeldInputSI,
  Api570FilletWeldResultSI,
  Api570FlangeHydroTestInputSI,
  Api570FlangeHydroTestResultSI,
  Api570HeaderInputSI,
  Api570HeaderResultSI,
  Api570HydroTestInputSI,
  Api570HydroTestResultSI,
  Api570PneumaticTestInputSI,
  Api570PneumaticTestResultSI,
  Api570PressureDesignInputSI,
  Api570PressureDesignResultSI,
  Api570SoilResistivityInputSI,
  Api570SoilResistivityResultSI,
  Api570TensionAreaSource,
  Api570TensionTestInputSI,
  Api570TensionTestResultSI,
  Api570TubeEndCondition,
  Api570TubeInputSI,
  Api570TubeResultSI,
  Api570ValveFittingsInputSI,
  Api570ValveFittingsResultSI,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  UnitSystem,
} from "@api-calc-pro/calc-engine";

export type PressureVesselComponent = "cylindrical" | "spherical" | "ellipsoidal" | "torispherical" | "hemispherical" | "conical" | "flat-circular";

export interface Api510InputSnapshot {
  component: PressureVesselComponent;
  unitSystem: UnitSystem;
  pressureUnit?: EngineeringUnit;
  diameterUnit?: EngineeringUnit;
  crownRadiusUnit?: EngineeringUnit;
  sphericalRadiusUnit?: EngineeringUnit;
  diameterOrShortSpanUnit?: EngineeringUnit;
  designTemperatureUnit?: EngineeringUnit;
  allowableStressUnit?: EngineeringUnit;
  originalThicknessUnit?: EngineeringUnit;
  previousThicknessUnit?: EngineeringUnit;
  actualThicknessUnit?: EngineeringUnit;
  pressure: string;
  diameter: string;
  crownRadius: string;
  sphericalRadius: string;
  halfApexAngle: string;
  diameterOrShortSpan: string;
  attachmentFactor: string;
  efficiency: string;
  designTemperature: string;
  materialSpec: string;
  gradeKey: string;
  stressMode: AutomaticValueMode;
  manualStress: string;
  originalThickness: string;
  previousThickness: string;
  actualThickness: string;
  buildYear: string;
  serviceYearsMode: AutomaticValueMode;
  manualServiceYears: string;
  previousInspectionYear: string;
  inspectionYearsMode: AutomaticValueMode;
  manualInspectionYears: string;
  nextInspectionYears: string;
  resolvedAllowableStressMpa?: number | null;
  resolvedYearsInService?: number | null;
  resolvedYearsSincePreviousInspection?: number | null;
}

export interface Api510ResultSnapshot {
  engineId: string;
  engineVersion: string;
  ok: boolean;
  issues: Array<{ code: string; field: string; severity: "error" | "warning"; message: string }>;
  intervalYears: number;
  requiredThicknessMm: number;
  minimumThicknessUsedMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  corrosionAllowanceMm: number;
  remainingLifeYears: number;
  governingMawpMpa: number;
  hydrostaticTestPressureMpa: number;
  pneumaticTestPressureMpa: number;
  projectedThicknessMm: number;
  futureMawpThicknessMm: number;
  futureMawpMpa: number;
}

export type CalculationWorkflowStatus = "draft" | "reviewed" | "approved";
export type CalculationWorkflowEventType = "saved" | "revised" | "reviewed" | "approved";

export interface CalculationWorkflowEvent {
  id: string;
  type: CalculationWorkflowEventType;
  status: CalculationWorkflowStatus;
  revision: number;
  actor: string;
  note: string;
  timestamp: string;
  fingerprint: string;
}

export interface CalculationWorkflow {
  revision: number;
  preparedBy: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedFingerprint?: string;
  approvedBy?: string;
  approvalNotes?: string;
  approvedAt?: string;
  approvedFingerprint?: string;
  history: CalculationWorkflowEvent[];
}

export interface SavedApi510Calculation {
  id: string;
  projectId: string;
  equipmentId: string;
  title: string;
  status: CalculationWorkflowStatus;
  workflow: CalculationWorkflow;
  inputs: Api510InputSnapshot;
  result: Api510ResultSnapshot;
  createdAt: string;
  updatedAt: string;
}

export type Api570CalculatorId =
  | "piping"
  | "tube"
  | "header"
  | "pressure-design"
  | "valve-fittings"
  | "hydro-test"
  | "flange-hydro-test"
  | "pneumatic-test"
  | "fillet-weld"
  | "tension-test"
  | "soil-resistivity";

export type Api570PipingUnitFieldId =
  | "designPressure"
  | "outsideDiameter"
  | "designTemperature"
  | "allowableStress"
  | "allowance"
  | "originalThickness"
  | "previousThickness"
  | "actualThickness"
  | "structuralMinimum"
  | "manualMinimum";

export interface Api570PipingUnitFieldSnapshot {
  value: string;
  unit: EngineeringUnit;
  quantity: EngineeringQuantity;
}

export interface Api570PipingInputSnapshot {
  calculatorId: "piping";
  unitSystem: UnitSystem;
  fields: Record<Api570PipingUnitFieldId, Api570PipingUnitFieldSnapshot>;
  pipingCode: Api570PipingCode;
  buildYear: string;
  previousInspectionYear: string;
  serviceYearsMode: AutomaticValueMode;
  inspectionYearsMode: AutomaticValueMode;
  manualServiceYears: string;
  manualInspectionYears: string;
  minimumMode: AutomaticValueMode;
  qualityFactor: string;
  weldFactor: string;
  yCoefficient: string;
  designFactor: string;
  temperatureFactor: string;
  hydrogenMaterialFactor: string;
  hydrogenFactor: string;
  intervalYears: string;
  engineInput: Api570PipingInputSI;
}

export type Api570TubeUnitFieldId =
  | "designPressure"
  | "outsideDiameter"
  | "designTemperature"
  | "allowableStress"
  | "expandedEndFactor"
  | "originalThickness"
  | "previousThickness"
  | "actualThickness"
  | "manualMinimum";

export interface Api570TubeUnitFieldSnapshot {
  value: string;
  unit: EngineeringUnit;
  quantity: EngineeringQuantity;
}

export interface Api570TubeInputSnapshot {
  calculatorId: "tube";
  unitSystem: UnitSystem;
  fields: Record<Api570TubeUnitFieldId, Api570TubeUnitFieldSnapshot>;
  endCondition: Api570TubeEndCondition;
  buildYear: string;
  previousInspectionYear: string;
  serviceYearsMode: AutomaticValueMode;
  inspectionYearsMode: AutomaticValueMode;
  manualServiceYears: string;
  manualInspectionYears: string;
  minimumMode: AutomaticValueMode;
  weldFactor: string;
  intervalYears: string;
  engineInput: Api570TubeInputSI;
}

export interface Api570UnitFieldSnapshot {
  value: string;
  unit: EngineeringUnit;
  quantity: EngineeringQuantity;
}

export interface Api570HeaderInputSnapshot {
  calculatorId: "header";
  unitSystem: UnitSystem;
  fields: Record<"designPressure" | "outsideDiameter" | "designTemperature" | "allowableStress" | "originalThickness" | "previousThickness" | "actualThickness" | "manualMinimum", Api570UnitFieldSnapshot>;
  jointEfficiency: string;
  yCoefficient: string;
  buildYear: string;
  previousInspectionYear: string;
  serviceYearsMode: AutomaticValueMode;
  inspectionYearsMode: AutomaticValueMode;
  manualServiceYears: string;
  manualInspectionYears: string;
  minimumMode: AutomaticValueMode;
  intervalYears: string;
  engineInput: Api570HeaderInputSI;
}

export interface Api570PressureDesignInputSnapshot {
  calculatorId: "pressure-design";
  unitSystem: UnitSystem;
  fields: Record<"designPressure" | "outsideDiameter" | "allowableStress" | "availableThickness", Api570UnitFieldSnapshot>;
  qualityFactor: string;
  engineInput: Api570PressureDesignInputSI;
}

export interface Api570ValveFittingsInputSnapshot {
  calculatorId: "valve-fittings";
  unitSystem: UnitSystem;
  fields: Record<"designPressure" | "outsideDiameter" | "allowableStress" | "allowance" | "availableWall", Api570UnitFieldSnapshot>;
  qualityFactor: string;
  engineInput: Api570ValveFittingsInputSI;
}

export interface Api570HydroTestInputSnapshot {
  calculatorId: "hydro-test";
  unitSystem: UnitSystem;
  fields: Record<"designPressure" | "designStress" | "testStress", Api570UnitFieldSnapshot>;
  ratioMode: AutomaticValueMode;
  manualStressRatio: string;
  engineInput: Api570HydroTestInputSI;
}

export interface Api570FlangeHydroTestInputSnapshot {
  calculatorId: "flange-hydro-test";
  unitSystem: UnitSystem;
  fields: Record<"rating38C" | "rating100F" | "nominalPipeSize", Api570UnitFieldSnapshot>;
  engineInput: Api570FlangeHydroTestInputSI;
}

export interface Api570PneumaticTestInputSnapshot {
  calculatorId: "pneumatic-test";
  unitSystem: UnitSystem;
  designPressure: string;
  designPressureUnit: EngineeringUnit;
  engineInput: Api570PneumaticTestInputSI;
}

export interface Api570FilletWeldInputSnapshot {
  calculatorId: "fillet-weld";
  unitSystem: UnitSystem;
  fields: Record<"knownThroat" | "knownLeg" | "pipeThickness" | "hubThickness" | "branchThickness", Api570UnitFieldSnapshot>;
  engineInput: Api570FilletWeldInputSI;
}

export interface Api570TensionTestInputSnapshot {
  calculatorId: "tension-test";
  unitSystem: UnitSystem;
  fields: Record<"radius" | "diameter" | "width" | "thickness" | "manualArea" | "testLoad" | "targetStrength", Api570UnitFieldSnapshot>;
  areaSource: Api570TensionAreaSource;
  engineInput: Api570TensionTestInputSI;
}

export interface Api570SoilResistivityInputSnapshot {
  calculatorId: "soil-resistivity";
  unitSystem: UnitSystem;
  fields: Record<"pinSpacing" | "resistance", Api570UnitFieldSnapshot>;
  engineInput: Api570SoilResistivityInputSI;
}

export type Api570InputSnapshot =
  | Api570PipingInputSnapshot
  | Api570TubeInputSnapshot
  | Api570HeaderInputSnapshot
  | Api570PressureDesignInputSnapshot
  | Api570ValveFittingsInputSnapshot
  | Api570HydroTestInputSnapshot
  | Api570FlangeHydroTestInputSnapshot
  | Api570PneumaticTestInputSnapshot
  | Api570FilletWeldInputSnapshot
  | Api570TensionTestInputSnapshot
  | Api570SoilResistivityInputSnapshot;
export type Api570ResultSnapshot =
  | Api570PipingResultSI
  | Api570TubeResultSI
  | Api570HeaderResultSI
  | Api570PressureDesignResultSI
  | Api570ValveFittingsResultSI
  | Api570HydroTestResultSI
  | Api570FlangeHydroTestResultSI
  | Api570PneumaticTestResultSI
  | Api570FilletWeldResultSI
  | Api570TensionTestResultSI
  | Api570SoilResistivityResultSI;

export interface SavedApi570Calculation {
  id: string;
  projectId: string;
  standard: "API 570";
  calculatorId: Api570CalculatorId;
  assetTag: string;
  assetName: string;
  title: string;
  status: CalculationWorkflowStatus;
  workflow: CalculationWorkflow;
  inputs: Api570InputSnapshot;
  result: Api570ResultSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface LocalEquipment {
  id: string;
  tag: string;
  name: string;
  type: "pressure-vessel";
  calculations: SavedApi510Calculation[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  client: string;
  site: string;
  description: string;
  status: "active" | "archived";
  equipment: LocalEquipment[];
  api570Calculations: SavedApi570Calculation[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalWorkspaceV1 {
  schemaVersion: 1;
  projects: LocalProject[];
}

export interface WorkspaceBackupEnvelopeV1 {
  format: "api-calc-pro-workspace-backup";
  backupVersion: 1;
  schemaVersion: 1;
  scope: "workspace" | "project";
  exportedAt: string;
  appVersion: string;
  projects: LocalProject[];
}

export interface WorkspaceBackupSummary {
  scope: WorkspaceBackupEnvelopeV1["scope"];
  exportedAt: string;
  projectCount: number;
  equipmentCount: number;
  calculationCount: number;
}

export interface WorkspaceBackupPreview extends WorkspaceBackupSummary {
  addedProjects: number;
  matchedProjects: number;
  addedEquipment: number;
  addedCalculations: number;
  duplicateCalculations: number;
  raw: string;
}

export interface WorkspaceImportResult extends Omit<WorkspaceBackupPreview, "raw"> {}

export interface CreateProjectInput {
  name: string;
  client?: string;
  site?: string;
  description?: string;
}

export interface SaveCalculationInput {
  projectId: string;
  equipmentId?: string;
  equipmentTag: string;
  equipmentName?: string;
  calculationId?: string;
  title: string;
  status: "draft";
  preparedBy: string;
  changeNote?: string;
  inputs: Api510InputSnapshot;
  result: Api510ResultSnapshot;
}

export interface SaveApi570CalculationInput {
  projectId: string;
  calculationId?: string;
  calculatorId: Api570CalculatorId;
  assetTag: string;
  assetName?: string;
  title: string;
  status: "draft";
  preparedBy: string;
  changeNote?: string;
  inputs: Api570InputSnapshot;
  result: Api570ResultSnapshot;
}

export interface ReviewApi570CalculationInput {
  projectId: string;
  calculationId: string;
  reviewerName: string;
  reviewNotes?: string;
  fingerprint: string;
}

export interface ApproveApi570CalculationInput {
  projectId: string;
  calculationId: string;
  approverName: string;
  approvalNotes?: string;
  fingerprint: string;
}

export interface ReviewCalculationInput {
  projectId: string;
  equipmentId: string;
  calculationId: string;
  reviewerName: string;
  reviewNotes?: string;
  fingerprint: string;
}

export interface ApproveCalculationInput {
  projectId: string;
  equipmentId: string;
  calculationId: string;
  approverName: string;
  approvalNotes?: string;
  fingerprint: string;
}
