import assert from "node:assert/strict";
import test from "node:test";

import {
  converterDefaultUnits,
  convertEngineeringValue,
  formatEngineeringConversion,
  formatConverterUnit,
} from "../src/tools/unit-converter.ts";

test("converts a field pressure value between bar and psi", () => {
  const converted = convertEngineeringValue(10, "pressure", "Bar", "psi");
  assert.ok(Math.abs(converted - 145.0377377) < 1e-7);
  assert.equal(formatEngineeringConversion(converted, "pressure"), "145.04");
});

test("converts temperature with the existing engineering unit library", () => {
  assert.equal(convertEngineeringValue(25, "temperature", "C", "F"), 77);
  assert.equal(formatEngineeringConversion(77, "temperature"), "77.00");
});

test("formats corrosion-rate conversions with three decimals and per-year labels", () => {
  const converted = convertEngineeringValue(1, "corrosion-rate", "mm", "in");
  assert.equal(formatEngineeringConversion(converted, "corrosion-rate"), "0.039");
  assert.equal(formatConverterUnit("in", "corrosion-rate"), "in/yr");
});

test("uses the saved unit preference for converter defaults", () => {
  assert.deepEqual(converterDefaultUnits("pressure", "metric"), ["Bar", "MPa"]);
  assert.deepEqual(converterDefaultUnits("pressure", "us-customary"), ["psi", "Bar"]);
});
