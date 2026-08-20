import { ArrowLeft, ChevronRight } from "lucide-react";
import { API570_SUPPORT_TOOLS } from "./api570-support-tools.ts";

export function Api570SupportLibrary({
  onBack,
  openPressureDesign,
  openValveFittings,
  openHydroTest,
  openFlangeHydroTest,
  openPneumaticTest,
  openFilletWeld,
  openTensionTest,
  openSoilResistivity,
}: {
  onBack: () => void;
  openPressureDesign: () => void;
  openValveFittings: () => void;
  openHydroTest: () => void;
  openFlangeHydroTest: () => void;
  openPneumaticTest: () => void;
  openFilletWeld: () => void;
  openTensionTest: () => void;
  openSoilResistivity: () => void;
}) {
  const handlers = {
    "pressure-design": openPressureDesign,
    "valve-flanged-fittings": openValveFittings,
    "hydro-test": openHydroTest,
    "flange-hydro-test": openFlangeHydroTest,
    "pneumatic-test": openPneumaticTest,
    "fillet-weld": openFilletWeld,
    "tension-test": openTensionTest,
    "soil-resistivity": openSoilResistivity,
  } as const;

  return (
    <div className="calculator-page api570-support-library-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> API 570 calculators</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Individual engineering tools</p>
            <h1>Other Piping Calculations</h1>
            <p>Pressure design, fittings, pressure tests, weld sizing, tension testing, and soil resistivity.</p>
          </div>
        </div>
      </header>

      <div className="calculator-workspace support-library-workspace">
        <section className="section-block library-section support-library-section">
          <div className="section-heading">
            <div><p className="eyebrow">Piping calculation tools</p><h2>Choose a calculation</h2></div>
          </div>
          <p className="library-intro">Select a focused engineering tool. References and formula identities remain visible inside each calculation.</p>
          <div className="calculator-list-grid api570-library-grid support-tool-grid">
            {API570_SUPPORT_TOOLS.map((tool, index) => {
              const openTool = handlers[tool.id as keyof typeof handlers];
              return (
                <button
                  className="calculator-list-card api570-calculator-card"
                  key={tool.id}
                  onClick={openTool}
                  disabled={!openTool}
                >
                  <div className="list-index">{String(index + 1).padStart(2, "0")}</div>
                  <div><strong>{tool.title}</strong><span>{tool.summary}</span><em>{tool.reference} · {tool.formula}</em></div>
                  <ChevronRight size={18} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
