import { useEffect, useMemo, useState } from "react";
import { Calculator, Check, CircleCheck, Clipboard, FileText, HardDrive, ShieldCheck, TriangleAlert, X } from "lucide-react";

import { createApi653CalculationFingerprint } from "../local-data/calculation-workflow.ts";
import type {
  Api653CalculatorId,
  Api653InputSnapshot,
  Api653ResultSnapshot,
  ApproveApi653CalculationInput,
  LocalProject,
  ReviewApi653CalculationInput,
  SaveApi653CalculationInput,
  SavedApi653Calculation,
} from "../local-data/models.ts";

export interface Api653CalculatorWorkflowProps {
  projects: LocalProject[];
  initialCalculation: SavedApi653Calculation | null;
  onSave: (input: SaveApi653CalculationInput) => SavedApi653Calculation;
  onReview: (input: ReviewApi653CalculationInput) => SavedApi653Calculation;
  onApprove: (input: ApproveApi653CalculationInput) => SavedApi653Calculation;
  onNeedProject: () => void;
  notify: (message: string) => void;
}

export interface Api653ReportRow { label: string; value: string; primary?: boolean }
export interface Api653WorkflowReportDefinition {
  reportKind: string;
  basisTitle: string;
  inspectionTitle: string;
  summaryLines: string[];
  basisRows: Api653ReportRow[];
  inspectionRows: Api653ReportRow[];
  resultRows: Api653ReportRow[];
}

interface Api653RecordWorkflowProps {
  calculatorId: Api653CalculatorId;
  calculatorLabel: string;
  defaultAssetTag: string;
  defaultAssetName: string;
  defaultTitle: string;
  reportDefinition: Api653WorkflowReportDefinition;
  inputSnapshot: Api653InputSnapshot;
  result: Api653ResultSnapshot;
  onRecalculate: () => void;
  record: SavedApi653Calculation | null;
  projects: LocalProject[];
  onSave: (input: SaveApi653CalculationInput) => SavedApi653Calculation;
  onReview: (input: ReviewApi653CalculationInput) => SavedApi653Calculation;
  onApprove: (input: ApproveApi653CalculationInput) => SavedApi653Calculation;
  onNeedProject: () => void;
  notify: (message: string) => void;
}

function recordFingerprint(record: SavedApi653Calculation): string {
  return createApi653CalculationFingerprint({ projectId: record.projectId, assetTag: record.assetTag, assetName: record.assetName, title: record.title, inputs: record.inputs, result: record.result });
}

function formatDate(value?: string): string {
  if (!value) return "Pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const area = document.createElement("textarea");
  area.value = value;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function Api653RecordWorkflow({ calculatorId, calculatorLabel, defaultAssetTag, defaultAssetName, defaultTitle, reportDefinition, inputSnapshot, result, onRecalculate, record, projects, onSave, onReview, onApprove, onNeedProject, notify }: Api653RecordWorkflowProps) {
  const activeProjects = projects.filter((project) => project.status === "active");
  const [saveOpen, setSaveOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [projectId, setProjectId] = useState(record?.projectId ?? activeProjects[0]?.id ?? "");
  const [assetTag, setAssetTag] = useState(record?.assetTag ?? defaultAssetTag);
  const [assetName, setAssetName] = useState(record?.assetName ?? defaultAssetName);
  const [title, setTitle] = useState(record?.title ?? defaultTitle);
  const [preparedBy, setPreparedBy] = useState(record?.workflow.preparedBy ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [approverName, setApproverName] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  useEffect(() => {
    if (!record) return;
    setProjectId(record.projectId); setAssetTag(record.assetTag); setAssetName(record.assetName); setTitle(record.title); setPreparedBy(record.workflow.preparedBy);
  }, [record]);

  const currentFingerprint = useMemo(() => projectId ? createApi653CalculationFingerprint({ projectId, assetTag, assetName, title, inputs: inputSnapshot, result }) : "", [assetName, assetTag, inputSnapshot, projectId, result, title]);
  const dirty = !record || currentFingerprint !== recordFingerprint(record);
  const project = projects.find((candidate) => candidate.id === (record?.projectId ?? projectId));
  const reportNumber = record ? `API653-${record.id.slice(-8).toUpperCase()}-R${record.workflow.revision}` : "API653-LIVE-DRAFT";
  const calculationWarning = result.issues.find((issue) => issue.severity === "warning");

  const openSave = () => {
    if (!activeProjects.length && !record) { notify("Create a local project before saving this API 653 calculation."); onNeedProject(); return; }
    if (!projectId) setProjectId(activeProjects[0]?.id ?? "");
    setSaveOpen(true);
  };
  const saveRecord = () => {
    try {
      const saved = onSave({ projectId, calculationId: record?.projectId === projectId ? record.id : undefined, calculatorId, assetTag, assetName, title, status: "draft", preparedBy, changeNote, inputs: inputSnapshot, result });
      setSaveOpen(false); setChangeNote(""); notify(`${saved.title} saved locally as revision ${saved.workflow.revision}.`);
    } catch (error) { notify(error instanceof Error ? error.message : "API 653 record could not be saved."); }
  };
  const openReview = () => {
    if (!record) return notify("Save this API 653 calculation before recording engineering review.");
    if (dirty) return notify("Save the current changes before recording engineering review.");
    if (!result.ok) return notify("Resolve the calculation errors before recording engineering review.");
    if (record.status !== "draft") return notify(`This revision is already ${record.status}.`);
    setReviewOpen(true);
  };
  const submitReview = () => {
    if (!record) return;
    try { const reviewed = onReview({ projectId: record.projectId, calculationId: record.id, reviewerName, reviewNotes, fingerprint: recordFingerprint(record) }); setReviewOpen(false); setReviewConfirmed(false); notify(`${reviewed.title} recorded as Reviewed.`); }
    catch (error) { notify(error instanceof Error ? error.message : "Review could not be recorded."); }
  };
  const submitApproval = () => {
    if (!record) return;
    try { const approved = onApprove({ projectId: record.projectId, calculationId: record.id, approverName, approvalNotes, fingerprint: recordFingerprint(record) }); setApprovalOpen(false); setApprovalConfirmed(false); notify(`${approved.title} approved locally.`); }
    catch (error) { notify(error instanceof Error ? error.message : "Approval could not be recorded."); }
  };
  const reportText = [
    `API CALC PRO — API 653 ${calculatorLabel.toUpperCase()} CALCULATION RECORD`, `Report: ${reportNumber}`, `Status: ${record?.status ?? "draft"}`,
    `Project: ${project?.name ?? "Unsaved live calculation"}`, `Tank: ${assetTag} — ${assetName}`, `Title: ${title}`,
    `Prepared by: ${preparedBy || "Not recorded"}`, `Reviewed by: ${record?.workflow.reviewedBy || "Pending"}`, `Approved by: ${record?.workflow.approvedBy || "Pending"}`,
    `Unit system: ${inputSnapshot.unitSystem === "metric" ? "Metric" : "U.S. customary"}`, ...reportDefinition.summaryLines,
    `Issues: ${result.issues.length ? result.issues.map((issue) => issue.message).join(" | ") : "None"}`, "Working local record only — not an issued engineering document.",
  ].join("\n");

  return <>
    <button className="secondary-button" onClick={() => { onRecalculate(); notify(result.ok ? "All linked API 653 results have been recalculated." : result.issues.find((issue) => issue.severity === "error")?.message ?? "Review the calculation inputs."); }}><Calculator size={16} /> Recalculate</button>
    <span className={`save-state-badge ${dirty ? "is-dirty" : "is-saved"}`}>{dirty ? <TriangleAlert size={14} /> : <CircleCheck size={14} />}{record ? dirty ? "Unsaved changes" : `${record.status} · R${record.workflow.revision}` : "Not saved"}</span>
    <button className="secondary-button" onClick={openSave}><HardDrive size={16} /> {record ? "Update record" : "Save draft"}</button>
    <button className="secondary-button" onClick={openReview}><ShieldCheck size={16} /> Review</button>
    <button className="primary-button report-preview-button" onClick={() => setReportOpen(true)}><FileText size={16} /> Report</button>

    {saveOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaveOpen(false); }}><section className="modal-card save-calculation-modal" role="dialog" aria-modal="true" aria-labelledby="api653-save-title"><div className="modal-heading"><div><p className="eyebrow">Offline API 653 project record</p><h2 id="api653-save-title">{record ? `Update ${calculatorLabel.toLowerCase()} calculation` : `Save ${calculatorLabel.toLowerCase()} calculation`}</h2></div><button className="icon-button" onClick={() => setSaveOpen(false)} aria-label="Close API 653 save form"><X size={19} /></button></div><div className="modal-form-grid">
      <label className="modal-field full"><span>Project *</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{activeProjects.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
      <label className="modal-field"><span>Tank / equipment tag *</span><input value={assetTag} onChange={(event) => setAssetTag(event.target.value)} placeholder={defaultAssetTag} /></label><label className="modal-field"><span>Asset name</span><input value={assetName} onChange={(event) => setAssetName(event.target.value)} placeholder={defaultAssetName} /></label>
      <label className="modal-field full"><span>Calculation title *</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="modal-field"><span>Prepared by *</span><input value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} autoComplete="name" /></label><label className="modal-field"><span>Change note</span><input value={changeNote} onChange={(event) => setChangeNote(event.target.value)} placeholder="Reason for this update" /></label>
    </div><div className="modal-note"><HardDrive size={17} /><span>The exact editable inputs, normalized engine values, results, units, and revision history are stored locally.</span></div><div className="modal-actions"><button className="secondary-button" onClick={() => setSaveOpen(false)}>Cancel</button><button className="primary-button" onClick={saveRecord} disabled={!projectId || !assetTag.trim() || !title.trim() || !preparedBy.trim()}><CircleCheck size={17} /> Save locally</button></div></section></div> : null}

    {reviewOpen && record ? <div className="modal-backdrop" role="presentation"><section className="modal-card review-modal" role="dialog" aria-modal="true" aria-labelledby="api653-review-title"><div className="modal-heading"><div><p className="eyebrow">Controlled engineering check</p><h2 id="api653-review-title">Review API 653 calculation</h2><p>{reportNumber}</p></div><button className="icon-button" onClick={() => setReviewOpen(false)} aria-label="Close API 653 review"><X size={19} /></button></div><div className="reviewer-form-grid"><label><span>Reviewer name *</span><input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} autoComplete="name" /></label><label className="full"><span>Review notes</span><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={4} /></label></div><label className={`review-confirmation ${reviewConfirmed ? "is-checked" : ""}`}><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span><b>{reviewConfirmed ? <Check size={17} /> : null}</b><strong>I confirm the visible inputs, units, equation basis, and results were reviewed.</strong><small>This local workflow record does not replace the organization’s engineering authority.</small></span></label><div className="modal-actions"><button className="secondary-button" onClick={() => setReviewOpen(false)}>Cancel</button><button className="primary-button" onClick={submitReview} disabled={!reviewerName.trim() || !reviewConfirmed}><ShieldCheck size={17} /> Record review</button></div></section></div> : null}

    {reportOpen ? <div className="report-preview-backdrop" role="presentation"><section className="report-preview-shell" role="dialog" aria-modal="true" aria-labelledby="api653-report-title"><header className="report-preview-toolbar"><div><button className="icon-button" onClick={() => setReportOpen(false)} aria-label="Close API 653 report"><X size={19} /></button><div><span>Local text report</span><strong>{reportNumber}</strong></div></div><div>{record?.status === "reviewed" && !dirty ? <button className="secondary-button approve-report-button" onClick={() => setApprovalOpen(true)}><ShieldCheck size={17} /> Approve</button> : null}<button className="primary-button" onClick={() => void copyText(reportText).then(() => notify("API 653 report text copied.")).catch(() => notify("Report text could not be copied on this device."))}><Clipboard size={17} /> Copy report text</button></div></header><div className="report-preview-scroll"><article className="report-document">
      <header className="report-document-header"><div className="report-brand"><div><img src="/brand/api-calc-mark.png" alt="" /><span><strong>API Calc Pro</strong><small>Asset integrity calculation record</small></span></div><b>API 653</b></div><div className="report-title-block"><div><p>{reportDefinition.reportKind}</p><h1 id="api653-report-title">{title}</h1><span>{assetTag} · {assetName}</span></div><div className={`report-status-stamp ${result.ok ? "is-valid" : "is-error"} is-${record?.status ?? "draft"}`}><small>Workflow status</small><strong>{(record?.status ?? "draft").toUpperCase()}</strong><span>{reportNumber}</span></div></div><div className="report-meta-strip"><span><small>Project</small><strong>{project?.name ?? "Unsaved live calculation"}</strong></span><span><small>Prepared by</small><strong>{preparedBy || "Not recorded"}</strong></span><span><small>Updated</small><strong>{formatDate(record?.updatedAt)}</strong></span></div></header>
      <section className="report-callout"><div>{result.ok && !calculationWarning ? <CircleCheck size={22} /> : <TriangleAlert size={22} />}</div><span><strong>{!result.ok ? "Calculation requires input review" : calculationWarning ? "Engineering scope review required" : "Calculation completed"}</strong><p>{calculationWarning?.message ?? "The report uses the same calculated results displayed by the calculator."}</p></span></section>
      <div className="report-section-grid two-column"><ReportSection index="01" eyebrow="Calculation basis" title={reportDefinition.basisTitle} rows={reportDefinition.basisRows} /><ReportSection index="02" eyebrow="Inspection history" title={reportDefinition.inspectionTitle} rows={reportDefinition.inspectionRows} /></div>
      <ReportSection index="03" eyebrow="Calculation output" title="Calculated results" rows={reportDefinition.resultRows} className="result-report-section" />
      <section className="report-section"><div className="report-section-title"><span>04</span><div><p>Audit information</p><h2>Review and approval</h2></div></div><div className="report-row-grid"><ReportRow label="Revision" value={`R${record?.workflow.revision ?? 0}`} /><ReportRow label="Review" value={record?.workflow.reviewedBy ? `${record.workflow.reviewedBy} · ${formatDate(record.workflow.reviewedAt)}` : "Pending"} /><ReportRow label="Approval" value={record?.workflow.approvedBy ? `${record.workflow.approvedBy} · ${formatDate(record.workflow.approvedAt)}` : "Pending"} /></div>{result.issues.length ? <div className="report-review-list">{result.issues.map((issue) => <div className="is-warning" key={`${issue.code}-${issue.field}`}><TriangleAlert size={17} /><span><strong>{issue.code}</strong><small>{issue.message}</small></span></div>)}</div> : null}</section>
      <footer className="report-document-footer"><FileText size={16} /><p><strong>Working local preview — not an issued engineering document.</strong> Input values, calculated results, units, and traceability metadata only; no standards PDF or copyrighted table is included.</p></footer>
    </article></div></section></div> : null}

    {approvalOpen && record ? <div className="modal-backdrop approval-backdrop" role="presentation"><section className="modal-card approval-modal" role="dialog" aria-modal="true" aria-labelledby="api653-approval-title"><div className="modal-heading"><div><p className="eyebrow">Controlled transition</p><h2 id="api653-approval-title">Approve API 653 revision</h2><p>{reportNumber}</p></div><button className="icon-button" onClick={() => setApprovalOpen(false)} aria-label="Close API 653 approval"><X size={19} /></button></div><div className="reviewer-form-grid"><label><span>Approver name *</span><input value={approverName} onChange={(event) => setApproverName(event.target.value)} autoComplete="name" /></label><label className="full"><span>Approval notes</span><textarea value={approvalNotes} onChange={(event) => setApprovalNotes(event.target.value)} rows={4} /></label></div><label className={`review-confirmation ${approvalConfirmed ? "is-checked" : ""}`}><input type="checkbox" checked={approvalConfirmed} onChange={(event) => setApprovalConfirmed(event.target.checked)} /><span><b>{approvalConfirmed ? <Check size={17} /> : null}</b><strong>I confirm this reviewed revision is the intended local approval record.</strong><small>Approval remains subject to the organization’s document-control process.</small></span></label><div className="modal-actions"><button className="secondary-button" onClick={() => setApprovalOpen(false)}>Cancel</button><button className="primary-button" onClick={submitApproval} disabled={!approverName.trim() || !approvalConfirmed}><ShieldCheck size={17} /> Approve locally</button></div></section></div> : null}
  </>;
}

function ReportSection({ index, eyebrow, title, rows, className = "" }: { index: string; eyebrow: string; title: string; rows: Api653ReportRow[]; className?: string }) {
  return <section className={`report-section ${className}`}><div className="report-section-title"><span>{index}</span><div><p>{eyebrow}</p><h2>{title}</h2></div></div><div className="report-row-grid">{rows.map((row) => <ReportRow key={row.label} {...row} />)}</div></section>;
}
function ReportRow({ label, value, primary = false }: Api653ReportRow) {
  return <div className={`report-data-row ${primary ? "is-primary" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}
