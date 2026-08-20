import type {
  Api510InputSnapshot,
  Api510ResultSnapshot,
  Api570InputSnapshot,
  Api570ResultSnapshot,
} from "./models.ts";

export interface CalculationFingerprintInput {
  projectId: string;
  equipmentTag: string;
  equipmentName: string;
  title: string;
  inputs: Api510InputSnapshot;
  result: Api510ResultSnapshot;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createCalculationFingerprint(input: CalculationFingerprintInput): string {
  const serialized = JSON.stringify({
    projectId: input.projectId,
    equipmentTag: input.equipmentTag.trim().toUpperCase(),
    equipmentName: input.equipmentName.trim(),
    title: input.title.trim(),
    inputs: input.inputs,
    result: input.result,
  });
  return `acp510-${fnv1a(serialized)}-${serialized.length}`;
}

export interface Api570CalculationFingerprintInput {
  projectId: string;
  assetTag: string;
  assetName: string;
  title: string;
  inputs: Api570InputSnapshot;
  result: Api570ResultSnapshot;
}

export function createApi570CalculationFingerprint(input: Api570CalculationFingerprintInput): string {
  const serialized = JSON.stringify({
    projectId: input.projectId,
    assetTag: input.assetTag.trim().toUpperCase(),
    assetName: input.assetName.trim(),
    title: input.title.trim(),
    inputs: input.inputs,
    result: input.result,
  });
  return `acp570-${fnv1a(serialized)}-${serialized.length}`;
}
