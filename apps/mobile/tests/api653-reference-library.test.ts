import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { api653Library, findTopics, sourceIdsFor } from '../src/reference/api653-library.ts';
import { api653Guidance } from '../src/reference/api653-guidance.ts';

const topic = (id: string) => {
 const result = api653Library.topics.find(t => t.id === id);
 assert.ok(result, `Missing topic ${id}`);
 return result;
};
test('all requested inspection, repair and supplied annex entries are present', () => {
 for (let n=1;n<=10;n++) topic(`6.${n}`);
 for (let n=1;n<=15;n++) topic(`9.${n}`);
 const annexes = api653Library.topics.filter(t=>t.group==='Annexes').map(t=>t.id);
 assert.deepEqual(annexes, ['A','B','C','D','E','F','G','H','I','J','R','S','SC','X','Y']);
 assert.equal(new Set(api653Library.topics.map(t=>t.id)).size,41);
 for (const t of api653Library.topics) {
  assert.ok(api653Guidance[t.id]?.length, `Missing considerations ${t.id}`);
  assert.ok(t.sources.length);
  for (const id of t.sources) assert.ok(api653Library.sources[id], `Missing source ${id}`);
  for (const c of t.clauses) assert.ok(sourceIdsFor(t,c).length, `Unresolved subclause ${c}`);
 }
});
test('all Section 9 figures and both hot-tap tables are indexed as actual artwork', () => {
 const actual = new Set(api653Library.topics.filter(t=>t.id.startsWith('9.')).flatMap(t=>t.artwork));
 const expected = [...Array.from({length:12},(_,i)=>`Figure 9.${i+1}`),'Figure 9.13a','Figure 9.13b','Figure 9.14','Table 9.1a','Table 9.1b'];
 assert.deepEqual([...actual].sort(), expected.sort());
 assert.ok(!actual.has('Figure 5.6'), 'Cross-references must not be misrepresented as included artwork');
});
test('coverage includes all source continuations and no missing shipped images', () => {
 const all = new Set(api653Library.topics.flatMap(t=>t.sources));
 for(let n=48;n<=57;n++) assert.ok(all.has(String(n)), `Section 6 source gap ${n}`);
 for(let n=62;n<=87;n++) assert.ok(all.has(String(n)), `Section 9 source gap ${n}`);
 assert.deepEqual(sourceIdsFor(topic('4.1a'),'Table 4.1a'), ['28','29']);
 assert.deepEqual(sourceIdsFor(topic('6.4'),'Table 6.1'), ['51']);
 assert.deepEqual(sourceIdsFor(topic('C'),'Table C.1'), ['133','134','135','136','137','138']);
 assert.deepEqual(sourceIdsFor(topic('C'),'Table C.2'), ['139','140','141','142','143','144','145','146','147','148']);
 assert.deepEqual(sourceIdsFor(topic('F'),'Table F.1'), ['154','155','156'], 'NDE acceptance / qualifications continuation');
 assert.ok(topic('H').sources.includes('173'), 'Similar-service datasheet conclusion');
 assert.deepEqual(sourceIdsFor(topic('J'),'Table J.1'), ['179','180']);
 for(const s of Object.values(api653Library.sources)) {
  assert.ok(existsSync(new URL(`../public/reference/api653/${s.file}`,import.meta.url)),s.file);
  assert.ok(s.width>=1100 && s.height>=1100, s.file);
 }
});
test('clause filtering keeps cross-extract conditions and deep subclauses', () => {
 assert.deepEqual(sourceIdsFor(topic('6.3'),'6.3.1.1'), ['48','49']);
 assert.deepEqual(sourceIdsFor(topic('6.4'),'6.4.2.2.2.1'), ['52','53']);
 assert.deepEqual(sourceIdsFor(topic('9.15'),'9.15.5.3'), ['85','86','87']);
 assert.ok(topic('9.11').clauses.includes('9.11.2.1.5'));
 assert.ok(topic('I').clauses.includes('I.8.5'));
 assert.ok(topic('X').clauses.includes('X.4.3.2'));
});
test('blank annexes and normative status follow the body of the supplied edition', () => {
 for(const id of ['E','G']) {assert.equal(topic(id).status,'Intentionally blank');assert.deepEqual(topic(id).artwork,[]);}
 assert.equal(topic('J').status,'Normative if specified by the purchaser');
 assert.equal(topic('C').status,'Informative');
 assert.equal(topic('B').status,'Normative');
});
test('global content search, group filters and empty results work', () => {
 assert.ok(findTopics('6.4.3.1','').some(t=>t.id==='6.4'));
 assert.ok(findTopics('Table 4.1a','').some(t=>t.id==='4.1a'));
 assert.ok(findTopics('Figure 9.13b','').some(t=>t.id==='9.11'));
 assert.ok(findTopics('similar service','Annexes').some(t=>t.id==='H'));
 assert.deepEqual(findTopics('nonexistent-reference-xyz',''),[]);
 assert.equal(findTopics('','Annexes').length,15);
});
