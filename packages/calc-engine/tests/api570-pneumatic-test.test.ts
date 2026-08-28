import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570PneumaticTest, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("calculates the fixed ASME B31.3 pneumatic-test factor", () => {
  const result = calculateApi570PneumaticTest({ pipingCode: "asme-b31.3", designPressureMpa: 2.5 });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.pneumatic-test-pressure");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.designPressureMpaUsed, 2.5);
  assert.equal(result.testFactorUsed, 1.1);
  approximately(result.minimumPneumaticTestPressureMpa, 2.75);
  approximately(result.maximumPneumaticTestPressureMpa, 2.75);
  approximately(result.pneumaticTestPressureMpa, 2.75);
});

test("produces the same SI result from the protected equivalent U.S. pressure input", () => {
  const result = calculateApi570PneumaticTest({
    pipingCode: "asme-b31.3",
    designPressureMpa: convertUnitToSI(362.594344, "pressure", "psi"),
  });

  approximately(result.designPressureMpaUsed, 2.5, 1e-8);
  approximately(result.pneumaticTestPressureMpa, 2.75, 1e-8);
});

test("produces the same SI result from the protected equivalent bar input", () => {
  const result = calculateApi570PneumaticTest({
    pipingCode: "asme-b31.3",
    designPressureMpa: convertUnitToSI(25, "pressure", "Bar"),
  });

  approximately(result.pneumaticTestPressureMpa, 2.75);
});

test("returns the selected ASME B31.1 pressure within its controlled factor range", () => {
  const result = calculateApi570PneumaticTest({ pipingCode: "asme-b31.1", designPressureMpa: 2.5, testFactor: 1.2 });

  assert.equal(result.ok, true);
  approximately(result.pneumaticTestPressureMpa, 3);
  approximately(result.minimumPneumaticTestPressureMpa, 3);
  approximately(result.maximumPneumaticTestPressureMpa, 3.75);
});

test("blocks an ASME B31.1 factor outside 1.20 through 1.50", () => {
  const result = calculateApi570PneumaticTest({ pipingCode: "asme-b31.1", designPressureMpa: 2.5, testFactor: 1.1 });

  assert.equal(result.ok, false);
  assert.equal(result.pneumaticTestPressureMpa, 0);
  assert.ok(result.issues.some((issue) => issue.code === "b31.1-test-factor-out-of-range"));
});

test("marks a manually controlled project factor for engineering review", () => {
  const result = calculateApi570PneumaticTest({ pipingCode: "manual-controlled", designPressureMpa: 2.5, testFactor: 1.25 });

  assert.equal(result.ok, true);
  approximately(result.pneumaticTestPressureMpa, 3.125);
  assert.ok(result.issues.some((issue) => issue.code === "manual-code-basis" && issue.severity === "warning"));
});

test("preserves zero output while flagging zero input", () => {
  const result = calculateApi570PneumaticTest({ pipingCode: "asme-b31.3", designPressureMpa: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.pneumaticTestPressureMpa, 0);
  assert.ok(result.issues.some((issue) => issue.field === "designPressureMpa" && issue.severity === "error"));
});

test("blocks negative and non-finite pressure values", () => {
  for (const designPressureMpa of [-2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = calculateApi570PneumaticTest({ pipingCode: "asme-b31.3", designPressureMpa });
    assert.equal(result.ok, false);
    assert.equal(result.pneumaticTestPressureMpa, 0);
    assert.ok(result.issues.some((issue) => issue.code === "positive-value-required"));
  }
});
