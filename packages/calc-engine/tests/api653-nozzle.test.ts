import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi653NozzleAssessment, convertUnitToSI, selectApi653NozzleMinimumThickness } from "../src/index.ts";
import type { Api653NozzleAssessmentInputSI } from "../src/index.ts";

function approximately(actual: number | null, expected: number, tolerance = 1e-12): void {
  assert.notEqual(actual, null);
  assert.ok(Math.abs((actual ?? 0) - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const goldenInput: Api653NozzleAssessmentInputSI = {
  material: "carbon steel",
  operatingTemperatureC: 200,
  pressureClass: "300",
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nozzles: [{
    nozzleIndex: 1,
    detail: "N1 product inlet",
    nominalPipeSizeIn: "4",
    minimumThicknessMode: "auto",
    manualMinimumThicknessMm: 2.41,
    originalThicknessMm: 10,
    previousThicknessMm: 9.5,
    actualThicknessMm: 9,
  }],
};

test("matches the protected Nozzle golden case", () => {
  const result = calculateApi653NozzleAssessment(goldenInput);
  const nozzle = result.nozzles[0];
  assert.ok(nozzle);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api653.nozzle");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(nozzle.minimumSelection.tableId, "API 574 Table D.2b");
  assert.equal(nozzle.minimumSelection.lookupSizeIn, "4");
  assert.equal(nozzle.automaticMinimumThicknessMm, 2.41);
  approximately(nozzle.corrosionAllowanceMm, 6.59);
  approximately(nozzle.longTermCorrosionRateMmPerYear, 0.05);
  approximately(nozzle.shortTermCorrosionRateMmPerYear, 0.1);
  approximately(nozzle.governingCorrosionRateMmPerYear, 0.1);
  approximately(nozzle.remainingLifeYears, 65.9);
  approximately(result.minimumRemainingLifeYears, 65.9);
  approximately(result.maximumRemainingLifeYears, 65.9);
  approximately(result.maximumCorrosionRateMmPerYear, 0.1);
  assert.equal(result.minimumRemainingLifeNozzleIndex, 1);
  assert.equal(result.maximumCorrosionRateNozzleIndex, 1);
});

test("uses the higher temperature table without interpolation", () => {
  const selection = selectApi653NozzleMinimumThickness({ material: "carbon steel", operatingTemperatureC: 206, pressureClass: "300", nominalPipeSizeIn: "4" });

  assert.equal(selection.available, true);
  assert.equal(selection.tableId, "API 574 Table D.2d");
  assert.equal(selection.valueMm, 3.18);
  assert.match(selection.message, /750 F \(400 C\)/);
});

test("preserves next-lower and lowest-row NPS fallback rules", () => {
  const nextLower = selectApi653NozzleMinimumThickness({ material: "carbon steel", operatingTemperatureC: 206, pressureClass: "300", nominalPipeSizeIn: "1 1/4" });
  const lowest = selectApi653NozzleMinimumThickness({ material: "carbon steel", operatingTemperatureC: 206, pressureClass: "300", nominalPipeSizeIn: "1/8" });

  assert.equal(nextLower.valueMm, 1.27);
  assert.equal(nextLower.lookupSizeIn, "1");
  assert.equal(nextLower.usedNextLowerValue, true);
  assert.match(nextLower.message, /next-lower NPS 1/);
  assert.equal(lowest.valueMm, 1.27);
  assert.equal(lowest.lookupSizeIn, "1/2");
  assert.equal(lowest.usedLowestValue, true);
  assert.match(lowest.message, /lowest listed NPS 1\/2/);
});

test("reports unsupported temperatures, pressure classes, and blank protected table cells", () => {
  const tooHot = selectApi653NozzleMinimumThickness({ material: "carbon steel", operatingTemperatureC: 401, pressureClass: "300", nominalPipeSizeIn: "4" });
  const absentClass = selectApi653NozzleMinimumThickness({ material: "1-1/4cr-1/2mo", operatingTemperatureC: 500, pressureClass: "150", nominalPipeSizeIn: "8" });
  const blankCell = selectApi653NozzleMinimumThickness({ material: "1-1/4cr-1/2mo", operatingTemperatureC: 500, pressureClass: "300", nominalPipeSizeIn: "1/2" });

  assert.equal(tooHot.available, false);
  assert.match(tooHot.message, /No protected-source/);
  assert.equal(absentClass.available, false);
  assert.match(absentClass.message, /does not include pressure class 150/);
  assert.equal(blankCell.available, false);
  assert.equal(blankCell.tableId, "API 574 Table D.4d");
  assert.match(blankCell.message, /no value/);
});

test("supports a highlighted manual minimum while preserving the automatic recommendation", () => {
  const result = calculateApi653NozzleAssessment({
    ...goldenInput,
    nozzles: [{ ...goldenInput.nozzles[0]!, minimumThicknessMode: "manual", manualMinimumThicknessMm: 4 }],
  });
  const nozzle = result.nozzles[0];
  assert.ok(nozzle);

  assert.equal(result.ok, true);
  assert.equal(nozzle.automaticMinimumThicknessMm, 2.41);
  assert.equal(nozzle.minimumThicknessMmUsed, 4);
  approximately(nozzle.corrosionAllowanceMm, 5);
  approximately(nozzle.remainingLifeYears, 50);
});

test("summarizes multiple nozzles using protected min-life and maximum-rate rules", () => {
  const result = calculateApi653NozzleAssessment({
    ...goldenInput,
    nozzles: [
      goldenInput.nozzles[0]!,
      { ...goldenInput.nozzles[0]!, nozzleIndex: 2, detail: "N2 outlet", nominalPipeSizeIn: "6", originalThicknessMm: 12, previousThicknessMm: 11, actualThicknessMm: 10 },
    ],
  });

  approximately(result.nozzles[1]?.remainingLifeYears ?? null, 37.3);
  approximately(result.minimumRemainingLifeYears, 37.3);
  assert.equal(result.minimumRemainingLifeNozzleIndex, 2);
  approximately(result.maximumCorrosionRateMmPerYear, 0.2);
  assert.equal(result.maximumCorrosionRateNozzleIndex, 2);
});

test("preserves open-ended life at zero rate and zero life after the minimum is reached", () => {
  const open = calculateApi653NozzleAssessment({
    ...goldenInput,
    nozzles: [{ ...goldenInput.nozzles[0]!, originalThicknessMm: 9, previousThicknessMm: 9, actualThicknessMm: 9 }],
  });
  const reached = calculateApi653NozzleAssessment({
    ...goldenInput,
    nozzles: [{ ...goldenInput.nozzles[0]!, actualThicknessMm: 2 }],
  });

  assert.equal(open.nozzles[0]?.remainingLifeYears, Infinity);
  assert.equal(open.minimumRemainingLifeYears, Infinity);
  assert.equal(open.hasOpenEndedRemainingLife, true);
  assert.equal(reached.nozzles[0]?.remainingLifeYears, 0);
});

test("reproduces the golden result from equivalent Fahrenheit and inch entries", () => {
  const inputFromSite = {
    ...goldenInput,
    operatingTemperatureC: convertUnitToSI(392, "temperature", "F"),
    nozzles: [{
      ...goldenInput.nozzles[0]!,
      originalThicknessMm: convertUnitToSI(10 / 25.4, "length", "in"),
      previousThicknessMm: convertUnitToSI(9.5 / 25.4, "length", "in"),
      actualThicknessMm: convertUnitToSI(9 / 25.4, "length", "in"),
    }],
  };
  const result = calculateApi653NozzleAssessment(inputFromSite);

  assert.equal(result.nozzles[0]?.automaticMinimumThicknessMm, 2.41);
  approximately(result.nozzles[0]?.remainingLifeYears ?? null, 65.9, 1e-10);
});
