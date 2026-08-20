import type {
  ApproveApi570CalculationInput,
  ApproveCalculationInput,
  Api570CalculatorId,
  CalculationWorkflow,
  CreateProjectInput,
  LocalEquipment,
  LocalProject,
  LocalWorkspaceV1,
  ReviewApi570CalculationInput,
  ReviewCalculationInput,
  SaveApi570CalculationInput,
  SaveCalculationInput,
  SavedApi570Calculation,
  SavedApi510Calculation,
  WorkspaceBackupEnvelopeV1,
  WorkspaceBackupPreview,
  WorkspaceBackupSummary,
  WorkspaceImportResult,
} from "./models.ts";
import { createApi570CalculationFingerprint, createCalculationFingerprint } from "./calculation-workflow.ts";

export const WORKSPACE_STORAGE_KEY = "api-calc-pro.local-workspace.v1";
export const WORKSPACE_RECOVERY_KEY = "api-calc-pro.local-workspace.recovery";

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface RepositoryOptions {
  now?: () => string;
  createId?: () => string;
}

const emptyWorkspace = (): LocalWorkspaceV1 => ({ schemaVersion: 1, projects: [] });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const api570EngineIdByCalculator: Record<Api570CalculatorId, string> = {
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

export function api570EngineIdForCalculator(calculatorId: Api570CalculatorId): string {
  return api570EngineIdByCalculator[calculatorId];
}

function isApi570CalculatorId(value: unknown): value is Api570CalculatorId {
  return typeof value === "string" && Object.hasOwn(api570EngineIdByCalculator, value);
}

function isSavedCalculation(value: unknown): value is SavedApi510Calculation {
  if (!value || typeof value !== "object") return false;
  const calculation = value as Partial<SavedApi510Calculation>;
  return typeof calculation.id === "string"
    && typeof calculation.projectId === "string"
    && typeof calculation.equipmentId === "string"
    && typeof calculation.title === "string"
    && (["draft", "completed", "reviewed", "approved"] as string[]).includes(String(calculation.status))
    && (calculation.workflow === undefined || isWorkflow(calculation.workflow))
    && Boolean(calculation.inputs && typeof calculation.inputs === "object")
    && Boolean(calculation.result && typeof calculation.result === "object")
    && typeof calculation.createdAt === "string"
    && typeof calculation.updatedAt === "string";
}

function isSavedApi570Calculation(value: unknown): value is SavedApi570Calculation {
  if (!value || typeof value !== "object") return false;
  const calculation = value as Partial<SavedApi570Calculation>;
  const calculatorId = calculation.calculatorId;
  const expectedEngineId = isApi570CalculatorId(calculatorId) ? api570EngineIdByCalculator[calculatorId] : "";
  return typeof calculation.id === "string"
    && typeof calculation.projectId === "string"
    && calculation.standard === "API 570"
    && isApi570CalculatorId(calculatorId)
    && typeof calculation.assetTag === "string"
    && typeof calculation.assetName === "string"
    && typeof calculation.title === "string"
    && (["draft", "reviewed", "approved"] as string[]).includes(String(calculation.status))
    && isWorkflow(calculation.workflow)
    && Boolean(calculation.inputs && typeof calculation.inputs === "object" && calculation.inputs.calculatorId === calculatorId)
    && Boolean(calculation.result && typeof calculation.result === "object" && calculation.result.engineId === expectedEngineId)
    && typeof calculation.createdAt === "string"
    && typeof calculation.updatedAt === "string";
}

function isWorkflow(value: unknown): value is CalculationWorkflow {
  if (!value || typeof value !== "object") return false;
  const workflow = value as Partial<CalculationWorkflow>;
  return Number.isInteger(workflow.revision)
    && Number(workflow.revision) > 0
    && typeof workflow.preparedBy === "string"
    && Array.isArray(workflow.history)
    && workflow.history.every((event) => Boolean(event)
      && typeof event === "object"
      && typeof event.id === "string"
      && (["saved", "revised", "reviewed", "approved"] as string[]).includes(String(event.type))
      && (["draft", "reviewed", "approved"] as string[]).includes(String(event.status))
      && Number.isInteger(event.revision)
      && typeof event.actor === "string"
      && typeof event.note === "string"
      && typeof event.timestamp === "string"
      && typeof event.fingerprint === "string");
}

function isEquipment(value: unknown): value is LocalEquipment {
  if (!value || typeof value !== "object") return false;
  const equipment = value as Partial<LocalEquipment>;
  return typeof equipment.id === "string"
    && typeof equipment.tag === "string"
    && typeof equipment.name === "string"
    && equipment.type === "pressure-vessel"
    && Array.isArray(equipment.calculations)
    && equipment.calculations.every(isSavedCalculation)
    && typeof equipment.createdAt === "string"
    && typeof equipment.updatedAt === "string";
}

function isProject(value: unknown): value is LocalProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<LocalProject>;
  return typeof project.id === "string"
    && typeof project.name === "string"
    && typeof project.client === "string"
    && typeof project.site === "string"
    && typeof project.description === "string"
    && (project.status === "active" || project.status === "archived")
    && Array.isArray(project.equipment)
    && project.equipment.every(isEquipment)
    && (project.api570Calculations === undefined || (Array.isArray(project.api570Calculations) && project.api570Calculations.every(isSavedApi570Calculation)))
    && typeof project.createdAt === "string"
    && typeof project.updatedAt === "string";
}

function parseWorkspace(raw: string): LocalWorkspaceV1 | null {
  try {
    const value = JSON.parse(raw) as Partial<LocalWorkspaceV1>;
    if (value.schemaVersion !== 1 || !Array.isArray(value.projects) || !value.projects.every(isProject)) return null;
    const workspace = value as LocalWorkspaceV1;
    workspace.projects.forEach((project) => {
      project.api570Calculations ??= [];
      project.equipment.forEach((equipment) => {
        equipment.calculations = equipment.calculations.map((calculation) => normalizeCalculation(calculation, project.id, equipment));
      });
    });
    return workspace;
  } catch {
    return null;
  }
}

function backupSummary(envelope: WorkspaceBackupEnvelopeV1): WorkspaceBackupSummary {
  const equipmentCount = envelope.projects.reduce((total, project) => total + project.equipment.length, 0);
  const calculationCount = envelope.projects.reduce((projectTotal, project) => projectTotal
    + project.equipment.reduce((equipmentTotal, equipment) => equipmentTotal + equipment.calculations.length, 0)
    + project.api570Calculations.length, 0);
  return {
    scope: envelope.scope,
    exportedAt: envelope.exportedAt,
    projectCount: envelope.projects.length,
    equipmentCount,
    calculationCount,
  };
}

function parseBackup(raw: string): WorkspaceBackupEnvelopeV1 {
  let value: Partial<WorkspaceBackupEnvelopeV1>;
  try {
    value = JSON.parse(raw) as Partial<WorkspaceBackupEnvelopeV1>;
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  if (value.format !== "api-calc-pro-workspace-backup" || value.backupVersion !== 1 || value.schemaVersion !== 1) {
    throw new Error("This is not a supported API Calc Pro backup file.");
  }
  if (value.scope !== "workspace" && value.scope !== "project") throw new Error("The backup scope is invalid.");
  if (typeof value.exportedAt !== "string" || Number.isNaN(new Date(value.exportedAt).getTime())) throw new Error("The backup timestamp is invalid.");
  if (typeof value.appVersion !== "string" || !Array.isArray(value.projects)) throw new Error("The backup metadata is incomplete.");
  if (value.scope === "project" && value.projects.length !== 1) throw new Error("A project backup must contain exactly one project.");
  const workspace = parseWorkspace(JSON.stringify({ schemaVersion: 1, projects: value.projects }));
  if (!workspace) throw new Error("The backup contains invalid or incomplete project records.");
  return {
    format: "api-calc-pro-workspace-backup",
    backupVersion: 1,
    schemaVersion: 1,
    scope: value.scope,
    exportedAt: value.exportedAt,
    appVersion: value.appVersion,
    projects: workspace.projects,
  };
}

interface MergeResult {
  workspace: LocalWorkspaceV1;
  addedProjects: number;
  matchedProjects: number;
  addedEquipment: number;
  addedCalculations: number;
  duplicateCalculations: number;
}

function mergeBackup(workspace: LocalWorkspaceV1, importedProjects: LocalProject[]): MergeResult {
  const merged = clone(workspace);
  const result: MergeResult = { workspace: merged, addedProjects: 0, matchedProjects: 0, addedEquipment: 0, addedCalculations: 0, duplicateCalculations: 0 };
  importedProjects.forEach((importedProject) => {
    const existingProject = merged.projects.find((project) => project.id === importedProject.id);
    if (!existingProject) {
      merged.projects.push(clone(importedProject));
      result.addedProjects += 1;
      result.addedEquipment += importedProject.equipment.length;
      result.addedCalculations += importedProject.equipment.reduce((total, equipment) => total + equipment.calculations.length, 0)
        + importedProject.api570Calculations.length;
      return;
    }
    result.matchedProjects += 1;
    importedProject.equipment.forEach((importedEquipment) => {
      const existingEquipment = existingProject.equipment.find((equipment) => equipment.id === importedEquipment.id);
      if (!existingEquipment) {
        existingProject.equipment.push(clone(importedEquipment));
        result.addedEquipment += 1;
        result.addedCalculations += importedEquipment.calculations.length;
        return;
      }
      importedEquipment.calculations.forEach((importedCalculation) => {
        if (existingEquipment.calculations.some((calculation) => calculation.id === importedCalculation.id)) {
          result.duplicateCalculations += 1;
          return;
        }
        existingEquipment.calculations.push(clone(importedCalculation));
        result.addedCalculations += 1;
      });
      existingEquipment.updatedAt = [existingEquipment.updatedAt, importedEquipment.updatedAt].sort().at(-1) ?? existingEquipment.updatedAt;
    });
    importedProject.api570Calculations.forEach((importedCalculation) => {
      if (existingProject.api570Calculations.some((calculation) => calculation.id === importedCalculation.id)) {
        result.duplicateCalculations += 1;
        return;
      }
      existingProject.api570Calculations.push(clone(importedCalculation));
      result.addedCalculations += 1;
    });
    existingProject.updatedAt = [existingProject.updatedAt, importedProject.updatedAt].sort().at(-1) ?? existingProject.updatedAt;
  });
  return result;
}

function backupFileName(scope: WorkspaceBackupEnvelopeV1["scope"], project?: LocalProject): string {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = project?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `api-calc-pro-${scope}${suffix ? `-${suffix}` : ""}-${date}.json`;
}

function calculationFingerprint(calculation: SavedApi510Calculation, projectId: string, equipment: LocalEquipment): string {
  return createCalculationFingerprint({
    projectId,
    equipmentTag: equipment.tag,
    equipmentName: equipment.name,
    title: calculation.title,
    inputs: calculation.inputs,
    result: calculation.result,
  });
}

function normalizeCalculation(calculation: SavedApi510Calculation, projectId: string, equipment: LocalEquipment): SavedApi510Calculation {
  const legacyStatus = String(calculation.status);
  const status = legacyStatus === "completed" ? "reviewed" : calculation.status;
  const fingerprint = createCalculationFingerprint({
    projectId,
    equipmentTag: equipment.tag,
    equipmentName: equipment.name,
    title: calculation.title,
    inputs: calculation.inputs,
    result: calculation.result,
  });
  const workflow = calculation.workflow ?? {
    revision: 1,
    preparedBy: "Local user",
    reviewedBy: status === "reviewed" ? "Legacy local review" : undefined,
    reviewNotes: status === "reviewed" ? "Migrated from the previous completed local-record status." : undefined,
    reviewedAt: status === "reviewed" ? calculation.updatedAt : undefined,
    reviewedFingerprint: status === "reviewed" ? fingerprint : undefined,
    history: [{
      id: `migration-${calculation.id}`,
      type: status === "reviewed" ? "reviewed" as const : "saved" as const,
      status,
      revision: 1,
      actor: status === "reviewed" ? "Legacy local review" : "Local user",
      note: status === "reviewed" ? "Migrated from completed local record." : "Existing local draft migrated to the traceable workflow.",
      timestamp: calculation.updatedAt,
      fingerprint,
    }],
  };
  if (status === "reviewed" && !workflow.reviewedFingerprint) workflow.reviewedFingerprint = fingerprint;
  if (status === "approved" && !workflow.approvedFingerprint) workflow.approvedFingerprint = fingerprint;
  return { ...calculation, status, workflow };
}

function api570CalculationFingerprint(calculation: SavedApi570Calculation): string {
  return createApi570CalculationFingerprint({
    projectId: calculation.projectId,
    assetTag: calculation.assetTag,
    assetName: calculation.assetName,
    title: calculation.title,
    inputs: calculation.inputs,
    result: calculation.result,
  });
}

export class LocalProjectRepository {
  private readonly storage: StoragePort;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(storage: StoragePort, options: RepositoryOptions = {}) {
    this.storage = storage;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => globalThis.crypto.randomUUID());
  }

  listProjects(): LocalProject[] {
    return clone(this.read().projects).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  createBackup(projectId?: string): { fileName: string; raw: string; summary: WorkspaceBackupSummary } {
    const workspace = this.read();
    const project = projectId ? workspace.projects.find((candidate) => candidate.id === projectId) : undefined;
    if (projectId && !project) throw new Error("Project was not found.");
    const envelope: WorkspaceBackupEnvelopeV1 = {
      format: "api-calc-pro-workspace-backup",
      backupVersion: 1,
      schemaVersion: 1,
      scope: project ? "project" : "workspace",
      exportedAt: this.now(),
      appVersion: "0.1.0-local",
      projects: project ? [clone(project)] : clone(workspace.projects),
    };
    return { fileName: backupFileName(envelope.scope, project), raw: JSON.stringify(envelope, null, 2), summary: backupSummary(envelope) };
  }

  previewBackup(raw: string): WorkspaceBackupPreview {
    const envelope = parseBackup(raw);
    const merge = mergeBackup(this.read(), envelope.projects);
    return { ...backupSummary(envelope), addedProjects: merge.addedProjects, matchedProjects: merge.matchedProjects, addedEquipment: merge.addedEquipment, addedCalculations: merge.addedCalculations, duplicateCalculations: merge.duplicateCalculations, raw };
  }

  importBackup(raw: string): WorkspaceImportResult {
    const envelope = parseBackup(raw);
    const merge = mergeBackup(this.read(), envelope.projects);
    if (merge.addedProjects || merge.addedEquipment || merge.addedCalculations) this.write(merge.workspace);
    return { ...backupSummary(envelope), addedProjects: merge.addedProjects, matchedProjects: merge.matchedProjects, addedEquipment: merge.addedEquipment, addedCalculations: merge.addedCalculations, duplicateCalculations: merge.duplicateCalculations };
  }

  getProject(projectId: string): LocalProject | null {
    const project = this.read().projects.find((candidate) => candidate.id === projectId);
    return project ? clone(project) : null;
  }

  createProject(input: CreateProjectInput): LocalProject {
    const name = input.name.trim();
    if (!name) throw new Error("Project name is required.");
    const workspace = this.read();
    const timestamp = this.now();
    const project: LocalProject = {
      id: this.createId(),
      name,
      client: input.client?.trim() ?? "",
      site: input.site?.trim() ?? "",
      description: input.description?.trim() ?? "",
      status: "active",
      equipment: [],
      api570Calculations: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    workspace.projects.push(project);
    this.write(workspace);
    return clone(project);
  }

  setProjectArchived(projectId: string, archived: boolean): LocalProject {
    const workspace = this.read();
    const project = this.requireProject(workspace, projectId);
    project.status = archived ? "archived" : "active";
    project.updatedAt = this.now();
    this.write(workspace);
    return clone(project);
  }

  deleteProject(projectId: string): void {
    const workspace = this.read();
    const nextProjects = workspace.projects.filter((project) => project.id !== projectId);
    if (nextProjects.length === workspace.projects.length) throw new Error("Project was not found.");
    workspace.projects = nextProjects;
    this.write(workspace);
  }

  saveCalculation(input: SaveCalculationInput): SavedApi510Calculation {
    const equipmentTag = input.equipmentTag.trim().toUpperCase();
    if (!equipmentTag) throw new Error("Equipment tag is required.");
    if (!input.title.trim()) throw new Error("Calculation title is required.");
    if (!input.preparedBy.trim()) throw new Error("Preparer name is required.");
    const workspace = this.read();
    const project = this.requireProject(workspace, input.projectId);
    const timestamp = this.now();
    let equipment = input.equipmentId
      ? project.equipment.find((candidate) => candidate.id === input.equipmentId)
      : undefined;
    equipment ??= project.equipment.find((candidate) => candidate.tag.toUpperCase() === equipmentTag);
    const previousEquipmentTag = equipment?.tag;
    const previousEquipmentName = equipment?.name;
    if (!equipment) {
      equipment = {
        id: this.createId(),
        tag: equipmentTag,
        name: input.equipmentName?.trim() || "Pressure vessel",
        type: "pressure-vessel",
        calculations: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      project.equipment.push(equipment);
    } else {
      equipment.tag = equipmentTag;
      equipment.name = input.equipmentName?.trim() || equipment.name;
      equipment.updatedAt = timestamp;
    }

    let calculation = input.calculationId
      ? equipment.calculations.find((candidate) => candidate.id === input.calculationId)
      : undefined;
    if (input.calculationId && !calculation) throw new Error("Saved calculation was not found.");
    if (calculation) {
      const previousFingerprint = createCalculationFingerprint({
        projectId: project.id,
        equipmentTag: previousEquipmentTag ?? equipment.tag,
        equipmentName: previousEquipmentName ?? equipment.name,
        title: calculation.title,
        inputs: calculation.inputs,
        result: calculation.result,
      });
      const nextFingerprint = createCalculationFingerprint({
        projectId: project.id,
        equipmentTag,
        equipmentName: input.equipmentName?.trim() || equipment.name,
        title: input.title,
        inputs: input.inputs,
        result: input.result,
      });
      const createsRevision = previousFingerprint !== nextFingerprint && calculation.status !== "draft";
      calculation.title = input.title.trim();
      if (createsRevision) {
        calculation.status = "draft";
        calculation.workflow.revision += 1;
        calculation.workflow.reviewedBy = undefined;
        calculation.workflow.reviewNotes = undefined;
        calculation.workflow.reviewedAt = undefined;
        calculation.workflow.reviewedFingerprint = undefined;
        calculation.workflow.approvedBy = undefined;
        calculation.workflow.approvalNotes = undefined;
        calculation.workflow.approvedAt = undefined;
        calculation.workflow.approvedFingerprint = undefined;
        calculation.workflow.history.push({
          id: this.createId(),
          type: "revised",
          status: "draft",
          revision: calculation.workflow.revision,
          actor: input.preparedBy.trim(),
          note: input.changeNote?.trim() || "Calculation content changed after review or approval.",
          timestamp,
          fingerprint: nextFingerprint,
        });
      }
      calculation.workflow.preparedBy = input.preparedBy.trim();
      calculation.inputs = clone(input.inputs);
      calculation.result = clone(input.result);
      calculation.updatedAt = timestamp;
    } else {
      calculation = {
        id: this.createId(),
        projectId: project.id,
        equipmentId: equipment.id,
        title: input.title.trim(),
        status: "draft",
        workflow: {
          revision: 1,
          preparedBy: input.preparedBy.trim(),
          history: [],
        },
        inputs: clone(input.inputs),
        result: clone(input.result),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      calculation.workflow.history.push({
        id: this.createId(),
        type: "saved",
        status: "draft",
        revision: 1,
        actor: input.preparedBy.trim(),
        note: input.changeNote?.trim() || "Initial local calculation record saved.",
        timestamp,
        fingerprint: createCalculationFingerprint({
          projectId: project.id,
          equipmentTag,
          equipmentName: equipment.name,
          title: calculation.title,
          inputs: calculation.inputs,
          result: calculation.result,
        }),
      });
      equipment.calculations.push(calculation);
    }
    equipment.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(calculation);
  }

  saveApi570Calculation(input: SaveApi570CalculationInput): SavedApi570Calculation {
    const assetTag = input.assetTag.trim().toUpperCase();
    if (!assetTag) throw new Error("Asset or piping tag is required.");
    if (!input.title.trim()) throw new Error("Calculation title is required.");
    if (!input.preparedBy.trim()) throw new Error("Preparer name is required.");
    const workspace = this.read();
    const project = this.requireProject(workspace, input.projectId);
    const timestamp = this.now();
    let calculation = input.calculationId
      ? project.api570Calculations.find((candidate) => candidate.id === input.calculationId)
      : undefined;
    if (input.calculationId && !calculation) throw new Error("Saved API 570 calculation was not found.");
    if (calculation && calculation.calculatorId !== input.calculatorId) throw new Error("The saved API 570 record belongs to a different calculator.");
    if (input.inputs.calculatorId !== input.calculatorId) throw new Error("The API 570 input snapshot does not match the selected calculator.");
    const expectedEngineId = api570EngineIdForCalculator(input.calculatorId);
    if (input.result.engineId !== expectedEngineId) throw new Error("The API 570 result does not match the selected calculator.");

    if (calculation) {
      const previousFingerprint = api570CalculationFingerprint(calculation);
      const nextFingerprint = createApi570CalculationFingerprint({
        projectId: project.id,
        assetTag,
        assetName: input.assetName?.trim() || calculation.assetName,
        title: input.title,
        inputs: input.inputs,
        result: input.result,
      });
      const createsRevision = previousFingerprint !== nextFingerprint && calculation.status !== "draft";
      calculation.assetTag = assetTag;
      calculation.assetName = input.assetName?.trim() || calculation.assetName;
      calculation.title = input.title.trim();
      if (createsRevision) {
        calculation.status = "draft";
        calculation.workflow.revision += 1;
        calculation.workflow.reviewedBy = undefined;
        calculation.workflow.reviewNotes = undefined;
        calculation.workflow.reviewedAt = undefined;
        calculation.workflow.reviewedFingerprint = undefined;
        calculation.workflow.approvedBy = undefined;
        calculation.workflow.approvalNotes = undefined;
        calculation.workflow.approvedAt = undefined;
        calculation.workflow.approvedFingerprint = undefined;
        calculation.workflow.history.push({
          id: this.createId(),
          type: "revised",
          status: "draft",
          revision: calculation.workflow.revision,
          actor: input.preparedBy.trim(),
          note: input.changeNote?.trim() || "API 570 calculation content changed after review or approval.",
          timestamp,
          fingerprint: nextFingerprint,
        });
      }
      calculation.workflow.preparedBy = input.preparedBy.trim();
      calculation.inputs = clone(input.inputs);
      calculation.result = clone(input.result);
      calculation.updatedAt = timestamp;
    } else {
      calculation = {
        id: this.createId(),
        projectId: project.id,
        standard: "API 570",
        calculatorId: input.calculatorId,
        assetTag,
        assetName: input.assetName?.trim() || (input.calculatorId === "tube" ? "Heat exchanger tubes" : "Piping system"),
        title: input.title.trim(),
        status: "draft",
        workflow: { revision: 1, preparedBy: input.preparedBy.trim(), history: [] },
        inputs: clone(input.inputs),
        result: clone(input.result),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      calculation.workflow.history.push({
        id: this.createId(),
        type: "saved",
        status: "draft",
        revision: 1,
        actor: calculation.workflow.preparedBy,
        note: input.changeNote?.trim() || "Initial local API 570 calculation record saved.",
        timestamp,
        fingerprint: api570CalculationFingerprint(calculation),
      });
      project.api570Calculations.push(calculation);
    }
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(calculation);
  }

  reviewApi570Calculation(input: ReviewApi570CalculationInput): SavedApi570Calculation {
    const reviewerName = input.reviewerName.trim();
    if (!reviewerName) throw new Error("Reviewer name is required.");
    const workspace = this.read();
    const { project, calculation } = this.requireApi570Calculation(workspace, input.projectId, input.calculationId);
    const fingerprint = api570CalculationFingerprint(calculation);
    if (input.fingerprint !== fingerprint) throw new Error("The API 570 calculation changed after review opened. Review the latest values again.");
    if (!calculation.result.ok) throw new Error("A calculation with engine errors cannot be reviewed.");
    if (calculation.status !== "draft") throw new Error("Only a draft calculation can move to Reviewed.");
    const timestamp = this.now();
    calculation.status = "reviewed";
    calculation.workflow.reviewedBy = reviewerName;
    calculation.workflow.reviewNotes = input.reviewNotes?.trim() ?? "";
    calculation.workflow.reviewedAt = timestamp;
    calculation.workflow.reviewedFingerprint = fingerprint;
    calculation.workflow.approvedBy = undefined;
    calculation.workflow.approvalNotes = undefined;
    calculation.workflow.approvedAt = undefined;
    calculation.workflow.approvedFingerprint = undefined;
    calculation.workflow.history.push({
      id: this.createId(), type: "reviewed", status: "reviewed", revision: calculation.workflow.revision,
      actor: reviewerName,
      note: calculation.workflow.reviewNotes || "API 570 inputs, units, results and trace reviewed locally.",
      timestamp, fingerprint,
    });
    calculation.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(calculation);
  }

  approveApi570Calculation(input: ApproveApi570CalculationInput): SavedApi570Calculation {
    const approverName = input.approverName.trim();
    if (!approverName) throw new Error("Approver name is required.");
    const workspace = this.read();
    const { project, calculation } = this.requireApi570Calculation(workspace, input.projectId, input.calculationId);
    const fingerprint = api570CalculationFingerprint(calculation);
    if (input.fingerprint !== fingerprint || calculation.workflow.reviewedFingerprint !== fingerprint) {
      throw new Error("The reviewed API 570 calculation is no longer current. Return it to review before approval.");
    }
    if (calculation.status !== "reviewed") throw new Error("Only a Reviewed calculation can move to Approved.");
    const timestamp = this.now();
    calculation.status = "approved";
    calculation.workflow.approvedBy = approverName;
    calculation.workflow.approvalNotes = input.approvalNotes?.trim() ?? "";
    calculation.workflow.approvedAt = timestamp;
    calculation.workflow.approvedFingerprint = fingerprint;
    calculation.workflow.history.push({
      id: this.createId(), type: "approved", status: "approved", revision: calculation.workflow.revision,
      actor: approverName,
      note: calculation.workflow.approvalNotes || "Local API 570 report workflow approval recorded.",
      timestamp, fingerprint,
    });
    calculation.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(calculation);
  }

  duplicateApi570Calculation(projectId: string, calculationId: string): SavedApi570Calculation {
    const workspace = this.read();
    const { project, calculation: source } = this.requireApi570Calculation(workspace, projectId, calculationId);
    const timestamp = this.now();
    const duplicate: SavedApi570Calculation = {
      ...clone(source),
      id: this.createId(),
      title: `${source.title} copy`,
      status: "draft",
      workflow: { revision: 1, preparedBy: source.workflow.preparedBy, history: [] },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    duplicate.workflow.history.push({
      id: this.createId(), type: "saved", status: "draft", revision: 1,
      actor: duplicate.workflow.preparedBy,
      note: `Created as a draft copy of ${source.title}.`,
      timestamp,
      fingerprint: api570CalculationFingerprint(duplicate),
    });
    project.api570Calculations.push(duplicate);
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(duplicate);
  }

  deleteApi570Calculation(projectId: string, calculationId: string): void {
    const workspace = this.read();
    const project = this.requireProject(workspace, projectId);
    const nextCalculations = project.api570Calculations.filter((candidate) => candidate.id !== calculationId);
    if (nextCalculations.length === project.api570Calculations.length) throw new Error("Saved API 570 calculation was not found.");
    project.api570Calculations = nextCalculations;
    project.updatedAt = this.now();
    this.write(workspace);
  }

  reviewCalculation(input: ReviewCalculationInput): SavedApi510Calculation {
    const reviewerName = input.reviewerName.trim();
    if (!reviewerName) throw new Error("Reviewer name is required.");
    const workspace = this.read();
    const { project, equipment, calculation } = this.requireCalculation(workspace, input.projectId, input.equipmentId, input.calculationId);
    const fingerprint = calculationFingerprint(calculation, project.id, equipment);
    if (input.fingerprint !== fingerprint) throw new Error("The calculation changed after review opened. Review the latest values again.");
    if (!calculation.result.ok) throw new Error("A calculation with engine errors cannot be reviewed.");
    if (calculation.status !== "draft") throw new Error("Only a draft calculation can move to Reviewed.");
    const timestamp = this.now();
    calculation.status = "reviewed";
    calculation.workflow.reviewedBy = reviewerName;
    calculation.workflow.reviewNotes = input.reviewNotes?.trim() ?? "";
    calculation.workflow.reviewedAt = timestamp;
    calculation.workflow.reviewedFingerprint = fingerprint;
    calculation.workflow.approvedBy = undefined;
    calculation.workflow.approvalNotes = undefined;
    calculation.workflow.approvedAt = undefined;
    calculation.workflow.approvedFingerprint = undefined;
    calculation.workflow.history.push({
      id: this.createId(),
      type: "reviewed",
      status: "reviewed",
      revision: calculation.workflow.revision,
      actor: reviewerName,
      note: calculation.workflow.reviewNotes || "Calculation inputs, units, results and trace reviewed locally.",
      timestamp,
      fingerprint,
    });
    calculation.updatedAt = timestamp;
    equipment.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(calculation);
  }

  approveCalculation(input: ApproveCalculationInput): SavedApi510Calculation {
    const approverName = input.approverName.trim();
    if (!approverName) throw new Error("Approver name is required.");
    const workspace = this.read();
    const { project, equipment, calculation } = this.requireCalculation(workspace, input.projectId, input.equipmentId, input.calculationId);
    const fingerprint = calculationFingerprint(calculation, project.id, equipment);
    if (input.fingerprint !== fingerprint || calculation.workflow.reviewedFingerprint !== fingerprint) {
      throw new Error("The reviewed calculation fingerprint is no longer current. Return it to review before approval.");
    }
    if (calculation.status !== "reviewed") throw new Error("Only a Reviewed calculation can move to Approved.");
    const timestamp = this.now();
    calculation.status = "approved";
    calculation.workflow.approvedBy = approverName;
    calculation.workflow.approvalNotes = input.approvalNotes?.trim() ?? "";
    calculation.workflow.approvedAt = timestamp;
    calculation.workflow.approvedFingerprint = fingerprint;
    calculation.workflow.history.push({
      id: this.createId(),
      type: "approved",
      status: "approved",
      revision: calculation.workflow.revision,
      actor: approverName,
      note: calculation.workflow.approvalNotes || "Local report workflow approval recorded.",
      timestamp,
      fingerprint,
    });
    calculation.updatedAt = timestamp;
    equipment.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(calculation);
  }

  duplicateCalculation(projectId: string, equipmentId: string, calculationId: string): SavedApi510Calculation {
    const workspace = this.read();
    const project = this.requireProject(workspace, projectId);
    const equipment = project.equipment.find((candidate) => candidate.id === equipmentId);
    if (!equipment) throw new Error("Equipment was not found.");
    const source = equipment.calculations.find((candidate) => candidate.id === calculationId);
    if (!source) throw new Error("Saved calculation was not found.");
    const timestamp = this.now();
    const duplicate: SavedApi510Calculation = {
      ...clone(source),
      id: this.createId(),
      title: `${source.title} copy`,
      status: "draft",
      workflow: {
        revision: 1,
        preparedBy: source.workflow.preparedBy,
        history: [],
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    duplicate.workflow.history.push({
      id: this.createId(),
      type: "saved",
      status: "draft",
      revision: 1,
      actor: duplicate.workflow.preparedBy,
      note: `Created as a draft copy of ${source.title}.`,
      timestamp,
      fingerprint: calculationFingerprint(duplicate, project.id, equipment),
    });
    equipment.calculations.push(duplicate);
    equipment.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
    return clone(duplicate);
  }

  deleteCalculation(projectId: string, equipmentId: string, calculationId: string): void {
    const workspace = this.read();
    const project = this.requireProject(workspace, projectId);
    const equipment = project.equipment.find((candidate) => candidate.id === equipmentId);
    if (!equipment) throw new Error("Equipment was not found.");
    const nextCalculations = equipment.calculations.filter((candidate) => candidate.id !== calculationId);
    if (nextCalculations.length === equipment.calculations.length) throw new Error("Saved calculation was not found.");
    equipment.calculations = nextCalculations;
    const timestamp = this.now();
    equipment.updatedAt = timestamp;
    project.updatedAt = timestamp;
    this.write(workspace);
  }

  private read(): LocalWorkspaceV1 {
    const raw = this.storage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    const workspace = parseWorkspace(raw);
    if (workspace) return workspace;
    this.storage.setItem(WORKSPACE_RECOVERY_KEY, raw);
    this.storage.removeItem(WORKSPACE_STORAGE_KEY);
    return emptyWorkspace();
  }

  private write(workspace: LocalWorkspaceV1): void {
    this.storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }

  private requireProject(workspace: LocalWorkspaceV1, projectId: string): LocalProject {
    const project = workspace.projects.find((candidate) => candidate.id === projectId);
    if (!project) throw new Error("Project was not found.");
    return project;
  }

  private requireCalculation(workspace: LocalWorkspaceV1, projectId: string, equipmentId: string, calculationId: string) {
    const project = this.requireProject(workspace, projectId);
    const equipment = project.equipment.find((candidate) => candidate.id === equipmentId);
    if (!equipment) throw new Error("Equipment was not found.");
    const calculation = equipment.calculations.find((candidate) => candidate.id === calculationId);
    if (!calculation) throw new Error("Saved calculation was not found.");
    return { project, equipment, calculation };
  }

  private requireApi570Calculation(workspace: LocalWorkspaceV1, projectId: string, calculationId: string) {
    const project = this.requireProject(workspace, projectId);
    const calculation = project.api570Calculations.find((candidate) => candidate.id === calculationId);
    if (!calculation) throw new Error("Saved API 570 calculation was not found.");
    return { project, calculation };
  }
}
