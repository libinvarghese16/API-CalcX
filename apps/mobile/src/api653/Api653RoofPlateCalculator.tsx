import { useMemo, useState } from "react";
import {
  calculateApi653RoofPlate,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api653RoofPlateInputSI,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";

type UnitFieldState = { value: string; unit: EngineeringUnit; quantity: EngineeringQuantity };
type RoofFieldId = "originalThickness" | "previousThickness" | "actualThickness" | "minimumThickness";
type RoofFields = Record<RoofFieldId, UnitFieldState>;

const lengthUnits = listEngineeringUnitOptions("length");
const currentYear = new Date().getFullYear();

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

function YearInput({ label, value, help, onChange }: { label: string; value: string; help: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} /><b>year</b></div><small>{help}</small></label>;
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="numeric" value={value} readOnly={mode === "auto"} onChange={(event) => onChange(event.target.value)} /><b>yr</b></div><small>{help}</small></label>;
}

export function Api653RoofPlateCalculator({ onBack }: { onBack: () => void }) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [buildYear, setBuildYear] = useState("2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState("2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>("auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>("auto");
  const [manualServiceYears, setManualServiceYears] = useState("20");
  const [manualInspectionYears, setManualInspectionYears] = useState("5");
  const [roofType, setRoofType] = useState<Api653RoofPlateInputSI["roofType"]>("supported-cone");
  const [minimumThicknessBasis, setMinimumThicknessBasis] = useState<Api653RoofPlateInputSI["minimumThicknessBasis"]>("api653-2.2mm-area-average");
  const [areaAverageConfirmed, setAreaAverageConfirmed] = useState(true);
  const [holesPresent, setHolesPresent] = useState(false);
  const [fields, setFields] = useState<RoofFields>({
    originalThickness: { value: "6", unit: "mm", quantity: "length" },
    previousThickness: { value: "5.5", unit: "mm", quantity: "length" },
    actualThickness: { value: "5", unit: "mm", quantity: "length" },
    minimumThickness: { value: "2.2", unit: "mm", quantity: "length" },
  });
  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSincePreviousInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);
  const input = useMemo<Api653RoofPlateInputSI>(() => ({
    roofType,
    minimumThicknessBasis,
    areaAverageConfirmed,
    holesPresent,
    originalThicknessMm: convertUnitToSI(numberFrom(fields.originalThickness.value), "length", fields.originalThickness.unit),
    previousThicknessMm: convertUnitToSI(numberFrom(fields.previousThickness.value), "length", fields.previousThickness.unit),
    actualThicknessMm: convertUnitToSI(numberFrom(fields.actualThickness.value), "length", fields.actualThickness.unit),
    minimumThicknessMm: convertUnitToSI(numberFrom(fields.minimumThickness.value), "length", fields.minimumThickness.unit),
    yearsInService,
    yearsSincePreviousInspection,
  }), [areaAverageConfirmed, fields, holesPresent, minimumThicknessBasis, roofType, yearsInService, yearsSincePreviousInspection]);
  const result = useMemo(() => calculateApi653RoofPlate(input), [input]);
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const manualOverrideActive = serviceYearsMode === "manual" || inspectionYearsMode === "manual";
  const lengthUnit = unitSymbol(defaultUnitForSystem("length", unitSystem));
  const rateUnit = `${lengthUnit}/yr`;
  const formatLength = (value: number) => formatDisplayNumber(convertFromSI(value, "length", unitSystem));
  const formatRate = (value: number) => formatDisplayNumber(convertFromSI(value, "length", unitSystem), "corrosion-rate");
  const lifeDisplay = result.remainingLifeOpenEnded ? ">99" : result.remainingLifeOver99Years ? `>99 (${formatDisplayNumber(result.remainingLifeYears)})` : formatDisplayNumber(result.remainingLifeYears);
  const lifeTrace = result.remainingLifeOpenEnded ? ">99; open-ended because CR = 0" : result.remainingLifeOver99Years ? `>99; calculated ${formatDisplayNumber(result.remainingLifeYears)} years` : `${formatDisplayNumber(result.remainingLifeYears)} years`;

  const updateFieldValue = (fieldId: RoofFieldId, value: string) => setFields((current) => ({ ...current, [fieldId]: { ...current[fieldId], value } }));
  const updateFieldUnit = (fieldId: RoofFieldId, unit: EngineeringUnit) => setFields((current) => ({ ...current, [fieldId]: convertedField(current[fieldId], unit) }));
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    const nextUnit = defaultUnitForSystem("length", nextSystem);
    setFields((current) => Object.fromEntries(Object.entries(current).map(([id, field]) => [id, convertedField(field, nextUnit)])) as RoofFields);
  };
  const changeServiceMode = (mode: AutomaticValueMode) => { if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService)); setServiceYearsMode(mode); };
  const changeInspectionMode = (mode: AutomaticValueMode) => { if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection)); setInspectionYearsMode(mode); };
  const reset = () => {
    setUnitSystem("metric"); setBuildYear("2006"); setPreviousInspectionYear("2021"); setServiceYearsMode("auto"); setInspectionYearsMode("auto"); setManualServiceYears("20"); setManualInspectionYears("5"); setRoofType("supported-cone"); setMinimumThicknessBasis("api653-2.2mm-area-average"); setAreaAverageConfirmed(true); setHolesPresent(false);
    setFields({ originalThickness: { value: "6", unit: "mm", quantity: "length" }, previousThickness: { value: "5.5", unit: "mm", quantity: "length" }, actualThickness: { value: "5", unit: "mm", quantity: "length" }, minimumThickness: { value: "2.2", unit: "mm", quantity: "length" } });
  };

  return <div className="calculator-page api653-roof-page">
    <header className="calculator-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 653 library</button><div className="calculator-heading-row"><div><p className="eyebrow">API 653 · Roof integrity · Calculator 5 of 6</p><h1>Roof plate remaining life</h1><p>Roof thickness loss, long- and short-term corrosion rates, corrosion allowance, and remaining life.</p></div><div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div><div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Inspection</button><i /><button className="active"><b>3</b> Results</button></div></header>

    <div className="calculator-workspace"><div className="input-column">
      <section className="form-card"><div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Set the project minimum and choose the result unit system.</p></div></div><Wrench size={19} /></div><div className="form-grid">
        <label className="field"><span>Reference basis</span><div className="select-control">API 653 roof plate remaining-life workflow</div><small>Equation identity was captured from the protected original application; no standards PDF or displayed table is bundled.</small></label>
        <label className="field"><span>Unit system</span><select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · mm / mm/yr</option><option value="us-customary">U.S. customary · in / in/yr</option></select><small>Results follow this selection; every engineering input keeps its own live unit selector.</small></label>
        <label className="field"><span>Roof type</span><select aria-label="Roof type" className="select-control native-select" value={roofType} onChange={(event) => setRoofType(event.target.value as Api653RoofPlateInputSI["roofType"])}><option value="supported-cone">Supported cone roof</option><option value="self-supporting">Self-supporting roof</option><option value="other">Other roof type</option></select><small>Roof type controls whether the 2.2 mm area-average route is sufficient.</small></label>
        <label className="field"><span>Minimum-thickness basis</span><select aria-label="Roof minimum-thickness basis" className="select-control native-select" value={minimumThicknessBasis} onChange={(event) => setMinimumThicknessBasis(event.target.value as Api653RoofPlateInputSI["minimumThicknessBasis"])}><option value="api653-2.2mm-area-average">API 653 area average · 2.2 mm</option><option value="manual-controlled">Controlled structural minimum</option></select><small>The API 653 route is a 2.2 mm average over a 250 mm × 250 mm area.</small></label>
        {minimumThicknessBasis === "manual-controlled" && <UnitInput label="Controlled minimum required thickness" field={fields.minimumThickness} options={lengthUnits} help="Enter the structural minimum from the controlled roof assessment basis." onValueChange={(value) => updateFieldValue("minimumThickness", value)} onUnitChange={(unit) => updateFieldUnit("minimumThickness", unit)} />}
        <label className="field"><span>Area-average confirmation</span><label className="check-row"><input type="checkbox" checked={areaAverageConfirmed} onChange={(event) => setAreaAverageConfirmed(event.target.checked)} /> Current thickness represents a 250 mm × 250 mm area average</label><small>Required for the standard 2.2 mm criterion.</small></label>
        <label className="field"><span>Roof holes</span><label className="check-row"><input type="checkbox" checked={holesPresent} onChange={(event) => setHolesPresent(event.target.checked)} /> Holes are present in the assessed roof area</label><small>Holes block a remaining-life-only acceptance result.</small></label>
      </div><div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Protected Roof route connected.</strong> Minimum thickness, thickness history, both corrosion periods, governing rate, and remaining life share one normalized engine.</p></div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Automatic years stay highlighted and can be overridden manually.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        <YearInput label="Build year" value={buildYear} help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
        <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `Automatically calculated: ${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
        <YearInput label="Previous inspection year" value={previousInspectionYear} help={`Whole year from the build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
        <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `Automatically calculated: ${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
        <UnitInput label="Original roof thickness" field={fields.originalThickness} options={lengthUnits} help="Original/as-built roof plate thickness used for the long-term corrosion rate." onValueChange={(value) => updateFieldValue("originalThickness", value)} onUnitChange={(unit) => updateFieldUnit("originalThickness", unit)} />
        <UnitInput label="Previous measured thickness" field={fields.previousThickness} options={lengthUnits} help="Roof plate thickness measured during the previous inspection." onValueChange={(value) => updateFieldValue("previousThickness", value)} onUnitChange={(unit) => updateFieldUnit("previousThickness", unit)} />
        <UnitInput label="Current measured thickness" field={fields.actualThickness} options={lengthUnits} help="Current roof thickness used for corrosion allowance and remaining life." onValueChange={(value) => updateFieldValue("actualThickness", value)} onUnitChange={(unit) => updateFieldUnit("actualThickness", unit)} />
      </div><div className={`form-note ${manualOverrideActive ? "is-manual" : warning ? "" : "is-valid"}`}>{manualOverrideActive || warning ? <TriangleAlert size={18} /> : <Info size={17} />}<p><strong>{warning ? "Minimum-thickness review." : manualOverrideActive ? "Manual override active." : "Automatic dependencies active."}</strong> {warning?.message ?? (manualOverrideActive ? "Verify every highlighted manual period before engineering review." : "Both inspection periods update immediately from their recorded years.")}</p></div><div className="unit-system-note"><Info size={17} /><p><strong>Mixed engineering units are active.</strong> Every field converts into the normalized engine while results follow <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b>.</p></div></section>

      <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using the Roof remaining-life result</h3></div></div><span>No standards PDF</span></div><p>Confirm the roof plate area, thickness measurement locations, original and previous inspection records, corrosion side, minimum required thickness, and inspection dates against controlled project information. The result supports assessment and does not replace responsible inspection and engineering review.</p><div className="reference-points"><span><b>01</b>Thickness loss = max(t previous − t actual, 0).</span><span><b>02</b>CA = t actual − t minimum.</span><span><b>03</b>RL = CA ÷ max(CR long, CR short).</span></div></section>
    </div>

    <aside className="result-column"><section className="result-card"><div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div><div className="result-primary-grid"><div className="result-primary"><p>Remaining life</p><div className="result-primary-value"><strong>{lifeDisplay}</strong><span>yr</span></div></div><div className="result-primary"><p>Minimum thickness</p><div className="result-primary-value"><strong>{formatLength(result.minimumThicknessMmUsed)}</strong><span>{lengthUnit}</span></div></div></div><div className="result-comparison"><span>Thickness loss since previous<strong>{formatLength(result.thicknessLossSincePreviousMm)} {lengthUnit}</strong></span><span>Corrosion allowance<strong>{formatLength(result.corrosionAllowanceMm)} {lengthUnit}</strong></span></div><div className="result-comparison"><span>Long-term rate<strong>{formatRate(result.longTermCorrosionRateMmPerYear)} {rateUnit}</strong></span><span>Short-term rate<strong>{formatRate(result.shortTermCorrosionRateMmPerYear)} {rateUnit}</strong></span></div><div className={`result-status ${result.ok ? manualOverrideActive ? "is-manual" : warning || result.belowProtectedAlertThreshold ? "" : "is-valid" : ""}`}>{result.ok && !manualOverrideActive && !warning && !result.belowProtectedAlertThreshold ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : warning ? "Minimum thickness reached" : manualOverrideActive ? "Calculation includes manual periods" : result.belowProtectedAlertThreshold ? "Remaining-life review required" : "Calculation completed"}</strong><span>{error?.message ?? warning?.message ?? (manualOverrideActive ? "Verify highlighted overrides before engineering approval." : result.remainingLifeOpenEnded ? "A zero governing corrosion rate produces an open-ended remaining-life result." : "Review the remaining-life and corrosion-rate results before use.")}</span></div></div></section>
      <section className="trace-card"><p className="eyebrow">Supporting results</p><h3>Calculation details</h3><div><span>Years in service</span><strong>{result.yearsInServiceUsed}</strong></div><div><span>Years since previous</span><strong>{result.yearsSincePreviousInspectionUsed}</strong></div><div><span>Long-term metal loss</span><strong>{formatLength(result.longTermMetalLossMm)} {lengthUnit}</strong></div><div><span>Governing corrosion rate</span><strong>{formatRate(result.governingCorrosionRateMmPerYear)} {rateUnit}</strong></div><div><span>Minimum thickness used</span><strong>{formatLength(result.minimumThicknessMmUsed)} {lengthUnit}</strong></div><div><span>Remaining-life display</span><strong>{lifeTrace}</strong></div><div><span>Manual period overrides</span><strong>{manualOverrideActive ? "Active" : "None"}</strong></div></section>
    </aside></div>
  </div>;
}
