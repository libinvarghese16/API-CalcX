import assert from "node:assert/strict";
import test from "node:test";

import { calculateHemisphericalHead } from "../src/index.ts";

const goldenInput = {
  sphericalRadiusMm: 1000,
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

test("matches the captured legacy API 510 hemispherical-head result", () => {
  const result = calculateHemisphericalHead(goldenInput);

  assert.equal(result.ok, true);
  assert.ok(result.issues.some((issue) => issue.code === "test-pressure-basis-review" && issue.severity === "warning"));
  assert.equal(result.engineId, "api510.hemispherical-head");
  approximately(result.requiredThicknessMm, 6.402048655569783);
  approximately(result.governingMawpMpa, 3.695003788029826);
  approximately(result.minimumThicknessUsedMm, 6.4);
  approximately(result.remainingLifeYears, 67.14285714285722);
  approximately(result.futureMawpThicknessMm, 14.400000000000002);
  approximately(result.futureMawpMpa, 3.368538608806637);
});

test("blocks an invalid hemispherical radius basis", () => {
  const result = calculateHemisphericalHead({ ...goldenInput, sphericalRadiusMm: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.equal(result.issues[0]?.field, "sphericalRadiusMm");
});
