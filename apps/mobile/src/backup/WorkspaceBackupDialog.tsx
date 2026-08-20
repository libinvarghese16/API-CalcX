import { Check, CircleCheck, ClipboardPaste, Download, FileJson, HardDrive, ShieldCheck, TriangleAlert, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { WorkspaceBackupPreview, WorkspaceImportResult } from "../local-data/models.ts";

export function WorkspaceBackupDialog({ projectCount, onClose, onExportWorkspace, onPreviewBackup, onImportBackup, notify }: {
  projectCount: number;
  onClose: () => void;
  onExportWorkspace: () => void;
  onPreviewBackup: (raw: string) => WorkspaceBackupPreview;
  onImportBackup: (raw: string) => WorkspaceImportResult;
  notify: (message: string) => void;
}) {
  const [preview, setPreview] = useState<WorkspaceBackupPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedRaw, setPastedRaw] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const inspectRaw = (raw: string, sourceName: string) => {
    setPreview(null);
    setConfirmed(false);
    setError("");
    setFileName(sourceName);
    if (raw.length > 5 * 1024 * 1024) {
      setError("Backup content is limited to 5 MB for this local milestone.");
      return;
    }
    try {
      setPreview(onPreviewBackup(raw));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The backup could not be inspected.");
    }
  };

  const inspectFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Backup files are limited to 5 MB for this local milestone.");
      return;
    }
    try {
      inspectRaw(await file.text(), file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The backup could not be inspected.");
    }
  };

  const importSelected = () => {
    if (!preview) return;
    try {
      const result = onImportBackup(preview.raw);
      notify(result.addedProjects || result.addedEquipment || result.addedCalculations
        ? `Backup merged: ${result.addedProjects} project, ${result.addedEquipment} equipment and ${result.addedCalculations} calculation record additions.`
        : "Backup checked safely. No missing records were found and nothing was overwritten.");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The backup could not be imported.");
    }
  };

  return (
    <div className="modal-backdrop backup-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card backup-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-backup-title">
        <div className="modal-heading"><div><p className="eyebrow">Local data protection</p><h2 id="workspace-backup-title">Backup and restore</h2><p>Export a versioned JSON copy or inspect a backup before safely merging records into this device.</p></div><button className="icon-button" onClick={onClose} aria-label="Close backup and restore"><X size={19} /></button></div>

        <div className="backup-action-grid">
          <article><div className="backup-action-icon"><Download size={20} /></div><span><p className="eyebrow">Export</p><h3>Workspace backup</h3><small>{projectCount} local project{projectCount === 1 ? "" : "s"}, with equipment, calculations, workflow history and result snapshots.</small></span><button className="secondary-button" onClick={onExportWorkspace} disabled={projectCount === 0}><Download size={16} /> Download JSON</button></article>
          <article><div className="backup-action-icon"><Upload size={20} /></div><span><p className="eyebrow">Restore</p><h3>Inspect backup file</h3><small>Validation runs before import. Existing record IDs remain untouched and duplicate calculations are skipped.</small></span><div className="backup-source-actions"><label className="secondary-button backup-file-button"><FileJson size={16} /> Choose JSON<input type="file" accept="application/json,.json" onChange={(event) => void inspectFile(event.target.files?.[0])} /></label><button className="secondary-button" onClick={() => setPasteOpen((current) => !current)}><ClipboardPaste size={16} /> {pasteOpen ? "Hide paste" : "Paste JSON"}</button></div></article>
        </div>

        {pasteOpen ? <section className="backup-paste-panel"><label><span>Paste backup JSON</span><textarea value={pastedRaw} onChange={(event) => setPastedRaw(event.target.value)} placeholder="Paste the complete API Calc Pro backup content here." rows={5} /></label><button className="secondary-button" onClick={() => inspectRaw(pastedRaw, "Pasted backup JSON")} disabled={!pastedRaw.trim()}><ShieldCheck size={16} /> Inspect pasted backup</button></section> : null}

        {error ? <div className="backup-error" role="alert"><TriangleAlert size={18} /><span><strong>Backup not accepted</strong><small>{error}</small></span></div> : null}

        {preview ? <section className="backup-preview"><div className="backup-preview-heading"><div><CircleCheck size={19} /><span><strong>Validated API Calc Pro backup</strong><small>{fileName} · {preview.scope === "project" ? "Single project" : "Complete workspace"} · {new Date(preview.exportedAt).toLocaleString()}</small></span></div><b>SAFE MERGE</b></div><div className="backup-stat-grid"><span><small>Projects</small><strong>{preview.projectCount}</strong></span><span><small>Equipment</small><strong>{preview.equipmentCount}</strong></span><span><small>Calculations</small><strong>{preview.calculationCount}</strong></span><span><small>New projects</small><strong>{preview.addedProjects}</strong></span><span><small>New equipment</small><strong>{preview.addedEquipment}</strong></span><span><small>New calculations</small><strong>{preview.addedCalculations}</strong></span></div><div className="backup-merge-note"><ShieldCheck size={17} /><p><strong>Local records win conflicts.</strong> {preview.matchedProjects} project ID match{preview.matchedProjects === 1 ? "" : "es"} and {preview.duplicateCalculations} duplicate calculation{preview.duplicateCalculations === 1 ? "" : "s"} will be preserved without overwrite.</p></div><label className={`review-confirmation ${confirmed ? "is-checked" : ""}`}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><b>{confirmed ? <Check size={17} /> : null}</b><strong>I reviewed the backup summary and want to merge only missing records.</strong><small>This action does not replace or delete the projects already stored on this device.</small></span></label></section> : <div className="backup-empty"><HardDrive size={23} /><span><strong>No backup selected</strong><small>Choose a JSON backup to see its contents and merge impact before importing.</small></span></div>}

        <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Close</button><button className="primary-button" onClick={importSelected} disabled={!preview || !confirmed}><Upload size={17} /> Merge missing records</button></div>
      </section>
    </div>
  );
}
