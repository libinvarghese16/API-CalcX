import assert from "node:assert/strict";
import test from "node:test";

import {
  listPressureVesselMaterialGrades,
  listPressureVesselMaterialSpecs,
  resolvePressureVesselAllowableStress,
} from "../src/index.ts";

test("loads all protected pressure-vessel material specifications", () => {
  const specifications = listPressureVesselMaterialSpecs();

  assert.equal(specifications.length, 61);
  assert.ok(specifications.includes("SA-516"));
});

test("builds selectable SA-516 grade records", () => {
  const grades = listPressureVesselMaterialGrades("sa-516");

  assert.deepEqual(grades.map((entry) => entry.grade), ["55", "60", "65", "70"]);
  assert.equal(grades.at(-1)?.key, "SA-516|70|176");
  assert.equal(grades.at(-1)?.productForm, "Plate");
});

test("matches the legacy next-temperature-limit lookup without interpolation", () => {
  const exact = resolvePressureVesselAllowableStress("SA-516", "SA-516|70|176", 150);
  const betweenLimits = resolvePressureVesselAllowableStress("SA-516", "SA-516|70|176", 275);

  assert.equal(exact.status, "resolved");
  assert.equal(exact.allowableStressMpa, 138);
  assert.equal(exact.tableLimitC, 150);
  assert.equal(betweenLimits.allowableStressMpa, 136);
  assert.equal(betweenLimits.tableLimitC, 300);
});

test("reports an unavailable value instead of extrapolating", () => {
  const result = resolvePressureVesselAllowableStress("SA-516", "SA-516|70|176", 600);

  assert.equal(result.status, "temperature-unavailable");
  assert.equal(result.allowableStressMpa, null);
});
