import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570Tube, convertUnitToSI } from "../src/index.ts";
import type { Api570TubeInputSI } from "../src/index.ts";

const originalWebGoldenInput: Api570TubeInputSI = {
  outsideDiameterMm: 50.8,
  designPressureMpa: 3.5,
  allowableStressMpa: 120,
  weldStrengthReductionFactor: 0.9,
  endCondition: "expanded",
  expandedEndThicknessFactorMm: 0.5,
  originalThicknessMm: 5,
  previousThicknessMm: 4.6,
  actualThicknessMm: 4.3,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the captured protected original-web expanded-end Tube result", () => {
  const result = calculateApi570Tube(originalWebGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.tube");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.requiredThicknessMm, 1.5640227790432801);
  approximately(result.automaticMinimumThicknessMm, 1.56);
  approximately(result.minimumThicknessUsedMm, 1.56);
  approximately(result.longTermCorrosionRateMmPerYear, 0.03500000000000001);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.05999999999999996);
  approximately(result.governingCorrosionRateMmPerYear, 0.05999999999999996);
  approximately(result.corrosionAllowanceMm, 2.7399999999999998);
  approximately(result.remainingLifeYears, 45.66666666666669);
  approximately(result.governingMawpMpa, 16.20891353112964);
  approximately(result.futureMawpMpa, 13.29744639946504);
  approximately(result.hydrostaticTestPressureMpa, 5.25);
  approximately(result.pneumaticTestPressureMpa, 3.8500000000000005);
  approximately(result.projectedThicknessMm, 4);
  approximately(result.futureMawpThicknessMm, 3.7);
});

test("produces the same SI Tube result from equivalent U.S. customary values", () => {
  const result = calculateApi570Tube({
    ...originalWebGoldenInput,
    outsideDiameterMm: convertUnitToSI(2, "length", "in"),
    designPressureMpa: convertUnitToSI(507.63208195, "pressure", "psi"),
    allowableStressMpa: convertUnitToSI(17404.528524, "pressure", "psi"),
    expandedEndThicknessFactorMm: convertUnitToSI(0.01968503937007874, "length", "in"),
    originalThicknessMm: convertUnitToSI(0.1968503937007874, "length", "in"),
    previousThicknessMm: convertUnitToSI(0.18110236220472442, "length", "in"),
    actualThicknessMm: convertUnitToSI(0.16929133858267717, "length", "in"),
  });

  approximately(result.requiredThicknessMm, 1.5640227790432801, 1e-9);
  approximately(result.governingMawpMpa, 16.20891353112964, 1e-9);
  approximately(result.remainingLifeYears, 45.66666666666669, 1e-9);
});

test("forces expanded-end thickness factor to zero for welded tube ends", () => {
  const weldedWithEnteredFactor = calculateApi570Tube({ ...originalWebGoldenInput, endCondition: "welded", expandedEndThicknessFactorMm: 2 });
  const weldedWithoutFactor = calculateApi570Tube({ ...originalWebGoldenInput, endCondition: "welded", expandedEndThicknessFactorMm: 0 });
  assert.equal(weldedWithEnteredFactor.expandedEndThicknessFactorUsedMm, 0);
  approximately(weldedWithEnteredFactor.requiredThicknessMm, weldedWithoutFactor.requiredThicknessMm);
  approximately(weldedWithEnteredFactor.governingMawpMpa, weldedWithoutFactor.governingMawpMpa);
});

test("preserves a manual Tube minimum-thickness override", () => {
  const result = calculateApi570Tube({ ...originalWebGoldenInput, minimumThicknessMm: 2 });
  assert.equal(result.minimumThicknessUsedMm, 2);
  approximately(result.corrosionAllowanceMm, 2.3);
  approximately(result.remainingLifeYears, 38.33333333333336);
});

test("uses the governing long-term Tube corrosion rate when it is larger", () => {
  const result = calculateApi570Tube({ ...originalWebGoldenInput, originalThicknessMm: 6, previousThicknessMm: 4.4 });
  approximately(result.longTermCorrosionRateMmPerYear, 0.085);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.020000000000000108);
  approximately(result.governingCorrosionRateMmPerYear, 0.085);
  approximately(result.projectedThicknessMm, 3.875);
  approximately(result.futureMawpThicknessMm, 3.45);
});

test("normalizes Tube intervals and blocks an invalid pressure basis", () => {
  const normalized = calculateApi570Tube({ ...originalWebGoldenInput, nextInspectionYears: 40 });
  assert.equal(normalized.intervalYears, 20);
  assert.ok(normalized.issues.some((issue) => issue.code === "inspection-interval-normalized"));

  const invalid = calculateApi570Tube({ ...originalWebGoldenInput, weldStrengthReductionFactor: 0 });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.requiredThicknessMm, 0);
  assert.equal(invalid.governingMawpMpa, 0);
});
