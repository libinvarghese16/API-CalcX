import assert from "node:assert/strict";
import test from "node:test";

import {
  API653_SHELL_DRAFT_STORAGE_KEY,
  readApi653ShellDraft,
  writeApi653ShellDraft,
} from "../src/api653/shell-course-draft.ts";
import type { Api653ShellDraft, ShellDraftStorage } from "../src/api653/shell-course-draft.ts";

class MemoryStorage implements ShellDraftStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const draft: Api653ShellDraft = {
  version: 1,
  unitSystem: "metric",
  diameter: { value: "42", unit: "m", quantity: "length" },
  height: { value: "18", unit: "m", quantity: "length" },
  specificGravity: "0.92",
  jointEfficiency: "0.85",
  buildYear: "2001",
  previousInspectionYear: "2023",
  serviceYearsMode: "auto",
  inspectionYearsMode: "auto",
  manualServiceYears: "25",
  manualInspectionYears: "3",
  courses: [{
    materialId: "Unknown-riveted",
    productStressMode: "auto",
    hydroStressMode: "auto",
    fields: {
      courseHeight: { value: "3", unit: "m", quantity: "length" },
      productStress: { value: "145", unit: "MPa", quantity: "pressure" },
      hydroStress: { value: "145", unit: "MPa", quantity: "pressure" },
      asBuiltThickness: { value: "12", unit: "mm", quantity: "length" },
      previousThickness: { value: "11.5", unit: "mm", quantity: "length" },
      actualThickness: { value: "11", unit: "mm", quantity: "length" },
    },
  }],
};

test("saves and restores the complete API 653 Shell working draft locally", () => {
  const storage = new MemoryStorage();

  assert.equal(writeApi653ShellDraft(storage, draft), true);
  assert.deepEqual(readApi653ShellDraft(storage), draft);
  assert.ok(storage.values.has(API653_SHELL_DRAFT_STORAGE_KEY));
});

test("ignores malformed or unsupported Shell drafts without crashing", () => {
  const storage = new MemoryStorage();
  storage.setItem(API653_SHELL_DRAFT_STORAGE_KEY, "{not-json");
  assert.equal(readApi653ShellDraft(storage), null);

  storage.setItem(API653_SHELL_DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, version: 2 }));
  assert.equal(readApi653ShellDraft(storage), null);

  storage.setItem(API653_SHELL_DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, courses: [{ ...draft.courses[0], materialId: "not-a-material" }] }));
  assert.equal(readApi653ShellDraft(storage), null);
});
