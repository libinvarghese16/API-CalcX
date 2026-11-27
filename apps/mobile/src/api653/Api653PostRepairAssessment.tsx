import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { calculateApi653PostRepair } from "@api-calc-pro/calc-engine";
import type { Api653PostRepairInput, Api653PostRepairPatch, Api653PostRepairResult } from "@api-calc-pro/calc-engine";

export function createPostRepairInput(): Api653PostRepairInput {
  const now = new Date();
  return { assessmentDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`, minimumThickness: "2.54", rateMode: "auto", patches: [] };
}

const display = (value: number | null | undefined) => value === Infinity ? "No finite corrosion limit" : value == null || !Number.isFinite(value) ? "—" : value.toFixed(4);

function Results({ result, expanded = false }: { result: Api653PostRepairResult; expanded?: boolean }) {
  const retained = result.rows[0];
  return <div className="post-repair-results" aria-live="polite">
    <section className="result-card">
      <div className="result-card-top">After-repair calculation</div>
      <p>Remaining life from thickness</p>
      <div className="result-value"><strong>{display(result.thicknessInterval)}</strong>{Number.isFinite(result.thicknessInterval) && <span>years</span>}</div>
      <div className="result-comparison">
        <span>Area with shortest life<strong>{result.governing || "Complete the inputs"}</strong></span>
        <span>Total retained-plate corrosion rate<strong>{display(retained?.combinedRate)} mm/year</strong></span>
      </div>
      <div className="result-status"><div><strong>{result.supportedInterval === null ? "Review checks still needed" : result.proposedAdequate ? "Proposed interval meets the entered checks" : "Proposed interval exceeds the supported limit"}</strong><span>{result.supportedInterval === null ? "The thickness result alone does not set the next inspection date." : `Supported limit from entered evidence: ${display(result.supportedInterval)} years`}</span></div></div>
    </section>
    <section className="trace-card post-repair-explanation">
      <h3>How the calculation works</h3>
      <p><strong>Remaining life = (remaining steel − minimum required steel) ÷ total corrosion rate.</strong></p>
      <p>Use the lower remaining thickness from the soil side and product side. Add both corrosion rates. Calculate each patch area separately; the shortest life controls.</p>
      <p><strong>Example:</strong> (3.72 − 2.54) ÷ (0.190 + 0) = <strong>6.21 years</strong>. If the underside rate is 0.41045 mm/year, the same plate has about <strong>2.87 years</strong>.</p>
      <p>Future thickness = remaining steel − (planned years × total corrosion rate). The supported interval may be shorter because of inspection or lining-life limits.</p>
      <details open={expanded || undefined}><summary>View calculation details</summary>
        <p>Long-term underside rate: {display(result.longRate)} mm/year. Short-term underside rate: {display(result.shortRate)} mm/year.</p>
        <p>Service age: {display(result.age)} years. Time between inspections: {display(result.historyYears)} years.</p>
        {result.rows.map((row, index) => <div className="post-repair-area-result" key={index}>
          <h4>{row.name}</h4>
          <p>Steel used: {display(row.thickness)} mm · Soil-side rate: {display(row.undersideRate)} mm/year · Product-side rate: {display(row.topRate)} mm/year</p>
          <p>Thickness after planned interval: {result.valid ? display(row.projected) : "—"} mm · Remaining life: {result.valid ? display(row.life) : "—"} years</p>
        </div>)}
        <p>{result.basis}</p>
      </details>
    </section>
    {(result.errors.length > 0 || result.pending.length > 0) && <section className="trace-card post-repair-explanation">
      {result.errors.length > 0 && <><h3>Complete or correct these inputs</h3><ul>{result.errors.map(message => <li key={message}>{message}</li>)}</ul></>}
      {result.pending.length > 0 && <details open={expanded || undefined}><summary>Checks before using this interval ({result.pending.length})</summary><ul>{result.pending.map(message => <li key={message}>{message}</li>)}</ul></details>}
    </section>}
  </div>;
}
function DownloadReport({ input, result }: { input: Api653PostRepairInput; result: Api653PostRepairResult }) {
  const download = () => {
    const markup = renderToStaticMarkup(<html><head><meta charSet="utf-8" /><title>API 653 post-repair bottom assessment</title><style>{"body{font:14px Arial;margin:32px;line-height:1.5}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}"}</style></head><body><h1>Post-Repair Bottom Assessment</h1><Results result={result} expanded /><h2>Recorded inputs and supporting evidence</h2><table><tbody>{Object.entries(input).filter(([key]) => key !== "patches").map(([key, value]) => <tr key={key}><th>{key}</th><td>{String(value)}</td></tr>)}</tbody></table><h2>Patch records</h2><pre>{JSON.stringify(input.patches ?? [], null, 2)}</pre></body></html>);
    const url = URL.createObjectURL(new Blob(["<!doctype html>" + markup], { type: "text/html" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "API653-post-repair-bottom-assessment.html"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <button type="button" className="secondary-button" onClick={download}>Download post-repair report</button>;
}

function Step({ number, title, help, children }: { number: string; title: string; help: string; children: ReactNode }) {
  return <section className="form-card"><div className="form-card-heading"><div><span>{number}</span><div><h2>{title}</h2><p>{help}</p></div></div></div>{children}</section>;
}

export function Api653PostRepairAssessment({ value, onChange }: { value: Api653PostRepairInput; onChange: (value: Api653PostRepairInput) => void }) {
  const [historyOpen, setHistoryOpen] = useState(Boolean(value.useShort || value.mflUsed));
  const result = useMemo(() => calculateApi653PostRepair(value), [value]);
  const change = (key: keyof Api653PostRepairInput, next: string | boolean) => onChange({ ...value, [key]: next });
  const field = (key: keyof Api653PostRepairInput, label: string, type = "number", help?: string) => <label className="field" key={key}><span>{label}</span><div className="number-control"><input aria-label={label} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={String(value[key] ?? "")} onChange={event => change(key, event.target.value)} /></div>{help && <small>{help}</small>}</label>;
  const check = (key: keyof Api653PostRepairInput, label: string) => <label className="post-repair-check" key={key}><input type="checkbox" checked={Boolean(value[key])} onChange={event => change(key, event.target.checked)} />{label}</label>;
  const patchFields: Array<[keyof Api653PostRepairPatch, string, string]> = [["name", "Patch / area IDs", "text"], ["rtbc", "Steel below patch: soil-side minimum (mm)", "number"], ["rtip", "Steel below patch: product-side minimum (mm)", "number"], ["patchThickness", "Patch thickness (mm)", "number"], ["rate", "Soil-side corrosion rate (mm/year)", "number"], ["basis", "Rate / repair basis", "text"]];
  return <details className="post-repair-assessment">
    <summary>Post-Repair Bottom Assessment<span>Remaining life of the tank floor after repairs</span></summary>
    <div className="calculator-workspace">
      <div className="input-column">
        <section className="reference-card post-repair-explanation">
          <h2>What is this assessment?</h2>
          <p>Use this section after bottom repairs to estimate how long the remaining steel can last. Check the original floor left in place and any welded patches. The area with the shortest remaining life controls.</p>
          <p><strong>Start here:</strong> enter measured thicknesses, choose the corrosion rate, add any patch areas, then complete the review checks. Results update as you type.</p>
          <p>All values here are in <strong>mm and mm/year</strong>. This section is saved with the bottom calculation using Save above. Its report is downloaded separately below.</p>
        </section>
        <Step number="01" title="Remaining floor thickness" help="Use inspection readings after repairs for the original plate left in place.">
          <div className="form-grid">
            {field("buildDate", "Build / in-service date", "date")}
            {field("assessmentDate", "Current assessment date", "date")}
            {field("originalThickness", "Original steel thickness (mm)", "number", "Plate thickness before corrosion.")}
            {field("rtbc", "Soil-side remaining thickness (mm)", "number", "RTbc: lowest measured remaining steel in the original floor left in place.")}
            {field("rtip", "Product-side remaining thickness (mm)", "number", "RTip: lowest remaining steel at internal pits. Enter remaining thickness, not pit depth.")}
            {field("minimumThickness", "Minimum required thickness (mm)", "number", "Default 2.54 mm. Confirm the minimum applicable to this tank.")}
            {field("minimumBasis", "Minimum thickness reference", "text", "Required if you use a value other than 2.54 mm.")}
            {field("proposedYears", "Years until next planned inspection", "number", "The operating period you want to check; this is not the calculated remaining life.")}
          </div>
        </Step>
        <Step number="02" title="Corrosion rate" help="How much steel is lost each year on the soil side and product side.">
          <div className="form-grid">
            <label className="field"><span>Soil-side rate method</span><select className="select-control native-select" aria-label="Post-repair rate selection" value={value.rateMode} onChange={event => change("rateMode", event.target.value)}><option value="auto">Calculate from inspection history</option><option value="manual">Enter an assessed rate</option></select><small>Automatic uses the higher available long-term or short-term rate. An entered rate needs an engineering reason.</small></label>
            {value.rateMode === "manual" && <>{field("manualRate", "Manual underside rate (mm/year)")}{field("rateReason", "Manual rate engineering justification", "text")}</>}
          </div>
          <details className="post-repair-option" open={historyOpen} onToggle={event => setHistoryOpen(event.currentTarget.open)}><summary>Inspection history and MFL options</summary>
            <p>Long-term rate = (original thickness − soil-side remaining thickness) ÷ service age. Full dates use actual days ÷ 365.25.</p>
            {check("useShort", "Include short-term history in the retained-area rate assessment.")}
            {value.useShort && <><div className="form-grid">
              {field("previousDate", "Previous inspection date", "date")}
              {field("location", "Matched history location ID", "text", "Identify the same measurement point at both inspections.")}
              {field("previousThickness", "Previous thickness at history location (mm)")}
              {field("currentHistoryThickness", "Current thickness at same location (mm)")}
            </div><p>Short-term rate = (previous reading − current reading) ÷ years between inspections.</p>
            {check("comparable", "Measurements are comparable at the same location, with repair history accounted for, and applicable to this area.")}</>}
            {check("mflUsed", "MFL was used: include the detection threshold when deriving the underside rate.")}
            {value.mflUsed && <div className="form-grid">{field("mflThreshold", "MFL detection threshold (remaining mm)", "number", "Remaining steel corresponding to the inspection detection limit, not the repair cutoff.")}</div>}
            <div className="form-grid">{field("repairCutoff", "Repair cutoff (% loss; record only)", "number", "Optional record. A cutoff such as 38% loss does not prove the thickness left after repairs.")}</div>
          </details>
          <div className="post-repair-option">
            {check("liningCredit", "Use zero product-side corrosion rate based on verified lining life.")}
            <div className="form-grid">{value.liningCredit ? <>
              {field("liningDate", "Lining installation date", "date")}
              {field("liningLife", "Expected lining service life (years)")}
              {field("liningEvidence", "Lining specification / life evidence", "text")}
            </> : <>{field("topRate", "Product-side corrosion rate (mm/year)", "number", "StPr: rate on the inside face. A zero rate also needs a documented basis.")}{field("topBasis", "Top-side rate basis", "text")}</>}</div>
            {value.liningCredit && <p>Lining life must cover the planned interval. Lining is not added to steel thickness.</p>}
          </div>
        </Step>
        <Step number="03" title="Welded patch areas" help="Add each patch, or a group of patches with the same assessment basis.">
          <p className="post-repair-help">For each area, the calculation uses the lower underlying steel thickness plus the patch thickness. Keep its supported soil-side corrosion rate; installing a patch does not automatically stop corrosion.</p>
          {(value.patches ?? []).length === 0 && <p className="post-repair-help">No patch areas entered. If patches were installed, add them before completing the review.</p>}
          <div className="post-repair-patches">{(value.patches ?? []).map((patch, index) => {
            const update = (key: keyof Api653PostRepairPatch, next: string | boolean) => onChange({ ...value, patches: (value.patches ?? []).map((p, i) => i === index ? { ...p, [key]: next } : p) });
            return <section className="post-repair-patch" key={index}><div className="post-repair-patch-heading"><h3>Patch area {index + 1}</h3><button type="button" className="secondary-button" onClick={() => onChange({ ...value, patches: value.patches?.filter((_, i) => i !== index) })}>Delete</button></div>
              <div className="form-grid">{patchFields.map(([key, label, type]) => <label className="field" key={key}><span>{label}</span><div className="number-control"><input aria-label={`Patch ${index + 1} ${label}`} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={String(patch[key] ?? "")} onChange={event => update(key, event.target.value)} /></div></label>)}</div>
              <label className="post-repair-check"><input type="checkbox" checked={Boolean(patch.causeRemoved)} onChange={event => update("causeRemoved", event.target.checked)} />The cause of corrosion has been removed and documented.</label>
              {patch.causeRemoved && <label className="field"><span>Evidence that the cause was removed</span><div className="number-control"><input aria-label={`Patch ${index + 1} Removal evidence`} value={patch.removalEvidence ?? ""} onChange={event => update("removalEvidence", event.target.value)} /></div></label>}
            </section>;
          })}</div>
          <button type="button" className="secondary-button" onClick={() => onChange({ ...value, patches: [...(value.patches ?? []), {}] })}>Add patch area</button>
        </Step>
        <Step number="04" title="Checks before using the result" help="These checks establish whether the planned interval is supported.">
          <div className="form-grid">
            {field("thicknessEvidence", "Thickness / inspection record reference", "text")}
            {field("inspectionLimit", "Section 6.4.2 interval limit (years)", "number", "Enter the independently established maximum inspection interval. This is separate from thickness life.")}
            {field("inspectionBasis", "Inspection-limit basis / review reference", "text")}
            {field("reviewReference", "Critical-zone / annular review reference", "text")}
          </div>
          {check("retainedVerified", "Retained thicknesses and coverage are verified; values are not inferred solely from a repair cutoff.")}
          {check("repairsComplete", "Every repaired area is represented and repair inspection/testing is complete, or no patches were needed.")}
          {check("criticalReviewed", "Separate critical-zone assessment supports the proposed interval.")}
          {check("annularReviewed", "Separate annular assessment supports the proposed interval, or is documented as not applicable.")}
        </Step>
      </div>
      <aside className="result-column">
        <Results result={result} />
        <div className="post-repair-actions"><DownloadReport input={value} result={result} /><button type="button" className="secondary-button" onClick={() => onChange(createPostRepairInput())}>Reset post-repair assessment</button></div>
      </aside>
    </div>
  </details>;
}
