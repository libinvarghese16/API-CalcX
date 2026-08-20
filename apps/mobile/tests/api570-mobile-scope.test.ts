import assert from "node:assert/strict";
import test from "node:test";

import {
  API570_EXCLUDED_MOBILE_WORKSPACES,
  API570_MOBILE_MODULE,
  API570_MOBILE_WORKSPACES,
  filterApi570MobileWorkspaces,
  isApi570MobileWorkspaceIncluded,
} from "../src/calculators/api570-mobile-scope.ts";

test("keeps only the four individual API 570 workspaces in mobile scope", () => {
  assert.deepEqual(API570_MOBILE_WORKSPACES.map((workspace) => workspace.id), [
    "piping",
    "tubes",
    "headers",
    "other-calculations",
  ]);
  assert.equal(API570_MOBILE_MODULE.count, "4 individual workspaces");
  assert.deepEqual(API570_MOBILE_WORKSPACES.map((workspace) => workspace.migrationStatus), ["validated", "validated", "validated", "validated"]);
  assert.equal(API570_MOBILE_WORKSPACES.at(-1)?.progressLabel, "8 of 8 validated");
});

test("explicitly excludes the two unwanted API 570 calculation tables", () => {
  assert.deepEqual(API570_EXCLUDED_MOBILE_WORKSPACES.map((workspace) => workspace.id), [
    "bulk",
    "tube-table",
  ]);
  assert.deepEqual(API570_EXCLUDED_MOBILE_WORKSPACES.map((workspace) => workspace.title), [
    "Piping calculation table",
    "Tube calculation table",
  ]);
  assert.equal(isApi570MobileWorkspaceIncluded("bulk"), false);
  assert.equal(isApi570MobileWorkspaceIncluded("tube-table"), false);
});

test("retains source identities for the individual calculator migration gate", () => {
  assert.deepEqual(API570_MOBILE_WORKSPACES.map((workspace) => workspace.protectedSourceFunction), [
    "calculatePipe",
    "calculateTube",
    "calculateHeader",
    "calculateApi570OtherCalculations",
  ]);
  assert.equal(isApi570MobileWorkspaceIncluded("piping"), true);
  assert.equal(isApi570MobileWorkspaceIncluded("tubes"), true);
});

test("searches individual API 570 workspaces without exposing excluded bulk tables", () => {
  assert.deepEqual(filterApi570MobileWorkspaces("MAWP").map((workspace) => workspace.id), ["piping", "tubes", "headers"]);
  assert.deepEqual(filterApi570MobileWorkspaces("remaining life").map((workspace) => workspace.id), ["piping", "tubes", "headers"]);
  assert.deepEqual(filterApi570MobileWorkspaces("Barlow").map((workspace) => workspace.id), ["other-calculations"]);
  assert.deepEqual(filterApi570MobileWorkspaces("valve").map((workspace) => workspace.id), ["other-calculations"]);
  assert.deepEqual(filterApi570MobileWorkspaces("Piping calculation table"), []);
  assert.deepEqual(filterApi570MobileWorkspaces("Tube calculation table"), []);
});
