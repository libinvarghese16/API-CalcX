import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi653BottomPlate, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const goldenInput = {
  originalThicknessMm: 8,
  previousThicknessMm: 7.4,
  actualThicknessMm: 7,
  minimumThicknessMm: 2.54,
  pittingDepthMm: 1.2,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
};

test("matches the protected API 653 Bottom Plate golden result", () => {
  const result = calculateApi653BottomPlate(goldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api653.bottom-plate");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.bottomSideMetalLossMm, 1);
  approximately(result.topSideThicknessRemainingMm, 6.8);
  approximately(result.bottomSideCorrosionRateLongMmPerYear, 0.05);
  approximately(result.bottomSideCorrosionRateShortMmPerYear, 0.08);
  approximately(result.topSideCorrosionRateLongMmPerYear, 0.06);
  approximately(result.topSideCorrosionRateShortMmPerYear, 0.24);
  approximately(result.maximumCorrosionRateLongMmPerYear, 0.06);
  approximately(result.maximumCorrosionRateShortMmPerYear, 0.24);
  approximately(result.governingThicknessMm, 6.8);
  approximately(result.availableThicknessMm, 4.26);
  approximately(result.remainingLifeYears, 17.75);
});

test("reproduces the same result from equivalent inch thickness inputs", () => {
  const inchInput = Object.fromEntries(Object.entries(goldenInput).map(([key, value]) => [
    key,
    key.startsWith("years") ? value : convertUnitToSI(value / 25.4, "length", "in"),
  ])) as typeof goldenInput;
  const result = calculateApi653BottomPlate(inchInput);

  approximately(result.remainingLifeYears, 17.75, 1e-10);
  approximately(result.governingCorrosionRateMmPerYear, 0.24, 1e-10);
});

test("uses the larger long-term bottom-side rate when it governs", () => {
  const result = calculateApi653BottomPlate({ ...goldenInput, pittingDepthMm: 0.2, yearsSincePreviousInspection: 10 });

  approximately(result.maximumCorrosionRateLongMmPerYear, 0.05);
  approximately(result.maximumCorrosionRateShortMmPerYear, 0.04);
  approximately(result.governingCorrosionRateMmPerYear, 0.05);
});

test("preserves protected zero-corrosion behavior", () => {
  const result = calculateApi653BottomPlate({ ...goldenInput, previousThicknessMm: 8, actualThicknessMm: 8, pittingDepthMm: 0 });

  assert.equal(result.governingCorrosionRateMmPerYear, 0);
  assert.equal(result.remainingLifeYears, 0);
});

test("allows either corrosion-rate time basis while keeping the other route at zero", () => {
  const longOnly = calculateApi653BottomPlate({ ...goldenInput, yearsSincePreviousInspection: 0 });
  const shortOnly = calculateApi653BottomPlate({ ...goldenInput, yearsInService: 0 });

  assert.equal(longOnly.ok, true);
  assert.equal(longOnly.maximumCorrosionRateShortMmPerYear, 0);
  assert.equal(shortOnly.ok, true);
  assert.equal(shortOnly.maximumCorrosionRateLongMmPerYear, 0);
});

test("blocks missing or invalid protected dependencies without negative outputs", () => {
  for (const input of [
    { ...goldenInput, originalThicknessMm: 0 },
    { ...goldenInput, actualThicknessMm: -1 },
    { ...goldenInput, pittingDepthMm: Number.NaN },
    { ...goldenInput, yearsInService: 0, yearsSincePreviousInspection: 0 },
  ]) {
    const result = calculateApi653BottomPlate(input);
    assert.equal(result.ok, false);
    assert.ok(result.remainingLifeYears >= 0);
    assert.ok(result.governingCorrosionRateMmPerYear >= 0);
  }
});
