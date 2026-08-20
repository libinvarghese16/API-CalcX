import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570TensionTest, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-10): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const goldenInput = {
  turnedSpecimenRadiusMm: 6,
  turnedSpecimenDiameterMm: 10,
  reducedSpecimenWidthMm: 12.5,
  reducedSpecimenThicknessMm: 6,
  manualAreaMm2: 80,
  testLoadKn: 40,
  targetTensileStrengthMpa: 450,
} as const;

test("matches the protected automatic Tension Test golden result", () => {
  const result = calculateApi570TensionTest({ ...goldenInput, areaSource: "auto" });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.tension-test");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.turnedSpecimenAreaMm2, Math.PI * 36);
  assert.equal(result.reducedSpecimenAreaMm2, 75);
  assert.equal(result.selectedAreaMm2, 80);
  assert.equal(result.resolvedAreaSource, "manual");
  assert.equal(result.tensileStrengthMpa, 500);
  assert.equal(result.requiredLoadKn, 36);
});

test("preserves all explicit area-source results without fallback", () => {
  const tsa = calculateApi570TensionTest({ ...goldenInput, areaSource: "tsa" });
  const rsa = calculateApi570TensionTest({ ...goldenInput, areaSource: "rsa" });
  const manual = calculateApi570TensionTest({ ...goldenInput, areaSource: "manual" });

  approximately(tsa.selectedAreaMm2, Math.PI * 36);
  approximately(tsa.tensileStrengthMpa, 353.67765131532297);
  approximately(tsa.requiredLoadKn, 50.893800988154645);
  assert.equal(rsa.selectedAreaMm2, 75);
  approximately(rsa.tensileStrengthMpa, 533.3333333333334);
  assert.equal(rsa.requiredLoadKn, 33.75);
  assert.equal(manual.selectedAreaMm2, 80);
  assert.equal(manual.tensileStrengthMpa, 500);
});

test("preserves automatic Manual then RSA then TSA precedence", () => {
  const manual = calculateApi570TensionTest({ ...goldenInput, areaSource: "auto" });
  const rsa = calculateApi570TensionTest({ ...goldenInput, manualAreaMm2: 0, areaSource: "auto" });
  const tsa = calculateApi570TensionTest({ ...goldenInput, manualAreaMm2: 0, reducedSpecimenWidthMm: 0, areaSource: "auto" });

  assert.equal(manual.resolvedAreaSource, "manual");
  assert.equal(rsa.resolvedAreaSource, "rsa");
  assert.equal(rsa.selectedAreaMm2, 75);
  assert.equal(tsa.resolvedAreaSource, "tsa");
  approximately(tsa.selectedAreaMm2, Math.PI * 36);
});

test("uses radius before diameter and diameter only as the fallback", () => {
  const radius = calculateApi570TensionTest({ ...goldenInput, areaSource: "tsa" });
  const diameter = calculateApi570TensionTest({ ...goldenInput, turnedSpecimenRadiusMm: 0, areaSource: "tsa" });

  assert.equal(radius.effectiveTurnedRadiusSource, "radius");
  assert.equal(radius.effectiveTurnedRadiusMm, 6);
  assert.equal(diameter.effectiveTurnedRadiusSource, "diameter");
  assert.equal(diameter.effectiveTurnedRadiusMm, 5);
  approximately(diameter.turnedSpecimenAreaMm2, Math.PI * 25);
});

test("reproduces the golden result from equivalent U.S. customary inputs", () => {
  const length = (value: number) => convertUnitToSI(value, "length", "in");
  const result = calculateApi570TensionTest({
    turnedSpecimenRadiusMm: length(0.236220472),
    turnedSpecimenDiameterMm: length(0.393700787),
    reducedSpecimenWidthMm: length(0.492125984),
    reducedSpecimenThicknessMm: length(0.236220472),
    manualAreaMm2: convertUnitToSI(0.124000248, "area", "in2"),
    areaSource: "auto",
    testLoadKn: convertUnitToSI(8992.357, "force", "lbf"),
    targetTensileStrengthMpa: convertUnitToSI(65266.982, "pressure", "psi"),
  });

  approximately(result.selectedAreaMm2, 80, 1e-5);
  approximately(result.tensileStrengthMpa, 500, 1e-4);
  approximately(result.requiredLoadKn, 36, 1e-5);
});

test("keeps an explicitly selected missing area at zero", () => {
  const result = calculateApi570TensionTest({
    turnedSpecimenDiameterMm: 10,
    manualAreaMm2: 0,
    areaSource: "manual",
    testLoadKn: 40,
    targetTensileStrengthMpa: 450,
  });

  assert.equal(result.ok, true);
  assert.equal(result.selectedAreaMm2, 0);
  assert.equal(result.resolvedAreaSource, "none");
  assert.equal(result.tensileStrengthMpa, 0);
  assert.equal(result.requiredLoadKn, 0);
  assert.ok(result.issues.some((issue) => issue.code === "selected-area-unavailable"));
});

test("preserves protected blank and zero output behavior", () => {
  const result = calculateApi570TensionTest({ areaSource: "auto" });

  assert.equal(result.ok, true);
  assert.equal(result.turnedSpecimenAreaMm2, 0);
  assert.equal(result.reducedSpecimenAreaMm2, 0);
  assert.equal(result.selectedAreaMm2, 0);
  assert.equal(result.tensileStrengthMpa, 0);
  assert.equal(result.requiredLoadKn, 0);
});

test("blocks negative and non-finite values without negative outputs", () => {
  const result = calculateApi570TensionTest({
    turnedSpecimenRadiusMm: -6,
    turnedSpecimenDiameterMm: Number.NaN,
    reducedSpecimenWidthMm: -12.5,
    reducedSpecimenThicknessMm: Number.POSITIVE_INFINITY,
    manualAreaMm2: -80,
    areaSource: "auto",
    testLoadKn: -40,
    targetTensileStrengthMpa: -450,
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 7);
  assert.equal(result.selectedAreaMm2, 0);
  assert.equal(result.tensileStrengthMpa, 0);
  assert.equal(result.requiredLoadKn, 0);
});
