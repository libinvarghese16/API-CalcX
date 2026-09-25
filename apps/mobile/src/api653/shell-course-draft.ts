import {
  listApi653ShellMaterials,
  listEngineeringUnitOptions,
} from "@api-calc-pro/calc-engine";
import type {
  Api653ShellStressMode,
  AutomaticValueMode,
  EngineeringQuantity,
  EngineeringUnit,
  UnitSystem,
} from "@api-calc-pro/calc-engine";

export const API653_SHELL_DRAFT_STORAGE_KEY = "api-calc-pro.api653-shell-draft.v1";

export type ShellCourseUnitFieldId = "courseHeight" | "productStress" | "hydroStress" | "asBuiltThickness" | "previousThickness" | "actualThickness";
export type ShellUnitFieldState = { value: string; unit: EngineeringUnit; quantity: EngineeringQuantity };
export type ShellCourseUnitFields = Record<ShellCourseUnitFieldId, ShellUnitFieldState>;

export type ShellCourseDraft = {
  materialId: string;
  productStressMode: Api653ShellStressMode;
  hydroStressMode: Api653ShellStressMode;
  fields: ShellCourseUnitFields;
};

export type Api653ShellDraft = {
  version: 1;
  unitSystem: UnitSystem;
  diameter: ShellUnitFieldState;
  height: ShellUnitFieldState;
  specificGravity: string;
  jointEfficiency: string;
  buildYear: string;
  previousInspectionYear: string;
  serviceYearsMode: AutomaticValueMode;
  inspectionYearsMode: AutomaticValueMode;
  manualServiceYears: string;
  manualInspectionYears: string;
  courses: ShellCourseDraft[];
};

export interface ShellDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const courseFieldQuantities: Record<ShellCourseUnitFieldId, EngineeringQuantity> = {
  courseHeight: "length",
  productStress: "pressure",
  hydroStress: "pressure",
  asBuiltThickness: "length",
  previousThickness: "length",
  actualThickness: "length",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMode(value: unknown): value is AutomaticValueMode {
  return value === "auto" || value === "manual";
}

function isUnitField(value: unknown, quantity: EngineeringQuantity): value is ShellUnitFieldState {
  if (!isRecord(value) || typeof value.value !== "string" || value.quantity !== quantity || typeof value.unit !== "string") return false;
  return listEngineeringUnitOptions(quantity).some((option) => option.value === value.unit);
}

function isCourse(value: unknown, materialIds: ReadonlySet<string>): value is ShellCourseDraft {
  if (!isRecord(value) || typeof value.materialId !== "string" || !materialIds.has(value.materialId) || !isMode(value.productStressMode) || !isMode(value.hydroStressMode) || !isRecord(value.fields)) return false;
  const fields = value.fields;
  return (Object.entries(courseFieldQuantities) as Array<[ShellCourseUnitFieldId, EngineeringQuantity]>).every(([fieldId, quantity]) => isUnitField(fields[fieldId], quantity));
}

function isDraft(value: unknown): value is Api653ShellDraft {
  if (!isRecord(value) || value.version !== 1 || (value.unitSystem !== "metric" && value.unitSystem !== "us-customary")) return false;
  if (!isUnitField(value.diameter, "length") || !isUnitField(value.height, "length")) return false;
  if (![value.specificGravity, value.jointEfficiency, value.buildYear, value.previousInspectionYear, value.manualServiceYears, value.manualInspectionYears].every((item) => typeof item === "string")) return false;
  if (!isMode(value.serviceYearsMode) || !isMode(value.inspectionYearsMode) || !Array.isArray(value.courses) || value.courses.length < 1 || value.courses.length > 15) return false;
  const materialIds = new Set(listApi653ShellMaterials().map((material) => material.id));
  return value.courses.every((course) => isCourse(course, materialIds));
}

export function readApi653ShellDraft(storage: ShellDraftStorage): Api653ShellDraft | null {
  try {
    const raw = storage.getItem(API653_SHELL_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeApi653ShellDraft(storage: ShellDraftStorage, draft: Api653ShellDraft): boolean {
  try {
    storage.setItem(API653_SHELL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
