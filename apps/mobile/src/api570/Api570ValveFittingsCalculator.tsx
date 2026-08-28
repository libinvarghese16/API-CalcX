import { useMemo, useState } from "react";
import {
  DEFAULT_API570_MATERIAL_GRADE,
  DEFAULT_API570_MATERIAL_SPEC,
  calculateApi570ValveFittings,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  resolveApi570PipingAllowableStress,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570ValveFittingsAssessmentBasis,
  Api570ValveFittingsInputSI,
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
import type { Api570UnitFieldSnapshot, Api570ValveFittingsInputSnapshot } from "../local-data/models.ts";

type UnitFieldId = "designPressure" | "componentRatedPressure" | "codeRequiredThickness" | "outsideDiameter" | "designTemperature" | "allowableStress" | "allowance" | "availableWall";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");
const lengthUnits = listEngineeringUnitOptions("length");
const temperatureUnits = listEngineeringUnitOptions("temperature");

function initialUnitFields(snapshot?: Api570ValveFittingsInputSnapshot): UnitFieldMap {
  const defaults: UnitFieldMap = {
    designPressure: { value: "2.5", unit: "MPa", quantity: "pressure" },
    componentRatedPressure: { value: "3", unit: "MPa", quantity: "pressure" },
    codeRequiredThickness: { value: "5", unit: "mm", quantity: "length" },
    outsideDiameter: { value: "219.1", unit: "mm", quantity: "length" },
    designTemperature: { value: "150", unit: "C", quantity: "temperature" },
    allowableStress: { value: "138", unit: "MPa", quantity: "pressure" },
    allowance: { value: "1.2", unit: "mm", quantity: "length" },
    availableWall: { value: "8.8", unit: "mm", quantity: "length" },
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

export function Api570ValveFittingsCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "valve-fittings" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));
  const [materialSpec, setMaterialSpec] = useState(initialInputs?.materialSpec ?? DEFAULT_API570_MATERIAL_SPEC);
  const [gradeKey, setGradeKey] = useState(initialInputs?.gradeKey ?? DEFAULT_API570_MATERIAL_GRADE);
  const [stressMode, setStressMode] = useState<AutomaticValueMode>(initialInputs?.stressMode ?? "auto");
  const [qualityFactor, setQualityFactor] = useState(initialInputs?.qualityFactor ?? "0.85");
  const [assessmentBasis, setAssessmentBasis] = useState<Api570ValveFittingsAssessmentBasis>(initialInputs?.assessmentBasis ?? "listed-rating");

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

  const input = useMemo<Api570ValveFittingsInputSI>(() => ({
    assessmentBasis,
    componentRatedPressureMpa: unitValue(fields.componentRatedPressure),
    codeRequiredThicknessMm: unitValue(fields.codeRequiredThickness),
    designPressureMpa: unitValue(fields.designPressure),
    outsideDiameterMm: unitValue(fields.outsideDiameter),
    allowableStressMpa: resolvedStressMpa,
    qualityFactor: numberFrom(qualityFactor, 1),
    allowanceMm: unitValue(fields.allowance),
    availableWallThicknessMm: unitValue(fields.availableWall),
  }), [assessmentBasis, fields, qualityFactor, resolvedStressMpa]);
  const result = useMemo(() => calculateApi570ValveFittings(input), [input]);
  const inputSnapshot = useMemo<Api570ValveFittingsInputSnapshot>(() => ({ calculatorId: "valve-fittings", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, qualityFactor, assessmentBasis, componentRatedPressure: fields.componentRatedPressure.value, codeRequiredThickness: fields.codeRequiredThickness.value, materialSpec, gradeKey, stressMode, engineInput: input }), [assessmentBasis, fields, gradeKey, input, materialSpec, qualityFactor, stressMode, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Valve and fittings assessment report", basisTitle: "Controlled component basis", inspectionTitle: "Available-wall basis", summaryLines: [`Assessment basis: ${assessmentBasis}`, `Component status: ${result.componentAdequate === null ? "screening only" : result.componentAdequate ? "adequate" : "not adequate"}`], basisRows: [{ label: "Assessment basis", value: assessmentBasis }, { label: "Design pressure", value: `${formatDisplayNumber(input.designPressureMpa)} MPa` }, { label: "Listed rating", value: `${formatDisplayNumber(result.componentRatedPressureMpaUsed)} MPa` }, { label: "Code-derived Tmin", value: `${formatDisplayNumber(result.codeRequiredThicknessMmUsed)} mm` }], inspectionRows: [{ label: "Available wall", value: `${formatDisplayNumber(input.availableWallThicknessMm)} mm` }, { label: "Net available wall", value: `${formatDisplayNumber(result.netAvailableThicknessMm)} mm` }], resultRows: [{ label: "Screening thickness", value: `${formatDisplayNumber(result.pressureDesignThicknessMm)} mm` }, { label: "Governing minimum thickness", value: `${formatDisplayNumber(result.minimumRequiredThicknessMm)} mm`, primary: assessmentBasis === "code-derived-thickness" }, { label: "Listed allowable pressure", value: `${formatDisplayNumber(result.allowableWorkingPressureMpa)} MPa`, primary: assessmentBasis === "listed-rating" }] };
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const error = result.issues.find((issue) => issue.severity === "error");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
    setMaterialSpec(DEFAULT_API570_MATERIAL_SPEC);
    setGradeKey(DEFAULT_API570_MATERIAL_GRADE);
    setStressMode("auto");
    setQualityFactor("0.85");
    setAssessmentBasis("listed-rating");
  };

  const changeStressMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && stressResolution.allowableStressMpa !== null) updateFieldValue("allowableStress", formatInput(convertBetweenUnits(stressResolution.allowableStressMpa, "pressure", "MPa", fields.allowableStress.unit)));
    setStressMode(mode);
  };

  const pressureUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));

  return (
    <div className="calculator-page api570-valve-fittings-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 2 of 8</p>
            <h1>Valve and fittings thickness</h1>
            <p>Pressure wall, minimum required thickness and inverse allowable-pressure check.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="valve-fittings" calculatorLabel="Valve and Fittings" defaultAssetTag="VLV-101" defaultAssetName="Valve or flanged fitting" defaultTitle="API 570 valve and fittings assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
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
              <div><span>01</span><div><h2>Calculation basis</h2><p>Set the protected formula route and output units.</p></div></div>
              <Wrench size={19} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Assessment basis</span>
                <select aria-label="Valve assessment basis" className="select-control native-select" value={assessmentBasis} onChange={(event) => setAssessmentBasis(event.target.value as Api570ValveFittingsAssessmentBasis)}><option value="listed-rating">Listed component pressure rating</option><option value="code-derived-thickness">Controlled code-derived Tmin</option><option value="screening-only">1.5 × Barlow screening only</option></select>
                <small>Use a listed rating or a controlled code-derived minimum for a final component check.</small>
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
              <p><strong>Other Piping Calculation 2 is connected.</strong> Hydro Test Pressure remains next in the controlled audit sequence.</p>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading">
              <div><span>02</span><div><h2>Pressure, allowance and wall data</h2><p>Enter each field using its collected unit.</p></div></div>
              <Gauge size={19} />
            </div>
            <div className="form-grid">
              <UnitInput label="Design pressure" field={fields.designPressure} options={pressureUnits} help="Positive design pressure P for the pressure-thickness result." onValueChange={(value) => updateFieldValue("designPressure", value)} onUnitChange={(unit) => updateFieldUnit("designPressure", unit)} />
              {assessmentBasis === "listed-rating" && <UnitInput label="Listed component pressure rating" field={fields.componentRatedPressure} options={pressureUnits} help="Pressure rating from the controlled manufacturer/component rating basis at the applicable temperature." onValueChange={(value) => updateFieldValue("componentRatedPressure", value)} onUnitChange={(unit) => updateFieldUnit("componentRatedPressure", unit)} />}
              {assessmentBasis === "code-derived-thickness" && <UnitInput label="Controlled code-derived Tmin" field={fields.codeRequiredThickness} options={lengthUnits} help="Final required wall obtained from the applicable controlled component design calculation." onValueChange={(value) => updateFieldValue("codeRequiredThickness", value)} onUnitChange={(unit) => updateFieldUnit("codeRequiredThickness", unit)} />}
              <UnitInput label="Outside diameter" field={fields.outsideDiameter} options={lengthUnits} help="Outside diameter D of the valve or flanged fitting." onValueChange={(value) => updateFieldValue("outsideDiameter", value)} onUnitChange={(unit) => updateFieldUnit("outsideDiameter", unit)} />
              <Api570MaterialStressFields materialSpec={materialSpec} gradeKey={gradeKey} temperatureField={fields.designTemperature} stressField={fields.allowableStress} stressMode={stressMode} stressResolution={stressResolution} temperatureUnits={temperatureUnits} pressureUnits={pressureUnits} onMaterialChange={(nextSpec, firstGradeKey) => { setMaterialSpec(nextSpec); setGradeKey(firstGradeKey); }} onGradeChange={setGradeKey} onTemperatureValueChange={(value) => updateFieldValue("designTemperature", value)} onTemperatureUnitChange={(unit) => updateFieldUnit("designTemperature", unit)} onStressValueChange={(value) => updateFieldValue("allowableStress", value)} onStressUnitChange={(unit) => updateFieldUnit("allowableStress", unit)} onStressModeChange={changeStressMode} />
              <label className="field">
                <span>Longitudinal quality factor E<button type="button" title="Blank or non-positive values use E = 1.00, matching the protected calculator." aria-label="Longitudinal quality factor E help">?</button></span>
                <input aria-label="Longitudinal quality factor E" type="number" inputMode="decimal" value={qualityFactor} onChange={(event) => setQualityFactor(event.target.value)} />
                <small>Blank or non-positive values use the protected default E = 1.00 and are disclosed in the result trace.</small>
              </label>
              <UnitInput label="Allowance" field={fields.allowance} options={lengthUnits} help="Mechanical, corrosion and erosion allowance c; a negative entry follows the protected zero clamp." onValueChange={(value) => updateFieldValue("allowance", value)} onUnitChange={(unit) => updateFieldUnit("allowance", unit)} />
              <UnitInput label="Available wall thickness" field={fields.availableWall} options={lengthUnits} help="Optional available wall used for the independent inverse allowable-pressure result." onValueChange={(value) => updateFieldValue("availableWall", value)} onUnitChange={(unit) => updateFieldUnit("availableWall", unit)} />
            </div>
            <div className="unit-system-note">
              <Info size={17} />
              <p><strong>Mixed field units are active.</strong> Input selectors normalize into the SI engine while results follow <b>{unitSystem === "metric" ? "Metric SI" : "U.S. customary"}</b>.</p>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-heading">
              <div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the valve/fittings result</h3></div></div>
              <span>No standards PDF</span>
            </div>
            <p>Confirm component geometry, pressure, allowable stress, quality factor, allowance and available wall against controlled project records. The inverse allowable pressure uses available wall minus allowance and does not depend on design pressure.</p>
            <div className="reference-points">
              <span><b>01</b>Confirm the component and pressure basis.</span>
              <span><b>02</b>Verify S, E and allowance.</span>
              <span><b>03</b>Review net available wall independently.</span>
            </div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <div className="result-primary-grid"><div className="result-primary"><p>{assessmentBasis === "listed-rating" ? "Listed pressure rating" : assessmentBasis === "code-derived-thickness" ? "Code-derived Tmin" : "Screening thickness"}</p><div className="result-primary-value"><strong>{assessmentBasis === "listed-rating" ? formatOutput(result.componentRatedPressureMpaUsed, "pressure", unitSystem) : formatOutput(assessmentBasis === "code-derived-thickness" ? result.codeRequiredThicknessMmUsed : result.minimumRequiredThicknessMm, "length", unitSystem)}</strong><span>{assessmentBasis === "listed-rating" ? pressureUnit : lengthUnit}</span></div></div><div className="result-primary"><p>Assessment status</p><div className="result-primary-value"><strong>{result.componentAdequate === null ? "Screen" : result.componentAdequate ? "Pass" : "Fail"}</strong><span>{result.assessmentStatus}</span></div></div></div>
            <div className="result-comparison">
              <span>Pressure thickness<strong>{formatOutput(result.pressureDesignThicknessMm, "length", unitSystem)} {lengthUnit}</strong></span>
              <span>Net available wall<strong>{formatOutput(result.netAvailableThicknessMm, "length", unitSystem)} {lengthUnit}</strong></span>
            </div>
            <div className={`result-status ${result.ok ? "is-valid" : ""}`}>
              {result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div>
                <strong>{error ? "Resolve input issues" : warning ? "Calculation completed with default" : "Calculation completed"}</strong>
                <span>{error?.message ?? warning?.message ?? "Review required thickness, allowable pressure, and net available wall before use."}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Supporting results</p>
            <h3>Calculation details</h3>
            <div><span>Assessment basis</span><strong>{assessmentBasis}</strong></div>
            <div><span>Screening formula only</span><strong>tm = 1.5(PD/2SE) + c</strong></div>
            <div><span>Quality factor E used</span><strong>{formatDisplayNumber(result.qualityFactorUsed)}</strong></div>
            <div><span>Allowance used</span><strong>{formatOutput(result.allowanceUsedMm, "length", unitSystem)} {lengthUnit}</strong></div>
            <div><span>Net available wall</span><strong>{formatOutput(result.netAvailableThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div>
            <div><span>Pressure thickness</span><strong>{formatOutput(result.pressureDesignThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div>
            <div><span>Minimum required</span><strong>{formatOutput(result.minimumRequiredThicknessMm, "length", unitSystem)} {lengthUnit}</strong></div>
            <div><span>Allowable pressure</span><strong>{formatOutput(result.allowableWorkingPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
