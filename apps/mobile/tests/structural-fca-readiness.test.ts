import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("keeps structural minimum input and governing maximum visible across API 570 pressure-boundary routes", () => {
  for (const fileName of ["Api570TubeCalculator.tsx", "Api570HeaderCalculator.tsx"]) {
    const source = read(`src/api570/${fileName}`);
    assert.match(source, /Structural minimum thickness/);
    assert.match(source, /structuralMinimumThicknessMm/);
    assert.match(source, /max\(pressure required, structural minimum\)/);
    assert.match(source, /Calculated required thickness/);
    assert.match(source, /Governing minimum used/);
  }

  const piping = read("src/api570/Api570PipingCalculator.tsx");
  assert.match(piping, /Nominal pipe size NPS/);
  assert.match(piping, /API 574 thickness field/);
  assert.match(piping, /Structural minimum thickness/);
  assert.match(piping, /Minimum alert thickness/);
  assert.match(piping, /Selected API 574 threshold/);
  assert.match(piping, /Time to alert threshold/);
  assert.match(piping, /structuralMinimumThicknessMm/);
  assert.match(piping, /max\(calculated required, structural minimum, alert thickness\)/);
  assert.match(piping, /Calculated required thickness/);
  assert.match(piping, /Governing minimum used/);
});

test("shows year-based FCA and remaining corrosion margin in API 570 and API 510 results", () => {
  for (const fileName of ["Api570PipingCalculator.tsx", "Api570TubeCalculator.tsx", "Api570HeaderCalculator.tsx"]) {
    const source = read(`src/api570/${fileName}`);
    assert.match(source, /futureCorrosionAllowanceMm/);
    assert.match(source, /remainingCorrosionAllowanceMm/);
  }

  const report = read("src/reports/api510-report.ts");
  assert.match(report, /futureCorrosionAllowanceMm/);
  assert.match(report, /remainingCorrosionAllowanceMm/);
});

test("identifies the cylindrical drum Section VIII route without embedding standards content", () => {
  const report = read("src/reports/api510-report.ts");
  assert.match(report, /ASME BPVC Section VIII, Division 1 · cylindrical shell internal-pressure route · UG-27\(c\)/);
});
