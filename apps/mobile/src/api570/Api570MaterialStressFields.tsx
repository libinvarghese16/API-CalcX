import {
  convertSIToUnit,
  listApi570PipingMaterialGrades,
  listApi570PipingMaterialSpecs,
} from "@api-calc-pro/calc-engine";
import type {
  AutomaticValueMode,
  EngineeringUnit,
  EngineeringUnitOption,
  MaterialStressResolution,
} from "@api-calc-pro/calc-engine";
import type { Api570UnitFieldSnapshot } from "../local-data/models.ts";

const materialSpecifications = listApi570PipingMaterialSpecs();

function formatInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : "";
}

export function Api570MaterialStressFields({
  materialSpec,
  gradeKey,
  temperatureField,
  stressField,
  stressMode,
  stressResolution,
  temperatureUnits,
  pressureUnits,
  temperatureLabel = "Design temperature",
  stressLabel = "Allowable stress",
  showMaterialSelectors = true,
  onMaterialChange,
  onGradeChange,
  onTemperatureValueChange,
  onTemperatureUnitChange,
  onStressValueChange,
  onStressUnitChange,
  onStressModeChange,
}: {
  materialSpec: string;
  gradeKey: string;
  temperatureField: Api570UnitFieldSnapshot;
  stressField: Api570UnitFieldSnapshot;
  stressMode: AutomaticValueMode;
  stressResolution: MaterialStressResolution;
  temperatureUnits: readonly EngineeringUnitOption[];
  pressureUnits: readonly EngineeringUnitOption[];
  temperatureLabel?: string;
  stressLabel?: string;
  showMaterialSelectors?: boolean;
  onMaterialChange: (materialSpec: string, firstGradeKey: string) => void;
  onGradeChange: (gradeKey: string) => void;
  onTemperatureValueChange: (value: string) => void;
  onTemperatureUnitChange: (unit: EngineeringUnit) => void;
  onStressValueChange: (value: string) => void;
  onStressUnitChange: (unit: EngineeringUnit) => void;
  onStressModeChange: (mode: AutomaticValueMode) => void;
}) {
  const grades = listApi570PipingMaterialGrades(materialSpec);
  const selectedGrade = grades.find(({ key }) => key === gradeKey);
  const automaticStressDisplay = stressResolution.allowableStressMpa === null
    ? ""
    : formatInput(convertSIToUnit(stressResolution.allowableStressMpa, "pressure", stressField.unit));
  const displayedStress = stressMode === "auto" ? automaticStressDisplay : stressField.value;

  return <>
    {showMaterialSelectors && <>
    <label className="field api570-material-field">
      <span>Material specification<button type="button" title="Select the specification used by the master-site ASME B31.3 allowable-stress catalog." aria-label="Material specification help">?</button></span>
      <select className="select-control native-select" aria-label="Material specification" value={materialSpec} onChange={(event) => {
        const nextSpec = event.target.value;
        onMaterialChange(nextSpec, listApi570PipingMaterialGrades(nextSpec)[0]?.key ?? "");
      }}>
        {materialSpecifications.map((specification) => <option value={specification} key={specification}>{specification}</option>)}
      </select>
      <small>Master-site piping material catalog · 33 specifications.</small>
    </label>

    <label className="field api570-material-field">
      <span>Material grade<button type="button" title="Grade and product-form row used for the temperature-dependent stress lookup." aria-label="Material grade help">?</button></span>
      <select className="select-control native-select" aria-label="Material grade" value={gradeKey} onChange={(event) => onGradeChange(event.target.value)}>
        {grades.map((grade) => <option value={grade.key} key={grade.key}>{grade.label}</option>)}
      </select>
      <small>{selectedGrade ? [selectedGrade.productForm, selectedGrade.materialFamily, selectedGrade.sourceLine].filter(Boolean).join(" · ") : "Select a valid grade row."}</small>
    </label>
    </>}

    <label className="field">
      <span>{temperatureLabel}<button type="button" title="Temperature is converted to °C before the master-table lookup." aria-label={`${temperatureLabel} help`}>?</button></span>
      <div className="number-control">
        <input aria-label={temperatureLabel} type="number" inputMode="decimal" value={temperatureField.value} onChange={(event) => onTemperatureValueChange(event.target.value)} />
        <select className="unit-picker" aria-label={`${temperatureLabel} unit`} value={temperatureField.unit} onChange={(event) => onTemperatureUnitChange(event.target.value as EngineeringUnit)}>
          {temperatureUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <small>Live °C/°F input; lookup uses the first table limit at or above this temperature.</small>
    </label>

    <label className="field automatic-field api570-stress-field">
      <span>{stressLabel}<button type="button" title="Automatic mode uses material, grade and temperature. Manual mode keeps the verified override highlighted." aria-label={`${stressLabel} help`}>?</button><button type="button" className={`field-mode-toggle ${stressMode}`} onClick={() => onStressModeChange(stressMode === "auto" ? "manual" : "auto")} aria-label={`Switch ${stressLabel} to ${stressMode === "auto" ? "manual" : "auto"} mode`}>{stressMode}</button></span>
      <div className={`number-control is-derived ${stressMode === "manual" ? "is-manual" : ""}`}>
        <input aria-label={stressLabel} type="number" inputMode="decimal" value={displayedStress} readOnly={stressMode === "auto"} onChange={(event) => onStressValueChange(event.target.value)} />
        <select className="unit-picker" aria-label={`${stressLabel} unit`} value={stressField.unit} onChange={(event) => onStressUnitChange(event.target.value as EngineeringUnit)}>
          {pressureUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <small>{stressMode === "auto" ? stressResolution.message : "Manual override is active and highlighted. Verify it against the governing controlled material table."}</small>
    </label>
  </>;
}
