import {
  convertBetweenUnits,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type {
  EngineeringQuantity,
  EngineeringUnit,
  EngineeringUnitOption,
  UnitSystem,
} from "@api-calc-pro/calc-engine";
import { formatDisplayNumber } from "../display-precision.ts";

export type UnitConverterKind = EngineeringQuantity | "corrosion-rate";

export interface UnitConverterCategory {
  id: UnitConverterKind;
  label: string;
  quantity: EngineeringQuantity;
}

export const UNIT_CONVERTER_CATEGORIES: readonly UnitConverterCategory[] = [
  { id: "pressure", label: "Pressure", quantity: "pressure" },
  { id: "temperature", label: "Temperature", quantity: "temperature" },
  { id: "length", label: "Length", quantity: "length" },
  { id: "corrosion-rate", label: "Corrosion rate", quantity: "length" },
  { id: "area", label: "Area", quantity: "area" },
  { id: "force", label: "Force", quantity: "force" },
  { id: "resistance", label: "Resistance", quantity: "resistance" },
] as const;

const converterDefaults: Record<UnitConverterKind, Record<UnitSystem, readonly [EngineeringUnit, EngineeringUnit]>> = {
  pressure: { metric: ["Bar", "MPa"], "us-customary": ["psi", "Bar"] },
  temperature: { metric: ["C", "F"], "us-customary": ["F", "C"] },
  length: { metric: ["mm", "in"], "us-customary": ["in", "mm"] },
  "corrosion-rate": { metric: ["mm", "in"], "us-customary": ["in", "mm"] },
  area: { metric: ["m2", "ft2"], "us-customary": ["ft2", "m2"] },
  force: { metric: ["kN", "lbf"], "us-customary": ["lbf", "kN"] },
  resistance: { metric: ["ohm", "kohm"], "us-customary": ["ohm", "kohm"] },
};

export function converterQuantity(kind: UnitConverterKind): EngineeringQuantity {
  return kind === "corrosion-rate" ? "length" : kind;
}

export function converterUnitOptions(kind: UnitConverterKind): readonly EngineeringUnitOption[] {
  return listEngineeringUnitOptions(converterQuantity(kind));
}

export function converterDefaultUnits(kind: UnitConverterKind, unitSystem: UnitSystem): readonly [EngineeringUnit, EngineeringUnit] {
  return converterDefaults[kind][unitSystem];
}

export function formatConverterUnit(unit: EngineeringUnit, kind: UnitConverterKind): string {
  const symbol = unitSymbol(unit);
  return kind === "corrosion-rate" ? `${symbol}/yr` : symbol;
}

export function convertEngineeringValue(
  value: number,
  kind: UnitConverterKind,
  fromUnit: EngineeringUnit,
  toUnit: EngineeringUnit,
): number {
  return convertBetweenUnits(value, converterQuantity(kind), fromUnit, toUnit);
}

export function formatEngineeringConversion(value: number, kind: UnitConverterKind): string {
  return formatDisplayNumber(value, kind === "corrosion-rate" ? "corrosion-rate" : "standard");
}
