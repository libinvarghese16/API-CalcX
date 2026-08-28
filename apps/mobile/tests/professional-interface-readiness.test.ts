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
const authenticationService = readFileSync(resolve(appDirectory, "src/account/auth-service.ts"), "utf8");
const converterDialog = readFileSync(resolve(appDirectory, "src/tools/UnitConverterDialog.tsx"), "utf8");
const calculatorResultSources = [
  "src/App.tsx",
  "src/api570/Api570PipingCalculator.tsx",
  "src/api570/Api570TubeCalculator.tsx",
  "src/api570/Api570HeaderCalculator.tsx",
  "src/api570/Api570PressureDesignCalculator.tsx",
  "src/api570/Api570ValveFittingsCalculator.tsx",
  "src/api570/Api570HydroTestCalculator.tsx",
  "src/api570/Api570FlangeHydroTestCalculator.tsx",
  "src/api570/Api570PneumaticTestCalculator.tsx",
  "src/api570/Api570FilletWeldCalculator.tsx",
  "src/api570/Api570TensionTestCalculator.tsx",
  "src/api570/Api570SoilResistivityCalculator.tsx",
  "src/api653/Api653BottomPlateCalculator.tsx",
  "src/api653/Api653ShellCourseCalculator.tsx",
  "src/api653/Api653NozzleCalculator.tsx",
  "src/api653/Api653RoofPlateCalculator.tsx",
  "src/api653/Api653Other432Calculator.tsx",
].map((path) => ({ path, source: readFileSync(resolve(appDirectory, path), "utf8") }));

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

test("connects Google and Apple account actions to Firebase Authentication", () => {
  assert.match(accountDialog, /authentication\.signIn\("google"\)/);
  assert.match(accountDialog, /authentication\.signIn\("apple"\)/);
  assert.match(accountDialog, /authentication\.signOut\(\)/);
  assert.match(authenticationService, /FirebaseAuthentication\.signInWithGoogle/);
  assert.match(authenticationService, /FirebaseAuthentication\.signInWithApple/);
  assert.match(authenticationService, /FirebaseAuthentication\.addListener\("authStateChange"/);
  assert.match(authenticationService, /mode: "popup"/);
  assert.doesNotMatch(authenticationService, /mode: .*redirect|useRedirectFlow|getRedirectResult/);
});

test("uses one professional result-card hierarchy across every calculator", () => {
  for (const { path, source } of calculatorResultSources) {
    assert.match(source, /Calculation results/, `${path} must use the shared result heading`);
    assert.doesNotMatch(source, /Live (?:[\w.]+ )?engine|Engine ID|Engine version|Result trace|Visible calculation context|Parity passed/, `${path} exposes internal implementation wording`);
  }
  assert.match(styles, /\.result-primary-grid/);
  assert.match(styles, /\.result-primary-value/);
});

test("keeps shared calculator input and output boxes dimensionally consistent", () => {
  assert.match(styles, /\.form-grid \{[^}]*align-items: start/);
  assert.match(styles, /\.field \{[^}]*align-self: start/);
  assert.match(styles, /\.field > input, \.select-control, \.number-control \{[^}]*height: 45px/);
  assert.match(styles, /\.number-control input \{[^}]*height: 100%/);
  assert.match(styles, /\.result-primary \{[^}]*min-height: 104px/);
  assert.match(styles, /\.result-comparison > span \{[^}]*min-height: 50px/);
  assert.match(styles, /\.result-primary-value \{[^}]*flex-wrap: nowrap/);
  assert.match(styles, /\.result-primary-value strong \{[^}]*white-space: nowrap[^}]*overflow-wrap: normal/);
});

test("opens the API 653 storage-tank workspace on the first home-card click", () => {
  assert.match(appSource, /module\.code === "API 653" \? navigate\("api653-bottom"\)/);
});
