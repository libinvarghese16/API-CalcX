import { DecimalNumberInput } from "../components/DecimalNumberInput.tsx";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { calculateApi653PostRepairLife, calculateApi653BottomInterval, convertApi653MflLoss } from "@api-calc-pro/calc-engine";
import type { Api653PostRepairInput, Api653PostRepairLifeResult, Api653BottomIntervalResult, Api653MflLossResult } from "@api-calc-pro/calc-engine";

export function createPostRepairInput(): Api653PostRepairInput {
  return { remainingThicknessAfterRepair: "" };
}
const rateDisplay = (value: number | null) => value === null || !Number.isFinite(value) ? "—" : value.toFixed(3);
const display = (value: number | null) => value === Infinity ? "No finite corrosion limit" : value === null || !Number.isFinite(value) ? "—" : value.toFixed(2);

function Results({ result, wall = false }: { result: Api653PostRepairLifeResult; wall?: boolean }) {
  return <section className="result-card post-repair-results" aria-live="polite">
    <div className="result-card-top">Remaining life after repair</div>
    <div className="result-value"><strong>{display(result.remainingLife)}</strong>{Number.isFinite(result.remainingLife) && <span>years</span>}</div>
    <div className="result-comparison">
      <span>Long-term {wall ? "corrosion" : "soil-side"} rate<strong>{rateDisplay(result.longRate)} mm/year</strong></span>
      <span>Short-term {wall ? "corrosion" : "soil-side"} rate<strong>{rateDisplay(result.shortRate)} mm/year</strong></span>
      <span>Higher rate used<strong>{rateDisplay(result.governingRate)} mm/year</strong></span>
      {!wall && <span>Product-side rate added<strong>{rateDisplay(result.topRate)} mm/year</strong></span>}
    </div>
    {result.errors.length ? <div className="result-status"><div>{result.errors.map(error => <strong key={error}>{error}</strong>)}</div></div> : <>
      <div className="result-status"><div><strong>{result.selected} rate governs, including after repair.</strong></div></div>
      <p className="post-repair-equation">({display(result.thickness)} − {display(result.minimumThickness)}) ÷ ({rateDisplay(result.governingRate)}{!wall && <> + {rateDisplay(result.topRate)}</>}) = {display(result.remainingLife)} years</p>
      <p>Remaining life estimate; inspection limits and repair acceptance are separate.</p>
    </>}
  </section>;
}

const mflDisplay = (value: number | null) => value === null || !Number.isFinite(value) ? "—" : value.toFixed(2);

function MflNumberField({ label, ariaLabel, value, unit, help, onChange, max }: {
  label: string; ariaLabel: string; value: string | number; unit: string; help: string; onChange: (value: string) => void; max?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const shown = editing ? draft : value === "" || !Number.isFinite(Number(value)) ? value : Number(value).toFixed(2);
  return <label className="field"><span>{label}</span><div className="number-control"><input aria-label={ariaLabel} type="number" inputMode="decimal" min="0" max={max} step="any" value={shown} onFocus={event => { setDraft(event.currentTarget.value); setEditing(true); }} onBlur={() => setEditing(false)} onChange={event => { setDraft(event.target.value); onChange(event.target.value); }} /><b>{unit}</b></div><small>{help}</small></label>;
}

function MflResult({ result }: { result: Api653MflLossResult }) {
  return <div className="post-repair-help" aria-live="polite">{result.errors.length ? result.errors.map(error => <p key={error}>{error}</p>) : <p><strong>{mflDisplay(result.lossPercent)}% loss of {mflDisplay(result.originalThickness)} mm = {mflDisplay(result.lossMm)} mm lost; {mflDisplay(result.remainingMm)} mm remaining.</strong></p>}</div>;
}

function IntervalResults({ result }: { result: Api653BottomIntervalResult }) {
  return <section className="trace-card post-repair-interval" aria-live="polite">
    <h3>Thickness needed for your interval</h3>
    {result.errors.length ? result.errors.map(error => <p key={error}>{error}</p>) : <>
      <p>Required thickness now for <strong>{display(result.years)} years</strong></p>
      <p className="post-repair-required"><strong>{display(result.requiredThickness)} mm</strong></p>
      <p>{display(result.minimumThickness)} + ({display(result.years)} × {rateDisplay(result.totalRate)}) = {display(result.requiredThickness)} mm</p>
      {result.projectedThickness !== null && <p>Thickness after {display(result.years)} years: <strong>{display(result.projectedThickness)} mm</strong>{result.projectedThickness < 0 && " (calculated loss exceeds the available steel)"}</p>}
      {result.adequate !== null && <p><strong>{result.adequate ? "Entered thickness meets this interval's thickness requirement." : "Entered thickness is too low for this interval."}</strong></p>}
    </>}
  </section>;
}

export function Api653PostRepairAssessment({ value, onChange, originalThickness, minimumThickness, longRate, shortRate, topRate, basisReady, wall = false, assessmentLabel = "Bottom plate" }: {
  value: Api653PostRepairInput; onChange: (value: Api653PostRepairInput) => void;
  originalThickness: number; minimumThickness: number; longRate: number | null; shortRate: number | null; topRate: number; basisReady: boolean; wall?: boolean; assessmentLabel?: string;
}) {
  // Keep old saved assessment data intact; carry forward only its measured retained minimum.
  const legacyThickness = Number(value.rtbc) > 0 && Number(value.rtip) > 0 ? Math.min(Number(value.rtbc), Number(value.rtip)) : "";
  const manualThickness = value.remainingThicknessAfterRepair ?? legacyThickness;
  const mflOriginalThickness = value.mflOriginalThickness ?? originalThickness;
  const mfl = convertApi653MflLoss(mflOriginalThickness, value.mflLossPercent);
  const thickness = manualThickness;
  const result = calculateApi653PostRepairLife({
    remainingThickness: thickness, minimumThickness,
    longRate: basisReady ? longRate : NaN, shortRate, topRate,
  });
  const interval = calculateApi653BottomInterval({
    minimumThickness, longRate: basisReady ? longRate : NaN, shortRate, topRate,
    years: value.intervalYears ?? "", currentThickness: thickness,
  });
  const download = () => {
    const markup = renderToStaticMarkup(<html><head><meta charSet="utf-8" /><title>Remaining life after repair</title><style>{"body{font:14px Arial;margin:32px;line-height:1.6}.result-comparison{display:grid;gap:12px}.result-comparison span{display:block}.result-comparison strong{margin-left:12px}"}</style></head><body><h1>{assessmentLabel} — remaining life after repair</h1><p>Lowest remaining thickness: {thickness === "" ? "—" : display(Number(thickness))} mm. Minimum required: {display(minimumThickness)} mm.</p><p>Use the higher long-term or short-term corrosion rate from the inspection history. Repair does not reset the history rates.</p>{value.useMflThickness && <MflResult result={mfl} />}<Results result={result} wall={wall} /><IntervalResults result={interval} /></body></html>);
    const url = URL.createObjectURL(new Blob(["<!doctype html>" + markup], { type: "text/html" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "remaining-life-after-repair.html"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="post-repair-assessment" aria-labelledby="post-repair-heading">
    <h2 id="post-repair-heading" className="post-repair-heading">Remaining life after repair</h2>
    <div className="calculator-workspace">
      <div className="input-column">
        <section className="form-card">
          <div className="form-card-heading"><div><span>01</span><div><h2>Lowest thickness after repair</h2><p>Rates and minimum thickness come from the calculation above.</p></div></div></div>
          <div className="form-grid">
            <label className="field"><span>Lowest remaining thickness after repair (mm)</span><div className="number-control"><DecimalNumberInput aria-label="Lowest remaining thickness after repair (mm)" type="number" inputMode="decimal" min="0" step="any" value={thickness} onChange={event => onChange({ ...value, remainingThicknessAfterRepair: event.target.value })} /><b>mm</b></div><small>Use the lowest measured thickness remaining in service after repair.</small></label>
            <label className="field"><span>Minimum required thickness (mm)</span><div className="number-control"><input aria-label="Post-repair minimum thickness" readOnly value={display(minimumThickness)} /><b>mm</b></div><small>Uses the minimum selected above.</small></label>
          </div>
          <p className="post-repair-help"><strong>Use the higher corrosion rate, even after repair.</strong> Keep the inspection readings above unchanged; enter the after-repair thickness only here.</p>
          <p className="post-repair-help">Remaining life = (lowest after-repair thickness − minimum required thickness) ÷ {wall ? "governing corrosion rate." : "(higher soil-side rate + product-side rate)."}</p>
        </section>
        <h2 className="post-repair-additions-heading">Additional checks</h2>
        <section className="form-card post-repair-mfl">
          <div className="form-card-heading"><div><span>02</span><div><h2>MFL percentage to mm</h2><p>Separate converter. Your thickness above stays unchanged unless you apply the result.</p></div></div></div>
          <label className="post-repair-check"><input type="checkbox" checked={Boolean(value.useMflThickness)} onChange={event => onChange({ ...value, useMflThickness: event.target.checked })} />Use MFL inspection metal loss (%)</label>
          {value.useMflThickness && <>
            <div className="form-grid">
              <MflNumberField label={wall ? "Original thickness (mm)" : "Original plate thickness (mm)"} ariaLabel="MFL original plate thickness (mm)" value={mflOriginalThickness} unit="mm" help="Starts with the original thickness above. You can edit it for this converter." onChange={next => onChange({ ...value, mflOriginalThickness: next })} />
              <MflNumberField label="MFL metal loss (%)" ariaLabel="MFL metal loss (%)" value={value.mflLossPercent ?? ""} unit="%" max={100} help="Percentage lost, not percentage remaining. Use the highest reported loss in the material left in service, not a repair cutoff." onChange={next => onChange({ ...value, mflLossPercent: next })} />
            </div>
            <MflResult result={mfl} />
            <button type="button" className="secondary-button" disabled={mfl.remainingMm === null} onClick={() => onChange({ ...value, remainingThicknessAfterRepair: mfl.remainingMm ?? "" })}>Use converted thickness above</button>
          </>}
        </section>
        <section className="form-card">
          <div className="form-card-heading"><div><span>03</span><div><h2>Check an operating interval</h2><p>Calculate how much thickness you need now for X years.</p></div></div></div>
          <div className="form-grid"><label className="field"><span>Operating interval (years)</span><div className="number-control"><DecimalNumberInput aria-label="Post-repair operating interval (years)" type="number" inputMode="decimal" min="0" step="any" value={value.intervalYears ?? ""} onChange={event => onChange({ ...value, intervalYears: event.target.value })} /><b>yr</b></div></label></div>
          <p className="post-repair-help">Required thickness now = minimum thickness + (years × governing total corrosion rate).</p>
        </section>
      </div>
      <aside className="result-column"><Results result={result} wall={wall} /><IntervalResults result={interval} /><div className="post-repair-actions"><button type="button" className="secondary-button" onClick={download}>Download post-repair report</button></div></aside>
    </div>
  </section>;
}
