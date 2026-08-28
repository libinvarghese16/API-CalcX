import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const applicableCalculators = [
  "Api570PipingCalculator.tsx",
  "Api570TubeCalculator.tsx",
  "Api570HeaderCalculator.tsx",
  "Api570PressureDesignCalculator.tsx",
  "Api570ValveFittingsCalculator.tsx",
  "Api570HydroTestCalculator.tsx",
] as const;

const nonStressCalculators = [
  "Api570FlangeHydroTestCalculator.tsx",
  "Api570PneumaticTestCalculator.tsx",
  "Api570FilletWeldCalculator.tsx",
  "Api570TensionTestCalculator.tsx",
  "Api570SoilResistivityCalculator.tsx",
] as const;

function source(fileName: string): string {
  return readFileSync(new URL(`../src/api570/${fileName}`, import.meta.url), "utf8");
}

test("connects material selection and automatic stress resolution to every applicable API 570 calculator", () => {
  for (const fileName of applicableCalculators) {
    const calculator = source(fileName);
    assert.match(calculator, /Api570MaterialStressFields/, `${fileName} must render the shared material and stress fields`);
    assert.match(calculator, /resolveApi570PipingAllowableStress/, `${fileName} must use the master-site temperature lookup`);
    assert.match(calculator, /stressMode|StressMode/, `${fileName} must preserve an automatic and manual stress mode`);
  }
});
test("does not add irrelevant material selectors to API 570 tools without an allowable-stress input", () => {
  for (const fileName of nonStressCalculators) {
    const calculator = source(fileName);
    assert.doesNotMatch(calculator, /Api570MaterialStressFields/, `${fileName} must stay scoped to its own engineering inputs`);
  }
});

test("keeps hydro-test design and test stress lookups independent", () => {
  const hydroTest = source("Api570HydroTestCalculator.tsx");
  assert.match(hydroTest, /designStressResolution/);
  assert.match(hydroTest, /testStressResolution/);
  assert.match(hydroTest, /designStressMode/);
  assert.match(hydroTest, /testStressMode/);
  assert.match(hydroTest, /temperatureLabel="Design temperature"/);
  assert.match(hydroTest, /temperatureLabel="Test temperature"/);
});
