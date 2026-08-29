import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShellCourseClipboard,
  SHELL_COURSE_COPY_HEADERS,
} from "../src/api653/shell-course-copy.ts";
import type { ShellCourseCopyRow } from "../src/api653/shell-course-copy.ts";

function makeRow(courseIndex: number): ShellCourseCopyRow {
  return {
    courseIndex,
    materialSpecification: courseIndex === 1 ? "A285-C" : "A36",
    courseHeightM: 2.5,
    heightToTopM: 14 - ((courseIndex - 1) * 2.5),
    allowableProductStressMpa: 163,
    calculatedMinimumThicknessMm: 5.72,
    asBuiltThicknessMm: 12,
    previousThicknessMm: 11.4,
    actualThicknessMm: 11,
    minimumThicknessMm: 5.72,
    corrosionAllowanceMm: 5.28,
    longTermCorrosionRateMmPerYear: 0.0634,
    shortTermCorrosionRateMmPerYear: 0.1,
    remainingLifeYears: 39.99,
  };
}

test("builds the exact fourteen-column shell table with every added course", () => {
  const rows = Array.from({ length: 12 }, (_, index) => makeRow(index + 1));
  const payload = buildShellCourseClipboard(rows);
  const lines = payload.text.split("\n");

  assert.equal(SHELL_COURSE_COPY_HEADERS.length, 14);
  assert.equal(lines.length, 13);
  assert.equal(lines[0]?.split("\t").length, 14);
  assert.match(lines[1] ?? "", /^Shell course 1\tA285-C\t/);
  assert.match(lines[12] ?? "", /^Shell course 12\tA36\t/);
});

test("preserves display precision and Excel-compatible table styling", () => {
  const payload = buildShellCourseClipboard([makeRow(1)]);

  assert.match(payload.text, /\t2\.50\t14\.00\t163\.00\t5\.72\t/);
  assert.match(payload.text, /\t0\.063\t0\.100\t39\.99$/);
  assert.match(payload.html, /background:#9fc5e8/);
  assert.match(payload.html, /border:1px solid #000000/);
  assert.match(payload.html, /<th[^>]*>Shell Course<\/th>/);
  assert.match(payload.html, /<td[^>]*>Shell course 1<\/td>/);
});
