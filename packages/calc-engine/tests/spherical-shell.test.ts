import assert from "node:assert/strict";
import test from "node:test";

import { calculateSphericalShell } from "../src/index.ts";

const goldenInput = {
  insideDiameterMm: 2000,
  designPressureMpa: 1.5,
  allowableStressMpa: 138,
  jointEfficiency: 0.85,
  originalThicknessMm: 18,
  previousThicknessMm: 16.5,
  actualThicknessMm: 15.8,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);
}

test("matches the ASME VIII Division 1 thin spherical-shell equations", () => {
  const result = calculateSphericalShell(goldenInput);

  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "test-pressure-basis-review" && issue.severity === "warning"));
  assert.equal(result.engineId, "api510.spherical-shell");
  approximately(result.requiredThicknessMm, 6.402048655569783);
  approximately(result.governingMawpMpa, 3.695003788029826);
  approximately(result.remainingLifeYears, 67.12822388878728);
  approximately(result.futureMawpThicknessMm, 15.100000000000001);
  approximately(result.futureMawpMpa, 3.531793982173835);
});

test("blocks invalid spherical-shell pressure basis", () => {
  const result = calculateSphericalShell({ ...goldenInput, jointEfficiency: 1.2 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
});
