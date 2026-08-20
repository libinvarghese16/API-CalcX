import assert from "node:assert/strict";
import test from "node:test";

import { calculateApi653ShellAssessment, convertUnitToSI, listApi653ShellMaterials } from "../src/index.ts";
import type { Api653ShellAssessmentInputSI } from "../src/index.ts";

function approximately(actual: number, expected: number, tolerance = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

const goldenInput: Api653ShellAssessmentInputSI = {
  diameterM: 30,
  totalHeightM: 18,
  specificGravity: 1.1,
  jointEfficiency: 0.85,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  courses: [
    { courseIndex: 1, courseHeightM: 3, materialId: "A36", productStressMode: "auto", manualProductStressMpa: 172, hydroStressMode: "auto", manualHydroStressMpa: 189, asBuiltThicknessMm: 24, previousThicknessMm: 22, actualThicknessMm: 21 },
    { courseIndex: 2, courseHeightM: 3, materialId: "A36", productStressMode: "auto", manualProductStressMpa: 172, hydroStressMode: "auto", manualHydroStressMpa: 189, asBuiltThicknessMm: 22, previousThicknessMm: 20.5, actualThicknessMm: 20 },
    { courseIndex: 3, courseHeightM: 3, materialId: "A36", productStressMode: "auto", manualProductStressMpa: 189, hydroStressMode: "auto", manualHydroStressMpa: 208, asBuiltThicknessMm: 18, previousThicknessMm: 17, actualThicknessMm: 16.5 },
  ],
};

test("matches the protected three-course Shell golden case", () => {
  const result = calculateApi653ShellAssessment(goldenInput);

  assert.equal(result.ok, true);
  assert.equal(result.engineId, "api653.shell-course");
  assert.equal(result.engineVersion, "0.1.0-original-web-parity");
  assert.equal(result.courses.length, 3);

  const [course1, course2, course3] = result.courses;
  assert.ok(course1 && course2 && course3);
  assert.deepEqual(result.courses.map((course) => course.heightToTopM), [18, 15, 12]);
  assert.deepEqual(result.courses.map((course) => course.productStressMpaUsed), [172, 172, 189]);
  assert.deepEqual(result.courses.map((course) => course.hydroStressMpaUsed), [189, 189, 208]);
  approximately(course1.minimumThicknessMm, 19.5765389876881);
  approximately(course2.minimumThicknessMm, 16.258481532147744);
  approximately(course3.minimumThicknessMm, 11.776470588235295);
  approximately(course1.hydrostaticTestHeightM, 21.163636363636364);
  approximately(course2.hydrostaticTestHeightM, 20.17012987012987);
  approximately(course3.hydrostaticTestHeightM, 18.34081632653061);
  approximately(course1.operatingFillHeightM, 19.287012987012986);
  approximately(course2.operatingFillHeightM, 18.382869511440937);
  approximately(course3.operatingFillHeightM, 16.69285714285714);
  approximately(course1.longTermCorrosionRateMmPerYear, 0.15);
  approximately(course1.shortTermCorrosionRateMmPerYear, 0.2);
  approximately(course1.remainingLifeYears, 7.117305061559499);
  approximately(course2.remainingLifeYears, 37.41518467852256);
  approximately(course3.remainingLifeYears, 47.23529411764705);
  approximately(result.minimumRemainingLifeYears, course1.remainingLifeYears);
  assert.equal(result.governingRemainingLifeCourseIndex, 1);
  approximately(result.maximumCorrosionRateMmPerYear, 0.2);
  assert.equal(result.governingCorrosionRateCourseIndex, 1);
  approximately(result.limitingOperatingFillHeightM, course3.operatingFillHeightM);
  assert.equal(result.limitingOperatingFillCourseIndex, 3);
});

test("preserves lower-two-course and upper-course automatic material stress routes", () => {
  const result = calculateApi653ShellAssessment(goldenInput);
  const [lower, , upper] = result.courses;
  assert.ok(lower && upper);

  assert.equal(lower.productStressRule?.formulaLabel, "min(0.80Y, 0.429T)");
  assert.equal(lower.productStressRule?.rawStressMpa, 171.6);
  assert.equal(lower.productStressRule?.roundedStressMpa, 172);
  assert.equal(lower.hydroStressRule?.formulaLabel, "min(0.88Y, 0.472T)");
  approximately(lower.hydroStressRule?.rawStressMpa ?? 0, 188.8);
  assert.equal(upper.productStressRule?.formulaLabel, "min(0.88Y, 0.472T)");
  approximately(upper.productStressRule?.rawStressMpa ?? 0, 188.8);
  assert.equal(upper.hydroStressRule?.formulaLabel, "min(0.9Y, 0.519T)");
  approximately(upper.hydroStressRule?.rawStressMpa ?? 0, 207.6);
  assert.ok(listApi653ShellMaterials().some((material) => material.id === "A36"));
});

test("applies the protected 2.50 mm floor for an upper course", () => {
  const result = calculateApi653ShellAssessment({ ...goldenInput, totalHeightM: 6.5 });
  const course3 = result.courses[2];
  assert.ok(course3);

  approximately(course3.heightToTopM, 0.5);
  approximately(course3.calculatedMinimumThicknessMm, 0.20130718954248367);
  assert.equal(course3.minimumThicknessMm, 2.5);
  assert.equal(course3.minimumThicknessFloorApplied, true);
});

test("supports the protected Known-material manual S and St route", () => {
  const result = calculateApi653ShellAssessment({
    ...goldenInput,
    courses: [{
      ...goldenInput.courses[0]!,
      materialId: "Known",
      productStressMode: "manual",
      manualProductStressMpa: 160,
      hydroStressMode: "manual",
      manualHydroStressMpa: 180,
    }],
  });
  const course = result.courses[0];
  assert.ok(course);

  assert.equal(result.ok, true);
  assert.equal(course.automaticProductStressMpa, null);
  assert.equal(course.automaticHydroStressMpa, null);
  approximately(course.minimumThicknessMm, 21.044779411764708);
  approximately(course.hydrostaticTestHeightM, 20.17012987012987);
  approximately(course.operatingFillHeightM, 17.96233766233766);
});

test("preserves infinite remaining life when allowance is positive and both rates are zero", () => {
  const result = calculateApi653ShellAssessment({
    ...goldenInput,
    courses: [{ ...goldenInput.courses[0]!, asBuiltThicknessMm: 24, previousThicknessMm: 24, actualThicknessMm: 24 }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.courses[0]?.governingCorrosionRateMmPerYear, 0);
  assert.equal(result.courses[0]?.remainingLifeYears, Infinity);
  assert.equal(result.minimumRemainingLifeYears, Infinity);
});

test("reproduces the golden results from equivalent U.S. customary entries", () => {
  const inToMm = (value: number) => convertUnitToSI(value, "length", "in");
  const ftToM = (value: number) => convertUnitToSI(value, "length", "ft") / 1000;
  const result = calculateApi653ShellAssessment({
    ...goldenInput,
    diameterM: ftToM(98.4251968503937),
    totalHeightM: ftToM(59.0551181102362),
    courses: goldenInput.courses.map((course) => ({
      ...course,
      courseHeightM: ftToM(9.84251968503937),
      asBuiltThicknessMm: inToMm(course.asBuiltThicknessMm / 25.4),
      previousThicknessMm: inToMm(course.previousThicknessMm / 25.4),
      actualThicknessMm: inToMm(course.actualThicknessMm / 25.4),
    })),
  });

  approximately(result.courses[0]?.minimumThicknessMm ?? 0, 19.5765389876881, 1e-10);
  approximately(result.minimumRemainingLifeYears, 7.117305061559499, 1e-10);
});

test("rejects invalid base dependencies, missing intermediate heights, and unavailable automatic Known stresses", () => {
  const result = calculateApi653ShellAssessment({
    ...goldenInput,
    jointEfficiency: 1.1,
    courses: [
      { ...goldenInput.courses[0]!, courseHeightM: 0, materialId: "Known" },
      goldenInput.courses[1]!,
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "joint-efficiency-out-of-range"));
  assert.ok(result.issues.some((issue) => issue.code === "intermediate-course-height-required"));
  assert.ok(result.issues.some((issue) => issue.code === "automatic-product-stress-unavailable"));
  assert.ok(result.issues.some((issue) => issue.code === "automatic-hydro-stress-unavailable"));
});
