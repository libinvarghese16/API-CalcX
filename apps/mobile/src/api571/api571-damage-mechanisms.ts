export type Api571SectionKey =
  | "description"
  | "affectedMaterials"
  | "criticalFactors"
  | "affectedUnits"
  | "appearance"
  | "prevention"
  | "inspection"
  | "relatedMechanisms";

export type Api571DamageMechanism = {
  id: string;
  article: string;
  title: string;
  sections: Record<Api571SectionKey, string[]>;
};

export const API571_SECTION_DEFINITIONS: ReadonlyArray<{
  key: Api571SectionKey;
  label: string;
}> = [
  { key: "description", label: "Description of Damage" },
  { key: "affectedMaterials", label: "Affected Materials" },
  { key: "criticalFactors", label: "Critical Factors" },
  { key: "affectedUnits", label: "Affected Units or Equipment" },
  { key: "appearance", label: "Appearance or Morphology of Damage" },
  { key: "prevention", label: "Prevention/Mitigation" },
  { key: "inspection", label: "Inspection and Monitoring" },
  { key: "relatedMechanisms", label: "Related Mechanisms" },
];

export const API571_DATA_URL = "/data/api571-damage-mechanisms.json";

function mechanismSearchText(mechanism: Api571DamageMechanism): string {
  const sectionText = API571_SECTION_DEFINITIONS.flatMap(({ key }) => mechanism.sections[key]);
  return [mechanism.id, mechanism.article, mechanism.title, ...sectionText].join(" ").toLowerCase();
}

export function filterApi571DamageMechanisms(
  mechanisms: readonly Api571DamageMechanism[],
  query: string,
): Api571DamageMechanism[] {
  const tokens = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  if (!tokens.length) return [...mechanisms];

  return mechanisms.filter((mechanism) => {
    const searchableText = mechanismSearchText(mechanism);
    return tokens.every((token) => searchableText.includes(token));
  });
}

export function isApi571DamageMechanism(value: unknown): value is Api571DamageMechanism {
  if (!value || typeof value !== "object") return false;
  const mechanism = value as Partial<Api571DamageMechanism>;
  if (typeof mechanism.id !== "string" || typeof mechanism.article !== "string" || typeof mechanism.title !== "string") return false;
  if (!mechanism.sections || typeof mechanism.sections !== "object") return false;
  return API571_SECTION_DEFINITIONS.every(({ key }) => Array.isArray(mechanism.sections?.[key]));
}

export function parseApi571DamageMechanisms(value: unknown): Api571DamageMechanism[] {
  if (!Array.isArray(value) || !value.every(isApi571DamageMechanism)) {
    throw new Error("API 571 mechanism data is incomplete or invalid.");
  }
  return value;
}
