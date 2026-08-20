import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570Header, convertUnitToSI } from "../src/index.ts";
import type { Api570HeaderInputSI } from "../src/index.ts";

const originalWebGoldenInput: Api570HeaderInputSI = {
  outsideDiameterMm: 219.1,
  designPressureMpa: 2.5,
  allowableStressMpa: 138,
  jointEfficiency: 0.85,
  yCoefficient: 0.4,
  originalThicknessMm: 10,
  previousThicknessMm: 9.2,
  actualThicknessMm: 8.8,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the captured protected original-web API 570 Header result", () => {
  const result = calculateApi570Header(originalWebGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.header");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.requiredThicknessMm, 2.31508875739645);
  approximately(result.automaticMinimumThicknessMm, 2.32);
  approximately(result.minimumThicknessUsedMm, 2.32);
  approximately(result.longTermCorrosionRateMmPerYear, 0.05999999999999996);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.07999999999999971);
  approximately(result.governingCorrosionRateMmPerYear, 0.07999999999999971);
  approximately(result.corrosionAllowanceMm, 6.48);
  approximately(result.remainingLifeYears, 81.0000000000003);
  approximately(result.governingMawpMpa, 9.735357917570498);
  approximately(result.futureMawpMpa, 8.823695345557127);
  approximately(result.hydrostaticTestPressureMpa, 3.75);
  approximately(result.pneumaticTestPressureMpa, 2.75);
  approximately(result.projectedThicknessMm, 8.400000000000002);
  approximately(result.futureMawpThicknessMm, 8.000000000000004);
});

test("produces the same SI Header result from equivalent U.S. customary values", () => {
  const result = calculateApi570Header({
    ...originalWebGoldenInput,
    outsideDiameterMm: convertUnitToSI(8.625984251968504, "length", "in"),
    designPressureMpa: convertUnitToSI(362.59434425, "pressure", "psi"),
    allowableStressMpa: convertUnitToSI(20015.2078026, "pressure", "psi"),
    originalThicknessMm: convertUnitToSI(0.3937007874015748, "length", "in"),
    previousThicknessMm: convertUnitToSI(0.36220472440944884, "length", "in"),
    actualThicknessMm: convertUnitToSI(0.3464566929133859, "length", "in"),
  });

  approximately(result.requiredThicknessMm, 2.31508875739645, 1e-9);
  approximately(result.governingMawpMpa, 9.735357917570498, 1e-9);
  approximately(result.remainingLifeYears, 81.0000000000003, 1e-9);
});

test("uses the protected blank defaults for Header E and y", () => {
  const defaults = calculateApi570Header({ ...originalWebGoldenInput, jointEfficiency: undefined, yCoefficient: undefined });
  const explicit = calculateApi570Header({ ...originalWebGoldenInput, jointEfficiency: 1, yCoefficient: 0 });
  assert.equal(defaults.jointEfficiencyUsed, 1);
  assert.equal(defaults.yCoefficientUsed, 0);
  approximately(defaults.requiredThicknessMm, explicit.requiredThicknessMm);
  approximately(defaults.governingMawpMpa, explicit.governingMawpMpa);
});

test("preserves a manual Header minimum-thickness override", () => {
  const result = calculateApi570Header({ ...originalWebGoldenInput, minimumThicknessMm: 3 });
  assert.equal(result.minimumThicknessUsedMm, 3);
  approximately(result.corrosionAllowanceMm, 5.800000000000001);
  approximately(result.remainingLifeYears, 72.50000000000027);
});

test("uses the governing long-term Header corrosion rate when it is larger", () => {
  const result = calculateApi570Header({ ...originalWebGoldenInput, originalThicknessMm: 11, previousThicknessMm: 9 });
  approximately(result.longTermCorrosionRateMmPerYear, 0.10999999999999996);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.03999999999999986);
  approximately(result.governingCorrosionRateMmPerYear, 0.10999999999999996);
  approximately(result.projectedThicknessMm, 8.25);
  approximately(result.futureMawpThicknessMm, 7.700000000000001);
});

test("normalizes Header intervals and blocks invalid E and y inputs", () => {
  const normalized = calculateApi570Header({ ...originalWebGoldenInput, nextInspectionYears: 30 });
  assert.equal(normalized.intervalYears, 20);
  assert.ok(normalized.issues.some((issue) => issue.code === "inspection-interval-normalized"));

  const invalidE = calculateApi570Header({ ...originalWebGoldenInput, jointEfficiency: 0 });
  assert.equal(invalidE.ok, false);
  assert.equal(invalidE.requiredThicknessMm, 0);
  assert.equal(invalidE.governingMawpMpa, 0);

  const invalidY = calculateApi570Header({ ...originalWebGoldenInput, yCoefficient: -0.1 });
  assert.equal(invalidY.ok, false);
  assert.equal(invalidY.requiredThicknessMm, 0);
});
