import assert from "node:assert/strict";
import test from "node:test";

import { API570_PIPING_CODE_DEFINITIONS, calculateApi570Piping, convertUnitToSI } from "../src/index.ts";
import type { Api570PipingCode, Api570PipingInputSI } from "../src/index.ts";

const originalWebGoldenInput: Api570PipingInputSI = {
  pipingCode: "b31.3",
  outsideDiameterMm: 323.85,
  designPressureMpa: 2,
  allowableStressMpa: 138,
  longitudinalQualityFactor: 0.85,
  weldStrengthReductionFactor: 1,
  yCoefficient: 0.4,
  allowanceMm: 3,
  originalThicknessMm: 18,
  previousThicknessMm: 16.5,
  actualThicknessMm: 15.8,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the captured protected original-web API 570 B31.3 piping result", () => {
  const result = calculateApi570Piping(originalWebGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.piping");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.pressureDesignThicknessMm, 2.7421676545300597);
  approximately(result.requiredThicknessMm, 5.74216765453006);
  approximately(result.minimumThicknessUsedMm, 5.74);
  approximately(result.longTermCorrosionRateMmPerYear, 0.11);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.14);
  approximately(result.governingCorrosionRateMmPerYear, 0.14);
  approximately(result.corrosionAllowanceMm, 10.06);
  approximately(result.remainingLifeYears, 71.85714285714285);
  approximately(result.governingMawpMpa, 9.575204872293613);
  approximately(result.hydrostaticTestPressureMpa, 3);
  approximately(result.pneumaticTestPressureMpa, 2.2);
  approximately(result.projectedThicknessMm, 15.100000000000001);
  approximately(result.futureMawpThicknessMm, 14.4);
  approximately(result.futureMawpMpa, 8.497569345152987);
});

test("produces the same SI result from equivalent U.S. customary field values", () => {
  const result = calculateApi570Piping({
    ...originalWebGoldenInput,
    outsideDiameterMm: convertUnitToSI(12.75, "length", "in"),
    designPressureMpa: convertUnitToSI(290.0754754, "pressure", "psi"),
    allowableStressMpa: convertUnitToSI(20015.2078026, "pressure", "psi"),
    allowanceMm: convertUnitToSI(0.11811023622047245, "length", "in"),
    originalThicknessMm: convertUnitToSI(0.7086614173228347, "length", "in"),
    previousThicknessMm: convertUnitToSI(0.6496062992125984, "length", "in"),
    actualThicknessMm: convertUnitToSI(0.6220472440944882, "length", "in"),
  });

  approximately(result.requiredThicknessMm, 5.74216765453006, 1e-9);
  approximately(result.governingMawpMpa, 9.575204872293613, 1e-9);
  approximately(result.remainingLifeYears, 71.85714285714285, 1e-9);
});

test("preserves every protected code route and blocks inactive historical codes", () => {
  const activeCodes = API570_PIPING_CODE_DEFINITIONS.filter((definition) => definition.calculationMode).map((definition) => definition.code);
  for (const pipingCode of activeCodes) {
    const result = calculateApi570Piping({ ...originalWebGoldenInput, pipingCode });
    assert.equal(result.ok, true, `${pipingCode} should have an active equation`);
    assert.ok(result.requiredThicknessMm > 0, `${pipingCode} should calculate thickness`);
    assert.ok(result.governingMawpMpa > 0, `${pipingCode} should calculate MAWP`);
  }

  for (const pipingCode of ["b31.2", "b31.7"] as const) {
    const result = calculateApi570Piping({ ...originalWebGoldenInput, pipingCode });
    assert.equal(result.ok, false);
    assert.equal(result.requiredThicknessMm, 0);
    assert.equal(result.governingMawpMpa, 0);
    assert.ok(result.issues.some((issue) => issue.code === "inactive-piping-code"));
  }
});

test("keeps the protected routed-code equivalences", () => {
  const resultFor = (pipingCode: Api570PipingCode) => calculateApi570Piping({ ...originalWebGoldenInput, pipingCode });
  approximately(resultFor("b31.6").requiredThicknessMm, resultFor("b31.3").requiredThicknessMm);
  approximately(resultFor("b31.10").requiredThicknessMm, resultFor("b31.3").requiredThicknessMm);
  approximately(resultFor("b31.11").requiredThicknessMm, resultFor("b31.4").requiredThicknessMm);
  approximately(resultFor("b31.8s").requiredThicknessMm, resultFor("b31.8").requiredThicknessMm);
});

test("does not apply an allowance to the protected B31.8 pressure equation", () => {
  const withAllowance = calculateApi570Piping({ ...originalWebGoldenInput, pipingCode: "b31.8", allowanceMm: 3 });
  const withoutAllowance = calculateApi570Piping({ ...originalWebGoldenInput, pipingCode: "b31.8", allowanceMm: 0 });
  approximately(withAllowance.requiredThicknessMm, withoutAllowance.requiredThicknessMm);
  approximately(withAllowance.governingMawpMpa, withoutAllowance.governingMawpMpa);
});

test("uses structural minimums and manual minimum-thickness overrides explicitly", () => {
  const structural = calculateApi570Piping({ ...originalWebGoldenInput, structuralMinimumThicknessMm: 7.5 });
  assert.equal(structural.automaticMinimumThicknessMm, 7.5);
  assert.equal(structural.minimumThicknessUsedMm, 7.5);
  approximately(structural.corrosionAllowanceMm, 8.3);

  const manual = calculateApi570Piping({ ...originalWebGoldenInput, structuralMinimumThicknessMm: 7.5, minimumThicknessMm: 8 });
  assert.equal(manual.minimumThicknessUsedMm, 8);
  approximately(manual.remainingLifeYears, 55.71428571428571);
});

test("normalizes the protected future interval to 1 through 20 years", () => {
  const result = calculateApi570Piping({ ...originalWebGoldenInput, nextInspectionYears: 30 });
  assert.equal(result.intervalYears, 20);
  approximately(result.projectedThicknessMm, 13);
  approximately(result.futureMawpThicknessMm, 10.2);
  assert.ok(result.issues.some((issue) => issue.code === "inspection-interval-normalized"));
});
