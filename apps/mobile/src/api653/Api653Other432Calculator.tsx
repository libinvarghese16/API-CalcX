import { useMemo, useState } from "react";
import {
  calculateApi653Other432,
  convertBetweenUnits,
  convertFromSI,
  convertSIToUnit,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api653Other432CheckStatus,
  Api653Other432InputSI,
  Api653Other432PitStatus,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";

type UnitFieldState = { value: string; unit: EngineeringUnit; quantity: EngineeringQuantity };
type InputFieldId = "diameter" | "leastThickness" | "minimumThickness" | "corrosionAllowance" | "profile1" | "profile2" | "profile3" | "profile4" | "profile5" | "pitRemaining" | "pitSum";
type DerivedFieldId = "criticalLength" | "averageThickness" | "adjustedMinimum" | "adjustedSixty";
type InputFields = Record<InputFieldId, UnitFieldState>;
type DerivedFields = Record<DerivedFieldId, UnitFieldState>;

const lengthUnits = listEngineeringUnitOptions("length");
const currentYear = new Date().getFullYear();
const profileFieldIds: readonly InputFieldId[] = ["profile1", "profile2", "profile3", "profile4", "profile5"];

function numberFrom(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : "";
}

function convertedField(field: UnitFieldState, nextUnit: EngineeringUnit): UnitFieldState {
  const parsed = Number(field.value);
  return { ...field, value: Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value, unit: nextUnit };
}

function UnitInput({ label, field, options, help, onValueChange, onUnitChange }: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  help: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
}) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="decimal" value={field.value} onChange={(event) => onValueChange(event.target.value)} /><select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><small>{help}</small></label>;
}

function AutomaticUnitInput({ label, field, options, mode, help, onValueChange, onUnitChange, onModeChange }: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  mode: AutomaticValueMode;
  help: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
  onModeChange: (mode: AutomaticValueMode) => void;
}) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="decimal" value={field.value} readOnly={mode === "auto"} onChange={(event) => onValueChange(event.target.value)} /><select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><small>{help}</small></label>;
}

function YearInput({ label, value, help, onChange }: { label: string; value: string; help: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} /><b>year</b></div><small>{help}</small></label>;
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="numeric" value={value} readOnly={mode === "auto"} onChange={(event) => onChange(event.target.value)} /><b>yr</b></div><small>{help}</small></label>;
}

function statusLabel(status: Api653Other432CheckStatus | Api653Other432PitStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StatusRow({ title, status, detail }: { title: string; status: Api653Other432CheckStatus | Api653Other432PitStatus; detail: string }) {
  const passing = status === "pass";
  return <div className={`result-status ${passing ? "is-valid" : ""}`}>{passing ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{title} · {statusLabel(status)}</strong><span>{detail}</span></div></div>;
}

function initialInputs(): InputFields {
  return {
    diameter: { value: "30", unit: "m", quantity: "length" },
    leastThickness: { value: "8", unit: "mm", quantity: "length" },
    minimumThickness: { value: "6", unit: "mm", quantity: "length" },
    corrosionAllowance: { value: "1", unit: "mm", quantity: "length" },
    profile1: { value: "8", unit: "mm", quantity: "length" },
    profile2: { value: "8", unit: "mm", quantity: "length" },
    profile3: { value: "7.5", unit: "mm", quantity: "length" },
    profile4: { value: "8.5", unit: "mm", quantity: "length" },
    profile5: { value: "8", unit: "mm", quantity: "length" },
    pitRemaining: { value: "", unit: "mm", quantity: "length" },
    pitSum: { value: "", unit: "mm", quantity: "length" },
  };
}

function initialDerived(): DerivedFields {
  return {
    criticalLength: { value: "526.725735", unit: "mm", quantity: "length" },
    averageThickness: { value: "8", unit: "mm", quantity: "length" },
    adjustedMinimum: { value: "7", unit: "mm", quantity: "length" },
    adjustedSixty: { value: "4.6", unit: "mm", quantity: "length" },
  };
}

export function Api653Other432Calculator({ onBack }: { onBack: () => void }) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [buildYear, setBuildYear] = useState("2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState("2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>("auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>("auto");
  const [manualServiceYears, setManualServiceYears] = useState("20");
  const [manualInspectionYears, setManualInspectionYears] = useState("5");
  const [fields, setFields] = useState<InputFields>(initialInputs);
  const [derivedFields, setDerivedFields] = useState<DerivedFields>(initialDerived);
  const [criticalLengthMode, setCriticalLengthMode] = useState<AutomaticValueMode>("auto");
  const [averageThicknessMode, setAverageThicknessMode] = useState<AutomaticValueMode>("auto");
  const [adjustedMinimumMode, setAdjustedMinimumMode] = useState<AutomaticValueMode>("auto");
  const [adjustedSixtyMode, setAdjustedSixtyMode] = useState<AutomaticValueMode>("auto");

  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSincePreviousInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);
  const toMm = (field: UnitFieldState) => convertUnitToSI(numberFrom(field.value), "length", field.unit);
  const optionalMm = (field: UnitFieldState) => field.value.trim() ? toMm(field) : null;
  const input = useMemo<Api653Other432InputSI>(() => ({
    diameterM: toMm(fields.diameter) / 1000,
    leastThicknessMm: toMm(fields.leastThickness),
    minimumRequiredThicknessMm: toMm(fields.minimumThickness),
    corrosionAllowanceMm: toMm(fields.corrosionAllowance),
    profileThicknessesMm: profileFieldIds.map((id) => toMm(fields[id])),
    deepestPitRemainingThicknessMm: optionalMm(fields.pitRemaining),
    pitDimensionSumMm: optionalMm(fields.pitSum),
    criticalLengthMode,
    manualCriticalLengthMm: toMm(derivedFields.criticalLength),
    averageThicknessMode,
    manualAverageThicknessMm: toMm(derivedFields.averageThickness),
    adjustedMinimumMode,
    manualAdjustedMinimumMm: toMm(derivedFields.adjustedMinimum),
    adjustedSixtyPercentMode: adjustedSixtyMode,
    manualAdjustedSixtyPercentMm: toMm(derivedFields.adjustedSixty),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [fields, derivedFields, criticalLengthMode, averageThicknessMode, adjustedMinimumMode, adjustedSixtyMode]);
  const result = useMemo(() => calculateApi653Other432(input), [input]);

  const automaticValues: Record<DerivedFieldId, number> = {
    criticalLength: result.automaticCriticalLengthMm,
    averageThickness: result.automaticAverageThicknessMm,
    adjustedMinimum: result.automaticAdjustedMinimumMm,
    adjustedSixty: result.automaticAdjustedSixtyPercentMm,
  };
  const derivedModes: Record<DerivedFieldId, AutomaticValueMode> = { criticalLength: criticalLengthMode, averageThickness: averageThicknessMode, adjustedMinimum: adjustedMinimumMode, adjustedSixty: adjustedSixtyMode };
  const derivedSetters: Record<DerivedFieldId, (mode: AutomaticValueMode) => void> = { criticalLength: setCriticalLengthMode, averageThickness: setAverageThicknessMode, adjustedMinimum: setAdjustedMinimumMode, adjustedSixty: setAdjustedSixtyMode };
  const displayedDerived = (id: DerivedFieldId): UnitFieldState => ({ ...derivedFields[id], value: derivedModes[id] === "auto" ? formatInput(convertSIToUnit(automaticValues[id], "length", derivedFields[id].unit)) : derivedFields[id].value });
  const updateFieldValue = (id: InputFieldId, value: string) => setFields((current) => ({ ...current, [id]: { ...current[id], value } }));
  const updateFieldUnit = (id: InputFieldId, unit: EngineeringUnit) => setFields((current) => ({ ...current, [id]: convertedField(current[id], unit) }));
  const updateDerivedValue = (id: DerivedFieldId, value: string) => setDerivedFields((current) => ({ ...current, [id]: { ...current[id], value } }));
  const updateDerivedUnit = (id: DerivedFieldId, unit: EngineeringUnit) => setDerivedFields((current) => ({ ...current, [id]: derivedModes[id] === "auto" ? { ...current[id], unit } : convertedField(current[id], unit) }));
  const changeDerivedMode = (id: DerivedFieldId, mode: AutomaticValueMode) => {
    if (mode === "manual") updateDerivedValue(id, formatInput(convertSIToUnit(automaticValues[id], "length", derivedFields[id].unit)));
    derivedSetters[id](mode);
  };
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    const shortUnit = defaultUnitForSystem("length", nextSystem);
    const longUnit: EngineeringUnit = nextSystem === "metric" ? "m" : "ft";
    setFields((current) => Object.fromEntries(Object.entries(current).map(([id, field]) => [id, convertedField(field, id === "diameter" ? longUnit : shortUnit)])) as InputFields);
    setDerivedFields((current) => Object.fromEntries(Object.entries(current).map(([id, field]) => [id, derivedModes[id as DerivedFieldId] === "auto" ? { ...field, unit: shortUnit } : convertedField(field, shortUnit)])) as DerivedFields);
  };
  const changeServiceMode = (mode: AutomaticValueMode) => { if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService)); setServiceYearsMode(mode); };
  const changeInspectionMode = (mode: AutomaticValueMode) => { if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection)); setInspectionYearsMode(mode); };
  const reset = () => {
    setUnitSystem("metric"); setBuildYear("2006"); setPreviousInspectionYear("2021"); setServiceYearsMode("auto"); setInspectionYearsMode("auto"); setManualServiceYears("20"); setManualInspectionYears("5"); setFields(initialInputs()); setDerivedFields(initialDerived()); setCriticalLengthMode("auto"); setAverageThicknessMode("auto"); setAdjustedMinimumMode("auto"); setAdjustedSixtyMode("auto");
  };

  const manualOverrideActive = serviceYearsMode === "manual" || inspectionYearsMode === "manual" || Object.values(derivedModes).some((mode) => mode === "manual");
  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));
  const formatLength = (value: number) => formatDisplayNumber(convertFromSI(value, "length", unitSystem));
  const check1Detail = `${formatLength(result.averageThicknessMmUsed)} ${lengthUnit} ${result.check1Status === "pass" ? "≥" : "<"} ${formatLength(result.adjustedMinimumMmUsed)} ${lengthUnit}.`;
  const check2Detail = `${formatLength(result.leastThicknessMmUsed)} ${lengthUnit} ${result.check2Status === "pass" ? "≥" : "<"} ${formatLength(result.adjustedSixtyPercentMmUsed)} ${lengthUnit}.`;
  const pitLimit = 0.5 * result.minimumRequiredThicknessMmUsed;
  const pitDetail = result.pitStatus === "optional" ? "Provide both pit values only when the pit screen is required." : result.pitStatus === "pending" ? "Enter tmin and both pit values to complete the optional screen." : `Clause (a): ${formatLength(result.deepestPitRemainingThicknessMmUsed ?? 0)} ${lengthUnit} ${result.pitCheckAPass ? "≥" : "<"} ${formatLength(pitLimit)} ${lengthUnit}; clause (b): ${formatLength(result.pitDimensionSumMmUsed ?? 0)} ${lengthUnit} ${result.pitCheckBPass ? "≤" : ">"} ${formatLength(50)} ${lengthUnit}.`;
  const error = result.issues.find((issue) => issue.severity === "error");
  const overallDetail = result.overallStatus === "pass" ? result.pitStatus === "pass" ? "Core criteria and both pit clauses pass." : "Core criteria pass; pit screening is not fully evaluated." : result.overallStatus === "fail" ? "One or more evaluated acceptance checks are below the required limit." : "Complete the required thickness profile and threshold inputs.";

  return <div className="calculator-page api653-other432-page">
    <header className="calculator-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 653 library</button><div className="calculator-heading-row"><div><p className="eyebrow">API 653 · Local thin area · Calculator 6 of 6</p><h1>Other 4.3.2 calculations</h1><p>Critical length, five-point thickness profile, adjusted acceptance thresholds, and optional pit screening.</p></div><div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div><div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Profile</button><i /><button className="active"><b>3</b> Results</button></div></header>

    <div className="calculator-workspace"><div className="input-column">
      <section className="form-card"><div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Set the tank geometry, required thickness, allowance, and global result units.</p></div></div><Wrench size={19} /></div><div className="form-grid">
        <label className="field"><span>Reference basis</span><div className="select-control">API 653 4.3.2 local-thin-area workflow</div><small>Protected equation identity only; no standards PDF, reference image, or standards table is bundled.</small></label>
        <label className="field"><span>Unit system</span><select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · m / mm</option><option value="us-customary">U.S. customary · ft / in</option></select><small>Results follow this selection; every site input retains a right-side live unit selector.</small></label>
        <UnitInput label="Tank diameter D" field={fields.diameter} options={lengthUnits} help="Long dimension normalized to metres for the critical-length equation." onValueChange={(value) => updateFieldValue("diameter", value)} onUnitChange={(unit) => updateFieldUnit("diameter", unit)} />
        <UnitInput label="Least thickness in area t2" field={fields.leastThickness} options={lengthUnits} help="Minimum measured thickness in the local thin area." onValueChange={(value) => updateFieldValue("leastThickness", value)} onUnitChange={(unit) => updateFieldUnit("leastThickness", unit)} />
        <UnitInput label="Minimum required thickness tmin" field={fields.minimumThickness} options={lengthUnits} help="Controlled project minimum used by both core and pit checks." onValueChange={(value) => updateFieldValue("minimumThickness", value)} onUnitChange={(unit) => updateFieldUnit("minimumThickness", unit)} />
        <UnitInput label="Corrosion allowance to next inspection CA" field={fields.corrosionAllowance} options={lengthUnits} help="Non-negative allowance added to both core acceptance thresholds." onValueChange={(value) => updateFieldValue("corrosionAllowance", value)} onUnitChange={(unit) => updateFieldUnit("corrosionAllowance", unit)} />
      </div><div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Protected 4.3.2 route connected.</strong> L = 34 × √(D × t2), with the protected 1000 mm cap, feeds the visible trace.</p></div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Equipment chronology is recorded consistently across every API 653 workspace.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        <YearInput label="Build year" value={buildYear} help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
        <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
        <YearInput label="Previous inspection year" value={previousInspectionYear} help={`Whole year from the build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
        <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
      </div><div className={`form-note ${serviceYearsMode === "manual" || inspectionYearsMode === "manual" ? "is-manual" : "is-valid"}`}><Info size={17} /><p><strong>Inspection context only.</strong> These recorded years remain automatic/editable and highlighted, but the protected 4.3.2 equations do not use time or corrosion rate.</p></div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>03</span><div><h2>Thickness profile</h2><p>Five individual readings replace the protected wide input presentation.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        {profileFieldIds.map((id, index) => <UnitInput key={id} label={`Profile thickness point ${index + 1}`} field={fields[id]} options={lengthUnits} help="One of five equally spaced positive thickness readings." onValueChange={(value) => updateFieldValue(id, value)} onUnitChange={(unit) => updateFieldUnit(id, unit)} />)}
        <AutomaticUnitInput label="Average thickness t1" field={displayedDerived("averageThickness")} options={lengthUnits} mode={averageThicknessMode} help={averageThicknessMode === "auto" ? `Automatic average: ${formatDisplayNumber(result.automaticAverageThicknessMm)} mm.` : `Manual override is active and highlighted. Automatic recommendation: ${formatDisplayNumber(result.automaticAverageThicknessMm)} mm.`} onValueChange={(value) => updateDerivedValue("averageThickness", value)} onUnitChange={(unit) => updateDerivedUnit("averageThickness", unit)} onModeChange={(mode) => changeDerivedMode("averageThickness", mode)} />
      </div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>04</span><div><h2>Automatic acceptance dependencies</h2><p>Every calculated value remains visible, unit-aware, and manually editable.</p></div></div><Wrench size={19} /></div><div className="form-grid">
        <AutomaticUnitInput label="Critical length L (capped)" field={displayedDerived("criticalLength")} options={lengthUnits} mode={criticalLengthMode} help={criticalLengthMode === "auto" ? `Automatic L: ${formatDisplayNumber(result.automaticCriticalLengthMm)} mm${result.criticalLengthCapApplied ? "; cap applied" : ""}.` : `Manual override is active and highlighted. Automatic recommendation: ${formatDisplayNumber(result.automaticCriticalLengthMm)} mm.`} onValueChange={(value) => updateDerivedValue("criticalLength", value)} onUnitChange={(unit) => updateDerivedUnit("criticalLength", unit)} onModeChange={(mode) => changeDerivedMode("criticalLength", mode)} />
        <AutomaticUnitInput label="Adjusted tmin (tmin + CA)" field={displayedDerived("adjustedMinimum")} options={lengthUnits} mode={adjustedMinimumMode} help={adjustedMinimumMode === "auto" ? `Automatic threshold: ${formatDisplayNumber(result.automaticAdjustedMinimumMm)} mm.` : `Manual override is active and highlighted. Automatic recommendation: ${formatDisplayNumber(result.automaticAdjustedMinimumMm)} mm.`} onValueChange={(value) => updateDerivedValue("adjustedMinimum", value)} onUnitChange={(unit) => updateDerivedUnit("adjustedMinimum", unit)} onModeChange={(mode) => changeDerivedMode("adjustedMinimum", mode)} />
        <AutomaticUnitInput label="Adjusted 60% tmin" field={displayedDerived("adjustedSixty")} options={lengthUnits} mode={adjustedSixtyMode} help={adjustedSixtyMode === "auto" ? `Automatic threshold: ${formatDisplayNumber(result.automaticAdjustedSixtyPercentMm)} mm.` : `Manual override is active and highlighted. Automatic recommendation: ${formatDisplayNumber(result.automaticAdjustedSixtyPercentMm)} mm.`} onValueChange={(value) => updateDerivedValue("adjustedSixty", value)} onUnitChange={(unit) => updateDerivedUnit("adjustedSixty", unit)} onModeChange={(mode) => changeDerivedMode("adjustedSixty", mode)} />
      </div><div className={`form-note ${manualOverrideActive ? "is-manual" : "is-valid"}`}>{manualOverrideActive ? <TriangleAlert size={18} /> : <CircleCheck size={18} />}<p><strong>{manualOverrideActive ? "Manual override active." : "Automatic dependencies active."}</strong> {manualOverrideActive ? "Verify every highlighted manual field before engineering review." : "All calculated dependencies match the protected automatic equation path."}</p></div><div className="unit-system-note"><Info size={17} /><p><strong>Mixed engineering units are active.</strong> Each field converts into the normalized SI engine while results follow <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b>.</p></div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>05</span><div><h2>Optional pit screening</h2><p>Enter both values to evaluate clauses (a) and (b); otherwise the core screen remains independent.</p></div></div><ShieldCheck size={19} /></div><div className="form-grid">
        <UnitInput label="Deepest pit remaining thickness" field={fields.pitRemaining} options={lengthUnits} help="Optional clause (a) input; acceptance boundary is 0.5 × tmin." onValueChange={(value) => updateFieldValue("pitRemaining", value)} onUnitChange={(unit) => updateFieldUnit("pitRemaining", unit)} />
        <UnitInput label="Pit dimension sum in 200 mm band" field={fields.pitSum} options={lengthUnits} help="Optional clause (b) input; protected maximum is 50 mm." onValueChange={(value) => updateFieldValue("pitSum", value)} onUnitChange={(unit) => updateFieldUnit("pitSum", unit)} />
      </div></section>

      <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the local-thin-area screen</h3></div></div><span>No standards PDF</span></div><p>Confirm the corroded area, profile orientation, five measurement locations, t2, controlled minimum thickness, corrosion allowance, and pit dimensions against project records. This screen supports assessment and does not replace responsible inspection or engineering approval.</p><div className="reference-points"><span><b>01</b>L = min[34 × √(D × t2), 1000 mm].</span><span><b>02</b>Check (i): t1 ≥ tmin + CA.</span><span><b>03</b>Check (ii): t2 ≥ 0.6 × tmin + CA.</span></div></section>
    </div>

    <aside className="result-column"><section className="result-card"><div className="result-card-top"><Gauge size={17} /> Live 4.3.2 engine <small>{result.ok ? "Parity passed" : "Input review"}</small></div><p>Overall screening</p><div className="result-value"><strong>{statusLabel(result.overallStatus)}</strong><span>status</span></div><div className="result-comparison"><span>Critical length L<strong>{formatLength(result.criticalLengthMmUsed)} {lengthUnit}</strong></span><span>Average thickness t1<strong>{formatLength(result.averageThicknessMmUsed)} {lengthUnit}</strong></span></div><div className="result-comparison"><span>Adjusted tmin<strong>{formatLength(result.adjustedMinimumMmUsed)} {lengthUnit}</strong></span><span>Adjusted 60% tmin<strong>{formatLength(result.adjustedSixtyPercentMmUsed)} {lengthUnit}</strong></span></div><StatusRow title="Overall" status={result.overallStatus} detail={error?.message ?? overallDetail} /><StatusRow title="Check (i) · t1 versus tmin + CA" status={result.check1Status} detail={result.check1Status === "pending" ? "Need five profile readings and an adjusted minimum." : check1Detail} /><StatusRow title="Check (ii) · t2 versus 0.6 tmin + CA" status={result.check2Status} detail={result.check2Status === "pending" ? "Need t2 and the adjusted 60% threshold." : check2Detail} /><StatusRow title="Pit screen" status={result.pitStatus} detail={pitDetail} /></section>
      <section className="trace-card"><p className="eyebrow">Result trace</p><h3>Visible calculation context</h3><div><span>Engine ID</span><strong>{result.engineId}</strong></div><div><span>Years in service context</span><strong>{yearsInService}</strong></div><div><span>Years since previous context</span><strong>{yearsSincePreviousInspection}</strong></div><div><span>Uncapped automatic L</span><strong>{formatLength(result.automaticCriticalLengthRawMm)} {lengthUnit}</strong></div><div><span>Critical-length cap</span><strong>{result.criticalLengthCapApplied ? "Applied at 1000.00 mm" : "Not applied"}</strong></div><div><span>Automatic t1 average</span><strong>{formatLength(result.automaticAverageThicknessMm)} {lengthUnit}</strong></div><div><span>Automatic tmin + CA</span><strong>{formatLength(result.automaticAdjustedMinimumMm)} {lengthUnit}</strong></div><div><span>Automatic 60% threshold</span><strong>{formatLength(result.automaticAdjustedSixtyPercentMm)} {lengthUnit}</strong></div><div><span>Calculated-value overrides</span><strong>{Object.values(derivedModes).filter((mode) => mode === "manual").length || "None"}</strong></div><div><span>Pit route</span><strong>{statusLabel(result.pitStatus)}</strong></div></section>
    </aside></div>
  </div>;
}
