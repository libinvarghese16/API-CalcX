import assert from "node:assert/strict";
import test from "node:test";

import { calculateFlatCircularHead } from "../src/index.ts";

const goldenInput = {
  diameterOrShortSpanMm: 200,
  attachmentFactor: 0.3,
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

test("matches the protected original-site API 510 flat circular-head result", () => {
  const result = calculateFlatCircularHead(goldenInput);

  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "test-pressure-basis-review" && issue.severity === "warning"));
  assert.equal(result.engineId, "api510.flat-circular-head");
  approximately(result.requiredThicknessMm, 12.387602085230009);
  approximately(result.governingMawpMpa, 2.4402310000000003);
  approximately(result.hydrostaticTestPressureMpa, 3.1723003000000003);
  approximately(result.pneumaticTestPressureMpa, 2.6842541000000004);
  approximately(result.longTermCorrosionRateMmPerYear, 0.10999999999999996);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.13999999999999985);
  approximately(result.projectedThicknessMm, 15.100000000000001);
  approximately(result.minimumThicknessUsedMm, 12.39);
  approximately(result.futureMawpThicknessMm, 14.400000000000002);
  approximately(result.futureMawpMpa, 2.0269440000000003);
  approximately(result.corrosionAllowanceMm, 3.41);
  approximately(result.remainingLifeYears, 24.357142857142886);

  assert.equal(result.requiredThicknessMm.toFixed(2), "12.39");
  assert.equal(result.governingMawpMpa.toFixed(3), "2.440");
  assert.equal(result.futureMawpMpa.toFixed(3), "2.027");
});

test("blocks a non-positive flat-head attachment factor", () => {
  const result = calculateFlatCircularHead({ ...goldenInput, attachmentFactor: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.equal(result.issues.find((issue) => issue.field === "attachmentFactor")?.code, "positive-value-required");
});

test("blocks an invalid diameter or short-span basis", () => {
  const result = calculateFlatCircularHead({ ...goldenInput, diameterOrShortSpanMm: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.equal(result.issues[0]?.field, "diameterOrShortSpanMm");
});
