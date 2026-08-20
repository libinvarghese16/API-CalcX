import assert from "node:assert/strict";
import test from "node:test";

import { API653_MOBILE_WORKSPACES, filterApi653MobileWorkspaces } from "../src/calculators/api653-mobile-scope.ts";

test("keeps the six protected API 653 calculator workspaces in source order", () => {
  assert.deepEqual(API653_MOBILE_WORKSPACES.map((workspace) => workspace.id), ["bottom", "annular", "shell", "nozzles", "roof", "other-4-3-2"]);
  assert.equal(API653_MOBILE_WORKSPACES[0]?.protectedSourceFunction, "calculateBottom");
});

test("validates all six protected API 653 workspaces", () => {
  assert.deepEqual(API653_MOBILE_WORKSPACES.filter((workspace) => workspace.migrationStatus === "validated").map((workspace) => workspace.id), ["bottom", "annular", "shell", "nozzles", "roof", "other-4-3-2"]);
  const annular = API653_MOBILE_WORKSPACES.find((workspace) => workspace.id === "annular");
  assert.match(annular?.summary ?? "", /automatic\/editable calculated shell stress/i);
  assert.match(annular?.summary ?? "", /annular minimum/i);
  const shell = API653_MOBILE_WORKSPACES.find((workspace) => workspace.id === "shell");
  assert.match(shell?.summary ?? "", /automatic\/editable course stresses/i);
  assert.match(shell?.summary ?? "", /hydrostatic and operating heights/i);
  const nozzles = API653_MOBILE_WORKSPACES.find((workspace) => workspace.id === "nozzles");
  assert.match(nozzles?.summary ?? "", /automatic\/editable structural minimum/i);
  assert.match(nozzles?.summary ?? "", /mixed-unit measured wall/i);
  const roof = API653_MOBILE_WORKSPACES.find((workspace) => workspace.id === "roof");
  assert.match(roof?.summary ?? "", /editable inspection periods/i);
  assert.match(roof?.summary ?? "", /remaining-life display states/i);
  const other = API653_MOBILE_WORKSPACES.find((workspace) => workspace.id === "other-4-3-2");
  assert.match(other?.summary ?? "", /automatic\/editable critical length/i);
  assert.match(other?.summary ?? "", /two-part pitting screen/i);
});

test("searches API 653 workspaces by tank calculation terms", () => {
  assert.deepEqual(filterApi653MobileWorkspaces("pitting").map((workspace) => workspace.id), ["other-4-3-2"]);
  assert.deepEqual(filterApi653MobileWorkspaces("remaining life").map((workspace) => workspace.id), ["bottom", "annular", "shell", "nozzles", "roof"]);
});
