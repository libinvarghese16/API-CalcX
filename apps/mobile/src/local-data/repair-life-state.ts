import type { Api653PostRepairInput } from "@api-calc-pro/calc-engine";

/** Independent repair scenarios stored alongside the original calculator inputs. */
export interface RemainingLifeAdditionsState {
  selectedId?: string;
  assessments?: Record<string, Api653PostRepairInput>;
}
