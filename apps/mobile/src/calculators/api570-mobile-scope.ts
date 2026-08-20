export type Api570MobileWorkspaceId = "piping" | "tubes" | "headers" | "other-calculations";
export type Api570ExcludedWorkspaceId = "bulk" | "tube-table";

export type Api570MobileWorkspace = {
  id: Api570MobileWorkspaceId;
  title: string;
  summary: string;
  protectedSourceFunction: string;
  migrationStatus: "validated" | "in-progress" | "planned";
  progressLabel?: string;
};

export type Api570ExcludedWorkspace = {
  id: Api570ExcludedWorkspaceId;
  title: string;
  reason: string;
};

export const API570_MOBILE_WORKSPACES: readonly Api570MobileWorkspace[] = [
  {
    id: "piping",
    title: "Piping calculator",
    summary: "Individual pipe thickness, MAWP, corrosion-rate, remaining-life and inspection calculations.",
    protectedSourceFunction: "calculatePipe",
    migrationStatus: "validated",
  },
  {
    id: "tubes",
    title: "Tube calculator",
    summary: "Individual tube thickness, MAWP, corrosion-rate, remaining-life and inspection calculations.",
    protectedSourceFunction: "calculateTube",
    migrationStatus: "validated",
  },
  {
    id: "headers",
    title: "Header calculator",
    summary: "Individual header thickness, MAWP, corrosion-rate, remaining-life and inspection calculations.",
    protectedSourceFunction: "calculateHeader",
    migrationStatus: "validated",
  },
  {
    id: "other-calculations",
    title: "Other Piping Calculations",
    summary: "Barlow pressure design, valve/fittings thickness, pressure tests, weld sizing, tension testing, and soil resistivity.",
    protectedSourceFunction: "calculateApi570OtherCalculations",
    migrationStatus: "validated",
    progressLabel: "8 of 8 validated",
  },
] as const;

export const API570_EXCLUDED_MOBILE_WORKSPACES: readonly Api570ExcludedWorkspace[] = [
  {
    id: "bulk",
    title: "Piping calculation table",
    reason: "The owner does not require the bulk piping table in the mobile application.",
  },
  {
    id: "tube-table",
    title: "Tube calculation table",
    reason: "The owner does not require the bulk tube table in the mobile application.",
  },
] as const;

export const API570_MOBILE_MODULE = {
  description: "Pipe, tube, header and other piping calculations.",
  count: `${API570_MOBILE_WORKSPACES.length} individual workspaces`,
  status: "No bulk tables",
} as const;

export function isApi570MobileWorkspaceIncluded(workspaceId: string): workspaceId is Api570MobileWorkspaceId {
  return API570_MOBILE_WORKSPACES.some((workspace) => workspace.id === workspaceId);
}

export function filterApi570MobileWorkspaces(query: string): Api570MobileWorkspace[] {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const normalized = normalize(query);
  if (!normalized) return [...API570_MOBILE_WORKSPACES];
  return API570_MOBILE_WORKSPACES.filter((workspace) =>
    normalize(`${workspace.title} ${workspace.summary}`).includes(normalized),
  );
}
