import assert from "node:assert/strict";
import test from "node:test";

import { calculateCylindricalShell } from "../src/index.ts";
import type { CylindricalShellInputSI } from "../src/index.ts";

const legacyGoldenInput: CylindricalShellInputSI = {
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
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("matches the captured legacy API 510 cylindrical-shell golden result", () => {
  const result = calculateCylindricalShell(legacyGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineVersion, "0.1.0-legacy-parity");
  assert.equal(result.governingThicknessCase, "circumferential");
  assert.equal(result.governingMawpCase, "circumferential");
  approximately(result.circumferentialRequiredThicknessMm, 12.88659793814433);
  approximately(result.longitudinalRequiredThicknessMm, 6.377551020408164);
  approximately(result.requiredThicknessMm, 12.88659793814433);
  approximately(result.longTermCorrosionRateMmPerYear, 0.11);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.14);
  approximately(result.governingCorrosionRateMmPerYear, 0.14);
  approximately(result.corrosionAllowanceMm, 2.9134020618556704);
  approximately(result.remainingLifeYears, 20.8100147275405);
  approximately(result.circumferentialMawpMpa, 1.8359353330427548);
  approximately(result.longitudinalMawpMpa, 3.730255212945818);
  approximately(result.governingMawpMpa, 1.8359353330427548);
  approximately(result.hydrostaticTestPressureMpa, 2.3867159329555814);
  approximately(result.pneumaticTestPressureMpa, 2.0195288663470303);
  approximately(result.projectedThicknessMm, 15.100000000000001);
  approximately(result.futureMawpThicknessMm, 14.4);
  approximately(result.futureMawpMpa, 1.6746510152284264);
});

test("preserves a manually supplied minimum thickness", () => {
  const result = calculateCylindricalShell({ ...legacyGoldenInput, minimumThicknessMm: 13.2 });

  assert.equal(result.minimumThicknessUsedMm, 13.2);
  approximately(result.corrosionAllowanceMm, 2.6);
  approximately(result.remainingLifeYears, 18.57142857142857);
});

test("keeps zero-corrosion legacy behavior deterministic", () => {
  const result = calculateCylindricalShell({
    ...legacyGoldenInput,
    originalThicknessMm: 15.8,
    previousThicknessMm: 15.8,
  });

  assert.equal(result.governingCorrosionRateMmPerYear, 0);
  assert.equal(result.remainingLifeYears, 0);
  assert.equal(result.projectedThicknessMm, 15.8);
  assert.equal(result.futureMawpThicknessMm, 15.8);
  approximately(result.futureMawpMpa, result.governingMawpMpa);
});

test("blocks an out-of-range joint efficiency at the engine boundary", () => {
  const result = calculateCylindricalShell({ ...legacyGoldenInput, jointEfficiency: 1.2 });

  assert.equal(result.ok, false);
  assert.equal(result.requiredThicknessMm, 0);
  assert.equal(result.governingMawpMpa, 0);
  assert.ok(result.issues.some((issue) => issue.code === "joint-efficiency-out-of-range"));
});

test("normalizes the future interval to the legacy 1-to-10-year range", () => {
  const result = calculateCylindricalShell({ ...legacyGoldenInput, nextInspectionYears: 18 });

  assert.equal(result.ok, true);
  assert.equal(result.intervalYears, 10);
  approximately(result.projectedThicknessMm, 14.4);
  assert.ok(result.issues.some((issue) => issue.code === "inspection-interval-normalized"));
});

test("uses the long-term rate when it governs every related projection", () => {
  const result = calculateCylindricalShell({
    ...legacyGoldenInput,
    originalThicknessMm: 20,
    previousThicknessMm: 16,
    actualThicknessMm: 15,
    yearsInService: 10,
    yearsSincePreviousInspection: 5,
  });

  approximately(result.longTermCorrosionRateMmPerYear, 0.5);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.2);
  approximately(result.governingCorrosionRateMmPerYear, 0.5);
  approximately(result.corrosionAllowanceMm, 2.11340206185567);
  approximately(result.remainingLifeYears, 4.22680412371134);
  approximately(result.projectedThicknessMm, 12.5);
  approximately(result.futureMawpThicknessMm, 10);
  approximately(result.futureMawpMpa, 1.166003976143141);
});

test("uses a manually shortened previous-inspection interval for the short-term rate", () => {
  const result = calculateCylindricalShell({
    ...legacyGoldenInput,
    yearsSincePreviousInspection: 2,
  });

  approximately(result.longTermCorrosionRateMmPerYear, 0.11);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.35);
  approximately(result.governingCorrosionRateMmPerYear, 0.35);
  approximately(result.remainingLifeYears, 8.324005891016203);
  approximately(result.projectedThicknessMm, 14.05);
  approximately(result.futureMawpThicknessMm, 12.3);
});
