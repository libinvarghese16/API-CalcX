import { useMemo, useState } from "react";
import {
  Archive,
  Calculator,
  ChevronRight,
  CircleCheck,
  CloudOff,
  Copy,
  Download,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { Api570CalculatorId, CreateProjectInput, LocalProject, SavedApi510Calculation, SavedApi570Calculation } from "../local-data/models.ts";

interface ProjectsPageProps {
  projects: LocalProject[];
  onCreateProject: (input: CreateProjectInput) => LocalProject;
  onOpenCalculation: (calculation: SavedApi510Calculation) => void;
  onOpenApi570Calculation: (calculation: SavedApi570Calculation) => void;
  onDuplicateCalculation: (projectId: string, equipmentId: string, calculationId: string) => void;
  onDeleteCalculation: (projectId: string, equipmentId: string, calculationId: string) => void;
  onDuplicateApi570Calculation: (projectId: string, calculationId: string) => void;
  onDeleteApi570Calculation: (projectId: string, calculationId: string) => void;
  onArchiveProject: (projectId: string, archived: boolean) => void;
  onDeleteProject: (projectId: string) => void;
  onStartCalculation: () => void;
  onStartApi570Calculation: () => void;
  onExportProject: (projectId: string) => void;
  notify: (message: string) => void;
}

const componentLabels: Record<SavedApi510Calculation["inputs"]["component"], string> = {
  cylindrical: "Cylindrical shell",
  spherical: "Spherical shell",
  ellipsoidal: "Ellipsoidal head",
  torispherical: "Torispherical head",
  hemispherical: "Hemispherical head",
  conical: "Conical head",
  "flat-circular": "Flat circular head",
};

function formatUpdated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

const api570CalculatorLabels: Record<Api570CalculatorId, string> = {
  piping: "Individual piping calculator",
  tube: "Individual tube calculator",
  header: "Individual header calculator",
  "pressure-design": "Pressure design",
  "valve-fittings": "Valve and fittings",
  "hydro-test": "Hydro test",
  "flange-hydro-test": "Flange hydro test",
  "pneumatic-test": "Pneumatic test",
  "fillet-weld": "Fillet weld sizing",
  "tension-test": "Tension test",
  "soil-resistivity": "Soil resistivity",
};

function api570CalculatorLabel(calculation: SavedApi570Calculation): string {
  return api570CalculatorLabels[calculation.calculatorId];
}

export function ProjectsPage({
  projects,
  onCreateProject,
  onOpenCalculation,
  onOpenApi570Calculation,
  onDuplicateCalculation,
  onDeleteCalculation,
  onDuplicateApi570Calculation,
  onDeleteApi570Calculation,
  onArchiveProject,
  onDeleteProject,
  onStartCalculation,
  onStartApi570Calculation,
  onExportProject,
  notify,
}: ProjectsPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [site, setSite] = useState("");
  const [description, setDescription] = useState("");
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const activeProjects = projects.filter((project) => project.status === "active");
  const calculationCount = projects.reduce((projectTotal, project) => projectTotal + project.equipment.reduce((equipmentTotal, equipment) => equipmentTotal + equipment.calculations.length, 0) + project.api570Calculations.length, 0);
  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) => `${project.name} ${project.client} ${project.site} ${project.equipment.map((item) => item.tag).join(" ")} ${project.api570Calculations.map((item) => item.assetTag).join(" ")}`.toLowerCase().includes(normalized));
  }, [projects, query]);

  const submitProject = () => {
    try {
      const created = onCreateProject({ name, client, site, description });
      setName("");
      setClient("");
      setSite("");
      setDescription("");
      setCreateOpen(false);
      setSelectedProjectId(created.id);
      notify(`Project “${created.name}” saved locally.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Project could not be created.");
    }
  };

  return (
    <>
      <div className="summary-grid">
        <ProjectSummary icon={FolderOpen} label="Active projects" value={String(activeProjects.length).padStart(2, "0")} note="Stored on this device" />
        <ProjectSummary icon={Calculator} label="Calculations" value={String(calculationCount).padStart(2, "0")} note="Drafts and completed records" />
        <ProjectSummary icon={CloudOff} label="Cloud status" value="Local" note="No internet service connected" />
      </div>

      <section className="section-block">
        <div className="section-heading projects-heading">
          <div><p className="eyebrow">Equipment records</p><h2>{selectedProject ? selectedProject.name : "Local projects"}</h2></div>
          <div className="project-heading-actions">
            {selectedProject ? <button className="secondary-button" onClick={() => setSelectedProjectId(null)}>All projects</button> : null}
            <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={18} /> Create project</button>
          </div>
        </div>

        {selectedProject ? (
          <ProjectWorkspace
            project={selectedProject}
            onOpenCalculation={onOpenCalculation}
            onOpenApi570Calculation={onOpenApi570Calculation}
            onDuplicateCalculation={onDuplicateCalculation}
            onDeleteCalculation={onDeleteCalculation}
            onDuplicateApi570Calculation={onDuplicateApi570Calculation}
            onDeleteApi570Calculation={onDeleteApi570Calculation}
            onArchiveProject={onArchiveProject}
            onDeleteProject={() => {
              if (!window.confirm(`Delete “${selectedProject.name}” and all of its local calculations? This cannot be undone.`)) return;
              onDeleteProject(selectedProject.id);
              setSelectedProjectId(null);
            }}
            onStartCalculation={onStartCalculation}
            onStartApi570Calculation={onStartApi570Calculation}
            onExportProject={onExportProject}
          />
        ) : (
          <>
            {projects.length > 0 ? (
              <label className="project-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, sites or equipment tags" /></label>
            ) : null}
            {filteredProjects.length > 0 ? (
              <div className="project-grid">
                {filteredProjects.map((project, index) => {
                  const equipmentCount = project.equipment.length + new Set(project.api570Calculations.map((calculation) => calculation.assetTag)).size;
                  const latestEquipment = project.api570Calculations[0]?.assetTag ?? project.equipment[0]?.tag ?? "No equipment yet";
                  return (
                    <button className="project-card" key={project.id} onClick={() => setSelectedProjectId(project.id)}>
                      <div className={`project-illustration project-${(index % 3) + 1}`}><FolderOpen size={26} /></div>
                      <div className="project-card-heading"><div><small>{project.status === "archived" ? "ARCHIVED" : "LOCAL PROJECT"}</small><h3>{project.name}</h3></div><MoreHorizontal size={19} /></div>
                      <p>{equipmentCount} equipment record{equipmentCount === 1 ? "" : "s"}{project.site ? ` · ${project.site}` : ""}</p>
                      <div className="project-footer"><span>Latest equipment</span><strong>{latestEquipment}</strong></div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state project-empty"><FolderOpen size={30} /><h2>{projects.length ? "No matching projects" : "Create your first local project"}</h2><p>{projects.length ? "Try a different project, site or equipment search." : "Projects and API 510/API 570 calculations will remain available after refresh and restart."}</p>{projects.length ? null : <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={18} /> Create project</button>}</div>
            )}
          </>
        )}
      </section>

      {createOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
            <div className="modal-heading"><div><p className="eyebrow">Device workspace</p><h2 id="create-project-title">Create local project</h2></div><button className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close project form"><X size={19} /></button></div>
            <div className="modal-form-grid">
              <ProjectField label="Project name" value={name} onChange={setName} placeholder="North process unit" required />
              <ProjectField label="Client" value={client} onChange={setClient} placeholder="Optional" />
              <ProjectField label="Site or facility" value={site} onChange={setSite} placeholder="Optional" />
              <ProjectField label="Description" value={description} onChange={setDescription} placeholder="Inspection campaign or scope" multiline />
            </div>
            <div className="modal-note"><CloudOff size={17} /><span>This project is saved only on this device. Cloud synchronization is not connected.</span></div>
            <div className="modal-actions"><button className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary-button" onClick={submitProject} disabled={!name.trim()}><CircleCheck size={17} /> Save project</button></div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ProjectWorkspace({ project, onOpenCalculation, onOpenApi570Calculation, onDuplicateCalculation, onDeleteCalculation, onDuplicateApi570Calculation, onDeleteApi570Calculation, onArchiveProject, onDeleteProject, onStartCalculation, onStartApi570Calculation, onExportProject }: {
  project: LocalProject;
  onOpenCalculation: (calculation: SavedApi510Calculation) => void;
  onOpenApi570Calculation: (calculation: SavedApi570Calculation) => void;
  onDuplicateCalculation: (projectId: string, equipmentId: string, calculationId: string) => void;
  onDeleteCalculation: (projectId: string, equipmentId: string, calculationId: string) => void;
  onDuplicateApi570Calculation: (projectId: string, calculationId: string) => void;
  onDeleteApi570Calculation: (projectId: string, calculationId: string) => void;
  onArchiveProject: (projectId: string, archived: boolean) => void;
  onDeleteProject: () => void;
  onStartCalculation: () => void;
  onStartApi570Calculation: () => void;
  onExportProject: (projectId: string) => void;
}) {
  return (
    <div className="project-workspace">
      <div className="project-record-header">
        <div><span>{project.client || "No client recorded"}</span><strong>{project.site || "No site recorded"}</strong><small>Updated {formatUpdated(project.updatedAt)}</small></div>
        <div><button className="secondary-button" onClick={() => onExportProject(project.id)}><Download size={16} /> Export JSON</button><button className="secondary-button" onClick={() => onArchiveProject(project.id, project.status !== "archived")}><Archive size={16} /> {project.status === "archived" ? "Restore" : "Archive"}</button><button className="danger-button" onClick={onDeleteProject}><Trash2 size={16} /> Delete</button></div>
      </div>
      {project.description ? <p className="project-description">{project.description}</p> : null}
      <div className="project-workspace-heading"><div><p className="eyebrow">Calculation history</p><h3>API 510 and API 570 project records</h3></div><div className="project-heading-actions"><button className="secondary-button" onClick={onStartCalculation}><Plus size={17} /> API 510</button><button className="primary-button" onClick={onStartApi570Calculation}><Plus size={17} /> API 570</button></div></div>

      {project.equipment.map((equipment) => (
        <section className="equipment-record" key={equipment.id}>
          <div className="equipment-heading"><div><span>Pressure vessel</span><h3>{equipment.tag}</h3><p>{equipment.name}</p></div><strong>{equipment.calculations.length} record{equipment.calculations.length === 1 ? "" : "s"}</strong></div>
          <div className="calculation-record-list">
            {equipment.calculations.slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map((calculation) => (
              <article className="calculation-record" key={calculation.id}>
                <div className="calculation-record-icon"><FileText size={18} /></div>
                <div><strong>{calculation.title}</strong><span>{componentLabels[calculation.inputs.component]} · {calculation.inputs.unitSystem === "metric" ? "Metric" : "U.S. customary"}</span><small>Updated {formatUpdated(calculation.updatedAt)}</small></div>
                <span className={`record-status ${calculation.status}`}>{calculation.status}</span>
                <div className="calculation-record-actions"><button onClick={() => onOpenCalculation(calculation)}>Open <ChevronRight size={16} /></button><button aria-label={`Duplicate ${calculation.title}`} title="Duplicate" onClick={() => onDuplicateCalculation(project.id, equipment.id, calculation.id)}><Copy size={16} /></button><button aria-label={`Delete ${calculation.title}`} title="Delete" onClick={() => { if (window.confirm(`Delete “${calculation.title}” from this device?`)) onDeleteCalculation(project.id, equipment.id, calculation.id); }}><Trash2 size={16} /></button></div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {project.api570Calculations.length ? <section className="equipment-record api570-project-records">
        <div className="equipment-heading"><div><span>API 570</span><h3>Piping systems</h3><p>Saved piping, tube, header, test, weld, and field calculations</p></div><strong>{project.api570Calculations.length} record{project.api570Calculations.length === 1 ? "" : "s"}</strong></div>
        <div className="calculation-record-list">{project.api570Calculations.slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map((calculation) => <article className="calculation-record" key={calculation.id}>
          <div className="calculation-record-icon"><FileText size={18} /></div>
          <div><strong>{calculation.title}</strong><span>{calculation.assetTag} · {api570CalculatorLabel(calculation)} · {calculation.inputs.unitSystem === "metric" ? "Metric" : "U.S. customary"}</span><small>Updated {formatUpdated(calculation.updatedAt)} · Revision {calculation.workflow.revision}</small></div>
          <span className={`record-status ${calculation.status}`}>{calculation.status}</span>
          <div className="calculation-record-actions"><button onClick={() => onOpenApi570Calculation(calculation)}>Open <ChevronRight size={16} /></button><button aria-label={`Duplicate ${calculation.title}`} title="Duplicate" onClick={() => onDuplicateApi570Calculation(project.id, calculation.id)}><Copy size={16} /></button><button aria-label={`Delete ${calculation.title}`} title="Delete" onClick={() => { if (window.confirm(`Delete “${calculation.title}” from this device?`)) onDeleteApi570Calculation(project.id, calculation.id); }}><Trash2 size={16} /></button></div>
        </article>)}</div>
      </section> : null}

      {!project.equipment.length && !project.api570Calculations.length ? <div className="empty-state project-empty"><Calculator size={29} /><h2>No saved calculations yet</h2><p>Start an API 510 or API 570 calculation and save it under this project.</p><div className="project-heading-actions"><button className="secondary-button" onClick={onStartCalculation}><Plus size={17} /> API 510</button><button className="primary-button" onClick={onStartApi570Calculation}><Plus size={17} /> API 570</button></div></div> : null}
    </div>
  );
}

function ProjectSummary({ icon: Icon, label, value, note }: { icon: typeof FolderOpen; label: string; value: string; note: string }) {
  return <article className="summary-card"><div className="summary-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function ProjectField({ label, value, onChange, placeholder, required = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; multiline?: boolean }) {
  return <label className={`modal-field ${multiline ? "full" : ""}`}><span>{label}{required ? " *" : ""}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}</label>;
}
