import { useEffect, useState } from "react";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function useCurrentMonth() {
  const read = () => { const now = new Date(); return { currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1 }; };
  const [date, setDate] = useState(read);
  useEffect(() => {
    const timer = window.setInterval(() => setDate(previous => { const next = read(); return next.currentYear === previous.currentYear && next.currentMonth === previous.currentMonth ? previous : next; }), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return date;
}

export function serviceDateHelp(month: string, currentYear: number, currentMonth: number) {
  return `As of ${MONTH_NAMES[currentMonth - 1]} ${currentYear}. ${month ? "Elapsed months ÷ 12; no assumed day." : "Month unknown: existing year-only basis retained."}`;
}

export function MonthYearField({ label, value, month, onChange, onMonthChange, currentYear, currentMonth }: {
  label: string; value: string; month: string; onChange: (value: string) => void; onMonthChange: (value: string) => void; currentYear: number; currentMonth: number;
}) {
  return <label className="field"><span>{label}</span><div className="number-control service-date-control">
    <input aria-label={label} type="number" inputMode="numeric" min={1900} max={currentYear} step={1} value={value} onChange={event => onChange(event.target.value)} />
    <select aria-label={label.replace(/year/i, "month")} value={month} onChange={event => onMonthChange(event.target.value)}><option value="">Month unknown</option>{MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select>
  </div><small>{serviceDateHelp(month, currentYear, currentMonth)}</small></label>;
}
