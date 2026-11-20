import { useMemo, useState } from "react";
import { tankData } from "./tank-data.ts";
import "./reference.css";
type Ref = {code:string;clause:string;pdfPage:number;printedPage:string;title:string;consideration:string;repair:string};
const references: Record<string,Ref> = tankData.references;
export function TankReferencePage() {
 const [category,setCategory]=useState('Tank');
 const [search,setSearch]=useState(''); const [group,setGroup]=useState('');
 const [partId,setPartId]=useState('chime'); const [selected,setSelected]=useState<string[]>([]);
 const parts=useMemo(()=>tankData.parts.filter(p=>(!group||p.group===group)&&`${p.name} ${p.group} ${p.detail}`.toLowerCase().includes(search.toLowerCase())),[search,group]);
 const part=parts.find(p=>p.id===partId)||parts[0];
 const candidates=tankData.mechanisms.filter(m=>part?.mechanisms.includes(m.id));
 const chosen=candidates.filter(m=>selected.includes(m.id));
 const cards=[...new Set([...(part?.references||[]),...(chosen.some(m=>m.id==='settlement')?['settlement']:[]),...(chosen.some(m=>m.id==='cracks')?['weldRepair']:[]),'approval','hydro'])];
 return <div className="page-wrap tank-reference"><section className="page-heading"><div><p className="eyebrow">Equipment integrity</p><h1>Reference</h1><p>Tank parts, damage mechanisms and repair considerations.</p></div></section>
 <div className="reference-categories" aria-label="Reference category">{['Tank','Piping','Pressure Vessels'].map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
 {category!=='Tank'?<section className="reference-card"><h2>{category}</h2><p>Reference content will be added when the applicable standards are supplied.</p></section>:<>
 <details className="reference-card"><summary>Source editions and how to use this reference</summary><p>{tankData.sources['650'].title} (542 PDF pages).</p><p>{tankData.sources['653'].title} (192 PDF pages).</p><p>Original summaries of the supplied editions. Printed and PDF page numbers differ; ranges identify the starting PDF page. Consult the complete clauses, figures, notes and exceptions in your licensed standards before applying a repair. API 571 identifiers are screening cross-references, not independently verified against a supplied API 571 edition. Multiple selections do not diagnose multiple mechanisms.</p></details>
 <div className="reference-layout"><section className="reference-card reference-controls">
 <label>Search tank parts<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setSelected([]);}} placeholder="Chime, column, sump, weld…"/></label>
 <label>Part group<select aria-label="Part group" value={group} onChange={e=>{setGroup(e.target.value);setSelected([]);}}><option value="">All parts</option>{[...new Set(tankData.parts.map(p=>p.group))].map(g=><option key={g}>{g}</option>)}</select></label>
 <label>Tank part<select aria-label="Tank part" value={part?.id||''} onChange={e=>{setPartId(e.target.value);setSelected([]);}}>{!parts.length&&<option value="">No matching parts</option>}{parts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><p role="status">{parts.length} of {tankData.parts.length} parts</p>
 <fieldset><legend>Damage / condition — select multiple</legend><div className="reference-categories"><button type="button" onClick={()=>setSelected(candidates.map(m=>m.id))}>Select all</button><button type="button" onClick={()=>setSelected([])}>Clear</button></div>{candidates.map(m=><label className="reference-checkbox" key={m.id}><input type="checkbox" checked={selected.includes(m.id)} onChange={e=>setSelected(e.target.checked?[...selected,m.id]:selected.filter(id=>id!==m.id))}/><span>{m.name}{m.api571&&<small>API 571 {m.api571} · conditional candidate</small>}</span></label>)}</fieldset></section>
 <div className="reference-results">{!part?<section className="reference-card">No matching part. Clear the search or change the group.</section>:<><section className="reference-card"><p className="eyebrow">{part.group}</p><h2>{part.name}</h2><p>{part.detail}</p><p role="status">{chosen.length} damage selections · {cards.length} guidance cards</p></section>
 {chosen.length>0&&<section className="reference-card"><h2>Damage considerations</h2>{chosen.map(m=><div key={m.id}><h3>{m.name}</h3><p>{m.screening}</p></div>)}<p>Confirm material and service applicability. Component repair requirements remain relevant; a mechanism name alone does not determine a repair.</p></section>}
 {cards.map(id=>{const r=references[id];if(!r)return null;return <article className="reference-card" key={id}><p className="eyebrow">{r.code==='653'?'In-service assessment / repair':'Construction / replacement design'}</p><h2>{r.title}</h2><p className="reference-citation">API {r.code} §{r.clause} · printed p. {r.printedPage} · PDF p. {r.pdfPage} (start)</p><h3>Considerations</h3><p>{r.consideration}</p><h3>Repair / action options</h3><p>{r.repair}</p></article>})}</>}</div></div></>}
 </div>;
}


