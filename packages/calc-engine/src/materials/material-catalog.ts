export type MaterialStressPoint = [temperatureLimitC: number, allowableStressMpa: number | null];

export interface MaterialGradeRecord {
  k: string;
  g: string;
  c: string;
  s: string;
  s2: string;
  m: string;
  a: MaterialStressPoint[];
}

export type MaterialCatalog = Record<string, MaterialGradeRecord[]>;

export interface MaterialGradeOption {
  key: string;
  grade: string;
  label: string;
  condition: string;
  productForm: string;
  thicknessRange: string;
  sourceLine: string;
}

export type MaterialStressStatus = "resolved" | "material-not-found" | "grade-not-found" | "temperature-unavailable";

export interface MaterialStressResolution {
  status: MaterialStressStatus;
  materialSpec: string;
  gradeKey: string;
  designTemperatureC: number;
  tableLimitC: number | null;
  allowableStressMpa: number | null;
  message: string;
}
