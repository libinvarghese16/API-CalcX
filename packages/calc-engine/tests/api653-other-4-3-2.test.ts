import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi653Other432, convertUnitToSI } from "../src/index.ts";
import type { Api653Other432InputSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-10): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const goldenInput: Api653Other432InputSI = {
  diameterM: 30,
  leastThicknessMm: 8,
  minimumRequiredThicknessMm: 6,
  corrosionAllowanceMm: 1,
  profileThicknessesMm: [8, 8, 7.5, 8.5, 8],
  deepestPitRemainingThicknessMm: null,
  pitDimensionSumMm: null,
  criticalLengthMode: "auto",
  manualCriticalLengthMm: 0,
  averageThicknessMode: "auto",
  manualAverageThicknessMm: 0,
  adjustedMinimumMode: "auto",
  manualAdjustedMinimumMm: 0,
  adjustedSixtyPercentMode: "auto",
  manualAdjustedSixtyPercentMm: 0,
};

test("matches the protected API 653 Other 4.3.2 golden pass with optional pit screening", () => {
  const result = calculateApi653Other432(goldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api653.other-4-3-2");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.automaticCriticalLengthRawMm, 34 * Math.sqrt(30 * 8));
  approximately(result.criticalLengthMmUsed, 34 * Math.sqrt(30 * 8));
  approximately(result.averageThicknessMmUsed, 8);
  approximately(result.adjustedMinimumMmUsed, 7);
  approximately(result.adjustedSixtyPercentMmUsed, 4.6);
  assert.equal(result.check1Status, "pass");
  assert.equal(result.check2Status, "pass");
  assert.equal(result.pitStatus, "optional");
  assert.equal(result.overallStatus, "pass");
});

test("preserves the protected 1000 mm critical-length cap", () => {
  const result = calculateApi653Other432({ ...goldenInput, diameterM: 1500, leastThicknessMm: 1 });

  approximately(result.automaticCriticalLengthRawMm, 34 * Math.sqrt(1500));
  assert.equal(result.automaticCriticalLengthMm, 1000);
  assert.equal(result.criticalLengthMmUsed, 1000);
  assert.equal(result.criticalLengthCapApplied, true);
});

test("passes both pit clauses exactly at the protected equality boundaries", () => {
  const result = calculateApi653Other432({ ...goldenInput, deepestPitRemainingThicknessMm: 3, pitDimensionSumMm: 50 });

  assert.equal(result.pitCheckAPass, true);
  assert.equal(result.pitCheckBPass, true);
  assert.equal(result.pitStatus, "pass");
  assert.equal(result.overallStatus, "pass");
});

test("fails the core and pit routes below their protected limits", () => {
  const result = calculateApi653Other432({
    ...goldenInput,
    leastThicknessMm: 1,
    profileThicknessesMm: [6, 6, 6, 6, 6],
    deepestPitRemainingThicknessMm: 2.99,
    pitDimensionSumMm: 50.01,
  });

  assert.equal(result.check1Status, "fail");
  assert.equal(result.check2Status, "fail");
  assert.equal(result.pitStatus, "fail");
  assert.equal(result.overallStatus, "fail");
});

test("keeps partial pit input pending without blocking a passing protected core screen", () => {
  const result = calculateApi653Other432({ ...goldenInput, deepestPitRemainingThicknessMm: 3 });

  assert.equal(result.pitStatus, "pending");
  assert.equal(result.overallStatus, "pass");
  assert.ok(result.issues.some((issue) => issue.code === "pit-screen-incomplete" && issue.severity === "warning"));
});

test("normalizes equivalent mixed-unit field entries before the SI engine", () => {
  const result = calculateApi653Other432({
    ...goldenInput,
    diameterM: convertUnitToSI(98.4251968503937, "length", "ft") / 1000,
    leastThicknessMm: convertUnitToSI(0.31496062992126, "length", "in"),
    corrosionAllowanceMm: convertUnitToSI(0.1, "length", "cm"),
    profileThicknessesMm: [0.8, 0.8, 0.75, 0.85, 0.8].map((value) => convertUnitToSI(value, "length", "cm")),
  });

  approximately(result.criticalLengthMmUsed, 34 * Math.sqrt(30 * 8), 1e-9);
  approximately(result.averageThicknessMmUsed, 8, 1e-9);
  assert.equal(result.overallStatus, "pass");
});

test("uses manual overrides in acceptance checks while retaining automatic recommendations", () => {
  const result = calculateApi653Other432({
    ...goldenInput,
    criticalLengthMode: "manual",
    manualCriticalLengthMm: 500,
    averageThicknessMode: "manual",
    manualAverageThicknessMm: 6.9,
    adjustedMinimumMode: "manual",
    manualAdjustedMinimumMm: 6.8,
    adjustedSixtyPercentMode: "manual",
    manualAdjustedSixtyPercentMm: 8.1,
  });

  assert.equal(result.criticalLengthMmUsed, 500);
  assert.equal(result.automaticCriticalLengthMm > 500, true);
  assert.equal(result.averageThicknessMmUsed, 6.9);
  assert.equal(result.automaticAverageThicknessMm, 8);
  assert.equal(result.check1Status, "pass");
  assert.equal(result.check2Status, "fail");
  assert.equal(result.overallStatus, "fail");
});

test("reports incomplete profiles and invalid manual override values", () => {
  const result = calculateApi653Other432({ ...goldenInput, profileThicknessesMm: [8, 8, 8, 8], averageThicknessMode: "manual", manualAverageThicknessMm: 0 });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "five-profile-points-required"));
  assert.ok(result.issues.some((issue) => issue.field === "manualAverageThicknessMm"));
});
