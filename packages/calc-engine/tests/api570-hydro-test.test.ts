import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570HydroTest, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected calculated-ratio Hydro Test Pressure result", () => {
  const result = calculateApi570HydroTest({
    designPressureMpa: 2.5,
    allowableStressDesignMpa: 138,
    allowableStressTestMpa: 165,
  });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.hydro-test-pressure");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.stressRatioSource, "stress-ratio");
  approximately(result.calculatedStressRatio, 165 / 138);
  approximately(result.stressRatioUsed, 165 / 138);
  approximately(result.minimumHydroTestPressureMpa, 4.483695652173913);
});

test("produces the same SI Hydro result from equivalent U.S. pressure inputs", () => {
  const result = calculateApi570HydroTest({
    designPressureMpa: convertUnitToSI(362.59434425, "pressure", "psi"),
    allowableStressDesignMpa: convertUnitToSI(20015.2078026, "pressure", "psi"),
    allowableStressTestMpa: convertUnitToSI(23931.2267205, "pressure", "psi"),
  });

  approximately(result.stressRatioUsed, 165 / 138, 1e-9);
  approximately(result.minimumHydroTestPressureMpa, 4.483695652173913, 1e-9);
});

test("uses a positive manual Rr before the calculated stress ratio", () => {
  const result = calculateApi570HydroTest({
    designPressureMpa: 2.5,
    allowableStressDesignMpa: 138,
    allowableStressTestMpa: 165,
    manualStressRatio: 1.25,
  });

  assert.equal(result.stressRatioSource, "manual");
  assert.equal(result.stressRatioUsed, 1.25);
  approximately(result.minimumHydroTestPressureMpa, 4.6875);
});

test("caps the stress ratio at the protected maximum of 6.5", () => {
  const result = calculateApi570HydroTest({ designPressureMpa: 2.5, manualStressRatio: 8 });

  assert.equal(result.stressRatioUsed, 6.5);
  approximately(result.minimumHydroTestPressureMpa, 24.375);
  assert.ok(result.issues.some((issue) => issue.code === "stress-ratio-capped"));
});

test("defaults to Rr 1.0 when neither manual nor calculated ratio is available", () => {
  const result = calculateApi570HydroTest({ designPressureMpa: 2.5 });

  assert.equal(result.ok, true);
  assert.equal(result.stressRatioSource, "default");
  assert.equal(result.stressRatioUsed, 1);
  approximately(result.minimumHydroTestPressureMpa, 3.75);
  assert.ok(result.issues.some((issue) => issue.code === "stress-ratio-defaulted"));
});

test("ignores a non-positive manual ratio and falls back to ST divided by S", () => {
  const result = calculateApi570HydroTest({
    designPressureMpa: 2.5,
    allowableStressDesignMpa: 138,
    allowableStressTestMpa: 165,
    manualStressRatio: 0,
  });

  assert.equal(result.stressRatioSource, "stress-ratio");
  approximately(result.stressRatioUsed, 165 / 138);
  assert.ok(result.issues.some((issue) => issue.code === "manual-ratio-ignored"));
});

test("blocks a non-positive design pressure", () => {
  const result = calculateApi570HydroTest({ designPressureMpa: 0, manualStressRatio: 1.25 });

  assert.equal(result.ok, false);
  assert.equal(result.minimumHydroTestPressureMpa, 0);
  assert.ok(result.issues.some((issue) => issue.field === "designPressureMpa" && issue.severity === "error"));
});
