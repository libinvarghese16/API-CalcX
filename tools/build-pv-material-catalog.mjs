import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const platformDirectory = path.resolve(toolDirectory, "..");
const legacySourcePath = path.resolve(platformDirectory, "..", "pv_cyl_material_table.js");
const generatedPath = path.resolve(
  platformDirectory,
  "packages",
  "calc-engine",
  "src",
  "data",
  "pv-cyl-material-table.generated.ts",
);

const assignmentMarker = "window.PV_CYL_MATERIAL_TABLE = ";
const legacySource = await readFile(legacySourcePath, "utf8");
const assignmentStart = legacySource.indexOf(assignmentMarker);
const assignmentEnd = legacySource.lastIndexOf(";");

if (assignmentStart < 0 || assignmentEnd < assignmentStart) {
  throw new Error(`Unable to find ${assignmentMarker.trim()} in ${legacySourcePath}`);
}

const jsonText = legacySource.slice(assignmentStart + assignmentMarker.length, assignmentEnd).trim();
const catalog = JSON.parse(jsonText);
const generatedSource = `/* Auto-generated from the protected legacy PV material dataset.\n`+
  `   Run npm.cmd run refresh:materials after an approved source update. */\n`+
  `import type { MaterialCatalog } from "../materials/material-catalog.ts";\n\n`+
  `export const PV_CYL_MATERIAL_TABLE: MaterialCatalog = ${JSON.stringify(catalog)};\n`;

if (process.argv.includes("--check")) {
  const currentSource = await readFile(generatedPath, "utf8").catch(() => "");
  if (currentSource !== generatedSource) {
    throw new Error("Generated pressure-vessel material catalog is missing or out of date.");
  }
  console.log(`Material catalog verified (${Object.keys(catalog).length} specifications).`);
} else {
  await mkdir(path.dirname(generatedPath), { recursive: true });
  await writeFile(generatedPath, generatedSource, "utf8");
  console.log(`Material catalog generated (${Object.keys(catalog).length} specifications).`);
}
