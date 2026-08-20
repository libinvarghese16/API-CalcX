import { PV_CYL_MATERIAL_TABLE } from "../data/pv-cyl-material-table.generated.ts";
import type {
  MaterialGradeOption,
  MaterialGradeRecord,
  MaterialStressResolution,
} from "./material-catalog.ts";

function normalizeMaterialSpec(materialSpec: string): string | null {
  const rawSpec = materialSpec.trim();
  if (!rawSpec) return null;
  if (PV_CYL_MATERIAL_TABLE[rawSpec]) return rawSpec;
  const lowerSpec = rawSpec.toLowerCase();
  return Object.keys(PV_CYL_MATERIAL_TABLE).find((key) => key.toLowerCase() === lowerSpec) ?? null;
}

function buildGradeLabel(entry: MaterialGradeRecord, duplicateGrade: boolean): string {
  if (!duplicateGrade) return entry.g || entry.k;
  const qualifiers = [entry.c, entry.s, entry.s2, entry.m].filter(Boolean);
  return qualifiers.length > 0 ? `${entry.g} (${qualifiers.join(" / ")})` : entry.g || entry.k;
}

export function listPressureVesselMaterialSpecs(): string[] {
  return Object.keys(PV_CYL_MATERIAL_TABLE).sort((left, right) => left.localeCompare(right));
}

export function listPressureVesselMaterialGrades(materialSpec: string): MaterialGradeOption[] {
  const normalizedSpec = normalizeMaterialSpec(materialSpec);
  if (!normalizedSpec) return [];
  const entries = PV_CYL_MATERIAL_TABLE[normalizedSpec] ?? [];
  const counts = entries.reduce<Record<string, number>>((result, entry) => {
    result[entry.g] = (result[entry.g] ?? 0) + 1;
    return result;
  }, {});

  return entries.map((entry) => ({
    key: entry.k,
    grade: entry.g,
    label: buildGradeLabel(entry, (counts[entry.g] ?? 0) > 1),
    condition: entry.c,
    productForm: entry.s,
    thicknessRange: entry.s2,
    sourceLine: entry.m,
  }));
}

/** Matches the protected legacy lookup: use the first table limit at or above
 * the entered design temperature. No interpolation is introduced. */
export function resolvePressureVesselAllowableStress(
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
      message: "Select a material specification from the controlled catalog.",
    };
  }

  const entry = (PV_CYL_MATERIAL_TABLE[normalizedSpec] ?? []).find((row) => row.k === gradeKey);
  if (!entry) {
    return {
      status: "grade-not-found",
      materialSpec: normalizedSpec,
      gradeKey,
      designTemperatureC,
      tableLimitC: null,
      allowableStressMpa: null,
      message: "Select a valid grade for the chosen material specification.",
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
      message: "Enter a valid design temperature to resolve allowable stress.",
    };
  }

  for (const [tableLimitC, allowableStressMpa] of entry.a) {
    if (Number.isFinite(tableLimitC) && designTemperatureC <= tableLimitC) {
      if (Number.isFinite(allowableStressMpa)) {
        return {
          status: "resolved",
          materialSpec: normalizedSpec,
          gradeKey,
          designTemperatureC,
          tableLimitC,
          allowableStressMpa,
          message: `Auto-filled from the ${normalizedSpec} ${entry.g} row at the ${tableLimitC} °C table limit.`,
        };
      }
      break;
    }
  }

  return {
    status: "temperature-unavailable",
    materialSpec: normalizedSpec,
    gradeKey,
    designTemperatureC,
    tableLimitC: null,
    allowableStressMpa: null,
    message: "No allowable-stress value is available for this material at the entered temperature.",
  };
}
