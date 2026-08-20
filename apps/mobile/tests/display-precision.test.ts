import assert from "node:assert/strict";
import test from "node:test";

import {
  CORROSION_RATE_DECIMALS,
  STANDARD_RESULT_DECIMALS,
  displayDecimals,
  formatDisplayNumber,
} from "../src/display-precision.ts";

test("standard engineering results use two decimal places", () => {
  assert.equal(STANDARD_RESULT_DECIMALS, 2);
  assert.equal(displayDecimals(), 2);
  assert.equal(formatDisplayNumber(12.3456), "12.35");
  assert.equal(formatDisplayNumber(2), "2.00");
});

test("corrosion rates use three decimal places", () => {
  assert.equal(CORROSION_RATE_DECIMALS, 3);
  assert.equal(displayDecimals("corrosion-rate"), 3);
  assert.equal(formatDisplayNumber(0.1236, "corrosion-rate"), "0.124");
  assert.equal(formatDisplayNumber(0.14, "corrosion-rate"), "0.140");
});

test("non-finite values use the standard unavailable marker", () => {
  assert.equal(formatDisplayNumber(Number.NaN), "—");
  assert.equal(formatDisplayNumber(Number.POSITIVE_INFINITY, "corrosion-rate"), "—");
});
