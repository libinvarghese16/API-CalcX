import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(testDirectory, "..");
const appSource = readFileSync(resolve(appDirectory, "src/App.tsx"), "utf8");
const styles = readFileSync(resolve(appDirectory, "src/styles.css"), "utf8");
const accountDialog = readFileSync(resolve(appDirectory, "src/account/AccountSettingsDialog.tsx"), "utf8");
const converterDialog = readFileSync(resolve(appDirectory, "src/tools/UnitConverterDialog.tsx"), "utf8");

test("removes the four reported preview-only controls from the visible interface", () => {
  assert.doesNotMatch(appSource, /Foundation milestone|Workspace status|Local and isolated/);
  assert.doesNotMatch(appSource, /New calculation/);
  assert.match(styles, /\.calculator-actions > \.secondary-button:last-child:has\(\.lucide-rotate-ccw\) \{ display: none; \}/);
  assert.match(styles, /\.form-note\.is-valid \{ display: none; \}/);
});

test("opens mobile field guidance for every titled help button", () => {
  assert.match(appSource, /button\[aria-label\$=" help"\]/);
  assert.match(appSource, /<FieldHelpDialog/);
  assert.match(styles, /\.field-help-backdrop/);
});

test("provides a real unit-converter interface and all requested account routes", () => {
  assert.match(converterDialog, /Converter quantity/);
  assert.match(converterDialog, /Swap source and destination units/);
  for (const title of ["Sign in to API Calc Pro", "Units and appearance", "Restore purchase", "Privacy and security"]) {
    assert.match(accountDialog, new RegExp(title));
  }
  assert.match(appSource, /Backup and restore/);
});
