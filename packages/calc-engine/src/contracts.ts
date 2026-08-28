export type CalculationIssueSeverity = "error" | "warning";

export type CylindricalShellField =
  | "insideDiameterMm"
  | "diameterOrShortSpanMm"
  | "crownRadiusMm"
  | "sphericalRadiusMm"
  | "outsideDiameterMm"
  | "halfApexAngleDeg"
  | "attachmentFactor"
  | "designPressureMpa"
  | "allowableStressMpa"
  | "jointEfficiency"
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "minimumThicknessMm"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "nextInspectionYears"
  | "calculation";

export type Api570PipingField =
  | "pipingCode"
  | "outsideDiameterMm"
  | "designPressureMpa"
  | "allowableStressMpa"
  | "longitudinalQualityFactor"
  | "weldStrengthReductionFactor"
  | "yCoefficient"
  | "allowanceMm"
  | "designFactor"
  | "temperatureDeratingFactor"
  | "hydrogenMaterialFactor"
  | "hydrogenFactor"
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "structuralMinimumThicknessMm"
  | "minimumThicknessMm"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "nextInspectionYears"
  | "calculation";

export type Api570TubeField =
  | "outsideDiameterMm"
  | "designPressureMpa"
  | "allowableStressMpa"
  | "weldStrengthReductionFactor"
  | "endCondition"
  | "expandedEndThicknessFactorMm"
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "minimumThicknessMm"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "nextInspectionYears"
  | "calculation";

export type Api570HeaderField =
  | "outsideDiameterMm"
  | "designPressureMpa"
  | "allowableStressMpa"
  | "jointEfficiency"
  | "yCoefficient"
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "minimumThicknessMm"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "nextInspectionYears"
  | "calculation";

export type Api570PressureDesignField =
  | "outsideDiameterMm"
  | "designPressureMpa"
  | "allowableStressMpa"
  | "qualityFactor"
  | "availableCorrodedThicknessMm"
  | "calculation";

export type Api570ValveFittingsField =
  | "assessmentBasis"
  | "componentRatedPressureMpa"
  | "codeRequiredThicknessMm"
  | "outsideDiameterMm"
  | "designPressureMpa"
  | "allowableStressMpa"
  | "qualityFactor"
  | "allowanceMm"
  | "availableWallThicknessMm"
  | "calculation";

export type Api570HydroTestField =
  | "designPressureMpa"
  | "allowableStressDesignMpa"
  | "allowableStressTestMpa"
  | "manualStressRatio"
  | "calculation";

export type Api570FlangeHydroTestField =
  | "pressureRating38CMpa"
  | "pressureRating100FMpa"
  | "nominalPipeSizeMm"
  | "calculation";

export type Api570PneumaticTestField =
  | "pipingCode"
  | "designPressureMpa"
  | "testFactor"
  | "calculation";

export type Api570FilletWeldField =
  | "knownThroatMm"
  | "knownLegMm"
  | "pipeThicknessMm"
  | "hubThicknessMm"
  | "branchThicknessMm"
  | "calculation";

export type Api570TensionTestField =
  | "turnedSpecimenRadiusMm"
  | "turnedSpecimenDiameterMm"
  | "reducedSpecimenWidthMm"
  | "reducedSpecimenThicknessMm"
  | "manualAreaMm2"
  | "testLoadKn"
  | "targetTensileStrengthMpa"
  | "areaSource"
  | "calculation";

export type Api570SoilResistivityField =
  | "pinSpacingM"
  | "resistanceOhm"
  | "calculation";

export type Api653BottomPlateField =
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "bottomRemainingThicknessMm"
  | "previousInternalPittingRemainingThicknessMm"
  | "internalPittingRemainingThicknessMm"
  | "minimumThicknessMm"
  | "minimumThicknessBasis"
  | "projectionYears"
  | "topSideCorrosionRateMmPerYear"
  | "undersideCorrosionRateMmPerYear"
  | "lowerShellMinimumThicknessMm"
  | "criticalZoneActualThicknessMm"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "calculation";

export type Api653AnnularPlateField = Api653BottomPlateField
  | "actualThicknessMm"
  | "diameterM"
  | "liquidHeightM"
  | "firstShellThicknessMm"
  | "specificGravity"
  | "highSpecificGravityBasisConfirmed"
  | "calculatedStressMode"
  | "manualCalculatedStressMpa"
  | "minimumThicknessMode"
  | "manualMinimumThicknessMm";

export type Api653ShellCourseField =
  | "diameterM"
  | "totalHeightM"
  | "specificGravity"
  | "jointEfficiency"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "courses"
  | "courseHeightM"
  | "materialId"
  | "productStressMpa"
  | "hydroStressMpa"
  | "asBuiltThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "calculation";

export type Api653NozzleField =
  | "material"
  | "operatingTemperatureC"
  | "pressureClass"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "nozzles"
  | "nominalPipeSizeIn"
  | "minimumThicknessMode"
  | "manualMinimumThicknessMm"
  | "pressureMinimumThicknessMm"
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "calculation";

export type Api653RoofPlateField =
  | "roofType"
  | "minimumThicknessBasis"
  | "areaAverageConfirmed"
  | "holesPresent"
  | "originalThicknessMm"
  | "previousThicknessMm"
  | "actualThicknessMm"
  | "minimumThicknessMm"
  | "yearsInService"
  | "yearsSincePreviousInspection"
  | "calculation";

export type Api653Other432Field =
  | "diameterM"
  | "leastThicknessMm"
  | "minimumRequiredThicknessMm"
  | "corrosionAllowanceMm"
  | "profileThicknessesMm"
  | "deepestPitRemainingThicknessMm"
  | "pitDimensionSumMm"
  | "criticalLengthMode"
  | "manualCriticalLengthMm"
  | "averageThicknessMode"
  | "manualAverageThicknessMm"
  | "adjustedMinimumMode"
  | "manualAdjustedMinimumMm"
  | "adjustedSixtyPercentMode"
  | "manualAdjustedSixtyPercentMm"
  | "calculation";

export type CalculationField = CylindricalShellField | Api570PipingField | Api570TubeField | Api570HeaderField | Api570PressureDesignField | Api570ValveFittingsField | Api570HydroTestField | Api570FlangeHydroTestField | Api570PneumaticTestField | Api570FilletWeldField | Api570TensionTestField | Api570SoilResistivityField | Api653BottomPlateField | Api653AnnularPlateField | Api653ShellCourseField | Api653NozzleField | Api653RoofPlateField | Api653Other432Field;

export interface CalculationIssue {
  code: string;
  field: CalculationField;
  severity: CalculationIssueSeverity;
  message: string;
}

export type Api653BottomCorrosionRateMode = "auto" | "manual";
export type Api653BottomMinimumThicknessBasis = "table-4.4-standard" | "table-4.4-reduced" | "manual-controlled";

export interface Api653BottomPlateInputSI {
  originalThicknessMm: number;
  previousThicknessMm: number;
  bottomRemainingThicknessMm: number;
  previousInternalPittingRemainingThicknessMm: number;
  internalPittingRemainingThicknessMm: number;
  minimumThicknessBasis: Api653BottomMinimumThicknessBasis;
  reducedMinimumCriteriaConfirmed: boolean;
  manualMinimumThicknessMm: number;
  projectionYears: number;
  undersideCorrosionRateMode: Api653BottomCorrosionRateMode;
  manualUndersideCorrosionRateMmPerYear: number;
  topSideCorrosionRateMode: Api653BottomCorrosionRateMode;
  manualTopSideCorrosionRateMmPerYear: number;
  lowerShellMinimumThicknessMm: number;
  criticalZoneActualThicknessMm: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
}

export interface Api653BottomPlateResultSI {
  engineId: "api653.bottom-plate";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  originalThicknessMmUsed: number;
  previousThicknessMmUsed: number;
  bottomRemainingThicknessMmUsed: number;
  previousInternalPittingRemainingThicknessMmUsed: number;
  internalPittingRemainingThicknessMmUsed: number;
  minimumThicknessBasis: Api653BottomMinimumThicknessBasis;
  minimumThicknessMmUsed: number;
  projectionYearsUsed: number;
  yearsInServiceUsed: number;
  yearsSincePreviousInspectionUsed: number;
  automaticUndersideCorrosionRateMmPerYear: number;
  undersideCorrosionRateMmPerYear: number;
  automaticTopSideCorrosionRateMmPerYear: number;
  topSideCorrosionRateMmPerYear: number;
  combinedCorrosionRateMmPerYear: number;
  projectedMinimumRemainingThicknessMm: number;
  lowerShellMinimumThicknessMmUsed: number;
  criticalZoneActualThicknessMmUsed: number;
  criticalZoneMinimumThicknessMm: number;
  criticalZoneAdequate: boolean;
  maximumCorrosionRateLongMmPerYear: number;
  maximumCorrosionRateShortMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  governingThicknessMm: number;
  availableThicknessMm: number;
  remainingLifeYears: number;
}

export type Api653AnnularMinimumThicknessMode = "auto" | "manual";
export type Api653AnnularCalculatedStressMode = "auto" | "manual";

export interface Api653AnnularPlateInputSI {
  diameterM: number;
  liquidHeightM: number;
  firstShellThicknessMm: number;
  specificGravity: number;
  highSpecificGravityBasisConfirmed: boolean;
  calculatedStressMode: Api653AnnularCalculatedStressMode;
  manualCalculatedStressMpa: number;
  minimumThicknessMode: Api653AnnularMinimumThicknessMode;
  manualMinimumThicknessMm: number;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
}

export interface Api653AnnularStressResultSI {
  ok: boolean;
  issues: CalculationIssue[];
  diameterMUsed: number;
  liquidHeightMUsed: number;
  firstShellThicknessMmUsed: number;
  effectiveHeightFt: number;
  calculatedStressPsi: number;
  calculatedStressMpa: number;
}

export interface Api653AnnularMinimumSelectionSI {
  ok: boolean;
  issues: CalculationIssue[];
  effectiveProductHeightM: number;
  valueMm: number | null;
  tableLabel: string | null;
  rowLabel: string | null;
  columnLabel: string | null;
  message: string;
}

export interface Api653AnnularPlateResultSI {
  engineId: "api653.annular-plate";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  originalThicknessMmUsed: number;
  previousThicknessMmUsed: number;
  actualThicknessMmUsed: number;
  minimumThicknessMmUsed: number;
  yearsInServiceUsed: number;
  yearsSincePreviousInspectionUsed: number;
  metalLossLongMm: number;
  metalLossShortMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  maximumCorrosionRateLongMmPerYear: number;
  maximumCorrosionRateShortMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  governingThicknessMm: number;
  availableThicknessMm: number;
  remainingLifeYears: number;
  diameterMUsed: number;
  liquidHeightMUsed: number;
  firstShellThicknessMmUsed: number;
  specificGravityUsed: number;
  effectiveHeightFt: number;
  effectiveProductHeightM: number;
  calculatedStressMode: Api653AnnularCalculatedStressMode;
  automaticCalculatedStressPsi: number;
  automaticCalculatedStressMpa: number;
  calculatedStressPsi: number;
  calculatedStressMpa: number;
  minimumThicknessMode: Api653AnnularMinimumThicknessMode;
  automaticMinimumThicknessMm: number | null;
  minimumSelectionTableLabel: string | null;
  minimumSelectionRowLabel: string | null;
  minimumSelectionColumnLabel: string | null;
  minimumSelectionMessage: string;
}

export type Api653ShellStressMode = "auto" | "manual";

export interface Api653ShellMaterialRecord {
  id: string;
  label: string;
  yieldStressMpa?: number;
  tensileStressMpa?: number;
  productStressLowerMpa?: number;
  productStressUpperMpa?: number;
  hydroStressLowerMpa?: number;
  hydroStressUpperMpa?: number;
}

export interface Api653ShellCourseInputSI {
  courseIndex: number;
  courseHeightM: number;
  materialId: string;
  productStressMode: Api653ShellStressMode;
  manualProductStressMpa: number;
  hydroStressMode: Api653ShellStressMode;
  manualHydroStressMpa: number;
  asBuiltThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
}

export interface Api653ShellAssessmentInputSI {
  diameterM: number;
  totalHeightM: number;
  specificGravity: number;
  jointEfficiency: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
  courses: Api653ShellCourseInputSI[];
}

export interface Api653ShellStressRuleSI {
  formulaLabel: string;
  governingTerm: string;
  yieldStressMpa: number;
  tensileStressMpa: number;
  rawStressMpa: number;
  roundedStressMpa: number;
}

export interface Api653ShellCourseResultSI {
  courseIndex: number;
  courseHeightMUsed: number;
  heightToTopM: number;
  effectiveCourseHeightM: number;
  materialId: string;
  materialLabel: string;
  productStressMode: Api653ShellStressMode;
  hydroStressMode: Api653ShellStressMode;
  automaticProductStressMpa: number | null;
  automaticHydroStressMpa: number | null;
  productStressMpaUsed: number;
  hydroStressMpaUsed: number;
  productStressRule: Api653ShellStressRuleSI | null;
  hydroStressRule: Api653ShellStressRuleSI | null;
  asBuiltThicknessMmUsed: number;
  previousThicknessMmUsed: number;
  actualThicknessMmUsed: number;
  calculatedMinimumThicknessMm: number;
  minimumThicknessMm: number;
  minimumThicknessFloorApplied: boolean;
  hydrostaticTestHeightM: number;
  operatingFillHeightM: number;
  hydrostaticHeightAdequate: boolean;
  operatingFillHeightAdequate: boolean;
  corrosionAllowanceMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  remainingLifeYears: number;
}

export interface Api653ShellAssessmentResultSI {
  engineId: "api653.shell-course";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  diameterMUsed: number;
  totalHeightMUsed: number;
  specificGravityUsed: number;
  jointEfficiencyUsed: number;
  yearsInServiceUsed: number;
  yearsSincePreviousInspectionUsed: number;
  courses: Api653ShellCourseResultSI[];
  minimumRemainingLifeYears: number;
  governingRemainingLifeCourseIndex: number | null;
  maximumCorrosionRateMmPerYear: number;
  governingCorrosionRateCourseIndex: number | null;
  limitingOperatingFillHeightM: number;
  limitingOperatingFillCourseIndex: number | null;
}

export type Api653NozzleMaterial = "carbon steel" | "stainless steel" | "1-1/4cr-1/2mo";
export type Api653NozzlePressureClass = "150" | "300" | "600" | "900" | "1500" | "2500";
export type Api653NozzleMinimumThicknessMode = "auto" | "manual";

export interface Api653NozzleInputSI {
  nozzleIndex: number;
  detail: string;
  nominalPipeSizeIn: string;
  minimumThicknessMode: Api653NozzleMinimumThicknessMode;
  manualMinimumThicknessMm: number;
  pressureMinimumThicknessMm: number;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
}

export interface Api653NozzleAssessmentInputSI {
  material: Api653NozzleMaterial;
  operatingTemperatureC: number;
  pressureClass: Api653NozzlePressureClass;
  yearsInService: number;
  yearsSincePreviousInspection: number;
  nozzles: Api653NozzleInputSI[];
}

export interface Api653NozzleMinimumSelectionSI {
  available: boolean;
  material: Api653NozzleMaterial;
  materialLabel: string;
  operatingTemperatureC: number;
  pressureClass: Api653NozzlePressureClass;
  selectedSizeIn: string;
  lookupSizeIn: string | null;
  usedLowestValue: boolean;
  usedNextLowerValue: boolean;
  valueMm: number | null;
  tableId: string | null;
  tableTemperatureLabel: string | null;
  message: string;
}

export interface Api653NozzleResultSI {
  nozzleIndex: number;
  detail: string;
  active: boolean;
  nominalPipeSizeIn: string;
  minimumThicknessMode: Api653NozzleMinimumThicknessMode;
  automaticMinimumThicknessMm: number | null;
  structuralMinimumThicknessMmUsed: number;
  pressureMinimumThicknessMmUsed: number;
  governingMinimumBasis: "structural" | "pressure";
  minimumThicknessMmUsed: number;
  minimumSelection: Api653NozzleMinimumSelectionSI;
  originalThicknessMmUsed: number;
  previousThicknessMmUsed: number;
  actualThicknessMmUsed: number;
  corrosionAllowanceMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  remainingLifeYears: number | null;
}

export interface Api653NozzleAssessmentResultSI {
  engineId: "api653.nozzle";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  material: Api653NozzleMaterial;
  materialLabel: string;
  operatingTemperatureCUsed: number;
  pressureClass: Api653NozzlePressureClass;
  yearsInServiceUsed: number;
  yearsSincePreviousInspectionUsed: number;
  nozzles: Api653NozzleResultSI[];
  assessedNozzleCount: number;
  minimumRemainingLifeYears: number | null;
  minimumRemainingLifeNozzleIndex: number | null;
  maximumRemainingLifeYears: number | null;
  maximumCorrosionRateMmPerYear: number;
  maximumCorrosionRateNozzleIndex: number | null;
  hasOpenEndedRemainingLife: boolean;
}

export interface Api653RoofPlateInputSI {
  roofType: "supported-cone" | "self-supporting" | "other";
  minimumThicknessBasis: "api653-2.2mm-area-average" | "manual-controlled";
  areaAverageConfirmed: boolean;
  holesPresent: boolean;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  minimumThicknessMm: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
}

export interface Api653RoofPlateResultSI {
  engineId: "api653.roof-plate";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  roofType: "supported-cone" | "self-supporting" | "other";
  minimumThicknessBasis: "api653-2.2mm-area-average" | "manual-controlled";
  areaAverageConfirmed: boolean;
  holesPresent: boolean;
  originalThicknessMmUsed: number;
  previousThicknessMmUsed: number;
  actualThicknessMmUsed: number;
  minimumThicknessMmUsed: number;
  yearsInServiceUsed: number;
  yearsSincePreviousInspectionUsed: number;
  longTermMetalLossMm: number;
  thicknessLossSincePreviousMm: number;
  corrosionAllowanceMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  remainingLifeYears: number;
  remainingLifeOpenEnded: boolean;
  remainingLifeOver99Years: boolean;
  belowProtectedAlertThreshold: boolean;
}

export type Api653Other432ValueMode = "auto" | "manual";
export type Api653Other432CheckStatus = "pass" | "fail" | "pending";
export type Api653Other432PitStatus = Api653Other432CheckStatus | "optional";

export interface Api653Other432InputSI {
  diameterM: number;
  leastThicknessMm: number;
  minimumRequiredThicknessMm: number;
  corrosionAllowanceMm: number;
  profileThicknessesMm: readonly number[];
  deepestPitRemainingThicknessMm: number | null;
  pitDimensionSumMm: number | null;
  criticalLengthMode: Api653Other432ValueMode;
  manualCriticalLengthMm: number;
  averageThicknessMode: Api653Other432ValueMode;
  manualAverageThicknessMm: number;
  adjustedMinimumMode: Api653Other432ValueMode;
  manualAdjustedMinimumMm: number;
  adjustedSixtyPercentMode: Api653Other432ValueMode;
  manualAdjustedSixtyPercentMm: number;
}

export interface Api653Other432ResultSI {
  engineId: "api653.other-4-3-2";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  diameterMUsed: number;
  leastThicknessMmUsed: number;
  minimumRequiredThicknessMmUsed: number;
  corrosionAllowanceMmUsed: number;
  profileThicknessesMmUsed: number[];
  hasAllProfilePoints: boolean;
  deepestPitRemainingThicknessMmUsed: number | null;
  pitDimensionSumMmUsed: number | null;
  automaticCriticalLengthRawMm: number;
  automaticCriticalLengthMm: number;
  criticalLengthMode: Api653Other432ValueMode;
  criticalLengthMmUsed: number;
  criticalLengthCapApplied: boolean;
  automaticAverageThicknessMm: number;
  averageThicknessMode: Api653Other432ValueMode;
  averageThicknessMmUsed: number;
  automaticAdjustedMinimumMm: number;
  adjustedMinimumMode: Api653Other432ValueMode;
  adjustedMinimumMmUsed: number;
  automaticAdjustedSixtyPercentMm: number;
  adjustedSixtyPercentMode: Api653Other432ValueMode;
  adjustedSixtyPercentMmUsed: number;
  check1Status: Api653Other432CheckStatus;
  check2Status: Api653Other432CheckStatus;
  pitCheckAReady: boolean;
  pitCheckAPass: boolean;
  pitCheckBReady: boolean;
  pitCheckBPass: boolean;
  pitStatus: Api653Other432PitStatus;
  overallStatus: Api653Other432CheckStatus;
}

export type Api570PipingCode =
  | "b31.1"
  | "b31.2"
  | "b31.3"
  | "b31.4"
  | "b31.5"
  | "b31.6"
  | "b31.7"
  | "b31.8"
  | "b31.8s"
  | "b31.9"
  | "b31.10"
  | "b31.11"
  | "b31.12-ip"
  | "b31.12-pl";

export interface Api570PipingInputSI {
  pipingCode: Api570PipingCode;
  outsideDiameterMm: number;
  designPressureMpa: number;
  allowableStressMpa: number;
  longitudinalQualityFactor: number;
  weldStrengthReductionFactor?: number;
  yCoefficient?: number;
  allowanceMm?: number;
  designFactor?: number;
  temperatureDeratingFactor?: number;
  hydrogenMaterialFactor?: number;
  hydrogenFactor?: number;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  structuralMinimumThicknessMm?: number;
  minimumThicknessMm?: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
  nextInspectionYears: number;
}

export interface Api570PipingResultSI {
  engineId: "api570.piping";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  pipingCode: Api570PipingCode;
  codeLabel: string;
  codeStatus: string;
  intervalYears: number;
  pressureDesignThicknessMm: number;
  requiredThicknessMm: number;
  structuralMinimumThicknessMm: number;
  automaticMinimumThicknessMm: number;
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

export type Api570TubeEndCondition = "welded" | "expanded";

export interface Api570TubeInputSI {
  outsideDiameterMm: number;
  designPressureMpa: number;
  allowableStressMpa: number;
  weldStrengthReductionFactor?: number;
  endCondition: Api570TubeEndCondition;
  expandedEndThicknessFactorMm?: number;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  minimumThicknessMm?: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
  nextInspectionYears: number;
}

export interface Api570TubeResultSI {
  engineId: "api570.tube";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  endCondition: Api570TubeEndCondition;
  intervalYears: number;
  expandedEndThicknessFactorUsedMm: number;
  requiredThicknessMm: number;
  automaticMinimumThicknessMm: number;
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

export interface Api570HeaderInputSI {
  outsideDiameterMm: number;
  designPressureMpa: number;
  allowableStressMpa: number;
  jointEfficiency?: number;
  yCoefficient?: number;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  minimumThicknessMm?: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
  nextInspectionYears: number;
}

export interface Api570HeaderResultSI {
  engineId: "api570.header";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  intervalYears: number;
  jointEfficiencyUsed: number;
  yCoefficientUsed: number;
  requiredThicknessMm: number;
  automaticMinimumThicknessMm: number;
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

export interface Api570PressureDesignInputSI {
  outsideDiameterMm: number;
  designPressureMpa: number;
  allowableStressMpa: number;
  qualityFactor?: number;
  availableCorrodedThicknessMm: number;
}

export interface Api570PressureDesignResultSI {
  engineId: "api570.support.pressure-design";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  qualityFactorUsed: number;
  requiredThicknessMm: number;
  allowableWorkingPressureMpa: number;
}

export type Api570ValveFittingsAssessmentBasis = "listed-rating" | "code-derived-thickness" | "screening-only";

export interface Api570ValveFittingsInputSI {
  assessmentBasis: Api570ValveFittingsAssessmentBasis;
  componentRatedPressureMpa?: number;
  codeRequiredThicknessMm?: number;
  outsideDiameterMm: number;
  designPressureMpa: number;
  allowableStressMpa: number;
  qualityFactor?: number;
  allowanceMm?: number;
  availableWallThicknessMm: number;
}

export interface Api570ValveFittingsResultSI {
  engineId: "api570.support.valve-flanged-fittings";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  assessmentBasis: Api570ValveFittingsAssessmentBasis;
  assessmentStatus: "complete" | "screening";
  componentRatedPressureMpaUsed: number;
  codeRequiredThicknessMmUsed: number;
  componentAdequate: boolean | null;
  qualityFactorUsed: number;
  allowanceUsedMm: number;
  netAvailableThicknessMm: number;
  pressureDesignThicknessMm: number;
  minimumRequiredThicknessMm: number;
  allowableWorkingPressureMpa: number;
}

export interface Api570HydroTestInputSI {
  designPressureMpa: number;
  allowableStressDesignMpa?: number;
  allowableStressTestMpa?: number;
  manualStressRatio?: number;
}

export interface Api570HydroTestResultSI {
  engineId: "api570.support.hydro-test-pressure";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  calculatedStressRatio: number;
  stressRatioUsed: number;
  stressRatioSource: "manual" | "stress-ratio" | "default";
  minimumHydroTestPressureMpa: number;
}

export interface Api570FlangeHydroTestInputSI {
  pressureRating38CMpa?: number;
  pressureRating100FMpa?: number;
  nominalPipeSizeMm?: number;
}

export interface Api570FlangeHydroTestResultSI {
  engineId: "api570.support.flange-hydro-test";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  pressureRating38CBarUsed: number;
  pressureRating100FPsiUsed: number;
  nominalPipeSizeInUsed: number;
  hydroTestPressureBar: number;
  hydroTestPressurePsi: number;
  metricHydroTestPressureMpa: number;
  usHydroTestPressureMpa: number;
  minimumTestDurationSeconds: number;
}

export type Api570PneumaticTestCode = "asme-b31.3" | "asme-b31.1" | "manual-controlled";

export interface Api570PneumaticTestInputSI {
  pipingCode: Api570PneumaticTestCode;
  designPressureMpa: number;
  testFactor?: number;
}

export interface Api570PneumaticTestResultSI {
  engineId: "api570.support.pneumatic-test-pressure";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  pipingCode: Api570PneumaticTestCode;
  codeLabel: string;
  designPressureMpaUsed: number;
  testFactorUsed: number;
  minimumPneumaticTestPressureMpa: number;
  maximumPneumaticTestPressureMpa: number;
  pneumaticTestPressureMpa: number;
}

export interface Api570FilletWeldInputSI {
  knownThroatMm?: number;
  knownLegMm?: number;
  pipeThicknessMm?: number;
  hubThicknessMm?: number;
  branchThicknessMm?: number;
}

export type Api570FilletWeldXminSource = "pipe-thickness" | "hub-thickness" | "equal" | "none";

export interface Api570FilletWeldResultSI {
  engineId: "api570.support.fillet-weld-sizing";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  knownThroatMmUsed: number;
  knownLegMmUsed: number;
  pipeThicknessMmUsed: number;
  hubThicknessMmUsed: number;
  branchThicknessMmUsed: number;
  legFromThroatMm: number;
  throatFromLegMm: number;
  pipeThicknessCandidateMm: number;
  slipOnFlangeXminMm: number;
  slipOnFlangeXminSource: Api570FilletWeldXminSource;
  uncappedBranchThroatMm: number;
  branchThroatTcMm: number;
  branchThroatCappedAt6Mm: boolean;
}

export type Api570TensionAreaSource = "auto" | "tsa" | "rsa" | "manual";
export type Api570TensionResolvedAreaSource = "tsa" | "rsa" | "manual" | "none";

export interface Api570TensionTestInputSI {
  turnedSpecimenRadiusMm?: number;
  turnedSpecimenDiameterMm?: number;
  reducedSpecimenWidthMm?: number;
  reducedSpecimenThicknessMm?: number;
  manualAreaMm2?: number;
  areaSource: Api570TensionAreaSource;
  testLoadKn?: number;
  targetTensileStrengthMpa?: number;
}

export interface Api570TensionTestResultSI {
  engineId: "api570.support.tension-test";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  effectiveTurnedRadiusMm: number;
  effectiveTurnedRadiusSource: "radius" | "diameter" | "none";
  turnedSpecimenAreaMm2: number;
  reducedSpecimenAreaMm2: number;
  manualAreaMm2Used: number;
  requestedAreaSource: Api570TensionAreaSource;
  resolvedAreaSource: Api570TensionResolvedAreaSource;
  selectedAreaMm2: number;
  testLoadKnUsed: number;
  targetTensileStrengthMpaUsed: number;
  tensileStrengthMpa: number;
  requiredLoadKn: number;
}

export interface Api570SoilResistivityInputSI {
  pinSpacingM: number;
  resistanceOhm: number;
}

export interface Api570SoilResistivityResultSI {
  engineId: "api570.support.soil-resistivity";
  engineVersion: "0.1.0-original-web-parity";
  ok: boolean;
  issues: CalculationIssue[];
  pinSpacingMUsed: number;
  resistanceOhmUsed: number;
  soilResistivityOhmM: number;
  soilResistivityOhmCm: number;
}

/**
 * API Calc Pro engine boundary for the cylindrical-shell workflow.
 * All values are normalized to SI units before entering the engine.
 */
export interface CylindricalShellInputSI {
  insideDiameterMm: number;
  designPressureMpa: number;
  allowableStressMpa: number;
  jointEfficiency: number;
  originalThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  minimumThicknessMm?: number;
  yearsInService: number;
  yearsSincePreviousInspection: number;
  nextInspectionYears: number;
}

export type GoverningCase = "circumferential" | "longitudinal" | "equal" | "none";

export interface CylindricalShellResultSI {
  engineId: "api510.cylindrical-shell";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
  intervalYears: number;
  circumferentialRequiredThicknessMm: number;
  longitudinalRequiredThicknessMm: number;
  requiredThicknessMm: number;
  governingThicknessCase: GoverningCase;
  minimumThicknessUsedMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  governingCorrosionRateMmPerYear: number;
  corrosionAllowanceMm: number;
  remainingLifeYears: number;
  circumferentialMawpMpa: number;
  longitudinalMawpMpa: number;
  governingMawpMpa: number;
  governingMawpCase: GoverningCase;
  hydrostaticTestPressureMpa: number;
  pneumaticTestPressureMpa: number;
  projectedThicknessMm: number;
  futureMawpThicknessMm: number;
  futureMawpMpa: number;
}

export interface SphericalShellResultSI {
  engineId: "api510.spherical-shell";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
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

export interface EllipsoidalHeadResultSI {
  engineId: "api510.ellipsoidal-head";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
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

export interface TorisphericalHeadInputSI extends Omit<CylindricalShellInputSI, "insideDiameterMm"> {
  crownRadiusMm: number;
}

export interface TorisphericalHeadResultSI {
  engineId: "api510.torispherical-head";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
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

export interface HemisphericalHeadInputSI extends Omit<CylindricalShellInputSI, "insideDiameterMm"> {
  sphericalRadiusMm: number;
}

export interface HemisphericalHeadResultSI {
  engineId: "api510.hemispherical-head";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
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

export interface ConicalHeadInputSI extends Omit<CylindricalShellInputSI, "insideDiameterMm"> {
  outsideDiameterMm: number;
  halfApexAngleDeg: number;
}

export interface ConicalHeadResultSI {
  engineId: "api510.conical-head";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
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

export interface FlatCircularHeadInputSI extends Omit<CylindricalShellInputSI, "insideDiameterMm"> {
  diameterOrShortSpanMm: number;
  attachmentFactor: number;
}

export interface FlatCircularHeadResultSI {
  engineId: "api510.flat-circular-head";
  engineVersion: "0.1.0-legacy-parity";
  ok: boolean;
  issues: CalculationIssue[];
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
