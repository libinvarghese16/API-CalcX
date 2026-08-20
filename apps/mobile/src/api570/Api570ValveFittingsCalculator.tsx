import { useMemo, useState } from "react";
import {
  calculateApi570ValveFittings,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570ValveFittingsInputSI,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570UnitFieldSnapshot, Api570ValveFittingsInputSnapshot } from "../local-data/models.ts";

type UnitFieldId = "designPressure" | "outsideDiameter" | "allowableStress" | "allowance" | "availableWall";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const pressureUnits = listEngineeringUnitOptions("pressure");
const lengthUnits = listEngineeringUnitOptions("length");

function initialUnitFields(snapshot?: Api570ValveFittingsInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    designPressure: { value: "2.5", unit: "MPa", quantity: "pressure" },
    outsideDiameter: { value: "219.1", unit: "mm", quantity: "length" },
    allowableStress: { value: "138", unit: "MPa", quantity: "pressure" },
    allowance: { value: "1.2", unit: "mm", quantity: "length" },
    availableWall: { value: "8.8", unit: "mm", quantity: "length" },
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

  const input = useMemo<Api570ValveFittingsInputSI>(() => ({
    designPressureMpa: unitValue(fields.designPressure),
    outsideDiameterMm: unitValue(fields.outsideDiameter),
    allowableStressMpa: unitValue(fields.allowableStress),
    qualityFactor: numberFrom(qualityFactor, 1),
    allowanceMm: unitValue(fields.allowance),
    availableWallThicknessMm: unitValue(fields.availableWall),
  }), [fields, qualityFactor]);
  const result = useMemo(() => calculateApi570ValveFittings(input), [input]);
  const inputSnapshot = useMemo<Api570ValveFittingsInputSnapshot>(() => ({ calculatorId: "valve-fittings", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, qualityFactor, engineInput: input }), [fields, input, qualityFactor, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Valve and fittings calculation report", basisTitle: "Pressure and component inputs", inspectionTitle: "Allowance and available-wall basis", summaryLines: [`Minimum required thickness: ${formatDisplayNumber(result.minimumRequiredThicknessMm)} mm`, `Allowable working pressure: ${formatDisplayNumber(result.allowableWorkingPressureMpa)} MPa`], basisRows: [{ label: "Formula basis", value: "API 574 11.2 · tm = 1.5(PD/2SE) + c" }, { label: "Design pressure", value: `${formatDisplayNumber(input.designPressureMpa)} MPa` }, { label: "Outside diameter", value: `${formatDisplayNumber(input.outsideDiameterMm)} mm` }, { label: "Allowable stress", value: `${formatDisplayNumber(input.allowableStressMpa)} MPa` }, { label: "Quality factor E", value: formatDisplayNumber(result.qualityFactorUsed) }], inspectionRows: [{ label: "Allowance used", value: `${formatDisplayNumber(result.allowanceUsedMm)} mm` }, { label: "Available wall", value: `${formatDisplayNumber(input.availableWallThicknessMm)} mm` }, { label: "Net available wall", value: `${formatDisplayNumber(result.netAvailableThicknessMm)} mm` }], resultRows: [{ label: "Pressure design thickness", value: `${formatDisplayNumber(result.pressureDesignThicknessMm)} mm` }, { label: "Minimum required thickness", value: `${formatDisplayNumber(result.minimumRequiredThicknessMm)} mm`, primary: true }, { label: "Allowable working pressure", value: `${formatDisplayNumber(result.allowableWorkingPressureMpa)} MPa`, primary: true }] };
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const error = result.issues.find((issue) => issue.severity === "error");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
    setQualityFactor("0.85");
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
                <span>Formula basis</span>
                <div className="select-control">API 574 11.2 · tm = 1.5(PD/2SE) + c</div>
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
              <UnitInput label="Outside diameter" field={fields.outsideDiameter} options={lengthUnits} help="Outside diameter D of the valve or flanged fitting." onValueChange={(value) => updateFieldValue("outsideDiameter", value)} onUnitChange={(unit) => updateFieldUnit("outsideDiameter", unit)} />
              <UnitInput label="Allowable stress" field={fields.allowableStress} options={pressureUnits} help="Manual controlled-source allowable stress S; no copyrighted stress table is bundled." onValueChange={(value) => updateFieldValue("allowableStress", value)} onUnitChange={(unit) => updateFieldUnit("allowableStress", unit)} />
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
            <div className="result-card-top"><Gauge size={17} /> Live engine <small>{result.ok ? "Parity passed" : "Input review"}</small></div>
            <p>Minimum required thickness</p>
            <div className="result-value"><strong>{formatOutput(result.minimumRequiredThicknessMm, "length", unitSystem)}</strong><span>{lengthUnit}</span></div>
            <div className="result-comparison">
              <span>Pressure thickness<strong>{formatOutput(result.pressureDesignThicknessMm, "length", unitSystem)} {lengthUnit}</strong></span>
              <span>Allowable pressure<strong>{formatOutput(result.allowableWorkingPressureMpa, "pressure", unitSystem)} {pressureUnit}</strong></span>
            </div>
            <div className={`result-status ${result.ok ? "is-valid" : ""}`}>
              {result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div>
                <strong>{error ? "Resolve input issues" : warning ? "Calculation completed with protected default" : "Calculation completed"}</strong>
                <span>{error?.message ?? warning?.message ?? "Protected valve/fittings equations and SI result object are active."}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Result trace</p>
            <h3>Visible calculation context</h3>
            <div><span>Engine ID</span><strong>{result.engineId}</strong></div>
            <div><span>Formula</span><strong>tm = 1.5(PD/2SE) + c</strong></div>
            <div><span>Inverse formula</span><strong>P = 2SE(t−c) / 1.5D</strong></div>
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
