import { useMemo, useState } from "react";
import {
  calculateApi570HydroTest,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570HydroTestInputSI,
  AutomaticValueMode,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570HydroTestInputSnapshot, Api570UnitFieldSnapshot } from "../local-data/models.ts";

type UnitFieldId = "designPressure" | "designStress" | "testStress";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");

function initialUnitFields(snapshot?: Api570HydroTestInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    designPressure: { value: "2.5", unit: "MPa", quantity: "pressure" },
    designStress: { value: "138", unit: "MPa", quantity: "pressure" },
    testStress: { value: "165", unit: "MPa", quantity: "pressure" },
  };
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

function formatPressure(value: number, system: UnitSystem): string {
  const converted = convertFromSI(value, "pressure", system);
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

export function Api570HydroTestCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "hydro-test" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));
  const [ratioMode, setRatioMode] = useState<AutomaticValueMode>(initialInputs?.ratioMode ?? "auto");
  const [manualStressRatio, setManualStressRatio] = useState(initialInputs?.manualStressRatio ?? "1.25");

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

  const baseInput = useMemo<Api570HydroTestInputSI>(() => ({
    designPressureMpa: unitValue(fields.designPressure),
    allowableStressDesignMpa: unitValue(fields.designStress),
    allowableStressTestMpa: unitValue(fields.testStress),
  }), [fields]);
  const automaticResult = useMemo(() => calculateApi570HydroTest(baseInput), [baseInput]);
  const input = useMemo<Api570HydroTestInputSI>(() => ratioMode === "manual"
    ? { ...baseInput, manualStressRatio: numberFrom(manualStressRatio) }
    : baseInput, [baseInput, manualStressRatio, ratioMode]);
  const result = useMemo(() => calculateApi570HydroTest(input), [input]);
  const inputSnapshot = useMemo<Api570HydroTestInputSnapshot>(() => ({ calculatorId: "hydro-test", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, ratioMode, manualStressRatio, engineInput: input }), [fields, input, manualStressRatio, ratioMode, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Hydro test calculation report", basisTitle: "Hydro-test basis", inspectionTitle: "Stress-ratio selection", summaryLines: [`Minimum hydro test pressure: ${formatDisplayNumber(result.minimumHydroTestPressureMpa)} MPa`, `Stress ratio used: ${formatDisplayNumber(result.stressRatioUsed)}`], basisRows: [{ label: "Formula basis", value: "PT = 1.5 x P x Rr" }, { label: "Design pressure", value: `${formatDisplayNumber(input.designPressureMpa)} MPa` }, { label: "Allowable stress at design temperature", value: `${formatDisplayNumber(input.allowableStressDesignMpa ?? 0)} MPa` }, { label: "Allowable stress at test temperature", value: `${formatDisplayNumber(input.allowableStressTestMpa ?? 0)} MPa` }], inspectionRows: [{ label: "Ratio mode", value: ratioMode === "manual" ? "Manual override" : "Automatic" }, { label: "Calculated ratio", value: result.calculatedStressRatio > 0 ? formatDisplayNumber(result.calculatedStressRatio) : "Unavailable" }, { label: "Ratio source", value: result.stressRatioSource }, { label: "Ratio used", value: formatDisplayNumber(result.stressRatioUsed) }], resultRows: [{ label: "Minimum hydro test pressure", value: `${formatDisplayNumber(result.minimumHydroTestPressureMpa)} MPa`, primary: true }, { label: "Stress ratio used", value: formatDisplayNumber(result.stressRatioUsed) }] };
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const error = result.issues.find((issue) => issue.severity === "error");
  const hasManualOverride = ratioMode === "manual";

  const changeRatioMode = (nextMode: AutomaticValueMode) => {
    if (nextMode === "manual") setManualStressRatio(formatInput(automaticResult.stressRatioUsed));
    setRatioMode(nextMode);
  };
  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
    setRatioMode("auto");
    setManualStressRatio("1.25");
  };

  const pressureUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const ratioSourceLabel = result.stressRatioSource === "manual"
    ? "Manual override"
    : result.stressRatioSource === "stress-ratio" ? "Automatic ST / S" : "Protected default";

  return (
    <div className="calculator-page api570-hydro-test-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 3 of 8</p>
            <h1>Hydro test pressure</h1>
            <p>Minimum hydrostatic pressure with automatic or manually controlled stress ratio.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="hydro-test" calculatorLabel="Hydro Test" defaultAssetTag="P-101-HT" defaultAssetName="Piping hydro test" defaultTitle="API 570 hydro test assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
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
              <div><span>01</span><div><h2>Calculation basis</h2><p>Set the protected hydro-test equation and output units.</p></div></div>
              <Wrench size={19} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Formula basis</span>
                <div className="select-control">B31.3 345.4.2 · PT = 1.5 P Rr</div>
                <small>Equation identity and dependency order recorded from the protected original application.</small>
              </label>
              <label className="field">
                <span>Unit system</span>
                <select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}>
                  <option value="metric">Metric · MPa</option>
                  <option value="us-customary">U.S. customary · psi</option>
                </select>
                <small>Results follow this selection; each pressure input keeps its own selector.</small>
              </label>
            </div>
            <div className="form-note is-valid">
              <ShieldCheck size={17} />
              <p><strong>Other Piping Calculation 3 is connected.</strong> Flange Hydro Test remains next in the controlled audit sequence.</p>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading">
              <div><span>02</span><div><h2>Pressure and stress-ratio data</h2><p>Automatic Rr remains visible and can be overridden manually.</p></div></div>
              <Gauge size={19} />
            </div>
            <div className="form-grid">
              <UnitInput label="Design pressure" field={fields.designPressure} options={pressureUnits} help="Positive design pressure P used by the hydro-test equation." onValueChange={(value) => updateFieldValue("designPressure", value)} onUnitChange={(unit) => updateFieldUnit("designPressure", unit)} />
              <UnitInput label="S at design temperature" field={fields.designStress} options={pressureUnits} help="Optional controlled-source allowable stress S at design temperature." onValueChange={(value) => updateFieldValue("designStress", value)} onUnitChange={(unit) => updateFieldUnit("designStress", unit)} />
              <UnitInput label="ST at test temperature" field={fields.testStress} options={pressureUnits} help="Optional controlled-source allowable stress ST at test temperature." onValueChange={(value) => updateFieldValue("testStress", value)} onUnitChange={(unit) => updateFieldUnit("testStress", unit)} />
              <label className="field automatic-field">
                <span>Stress ratio Rr<button type="button" title="Auto calculates ST / S. Manual mode uses the highlighted override." aria-label="Stress ratio Rr help">?</button><button type="button" className={`field-mode-toggle ${ratioMode}`} onClick={() => changeRatioMode(ratioMode === "auto" ? "manual" : "auto")} aria-label={`Switch Stress ratio Rr to ${ratioMode === "auto" ? "manual" : "auto"} mode`}>{ratioMode}</button></span>
                <div className={`number-control is-derived ${hasManualOverride ? "is-manual" : ""}`}>
                  <input aria-label="Stress ratio Rr" type="number" inputMode="decimal" value={hasManualOverride ? manualStressRatio : formatInput(automaticResult.stressRatioUsed)} onChange={(event) => setManualStressRatio(event.target.value)} readOnly={!hasManualOverride} />
                  <b>ratio</b>
                </div>
                <small>{hasManualOverride ? "Manual Rr override is active and highlighted; the protected 6.50 cap still applies." : "Automatically uses ST / S when both stresses are positive, otherwise the protected default Rr = 1.00."}</small>
              </label>
            </div>
            <div className={`form-note ${hasManualOverride ? "is-manual" : "is-valid"}`}>
              {hasManualOverride ? <TriangleAlert size={18} /> : <Info size={17} />}
              <p><strong>{hasManualOverride ? "Manual stress-ratio override active." : "Automatic stress ratio active."}</strong> {hasManualOverride ? "Verify the highlighted Rr against the controlled test basis before issue." : "The calculated ratio updates immediately when S or ST changes."}</p>
            </div>
            <div className="unit-system-note">
              <Info size={17} />
              <p><strong>Mixed pressure units are active.</strong> Input selectors normalize into the SI engine while results follow <b>{unitSystem === "metric" ? "Metric SI" : "U.S. customary"}</b>.</p>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-heading">
              <div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the hydro-test result</h3></div></div>
              <span>No standards PDF</span>
            </div>
            <p>Confirm the design pressure, test temperature, material stress values and governing test procedure against controlled project records. This calculator reproduces the audited equation only and does not establish test safety, limits or approval requirements.</p>
            <div className="reference-points">
              <span><b>01</b>Confirm the hydrostatic test basis.</span>
              <span><b>02</b>Verify S and ST from controlled records.</span>
              <span><b>03</b>Review the Rr source and 6.50 cap.</span>
            </div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Live engine <small>{result.ok ? "Parity passed" : "Input review"}</small></div>
            <p>Minimum hydro test pressure</p>
            <div className="result-value"><strong>{formatPressure(result.minimumHydroTestPressureMpa, unitSystem)}</strong><span>{pressureUnit}</span></div>
            <div className="result-comparison">
              <span>Rr used<strong>{formatDisplayNumber(result.stressRatioUsed)}</strong></span>
              <span>Ratio source<strong>{ratioSourceLabel}</strong></span>
            </div>
            <div className={`result-status ${result.ok ? hasManualOverride ? "is-manual" : "is-valid" : ""}`}>
              {result.ok && !warning && !hasManualOverride ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div>
                <strong>{error ? "Resolve input issues" : hasManualOverride ? "Calculation includes manual Rr" : warning ? "Calculation completed with protected fallback" : "Calculation completed"}</strong>
                <span>{error?.message ?? warning?.message ?? (hasManualOverride ? "Verify the highlighted manual ratio before engineering approval." : "Protected Hydro Test Pressure equation and SI result object are active.")}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Result trace</p>
            <h3>Visible calculation context</h3>
            <div><span>Engine ID</span><strong>{result.engineId}</strong></div>
            <div><span>Formula</span><strong>PT = 1.5 P Rr</strong></div>
            <div><span>Automatic ratio</span><strong>{result.calculatedStressRatio > 0 ? formatDisplayNumber(result.calculatedStressRatio) : "Unavailable"}</strong></div>
            <div><span>Ratio source</span><strong>{ratioSourceLabel}</strong></div>
            <div><span>Rr used</span><strong>{formatDisplayNumber(result.stressRatioUsed)}</strong></div>
            <div><span>Design pressure</span><strong>{formatPressure(unitValue(fields.designPressure), unitSystem)} {pressureUnit}</strong></div>
            <div><span>Minimum hydro test pressure</span><strong>{formatPressure(result.minimumHydroTestPressureMpa, unitSystem)} {pressureUnit}</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
