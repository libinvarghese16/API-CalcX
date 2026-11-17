import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateConicalHead,
  calculateCylindricalShell,
  calculateEllipsoidalHead,
  calculateFlatCircularHead,
  calculateHemisphericalHead,
  calculateSphericalShell,
  calculateTorisphericalHead,
} from "../src/index.ts";

const liveReferenceInput = {
  insideDiameterMm: 2000,
  designPressureMpa: 1.6,
  allowableStressMpa: 138,
  jointEfficiency: 0.85,
  originalThicknessMm: 30,
  previousThicknessMm: 28,
  actualThicknessMm: 27,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

const cases = [
  { name: "cylindrical shell", result: calculateCylindricalShell(liveReferenceInput), required: "13.75", mawp: "3.117", futureMawp: "3.003", life: "66.24" },
  { name: "spherical shell", result: calculateSphericalShell(liveReferenceInput), required: "13.75", mawp: "3.117", futureMawp: "3.003", life: "66.25" },
  { name: "ellipsoidal head", result: calculateEllipsoidalHead(liveReferenceInput), required: "13.66", mawp: "3.159", futureMawp: "3.042", life: "66.70" },
  { name: "torispherical head", result: calculateTorisphericalHead({ ...liveReferenceInput, crownRadiusMm: 2000 }), required: "24.18", mawp: "1.787", futureMawp: "1.721", life: "14.10" },
  { name: "hemispherical head", result: calculateHemisphericalHead({ ...liveReferenceInput, sphericalRadiusMm: 1000 }), required: "6.83", mawp: "6.300", futureMawp: "6.068", life: "100.85" },
  { name: "conical head", result: calculateConicalHead({ ...liveReferenceInput, outsideDiameterMm: 2000, halfApexAngleDeg: 30 }), required: "15.88", mawp: "2.705", futureMawp: "2.606", life: "55.60" },
  { name: "flat circular head", result: calculateFlatCircularHead({ ...liveReferenceInput, diameterOrShortSpanMm: 200, attachmentFactor: 0.3 }), required: "12.79", mawp: "7.126", futureMawp: "6.608", life: "71.05" },
] as const;

for (const liveCase of cases) {
  test(`preserves the deployed ${liveCase.name} base route with the corrected single-interval projection`, () => {
    const { result } = liveCase;

    assert.equal(result.ok, true);
    assert.equal(result.requiredThicknessMm.toFixed(2), liveCase.required);
    assert.equal(result.minimumThicknessUsedMm.toFixed(2), liveCase.required);
    assert.equal(result.governingMawpMpa.toFixed(3), liveCase.mawp);
    assert.equal(result.projectedThicknessMm.toFixed(2), "26.00");
    assert.equal(result.futureCorrosionAllowanceMm.toFixed(2), "1.00");
    assert.equal(result.remainingCorrosionAllowanceMm.toFixed(2), (result.corrosionAllowanceMm - 1).toFixed(2));
    assert.equal(result.futureMawpThicknessMm.toFixed(2), "26.00");
    assert.equal(result.futureMawpMpa.toFixed(3), liveCase.futureMawp);
    assert.equal(result.remainingLifeYears.toFixed(2), liveCase.life);
    assert.equal(result.longTermCorrosionRateMmPerYear.toFixed(3), "0.150");
    assert.equal(result.shortTermCorrosionRateMmPerYear.toFixed(3), "0.200");
    assert.equal(result.governingCorrosionRateMmPerYear.toFixed(3), "0.200");
  });
}
