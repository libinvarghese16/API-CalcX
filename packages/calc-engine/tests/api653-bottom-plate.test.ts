import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi653BottomPlate } from "../src/index.ts";
import type { Api653BottomPlateInputSI } from "../src/index.ts";

const input: Api653BottomPlateInputSI = {
  originalThicknessMm: 8,
  previousThicknessMm: 7.4,
  bottomRemainingThicknessMm: 7,
  previousInternalPittingRemainingThicknessMm: 7.2,
  internalPittingRemainingThicknessMm: 6.8,
  minimumThicknessBasis: "table-4.4-standard",
  reducedMinimumCriteriaConfirmed: false,
  manualMinimumThicknessMm: 0,
  projectionYears: 10,
  undersideCorrosionRateMode: "auto",
  manualUndersideCorrosionRateMmPerYear: 0,
  topSideCorrosionRateMode: "auto",
  manualTopSideCorrosionRateMmPerYear: 0,
  lowerShellMinimumThicknessMm: 6,
  criticalZoneActualThicknessMm: 4,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
};

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("uses separate RTbc and RTip rates in the API 653 MRT projection", () => {
  const result = calculateApi653BottomPlate(input);

  assert.equal(result.ok, true);
  assert.equal(result.engineVersion, "0.2.0-api653-mrt");
  assert.equal(result.generalBottomAssessmentReady, true);
  approximately(result.undersideLongTermCorrosionRateMmPerYear, 0.05);
  approximately(result.undersideShortTermCorrosionRateMmPerYear, 0.08);
  approximately(result.automaticUndersideCorrosionRateMmPerYear, 0.08);
  approximately(result.topSideLongTermCorrosionRateMmPerYear, 0.06);
  approximately(result.topSideShortTermCorrosionRateMmPerYear, 0.08);
  approximately(result.automaticTopSideCorrosionRateMmPerYear, 0.08);
  approximately(result.combinedCorrosionRateMmPerYear, 0.16);
  approximately(result.governingThicknessMm, 6.8);
  approximately(result.projectedMinimumRemainingThicknessMm, 5.2);
  assert.equal(result.projectedMrtAdequate, true);
  approximately(result.remainingLifeYears, 26.625);
  assert.equal(result.remainingLifeOpenEnded, false);
});

test("supports controlled manual StPr and UPr without deriving a rate from current pit depth", () => {
  const result = calculateApi653BottomPlate({
    ...input,
    previousThicknessMm: 0,
    previousInternalPittingRemainingThicknessMm: 0,
    yearsInService: 0,
    yearsSincePreviousInspection: 0,
    undersideCorrosionRateMode: "manual",
    manualUndersideCorrosionRateMmPerYear: 0.05,
    topSideCorrosionRateMode: "manual",
    manualTopSideCorrosionRateMmPerYear: 0.03,
  });

  assert.equal(result.generalBottomAssessmentReady, true);
  approximately(result.combinedCorrosionRateMmPerYear, 0.08);
  approximately(result.projectedMinimumRemainingThicknessMm, 6);
  approximately(result.remainingLifeYears, 53.25);
});

test("blocks the reduced 1.27 mm route until its conditions are confirmed", () => {
  const blocked = calculateApi653BottomPlate({ ...input, minimumThicknessBasis: "table-4.4-reduced" });
  const confirmed = calculateApi653BottomPlate({ ...input, minimumThicknessBasis: "table-4.4-reduced", reducedMinimumCriteriaConfirmed: true });

  assert.equal(blocked.ok, false);
  assert.ok(blocked.issues.some((issue) => issue.code === "reduced-bottom-minimum-not-confirmed"));
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.minimumThicknessMmUsed, 1.27);
});

test("assesses the critical zone separately from the general MRT route", () => {
  const result = calculateApi653BottomPlate({ ...input, criticalZoneActualThicknessMm: 2.8 });

  assert.equal(result.generalBottomAssessmentReady, true);
  approximately(result.remainingLifeYears, 26.625);
  assert.equal(result.criticalZoneAssessmentComplete, true);
  assert.equal(result.criticalZoneMinimumThicknessMm, 3);
  assert.equal(result.criticalZoneAdequate, false);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "critical-zone-below-minimum"));
});

test("uses only the valid long-term StPr route when comparable previous pitting data is unavailable", () => {
  const result = calculateApi653BottomPlate({ ...input, previousInternalPittingRemainingThicknessMm: 0 });

  assert.equal(result.generalBottomAssessmentReady, true);
  approximately(result.topSideShortTermCorrosionRateMmPerYear, 0);
  approximately(result.topSideCorrosionRateMmPerYear, 0.06);
  assert.ok(result.issues.some((issue) => issue.code === "top-side-short-term-basis-unavailable"));
});

test("does not manufacture automatic corrosion rates without a valid history basis", () => {
  const result = calculateApi653BottomPlate({
    ...input,
    previousThicknessMm: 0,
    previousInternalPittingRemainingThicknessMm: 0,
    yearsInService: 0,
    yearsSincePreviousInspection: 0,
  });

  assert.equal(result.generalBottomAssessmentReady, false);
  assert.equal(result.remainingLifeYears, 0);
  assert.ok(result.issues.some((issue) => issue.code === "underside-rate-basis-required"));
  assert.ok(result.issues.some((issue) => issue.code === "top-side-rate-basis-required"));
});

test("keeps general bottom life available when the separate critical-zone assessment is incomplete", () => {
  const result = calculateApi653BottomPlate({ ...input, lowerShellMinimumThicknessMm: 0, criticalZoneActualThicknessMm: 0 });

  assert.equal(result.ok, true);
  assert.equal(result.generalBottomAssessmentReady, true);
  assert.equal(result.criticalZoneAssessmentComplete, false);
  approximately(result.remainingLifeYears, 26.625);
  assert.ok(result.issues.some((issue) => issue.code === "critical-zone-assessment-incomplete"));
});

test("reports zero-corrosion remaining life as open-ended instead of zero years", () => {
  const result = calculateApi653BottomPlate({
    ...input,
    originalThicknessMm: 7,
    previousThicknessMm: 7,
    bottomRemainingThicknessMm: 7,
    previousInternalPittingRemainingThicknessMm: 7,
    internalPittingRemainingThicknessMm: 7,
  });

  assert.equal(result.generalBottomAssessmentReady, true);
  assert.equal(result.remainingLifeOpenEnded, true);
  assert.equal(result.remainingLifeYears, Number.POSITIVE_INFINITY);
  approximately(result.projectedMinimumRemainingThicknessMm, 7);
});
