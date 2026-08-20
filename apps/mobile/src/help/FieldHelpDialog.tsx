import { Info, X } from "lucide-react";

export interface FieldHelpContent {
  title: string;
  body: string;
}

export function FieldHelpDialog({ content, onClose }: { content: FieldHelpContent; onClose: () => void }) {
  return (
    <div className="field-help-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="field-help-dialog" role="dialog" aria-modal="true" aria-labelledby="field-help-title">
        <div className="field-help-icon"><Info size={20} /></div>
        <div><p className="eyebrow">Field guidance</p><h2 id="field-help-title">{content.title}</h2><p>{content.body}</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Close field help"><X size={18} /></button>
      </section>
    </div>
  );
}
