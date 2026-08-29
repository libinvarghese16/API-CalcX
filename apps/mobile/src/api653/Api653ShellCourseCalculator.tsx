import { useMemo, useState } from "react";
import {
  calculateApi653ShellAssessment,
  convertBetweenUnits,
  convertFromSI,
  convertSIToUnit,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  listApi653ShellMaterials,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  Api653ShellAssessmentInputSI,
  Api653ShellStressMode,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { ArrowLeft, Check, CircleCheck, Clipboard, Gauge, Info, Layers3, Minus, Plus, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { copyShellCourseTable } from "./shell-course-copy.ts";

type UnitFieldState = { value: string; unit: EngineeringUnit; quantity: EngineeringQuantity };
type CourseUnitFieldId = "courseHeight" | "productStress" | "hydroStress" | "asBuiltThickness" | "previousThickness" | "actualThickness";
type CourseUnitFields = Record<CourseUnitFieldId, UnitFieldState>;
type CourseState = {
  materialId: string;
  productStressMode: Api653ShellStressMode;
  hydroStressMode: Api653ShellStressMode;
  fields: CourseUnitFields;
};

const lengthUnits = listEngineeringUnitOptions("length");
const pressureUnits = listEngineeringUnitOptions("pressure");
const materials = listApi653ShellMaterials();
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

function makeCourse(courseIndex: number): CourseState {
  const defaults = courseIndex === 1
    ? { product: "172", hydro: "189", asBuilt: "24", previous: "22", actual: "21" }
    : courseIndex === 2
      ? { product: "172", hydro: "189", asBuilt: "22", previous: "20.5", actual: "20" }
      : { product: "189", hydro: "208", asBuilt: "18", previous: "17", actual: "16.5" };
  return {
    materialId: "A36",
    productStressMode: "auto",
    hydroStressMode: "auto",
    fields: {
      courseHeight: { value: "3", unit: "m", quantity: "length" },
      productStress: { value: defaults.product, unit: "MPa", quantity: "pressure" },
      hydroStress: { value: defaults.hydro, unit: "MPa", quantity: "pressure" },
      asBuiltThickness: { value: defaults.asBuilt, unit: "mm", quantity: "length" },
      previousThickness: { value: defaults.previous, unit: "mm", quantity: "length" },
      actualThickness: { value: defaults.actual, unit: "mm", quantity: "length" },
    },
  };
}

function defaultUnit(fieldId: "diameter" | "height" | CourseUnitFieldId, quantity: EngineeringQuantity, unitSystem: UnitSystem): EngineeringUnit {
  if (fieldId === "diameter" || fieldId === "height" || fieldId === "courseHeight") return unitSystem === "metric" ? "m" : "ft";
  return defaultUnitForSystem(quantity, unitSystem);
}

function convertedField(field: UnitFieldState, nextUnit: EngineeringUnit): UnitFieldState {
  const parsed = Number(field.value);
  const value = Number.isFinite(parsed) && field.value.trim()
    ? formatInput(convertBetweenUnits(parsed, field.quantity, field.unit, nextUnit))
    : field.value;
  return { ...field, value, unit: nextUnit };
}

function UnitInput({ label, field, options, help, automaticMode, onValueChange, onUnitChange, onModeChange }: {
  label: string;
  field: UnitFieldState;
  options: readonly EngineeringUnitOption[];
  help: string;
  automaticMode?: Api653ShellStressMode;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: EngineeringUnit) => void;
  onModeChange?: (mode: Api653ShellStressMode) => void;
}) {
  const automatic = automaticMode !== undefined;
  return <label className={`field ${automatic ? "automatic-field" : ""}`}>
    <span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button>{automatic && <button type="button" className={`field-mode-toggle ${automaticMode}`} onClick={() => onModeChange?.(automaticMode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${automaticMode === "auto" ? "manual" : "auto"} mode`}>{automaticMode}</button>}</span>
    <div className={`number-control ${automatic ? "is-derived" : ""} ${automaticMode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="decimal" value={field.value} readOnly={automaticMode === "auto"} onChange={(event) => onValueChange(event.target.value)} /><select className="unit-picker" aria-label={`${label} unit`} value={field.unit} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <small>{help}</small>
  </label>;
}

function NumberInput({ label, value, suffix, help, onChange }: { label: string; value: string; suffix: string; help: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button></span><div className="number-control"><input aria-label={label} type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><b>{suffix}</b></div><small>{help}</small></label>;
}

function DerivedYearsInput({ label, mode, value, help, onChange, onModeChange }: { label: string; mode: AutomaticValueMode; value: string; help: string; onChange: (value: string) => void; onModeChange: (mode: AutomaticValueMode) => void }) {
  return <label className="field automatic-field"><span>{label}<button type="button" title={help} aria-label={`${label} help`}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")} aria-label={`Switch ${label} to ${mode === "auto" ? "manual" : "auto"} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input aria-label={label} type="number" inputMode="numeric" value={value} readOnly={mode === "auto"} onChange={(event) => onChange(event.target.value)} /><b>yr</b></div><small>{help}</small></label>;
}

function lifeDisplay(value: number): string {
  return value === Infinity ? "∞" : formatDisplayNumber(value);
}

export function Api653ShellCourseCalculator({ onBack }: { onBack: () => void }) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [diameter, setDiameter] = useState<UnitFieldState>({ value: "30", unit: "m", quantity: "length" });
  const [height, setHeight] = useState<UnitFieldState>({ value: "18", unit: "m", quantity: "length" });
  const [specificGravity, setSpecificGravity] = useState("1.1");
  const [jointEfficiency, setJointEfficiency] = useState("0.85");
  const [buildYear, setBuildYear] = useState("2006");
  const [previousInspectionYear, setPreviousInspectionYear] = useState("2021");
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>("auto");
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>("auto");
  const [manualServiceYears, setManualServiceYears] = useState("20");
  const [manualInspectionYears, setManualInspectionYears] = useState("5");
  const [courses, setCourses] = useState<CourseState[]>(() => [makeCourse(1), makeCourse(2), makeCourse(3)]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const numericBuildYear = numberFrom(buildYear);
  const serviceYears = deriveYearsInService(numericBuildYear, currentYear);
  const inspectionYears = deriveYearsSincePreviousInspection(numberFrom(previousInspectionYear), numericBuildYear, currentYear);
  const yearsInService = serviceYearsMode === "auto" ? serviceYears.yearsInService ?? 0 : numberFrom(manualServiceYears);
  const yearsSincePreviousInspection = inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection ?? 0 : numberFrom(manualInspectionYears);

  const input = useMemo<Api653ShellAssessmentInputSI>(() => ({
    diameterM: unitValue(diameter) / 1000,
    totalHeightM: unitValue(height) / 1000,
    specificGravity: numberFrom(specificGravity),
    jointEfficiency: numberFrom(jointEfficiency),
    yearsInService,
    yearsSincePreviousInspection,
    courses: courses.map((course, index) => ({
      courseIndex: index + 1,
      courseHeightM: unitValue(course.fields.courseHeight) / 1000,
      materialId: course.materialId,
      productStressMode: course.productStressMode,
      manualProductStressMpa: unitValue(course.fields.productStress),
      hydroStressMode: course.hydroStressMode,
      manualHydroStressMpa: unitValue(course.fields.hydroStress),
      asBuiltThicknessMm: unitValue(course.fields.asBuiltThickness),
      previousThicknessMm: unitValue(course.fields.previousThickness),
      actualThicknessMm: unitValue(course.fields.actualThickness),
    })),
  }), [courses, diameter, height, jointEfficiency, specificGravity, yearsInService, yearsSincePreviousInspection]);
  const result = useMemo(() => calculateApi653ShellAssessment(input), [input]);
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");
  const manualOverrideActive = serviceYearsMode === "manual" || inspectionYearsMode === "manual" || courses.some((course) => course.productStressMode === "manual" || course.hydroStressMode === "manual");

  const heightOutputUnit: EngineeringUnit = unitSystem === "metric" ? "m" : "ft";
  const thicknessOutputUnit = defaultUnitForSystem("length", unitSystem);
  const pressureOutputUnit = defaultUnitForSystem("pressure", unitSystem);
  const heightUnit = unitSymbol(heightOutputUnit);
  const thicknessUnit = unitSymbol(thicknessOutputUnit);
  const pressureUnit = unitSymbol(pressureOutputUnit);
  const rateUnit = `${thicknessUnit}/yr`;
  const formatHeight = (valueM: number) => formatDisplayNumber(convertSIToUnit(valueM * 1000, "length", heightOutputUnit));
  const formatThickness = (valueMm: number) => formatDisplayNumber(convertFromSI(valueMm, "length", unitSystem));
  const formatStress = (valueMpa: number) => formatDisplayNumber(convertFromSI(valueMpa, "pressure", unitSystem));
  const formatRate = (valueMmPerYear: number) => formatDisplayNumber(convertFromSI(valueMmPerYear, "length", unitSystem), "corrosion-rate");

  const updateCourse = (index: number, updater: (course: CourseState) => CourseState) => setCourses((current) => current.map((course, courseIndex) => courseIndex === index ? updater(course) : course));
  const updateCourseFieldValue = (index: number, fieldId: CourseUnitFieldId, value: string) => updateCourse(index, (course) => ({ ...course, fields: { ...course.fields, [fieldId]: { ...course.fields[fieldId], value } } }));
  const updateCourseFieldUnit = (index: number, fieldId: CourseUnitFieldId, nextUnit: EngineeringUnit) => updateCourse(index, (course) => ({ ...course, fields: { ...course.fields, [fieldId]: convertedField(course.fields[fieldId], nextUnit) } }));
  const switchStressMode = (index: number, kind: "product" | "hydro", mode: Api653ShellStressMode, automaticMpa: number | null) => updateCourse(index, (course) => {
    const fieldId = kind === "product" ? "productStress" : "hydroStress";
    const fields = mode === "manual" && automaticMpa !== null
      ? { ...course.fields, [fieldId]: { ...course.fields[fieldId], value: formatInput(convertSIToUnit(automaticMpa, "pressure", course.fields[fieldId].unit)) } }
      : course.fields;
    return { ...course, fields, [kind === "product" ? "productStressMode" : "hydroStressMode"]: mode };
  });
  const selectMaterial = (index: number, materialId: string) => updateCourse(index, (course) => {
    if (materialId !== "Known") return { ...course, materialId, productStressMode: "auto", hydroStressMode: "auto" };
    const courseResult = result.courses[index];
    const productField = courseResult?.automaticProductStressMpa !== null && courseResult?.automaticProductStressMpa !== undefined
      ? { ...course.fields.productStress, value: formatInput(convertSIToUnit(courseResult.automaticProductStressMpa, "pressure", course.fields.productStress.unit)) }
      : course.fields.productStress;
    const hydroField = courseResult?.automaticHydroStressMpa !== null && courseResult?.automaticHydroStressMpa !== undefined
      ? { ...course.fields.hydroStress, value: formatInput(convertSIToUnit(courseResult.automaticHydroStressMpa, "pressure", course.fields.hydroStress.unit)) }
      : course.fields.hydroStress;
    return { ...course, materialId, productStressMode: "manual", hydroStressMode: "manual", fields: { ...course.fields, productStress: productField, hydroStress: hydroField } };
  });

  const changeUnitSystem = (nextSystem: UnitSystem) => {
    setUnitSystem(nextSystem);
    setDiameter((field) => convertedField(field, defaultUnit("diameter", field.quantity, nextSystem)));
    setHeight((field) => convertedField(field, defaultUnit("height", field.quantity, nextSystem)));
    setCourses((current) => current.map((course) => ({
      ...course,
      fields: Object.fromEntries(Object.entries(course.fields).map(([fieldId, field]) => [fieldId, convertedField(field, defaultUnit(fieldId as CourseUnitFieldId, field.quantity, nextSystem))])) as CourseUnitFields,
    })));
  };
  const changeServiceMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && serviceYears.yearsInService !== null) setManualServiceYears(String(serviceYears.yearsInService));
    setServiceYearsMode(mode);
  };
  const changeInspectionMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection));
    setInspectionYearsMode(mode);
  };
  const reset = () => {
    setUnitSystem("metric");
    setDiameter({ value: "30", unit: "m", quantity: "length" });
    setHeight({ value: "18", unit: "m", quantity: "length" });
    setSpecificGravity("1.1");
    setJointEfficiency("0.85");
    setBuildYear("2006");
    setPreviousInspectionYear("2021");
    setServiceYearsMode("auto");
    setInspectionYearsMode("auto");
    setManualServiceYears("20");
    setManualInspectionYears("5");
    setCourses([makeCourse(1), makeCourse(2), makeCourse(3)]);
    setCopyState("idle");
  };

  const copyCourseTable = async () => {
    try {
      await copyShellCourseTable(result.courses.map((course) => ({
        courseIndex: course.courseIndex,
        materialSpecification: course.materialId,
        courseHeightM: course.courseHeightMUsed,
        heightToTopM: course.heightToTopM,
        allowableProductStressMpa: course.productStressMpaUsed,
        calculatedMinimumThicknessMm: course.minimumThicknessMm,
        asBuiltThicknessMm: course.asBuiltThicknessMmUsed,
        previousThicknessMm: course.previousThicknessMmUsed,
        actualThicknessMm: course.actualThicknessMmUsed,
        minimumThicknessMm: course.minimumThicknessMm,
        corrosionAllowanceMm: course.corrosionAllowanceMm,
        longTermCorrosionRateMmPerYear: course.longTermCorrosionRateMmPerYear,
        shortTermCorrosionRateMmPerYear: course.shortTermCorrosionRateMmPerYear,
        remainingLifeYears: course.remainingLifeYears,
      })));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2_500);
    } catch {
      setCopyState("error");
    }
  };

  return <div className="calculator-page api653-shell-page">
    <header className="calculator-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 653 library</button><div className="calculator-heading-row"><div><p className="eyebrow">API 653 · Shell integrity · Calculator 3 of 6</p><h1>Shell course assessment</h1><p>Course minimum thickness, hydrostatic and operating heights, corrosion rates, and remaining life.</p></div><div className="calculator-actions"><span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span><button className="secondary-button" onClick={() => void copyCourseTable()} disabled={!result.courses.length} aria-label="Copy all shell courses as a formatted table">{copyState === "copied" ? <Check size={16} /> : <Clipboard size={16} />} {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy table"}</button><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div><div className="step-line" aria-label="Calculation workflow"><button className="complete"><b>1</b> Basis</button><i /><button className="complete"><b>2</b> Inspection</button><i /><button className="active"><b>3</b> Results</button></div></header>

    <div className="calculator-workspace shell-calculator-workspace"><div className="input-column">
      <section className="form-card"><div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Choose the same result system used by every API 653 calculator; each input still accepts its own site unit.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        <label className="field"><span>Reference basis</span><div className="select-control">API 653 shell course assessment workflow</div><small>Original explanatory text and protected calculation behavior; no standards PDF or calculation table is bundled.</small></label>
        <label className="field"><span>Unit system</span><select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}><option value="metric">Metric · mm / mm/yr</option><option value="us-customary">U.S. customary · in / in/yr</option></select><small>Results follow this selection; every engineering input keeps its own live unit selector.</small></label>
        <UnitInput label="Tank diameter" field={diameter} options={lengthUnits} help="Tank diameter D used by every course equation." onValueChange={(value) => setDiameter((field) => ({ ...field, value }))} onUnitChange={(unit) => setDiameter((field) => convertedField(field, unit))} />
        <UnitInput label="Tank height" field={height} options={lengthUnits} help="Maximum liquid height used to establish H to Top." onValueChange={(value) => setHeight((field) => ({ ...field, value }))} onUnitChange={(unit) => setHeight((field) => convertedField(field, unit))} />
        <NumberInput label="Specific gravity" value={specificGravity} suffix="G" help="Stored product specific gravity G." onChange={setSpecificGravity} />
        <NumberInput label="Joint efficiency" value={jointEfficiency} suffix="E" help="Joint efficiency must be greater than zero and no more than 1." onChange={setJointEfficiency} />
      </div><div className="form-note is-valid"><ShieldCheck size={17} /><p><strong>Protected Shell route connected.</strong> Tank geometry, material stress, minimum thickness, hydrostatic height, operating fill, corrosion rates, and remaining life share one normalized engine.</p></div></section>

      <section className="form-card"><div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Automatic years stay highlighted and can be overridden manually.</p></div></div><Gauge size={19} /></div><div className="form-grid">
        <NumberInput label="Build year" value={buildYear} suffix="year" help={`Whole year from 1900 to ${currentYear}.`} onChange={setBuildYear} />
        <DerivedYearsInput label="Years in service" mode={serviceYearsMode} value={serviceYearsMode === "auto" ? String(serviceYears.yearsInService ?? "") : manualServiceYears} help={serviceYearsMode === "auto" ? serviceYears.message || `${currentYear} − build year.` : "Manual override is active and highlighted."} onChange={setManualServiceYears} onModeChange={changeServiceMode} />
        <NumberInput label="Previous inspection year" value={previousInspectionYear} suffix="year" help={`Whole year from build year to ${currentYear}.`} onChange={setPreviousInspectionYear} />
        <DerivedYearsInput label="Years since previous inspection" mode={inspectionYearsMode} value={inspectionYearsMode === "auto" ? String(inspectionYears.yearsSincePreviousInspection ?? "") : manualInspectionYears} help={inspectionYearsMode === "auto" ? inspectionYears.message || `${currentYear} − previous inspection year.` : "Manual override is active and highlighted."} onChange={setManualInspectionYears} onModeChange={changeInspectionMode} />
      </div><div className={`form-note ${manualOverrideActive ? "is-manual" : "is-valid"}`}>{manualOverrideActive ? <TriangleAlert size={18} /> : <Info size={17} />}<p><strong>{manualOverrideActive ? "Manual override active." : "Automatic dependencies active."}</strong> {manualOverrideActive ? "Verify every highlighted manual field before engineering review." : "Both inspection periods update immediately from their recorded years."}</p></div><div className="unit-system-note"><Info size={17} /><p><strong>Mixed engineering units are active.</strong> Each field can use its site unit while results follow <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b>.</p></div></section>

      <section className="form-card shell-courses-section"><div className="shell-section-heading"><div className="form-card-heading"><div><span>03</span><div><h2>Shell courses</h2><p>Bottom-to-top sequence. No wide calculation table is used on mobile.</p></div></div><Layers3 size={19} /></div><div className="shell-course-actions"><button type="button" onClick={() => setCourses((current) => current.length < 15 ? [...current, makeCourse(current.length + 1)] : current)} disabled={courses.length >= 15}><Plus size={15} /> Add</button><button type="button" onClick={() => setCourses((current) => current.length > 1 ? current.slice(0, -1) : current)} disabled={courses.length <= 1}><Minus size={15} /> Remove</button></div></div>
        <div className="shell-course-list">{courses.map((course, index) => {
          const courseResult = result.courses[index];
          if (!courseResult) return null;
          const automaticProductField = { ...course.fields.productStress, value: courseResult.automaticProductStressMpa === null ? "" : formatInput(convertSIToUnit(courseResult.automaticProductStressMpa, "pressure", course.fields.productStress.unit)) };
          const automaticHydroField = { ...course.fields.hydroStress, value: courseResult.automaticHydroStressMpa === null ? "" : formatInput(convertSIToUnit(courseResult.automaticHydroStressMpa, "pressure", course.fields.hydroStress.unit)) };
          const productField = course.productStressMode === "auto" ? automaticProductField : course.fields.productStress;
          const hydroField = course.hydroStressMode === "auto" ? automaticHydroField : course.fields.hydroStress;
          const courseManual = course.productStressMode === "manual" || course.hydroStressMode === "manual";
          return <article className={`shell-course-card ${courseManual ? "has-manual" : ""}`} key={`shell-course-${index + 1}`}><div className="shell-course-header"><div><span>{String(index + 1).padStart(2, "0")}</span><div><p>Shell course {index + 1}</p><small>{index < 2 ? "Lower-two-course stress route" : "Upper-course stress route"}</small></div></div><div className="shell-course-header-result"><span>Remaining life</span><strong>{lifeDisplay(courseResult.remainingLifeYears)} yr</strong></div></div>
            <div className="shell-course-inputs"><label className="field"><span>Material specification<button type="button" title="Material selection controls the automatic S and St recommendations." aria-label={`Shell course ${index + 1} material help`}>?</button></span><select className="select-control shell-select-input" aria-label={`Shell course ${index + 1} material specification`} value={course.materialId} onChange={(event) => selectMaterial(index, event.target.value)}>{materials.map((material) => <option key={material.id} value={material.id}>{material.label}</option>)}</select><small>Known material keeps S and St in highlighted manual mode.</small></label>
              <UnitInput label={`Course ${index + 1} height`} field={course.fields.courseHeight} options={lengthUnits} help="Height of this course; preceding course heights set upper-course H to Top." onValueChange={(value) => updateCourseFieldValue(index, "courseHeight", value)} onUnitChange={(unit) => updateCourseFieldUnit(index, "courseHeight", unit)} />
              <UnitInput label={`Allowable product stress S · C${index + 1}`} field={productField} options={pressureUnits} automaticMode={course.productStressMode} help={course.productStressMode === "auto" ? `${courseResult.productStressRule?.formulaLabel ?? "Material route"}; selected ${courseResult.automaticProductStressMpa ?? "unavailable"} MPa.` : `Manual S active. Automatic recommendation: ${courseResult.automaticProductStressMpa ?? "unavailable"} MPa.`} onValueChange={(value) => updateCourseFieldValue(index, "productStress", value)} onUnitChange={(unit) => updateCourseFieldUnit(index, "productStress", unit)} onModeChange={(mode) => switchStressMode(index, "product", mode, courseResult.automaticProductStressMpa)} />
              <UnitInput label={`Hydrostatic test stress St · C${index + 1}`} field={hydroField} options={pressureUnits} automaticMode={course.hydroStressMode} help={course.hydroStressMode === "auto" ? `${courseResult.hydroStressRule?.formulaLabel ?? "Material route"}; selected ${courseResult.automaticHydroStressMpa ?? "unavailable"} MPa.` : `Manual St active. Automatic recommendation: ${courseResult.automaticHydroStressMpa ?? "unavailable"} MPa.`} onValueChange={(value) => updateCourseFieldValue(index, "hydroStress", value)} onUnitChange={(unit) => updateCourseFieldUnit(index, "hydroStress", unit)} onModeChange={(mode) => switchStressMode(index, "hydro", mode, courseResult.automaticHydroStressMpa)} />
              <UnitInput label={`As-built thickness · C${index + 1}`} field={course.fields.asBuiltThickness} options={lengthUnits} help="Original/as-built shell course thickness for long-term corrosion rate." onValueChange={(value) => updateCourseFieldValue(index, "asBuiltThickness", value)} onUnitChange={(unit) => updateCourseFieldUnit(index, "asBuiltThickness", unit)} />
              <UnitInput label={`Previous thickness · C${index + 1}`} field={course.fields.previousThickness} options={lengthUnits} help="Measured thickness at the previous inspection." onValueChange={(value) => updateCourseFieldValue(index, "previousThickness", value)} onUnitChange={(unit) => updateCourseFieldUnit(index, "previousThickness", unit)} />
              <UnitInput label={`Current thickness · C${index + 1}`} field={course.fields.actualThickness} options={lengthUnits} help="Current measured shell course thickness used for Ht, operating H, CA, and RL." onValueChange={(value) => updateCourseFieldValue(index, "actualThickness", value)} onUnitChange={(unit) => updateCourseFieldUnit(index, "actualThickness", unit)} />
            </div>
            <div className="shell-course-results"><span><small>H to Top</small><strong>{formatHeight(courseResult.heightToTopM)} {heightUnit}</strong></span><span className={courseResult.minimumThicknessFloorApplied ? "is-warning" : ""}><small>Minimum thickness</small><strong>{formatThickness(courseResult.minimumThicknessMm)} {thicknessUnit}</strong>{courseResult.minimumThicknessFloorApplied && <em>2.50 mm floor</em>}</span><span className={courseResult.hydrostaticHeightAdequate ? "is-good" : "is-alert"}><small>Hydrostatic Ht</small><strong>{formatHeight(courseResult.hydrostaticTestHeightM)} {heightUnit}</strong><em>{courseResult.hydrostaticHeightAdequate ? "At/above top" : "Below top"}</em></span><span className={courseResult.operatingFillHeightAdequate ? "is-good" : "is-alert"}><small>Operating fill H</small><strong>{formatHeight(courseResult.operatingFillHeightM)} {heightUnit}</strong><em>{courseResult.operatingFillHeightAdequate ? "At/above top" : "Below top"}</em></span><span><small>Corrosion allowance</small><strong>{formatThickness(courseResult.corrosionAllowanceMm)} {thicknessUnit}</strong></span><span><small>Long-term rate</small><strong>{formatRate(courseResult.longTermCorrosionRateMmPerYear)} {rateUnit}</strong></span><span><small>Short-term rate</small><strong>{formatRate(courseResult.shortTermCorrosionRateMmPerYear)} {rateUnit}</strong></span><span><small>Governing rate</small><strong>{formatRate(courseResult.governingCorrosionRateMmPerYear)} {rateUnit}</strong></span></div>
            <div className="shell-course-trace"><p><b>S:</b> {course.productStressMode === "auto" ? `${courseResult.materialLabel} ${courseResult.productStressRule?.formulaLabel ?? "automatic route"}` : "highlighted manual override"} → {formatStress(courseResult.productStressMpaUsed)} {pressureUnit}</p><p><b>St:</b> {course.hydroStressMode === "auto" ? `${courseResult.materialLabel} ${courseResult.hydroStressRule?.formulaLabel ?? "automatic route"}` : "highlighted manual override"} → {formatStress(courseResult.hydroStressMpaUsed)} {pressureUnit}</p><p><b>Tmin:</b> [4.9 × max(H − 0.3, 0) × D × G] ÷ (S × E). <b>RL:</b> (t actual − Tmin) ÷ max(CR long, CR short).</p></div>
          </article>;
        })}</div>
      </section>

      <section className="reference-card"><div className="reference-heading"><div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using Shell course results</h3></div></div><span>No standards PDF</span></div><p>Confirm the bottom-to-top course sequence, course elevations, tank geometry, product density, joint efficiency, material records, thickness history, and measurement locations against controlled project information. The material dropdown supplies the protected calculation values internally; it does not reproduce or display a standards table.</p><div className="reference-points"><span><b>01</b>Lower two courses and upper courses use different S and St routes.</span><span><b>02</b>Review any highlighted manual stress before approval.</span><span><b>03</b>Use the current controlled code edition for engineering issue.</span></div></section>
    </div>

    <aside className="result-column"><section className="result-card shell-summary-card"><div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div><div className="result-primary-grid"><div className="result-primary"><p>Governing remaining life</p><div className="result-primary-value"><strong>{lifeDisplay(result.minimumRemainingLifeYears)}</strong><span>yr</span></div></div><div className="result-primary"><p>Maximum corrosion rate</p><div className="result-primary-value"><strong>{formatRate(result.maximumCorrosionRateMmPerYear)}</strong><span>{rateUnit}</span></div></div></div><div className="result-comparison"><span>Governing course<strong>{result.governingRemainingLifeCourseIndex ? `Course ${result.governingRemainingLifeCourseIndex}` : "—"}</strong></span><span>Active courses<strong>{result.courses.length}</strong></span></div><div className="result-comparison"><span>Rate course<strong>{result.governingCorrosionRateCourseIndex ? `Course ${result.governingCorrosionRateCourseIndex}` : "—"}</strong></span><span>Limiting operating fill<strong>{formatHeight(result.limitingOperatingFillHeightM)} {heightUnit}</strong></span></div><div className={`result-status ${result.ok ? manualOverrideActive ? "is-manual" : "is-valid" : ""}`}>{result.ok && !manualOverrideActive ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}<div><strong>{error ? "Resolve input issues" : manualOverrideActive ? "Calculation includes manual inputs" : warning ? "Calculation completed with review note" : "Calculation completed"}</strong><span>{error?.message ?? warning?.message ?? (manualOverrideActive ? "Verify highlighted overrides before engineering approval." : "Review the governing course, remaining life, and fill-height results before use.")}</span></div></div></section>
      <section className="trace-card"><p className="eyebrow">Supporting results</p><h3>Calculation details</h3><div><span>Active courses</span><strong>{result.courses.length}</strong></div><div><span>Years in service</span><strong>{result.yearsInServiceUsed}</strong></div><div><span>Years since previous</span><strong>{result.yearsSincePreviousInspectionUsed}</strong></div><div><span>Tank basis</span><strong>{formatHeight(result.diameterMUsed)} × {formatHeight(result.totalHeightMUsed)} {heightUnit}</strong></div><div><span>Specific gravity / E</span><strong>{result.specificGravityUsed} / {result.jointEfficiencyUsed}</strong></div><div><span>Manual overrides</span><strong>{manualOverrideActive ? "Active" : "None"}</strong></div><div><span>Limiting fill course</span><strong>{result.limitingOperatingFillCourseIndex ? `Course ${result.limitingOperatingFillCourseIndex}` : "—"}</strong></div></section>
    </aside></div>
  </div>;
}
