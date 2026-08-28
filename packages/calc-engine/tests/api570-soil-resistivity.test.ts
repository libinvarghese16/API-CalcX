import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570SoilResistivity, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-10): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("uses the coherent-SI Wenner four-electrode equation", () => {
  const result = calculateApi570SoilResistivity({ pinSpacingM: 1.524, resistanceOhm: 20 });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.soil-resistivity");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.pinSpacingMUsed, 1.524);
  assert.equal(result.resistanceOhmUsed, 20);
  approximately(result.soilResistivityOhmM, 2 * Math.PI * 1.524 * 20);
  approximately(result.soilResistivityOhmCm, 2 * Math.PI * 1.524 * 20 * 100);
});

test("reproduces the golden result from equivalent metre and inch spacing", () => {
  const metre = calculateApi570SoilResistivity({
    pinSpacingM: convertUnitToSI(1.524, "length", "m") / 1000,
    resistanceOhm: 20,
  });
  const inch = calculateApi570SoilResistivity({
    pinSpacingM: convertUnitToSI(60, "length", "in") / 1000,
    resistanceOhm: 20,
  });

  approximately(metre.soilResistivityOhmCm, 2 * Math.PI * 1.524 * 20 * 100);
  approximately(inch.soilResistivityOhmCm, 2 * Math.PI * 1.524 * 20 * 100);
});

test("reproduces the golden result from kΩ and MΩ resistance inputs", () => {
  const kilo = calculateApi570SoilResistivity({ pinSpacingM: 1.524, resistanceOhm: convertUnitToSI(0.02, "resistance", "kohm") });
  const mega = calculateApi570SoilResistivity({ pinSpacingM: 1.524, resistanceOhm: convertUnitToSI(0.00002, "resistance", "Mohm") });

  approximately(kilo.soilResistivityOhmCm, 2 * Math.PI * 1.524 * 20 * 100);
  approximately(mega.soilResistivityOhmCm, 2 * Math.PI * 1.524 * 20 * 100);
});

test("keeps ohm-m and ohm-cm outputs exactly related", () => {
  const result = calculateApi570SoilResistivity({ pinSpacingM: 1.2345, resistanceOhm: 7.89 });
  approximately(result.soilResistivityOhmCm, result.soilResistivityOhmM * 100);
});

test("preserves zero output while flagging each non-positive dependency", () => {
  const zeroSpacing = calculateApi570SoilResistivity({ pinSpacingM: 0, resistanceOhm: 20 });
  const zeroResistance = calculateApi570SoilResistivity({ pinSpacingM: 1.524, resistanceOhm: 0 });

  assert.equal(zeroSpacing.ok, false);
  assert.equal(zeroSpacing.soilResistivityOhmCm, 0);
  assert.ok(zeroSpacing.issues.some((issue) => issue.field === "pinSpacingM"));
  assert.equal(zeroResistance.ok, false);
  assert.equal(zeroResistance.soilResistivityOhmCm, 0);
  assert.ok(zeroResistance.issues.some((issue) => issue.field === "resistanceOhm"));
});

test("blocks negative and non-finite dependencies without negative output", () => {
  for (const input of [
    { pinSpacingM: -1.524, resistanceOhm: 20 },
    { pinSpacingM: 1.524, resistanceOhm: -20 },
    { pinSpacingM: Number.NaN, resistanceOhm: 20 },
    { pinSpacingM: 1.524, resistanceOhm: Number.POSITIVE_INFINITY },
  ]) {
    const result = calculateApi570SoilResistivity(input);
    assert.equal(result.ok, false);
    assert.equal(result.soilResistivityOhmCm, 0);
  }
});
