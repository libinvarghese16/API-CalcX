import test from "node:test";
import assert from "node:assert/strict";
import { calculateApi653PostRepairLife } from "../src/api653/post-repair-bottom.ts";
import { calculateApi653BottomPlate } from "../src/api653/bottom-plate.ts";

const base = { remainingThickness: 3.72, minimumThickness: 2.54, longRate: 0.19, shortRate: 1.1 / 2.68, topRate: 0 };
const close = (actual: number | null, expected: number) => assert.ok(actual !== null && Math.abs(actual - expected) < 1e-10);
test("higher short-term rate remains governing after patch installation", () => {
  const r = calculateApi653PostRepairLife(base);
  close(r.governingRate, 0.41044776119402987);
  close(r.remainingLife, 2.874909090909091);
  assert.equal(r.selected, "Short-term");
});
test("long-term rate governs when greater", () => {
  const r = calculateApi653PostRepairLife({ ...base, shortRate: 0.1 });
  close(r.remainingLife, 6.210526315789474);
  assert.equal(r.selected, "Long-term");
});
test("changing after-repair thickness never resets either rate", () => {
  for (const remainingThickness of [2.5, 3.72, 4]) {
    const r = calculateApi653PostRepairLife({ ...base, remainingThickness });
    close(r.governingRate, base.shortRate);
    close(r.remainingLife, Math.max(0, (remainingThickness - 2.54) / base.shortRate));
  }
});
test("product-side rate is added separately", () => {
  close(calculateApi653PostRepairLife({ ...base, topRate: 0.1 }).remainingLife, 1.18 / (base.shortRate + 0.1));
});
test("missing history is distinct from a supported zero rate", () => {
  assert.equal(calculateApi653PostRepairLife({ ...base, longRate: null, shortRate: null }).remainingLife, null);
  assert.equal(calculateApi653PostRepairLife({ ...base, longRate: 0, shortRate: null }).remainingLife, Infinity);
  close(calculateApi653PostRepairLife({ ...base, longRate: null }).remainingLife, 2.874909090909091);
});
test("blank, invalid and negative inputs do not produce a life", () => {
  for (const remainingThickness of ["", "bad", -1, Infinity]) assert.equal(calculateApi653PostRepairLife({ ...base, remainingThickness }).remainingLife, null);
  for (const shortRate of [-1, NaN, Infinity]) assert.equal(calculateApi653PostRepairLife({ ...base, shortRate }).remainingLife, null);
  assert.equal(calculateApi653PostRepairLife({ ...base, minimumThickness: 0 }).remainingLife, null);
});
test("no thickness margin returns zero even with zero corrosion", () => {
  close(calculateApi653PostRepairLife({ ...base, remainingThickness: 2.54, longRate: 0, shortRate: 0 }).remainingLife, 0);
});
test("simple repair life matches the existing bottom equation at the governing rate", () => {
  for (const topRate of [0, 0.1]) {
    const existing = calculateApi653BottomPlate({ originalThicknessMm: 6, previousThicknessMm: 0, bottomRemainingThicknessMm: 3.72, previousInternalPittingDepthMm: 0, currentInternalPittingDepthMm: 2.28, minimumThicknessBasis: "table-4.4-standard", reducedMinimumCriteriaConfirmed: false, manualMinimumThicknessMm: 0, projectionYears: 6, undersideCorrosionRateMode: "manual", manualUndersideCorrosionRateMmPerYear: base.shortRate, topSideCorrosionRateMode: "manual", manualTopSideCorrosionRateMmPerYear: topRate, lowerShellMinimumThicknessMm: 0, criticalZoneActualThicknessMm: 0, yearsInService: 12, yearsSincePreviousInspection: 0 });
    close(calculateApi653PostRepairLife({ ...base, topRate }).remainingLife, existing.remainingLifeYears);
  }
});
