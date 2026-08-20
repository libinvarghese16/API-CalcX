import assert from "node:assert/strict";
import test from "node:test";

import {
  LocalProjectRepository,
  WORKSPACE_RECOVERY_KEY,
  WORKSPACE_STORAGE_KEY,
  api570EngineIdForCalculator,
  type StoragePort,
} from "../src/local-data/project-repository.ts";
import { createCalculationFingerprint } from "../src/local-data/calculation-workflow.ts";
import { createApi570CalculationFingerprint } from "../src/local-data/calculation-workflow.ts";
import { calculateApi570Piping, calculateApi570Tube } from "@api-calc-pro/calc-engine";
import type { Api510InputSnapshot, Api510ResultSnapshot, Api570CalculatorId, Api570PipingInputSnapshot, Api570TubeInputSnapshot } from "../src/local-data/models.ts";

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

const inputSnapshot: Api510InputSnapshot = {
  component: "flat-circular",
  unitSystem: "metric",
  pressureUnit: "Bar",
  diameterUnit: "mm",
  crownRadiusUnit: "m",
  sphericalRadiusUnit: "mm",
  diameterOrShortSpanUnit: "cm",
  designTemperatureUnit: "F",
  allowableStressUnit: "MPa",
  originalThicknessUnit: "mm",
  previousThicknessUnit: "in",
  actualThicknessUnit: "mm",
  pressure: "1.5",
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
};

const resultSnapshot: Api510ResultSnapshot = {
  engineId: "api510.flat-circular-head",
  engineVersion: "0.1.0-legacy-parity",
  ok: true,
  issues: [],
  intervalYears: 5,
  requiredThicknessMm: 12.387602085230009,
  minimumThicknessUsedMm: 12.387602085230009,
  longTermCorrosionRateMmPerYear: 0.11,
  shortTermCorrosionRateMmPerYear: 0.14,
  governingCorrosionRateMmPerYear: 0.14,
  corrosionAllowanceMm: 3.4123979147699917,
  remainingLifeYears: 24.374270819785683,
  governingMawpMpa: 2.440231,
  hydrostaticTestPressureMpa: 3.1723003,
  pneumaticTestPressureMpa: 2.6842541,
  projectedThicknessMm: 15.1,
  futureMawpThicknessMm: 14.4,
  futureMawpMpa: 2.026944,
};

const api570EngineInput = {
  pipingCode: "b31.3" as const,
  outsideDiameterMm: 323.85,
  designPressureMpa: 2,
  allowableStressMpa: 138,
  longitudinalQualityFactor: 0.85,
  weldStrengthReductionFactor: 1,
  yCoefficient: 0.4,
  allowanceMm: 3,
  originalThicknessMm: 18,
  previousThicknessMm: 16.5,
  actualThicknessMm: 15.8,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

const api570InputSnapshot: Api570PipingInputSnapshot = {
  calculatorId: "piping",
  unitSystem: "metric",
  fields: {
    designPressure: { value: "2", unit: "MPa", quantity: "pressure" },
    outsideDiameter: { value: "323.85", unit: "mm", quantity: "length" },
    designTemperature: { value: "150", unit: "C", quantity: "temperature" },
    allowableStress: { value: "138", unit: "MPa", quantity: "pressure" },
    allowance: { value: "3", unit: "mm", quantity: "length" },
    originalThickness: { value: "18", unit: "mm", quantity: "length" },
    previousThickness: { value: "16.5", unit: "mm", quantity: "length" },
    actualThickness: { value: "15.8", unit: "mm", quantity: "length" },
    structuralMinimum: { value: "", unit: "mm", quantity: "length" },
    manualMinimum: { value: "", unit: "mm", quantity: "length" },
  },
  pipingCode: "b31.3",
  buildYear: "2006",
  previousInspectionYear: "2021",
  serviceYearsMode: "auto",
  inspectionYearsMode: "auto",
  manualServiceYears: "20",
  manualInspectionYears: "5",
  minimumMode: "auto",
  qualityFactor: "0.85",
  weldFactor: "1",
  yCoefficient: "0.4",
  designFactor: "1",
  temperatureFactor: "1",
  hydrogenMaterialFactor: "1",
  hydrogenFactor: "1",
  intervalYears: "5",
  engineInput: api570EngineInput,
};

const api570ResultSnapshot = calculateApi570Piping(api570EngineInput);

const api570TubeEngineInput = {
  outsideDiameterMm: 50.8,
  designPressureMpa: 3.5,
  allowableStressMpa: 120,
  weldStrengthReductionFactor: 0.9,
  endCondition: "expanded" as const,
  expandedEndThicknessFactorMm: 0.5,
  originalThicknessMm: 5,
  previousThicknessMm: 4.6,
  actualThicknessMm: 4.3,
  yearsInService: 20,
  yearsSincePreviousInspection: 5,
  nextInspectionYears: 5,
};

const api570TubeInputSnapshot: Api570TubeInputSnapshot = {
  calculatorId: "tube",
  unitSystem: "metric",
  fields: {
    designPressure: { value: "3.5", unit: "MPa", quantity: "pressure" },
    outsideDiameter: { value: "50.8", unit: "mm", quantity: "length" },
    designTemperature: { value: "200", unit: "C", quantity: "temperature" },
    allowableStress: { value: "120", unit: "MPa", quantity: "pressure" },
    expandedEndFactor: { value: "0.5", unit: "mm", quantity: "length" },
    originalThickness: { value: "5", unit: "mm", quantity: "length" },
    previousThickness: { value: "4.6", unit: "mm", quantity: "length" },
    actualThickness: { value: "4.3", unit: "mm", quantity: "length" },
    manualMinimum: { value: "", unit: "mm", quantity: "length" },
  },
  endCondition: "expanded",
  buildYear: "2006",
  previousInspectionYear: "2021",
  serviceYearsMode: "auto",
  inspectionYearsMode: "auto",
  manualServiceYears: "20",
  manualInspectionYears: "5",
  minimumMode: "auto",
  weldFactor: "0.9",
  intervalYears: "5",
  engineInput: api570TubeEngineInput,
};

const api570TubeResultSnapshot = calculateApi570Tube(api570TubeEngineInput);

function createRepository(storage = new MemoryStorage()) {
  let sequence = 0;
  let minute = 0;
  return {
    storage,
    repository: new LocalProjectRepository(storage, {
      createId: () => `id-${++sequence}`,
      now: () => `2026-08-13T10:${String(minute++).padStart(2, "0")}:00.000Z`,
    }),
  };
}

const saveInput = (projectId: string, overrides: Partial<Parameters<LocalProjectRepository["saveCalculation"]>[0]> = {}) => ({
  projectId,
  equipmentTag: "V-201",
  equipmentName: "Separator",
  title: "Flat head assessment",
  status: "draft" as const,
  preparedBy: "Test preparer",
  inputs: inputSnapshot,
  result: resultSnapshot,
  ...overrides,
});

function fingerprint(projectId: string, calculation: ReturnType<LocalProjectRepository["saveCalculation"]>, equipmentName = "Separator") {
  return createCalculationFingerprint({
    projectId,
    equipmentTag: "V-201",
    equipmentName,
    title: calculation.title,
    inputs: calculation.inputs,
    result: calculation.result,
  });
}

const saveApi570Input = (projectId: string, overrides: Partial<Parameters<LocalProjectRepository["saveApi570Calculation"]>[0]> = {}) => ({
  projectId,
  calculatorId: "piping" as const,
  assetTag: "P-101",
  assetName: "Process piping circuit",
  title: "API 570 piping assessment",
  status: "draft" as const,
  preparedBy: "Test preparer",
  inputs: api570InputSnapshot,
  result: api570ResultSnapshot,
  ...overrides,
});

const saveApi570TubeInput = (projectId: string) => ({
  projectId,
  calculatorId: "tube" as const,
  assetTag: "E-101-TUBE",
  assetName: "Heat exchanger tubes",
  title: "API 570 tube assessment",
  status: "draft" as const,
  preparedBy: "Tube test preparer",
  inputs: api570TubeInputSnapshot,
  result: api570TubeResultSnapshot,
});

function api570Fingerprint(calculation: ReturnType<LocalProjectRepository["saveApi570Calculation"]>) {
  return createApi570CalculationFingerprint({
    projectId: calculation.projectId,
    assetTag: calculation.assetTag,
    assetName: calculation.assetName,
    title: calculation.title,
    inputs: calculation.inputs,
    result: calculation.result,
  });
}

test("creates and reloads a project from local storage", () => {
  const { repository, storage } = createRepository();
  const project = repository.createProject({ name: "North process unit", client: "Example Energy", site: "Unit 2" });

  const reloaded = new LocalProjectRepository(storage).getProject(project.id);
  assert.equal(reloaded?.name, "North process unit");
  assert.equal(reloaded?.client, "Example Energy");
  assert.equal(reloaded?.equipment.length, 0);
});

test("saves and updates an API 510 calculation under equipment", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "North process unit" });
  const saved = repository.saveCalculation(saveInput(project.id, { equipmentTag: "v-201" }));
  const updated = repository.saveCalculation(saveInput(project.id, { equipmentId: saved.equipmentId, calculationId: saved.id, title: "Flat head assessment R1", result: { ...resultSnapshot, futureMawpMpa: 2.01 } }));

  assert.equal(updated.id, saved.id);
  assert.equal(updated.status, "draft");
  assert.equal(updated.workflow.preparedBy, "Test preparer");
  assert.equal(repository.getProject(project.id)?.equipment[0]?.tag, "V-201");
  assert.equal(repository.getProject(project.id)?.equipment[0]?.calculations[0]?.result.futureMawpMpa, 2.01);
  assert.equal(repository.getProject(project.id)?.equipment[0]?.calculations[0]?.inputs.pressureUnit, "Bar");
  assert.equal(repository.getProject(project.id)?.equipment[0]?.calculations[0]?.inputs.previousThicknessUnit, "in");
});

test("saves, reloads and reopens an exact API 570 piping snapshot", () => {
  const { repository, storage } = createRepository();
  const project = repository.createProject({ name: "Piping integrity project" });
  const saved = repository.saveApi570Calculation(saveApi570Input(project.id));
  const reloaded = new LocalProjectRepository(storage).getProject(project.id)?.api570Calculations[0];

  assert.equal(saved.standard, "API 570");
  assert.equal(reloaded?.calculatorId, "piping");
  assert.equal(reloaded?.assetTag, "P-101");
  assert.equal(reloaded?.inputs.fields.designPressure.unit, "MPa");
  assert.equal(reloaded?.inputs.engineInput.outsideDiameterMm, 323.85);
  assert.equal(reloaded?.result.requiredThicknessMm, api570ResultSnapshot.requiredThicknessMm);
});

test("saves, reloads and reopens an exact API 570 tube snapshot", () => {
  const { repository, storage } = createRepository();
  const project = repository.createProject({ name: "Tube integrity project" });
  const saved = repository.saveApi570Calculation(saveApi570TubeInput(project.id));
  const reloaded = new LocalProjectRepository(storage).getProject(project.id)?.api570Calculations[0];

  assert.equal(saved.standard, "API 570");
  assert.equal(reloaded?.calculatorId, "tube");
  assert.equal(reloaded?.assetTag, "E-101-TUBE");
  assert.equal(reloaded?.inputs.calculatorId, "tube");
  assert.equal(reloaded?.inputs.engineInput.outsideDiameterMm, 50.8);
  assert.equal(reloaded?.result.engineId, "api570.tube");
  assert.equal(reloaded?.result.requiredThicknessMm, api570TubeResultSnapshot.requiredThicknessMm);
});

test("maps all 11 API 570 calculator records to their protected engine IDs", () => {
  const expected: Record<Api570CalculatorId, string> = {
    piping: "api570.piping",
    tube: "api570.tube",
    header: "api570.header",
    "pressure-design": "api570.support.pressure-design",
    "valve-fittings": "api570.support.valve-flanged-fittings",
    "hydro-test": "api570.support.hydro-test-pressure",
    "flange-hydro-test": "api570.support.flange-hydro-test",
    "pneumatic-test": "api570.support.pneumatic-test-pressure",
    "fillet-weld": "api570.support.fillet-weld-sizing",
    "tension-test": "api570.support.tension-test",
    "soil-resistivity": "api570.support.soil-resistivity",
  };

  for (const [calculatorId, engineId] of Object.entries(expected) as [Api570CalculatorId, string][]) {
    assert.equal(api570EngineIdForCalculator(calculatorId), engineId);
  }
});

test("rejects an API 570 result from a different calculator", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "API 570 guard project" });

  assert.throws(() => repository.saveApi570Calculation({
    ...saveApi570TubeInput(project.id),
    result: api570ResultSnapshot,
  }), /result does not match/i);
});

test("enforces the API 570 Draft to Reviewed to Approved workflow and revisions", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "Piping workflow project" });
  const saved = repository.saveApi570Calculation(saveApi570Input(project.id));
  const reviewed = repository.reviewApi570Calculation({
    projectId: project.id,
    calculationId: saved.id,
    reviewerName: "Piping reviewer",
    reviewNotes: "Checked code basis and thickness history.",
    fingerprint: api570Fingerprint(saved),
  });
  const approved = repository.approveApi570Calculation({
    projectId: project.id,
    calculationId: reviewed.id,
    approverName: "Integrity approver",
    approvalNotes: "Approved for local planning.",
    fingerprint: api570Fingerprint(reviewed),
  });
  const revisedInputs = { ...api570InputSnapshot, buildYear: "2005" };
  const revised = repository.saveApi570Calculation(saveApi570Input(project.id, {
    calculationId: approved.id,
    inputs: revisedInputs,
    changeNote: "Corrected build year.",
  }));

  assert.equal(reviewed.status, "reviewed");
  assert.equal(approved.status, "approved");
  assert.equal(revised.status, "draft");
  assert.equal(revised.workflow.revision, 2);
  assert.equal(revised.workflow.reviewedBy, undefined);
  assert.deepEqual(revised.workflow.history.map((event) => event.type), ["saved", "reviewed", "approved", "revised"]);
});

test("reuses equipment when the normalized tag already exists", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "North process unit" });
  repository.saveCalculation(saveInput(project.id, { title: "First" }));
  repository.saveCalculation(saveInput(project.id, { equipmentTag: "v-201", title: "Second" }));

  const stored = repository.getProject(project.id);
  assert.equal(stored?.equipment.length, 1);
  assert.equal(stored?.equipment[0]?.calculations.length, 2);
});

test("duplicates a saved calculation as a new draft", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "North process unit" });
  const saved = repository.saveCalculation(saveInput(project.id));
  const reviewed = repository.reviewCalculation({ projectId: project.id, equipmentId: saved.equipmentId, calculationId: saved.id, reviewerName: "Review Engineer", reviewNotes: "Checked inputs.", fingerprint: fingerprint(project.id, saved) });
  const duplicate = repository.duplicateCalculation(project.id, reviewed.equipmentId, reviewed.id);

  assert.notEqual(duplicate.id, saved.id);
  assert.equal(duplicate.title, "Flat head assessment copy");
  assert.equal(duplicate.status, "draft");
  assert.equal(duplicate.workflow.revision, 1);
  assert.equal(duplicate.workflow.reviewedBy, undefined);
});

test("enforces Draft to Reviewed to Approved with names, notes and history", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "North process unit" });
  const saved = repository.saveCalculation(saveInput(project.id));
  const reviewed = repository.reviewCalculation({
    projectId: project.id,
    equipmentId: saved.equipmentId,
    calculationId: saved.id,
    reviewerName: "Review Engineer",
    reviewNotes: "Units and corrosion history checked.",
    fingerprint: fingerprint(project.id, saved),
  });
  const approved = repository.approveCalculation({
    projectId: project.id,
    equipmentId: saved.equipmentId,
    calculationId: saved.id,
    approverName: "Approving Engineer",
    approvalNotes: "Approved for local planning use.",
    fingerprint: fingerprint(project.id, reviewed),
  });

  assert.equal(reviewed.status, "reviewed");
  assert.equal(reviewed.workflow.reviewedBy, "Review Engineer");
  assert.equal(approved.status, "approved");
  assert.equal(approved.workflow.approvedBy, "Approving Engineer");
  assert.deepEqual(approved.workflow.history.map((event) => event.type), ["saved", "reviewed", "approved"]);
});

test("editing a reviewed calculation creates a new draft revision and invalidates sign-off", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "North process unit" });
  const saved = repository.saveCalculation(saveInput(project.id));
  const reviewed = repository.reviewCalculation({ projectId: project.id, equipmentId: saved.equipmentId, calculationId: saved.id, reviewerName: "Review Engineer", fingerprint: fingerprint(project.id, saved) });
  const revised = repository.saveCalculation(saveInput(project.id, { equipmentId: reviewed.equipmentId, calculationId: reviewed.id, inputs: { ...inputSnapshot, pressure: "1.6" }, changeNote: "Updated design pressure." }));

  assert.equal(revised.status, "draft");
  assert.equal(revised.workflow.revision, 2);
  assert.equal(revised.workflow.reviewedBy, undefined);
  assert.equal(revised.workflow.history.at(-1)?.type, "revised");
  assert.equal(revised.workflow.history.at(-1)?.note, "Updated design pressure.");
});

test("archives and deletes local projects", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "North process unit" });

  assert.equal(repository.setProjectArchived(project.id, true).status, "archived");
  repository.deleteProject(project.id);
  assert.equal(repository.listProjects().length, 0);
});

test("quarantines malformed stored data instead of crashing", () => {
  const storage = new MemoryStorage();
  storage.setItem(WORKSPACE_STORAGE_KEY, "{not valid json");
  const repository = new LocalProjectRepository(storage);

  assert.deepEqual(repository.listProjects(), []);
  assert.equal(storage.getItem(WORKSPACE_RECOVERY_KEY), "{not valid json");
  assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), null);
});

test("migrates the previous completed status into a persisted reviewed workflow", () => {
  const { repository, storage } = createRepository();
  const project = repository.createProject({ name: "Legacy project" });
  repository.saveCalculation(saveInput(project.id));
  const legacy = JSON.parse(storage.getItem(WORKSPACE_STORAGE_KEY) ?? "{}") as { projects: Array<{ equipment: Array<{ calculations: Array<Record<string, unknown>> }> }> };
  const legacyCalculation = legacy.projects[0]?.equipment[0]?.calculations[0];
  assert.ok(legacyCalculation);
  legacyCalculation.status = "completed";
  delete legacyCalculation.workflow;
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(legacy));

  const migrated = new LocalProjectRepository(storage).listProjects()[0]?.equipment[0]?.calculations[0];
  assert.equal(migrated?.status, "reviewed");
  assert.equal(migrated?.workflow.reviewedBy, "Legacy local review");
  assert.equal(migrated?.workflow.history[0]?.type, "reviewed");
});

test("exports a versioned workspace backup with exact calculation and workflow snapshots", () => {
  const { repository } = createRepository();
  const project = repository.createProject({ name: "Backup project", client: "Example Energy", site: "Unit 2" });
  const saved = repository.saveCalculation(saveInput(project.id));
  repository.reviewCalculation({ projectId: project.id, equipmentId: saved.equipmentId, calculationId: saved.id, reviewerName: "Review Engineer", reviewNotes: "Backup trace check.", fingerprint: fingerprint(project.id, saved) });

  const backup = repository.createBackup();
  const envelope = JSON.parse(backup.raw) as { format: string; backupVersion: number; projects: Array<{ equipment: Array<{ calculations: Array<{ result: Api510ResultSnapshot; workflow: { reviewedBy?: string } }> }> }> };

  assert.equal(envelope.format, "api-calc-pro-workspace-backup");
  assert.equal(envelope.backupVersion, 1);
  assert.equal(backup.summary.projectCount, 1);
  assert.equal(backup.summary.calculationCount, 1);
  assert.equal(envelope.projects[0]?.equipment[0]?.calculations[0]?.result.futureMawpMpa, resultSnapshot.futureMawpMpa);
  assert.equal(envelope.projects[0]?.equipment[0]?.calculations[0]?.workflow.reviewedBy, "Review Engineer");
});

test("exports one selected project without unrelated workspace records", () => {
  const { repository } = createRepository();
  const first = repository.createProject({ name: "First project" });
  repository.createProject({ name: "Second project" });

  const backup = repository.createBackup(first.id);
  const envelope = JSON.parse(backup.raw) as { scope: string; projects: Array<{ id: string }> };

  assert.equal(envelope.scope, "project");
  assert.deepEqual(envelope.projects.map((project) => project.id), [first.id]);
  assert.match(backup.fileName, /first-project/);
});

test("previews and safely merges missing backup records while skipping duplicate IDs", () => {
  const source = createRepository();
  const project = source.repository.createProject({ name: "Portable project" });
  source.repository.saveCalculation(saveInput(project.id));
  const backup = source.repository.createBackup().raw;
  const destination = createRepository();

  const preview = destination.repository.previewBackup(backup);
  const imported = destination.repository.importBackup(backup);
  const repeated = destination.repository.importBackup(backup);

  assert.equal(preview.addedProjects, 1);
  assert.equal(imported.addedCalculations, 1);
  assert.equal(destination.repository.listProjects()[0]?.name, "Portable project");
  assert.equal(repeated.addedProjects, 0);
  assert.equal(repeated.duplicateCalculations, 1);
  assert.equal(destination.repository.listProjects().length, 1);
});

test("rejects malformed or unsupported backups without changing local records", () => {
  const { repository } = createRepository();
  repository.createProject({ name: "Keep local" });

  assert.throws(() => repository.previewBackup("{broken"), /not valid JSON/);
  assert.throws(() => repository.importBackup(JSON.stringify({ format: "another-app", backupVersion: 1 })), /not a supported API Calc Pro backup/);
  assert.deepEqual(repository.listProjects().map((project) => project.name), ["Keep local"]);
});
