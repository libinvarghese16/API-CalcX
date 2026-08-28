export const GUEST_MODULE_CODE = "API 570";

const guestPageIds = new Set([
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
]);

export function guestCanAccessPage(pageId: string): boolean {
  return guestPageIds.has(pageId);
}
export function modulesForGuestAccess<T extends { code: string }>(modules: readonly T[]): T[] {
  return modules.filter((module) => module.code === GUEST_MODULE_CODE);
}
