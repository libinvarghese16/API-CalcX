import test from "node:test";
import assert from "node:assert/strict";
import { calculateApi653PostRepair, postRepairYearsBetween } from "../src/api653/post-repair-bottom.ts";
import type { Api653PostRepairInput } from "../src/api653/post-repair-bottom.ts";
import { calculateApi653BottomPlate } from "../src/api653/bottom-plate.ts";
const close = (a: number | null, b: number, t=1e-10) => assert.ok(a !== null && Math.abs(a-b)<t, `${a} != ${b}`);
const base: Api653PostRepairInput={buildDate:'2014-10-01',assessmentDate:'2026-10-01',previousDate:'2024-02-01',originalThickness:6,rtbc:3.72,rtip:3.72,minimumThickness:2.54,proposedYears:6,rateMode:'manual',manualRate:.190,rateReason:'Verified retained-area basis',topRate:0,topBasis:'Supported coating basis',retainedVerified:true,thicknessEvidence:'UT map 01',repairsComplete:true,criticalReviewed:true,annularReviewed:true,reviewReference:'Review 01',inspectionLimit:10,inspectionBasis:'Controlled interval review',patches:[]};
test('actual dates account for leap day and reject invalid dates',()=>{close(postRepairYearsBetween('2024-02-28','2024-03-01'),2/365.25);assert.ok(Number.isNaN(postRepairYearsBetween('2025-02-29','2026-01-01')));});
test('report inputs reproduce 6.2105263158 years',()=>{const r=calculateApi653PostRepair(base);assert.equal(r.valid,true);assert.deepEqual(r.pending,[]);close(r.thicknessInterval,6.210526315789474);assert.equal(r.proposedAdequate,true);});
test('as-found 2.46 mm gives no positive life',()=>{const r=calculateApi653PostRepair({...base,rtbc:2.5,rtip:2.46,manualRate:.292,topRate:.295});close(r.thicknessInterval,0);assert.equal(r.proposedAdequate,false);});
test('validated short-term scenario gives 2.874909 years and 1.171119 mm at 6.21 years',()=>{const r=calculateApi653PostRepair({...base,manualRate:1.1/2.68,proposedYears:6.21});close(r.thicknessInterval,2.874909090909091);close(r.rows[0]!.projected,1.1711194029850747);assert.equal(r.proposedAdequate,false);});
test('auto selects the higher validated rate using exact dates',()=>{const r=calculateApi653PostRepair({...base,rateMode:'auto',useShort:true,comparable:true,location:'R7/P2',previousThickness:3.6,currentHistoryThickness:2.5});close(r.shortRate,1.1/postRepairYearsBetween(base.previousDate,base.assessmentDate));assert.notEqual(r.shortRate,null);close(r.rows[0]!.undersideRate,r.shortRate!);});
test('unmatched history blocks an interval',()=>{const r=calculateApi653PostRepair({...base,useShort:true,previousThickness:3.6,currentHistoryThickness:2.5});assert.equal(r.valid,false);assert.equal(r.supportedInterval,null);});
test('manual rate without reason is blocked',()=>{assert.equal(calculateApi653PostRepair({...base,rateReason:''}).valid,false);});
test('MFL rate uses the lesser remaining threshold and retained thickness',()=>{const r=calculateApi653PostRepair({...base,rateMode:'auto',mflUsed:true,mflThreshold:3});close(r.longRate,3/12);});
test('repair cutoff does not create thickness or a rate',()=>{const r=calculateApi653PostRepair({...base,rtbc:'',repairCutoff:38});assert.equal(r.valid,false);assert.equal(r.thicknessInterval,null);});
test('patch areas retain their entered corrosion rates and govern independently',()=>{const r=calculateApi653PostRepair({...base,patches:[{name:'P1',rtbc:2.5,rtip:2.46,patchThickness:3,rate:1,basis:'Area history'}]});close(r.rows[1]!.thickness,5.46);close(r.thicknessInterval,2.92);assert.equal(r.governing,'P1');});
test('cause-removal rate credit needs evidence',()=>{const r=calculateApi653PostRepair({...base,patches:[{name:'P1',rtbc:2.5,rtip:2.46,patchThickness:6,rate:0,basis:'CP',causeRemoved:true}]});assert.equal(r.valid,false);});
test('lining zero credit requires life covering proposed interval',()=>{const r=calculateApi653PostRepair({...base,liningCredit:true,liningDate:'2026-10-01',liningLife:3,liningEvidence:'Lining specification'});assert.equal(r.valid,true);assert.equal(r.supportedInterval,null);assert.ok(r.pending.some(x=>x.includes('lining life')));});
test('section interval cap controls supported limit independently',()=>{const r=calculateApi653PostRepair({...base,inspectionLimit:4});close(r.supportedInterval,4);assert.equal(r.proposedAdequate,false);});
test('incomplete evidence never becomes an approved interval',()=>{const r=calculateApi653PostRepair({...base,criticalReviewed:false});close(r.thicknessInterval,6.210526315789474);assert.equal(r.supportedInterval,null);});
test('zero corrosion and no margin are distinguished',()=>{assert.equal(calculateApi653PostRepair({...base,manualRate:0}).thicknessInterval,Infinity);assert.equal(calculateApi653PostRepair({...base,manualRate:0,rtbc:2.54}).thicknessInterval,0);});

test('post-repair retained area matches the existing bottom engine at identical controlled inputs', () => {
  for (const rate of [.19, .292, 1.1 / 2.68]) {
    const existing = calculateApi653BottomPlate({ originalThicknessMm: 6, previousThicknessMm: 0, bottomRemainingThicknessMm: 3.72, previousInternalPittingDepthMm: 0, currentInternalPittingDepthMm: 2.28, minimumThicknessBasis: "table-4.4-standard", reducedMinimumCriteriaConfirmed: false, manualMinimumThicknessMm: 0, projectionYears: 6, undersideCorrosionRateMode: "manual", manualUndersideCorrosionRateMmPerYear: rate, topSideCorrosionRateMode: "manual", manualTopSideCorrosionRateMmPerYear: 0, lowerShellMinimumThicknessMm: 0, criticalZoneActualThicknessMm: 0, yearsInService: 12, yearsSincePreviousInspection: 0 });
    const added = calculateApi653PostRepair({ ...base, manualRate: rate });
    close(added.thicknessInterval, existing.remainingLifeYears);
    close(added.rows[0]!.projected, existing.projectedMinimumRemainingThicknessMm);
  }
});
