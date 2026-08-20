import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570FlangeHydroTest, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-10): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected Flange Hydro Test golden result", () => {
  const result = calculateApi570FlangeHydroTest({
    pressureRating38CMpa: convertUnitToSI(17, "pressure", "Bar"),
    pressureRating100FMpa: convertUnitToSI(250, "pressure", "psi"),
    nominalPipeSizeMm: convertUnitToSI(6, "length", "in"),
  });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.flange-hydro-test");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.pressureRating38CBarUsed, 17);
  approximately(result.pressureRating100FPsiUsed, 250);
  approximately(result.nominalPipeSizeInUsed, 6);
  assert.equal(result.hydroTestPressureBar, 26);
  assert.equal(result.hydroTestPressurePsi, 375);
  assert.equal(result.minimumTestDurationSeconds, 120);
  approximately(result.metricHydroTestPressureMpa, 2.6);
  approximately(result.usHydroTestPressureMpa, convertUnitToSI(375, "pressure", "psi"));
});

test("reproduces the golden result from equivalent mixed field units", () => {
  const result = calculateApi570FlangeHydroTest({
    pressureRating38CMpa: convertUnitToSI(246.56415409, "pressure", "psi"),
    pressureRating100FMpa: convertUnitToSI(17.23689323, "pressure", "Bar"),
    nominalPipeSizeMm: 152.4,
  });

  assert.equal(result.hydroTestPressureBar, 26);
  assert.equal(result.hydroTestPressurePsi, 375);
  assert.equal(result.minimumTestDurationSeconds, 120);
});

test("preserves the protected bar and psi rounding boundaries", () => {
  const result = calculateApi570FlangeHydroTest({
    pressureRating38CMpa: convertUnitToSI(16.67, "pressure", "Bar"),
    pressureRating100FMpa: convertUnitToSI(251, "pressure", "psi"),
    nominalPipeSizeMm: convertUnitToSI(8.01, "length", "in"),
  });

  assert.equal(result.hydroTestPressureBar, 26);
  assert.equal(result.hydroTestPressurePsi, 400);
  assert.equal(result.minimumTestDurationSeconds, 180);
});

test("preserves all protected NPS duration bands", () => {
  const durationFor = (npsIn: number) => calculateApi570FlangeHydroTest({ nominalPipeSizeMm: convertUnitToSI(npsIn, "length", "in") }).minimumTestDurationSeconds;

  assert.equal(durationFor(0), 0);
  assert.equal(durationFor(2), 60);
  assert.equal(durationFor(2.01), 120);
  assert.equal(durationFor(8), 120);
  assert.equal(durationFor(8.01), 180);
});

test("keeps the bar and psi pressure routes independent", () => {
  const metricOnly = calculateApi570FlangeHydroTest({ pressureRating38CMpa: convertUnitToSI(17, "pressure", "Bar") });
  assert.equal(metricOnly.hydroTestPressureBar, 26);
  assert.equal(metricOnly.hydroTestPressurePsi, 0);

  const usOnly = calculateApi570FlangeHydroTest({ pressureRating100FMpa: convertUnitToSI(250, "pressure", "psi") });
  assert.equal(usOnly.hydroTestPressureBar, 0);
  assert.equal(usOnly.hydroTestPressurePsi, 375);
});

test("returns zero for omitted optional inputs", () => {
  const result = calculateApi570FlangeHydroTest({});
  assert.equal(result.ok, true);
  assert.equal(result.hydroTestPressureBar, 0);
  assert.equal(result.hydroTestPressurePsi, 0);
  assert.equal(result.minimumTestDurationSeconds, 0);
});

test("blocks negative ratings and nominal pipe size", () => {
  const result = calculateApi570FlangeHydroTest({
    pressureRating38CMpa: -1,
    pressureRating100FMpa: -1,
    nominalPipeSizeMm: -1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.hydroTestPressureBar, 0);
  assert.equal(result.hydroTestPressurePsi, 0);
  assert.equal(result.minimumTestDurationSeconds, 0);
  assert.equal(result.issues.filter((issue) => issue.severity === "error").length, 3);
});
