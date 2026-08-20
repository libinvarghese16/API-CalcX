export type UnitSystem = "metric" | "us-customary";
export type EngineeringQuantity = "length" | "area" | "pressure" | "force" | "resistance" | "temperature";
export type LengthUnit = "mm" | "cm" | "m" | "in" | "ft";
export type AreaUnit = "mm2" | "cm2" | "m2" | "in2" | "ft2";
export type PressureUnit = "kPa" | "MPa" | "Bar" | "psi";
export type ForceUnit = "kN" | "N" | "lbf" | "kgf";
export type ResistanceUnit = "ohm" | "kohm" | "Mohm";
export type TemperatureUnit = "C" | "F";
export type EngineeringUnit = LengthUnit | AreaUnit | PressureUnit | ForceUnit | ResistanceUnit | TemperatureUnit;

export interface EngineeringUnitOption {
  value: EngineeringUnit;
  label: string;
}

interface UnitDefinition {
  quantity: EngineeringQuantity;
  label: string;
  toSI: (value: number) => number;
  fromSI: (value: number) => number;
}

const PSI_PER_MPA = 145.0377377;

const UNIT_DEFINITIONS: Record<EngineeringUnit, UnitDefinition> = {
  mm: { quantity: "length", label: "mm", toSI: (value) => value, fromSI: (value) => value },
  cm: { quantity: "length", label: "cm", toSI: (value) => value * 10, fromSI: (value) => value / 10 },
  m: { quantity: "length", label: "m", toSI: (value) => value * 1000, fromSI: (value) => value / 1000 },
  in: { quantity: "length", label: "in", toSI: (value) => value * 25.4, fromSI: (value) => value / 25.4 },
  ft: { quantity: "length", label: "ft", toSI: (value) => value * 304.8, fromSI: (value) => value / 304.8 },
  mm2: { quantity: "area", label: "mm²", toSI: (value) => value, fromSI: (value) => value },
  cm2: { quantity: "area", label: "cm²", toSI: (value) => value * 100, fromSI: (value) => value / 100 },
  m2: { quantity: "area", label: "m²", toSI: (value) => value * 1_000_000, fromSI: (value) => value / 1_000_000 },
  in2: { quantity: "area", label: "in²", toSI: (value) => value * 645.16, fromSI: (value) => value / 645.16 },
  ft2: { quantity: "area", label: "ft²", toSI: (value) => value * 92_903.04, fromSI: (value) => value / 92_903.04 },
  kPa: { quantity: "pressure", label: "kPa", toSI: (value) => value / 1000, fromSI: (value) => value * 1000 },
  MPa: { quantity: "pressure", label: "MPa", toSI: (value) => value, fromSI: (value) => value },
  Bar: { quantity: "pressure", label: "bar", toSI: (value) => value * 0.1, fromSI: (value) => value * 10 },
  psi: { quantity: "pressure", label: "psi", toSI: (value) => value / PSI_PER_MPA, fromSI: (value) => value * PSI_PER_MPA },
  kN: { quantity: "force", label: "kN", toSI: (value) => value, fromSI: (value) => value },
  N: { quantity: "force", label: "N", toSI: (value) => value / 1000, fromSI: (value) => value * 1000 },
  lbf: { quantity: "force", label: "lbf", toSI: (value) => value * 0.0044482216, fromSI: (value) => value / 0.0044482216 },
  kgf: { quantity: "force", label: "kgf", toSI: (value) => value * 0.00980665, fromSI: (value) => value / 0.00980665 },
  ohm: { quantity: "resistance", label: "Ω", toSI: (value) => value, fromSI: (value) => value },
  kohm: { quantity: "resistance", label: "kΩ", toSI: (value) => value * 1000, fromSI: (value) => value / 1000 },
  Mohm: { quantity: "resistance", label: "MΩ", toSI: (value) => value * 1_000_000, fromSI: (value) => value / 1_000_000 },
  C: { quantity: "temperature", label: "°C", toSI: (value) => value, fromSI: (value) => value },
  F: { quantity: "temperature", label: "°F", toSI: (value) => (value - 32) / 1.8, fromSI: (value) => (value * 1.8) + 32 },
};

const UNIT_OPTIONS: Record<EngineeringQuantity, readonly EngineeringUnitOption[]> = {
  length: ["mm", "cm", "m", "in", "ft"].map((value) => ({ value: value as LengthUnit, label: UNIT_DEFINITIONS[value as LengthUnit].label })),
  area: ["mm2", "cm2", "m2", "in2", "ft2"].map((value) => ({ value: value as AreaUnit, label: UNIT_DEFINITIONS[value as AreaUnit].label })),
  pressure: ["kPa", "MPa", "Bar", "psi"].map((value) => ({ value: value as PressureUnit, label: UNIT_DEFINITIONS[value as PressureUnit].label })),
  force: ["kN", "N", "lbf", "kgf"].map((value) => ({ value: value as ForceUnit, label: UNIT_DEFINITIONS[value as ForceUnit].label })),
  resistance: ["ohm", "kohm", "Mohm"].map((value) => ({ value: value as ResistanceUnit, label: UNIT_DEFINITIONS[value as ResistanceUnit].label })),
  temperature: ["C", "F"].map((value) => ({ value: value as TemperatureUnit, label: UNIT_DEFINITIONS[value as TemperatureUnit].label })),
};

export function isEngineeringUnitForQuantity(value: unknown, quantity: EngineeringQuantity): value is EngineeringUnit {
  return typeof value === "string"
    && value in UNIT_DEFINITIONS
    && UNIT_DEFINITIONS[value as EngineeringUnit].quantity === quantity;
}

export function listEngineeringUnitOptions(quantity: EngineeringQuantity): readonly EngineeringUnitOption[] {
  return UNIT_OPTIONS[quantity];
}

export function defaultUnitForSystem(quantity: EngineeringQuantity, unitSystem: UnitSystem): EngineeringUnit {
  if (quantity === "length") return unitSystem === "metric" ? "mm" : "in";
  if (quantity === "area") return unitSystem === "metric" ? "mm2" : "in2";
  if (quantity === "pressure") return unitSystem === "metric" ? "MPa" : "psi";
  if (quantity === "force") return unitSystem === "metric" ? "kN" : "lbf";
  if (quantity === "resistance") return "ohm";
  return unitSystem === "metric" ? "C" : "F";
}

export function convertUnitToSI(value: number, quantity: EngineeringQuantity, unit: EngineeringUnit): number {
  if (!Number.isFinite(value)) return value;
  if (!isEngineeringUnitForQuantity(unit, quantity)) return Number.NaN;
  return UNIT_DEFINITIONS[unit].toSI(value);
}

export function convertSIToUnit(value: number, quantity: EngineeringQuantity, unit: EngineeringUnit): number {
  if (!Number.isFinite(value)) return value;
  if (!isEngineeringUnitForQuantity(unit, quantity)) return Number.NaN;
  return UNIT_DEFINITIONS[unit].fromSI(value);
}

export function convertBetweenUnits(value: number, quantity: EngineeringQuantity, fromUnit: EngineeringUnit, toUnit: EngineeringUnit): number {
  return convertSIToUnit(convertUnitToSI(value, quantity, fromUnit), quantity, toUnit);
}

export function unitSymbol(unit: EngineeringUnit): string {
  return UNIT_DEFINITIONS[unit].label;
}

export function convertToSI(value: number, quantity: EngineeringQuantity, unitSystem: UnitSystem): number {
  return convertUnitToSI(value, quantity, defaultUnitForSystem(quantity, unitSystem));
}

export function convertFromSI(value: number, quantity: EngineeringQuantity, unitSystem: UnitSystem): number {
  return convertSIToUnit(value, quantity, defaultUnitForSystem(quantity, unitSystem));
}

export function unitLabel(quantity: EngineeringQuantity, unitSystem: UnitSystem): string {
  return unitSymbol(defaultUnitForSystem(quantity, unitSystem));
}
