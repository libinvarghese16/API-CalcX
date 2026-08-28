import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BookOpenText,
  ChevronDown,
  CircleAlert,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  API571_DATA_URL,
  API571_SECTION_DEFINITIONS,
  filterApi571DamageMechanisms,
  parseApi571DamageMechanisms,
} from "./api571-damage-mechanisms.ts";
import type { Api571DamageMechanism } from "./api571-damage-mechanisms.ts";

const engineeringHighlights = /(-?\d+(?:\.\d+)?\s*°\s*[CF]|(?:>=|<=|>|<)?\s*-?\d+(?:\.\d+)?\s*(?:%|ppm|psi|kPa|MPa|bar|mpy|mils\/yr|mm\/yr|in\/yr|ft\/s|m\/s)|carbon steel|low[- ]alloy steels?|stainless steels?|austenitic stainless steels?|ferritic stainless steels?|martensitic stainless steels?|duplex stainless steels?|300 series SS|400 series SS|nickel(?:-based)? alloys?|copper(?:-zinc)? alloys?|cast irons?|cladding|lining|HAZ|heat affected zone|weld(?:s|ed)?|nozzles?|elbows?|deadlegs?|overhead(?: line)?|shell(?: course)?|bottom(?: plate)?|exchangers?|reboilers?|furnace(?: tube)?s?|reactors?|columns?|separators?|SCC|HIC|SOHIC|SSC|embrittlement|brittle fracture|crack(?:ing)?|rupture|pitting|blistering|erosion-?corrosion|corrosion fatigue|intergranular|transgranular|wet H2S damage)/giu;

function highlightedText(value: string): ReactNode[] {
  return value.split(engineeringHighlights).filter(Boolean).map((part, index) => {
    engineeringHighlights.lastIndex = 0;
    return engineeringHighlights.test(part) ? <strong key={`${index}-${part}`}>{part}</strong> : part;
  });
}

function DamageMechanismCard({ mechanism }: { mechanism: Api571DamageMechanism }) {
  return (
    <details className="api571-dm-card" id={`api571-dm-${mechanism.id.replace(/[^a-z0-9.-]/giu, "-")}`}>
      <summary className="api571-dm-summary">
        <div className="api571-dm-summary-main">
          <p className="eyebrow">{mechanism.article}</p>
          <h2><strong>{mechanism.id}</strong> {mechanism.title}</h2>
        </div>
        <span className="api571-dm-toggle-state"><span className="api571-toggle-closed">View details</span><span className="api571-toggle-open">Close details</span><ChevronDown size={18} /></span>
      </summary>
      <div className="api571-dm-body">
        {API571_SECTION_DEFINITIONS.map(({ key, label }, sectionIndex) => (
          <section className="api571-dm-block" key={key}>
            <div className="api571-dm-block-heading"><span>{String(sectionIndex + 1).padStart(2, "0")}</span><h3>{label}</h3></div>
            <ul>
              {mechanism.sections[key].map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{highlightedText(item)}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}

export function Api571DamageMechanisms({ onBack }: { onBack: () => void }) {
  const [mechanisms, setMechanisms] = useState<Api571DamageMechanism[]>([]);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(null);
    fetch(API571_DATA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`API 571 data request failed (${response.status}).`);
        return response.json() as Promise<unknown>;
      })
      .then((data) => setMechanisms(parseApi571DamageMechanisms(data)))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "API 571 data could not be loaded.");
      });
    return () => controller.abort();
  }, [loadAttempt]);

  const filteredMechanisms = useMemo(
    () => filterApi571DamageMechanisms(mechanisms, query),
    [mechanisms, query],
  );
  const countLabel = query.trim()
    ? `${filteredMechanisms.length} of ${mechanisms.length} mechanisms`
    : `${mechanisms.length} mechanisms`;

  return (
    <div className="calculator-page api571-page">
      <header className="calculator-header api571-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Calculator library</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 571 · Corrosion and materials</p>
            <h1>Damage mechanisms</h1>
            <p>Detailed article-by-article mechanism guidance from 3.1 to 3.67 with a field-ready inspection focus.</p>
          </div>
          <div className="calculator-actions"><span className="save-state-badge api571-reference-badge"><BookOpenText size={14} /> Text reference</span></div>
        </div>
      </header>

      <main className="api571-workspace">
        <section className="api571-library-intro">
          <div className="api571-intro-mark"><ShieldCheck size={22} /></div>
          <div><p className="eyebrow">API 571 D M</p><h2>Damage mechanism library</h2><p>Search the complete master-site reference by article, mechanism, material, equipment location, morphology, inspection method, or related mechanism.</p></div>
          <div className="api571-library-stat"><strong>{mechanisms.length || "—"}</strong><span>articles</span></div>
        </section>

        <section className="api571-search-card" aria-label="Find a damage mechanism">
          <label className="api571-search-box">
            <Search size={20} />
            <span><small>Find mechanism</small><input ref={searchInput} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search article, mechanism, material, location, failure mode" autoComplete="off" /></span>
            {query ? <button type="button" onClick={() => { setQuery(""); searchInput.current?.focus(); }} aria-label="Clear mechanism search"><X size={18} /></button> : null}
          </label>
          <button className="primary-button api571-search-action" type="button" onClick={() => searchInput.current?.focus()}>Search</button>
          <span className="api571-visible-count" aria-live="polite">{countLabel}</span>
        </section>

        {loadError ? (
          <section className="empty-state api571-load-state"><CircleAlert size={30} /><h2>Damage mechanism library unavailable</h2><p>{loadError}</p><button className="secondary-button" onClick={() => setLoadAttempt((value) => value + 1)}>Try again</button></section>
        ) : !mechanisms.length ? (
          <section className="empty-state api571-load-state"><BookOpenText size={30} /><h2>Loading 67 damage mechanisms</h2><p>Preparing the complete offline text reference.</p></section>
        ) : filteredMechanisms.length ? (
          <div className="api571-dm-list">{filteredMechanisms.map((mechanism) => <DamageMechanismCard key={mechanism.id} mechanism={mechanism} />)}</div>
        ) : (
          <section className="empty-state api571-load-state"><Search size={30} /><h2>No mechanism matched</h2><p>Try an article number, material, equipment type, damage morphology, or inspection method.</p><button className="secondary-button" onClick={() => setQuery("")}>Clear search</button></section>
        )}
      </main>
    </div>
  );
}
