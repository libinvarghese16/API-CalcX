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

test("matches the captured legacy API 510 spherical-shell result", () => {
  const result = calculateSphericalShell(goldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api510.spherical-shell");
  approximately(result.requiredThicknessMm, 12.88659793814433);
  approximately(result.governingMawpMpa, 1.8359353330427548);
  approximately(result.remainingLifeYears, 20.8100147275405);
  approximately(result.futureMawpMpa, 1.6746510152284264);
});

test("blocks invalid spherical-shell pressure basis", () => {
  const result = calculateSphericalShell({ ...goldenInput, jointEfficiency: 1.2 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
});
