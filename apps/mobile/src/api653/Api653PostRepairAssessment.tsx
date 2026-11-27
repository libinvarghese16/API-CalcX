import { renderToStaticMarkup } from "react-dom/server";
import { calculateApi653PostRepairLife, calculateApi653BottomInterval, convertApi653MflLoss } from "@api-calc-pro/calc-engine";
import type { Api653PostRepairInput, Api653PostRepairLifeResult, Api653BottomIntervalResult, Api653MflLossResult } from "@api-calc-pro/calc-engine";

export function createPostRepairInput(): Api653PostRepairInput {
  return { remainingThicknessAfterRepair: "" };
}
const display = (value: number | null) => value === Infinity ? "No finite corrosion limit" : value === null || !Number.isFinite(value) ? "—" : value.toFixed(4);

function Results({ result }: { result: Api653PostRepairLifeResult }) {
  return <section className="result-card post-repair-results" aria-live="polite">
    <div className="result-card-top">Remaining life after repair</div>
    <div className="result-value"><strong>{display(result.remainingLife)}</strong>{Number.isFinite(result.remainingLife) && <span>years</span>}</div>
    <div className="result-comparison">
      <span>Long-term soil-side rate<strong>{display(result.longRate)} mm/year</strong></span>
      <span>Short-term soil-side rate<strong>{display(result.shortRate)} mm/year</strong></span>
      <span>Higher rate used<strong>{display(result.governingRate)} mm/year</strong></span>
      <span>Product-side rate added<strong>{display(result.topRate)} mm/year</strong></span>
    </div>
    {result.errors.length ? <div className="result-status"><div>{result.errors.map(error => <strong key={error}>{error}</strong>)}</div></div> : <>
      <div className="result-status"><div><strong>{result.selected} rate governs, including after patch installation.</strong></div></div>
      <p className="post-repair-equation">({display(result.thickness)} − {display(result.minimumThickness)}) ÷ ({display(result.governingRate)} + {display(result.topRate)}) = {display(result.remainingLife)} years</p>
      <p>Remaining life estimate; inspection limits and repair acceptance are separate.</p>
    </>}
  </section>;
}

function MflResult({ result }: { result: Api653MflLossResult }) {
  return <div className="post-repair-help" aria-live="polite">{result.errors.length ? result.errors.map(error => <p key={error}>{error}</p>) : <p><strong>{display(result.lossPercent)}% loss of {display(result.originalThickness)} mm = {display(result.lossMm)} mm lost; {display(result.remainingMm)} mm remaining.</strong></p>}</div>;
}

function IntervalResults({ result }: { result: Api653BottomIntervalResult }) {
  return <section className="trace-card post-repair-interval" aria-live="polite">
    <h3>Thickness needed for your interval</h3>
    {result.errors.length ? result.errors.map(error => <p key={error}>{error}</p>) : <>
      <p>Required thickness now for <strong>{display(result.years)} years</strong></p>
      <p className="post-repair-required"><strong>{display(result.requiredThickness)} mm</strong></p>
      <p>{display(result.minimumThickness)} + ({display(result.years)} × {display(result.totalRate)}) = {display(result.requiredThickness)} mm</p>
      {result.projectedThickness !== null && <p>Thickness after {display(result.years)} years: <strong>{display(result.projectedThickness)} mm</strong>{result.projectedThickness < 0 && " (calculated loss exceeds the available steel)"}</p>}
      {result.adequate !== null && <p><strong>{result.adequate ? "Entered thickness meets this interval's thickness requirement." : "Entered thickness is too low for this interval."}</strong></p>}
    </>}
  </section>;
}

export function Api653PostRepairAssessment({ value, onChange, originalThickness, minimumThickness, longRate, shortRate, topRate, basisReady }: {
  value: Api653PostRepairInput; onChange: (value: Api653PostRepairInput) => void;
  originalThickness: number; minimumThickness: number; longRate: number | null; shortRate: number | null; topRate: number; basisReady: boolean;
}) {
  // Keep old saved assessment data intact; carry forward only its measured retained minimum.
  const legacyThickness = Number(value.rtbc) > 0 && Number(value.rtip) > 0 ? Math.min(Number(value.rtbc), Number(value.rtip)) : "";
  const manualThickness = value.remainingThicknessAfterRepair ?? legacyThickness;
  const mfl = convertApi653MflLoss(originalThickness, value.mflLossPercent);
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
    const markup = renderToStaticMarkup(<html><head><meta charSet="utf-8" /><title>Remaining life after repair</title><style>{"body{font:14px Arial;margin:32px;line-height:1.6}.result-comparison{display:grid;gap:12px}.result-comparison span{display:block}.result-comparison strong{margin-left:12px}"}</style></head><body><h1>Bottom plate — remaining life after repair</h1><p>Lowest remaining thickness: {String(thickness)} mm. Minimum required: {display(minimumThickness)} mm.</p><p>Use the higher long-term or short-term soil-side rate from the inspection history. Add the product-side rate. Patch installation does not reset the history rates.</p>{value.useMflThickness && <MflResult result={mfl} />}<Results result={result} /><IntervalResults result={interval} /></body></html>);
    const url = URL.createObjectURL(new Blob(["<!doctype html>" + markup], { type: "text/html" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "API653-post-repair-bottom-assessment.html"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="post-repair-assessment" aria-labelledby="post-repair-heading">
    <h2 id="post-repair-heading" className="post-repair-heading">Remaining life after patch repair</h2>
    <div className="calculator-workspace">
      <div className="input-column">
        <section className="form-card">
          <div className="form-card-heading"><div><span>01</span><div><h2>Lowest thickness after repair</h2><p>Rates and minimum thickness come from the calculation above.</p></div></div></div>
          <div className="form-grid">
            <label className="field"><span>Lowest remaining thickness after repair (mm)</span><div className="number-control"><input aria-label="Lowest remaining thickness after repair (mm)" type="number" inputMode="decimal" min="0" step="any" value={thickness} onChange={event => onChange({ ...value, remainingThicknessAfterRepair: event.target.value })} /><b>mm</b></div><small>Use the lowest measured thickness of the original floor left in service. Do not add patch thickness to this value.</small></label>
            <label className="field"><span>Minimum required thickness (mm)</span><div className="number-control"><input aria-label="Post-repair minimum thickness" readOnly value={display(minimumThickness)} /><b>mm</b></div><small>Uses the minimum selected above.</small></label>
          </div>
          <p className="post-repair-help"><strong>Use the higher corrosion rate, even after patch repair.</strong> Keep the inspection readings above unchanged; enter the after-repair thickness only here.</p>
          <p className="post-repair-help">Remaining life = (lowest after-repair thickness − minimum required thickness) ÷ (higher soil-side rate + product-side rate).</p>
        </section>
      </div>
      <aside className="result-column"><Results result={result} /><div className="post-repair-actions"><button type="button" className="secondary-button" onClick={download}>Download post-repair report</button></div></aside>
    </div>
    <h2 className="post-repair-heading">Additional checks</h2>
    <div className="calculator-workspace post-repair-additions">
      <div className="input-column">
        <section className="form-card">
          <div className="form-card-heading"><div><span>02</span><div><h2>MFL percentage to mm</h2><p>Separate converter. Your thickness above stays unchanged unless you apply the result.</p></div></div></div>
          <label className="post-repair-check"><input type="checkbox" checked={Boolean(value.useMflThickness)} onChange={event => onChange({ ...value, useMflThickness: event.target.checked })} />Use MFL inspection metal loss (%)</label>
          {value.useMflThickness && <>
            <div className="form-grid">
              <label className="field"><span>Original plate thickness (mm)</span><div className="number-control"><input aria-label="MFL original plate thickness (mm)" readOnly value={display(originalThickness)} /><b>mm</b></div><small>Uses the original thickness entered above.</small></label>
              <label className="field"><span>MFL metal loss (%)</span><div className="number-control"><input aria-label="MFL metal loss (%)" type="number" inputMode="decimal" min="0" max="100" step="any" value={value.mflLossPercent ?? ""} onChange={event => onChange({ ...value, mflLossPercent: event.target.value })} /><b>%</b></div><small>Percentage lost, not percentage remaining. Use the highest reported loss in the retained floor, not a repair cutoff.</small></label>
            </div>
            <MflResult result={mfl} />
            <button type="button" className="secondary-button" disabled={mfl.remainingMm === null} onClick={() => onChange({ ...value, remainingThicknessAfterRepair: mfl.remainingMm ?? "" })}>Use converted thickness above</button>
          </>}
        </section>
        <section className="form-card">
          <div className="form-card-heading"><div><span>03</span><div><h2>Check an operating interval</h2><p>Calculate how much thickness you need now for X years.</p></div></div></div>
          <div className="form-grid"><label className="field"><span>Operating interval (years)</span><div className="number-control"><input aria-label="Post-repair operating interval (years)" type="number" inputMode="decimal" min="0" step="any" value={value.intervalYears ?? ""} onChange={event => onChange({ ...value, intervalYears: event.target.value })} /><b>yr</b></div></label></div>
          <p className="post-repair-help">Required thickness now = minimum thickness + (years × governing total corrosion rate).</p>
        </section>
      </div>
      <aside className="result-column"><IntervalResults result={interval} /></aside>
    </div>
  </section>;
}
