import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi653RoofPlate, convertUnitToSI } from "../src/index.ts";
import type { Api653RoofPlateInputSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const goldenInput: Api653RoofPlateInputSI = {
  originalThicknessMm: 6,
  previousThicknessMm: 5.5,
  actualThicknessMm: 5,
  minimumThicknessMm: 2.29,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
};

test("matches the protected API 653 Roof Plate golden result", () => {
  const result = calculateApi653RoofPlate(goldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api653.roof-plate");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.longTermMetalLossMm, 1);
  approximately(result.thicknessLossSincePreviousMm, 0.5);
  approximately(result.corrosionAllowanceMm, 2.71);
  approximately(result.longTermCorrosionRateMmPerYear, 0.05);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.1);
  approximately(result.governingCorrosionRateMmPerYear, 0.1);
  approximately(result.remainingLifeYears, 27.1);
  assert.equal(result.remainingLifeOpenEnded, false);
  assert.equal(result.remainingLifeOver99Years, false);
});

test("reproduces the golden Roof result from equivalent inch entries", () => {
  const inchInput = Object.fromEntries(Object.entries(goldenInput).map(([key, value]) => [
    key,
    key.startsWith("years") ? value : convertUnitToSI(value / 25.4, "length", "in"),
  ])) as unknown as Api653RoofPlateInputSI;
  const result = calculateApi653RoofPlate(inchInput);

  approximately(result.corrosionAllowanceMm, 2.71, 1e-10);
  approximately(result.governingCorrosionRateMmPerYear, 0.1, 1e-10);
  approximately(result.remainingLifeYears, 27.1, 1e-10);
});

test("uses whichever long-term or short-term Roof rate governs", () => {
  const longGoverns = calculateApi653RoofPlate({ ...goldenInput, previousThicknessMm: 5.1 });
  const shortGoverns = calculateApi653RoofPlate(goldenInput);

  approximately(longGoverns.longTermCorrosionRateMmPerYear, 0.05);
  approximately(longGoverns.shortTermCorrosionRateMmPerYear, 0.02);
  approximately(longGoverns.governingCorrosionRateMmPerYear, 0.05);
  approximately(shortGoverns.governingCorrosionRateMmPerYear, 0.1);
});

test("allows either protected corrosion-rate basis independently", () => {
  const longOnly = calculateApi653RoofPlate({ ...goldenInput, previousThicknessMm: 0, yearsSincePreviousInspection: 0 });
  const shortOnly = calculateApi653RoofPlate({ ...goldenInput, originalThicknessMm: 0, yearsInService: 0 });

  assert.equal(longOnly.ok, true);
  approximately(longOnly.longTermCorrosionRateMmPerYear, 0.05);
  assert.equal(longOnly.shortTermCorrosionRateMmPerYear, 0);
  assert.equal(shortOnly.ok, true);
  assert.equal(shortOnly.longTermCorrosionRateMmPerYear, 0);
  approximately(shortOnly.shortTermCorrosionRateMmPerYear, 0.1);
});

test("preserves the protected open-ended zero-corrosion display state", () => {
  const result = calculateApi653RoofPlate({ ...goldenInput, originalThicknessMm: 5, previousThicknessMm: 5, actualThicknessMm: 5 });

  assert.equal(result.governingCorrosionRateMmPerYear, 0);
  assert.equal(result.remainingLifeYears, 0);
  assert.equal(result.remainingLifeOpenEnded, true);
});

test("preserves the protected finite greater-than-99 state", () => {
  const result = calculateApi653RoofPlate({ ...goldenInput, originalThicknessMm: 5.2, previousThicknessMm: 5.1, actualThicknessMm: 5 });

  approximately(result.governingCorrosionRateMmPerYear, 0.02);
  approximately(result.remainingLifeYears, 135.5);
  assert.equal(result.remainingLifeOver99Years, true);
  assert.equal(result.remainingLifeOpenEnded, false);
});

test("keeps a negative allowance visible and returns zero life when Tmin is reached", () => {
  const result = calculateApi653RoofPlate({ ...goldenInput, previousThicknessMm: 2.5, actualThicknessMm: 2 });

  approximately(result.corrosionAllowanceMm, -0.29);
  assert.equal(result.remainingLifeYears, 0);
  assert.equal(result.belowProtectedAlertThreshold, true);
  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "minimum-thickness-reached" && issue.severity === "warning"));
});

test("blocks invalid thicknesses and a missing long/short rate basis", () => {
  const invalid = calculateApi653RoofPlate({ ...goldenInput, actualThicknessMm: -1 });
  const noBasis = calculateApi653RoofPlate({ ...goldenInput, originalThicknessMm: 0, previousThicknessMm: 0, yearsInService: 0, yearsSincePreviousInspection: 0 });

  assert.equal(invalid.ok, false);
  assert.ok(invalid.issues.some((issue) => issue.field === "actualThicknessMm"));
  assert.equal(noBasis.ok, false);
  assert.ok(noBasis.issues.some((issue) => issue.code === "corrosion-rate-basis-required"));
});
