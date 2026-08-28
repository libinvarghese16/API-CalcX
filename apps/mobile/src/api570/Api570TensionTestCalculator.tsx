import { useMemo, useState } from "react";
import {
  calculateApi570TensionTest,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570TensionAreaSource,
  Api570TensionTestInputSI,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570TensionTestInputSnapshot, Api570UnitFieldSnapshot } from "../local-data/models.ts";

type UnitFieldId = "radius" | "diameter" | "width" | "thickness" | "manualArea" | "testLoad" | "targetStrength";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const lengthUnits = listEngineeringUnitOptions("length");
const areaUnits = listEngineeringUnitOptions("area");
const forceUnits = listEngineeringUnitOptions("force");
const pressureUnits = listEngineeringUnitOptions("pressure");

function initialUnitFields(snapshot?: Api570TensionTestInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    radius: { value: "6", unit: "mm", quantity: "length" },
    diameter: { value: "10", unit: "mm", quantity: "length" },
    width: { value: "12.5", unit: "mm", quantity: "length" },
    thickness: { value: "6", unit: "mm", quantity: "length" },
    manualArea: { value: "80", unit: "mm2", quantity: "area" },
    testLoad: { value: "40", unit: "kN", quantity: "force" },
    targetStrength: { value: "450", unit: "MPa", quantity: "pressure" },
  };
}

function numberFrom(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(9))) : "";
}

function unitValue(field: UnitFieldState): number {
  return convertUnitToSI(numberFrom(field.value), field.quantity, field.unit);
}

function formatOutput(value: number, quantity: EngineeringQuantity, system: UnitSystem): string {
  const converted = convertFromSI(value, quantity, system);
  return formatDisplayNumber(converted);
}

function areaSourceLabel(source: string): string {
  if (source === "tsa") return "Turned specimen area (TSA)";
  if (source === "rsa") return "Reduced specimen area (RSA)";
  if (source === "manual") return "Manual area";
  return "No area available";
}

function UnitInput({ label, field, options, help, onValueChange, onUnitChange }: {
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

export function Api570TensionTestCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "tension-test" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));
  const [areaSource, setAreaSource] = useState<Api570TensionAreaSource>(initialInputs?.areaSource ?? "auto");

  const updateFieldValue = (fieldId: UnitFieldId, value: string) => setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  const updateFieldUnit = (fieldId: UnitFieldId, nextUnit: EngineeringUnit) => {
    setFields((current) => {
      const field = current[fieldId];
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value;
      return { ...current, [fieldId]: { ...field, value, unit: nextUnit } };
    });
  };
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setFields((current) => Object.fromEntries(Object.entries(current).map(([fieldId, field]) => {
      const nextUnit = defaultUnitForSystem(field.quantity, nextSystem);
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value;
      return [fieldId, { ...field, value, unit: nextUnit }];
    })) as UnitFieldMap);
  };

  const input = useMemo<Api570TensionTestInputSI>(() => ({
    turnedSpecimenRadiusMm: unitValue(fields.radius),
    turnedSpecimenDiameterMm: unitValue(fields.diameter),
    reducedSpecimenWidthMm: unitValue(fields.width),
    reducedSpecimenThicknessMm: unitValue(fields.thickness),
    manualAreaMm2: unitValue(fields.manualArea),
    areaSource,
    testLoadKn: unitValue(fields.testLoad),
    targetTensileStrengthMpa: unitValue(fields.targetStrength),
  }), [areaSource, fields]);
  const result = useMemo(() => calculateApi570TensionTest(input), [input]);
  const inputSnapshot = useMemo<Api570TensionTestInputSnapshot>(() => ({ calculatorId: "tension-test", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, areaSource, engineInput: input }), [areaSource, fields, input, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Tension test calculation report", basisTitle: "Specimen geometry", inspectionTitle: "Test and target basis", summaryLines: [`Tensile strength: ${formatDisplayNumber(result.tensileStrengthMpa)} MPa`, `Required load: ${formatDisplayNumber(result.requiredLoadKn)} kN`], basisRows: [{ label: "Requested area source", value: result.requestedAreaSource.toUpperCase() }, { label: "Resolved area source", value: areaSourceLabel(result.resolvedAreaSource) }, { label: "Turned specimen area", value: `${formatDisplayNumber(result.turnedSpecimenAreaMm2)} mm2` }, { label: "Reduced specimen area", value: `${formatDisplayNumber(result.reducedSpecimenAreaMm2)} mm2` }, { label: "Selected area", value: `${formatDisplayNumber(result.selectedAreaMm2)} mm2` }], inspectionRows: [{ label: "Test load", value: `${formatDisplayNumber(input.testLoadKn ?? 0)} kN` }, { label: "Target tensile strength", value: `${formatDisplayNumber(input.targetTensileStrengthMpa ?? 0)} MPa` }], resultRows: [{ label: "Tensile strength", value: `${formatDisplayNumber(result.tensileStrengthMpa)} MPa`, primary: true }, { label: "Required load", value: `${formatDisplayNumber(result.requiredLoadKn)} kN`, primary: true }] };
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
    setAreaSource("auto");
  };

  const areaUnit = unitSymbol(defaultUnitForSystem("area", unitSystem));
  const forceUnit = unitSymbol(defaultUnitForSystem("force", unitSystem));
  const strengthUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));

  return (
    <div className="calculator-page api570-tension-test-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 7 of 8</p>
            <h1>Tension Test</h1>
            <p>Turned, reduced, and manual specimen-area routes with tensile-strength and required-load results.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="tension-test" calculatorLabel="Tension Test" defaultAssetTag="TT-101" defaultAssetName="Tension test specimen" defaultTitle="API 570 tension test assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
            <button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
        </div>
        <div className="step-line" aria-label="Calculation workflow">
          <button className="complete"><b>1</b> Basis</button><i />
          <button className="complete"><b>2</b> Specimen</button><i />
          <button className="active"><b>3</b> Results</button>
        </div>
      </header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card">
            <div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Select the protected area route and preferred output units.</p></div></div><Wrench size={19} /></div>
            <div className="form-grid">
              <label className="field">
                <span>Reference basis</span>
                <div className="select-control">ASME Section IX · Area / TS / Load</div>
                <small>Identity and calculation behavior captured from the protected original application.</small>
              </label>
              <label className="field">
                <span>Unit system</span>
                <select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}>
                  <option value="metric">Metric · mm² / MPa / kN</option>
                  <option value="us-customary">U.S. customary · in² / psi / lbf</option>
                </select>
                <small>Results follow this selection; every measured input keeps its own unit selector.</small>
              </label>
              <label className="field automatic-field">
                <span>Area source<button type="button" title="Auto uses manual area, then RSA, then TSA. Explicit selections do not fall back." aria-label="Area source help">?</button></span>
                <select aria-label="Area source" className={`select-control native-select field-mode-toggle ${areaSource === "auto" ? "auto" : "manual"}`} value={areaSource} onChange={(event) => setAreaSource(event.target.value as Api570TensionAreaSource)}>
                  <option value="auto">Auto · Manual → RSA → TSA</option>
                  <option value="tsa">TSA · Turned specimen</option>
                  <option value="rsa">RSA · Reduced specimen</option>
                  <option value="manual">Manual area</option>
                </select>
                <small>Current resolved source: {areaSourceLabel(result.resolvedAreaSource)}.</small>
              </label>
            </div>
            <div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Source precedence verified.</strong> Radius overrides diameter for TSA; explicit source choices never fall back.</p></div>
          </section>

          <section className="form-card">
            <div className="form-card-heading"><div><span>02</span><div><h2>Specimen and test data</h2><p>Enter available laboratory values using their recorded units.</p></div></div><Gauge size={19} /></div>
            <div className="form-grid">
              <UnitInput label="Turned specimen radius R" field={fields.radius} options={lengthUnits} help="TSA = πR². A positive radius takes precedence over diameter." onValueChange={(value) => updateFieldValue("radius", value)} onUnitChange={(unit) => updateFieldUnit("radius", unit)} />
              <UnitInput label="Turned specimen diameter" field={fields.diameter} options={lengthUnits} help="Used as R = diameter / 2 only when radius is blank or zero." onValueChange={(value) => updateFieldValue("diameter", value)} onUnitChange={(unit) => updateFieldUnit("diameter", unit)} />
              <UnitInput label="Reduced specimen width" field={fields.width} options={lengthUnits} help="RSA = width × reduced specimen thickness." onValueChange={(value) => updateFieldValue("width", value)} onUnitChange={(unit) => updateFieldUnit("width", unit)} />
              <UnitInput label="Reduced specimen thickness" field={fields.thickness} options={lengthUnits} help="Both positive width and thickness are required for RSA." onValueChange={(value) => updateFieldValue("thickness", value)} onUnitChange={(unit) => updateFieldUnit("thickness", unit)} />
              <UnitInput label="Manual area" field={fields.manualArea} options={areaUnits} help="Optional selected area or highest-priority Auto override." onValueChange={(value) => updateFieldValue("manualArea", value)} onUnitChange={(unit) => updateFieldUnit("manualArea", unit)} />
              <UnitInput label="Test load" field={fields.testLoad} options={forceUnits} help="Measured load used for TS = load / selected area." onValueChange={(value) => updateFieldValue("testLoad", value)} onUnitChange={(unit) => updateFieldUnit("testLoad", unit)} />
              <UnitInput label="Target tensile strength" field={fields.targetStrength} options={pressureUnits} help="Target strength used for required load = area × strength." onValueChange={(value) => updateFieldValue("targetStrength", value)} onUnitChange={(unit) => updateFieldUnit("targetStrength", unit)} />
            </div>
            <div className="unit-system-note"><Info size={17} /><p><strong>Live conversion is active.</strong> Length, area, force, and strength selectors normalize independently before the SI engine runs.</p></div>
          </section>

          <section className="reference-card">
            <div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before accepting a tensile-test result</h3></div></div><span>No standards PDF</span></div>
            <p>Confirm specimen type and dimensions, original cross-sectional measurements, testing-machine calibration, load record, material specification, acceptance criteria, and the controlled qualification record. This calculator does not determine qualification acceptance.</p>
            <div className="reference-points"><span><b>01</b>Confirm specimen geometry and selected area.</span><span><b>02</b>Verify calibrated load and controlled criteria.</span><span><b>03</b>Retain laboratory and qualification records.</span></div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <div className="result-primary-grid"><div className="result-primary"><p>Tensile strength</p><div className="result-primary-value"><strong>{formatOutput(result.tensileStrengthMpa, "pressure", unitSystem)}</strong><span>{strengthUnit}</span></div></div><div className="result-primary"><p>Required load</p><div className="result-primary-value"><strong>{formatOutput(result.requiredLoadKn, "force", unitSystem)}</strong><span>{forceUnit}</span></div></div></div>
            <div className="result-comparison">
              <span>Selected area<strong>{formatOutput(result.selectedAreaMm2, "area", unitSystem)} {areaUnit}</strong></span>
              <span>Area source<strong>{areaSourceLabel(result.resolvedAreaSource)}</strong></span>
            </div>
            <div className="result-comparison">
              <span>Turned area TSA<strong>{formatOutput(result.turnedSpecimenAreaMm2, "area", unitSystem)} {areaUnit}</strong></span>
              <span>Reduced area RSA<strong>{formatOutput(result.reducedSpecimenAreaMm2, "area", unitSystem)} {areaUnit}</strong></span>
            </div>
            <div className={`result-status ${result.ok && !warning ? "is-valid" : ""}`}>
              {result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div><strong>{error ? "Resolve input issues" : warning ? "Selected area is unavailable" : "Calculation completed"}</strong><span>{error?.message ?? warning?.message ?? `${areaSourceLabel(result.resolvedAreaSource)} supplies the selected area.`}</span></div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Supporting results</p><h3>Calculation details</h3>
            <div><span>Turned radius used</span><strong>{formatDisplayNumber(result.effectiveTurnedRadiusMm)} mm · {result.effectiveTurnedRadiusSource}</strong></div>
            <div><span>TSA = πR²</span><strong>{formatDisplayNumber(result.turnedSpecimenAreaMm2)} mm²</strong></div>
            <div><span>RSA = width × thickness</span><strong>{formatDisplayNumber(result.reducedSpecimenAreaMm2)} mm²</strong></div>
            <div><span>Requested / resolved source</span><strong>{result.requestedAreaSource.toUpperCase()} / {result.resolvedAreaSource.toUpperCase()}</strong></div>
            <div><span>Selected area</span><strong>{formatDisplayNumber(result.selectedAreaMm2)} mm²</strong></div>
            <div><span>TS = load / area</span><strong>{formatDisplayNumber(result.tensileStrengthMpa)} MPa</strong></div>
            <div><span>Required load</span><strong>{formatDisplayNumber(result.requiredLoadKn)} kN</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
