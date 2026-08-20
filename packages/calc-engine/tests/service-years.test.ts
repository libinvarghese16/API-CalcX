import assert from "node:assert/strict";
import test from "node:test";

import { deriveYearsInService, deriveYearsSincePreviousInspection } from "../src/index.ts";

test("derives years in service from build year and current year", () => {
  const result = deriveYearsInService(2006, 2026);

  assert.equal(result.valid, true);
  assert.equal(result.yearsInService, 20);
  assert.equal(result.message, null);
});

test("allows equipment built in the current year", () => {
  const result = deriveYearsInService(2026, 2026);

  assert.equal(result.valid, true);
  assert.equal(result.yearsInService, 0);
});

test("rejects a future build year", () => {
  const result = deriveYearsInService(2027, 2026);

  assert.equal(result.valid, false);
  assert.equal(result.yearsInService, null);
  assert.equal(result.message, "Build year cannot be later than 2026.");
});

test("rejects incomplete and out-of-range build years", () => {
  assert.equal(deriveYearsInService(26, 2026).valid, false);
  assert.equal(deriveYearsInService(2006.5, 2026).valid, false);
  assert.equal(deriveYearsInService(Number.NaN, 2026).valid, false);
});

test("derives years since the previous inspection", () => {
  const result = deriveYearsSincePreviousInspection(2021, 2006, 2026);

  assert.equal(result.valid, true);
  assert.equal(result.yearsSincePreviousInspection, 5);
});

test("allows a previous inspection in the current year", () => {
  const result = deriveYearsSincePreviousInspection(2026, 2006, 2026);

  assert.equal(result.valid, true);
  assert.equal(result.yearsSincePreviousInspection, 0);
});

test("rejects a previous inspection before the build year", () => {
  const result = deriveYearsSincePreviousInspection(2005, 2006, 2026);

  assert.equal(result.valid, false);
  assert.equal(result.yearsSincePreviousInspection, null);
  assert.equal(result.message, "Previous inspection year cannot be earlier than the build year.");
});

test("rejects a future previous-inspection year", () => {
  const result = deriveYearsSincePreviousInspection(2027, 2006, 2026);

  assert.equal(result.valid, false);
  assert.equal(result.message, "Previous inspection year cannot be later than 2026.");
});

test("rejects incomplete previous-inspection years", () => {
  assert.equal(deriveYearsSincePreviousInspection(21, 2006, 2026).valid, false);
  assert.equal(deriveYearsSincePreviousInspection(2021.5, 2006, 2026).valid, false);
  assert.equal(deriveYearsSincePreviousInspection(Number.NaN, 2006, 2026).valid, false);
});
