import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_API570_MATERIAL_GRADE,
  DEFAULT_API570_MATERIAL_SPEC,
  listApi570PipingMaterialGrades,
  listApi570PipingMaterialSpecs,
  resolveApi570PipingAllowableStress,
} from "../src/index.ts";

test("preserves every master-site B31.3 material specification and grade row", () => {
  const specifications = listApi570PipingMaterialSpecs();
  assert.equal(specifications.length, 33);
  assert.equal(specifications.reduce((count, specification) => count + listApi570PipingMaterialGrades(specification).length, 0), 123);
  assert.ok(specifications.includes(DEFAULT_API570_MATERIAL_SPEC));
  assert.ok(listApi570PipingMaterialGrades(DEFAULT_API570_MATERIAL_SPEC).some(({ key }) => key === DEFAULT_API570_MATERIAL_GRADE));
});

test("matches the master next-temperature-limit lookup without interpolation", () => {
  const at150 = resolveApi570PipingAllowableStress("A106", "A106|B|31", 150);
  assert.equal(at150.status, "resolved");
  assert.equal(at150.tableLimitC, 150);
  assert.equal(at150.allowableStressMpa, 138);

  const betweenLimits = resolveApi570PipingAllowableStress("A106", "A106|B|31", 225);
  assert.equal(betweenLimits.status, "resolved");
  assert.equal(betweenLimits.tableLimitC, 250);
  assert.equal(betweenLimits.allowableStressMpa, 132);
});

test("normalizes practical specification spelling and reports unavailable temperatures", () => {
  assert.equal(resolveApi570PipingAllowableStress("a-106", "A106|B|31", 100).allowableStressMpa, 138);
  const unavailable = resolveApi570PipingAllowableStress("A106", "A106|B|31", 650);
  assert.equal(unavailable.status, "temperature-unavailable");
  assert.equal(unavailable.allowableStressMpa, null);
});
