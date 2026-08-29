import type { UnitSystem } from "@api-calc-pro/calc-engine";
import { formatDisplayNumber } from "../display-precision.ts";

export type UnitConverterKind =
  | "pressure"
  | "temperature"
  | "temperatureDifference"
  | "length"
  | "velocity"
  | "corrosionRate"
  | "area"
  | "volume"
  | "mass"
  | "force"
  | "moment"
  | "energy"
  | "power"
  | "flow"
  | "density"
  | "stressIntensity"
  | "time"
  | "angle"
  | "dimensionless";

export type UnitConverterUnit = string;

export interface UnitConverterUnitOption {
  value: UnitConverterUnit;
  label: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface UnitConverterCategory {
  id: UnitConverterKind;
  label: string;
  baseLabel: string;
  defaults: readonly [UnitConverterUnit, UnitConverterUnit];
  units: readonly UnitConverterUnitOption[];
}

function factorUnit(value: string, label: string, factor: number): UnitConverterUnitOption {
  return {
    value,
    label,
    toBase: (input) => input * factor,
    fromBase: (input) => input / factor,
  };
}

export const UNIT_CONVERTER_CATEGORIES: readonly UnitConverterCategory[] = [
  {
    id: "pressure",
    label: "Pressure / Stress",
    baseLabel: "Pa",
    defaults: ["psi", "bar"],
    units: [
      factorUnit("Pa", "Pa", 1),
      factorUnit("kPa", "kPa", 1_000),
      factorUnit("MPa", "MPa", 1_000_000),
      factorUnit("GPa", "GPa", 1_000_000_000),
      factorUnit("bar", "bar", 100_000),
      factorUnit("mbar", "mbar", 100),
      factorUnit("psi", "psi", 6_894.757293168),
      factorUnit("ksi", "ksi", 6_894_757.293168),
      factorUnit("kgf/cm2", "kgf/cm2", 98_066.5),
      factorUnit("atm", "atm", 101_325),
      factorUnit("mmHg", "mmHg", 133.322387415),
      factorUnit("inHg", "inHg", 3_386.38815789),
      factorUnit("mmH2O", "mmH2O", 9.80665),
      factorUnit("inH2O", "inH2O", 249.08891),
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    baseLabel: "deg C",
    defaults: ["C", "F"],
    units: [
      { value: "C", label: "deg C", toBase: (value) => value, fromBase: (value) => value },
      { value: "F", label: "deg F", toBase: (value) => (value - 32) / 1.8, fromBase: (value) => (value * 1.8) + 32 },
      { value: "K", label: "K", toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
      { value: "R", label: "deg R", toBase: (value) => (value - 491.67) / 1.8, fromBase: (value) => (value + 273.15) * 1.8 },
    ],
  },
  {
    id: "temperatureDifference",
    label: "Temperature Difference",
    baseLabel: "deg C delta",
    defaults: ["deltaC", "deltaF"],
    units: [
      factorUnit("deltaC", "deg C delta", 1),
      factorUnit("deltaK", "K delta", 1),
      factorUnit("deltaF", "deg F delta", 5 / 9),
      factorUnit("deltaR", "deg R delta", 5 / 9),
    ],
  },
  {
    id: "length",
    label: "Length / Thickness",
    baseLabel: "m",
    defaults: ["in", "mm"],
    units: [
      factorUnit("micron", "micron", 0.000001),
      factorUnit("mm", "mm", 0.001),
      factorUnit("cm", "cm", 0.01),
      factorUnit("m", "m", 1),
      factorUnit("km", "km", 1_000),
      factorUnit("mil", "mil", 0.0000254),
      factorUnit("in", "in", 0.0254),
      factorUnit("ft", "ft", 0.3048),
      factorUnit("yd", "yd", 0.9144),
    ],
  },
  {
    id: "velocity",
    label: "Velocity / Rate",
    baseLabel: "m/s",
    defaults: ["ft/min", "m/s"],
    units: [
      factorUnit("mm/s", "mm/s", 0.001),
      factorUnit("mm/min", "mm/min", 0.001 / 60),
      factorUnit("m/s", "m/s", 1),
      factorUnit("m/min", "m/min", 1 / 60),
      factorUnit("km/hr", "km/hr", 1_000 / 3_600),
      factorUnit("in/s", "in/s", 0.0254),
      factorUnit("in/min", "in/min", 0.0254 / 60),
      factorUnit("ft/s", "ft/s", 0.3048),
      factorUnit("ft/min", "ft/min", 0.3048 / 60),
    ],
  },
  {
    id: "corrosionRate",
    label: "Corrosion Rate",
    baseLabel: "mm/yr",
    defaults: ["mpy", "mm/yr"],
    units: [
      factorUnit("mm/yr", "mm/yr", 1),
      factorUnit("cm/yr", "cm/yr", 10),
      factorUnit("m/yr", "m/yr", 1_000),
      factorUnit("mil/yr", "mil/yr", 0.0254),
      factorUnit("mpy", "mpy", 0.0254),
      factorUnit("in/yr", "in/yr", 25.4),
      factorUnit("ft/yr", "ft/yr", 304.8),
    ],
  },
  {
    id: "area",
    label: "Area",
    baseLabel: "m2",
    defaults: ["in2", "mm2"],
    units: [
      factorUnit("mm2", "mm2", 0.000001),
      factorUnit("cm2", "cm2", 0.0001),
      factorUnit("m2", "m2", 1),
      factorUnit("in2", "in2", 0.00064516),
      factorUnit("ft2", "ft2", 0.09290304),
    ],
  },
  {
    id: "volume",
    label: "Volume",
    baseLabel: "m3",
    defaults: ["gal US", "L"],
    units: [
      factorUnit("mL", "mL", 0.000001),
      factorUnit("L", "L", 0.001),
      factorUnit("m3", "m3", 1),
      factorUnit("in3", "in3", 0.000016387064),
      factorUnit("ft3", "ft3", 0.028316846592),
      factorUnit("gal US", "gal US", 0.003785411784),
      factorUnit("bbl", "bbl", 0.158987294928),
    ],
  },
  {
    id: "mass",
    label: "Mass",
    baseLabel: "kg",
    defaults: ["lb", "kg"],
    units: [
      factorUnit("g", "g", 0.001),
      factorUnit("kg", "kg", 1),
      factorUnit("tonne", "tonne", 1_000),
      factorUnit("oz", "oz", 0.028349523125),
      factorUnit("lb", "lb", 0.45359237),
    ],
  },
  {
    id: "force",
    label: "Force / Load",
    baseLabel: "N",
    defaults: ["lbf", "kN"],
    units: [
      factorUnit("N", "N", 1),
      factorUnit("kN", "kN", 1_000),
      factorUnit("kgf", "kgf", 9.80665),
      factorUnit("lbf", "lbf", 4.4482216152605),
      factorUnit("kip", "kip", 4_448.2216152605),
    ],
  },
  {
    id: "moment",
    label: "Moment / Torque",
    baseLabel: "N*m",
    defaults: ["lbf*ft", "N*m"],
    units: [
      factorUnit("N*mm", "N*mm", 0.001),
      factorUnit("N*m", "N*m", 1),
      factorUnit("kN*m", "kN*m", 1_000),
      factorUnit("lbf*in", "lbf*in", 0.11298482902762),
      factorUnit("lbf*ft", "lbf*ft", 1.3558179483314),
      factorUnit("kip*in", "kip*in", 112.98482902762),
      factorUnit("kip*ft", "kip*ft", 1_355.8179483314),
    ],
  },
  {
    id: "energy",
    label: "Energy / Impact",
    baseLabel: "J",
    defaults: ["ft*lbf", "J"],
    units: [
      factorUnit("J", "J", 1),
      factorUnit("kJ", "kJ", 1_000),
      factorUnit("MJ", "MJ", 1_000_000),
      factorUnit("cal", "cal", 4.184),
      factorUnit("kcal", "kcal", 4_184),
      factorUnit("ft*lbf", "ft*lbf", 1.3558179483314),
      factorUnit("Btu", "Btu", 1_055.05585262),
    ],
  },
  {
    id: "power",
    label: "Power / Heat Rate",
    baseLabel: "W",
    defaults: ["Btu/hr", "kW"],
    units: [
      factorUnit("W", "W", 1),
      factorUnit("kW", "kW", 1_000),
      factorUnit("MW", "MW", 1_000_000),
      factorUnit("hp", "hp", 745.69987158227),
      factorUnit("Btu/hr", "Btu/hr", 0.29307107017222),
      factorUnit("kcal/hr", "kcal/hr", 1.1622222222222),
    ],
  },
  {
    id: "flow",
    label: "Volumetric Flow",
    baseLabel: "m3/s",
    defaults: ["gal/min", "m3/hr"],
    units: [
      factorUnit("m3/s", "m3/s", 1),
      factorUnit("m3/hr", "m3/hr", 1 / 3_600),
      factorUnit("L/s", "L/s", 0.001),
      factorUnit("L/min", "L/min", 0.001 / 60),
      factorUnit("gal/min", "gal/min", 0.003785411784 / 60),
      factorUnit("ft3/min", "ft3/min", 0.028316846592 / 60),
      factorUnit("bbl/day", "bbl/day", 0.158987294928 / 86_400),
    ],
  },
  {
    id: "density",
    label: "Density / Specific Gravity",
    baseLabel: "kg/m3",
    defaults: ["lb/ft3", "kg/m3"],
    units: [
      factorUnit("kg/m3", "kg/m3", 1),
      factorUnit("g/cm3", "g/cm3", 1_000),
      factorUnit("SG", "SG", 1_000),
      factorUnit("lb/ft3", "lb/ft3", 16.01846337),
      factorUnit("lb/in3", "lb/in3", 27_679.9047102),
    ],
  },
  {
    id: "stressIntensity",
    label: "Stress Intensity / Toughness",
    baseLabel: "MPa*sqrt(m)",
    defaults: ["ksi*sqrt(in)", "MPa*sqrt(m)"],
    units: [
      factorUnit("Pa*sqrt(m)", "Pa*sqrt(m)", 0.000001),
      factorUnit("kPa*sqrt(m)", "kPa*sqrt(m)", 0.001),
      factorUnit("MPa*sqrt(m)", "MPa*sqrt(m)", 1),
      factorUnit("psi*sqrt(in)", "psi*sqrt(in)", 0.0010988435),
      factorUnit("ksi*sqrt(in)", "ksi*sqrt(in)", 1.0988435),
    ],
  },
  {
    id: "time",
    label: "Time",
    baseLabel: "s",
    defaults: ["yr", "day"],
    units: [
      factorUnit("s", "s", 1),
      factorUnit("min", "min", 60),
      factorUnit("hr", "hr", 3_600),
      factorUnit("day", "day", 86_400),
      factorUnit("week", "week", 604_800),
      factorUnit("month", "month (30 d)", 2_592_000),
      factorUnit("yr", "yr (365 d)", 31_536_000),
    ],
  },
  {
    id: "angle",
    label: "Angle",
    baseLabel: "rad",
    defaults: ["deg", "rad"],
    units: [
      factorUnit("rad", "rad", 1),
      factorUnit("deg", "deg", Math.PI / 180),
      factorUnit("rev", "rev", Math.PI * 2),
    ],
  },
  {
    id: "dimensionless",
    label: "Percent / Fraction",
    baseLabel: "fraction",
    defaults: ["percent", "fraction"],
    units: [
      factorUnit("fraction", "fraction", 1),
      factorUnit("percent", "%", 0.01),
      factorUnit("ppm", "ppm", 0.000001),
    ],
  },
] as const;

function converterCategory(kind: UnitConverterKind): UnitConverterCategory {
  const category = UNIT_CONVERTER_CATEGORIES.find((candidate) => candidate.id === kind);
  if (!category) throw new Error(`Unknown unit-converter quantity: ${kind}`);
  return category;
}

export function converterUnitOptions(kind: UnitConverterKind): readonly UnitConverterUnitOption[] {
  return converterCategory(kind).units;
}

export function converterDefaultUnits(kind: UnitConverterKind, _unitSystem: UnitSystem): readonly [UnitConverterUnit, UnitConverterUnit] {
  return converterCategory(kind).defaults;
}

export function formatConverterUnit(unit: UnitConverterUnit, kind: UnitConverterKind): string {
  return converterCategory(kind).units.find((option) => option.value === unit)?.label ?? unit;
}

export function convertEngineeringValue(
  value: number,
  kind: UnitConverterKind,
  fromUnit: UnitConverterUnit,
  toUnit: UnitConverterUnit,
): number {
  if (!Number.isFinite(value)) return Number.NaN;
  const category = converterCategory(kind);
  const from = category.units.find((option) => option.value === fromUnit);
  const to = category.units.find((option) => option.value === toUnit);
  if (!from || !to) return Number.NaN;
  return to.fromBase(from.toBase(value));
}

export function formatEngineeringConversion(value: number, kind: UnitConverterKind): string {
  return formatDisplayNumber(value, kind === "corrosionRate" ? "corrosion-rate" : "standard");
}
