import { formatDisplayNumber } from "../display-precision.ts";

export interface ShellCourseCopyRow {
  courseIndex: number;
  materialSpecification: string;
  courseHeightM: number;
  heightToTopM: number;
  allowableProductStressMpa: number;
  calculatedMinimumThicknessMm: number;
  asBuiltThicknessMm: number;
  previousThicknessMm: number;
  actualThicknessMm: number;
  minimumThicknessMm: number;
  corrosionAllowanceMm: number;
  longTermCorrosionRateMmPerYear: number;
  shortTermCorrosionRateMmPerYear: number;
  remainingLifeYears: number;
}

export const SHELL_COURSE_COPY_HEADERS = [
  "Shell Course",
  "Material Specification",
  "Crs H (m)",
  "H (m) to Top",
  "Allowable Product Stress S (MPa)",
  "tmin (mm)",
  "t as build (mm)",
  "t prev (mm)",
  "t act (mm)",
  "t min (mm)",
  "Ca (mm)",
  "Cr long term (mm/y)",
  "Cr short term (mm/y)",
  "RL (years)",
] as const;

const headerWidths = [115, 135, 105, 105, 115, 105, 105, 105, 105, 105, 105, 105, 105, 105] as const;

function standard(value: number): string {
  if (value === Infinity) return "∞";
  return Number.isFinite(value) ? formatDisplayNumber(value) : "";
}

function corrosionRate(value: number): string {
  return Number.isFinite(value) ? formatDisplayNumber(value, "corrosion-rate") : "";
}

function valuesForRow(row: ShellCourseCopyRow): readonly string[] {
  return [
    `Shell course ${row.courseIndex}`,
    row.materialSpecification,
    standard(row.courseHeightM),
    standard(row.heightToTopM),
    standard(row.allowableProductStressMpa),
    standard(row.calculatedMinimumThicknessMm),
    standard(row.asBuiltThicknessMm),
    standard(row.previousThicknessMm),
    standard(row.actualThicknessMm),
    standard(row.minimumThicknessMm),
    standard(row.corrosionAllowanceMm),
    corrosionRate(row.longTermCorrosionRateMmPerYear),
    corrosionRate(row.shortTermCorrosionRateMmPerYear),
    standard(row.remainingLifeYears),
  ];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildShellCourseClipboard(rows: readonly ShellCourseCopyRow[]): { html: string; text: string } {
  const tableRows = rows.map(valuesForRow);
  const text = [SHELL_COURSE_COPY_HEADERS, ...tableRows]
    .map((row) => row.join("\t"))
    .join("\n");
  const headerCells = SHELL_COURSE_COPY_HEADERS.map((header, index) => (
    `<th style="width:${headerWidths[index]}px;min-width:${headerWidths[index]}px;border:1px solid #000000;background:#9fc5e8;color:#000000;font-weight:700;text-align:center;vertical-align:middle;padding:7px 6px;white-space:normal;">${escapeHtml(header)}</th>`
  )).join("");
  const bodyRows = tableRows.map((row) => `<tr>${row.map((value) => (
    `<td style="border:1px solid #000000;background:#ffffff;color:#000000;text-align:center;vertical-align:middle;padding:3px 6px;white-space:nowrap;">${escapeHtml(value)}</td>`
  )).join("")}</tr>`).join("");
  const html = `<table style="border-collapse:collapse;border-spacing:0;font-family:Arial,Helvetica,sans-serif;font-size:11pt;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  return { html, text };
}

function copyPlainTextFallback(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  if (!copied) throw new Error("Clipboard copy was not accepted by this device.");
}

export async function copyShellCourseTable(rows: readonly ShellCourseCopyRow[]): Promise<void> {
  const payload = buildShellCourseClipboard(rows);
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([payload.html], { type: "text/html" }),
        "text/plain": new Blob([payload.text], { type: "text/plain" }),
      }),
    ]);
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.text);
    return;
  }
  copyPlainTextFallback(payload.text);
}
