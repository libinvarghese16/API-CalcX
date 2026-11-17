import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateApi570Header,
  calculateApi570LigamentEfficiency,
  calculateApi570Piping,
  calculateApi570Tube,
  calculateHemisphericalHead,
} from "../src/index.ts";

// Golden equation cases transcribed from the supplied HRSG-71 company report.
// The source document is not bundled; only its engineering equation identities
// and representative numeric inputs are retained here as regression evidence.
const TOLERANCE = 1e-12;

function approximately(actual: number, expected: number, tolerance = TOLERANCE): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("reproduces the HRSG tube pressure-thickness equation", () => {
  const result = calculateApi570Tube({
    outsideDiameterMm: 38.1,
    designPressureMpa: 11.6,
    allowableStressMpa: 42.8,
    weldStrengthReductionFactor: 1,
    endCondition: "welded",
    expandedEndThicknessFactorMm: 0,
    structuralMinimumThicknessMm: 1.3,
    originalThicknessMm: 5.2,
    previousThicknessMm: 5.1,
    actualThicknessMm: 5,
    yearsInService: 19,
    yearsSincePreviousInspection: 8,
    nextInspectionYears: 5,
  });

  // t = PD/(2Sw + P) + 0.005D + e
  approximately(result.requiredThicknessMm, 4.737413580246914);
  approximately(result.automaticMinimumThicknessMm, 4.737413580246914);
  approximately(result.remainingLifeYears, 21.006913580246977);
});

test("uses the structural minimum when it governs a low-pressure tube", () => {
  const result = calculateApi570Tube({
    outsideDiameterMm: 38.1,
    designPressureMpa: 0.7,
    allowableStressMpa: 138,
    weldStrengthReductionFactor: 1,
    endCondition: "welded",
    expandedEndThicknessFactorMm: 0,
    structuralMinimumThicknessMm: 1.3,
    originalThicknessMm: 5.2,
    previousThicknessMm: 5.1,
    actualThicknessMm: 5,
    yearsInService: 19,
    yearsSincePreviousInspection: 8,
    nextInspectionYears: 5,
  });

  approximately(result.requiredThicknessMm, 0.28688597759306106);
  approximately(result.automaticMinimumThicknessMm, 1.3);
});

test("reproduces the HRSG header or drum pressure-thickness equation", () => {
  const result = calculateApi570Header({
    outsideDiameterMm: 406.4,
    designPressureMpa: 11.6,
    allowableStressMpa: 118,
    jointEfficiency: 1,
    yCoefficient: 0.4,
    structuralMinimumThicknessMm: 6,
    originalThicknessMm: 25,
    previousThicknessMm: 24,
    actualThicknessMm: 23,
    yearsInService: 19,
    yearsSincePreviousInspection: 8,
    nextInspectionYears: 5,
  });

  // t = PD/(2SE + 2yP)
  approximately(result.requiredThicknessMm, 19.219830397912588);
  approximately(result.automaticMinimumThicknessMm, 19.219830397912588);
  // LTCR=(original-current)/service years; STCR=(previous-current)/inspection years.
  approximately(result.longTermCorrosionRateMmPerYear, 0.10526315789473684);
  approximately(result.shortTermCorrosionRateMmPerYear, 0.125);
});

test("calculates drilled-header ligament efficiency from actual pitch and hole diameter", () => {
  const efficiency = calculateApi570LigamentEfficiency(92, 33.3);
  assert.notEqual(efficiency, null);
  approximately(efficiency ?? 0, 0.6380434782608696);

  const result = calculateApi570Header({
    outsideDiameterMm: 88.9,
    designPressureMpa: 11.6,
    allowableStressMpa: 118,
    ligamentPitchMm: 92,
    actualHoleDiameterMm: 33.3,
    yCoefficient: 0.4,
    originalThicknessMm: 12,
    previousThicknessMm: 11.5,
    actualThicknessMm: 11,
    yearsInService: 19,
    yearsSincePreviousInspection: 8,
    nextInspectionYears: 5,
  });

  assert.equal(result.ligamentEfficiencyCalculated, true);
  approximately(result.jointEfficiencyUsed, 0.6380434782608696);
  approximately(result.requiredThicknessMm, 6.450964713305809);

  const invalid = calculateApi570Header({
    outsideDiameterMm: 88.9,
    designPressureMpa: 11.6,
    allowableStressMpa: 118,
    ligamentPitchMm: 33.3,
    actualHoleDiameterMm: 33.3,
    yCoefficient: 0.4,
    originalThicknessMm: 12,
    previousThicknessMm: 11.5,
    actualThicknessMm: 11,
    yearsInService: 19,
    yearsSincePreviousInspection: 8,
    nextInspectionYears: 5,
  });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.issues.some((issue) => issue.code === "ligament-hole-not-less-than-pitch"));
});

test("reproduces the HRSG B31.1 pressure-thickness route and structural maximum", () => {
  const result = calculateApi570Piping({
    pipingCode: "b31.1",
    outsideDiameterMm: 114.3,
    designPressureMpa: 1.5,
    allowableStressMpa: 138,
    longitudinalQualityFactor: 1,
    weldStrengthReductionFactor: 1,
    yCoefficient: 0.4,
    allowanceMm: 0,
    structuralMinimumThicknessMm: 2.3,
    originalThicknessMm: 6,
    previousThicknessMm: 5.7,
    actualThicknessMm: 5.5,
    yearsInService: 19,
    yearsSincePreviousInspection: 8,
    nextInspectionYears: 5,
  });

  // t = PD/[2(SEW + yP)]
  approximately(result.pressureDesignThicknessMm, 0.6185064935064934);
  approximately(result.requiredThicknessMm, 0.6185064935064934);
  approximately(result.automaticMinimumThicknessMm, 2.3);
});

test("reproduces the HRSG hemispherical-head equation at full precision", () => {
  const result = calculateHemisphericalHead({
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
  });

  // t = PL/(2SE - 0.2P)
  approximately(result.requiredThicknessMm, 6.402048655569783);
  approximately(result.minimumThicknessUsedMm, 6.402048655569783);
  approximately(result.remainingLifeYears, 67.12822388878735);
});
