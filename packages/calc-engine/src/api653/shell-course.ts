import type {
  Api653ShellAssessmentInputSI,
  Api653ShellAssessmentResultSI,
  Api653ShellCourseField,
  Api653ShellCourseResultSI,
  Api653ShellMaterialRecord,
  Api653ShellStressRuleSI,
  CalculationIssue,
} from "../contracts.ts";

const ENGINE_ID = "api653.shell-course" as const;
const ENGINE_VERSION = "0.1.0-original-web-parity" as const;

const SHELL_MATERIALS: readonly Api653ShellMaterialRecord[] = [
  { id: "A283-C", label: "A283-C", yieldStressMpa: 205, tensileStressMpa: 380, productStressLowerMpa: 163, productStressUpperMpa: 179, hydroStressLowerMpa: 179, hydroStressUpperMpa: 186 },
  { id: "A285-C", label: "A285-C", yieldStressMpa: 205, tensileStressMpa: 380, productStressLowerMpa: 163, productStressUpperMpa: 179, hydroStressLowerMpa: 179, hydroStressUpperMpa: 186 },
  { id: "A36", label: "A36", yieldStressMpa: 250, tensileStressMpa: 400, productStressLowerMpa: 172, productStressUpperMpa: 189, hydroStressLowerMpa: 189, hydroStressUpperMpa: 208 },
  { id: "A131-A,B,CS", label: "A131-A, B, CS", yieldStressMpa: 235, tensileStressMpa: 400, productStressLowerMpa: 172, productStressUpperMpa: 189, hydroStressLowerMpa: 189, hydroStressUpperMpa: 208 },
  { id: "A131-EH36", label: "A131-EH 36", yieldStressMpa: 360, tensileStressMpa: 490, productStressLowerMpa: 210, productStressUpperMpa: 231, hydroStressLowerMpa: 231, hydroStressUpperMpa: 254 },
  { id: "A573-58", label: "A573-58", yieldStressMpa: 220, tensileStressMpa: 400, productStressLowerMpa: 172, productStressUpperMpa: 189, hydroStressLowerMpa: 189, hydroStressUpperMpa: 199 },
  { id: "A573-65", label: "A573-65", yieldStressMpa: 240, tensileStressMpa: 450, productStressLowerMpa: 192, productStressUpperMpa: 212, hydroStressLowerMpa: 212, hydroStressUpperMpa: 217 },
  { id: "A573-70", label: "A573-70", yieldStressMpa: 290, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A516-55", label: "A516-55", yieldStressMpa: 205, tensileStressMpa: 380, productStressLowerMpa: 163, productStressUpperMpa: 179, hydroStressLowerMpa: 179, hydroStressUpperMpa: 186 },
  { id: "A516-60", label: "A516-60", yieldStressMpa: 220, tensileStressMpa: 415, productStressLowerMpa: 176, productStressUpperMpa: 194, hydroStressLowerMpa: 194, hydroStressUpperMpa: 193 },
  { id: "A516-65", label: "A516-65", yieldStressMpa: 240, tensileStressMpa: 450, productStressLowerMpa: 192, productStressUpperMpa: 212, hydroStressLowerMpa: 212, hydroStressUpperMpa: 217 },
  { id: "A516-70", label: "A516-70", yieldStressMpa: 260, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 236 },
  { id: "A662-B", label: "A662-B", yieldStressMpa: 275, tensileStressMpa: 450, productStressLowerMpa: 192, productStressUpperMpa: 212, hydroStressLowerMpa: 212, hydroStressUpperMpa: 232 },
  { id: "A662-C", label: "A662-C", yieldStressMpa: 295, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A537-Class 1", label: "A537-Class 1", yieldStressMpa: 345, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A537-Class 2", label: "A537-Class 2", yieldStressMpa: 415, tensileStressMpa: 550, productStressLowerMpa: 236, productStressUpperMpa: 261, hydroStressLowerMpa: 261, hydroStressUpperMpa: 286 },
  { id: "A633-C, D", label: "A633-C, D", yieldStressMpa: 345, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A678-A", label: "A678-A", yieldStressMpa: 345, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A678-B", label: "A678-B", yieldStressMpa: 415, tensileStressMpa: 550, productStressLowerMpa: 236, productStressUpperMpa: 261, hydroStressLowerMpa: 261, hydroStressUpperMpa: 286 },
  { id: "A737-B", label: "A737-B", yieldStressMpa: 345, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A841", label: "A841", yieldStressMpa: 345, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "A10", label: "A10 a", yieldStressMpa: 205, tensileStressMpa: 380, productStressLowerMpa: 163, productStressUpperMpa: 179, hydroStressLowerMpa: 179, hydroStressUpperMpa: 186 },
  { id: "A7", label: "A7 a", yieldStressMpa: 228, tensileStressMpa: 415, productStressLowerMpa: 177, productStressUpperMpa: 195, hydroStressLowerMpa: 195, hydroStressUpperMpa: 205 },
  { id: "A442-55", label: "A442-55 a", yieldStressMpa: 205, tensileStressMpa: 380, productStressLowerMpa: 163, productStressUpperMpa: 179, hydroStressLowerMpa: 179, hydroStressUpperMpa: 186 },
  { id: "A442-60", label: "A442-60 a", yieldStressMpa: 220, tensileStressMpa: 415, productStressLowerMpa: 176, productStressUpperMpa: 194, hydroStressLowerMpa: 194, hydroStressUpperMpa: 199 },
  { id: "G40.21 38W", label: "G40.21, 38W", yieldStressMpa: 260, tensileStressMpa: 410, productStressLowerMpa: 177, productStressUpperMpa: 195, hydroStressLowerMpa: 195, hydroStressUpperMpa: 214 },
  { id: "G40.21 44W g", label: "G40.21, 44W g", yieldStressMpa: 300, tensileStressMpa: 450, productStressLowerMpa: 192, productStressUpperMpa: 212, hydroStressLowerMpa: 212, hydroStressUpperMpa: 232 },
  { id: "G40.21 44W h", label: "G40.21, 44W h", yieldStressMpa: 300, tensileStressMpa: 440, productStressLowerMpa: 189, productStressUpperMpa: 208, hydroStressLowerMpa: 212, hydroStressUpperMpa: 229 },
  { id: "G40.21 50W", label: "G40.21, 50W", yieldStressMpa: 345, tensileStressMpa: 450, productStressLowerMpa: 192, productStressUpperMpa: 212, hydroStressLowerMpa: 212, hydroStressUpperMpa: 232 },
  { id: "G40.21 50WT g", label: "G40.21, 50WT g", yieldStressMpa: 345, tensileStressMpa: 485, productStressLowerMpa: 207, productStressUpperMpa: 228, hydroStressLowerMpa: 228, hydroStressUpperMpa: 250 },
  { id: "G40.21 50WT h", label: "G40.21, 50WT h", yieldStressMpa: 345, tensileStressMpa: 450, productStressLowerMpa: 192, productStressUpperMpa: 212, hydroStressLowerMpa: 212, hydroStressUpperMpa: 232 },
  { id: "Unknown", label: "Unknown (Note 2)", yieldStressMpa: 205, tensileStressMpa: 380, productStressLowerMpa: 163, productStressUpperMpa: 179, hydroStressLowerMpa: 179, hydroStressUpperMpa: 186 },
  { id: "Known", label: "Known" },
] as const;

function positiveIssue(field: Api653ShellCourseField, value: number, label: string): CalculationIssue | null {
  return Number.isFinite(value) && value > 0 ? null : { code: "positive-value-required", field, severity: "error", message: `${label} must be a finite value greater than zero.` };
}

function nonNegativeIssue(field: Api653ShellCourseField, value: number, label: string): CalculationIssue | null {
  return Number.isFinite(value) && value >= 0 ? null : { code: "non-negative-value-required", field, severity: "error", message: `${label} must be a finite value of zero or greater.` };
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function findMaterial(materialId: string): Api653ShellMaterialRecord | null {
  return SHELL_MATERIALS.find((material) => material.id === materialId) ?? null;
}

function stressRule(material: Api653ShellMaterialRecord | null, courseIndex: number, kind: "product" | "hydro"): Api653ShellStressRuleSI | null {
  if (!material || !Number.isFinite(material.yieldStressMpa) || !Number.isFinite(material.tensileStressMpa)) return null;
  const lowerCourse = courseIndex <= 2;
  const yieldFactor = kind === "product" ? (lowerCourse ? 0.8 : 0.88) : (lowerCourse ? 0.88 : 0.9);
  const tensileFactor = kind === "product" ? (lowerCourse ? 0.429 : 0.472) : (lowerCourse ? 0.472 : 0.519);
  const tensileStressMpa = kind === "product" ? Math.min(material.tensileStressMpa ?? 0, 550) : material.tensileStressMpa ?? 0;
  const yieldTerm = yieldFactor * (material.yieldStressMpa ?? 0);
  const tensileTerm = tensileFactor * tensileStressMpa;
  const rawStressMpa = Math.min(yieldTerm, tensileTerm);
  const formulaLabel = kind === "product"
    ? lowerCourse ? "min(0.80Y, 0.429T)" : "min(0.88Y, 0.472T)"
    : lowerCourse ? "min(0.88Y, 0.472T)" : "min(0.9Y, 0.519T)";
  return {
    formulaLabel,
    governingTerm: yieldTerm <= tensileTerm ? `${yieldFactor}Y` : `${tensileFactor}T`,
    yieldStressMpa: material.yieldStressMpa ?? 0,
    tensileStressMpa,
    rawStressMpa,
    roundedStressMpa: Math.round(rawStressMpa),
  };
}

export function listApi653ShellMaterials(): readonly Api653ShellMaterialRecord[] {
  return SHELL_MATERIALS;
}

/** Pure SI extraction of the protected original website's complete API 653 Shell course workspace. */
export function calculateApi653ShellAssessment(input: Api653ShellAssessmentInputSI): Api653ShellAssessmentResultSI {
  const issues: CalculationIssue[] = [];
  const baseIssues = [
    positiveIssue("diameterM", input.diameterM, "Tank diameter"),
    positiveIssue("totalHeightM", input.totalHeightM, "Tank height"),
    positiveIssue("specificGravity", input.specificGravity, "Specific gravity"),
    positiveIssue("jointEfficiency", input.jointEfficiency, "Joint efficiency"),
    nonNegativeIssue("yearsInService", input.yearsInService, "Years in service"),
    nonNegativeIssue("yearsSincePreviousInspection", input.yearsSincePreviousInspection, "Years since previous inspection"),
  ];
  issues.push(...baseIssues.filter((issue): issue is CalculationIssue => issue !== null));
  if (Number.isFinite(input.jointEfficiency) && input.jointEfficiency > 1) {
    issues.push({ code: "joint-efficiency-out-of-range", field: "jointEfficiency", severity: "error", message: "Joint efficiency must not be greater than 1." });
  }
  if (!Array.isArray(input.courses) || input.courses.length < 1 || input.courses.length > 15) {
    issues.push({ code: "shell-course-count-out-of-range", field: "courses", severity: "error", message: "Shell assessment requires between 1 and 15 courses." });
  }

  const diameterMUsed = finiteNonNegative(input.diameterM);
  const totalHeightMUsed = finiteNonNegative(input.totalHeightM);
  const specificGravityUsed = finiteNonNegative(input.specificGravity);
  const jointEfficiencyUsed = finiteNonNegative(input.jointEfficiency);
  const yearsInServiceUsed = finiteNonNegative(input.yearsInService);
  const yearsSincePreviousInspectionUsed = finiteNonNegative(input.yearsSincePreviousInspection);
  const baseReady = diameterMUsed > 0 && totalHeightMUsed > 0 && specificGravityUsed > 0 && jointEfficiencyUsed > 0 && jointEfficiencyUsed <= 1;
  let consumedHeightM = 0;

  const courses: Api653ShellCourseResultSI[] = (Array.isArray(input.courses) ? input.courses : []).map((course, position) => {
    const courseIndex = Number.isInteger(course.courseIndex) && course.courseIndex > 0 ? course.courseIndex : position + 1;
    if (courseIndex !== position + 1) {
      issues.push({ code: "shell-course-sequence-invalid", field: "courses", severity: "error", message: `Shell course ${courseIndex} is out of sequence; courses must be ordered from bottom to top.` });
    }
    const courseHeightIssue = nonNegativeIssue("courseHeightM", course.courseHeightM, `Shell course ${courseIndex} height`);
    if (courseHeightIssue) issues.push(courseHeightIssue);
    if (input.courses.length > 1 && position < input.courses.length - 1 && !(course.courseHeightM > 0)) {
      issues.push({ code: "intermediate-course-height-required", field: "courseHeightM", severity: "error", message: `Shell course ${courseIndex} height is required to calculate upper-course H to Top.` });
    }
    if (totalHeightMUsed > 0 && consumedHeightM > totalHeightMUsed + 1e-6) {
      issues.push({ code: "course-height-overrun", field: "courseHeightM", severity: "error", message: `Course heights exceed tank height before Shell course ${courseIndex}.` });
    }

    const courseHeightMUsed = finiteNonNegative(course.courseHeightM);
    const heightToTopM = Math.max(totalHeightMUsed - consumedHeightM, 0);
    const effectiveCourseHeightM = Math.max(heightToTopM - 0.3, 0);
    const material = findMaterial(course.materialId);
    if (!material) {
      issues.push({ code: "shell-material-required", field: "materialId", severity: "error", message: `Select a valid material for Shell course ${courseIndex}.` });
    }
    const lowerCourse = courseIndex <= 2;
    const automaticProductStressMpa = material && Number.isFinite(lowerCourse ? material.productStressLowerMpa : material.productStressUpperMpa)
      ? (lowerCourse ? material.productStressLowerMpa : material.productStressUpperMpa) ?? null
      : null;
    const automaticHydroStressMpa = material && Number.isFinite(lowerCourse ? material.hydroStressLowerMpa : material.hydroStressUpperMpa)
      ? (lowerCourse ? material.hydroStressLowerMpa : material.hydroStressUpperMpa) ?? null
      : null;
    const productStressMpaUsed = course.productStressMode === "auto" ? automaticProductStressMpa ?? 0 : finiteNonNegative(course.manualProductStressMpa);
    const hydroStressMpaUsed = course.hydroStressMode === "auto" ? automaticHydroStressMpa ?? 0 : finiteNonNegative(course.manualHydroStressMpa);
    if (course.productStressMode === "auto" && automaticProductStressMpa === null) {
      issues.push({ code: "automatic-product-stress-unavailable", field: "productStressMpa", severity: "error", message: `Shell course ${courseIndex} has no automatic product stress; switch S to manual and enter the controlled value.` });
    }
    if (course.hydroStressMode === "auto" && automaticHydroStressMpa === null) {
      issues.push({ code: "automatic-hydro-stress-unavailable", field: "hydroStressMpa", severity: "error", message: `Shell course ${courseIndex} has no automatic hydrostatic test stress; switch St to manual and enter the controlled value.` });
    }
    if (course.productStressMode === "manual") {
      const issue = positiveIssue("productStressMpa", course.manualProductStressMpa, `Shell course ${courseIndex} manual product stress`);
      if (issue) issues.push(issue);
    }
    if (course.hydroStressMode === "manual") {
      const issue = positiveIssue("hydroStressMpa", course.manualHydroStressMpa, `Shell course ${courseIndex} manual hydrostatic test stress`);
      if (issue) issues.push(issue);
    }

    const thicknessIssues = [
      nonNegativeIssue("asBuiltThicknessMm", course.asBuiltThicknessMm, `Shell course ${courseIndex} as-built thickness`),
      nonNegativeIssue("previousThicknessMm", course.previousThicknessMm, `Shell course ${courseIndex} previous thickness`),
      positiveIssue("actualThicknessMm", course.actualThicknessMm, `Shell course ${courseIndex} actual thickness`),
    ];
    issues.push(...thicknessIssues.filter((issue): issue is CalculationIssue => issue !== null));
    const asBuiltThicknessMmUsed = finiteNonNegative(course.asBuiltThicknessMm);
    const previousThicknessMmUsed = finiteNonNegative(course.previousThicknessMm);
    const actualThicknessMmUsed = finiteNonNegative(course.actualThicknessMm);

    const calculatedMinimumThicknessMm = baseReady && productStressMpaUsed > 0
      ? (4.9 * effectiveCourseHeightM * diameterMUsed * specificGravityUsed) / (productStressMpaUsed * jointEfficiencyUsed)
      : 0;
    const minimumThicknessMm = baseReady && productStressMpaUsed > 0 ? Math.max(calculatedMinimumThicknessMm, 2.5) : 0;
    const minimumThicknessFloorApplied = calculatedMinimumThicknessMm > 0 && calculatedMinimumThicknessMm < 2.5;
    const commonDenominator = 4.9 * diameterMUsed * specificGravityUsed;
    const hydrostaticTestHeightM = baseReady && hydroStressMpaUsed > 0 && actualThicknessMmUsed > 0 && commonDenominator > 0
      ? ((hydroStressMpaUsed * jointEfficiencyUsed * actualThicknessMmUsed) / commonDenominator) + 0.3
      : 0;
    const operatingFillHeightM = baseReady && productStressMpaUsed > 0 && actualThicknessMmUsed > 0 && commonDenominator > 0
      ? ((productStressMpaUsed * jointEfficiencyUsed * actualThicknessMmUsed) / commonDenominator) + 0.3
      : 0;
    const corrosionAllowanceMm = actualThicknessMmUsed > 0 && minimumThicknessMm > 0 ? actualThicknessMmUsed - minimumThicknessMm : 0;
    const longTermCorrosionRateMmPerYear = yearsInServiceUsed > 0 && asBuiltThicknessMmUsed > 0 && actualThicknessMmUsed > 0
      ? Math.max((asBuiltThicknessMmUsed - actualThicknessMmUsed) / yearsInServiceUsed, 0)
      : 0;
    const shortTermCorrosionRateMmPerYear = yearsSincePreviousInspectionUsed > 0 && previousThicknessMmUsed > 0 && actualThicknessMmUsed > 0
      ? Math.max((previousThicknessMmUsed - actualThicknessMmUsed) / yearsSincePreviousInspectionUsed, 0)
      : 0;
    const governingCorrosionRateMmPerYear = Math.max(longTermCorrosionRateMmPerYear, shortTermCorrosionRateMmPerYear);
    const remainingLifeYears = corrosionAllowanceMm > 0
      ? governingCorrosionRateMmPerYear > 0 ? corrosionAllowanceMm / governingCorrosionRateMmPerYear : Infinity
      : 0;
    if (actualThicknessMmUsed > 0 && minimumThicknessMm > 0 && corrosionAllowanceMm <= 0) {
      issues.push({ code: "actual-thickness-at-or-below-minimum", field: "actualThicknessMm", severity: "warning", message: `Shell course ${courseIndex} actual thickness is at or below the calculated minimum thickness.` });
    }

    consumedHeightM += courseHeightMUsed;
    return {
      courseIndex,
      courseHeightMUsed,
      heightToTopM,
      effectiveCourseHeightM,
      materialId: material?.id ?? course.materialId,
      materialLabel: material?.label ?? "Unselected",
      productStressMode: course.productStressMode,
      hydroStressMode: course.hydroStressMode,
      automaticProductStressMpa,
      automaticHydroStressMpa,
      productStressMpaUsed,
      hydroStressMpaUsed,
      productStressRule: stressRule(material, courseIndex, "product"),
      hydroStressRule: stressRule(material, courseIndex, "hydro"),
      asBuiltThicknessMmUsed,
      previousThicknessMmUsed,
      actualThicknessMmUsed,
      calculatedMinimumThicknessMm,
      minimumThicknessMm,
      minimumThicknessFloorApplied,
      hydrostaticTestHeightM,
      operatingFillHeightM,
      hydrostaticHeightAdequate: hydrostaticTestHeightM > 0 && hydrostaticTestHeightM + 1e-6 >= heightToTopM,
      operatingFillHeightAdequate: operatingFillHeightM > 0 && operatingFillHeightM + 1e-6 >= heightToTopM,
      corrosionAllowanceMm,
      longTermCorrosionRateMmPerYear,
      shortTermCorrosionRateMmPerYear,
      governingCorrosionRateMmPerYear,
      remainingLifeYears,
    };
  });

  const hasLongTermInputs = courses.some((course) => course.asBuiltThicknessMmUsed > 0 && course.actualThicknessMmUsed > 0);
  const hasShortTermInputs = courses.some((course) => course.previousThicknessMmUsed > 0 && course.actualThicknessMmUsed > 0);
  if (hasLongTermInputs && yearsInServiceUsed <= 0) {
    issues.push({ code: "long-term-period-required", field: "yearsInService", severity: "error", message: "Years in service must be greater than zero to calculate long-term Shell corrosion rates." });
  }
  if (hasShortTermInputs && yearsSincePreviousInspectionUsed <= 0) {
    issues.push({ code: "short-term-period-required", field: "yearsSincePreviousInspection", severity: "error", message: "Years since previous inspection must be greater than zero to calculate short-term Shell corrosion rates." });
  }

  const remainingLifeCandidates = courses.filter((course) => course.actualThicknessMmUsed > 0 && course.minimumThicknessMm > 0);
  const governingRemainingLife = remainingLifeCandidates.reduce<Api653ShellCourseResultSI | null>((governing, course) => governing === null || course.remainingLifeYears < governing.remainingLifeYears ? course : governing, null);
  const governingRate = courses.reduce<Api653ShellCourseResultSI | null>((governing, course) => governing === null || course.governingCorrosionRateMmPerYear > governing.governingCorrosionRateMmPerYear ? course : governing, null);
  const limitingFill = courses.filter((course) => course.operatingFillHeightM > 0).reduce<Api653ShellCourseResultSI | null>((governing, course) => governing === null || course.operatingFillHeightM < governing.operatingFillHeightM ? course : governing, null);

  return {
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    diameterMUsed,
    totalHeightMUsed,
    specificGravityUsed,
    jointEfficiencyUsed,
    yearsInServiceUsed,
    yearsSincePreviousInspectionUsed,
    courses,
    minimumRemainingLifeYears: governingRemainingLife?.remainingLifeYears ?? 0,
    governingRemainingLifeCourseIndex: governingRemainingLife?.courseIndex ?? null,
    maximumCorrosionRateMmPerYear: governingRate?.governingCorrosionRateMmPerYear ?? 0,
    governingCorrosionRateCourseIndex: governingRate?.courseIndex ?? null,
    limitingOperatingFillHeightM: limitingFill?.operatingFillHeightM ?? 0,
    limitingOperatingFillCourseIndex: limitingFill?.courseIndex ?? null,
  };
}
