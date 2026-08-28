import { useMemo, useState } from "react";
import {
  calculateApi653AnnularPlate,
  calculateApi653BottomPlate,
  convertBetweenUnits,
  convertFromSI,
  convertSIToUnit,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api653AnnularPlateInputSI,
  Api653BottomCorrosionRateMode,
  Api653BottomMinimumThicknessBasis,
  Api653BottomPlateInputSI,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";

type UnitFieldId = "tankDiameter" | "liquidHeight" | "firstShellThickness" | "calculatedStress" | "originalThickness" | "previousThickness" | "actualThickness" | "minimumThickness" | "pittingDepth" | "previousInternalPitting" | "internalPitting" | "undersideRate" | "topSideRate" | "lowerShellMinimum" | "criticalZoneActual";
type UnitFieldState = { value: string; unit: EngineeringUnit; quantity: EngineeringQuantity };
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const lengthUnits = listEngineeringUnitOptions("length");
const pressureUnits = listEngineeringUnitOptions("pressure");
const currentYear = new Date().getFullYear();

export type Api653PlateVariant = "bottom" | "annular";

function initialUnitFields(variant: Api653PlateVariant): UnitFieldMap {
  return variant === "annular" ? {
    tankDiameter: { value: "30", unit: "m", quantity: "length" },
    liquidHeight: { value: "18", unit: "m", quantity: "length" },
    firstShellThickness: { value: "20", unit: "mm", quantity: "length" },
    calculatedStress: { value: "117.081", unit: "MPa", quantity: "pressure" },
    originalThickness: { value: "10", unit: "mm", quantity: "length" },
    previousThickness: { value: "9.3", unit: "mm", quantity: "length" },
    actualThickness: { value: "8.8", unit: "mm", quantity: "length" },
    minimumThickness: { value: "4.32", unit: "mm", quantity: "length" },
    pittingDepth: { value: "1", unit: "mm", quantity: "length" },
    previousInternalPitting: { value: "9.4", unit: "mm", quantity: "length" },
    internalPitting: { value: "9", unit: "mm", quantity: "length" },
    undersideRate: { value: "0.1", unit: "mm", quantity: "length" },
    topSideRate: { value: "0.08", unit: "mm", quantity: "length" },
    lowerShellMinimum: { value: "6", unit: "mm", quantity: "length" },
    criticalZoneActual: { value: "5", unit: "mm", quantity: "length" },
  } : {
    tankDiameter: { value: "30", unit: "m", quantity: "length" },
    liquidHeight: { value: "18", unit: "m", quantity: "length" },
    firstShellThickness: { value: "20", unit: "mm", quantity: "length" },
    calculatedStress: { value: "117.081", unit: "MPa", quantity: "pressure" },
    originalThickness: { value: "8", unit: "mm", quantity: "length" },
    previousThickness: { value: "7.4", unit: "mm", quantity: "length" },
    actualThickness: { value: "7", unit: "mm", quantity: "length" },
    minimumThickness: { value: "2.54", unit: "mm", quantity: "length" },
    pittingDepth: { value: "1.2", unit: "mm", quantity: "length" },
    previousInternalPitting: { value: "7.2", unit: "mm", quantity: "length" },
    internalPitting: { value: "6.8", unit: "mm", quantity: "length" },
    undersideRate: { value: "0.08", unit: "mm", quantity: "length" },
    topSideRate: { value: "0.08", unit: "mm", quantity: "length" },
    lowerShellMinimum: { value: "6", unit: "mm", quantity: "length" },
    criticalZoneActual: { value: "4", unit: "mm", quantity: "length" },
  };
}

function numberFrom(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : "";
}

function unitValue(field: UnitFieldState): number {
  return convertUnitToSI(numberFrom(field.value), field.quantity, field.unit);
}

function defaultUnitForField(fieldId: UnitFieldId, field: UnitFieldState, unitSystem: UnitSystem): EngineeringUnit {
  if (fieldId === "tankDiameter" || fieldId === "liquidHeight") return unitSystem === "metric" ? "m" : "ft";
  return defaultUnitForSystem(field.quantity, unitSystem);
}

function formatOutput(value: number, quantity: "length" | "rate", unitSystem: UnitSystem, corrosionRate = false): string {
  const outputQuantity: EngineeringQuantity = quantity === "rate" ? "length" : quantity;
  return formatDisplayNumber(convertFromSI(value, outputQuantity, unitSystem), corrosionRate ? "corrosion-rate" : "standard");
}

function UnitInput({ label, field, options, help, onValueChange, onUnitChange }: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  help: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
}) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="decimal" value={field.value} onChange={(event) => onValueChange(event.target.value)} /><select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><small>{help}</small></label>;
}

function YearInput({ label, value, help, onChange }: { label: string; value: string; help: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} /><b>year</b></div><small>{help}</small></label>;
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="decimal" value={value} readOnly={mode === "auto"} onChange={(event) => onChange(event.target.value)} /><b>yr</b></div><small>{help}</small></label>;
}

function AutomaticUnitInput({ label, field, options, mode, help, onValueChange, onUnitChange, onModeChange }: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  mode: AutomaticValueMode;
  help: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
  onModeChange: (mode: AutomaticValueMode) => void;
}) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="decimal" value={field.value} readOnly={mode === "auto"} onChange={(event) => onValueChange(event.target.value)} /><select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><small>{help}</small></label>;
}

export function Api653PlateRemainingLifeCalculator({ onBack, variant }: { onBack: () => void; variant: Api653PlateVariant }) {
  const isAnnular = variant === "annular";
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(variant));
  const [specificGravity, setSpecificGravity] = useState("0.9");
  const [calculatedStressMode, setCalculatedStressMode] = useState<AutomaticValueMode>("auto");
  const [minimumThicknessMode, setMinimumThicknessMode] = useState<AutomaticValueMode>("auto");
  const [bottomMinimumBasis, setBottomMinimumBasis] = useState<Api653BottomMinimumThicknessBasis>("table-4.4-standard");
  const [reducedMinimumCriteriaConfirmed, setReducedMinimumCriteriaConfirmed] = useState(false);
  const [projectionYears, setProjectionYears] = useState("10");
  const [undersideRateMode, setUndersideRateMode] = useState<Api653BottomCorrosionRateMode>("auto");
  const [topSideRateMode, setTopSideRateMode] = useState<Api653BottomCorrosionRateMode>("auto");
  const [highSpecificGravityBasisConfirmed, setHighSpecificGravityBasisConfirmed] = useState(false);
  const [buildYear, setBuildYear] = useState("2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState("2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>("auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>("auto");
  const [manualServiceYears, setManualServiceYears] = useState("20");
  const [manualInspectionYears, setManualInspectionYears] = useState("5");

  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSincePreviousInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);

  const updateFieldValue = (fieldId: UnitFieldId, value: string) => setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  const updateFieldUnit = (fieldId: UnitFieldId, nextUnit: EngineeringUnit) => setFields((current) => {
    const field = current[fieldId];
    const parsed = Number(field.value);
    const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value;
    return { ...current, [fieldId]: { ...field, value, unit: nextUnit } };
  });
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setFields((current) => Object.fromEntries(Object.entries(current).map(([fieldId, field]) => {
      const nextUnit = defaultUnitForField(fieldId as UnitFieldId, field, nextSystem);
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value;
      return [fieldId, { ...field, value, unit: nextUnit }];
    })) as UnitFieldMap);
  };

  const bottomInput = useMemo<Api653BottomPlateInputSI>(() => ({
    originalThicknessMm: unitValue(fields.originalThickness),
    previousThicknessMm: unitValue(fields.previousThickness),
    bottomRemainingThicknessMm: unitValue(fields.actualThickness),
    previousInternalPittingRemainingThicknessMm: unitValue(fields.previousInternalPitting),
    internalPittingRemainingThicknessMm: unitValue(fields.internalPitting),
    minimumThicknessBasis: bottomMinimumBasis,
    reducedMinimumCriteriaConfirmed,
    manualMinimumThicknessMm: unitValue(fields.minimumThickness),
    projectionYears: numberFrom(projectionYears),
    undersideCorrosionRateMode: undersideRateMode,
    manualUndersideCorrosionRateMmPerYear: unitValue(fields.undersideRate),
    topSideCorrosionRateMode: topSideRateMode,
    manualTopSideCorrosionRateMmPerYear: unitValue(fields.topSideRate),
    lowerShellMinimumThicknessMm: unitValue(fields.lowerShellMinimum),
    criticalZoneActualThicknessMm: unitValue(fields.criticalZoneActual),
    yearsInService,
    yearsSincePreviousInspection,
  }), [bottomMinimumBasis, fields, projectionYears, reducedMinimumCriteriaConfirmed, topSideRateMode, undersideRateMode, yearsInService, yearsSincePreviousInspection]);
  const annularInput = useMemo<Api653AnnularPlateInputSI>(() => ({
    diameterM: unitValue(fields.tankDiameter) / 1000,
    liquidHeightM: unitValue(fields.liquidHeight) / 1000,
    firstShellThicknessMm: unitValue(fields.firstShellThickness),
    specificGravity: numberFrom(specificGravity),
    highSpecificGravityBasisConfirmed,
    calculatedStressMode,
    manualCalculatedStressMpa: unitValue(fields.calculatedStress),
    minimumThicknessMode,
    manualMinimumThicknessMm: unitValue(fields.minimumThickness),
    originalThicknessMm: unitValue(fields.originalThickness),
    previousThicknessMm: unitValue(fields.previousThickness),
    actualThicknessMm: unitValue(fields.actualThickness),
    yearsInService,
    yearsSincePreviousInspection,
  }), [calculatedStressMode, fields, highSpecificGravityBasisConfirmed, minimumThicknessMode, specificGravity, yearsInService, yearsSincePreviousInspection]);
  const bottomResult = useMemo(() => calculateApi653BottomPlate(bottomInput), [bottomInput]);
  const annularResult = useMemo(() => calculateApi653AnnularPlate(annularInput), [annularInput]);
  const result = isAnnular ? annularResult : bottomResult;
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const manualOverrideActive = serviceYearsMode === "manual" || inspectionYearsMode === "manual" || (isAnnular ? calculatedStressMode === "manual" || minimumThicknessMode === "manual" : undersideRateMode === "manual" || topSideRateMode === "manual" || bottomMinimumBasis === "manual-controlled");

  const changeServiceMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService));
    setServiceYearsMode(mode);
  };
  const changeInspectionMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection));
    setInspectionYearsMode(mode);
  };
  const reset = () => {
    setUnitSystem("metric"); setFields(initialUnitFields(variant)); setSpecificGravity("0.9"); setCalculatedStressMode("auto"); setMinimumThicknessMode("auto"); setBottomMinimumBasis("table-4.4-standard"); setReducedMinimumCriteriaConfirmed(false); setProjectionYears("10"); setUndersideRateMode("auto"); setTopSideRateMode("auto"); setHighSpecificGravityBasisConfirmed(false); setBuildYear("2006"); setPreviousInspectionYear("2021"); setServiceYearsMode("auto"); setInspectionYearsMode("auto"); setManualServiceYears("20"); setManualInspectionYears("5");
  };

  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));
  const rateUnit = `${lengthUnit}/yr`;
  const stressUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const automaticStressField: UnitFieldState = {
    ...fields.calculatedStress,
    value: annularResult.automaticCalculatedStressMpa > 0 ? formatInput(convertSIToUnit(annularResult.automaticCalculatedStressMpa, "pressure", fields.calculatedStress.unit)) : "",
  };
  const displayedStressField = isAnnular && calculatedStressMode === "auto" ? automaticStressField : fields.calculatedStress;
  const stressHelp = calculatedStressMode === "auto"
    ? `Automatic S = [2.34 × D(ft) × (H(ft) − 1)] ÷ t(in). Internal value: ${annularResult.automaticCalculatedStressMpa.toFixed(3)} MPa.`
    : `Manual shell stress is active and highlighted. Automatic recommendation: ${annularResult.automaticCalculatedStressMpa > 0 ? `${formatDisplayNumber(annularResult.automaticCalculatedStressMpa)} MPa` : "unavailable"}.`;
  const automaticMinimumField: UnitFieldState = {
    ...fields.minimumThickness,
    value: annularResult.automaticMinimumThicknessMm === null ? "" : formatInput(convertSIToUnit(annularResult.automaticMinimumThicknessMm, "length", fields.minimumThickness.unit)),
  };
  const displayedMinimumField = isAnnular && minimumThicknessMode === "auto" ? automaticMinimumField : fields.minimumThickness;
  const minimumHelp = isAnnular
    ? minimumThicknessMode === "auto"
      ? `${annularResult.minimumSelectionMessage} Calculated stress ${formatDisplayNumber(annularResult.calculatedStressMpa)} MPa; H × G ${formatDisplayNumber(annularResult.effectiveProductHeightM)} m.`
      : `Manual override active. Automatic suggestion: ${annularResult.automaticMinimumThicknessMm === null ? "unavailable" : `${formatDisplayNumber(annularResult.automaticMinimumThicknessMm)} mm`}. ${annularResult.minimumSelectionMessage}`
    : "Editable project minimum. The protected source starts at 2.54 mm (0.10 in); confirm the applicable controlled basis.";
  const annularBasisOk = annularResult.calculatedStressMpa > 0
    && (minimumThicknessMode === "manual" || annularResult.automaticMinimumThicknessMm !== null);
  const copy = isAnnular ? {
    eyebrow: "API 653 · Annular integrity · Calculator 2 of 6",
    title: "Annular plate remaining life",
    description: "Annular thickness history, long- and short-term corrosion rates, governing minimum thickness, and remaining life.",
    minimumHeading: "Enter the tank basis that calculates shell stress and selects the editable Annular minimum.",
    referenceBasis: "API 653 annular plate remaining-life workflow",
    minimumHelp: "Automatic selection follows the protected original application and remains manually editable.",
    routeLabel: "Annular structural route connected.",
    routeMessage: "The dependency chain calculates shell stress, selects annular Tmin, and evaluates annular thickness history separately from bottom MRT and pitting logic.",
    originalLabel: "Original annular thickness",
    originalHelp: "Original or nominal annular plate thickness T org.",
    previousHelp: "Representative annular thickness at the previous inspection.",
    currentHelp: "Current representative annular plate thickness at the assessed location.",
    referenceTitle: "Before using the annular remaining-life result",
    referenceText: "Confirm tank diameter, maximum liquid height, first shell thickness, specific gravity, annular plate area, and comparable inspection thickness records against controlled project records. The application performs the protected lookup internally without displaying or bundling a standards table.",
    referencePointOne: "Confirm comparable annular measurement locations for each inspection.",
    completionText: "Review shell stress, Annular minimum thickness, corrosion rates, and remaining life before use.",
  } : {
    eyebrow: "API 653 · Bottom integrity · Calculator 1 of 6",
    title: "Bottom plate remaining life",
    description: "Bottom- and top-side metal loss, long/short corrosion rates, governing thickness, and remaining life.",
    minimumHeading: "Set the result unit system and the editable bottom minimum.",
    referenceBasis: "API 653 bottom plate remaining-life workflow",
    minimumHelp: "Editable project minimum. The protected source starts at 2.54 mm (0.10 in); confirm the applicable controlled basis.",
    routeLabel: "Protected Bottom route connected.",
    routeMessage: "The engine preserves the source dependency order for bottom loss, top remaining thickness, long/short corrosion rates, and remaining life.",
    originalLabel: "Original bottom thickness",
    originalHelp: "Original or nominal bottom plate thickness T org.",
    previousHelp: "Representative bottom thickness at the previous inspection.",
    currentHelp: "Current bottom-side measured thickness Ta.",
    referenceTitle: "Before using the bottom remaining-life result",
    referenceText: "Confirm the plate area, original and inspection thickness records, pitting measurement basis, applicable minimum thickness, and inspection dates against controlled project records. A representative calculator result does not replace bottom scanning review or responsible engineering assessment.",
    referencePointOne: "Confirm bottom- and top-side measurement locations.",
    completionText: "Review minimum thickness, corrosion rates, and remaining life before use.",
  };

  return <div className={`calculator-page api653-${variant}-page`}>
    <header className="calculator-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 653 library</button><div className="calculator-heading-row"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></div><div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div><div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Inspection</button><i /><button className="active"><b>3</b> Results</button></div></header>

    <div className="calculator-workspace"><div className="input-column">
      <section className="form-card">
        <div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>{copy.minimumHeading}</p></div></div><Wrench size={19} /></div>
        <div className="form-grid">
          <label className="field"><span>Reference basis</span><div className="select-control">{copy.referenceBasis}</div><small>Equation identity was captured from the protected original application; no standards PDF or displayed table is bundled.</small></label>
          <label className="field"><span>Unit system</span><select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · mm / mm/yr</option><option value="us-customary">U.S. customary · in / in/yr</option></select><small>Results follow this selection; every engineering input keeps its own live unit selector.</small></label>
          {isAnnular && <>
            <UnitInput label="Tank diameter" field={fields.tankDiameter} options={lengthUnits} help="Tank diameter D used by the protected shell-stress equation." onValueChange={(value) => updateFieldValue("tankDiameter", value)} onUnitChange={(unit) => updateFieldUnit("tankDiameter", unit)} />
            <UnitInput label="Maximum liquid height" field={fields.liquidHeight} options={lengthUnits} help="Maximum liquid height H; the protected USC equation deducts one foot." onValueChange={(value) => updateFieldValue("liquidHeight", value)} onUnitChange={(unit) => updateFieldUnit("liquidHeight", unit)} />
            <UnitInput label="First shell thickness" field={fields.firstShellThickness} options={lengthUnits} help="First shell course thickness t used for calculated stress and Annular Tmin selection." onValueChange={(value) => updateFieldValue("firstShellThickness", value)} onUnitChange={(unit) => updateFieldUnit("firstShellThickness", unit)} />
            <label className="field"><span>Specific gravity<button type="button" title="Product specific gravity used for H × G and selection routing." aria-label="Specific gravity help">?</button></span><div className="number-control"><input aria-label="Specific gravity" type="number" inputMode="decimal" value={specificGravity} onChange={(event) => setSpecificGravity(event.target.value)} /><b>SG</b></div><small>Values below 1.0 and values of 1.0 or above use the original application's respective selection routes.</small></label>
            {numberFrom(specificGravity) >= 1 && <label className="field"><span>High-SG structural basis</span><label className="check-row"><input type="checkbox" checked={highSpecificGravityBasisConfirmed} onChange={(event) => setHighSpecificGravityBasisConfirmed(event.target.checked)} /> Controlled API 650 table or elastic-analysis basis confirmed</label><small>Required before the SG ≥ 1 automatic annular minimum can be treated as complete.</small></label>}
            <AutomaticUnitInput label="Calculated shell stress" field={displayedStressField} options={pressureUnits} mode={calculatedStressMode} help={stressHelp} onValueChange={(value) => updateFieldValue("calculatedStress", value)} onUnitChange={(unit) => updateFieldUnit("calculatedStress", unit)} onModeChange={(mode) => { if (mode === "manual" && annularResult.automaticCalculatedStressMpa > 0) updateFieldValue("calculatedStress", formatInput(convertSIToUnit(annularResult.automaticCalculatedStressMpa, "pressure", fields.calculatedStress.unit))); setCalculatedStressMode(mode); }} />
            <AutomaticUnitInput label="Annular minimum required thickness" field={displayedMinimumField} options={lengthUnits} mode={minimumThicknessMode} help={minimumHelp} onValueChange={(value) => updateFieldValue("minimumThickness", value)} onUnitChange={(unit) => updateFieldUnit("minimumThickness", unit)} onModeChange={(mode) => { if (mode === "manual" && annularResult.automaticMinimumThicknessMm !== null) updateFieldValue("minimumThickness", formatInput(convertSIToUnit(annularResult.automaticMinimumThicknessMm, "length", fields.minimumThickness.unit))); setMinimumThicknessMode(mode); }} />
          </>}
          {!isAnnular && <>
            <label className="field"><span>Bottom minimum basis</span><select aria-label="Bottom minimum basis" className="select-control native-select" value={bottomMinimumBasis} onChange={(event) => setBottomMinimumBasis(event.target.value as Api653BottomMinimumThicknessBasis)}><option value="table-4.4-standard">Table 4.4 standard · 2.54 mm</option><option value="table-4.4-reduced">Table 4.4 reduced · 1.27 mm</option><option value="manual-controlled">Controlled manual minimum</option></select><small>Select the applicable route; the reduced route requires explicit condition confirmation.</small></label>
            {bottomMinimumBasis === "table-4.4-reduced" && <label className="field"><span>Reduced-minimum conditions</span><label className="check-row"><input type="checkbox" checked={reducedMinimumCriteriaConfirmed} onChange={(event) => setReducedMinimumCriteriaConfirmed(event.target.checked)} /> All applicable Table 4.4 conditions are confirmed</label><small>The calculation is blocked until this engineering condition is confirmed.</small></label>}
            {bottomMinimumBasis === "manual-controlled" && <UnitInput label="Controlled minimum thickness" field={fields.minimumThickness} options={lengthUnits} help={minimumHelp} onValueChange={(value) => updateFieldValue("minimumThickness", value)} onUnitChange={(unit) => updateFieldUnit("minimumThickness", unit)} />}
            <label className="field"><span>Projection interval Or</span><div className="number-control"><input aria-label="Projection interval Or" type="number" inputMode="decimal" value={projectionYears} onChange={(event) => setProjectionYears(event.target.value)} /><b>yr</b></div><small>Future interval used directly in MRT = min(RTbc, RTip) − Or(StPr + UPr).</small></label>
          </>}
        </div>
        <div className={`form-note ${isAnnular && !annularBasisOk ? "" : "is-valid"}`}>{isAnnular && !annularBasisOk ? <TriangleAlert size={17} /> : <ShieldCheck size={17} />}<p><strong>{copy.routeLabel}</strong> {isAnnular && !annularBasisOk ? error?.message ?? annularResult.minimumSelectionMessage : copy.routeMessage}</p></div>
      </section>

      <section className="form-card">
        <div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Automatic years and corrosion rates stay highlighted and can be overridden manually.</p></div></div><Gauge size={19} /></div>
        <div className="form-grid">
          <YearInput label="Build year" value={buildYear} help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
          <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `Automatically calculated: ${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
          <YearInput label="Previous inspection year" value={previousInspectionYear} help={`Whole year from the build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
          <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `Automatically calculated: ${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
          <UnitInput label={copy.originalLabel} field={fields.originalThickness} options={lengthUnits} help={copy.originalHelp} onValueChange={(value) => updateFieldValue("originalThickness", value)} onUnitChange={(unit) => updateFieldUnit("originalThickness", unit)} />
          <UnitInput label="Previous measured thickness" field={fields.previousThickness} options={lengthUnits} help={copy.previousHelp} onValueChange={(value) => updateFieldValue("previousThickness", value)} onUnitChange={(unit) => updateFieldUnit("previousThickness", unit)} />
          <UnitInput label={isAnnular ? "Current annular thickness" : "Current bottom remaining thickness RTbc"} field={fields.actualThickness} options={lengthUnits} help={copy.currentHelp} onValueChange={(value) => updateFieldValue("actualThickness", value)} onUnitChange={(unit) => updateFieldUnit("actualThickness", unit)} />
          {!isAnnular && <>
            <UnitInput label="Previous internal-pitting remaining thickness" field={fields.previousInternalPitting} options={lengthUnits} help="Comparable RTip measurement from the previous inspection; do not enter current pit depth here." onValueChange={(value) => updateFieldValue("previousInternalPitting", value)} onUnitChange={(unit) => updateFieldUnit("previousInternalPitting", unit)} />
            <UnitInput label="Current internal-pitting remaining thickness RTip" field={fields.internalPitting} options={lengthUnits} help="Current remaining thickness at the internal-pitting route." onValueChange={(value) => updateFieldValue("internalPitting", value)} onUnitChange={(unit) => updateFieldUnit("internalPitting", unit)} />
            <AutomaticUnitInput label="Underside corrosion rate UPr" field={undersideRateMode === "auto" ? { ...fields.undersideRate, value: formatInput(convertSIToUnit(bottomResult.automaticUndersideCorrosionRateMmPerYear, "length", fields.undersideRate.unit)) } : fields.undersideRate} options={lengthUnits} mode={undersideRateMode} help="Automatic mode uses the governing comparable bottom-thickness history; manual mode requires a controlled rate." onValueChange={(value) => updateFieldValue("undersideRate", value)} onUnitChange={(unit) => updateFieldUnit("undersideRate", unit)} onModeChange={setUndersideRateMode} />
            <AutomaticUnitInput label="Top-side corrosion rate StPr" field={topSideRateMode === "auto" ? { ...fields.topSideRate, value: formatInput(convertSIToUnit(bottomResult.automaticTopSideCorrosionRateMmPerYear, "length", fields.topSideRate.unit)) } : fields.topSideRate} options={lengthUnits} mode={topSideRateMode} help="Automatic mode uses comparable previous and current RTip values; current pit depth alone is not a corrosion rate." onValueChange={(value) => updateFieldValue("topSideRate", value)} onUnitChange={(unit) => updateFieldUnit("topSideRate", unit)} onModeChange={setTopSideRateMode} />
            <UnitInput label="Lower shell minimum thickness" field={fields.lowerShellMinimum} options={lengthUnits} help="Input for the separate critical-zone minimum calculation." onValueChange={(value) => updateFieldValue("lowerShellMinimum", value)} onUnitChange={(unit) => updateFieldUnit("lowerShellMinimum", unit)} />
            <UnitInput label="Critical-zone actual thickness" field={fields.criticalZoneActual} options={lengthUnits} help="Assessed separately from the general bottom MRT projection." onValueChange={(value) => updateFieldValue("criticalZoneActual", value)} onUnitChange={(unit) => updateFieldUnit("criticalZoneActual", unit)} />
          </>}
        </div>
        <div className={`form-note ${manualOverrideActive ? "is-manual" : "is-valid"}`}>{manualOverrideActive ? <TriangleAlert size={18} /> : <Info size={17} />}<p><strong>{manualOverrideActive ? "Manual override active." : "Automatic dependencies active."}</strong> {manualOverrideActive ? "Verify every highlighted manual field before engineering review." : isAnnular ? "Annular thickness loss remains separate from bottom MRT and pitting logic." : "MRT uses separate RTbc, RTip, UPr, StPr, and projection interval inputs."}</p></div>
        <div className="unit-system-note"><Info size={17} /><p><strong>Mixed engineering units are active.</strong> Every field converts into the normalized engine while results follow <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b>.</p></div>
      </section>

      <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>{copy.referenceTitle}</h3></div></div><span>No standards PDF</span></div><p>{copy.referenceText}</p><div className="reference-points"><span><b>01</b>{copy.referencePointOne}</span><span><b>02</b>Verify the project minimum thickness basis.</span><span><b>03</b>Review the governing corrosion route and inspection plan.</span></div></section>
    </div>

    <aside className="result-column">
      <section className="result-card">
        <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
        <div className="result-primary-grid"><div className="result-primary"><p>Remaining life</p><div className="result-primary-value"><strong>{formatDisplayNumber(result.remainingLifeYears)}</strong><span>yr</span></div></div><div className="result-primary"><p>Minimum thickness</p><div className="result-primary-value"><strong>{formatOutput(result.minimumThicknessMmUsed, "length", unitSystem)}</strong><span>{lengthUnit}</span></div></div></div>
        <div className="result-comparison"><span>Governing thickness<strong>{formatOutput(result.governingThicknessMm, "length", unitSystem)} {lengthUnit}</strong></span><span>Available thickness<strong>{formatOutput(result.availableThicknessMm, "length", unitSystem)} {lengthUnit}</strong></span></div>
        <div className="result-comparison"><span>{isAnnular ? "Long-term rate" : "Combined UPr + StPr"}<strong>{formatOutput(isAnnular ? annularResult.longTermCorrosionRateMmPerYear : bottomResult.combinedCorrosionRateMmPerYear, "rate", unitSystem, true)} {rateUnit}</strong></span><span>{isAnnular ? "Short-term rate" : "Projected MRT"}<strong>{isAnnular ? `${formatOutput(annularResult.shortTermCorrosionRateMmPerYear, "rate", unitSystem, true)} ${rateUnit}` : `${formatOutput(bottomResult.projectedMinimumRemainingThicknessMm, "length", unitSystem)} ${lengthUnit}`}</strong></span></div>
        <div className={`result-status ${result.ok ? manualOverrideActive || warning ? "is-manual" : "is-valid" : ""}`}>{result.ok && !manualOverrideActive && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : manualOverrideActive ? "Calculation includes manual inputs" : warning ? "Engineering review required" : "Calculation completed"}</strong><span>{error?.message ?? (manualOverrideActive ? `Verify all highlighted overrides before engineering approval.${warning ? ` ${warning.message}` : ""}` : warning?.message ?? copy.completionText)}</span></div></div>
      </section>
      <section className="trace-card">
        <p className="eyebrow">Supporting results</p><h3>Calculation details</h3>
        {isAnnular ? <>
          <div><span>Calculated shell stress mode</span><strong>{calculatedStressMode === "auto" ? "Automatic" : "Manual override"}</strong></div>
          <div><span>Calculated shell stress used</span><strong>{formatDisplayNumber(convertFromSI(annularResult.calculatedStressMpa, "pressure", unitSystem))} {stressUnit}</strong></div>
          <div><span>Automatic shell stress</span><strong>{formatDisplayNumber(convertFromSI(annularResult.automaticCalculatedStressMpa, "pressure", unitSystem))} {stressUnit}</strong></div>
          <div><span>Annular minimum mode</span><strong>{minimumThicknessMode === "auto" ? "Automatic" : "Manual override"}</strong></div>
          <div><span>Selection route</span><strong>{annularResult.minimumSelectionTableLabel ?? "Unavailable"}</strong></div>
          <div><span>Long-term annular rate</span><strong>{formatOutput(annularResult.longTermCorrosionRateMmPerYear, "rate", unitSystem, true)} {rateUnit}</strong></div>
          <div><span>Short-term annular rate</span><strong>{formatOutput(annularResult.shortTermCorrosionRateMmPerYear, "rate", unitSystem, true)} {rateUnit}</strong></div>
        </> : <>
          <div><span>RTbc current</span><strong>{formatOutput(bottomResult.bottomRemainingThicknessMmUsed, "length", unitSystem)} {lengthUnit}</strong></div>
          <div><span>RTip current</span><strong>{formatOutput(bottomResult.internalPittingRemainingThicknessMmUsed, "length", unitSystem)} {lengthUnit}</strong></div>
          <div><span>Underside rate UPr</span><strong>{formatOutput(bottomResult.undersideCorrosionRateMmPerYear, "rate", unitSystem, true)} {rateUnit}</strong></div>
          <div><span>Top-side rate StPr</span><strong>{formatOutput(bottomResult.topSideCorrosionRateMmPerYear, "rate", unitSystem, true)} {rateUnit}</strong></div>
          <div><span>Projection formula</span><strong>min(RTbc, RTip) − Or(StPr + UPr)</strong></div>
          <div><span>Projection interval Or</span><strong>{formatDisplayNumber(bottomResult.projectionYearsUsed)} yr</strong></div>
          <div><span>Projected MRT</span><strong>{formatOutput(bottomResult.projectedMinimumRemainingThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div>
          <div><span>Critical-zone minimum</span><strong>{formatOutput(bottomResult.criticalZoneMinimumThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div>
          <div><span>Critical-zone status</span><strong>{bottomResult.criticalZoneAdequate ? "Adequate" : "Below minimum"}</strong></div>
        </>}
        <div><span>Minimum required thickness used</span><strong>{formatOutput(result.minimumThicknessMmUsed, "length", unitSystem)} {lengthUnit}</strong></div>
      </section>
    </aside></div>
  </div>;
}

export function Api653BottomPlateCalculator({ onBack }: { onBack: () => void }) {
  return <Api653PlateRemainingLifeCalculator onBack={onBack} variant="bottom" />;
}
