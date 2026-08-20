import assert from "node:assert/strict";
import test from "node:test";
import { resolveNativeBackAction } from "../src/native/native-navigation.ts";

test("native back closes the mobile menu before changing pages", () => {
  assert.deepEqual(resolveNativeBackAction("api653-shell", true), { kind: "close-menu" });
});

test("native back returns every calculator workspace to the calculator library", () => {
  const calculatorPages = [
    "calculator",
    "api570-piping",
    "api570-support",
    "api653-bottom",
    "api653-other-4-3-2",
  ];

  for (const page of calculatorPages) {
    assert.deepEqual(resolveNativeBackAction(page, false), { kind: "navigate", destination: "calculators" });
  }
});

test("native back returns top-level pages home and only exits from home", () => {
  assert.deepEqual(resolveNativeBackAction("projects", false), { kind: "navigate", destination: "home" });
  assert.deepEqual(resolveNativeBackAction("home", false), { kind: "exit-app" });
});
