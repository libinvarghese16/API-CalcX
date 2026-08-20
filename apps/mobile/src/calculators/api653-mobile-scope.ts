export type Api653MigrationStatus = "validated" | "planned";

export interface Api653MobileWorkspace {
  id: "bottom" | "annular" | "shell" | "nozzles" | "roof" | "other-4-3-2";
  title: string;
  summary: string;
  protectedSourceFunction: string;
  migrationStatus: Api653MigrationStatus;
}

export const API653_MOBILE_WORKSPACES: readonly Api653MobileWorkspace[] = [
  { id: "bottom", title: "Bottom plate remaining life", summary: "Bottom- and top-side loss, long/short corrosion rates, governing thickness, and remaining life.", protectedSourceFunction: "calculateBottom", migrationStatus: "validated" },
  { id: "annular", title: "Annular plate remaining life", summary: "Automatic/editable calculated shell stress and annular minimum, corrosion routes, and remaining-life assessment.", protectedSourceFunction: "calculateAnnular", migrationStatus: "validated" },
  { id: "shell", title: "Shell course assessment", summary: "Automatic/editable course stresses, minimum thickness, hydrostatic and operating heights, corrosion rates, and remaining life.", protectedSourceFunction: "updateShellWorkspace", migrationStatus: "validated" },
  { id: "nozzles", title: "Nozzle assessment", summary: "Automatic/editable structural minimum, mixed-unit measured wall, corrosion rates, and remaining life checks.", protectedSourceFunction: "updateNozzleWorkspace", migrationStatus: "validated" },
  { id: "roof", title: "Roof plate remaining life", summary: "Mixed-unit thickness history, editable inspection periods, corrosion rates, allowance, and remaining-life display states.", protectedSourceFunction: "calculateRoof", migrationStatus: "validated" },
  { id: "other-4-3-2", title: "Other 4.3.2 calculations", summary: "Automatic/editable critical length, five-point thickness average, adjusted thresholds, and optional two-part pitting screen.", protectedSourceFunction: "calculateApi653Other432", migrationStatus: "validated" },
] as const;

export const API653_MOBILE_MODULE = {
  description: "Bottom, annular, shell, nozzle, roof, and other tank calculations.",
  count: "6 individual workspaces",
  status: "6 validated",
} as const;

export function filterApi653MobileWorkspaces(query: string): Api653MobileWorkspace[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...API653_MOBILE_WORKSPACES];
  return API653_MOBILE_WORKSPACES.filter((workspace) => `${workspace.title} ${workspace.summary} ${workspace.protectedSourceFunction} API 653 tank storage`.toLowerCase().includes(normalized));
}
