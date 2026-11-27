import test from "node:test";
import assert from "node:assert/strict";
import { calculateApi653PostRepairLife, calculateApi653BottomInterval, convertApi653MflLoss } from "../src/api653/post-repair-bottom.ts";
import { calculateApi653BottomPlate } from "../src/api653/bottom-plate.ts";
const close = (actual: number | null, expected: number) => assert.ok(actual !== null && Math.abs(actual - expected) < 1e-10, String(actual));
const basis = { minimumThickness: 2.54, longRate: 0.19, shortRate: 1.1 / 2.68, topRate: 0 };

test("MFL metal loss converts 38% and 59% of 6 mm to remaining thickness", () => {
  close(convertApi653MflLoss(6, 38).lossMm, 2.28);
  close(convertApi653MflLoss(6, 38).remainingMm, 3.72);
  close(convertApi653MflLoss(6, 59).remainingMm, 2.46);
});
test("MFL zero and complete loss are valid endpoints", () => {
  close(convertApi653MflLoss(6, 0).remainingMm, 6);
  const remainingThickness = convertApi653MflLoss(6, 100).remainingMm;
  close(remainingThickness, 0);
  close(calculateApi653PostRepairLife({ ...basis, remainingThickness }).remainingLife, 0);
});
test("invalid MFL values never return a converted thickness", () => {
  for (const percent of ["", -1, 101, NaN, Infinity, "abc"]) assert.equal(convertApi653MflLoss(6, percent).remainingMm, null);
  for (const original of ["", 0, -1, NaN]) assert.equal(convertApi653MflLoss(original, 38).remainingMm, null);
});
test("six-year required thickness uses the historical maximum after MFL conversion", () => {
  const r = calculateApi653BottomInterval({ ...basis, years: 6, currentThickness: convertApi653MflLoss(6, 38).remainingMm });
  close(r.requiredThickness, 5.002686567164179);
  close(r.projectedThickness, 1.257313432835821);
  assert.equal(r.adequate, false);
});
test("required thickness can be calculated without a current thickness", () => {
  const r = calculateApi653BottomInterval({ ...basis, years: 6 });
  close(r.requiredThickness, 5.002686567164179);
  assert.equal(r.adequate, null);
  assert.equal(r.projectedThickness, null);
});
test("interval validation, zero interval and zero corrosion are handled separately", () => {
  for (const years of ["", -1, NaN, Infinity]) assert.equal(calculateApi653BottomInterval({ ...basis, years }).requiredThickness, null);
  close(calculateApi653BottomInterval({ ...basis, years: 0 }).requiredThickness, 2.54);
  close(calculateApi653BottomInterval({ ...basis, longRate: 0, shortRate: 0, years: 6 }).requiredThickness, 2.54);
  assert.equal(calculateApi653BottomInterval({ ...basis, longRate: null, shortRate: null, years: 6 }).requiredThickness, null);
});
test("top-side corrosion is included and minimum plus future loss reverses the existing MRT equation", () => {
  const input = { ...basis, topRate: 0.1, years: 6, currentThickness: 6 };
  const r = calculateApi653BottomInterval(input);
  close(r.requiredThickness, 5.602686567164179);
  assert.equal(r.adequate, true);
  const existing = calculateApi653BottomPlate({ originalThicknessMm: 6, previousThicknessMm: 0, bottomRemainingThicknessMm: r.requiredThickness!, previousInternalPittingDepthMm: 0, currentInternalPittingDepthMm: 0, minimumThicknessBasis: "table-4.4-standard", reducedMinimumCriteriaConfirmed: false, manualMinimumThicknessMm: 0, projectionYears: 6, undersideCorrosionRateMode: "manual", manualUndersideCorrosionRateMmPerYear: basis.shortRate, topSideCorrosionRateMode: "manual", manualTopSideCorrosionRateMmPerYear: 0.1, lowerShellMinimumThicknessMm: 0, criticalZoneActualThicknessMm: 0, yearsInService: 12, yearsSincePreviousInspection: 0 });
  close(existing.projectedMinimumRemainingThicknessMm, 2.54);
});
