import assert from "node:assert/strict";
import test from "node:test";

import { calculateEllipsoidalHead } from "../src/index.ts";

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

test("matches the captured legacy API 510 ellipsoidal-head result", () => {
  const result = calculateEllipsoidalHead(goldenInput);

  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "test-pressure-basis-review" && issue.severity === "warning"));
  assert.equal(result.engineId, "api510.ellipsoidal-head");
  approximately(result.requiredThicknessMm, 12.804097311139566);
  approximately(result.governingMawpMpa, 1.8504163421793567);
  approximately(result.remainingLifeYears, 21.399304920431675);
  approximately(result.futureMawpMpa, 1.7685594751924594);
});

test("blocks invalid ellipsoidal-head pressure basis", () => {
  const result = calculateEllipsoidalHead({ ...goldenInput, allowableStressMpa: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
});
