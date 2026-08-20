import { useEffect, useMemo, useState } from "react";
import { Check, CircleCheck, Clipboard, FileText, HardDrive, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { createApi570CalculationFingerprint } from "../local-data/calculation-workflow.ts";
import type {
  ApproveApi570CalculationInput,
  Api570CalculatorId,
  Api570InputSnapshot,
  Api570ResultSnapshot,
  Api570PipingInputSnapshot,
  LocalProject,
  ReviewApi570CalculationInput,
  SaveApi570CalculationInput,
  SavedApi570Calculation,
} from "../local-data/models.ts";
import type { Api570PipingResultSI } from "@api-calc-pro/calc-engine";

export interface Api570WorkflowReportRow {
  label: string;
  value: string;
  primary?: boolean;
}

export interface Api570WorkflowReportDefinition {
  reportKind: string;
  basisTitle: string;
  inspectionTitle: string;
  summaryLines: string[];
  basisRows: Api570WorkflowReportRow[];
  inspectionRows: Api570WorkflowReportRow[];
  resultRows: Api570WorkflowReportRow[];
}

export interface Api570CalculatorWorkflowProps {
  onBack: () => void;
  onNeedProject: () => void;
  notify: (message: string) => void;
  projects: LocalProject[];
  initialCalculation: SavedApi570Calculation | null;
  onSave: (input: SaveApi570CalculationInput) => SavedApi570Calculation;
  onReview: (input: ReviewApi570CalculationInput) => SavedApi570Calculation;
  onApprove: (input: ApproveApi570CalculationInput) => SavedApi570Calculation;
}

export interface Api570RecordWorkflowProps {
  calculatorId: Api570CalculatorId;
  calculatorLabel: string;
  defaultAssetTag: string;
  defaultAssetName: string;
  defaultTitle: string;
  reportDefinition: Api570WorkflowReportDefinition;
  projects: LocalProject[];
  record: SavedApi570Calculation | null;
  inputSnapshot: Api570InputSnapshot;
  result: Api570ResultSnapshot;
  onSave: (input: SaveApi570CalculationInput) => SavedApi570Calculation;
  onReview: (input: ReviewApi570CalculationInput) => SavedApi570Calculation;
  onApprove: (input: ApproveApi570CalculationInput) => SavedApi570Calculation;
  onNeedProject: () => void;
  notify: (message: string) => void;
}

function recordFingerprint(record: SavedApi570Calculation): string {
  return createApi570CalculationFingerprint({
    projectId: record.projectId,
    assetTag: record.assetTag,
    assetName: record.assetName,
    title: record.title,
    inputs: record.inputs,
    result: record.result,
  });
}

function formatDate(value?: string): string {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

export function Api570RecordWorkflow({ calculatorId, calculatorLabel, defaultAssetTag, defaultAssetName, defaultTitle, reportDefinition, projects, record, inputSnapshot, result, onSave, onReview, onApprove, onNeedProject, notify }: Api570RecordWorkflowProps) {
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
    setProjectId(record.projectId);
    setAssetTag(record.assetTag);
    setAssetName(record.assetName);
    setTitle(record.title);
    setPreparedBy(record.workflow.preparedBy);
  }, [record]);

  const currentFingerprint = useMemo(() => projectId ? createApi570CalculationFingerprint({
    projectId,
    assetTag,
    assetName,
    title,
    inputs: inputSnapshot,
    result,
  }) : "", [assetName, assetTag, inputSnapshot, projectId, result, title]);
  const dirty = !record || currentFingerprint !== recordFingerprint(record);
  const project = projects.find((candidate) => candidate.id === (record?.projectId ?? projectId));
  const reportNumber = record ? `API570-${record.id.slice(-8).toUpperCase()}-R${record.workflow.revision}` : "API570-LIVE-DRAFT";

  const openSave = () => {
    if (!activeProjects.length && !record) {
      notify("Create a local project before saving this API 570 calculation.");
      onNeedProject();
      return;
    }
    if (!projectId) setProjectId(activeProjects[0]?.id ?? "");
    setSaveOpen(true);
  };

  const saveRecord = () => {
    try {
      const saved = onSave({
        projectId,
        calculationId: record?.projectId === projectId ? record.id : undefined,
        calculatorId,
        assetTag,
        assetName,
        title,
        status: "draft",
        preparedBy,
        changeNote,
        inputs: inputSnapshot,
        result,
      });
      setSaveOpen(false);
      setChangeNote("");
      notify(`${saved.title} saved locally as revision ${saved.workflow.revision}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "API 570 record could not be saved.");
    }
  };

  const openReview = () => {
    if (!record) return notify("Save this API 570 calculation before recording engineering review.");
    if (dirty) return notify("Save the current changes before recording engineering review.");
    if (!result.ok) return notify("Resolve the calculation errors before recording engineering review.");
    if (record.status !== "draft") return notify(`This revision is already ${record.status}.`);
    setReviewOpen(true);
  };

  const submitReview = () => {
    if (!record) return;
    try {
      const reviewed = onReview({ projectId: record.projectId, calculationId: record.id, reviewerName, reviewNotes, fingerprint: recordFingerprint(record) });
      setReviewOpen(false);
      setReviewConfirmed(false);
      notify(`${reviewed.title} recorded as Reviewed.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Review could not be recorded.");
    }
  };

  const submitApproval = () => {
    if (!record) return;
    try {
      const approved = onApprove({ projectId: record.projectId, calculationId: record.id, approverName, approvalNotes, fingerprint: recordFingerprint(record) });
      setApprovalOpen(false);
      setApprovalConfirmed(false);
      notify(`${approved.title} approved locally.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Approval could not be recorded.");
    }
  };

  const reportText = [
    `API CALC PRO — API 570 ${calculatorLabel.toUpperCase()} CALCULATION RECORD`,
    `Report: ${reportNumber}`,
    `Status: ${record?.status ?? "draft"}`,
    `Project: ${project?.name ?? "Unsaved live calculation"}`,
    `Asset: ${assetTag} — ${assetName}`,
    `Title: ${title}`,
    `Prepared by: ${preparedBy || "Not recorded"}`,
    `Reviewed by: ${record?.workflow.reviewedBy || "Pending"}`,
    `Approved by: ${record?.workflow.approvedBy || "Pending"}`,
    `Unit system: ${inputSnapshot.unitSystem === "metric" ? "Metric" : "U.S. customary"}`,
    ...reportDefinition.summaryLines,
    `Engine: ${result.engineId} ${result.engineVersion}`,
    `Issues: ${result.issues.length ? result.issues.map((issue) => issue.message).join(" | ") : "None"}`,
    "Working local record only — not an issued engineering document.",
  ].join("\n");

  return (
    <>
      <span className={`save-state-badge ${dirty ? "is-dirty" : "is-saved"}`}>{dirty ? <TriangleAlert size={14} /> : <CircleCheck size={14} />}{record ? dirty ? "Unsaved changes" : `${record.status} · R${record.workflow.revision}` : "Not saved"}</span>
      <button className="secondary-button" onClick={openSave}><HardDrive size={16} /> {record ? "Update record" : "Save draft"}</button>
      <button className="secondary-button" onClick={openReview}><ShieldCheck size={16} /> Review</button>
      <button className="primary-button report-preview-button" onClick={() => setReportOpen(true)}><FileText size={16} /> Report</button>

      {saveOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaveOpen(false); }}>
        <section className="modal-card save-calculation-modal" role="dialog" aria-modal="true" aria-labelledby="api570-save-title">
          <div className="modal-heading"><div><p className="eyebrow">Offline API 570 project record</p><h2 id="api570-save-title">{record ? `Update ${calculatorLabel.toLowerCase()} calculation` : `Save ${calculatorLabel.toLowerCase()} calculation`}</h2></div><button className="icon-button" onClick={() => setSaveOpen(false)} aria-label="Close API 570 save form"><X size={19} /></button></div>
          <div className="modal-form-grid">
            <label className="modal-field full"><span>Project *</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{activeProjects.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
            <label className="modal-field"><span>Asset / equipment tag *</span><input value={assetTag} onChange={(event) => setAssetTag(event.target.value)} placeholder={defaultAssetTag} /></label>
            <label className="modal-field"><span>Asset name</span><input value={assetName} onChange={(event) => setAssetName(event.target.value)} placeholder={defaultAssetName} /></label>
            <label className="modal-field full"><span>Calculation title *</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="modal-field"><span>Prepared by *</span><input value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} autoComplete="name" /></label>
            <label className="modal-field"><span>Change note</span><input value={changeNote} onChange={(event) => setChangeNote(event.target.value)} placeholder="Reason for this update" /></label>
          </div>
          <div className="modal-note"><HardDrive size={17} /><span>The exact UI inputs, normalized engine input, typed result, units and engine version are stored locally. No PDF is created.</span></div>
          <div className="modal-actions"><button className="secondary-button" onClick={() => setSaveOpen(false)}>Cancel</button><button className="primary-button" onClick={saveRecord} disabled={!projectId || !assetTag.trim() || !title.trim() || !preparedBy.trim()}><CircleCheck size={17} /> Save locally</button></div>
        </section>
      </div> : null}

      {reviewOpen && record ? <div className="modal-backdrop" role="presentation"><section className="modal-card review-modal" role="dialog" aria-modal="true" aria-labelledby="api570-review-title">
        <div className="modal-heading"><div><p className="eyebrow">Controlled engineering check</p><h2 id="api570-review-title">Review API 570 calculation</h2><p>{reportNumber}</p></div><button className="icon-button" onClick={() => setReviewOpen(false)} aria-label="Close API 570 review"><X size={19} /></button></div>
        <div className="reviewer-form-grid"><label><span>Reviewer name *</span><input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} autoComplete="name" /></label><label className="full"><span>Review notes</span><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={4} /></label></div>
        <label className={`review-confirmation ${reviewConfirmed ? "is-checked" : ""}`}><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span><b>{reviewConfirmed ? <Check size={17} /> : null}</b><strong>I confirm the visible inputs, units, equation basis, engine trace and results were reviewed.</strong><small>This local workflow record does not replace the organization’s engineering authority.</small></span></label>
        <div className="modal-actions"><button className="secondary-button" onClick={() => setReviewOpen(false)}>Cancel</button><button className="primary-button" onClick={submitReview} disabled={!reviewerName.trim() || !reviewConfirmed}><ShieldCheck size={17} /> Record review</button></div>
      </section></div> : null}

      {reportOpen ? <div className="report-preview-backdrop" role="presentation"><section className="report-preview-shell" role="dialog" aria-modal="true" aria-labelledby="api570-report-title">
        <header className="report-preview-toolbar"><div><button className="icon-button" onClick={() => setReportOpen(false)} aria-label="Close API 570 report"><X size={19} /></button><div><span>Local text report</span><strong>{reportNumber}</strong></div></div><div>{record?.status === "reviewed" && !dirty ? <button className="secondary-button approve-report-button" onClick={() => setApprovalOpen(true)}><ShieldCheck size={17} /> Approve</button> : null}<button className="primary-button" onClick={() => void copyText(reportText).then(() => notify("API 570 report text copied. No PDF or copyrighted content was created.")).catch(() => notify("Report text could not be copied on this device."))}><Clipboard size={17} /> Copy report text</button></div></header>
        <div className="report-preview-scroll"><article className="report-document">
          <header className="report-document-header"><div className="report-brand"><div><img src="/brand/api-calc-mark.png" alt="" /><span><strong>API Calc Pro</strong><small>Asset integrity calculation record</small></span></div><b>API 570</b></div><div className="report-title-block"><div><p>{reportDefinition.reportKind}</p><h1 id="api570-report-title">{title}</h1><span>{assetTag} · {assetName}</span></div><div className={`report-status-stamp ${result.ok ? "is-valid" : "is-error"} is-${record?.status ?? "draft"}`}><small>Workflow status</small><strong>{(record?.status ?? "draft").toUpperCase()}</strong><span>{reportNumber}</span></div></div><div className="report-meta-strip"><span><small>Project</small><strong>{project?.name ?? "Unsaved live calculation"}</strong></span><span><small>Prepared by</small><strong>{preparedBy || "Not recorded"}</strong></span><span><small>Updated</small><strong>{formatDate(record?.updatedAt)}</strong></span></div></header>
          <section className="report-callout"><div>{result.ok ? <CircleCheck size={22} /> : <TriangleAlert size={22} />}</div><span><strong>{result.ok ? "Calculation engine completed" : "Calculation requires input review"}</strong><p>The report consumes the same structured result object displayed by the calculator.</p></span></section>
          <div className="report-section-grid two-column"><section className="report-section"><div className="report-section-title"><span>01</span><div><p>Calculation basis</p><h2>{reportDefinition.basisTitle}</h2></div></div><div className="report-row-grid">{reportDefinition.basisRows.map((row) => <ReportRow key={row.label} {...row} />)}</div></section><section className="report-section"><div className="report-section-title"><span>02</span><div><p>Inspection history</p><h2>{reportDefinition.inspectionTitle}</h2></div></div><div className="report-row-grid">{reportDefinition.inspectionRows.map((row) => <ReportRow key={row.label} {...row} />)}</div></section></div>
          <section className="report-section result-report-section"><div className="report-section-title"><span>03</span><div><p>Structured engine output</p><h2>Calculated results</h2></div></div><div className="report-row-grid">{reportDefinition.resultRows.map((row) => <ReportRow key={row.label} {...row} />)}</div></section>
          <section className="report-section"><div className="report-section-title"><span>04</span><div><p>Audit information</p><h2>Engine and workflow trace</h2></div></div><div className="report-row-grid"><ReportRow label="Engine ID" value={result.engineId} /><ReportRow label="Engine version" value={result.engineVersion} /><ReportRow label="Revision" value={`R${record?.workflow.revision ?? 0}`} /><ReportRow label="Review" value={record?.workflow.reviewedBy ? `${record.workflow.reviewedBy} · ${formatDate(record.workflow.reviewedAt)}` : "Pending"} /><ReportRow label="Approval" value={record?.workflow.approvedBy ? `${record.workflow.approvedBy} · ${formatDate(record.workflow.approvedAt)}` : "Pending"} /></div>{result.issues.length ? <div className="report-review-list">{result.issues.map((issue) => <div className="is-warning" key={`${issue.code}-${issue.field}`}><TriangleAlert size={17} /><span><strong>{issue.code}</strong><small>{issue.message}</small></span></div>)}</div> : null}</section>
          <footer className="report-document-footer"><FileText size={16} /><p><strong>Working local preview — not an issued engineering document.</strong> Original labels, input values, calculated result text and traceability metadata only; no standards PDF, copied code text or copyrighted table is included.</p></footer>
        </article></div>
      </section></div> : null}

      {approvalOpen && record ? <div className="modal-backdrop approval-backdrop" role="presentation"><section className="modal-card approval-modal" role="dialog" aria-modal="true" aria-labelledby="api570-approval-title"><div className="modal-heading"><div><p className="eyebrow">Controlled transition</p><h2 id="api570-approval-title">Approve API 570 revision</h2><p>{reportNumber}</p></div><button className="icon-button" onClick={() => setApprovalOpen(false)} aria-label="Close API 570 approval"><X size={19} /></button></div><div className="reviewer-form-grid"><label><span>Approver name *</span><input value={approverName} onChange={(event) => setApproverName(event.target.value)} autoComplete="name" /></label><label className="full"><span>Approval notes</span><textarea value={approvalNotes} onChange={(event) => setApprovalNotes(event.target.value)} rows={4} /></label></div><label className={`review-confirmation ${approvalConfirmed ? "is-checked" : ""}`}><input type="checkbox" checked={approvalConfirmed} onChange={(event) => setApprovalConfirmed(event.target.checked)} /><span><b>{approvalConfirmed ? <Check size={17} /> : null}</b><strong>I confirm this reviewed revision is the intended local approval record.</strong><small>Approval remains subject to the organization’s document-control process.</small></span></label><div className="modal-actions"><button className="secondary-button" onClick={() => setApprovalOpen(false)}>Cancel</button><button className="primary-button" onClick={submitApproval} disabled={!approverName.trim() || !approvalConfirmed}><ShieldCheck size={17} /> Approve locally</button></div></section></div> : null}
    </>
  );
}

interface PipingWorkflowProps {
  projects: LocalProject[];
  record: SavedApi570Calculation | null;
  inputSnapshot: Api570PipingInputSnapshot;
  result: Api570PipingResultSI;
  onSave: (input: SaveApi570CalculationInput) => SavedApi570Calculation;
  onReview: (input: ReviewApi570CalculationInput) => SavedApi570Calculation;
  onApprove: (input: ApproveApi570CalculationInput) => SavedApi570Calculation;
  onNeedProject: () => void;
  notify: (message: string) => void;
}

export function Api570PipingRecordWorkflow(props: PipingWorkflowProps) {
  const { inputSnapshot, result } = props;
  const reportDefinition: Api570WorkflowReportDefinition = {
    reportKind: "Piping calculation report",
    basisTitle: "Code and design inputs",
    inspectionTitle: "Thickness and service basis",
    summaryLines: [
      `Piping code: ${result.codeLabel}`,
      `Required thickness: ${formatDisplayNumber(result.requiredThicknessMm)} mm`,
      `Governing MAWP: ${formatDisplayNumber(result.governingMawpMpa)} MPa`,
      `Governing corrosion rate: ${formatDisplayNumber(result.governingCorrosionRateMmPerYear, "corrosion-rate")} mm/yr`,
      `Remaining life: ${formatDisplayNumber(result.remainingLifeYears)} yr`,
    ],
    basisRows: [
      { label: "Piping code", value: result.codeLabel },
      { label: "Design pressure", value: `${formatDisplayNumber(inputSnapshot.engineInput.designPressureMpa)} MPa` },
      { label: "Outside diameter", value: `${formatDisplayNumber(inputSnapshot.engineInput.outsideDiameterMm)} mm` },
      { label: "Allowable stress", value: `${formatDisplayNumber(inputSnapshot.engineInput.allowableStressMpa)} MPa` },
    ],
    inspectionRows: [
      { label: "Original thickness", value: `${formatDisplayNumber(inputSnapshot.engineInput.originalThicknessMm)} mm` },
      { label: "Previous thickness", value: `${formatDisplayNumber(inputSnapshot.engineInput.previousThicknessMm)} mm` },
      { label: "Current thickness", value: `${formatDisplayNumber(inputSnapshot.engineInput.actualThicknessMm)} mm` },
      { label: "Years in service", value: `${inputSnapshot.engineInput.yearsInService} yr` },
    ],
    resultRows: [
      { label: "Required thickness", value: `${formatDisplayNumber(result.requiredThicknessMm)} mm`, primary: true },
      { label: "Minimum thickness used", value: `${formatDisplayNumber(result.minimumThicknessUsedMm)} mm` },
      { label: "Governing corrosion rate", value: `${formatDisplayNumber(result.governingCorrosionRateMmPerYear, "corrosion-rate")} mm/yr` },
      { label: "Remaining life", value: `${formatDisplayNumber(result.remainingLifeYears)} yr` },
      { label: "Governing MAWP", value: `${formatDisplayNumber(result.governingMawpMpa)} MPa`, primary: true },
      { label: "Future MAWP", value: `${formatDisplayNumber(result.futureMawpMpa)} MPa` },
    ],
  };
  return <Api570RecordWorkflow {...props} calculatorId="piping" calculatorLabel="Piping" defaultAssetTag="P-101" defaultAssetName="Piping system" defaultTitle="API 570 piping assessment" reportDefinition={reportDefinition} />;
}

function ReportRow({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return <div className={`report-data-row ${primary ? "is-primary" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}
