import { Api653PostRepairAssessment } from "../api653/Api653PostRepairAssessment.tsx";
import type { RemainingLifeAdditionsState } from "../local-data/repair-life-state.ts";
export type { RemainingLifeAdditionsState } from "../local-data/repair-life-state.ts";
export interface RepairLifeSource {
  id: string;
  label: string;
  originalThickness: number;
  minimumThickness: number;
  longRate: number | null;
  shortRate: number | null;
  ready: boolean;
}
export function RemainingLifeAdditions({ sources, value, onChange, showMfl = true }: {
  showMfl?: boolean; sources: RepairLifeSource[]; value: RemainingLifeAdditionsState; onChange: (next: RemainingLifeAdditionsState) => void;
}) {
  const source = sources.find(item => item.id === value.selectedId) ?? sources[0];
  if (!source) return null;
  return <div className="remaining-life-additions">
    {sources.length > 1 && <div className="repair-target-picker"><label className="field"><span>Repair assessment component</span><select className="select-control native-select" aria-label="Repair assessment component" value={source.id} onChange={event => onChange({ ...value, selectedId: event.target.value })}>{sources.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>}
    <Api653PostRepairAssessment key={source.id} value={value.assessments?.[source.id] ?? {}} onChange={next => onChange({ ...value, selectedId: source.id, assessments: { ...value.assessments, [source.id]: next } })}
      originalThickness={source.originalThickness} minimumThickness={source.minimumThickness}
      longRate={source.longRate} shortRate={source.shortRate} topRate={0} basisReady={source.ready} wall showMfl={showMfl} assessmentLabel={source.label} />
  </div>;
}
