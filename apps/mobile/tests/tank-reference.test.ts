import test from 'node:test';
import assert from 'node:assert/strict';
import {tankData} from '../src/reference/tank-data.ts';
test('tank reference covers every part with valid damage and source references',()=>{
 assert.equal(tankData.parts.length,76);
 assert.equal(new Set(tankData.parts.map(p=>p.id)).size,76);
 for(const p of tankData.parts){assert.ok(p.detail);for(const id of p.references)assert.ok(id in tankData.references);for(const id of p.mechanisms)assert.ok(tankData.mechanisms.some(m=>m.id===id));}
 for(const r of Object.values(tankData.references)){assert.ok(r.pdfPage>0&&r.pdfPage<=(r.code==='650'?542:192));assert.ok(r.clause&&r.printedPage&&r.repair&&r.consideration);}
 assert.match(tankData.references.chime.consideration,/2.5 mm/);assert.match(tankData.references.chime.consideration,/10 mm/);assert.match(tankData.references['650bottom'].consideration,/50 mm/);
});
import {existsSync} from 'node:fs';
import {considerationDetails, sourceImages, relatedStandards} from '../src/reference/reference-details.ts';
test('reference supplements resolve to real clauses and shipped source images',()=>{
 for(const key of Object.keys(considerationDetails)) assert.ok(key in tankData.references, key);
 for(const image of sourceImages){
  assert.ok(image.keys.every(key=>key in tankData.references));
  assert.ok(existsSync(new URL(`../public/reference/${image.file}`,import.meta.url)), image.file);
  assert.match(image.caption,/(Figure|Table)/);
 }
 assert.ok(relatedStandards.every(s=>s.edition&&s.source&&s.details.length&&new URL(s.url).protocol==='https:'));
});
