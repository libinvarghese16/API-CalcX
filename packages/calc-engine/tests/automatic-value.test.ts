import assert from "node:assert/strict";
import test from "node:test";

import { resolveAutomaticNumericValue } from "../src/index.ts";

test("uses the calculated value while automatic mode is active", () => {
  assert.deepEqual(resolveAutomaticNumericValue("auto", 138, 125), {
    mode: "auto",
    value: 138,
    valid: true,
  });
});

test("uses the entered value while manual mode is active", () => {
  assert.deepEqual(resolveAutomaticNumericValue("manual", 138, 125), {
    mode: "manual",
    value: 125,
    valid: true,
  });
});

test("marks missing automatic and invalid manual values as invalid", () => {
  assert.equal(resolveAutomaticNumericValue("auto", null, 125).valid, false);
  assert.equal(resolveAutomaticNumericValue("manual", 138, Number.NaN).valid, false);
});
