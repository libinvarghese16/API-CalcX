import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570ValveFittings, convertUnitToSI } from "../src/index.ts";
import type { Api570ValveFittingsInputSI } from "../src/index.ts";

const originalWebGoldenInput: Api570ValveFittingsInputSI = {
  designPressureMpa: 2.5,
  outsideDiameterMm: 219.1,
  allowableStressMpa: 138,
  qualityFactor: 0.85,
  allowanceMm: 1.2,
  availableWallThicknessMm: 8.8,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected valve and flanged-fittings result", () => {
  const result = calculateApi570ValveFittings(originalWebGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.valve-flanged-fittings");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.qualityFactorUsed, 0.85);
  assert.equal(result.allowanceUsedMm, 1.2);
  approximately(result.netAvailableThicknessMm, 7.6000000000000005);
  approximately(result.pressureDesignThicknessMm, 3.5022378516624047);
  approximately(result.minimumRequiredThicknessMm, 4.702237851662405);
  approximately(result.allowableWorkingPressureMpa, 5.425102692834322);
});

test("produces the same SI valve/fittings result from equivalent U.S. inputs", () => {
  const result = calculateApi570ValveFittings({
    ...originalWebGoldenInput,
    designPressureMpa: convertUnitToSI(362.59434425, "pressure", "psi"),
    outsideDiameterMm: convertUnitToSI(8.625984251968504, "length", "in"),
    allowableStressMpa: convertUnitToSI(20015.2078026, "pressure", "psi"),
    allowanceMm: convertUnitToSI(0.047244094488188976, "length", "in"),
    availableWallThicknessMm: convertUnitToSI(0.3464566929133859, "length", "in"),
  });

  approximately(result.pressureDesignThicknessMm, 3.5022378516624047, 1e-9);
  approximately(result.minimumRequiredThicknessMm, 4.702237851662405, 1e-9);
  approximately(result.allowableWorkingPressureMpa, 5.425102692834322, 1e-9);
});

test("preserves protected defaults for E and a negative allowance", () => {
  const result = calculateApi570ValveFittings({ ...originalWebGoldenInput, qualityFactor: 0, allowanceMm: -1 });
  const explicit = calculateApi570ValveFittings({ ...originalWebGoldenInput, qualityFactor: 1, allowanceMm: 0 });

  assert.equal(result.qualityFactorUsed, 1);
  assert.equal(result.allowanceUsedMm, 0);
  approximately(result.pressureDesignThicknessMm, explicit.pressureDesignThicknessMm);
  approximately(result.allowableWorkingPressureMpa, explicit.allowableWorkingPressureMpa);
  assert.ok(result.issues.some((issue) => issue.code === "quality-factor-defaulted"));
  assert.ok(result.issues.some((issue) => issue.code === "allowance-clamped"));
});

test("returns zero allowable pressure when available wall does not exceed allowance", () => {
  const result = calculateApi570ValveFittings({ ...originalWebGoldenInput, availableWallThicknessMm: 1.2 });
  assert.equal(result.ok, true);
  approximately(result.minimumRequiredThicknessMm, 4.702237851662405);
  assert.equal(result.netAvailableThicknessMm, 0);
  assert.equal(result.allowableWorkingPressureMpa, 0);
});

test("keeps inverse pressure independent of design pressure", () => {
  const result = calculateApi570ValveFittings({ ...originalWebGoldenInput, designPressureMpa: 0 });
  assert.equal(result.ok, false);
  assert.equal(result.pressureDesignThicknessMm, 0);
  assert.equal(result.minimumRequiredThicknessMm, 0);
  approximately(result.allowableWorkingPressureMpa, 5.425102692834322);
});

test("blocks a negative available wall and invalid inverse basis", () => {
  const negativeWall = calculateApi570ValveFittings({ ...originalWebGoldenInput, availableWallThicknessMm: -1 });
  assert.equal(negativeWall.ok, false);
  assert.equal(negativeWall.allowableWorkingPressureMpa, 0);

  const invalidDiameter = calculateApi570ValveFittings({ ...originalWebGoldenInput, outsideDiameterMm: 0 });
  assert.equal(invalidDiameter.ok, false);
  assert.equal(invalidDiameter.pressureDesignThicknessMm, 0);
  assert.equal(invalidDiameter.allowableWorkingPressureMpa, 0);
});
