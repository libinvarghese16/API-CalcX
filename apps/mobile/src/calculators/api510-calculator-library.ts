import type { PressureVesselComponent } from "../local-data/models.ts";

export interface Api510CalculatorDefinition {
  component: PressureVesselComponent;
  title: string;
  shortTitle: string;
  description: string;
  geometryBasis: string;
  engineId: string;
  searchTerms: string;
}

export const API510_CALCULATORS: readonly Api510CalculatorDefinition[] = [
  {
    component: "cylindrical",
    title: "Cylindrical shell",
    shortTitle: "Cylinder",
    description: "Required thickness, MAWP, corrosion rate and remaining-life assessment.",
    geometryBasis: "Inside diameter and joint efficiency",
    engineId: "api510.cylindrical-shell",
    searchTerms: "vessel cylinder shell internal pressure thickness mawp",
  },
  {
    component: "spherical",
    title: "Spherical shell",
    shortTitle: "Sphere",
    description: "Spherical pressure-boundary thickness, MAWP and inspection planning.",
    geometryBasis: "Inside diameter and spherical shell basis",
    engineId: "api510.spherical-shell",
    searchTerms: "sphere spherical shell pressure thickness mawp",
  },
  {
    component: "ellipsoidal",
    title: "Ellipsoidal head",
    shortTitle: "Ellipsoidal",
    description: "Two-to-one ellipsoidal head thickness, MAWP and corrosion assessment.",
    geometryBasis: "2:1 formed head and inside diameter",
    engineId: "api510.ellipsoidal-head",
    searchTerms: "elliptical ellipsoidal 2:1 two to one formed head",
  },
  {
    component: "torispherical",
    title: "Torispherical head",
    shortTitle: "Torispherical",
    description: "Torispherical head assessment using inside diameter and crown radius.",
    geometryBasis: "Inside diameter and inside crown radius",
    engineId: "api510.torispherical-head",
    searchTerms: "torispherical flanged dished crown radius head",
  },
  {
    component: "hemispherical",
    title: "Hemispherical head",
    shortTitle: "Hemispherical",
    description: "Hemispherical head thickness, MAWP and remaining-life assessment.",
    geometryBasis: "Inside spherical radius",
    engineId: "api510.hemispherical-head",
    searchTerms: "hemisphere hemispherical spherical radius head",
  },
  {
    component: "conical",
    title: "Conical head",
    shortTitle: "Conical",
    description: "Conical head assessment using outside diameter and half-apex angle.",
    geometryBasis: "Outside diameter and cone half-apex angle",
    engineId: "api510.conical-head",
    searchTerms: "cone conical transition outside diameter half apex angle",
  },
  {
    component: "flat-circular",
    title: "Flat circular head",
    shortTitle: "Flat head",
    description: "Flat circular head assessment using span and attachment factor.",
    geometryBasis: "Diameter or short span and attachment factor C",
    engineId: "api510.flat-circular-head",
    searchTerms: "flat circular head cover span attachment factor c",
  },
] as const;

export function api510CalculatorFor(component: PressureVesselComponent): Api510CalculatorDefinition {
  const definition = API510_CALCULATORS.find((candidate) => candidate.component === component);
  if (!definition) throw new Error(`Unknown API 510 calculator component: ${component}`);
  return definition;
}

export function filterApi510Calculators(query: string): Api510CalculatorDefinition[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...API510_CALCULATORS];
  return API510_CALCULATORS.filter((definition) => `${definition.title} ${definition.description} ${definition.geometryBasis} ${definition.searchTerms}`.toLowerCase().includes(normalized));
}
