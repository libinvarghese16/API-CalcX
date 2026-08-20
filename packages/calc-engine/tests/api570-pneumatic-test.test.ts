import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570PneumaticTest, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected Metric Pneumatic Test Pressure golden result", () => {
  const result = calculateApi570PneumaticTest({ designPressureMpa: 2.5 });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.pneumatic-test-pressure");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.designPressureMpaUsed, 2.5);
  approximately(result.pneumaticTestPressureMpa, 2.75);
});

test("produces the same SI result from the protected equivalent U.S. pressure input", () => {
  const result = calculateApi570PneumaticTest({
    designPressureMpa: convertUnitToSI(362.594344, "pressure", "psi"),
  });

  approximately(result.designPressureMpaUsed, 2.5, 1e-8);
  approximately(result.pneumaticTestPressureMpa, 2.75, 1e-8);
});

test("produces the same SI result from the protected equivalent bar input", () => {
  const result = calculateApi570PneumaticTest({
    designPressureMpa: convertUnitToSI(25, "pressure", "Bar"),
  });

  approximately(result.pneumaticTestPressureMpa, 2.75);
});

test("preserves the protected zero-output behavior while flagging zero input", () => {
  const result = calculateApi570PneumaticTest({ designPressureMpa: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.pneumaticTestPressureMpa, 0);
  assert.ok(result.issues.some((issue) => issue.field === "designPressureMpa" && issue.severity === "error"));
});

test("blocks negative and non-finite pressure values", () => {
  for (const designPressureMpa of [-2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = calculateApi570PneumaticTest({ designPressureMpa });
    assert.equal(result.ok, false);
    assert.equal(result.pneumaticTestPressureMpa, 0);
    assert.ok(result.issues.some((issue) => issue.code === "positive-value-required"));
  }
});
