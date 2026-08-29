import assert from "node:assert/strict";
import test from "node:test";

import {
  converterDefaultUnits,
  converterUnitOptions,
  convertEngineeringValue,
  formatEngineeringConversion,
  formatConverterUnit,
  UNIT_CONVERTER_CATEGORIES,
} from "../src/tools/unit-converter.ts";

test("matches the master application's complete quantity list and order", () => {
  assert.deepEqual(
    UNIT_CONVERTER_CATEGORIES.map(({ id, label }) => [id, label]),
    [
      ["pressure", "Pressure / Stress"],
      ["temperature", "Temperature"],
      ["temperatureDifference", "Temperature Difference"],
      ["length", "Length / Thickness"],
      ["velocity", "Velocity / Rate"],
      ["corrosionRate", "Corrosion Rate"],
      ["area", "Area"],
      ["volume", "Volume"],
      ["mass", "Mass"],
      ["force", "Force / Load"],
      ["moment", "Moment / Torque"],
      ["energy", "Energy / Impact"],
      ["power", "Power / Heat Rate"],
      ["flow", "Volumetric Flow"],
      ["density", "Density / Specific Gravity"],
      ["stressIntensity", "Stress Intensity / Toughness"],
      ["time", "Time"],
      ["angle", "Angle"],
      ["dimensionless", "Percent / Fraction"],
    ],
  );
});

test("matches the master pressure units, factors, and defaults", () => {
  assert.deepEqual(
    converterUnitOptions("pressure").map(({ value }) => value),
    ["Pa", "kPa", "MPa", "GPa", "bar", "mbar", "psi", "ksi", "kgf/cm2", "atm", "mmHg", "inHg", "mmH2O", "inH2O"],
  );
  const converted = convertEngineeringValue(10, "pressure", "bar", "psi");
  assert.ok(Math.abs(converted - 145.0377377) < 1e-7);
  assert.equal(formatEngineeringConversion(converted, "pressure"), "145.04");
  assert.deepEqual(converterDefaultUnits("pressure", "metric"), ["psi", "bar"]);
  assert.deepEqual(converterDefaultUnits("pressure", "us-customary"), ["psi", "bar"]);
});

test("handles absolute and differential temperature independently", () => {
  assert.equal(convertEngineeringValue(25, "temperature", "C", "F"), 77);
  assert.equal(convertEngineeringValue(18, "temperatureDifference", "deltaF", "deltaC"), 10);
});

test("formats corrosion rate with three decimals and keeps master labels", () => {
  const converted = convertEngineeringValue(1, "corrosionRate", "mpy", "mm/yr");
  assert.equal(converted, 0.0254);
  assert.equal(formatEngineeringConversion(converted, "corrosionRate"), "0.025");
  assert.equal(formatConverterUnit("mm/yr", "corrosionRate"), "mm/yr");
});

test("converts representative added engineering quantities", () => {
  assert.ok(Math.abs(convertEngineeringValue(1, "volume", "gal US", "L") - 3.785411784) < 1e-12);
  assert.ok(Math.abs(convertEngineeringValue(1, "moment", "lbf*ft", "N*m") - 1.3558179483314) < 1e-12);
  assert.equal(convertEngineeringValue(100, "dimensionless", "percent", "fraction"), 1);
  assert.ok(Math.abs(convertEngineeringValue(180, "angle", "deg", "rad") - Math.PI) < 1e-12);
});
