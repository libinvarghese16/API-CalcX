export interface ServiceYearsResult {
  buildYear: number;
  asOfYear: number;
  yearsInService: number | null;
  valid: boolean;
  message: string | null;
}

export interface PreviousInspectionYearsResult {
  previousInspectionYear: number;
  buildYear: number;
  asOfYear: number;
  yearsSincePreviousInspection: number | null;
  valid: boolean;
  message: string | null;
}

/**
 * Shared service-life rule for every calculator that records an equipment
 * build year. The calling UI supplies the current/as-of year so the engine
 * remains deterministic and testable.
 */
export function deriveYearsInService(buildYear: number, asOfYear: number): ServiceYearsResult {
  if (!Number.isInteger(asOfYear) || asOfYear < 1900) {
    return {
      buildYear,
      asOfYear,
      yearsInService: null,
      valid: false,
      message: "The calculation year must be a valid four-digit year.",
    };
  }

  if (!Number.isInteger(buildYear) || buildYear < 1900) {
    return {
      buildYear,
      asOfYear,
      yearsInService: null,
      valid: false,
      message: "Build year must be a whole year from 1900 onward.",
    };
  }

  if (buildYear > asOfYear) {
    return {
      buildYear,
      asOfYear,
      yearsInService: null,
      valid: false,
      message: `Build year cannot be later than ${asOfYear}.`,
    };
  }

  return {
    buildYear,
    asOfYear,
    yearsInService: asOfYear - buildYear,
    valid: true,
    message: null,
  };
}

export function deriveYearsSincePreviousInspection(
  previousInspectionYear: number,
  buildYear: number,
  asOfYear: number,
): PreviousInspectionYearsResult {
  const base = { previousInspectionYear, buildYear, asOfYear };

  if (!Number.isInteger(asOfYear) || asOfYear < 1900) {
    return { ...base, yearsSincePreviousInspection: null, valid: false, message: "The calculation year must be a valid four-digit year." };
  }
  if (!Number.isInteger(buildYear) || buildYear < 1900 || buildYear > asOfYear) {
    return { ...base, yearsSincePreviousInspection: null, valid: false, message: `Enter a valid build year from 1900 to ${asOfYear}.` };
  }
  if (!Number.isInteger(previousInspectionYear) || previousInspectionYear < 1900) {
    return { ...base, yearsSincePreviousInspection: null, valid: false, message: "Previous inspection year must be a whole year from 1900 onward." };
  }
  if (previousInspectionYear < buildYear) {
    return { ...base, yearsSincePreviousInspection: null, valid: false, message: "Previous inspection year cannot be earlier than the build year." };
  }
  if (previousInspectionYear > asOfYear) {
    return { ...base, yearsSincePreviousInspection: null, valid: false, message: `Previous inspection year cannot be later than ${asOfYear}.` };
  }

  return {
    ...base,
    yearsSincePreviousInspection: asOfYear - previousInspectionYear,
    valid: true,
    message: null,
  };
}
