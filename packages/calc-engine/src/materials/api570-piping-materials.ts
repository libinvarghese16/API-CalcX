import { API570_PIPING_MATERIAL_TABLE } from "../data/api570-piping-material-table.generated.ts";
import type { MaterialGradeRecord, MaterialStressResolution } from "./material-catalog.ts";

export const DEFAULT_API570_MATERIAL_SPEC = "A106";
export const DEFAULT_API570_MATERIAL_GRADE = "A106|B|31";

export interface Api570PipingMaterialGradeOption {
  key: string;
  grade: string;
  label: string;
  productForm: string;
  materialFamily: string;
  notes: string;
  sourceLine: string;
}

function normalizeMaterialSpec(materialSpec: string): string | null {
  const rawSpec = materialSpec.trim();
  if (!rawSpec) return null;
  if (API570_PIPING_MATERIAL_TABLE[rawSpec]) return rawSpec;

  const keys = Object.keys(API570_PIPING_MATERIAL_TABLE);
  const direct = keys.find((key) => key.toLowerCase() === rawSpec.toLowerCase());
  if (direct) return direct;

  const loose = rawSpec.toLowerCase().replace(/[^a-z0-9]/g, "");
  return keys.find((key) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === loose) ?? null;
}

function gradeLabel(entry: MaterialGradeRecord, duplicateGrade: boolean): string {
  if (!duplicateGrade) return entry.g || entry.k;
  const qualifiers = [entry.c, entry.s, entry.s2, entry.m].filter(Boolean);
  return qualifiers.length ? `${entry.g} (${qualifiers.join(" / ")})` : entry.g || entry.k;
}

export function listApi570PipingMaterialSpecs(): string[] {
  return Object.keys(API570_PIPING_MATERIAL_TABLE).sort((left, right) => left.localeCompare(right));
}

export function listApi570PipingMaterialGrades(materialSpec: string): Api570PipingMaterialGradeOption[] {
  const normalizedSpec = normalizeMaterialSpec(materialSpec);
  if (!normalizedSpec) return [];
  const entries = API570_PIPING_MATERIAL_TABLE[normalizedSpec] ?? [];
  const counts = entries.reduce<Record<string, number>>((result, entry) => {
    result[entry.g] = (result[entry.g] ?? 0) + 1;
    return result;
  }, {});

  return entries.map((entry) => ({
    key: entry.k,
    grade: entry.g,
    label: gradeLabel(entry, (counts[entry.g] ?? 0) > 1),
    productForm: entry.c,
    materialFamily: entry.s,
    notes: entry.s2,
    sourceLine: entry.m,
  }));
}

/** Preserves the master-site rule: use the first table temperature limit at
 * or above the entered temperature. Values are never interpolated. */
export function resolveApi570PipingAllowableStress(
  materialSpec: string,
  gradeKey: string,
  designTemperatureC: number,
): MaterialStressResolution {
  const normalizedSpec = normalizeMaterialSpec(materialSpec);
  if (!normalizedSpec) {
    return {
      status: "material-not-found",
      materialSpec,
      gradeKey,
      designTemperatureC,
      tableLimitC: null,
      allowableStressMpa: null,
      message: "Select a material specification from the master piping catalog.",
    };
  }

  const entry = (API570_PIPING_MATERIAL_TABLE[normalizedSpec] ?? []).find((row) => row.k === gradeKey);
  if (!entry) {
    return {
      status: "grade-not-found",
      materialSpec: normalizedSpec,
      gradeKey,
      designTemperatureC,
      tableLimitC: null,
      allowableStressMpa: null,
      message: "Select a valid grade for the chosen piping material specification.",
    };
  }

  if (!Number.isFinite(designTemperatureC)) {
    return {
      status: "temperature-unavailable",
      materialSpec: normalizedSpec,
      gradeKey,
      designTemperatureC,
      tableLimitC: null,
      allowableStressMpa: null,
      message: "Enter a valid temperature to resolve allowable stress.",
    };
  }

  for (const [tableLimitC, allowableStressMpa] of entry.a) {
    if (!Number.isFinite(tableLimitC) || designTemperatureC > tableLimitC) continue;
    if (Number.isFinite(allowableStressMpa)) {
      return {
        status: "resolved",
        materialSpec: normalizedSpec,
        gradeKey,
        designTemperatureC,
        tableLimitC,
        allowableStressMpa,
        message: `Auto-picked from ${normalizedSpec} ${entry.g} at the ${tableLimitC} °C master-table limit (no interpolation).`,
      };
    }
    break;
  }

  return {
    status: "temperature-unavailable",
    materialSpec: normalizedSpec,
    gradeKey,
    designTemperatureC,
    tableLimitC: null,
    allowableStressMpa: null,
    message: "No allowable-stress value is available for this material at the entered temperature. Switch to manual only with a verified controlled value.",
  };
}
