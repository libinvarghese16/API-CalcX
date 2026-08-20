export type NativeBackAction =
  | { kind: "close-menu" }
  | { kind: "exit-app" }
  | { kind: "navigate"; destination: "calculators" | "home" };

const calculationPages = new Set([
  "calculator",
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
  "api653-bottom",
  "api653-annular",
  "api653-shell",
  "api653-nozzles",
  "api653-roof",
  "api653-other-4-3-2",
]);

export function resolveNativeBackAction(page: string, mobileMenuOpen: boolean): NativeBackAction {
  if (mobileMenuOpen) return { kind: "close-menu" };
  if (page === "home") return { kind: "exit-app" };
  if (calculationPages.has(page)) return { kind: "navigate", destination: "calculators" };
  return { kind: "navigate", destination: "home" };
}
