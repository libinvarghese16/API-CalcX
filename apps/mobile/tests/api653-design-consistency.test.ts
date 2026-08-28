import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const bottomAndAnnularSource = readFileSync(resolve(testDirectory, "../src/api653/Api653BottomPlateCalculator.tsx"), "utf8");
const shellSource = readFileSync(resolve(testDirectory, "../src/api653/Api653ShellCourseCalculator.tsx"), "utf8");
const nozzleSource = readFileSync(resolve(testDirectory, "../src/api653/Api653NozzleCalculator.tsx"), "utf8");
const roofSource = readFileSync(resolve(testDirectory, "../src/api653/Api653RoofPlateCalculator.tsx"), "utf8");
const other432Source = readFileSync(resolve(testDirectory, "../src/api653/Api653Other432Calculator.tsx"), "utf8");
const mobileStyles = readFileSync(resolve(testDirectory, "../src/styles.css"), "utf8");

const sharedCalculatorTokens = [
  'className="back-button"',
  "API 653 library",
  'className="save-state-badge"',
  "Original-web parity",
  'aria-label="Calculation workflow"',
  "Calculation basis",
  "Design and inspection data",
  'aria-label="Unit system"',
  'className="select-control native-select"',
  "Mixed engineering units are active.",
];

test("keeps all six API 653 calculators on the shared structure", () => {
  for (const token of sharedCalculatorTokens) {
    assert.ok(bottomAndAnnularSource.includes(token), `Bottom/Annular must retain shared token: ${token}`);
    assert.ok(shellSource.includes(token), `Shell must retain shared token: ${token}`);
    assert.ok(nozzleSource.includes(token), `Nozzle must retain shared token: ${token}`);
    assert.ok(roofSource.includes(token), `Roof must retain shared token: ${token}`);
    assert.ok(other432Source.includes(token), `Other 4.3.2 must retain shared token: ${token}`);
  }

  assert.ok(shellSource.indexOf("Calculation basis") < shellSource.indexOf("Design and inspection data"));
  assert.ok(shellSource.indexOf("Design and inspection data") < shellSource.indexOf("Shell courses"));
  assert.doesNotMatch(shellSource, /system-switch/);
  assert.doesNotMatch(mobileStyles, /api653-shell-page \.system-switch/);
  assert.ok(nozzleSource.indexOf("Calculation basis") < nozzleSource.indexOf("Design and inspection data"));
  assert.ok(nozzleSource.indexOf("Design and inspection data") < nozzleSource.indexOf("Nozzle entries"));
  assert.doesNotMatch(nozzleSource, /<table/);
  assert.ok(roofSource.indexOf("Calculation basis") < roofSource.indexOf("Design and inspection data"));
  assert.doesNotMatch(roofSource, /system-switch|<table/);
  assert.ok(other432Source.indexOf("Calculation basis") < other432Source.indexOf("Design and inspection data"));
  assert.ok(other432Source.indexOf("Design and inspection data") < other432Source.indexOf("Thickness profile"));
  assert.doesNotMatch(other432Source, /system-switch|<table|<img|image-preview|reference-trigger/i);
});

test("keeps every Other 4.3.2 automatic dependency editable, highlighted, and unit-aware", () => {
  assert.match(other432Source, /AutomaticUnitInput label="Critical length L \(capped\)"/);
  assert.match(other432Source, /AutomaticUnitInput label="Average thickness t1"/);
  assert.match(other432Source, /AutomaticUnitInput label="Adjusted tmin \(tmin \+ CA\)"/);
  assert.match(other432Source, /AutomaticUnitInput label="Adjusted 60% tmin"/);
  assert.match(other432Source, /Manual override is active and highlighted/);
  assert.match(other432Source, /DerivedYearsInput label="Years in service"/);
  assert.match(other432Source, /DerivedYearsInput label="Years since previous inspection"/);
  assert.match(other432Source, /Deepest pit remaining thickness/);
  assert.match(other432Source, /Pit dimension sum in 200 mm band/);
});

test("keeps both Roof inspection periods editable and mixed-unit aware", () => {
  assert.match(roofSource, /DerivedYearsInput label="Years in service"/);
  assert.match(roofSource, /DerivedYearsInput label="Years since previous inspection"/);
  assert.match(roofSource, /Manual override is active and highlighted/);
  assert.match(roofSource, /UnitInput label="Original roof thickness"/);
  assert.match(roofSource, /API 653 area average · 2\.2 mm/);
  assert.match(roofSource, /250 mm × 250 mm area average/);
  assert.match(roofSource, /UnitInput label="Controlled minimum required thickness"/);
  assert.match(roofSource, /remainingLifeOpenEnded/);
  assert.match(roofSource, /remainingLifeOver99Years/);
});

test("keeps Annular calculated shell stress editable, unit-aware, and visibly traceable", () => {
  assert.match(bottomAndAnnularSource, /AutomaticUnitInput label="Calculated shell stress"/);
  assert.match(bottomAndAnnularSource, /options=\{pressureUnits\}/);
  assert.match(bottomAndAnnularSource, /setCalculatedStressMode\(mode\)/);
  assert.match(bottomAndAnnularSource, /Calculated shell stress mode/);
  assert.match(bottomAndAnnularSource, /Automatic shell stress/);
  assert.match(bottomAndAnnularSource, /UnitInput label="Previous internal-pitting depth"/);
  assert.match(bottomAndAnnularSource, /UnitInput label="Current internal-pitting depth"/);
  assert.match(bottomAndAnnularSource, /Derived current RTip/);
  assert.match(bottomAndAnnularSource, /Top-side short-term rate/);
});

test("keeps the bottom MRT and critical-zone routes separate, complete, and visibly traceable", () => {
  assert.match(bottomAndAnnularSource, /MRT = min\(RTbc, RTip\) − Or\(StPr \+ UPr\)/);
  assert.match(bottomAndAnnularSource, /AutomaticUnitInput label="Underside corrosion rate UPr"/);
  assert.match(bottomAndAnnularSource, /AutomaticUnitInput label="Top-side corrosion rate StPr"/);
  assert.match(bottomAndAnnularSource, /UPr long-term/);
  assert.match(bottomAndAnnularSource, /UPr short-term/);
  assert.match(bottomAndAnnularSource, /StPr long-term/);
  assert.match(bottomAndAnnularSource, /StPr short-term/);
  assert.match(bottomAndAnnularSource, /previousInternalPitting: \{ value: "0"/);
  assert.match(bottomAndAnnularSource, /internalPitting: \{ value: "0"/);
  assert.match(bottomAndAnnularSource, /Current pitting depth/);
  assert.match(bottomAndAnnularSource, /RTip current/);
  assert.match(bottomAndAnnularSource, /<h2>Critical-zone assessment<\/h2>/);
  assert.match(bottomAndAnnularSource, /UnitInput label="Lower shell course required thickness tmin"/);
  assert.match(bottomAndAnnularSource, /UnitInput label="Critical-zone measured thickness"/);
  assert.match(bottomAndAnnularSource, /0–300 mm as the maximum survey band/);
  assert.match(bottomAndAnnularSource, /API 653 critical zone: 0–76\.2 mm \(3 in\.\)/);
  assert.match(bottomAndAnnularSource, /max\(2\.5 mm, min\(3\.0 mm, 50% × lower-shell tmin\)\)/);
  assert.match(bottomAndAnnularSource, /criticalZoneAssessmentComplete/);
  assert.match(bottomAndAnnularSource, /remainingLifeOpenEnded/);
});

test("keeps Nozzle Tmin automatic, manually editable, unit-aware, and traceable", () => {
  assert.match(nozzleSource, /Minimum required thickness/);
  assert.match(nozzleSource, /automaticMode=\{nozzle\.minimumThicknessMode\}/);
  assert.match(nozzleSource, /switchMinimumMode/);
  assert.match(nozzleSource, /options=\{lengthUnits\}/);
  assert.match(nozzleSource, /minimumSelection\.message/);
  assert.match(nozzleSource, /Pressure-design minimum/);
  assert.match(nozzleSource, /governingMinimumBasis/);
});
