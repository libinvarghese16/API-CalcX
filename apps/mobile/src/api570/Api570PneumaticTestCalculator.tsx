import { useMemo, useState } from "react";
import {
  calculateApi570PneumaticTest,
  convertBetweenUnits,
  convertFromSI,
  convertUnitToSI,
  defaultUnitForSystem,
  listEngineeringUnitOptions,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type { Api570PneumaticTestCode, Api570PneumaticTestInputSI, EngineeringUnit, UnitSystem } from "@api-calc-pro/calc-engine";
import { ArrowLeft, CircleCheck, Gauge, Info, RotateCcw, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { formatDisplayNumber } from "../display-precision.ts";
import { Api570RecordWorkflow } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570CalculatorWorkflowProps, Api570WorkflowReportDefinition } from "./Api570PipingRecordWorkflow.tsx";
import type { Api570PneumaticTestInputSnapshot } from "../local-data/models.ts";

const pressureUnits = listEngineeringUnitOptions("pressure");

function numberFrom(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : "";
}

function formatPressure(valueMpa: number, unitSystem: UnitSystem): string {
  const converted = convertFromSI(valueMpa, "pressure", unitSystem);
  return formatDisplayNumber(converted);
}

export function Api570PneumaticTestCalculator({ onBack, onNeedProject, notify, projects, initialCalculation, onSave, onReview, onApprove }: Api570CalculatorWorkflowProps) {
  const initialInputs = initialCalculation?.inputs.calculatorId === "pneumatic-test" ? initialCalculation.inputs : undefined;
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialInputs?.unitSystem ?? "metric");
  const [pipingCode, setPipingCode] = useState<Api570PneumaticTestCode>(initialInputs?.pipingCode ?? "asme-b31.3");
  const [testFactor, setTestFactor] = useState(initialInputs?.testFactor ?? "1.2");
  const [designPressure, setDesignPressure] = useState(initialInputs?.designPressure ?? "2.5");
  const [designPressureUnit, setDesignPressureUnit] = useState<EngineeringUnit>(initialInputs?.designPressureUnit ?? "MPa");

  const designPressureMpa = convertUnitToSI(numberFrom(designPressure), "pressure", designPressureUnit);
  const input = useMemo<Api570PneumaticTestInputSI>(() => ({ pipingCode, designPressureMpa, testFactor: pipingCode === "asme-b31.3" ? undefined : numberFrom(testFactor) }), [designPressureMpa, pipingCode, testFactor]);
  const result = useMemo(() => calculateApi570PneumaticTest(input), [input]);
  const inputSnapshot = useMemo<Api570PneumaticTestInputSnapshot>(() => ({ calculatorId: "pneumatic-test", unitSystem, pipingCode, testFactor, designPressure, designPressureUnit, engineInput: input }), [designPressure, designPressureUnit, input, pipingCode, testFactor, unitSystem]);
  const reportDefinition: Api570WorkflowReportDefinition = { reportKind: "Pneumatic test calculation report", basisTitle: "Pneumatic test basis", inspectionTitle: "Pressure input", summaryLines: [`Selected pneumatic test pressure: ${formatDisplayNumber(result.pneumaticTestPressureMpa)} MPa`], basisRows: [{ label: "Code basis", value: result.codeLabel }, { label: "Test factor used", value: `${formatDisplayNumber(result.testFactorUsed)} × P` }], inspectionRows: [{ label: "Entered pressure", value: `${designPressure} ${unitSymbol(designPressureUnit)}` }, { label: "Design pressure used", value: `${formatDisplayNumber(result.designPressureMpaUsed)} MPa` }], resultRows: [{ label: "Selected test pressure", value: `${formatDisplayNumber(result.pneumaticTestPressureMpa)} MPa`, primary: true }, { label: "Minimum test pressure", value: `${formatDisplayNumber(result.minimumPneumaticTestPressureMpa)} MPa` }, { label: "Maximum test pressure", value: `${formatDisplayNumber(result.maximumPneumaticTestPressureMpa)} MPa` }] };
  const error = result.issues.find((issue) => issue.severity === "error");
  const warning = result.issues.find((issue) => issue.severity === "warning");

  const changePressureUnit = (nextUnit: EngineeringUnit) => {
    const parsed = Number(designPressure);
    if (Number.isFinite(parsed) && designPressure.trim()) {
      setDesignPressure(formatInput(convertBetweenUnits(parsed, "pressure", designPressureUnit, nextUnit)));
    }
    setDesignPressureUnit(nextUnit);
  };

  const changeUnitSystem = (nextSystem: UnitSystem) => {
    const nextUnit = defaultUnitForSystem("pressure", nextSystem);
    const parsed = Number(designPressure);
    if (Number.isFinite(parsed) && designPressure.trim()) {
      setDesignPressure(formatInput(convertBetweenUnits(parsed, "pressure", designPressureUnit, nextUnit)));
    }
    setDesignPressureUnit(nextUnit);
    setUnitSystem(nextSystem);
  };

  const reset = () => {
    setUnitSystem("metric");
    setPipingCode("asme-b31.3");
    setTestFactor("1.2");
    setDesignPressure("2.5");
    setDesignPressureUnit("MPa");
  };

  const resultUnit = unitSymbol(defaultUnitForSystem("pressure", unitSystem));
  const resultDisplay = formatPressure(result.pneumaticTestPressureMpa, unitSystem);

  return (
    <div className="calculator-page api570-pneumatic-test-page">
      <header className="calculator-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Other Piping Calculations</button>
        <div className="calculator-heading-row">
          <div>
            <p className="eyebrow">API 570 · Other Piping Calculation 5 of 8</p>
            <h1>Pneumatic Test Pressure</h1>
            <p>Code-routed B31.3 or B31.1 pneumatic test-pressure calculation with live mixed-unit entry.</p>
          </div>
          <div className="calculator-actions">
            <span className="save-state-badge"><CircleCheck size={14} /> Original-web parity</span>
            <Api570RecordWorkflow calculatorId="pneumatic-test" calculatorLabel="Pneumatic Test" defaultAssetTag="P-101-PT" defaultAssetName="Piping pneumatic test" defaultTitle="API 570 pneumatic test assessment" reportDefinition={reportDefinition} projects={projects} record={initialCalculation} inputSnapshot={inputSnapshot} result={result} onSave={onSave} onReview={onReview} onApprove={onApprove} onNeedProject={onNeedProject} notify={notify} />
            <button className="secondary-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
        </div>
        <div className="step-line" aria-label="Calculation workflow">
          <button className="complete"><b>1</b> Basis</button><i />
          <button className="complete"><b>2</b> Pressure</button><i />
          <button className="active"><b>3</b> Result</button>
        </div>
      </header>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card">
            <div className="form-card-heading">
              <div><span>01</span><div><h2>Calculation basis</h2><p>Select the governing piping code and preferred result units.</p></div></div>
              <Wrench size={19} />
            </div>
            <div className="form-grid">
              <label className="field"><span>Piping code basis</span><select aria-label="Piping code basis" className="select-control native-select" value={pipingCode} onChange={(event) => { const next = event.target.value as Api570PneumaticTestCode; setPipingCode(next); if (next === "asme-b31.1" && !(numberFrom(testFactor) >= 1.2 && numberFrom(testFactor) <= 1.5)) setTestFactor("1.2"); }}><option value="asme-b31.3">ASME B31.3 · 1.10 × P</option><option value="asme-b31.1">ASME B31.1 · 1.20–1.50 × P</option><option value="manual-controlled">Controlled project factor</option></select><small>The code route controls the permitted pressure factor; component limits and the approved procedure still govern.</small></label>
              <label className="field automatic-field"><span>Selected test factor<button type="button" title="B31.3 is fixed at 1.10. B31.1 requires a selected factor from 1.20 through 1.50. Manual mode requires a controlled project value." aria-label="Selected test factor help">?</button></span><div className={`number-control is-derived ${pipingCode === "asme-b31.3" ? "" : "is-manual"}`}><input aria-label="Selected test factor" type="number" inputMode="decimal" value={pipingCode === "asme-b31.3" ? "1.1" : testFactor} readOnly={pipingCode === "asme-b31.3"} onChange={(event) => setTestFactor(event.target.value)} /><b>× P</b></div><small>{pipingCode === "asme-b31.3" ? "Automatically fixed at 1.10 for this route." : pipingCode === "asme-b31.1" ? "Enter a value from 1.20 through 1.50; verify component limits." : "Enter the factor from the controlled construction-code basis."}</small></label>
              <label className="field">
                <span>Unit system</span>
                <select aria-label="Unit system" className="select-control native-select" value={unitSystem} onChange={(event) => changeUnitSystem(event.target.value as UnitSystem)}>
                  <option value="metric">Metric · MPa</option>
                  <option value="us-customary">U.S. customary · psi</option>
                </select>
                <small>The featured result follows this selection while the input keeps its own unit picker.</small>
              </label>
            </div>
            <div className="form-note is-valid">
              <ShieldCheck size={17} />
              <p><strong>Protected equation verified.</strong> Equivalent MPa, bar and psi inputs reproduce the same full-precision SI result before display formatting.</p>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading">
              <div><span>02</span><div><h2>Design pressure</h2><p>Enter the site value directly in the unit in which it was collected.</p></div></div>
              <Gauge size={19} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Design pressure P<button type="button" title="Positive design pressure multiplied by the selected code-routed factor." aria-label="Design pressure P help">?</button></span>
                <div className="number-control">
                  <input aria-label="Design pressure P" type="number" inputMode="decimal" value={designPressure} onChange={(event) => setDesignPressure(event.target.value)} />
                  <select className="unit-picker" aria-label="Design pressure P unit" value={designPressureUnit} onChange={(event) => changePressureUnit(event.target.value as EngineeringUnit)}>
                    {pressureUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <small>Must be greater than zero. Unit changes preserve the same physical pressure.</small>
              </label>
            </div>
            <div className="unit-system-note">
              <Info size={17} />
              <p><strong>Live conversion is active.</strong> The selected field unit is normalized into MPa before the engine runs; the result is then displayed in <b>{unitSystem === "metric" ? "Metric" : "U.S. customary"}</b> units.</p>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-heading">
              <div><ShieldCheck size={18} /><div><span>Original explanatory reference</span><h3>Before using a pneumatic test pressure</h3></div></div>
              <span>No standards PDF</span>
            </div>
            <p>Confirm the governing code edition, test-medium safety controls, temperature, component limits, stored-energy risk and approved test procedure. This calculator reproduces the audited pressure equation only; it is not a test authorization.</p>
            <div className="reference-points">
              <span><b>01</b>Confirm design pressure and test basis.</span>
              <span><b>02</b>Verify component and assembly limits.</span>
              <span><b>03</b>Use an approved site test procedure.</span>
            </div>
          </section>
        </div>

        <aside className="result-column">
          <section className="result-card">
            <div className="result-card-top"><Gauge size={17} /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <p>Selected pneumatic test pressure</p>
            <div className="result-value"><strong>{resultDisplay}</strong><span>{resultUnit}</span></div>
            <div className="result-comparison">
              <span>Design pressure<strong>{formatPressure(result.designPressureMpaUsed, unitSystem)} {resultUnit}</strong></span>
              <span>Test factor used<strong>{formatDisplayNumber(result.testFactorUsed)} × P</strong></span>
            </div>
            <div className={`result-status ${result.ok && !warning ? "is-valid" : ""}`}>
              {result.ok && !warning ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              <div>
                <strong>{error ? "Resolve input issue" : warning ? "Manual code basis requires review" : "Calculation completed"}</strong>
                <span>{error?.message ?? warning?.message ?? "Review the code basis, component limits, and calculated pneumatic test pressure before use."}</span>
              </div>
            </div>
          </section>
          <section className="trace-card">
            <p className="eyebrow">Supporting results</p>
            <h3>Calculation details</h3>
            <div><span>Code basis</span><strong>{result.codeLabel}</strong></div>
            <div><span>Factor used</span><strong>{formatDisplayNumber(result.testFactorUsed)} × P</strong></div>
            <div><span>Design pressure used</span><strong>{formatDisplayNumber(result.designPressureMpaUsed)} MPa</strong></div>
            <div><span>Selected test pressure</span><strong>{formatDisplayNumber(result.pneumaticTestPressureMpa)} MPa</strong></div>
            <div><span>Minimum test pressure</span><strong>{formatDisplayNumber(result.minimumPneumaticTestPressureMpa)} MPa</strong></div>
            <div><span>Maximum test pressure</span><strong>{formatDisplayNumber(result.maximumPneumaticTestPressureMpa)} MPa</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
