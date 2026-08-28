import { useMemo, useState } from "react";
import {
  API570_PIPING_CODE_DEFINITIONS,
  DEFAULT_API570_MATERIAL_GRADE,
  DEFAULT_API570_MATERIAL_SPEC,
  api570PipingCodeDefinitionFor,
  calculateApi570Piping,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  listEngineeringUnitOptions,
  resolveApi570PipingAllowableStress,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570PipingCode,
  Api570PipingInputSI,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570PipingRecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import { Api570MaterialStressFields } from "./Api570MaterialStressFields.tsx";
import type {
  ApproveApi570CalculationInput,
  Api570PipingInputSnapshot,
  Api570PipingUnitFieldId,
  Api570PipingUnitFieldSnapshot,
  LocalProject,
  ReviewApi570CalculationInput,
  SaveApi570CalculationInput,
  SavedApi570Calculation,
} from "../local-data/models.ts";

type UnitFieldId = Api570PipingUnitFieldId;
type UnitFieldState = Api570PipingUnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");
const lengthUnits = listEngineeringUnitOptions("length");
const temperatureUnits = listEngineeringUnitOptions("temperature");

function initialUnitFields(snapshot?: Api570PipingInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    designPressure: { value: "2", unit: "MPa", quantity: "pressure" },
    outsideDiameter: { value: "323.85", unit: "mm", quantity: "length" },
    designTemperature: { value: "150", unit: "C", quantity: "temperature" },
    allowableStress: { value: "138", unit: "MPa", quantity: "pressure" },
    allowance: { value: "3", unit: "mm", quantity: "length" },
    originalThickness: { value: "18", unit: "mm", quantity: "length" },
    previousThickness: { value: "16.5", unit: "mm", quantity: "length" },
    actualThickness: { value: "15.8", unit: "mm", quantity: "length" },
    structuralMinimum: { value: "", unit: "mm", quantity: "length" },
    manualMinimum: { value: "", unit: "mm", quantity: "length" },
  };
}

function numberFrom(value: string, fallback = 0): number {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatInput(value: number, quantity: EngineeringQuantity): string {
  if (!Number.isFinite(value)) return "";
  const decimals = quantity === "temperature" ? 2 : 6;
  return String(Number(value.toFixed(decimals)));
}

function unitValue(field: UnitFieldState): number {
  return convertUnitToSI(numberFrom(field.value), field.quantity, field.unit);
}

type OutputQuantity = EngineeringQuantity | "rate";

function formatOutput(value: number, quantity: OutputQuantity, system: UnitSystem): string {
  const converted = convertFromSI(value, quantity === "rate" ? "length" : quantity, system);
  return formatDisplayNumber(converted, quantity === "rate" ? "corrosion-rate" : "standard");
}

function UnitInput({
  label,
  field,
  options,
  help,
  onValueChange,
  onUnitChange,
}: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  help: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
}) {
  return (
    <label className="field">
      <span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span>
      <div className="number-control">
        <input type="number" inputMode="decimal" value={field.value} onChange={(event) => onValueChange(event.target.value)} />
        <select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <small>{help}</small>
    </label>
  );
}

function PlainInput({ label, value, unit, help, onChange }: { label: string; value: string; unit?: string; help: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span>
      {unit ? <div className="number-control"><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><b>{unit}</b></div>
        : <input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />}
      <small>{help}</small>
    </label>
  );
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  const nextMode = mode === "auto" ? "manual" : "auto";
  return (
    <label className="field automatic-field">
      <span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(nextMode)} aria-label={`Switch ${label} to ${nextMode} mode`}>{mode}</button></span>
      <div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} readOnly={mode === "auto"} /><b>yr</b></div>
      <small>{help}</small>
    </label>
  );
}

export function Api570PipingCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: {
  onBack: () => void;
  onNeedProject: () => void;
  notify: (message: string) => void;
  projects: LocalProject[];
  initialCalculation: SavedApi570Calculation | null;
  onSave: (input: SaveApi570CalculationInput) => SavedApi570Calculation;
  onReview: (input: ReviewApi570CalculationInput) => SavedApi570Calculation;
  onApprove: (input: ApproveApi570CalculationInput) => SavedApi570Calculation;
}) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "piping" ? initialCalculation.inputs : undefined;
  const currentYear = new Date().getFullYear();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));
  const [materialSpec, setMaterialSpec] = useState(initialInputs?.materialSpec ?? DEFAULT_API570_MATERIAL_SPEC);
  const [gradeKey, setGradeKey] = useState(initialInputs?.gradeKey ?? DEFAULT_API570_MATERIAL_GRADE);
  const [stressMode, setStressMode] = useState<AutomaticValueMode>(initialInputs?.stressMode ?? "auto");
  const [pipingCode, setPipingCode] = useState<Api570PipingCode>(initialInputs?.pipingCode ?? "b31.3");
  const [buildYear, setBuildYear] = useState(initialInputs?.buildYear ?? "2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState(initialInputs?.previousInspectionYear ?? "2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>(initialInputs?.serviceYearsMode ?? "auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>(initialInputs?.inspectionYearsMode ?? "auto");
  const [manualServiceYears, setManualServiceYears] = useState(initialInputs?.manualServiceYears ?? "20");
  const [manualInspectionYears, setManualInspectionYears] = useState(initialInputs?.manualInspectionYears ?? "5");
  const [minimumMode, setMinimumMode] = useState<AutomaticValueMode>(initialInputs?.minimumMode ?? "auto");
  const [qualityFactor, setQualityFactor] = useState(initialInputs?.qualityFactor ?? "0.85");
  const [weldFactor, setWeldFactor] = useState(initialInputs?.weldFactor ?? "1");
  const [yCoefficient, setYCoefficient] = useState(initialInputs?.yCoefficient ?? "0.4");
  const [designFactor, setDesignFactor] = useState(initialInputs?.designFactor ?? "1");
  const [temperatureFactor, setTemperatureFactor] = useState(initialInputs?.temperatureFactor ?? "1");
  const [hydrogenMaterialFactor, setHydrogenMaterialFactor] = useState(initialInputs?.hydrogenMaterialFactor ?? "1");
  const [hydrogenFactor, setHydrogenFactor] = useState(initialInputs?.hydrogenFactor ?? "1");
  const [intervalYears, setIntervalYears] = useState(initialInputs?.intervalYears ?? "5");

  const codeDefinition = api570PipingCodeDefinitionFor(pipingCode);
  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSinceInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);

  const updateFieldValue = (fieldId: UnitFieldId, value: string) => setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  const updateFieldUnit = (fieldId: UnitFieldId, nextUnit: EngineeringUnit) => setFields((current) => {
    const field = current[fieldId];
    const parsed = Number(field.value);
    const value = Number.isFinite(parsed) && field.value.trim()
      ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit), field.quantity)
      : field.value;
    return { ...current, [fieldId]: { ...field, value, unit: nextUnit } };
  });
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setFields((current) => Object.fromEntries(Object.entries(current).map(([fieldId, field]) => {
      const nextUnit = defaultUnitForSystem(field.quantity, nextSystem);
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim()
        ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit), field.quantity)
        : field.value;
      return [fieldId, { ...field, value, unit: nextUnit }];
    })) as UnitFieldMap);
  };

  const designTemperatureC = unitValue(fields.designTemperature);
  const stressResolution = useMemo(
    () => resolveApi570PipingAllowableStress(materialSpec, gradeKey, designTemperatureC),
    [designTemperatureC, gradeKey, materialSpec],
  );
  const resolvedStressMpa = stressMode === "auto"
    ? stressResolution.allowableStressMpa ?? 0
    : unitValue(fields.allowableStress);

  const baseInput = useMemo<Api570PipingInputSI>(() => ({
    pipingCode,
    outsideDiameterMm: unitValue(fields.outsideDiameter),
    designPressureMpa: unitValue(fields.designPressure),
    allowableStressMpa: resolvedStressMpa,
    longitudinalQualityFactor: numberFrom(qualityFactor),
    weldStrengthReductionFactor: numberFrom(weldFactor, 1),
    yCoefficient: numberFrom(yCoefficient),
    allowanceMm: unitValue(fields.allowance),
    designFactor: numberFrom(designFactor, 1),
    temperatureDeratingFactor: numberFrom(temperatureFactor, 1),
    hydrogenMaterialFactor: numberFrom(hydrogenMaterialFactor, 1),
    hydrogenFactor: numberFrom(hydrogenFactor, 1),
    originalThicknessMm: unitValue(fields.originalThickness),
    previousThicknessMm: unitValue(fields.previousThickness),
    actualThicknessMm: unitValue(fields.actualThickness),
    structuralMinimumThicknessMm: fields.structuralMinimum.value.trim() ? unitValue(fields.structuralMinimum) : undefined,
    yearsInService,
    yearsSincePreviousInspection: yearsSinceInspection,
    nextInspectionYears: numberFrom(intervalYears, 5),
  }), [designFactor, fields, hydrogenFactor, hydrogenMaterialFactor, intervalYears, pipingCode, qualityFactor, resolvedStressMpa, temperatureFactor, weldFactor, yCoefficient, yearsInService, yearsSinceInspection]);
  const automaticResult = useMemo(() => calculateApi570Piping(baseInput), [baseInput]);
  const result = useMemo(() => calculateApi570Piping(minimumMode === "manual"
    ? { ...baseInput, minimumThicknessMm: unitValue(fields.manualMinimum) }
    : baseInput), [baseInput, fields.manualMinimum, minimumMode]);
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const inputSnapshot = useMemo<Api570PipingInputSnapshot>(() => ({
    calculatorId: "piping",
    unitSystem,
    fields,
    pipingCode,
    buildYear,
    previousInspectionYear,
    serviceYearsMode,
    inspectionYearsMode,
    manualServiceYears,
    manualInspectionYears,
    minimumMode,
    qualityFactor,
    weldFactor,
    yCoefficient,
    designFactor,
    temperatureFactor,
    hydrogenMaterialFactor,
    hydrogenFactor,
    intervalYears,
    materialSpec,
    gradeKey,
    stressMode,
    engineInput: minimumMode === "manual" ? { ...baseInput, minimumThicknessMm: unitValue(fields.manualMinimum) } : baseInput,
  }), [baseInput, buildYear, designFactor, fields, gradeKey, hydrogenFactor, hydrogenMaterialFactor, inspectionYearsMode, intervalYears, manualInspectionYears, manualServiceYears, materialSpec, minimumMode, pipingCode, previousInspectionYear, qualityFactor, serviceYearsMode, stressMode, temperatureFactor, unitSystem, weldFactor, yCoefficient]);

  const changeStressMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && stressResolution.allowableStressMpa !== null) {
      updateFieldValue("allowableStress", formatInput(convertBetweenUnits(stressResolution.allowableStressMpa, "pressure", "MPa", fields.allowableStress.unit), "pressure"));
    }
    setStressMode(mode);
  };

  const changeMinimumMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && !fields.manualMinimum.value.trim()) {
      const display = convertBetweenUnits(automaticResult.automaticMinimumThicknessMm, "length", "mm", fields.manualMinimum.unit);
      updateFieldValue("manualMinimum", formatInput(display, "length"));
    }
    setMinimumMode(mode);
  };
  const changeServiceMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService));
    setServiceYearsMode(mode);
  };
  const changeInspectionMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection));
    setInspectionYearsMode(mode);
  };
  const reset = () => {
    setUnitSystem("metric"); setFields(initialUnitFields()); setPipingCode("b31.3"); setBuildYear("2006"); setPreviousInspectionYear("2021");
    setMaterialSpec(DEFAULT_API570_MATERIAL_SPEC); setGradeKey(DEFAULT_API570_MATERIAL_GRADE); setStressMode("auto");
    setServiceYearsMode("auto"); setInspectionYearsMode("auto"); setMinimumMode("auto"); setManualServiceYears("20"); setManualInspectionYears("5");
    setQualityFactor("0.85"); setWeldFactor("1"); setYCoefficient("0.4"); setDesignFactor("1"); setTemperatureFactor("1");
    setHydrogenMaterialFactor("1"); setHydrogenFactor("1"); setIntervalYears("5");
  };

  const pressureUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));
  const rateUnit = `${unitSymbol(defaultUnitForSystem("length", unitSystem))}/yr`;
  const mode = codeDefinition.calculationMode;
  const showY = mode === "b31.1" || mode === "b31.3" || mode === "b31.5" || mode === "b31.12-ip";
  const showW = mode === "b31.1" || mode === "b31.3";
  const showPipelineFactors = mode === "b31.8" || mode === "b31.12-pl";

  return (
    <div className="calculator-page api570-piping-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 570 library</button>
        <div className="calculator-heading-row">
          <div><p className="eyebrow">API 570 · Piping systems</p><h1>Individual piping calculator</h1><p>Pressure thickness, MAWP, corrosion rate, remaining life and future-service projection.</p></div>
          <div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><Api570PipingRecordWorkflow projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} /><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div>
        </div>
        <div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Inputs</button><i /><button className="active"><b>3</b> Results</button></div>
      </header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card">
            <div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Select the governing piping code and output unit system.</p></div></div><Wrench size={19} /></div>
            <div className="form-grid">
              <label className="field"><span>Piping code / design basis</span><select className="select-control native-select" value={pipingCode} onChange={(event) => setPipingCode(event.target.value as Api570PipingCode)}>{API570_PIPING_CODE_DEFINITIONS.map((definition) => <option key={definition.code} value={definition.code}>{definition.label}</option>)}</select><small>{codeDefinition.status}</small></label>
              <label className="field"><span>Unit system</span><select className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · MPa / mm / °C</option><option value="us-customary">U.S. customary · psi / in / °F</option></select><small>Results follow this selection; every dimensional input keeps its own unit selector.</small></label>
              <UnitInput label="Internal design pressure" field={fields.designPressure} options={pressureUnits} help="Positive internal design pressure at the calculation condition." onValueChange={(value) => updateFieldValue("designPressure", value)} onUnitChange={(unit) => updateFieldUnit("designPressure", unit)} />
              <UnitInput label="Effective outside diameter" field={fields.outsideDiameter} options={lengthUnits} help="Enter the actual or resolved standard outside diameter. No pipe-schedule table is bundled." onValueChange={(value) => updateFieldValue("outsideDiameter", value)} onUnitChange={(unit) => updateFieldUnit("outsideDiameter", unit)} />
              <Api570MaterialStressFields materialSpec={materialSpec} gradeKey={gradeKey} temperatureField={fields.designTemperature} stressField={fields.allowableStress} stressMode={stressMode} stressResolution={stressResolution} temperatureUnits={temperatureUnits} pressureUnits={pressureUnits} onMaterialChange={(nextSpec, firstGradeKey) => { setMaterialSpec(nextSpec); setGradeKey(firstGradeKey); }} onGradeChange={setGradeKey} onTemperatureValueChange={(value) => updateFieldValue("designTemperature", value)} onTemperatureUnitChange={(unit) => updateFieldUnit("designTemperature", unit)} onStressValueChange={(value) => updateFieldValue("allowableStress", value)} onStressUnitChange={(unit) => updateFieldUnit("allowableStress", unit)} onStressModeChange={changeStressMode} />
              <PlainInput label="Longitudinal quality factor E" value={qualityFactor} help="Enter the applicable joint or longitudinal quality factor." onChange={setQualityFactor} />
              {showW && <PlainInput label="Weld strength reduction factor W" value={weldFactor} help="Blank behavior in the protected source is represented by the visible default of 1.00." onChange={setWeldFactor} />}
              {showY && <PlainInput label="Y coefficient" value={yCoefficient} help="Enter from the applicable controlled code table; no standards table is bundled." onChange={setYCoefficient} />}
              {codeDefinition.usesAllowance && <UnitInput label="Allowance A / c" field={fields.allowance} options={lengthUnits} help="Corrosion, erosion, threading, grooving or mechanical allowance." onValueChange={(value) => updateFieldValue("allowance", value)} onUnitChange={(unit) => updateFieldUnit("allowance", unit)} />}
              {showPipelineFactors && <PlainInput label="Design factor F" value={designFactor} help="Pipeline design factor used by the selected equation." onChange={setDesignFactor} />}
              {showPipelineFactors && <PlainInput label="Temperature factor T" value={temperatureFactor} help="Temperature derating factor used by the selected pipeline equation." onChange={setTemperatureFactor} />}
              {mode === "b31.12-ip" && <PlainInput label="Hydrogen material factor Mf" value={hydrogenMaterialFactor} help="Material performance factor for B31.12 Part IP." onChange={setHydrogenMaterialFactor} />}
              {mode === "b31.12-pl" && <PlainInput label="Hydrogen factor Hf" value={hydrogenFactor} help="Hydrogen factor for B31.12 Part PL." onChange={setHydrogenFactor} />}
            </div>
            <div className={`form-note ${codeDefinition.calculationMode ? "is-valid" : ""}`}>{codeDefinition.calculationMode ? <ShieldCheck size={17} /> : <TriangleAlert size={17} />}<p><strong>{codeDefinition.calculationMode ? "Protected code route connected." : "Inactive historical code."}</strong> {codeDefinition.calculationMode ? "The typed engine uses the same route and defaults recorded in the original website." : "Select an active design code before using pressure-thickness or MAWP results."}</p></div>
          </section>

          <section className="form-card">
            <div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Automatic years remain highlighted and can be overridden manually.</p></div></div><Gauge size={19} /></div>
            <div className="form-grid">
              <PlainInput label="Build year" value={buildYear} unit="year" help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
              <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `Automatically calculated: ${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
              <PlainInput label="Previous inspection year" value={previousInspectionYear} unit="year" help={`Whole year from the build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
              <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `Automatically calculated: ${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
              <UnitInput label="Original thickness" field={fields.originalThickness} options={lengthUnits} help="Original or nominal recorded wall thickness." onValueChange={(value) => updateFieldValue("originalThickness", value)} onUnitChange={(unit) => updateFieldUnit("originalThickness", unit)} />
              <UnitInput label="Previous measured thickness" field={fields.previousThickness} options={lengthUnits} help="Representative thickness at the previous inspection." onValueChange={(value) => updateFieldValue("previousThickness", value)} onUnitChange={(unit) => updateFieldUnit("previousThickness", unit)} />
              <UnitInput label="Current measured thickness" field={fields.actualThickness} options={lengthUnits} help="Current controlling CML/TML wall thickness." onValueChange={(value) => updateFieldValue("actualThickness", value)} onUnitChange={(unit) => updateFieldUnit("actualThickness", unit)} />
              <UnitInput label="Structural minimum thickness" field={fields.structuralMinimum} options={lengthUnits} help="Optional manual engineering input. No copied API 574 structural table is bundled." onValueChange={(value) => updateFieldValue("structuralMinimum", value)} onUnitChange={(unit) => updateFieldUnit("structuralMinimum", unit)} />
              <label className="field automatic-field"><span>Minimum thickness used<button type="button" title="Auto uses the greater of pressure-required and entered structural minimum." aria-label="Minimum thickness used help">?</button><button type="button" className={`field-mode-toggle ${minimumMode}`} onClick={() => changeMinimumMode(minimumMode === "auto" ? "manual" : "auto")} aria-label={`Switch Minimum thickness used to ${minimumMode === "auto" ? "manual" : "auto"} mode`}>{minimumMode}</button></span><div className={`number-control is-derived ${minimumMode === "manual" ? "is-manual" : ""}`}><input type="number" inputMode="decimal" value={minimumMode === "auto" ? formatInput(convertBetweenUnits(automaticResult.automaticMinimumThicknessMm, "length", "mm", fields.manualMinimum.unit), "length") : fields.manualMinimum.value} readOnly={minimumMode === "auto"} onChange={(event) => updateFieldValue("manualMinimum", event.target.value)} /><select className="unit-picker" aria-label="Minimum thickness used unit" value={fields.manualMinimum.unit} onChange={(event) => updateFieldUnit("manualMinimum", event.target.value as EngineeringUnit)}>{lengthUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><small>{minimumMode === "auto" ? "Automatically uses max(pressure required, structural minimum)." : "Manual override is active and highlighted."}</small></label>
              <label className="field"><span>Future service interval</span><select className="select-control native-select" value={intervalYears} onChange={(event) => setIntervalYears(event.target.value)}>{Array.from({ length: 20 }, (_, index) => index + 1).map((year) => <option key={year} value={year}>{year} years</option>)}</select><small>Protected API 570 workflow range: 1 to 20 years.</small></label>
            </div>
            <div className="unit-system-note"><Info size={17} /><p><strong>Mixed field units are active.</strong> Each input selector converts its value live. The engine always receives SI values; results follow <b>{unitSystem === "metric" ? "Metric SI" : "U.S. customary"}</b>.</p></div>
          </section>

          <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the result</h3></div></div><span>No standards PDF</span></div><p>Confirm the governing construction code, effective outside diameter, material stress, E/W/Y and pipeline factors against controlled project records. This calculator does not bundle copied standards tables and does not replace responsible engineering review.</p><div className="reference-points"><span><b>01</b>Verify the pressure-temperature basis.</span><span><b>02</b>Confirm every manual code factor.</span><span><b>03</b>Review the governing corrosion rate and future MAWP.</span></div></section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <div className="result-primary-grid"><div className="result-primary"><p>Remaining life</p><div className="result-primary-value"><strong>{formatDisplayNumber(result.remainingLifeYears)}</strong><span>yr</span></div></div><div className="result-primary"><p>Required thickness</p><div className="result-primary-value"><strong>{formatOutput(result.requiredThicknessMm, "length", unitSystem)}</strong><span>{lengthUnit}</span></div></div></div>
            <div className="result-comparison"><span>Minimum used<strong>{formatOutput(result.minimumThicknessUsedMm, "length", unitSystem)} {lengthUnit}</strong></span><span>Current thickness<strong>{formatOutput(unitValue(fields.actualThickness), "length", unitSystem)} {lengthUnit}</strong></span></div>
            <div className="result-comparison"><span>Current MAWP<strong>{formatOutput(result.governingMawpMpa, "pressure", unitSystem)} {pressureUnit}</strong></span><span>Governing corrosion rate<strong>{formatOutput(result.governingCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></span></div>
            <div className={`result-status ${result.ok ? warning ? "is-manual" : "is-valid" : ""}`}>{result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : warning ? "Engineering scope review required" : "Calculation completed"}</strong><span>{error?.message ?? warning?.message ?? "Review remaining life, required thickness, MAWP, and corrosion rates before use."}</span></div></div>
          </section>
          <section className="trace-card"><p className="eyebrow">Supporting results</p><h3>Calculation details</h3><div><span>Code basis</span><strong>{result.pipingCode}</strong></div><div><span>Long-term corrosion rate</span><strong>{formatOutput(result.longTermCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></div><div><span>Short-term corrosion rate</span><strong>{formatOutput(result.shortTermCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></div><div><span>Governing corrosion rate</span><strong>{formatOutput(result.governingCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></div><div><span>Corrosion allowance</span><strong>{formatOutput(result.corrosionAllowanceMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Projected thickness ({result.intervalYears} yr)</span><strong>{formatOutput(result.projectedThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Future MAWP thickness</span><strong>{formatOutput(result.futureMawpThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Future MAWP</span><strong>{formatOutput(result.futureMawpMpa, "pressure", unitSystem)} {pressureUnit}</strong></div><div><span>Hydrostatic pressure</span><strong>{formatOutput(result.hydrostaticTestPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></div><div><span>Pneumatic pressure</span><strong>{formatOutput(result.pneumaticTestPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></div></section>
        </aside>
      </div>
    </div>
  );
}
