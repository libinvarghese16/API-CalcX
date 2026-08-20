export type Api570SupportToolId =
  | "pressure-design"
  | "valve-flanged-fittings"
  | "hydro-test"
  | "flange-hydro-test"
  | "pneumatic-test"
  | "fillet-weld"
  | "tension-test"
  | "soil-resistivity";

export type Api570SupportTool = {
  id: Api570SupportToolId;
  title: string;
  reference: string;
  formula: string;
  summary: string;
  migrationStatus: "validated" | "planned";
};

export const API570_SUPPORT_TOOLS: readonly Api570SupportTool[] = [
  {
    id: "pressure-design",
    title: "Pressure Design Thickness",
    reference: "API 574 11.1.2",
    formula: "t = PD / 2SE",
    summary: "Barlow required thickness and inverse allowable-working-pressure check.",
    migrationStatus: "validated",
  },
  {
    id: "valve-flanged-fittings",
    title: "Valve and Flanged Fittings Thickness",
    reference: "API 574 11.2",
    formula: "tm = 1.5(PD/2SE) + c",
    summary: "Pressure thickness, minimum required wall and allowable pressure from available wall.",
    migrationStatus: "validated",
  },
  {
    id: "hydro-test",
    title: "Hydro Test Pressure",
    reference: "B31.3 345.4.2",
    formula: "PT = 1.5 P Rr",
    summary: "Hydrostatic test pressure using the controlled stress-ratio dependency.",
    migrationStatus: "validated",
  },
  {
    id: "flange-hydro-test",
    title: "Flange Hydro Test",
    reference: "B16.5 2.6 / 8.2.2 / 8.2.4",
    formula: "PT = 1.5 × rating",
    summary: "Rounded bar/psi hydro test pressure and minimum test duration.",
    migrationStatus: "validated",
  },
  {
    id: "pneumatic-test",
    title: "Pneumatic Test Pressure",
    reference: "B31.3 345.5.4",
    formula: "PT = 1.1 P",
    summary: "Individual pneumatic pressure test calculation.",
    migrationStatus: "validated",
  },
  {
    id: "fillet-weld",
    title: "Fillet Weld Sizing",
    reference: "B31.3 328.5.2 / 328.5.4",
    formula: "Leg / throat / Xmin / tc",
    summary: "Fillet leg, throat, slip-on flange and branch-weld sizing checks.",
    migrationStatus: "validated",
  },
  {
    id: "tension-test",
    title: "Tension Test",
    reference: "ASME Section IX",
    formula: "Area / TS / Load",
    summary: "Specimen area, tensile strength and required-load calculations.",
    migrationStatus: "validated",
  },
  {
    id: "soil-resistivity",
    title: "Soil Resistivity",
    reference: "API 574 10.10.1.4.3",
    formula: "ρ = 191.5 d R",
    summary: "Four-pin soil resistivity calculation from spacing and resistance.",
    migrationStatus: "validated",
  },
] as const;
