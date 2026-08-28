import { useMemo, useState } from "react";
import {
  calculateApi570SoilResistivity,
  convertBetweenUnits,
  convertSIToUnit,
  convertUnitToSI,
  listEngineeringUnitOptions,
} from "@api-calc-pro/calc-engine";
import type { Api570SoilResistivityInputSI, EngineeringUnit, EngineeringUnitOption, UnitSystem } from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570SoilResistivityInputSnapshot, Api570UnitFieldSnapshot } from "../local-data/models.ts";

type UnitFieldId = "pinSpacing" | "resistance";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const lengthUnits = listEngineeringUnitOptions("length");
const resistanceUnits = listEngineeringUnitOptions("resistance");

function initialUnitFields(snapshot?: Api570SoilResistivityInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    pinSpacing: { value: "5", unit: "ft", quantity: "length" },
    resistance: { value: "20", unit: "ohm", quantity: "resistance" },
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

export function Api570SoilResistivityCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "soil-resistivity" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [fields, setFields] = useState<UnitFieldMap>(() => initialUnitFields(initialInputs));

  const updateFieldValue = (fieldId: UnitFieldId, value: string) => setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  const updateFieldUnit = (fieldId: UnitFieldId, nextUnit: EngineeringUnit) => {
    setFields((current) => {
      const field = current[fieldId];
      const parsed = Number(field.value);
      const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value;
      return { ...current, [fieldId]: { ...field, value, unit: nextUnit } };
    });
  };

  const pinSpacingMm = convertUnitToSI(numberFrom(fields.pinSpacing.value), "length", fields.pinSpacing.unit);
  const resistanceOhm = convertUnitToSI(numberFrom(fields.resistance.value), "resistance", fields.resistance.unit);
  const input = useMemo<Api570SoilResistivityInputSI>(() => ({ pinSpacingM: pinSpacingMm / 1000, resistanceOhm }), [pinSpacingMm, resistanceOhm]);
  const result = useMemo(() => calculateApi570SoilResistivity(input), [input]);
  const inputSnapshot = useMemo<Api570SoilResistivityInputSnapshot>(() => ({ calculatorId: "soil-resistivity", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, engineInput: input }), [fields, input, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Soil resistivity calculation report", basisTitle: "Four-pin field inputs", inspectionTitle: "Normalized equation inputs", summaryLines: [`Soil resistivity: ${formatDisplayNumber(result.soilResistivityOhmM)} ohm-m`], basisRows: [{ label: "Formula basis", value: "rho = 2 pi a R" }, { label: "Entered pin spacing", value: `${fields.pinSpacing.value} ${fields.pinSpacing.unit}` }, { label: "Entered resistance", value: `${fields.resistance.value} ${fields.resistance.unit}` }], inspectionRows: [{ label: "Pin spacing used", value: `${formatDisplayNumber(result.pinSpacingMUsed)} m` }, { label: "Resistance used", value: `${formatDisplayNumber(result.resistanceOhmUsed)} ohm` }], resultRows: [{ label: "Soil resistivity", value: `${formatDisplayNumber(result.soilResistivityOhmM)} ohm-m`, primary: true }, { label: "Equivalent resistivity", value: `${formatDisplayNumber(result.soilResistivityOhmCm)} ohm-cm` }] };
  const error = result.issues.find((issue) => issue.severity === "error");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
  };

  const spacingDisplay = unitSystem === "metric"
    ? `${formatDisplayNumber(convertSIToUnit(pinSpacingMm, "length", "m"))} m`
    : `${formatDisplayNumber(convertSIToUnit(pinSpacingMm, "length", "ft"))} ft`;
  const resultDisplay = formatDisplayNumber(result.soilResistivityOhmM);

  return (
    <div className="calculator-page api570-soil-resistivity-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 8 of 8</p>
            <h1>Soil Resistivity</h1>
            <p>Four-pin field calculation using live spacing and resistance unit conversion.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="soil-resistivity" calculatorLabel="Soil Resistivity" defaultAssetTag="SR-101" defaultAssetName="Four-pin soil survey" defaultTitle="API 570 soil resistivity assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
            <button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
        </div>
        <div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Field data</button><i /><button className="active"><b>3</b> Result</button></div>
      </header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card">
            <div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Use the protected four-pin equation and preferred context units.</p></div></div><Wrench size={19} /></div>
            <div className="form-grid">
              <label className="field"><span>Formula basis</span><div className="select-control">Wenner four-electrode · ρ = 2πaR</div><small>The engine uses coherent SI: spacing a in metres, resistance R in ohms, and resistivity in Ω·m.</small></label>
              <label className="field"><span>Unit system</span><select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => setUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric context · m / Ω</option><option value="us-customary">U.S. customary context · ft / Ω</option></select><small>The primary result is Ω·m and the equivalent Ω·cm value remains visible; this selection changes the spacing context.</small></label>
            </div>
            <div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Coherent-unit equation verified.</strong> Equivalent ft, m, in, cm, Ω, kΩ, and MΩ inputs reproduce the same result.</p></div>
          </section>

          <section className="form-card">
            <div className="form-card-heading"><div><span>02</span><div><h2>Four-pin field data</h2><p>Enter measurements in the units used by the field instrument and layout.</p></div></div><Gauge size={19} /></div>
            <div className="form-grid">
              <UnitInput label="Pin spacing a" field={fields.pinSpacing} options={lengthUnits} help="Distance between equally spaced pins. Converted to metres for the SI equation." onValueChange={(value) => updateFieldValue("pinSpacing", value)} onUnitChange={(unit) => updateFieldUnit("pinSpacing", unit)} />
              <UnitInput label="Measured resistance R" field={fields.resistance} options={resistanceUnits} help="Measured four-pin resistance. Converted to ohms for the protected equation." onValueChange={(value) => updateFieldValue("resistance", value)} onUnitChange={(unit) => updateFieldUnit("resistance", unit)} />
            </div>
            <div className="unit-system-note"><Info size={17} /><p><strong>Live conversion is active.</strong> The engine receives <b>{formatDisplayNumber(result.pinSpacingMUsed)} m</b> and <b>{formatDisplayNumber(result.resistanceOhmUsed)} Ω</b>; display context is <b>{spacingDisplay}</b>.</p></div>
          </section>

          <section className="reference-card">
            <div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using a soil-resistivity result</h3></div></div><span>No standards PDF</span></div>
            <p>Confirm equal probe spacing, instrument calibration, probe contact, test depth and interference, soil condition and moisture, repeated directions or locations, and the project corrosion-control procedure. A single value does not establish a complete corrosion assessment.</p>
            <div className="reference-points"><span><b>01</b>Confirm equally spaced probes and instrument setup.</span><span><b>02</b>Record soil, moisture, location and direction.</span><span><b>03</b>Review results with corrosion-control personnel.</span></div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <p>Soil resistivity</p>
            <div className="result-value"><strong>{resultDisplay}</strong><span>Ω·m</span></div>
            <div className="result-comparison"><span>Equivalent result<strong>{formatDisplayNumber(result.soilResistivityOhmCm)} Ω·cm</strong></span><span>Resistance used<strong>{formatDisplayNumber(result.resistanceOhmUsed)} Ω</strong></span></div>
            <div className={`result-status ${result.ok ? "is-valid" : ""}`}>{result.ok ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : "Calculation completed"}</strong><span>{error?.message ?? "Review soil resistivity and the normalized pin-spacing and resistance values before use."}</span></div></div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Supporting results</p><h3>Calculation details</h3>
            <div><span>Formula</span><strong>ρ = 2π × a × R</strong></div>
            <div><span>Pin spacing a</span><strong>{formatDisplayNumber(result.pinSpacingMUsed)} m</strong></div>
            <div><span>Resistance R</span><strong>{formatDisplayNumber(result.resistanceOhmUsed)} Ω</strong></div>
            <div><span>Soil resistivity ρ</span><strong>{formatDisplayNumber(result.soilResistivityOhmM)} Ω·m</strong></div>
            <div><span>Equivalent resistivity</span><strong>{formatDisplayNumber(result.soilResistivityOhmCm)} Ω·cm</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
