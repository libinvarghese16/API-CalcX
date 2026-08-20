import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi570FilletWeld, convertUnitToSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("matches the protected Metric Fillet Weld Sizing golden result", () => {
  const result = calculateApi570FilletWeld({
    knownThroatMm: 5,
    knownLegMm: 8,
    pipeThicknessMm: 10,
    hubThicknessMm: 12,
    branchThicknessMm: 10,
  });

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api570.support.fillet-weld-sizing");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  approximately(result.legFromThroatMm, 7.07);
  approximately(result.throatFromLegMm, 5.656);
  approximately(result.slipOnFlangeXminMm, 12);
  approximately(result.branchThroatTcMm, 6);
  assert.equal(result.slipOnFlangeXminSource, "hub-thickness");
  assert.equal(result.branchThroatCappedAt6Mm, true);
});

test("reproduces the golden result from equivalent inch inputs", () => {
  const inch = (value: number) => convertUnitToSI(value, "length", "in");
  const result = calculateApi570FilletWeld({
    knownThroatMm: inch(0.196850394),
    knownLegMm: inch(0.31496063),
    pipeThicknessMm: inch(0.393700787),
    hubThicknessMm: inch(0.472440945),
    branchThicknessMm: inch(0.393700787),
  });

  approximately(result.legFromThroatMm, 7.07, 1e-7);
  approximately(result.throatFromLegMm, 5.656, 1e-7);
  approximately(result.slipOnFlangeXminMm, 12, 1e-7);
  approximately(result.branchThroatTcMm, 6, 1e-7);
});

test("keeps the known-throat and known-leg routes independent", () => {
  const throatOnly = calculateApi570FilletWeld({ knownThroatMm: 5 });
  const legOnly = calculateApi570FilletWeld({ knownLegMm: 8 });

  approximately(throatOnly.legFromThroatMm, 7.07);
  assert.equal(throatOnly.throatFromLegMm, 0);
  approximately(legOnly.throatFromLegMm, 5.656);
  assert.equal(legOnly.legFromThroatMm, 0);
});

test("uses the lesser positive Xmin candidate and supports either candidate alone", () => {
  const pipeGoverns = calculateApi570FilletWeld({ pipeThicknessMm: 10, hubThicknessMm: 20 });
  const pipeOnly = calculateApi570FilletWeld({ pipeThicknessMm: 10 });
  const hubOnly = calculateApi570FilletWeld({ hubThicknessMm: 12 });
  const equal = calculateApi570FilletWeld({ pipeThicknessMm: 10, hubThicknessMm: 14 });

  assert.equal(pipeGoverns.slipOnFlangeXminMm, 14);
  assert.equal(pipeGoverns.slipOnFlangeXminSource, "pipe-thickness");
  assert.equal(pipeOnly.slipOnFlangeXminMm, 14);
  assert.equal(hubOnly.slipOnFlangeXminMm, 12);
  assert.equal(equal.slipOnFlangeXminSource, "equal");
});

test("preserves the 6 mm branch-throat cap and its lower boundary", () => {
  const belowCap = calculateApi570FilletWeld({ branchThicknessMm: 8 });
  const atCap = calculateApi570FilletWeld({ branchThicknessMm: 6 / 0.7 });
  const aboveCap = calculateApi570FilletWeld({ branchThicknessMm: 10 });

  approximately(belowCap.branchThroatTcMm, 5.6);
  assert.equal(belowCap.branchThroatCappedAt6Mm, false);
  approximately(atCap.branchThroatTcMm, 6);
  assert.equal(atCap.branchThroatCappedAt6Mm, false);
  assert.equal(aboveCap.branchThroatTcMm, 6);
  assert.equal(aboveCap.branchThroatCappedAt6Mm, true);
});

test("preserves protected blank and zero behavior", () => {
  const result = calculateApi570FilletWeld({});

  assert.equal(result.ok, true);
  assert.equal(result.legFromThroatMm, 0);
  assert.equal(result.throatFromLegMm, 0);
  assert.equal(result.slipOnFlangeXminMm, 0);
  assert.equal(result.slipOnFlangeXminSource, "none");
  assert.equal(result.branchThroatTcMm, 0);
});

test("blocks negative and non-finite inputs without producing negative dimensions", () => {
  const result = calculateApi570FilletWeld({
    knownThroatMm: -5,
    knownLegMm: Number.NaN,
    pipeThicknessMm: Number.POSITIVE_INFINITY,
    hubThicknessMm: -12,
    branchThicknessMm: -10,
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 5);
  assert.equal(result.legFromThroatMm, 0);
  assert.equal(result.throatFromLegMm, 0);
  assert.equal(result.slipOnFlangeXminMm, 0);
  assert.equal(result.branchThroatTcMm, 0);
});
