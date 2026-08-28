import assert from "node:assert/strict";
import test from "node:test";

import type { Api510InputSnapshot, Api510ResultSnapshot } from "../src/local-data/models.ts";
import { buildApi510ReportText, createApi510ReportModel } from "../src/reports/api510-report.ts";

const inputs: Api510InputSnapshot = {
  component: "cylindrical",
  unitSystem: "metric",
  pressureUnit: "Bar",
  diameterUnit: "mm",
  crownRadiusUnit: "mm",
  sphericalRadiusUnit: "mm",
  diameterOrShortSpanUnit: "mm",
  designTemperatureUnit: "C",
  allowableStressUnit: "MPa",
  originalThicknessUnit: "mm",
  previousThicknessUnit: "mm",
  actualThicknessUnit: "mm",
  pressure: "15",
  diameter: "2000",
  crownRadius: "2000",
  sphericalRadius: "1000",
  halfApexAngle: "30",
  diameterOrShortSpan: "200",
  attachmentFactor: "0.3",
  efficiency: "0.85",
  designTemperature: "150",
  materialSpec: "SA-516",
  gradeKey: "SA-516|70|176",
  stressMode: "auto",
  manualStress: "138",
  originalThickness: "18",
  previousThickness: "16.5",
  actualThickness: "15.8",
  buildYear: "2006",
  serviceYearsMode: "auto",
  manualServiceYears: "20",
  previousInspectionYear: "2021",
  inspectionYearsMode: "auto",
  manualInspectionYears: "5",
  nextInspectionYears: "5",
  resolvedAllowableStressMpa: 138,
  resolvedYearsInService: 20,
  resolvedYearsSincePreviousInspection: 5,
};

const result: Api510ResultSnapshot = {
  engineId: "api510.cylindrical-shell",
  engineVersion: "0.1.0-legacy-parity",
  ok: true,
  issues: [],
  intervalYears: 5,
  requiredThicknessMm: 12.887901733840304,
  minimumThicknessUsedMm: 12.887901733840304,
  longTermCorrosionRateMmPerYear: 0.11,
  shortTermCorrosionRateMmPerYear: 0.14,
  governingCorrosionRateMmPerYear: 0.14,
  corrosionAllowanceMm: 2.9120982661596955,
  remainingLifeYears: 20.800701901140684,
  governingMawpMpa: 1.836,
  hydrostaticTestPressureMpa: 2.3868,
  pneumaticTestPressureMpa: 2.0196,
  projectedThicknessMm: 15.1,
  futureMawpThicknessMm: 14.4,
  futureMawpMpa: 1.675,
};

function createModel(inputOverrides: Partial<Api510InputSnapshot> = {}, resultOverrides: Partial<Api510ResultSnapshot> = {}) {
  return createApi510ReportModel({
    projectName: "North process unit",
    client: "Example Energy",
    site: "Unit 2",
    equipmentTag: "V-201",
    equipmentName: "Separator vessel",
    calculationId: "calc-mixed-unit-001",
    title: "Cylindrical shell assessment",
    status: "draft",
    preparedBy: "Local test user",
    updatedAt: "2026-08-13T08:30:00.000Z",
    inputs: { ...inputs, ...inputOverrides },
    result: { ...result, ...resultOverrides },
  });
}

test("builds a metric report from the exact input and result snapshots", () => {
  const model = createModel();

  assert.equal(model.basisRows.find((row) => row.label === "Internal design pressure")?.value, "15.00 bar");
  assert.equal(model.resultRows.find((row) => row.label === "Required thickness")?.value, "12.89 mm");
  assert.equal(model.resultRows.find((row) => row.label === "Short-term corrosion rate")?.value, "0.140 mm/yr");
  assert.equal(model.planningRows.find((row) => row.label === "Future MAWP")?.value, "1.68 MPa");
  assert.equal(model.traceRows.find((row) => row.label === "Calculation status")?.value, "Completed without calculation errors");
  assert.equal(model.traceRows.find((row) => row.label === "Engine version"), undefined);
});

test("formats the same structured result snapshot in U.S. output units", () => {
  const model = createModel({ unitSystem: "us-customary", diameterUnit: "in", designTemperatureUnit: "F" });

  assert.equal(model.basisRows.find((row) => row.label === "Internal design pressure")?.value, "15.00 bar");
  assert.equal(model.resultRows.find((row) => row.label === "Required thickness")?.value, "0.51 in");
  assert.equal(model.resultRows.find((row) => row.label === "Governing MAWP")?.value, "266.29 psi");
  assert.equal(model.resultRows.find((row) => row.label === "Governing corrosion rate")?.value, "0.006 in/yr");
  assert.equal(model.planningRows.find((row) => row.label === "Future MAWP")?.value, "242.94 psi");
});

test("surfaces manual overrides and calculation issues in review and text output", () => {
  const model = createModel(
    { stressMode: "manual", manualStress: "140" },
    { ok: false, issues: [{ code: "pressure.invalid", field: "designPressureMpa", severity: "error", message: "Pressure must be positive." }] },
  );
  const text = buildApi510ReportText(model);

  assert.deepEqual(model.overrides, ["Allowable stress"]);
  assert.equal(model.resultOk, false);
  assert.match(text, /ERROR: Pressure must be positive\./);
  assert.match(text, /Same calculated result snapshot shown in the application/);
  assert.match(text, /not an issued engineering document/i);
});

test("uses the supplied result snapshot instead of recalculating report values", () => {
  const model = createModel({}, { requiredThicknessMm: 10, governingMawpMpa: 2.25 });

  assert.equal(model.resultRows.find((row) => row.label === "Required thickness")?.value, "10.00 mm");
  assert.equal(model.resultRows.find((row) => row.label === "Governing MAWP")?.value, "2.25 MPa");
  assert.equal(model.basisRows.find((row) => row.label === "Internal design pressure")?.value, "15.00 bar");
});

test("includes persisted reviewer, approver, notes and revision history", () => {
  const model = createApi510ReportModel({
    projectName: "North process unit",
    client: "Example Energy",
    site: "Unit 2",
    equipmentTag: "V-201",
    equipmentName: "Separator vessel",
    calculationId: "calc-reviewed-001",
    title: "Cylindrical shell assessment",
    status: "approved",
    preparedBy: "Fallback preparer",
    updatedAt: "2026-08-13T09:30:00.000Z",
    inputs,
    result,
    workflow: {
      revision: 2,
      preparedBy: "Field Engineer",
      reviewedBy: "Review Engineer",
      reviewNotes: "Verified field units and thickness dates.",
      reviewedAt: "2026-08-13T09:00:00.000Z",
      reviewedFingerprint: "fingerprint-r2",
      approvedBy: "Approving Engineer",
      approvalNotes: "Approved for local planning use.",
      approvedAt: "2026-08-13T09:30:00.000Z",
      approvedFingerprint: "fingerprint-r2",
      history: [
        { id: "event-1", type: "reviewed", status: "reviewed", revision: 2, actor: "Review Engineer", note: "Verified field units.", timestamp: "2026-08-13T09:00:00.000Z", fingerprint: "fingerprint-r2" },
        { id: "event-2", type: "approved", status: "approved", revision: 2, actor: "Approving Engineer", note: "Approved for local planning use.", timestamp: "2026-08-13T09:30:00.000Z", fingerprint: "fingerprint-r2" },
      ],
    },
  });
  const text = buildApi510ReportText(model);

  assert.equal(model.workflowStatus, "approved");
  assert.equal(model.preparedBy, "Field Engineer");
  assert.equal(model.workflowRows.find((row) => row.label === "Revision")?.value, "R2");
  assert.equal(model.revisionHistory[0]?.event, "R2 · APPROVED");
  assert.match(text, /Reviewed by: Review Engineer/);
  assert.match(text, /Approved for local planning use/);
});
