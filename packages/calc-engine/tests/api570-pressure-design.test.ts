import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570PressureDesign, convertUnitToSI } from "../src/index.ts";
import type { Api570PressureDesignInputSI } from "../src/index.ts";

const originalWebGoldenInput: Api570PressureDesignInputSI = {
  designPressureMpa: 2.5,
  outsideDiameterMm: 219.1,
  allowableStressMpa: 138,
  qualityFactor: 0.85,
  availableCorrodedThicknessMm: 8.8,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected API 570 Barlow Other Piping Calculation result", () => {
  const result = calculateApi570PressureDesign(originalWebGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.pressure-design");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.qualityFactorUsed, 0.85);
  approximately(result.requiredThicknessMm, 2.334825234441603);
  approximately(result.allowableWorkingPressureMpa, 9.422546782291191);
});

test("produces the same SI result from equivalent U.S. customary inputs", () => {
  const result = calculateApi570PressureDesign({
    ...originalWebGoldenInput,
    designPressureMpa: convertUnitToSI(362.59434425, "pressure", "psi"),
    outsideDiameterMm: convertUnitToSI(8.625984251968504, "length", "in"),
    allowableStressMpa: convertUnitToSI(20015.2078026, "pressure", "psi"),
    availableCorrodedThicknessMm: convertUnitToSI(0.3464566929133859, "length", "in"),
  });

  approximately(result.requiredThicknessMm, 2.334825234441603, 1e-9);
  approximately(result.allowableWorkingPressureMpa, 9.422546782291191, 1e-9);
});

test("preserves the protected quality-factor fallback", () => {
  const blank = calculateApi570PressureDesign({ ...originalWebGoldenInput, qualityFactor: undefined });
  const zero = calculateApi570PressureDesign({ ...originalWebGoldenInput, qualityFactor: 0 });
  const explicit = calculateApi570PressureDesign({ ...originalWebGoldenInput, qualityFactor: 1 });

  assert.equal(blank.qualityFactorUsed, 1);
  assert.equal(zero.qualityFactorUsed, 1);
  approximately(blank.requiredThicknessMm, explicit.requiredThicknessMm);
  approximately(zero.allowableWorkingPressureMpa, explicit.allowableWorkingPressureMpa);
  assert.ok(zero.issues.some((issue) => issue.code === "quality-factor-defaulted"));
});

test("keeps the required-thickness result available when corroded thickness is blank", () => {
  const result = calculateApi570PressureDesign({ ...originalWebGoldenInput, availableCorrodedThicknessMm: 0 });
  assert.equal(result.ok, true);
  approximately(result.requiredThicknessMm, 2.334825234441603);
  assert.equal(result.allowableWorkingPressureMpa, 0);
});

test("blocks invalid pressure bases and negative available thickness", () => {
  const invalidPressure = calculateApi570PressureDesign({ ...originalWebGoldenInput, designPressureMpa: 0 });
  assert.equal(invalidPressure.ok, false);
  assert.equal(invalidPressure.requiredThicknessMm, 0);
  assert.equal(invalidPressure.allowableWorkingPressureMpa, 0);

  const invalidThickness = calculateApi570PressureDesign({ ...originalWebGoldenInput, availableCorrodedThicknessMm: -1 });
  assert.equal(invalidThickness.ok, false);
  assert.equal(invalidThickness.allowableWorkingPressureMpa, 0);
});
