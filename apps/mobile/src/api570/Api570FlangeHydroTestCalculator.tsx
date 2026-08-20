import { useMemo, useState } from "react";
import {
  calculateApi570FlangeHydroTest,
  convertBetweenUnits,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
} from "@api-calc-pro/calc-engine";
import type {
  Api570FlangeHydroTestInputSI,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Clock3, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570FlangeHydroTestInputSnapshot, Api570UnitFieldSnapshot } from "../local-data/models.ts";

type UnitFieldId = "rating38C" | "rating100F" | "nominalPipeSize";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");
const lengthUnits = listEngineeringUnitOptions("length");

function initialUnitFields(snapshot?: Api570FlangeHydroTestInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    rating38C: { value: "17", unit: "Bar", quantity: "pressure" },
    rating100F: { value: "250", unit: "psi", quantity: "pressure" },
    nominalPipeSize: { value: "6", unit: "in", quantity: "length" },
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

export function Api570FlangeHydroTestCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "flange-hydro-test" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));

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

  const input = useMemo<Api570FlangeHydroTestInputSI>(() => ({
    pressureRating38CMpa: unitValue(fields.rating38C),
    pressureRating100FMpa: unitValue(fields.rating100F),
    nominalPipeSizeMm: unitValue(fields.nominalPipeSize),
  }), [fields]);
  const result = useMemo(() => calculateApi570FlangeHydroTest(input), [input]);
  const inputSnapshot = useMemo<Api570FlangeHydroTestInputSnapshot>(() => ({ calculatorId: "flange-hydro-test", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, engineInput: input }), [fields, input, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Flange hydro test calculation report", basisTitle: "Pressure-rating basis", inspectionTitle: "Test duration basis", summaryLines: [`Metric hydro pressure: ${formatDisplayNumber(result.hydroTestPressureBar)} bar`, `U.S. hydro pressure: ${formatDisplayNumber(result.hydroTestPressurePsi)} psi`], basisRows: [{ label: "Formula basis", value: "PT = 1.5 x pressure rating" }, { label: "38 C pressure rating", value: `${formatDisplayNumber(result.pressureRating38CBarUsed)} bar` }, { label: "100 F pressure rating", value: `${formatDisplayNumber(result.pressureRating100FPsiUsed)} psi` }], inspectionRows: [{ label: "Nominal pipe size", value: `${formatDisplayNumber(result.nominalPipeSizeInUsed)} in` }, { label: "Minimum test duration", value: `${formatDisplayNumber(result.minimumTestDurationSeconds)} seconds` }], resultRows: [{ label: "Metric hydro test pressure", value: `${formatDisplayNumber(result.hydroTestPressureBar)} bar`, primary: true }, { label: "U.S. hydro test pressure", value: `${formatDisplayNumber(result.hydroTestPressurePsi)} psi`, primary: true }, { label: "Minimum duration", value: `${formatDisplayNumber(result.minimumTestDurationSeconds)} seconds` }] };
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const error = result.issues.find((issue) => issue.severity === "error");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
  };

  const mainPressure = formatDisplayNumber(unitSystem === "metric" ? result.hydroTestPressureBar : result.hydroTestPressurePsi);
  const mainPressureUnit = unitSystem === "metric" ? "bar" : "psi";
  const alternatePressure = unitSystem === "metric" ? `${formatDisplayNumber(result.hydroTestPressurePsi)} psi` : `${formatDisplayNumber(result.hydroTestPressureBar)} bar`;

  return (
    <div className="calculator-page api570-flange-hydro-test-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 4 of 8</p>
            <h1>Flange hydro test</h1>
            <p>Rounded Metric and U.S. hydro-test pressures with NPS-based minimum duration.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="flange-hydro-test" calculatorLabel="Flange Hydro Test" defaultAssetTag="FLG-101-HT" defaultAssetName="Flanged piping component" defaultTitle="API 570 flange hydro test assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
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
              <div><span>01</span><div><h2>Calculation basis</h2><p>Set the protected rating routes and preferred result system.</p></div></div>
              <Wrench size={19} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Formula basis</span>
                <div className="select-control">B16.5 2.6 / 8.2.2 / 8.2.4 · PT = 1.5 × rating</div>
                <small>38°C rating rounds upward to 1 bar; 100°F rating rounds upward to 25 psi.</small>
              </label>
              <label className="field">
                <span>Unit system</span>
                <select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}>
                  <option value="metric">Metric · bar</option>
                  <option value="us-customary">U.S. customary · psi</option>
                </select>
                <small>The featured result follows this selection; both protected pressure routes remain visible.</small>
              </label>
            </div>
            <div className="form-note is-valid">
              <ShieldCheck size={17} />
              <p><strong>Other Piping Calculation 4 is connected.</strong> Pneumatic Test Pressure remains next in the controlled audit sequence.</p>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading">
              <div><span>02</span><div><h2>Pressure-rating and size data</h2><p>Enter each collected value in its available field unit.</p></div></div>
              <Gauge size={19} />
            </div>
            <div className="form-grid">
              <UnitInput label="38°C pressure rating" field={fields.rating38C} options={pressureUnits} help="Independent Metric rating basis; the protected result is rounded upward to the next whole bar." onValueChange={(value) => updateFieldValue("rating38C", value)} onUnitChange={(unit) => updateFieldUnit("rating38C", unit)} />
              <UnitInput label="100°F pressure rating" field={fields.rating100F} options={pressureUnits} help="Independent U.S. rating basis; the protected result is rounded upward to the next 25 psi." onValueChange={(value) => updateFieldValue("rating100F", value)} onUnitChange={(unit) => updateFieldUnit("rating100F", unit)} />
              <UnitInput label="Nominal pipe size NPS" field={fields.nominalPipeSize} options={lengthUnits} help="Nominal pipe size used only for the protected minimum test-duration band." onValueChange={(value) => updateFieldValue("nominalPipeSize", value)} onUnitChange={(unit) => updateFieldUnit("nominalPipeSize", unit)} />
            </div>
            <div className="unit-system-note">
              <Info size={17} />
              <p><strong>Two independent rating bases are preserved.</strong> Changing field units converts each physical input live; it does not substitute the 38°C rating for the separate 100°F rating.</p>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-heading">
              <div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the flange hydro-test result</h3></div></div>
              <span>No standards PDF</span>
            </div>
            <p>Confirm the flange or flanged-fitting rating at the applicable reference temperature, nominal size, test procedure, component condition and governing test limitations against controlled project records.</p>
            <div className="reference-points">
              <span><b>01</b>Confirm the correct rating basis.</span>
              <span><b>02</b>Review upward pressure rounding.</span>
              <span><b>03</b>Verify the NPS duration band.</span>
            </div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Live engine <small>{result.ok ? "Parity passed" : "Input review"}</small></div>
            <p>Hydro test pressure</p>
            <div className="result-value"><strong>{mainPressure}</strong><span>{mainPressureUnit}</span></div>
            <div className="result-comparison">
              <span>Alternate route<strong>{alternatePressure}</strong></span>
              <span>Minimum duration<strong>{formatDisplayNumber(result.minimumTestDurationSeconds)} seconds</strong></span>
            </div>
            <div className={`result-status ${result.ok ? "is-valid" : ""}`}>
              {result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div>
                <strong>{error ? "Resolve input issues" : warning ? "Calculation completed with warning" : "Calculation completed"}</strong>
                <span>{error?.message ?? warning?.message ?? "Protected flange hydro-test rounding and duration routes are active."}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Result trace</p>
            <h3>Visible calculation context</h3>
            <div><span>Engine ID</span><strong>{result.engineId}</strong></div>
            <div><span>Metric formula</span><strong>ceil(1.5 × rating) to 1 bar</strong></div>
            <div><span>U.S. formula</span><strong>ceil(1.5 × rating / 25) × 25 psi</strong></div>
            <div><span>38°C rating used</span><strong>{formatDisplayNumber(result.pressureRating38CBarUsed)} bar</strong></div>
            <div><span>100°F rating used</span><strong>{formatDisplayNumber(result.pressureRating100FPsiUsed)} psi</strong></div>
            <div><span>NPS used</span><strong>{formatDisplayNumber(result.nominalPipeSizeInUsed)} in</strong></div>
            <div><span>Metric hydro pressure</span><strong>{formatDisplayNumber(result.hydroTestPressureBar)} bar</strong></div>
            <div><span>U.S. hydro pressure</span><strong>{formatDisplayNumber(result.hydroTestPressurePsi)} psi</strong></div>
            <div><span>Minimum duration</span><strong><Clock3 size={14} /> {formatDisplayNumber(result.minimumTestDurationSeconds)} seconds</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
