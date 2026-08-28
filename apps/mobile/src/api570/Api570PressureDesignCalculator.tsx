import { useMemo, useState } from "react";
import {
  DEFAULT_API570_MATERIAL_GRADE,
  DEFAULT_API570_MATERIAL_SPEC,
  calculateApi570PressureDesign,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  resolveApi570PipingAllowableStress,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570PressureDesignInputSI,
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
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570PressureDesignInputSnapshot, Api570UnitFieldSnapshot } from "../local-data/models.ts";

type UnitFieldId = "designPressure" | "outsideDiameter" | "designTemperature" | "allowableStress" | "availableThickness";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");
const lengthUnits = listEngineeringUnitOptions("length");
const temperatureUnits = listEngineeringUnitOptions("temperature");

function initialUnitFields(snapshot?: Api570PressureDesignInputSnapshot): UnitFieldMap {
  const defaults: UnitFieldMap = {
    designPressure: { value: "2.5", unit: "MPa", quantity: "pressure" },
    outsideDiameter: { value: "219.1", unit: "mm", quantity: "length" },
    designTemperature: { value: "150", unit: "C", quantity: "temperature" },
    allowableStress: { value: "138", unit: "MPa", quantity: "pressure" },
    availableThickness: { value: "8.8", unit: "mm", quantity: "length" },
  };
  if (!snapshot) return defaults;
  return { ...defaults, ...Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) } as UnitFieldMap;
}

function numberFrom(value: string, fallback = 0): number {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : "";
}

function unitValue(field: UnitFieldState): number {
  return convertUnitToSI(numberFrom(field.value), field.quantity, field.unit);
}

function formatOutput(value: number, quantity: EngineeringQuantity, system: UnitSystem): string {
  const converted = convertFromSI(value, quantity, system);
  return formatDisplayNumber(converted);
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
        <input aria-label={label} type="number" inputMode="decimal" value={field.value} onChange={(event) => onValueChange(event.target.value)} />
        <select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <small>{help}</small>
    </label>
  );
}

export function Api570PressureDesignCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "pressure-design" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));
  const [materialSpec, setMaterialSpec] = useState(initialInputs?.materialSpec ?? DEFAULT_API570_MATERIAL_SPEC);
  const [gradeKey, setGradeKey] = useState(initialInputs?.gradeKey ?? DEFAULT_API570_MATERIAL_GRADE);
  const [stressMode, setStressMode] = useState<AutomaticValueMode>(initialInputs?.stressMode ?? "auto");
  const [qualityFactor, setQualityFactor] = useState(initialInputs?.qualityFactor ?? "0.85");

  const updateFieldValue = (fieldId: UnitFieldId, value: string) => {
    setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  };
  const updateFieldUnit = (fieldId: UnitFieldId, nextUnit: EngineeringUnit) => {
    setFields((current) => {
      const field = current[fieldId];
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim()
        ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit))
        : field.value;
      return { ...current, [fieldId]: { ...field, value, unit: nextUnit } };
    });
  };
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setFields((current) => Object.fromEntries(Object.entries(current).map(([fieldId, field]) => {
      const nextUnit = defaultUnitForSystem(field.quantity, nextSystem);
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim()
        ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit))
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

  const input = useMemo<Api570PressureDesignInputSI>(() => ({
    designPressureMpa: unitValue(fields.designPressure),
    outsideDiameterMm: unitValue(fields.outsideDiameter),
    allowableStressMpa: resolvedStressMpa,
    qualityFactor: numberFrom(qualityFactor, 1),
    availableCorrodedThicknessMm: unitValue(fields.availableThickness),
  }), [fields, qualityFactor, resolvedStressMpa]);
  const result = useMemo(() => calculateApi570PressureDesign(input), [input]);
  const inputSnapshot = useMemo<Api570PressureDesignInputSnapshot>(() => ({ calculatorId: "pressure-design", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, qualityFactor, materialSpec, gradeKey, stressMode, engineInput: input }), [fields, gradeKey, input, materialSpec, qualityFactor, stressMode, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Pressure design calculation report", basisTitle: "Barlow design inputs", inspectionTitle: "Available wall basis", summaryLines: [`Required thickness: ${formatDisplayNumber(result.requiredThicknessMm)} mm`, `Allowable working pressure: ${formatDisplayNumber(result.allowableWorkingPressureMpa)} MPa`], basisRows: [{ label: "Formula basis", value: "API 574 11.1.2 · t = PD / 2SE" }, { label: "Design pressure", value: `${formatDisplayNumber(input.designPressureMpa)} MPa` }, { label: "Outside diameter", value: `${formatDisplayNumber(input.outsideDiameterMm)} mm` }, { label: "Allowable stress", value: `${formatDisplayNumber(input.allowableStressMpa)} MPa` }, { label: "Quality factor E", value: formatDisplayNumber(result.qualityFactorUsed) }], inspectionRows: [{ label: "Available corroded thickness", value: `${formatDisplayNumber(input.availableCorrodedThicknessMm)} mm` }, { label: "Inverse equation", value: "P = 2SEt / D" }], resultRows: [{ label: "Required thickness", value: `${formatDisplayNumber(result.requiredThicknessMm)} mm`, primary: true }, { label: "Allowable working pressure", value: `${formatDisplayNumber(result.allowableWorkingPressureMpa)} MPa`, primary: true }] };
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const error = result.issues.find((issue) => issue.severity === "error");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
    setMaterialSpec(DEFAULT_API570_MATERIAL_SPEC);
    setGradeKey(DEFAULT_API570_MATERIAL_GRADE);
    setStressMode("auto");
    setQualityFactor("0.85");
  };

  const changeStressMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && stressResolution.allowableStressMpa !== null) updateFieldValue("allowableStress", formatInput(convertBetweenUnits(stressResolution.allowableStressMpa, "pressure", "MPa", fields.allowableStress.unit)));
    setStressMode(mode);
  };

  const pressureUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));

  return (
    <div className="calculator-page api570-pressure-design-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 1 of 8</p>
            <h1>Pressure design thickness</h1>
            <p>Barlow required-thickness and inverse allowable-working-pressure check.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="pressure-design" calculatorLabel="Pressure Design" defaultAssetTag="P-101" defaultAssetName="Piping component" defaultTitle="API 570 pressure design assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
            <button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
        </div>
        <div className="step-line" aria-label="Calculation workflow">
          <button className="complete"><b>1</b> Basis</button><i />
          <button className="complete"><b>2</b> Inputs</button><i />
          <button className="active"><b>3</b> Results</button>
        </div>
      </header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card">
            <div className="form-card-heading">
              <div><span>01</span><div><h2>Calculation basis</h2><p>Set the Barlow basis and output unit system.</p></div></div>
              <Wrench size={19} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Formula basis</span>
                <div className="select-control">API 574 11.1.2 · t = PD / 2SE</div>
                <small>Identity and equation recorded from the protected original application.</small>
              </label>
              <label className="field">
                <span>Unit system</span>
                <select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}>
                  <option value="metric">Metric · MPa / mm</option>
                  <option value="us-customary">U.S. customary · psi / in</option>
                </select>
                <small>Results follow this selection; every dimensional input keeps its own selector.</small>
              </label>
            </div>
            <div className="form-note is-valid">
              <ShieldCheck size={17} />
              <p><strong>Other Piping Calculations sequence started.</strong> Pressure design is locally validated; Valve and Flanged Fittings Thickness remains next in the controlled audit.</p>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading">
              <div><span>02</span><div><h2>Pressure and wall data</h2><p>Enter field values using their collected units.</p></div></div>
              <Gauge size={19} />
            </div>
            <div className="form-grid">
              <UnitInput label="Design pressure" field={fields.designPressure} options={pressureUnits} help="Positive design pressure P for the thickness calculation." onValueChange={(value) => updateFieldValue("designPressure", value)} onUnitChange={(unit) => updateFieldUnit("designPressure", unit)} />
              <UnitInput label="Outside diameter" field={fields.outsideDiameter} options={lengthUnits} help="Outside diameter D of the piping component." onValueChange={(value) => updateFieldValue("outsideDiameter", value)} onUnitChange={(unit) => updateFieldUnit("outsideDiameter", unit)} />
              <Api570MaterialStressFields materialSpec={materialSpec} gradeKey={gradeKey} temperatureField={fields.designTemperature} stressField={fields.allowableStress} stressMode={stressMode} stressResolution={stressResolution} temperatureUnits={temperatureUnits} pressureUnits={pressureUnits} onMaterialChange={(nextSpec, firstGradeKey) => { setMaterialSpec(nextSpec); setGradeKey(firstGradeKey); }} onGradeChange={setGradeKey} onTemperatureValueChange={(value) => updateFieldValue("designTemperature", value)} onTemperatureUnitChange={(unit) => updateFieldUnit("designTemperature", unit)} onStressValueChange={(value) => updateFieldValue("allowableStress", value)} onStressUnitChange={(unit) => updateFieldUnit("allowableStress", unit)} onStressModeChange={changeStressMode} />
              <label className="field">
                <span>Longitudinal quality factor E<button type="button" title="Blank or non-positive values use E = 1.00, matching the protected calculator." aria-label="Longitudinal quality factor E help">?</button></span>
                <input aria-label="Longitudinal quality factor E" type="number" inputMode="decimal" value={qualityFactor} onChange={(event) => setQualityFactor(event.target.value)} />
                <small>Blank or non-positive values use the protected default E = 1.00 and are disclosed in the result trace.</small>
              </label>
              <UnitInput label="Available corroded thickness" field={fields.availableThickness} options={lengthUnits} help="Optional thickness t used only for the inverse allowable-working-pressure result." onValueChange={(value) => updateFieldValue("availableThickness", value)} onUnitChange={(unit) => updateFieldUnit("availableThickness", unit)} />
            </div>
            <div className="unit-system-note">
              <Info size={17} />
              <p><strong>Mixed field units are active.</strong> Input selectors convert live into the SI engine while results follow <b>{unitSystem === "metric" ? "Metric SI" : "U.S. customary"}</b>.</p>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-heading">
              <div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the pressure-design result</h3></div></div>
              <span>No standards PDF</span>
            </div>
            <p>Confirm pressure, outside diameter, allowable stress, quality factor and available wall thickness against controlled project records. The calculator contains the audited equation only and does not replace the applicable code edition or responsible engineering review.</p>
            <div className="reference-points">
              <span><b>01</b>Confirm the pressure-temperature basis.</span>
              <span><b>02</b>Verify S and E from controlled records.</span>
              <span><b>03</b>Compare required and available thickness.</span>
            </div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <div className="result-primary-grid"><div className="result-primary"><p>Required thickness</p><div className="result-primary-value"><strong>{formatOutput(result.requiredThicknessMm, "length", unitSystem)}</strong><span>{lengthUnit}</span></div></div><div className="result-primary"><p>Allowable pressure</p><div className="result-primary-value"><strong>{formatOutput(result.allowableWorkingPressureMpa, "pressure", unitSystem)}</strong><span>{pressureUnit}</span></div></div></div>
            <div className="result-comparison">
              <span>Design pressure<strong>{formatOutput(unitValue(fields.designPressure), "pressure", unitSystem)} {pressureUnit}</strong></span>
              <span>Available thickness<strong>{formatOutput(unitValue(fields.availableThickness), "length", unitSystem)} {lengthUnit}</strong></span>
            </div>
            <div className={`result-status ${result.ok ? "is-valid" : ""}`}>
              {result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div>
                <strong>{error ? "Resolve input issues" : warning ? "Calculation completed with default" : "Calculation completed"}</strong>
                <span>{error?.message ?? warning?.message ?? "Review required thickness, allowable pressure, and available wall before use."}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Supporting results</p>
            <h3>Calculation details</h3>
            <div><span>Formula</span><strong>t = PD / 2SE</strong></div>
            <div><span>Inverse formula</span><strong>P = 2SEt / D</strong></div>
            <div><span>Quality factor E used</span><strong>{formatDisplayNumber(result.qualityFactorUsed)}</strong></div>
            <div><span>Required thickness</span><strong>{formatOutput(result.requiredThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div>
            <div><span>Allowable pressure</span><strong>{formatOutput(result.allowableWorkingPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
