import assert from "node:assert/strict";
import test from "node:test";

import {
  convertBetweenUnits,
  convertFromSI,
  convertSIToUnit,
  convertToSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  unitLabel,
  unitSymbol,
} from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-10): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);
}

test("converts pressure between MPa and psi", () => {
  approximately(convertFromSI(1.5, "pressure", "us-customary"), 217.55660655);
  approximately(convertToSI(217.55660655, "pressure", "us-customary"), 1.5);
});

test("converts length between millimetres and inches", () => {
  approximately(convertFromSI(2000, "length", "us-customary"), 78.74015748031496);
  approximately(convertToSI(78.74015748031496, "length", "us-customary"), 2000);
});

test("converts temperature between Celsius and Fahrenheit", () => {
  approximately(convertFromSI(150, "temperature", "us-customary"), 302);
  approximately(convertToSI(302, "temperature", "us-customary"), 150);
});

test("supplies explicit labels for both unit systems", () => {
  assert.equal(unitLabel("pressure", "metric"), "MPa");
  assert.equal(unitLabel("pressure", "us-customary"), "psi");
  assert.equal(unitLabel("length", "us-customary"), "in");
  assert.equal(unitLabel("temperature", "us-customary"), "°F");
});

test("matches the protected original practical pressure conversion factors", () => {
  approximately(convertUnitToSI(1500, "pressure", "kPa"), 1.5, 1e-12);
  approximately(convertUnitToSI(15, "pressure", "Bar"), 1.5, 1e-12);
  approximately(convertUnitToSI(217.55660655, "pressure", "psi"), 1.5, 1e-9);
  approximately(convertSIToUnit(1.5, "pressure", "Bar"), 15, 1e-12);
});

test("matches the protected original practical short-length conversions", () => {
  approximately(convertUnitToSI(200, "length", "cm"), 2000, 1e-12);
  approximately(convertUnitToSI(2, "length", "m"), 2000, 1e-12);
  approximately(convertUnitToSI(6.56167979, "length", "ft"), 2000, 1e-6);
  approximately(convertBetweenUnits(78.74015748, "length", "in", "mm"), 2000, 1e-7);
});

test("preserves the physical SI value during a live field-unit change", () => {
  const pressureInBar = convertBetweenUnits(1.5, "pressure", "MPa", "Bar");
  const pressureInPsi = convertBetweenUnits(pressureInBar, "pressure", "Bar", "psi");
  approximately(convertUnitToSI(pressureInPsi, "pressure", "psi"), 1.5, 1e-12);
  approximately(convertBetweenUnits(150, "temperature", "C", "F"), 302, 1e-12);
});

test("lists practical input units while retaining global-system defaults", () => {
  assert.deepEqual(listEngineeringUnitOptions("pressure").map((option) => option.value), ["kPa", "MPa", "Bar", "psi"]);
  assert.deepEqual(listEngineeringUnitOptions("length").map((option) => option.value), ["mm", "cm", "m", "in", "ft"]);
  assert.equal(defaultUnitForSystem("pressure", "metric"), "MPa");
  assert.equal(defaultUnitForSystem("pressure", "us-customary"), "psi");
  assert.equal(unitSymbol("Bar"), "bar");
});

test("converts tension-test area and force units", () => {
  approximately(convertUnitToSI(1, "area", "in2"), 645.16);
  approximately(convertUnitToSI(1, "force", "lbf"), 0.0044482216);
  approximately(convertBetweenUnits(80, "area", "mm2", "in2"), 80 / 645.16);
  approximately(convertBetweenUnits(40, "force", "kN", "lbf"), 40 / 0.0044482216);
  assert.equal(defaultUnitForSystem("area", "metric"), "mm2");
  assert.equal(defaultUnitForSystem("area", "us-customary"), "in2");
  assert.equal(defaultUnitForSystem("force", "metric"), "kN");
  assert.equal(defaultUnitForSystem("force", "us-customary"), "lbf");
});

test("converts Soil Resistivity resistance units", () => {
  assert.equal(convertUnitToSI(20, "resistance", "ohm"), 20);
  assert.equal(convertUnitToSI(0.02, "resistance", "kohm"), 20);
  assert.equal(convertUnitToSI(0.00002, "resistance", "Mohm"), 20);
  assert.equal(convertBetweenUnits(20, "resistance", "ohm", "kohm"), 0.02);
  assert.equal(defaultUnitForSystem("resistance", "metric"), "ohm");
  assert.equal(defaultUnitForSystem("resistance", "us-customary"), "ohm");
});
