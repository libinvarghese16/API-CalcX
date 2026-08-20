export type AutomaticValueMode = "auto" | "manual";

export interface AutomaticNumericValueResult {
  mode: AutomaticValueMode;
  value: number;
  valid: boolean;
}

/** Shared selection rule for values that can be calculated automatically or
 * explicitly overridden by the user. Domain limits remain in each calculator. */
export function resolveAutomaticNumericValue(
  mode: AutomaticValueMode,
  automaticValue: number | null,
  manualValue: number,
): AutomaticNumericValueResult {
  const value = mode === "auto" ? automaticValue ?? Number.NaN : manualValue;
  return { mode, value, valid: Number.isFinite(value) };
}
