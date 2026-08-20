import assert from "node:assert/strict";
import test from "node:test";

import { API510_CALCULATORS, api510CalculatorFor, filterApi510Calculators } from "../src/calculators/api510-calculator-library.ts";

test("publishes all seven validated API 510 geometry calculators exactly once", () => {
  assert.deepEqual(API510_CALCULATORS.map((definition) => definition.component), [
    "cylindrical",
    "spherical",
    "ellipsoidal",
    "torispherical",
    "hemispherical",
    "conical",
    "flat-circular",
  ]);
  assert.equal(new Set(API510_CALCULATORS.map((definition) => definition.component)).size, 7);
  assert.equal(new Set(API510_CALCULATORS.map((definition) => definition.engineId)).size, 7);
});

test("maps each component preset to its existing shared-engine identity", () => {
  assert.equal(api510CalculatorFor("cylindrical").engineId, "api510.cylindrical-shell");
  assert.equal(api510CalculatorFor("spherical").engineId, "api510.spherical-shell");
  assert.equal(api510CalculatorFor("ellipsoidal").engineId, "api510.ellipsoidal-head");
  assert.equal(api510CalculatorFor("torispherical").engineId, "api510.torispherical-head");
  assert.equal(api510CalculatorFor("hemispherical").engineId, "api510.hemispherical-head");
  assert.equal(api510CalculatorFor("conical").engineId, "api510.conical-head");
  assert.equal(api510CalculatorFor("flat-circular").engineId, "api510.flat-circular-head");
});

test("searches geometry aliases and required-input descriptions", () => {
  assert.deepEqual(filterApi510Calculators("crown radius").map((definition) => definition.component), ["torispherical"]);
  assert.deepEqual(filterApi510Calculators("half apex").map((definition) => definition.component), ["conical"]);
  assert.deepEqual(filterApi510Calculators("attachment factor").map((definition) => definition.component), ["flat-circular"]);
  assert.deepEqual(filterApi510Calculators("sphere").map((definition) => definition.component), ["spherical", "hemispherical"]);
});
