import { useMemo, useState } from "react";
import {
  calculateApi570FilletWeld,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api570FilletWeldInputSI,
  Api570FilletWeldXminSource,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570FilletWeldInputSnapshot, Api570UnitFieldSnapshot } from "../local-data/models.ts";

type UnitFieldId = "knownThroat" | "knownLeg" | "pipeThickness" | "hubThickness" | "branchThickness";
type UnitFieldState = Api570UnitFieldSnapshot;
type UnitFieldMap = Record<UnitFieldId, UnitFieldState>;

const lengthUnits = listEngineeringUnitOptions("length");

function initialUnitFields(snapshot?: Api570FilletWeldInputSnapshot): UnitFieldMap {
  if (snapshot) return Object.fromEntries(Object.entries(snapshot.fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap;
  return {
    knownThroat: { value: "5", unit: "mm", quantity: "length" },
    knownLeg: { value: "8", unit: "mm", quantity: "length" },
    pipeThickness: { value: "10", unit: "mm", quantity: "length" },
    hubThickness: { value: "12", unit: "mm", quantity: "length" },
    branchThickness: { value: "10", unit: "mm", quantity: "length" },
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

function formatLength(valueMm: number, unitSystem: UnitSystem): string {
  const converted = convertFromSI(valueMm, "length", unitSystem);
  return formatDisplayNumber(converted);
}

function xminSourceLabel(source: Api570FilletWeldXminSource): string {
  if (source === "pipe-thickness") return "1.4 × pipe thickness governs";
  if (source === "hub-thickness") return "Hub thickness governs";
  if (source === "equal") return "Both candidates are equal";
  return "No positive candidate";
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

export function Api570FilletWeldCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "fillet-weld" ? initialCalculation.inputs : undefined;
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

  const input = useMemo<Api570FilletWeldInputSI>(() => ({
    knownThroatMm: unitValue(fields.knownThroat),
    knownLegMm: unitValue(fields.knownLeg),
    pipeThicknessMm: unitValue(fields.pipeThickness),
    hubThicknessMm: unitValue(fields.hubThickness),
    branchThicknessMm: unitValue(fields.branchThickness),
  }), [fields]);
  const result = useMemo(() => calculateApi570FilletWeld(input), [input]);
  const inputSnapshot = useMemo<Api570FilletWeldInputSnapshot>(() => ({ calculatorId: "fillet-weld", unitSystem, fields: Object.fromEntries(Object.entries(fields).map(([fieldId, field]) => [fieldId, { ...field }])) as UnitFieldMap, engineInput: input }), [fields, input, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Fillet weld sizing report", basisTitle: "Weld geometry inputs", inspectionTitle: "Governing geometry", summaryLines: [`Slip-on flange Xmin: ${formatDisplayNumber(result.slipOnFlangeXminMm)} mm`, `Branch throat tc: ${formatDisplayNumber(result.branchThroatTcMm)} mm`], basisRows: [{ label: "Known throat", value: `${formatDisplayNumber(input.knownThroatMm ?? 0)} mm` }, { label: "Known leg", value: `${formatDisplayNumber(input.knownLegMm ?? 0)} mm` }, { label: "Pipe thickness", value: `${formatDisplayNumber(input.pipeThicknessMm ?? 0)} mm` }, { label: "Hub thickness", value: `${formatDisplayNumber(input.hubThicknessMm ?? 0)} mm` }, { label: "Branch thickness", value: `${formatDisplayNumber(input.branchThicknessMm ?? 0)} mm` }], inspectionRows: [{ label: "Xmin source", value: xminSourceLabel(result.slipOnFlangeXminSource) }, { label: "Branch throat cap", value: result.branchThroatCappedAt6Mm ? "6 mm cap governs" : "Uncapped result governs" }], resultRows: [{ label: "Leg from throat", value: `${formatDisplayNumber(result.legFromThroatMm)} mm` }, { label: "Throat from leg", value: `${formatDisplayNumber(result.throatFromLegMm)} mm` }, { label: "Slip-on flange Xmin", value: `${formatDisplayNumber(result.slipOnFlangeXminMm)} mm`, primary: true }, { label: "Branch throat tc", value: `${formatDisplayNumber(result.branchThroatTcMm)} mm`, primary: true }] };
  const error = result.issues.find((issue) => issue.severity === "error");

  const reset = () => {
    setUnitSystem("metric");
    setFields(initialUnitFields());
  };

  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));

  return (
    <div className="calculator-page api570-fillet-weld-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 6 of 8</p>
            <h1>Fillet Weld Sizing</h1>
            <p>Geometry-only checks for fillet leg, throat, slip-on flange, and branch weld dimensions.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="fillet-weld" calculatorLabel="Fillet Weld" defaultAssetTag="WLD-101" defaultAssetName="Piping weld detail" defaultTitle="API 570 fillet weld sizing assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
            <button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
        </div>
        <div className="step-line" aria-label="Calculation workflow">
          <button className="complete"><b>1</b> Basis</button><i />
          <button className="complete"><b>2</b> Geometry</button><i />
          <button className="active"><b>3</b> Results</button>
        </div>
      </header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card">
            <div className="form-card-heading">
              <div><span>01</span><div><h2>Calculation basis</h2><p>Use the protected dependencies with your preferred result units.</p></div></div>
              <Wrench size={19} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Formula basis</span>
                <div className="select-control">B31.3 328.5.2 / 328.5.4 · Leg / throat / Xmin / tc</div>
                <small>Formula identity and calculation behavior captured from the protected original application.</small>
              </label>
              <label className="field">
                <span>Unit system</span>
                <select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}>
                  <option value="metric">Metric · mm</option>
                  <option value="us-customary">U.S. customary · in</option>
                </select>
                <small>Results follow this selection; every dimensional input retains an independent unit picker.</small>
              </label>
            </div>
            <div className="form-note is-valid">
              <ShieldCheck size={17} />
              <p><strong>Four dependencies verified.</strong> Each result remains independent and uses only its stated input pair or single thickness.</p>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading">
              <div><span>02</span><div><h2>Fillet and component geometry</h2><p>Enter available site dimensions in their collected units.</p></div></div>
              <Gauge size={19} />
            </div>
            <div className="form-grid">
              <UnitInput label="Known throat" field={fields.knownThroat} options={lengthUnits} help="Calculates fillet leg as 1.414 × known throat." onValueChange={(value) => updateFieldValue("knownThroat", value)} onUnitChange={(unit) => updateFieldUnit("knownThroat", unit)} />
              <UnitInput label="Known leg" field={fields.knownLeg} options={lengthUnits} help="Calculates fillet throat as 0.707 × known leg." onValueChange={(value) => updateFieldValue("knownLeg", value)} onUnitChange={(unit) => updateFieldUnit("knownLeg", unit)} />
              <UnitInput label="Pipe thickness T" field={fields.pipeThickness} options={lengthUnits} help="Provides the 1.4T candidate for slip-on flange Xmin." onValueChange={(value) => updateFieldValue("pipeThickness", value)} onUnitChange={(unit) => updateFieldUnit("pipeThickness", unit)} />
              <UnitInput label="Hub thickness" field={fields.hubThickness} options={lengthUnits} help="Xmin is the lesser positive value of 1.4T and hub thickness." onValueChange={(value) => updateFieldValue("hubThickness", value)} onUnitChange={(unit) => updateFieldUnit("hubThickness", unit)} />
              <UnitInput label="Branch thickness Tb" field={fields.branchThickness} options={lengthUnits} help="Calculates branch throat tc as the lesser of 0.7Tb and 6 mm." onValueChange={(value) => updateFieldValue("branchThickness", value)} onUnitChange={(unit) => updateFieldUnit("branchThickness", unit)} />
            </div>
            <div className="unit-system-note">
              <Info size={17} />
              <p><strong>Mixed field units are active.</strong> Each selector converts live into the millimetre engine while results follow <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b> units.</p>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-heading">
              <div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before accepting a weld size</h3></div></div>
              <span>No standards PDF</span>
            </div>
            <p>Confirm the applicable joint detail, load path, material, weld process, examination requirements, corrosion allowance, component geometry, and controlled code edition. These geometry helpers do not establish weld adequacy or authorize fabrication.</p>
            <div className="reference-points">
              <span><b>01</b>Confirm the joint configuration and dimensions.</span>
              <span><b>02</b>Verify the governing controlled-code detail.</span>
              <span><b>03</b>Obtain responsible welding-engineering review.</span>
            </div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <div className="result-primary-grid"><div className="result-primary"><p>Slip-on flange Xmin</p><div className="result-primary-value"><strong>{formatLength(result.slipOnFlangeXminMm, unitSystem)}</strong><span>{lengthUnit}</span></div></div><div className="result-primary"><p>Branch throat tc</p><div className="result-primary-value"><strong>{formatLength(result.branchThroatTcMm, unitSystem)}</strong><span>{lengthUnit}</span></div></div></div>
            <div className="result-comparison">
              <span>Leg from throat<strong>{formatLength(result.legFromThroatMm, unitSystem)} {lengthUnit}</strong></span>
              <span>Throat from leg<strong>{formatLength(result.throatFromLegMm, unitSystem)} {lengthUnit}</strong></span>
            </div>
            <div className="result-comparison">
              <span>Branch-throat limit<strong>{result.branchThroatCappedAt6Mm ? "6 mm cap applied" : "Calculated value"}</strong></span>
              <span>Xmin basis<strong>{xminSourceLabel(result.slipOnFlangeXminSource)}</strong></span>
            </div>
            <div className={`result-status ${result.ok ? "is-manual" : ""}`}>
              <TriangleAlert size={18} />
              <div>
                <strong>{error ? "Resolve input issues" : "Geometry result only"}</strong>
                <span>{error?.message ?? "These dimensions do not establish branch reinforcement, pressure integrity, weld adequacy, or fabrication acceptance."}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Supporting results</p>
            <h3>Calculation details</h3>
            <div><span>Leg equation</span><strong>1.414 × throat = {formatDisplayNumber(result.legFromThroatMm)} mm</strong></div>
            <div><span>Throat equation</span><strong>0.707 × leg = {formatDisplayNumber(result.throatFromLegMm)} mm</strong></div>
            <div><span>1.4T candidate</span><strong>{formatDisplayNumber(result.pipeThicknessCandidateMm)} mm</strong></div>
            <div><span>Xmin result</span><strong>{formatDisplayNumber(result.slipOnFlangeXminMm)} mm · {xminSourceLabel(result.slipOnFlangeXminSource)}</strong></div>
            <div><span>0.7Tb before cap</span><strong>{formatDisplayNumber(result.uncappedBranchThroatMm)} mm</strong></div>
            <div><span>Branch throat tc</span><strong>{formatDisplayNumber(result.branchThroatTcMm)} mm{result.branchThroatCappedAt6Mm ? " · 6 mm cap" : ""}</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
