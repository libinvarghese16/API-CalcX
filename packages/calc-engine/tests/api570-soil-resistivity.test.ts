import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570SoilResistivity, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-10): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected Soil Resistivity golden result", () => {
  const result = calculateApi570SoilResistivity({ pinSpacingFt: 5, resistanceOhm: 20 });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.soil-resistivity");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.pinSpacingFtUsed, 5);
  assert.equal(result.resistanceOhmUsed, 20);
  assert.equal(result.soilResistivityOhmCm, 19150);
});

test("reproduces the golden result from equivalent metre and inch spacing", () => {
  const metre = calculateApi570SoilResistivity({
    pinSpacingFt: convertUnitToSI(1.524, "length", "m") / 304.8,
    resistanceOhm: 20,
  });
  const inch = calculateApi570SoilResistivity({
    pinSpacingFt: convertUnitToSI(60, "length", "in") / 304.8,
    resistanceOhm: 20,
  });

  approximately(metre.soilResistivityOhmCm, 19150);
  approximately(inch.soilResistivityOhmCm, 19150);
});

test("reproduces the golden result from kΩ and MΩ resistance inputs", () => {
  const kilo = calculateApi570SoilResistivity({ pinSpacingFt: 5, resistanceOhm: convertUnitToSI(0.02, "resistance", "kohm") });
  const mega = calculateApi570SoilResistivity({ pinSpacingFt: 5, resistanceOhm: convertUnitToSI(0.00002, "resistance", "Mohm") });

  assert.equal(kilo.soilResistivityOhmCm, 19150);
  assert.equal(mega.soilResistivityOhmCm, 19150);
});

test("matches the protected two-decimal rounding case before formatting", () => {
  const result = calculateApi570SoilResistivity({ pinSpacingFt: 1.2345, resistanceOhm: 7.89 });
  approximately(result.soilResistivityOhmCm, 1865.2492575);
  assert.equal(result.soilResistivityOhmCm.toFixed(2), "1865.25");
});

test("preserves zero output while flagging each non-positive dependency", () => {
  const zeroSpacing = calculateApi570SoilResistivity({ pinSpacingFt: 0, resistanceOhm: 20 });
  const zeroResistance = calculateApi570SoilResistivity({ pinSpacingFt: 5, resistanceOhm: 0 });

  assert.equal(zeroSpacing.ok, false);
  assert.equal(zeroSpacing.soilResistivityOhmCm, 0);
  assert.ok(zeroSpacing.issues.some((issue) => issue.field === "pinSpacingFt"));
  assert.equal(zeroResistance.ok, false);
  assert.equal(zeroResistance.soilResistivityOhmCm, 0);
  assert.ok(zeroResistance.issues.some((issue) => issue.field === "resistanceOhm"));
});

test("blocks negative and non-finite dependencies without negative output", () => {
  for (const input of [
    { pinSpacingFt: -5, resistanceOhm: 20 },
    { pinSpacingFt: 5, resistanceOhm: -20 },
    { pinSpacingFt: Number.NaN, resistanceOhm: 20 },
    { pinSpacingFt: 5, resistanceOhm: Number.POSITIVE_INFINITY },
  ]) {
    const result = calculateApi570SoilResistivity(input);
    assert.equal(result.ok, false);
    assert.equal(result.soilResistivityOhmCm, 0);
  }
});
