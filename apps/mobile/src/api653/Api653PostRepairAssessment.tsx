import { useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { calculateApi653PostRepair } from "@api-calc-pro/calc-engine";
import type { Api653PostRepairInput, Api653PostRepairPatch, Api653PostRepairResult } from "@api-calc-pro/calc-engine";

export function createPostRepairInput(): Api653PostRepairInput {
  const now = new Date();
  return { assessmentDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`, minimumThickness: "2.54", rateMode: "auto", patches: [] };
}

const display = (value: number | null | undefined) => value === Infinity ? "No finite corrosion limit" : value == null || !Number.isFinite(value) ? "—" : value.toFixed(4);

function Results({ result }: { result: Api653PostRepairResult }) {
  return <section className="post-repair-results" aria-live="polite">
    <h3>Thickness-based interval: {display(result.thicknessInterval)} {Number.isFinite(result.thicknessInterval) ? "years" : ""}</h3>
    {result.governing && <p>Governing area: {result.governing}</p>}
    <p>Long-term UPr: {display(result.longRate)} mm/year · Short-term UPr: {display(result.shortRate)} mm/year</p>
    <p>Service age: {display(result.age)} years · Inspection history: {display(result.historyYears)} years</p>
    <div className="post-repair-table-wrap"><table><thead><tr><th>Area</th><th>Effective steel (mm)</th><th>UPr + StPr (mm/year)</th><th>Projected MRT (mm)</th><th>Thickness life (years)</th></tr></thead><tbody>{result.rows.map((row, index) => <tr key={index}><td>{row.name}</td><td>{display(row.thickness)}</td><td>{display(row.undersideRate)} + {display(row.topRate)}</td><td>{result.valid ? display(row.projected) : "—"}</td><td>{result.valid ? display(row.life) : "—"}</td></tr>)}</tbody></table></div>
    <p><strong>{result.supportedInterval === null ? "Interval review incomplete" : result.proposedAdequate ? "Proposed interval meets the entered checks" : "Proposed interval exceeds the supported limit"}</strong>{result.supportedInterval !== null && ` · Supported limit from entered evidence: ${display(result.supportedInterval)} years`}</p>
    {result.errors.length > 0 && <><h4>Correct these inputs</h4><ul>{result.errors.map(message => <li key={message}>{message}</li>)}</ul></>}
    {result.pending.length > 0 && <><h4>Required review evidence</h4><ul>{result.pending.map(message => <li key={message}>{message}</li>)}</ul></>}
    <p>{result.basis} Separate repair, critical-zone and annular reviews remain required.</p>
  </section>;
}

function DownloadReport({ input, result }: { input: Api653PostRepairInput; result: Api653PostRepairResult }) {
  const download = () => {
    const markup = renderToStaticMarkup(<html><head><meta charSet="utf-8" /><title>API 653 post-repair bottom assessment</title><style>{"body{font:14px Arial;margin:32px;line-height:1.5}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}"}</style></head><body><h1>Post-Repair Bottom Assessment</h1><Results result={result} /><h2>Recorded inputs and supporting evidence</h2><table><tbody>{Object.entries(input).filter(([key]) => key !== "patches").map(([key, value]) => <tr key={key}><th>{key}</th><td>{String(value)}</td></tr>)}</tbody></table><h2>Patch records</h2><pre>{JSON.stringify(input.patches ?? [], null, 2)}</pre></body></html>);
    const url = URL.createObjectURL(new Blob(["<!doctype html>" + markup], { type: "text/html" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "API653-post-repair-bottom-assessment.html"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <button type="button" className="secondary-button" onClick={download}>Download post-repair report</button>;
}

export function Api653PostRepairAssessment({ value, onChange }: { value: Api653PostRepairInput; onChange: (value: Api653PostRepairInput) => void }) {
  const result = useMemo(() => calculateApi653PostRepair(value), [value]);
  const change = (key: keyof Api653PostRepairInput, next: string | boolean) => onChange({ ...value, [key]: next });
  const field = (key: keyof Api653PostRepairInput, label: string, type = "number") => <label className="field" key={key}><span>{label}</span><div className="number-control"><input aria-label={label} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={String(value[key] ?? "")} onChange={event => change(key, event.target.value)} /></div></label>;
  const check = (key: keyof Api653PostRepairInput, label: string) => <label className="post-repair-check" key={key}><input type="checkbox" checked={Boolean(value[key])} onChange={event => change(key, event.target.checked)} />{label}</label>;
  const patchFields: Array<[keyof Api653PostRepairPatch, string, string]> = [["name", "Patch / area IDs", "text"], ["rtbc", "Underlying RTbc (mm)", "number"], ["rtip", "Underlying RTip (mm)", "number"], ["patchThickness", "Patch thickness (mm)", "number"], ["rate", "UPr (mm/year)", "number"], ["basis", "Rate / repair basis", "text"], ["causeRemoved", "Cause removed", "checkbox"], ["removalEvidence", "Removal evidence", "text"]];
  return <details className="form-card post-repair-assessment"><summary>Post-Repair Bottom Assessment</summary>
    <p>Separate assessment of retained plate and welded patch areas. Inputs are in mm and mm/year. Full dates use actual days ÷ 365.25. Save with the existing calculation’s Save action; export the separate report below.</p>
    <h3>Inspection and retained bottom</h3><div className="form-grid">
      {field("buildDate", "Build / in-service date", "date")}{field("previousDate", "Previous inspection date", "date")}{field("assessmentDate", "Current assessment date", "date")}
      {field("originalThickness", "Original steel thickness (mm)")}{field("rtbc", "Retained RTbc after repairs (mm)")}{field("rtip", "Retained RTip after repairs (mm)")}
      {field("minimumThickness", "Applicable minimum thickness (mm)")}{field("minimumBasis", "Minimum thickness basis / edition", "text")}{field("proposedYears", "Proposed operating interval (years)")}
      {field("repairCutoff", "Repair cutoff (% loss; record only)")}{field("mflThreshold", "MFL detection threshold (remaining mm)")}{field("thicknessEvidence", "Thickness / inspection record reference", "text")}
    </div>
    {check("mflUsed", "MFL was used: include the detection threshold when deriving the underside rate.")}
    {check("retainedVerified", "Retained thicknesses and coverage are verified; values are not inferred solely from a repair cutoff.")}
    <h3>Underside corrosion rate</h3><div className="form-grid">
      <label className="field"><span>Rate selection</span><select className="select-control native-select" aria-label="Post-repair rate selection" value={value.rateMode} onChange={event => change("rateMode", event.target.value)}><option value="auto">Higher of supported long / short-term rates</option><option value="manual">Controlled manual rate with justification</option></select></label>
      {field("manualRate", "Manual underside rate (mm/year)")}{field("rateReason", "Manual rate engineering justification", "text")}
      {field("location", "Matched history location ID", "text")}{field("previousThickness", "Previous thickness at history location (mm)")}{field("currentHistoryThickness", "Current thickness at same location (mm)")}
    </div>
    {check("useShort", "Include short-term history in the retained-area rate assessment.")}
    {check("comparable", "Measurements are comparable at the same location, with repair history accounted for, and applicable to this area.")}
    <h3>Product-side corrosion and lining</h3><div className="form-grid">
      {field("topRate", "Top-side StPr (mm/year)")}{field("topBasis", "Top-side rate basis", "text")}{field("liningDate", "Lining installation date", "date")}{field("liningLife", "Expected lining service life (years)")}{field("liningEvidence", "Lining specification / life evidence", "text")}
    </div>
    {check("liningCredit", "Apply StPr = 0 using verified lining life. Coating is not added to steel thickness.")}
    <h3>Welded patch areas</h3><p>Enter underlying remaining steel and patch thickness separately. Each group must identify its patches and common assessment basis. Keep the repaired area’s corrosion rate unless removal of the cause is substantiated.</p>
    <div className="post-repair-table-wrap"><table className="post-repair-patches"><thead><tr>{patchFields.map(([key, label]) => <th key={key}>{label}</th>)}<th>Action</th></tr></thead><tbody>{(value.patches ?? []).map((patch, index) => <tr key={index}>{patchFields.map(([key, label, type]) => <td key={key}><input aria-label={`Patch ${index + 1} ${label}`} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} {...(type === "checkbox" ? { checked: Boolean(patch[key]) } : { value: String(patch[key] ?? "") })} onChange={event => onChange({ ...value, patches: (value.patches ?? []).map((p, i) => i === index ? { ...p, [key]: type === "checkbox" ? event.target.checked : event.target.value } : p) })} /></td>)}<td><button type="button" className="secondary-button" onClick={() => onChange({ ...value, patches: value.patches?.filter((_, i) => i !== index) })}>Delete</button></td></tr>)}</tbody></table></div>
    <button type="button" className="secondary-button" onClick={() => onChange({ ...value, patches: [...(value.patches ?? []), {}] })}>Add patch area</button>
    <h3>Interval checks</h3><div className="form-grid">{field("inspectionLimit", "Section 6.4.2 interval limit (years)")}{field("inspectionBasis", "Inspection-limit basis / review reference", "text")}{field("reviewReference", "Critical-zone / annular review reference", "text")}</div>
    {check("repairsComplete", "Every repaired area is represented and repair inspection/testing is complete, or no patches were needed.")}
    {check("criticalReviewed", "Separate critical-zone assessment supports the proposed interval.")}
    {check("annularReviewed", "Separate annular assessment supports the proposed interval, or is documented as not applicable.")}
    <Results result={result} />
    <div className="post-repair-actions"><DownloadReport input={value} result={result} /><button type="button" className="secondary-button" onClick={() => onChange(createPostRepairInput())}>Reset post-repair assessment</button></div>
  </details>;
}
