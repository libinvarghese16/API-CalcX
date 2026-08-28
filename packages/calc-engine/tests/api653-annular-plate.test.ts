import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateApi653AnnularPlate,
  calculateApi653AnnularStress,
  convertUnitToSI,
  selectApi653AnnularMinimumThickness,
} from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const completeGoldenInput = {
  diameterM: 30,
  liquidHeightM: 18,
  firstShellThicknessMm: 20,
  specificGravity: 0.9,
  highSpecificGravityBasisConfirmed: false,
  calculatedStressMode: "auto" as const,
  manualCalculatedStressMpa: 0,
  minimumThicknessMode: "auto" as const,
  manualMinimumThicknessMm: 0,
  originalThicknessMm: 10,
  previousThicknessMm: 9.3,
  actualThicknessMm: 8.8,
  previousInternalPittingDepthMm: 0,
  currentInternalPittingDepthMm: 1,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
};

test("matches the complete protected Annular stress, automatic Tmin, and remaining-life golden chain", () => {
  const result = calculateApi653AnnularPlate(completeGoldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api653.annular-plate");
  assert.equal(result.engineVersion, "0.2.0-pit-depth-parity");
  assert.equal(result.calculatedStressMode, "auto");
  approximately(result.automaticCalculatedStressMpa, 117.081, 0.0005);
  approximately(result.calculatedStressMpa, 117.081, 0.0005);
  approximately(result.calculatedStressPsi, 16981, 0.5);
  approximately(result.effectiveProductHeightM, 16.2);
  assert.equal(result.minimumSelectionTableLabel, "API 653 Table 4.5a");
  assert.equal(result.minimumSelectionRowLabel, "19 < t ≤ 25 mm");
  assert.equal(result.minimumSelectionColumnLabel, "stress < 168 MPa");
  assert.equal(result.automaticMinimumThicknessMm, 4.32);
  assert.equal(result.minimumThicknessMmUsed, 4.32);
  approximately(result.metalLossLongMm, 1.2);
  approximately(result.maximumCorrosionRateLongMmPerYear, 0.06);
  approximately(result.maximumCorrosionRateShortMmPerYear, 0.2);
  approximately(result.topSideLongTermCorrosionRateMmPerYear, 0.05);
  approximately(result.topSideShortTermCorrosionRateMmPerYear, 0.2);
  approximately(result.internalPittingRemainingThicknessMmUsed, 9);
  approximately(result.availableThicknessMm, 4.48);
  approximately(result.remainingLifeYears, 22.4);
});

test("matches the protected specific-gravity 1.0-and-above automatic selection route", () => {
  const result = calculateApi653AnnularPlate({ ...completeGoldenInput, specificGravity: 1.1, highSpecificGravityBasisConfirmed: true });

  assert.equal(result.ok, true);
  assert.equal(result.minimumSelectionTableLabel, "API 650 Table 5.1a");
  assert.equal(result.minimumSelectionRowLabel, "19 < t ≤ 25 mm");
  assert.equal(result.minimumSelectionColumnLabel, "stress ≤ 190 MPa");
  assert.equal(result.automaticMinimumThicknessMm, 6);
  approximately(result.effectiveProductHeightM, 19.8);
  approximately(result.remainingLifeYears, 14);
});

test("requires confirmation of the controlled high-specific-gravity structural basis", () => {
  const result = calculateApi653AnnularPlate({ ...completeGoldenInput, specificGravity: 1.1, highSpecificGravityBasisConfirmed: false });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "high-specific-gravity-basis-not-confirmed"));
});

test("reproduces the stress and remaining life from equivalent U.S. customary dimensions", () => {
  const result = calculateApi653AnnularPlate({
    ...completeGoldenInput,
    diameterM: convertUnitToSI(98.4251968504, "length", "ft") / 1000,
    liquidHeightM: convertUnitToSI(59.0551181102, "length", "ft") / 1000,
    firstShellThicknessMm: convertUnitToSI(0.7874015748, "length", "in"),
    originalThicknessMm: convertUnitToSI(0.3937007874, "length", "in"),
    previousThicknessMm: convertUnitToSI(0.3661417323, "length", "in"),
    actualThicknessMm: convertUnitToSI(0.3464566929, "length", "in"),
    previousInternalPittingDepthMm: convertUnitToSI(0, "length", "in"),
    currentInternalPittingDepthMm: convertUnitToSI(0.0393700787, "length", "in"),
  });

  approximately(result.calculatedStressMpa, 117.081, 0.0005);
  approximately(result.minimumThicknessMmUsed, 4.32);
  approximately(result.remainingLifeYears, 22.4, 1e-7);
});

test("preserves the protected stress-column boundaries for both selection routes", () => {
  const lowGravity = (calculatedStressMpa: number) => selectApi653AnnularMinimumThickness({ specificGravity: 0.9, liquidHeightM: 18, firstShellThicknessMm: 20, calculatedStressMpa });
  const highGravity = (calculatedStressMpa: number) => selectApi653AnnularMinimumThickness({ specificGravity: 1, liquidHeightM: 18, firstShellThicknessMm: 20, calculatedStressMpa });

  assert.equal(lowGravity(167.999).valueMm, 4.32);
  assert.equal(lowGravity(168).valueMm, 5.59);
  assert.equal(lowGravity(186).valueMm, 7.88);
  assert.equal(lowGravity(205).valueMm, 9.65);
  assert.equal(lowGravity(223).ok, false);
  assert.equal(highGravity(190).valueMm, 6);
  assert.equal(highGravity(190.001).valueMm, 7);
  assert.equal(highGravity(210.001).valueMm, 10);
  assert.equal(highGravity(220.001).valueMm, 11);
  assert.equal(highGravity(250.001).ok, false);
});

test("blocks automatic selection beyond the protected H times G limit", () => {
  const result = calculateApi653AnnularPlate({ ...completeGoldenInput, liquidHeightM: 22, specificGravity: 1.1 });

  assert.equal(result.ok, false);
  assert.equal(result.automaticMinimumThicknessMm, null);
  assert.equal(result.minimumThicknessMmUsed, 0);
  assert.ok(result.issues.some((issue) => issue.code === "annular-table-not-applicable"));
});

test("allows an explicit manual minimum while disclosing the automatic recommendation", () => {
  const result = calculateApi653AnnularPlate({ ...completeGoldenInput, minimumThicknessMode: "manual", manualMinimumThicknessMm: 4.5 });

  assert.equal(result.ok, true);
  assert.equal(result.automaticMinimumThicknessMm, 4.32);
  assert.equal(result.minimumThicknessMmUsed, 4.5);
  approximately(result.remainingLifeYears, 21.5);
});

test("allows an explicit manual shell stress and recalculates automatic Tmin and remaining life", () => {
  const result = calculateApi653AnnularPlate({
    ...completeGoldenInput,
    calculatedStressMode: "manual",
    manualCalculatedStressMpa: 190,
  });

  assert.equal(result.ok, true);
  assert.equal(result.calculatedStressMode, "manual");
  approximately(result.automaticCalculatedStressMpa, 117.081, 0.0005);
  approximately(result.calculatedStressMpa, 190);
  assert.equal(result.minimumSelectionColumnLabel, "stress < 205 MPa");
  assert.equal(result.automaticMinimumThicknessMm, 7.88);
  assert.equal(result.minimumThicknessMmUsed, 7.88);
  approximately(result.remainingLifeYears, 4.6);
});

test("rejects an invalid manual shell stress", () => {
  const result = calculateApi653AnnularPlate({
    ...completeGoldenInput,
    calculatedStressMode: "manual",
    manualCalculatedStressMpa: 0,
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.field === "manualCalculatedStressMpa" && issue.severity === "error"));
});

test("validates every calculated-stress dependency", () => {
  for (const input of [
    { diameterM: 0, liquidHeightM: 18, firstShellThicknessMm: 20 },
    { diameterM: 30, liquidHeightM: 0, firstShellThicknessMm: 20 },
    { diameterM: 30, liquidHeightM: 18, firstShellThicknessMm: -1 },
  ]) {
    const result = calculateApi653AnnularStress(input);
    assert.equal(result.ok, false);
    assert.equal(result.calculatedStressMpa, 0);
  }
});

test("accepts zero as the default no-pitting depth and calculates from annular thickness loss", () => {
  const result = calculateApi653AnnularPlate({
    ...completeGoldenInput,
    previousInternalPittingDepthMm: 0,
    currentInternalPittingDepthMm: 0,
  });

  assert.equal(result.ok, true);
  approximately(result.internalPittingRemainingThicknessMmUsed, 10);
  approximately(result.topSideLongTermCorrosionRateMmPerYear, 0);
  approximately(result.topSideShortTermCorrosionRateMmPerYear, 0);
  approximately(result.governingThicknessMm, 8.8);
  approximately(result.remainingLifeYears, 44.8);
});

test("rejects a pit depth greater than the original annular thickness", () => {
  const result = calculateApi653AnnularPlate({ ...completeGoldenInput, currentInternalPittingDepthMm: 10.1 });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "pitting-depth-exceeds-original" && issue.field === "currentInternalPittingDepthMm"));
});
