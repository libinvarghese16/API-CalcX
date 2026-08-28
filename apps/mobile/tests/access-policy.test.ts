import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  GUEST_MODULE_CODE,
  guestCanAccessPage,
  modulesForGuestAccess,
} from "../src/account/access-policy.ts";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(testDirectory, "../src/App.tsx"), "utf8");
const accessGateSource = readFileSync(resolve(testDirectory, "../src/account/AccessGate.tsx"), "utf8");

test("limits guest access to the API 570 piping workspace", () => {
  for (const page of [
    "calculators",
    "api570-piping",
    "api570-tube",
    "api570-header",
    "api570-support",
    "api570-pressure-design",
    "api570-valve-fittings",
    "api570-hydro-test",
    "api570-flange-hydro-test",
    "api570-pneumatic-test",
    "api570-fillet-weld",
    "api570-tension-test",
    "api570-soil-resistivity",
  ]) {
    assert.equal(guestCanAccessPage(page), true, page);
  }

  for (const page of ["home", "calculator", "projects", "reports", "account", "api653-shell", "api571-damage-mechanisms"]) {
    assert.equal(guestCanAccessPage(page), false, page);
  }
});

test("shows only the Piping Systems module to guests", () => {
  const modules = modulesForGuestAccess([
    { code: "API 510", title: "Pressure vessels" },
    { code: "API 570", title: "Piping systems" },
    { code: "API 653", title: "Storage tanks" },
  ]);

  assert.equal(GUEST_MODULE_CODE, "API 570");
  assert.deepEqual(modules, [{ code: "API 570", title: "Piping systems" }]);
});

test("opens with provider choices and applies guest restrictions to the rendered app", () => {
  assert.match(appSource, /accessGateVisible \? <AccessGate/);
  assert.match(appSource, /guestMode=\{isGuestAccess\}/);
  assert.match(appSource, /projects=\{accessibleProjects\}/);
  assert.match(accessGateSource, /Continue with Google/);
  assert.match(accessGateSource, /Continue with Apple/);
  assert.match(accessGateSource, /Continue without sign in/);
  assert.match(accessGateSource, /Access API 570 Piping Systems only/);
});
