import { useMemo, useState } from 'react';
import { api653Library, findTopics, sourceCaption, sourceIdsFor } from './api653-library.ts';
import { api653Guidance } from './api653-guidance.ts';

export default function Api653Library() {
 const [group, setGroup] = useState('');
 const [query, setQuery] = useState('');
 const [topicId, setTopicId] = useState('6.3');
 const [item, setItem] = useState('');
 const [position, setPosition] = useState(0);
 const [failedImage, setFailedImage] = useState('');
 const topics = useMemo(() => findTopics(query, group), [query, group]);
 const topic = topics.find(t => t.id === topicId) || topics[0];
 const sourceIds = topic ? sourceIdsFor(topic, item) : [];
 const index = Math.min(position, Math.max(0, sourceIds.length - 1));
 const sourceId = sourceIds[index];
 const source = sourceId ? api653Library.sources[sourceId] : undefined;
 const resetSource = () => { setItem(''); setPosition(0); setFailedImage(''); };
 const sourceUrl = source ? `/reference/api653/${source.file}` : '';
 const caption = source && topic ? sourceCaption(source, topic) : '';
 const groups = [...new Set(api653Library.topics.map(t => t.group))];
 const artworkCount = new Set(api653Library.topics.filter(t => t.id.startsWith('9.')).flatMap(t => t.artwork)).size;
 return <div className="reference-code-library">
  <section className="reference-card">
   <h2>API 653 clauses, tables and annexes</h2>
   <p>{api653Library.edition}. Browse the inspection requirements, repair routes and annexes independently of tank-part selection.</p>
   <p className="reference-citation">Coverage: Section 6 (6.1–6.10), Section 9 (9.1–9.15; {artworkCount} figures/tables), Table 4.1a with continuation and notes, and all 15 annex entries in this compilation.</p>
   <p>The considerations are a reading guide. The complete source extracts preserve the lettered conditions, equations, figures, tables and notes. Read all continuations for the selected topic. Annexes E and G are intentionally blank; older G-table listings in the contents are not requirements present in this compilation.</p>
  </section>
  <div className="reference-layout">
   <section className="reference-card reference-controls">
    <label>Search clauses and content<input aria-label="Search API 653 reference" type="search" placeholder="6.4.3, Table 6.1, hot taps, settlement…" value={query} onChange={e => {setQuery(e.target.value); resetSource();}}/></label>
    <label>Reference group<select aria-label="Reference group" value={group} onChange={e => {setGroup(e.target.value); resetSource();}}><option value="">All reference groups</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label>
    <label>Clause or annex<select aria-label="Clause or annex" value={topic?.id || ''} onChange={e => {setTopicId(e.target.value); resetSource();}}>{!topics.length && <option value="">No matching topics</option>}{topics.map(t => <option key={t.id} value={t.id}>{t.id === '4.1a' ? t.title : `${t.group === 'Annexes' ? 'Annex ' : ''}${t.id} — ${t.title}`}</option>)}</select></label>
    <p role="status">{topics.length} of {api653Library.topics.length} topics</p>
    <button type="button" onClick={() => {setQuery(''); setGroup(''); resetSource();}}>Clear reference filters</button>
    {topic && <label className="reference-subclause">Subclause, figure or table<select aria-label="Subclause, figure or table" value={item} onChange={e => {setItem(e.target.value); setPosition(0); setFailedImage('');}}><option value="">Complete topic, including continuations</option><optgroup label="Clauses and subclauses">{topic.clauses.map(c => <option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="Figures and tables">{topic.artwork.map(a => <option key={a} value={a}>{a}</option>)}</optgroup></select></label>}
   </section>
   <div className="reference-results">
    {!topic ? <section className="reference-card"><p>No matching reference topic. Clear the filters or try a clause number or another term.</p></section> : <>
     <section className="reference-card">
      <p className="eyebrow">{topic.status}</p>
      <h2>{topic.group === 'Annexes' ? 'Annex ' : topic.id === '4.1a' ? '' : 'Clause '}{topic.id === '4.1a' ? topic.title : `${topic.id} — ${topic.title}`}</h2>
      <h3>Considerations</h3>
      <ul className="reference-checklist">{(api653Guidance[topic.id] || []).map(g => <li key={g.clause}><strong>API 653 {g.clause}</strong><p>{g.text}</p></li>)}</ul>
      {topic.artwork.length > 0 && <div><h3>Figure and table index</h3><div className="reference-categories">{topic.artwork.map(a => <button type="button" key={a} aria-pressed={item === a} onClick={() => {setItem(a); setPosition(0); setFailedImage('');}}>{a}</button>)}</div></div>}
     </section>
     <section className="reference-card" aria-label="Complete source requirements">
      <h2>Source requirements and illustrations</h2>
      <p>{item ? `Showing ${item} with source context and available continuations.` : 'Complete source sequence for this topic, including shared context from adjoining clauses.'}</p>
      {item && <button type="button" onClick={resetSource}>Show complete topic</button>}
      {source && <>
       <div className="reference-source-navigation"><button type="button" disabled={index === 0} onClick={() => setPosition(index - 1)}>Previous extract</button><span role="status">Extract {index + 1} of {sourceIds.length}</span><button type="button" disabled={index === sourceIds.length - 1} onClick={() => setPosition(index + 1)}>Next extract</button></div>
       <label className="reference-source-select">Source extract<select aria-label="Source extract" value={index} onChange={e => setPosition(Number(e.target.value))}>{sourceIds.map((id, i) => {const s = api653Library.sources[id]; return <option key={id} value={i}>{i + 1}. {s ? sourceCaption(s, topic) : ''}</option>;})}</select></label>
       <figure className="reference-source-image">
        <figcaption>API 653 · {caption}</figcaption>
        <a href={sourceUrl} target="_blank" rel="noreferrer">Open full-size source image</a>
        {failedImage === sourceUrl ? <div role="alert"><p>The source image could not load. Use the full-size link or reconnect and retry.</p><button type="button" onClick={() => setFailedImage('')}>Retry source image</button></div> : <img key={sourceUrl} src={sourceUrl} alt={`API 653 source: ${caption}`} width={source.width} height={source.height} onError={() => setFailedImage(sourceUrl)}/>}
       </figure>
       <div className="reference-source-navigation"><button type="button" disabled={index === 0} onClick={() => setPosition(index - 1)}>Previous extract</button><span>Extract {index + 1} of {sourceIds.length}</span><button type="button" disabled={index === sourceIds.length - 1} onClick={() => setPosition(index + 1)}>Next extract</button></div>
       <p className="reference-citation">Source: American Petroleum Institute, supplied API 653 compilation. Source wording and drawings are preserved; the numbered citations above use clauses and subclauses.</p>
      </>}
     </section>
    </>}
   </div>
  </div>
 </div>;
}
