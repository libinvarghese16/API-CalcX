import { Calculator, Check, CircleCheck, Clipboard, FileText, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { buildApi510ReportText } from "./api510-report.ts";
import type { Api510ReportModel, ReportRow } from "./api510-report.ts";

function ReportRows({ rows }: { rows: ReportRow[] }) {
  return <div className="report-row-grid">{rows.map((row) => <div key={`${row.label}-${row.value}`} className={`report-data-row ${row.emphasis ? `is-${row.emphasis}` : ""}`}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div>;
}

async function copyReportText(model: Api510ReportModel): Promise<void> {
  const text = buildApi510ReportText(model);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy is unavailable in this browser.");
}

export function Api510ReportPreview({ model, onClose, onOpenCalculation, onApprove, notify }: {
  model: Api510ReportModel;
  onClose: () => void;
  onOpenCalculation?: () => void;
  onApprove?: (details: { approverName: string; approvalNotes: string }) => boolean | Promise<boolean>;
  notify: (message: string) => void;
}) {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approverName, setApproverName] = useState(model.approverName);
  const [approvalNotes, setApprovalNotes] = useState(model.approvalNotes);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (approvalOpen) setApprovalOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [approvalOpen, onClose]);
  const handleCopy = async () => {
    try {
      await copyReportText(model);
      notify("Report text copied. No PDF or copyrighted reference content was created.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Report text could not be copied.");
    }
  };
  const recordApproval = async () => {
    if (!onApprove) return;
    setSubmittingApproval(true);
    try {
      if (await onApprove({ approverName, approvalNotes })) setApprovalOpen(false);
    } finally {
      setSubmittingApproval(false);
    }
  };
  return (
    <div className="report-preview-backdrop" role="presentation">
      <section className="report-preview-shell" role="dialog" aria-modal="true" aria-labelledby="api510-report-title">
        <header className="report-preview-toolbar">
          <div><button className="icon-button" onClick={onClose} aria-label="Close report preview"><X size={19} /></button><div><span>Local text report</span><strong>{model.reportNumber}</strong></div></div>
          <div>{onOpenCalculation ? <button className="secondary-button" onClick={onOpenCalculation}><Calculator size={17} /> Open calculation</button> : null}{model.workflowStatus === "reviewed" && onApprove ? <button className="secondary-button approve-report-button" onClick={() => setApprovalOpen(true)}><ShieldCheck size={17} /> Approve</button> : null}<button className="primary-button" onClick={handleCopy}><Clipboard size={17} /> Copy report text</button></div>
        </header>
        <div className="report-preview-scroll">
          <article className="report-document">
            <header className="report-document-header">
              <div className="report-brand"><div><img src="/brand/api-calc-mark.png" alt="" /><span><strong>API Calc Pro</strong><small>Asset integrity calculation record</small></span></div><b>API 510</b></div>
              <div className="report-title-block"><div><p>Pressure vessel calculation report</p><h1 id="api510-report-title">{model.title}</h1><span>{model.subtitle}</span></div><div className={`report-status-stamp ${model.resultOk ? "is-valid" : "is-error"} is-${model.workflowStatus}`}><small>{model.statusLabel}</small><strong>{model.workflowStatus.toUpperCase()}</strong><span>{model.reportNumber}</span></div></div>
              <div className="report-meta-strip"><span><small>Prepared by</small><strong>{model.preparedBy}</strong></span><span><small>Generated / updated</small><strong>{model.preparedAt}</strong></span><span><small>Document type</small><strong>Local working preview</strong></span></div>
            </header>

            <section className="report-callout"><div>{model.resultOk ? <CircleCheck size={22} /> : <TriangleAlert size={22} />}</div><span><strong>{model.resultOk ? "Calculation engine completed" : "Calculation requires input review"}</strong><p>{model.conclusion}</p></span></section>

            <div className="report-section-grid two-column">
              <section className="report-section"><div className="report-section-title"><span>01</span><div><p>Identification</p><h2>Project and equipment</h2></div></div><ReportRows rows={model.projectRows} /></section>
              <section className="report-section"><div className="report-section-title"><span>02</span><div><p>Calculation basis</p><h2>Design and geometry</h2></div></div><ReportRows rows={model.basisRows} /></section>
            </div>

            <section className="report-section"><div className="report-section-title"><span>03</span><div><p>Field history</p><h2>Inspection and thickness inputs</h2></div></div><ReportRows rows={model.inspectionRows} /></section>

            <section className="report-section result-report-section"><div className="report-section-title"><span>04</span><div><p>Structured engine output</p><h2>Calculated results</h2></div></div><ReportRows rows={model.resultRows} /></section>

            <section className="report-section"><div className="report-section-title"><span>05</span><div><p>Future condition</p><h2>Inspection planning values</h2></div></div><ReportRows rows={model.planningRows} /></section>

            <div className="report-section-grid two-column lower-report-grid">
              <section className="report-section"><div className="report-section-title"><span>06</span><div><p>Audit information</p><h2>Calculation traceability</h2></div></div><ReportRows rows={model.traceRows} /></section>
              <section className="report-section"><div className="report-section-title"><span>07</span><div><p>Engineering review</p><h2>Issues and overrides</h2></div></div><div className="report-review-list"><div className={model.overrides.length ? "is-warning" : "is-clear"}>{model.overrides.length ? <TriangleAlert size={17} /> : <Check size={17} />}<span><strong>Manual overrides</strong><small>{model.overrides.length ? model.overrides.join(" · ") : "None"}</small></span></div><div className={model.issues.length ? "is-warning" : "is-clear"}>{model.issues.length ? <TriangleAlert size={17} /> : <Check size={17} />}<span><strong>Engine issues</strong><small>{model.issues.length ? model.issues.map((issue) => issue.message).join(" · ") : "None"}</small></span></div><div className={model.workflowStatus !== "draft" ? "is-clear" : "is-warning"}>{model.workflowStatus !== "draft" ? <Check size={17} /> : <ShieldCheck size={17} />}<span><strong>Workflow review</strong><small>{model.workflowStatus !== "draft" ? `Reviewed by ${model.reviewerName}` : "Review confirmation is pending"}</small></span></div></div></section>
            </div>

            <section className="report-section workflow-report-section"><div className="report-section-title"><span>08</span><div><p>Document control</p><h2>Workflow and revision history</h2></div></div><ReportRows rows={model.workflowRows} />{model.reviewNotes || model.approvalNotes ? <div className="report-note-grid"><div><span>Reviewer notes</span><p>{model.reviewNotes || "None"}</p></div><div><span>Approval notes</span><p>{model.approvalNotes || "None"}</p></div></div> : null}<div className="revision-history">{model.revisionHistory.length ? model.revisionHistory.map((entry, index) => <div key={`${entry.event}-${entry.timestamp}-${index}`}><b>{entry.event}</b><span><strong>{entry.actor}</strong><small>{entry.timestamp}</small></span><p>{entry.note}</p></div>) : <p>No persisted workflow events for this live preview.</p>}</div></section>

            <section className="report-signatures"><div><span>Prepared by</span><strong>{model.preparedBy}</strong><i /></div><div><span>Reviewed by</span><strong>{model.reviewerName || "Pending qualified reviewer"}</strong><i /></div><div><span>Approved by</span><strong>{model.approverName || "Pending engineering approval"}</strong><i /></div></section>

            <footer className="report-document-footer"><FileText size={16} /><p><strong>Working local preview — not an issued engineering document.</strong> This original report layout contains calculation inputs, result text, and traceability metadata only. It does not include standards PDFs, copied code text, or copyrighted reference tables.</p></footer>
          </article>
        </div>
      </section>
      {approvalOpen ? <div className="modal-backdrop approval-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setApprovalOpen(false); }}><section className="modal-card approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-dialog-title"><div className="modal-heading"><div><p className="eyebrow">Controlled transition</p><h2 id="approval-dialog-title">Approve revision</h2><p>Record the local approver for {model.reportNumber}. This does not create an issued or certified document.</p></div><button className="icon-button" onClick={() => setApprovalOpen(false)} aria-label="Close approval form"><X size={19} /></button></div><div className="reviewer-form-grid"><label><span>Approver name *</span><input value={approverName} onChange={(event) => setApproverName(event.target.value)} placeholder="Qualified approver name" autoComplete="name" /></label><label className="full"><span>Approval notes</span><textarea value={approvalNotes} onChange={(event) => setApprovalNotes(event.target.value)} placeholder="Record approval conditions, limitations, or disposition." rows={4} /></label></div><label className={`review-confirmation ${approvalConfirmed ? "is-checked" : ""}`}><input type="checkbox" checked={approvalConfirmed} onChange={(event) => setApprovalConfirmed(event.target.checked)} /><span><b>{approvalConfirmed ? <Check size={17} /> : null}</b><strong>I confirm this reviewed revision is the intended local approval record.</strong><small>Approval is stored only on this device and remains subject to the organization’s engineering authority and document-control process.</small></span></label><div className="modal-actions"><button className="secondary-button" onClick={() => setApprovalOpen(false)}>Cancel</button><button className="primary-button" onClick={recordApproval} disabled={!approverName.trim() || !approvalConfirmed || submittingApproval}><ShieldCheck size={17} /> {submittingApproval ? "Recording approval…" : "Approve locally"}</button></div></section></div> : null}
    </div>
  );
}
