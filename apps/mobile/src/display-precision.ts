export const STANDARD_RESULT_DECIMALS = 2;
export const CORROSION_RATE_DECIMALS = 3;

export type DisplayPrecisionKind = "standard" | "corrosion-rate";

export function displayDecimals(kind: DisplayPrecisionKind = "standard"): number {
  return kind === "corrosion-rate" ? CORROSION_RATE_DECIMALS : STANDARD_RESULT_DECIMALS;
}

export function formatDisplayNumber(value: number, kind: DisplayPrecisionKind = "standard"): string {
  return Number.isFinite(value) ? value.toFixed(displayDecimals(kind)) : "—";
}
