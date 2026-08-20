import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(toolDirectory, "..");
const baseline = JSON.parse(
  await readFile(resolve(toolDirectory, "source-baseline.json"), "utf8"),
);
const sourceRoot = resolve(projectRoot, baseline.sourceRoot);
const mismatches = [];

for (const [relativePath, expectedHash] of Object.entries(baseline.files)) {
  const file = await readFile(resolve(sourceRoot, relativePath));
  const actualHash = createHash("sha256").update(file).digest("hex").toUpperCase();
  if (actualHash !== expectedHash) {
    mismatches.push({ relativePath, expectedHash, actualHash });
  }
}

if (mismatches.length > 0) {
  console.error("Existing API Calc Pro source changed after the recorded baseline:");
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch.relativePath}`);
    console.error(`  expected ${mismatch.expectedHash}`);
    console.error(`  actual   ${mismatch.actualHash}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Source baseline verified (${Object.keys(baseline.files).length} files).`);
}
