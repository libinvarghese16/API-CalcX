import { useMemo, useState } from "react";
import {
  DEFAULT_API570_MATERIAL_GRADE,
  DEFAULT_API570_MATERIAL_SPEC,
  calculateApi570Tube,
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
  Api570TubeEndCondition,
  Api570TubeInputSI,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import { Api570MaterialStressFields } from "./Api570MaterialStressFields.tsx";
import type { Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type {
  ApproveApi570CalculationInput,
  Api570TubeInputSnapshot,
  Api570TubeUnitFieldId,
  Api570TubeUnitFieldSnapshot,
  LocalProject,
  ReviewApi570CalculationInput,
  SaveApi570CalculationInput,
  SavedApi570Calculation,
} from "../local-data/models.ts";

type UnitFieldId = Api570TubeUnitFieldId;
type UnitFieldState = Api570TubeUnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");
const lengthUnits = listEngineeringUnitOptions("length");
const temperatureUnits = listEngineeringUnitOptions("temperature");

function initialUnitFields(snapshot?: Api570TubeInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    designPressure: { value: "3.5", unit: "MPa", quantity: "pressure" },
    outsideDiameter: { value: "50.8", unit: "mm", quantity: "length" },
    designTemperature: { value: "200", unit: "C", quantity: "temperature" },
    allowableStress: { value: "120", unit: "MPa", quantity: "pressure" },
    expandedEndFactor: { value: "0.5", unit: "mm", quantity: "length" },
    originalThickness: { value: "5", unit: "mm", quantity: "length" },
    previousThickness: { value: "4.6", unit: "mm", quantity: "length" },
    actualThickness: { value: "4.3", unit: "mm", quantity: "length" },
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
  return String(Number(value.toFixed(quantity === "temperature" ? 2 : 6)));
}

function unitValue(field: UnitFieldState): number {
  return convertUnitToSI(numberFrom(field.value), field.quantity, field.unit);
}

type OutputQuantity = EngineeringQuantity | "rate";

function formatOutput(value: number, quantity: OutputQuantity, system: UnitSystem): string {
  const converted = convertFromSI(value, quantity === "rate" ? "length" : quantity, system);
  return formatDisplayNumber(converted, quantity === "rate" ? "corrosion-rate" : "standard");
}

function UnitInput({ label, field, options, help, onValueChange, onUnitChange, readOnly = false }: { label: string; field: UnitFieldState; options: readonly EngineeringUnitOption[]; help: string; onValueChange: (value: string) => void; onUnitChange: (unit: EngineeringUnit) => void; readOnly?: boolean }) {
  return (
    <label className={`field ${readOnly ? "automatic-field" : ""}`}>
      <span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span>
      <div className={`number-control ${readOnly ? "is-derived" : ""}`}>
        <input type="number" inputMode="decimal" value={readOnly ? "0" : field.value} readOnly={readOnly} onChange={(event) => onValueChange(event.target.value)} />
        <select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </div>
      <small>{help}</small>
    </label>
  );
}

function PlainInput({ label, value, unit, help, onChange }: { label: string; value: string; unit?: string; help: string; onChange: (value: string) => void }) {
  return (
    <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span>{unit ? <div className="number-control"><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><b>{unit}</b></div> : <input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />}<small>{help}</small></label>
  );
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  const nextMode = mode === "auto" ? "manual" : "auto";
  return (
    <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(nextMode)} aria-label={`Switch ${label} to ${nextMode} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} readOnly={mode === "auto"} /><b>yr</b></div><small>{help}</small></label>
  );
}

export function Api570TubeCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: {
  onBack: () => void;
  onNeedProject: () => void;
  notify: (message: string) => void;
  projects: LocalProject[];
  initialCalculation: SavedApi570Calculation | null;
  onSave: (input: SaveApi570CalculationInput) => SavedApi570Calculation;
  onReview: (input: ReviewApi570CalculationInput) => SavedApi570Calculation;
  onApprove: (input: ApproveApi570CalculationInput) => SavedApi570Calculation;
}) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "tube" ? initialCalculation.inputs : undefined;
  const currentYear = new Date().getFullYear();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));
  const [materialSpec, setMaterialSpec] = useState(initialInputs?.materialSpec ?? DEFAULT_API570_MATERIAL_SPEC);
  const [gradeKey, setGradeKey] = useState(initialInputs?.gradeKey ?? DEFAULT_API570_MATERIAL_GRADE);
  const [stressMode, setStressMode] = useState<AutomaticValueMode>(initialInputs?.stressMode ?? "auto");
  const [endCondition, setEndCondition] = useState<Api570TubeEndCondition>(initialInputs?.endCondition ?? "expanded");
  const [weldFactor, setWeldFactor] = useState(initialInputs?.weldFactor ?? "0.9");
  const [buildYear, setBuildYear] = useState(initialInputs?.buildYear ?? "2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState(initialInputs?.previousInspectionYear ?? "2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>(initialInputs?.serviceYearsMode ?? "auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>(initialInputs?.inspectionYearsMode ?? "auto");
  const [manualServiceYears, setManualServiceYears] = useState(initialInputs?.manualServiceYears ?? "20");
  const [manualInspectionYears, setManualInspectionYears] = useState(initialInputs?.manualInspectionYears ?? "5");
  const [minimumMode, setMinimumMode] = useState<AutomaticValueMode>(initialInputs?.minimumMode ?? "auto");
  const [intervalYears, setIntervalYears] = useState(initialInputs?.intervalYears ?? "5");

  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSinceInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);

  const updateFieldValue = (fieldId: UnitFieldId, value: string) => setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  const updateFieldUnit = (fieldId: UnitFieldId, nextUnit: EngineeringUnit) => setFields((current) => {
    const field = current[fieldId];
    const parsed = Number(field.value);
    const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit), field.quantity) : field.value;
    return { ...current, [fieldId]: { ...field, value, unit: nextUnit } };
  });
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setFields((current) => Object.fromEntries(Object.entries(current).map(([fieldId, field]) => {
      const nextUnit = defaultUnitForSystem(field.quantity, nextSystem);
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit), field.quantity) : field.value;
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

  const baseInput = useMemo<Api570TubeInputSI>(() => ({
    outsideDiameterMm: unitValue(fields.outsideDiameter),
    designPressureMpa: unitValue(fields.designPressure),
    allowableStressMpa: resolvedStressMpa,
    weldStrengthReductionFactor: numberFrom(weldFactor, 1),
    endCondition,
    expandedEndThicknessFactorMm: unitValue(fields.expandedEndFactor),
    originalThicknessMm: unitValue(fields.originalThickness),
    previousThicknessMm: unitValue(fields.previousThickness),
    actualThicknessMm: unitValue(fields.actualThickness),
    yearsInService,
    yearsSincePreviousInspection: yearsSinceInspection,
    nextInspectionYears: numberFrom(intervalYears, 5),
  }), [endCondition, fields, intervalYears, resolvedStressMpa, weldFactor, yearsInService, yearsSinceInspection]);
  const automaticResult = useMemo(() => calculateApi570Tube(baseInput), [baseInput]);
  const engineInput = useMemo<Api570TubeInputSI>(() => minimumMode === "manual" ? { ...baseInput, minimumThicknessMm: unitValue(fields.manualMinimum) } : baseInput, [baseInput, fields.manualMinimum, minimumMode]);
  const result = useMemo(() => calculateApi570Tube(engineInput), [engineInput]);
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const inputSnapshot = useMemo<Api570TubeInputSnapshot>(() => ({
    calculatorId: "tube",
    unitSystem,
    fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap,
    endCondition,
    buildYear,
    previousInspectionYear,
    serviceYearsMode,
    inspectionYearsMode,
    manualServiceYears,
    manualInspectionYears,
    minimumMode,
    weldFactor,
    intervalYears,
    materialSpec,
    gradeKey,
    stressMode,
    engineInput,
  }), [buildYear, endCondition, engineInput, fields, gradeKey, inspectionYearsMode, intervalYears, manualInspectionYears, manualServiceYears, materialSpec, minimumMode, previousInspectionYear, serviceYearsMode, stressMode, unitSystem, weldFactor]);

  const reportDefinition: Api570WorkflowReportDefinition = {
    reportKind: "Tube calculation report",
    basisTitle: "Tube design inputs",
    inspectionTitle: "Tube-wall history and service basis",
    summaryLines: [
      `Tube end condition: ${result.endCondition}`,
      `Required thickness: ${formatDisplayNumber(result.requiredThicknessMm)} mm`,
      `Governing MAWP: ${formatDisplayNumber(result.governingMawpMpa)} MPa`,
      `Governing corrosion rate: ${formatDisplayNumber(result.governingCorrosionRateMmPerYear, "corrosion-rate")} mm/yr`,
      `Remaining life: ${formatDisplayNumber(result.remainingLifeYears)} yr`,
    ],
    basisRows: [
      { label: "Formula basis", value: "ASME Section I PG-27.2.1" },
      { label: "Tube end condition", value: result.endCondition === "expanded" ? "Expanded tube end" : "Welded tube end" },
      { label: "Design pressure", value: `${formatDisplayNumber(engineInput.designPressureMpa)} MPa` },
      { label: "Outside diameter", value: `${formatDisplayNumber(engineInput.outsideDiameterMm)} mm` },
      { label: "Allowable stress", value: `${formatDisplayNumber(engineInput.allowableStressMpa)} MPa` },
      { label: "Weld factor w", value: formatDisplayNumber(engineInput.weldStrengthReductionFactor ?? 1) },
      { label: "Expanded-end factor used", value: `${formatDisplayNumber(result.expandedEndThicknessFactorUsedMm)} mm` },
    ],
    inspectionRows: [
      { label: "Original thickness", value: `${formatDisplayNumber(engineInput.originalThicknessMm)} mm` },
      { label: "Previous thickness", value: `${formatDisplayNumber(engineInput.previousThicknessMm)} mm` },
      { label: "Current thickness", value: `${formatDisplayNumber(engineInput.actualThicknessMm)} mm` },
      { label: "Years in service", value: `${engineInput.yearsInService} yr` },
      { label: "Years since previous inspection", value: `${engineInput.yearsSincePreviousInspection} yr` },
    ],
    resultRows: [
      { label: "Required thickness", value: `${formatDisplayNumber(result.requiredThicknessMm)} mm`, primary: true },
      { label: "Minimum thickness used", value: `${formatDisplayNumber(result.minimumThicknessUsedMm)} mm` },
      { label: "Governing corrosion rate", value: `${formatDisplayNumber(result.governingCorrosionRateMmPerYear, "corrosion-rate")} mm/yr` },
      { label: "Remaining life", value: `${formatDisplayNumber(result.remainingLifeYears)} yr` },
      { label: "Governing MAWP", value: `${formatDisplayNumber(result.governingMawpMpa)} MPa`, primary: true },
      { label: "Future MAWP", value: `${formatDisplayNumber(result.futureMawpMpa)} MPa` },
    ],
  };

  const changeMinimumMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && !fields.manualMinimum.value.trim()) updateFieldValue("manualMinimum", formatInput(convertBetweenUnits(automaticResult.automaticMinimumThicknessMm, "length", "mm", fields.manualMinimum.unit), "length"));
    setMinimumMode(mode);
  };
  const changeStressMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && stressResolution.allowableStressMpa !== null) updateFieldValue("allowableStress", formatInput(convertBetweenUnits(stressResolution.allowableStressMpa, "pressure", "MPa", fields.allowableStress.unit), "pressure"));
    setStressMode(mode);
  };
  const changeServiceMode = (mode: AutomaticValueMode) => { if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService)); setServiceYearsMode(mode); };
  const changeInspectionMode = (mode: AutomaticValueMode) => { if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection)); setInspectionYearsMode(mode); };
  const reset = () => { setUnitSystem("metric"); setFields(initialUnitFields()); setMaterialSpec(DEFAULT_API570_MATERIAL_SPEC); setGradeKey(DEFAULT_API570_MATERIAL_GRADE); setStressMode("auto"); setEndCondition("expanded"); setWeldFactor("0.9"); setBuildYear("2006"); setPreviousInspectionYear("2021"); setServiceYearsMode("auto"); setInspectionYearsMode("auto"); setManualServiceYears("20"); setManualInspectionYears("5"); setMinimumMode("auto"); setIntervalYears("5"); };

  const pressureUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));
  const rateUnit = `${lengthUnit}/yr`;

  return (
    <div className="calculator-page api570-tube-page">
      <header className="calculator-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 570 library</button><div className="calculator-heading-row"><div><p className="eyebrow">API 570 · Heat-exchanger tubes</p><h1>Individual tube calculator</h1><p>Required thickness, MAWP, corrosion rate, remaining life and future-service projection.</p></div><div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><Api570RecordWorkflow calculatorId="tube" calculatorLabel="Tube" defaultAssetTag="E-101-TUBE" defaultAssetName="Heat exchanger tubes" defaultTitle="API 570 tube assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} /><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div><div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Inputs</button><i /><button className="active"><b>3</b> Results</button></div></header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card"><div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Set the Tube end condition, design data and result unit system.</p></div></div><Wrench size={19} /></div><div className="form-grid">
            <label className="field"><span>Formula basis</span><div className="select-control">ASME Section I PG-27.2.1</div><small>Identity recorded from the protected original application.</small></label>
            <label className="field"><span>Unit system</span><select className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · MPa / mm / °C</option><option value="us-customary">U.S. customary · psi / in / °F</option></select><small>Results follow this selection; every dimensional input keeps its own selector.</small></label>
            <label className="field"><span>Tube end condition</span><select className="select-control native-select" value={endCondition} onChange={(event) => setEndCondition(event.target.value as Api570TubeEndCondition)}><option value="welded">Welded tube end</option><option value="expanded">Expanded tube end</option></select><small>Welded ends force e = 0. Expanded ends expose the verified thickness factor.</small></label>
            <PlainInput label="Weld strength reduction factor w" value={weldFactor} help="Blank behavior in the protected source is represented by the visible default of 1.00." onChange={setWeldFactor} />
            <UnitInput label="Design pressure" field={fields.designPressure} options={pressureUnits} help="Positive design pressure at the Tube calculation condition." onValueChange={(value) => updateFieldValue("designPressure", value)} onUnitChange={(unit) => updateFieldUnit("designPressure", unit)} />
            <UnitInput label="Tube outside diameter" field={fields.outsideDiameter} options={lengthUnits} help="Outside diameter of the cylindrical tube." onValueChange={(value) => updateFieldValue("outsideDiameter", value)} onUnitChange={(unit) => updateFieldUnit("outsideDiameter", unit)} />
            <Api570MaterialStressFields materialSpec={materialSpec} gradeKey={gradeKey} temperatureField={fields.designTemperature} stressField={fields.allowableStress} stressMode={stressMode} stressResolution={stressResolution} temperatureUnits={temperatureUnits} pressureUnits={pressureUnits} onMaterialChange={(nextSpec, firstGradeKey) => { setMaterialSpec(nextSpec); setGradeKey(firstGradeKey); }} onGradeChange={setGradeKey} onTemperatureValueChange={(value) => updateFieldValue("designTemperature", value)} onTemperatureUnitChange={(unit) => updateFieldUnit("designTemperature", unit)} onStressValueChange={(value) => updateFieldValue("allowableStress", value)} onStressUnitChange={(unit) => updateFieldUnit("allowableStress", unit)} onStressModeChange={changeStressMode} />
            <UnitInput label="Expanded-end thickness factor e" field={fields.expandedEndFactor} options={lengthUnits} help={endCondition === "welded" ? "Automatically fixed at zero for welded tube ends." : "Enter the verified expanded-end thickness factor from the governing controlled source."} readOnly={endCondition === "welded"} onValueChange={(value) => updateFieldValue("expandedEndFactor", value)} onUnitChange={(unit) => updateFieldUnit("expandedEndFactor", unit)} />
          </div><div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Protected Tube route connected.</strong> The typed engine preserves the original end-condition dependency and PG-27.2.1 equation path.</p></div></section>

          <section className="form-card"><div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Automatic years and minimum thickness remain highlighted and editable.</p></div></div><Gauge size={19} /></div><div className="form-grid">
            <PlainInput label="Build year" value={buildYear} unit="year" help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
            <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `Automatically calculated: ${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
            <PlainInput label="Previous inspection year" value={previousInspectionYear} unit="year" help={`Whole year from the build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
            <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `Automatically calculated: ${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
            <UnitInput label="Original thickness" field={fields.originalThickness} options={lengthUnits} help="Original or nominal recorded tube-wall thickness." onValueChange={(value) => updateFieldValue("originalThickness", value)} onUnitChange={(unit) => updateFieldUnit("originalThickness", unit)} />
            <UnitInput label="Previous measured thickness" field={fields.previousThickness} options={lengthUnits} help="Representative thickness at the previous inspection." onValueChange={(value) => updateFieldValue("previousThickness", value)} onUnitChange={(unit) => updateFieldUnit("previousThickness", unit)} />
            <UnitInput label="Current measured thickness" field={fields.actualThickness} options={lengthUnits} help="Current controlling tube-wall thickness." onValueChange={(value) => updateFieldValue("actualThickness", value)} onUnitChange={(unit) => updateFieldUnit("actualThickness", unit)} />
            <label className="field automatic-field"><span>Minimum thickness used<button type="button" title="Auto uses the pressure-required Tube thickness." aria-label="Minimum thickness used help">?</button><button type="button" className={`field-mode-toggle ${minimumMode}`} onClick={() => changeMinimumMode(minimumMode === "auto" ? "manual" : "auto")} aria-label={`Switch Minimum thickness used to ${minimumMode === "auto" ? "manual" : "auto"} mode`}>{minimumMode}</button></span><div className={`number-control is-derived ${minimumMode === "manual" ? "is-manual" : ""}`}><input type="number" inputMode="decimal" value={minimumMode === "auto" ? formatInput(convertBetweenUnits(automaticResult.automaticMinimumThicknessMm, "length", "mm", fields.manualMinimum.unit), "length") : fields.manualMinimum.value} readOnly={minimumMode === "auto"} onChange={(event) => updateFieldValue("manualMinimum", event.target.value)} /><select className="unit-picker" aria-label="Minimum thickness used unit" value={fields.manualMinimum.unit} onChange={(event) => updateFieldUnit("manualMinimum", event.target.value as EngineeringUnit)}>{lengthUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><small>{minimumMode === "auto" ? "Automatically follows the Tube pressure-design thickness." : "Manual override is active and highlighted."}</small></label>
            <label className="field"><span>Future service interval</span><select className="select-control native-select" value={intervalYears} onChange={(event) => setIntervalYears(event.target.value)}>{Array.from({ length: 20 }, (_, index) => index + 1).map((year) => <option key={year} value={year}>{year} years</option>)}</select><small>Protected API 570 Tube workflow range: 1 to 20 years.</small></label>
          </div><div className="unit-system-note"><Info size={17} /><p><strong>Mixed field units are active.</strong> Each selector converts its value live. The engine receives SI values; results follow <b>{unitSystem === "metric" ? "Metric SI" : "U.S. customary"}</b>.</p></div></section>

          <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the Tube result</h3></div></div><span>No standards PDF</span></div><p>Confirm the Tube end condition, outside diameter, allowable stress, weld factor, expanded-end factor and inspection measurements against controlled project records. This calculator does not bundle copied standards tables and does not replace responsible engineering review.</p><div className="reference-points"><span><b>01</b>Confirm welded or expanded construction.</span><span><b>02</b>Verify S, w and e from controlled records.</span><span><b>03</b>Review corrosion rate and future MAWP.</span></div></section>
        </div>

        <aside className="result-column"><section className="result-card"><div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div><div className="result-primary-grid"><div className="result-primary"><p>Remaining life</p><div className="result-primary-value"><strong>{formatDisplayNumber(result.remainingLifeYears)}</strong><span>yr</span></div></div><div className="result-primary"><p>Required thickness</p><div className="result-primary-value"><strong>{formatOutput(result.requiredThicknessMm, "length", unitSystem)}</strong><span>{lengthUnit}</span></div></div></div><div className="result-comparison"><span>Minimum used<strong>{formatOutput(result.minimumThicknessUsedMm, "length", unitSystem)} {lengthUnit}</strong></span><span>Current thickness<strong>{formatOutput(unitValue(fields.actualThickness), "length", unitSystem)} {lengthUnit}</strong></span></div><div className="result-comparison"><span>Current MAWP<strong>{formatOutput(result.governingMawpMpa, "pressure", unitSystem)} {pressureUnit}</strong></span><span>Governing corrosion rate<strong>{formatOutput(result.governingCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></span></div><div className={`result-status ${result.ok ? warning ? "is-manual" : "is-valid" : ""}`}>{result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : warning ? "Engineering scope review required" : "Calculation completed"}</strong><span>{error?.message ?? warning?.message ?? "Review the required thickness, remaining life, and corrosion-rate results before use."}</span></div></div></section>
          <section className="trace-card"><p className="eyebrow">Supporting results</p><h3>Calculation details</h3><div><span>End condition</span><strong>{result.endCondition}</strong></div><div><span>Expanded-end factor used</span><strong>{formatOutput(result.expandedEndThicknessFactorUsedMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Long-term corrosion rate</span><strong>{formatOutput(result.longTermCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></div><div><span>Short-term corrosion rate</span><strong>{formatOutput(result.shortTermCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></div><div><span>Governing corrosion rate</span><strong>{formatOutput(result.governingCorrosionRateMmPerYear, "rate", unitSystem)} {rateUnit}</strong></div><div><span>Corrosion allowance</span><strong>{formatOutput(result.corrosionAllowanceMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Projected thickness ({result.intervalYears} yr)</span><strong>{formatOutput(result.projectedThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Future MAWP thickness</span><strong>{formatOutput(result.futureMawpThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div><div><span>Future MAWP</span><strong>{formatOutput(result.futureMawpMpa, "pressure", unitSystem)} {pressureUnit}</strong></div><div><span>Hydrostatic pressure</span><strong>{formatOutput(result.hydrostaticTestPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></div><div><span>Pneumatic pressure</span><strong>{formatOutput(result.pneumaticTestPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></div></section>
        </aside>
      </div>
    </div>
  );
}
