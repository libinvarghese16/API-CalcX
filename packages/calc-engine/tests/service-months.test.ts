import test from "node:test";
import assert from "node:assert/strict";
import { deriveYearsInService, deriveYearsSincePreviousInspection } from "../src/shared/service-years.ts";

test("unspecified months preserve every historical year-only result", () => {
  for (let year = 1900; year <= 2026; year++) {
    assert.equal(deriveYearsInService(year, 2026).yearsInService, 2026 - year);
    assert.equal(deriveYearsSincePreviousInspection(year, 1900, 2026).yearsSincePreviousInspection, 2026 - year);
  }
});
test("month precision is elapsed calendar months divided by twelve", () => {
  assert.equal(deriveYearsInService(2006, 2026, 2, 11).yearsInService, 20.75);
  assert.equal(deriveYearsSincePreviousInspection(2024, 2006, 2026, { buildMonth: 2, previousInspectionMonth: 2, asOfMonth: 11 }).yearsSincePreviousInspection, 2.75);
});
test("same-year inspection uses months and never divides by a whole-year zero", () => {
  assert.equal(deriveYearsSincePreviousInspection(2026, 2006, 2026, { previousInspectionMonth: 2, asOfMonth: 11 }).yearsSincePreviousInspection, .75);
});
test("reversed months and future dates are rejected", () => {
  assert.equal(deriveYearsInService(2026, 2026, 12, 11).valid, false);
  assert.equal(deriveYearsSincePreviousInspection(2026, 2006, 2026, { previousInspectionMonth: 12, asOfMonth: 11 }).valid, false);
  assert.equal(deriveYearsSincePreviousInspection(2026, 2026, 2026, { buildMonth: 6, previousInspectionMonth: 2, asOfMonth: 11 }).valid, false);
  for (const bad of [0,13,1.5,NaN,Infinity]) assert.equal(deriveYearsInService(2006, 2026, bad, 11).valid, false);
});
test("unknown build month does not prevent a known inspection month", () => {
  assert.equal(deriveYearsSincePreviousInspection(2024, 2006, 2026, { previousInspectionMonth: 2, asOfMonth: 11 }).yearsSincePreviousInspection, 2.75);
});
