import { Check, CircleCheck, FileCheck2, Gauge, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Api510ReportModel, ReportRow } from "./api510-report.ts";

function ReviewRows({ rows }: { rows: ReportRow[] }) {
  return <div className="review-data-grid">{rows.map((row) => <div key={`${row.label}-${row.value}`} className={row.emphasis === "warning" ? "is-warning" : ""}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div>;
}

export function Api510ReviewDialog({ model, confirmed, onConfirmedChange, onRecordReview, onClose, onContinue }: {
  model: Api510ReportModel;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onRecordReview: (details: { reviewerName: string; reviewNotes: string }) => boolean | Promise<boolean>;
  onClose: () => void;
  onContinue: () => void;
}) {
  const [reviewerName, setReviewerName] = useState(model.reviewerName);
  const [reviewNotes, setReviewNotes] = useState(model.reviewNotes);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const reviewItems = [
    { icon: Gauge, label: "Engine validation", value: model.resultOk ? "Calculation completed" : "Input errors remain", ok: model.resultOk },
    { icon: ShieldCheck, label: "Source trace", value: "Protected parity gate recorded", ok: true },
    { icon: TriangleAlert, label: "Manual overrides", value: model.overrides.length ? model.overrides.join(", ") : "None", ok: model.overrides.length === 0 },
    { icon: FileCheck2, label: "Report source", value: "Single structured result snapshot", ok: true },
  ];
  const reviewPersisted = model.workflowStatus === "reviewed" || model.workflowStatus === "approved";
  const continueToReport = async () => {
    if (reviewPersisted) {
      onContinue();
      return;
    }
    setSubmitting(true);
    try {
      if (await onRecordReview({ reviewerName, reviewNotes })) onContinue();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="modal-backdrop review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card calculation-review-modal" role="dialog" aria-modal="true" aria-labelledby="calculation-review-title">
        <div className="modal-heading review-heading"><div><p className="eyebrow">Step 03 · Engineering check</p><h2 id="calculation-review-title">Review calculation</h2><p>Confirm the visible basis and trace before opening the report preview.</p></div><button className="icon-button" onClick={onClose} aria-label="Close calculation review"><X size={19} /></button></div>
        <div className="review-status-grid">
          {reviewItems.map(({ icon: Icon, label, value, ok }) => <article key={label} className={ok ? "is-ok" : "is-warning"}><div>{ok ? <CircleCheck size={18} /> : <Icon size={18} />}</div><span>{label}</span><strong>{value}</strong></article>)}
        </div>
        <section className="review-section"><div className="review-section-heading"><div><p className="eyebrow">Controlled basis</p><h3>Project, equipment and calculation</h3></div><span>{model.reportNumber}</span></div><ReviewRows rows={[...model.projectRows, ...model.basisRows]} /></section>
        <section className="review-section"><div className="review-section-heading"><div><p className="eyebrow">Structured output</p><h3>Governing result summary</h3></div><span>{model.resultOk ? "Engine complete" : "Review required"}</span></div><ReviewRows rows={model.resultRows} /></section>
        {model.issues.length ? <section className="review-issue-panel"><TriangleAlert size={18} /><div><strong>Calculation issues</strong>{model.issues.map((issue, index) => <p key={`${issue.message}-${index}`}>{issue.severity.toUpperCase()} · {issue.message}</p>)}</div></section> : <section className="review-issue-panel is-clear"><CircleCheck size={18} /><div><strong>No engine issues</strong><p>The structured result contains no calculation errors or warnings.</p></div></section>}
        <section className="review-section reviewer-details"><div className="review-section-heading"><div><p className="eyebrow">Reviewer record</p><h3>{reviewPersisted ? "Persisted review details" : "Identify the local reviewer"}</h3></div><span>Revision R{model.workflowRows.find((row) => row.label === "Revision")?.value.replace("R", "") ?? "1"}</span></div><div className="reviewer-form-grid"><label><span>Reviewer name *</span><input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} disabled={reviewPersisted} placeholder="Qualified reviewer name" autoComplete="name" /></label><label className="full"><span>Review notes</span><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} disabled={reviewPersisted} placeholder="Record assumptions, checks, field-data limitations, or follow-up actions." rows={3} /></label></div></section>
        <label className={`review-confirmation ${confirmed ? "is-checked" : ""}`}><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmedChange(event.target.checked)} disabled={!model.resultOk} /><span><b>{confirmed ? <Check size={17} /> : null}</b><strong>I reviewed the displayed inputs, selected units, result trace, and override status.</strong><small>This confirms local workflow review only. It is not engineering approval or code certification.</small></span></label>
        <div className="modal-actions review-actions"><button className="secondary-button" onClick={onClose}>Back to inputs</button><button className="primary-button" onClick={continueToReport} disabled={!model.resultOk || !confirmed || !reviewerName.trim() || submitting}><FileCheck2 size={17} /> {submitting ? "Recording review…" : reviewPersisted ? "Continue to report" : "Record review and continue"}</button></div>
      </section>
    </div>
  );
}
