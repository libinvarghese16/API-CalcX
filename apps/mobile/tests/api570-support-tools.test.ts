import assert from "node:assert/strict";
import test from "node:test";

import { API570_SUPPORT_TOOLS } from "../src/api570/api570-support-tools.ts";

test("keeps all eight protected Other Piping Calculations in source order", () => {
  assert.deepEqual(API570_SUPPORT_TOOLS.map((tool) => tool.id), [
    "pressure-design",
    "valve-flanged-fittings",
    "hydro-test",
    "flange-hydro-test",
    "pneumatic-test",
    "fillet-weld",
    "tension-test",
    "soil-resistivity",
  ]);
});

test("exposes all eight Other Piping Calculations after protected parity", () => {
  assert.deepEqual(
    API570_SUPPORT_TOOLS.filter((tool) => tool.migrationStatus === "validated").map((tool) => tool.id),
    ["pressure-design", "valve-flanged-fittings", "hydro-test", "flange-hydro-test", "pneumatic-test", "fillet-weld", "tension-test", "soil-resistivity"],
  );
  assert.equal(API570_SUPPORT_TOOLS.filter((tool) => tool.migrationStatus === "planned").length, 0);
});
