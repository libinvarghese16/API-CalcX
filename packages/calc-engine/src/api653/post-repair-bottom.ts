export interface Api653PostRepairPatch {
 name?: string; rtbc?: string | number; rtip?: string | number; patchThickness?: string | number; rate?: string | number; basis?: string; causeRemoved?: boolean; removalEvidence?: string;
}
export interface Api653PostRepairInput {
 buildDate?: string; previousDate?: string; assessmentDate?: string;
 originalThickness?: string | number; rtbc?: string | number; rtip?: string | number; minimumThickness?: string | number; proposedYears?: string | number;
 minimumBasis?: string; retainedVerified?: boolean; thicknessEvidence?: string; repairsComplete?: boolean; criticalReviewed?: boolean; annularReviewed?: boolean; reviewReference?: string;
 inspectionLimit?: string | number; inspectionBasis?: string;
 topRate?: string | number; topBasis?: string; liningCredit?: boolean; liningDate?: string; liningLife?: string | number; liningEvidence?: string;
 mflUsed?: boolean; mflThreshold?: string | number; repairCutoff?: string | number;
 useShort?: boolean; comparable?: boolean; location?: string; previousThickness?: string | number; currentHistoryThickness?: string | number;
 rateMode?: "auto" | "manual"; manualRate?: string | number; rateReason?: string;
 patches?: Api653PostRepairPatch[];
}
export interface Api653PostRepairAreaResult { name: string; thickness: number; undersideRate: number; topRate: number; combinedRate: number; life: number; projected: number }
type Numeric = string | number | null | undefined;
const numeric = (v: Numeric) => v !== '' && v != null && Number.isFinite(Number(v));
const positive = (v: Numeric) => numeric(v) && Number(v) > 0;
const nonnegative = (v: Numeric) => numeric(v) && Number(v) >= 0;
export function postRepairYearsBetween(from?: string, to?: string) {
    const parse = (v?: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return NaN;
        const n = Date.parse(v + 'T00:00:00Z');
        return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === v ? n : NaN;
    };
    return (parse(to) - parse(from)) / (365.25 * 86400000);
}
export function calculateApi653PostRepair(input: Api653PostRepairInput) {
    const errors: string[] = [], pending: string[] = [], rows: Api653PostRepairAreaResult[] = [];
    const age = postRepairYearsBetween(input.buildDate, input.assessmentDate);
    const historyYears = postRepairYearsBetween(input.previousDate, input.assessmentDate);
    const proposed = Number(input.proposedYears), minimum = Number(input.minimumThickness);
    if (!positive(input.originalThickness)) errors.push('Enter the original thickness greater than zero.');
    if (!positive(input.minimumThickness)) errors.push('Enter a controlled minimum thickness greater than zero.');
    if (!positive(input.proposedYears)) errors.push('Enter a proposed interval greater than zero.');
    if (input.repairCutoff != null && input.repairCutoff !== '' && (!nonnegative(input.repairCutoff) || Number(input.repairCutoff) > 100)) errors.push('Repair cutoff must be a percentage from 0 to 100; it does not establish a measured thickness.');
    if (!(age > 0)) errors.push('Build date must precede the assessment date.');
    if (input.minimumThickness !== '' && minimum !== 2.54 && !input.minimumBasis?.trim()) pending.push('Document the applicable basis for the nonstandard minimum thickness.');
    if (!input.retainedVerified) pending.push('Verify the retained-plate thickness and inspection coverage.');
    if (!input.thicknessEvidence?.trim()) pending.push('Record the thickness / inspection evidence reference.');
    if (!input.repairsComplete) pending.push('Confirm every repaired area is represented and repair inspection/testing is complete.');
    if (!input.criticalReviewed) pending.push('Complete the separate critical-zone assessment through the proposed interval.');
    if (!input.annularReviewed) pending.push('Complete the annular assessment or document that it is not applicable.');
    if (!input.reviewReference?.trim()) pending.push('Record the separate critical-zone / annular review reference.');
    if (!positive(input.inspectionLimit) || !input.inspectionBasis?.trim()) pending.push('Enter the independently established Section 6.4.2 interval limit and its basis.');
    let top = Number(input.topRate), coatingRemaining = Infinity;
    if (input.liningCredit) {
        top = 0;
        const elapsed = postRepairYearsBetween(input.liningDate, input.assessmentDate);
        coatingRemaining = Number(input.liningLife) - elapsed;
        if (!(elapsed >= 0) || !positive(input.liningLife) || !input.liningEvidence?.trim()) {
            pending.push('Provide lining installation date, expected life and supporting evidence.');
            coatingRemaining = 0;
        } else if (coatingRemaining < proposed) pending.push('Expected remaining lining life does not cover the proposed interval; use a supported top-side rate or shorten the interval.');
    } else if (!nonnegative(input.topRate) || !input.topBasis?.trim()) {
        errors.push('Enter a nonnegative top-side rate and its documented basis, including for a zero rate.');
    }
    if (!positive(input.rtbc) || !positive(input.rtip) || Number(input.rtbc) > Number(input.originalThickness) || Number(input.rtip) > Number(input.originalThickness)) errors.push('Retained RTbc and RTip must be greater than zero and no greater than original thickness.');
    let rateThickness = Number(input.rtbc);
    if (input.mflUsed) {
        if (!positive(input.mflThreshold) || Number(input.mflThreshold) > Number(input.originalThickness)) errors.push('Enter the MFL detection threshold as remaining steel thickness, within original thickness.');
        else rateThickness = Math.min(rateThickness, Number(input.mflThreshold));
    }
    const longRate = age > 0 ? Math.max(0, Number(input.originalThickness) - rateThickness) / age : NaN;
    let shortRate: number | null = null;
    if (input.useShort) {
        if (!input.comparable || !input.location?.trim()) errors.push('Short-term rate requires a location ID and confirmation of comparable measurements.');
        if (!(historyYears > 0) || postRepairYearsBetween(input.buildDate, input.previousDate) < 0) errors.push('Previous inspection must be on or after build date and before the assessment.');
        if (!positive(input.previousThickness) || !positive(input.currentHistoryThickness) || Number(input.previousThickness) > Number(input.originalThickness) || Number(input.currentHistoryThickness) > Number(input.originalThickness)) errors.push('Enter valid previous and current thicknesses for the matched history location.');
        if (Number(input.currentHistoryThickness) > Number(input.previousThickness)) errors.push('History thickness increased; establish a comparable repair-adjusted baseline before calculating a short-term rate.');
        shortRate = historyYears > 0 ? Math.max(0, Number(input.previousThickness) - Number(input.currentHistoryThickness)) / historyYears : NaN;
    }
    let retainedRate = Math.max(longRate, shortRate ?? 0);
    if (input.rateMode === 'manual') {
        if (!nonnegative(input.manualRate) || !input.rateReason?.trim()) errors.push('Manual underside rate requires a nonnegative value and an engineering justification.');
        retainedRate = Number(input.manualRate);
    }
    function addRow(name: string, thickness: number, rate: number) {
        const combined = rate + top;
        const life = thickness <= minimum ? 0 : combined > 0 ? (thickness - minimum) / combined : Infinity;
        rows.push({ name, thickness, undersideRate: rate, topRate: top, combinedRate: combined, life, projected: thickness - proposed * combined });
    }
    addRow('Retained bottom', Math.min(Number(input.rtbc), Number(input.rtip)), retainedRate);
    const patches = input.patches || [];
    for (let i = 0; i < patches.length; i++) {
        const p = patches[i]!, label = p.name?.trim() || `Patch area ${i + 1}`;
        if (!p.name?.trim() || !nonnegative(p.rtbc) || !nonnegative(p.rtip) || !positive(p.patchThickness) || !nonnegative(p.rate) || !p.basis?.trim()) errors.push(`${label}: enter location, underlying RTbc/RTip, patch thickness, underside rate and basis.`);
        if (Number(p.rtbc) > Number(input.originalThickness) || Number(p.rtip) > Number(input.originalThickness)) errors.push(`${label}: underlying thickness cannot exceed original thickness.`);
        if (p.causeRemoved && !p.removalEvidence?.trim()) errors.push(`${label}: document how removal of the corrosion cause supports the selected rate.`);
        if (!p.causeRemoved && Number(p.rate) === 0) pending.push(`${label}: zero underside rate requires evidence supporting cessation of corrosion.`);
        addRow(label, Math.min(Number(p.rtbc), Number(p.rtip)) + Number(p.patchThickness), Number(p.rate));
    }
    const valid = errors.length === 0;
    const thicknessInterval = valid ? Math.min(...rows.map(r => r.life)) : null;
    const governing = valid ? rows.find(r => r.life === thicknessInterval)?.name : null;
    const limit = positive(input.inspectionLimit) ? Number(input.inspectionLimit) : Infinity;
    const supportedInterval = thicknessInterval !== null && pending.length === 0 ? Math.max(0, Math.min(thicknessInterval, limit, coatingRemaining)) : null;
    return { valid, errors, pending, rows, age, historyYears, longRate, shortRate, thicknessInterval, governing, supportedInterval,
        proposedAdequate: supportedInterval !== null && proposed <= supportedInterval,
        basis: 'API 653:2025, 4.4.5.1, 4.4.5.4, 4.4.6 and 6.4.2. Date intervals use actual days / 365.25. General bottom projection only.' };
}

export type Api653PostRepairResult = ReturnType<typeof calculateApi653PostRepair>;
