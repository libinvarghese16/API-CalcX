import type {
  Api653NozzleAssessmentInputSI,
  Api653NozzleAssessmentResultSI,
  Api653NozzleField,
  Api653NozzleMaterial,
  Api653NozzleMinimumSelectionSI,
  Api653NozzlePressureClass,
  Api653NozzleResultSI,
  CalculationIssue,
} from "../contracts.ts";

type StructuralRow = Partial<Record<Api653NozzlePressureClass, number | null>>;
type StructuralTable = {
  maxTempC: number;
  tableId: string;
  tableTemperatureLabel: string;
  classes: readonly Api653NozzlePressureClass[];
  values: Readonly<Record<string, StructuralRow>>;
};

const MATERIAL_LABELS: Readonly<Record<Api653NozzleMaterial, string>> = {
  "carbon steel": "Carbon steel",
  "stainless steel": "Stainless steel",
  "1-1/4cr-1/2mo": "1-1/4Cr-1/2Mo",
};

export const API653_NOZZLE_SIZES = ["1/8", "1/4", "3/8", "1/2", "3/4", "1", "1 1/4", "1 1/2", "2", "2 1/2", "3", "3 1/2", "4", "5", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24"] as const;
export const API653_NOZZLE_PRESSURE_CLASSES = ["150", "300", "600", "900", "1500", "2500"] as const satisfies readonly Api653NozzlePressureClass[];

const c6 = API653_NOZZLE_PRESSURE_CLASSES;
const c5 = ["300", "600", "900", "1500", "2500"] as const satisfies readonly Api653NozzlePressureClass[];

const STRUCTURAL_TABLES: Readonly<Record<Api653NozzleMaterial, readonly StructuralTable[]>> = {
  "carbon steel": [
    { maxTempC: 205, tableId: "API 574 Table D.2b", tableTemperatureLabel: "400 F (205 C)", classes: c6, values: {
      "1/2":{"150":1.27,"300":1.27,"600":1.27,"900":1.27,"1500":1.40,"2500":2.03}, "3/4":{"150":1.27,"300":1.27,"600":1.27,"900":1.27,"1500":1.52,"2500":2.29},
      "1":{"150":1.27,"300":1.27,"600":1.40,"900":1.40,"1500":1.78,"2500":2.67}, "1 1/2":{"150":1.27,"300":1.27,"600":1.78,"900":1.78,"1500":2.29,"2500":3.68},
      "2":{"150":1.27,"300":1.40,"600":2.03,"900":2.03,"1500":2.92,"2500":4.57}, "3":{"150":1.65,"300":2.41,"600":3.43,"900":3.43,"1500":4.95,"2500":7.49},
      "4":{"150":1.52,"300":2.41,"600":3.94,"900":3.94,"1500":5.72,"2500":8.89}, "6":{"150":1.27,"300":2.54,"600":4.45,"900":4.83,"1500":7.49,"2500":12.07},
      "8":{"150":1.52,"300":2.92,"600":5.46,"900":6.10,"1500":9.53,"2500":15.37}, "10":{"150":2.03,"300":3.30,"600":6.22,"900":7.37,"1500":11.56,"2500":18.92},
      "12":{"150":2.29,"300":3.68,"600":6.86,"900":8.51,"1500":13.46,"2500":21.97}, "14":{"150":2.29,"300":3.94,"600":7.62,"900":9.27,"1500":14.86,"2500":22.48},
      "16":{"150":2.54,"300":4.45,"600":8.38,"900":10.41,"1500":16.64,"2500":25.53}, "18":{"150":2.79,"300":4.70,"600":9.02,"900":11.56,"1500":18.54,"2500":28.58},
      "20":{"150":3.05,"300":5.33,"600":9.78,"900":12.70,"1500":20.45,"2500":31.62}, "24":{"150":3.56,"300":6.22,"600":11.43,"900":15.11,"1500":24.38,"2500":37.72},
    }},
    { maxTempC: 400, tableId: "API 574 Table D.2d", tableTemperatureLabel: "750 F (400 C)", classes: c6, values: {
      "1/2":{"150":1.27,"300":1.27,"600":1.27,"900":1.40,"1500":1.78,"2500":2.54}, "3/4":{"150":1.27,"300":1.27,"600":1.40,"900":1.40,"1500":1.91,"2500":2.79},
      "1":{"150":1.27,"300":1.27,"600":1.91,"900":1.91,"1500":2.16,"2500":3.30}, "1 1/2":{"150":1.27,"300":1.27,"600":2.29,"900":2.29,"1500":2.79,"2500":4.45},
      "2":{"150":1.27,"300":1.78,"600":2.54,"900":2.54,"1500":3.43,"2500":5.46}, "3":{"150":2.29,"300":3.30,"600":4.57,"900":4.57,"1500":6.22,"2500":9.27},
      "4":{"150":2.03,"300":3.18,"600":5.08,"900":5.08,"1500":6.86,"2500":10.67}, "6":{"150":1.52,"300":3.18,"600":5.72,"900":5.84,"1500":8.89,"2500":14.35},
      "8":{"150":1.65,"300":3.68,"600":6.86,"900":7.37,"1500":11.30,"2500":18.03}, "10":{"150":2.16,"300":4.06,"600":7.75,"900":8.76,"1500":13.59,"2500":22.23},
      "12":{"150":2.29,"300":4.45,"600":8.38,"900":10.03,"1500":15.75,"2500":25.65}, "14":{"150":2.54,"300":4.83,"600":9.27,"900":10.92,"1500":17.27,"2500":25.78},
      "16":{"150":2.79,"300":5.33,"600":10.16,"900":12.19,"1500":19.43,"2500":29.21}, "18":{"150":2.79,"300":5.72,"600":10.92,"900":13.46,"1500":21.59,"2500":32.64},
      "20":{"150":3.30,"300":6.35,"600":11.68,"900":14.86,"1500":23.75,"2500":36.07}, "24":{"150":3.56,"300":7.37,"600":13.59,"900":17.53,"1500":28.19,"2500":42.93},
    }},
  ],
  "stainless steel": [
    { maxTempC: 205, tableId: "API 574 Table D.3b", tableTemperatureLabel: "400 F (205 C)", classes: c6, values: {
      "1/2":{"150":1.27,"300":1.27,"600":1.27,"900":1.27,"1500":1.27,"2500":1.91}, "3/4":{"150":1.27,"300":1.27,"600":1.27,"900":1.27,"1500":1.40,"2500":2.03},
      "1":{"150":1.27,"300":1.27,"600":1.40,"900":1.40,"1500":1.65,"2500":2.41}, "1 1/2":{"150":1.27,"300":1.27,"600":1.65,"900":1.65,"1500":2.03,"2500":3.30},
      "2":{"150":1.27,"300":1.27,"600":1.91,"900":1.91,"1500":2.54,"2500":4.06}, "3":{"150":1.78,"300":2.41,"600":3.30,"900":3.30,"1500":4.45,"2500":6.73},
      "4":{"150":1.52,"300":2.29,"600":3.68,"900":3.68,"1500":5.08,"2500":7.87}, "6":{"150":1.40,"300":2.29,"600":4.06,"900":4.32,"1500":6.60,"2500":10.67},
      "8":{"150":1.52,"300":2.67,"600":4.95,"900":5.33,"1500":8.26,"2500":13.46}, "10":{"150":2.03,"300":3.05,"600":5.59,"900":6.48,"1500":10.03,"2500":16.51},
      "12":{"150":2.29,"300":3.30,"600":6.10,"900":7.37,"1500":11.68,"2500":19.18}, "14":{"150":2.29,"300":3.56,"600":6.73,"900":8.00,"1500":12.83,"2500":19.30},
      "16":{"150":2.54,"300":3.94,"600":7.37,"900":9.02,"1500":14.35,"2500":21.97}, "18":{"150":2.79,"300":4.19,"600":8.00,"900":9.91,"1500":16.00,"2500":24.51},
      "20":{"150":3.05,"300":4.70,"600":8.51,"900":10.92,"1500":17.65,"2500":27.05}, "24":{"150":3.56,"300":5.46,"600":9.91,"900":12.95,"1500":20.83,"2500":32.26},
    }},
    { maxTempC: 540, tableId: "API 574 Table D.3d", tableTemperatureLabel: "1000 F (540 C)", classes: c6, values: {
      "1/2":{"150":1.27,"300":1.27,"600":1.27,"900":1.27,"1500":1.52,"2500":2.16}, "3/4":{"150":1.27,"300":1.27,"600":1.27,"900":1.27,"1500":1.52,"2500":2.16},
      "1":{"150":1.27,"300":1.27,"600":1.65,"900":1.65,"1500":1.65,"2500":2.54}, "1 1/2":{"150":1.27,"300":1.27,"600":2.03,"900":2.03,"1500":2.16,"2500":3.43},
      "2":{"150":1.27,"300":1.65,"600":2.16,"900":2.16,"1500":2.67,"2500":4.19}, "3":{"150":2.03,"300":2.92,"600":3.94,"900":3.94,"1500":4.95,"2500":7.24},
      "4":{"150":1.78,"300":2.79,"600":4.32,"900":4.32,"1500":5.33,"2500":8.26}, "6":{"150":1.27,"300":2.67,"600":4.57,"900":4.57,"1500":6.73,"2500":10.80},
      "8":{"150":1.40,"300":3.05,"600":5.46,"900":5.46,"1500":8.38,"2500":13.59}, "10":{"150":2.16,"300":3.30,"600":6.10,"900":6.48,"1500":10.03,"2500":16.64},
      "12":{"150":2.29,"300":3.56,"600":6.48,"900":7.37,"1500":11.56,"2500":19.05}, "14":{"150":2.54,"300":3.81,"600":7.24,"900":8.00,"1500":12.70,"2500":18.80},
      "16":{"150":2.79,"300":4.19,"600":7.75,"900":8.89,"1500":14.10,"2500":21.21}, "18":{"150":2.79,"300":4.45,"600":8.26,"900":9.78,"1500":15.62,"2500":23.62},
      "20":{"150":3.30,"300":4.83,"600":8.76,"900":10.67,"1500":17.15,"2500":26.04}, "24":{"150":3.56,"300":5.72,"600":10.16,"900":12.57,"1500":20.32,"2500":30.86},
    }},
  ],
  "1-1/4cr-1/2mo": [
    { maxTempC: 400, tableId: "API 574 Table D.4b", tableTemperatureLabel: "750 F (400 C)", classes: c6, values: {
      "1/2":{"150":1.27,"300":1.27,"600":1.27,"900":1.40,"1500":1.78,"2500":2.54}, "3/4":{"150":1.27,"300":1.27,"600":1.40,"900":1.40,"1500":1.91,"2500":2.67},
      "1":{"150":1.27,"300":1.27,"600":1.91,"900":1.91,"1500":2.16,"2500":3.18}, "1 1/2":{"150":1.27,"300":1.27,"600":2.29,"900":2.29,"1500":2.79,"2500":4.32},
      "2":{"150":1.27,"300":1.78,"600":2.54,"900":2.54,"1500":3.43,"2500":5.21}, "3":{"150":2.16,"300":3.56,"600":4.83,"900":4.83,"1500":6.22,"2500":9.14},
      "4":{"150":1.91,"300":3.56,"600":5.33,"900":5.33,"1500":7.11,"2500":10.67}, "6":{"150":1.52,"300":3.18,"600":5.59,"900":5.72,"1500":8.76,"2500":14.35},
      "8":{"150":1.78,"300":3.81,"600":7.11,"900":7.11,"1500":11.05,"2500":18.03}, "10":{"150":2.16,"300":4.19,"600":7.87,"900":8.38,"1500":13.34,"2500":21.97},
      "12":{"150":2.29,"300":4.45,"600":8.38,"900":9.65,"1500":15.49,"2500":25.27}, "14":{"150":2.54,"300":4.83,"600":9.14,"900":10.54,"1500":17.02,"2500":25.65},
      "16":{"150":2.79,"300":5.33,"600":10.03,"900":11.81,"1500":19.18,"2500":28.96}, "18":{"150":2.79,"300":5.59,"600":10.67,"900":13.21,"1500":21.21,"2500":32.39},
      "20":{"150":3.30,"300":6.22,"600":11.43,"900":14.48,"1500":23.37,"2500":35.69}, "24":{"150":3.56,"300":7.24,"600":13.34,"900":17.15,"1500":27.81,"2500":42.55},
    }},
    { maxTempC: 595, tableId: "API 574 Table D.4d", tableTemperatureLabel: "1100 F (595 C)", classes: c5, values: {
      "1/2":{"300":null,"600":null,"900":null,"1500":null,"2500":null}, "3/4":{"300":null,"600":null,"900":null,"1500":null,"2500":null},
      "1":{"300":7.24,"600":null,"900":6.22,"1500":6.99,"2500":null}, "1 1/2":{"300":6.35,"600":null,"900":5.72,"1500":6.48,"2500":null},
      "2":{"300":null,"600":null,"900":6.86,"1500":8.00,"2500":null}, "3":{"300":null,"600":null,"900":null,"1500":null,"2500":null},
      "4":{"300":null,"600":null,"900":14.73,"1500":null,"2500":null}, "6":{"300":11.81,"600":null,"900":11.81,"1500":17.02,"2500":33.66},
      "8":{"300":12.45,"600":25.53,"900":25.53,"1500":25.53,"2500":37.08}, "10":{"300":11.94,"600":23.37,"900":23.37,"1500":23.37,"2500":42.04},
      "12":{"300":11.43,"600":21.21,"900":21.21,"1500":24.00,"2500":43.31}, "14":{"300":12.19,"600":23.50,"900":23.50,"1500":26.29,"2500":33.02},
      "16":{"300":12.57,"600":23.37,"900":23.37,"1500":27.81,"2500":35.94}, "18":{"300":12.45,"600":22.99,"900":22.99,"1500":29.85,"2500":38.99},
      "20":{"300":13.84,"600":22.73,"900":22.73,"1500":31.88,"2500":42.04}, "24":{"300":14.73,"600":24.77,"900":24.77,"1500":36.32,"2500":48.39},
    }},
  ],
};

function npsNumber(size: string): number {
  return size.trim().split(/\s+/).reduce((total, part) => {
    const fraction = part.match(/^(\d+)\/(\d+)$/);
    return total + (fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(part) || 0);
  }, 0);
}

function issue(field: Api653NozzleField, code: string, message: string): CalculationIssue {
  return { field, code, message, severity: "error" };
}

export function listApi653NozzleMaterials(): ReadonlyArray<{ id: Api653NozzleMaterial; label: string }> {
  return (Object.keys(MATERIAL_LABELS) as Api653NozzleMaterial[]).map((id) => ({ id, label: MATERIAL_LABELS[id] }));
}

export function selectApi653NozzleMinimumThickness(input: Pick<Api653NozzleAssessmentInputSI, "material" | "operatingTemperatureC" | "pressureClass"> & { nominalPipeSizeIn: string }): Api653NozzleMinimumSelectionSI {
  const materialLabel = MATERIAL_LABELS[input.material] ?? input.material;
  const unavailable = (message: string, table: StructuralTable | null = null): Api653NozzleMinimumSelectionSI => ({
    available: false, material: input.material, materialLabel, operatingTemperatureC: input.operatingTemperatureC,
    pressureClass: input.pressureClass, selectedSizeIn: input.nominalPipeSizeIn, lookupSizeIn: null,
    usedLowestValue: false, usedNextLowerValue: false, valueMm: null, tableId: table?.tableId ?? null,
    tableTemperatureLabel: table?.tableTemperatureLabel ?? null, message,
  });
  const tables = STRUCTURAL_TABLES[input.material];
  if (!tables) return unavailable("Select a supported nozzle material.");
  if (!Number.isFinite(input.operatingTemperatureC)) return unavailable("Enter a valid operating temperature.");
  const table = tables.find((candidate) => input.operatingTemperatureC <= candidate.maxTempC) ?? null;
  if (!table) return unavailable(`No protected-source structural thickness table covers ${input.operatingTemperatureC} °C for ${materialLabel}.`);
  if (!table.classes.includes(input.pressureClass)) return unavailable(`${table.tableId} does not include pressure class ${input.pressureClass}.`, table);
  const selectedNumber = npsNumber(input.nominalPipeSizeIn);
  if (!(selectedNumber > 0)) return unavailable("Select the nozzle nominal pipe size.", table);
  const lookupSizes = Object.keys(table.values).sort((a, b) => npsNumber(a) - npsNumber(b));
  const lowest = lookupSizes[0]!;
  const exact = lookupSizes.find((size) => Math.abs(npsNumber(size) - selectedNumber) < 1e-9);
  const lower = [...lookupSizes].reverse().find((size) => npsNumber(size) <= selectedNumber);
  const lookupSize = exact ?? lower ?? lowest;
  const usedLowestValue = selectedNumber < npsNumber(lowest);
  const usedNextLowerValue = !exact && !usedLowestValue;
  const value = table.values[lookupSize]?.[input.pressureClass];
  const fallback = usedLowestValue
    ? ` NPS ${input.nominalPipeSizeIn} is below the listed range, so the lowest listed NPS ${lookupSize} value is used.`
    : usedNextLowerValue ? ` NPS ${input.nominalPipeSizeIn} is not listed, so the next-lower NPS ${lookupSize} value is used.` : "";
  const basis = `${table.tableId} (${table.tableTemperatureLabel}) for ${materialLabel}, pressure class ${input.pressureClass}.${fallback}`;
  if (value === null || value === undefined) return { ...unavailable(`${basis} The selected table cell has no value.`, table), lookupSizeIn: lookupSize, usedLowestValue, usedNextLowerValue };
  return {
    available: true, material: input.material, materialLabel, operatingTemperatureC: input.operatingTemperatureC,
    pressureClass: input.pressureClass, selectedSizeIn: input.nominalPipeSizeIn, lookupSizeIn: lookupSize,
    usedLowestValue, usedNextLowerValue, valueMm: value, tableId: table.tableId,
    tableTemperatureLabel: table.tableTemperatureLabel, message: `Using ${basis}`,
  };
}

export function calculateApi653NozzleAssessment(input: Api653NozzleAssessmentInputSI): Api653NozzleAssessmentResultSI {
  const issues: CalculationIssue[] = [];
  if (!MATERIAL_LABELS[input.material]) issues.push(issue("material", "unsupported-material", "Select a supported nozzle material."));
  if (!Number.isFinite(input.operatingTemperatureC)) issues.push(issue("operatingTemperatureC", "invalid-temperature", "Operating temperature must be a valid number."));
  if (!API653_NOZZLE_PRESSURE_CLASSES.includes(input.pressureClass)) issues.push(issue("pressureClass", "unsupported-pressure-class", "Select a supported flange pressure class."));
  if (!(input.yearsInService > 0)) issues.push(issue("yearsInService", "invalid-years-in-service", "Years in service must be greater than zero."));
  if (!(input.yearsSincePreviousInspection > 0)) issues.push(issue("yearsSincePreviousInspection", "invalid-previous-interval", "Years since previous inspection must be greater than zero."));

  const nozzles: Api653NozzleResultSI[] = (Array.isArray(input.nozzles) ? input.nozzles : []).map((nozzle, position) => {
    const index = Number.isFinite(nozzle.nozzleIndex) ? nozzle.nozzleIndex : position + 1;
    const active = Boolean(nozzle.nominalPipeSizeIn.trim()) || nozzle.originalThicknessMm > 0 || nozzle.previousThicknessMm > 0 || nozzle.actualThicknessMm > 0 || nozzle.manualMinimumThicknessMm > 0 || nozzle.pressureMinimumThicknessMm > 0;
    const selection = selectApi653NozzleMinimumThickness({ ...input, nominalPipeSizeIn: nozzle.nominalPipeSizeIn });
    const automaticMinimumThicknessMm = selection.valueMm;
    const structuralMinimumThicknessMmUsed = nozzle.minimumThicknessMode === "manual" ? nozzle.manualMinimumThicknessMm : automaticMinimumThicknessMm ?? 0;
    const pressureMinimumThicknessMmUsed = Number.isFinite(nozzle.pressureMinimumThicknessMm) ? Math.max(nozzle.pressureMinimumThicknessMm, 0) : 0;
    const minimumThicknessMmUsed = Math.max(structuralMinimumThicknessMmUsed, pressureMinimumThicknessMmUsed);
    const governingMinimumBasis = pressureMinimumThicknessMmUsed > structuralMinimumThicknessMmUsed ? "pressure" as const : "structural" as const;
    if (active && !nozzle.nominalPipeSizeIn.trim()) issues.push(issue("nominalPipeSizeIn", "missing-size", `Nozzle ${index}: select a nominal pipe size.`));
    if (active && nozzle.minimumThicknessMode === "auto" && !selection.available) issues.push(issue("calculation", "minimum-unavailable", `Nozzle ${index}: ${selection.message}`));
    if (active && nozzle.minimumThicknessMode === "manual" && !(nozzle.manualMinimumThicknessMm > 0)) issues.push(issue("manualMinimumThicknessMm", "invalid-manual-minimum", `Nozzle ${index}: manual minimum thickness must be greater than zero.`));
    if (active && !(nozzle.pressureMinimumThicknessMm > 0)) issues.push(issue("pressureMinimumThicknessMm", "pressure-minimum-required", `Nozzle ${index}: enter the pressure-design minimum thickness from the controlled nozzle design calculation.`));
    if (active && !(nozzle.originalThicknessMm > 0)) issues.push(issue("originalThicknessMm", "invalid-original-thickness", `Nozzle ${index}: original thickness must be greater than zero.`));
    if (active && !(nozzle.actualThicknessMm > 0)) issues.push(issue("actualThicknessMm", "invalid-actual-thickness", `Nozzle ${index}: actual thickness must be greater than zero.`));
    const longTerm = nozzle.originalThicknessMm > 0 && nozzle.actualThicknessMm > 0 && input.yearsInService > 0 ? Math.max((nozzle.originalThicknessMm - nozzle.actualThicknessMm) / input.yearsInService, 0) : 0;
    const shortTerm = nozzle.previousThicknessMm > 0 && nozzle.actualThicknessMm > 0 && input.yearsSincePreviousInspection > 0 ? Math.max((nozzle.previousThicknessMm - nozzle.actualThicknessMm) / input.yearsSincePreviousInspection, 0) : 0;
    const governing = Math.max(longTerm, shortTerm);
    const corrosionAllowance = nozzle.actualThicknessMm > 0 && minimumThicknessMmUsed > 0 ? nozzle.actualThicknessMm - minimumThicknessMmUsed : 0;
    const remainingLifeYears = !active || !(nozzle.actualThicknessMm > 0) || !(minimumThicknessMmUsed > 0)
      ? null : corrosionAllowance <= 0 ? 0 : governing > 0 ? corrosionAllowance / governing : Number.POSITIVE_INFINITY;
    return {
      nozzleIndex: index, detail: nozzle.detail, active, nominalPipeSizeIn: nozzle.nominalPipeSizeIn,
      minimumThicknessMode: nozzle.minimumThicknessMode, automaticMinimumThicknessMm, structuralMinimumThicknessMmUsed,
      pressureMinimumThicknessMmUsed, governingMinimumBasis, minimumThicknessMmUsed,
      minimumSelection: selection, originalThicknessMmUsed: nozzle.originalThicknessMm,
      previousThicknessMmUsed: nozzle.previousThicknessMm, actualThicknessMmUsed: nozzle.actualThicknessMm,
      corrosionAllowanceMm: corrosionAllowance, longTermCorrosionRateMmPerYear: longTerm,
      shortTermCorrosionRateMmPerYear: shortTerm, governingCorrosionRateMmPerYear: governing, remainingLifeYears,
    };
  });
  const assessed = nozzles.filter((nozzle) => nozzle.remainingLifeYears !== null);
  const finite = assessed.filter((nozzle) => nozzle.remainingLifeYears !== null && Number.isFinite(nozzle.remainingLifeYears));
  const openEnded = assessed.filter((nozzle) => nozzle.remainingLifeYears === Number.POSITIVE_INFINITY);
  const minimum = finite.reduce<Api653NozzleResultSI | null>((current, nozzle) => current === null || (nozzle.remainingLifeYears ?? Infinity) < (current.remainingLifeYears ?? Infinity) ? nozzle : current, null) ?? openEnded[0] ?? null;
  const maximum = openEnded[0] ?? finite.reduce<Api653NozzleResultSI | null>((current, nozzle) => current === null || (nozzle.remainingLifeYears ?? -Infinity) > (current.remainingLifeYears ?? -Infinity) ? nozzle : current, null);
  const maximumRate = assessed.filter((nozzle) => nozzle.governingCorrosionRateMmPerYear > 0).reduce<Api653NozzleResultSI | null>((current, nozzle) => current === null || nozzle.governingCorrosionRateMmPerYear > current.governingCorrosionRateMmPerYear ? nozzle : current, null);
  return {
    engineId: "api653.nozzle", engineVersion: "0.1.0-original-web-parity", ok: !issues.some((entry) => entry.severity === "error"), issues,
    material: input.material, materialLabel: MATERIAL_LABELS[input.material] ?? input.material,
    operatingTemperatureCUsed: input.operatingTemperatureC, pressureClass: input.pressureClass,
    yearsInServiceUsed: input.yearsInService, yearsSincePreviousInspectionUsed: input.yearsSincePreviousInspection,
    nozzles, assessedNozzleCount: assessed.length, minimumRemainingLifeYears: minimum?.remainingLifeYears ?? null,
    minimumRemainingLifeNozzleIndex: minimum?.nozzleIndex ?? null, maximumRemainingLifeYears: maximum?.remainingLifeYears ?? null,
    maximumCorrosionRateMmPerYear: maximumRate?.governingCorrosionRateMmPerYear ?? 0,
    maximumCorrosionRateNozzleIndex: maximumRate?.nozzleIndex ?? null, hasOpenEndedRemainingLife: openEnded.length > 0,
  };
}
