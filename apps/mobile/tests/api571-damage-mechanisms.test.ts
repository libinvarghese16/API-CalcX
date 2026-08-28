import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  API571_SECTION_DEFINITIONS,
  filterApi571DamageMechanisms,
  parseApi571DamageMechanisms,
} from "../src/api571/api571-damage-mechanisms.ts";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const dataSource = readFileSync(resolve(testDirectory, "../public/data/api571-damage-mechanisms.json"), "utf8");
const mechanisms = parseApi571DamageMechanisms(JSON.parse(dataSource));

test("preserves the complete master-site API 571 dataset", () => {
  assert.equal(mechanisms.length, 67);
  assert.equal(mechanisms[0]?.id, "3.1");
  assert.equal(mechanisms[0]?.title, "885 °F (475 °C) Embrittlement");
  assert.equal(mechanisms.at(-1)?.id, "3.67");
  assert.equal(mechanisms.at(-1)?.title, "Wet H2S Damage (Blistering/HIC/SOHIC/SSC)");
  assert.equal(new Set(mechanisms.map((mechanism) => mechanism.id)).size, 67);
  assert.equal(
    createHash("sha256").update(JSON.stringify(mechanisms)).digest("hex"),
    "8748fcc704df76b3da093fe3f56248fe790d92d49a3e6f8b9bfb962ed5dc31ca",
  );
});

test("keeps every master section populated for all mechanisms", () => {
  assert.deepEqual(API571_SECTION_DEFINITIONS.map(({ label }) => label), [
    "Description of Damage",
    "Affected Materials",
    "Critical Factors",
    "Affected Units or Equipment",
    "Appearance or Morphology of Damage",
    "Prevention/Mitigation",
    "Inspection and Monitoring",
    "Related Mechanisms",
  ]);

  const bulletCount = mechanisms.reduce((total, mechanism) => total + API571_SECTION_DEFINITIONS.reduce((sectionTotal, { key }) => sectionTotal + mechanism.sections[key].length, 0), 0);
  assert.equal(bulletCount, 1_866);
  for (const mechanism of mechanisms) {
    for (const { key } of API571_SECTION_DEFINITIONS) assert.ok(mechanism.sections[key].length > 0, `${mechanism.id}:${key}`);
  }
});

test("matches all search tokens across titles and detailed section text", () => {
  assert.equal(filterApi571DamageMechanisms(mechanisms, "wet h2s").length, 9);
  assert.equal(filterApi571DamageMechanisms(mechanisms, "carbon steel").length, 55);
  assert.deepEqual(filterApi571DamageMechanisms(mechanisms, "chloride cracking").map(({ id }) => id), ["3.10", "3.15", "3.17", "3.28"]);
  assert.equal(filterApi571DamageMechanisms(mechanisms, "does-not-exist").length, 0);
  assert.equal(filterApi571DamageMechanisms(mechanisms, "").length, 67);
});
