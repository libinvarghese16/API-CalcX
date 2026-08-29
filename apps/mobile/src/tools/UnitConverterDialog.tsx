import { useMemo, useState } from "react";
import type { UnitSystem } from "@api-calc-pro/calc-engine";
import { ArrowLeftRight, Calculator, X } from "lucide-react";
import {
  converterDefaultUnits,
  converterUnitOptions,
  convertEngineeringValue,
  formatEngineeringConversion,
  formatConverterUnit,
  UNIT_CONVERTER_CATEGORIES,
} from "./unit-converter.ts";
import type { UnitConverterKind, UnitConverterUnit } from "./unit-converter.ts";

export function UnitConverterDialog({ preferredUnitSystem, onClose }: { preferredUnitSystem: UnitSystem; onClose: () => void }) {
  const [kind, setKind] = useState<UnitConverterKind>("pressure");
  const initialUnits = converterDefaultUnits("pressure", preferredUnitSystem);
  const [fromUnit, setFromUnit] = useState<UnitConverterUnit>(initialUnits[0]);
  const [toUnit, setToUnit] = useState<UnitConverterUnit>(initialUnits[1]);
  const [value, setValue] = useState("10");
  const options = converterUnitOptions(kind);
  const numericValue = value.trim() ? Number(value) : Number.NaN;
  const convertedValue = useMemo(
    () => convertEngineeringValue(numericValue, kind, fromUnit, toUnit),
    [fromUnit, kind, numericValue, toUnit],
  );
  const result = Number.isFinite(convertedValue) ? formatEngineeringConversion(convertedValue, kind) : "—";

  const changeKind = (nextKind: UnitConverterKind) => {
    const defaults = converterDefaultUnits(nextKind, preferredUnitSystem);
    setKind(nextKind);
    setFromUnit(defaults[0]);
    setToUnit(defaults[1]);
    setValue(nextKind === "temperature" ? "25" : "10");
  };

  const swapUnits = () => {
    if (Number.isFinite(convertedValue)) setValue(String(Number(convertedValue.toFixed(6))));
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="modal-backdrop tool-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card unit-converter-modal" role="dialog" aria-modal="true" aria-labelledby="unit-converter-title">
        <div className="modal-heading">
          <div><p className="eyebrow">Engineering tool</p><h2 id="unit-converter-title">Unit converter</h2><p>Convert field values with the same engineering quantity groups and factors as the master application.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close unit converter"><X size={19} /></button>
        </div>

        <label className="modal-field full">
          <span>Quantity</span>
          <select aria-label="Converter quantity" value={kind} onChange={(event) => changeKind(event.target.value as UnitConverterKind)}>
            {UNIT_CONVERTER_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>

        <div className="converter-grid">
          <label className="converter-field">
            <span>From</span>
            <div><input aria-label="Value to convert" type="number" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} /><select aria-label="Source unit" value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{formatConverterUnit(option.value, kind)}</option>)}</select></div>
          </label>
          <button className="converter-swap" onClick={swapUnits} aria-label="Swap source and destination units"><ArrowLeftRight size={19} /></button>
          <label className="converter-field">
            <span>To</span>
            <div><output aria-label="Converted value">{result}</output><select aria-label="Destination unit" value={toUnit} onChange={(event) => setToUnit(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{formatConverterUnit(option.value, kind)}</option>)}</select></div>
          </label>
        </div>

        <div className="converter-result" aria-live="polite"><Calculator size={19} /><span><small>Converted value</small><strong>{result} {formatConverterUnit(toUnit, kind)}</strong></span></div>
        <div className="modal-actions"><button className="primary-button" onClick={onClose}>Done</button></div>
      </section>
    </div>
  );
}
