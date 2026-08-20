import { useMemo, useState } from "react";
import {
  API653_NOZZLE_PRESSURE_CLASSES,
  API653_NOZZLE_SIZES,
  calculateApi653NozzleAssessment,
  convertBetweenUnits,
  convertFromSI,
  convertSIToUnit,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  listApi653NozzleMaterials,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api653NozzleAssessmentInputSI,
  Api653NozzleMaterial,
  Api653NozzleMinimumThicknessMode,
  Api653NozzlePressureClass,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, Layers3, Minus, Plus, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";

type UnitFieldState = { value: string; unit: EngineeringUnit; quantity: EngineeringQuantity };
type NozzleUnitFieldId = "minimumThickness" | "originalThickness" | "previousThickness" | "actualThickness";
type NozzleState = {
  detail: string;
  nominalPipeSizeIn: string;
  minimumThicknessMode: Api653NozzleMinimumThicknessMode;
  fields: Record<NozzleUnitFieldId, UnitFieldState>;
};

const lengthUnits = listEngineeringUnitOptions("length");
const temperatureUnits = listEngineeringUnitOptions("temperature");
const materials = listApi653NozzleMaterials();
const currentYear = new Date().getFullYear();

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

function convertedField(field: UnitFieldState, nextUnit: EngineeringUnit): UnitFieldState {
  const parsed = Number(field.value);
  const value = Number.isFinite(parsed) && field.value.trim() ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit)) : field.value;
  return { ...field, value, unit: nextUnit };
}

function makeNozzle(index: number): NozzleState {
  const golden = index === 1;
  return {
    detail: golden ? "N1 product inlet" : "",
    nominalPipeSizeIn: golden ? "4" : "",
    minimumThicknessMode: "auto",
    fields: {
      minimumThickness: { value: golden ? "2.41" : "", unit: "mm", quantity: "length" },
      originalThickness: { value: golden ? "10" : "", unit: "mm", quantity: "length" },
      previousThickness: { value: golden ? "9.5" : "", unit: "mm", quantity: "length" },
      actualThickness: { value: golden ? "9" : "", unit: "mm", quantity: "length" },
    },
  };
}

function UnitInput({ label, field, options, help, automaticMode, onValueChange, onUnitChange, onModeChange }: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  help: string;
  automaticMode?: Api653NozzleMinimumThicknessMode;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
  onModeChange?: (mode: Api653NozzleMinimumThicknessMode) => void;
}) {
  const automatic = automaticMode !== undefined;
  return <label className={`field ${automatic ? "automatic-field" : ""}`}>
    <span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button>{automatic && <button type="button" className={`field-mode-toggle ${automaticMode}`} onClick={() => onModeChange?.(automaticMode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${automaticMode === "auto" ? "manual" : "auto"} mode`}>{automaticMode}</button>}</span>
    <div className={`number-control ${automatic ? "is-derived" : ""} ${automaticMode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="decimal" value={field.value} readOnly={automaticMode === "auto"} onChange={(event) => onValueChange(event.target.value)} /><select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <small>{help}</small>
  </label>;
}

function NumberInput({ label, value, suffix, help, onChange }: { label: string; value: string; suffix: string; help: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} /><b>{suffix}</b></div><small>{help}</small></label>;
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="numeric" value={value} readOnly={mode === "auto"} onChange={(event) => onChange(event.target.value)} /><b>yr</b></div><small>{help}</small></label>;
}

function lifeDisplay(value: number | null): string {
  if (value === null) return "—";
  if (value === Infinity) return ">99";
  return value > 99 ? `>99 (${formatDisplayNumber(value)} yr)` : formatDisplayNumber(value);
}

export function Api653NozzleCalculator({ onBack }: { onBack: () => void }) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [material, setMaterial] = useState<Api653NozzleMaterial>("carbon steel");
  const [operatingTemperature, setOperatingTemperature] = useState<UnitFieldState>({ value: "200", unit: "C", quantity: "temperature" });
  const [pressureClass, setPressureClass] = useState<Api653NozzlePressureClass>("300");
  const [buildYear, setBuildYear] = useState("2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState("2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>("auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>("auto");
  const [manualServiceYears, setManualServiceYears] = useState("20");
  const [manualInspectionYears, setManualInspectionYears] = useState("5");
  const [nozzles, setNozzles] = useState<NozzleState[]>(() => Array.from({ length: 7 }, (_, index) => makeNozzle(index + 1)));

  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSincePreviousInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);
  const input = useMemo<Api653NozzleAssessmentInputSI>(() => ({
    material,
    operatingTemperatureC: unitValue(operatingTemperature),
    pressureClass,
    yearsInService,
    yearsSincePreviousInspection,
    nozzles: nozzles.map((nozzle, index) => ({
      nozzleIndex: index + 1,
      detail: nozzle.detail,
      nominalPipeSizeIn: nozzle.nominalPipeSizeIn,
      minimumThicknessMode: nozzle.minimumThicknessMode,
      manualMinimumThicknessMm: unitValue(nozzle.fields.minimumThickness),
      originalThicknessMm: unitValue(nozzle.fields.originalThickness),
      previousThicknessMm: unitValue(nozzle.fields.previousThickness),
      actualThicknessMm: unitValue(nozzle.fields.actualThickness),
    })),
  }), [material, nozzles, operatingTemperature, pressureClass, yearsInService, yearsSincePreviousInspection]);
  const result = useMemo(() => calculateApi653NozzleAssessment(input), [input]);
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const manualOverrideActive = serviceYearsMode === "manual" || inspectionYearsMode === "manual" || nozzles.some((nozzle) => nozzle.minimumThicknessMode === "manual");
  const thicknessOutputUnit = defaultUnitForSystem("length", unitSystem);
  const temperatureOutputUnit = defaultUnitForSystem("temperature", unitSystem);
  const thicknessUnit = unitSymbol(thicknessOutputUnit);
  const temperatureUnit = unitSymbol(temperatureOutputUnit);
  const rateUnit = `${thicknessUnit}/yr`;
  const formatThickness = (valueMm: number) => formatDisplayNumber(convertFromSI(valueMm, "length", unitSystem));
  const formatRate = (valueMmPerYear: number) => formatDisplayNumber(convertFromSI(valueMmPerYear, "length", unitSystem), "corrosion-rate");
  const formatTemperature = (valueC: number) => formatDisplayNumber(convertSIToUnit(valueC, "temperature", temperatureOutputUnit));

  const updateNozzle = (index: number, updater: (nozzle: NozzleState) => NozzleState) => setNozzles((current) => current.map((nozzle, nozzleIndex) => nozzleIndex === index ? updater(nozzle) : nozzle));
  const updateFieldValue = (index: number, fieldId: NozzleUnitFieldId, value: string) => updateNozzle(index, (nozzle) => ({ ...nozzle, fields: { ...nozzle.fields, [fieldId]: { ...nozzle.fields[fieldId], value } } }));
  const updateFieldUnit = (index: number, fieldId: NozzleUnitFieldId, unit: EngineeringUnit) => updateNozzle(index, (nozzle) => ({ ...nozzle, fields: { ...nozzle.fields, [fieldId]: convertedField(nozzle.fields[fieldId], unit) } }));
  const switchMinimumMode = (index: number, mode: Api653NozzleMinimumThicknessMode, automaticMm: number | null) => updateNozzle(index, (nozzle) => ({
    ...nozzle,
    minimumThicknessMode: mode,
    fields: mode === "manual" && automaticMm !== null ? { ...nozzle.fields, minimumThickness: { ...nozzle.fields.minimumThickness, value: formatInput(convertSIToUnit(automaticMm, "length", nozzle.fields.minimumThickness.unit)) } } : nozzle.fields,
  }));
  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setOperatingTemperature((field) => convertedField(field, defaultUnitForSystem("temperature", nextSystem)));
    setNozzles((current) => current.map((nozzle) => ({ ...nozzle, fields: Object.fromEntries(Object.entries(nozzle.fields).map(([id, field]) => [id, convertedField(field, defaultUnitForSystem("length", nextSystem))])) as NozzleState["fields"] })));
  };
  const changeServiceMode = (mode: AutomaticValueMode) => { if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService)); setServiceYearsMode(mode); };
  const changeInspectionMode = (mode: AutomaticValueMode) => { if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection)); setInspectionYearsMode(mode); };
  const reset = () => {
    setUnitSystem("metric"); setMaterial("carbon steel"); setOperatingTemperature({ value: "200", unit: "C", quantity: "temperature" }); setPressureClass("300");
    setBuildYear("2006"); setPreviousInspectionYear("2021"); setServiceYearsMode("auto"); setInspectionYearsMode("auto"); setManualServiceYears("20"); setManualInspectionYears("5");
    setNozzles(Array.from({ length: 7 }, (_, index) => makeNozzle(index + 1)));
  };

  return <div className="calculator-page api653-nozzle-page">
    <header className="calculator-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 653 library</button><div className="calculator-heading-row"><div><p className="eyebrow">API 653 · Nozzle integrity · Calculator 4 of 6</p><h1>Nozzle assessment</h1><p>Automatic structural minimum, measured wall, corrosion rates, and remaining life for each tank nozzle.</p></div><div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div><div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Inspection</button><i /><button className="active"><b>3</b> Results</button></div></header>

    <div className="calculator-workspace shell-calculator-workspace"><div className="input-column">
      <section className="form-card"><div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Choose the same result system used by every API 653 calculator; each input still accepts its own site unit.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        <label className="field"><span>Reference basis</span><div className="select-control">API 653 nozzle remaining-life assessment workflow</div><small>Assessment basis for tank-nozzle minimum thickness and remaining life.</small></label>
        <label className="field"><span>Unit system</span><select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · mm / mm/yr</option><option value="us-customary">U.S. customary · in / in/yr</option></select><small>Results follow this selection; every engineering input keeps its own live unit selector.</small></label>
        <label className="field"><span>Nozzle material</span><select aria-label="Nozzle material" className="select-control native-select" value={material} onChange={(event) => setMaterial(event.target.value as Api653NozzleMaterial)}>{materials.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><small>Material determines the structural minimum-thickness selection.</small></label>
        <UnitInput label="Operating temperature" field={operatingTemperature} options={temperatureUnits} help="The first temperature limit at or above this value is selected; values are not interpolated." onValueChange={(value) => setOperatingTemperature((field) => ({ ...field, value }))} onUnitChange={(unit) => setOperatingTemperature((field) => convertedField(field, unit))} />
        <label className="field"><span>Flange pressure class</span><select aria-label="Flange pressure class" className="select-control native-select" value={pressureClass} onChange={(event) => setPressureClass(event.target.value as Api653NozzlePressureClass)}>{API653_NOZZLE_PRESSURE_CLASSES.map((value) => <option key={value} value={value}>Class {value}</option>)}</select><small>Pressure class used with material, temperature, and NPS to select automatic Tmin.</small></label>
      </div><div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Protected Nozzle route connected.</strong> Material, temperature, pressure class, size lookup, minimum thickness, corrosion rates, and remaining life share one normalized engine.</p></div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Automatic years stay highlighted and can be overridden manually.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        <NumberInput label="Build year" value={buildYear} suffix="year" help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
        <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
        <NumberInput label="Previous inspection year" value={previousInspectionYear} suffix="year" help={`Whole year from build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
        <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
      </div><div className={`form-note ${manualOverrideActive ? "is-manual" : "is-valid"}`}>{manualOverrideActive ? <TriangleAlert size={18} /> : <Info size={17} />}<p><strong>{manualOverrideActive ? "Manual override active." : "Automatic dependencies active."}</strong> {manualOverrideActive ? "Verify every highlighted manual field before engineering review." : "Inspection periods and every nozzle minimum update immediately from their source inputs."}</p></div><div className="unit-system-note"><Info size={17} /><p><strong>Mixed engineering units are active.</strong> Each field can use its site unit while results follow <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b>.</p></div></section>

      <section className="form-card shell-courses-section"><div className="shell-section-heading"><div className="form-card-heading"><div><span>03</span><div><h2>Nozzle entries</h2><p>Review each nozzle in a mobile inspection card.</p></div></div><Layers3 size={19} /></div><div className="shell-course-actions"><button type="button" onClick={() => setNozzles((current) => current.length < 15 ? [...current, makeNozzle(current.length + 1)] : current)} disabled={nozzles.length >= 15}><Plus size={15} /> Add</button><button type="button" onClick={() => setNozzles((current) => current.length > 1 ? current.slice(0, -1) : current)} disabled={nozzles.length <= 1}><Minus size={15} /> Remove</button></div></div>
        <div className="shell-course-list">{nozzles.map((nozzle, index) => {
          const nozzleResult = result.nozzles[index];
          if (!nozzleResult) return null;
          const automaticMinimumField = { ...nozzle.fields.minimumThickness, value: nozzleResult.automaticMinimumThicknessMm === null ? "" : formatInput(convertSIToUnit(nozzleResult.automaticMinimumThicknessMm, "length", nozzle.fields.minimumThickness.unit)) };
          const minimumField = nozzle.minimumThicknessMode === "auto" ? automaticMinimumField : nozzle.fields.minimumThickness;
          const inactive = !nozzleResult.active;
          return <article className={`shell-course-card ${nozzle.minimumThicknessMode === "manual" ? "has-manual" : ""}`} key={`nozzle-${index + 1}`}><div className="shell-course-header"><div><span>{String(index + 1).padStart(2, "0")}</span><div><p>Nozzle {index + 1}</p><small>{nozzle.detail || "Inspection entry available"}</small></div></div><div className="shell-course-header-result"><span>Remaining life</span><strong>{inactive ? "—" : lifeDisplay(nozzleResult.remainingLifeYears)}{!inactive && nozzleResult.remainingLifeYears !== null ? " yr" : ""}</strong></div></div>
            <div className="shell-course-inputs"><label className="field"><span>Nozzle detail<button type="button" title="Equipment drawing designation or service description." aria-label={`Nozzle ${index + 1} detail help`}>?</button></span><input className="select-control shell-select-input" aria-label={`Nozzle ${index + 1} detail`} type="text" value={nozzle.detail} placeholder={`N${index + 1} service`} onChange={(event) => updateNozzle(index, (entry) => ({ ...entry, detail: event.target.value }))} /><small>Original nozzle identification or service text.</small></label>
              <label className="field"><span>Nominal pipe size<button type="button" title="NPS drives the structural minimum lookup." aria-label={`Nozzle ${index + 1} nominal pipe size help`}>?</button></span><select className="select-control shell-select-input" aria-label={`Nozzle ${index + 1} nominal pipe size`} value={nozzle.nominalPipeSizeIn} onChange={(event) => updateNozzle(index, (entry) => ({ ...entry, nominalPipeSizeIn: event.target.value }))}><option value="">Select NPS</option>{API653_NOZZLE_SIZES.map((size) => <option key={size} value={size}>{size} in</option>)}</select><small>Unlisted sizes use the lowest or next-lower available NPS row.</small></label>
              <UnitInput label={`Minimum required thickness · N${index + 1}`} field={minimumField} options={lengthUnits} automaticMode={nozzle.minimumThicknessMode} help={nozzle.minimumThicknessMode === "auto" ? nozzleResult.minimumSelection.message : `Manual Tmin active. Automatic recommendation: ${nozzleResult.automaticMinimumThicknessMm ?? "unavailable"} mm.`} onValueChange={(value) => updateFieldValue(index, "minimumThickness", value)} onUnitChange={(unit) => updateFieldUnit(index, "minimumThickness", unit)} onModeChange={(mode) => switchMinimumMode(index, mode, nozzleResult.automaticMinimumThicknessMm)} />
              <UnitInput label={`Original thickness · N${index + 1}`} field={nozzle.fields.originalThickness} options={lengthUnits} help="Original/as-built nozzle wall used for the long-term corrosion rate." onValueChange={(value) => updateFieldValue(index, "originalThickness", value)} onUnitChange={(unit) => updateFieldUnit(index, "originalThickness", unit)} />
              <UnitInput label={`Previous thickness · N${index + 1}`} field={nozzle.fields.previousThickness} options={lengthUnits} help="Wall thickness measured at the previous inspection." onValueChange={(value) => updateFieldValue(index, "previousThickness", value)} onUnitChange={(unit) => updateFieldUnit(index, "previousThickness", unit)} />
              <UnitInput label={`Current thickness · N${index + 1}`} field={nozzle.fields.actualThickness} options={lengthUnits} help="Current measured wall used for corrosion allowance and remaining life." onValueChange={(value) => updateFieldValue(index, "actualThickness", value)} onUnitChange={(unit) => updateFieldUnit(index, "actualThickness", unit)} />
            </div>
            <div className="shell-course-results"><span className={!inactive && nozzleResult.corrosionAllowanceMm <= 0 ? "is-alert" : ""}><small>Corrosion allowance</small><strong>{inactive ? "—" : `${formatThickness(nozzleResult.corrosionAllowanceMm)} ${thicknessUnit}`}</strong>{!inactive && nozzleResult.corrosionAllowanceMm <= 0 && <em>Minimum reached</em>}</span><span><small>Long-term rate</small><strong>{inactive ? "—" : `${formatRate(nozzleResult.longTermCorrosionRateMmPerYear)} ${rateUnit}`}</strong></span><span><small>Short-term rate</small><strong>{inactive ? "—" : `${formatRate(nozzleResult.shortTermCorrosionRateMmPerYear)} ${rateUnit}`}</strong></span><span><small>Governing rate</small><strong>{inactive ? "—" : `${formatRate(nozzleResult.governingCorrosionRateMmPerYear)} ${rateUnit}`}</strong></span></div>
            <div className="shell-course-trace"><p><b>Tmin:</b> {nozzle.minimumThicknessMode === "manual" ? "highlighted manual override" : nozzleResult.minimumSelection.message}</p><p><b>Lookup size:</b> {nozzleResult.minimumSelection.lookupSizeIn ? `NPS ${nozzleResult.minimumSelection.lookupSizeIn}` : "not selected"}. <b>RL:</b> (t actual − Tmin) ÷ max(CR long, CR short).</p></div>
          </article>;
        })}</div>
      </section>

      <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Engineering reference</span><h3>Before using Nozzle results</h3></div></div></div><p>Confirm each nozzle designation, material, flange class, operating temperature, nominal size, thickness history, and measurement location against controlled tank drawings and inspection records.</p><div className="reference-points"><span><b>01</b>Temperature selection uses the next limit without interpolation.</span><span><b>02</b>Unlisted sizes use the lowest or next-lower available NPS row.</span><span><b>03</b>Review highlighted manual Tmin values before approval.</span></div></section>
    </div>

    <aside className="result-column"><section className="result-card shell-summary-card"><div className="result-card-top"><Gauge size={17} /> Nozzle assessment</div><p>Minimum remaining life</p><div className="result-value"><strong>{lifeDisplay(result.minimumRemainingLifeYears)}</strong><span>yr</span></div><div className="result-comparison"><span>Governing nozzle<strong>{result.minimumRemainingLifeNozzleIndex ? `Nozzle ${result.minimumRemainingLifeNozzleIndex}` : "—"}</strong></span><span>Maximum corrosion rate<strong>{result.assessedNozzleCount ? `${formatRate(result.maximumCorrosionRateMmPerYear)} ${rateUnit}` : "—"}</strong></span></div><div className="result-comparison"><span>Maximum remaining life<strong>{lifeDisplay(result.maximumRemainingLifeYears)}{result.maximumRemainingLifeYears !== null ? " yr" : ""}</strong></span><span>Rate nozzle<strong>{result.maximumCorrosionRateNozzleIndex ? `Nozzle ${result.maximumCorrosionRateNozzleIndex}` : "—"}</strong></span></div><div className={`result-status ${result.ok ? manualOverrideActive ? "is-manual" : "is-valid" : ""}`}>{result.ok && !manualOverrideActive ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : manualOverrideActive ? "Calculation includes manual inputs" : warning ? "Calculation completed with review note" : "Calculation completed"}</strong><span>{error?.message ?? warning?.message ?? (manualOverrideActive ? "Verify highlighted overrides before engineering approval." : "Review the calculated result and input basis before use.")}</span></div></div></section>
      <section className="trace-card"><p className="eyebrow">Result trace</p><h3>Visible calculation context</h3><div><span>Engine ID</span><strong>{result.engineId}</strong></div><div><span>Active nozzles</span><strong>{result.assessedNozzleCount}</strong></div><div><span>Years in service</span><strong>{result.yearsInServiceUsed}</strong></div><div><span>Years since previous</span><strong>{result.yearsSincePreviousInspectionUsed}</strong></div><div><span>Material / class</span><strong>{result.materialLabel} / {result.pressureClass}</strong></div><div><span>Operating temperature</span><strong>{formatTemperature(result.operatingTemperatureCUsed)} {temperatureUnit}</strong></div><div><span>Manual overrides</span><strong>{manualOverrideActive ? "Active" : "None"}</strong></div><div><span>Open-ended life</span><strong>{result.hasOpenEndedRemainingLife ? "Present" : "None"}</strong></div></section>
    </aside></div>
  </div>;
}
