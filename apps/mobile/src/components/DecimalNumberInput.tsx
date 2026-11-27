import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";

/** Display formatting only. Always send the user's raw input to the existing calculator. */
export const DecimalNumberInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { decimals?: number }>(
  function DecimalNumberInput({ value, decimals, onFocus, onBlur, onChange, ...props }, ref) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const label = props["aria-label"] ?? "";
    // Calendar years and discrete counts are identifiers, not decimal measurements.
    const places = decimals ?? (/corrosion.*rate|\bUPr\b|\bStPr\b/i.test(label) ? 3 : /^(Build year|Previous inspection year)$|number of|count$/i.test(label) ? 0 : 2);
    const numeric = typeof value === "number" || typeof value === "string" && value.trim() !== "";
    const formatted = numeric && Number.isFinite(Number(value)) ? Number(value).toFixed(places) : value;
    return <input {...props} ref={ref} type="number" value={editing && !props.readOnly ? draft : formatted}
      onFocus={event => { setDraft(event.currentTarget.value); setEditing(true); onFocus?.(event); }}
      onBlur={event => { setEditing(false); onBlur?.(event); }}
      onChange={event => { setDraft(event.target.value); onChange?.(event); }} />;
  },
);
