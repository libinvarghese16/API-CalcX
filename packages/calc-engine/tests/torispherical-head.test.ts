import assert from "node:assert/strict";
import test from "node:test";

import { calculateTorisphericalHead } from "../src/index.ts";

const goldenInput = {
  crownRadiusMm: 2000,
  designPressureMpa: 1.5,
  allowableStressMpa: 138,
  jointEfficiency: 0.85,
  originalThicknessMm: 28,
  previousThicknessMm: 26.5,
  actualThicknessMm: 25.8,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);
}

test("matches the captured legacy API 510 torispherical-head result", () => {
  const result = calculateTorisphericalHead(goldenInput);

  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "test-pressure-basis-review" && issue.severity === "warning"));
  assert.equal(result.engineId, "api510.torispherical-head");
  approximately(result.requiredThicknessMm, 22.663252240717036);
  approximately(result.governingMawpMpa, 1.7073079917408525);
  approximately(result.longTermCorrosionRateMmPerYear, 0.10999999999999996);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.13999999999999985);
  approximately(result.remainingLifeYears, 22.405341137735462);
  approximately(result.futureMawpMpa, 1.6610512775668402);
});

test("blocks an invalid torispherical crown-radius basis", () => {
  const result = calculateTorisphericalHead({ ...goldenInput, crownRadiusMm: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.equal(result.issues[0]?.field, "crownRadiusMm");
});
