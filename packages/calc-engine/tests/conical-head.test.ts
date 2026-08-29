import assert from "node:assert/strict";
import test from "node:test";

import { calculateConicalHead } from "../src/index.ts";

const goldenInput = {
  outsideDiameterMm: 2000,
  halfApexAngleDeg: 30,
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

test("matches the captured legacy API 510 conical-head result", () => {
  const result = calculateConicalHead(goldenInput);

  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "test-pressure-basis-review" && issue.severity === "warning"));
  assert.equal(result.engineId, "api510.conical-head");
  approximately(result.requiredThicknessMm, 14.88016157705221);
  approximately(result.governingMawpMpa, 1.5919695776569007);
  approximately(result.minimumThicknessUsedMm, 14.88);
  approximately(result.remainingLifeYears, 6.571428571428578);
  approximately(result.futureMawpThicknessMm, 14.400000000000002);
  approximately(result.futureMawpMpa, 1.4519566234262382);
});

test("blocks a conical half-apex angle at or beyond 90 degrees", () => {
  const result = calculateConicalHead({ ...goldenInput, halfApexAngleDeg: 90 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.equal(result.issues.find((issue) => issue.field === "halfApexAngleDeg")?.code, "half-apex-angle-out-of-range");
});

test("blocks an invalid conical outside-diameter basis", () => {
  const result = calculateConicalHead({ ...goldenInput, outsideDiameterMm: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.equal(result.issues[0]?.field, "outsideDiameterMm");
});
