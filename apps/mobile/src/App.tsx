import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  calculateConicalHead,
  calculateCylindricalShell,
  calculateEllipsoidalHead,
  calculateFlatCircularHead,
  calculateHemisphericalHead,
  calculateSphericalShell,
  calculateTorisphericalHead,
  convertBetweenUnits,
  convertFromSI,
  convertSIToUnit,
  convertUnitToSI,
  defaultUnitForSystem,
  deriveYearsInService,
  deriveYearsSincePreviousInspection,
  isEngineeringUnitForQuantity,
  listEngineeringUnitOptions,
  listPressureVesselMaterialGrades,
  listPressureVesselMaterialSpecs,
  resolveAutomaticNumericValue,
  resolvePressureVesselAllowableStress,
  unitLabel,
  unitSymbol,
} from "@api-calc-pro/calc-engine";
import type { AutomaticValueMode, EngineeringQuantity, EngineeringUnit, EngineeringUnitOption, UnitSystem } from "@api-calc-pro/calc-engine";
import { AccountSettingsDialog } from "./account/AccountSettingsDialog.tsx";
import type { AccountDialog } from "./account/AccountSettingsDialog.tsx";
import { AccessGate } from "./account/AccessGate.tsx";
import { guestCanAccessPage, modulesForGuestAccess } from "./account/access-policy.ts";
import { authenticationProviderLabel, authenticationUserInitials } from "./account/auth-model.ts";
import { useAuthenticationSession } from "./account/use-auth-session.ts";
import type { AuthenticationSession } from "./account/use-auth-session.ts";
import { WorkspaceBackupDialog } from "./backup/WorkspaceBackupDialog.tsx";
import { API510_CALCULATORS, api510CalculatorFor, filterApi510Calculators } from "./calculators/api510-calculator-library.ts";
import { API570_MOBILE_MODULE, filterApi570MobileWorkspaces } from "./calculators/api570-mobile-scope.ts";
import { API653_MOBILE_MODULE, filterApi653MobileWorkspaces } from "./calculators/api653-mobile-scope.ts";
import { formatDisplayNumber } from "./display-precision.ts";
import { FieldHelpDialog } from "./help/FieldHelpDialog.tsx";
import type { FieldHelpContent } from "./help/FieldHelpDialog.tsx";
import { createCalculationFingerprint } from "./local-data/calculation-workflow.ts";
import { LocalProjectRepository } from "./local-data/project-repository.ts";
import type { Api510InputSnapshot, Api570CalculatorId, ApproveApi570CalculationInput, ApproveCalculationInput, CalculationWorkflow, CalculationWorkflowStatus, CreateProjectInput, LocalEquipment, LocalProject, PressureVesselComponent, ReviewApi570CalculationInput, ReviewCalculationInput, SaveApi570CalculationInput, SaveCalculationInput, SavedApi510Calculation, SavedApi570Calculation, WorkspaceBackupPreview, WorkspaceImportResult } from "./local-data/models.ts";
import { resolveNativeBackAction } from "./native/native-navigation.ts";
import { ProjectsPage } from "./projects/ProjectsPage.tsx";
import { Api510ReportPreview } from "./reports/Api510ReportPreview.tsx";
import { Api510ReviewDialog } from "./reports/Api510ReviewDialog.tsx";
import { createApi510ReportModel } from "./reports/api510-report.ts";
import { UnitConverterDialog } from "./tools/UnitConverterDialog.tsx";
import {
  ArrowLeft,
  BookOpenText,
  Calculator,
  Check,
  ChevronRight,
  CircleCheck,
  Cloud,
  CloudOff,
  FileText,
  FolderOpen,
  Gauge,
  HardDrive,
  History,
  Home,
  Info,
  Layers3,
  LogIn,
  Menu,
  Moon,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TriangleAlert,
  UserRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";

const Api570PipingCalculator = lazy(() => import("./api570/Api570PipingCalculator.tsx").then((module) => ({ default: module.Api570PipingCalculator })));
const Api570TubeCalculator = lazy(() => import("./api570/Api570TubeCalculator.tsx").then((module) => ({ default: module.Api570TubeCalculator })));
const Api570HeaderCalculator = lazy(() => import("./api570/Api570HeaderCalculator.tsx").then((module) => ({ default: module.Api570HeaderCalculator })));
const Api570PressureDesignCalculator = lazy(() => import("./api570/Api570PressureDesignCalculator.tsx").then((module) => ({ default: module.Api570PressureDesignCalculator })));
const Api570SupportLibrary = lazy(() => import("./api570/Api570SupportLibrary.tsx").then((module) => ({ default: module.Api570SupportLibrary })));
const Api570ValveFittingsCalculator = lazy(() => import("./api570/Api570ValveFittingsCalculator.tsx").then((module) => ({ default: module.Api570ValveFittingsCalculator })));
const Api570HydroTestCalculator = lazy(() => import("./api570/Api570HydroTestCalculator.tsx").then((module) => ({ default: module.Api570HydroTestCalculator })));
const Api570FlangeHydroTestCalculator = lazy(() => import("./api570/Api570FlangeHydroTestCalculator.tsx").then((module) => ({ default: module.Api570FlangeHydroTestCalculator })));
const Api570PneumaticTestCalculator = lazy(() => import("./api570/Api570PneumaticTestCalculator.tsx").then((module) => ({ default: module.Api570PneumaticTestCalculator })));
const Api570FilletWeldCalculator = lazy(() => import("./api570/Api570FilletWeldCalculator.tsx").then((module) => ({ default: module.Api570FilletWeldCalculator })));
const Api570TensionTestCalculator = lazy(() => import("./api570/Api570TensionTestCalculator.tsx").then((module) => ({ default: module.Api570TensionTestCalculator })));
const Api570SoilResistivityCalculator = lazy(() => import("./api570/Api570SoilResistivityCalculator.tsx").then((module) => ({ default: module.Api570SoilResistivityCalculator })));
const Api653BottomPlateCalculator = lazy(() => import("./api653/Api653BottomPlateCalculator.tsx").then((module) => ({ default: module.Api653BottomPlateCalculator })));
const Api653AnnularPlateCalculator = lazy(() => import("./api653/Api653AnnularPlateCalculator.tsx").then((module) => ({ default: module.Api653AnnularPlateCalculator })));
const Api653ShellCourseCalculator = lazy(() => import("./api653/Api653ShellCourseCalculator.tsx").then((module) => ({ default: module.Api653ShellCourseCalculator })));
const Api653NozzleCalculator = lazy(() => import("./api653/Api653NozzleCalculator.tsx").then((module) => ({ default: module.Api653NozzleCalculator })));
const Api653RoofPlateCalculator = lazy(() => import("./api653/Api653RoofPlateCalculator.tsx").then((module) => ({ default: module.Api653RoofPlateCalculator })));
const Api653Other432Calculator = lazy(() => import("./api653/Api653Other432Calculator.tsx").then((module) => ({ default: module.Api653Other432Calculator })));
const Api571DamageMechanisms = lazy(() => import("./api571/Api571DamageMechanisms.tsx").then((module) => ({ default: module.Api571DamageMechanisms })));

type Page = "home" | "calculators" | "projects" | "reports" | "account" | "calculator" | "api570-piping" | "api570-tube" | "api570-header" | "api570-support" | "api570-pressure-design" | "api570-valve-fittings" | "api570-hydro-test" | "api570-flange-hydro-test" | "api570-pneumatic-test" | "api570-fillet-weld" | "api570-tension-test" | "api570-soil-resistivity" | "api653-bottom" | "api653-annular" | "api653-shell" | "api653-nozzles" | "api653-roof" | "api653-other-4-3-2" | "api571-damage-mechanisms";
const api570PageByCalculator: Record<Api570CalculatorId, Page> = {
  piping: "api570-piping",
  tube: "api570-tube",
  header: "api570-header",
  "pressure-design": "api570-pressure-design",
  "valve-fittings": "api570-valve-fittings",
  "hydro-test": "api570-hydro-test",
  "flange-hydro-test": "api570-flange-hydro-test",
  "pneumatic-test": "api570-pneumatic-test",
  "fillet-weld": "api570-fillet-weld",
  "tension-test": "api570-tension-test",
  "soil-resistivity": "api570-soil-resistivity",
};
type NavigationPage = Exclude<Page, "calculator" | "api570-piping" | "api570-tube" | "api570-header" | "api570-support" | "api570-pressure-design" | "api570-valve-fittings" | "api570-hydro-test" | "api570-flange-hydro-test" | "api570-pneumatic-test" | "api570-fillet-weld" | "api570-tension-test" | "api570-soil-resistivity" | "api653-bottom" | "api653-annular" | "api653-shell" | "api653-nozzles" | "api653-roof" | "api653-other-4-3-2" | "api571-damage-mechanisms">;
type Theme = "light" | "dark";
type Module = {
  code: string;
  title: string;
  description: string;
  count: string;
  accent: string;
  icon: LucideIcon;
  status?: string;
};

type RecentSavedCalculation = { calculation: SavedApi510Calculation; equipmentTag: string };

const modules: Module[] = [
  {
    code: "API 510",
    title: "Pressure vessels",
    description: "Thickness, MAWP, remaining life and inspection planning.",
    count: "7 validated geometries",
    accent: "blue",
    icon: Gauge,
  },
  {
    code: "API 570",
    title: "Piping systems",
    description: API570_MOBILE_MODULE.description,
    count: API570_MOBILE_MODULE.count,
    accent: "orange",
    icon: Wrench,
    status: API570_MOBILE_MODULE.status,
  },
  {
    code: "API 653",
    title: "Storage tanks",
    description: API653_MOBILE_MODULE.description,
    count: API653_MOBILE_MODULE.count,
    accent: "teal",
    icon: Layers3,
    status: API653_MOBILE_MODULE.status,
  },
  {
    code: "API 571",
    title: "Damage mechanisms",
    description: "Detailed article-by-article guidance for degradation screening and inspection.",
    count: "67 mechanisms",
    accent: "violet",
    icon: BookOpenText,
    status: "Text reference",
  },
];

const modulePreviewNotice = (moduleCode: string) => moduleCode === "API 570"
  ? "API 570 individual calculators are in controlled source audit. Bulk calculation tables are excluded."
  : moduleCode === "API 653"
    ? "API 653 calculator migration has started with the protected-source-validated Bottom Plate workspace."
  : `${moduleCode} module preview will follow the validated calculator workflow.`;

const pressureVesselMaterialSpecs = listPressureVesselMaterialSpecs();
const defaultPressureVesselMaterial = "SA-516";
const defaultPressureVesselGrade = "SA-516|70|176";

function formatConvertedInput(value: number, quantity: EngineeringQuantity, unit: EngineeringUnit): string {
  if (!Number.isFinite(value)) return "";
  const decimalPlaces = quantity === "temperature"
    ? 2
    : unit === "mm"
      ? 3
      : quantity === "length"
        ? 5
        : 3;
  return String(Number(value.toFixed(decimalPlaces)));
}

function resolveInputUnit(value: unknown, quantity: EngineeringQuantity, unitSystem: UnitSystem): EngineeringUnit {
  return isEngineeringUnitForQuantity(value, quantity) ? value : defaultUnitForSystem(quantity, unitSystem);
}

const pressureInputUnitOptions = listEngineeringUnitOptions("pressure");
const lengthInputUnitOptions = listEngineeringUnitOptions("length");
const temperatureInputUnitOptions = listEngineeringUnitOptions("temperature");

const navItems: Array<{ id: NavigationPage; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "calculators", label: "Calculators", icon: Calculator },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "account", label: "Account", icon: UserRound },
];

const pageTitles: Record<NavigationPage, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: "Engineering workspace",
    title: "Good morning, Libin.",
    description: "Continue an assessment or start a controlled calculation.",
  },
  calculators: {
    eyebrow: "Calculation library",
    title: "Choose an equipment code.",
    description: "Search calculators and reference guidance across the Version 1 scope.",
  },
  projects: {
    eyebrow: "Local-first records",
    title: "Projects and equipment.",
    description: "Organize calculation history by site, unit and equipment tag.",
  },
  reports: {
    eyebrow: "Traceable output",
    title: "Engineering reports.",
    description: "Preview locally generated reports and export records.",
  },
  account: {
    eyebrow: "Account and access",
    title: "Your API Calc Pro profile.",
    description: "Manage sign-in, preferences, backups, privacy, and lifetime access.",
  },
};

function App() {
  const projectRepository = useMemo(() => new LocalProjectRepository(window.localStorage), []);
  const authentication = useAuthenticationSession();
  const [page, setPage] = useState<Page>("home");
  const [guestAccess, setGuestAccess] = useState(false);
  const [projects, setProjects] = useState<LocalProject[]>(() => projectRepository.listProjects());
  const [activeCalculation, setActiveCalculation] = useState<SavedApi510Calculation | null>(null);
  const [activeApi570Calculation, setActiveApi570Calculation] = useState<SavedApi570Calculation | null>(null);
  const [newCalculationComponent, setNewCalculationComponent] = useState<PressureVesselComponent>("cylindrical");
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem("acp-preview-theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [preferredUnitSystem, setPreferredUnitSystem] = useState<UnitSystem>(() => {
    const stored = window.localStorage.getItem("acp-preferred-unit-system");
    return stored === "us-customary" ? "us-customary" : "metric";
  });
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldHelp, setFieldHelp] = useState<FieldHelpContent | null>(null);
  const isGuestAccess = authentication.ready && !authentication.user && guestAccess;
  const accessGateVisible = !authentication.user && !guestAccess;
  const visibleNavItems = isGuestAccess ? navItems.filter((item) => item.id === "calculators") : navItems;
  const accessibleProjects = isGuestAccess ? [] : projects;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("acp-preview-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("acp-preferred-unit-system", preferredUnitSystem);
  }, [preferredUnitSystem]);

  useEffect(() => {
    if (authentication.user) setGuestAccess(false);
  }, [authentication.user]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    const permittedModules = isGuestAccess ? modulesForGuestAccess(modules) : modules;
    if (!query) return permittedModules;
    return permittedModules.filter((module) =>
      `${module.code} ${module.title} ${module.description}`.toLowerCase().includes(query),
    );
  }, [isGuestAccess, search]);
  const recentSavedCalculations = useMemo<RecentSavedCalculation[]>(() => projects
    .flatMap((project) => project.equipment.flatMap((equipment) => equipment.calculations.map((calculation) => ({ calculation, equipmentTag: equipment.tag }))))
    .sort((left, right) => right.calculation.updatedAt.localeCompare(left.calculation.updatedAt))
    .slice(0, 3), [projects]);

  const navigate = (target: Page) => {
    if (isGuestAccess && !guestCanAccessPage(target)) {
      setPage("calculators");
      setMobileMenu(false);
      setGuestAccess(false);
      return;
    }
    setPage(target);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const listener = NativeApp.addListener("backButton", () => {
      const action = resolveNativeBackAction(page, mobileMenu);
      if (action.kind === "close-menu") {
        setMobileMenu(false);
        return;
      }
      if (action.kind === "exit-app") {
        void NativeApp.exitApp();
        return;
      }
      navigate(action.destination);
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [mobileMenu, page]);

  const showPrototypeNotice = (message: string) => setNotice(message);
  const openFieldHelp = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[aria-label$=" help"]') : null;
    if (!target) return;
    const body = target.getAttribute("title")?.trim();
    if (!body) return;
    event.preventDefault();
    event.stopPropagation();
    setFieldHelp({ title: target.getAttribute("aria-label")?.replace(/\s+help$/i, "") ?? "Field guidance", body });
  };
  const refreshProjects = () => setProjects(projectRepository.listProjects());
  const openNewCalculation = (component: PressureVesselComponent = "cylindrical") => {
    setActiveCalculation(null);
    setNewCalculationComponent(component);
    navigate("calculator");
  };
  const openSavedCalculation = (calculation: SavedApi510Calculation) => {
    setActiveCalculation(calculation);
    setNewCalculationComponent(calculation.inputs.component);
    navigate("calculator");
  };
  const openNewApi570Calculator = (calculatorId: Api570CalculatorId) => {
    setActiveApi570Calculation(null);
    navigate(api570PageByCalculator[calculatorId]);
  };
  const openNewApi570Piping = () => openNewApi570Calculator("piping");
  const openNewApi570Tube = () => openNewApi570Calculator("tube");
  const openSavedApi570Calculation = (calculation: SavedApi570Calculation) => {
    setActiveApi570Calculation(calculation);
    navigate(api570PageByCalculator[calculation.calculatorId]);
  };
  const createProject = (input: CreateProjectInput) => {
    const project = projectRepository.createProject(input);
    refreshProjects();
    return project;
  };
  const saveCalculation = (input: SaveCalculationInput) => {
    const calculation = projectRepository.saveCalculation(input);
    refreshProjects();
    setActiveCalculation(calculation);
    return calculation;
  };
  const reviewCalculation = (input: ReviewCalculationInput) => {
    const calculation = projectRepository.reviewCalculation(input);
    refreshProjects();
    setActiveCalculation(calculation);
    return calculation;
  };
  const approveCalculation = (input: ApproveCalculationInput) => {
    const calculation = projectRepository.approveCalculation(input);
    refreshProjects();
    setActiveCalculation(calculation);
    return calculation;
  };
  const saveApi570Calculation = (input: SaveApi570CalculationInput) => {
    const calculation = projectRepository.saveApi570Calculation(input);
    refreshProjects();
    setActiveApi570Calculation(calculation);
    return calculation;
  };
  const reviewApi570Calculation = (input: ReviewApi570CalculationInput) => {
    const calculation = projectRepository.reviewApi570Calculation(input);
    refreshProjects();
    setActiveApi570Calculation(calculation);
    return calculation;
  };
  const approveApi570Calculation = (input: ApproveApi570CalculationInput) => {
    const calculation = projectRepository.approveApi570Calculation(input);
    refreshProjects();
    setActiveApi570Calculation(calculation);
    return calculation;
  };
  const api570RecordProps = {
    onNeedProject: () => navigate("projects"),
    notify: showPrototypeNotice,
    projects: accessibleProjects,
    initialCalculation: activeApi570Calculation,
    onSave: saveApi570Calculation,
    onReview: reviewApi570Calculation,
    onApprove: approveApi570Calculation,
  };
  const exportBackup = (projectId?: string) => {
    try {
      const backup = projectRepository.createBackup(projectId);
      const url = URL.createObjectURL(new Blob([backup.raw], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backup.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      showPrototypeNotice(`${backup.summary.scope === "project" ? "Project" : "Workspace"} backup downloaded with ${backup.summary.calculationCount} calculation record${backup.summary.calculationCount === 1 ? "" : "s"}.`);
    } catch (error) {
      showPrototypeNotice(error instanceof Error ? error.message : "Backup could not be created.");
    }
  };
  const previewBackup = (raw: string): WorkspaceBackupPreview => projectRepository.previewBackup(raw);
  const importBackup = (raw: string): WorkspaceImportResult => {
    const result = projectRepository.importBackup(raw);
    refreshProjects();
    return result;
  };
  const defaultTitle = page === "calculator" || page === "api570-piping" || page === "api570-tube" || page === "api570-header" || page === "api570-support" || page === "api570-pressure-design" || page === "api570-valve-fittings" || page === "api570-hydro-test" || page === "api570-flange-hydro-test" || page === "api570-pneumatic-test" || page === "api570-fillet-weld" || page === "api570-tension-test" || page === "api570-soil-resistivity" || page === "api653-bottom" || page === "api653-annular" || page === "api653-shell" || page === "api653-nozzles" || page === "api653-roof" || page === "api653-other-4-3-2" || page === "api571-damage-mechanisms" ? null : pageTitles[page];
  const title = isGuestAccess && page === "calculators" ? {
    eyebrow: "Guest access · API 570",
    title: "Piping Systems calculators.",
    description: "Use the API 570 calculation library without an account, or sign in for the complete workspace.",
  } : defaultTitle;

  return (
    <div className="app-shell" onClickCapture={openFieldHelp}>
      <aside className={mobileMenu ? "side-nav mobile-open" : "side-nav"} aria-label="Primary navigation">
        <div className="brand-block">
          <img src="/brand/api-calc-mark.png" alt="API Calc Pro" className="brand-mark" />
          <div>
            <strong>API Calc Pro</strong>
            <span>Mobile workspace</span>
          </div>
          <button className="icon-button nav-close" onClick={() => setMobileMenu(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="nav-list">
          <p className="nav-label">Workspace</p>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const selected = page === item.id || ((page === "calculator" || page === "api570-piping" || page === "api570-tube" || page === "api570-header" || page === "api570-support" || page === "api570-pressure-design" || page === "api570-valve-fittings" || page === "api570-hydro-test" || page === "api570-flange-hydro-test" || page === "api570-pneumatic-test" || page === "api570-fillet-weld" || page === "api570-tension-test" || page === "api570-soil-resistivity" || page === "api653-bottom" || page === "api653-annular" || page === "api653-shell" || page === "api653-nozzles" || page === "api653-roof" || page === "api653-other-4-3-2" || page === "api571-damage-mechanisms") && item.id === "calculators");
            return (
              <button
                className={selected ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => navigate(item.id)}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
                {item.id === "projects" && <span className="nav-count">{projects.filter((project) => project.status === "active").length}</span>}
              </button>
            );
          })}
        </nav>

        <button className="side-profile" onClick={() => isGuestAccess ? setGuestAccess(false) : navigate("account")}>
          <div className="avatar">{authenticationUserInitials(authentication.user)}</div>
          <div>
            <strong>{authentication.user?.displayName || authentication.user?.email || (isGuestAccess ? "Guest access" : "Libin Varghese")}</strong>
            <span>{authentication.user ? `${authenticationProviderLabel(authentication.user.providerId)} account` : isGuestAccess ? "API 570 only · Sign in" : "Not signed in"}</span>
          </div>
        </button>
      </aside>

      {mobileMenu && <button className="nav-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <div className="topbar-identity">
            <img src="/brand/api-calc-mark.png" alt="" />
            <span>API Calc Pro</span>
          </div>
          <div className="topbar-actions">
            {isGuestAccess ? <button className="sync-pill guest-sign-in-pill" onClick={() => setGuestAccess(false)} aria-label="Sign in for full access">
              <LogIn size={16} />
              <span>Sign in for full access</span>
            </button> : <button className="sync-pill" onClick={() => showPrototypeNotice("Cloud sync will be connected after local storage is complete.")}>
              <CloudOff size={16} />
              <span>Local only</span>
            </button>}
            <button
              className="icon-button"
              onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
              aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
          </div>
        </header>

        {page === "calculator" ? (
          <CalculatorPreview
            key={activeCalculation?.id ?? `new-${newCalculationComponent}`}
            onBack={() => navigate("calculators")}
            onNeedProject={() => navigate("projects")}
            notify={showPrototypeNotice}
            projects={projects}
            initialCalculation={activeCalculation}
            initialComponent={newCalculationComponent}
            onSave={saveCalculation}
            onReview={reviewCalculation}
            onApprove={approveCalculation}
          />
        ) : page === "api570-piping" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Piping calculator</h2></div></div>}><Api570PipingCalculator key={activeApi570Calculation?.calculatorId === "piping" ? activeApi570Calculation.id : "new-api570-piping"} onBack={() => navigate("calculators")} onNeedProject={() => navigate("projects")} notify={showPrototypeNotice} projects={accessibleProjects} initialCalculation={activeApi570Calculation?.calculatorId === "piping" ? activeApi570Calculation : null} onSave={saveApi570Calculation} onReview={reviewApi570Calculation} onApprove={approveApi570Calculation} /></Suspense>
        ) : page === "api570-tube" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Tube calculator</h2></div></div>}><Api570TubeCalculator key={activeApi570Calculation?.calculatorId === "tube" ? activeApi570Calculation.id : "new-api570-tube"} onBack={() => navigate("calculators")} onNeedProject={() => navigate("projects")} notify={showPrototypeNotice} projects={accessibleProjects} initialCalculation={activeApi570Calculation?.calculatorId === "tube" ? activeApi570Calculation : null} onSave={saveApi570Calculation} onReview={reviewApi570Calculation} onApprove={approveApi570Calculation} /></Suspense>
        ) : page === "api570-header" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Header calculator</h2></div></div>}><Api570HeaderCalculator key={activeApi570Calculation?.calculatorId === "header" ? activeApi570Calculation.id : "new-api570-header"} onBack={() => navigate("calculators")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-support" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading other piping calculations</h2></div></div>}><Api570SupportLibrary onBack={() => navigate("calculators")} openPressureDesign={() => openNewApi570Calculator("pressure-design")} openValveFittings={() => openNewApi570Calculator("valve-fittings")} openHydroTest={() => openNewApi570Calculator("hydro-test")} openFlangeHydroTest={() => openNewApi570Calculator("flange-hydro-test")} openPneumaticTest={() => openNewApi570Calculator("pneumatic-test")} openFilletWeld={() => openNewApi570Calculator("fillet-weld")} openTensionTest={() => openNewApi570Calculator("tension-test")} openSoilResistivity={() => openNewApi570Calculator("soil-resistivity")} /></Suspense>
        ) : page === "api570-pressure-design" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading pressure-design calculator</h2></div></div>}><Api570PressureDesignCalculator key={activeApi570Calculation?.calculatorId === "pressure-design" ? activeApi570Calculation.id : "new-api570-pressure-design"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-valve-fittings" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading valve/fittings calculator</h2></div></div>}><Api570ValveFittingsCalculator key={activeApi570Calculation?.calculatorId === "valve-fittings" ? activeApi570Calculation.id : "new-api570-valve-fittings"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-hydro-test" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Hydro Test Pressure calculator</h2></div></div>}><Api570HydroTestCalculator key={activeApi570Calculation?.calculatorId === "hydro-test" ? activeApi570Calculation.id : "new-api570-hydro-test"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-flange-hydro-test" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Flange Hydro Test calculator</h2></div></div>}><Api570FlangeHydroTestCalculator key={activeApi570Calculation?.calculatorId === "flange-hydro-test" ? activeApi570Calculation.id : "new-api570-flange-hydro-test"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-pneumatic-test" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Pneumatic Test Pressure calculator</h2></div></div>}><Api570PneumaticTestCalculator key={activeApi570Calculation?.calculatorId === "pneumatic-test" ? activeApi570Calculation.id : "new-api570-pneumatic-test"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-fillet-weld" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Fillet Weld Sizing calculator</h2></div></div>}><Api570FilletWeldCalculator key={activeApi570Calculation?.calculatorId === "fillet-weld" ? activeApi570Calculation.id : "new-api570-fillet-weld"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-tension-test" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Tension Test calculator</h2></div></div>}><Api570TensionTestCalculator key={activeApi570Calculation?.calculatorId === "tension-test" ? activeApi570Calculation.id : "new-api570-tension-test"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api570-soil-resistivity" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Soil Resistivity calculator</h2></div></div>}><Api570SoilResistivityCalculator key={activeApi570Calculation?.calculatorId === "soil-resistivity" ? activeApi570Calculation.id : "new-api570-soil-resistivity"} onBack={() => navigate("api570-support")} {...api570RecordProps} /></Suspense>
        ) : page === "api653-bottom" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Bottom Plate calculator</h2></div></div>}><Api653BottomPlateCalculator onBack={() => navigate("calculators")} /></Suspense>
        ) : page === "api653-annular" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Annular Plate calculator</h2></div></div>}><Api653AnnularPlateCalculator onBack={() => navigate("calculators")} /></Suspense>
        ) : page === "api653-shell" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Shell Course calculator</h2></div></div>}><Api653ShellCourseCalculator onBack={() => navigate("calculators")} /></Suspense>
        ) : page === "api653-nozzles" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Nozzle calculator</h2></div></div>}><Api653NozzleCalculator onBack={() => navigate("calculators")} /></Suspense>
        ) : page === "api653-roof" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Roof Plate calculator</h2></div></div>}><Api653RoofPlateCalculator onBack={() => navigate("calculators")} /></Suspense>
        ) : page === "api653-other-4-3-2" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><Gauge size={28} /><h2>Loading Other 4.3.2 calculator</h2></div></div>}><Api653Other432Calculator onBack={() => navigate("calculators")} /></Suspense>
        ) : page === "api571-damage-mechanisms" ? (
          <Suspense fallback={<div className="page-wrap"><div className="empty-state"><BookOpenText size={28} /><h2>Loading damage mechanisms</h2></div></div>}><Api571DamageMechanisms onBack={() => navigate("calculators")} /></Suspense>
        ) : (
          <div className="page-wrap">
            <section className="page-heading">
              <div>
                <p className="eyebrow">{title?.eyebrow}</p>
                <h1>{title?.title}</h1>
                <p>{title?.description}</p>
              </div>
            </section>

            {page === "home" && <HomePage navigate={navigate} openCalculator={() => openNewCalculation()} openApi570Piping={openNewApi570Piping} openApi571DamageMechanisms={() => navigate("api571-damage-mechanisms")} recentCalculations={recentSavedCalculations} onOpenSaved={openSavedCalculation} notify={showPrototypeNotice} preferredUnitSystem={preferredUnitSystem} />}
            {page === "calculators" && (
              <CalculatorsPage
                search={search}
                setSearch={setSearch}
                modules={filteredModules}
                openCalculator={openNewCalculation}
                openApi570Piping={openNewApi570Piping}
                openApi570Tube={openNewApi570Tube}
                openApi570Header={() => openNewApi570Calculator("header")}
                openApi570Support={() => navigate("api570-support")}
                openApi653Bottom={() => navigate("api653-bottom")}
                openApi653Annular={() => navigate("api653-annular")}
                openApi653Shell={() => navigate("api653-shell")}
                openApi653Nozzles={() => navigate("api653-nozzles")}
                openApi653Roof={() => navigate("api653-roof")}
                openApi653Other432={() => navigate("api653-other-4-3-2")}
                openApi571DamageMechanisms={() => navigate("api571-damage-mechanisms")}
                notify={showPrototypeNotice}
                guestMode={isGuestAccess}
                onSignIn={() => setGuestAccess(false)}
              />
            )}
            {page === "projects" && (
              <ProjectsPage
                projects={projects}
                onCreateProject={createProject}
                onOpenCalculation={openSavedCalculation}
                onOpenApi570Calculation={openSavedApi570Calculation}
                onDuplicateCalculation={(projectId, equipmentId, calculationId) => {
                  projectRepository.duplicateCalculation(projectId, equipmentId, calculationId);
                  refreshProjects();
                  showPrototypeNotice("Calculation duplicated as a local draft.");
                }}
                onDeleteCalculation={(projectId, equipmentId, calculationId) => {
                  projectRepository.deleteCalculation(projectId, equipmentId, calculationId);
                  refreshProjects();
                  showPrototypeNotice("Calculation deleted from this device.");
                }}
                onDuplicateApi570Calculation={(projectId, calculationId) => {
                  projectRepository.duplicateApi570Calculation(projectId, calculationId);
                  refreshProjects();
                  showPrototypeNotice("API 570 calculation duplicated as a local draft.");
                }}
                onDeleteApi570Calculation={(projectId, calculationId) => {
                  projectRepository.deleteApi570Calculation(projectId, calculationId);
                  refreshProjects();
                  showPrototypeNotice("API 570 calculation deleted from this device.");
                }}
                onArchiveProject={(projectId, archived) => {
                  projectRepository.setProjectArchived(projectId, archived);
                  refreshProjects();
                  showPrototypeNotice(archived ? "Project archived locally." : "Project restored locally.");
                }}
                onDeleteProject={(projectId) => {
                  projectRepository.deleteProject(projectId);
                  refreshProjects();
                  showPrototypeNotice("Project and its local records were deleted.");
                }}
                onStartCalculation={() => openNewCalculation()}
                onStartApi570Calculation={openNewApi570Piping}
                onExportProject={(projectId) => exportBackup(projectId)}
                notify={showPrototypeNotice}
              />
            )}
            {page === "reports" && <ReportsPage projects={projects} notify={showPrototypeNotice} onOpenCalculation={openSavedCalculation} onApproveCalculation={approveCalculation} />}
            {page === "account" && <AccountPage projects={projects} theme={theme} preferredUnitSystem={preferredUnitSystem} authentication={authentication} notify={showPrototypeNotice} onThemeChange={setTheme} onPreferredUnitSystemChange={setPreferredUnitSystem} onExportWorkspace={() => exportBackup()} onPreviewBackup={previewBackup} onImportBackup={importBackup} />}
          </div>
        )}
      </main>

      <nav className={isGuestAccess ? "mobile-tabs guest-mode" : "mobile-tabs"} aria-label="Mobile navigation">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const selected = page === item.id || ((page === "calculator" || page === "api570-piping" || page === "api570-tube" || page === "api570-header" || page === "api570-support" || page === "api570-pressure-design" || page === "api570-valve-fittings" || page === "api570-hydro-test" || page === "api570-flange-hydro-test" || page === "api570-pneumatic-test" || page === "api570-fillet-weld" || page === "api570-tension-test" || page === "api570-soil-resistivity" || page === "api653-bottom" || page === "api653-annular" || page === "api653-shell" || page === "api653-nozzles" || page === "api653-roof" || page === "api653-other-4-3-2" || page === "api571-damage-mechanisms") && item.id === "calculators");
          return (
            <button className={selected ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}>
              <Icon size={21} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {notice && (
        <div className="toast" role="status">
          <Info size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={17} /></button>
        </div>
      )}
      {fieldHelp ? <FieldHelpDialog content={fieldHelp} onClose={() => setFieldHelp(null)} /> : null}
      {accessGateVisible ? <AccessGate authentication={authentication} onContinueAsGuest={() => { setGuestAccess(true); setPage("calculators"); setMobileMenu(false); }} /> : null}
    </div>
  );
}

function HomePage({ navigate, openCalculator, openApi570Piping, openApi571DamageMechanisms, recentCalculations, onOpenSaved, notify, preferredUnitSystem }: { navigate: (page: Page) => void; openCalculator: () => void; openApi570Piping: () => void; openApi571DamageMechanisms: () => void; recentCalculations: RecentSavedCalculation[]; onOpenSaved: (calculation: SavedApi510Calculation) => void; notify: (message: string) => void; preferredUnitSystem: UnitSystem }) {
  const [converterOpen, setConverterOpen] = useState(false);
  return (
    <>
      <section className="hero-grid">
        <article className="hero-card">
          <div className="hero-copy">
            <span className="hero-kicker"><ShieldCheck size={15} /> Engineering calculation workspace</span>
            <h2>Calculations that stay clear from input to report.</h2>
            <p>
              Complete equipment assessments, review results, and keep organized project records on your device.
            </p>
            <div className="hero-actions">
              <button className="light-button" onClick={openCalculator}>
                Continue API 510 <ChevronRight size={17} />
              </button>
              <button className="ghost-light-button" onClick={() => navigate("calculators")}>Browse library</button>
            </div>
          </div>
          <div className="hero-visual" aria-label="Engineering vessel and piping blueprint">
            <img src="/brand/engineering-blueprint.png" alt="Original engineering blueprint showing a storage tank, vessel and piping" />
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Version 1 scope</p><h2>Engineering modules</h2></div>
          <button className="text-button" onClick={() => navigate("calculators")}>View all <ChevronRight size={17} /></button>
        </div>
        <div className="module-grid compact">
          {modules.map((module) => <ModuleCard key={module.code} module={module} onClick={() => module.code === "API 510" ? openCalculator() : module.code === "API 570" ? openApi570Piping() : module.code === "API 653" ? navigate("api653-bottom") : module.code === "API 571" ? openApi571DamageMechanisms() : notify(modulePreviewNotice(module.code))} />)}
        </div>
      </section>

      <section className="lower-grid">
        <div className="section-block no-margin">
          <div className="section-heading">
            <div><p className="eyebrow">Recent work</p><h2>Calculations</h2></div>
          </div>
          <div className="recent-list">
            {recentCalculations.length ? recentCalculations.map(({ calculation, equipmentTag }, index) => (
              <button className="recent-row" key={calculation.id} onClick={() => onOpenSaved(calculation)}>
                <div className={`recent-icon recent-${index + 1}`}><FileText size={18} /></div>
                <div className="recent-copy"><strong>{calculation.title}</strong><span>{equipmentTag} · API 510</span></div>
                <div className="recent-meta"><span>{new Date(calculation.updatedAt).toLocaleDateString()}</span><small>{calculation.status}</small></div>
                <ChevronRight size={18} />
              </button>
            )) : <div className="recent-empty"><FileText size={20} /><span>No local calculations yet.</span><button onClick={openCalculator}>Start API 510</button></div>}
          </div>
        </div>

        <article className="quick-card">
          <div className="quick-icon"><Zap size={21} /></div>
          <p className="eyebrow">Quick tool</p>
          <h2>Unit converter</h2>
          <p>Convert pressure, temperature, length and corrosion-rate units without leaving your assessment.</p>
          <div className="mini-converter">
            <div><span>Pressure</span><strong>10.00 bar</strong></div>
            <RefreshCw size={17} />
            <div><span>Converted</span><strong>145.04 psi</strong></div>
          </div>
          <button className="secondary-button" onClick={() => setConverterOpen(true)}>Open converter</button>
        </article>
      </section>
      {converterOpen ? <UnitConverterDialog preferredUnitSystem={preferredUnitSystem} onClose={() => setConverterOpen(false)} /> : null}
    </>
  );
}

function ModuleCard({ module, onClick }: { module: Module; onClick: () => void }) {
  const Icon = module.icon;
  return (
    <button className={`module-card accent-${module.accent}`} onClick={onClick}>
      <div className="module-card-top">
        <div className="module-icon"><Icon size={22} /></div>
        <ChevronRight className="module-chevron" size={19} />
      </div>
      <p className="module-code">{module.code}</p>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <span className="module-count">{module.count}</span>
    </button>
  );
}

function CalculatorsPage({
  search,
  setSearch,
  modules: visibleModules,
  openCalculator,
  openApi570Piping,
  openApi570Tube,
  openApi570Header,
  openApi570Support,
  openApi653Bottom,
  openApi653Annular,
  openApi653Shell,
  openApi653Nozzles,
  openApi653Roof,
  openApi653Other432,
  openApi571DamageMechanisms,
  notify,
  guestMode,
  onSignIn,
}: {
  search: string;
  setSearch: (value: string) => void;
  modules: Module[];
  openCalculator: (component?: PressureVesselComponent) => void;
  openApi570Piping: () => void;
  openApi570Tube: () => void;
  openApi570Header: () => void;
  openApi570Support: () => void;
  openApi653Bottom: () => void;
  openApi653Annular: () => void;
  openApi653Shell: () => void;
  openApi653Nozzles: () => void;
  openApi653Roof: () => void;
  openApi653Other432: () => void;
  openApi571DamageMechanisms: () => void;
  notify: (message: string) => void;
  guestMode: boolean;
  onSignIn: () => void;
}) {
  const visibleApi510Calculators = guestMode ? [] : filterApi510Calculators(search);
  const visibleApi570Workspaces = filterApi570MobileWorkspaces(search);
  const visibleApi653Workspaces = guestMode ? [] : filterApi653MobileWorkspaces(search);
  return (
    <>
      {guestMode ? <section className="guest-access-banner">
        <div><ShieldCheck size={20} /><span><strong>Guest access</strong><small>API 570 Piping Systems only</small></span></div>
        <button className="secondary-button" onClick={onSignIn}><LogIn size={17} /> Sign in for full access</button>
      </section> : null}
      <div className="search-row">
        <label className="search-box">
          <Search size={19} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={guestMode ? "Search piping calculations" : "Search code, equipment or calculation"} />
          <kbd>⌘ K</kbd>
        </label>
        <button className="filter-button"><Layers3 size={17} /> {guestMode ? "Piping systems" : "All modules"}</button>
      </div>
      <div className="module-grid library-grid">
        {visibleModules.map((module) => (
          <ModuleCard key={module.code} module={module} onClick={module.code === "API 510" ? () => document.getElementById("api510-calculator-library")?.scrollIntoView({ behavior: "smooth", block: "start" }) : module.code === "API 570" ? () => document.getElementById("api570-calculator-library")?.scrollIntoView({ behavior: "smooth", block: "start" }) : module.code === "API 653" ? () => document.getElementById("api653-calculator-library")?.scrollIntoView({ behavior: "smooth", block: "start" }) : module.code === "API 571" ? openApi571DamageMechanisms : () => notify(modulePreviewNotice(module.code))} />
        ))}
      </div>
      {visibleModules.length === 0 && visibleApi510Calculators.length === 0 && visibleApi570Workspaces.length === 0 && visibleApi653Workspaces.length === 0 && <div className="empty-state"><Search size={28} /><h2>No calculators found</h2><p>Try a code number, equipment type, geometry or result name.</p></div>}

      {!guestMode ? <section className="section-block library-section" id="api510-calculator-library">
        <div className="section-heading">
          <div><p className="eyebrow">Pressure vessel calculations</p><h2>API 510 geometry calculators</h2></div>
        </div>
        <p className="library-intro">Choose a vessel or head geometry. Each calculator includes mixed-unit inputs, inspection history, review, reports, and local project records.</p>
        {visibleApi510Calculators.length ? <div className="calculator-list-grid api510-library-grid">
          {visibleApi510Calculators.map((definition, index) => (
            <button className="calculator-list-card api510-calculator-card" key={definition.component} onClick={() => openCalculator(definition.component)}>
              <div className="list-index">{String(index + 1).padStart(2, "0")}</div>
              <div><strong>{definition.title}</strong><span>{definition.description}</span><em>{definition.geometryBasis}</em></div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div> : <div className="empty-state api510-library-empty"><Search size={24} /><h3>No API 510 geometry matched</h3><p>Try shell, head, cone, sphere, crown radius or flat.</p></div>}
      </section> : null}

      <section className="section-block library-section" id="api570-calculator-library">
        <div className="section-heading">
          <div><p className="eyebrow">Piping system calculations</p><h2>API 570 calculators</h2></div>
        </div>
        <p className="library-intro">Choose an individual piping, tube, header, pressure-test, weld, or supporting calculation.</p>
        {visibleApi570Workspaces.length ? <div className="calculator-list-grid api570-library-grid">
          {visibleApi570Workspaces.map((workspace, index) => {
            const openWorkspace = workspace.id === "piping" ? openApi570Piping : workspace.id === "tubes" ? openApi570Tube : workspace.id === "headers" ? openApi570Header : workspace.id === "other-calculations" ? openApi570Support : undefined;
            return (
              <button className="calculator-list-card api570-calculator-card" key={workspace.id} onClick={openWorkspace ?? (() => notify(`${workspace.title} is not available.`))}>
                <div className="list-index">{String(index + 1).padStart(2, "0")}</div>
                <div><strong>{workspace.title}</strong><span>{workspace.summary}</span></div>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div> : <div className="empty-state api510-library-empty"><Search size={24} /><h3>No API 570 workspace matched</h3><p>Try piping, tube, header, MAWP, remaining life or pressure test.</p></div>}
      </section>

      {!guestMode ? <section className="section-block library-section" id="api653-calculator-library">
        <div className="section-heading">
          <div><p className="eyebrow">Storage tank calculations</p><h2>API 653 calculators</h2></div>
        </div>
        <p className="library-intro">Assess bottom, annular, shell, nozzle, roof, and local-thin-area conditions with consistent mixed-unit inputs and editable automatic values.</p>
        {visibleApi653Workspaces.length ? <div className="calculator-list-grid api570-library-grid">
          {visibleApi653Workspaces.map((workspace, index) => (
              <button className="calculator-list-card api570-calculator-card" key={workspace.id} onClick={workspace.id === "bottom" ? openApi653Bottom : workspace.id === "annular" ? openApi653Annular : workspace.id === "shell" ? openApi653Shell : workspace.id === "nozzles" ? openApi653Nozzles : workspace.id === "roof" ? openApi653Roof : openApi653Other432}>
                <div className="list-index">{String(index + 1).padStart(2, "0")}</div>
                <div><strong>{workspace.title}</strong><span>{workspace.summary}</span></div>
                <ChevronRight size={18} />
              </button>
          ))}
        </div> : <div className="empty-state api510-library-empty"><Search size={24} /><h3>No API 653 workspace matched</h3><p>Try bottom, annular, shell, nozzle, roof, pitting or remaining life.</p></div>}
      </section> : null}
    </>
  );
}

type LocalReportRecord = { project: LocalProject; equipment: LocalEquipment; calculation: SavedApi510Calculation };

function ReportsPage({ projects, notify, onOpenCalculation, onApproveCalculation }: { projects: LocalProject[]; notify: (message: string) => void; onOpenCalculation: (calculation: SavedApi510Calculation) => void; onApproveCalculation: (input: ApproveCalculationInput) => SavedApi510Calculation }) {
  const [selectedRecord, setSelectedRecord] = useState<LocalReportRecord | null>(null);
  const reportRecords = useMemo<LocalReportRecord[]>(() => projects
    .flatMap((project) => project.equipment.flatMap((equipment) => equipment.calculations.map((calculation) => ({ project, equipment, calculation }))))
    .sort((left, right) => right.calculation.updatedAt.localeCompare(left.calculation.updatedAt)), [projects]);
  const reviewedCount = reportRecords.filter((record) => record.calculation.status === "reviewed" || record.calculation.status === "approved").length;
  const approvedCount = reportRecords.filter((record) => record.calculation.status === "approved").length;
  const latestReport = reportRecords[0];
  const selectedModel = selectedRecord ? createApi510ReportModel({
    projectName: selectedRecord.project.name,
    client: selectedRecord.project.client,
    site: selectedRecord.project.site,
    equipmentTag: selectedRecord.equipment.tag,
    equipmentName: selectedRecord.equipment.name,
    calculationId: selectedRecord.calculation.id,
    title: selectedRecord.calculation.title,
    status: selectedRecord.calculation.status,
    workflow: selectedRecord.calculation.workflow,
    preparedBy: selectedRecord.calculation.workflow.preparedBy,
    updatedAt: selectedRecord.calculation.updatedAt,
    inputs: selectedRecord.calculation.inputs,
    result: selectedRecord.calculation.result,
  }) : null;
  const approveSelectedReport = (details: { approverName: string; approvalNotes: string }) => {
    if (!selectedRecord) return false;
    try {
      const updated = onApproveCalculation({
        projectId: selectedRecord.project.id,
        equipmentId: selectedRecord.equipment.id,
        calculationId: selectedRecord.calculation.id,
        approverName: details.approverName,
        approvalNotes: details.approvalNotes,
        fingerprint: createCalculationFingerprint({
          projectId: selectedRecord.project.id,
          equipmentTag: selectedRecord.equipment.tag,
          equipmentName: selectedRecord.equipment.name,
          title: selectedRecord.calculation.title,
          inputs: selectedRecord.calculation.inputs,
          result: selectedRecord.calculation.result,
        }),
      });
      setSelectedRecord({ ...selectedRecord, calculation: updated });
      notify("Revision approved locally and added to the history.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Approval could not be recorded.");
      return false;
    }
  };
  return (
    <>
      <div className="summary-grid">
        <SummaryCard icon={FileText} label="Report previews" value={String(reportRecords.length).padStart(2, "0")} note="Generated from local calculation records" />
        <SummaryCard icon={CircleCheck} label="Reviewed" value={String(reviewedCount).padStart(2, "0")} note={`${approvedCount} approved · ${reportRecords.length - reviewedCount} draft`} />
        <SummaryCard icon={History} label="Latest record" value={latestReport?.equipment.tag ?? "—"} note={latestReport ? new Date(latestReport.calculation.updatedAt).toLocaleDateString() : "No local reports yet"} />
      </div>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Generated locally</p><h2>Saved API 510 reports</h2></div><span className="text-report-badge"><FileText size={15} /> Screen and text only</span></div>
        {reportRecords.length ? <div className="report-table" role="table" aria-label="Saved API 510 reports">
          <div className="report-head" role="row"><span>Report</span><span>Equipment</span><span>Status</span><span>Updated</span><span /></div>
          {reportRecords.map((record) => (
            <button className="report-row" role="row" key={record.calculation.id} onClick={() => setSelectedRecord(record)}>
              <span><FileText size={18} /><strong>{record.calculation.title}</strong></span><span>{record.equipment.tag}</span><span><small className={record.calculation.status}>{record.calculation.status}</small></span><span>{new Date(record.calculation.updatedAt).toLocaleDateString()}</span><span><ChevronRight size={18} /></span>
            </button>
          ))}
        </div> : <div className="empty-card report-empty"><FileText size={28} /><h3>No saved reports yet</h3><p>Save an API 510 calculation to create a structured local report preview.</p></div>}
      </section>
      {selectedModel ? <Api510ReportPreview model={selectedModel} onClose={() => setSelectedRecord(null)} onOpenCalculation={() => { const calculation = selectedRecord?.calculation; setSelectedRecord(null); if (calculation) onOpenCalculation(calculation); }} onApprove={approveSelectedReport} notify={notify} /> : null}
    </>
  );
}

function AccountPage({ projects, theme, preferredUnitSystem, authentication, notify, onThemeChange, onPreferredUnitSystemChange, onExportWorkspace, onPreviewBackup, onImportBackup }: { projects: LocalProject[]; theme: Theme; preferredUnitSystem: UnitSystem; authentication: AuthenticationSession; notify: (message: string) => void; onThemeChange: (theme: Theme) => void; onPreferredUnitSystemChange: (unitSystem: UnitSystem) => void; onExportWorkspace: () => void; onPreviewBackup: (raw: string) => WorkspaceBackupPreview; onImportBackup: (raw: string) => WorkspaceImportResult }) {
  const [backupOpen, setBackupOpen] = useState(false);
  const [accountDialog, setAccountDialog] = useState<AccountDialog | null>(null);
  const openBackup = () => {
    setAccountDialog(null);
    setBackupOpen(true);
  };
  const profileName = authentication.user?.displayName || authentication.user?.email || "Libin Varghese";
  const profileDetail = authentication.user
    ? `${authenticationProviderLabel(authentication.user.providerId)} account · Signed in`
    : "Local profile · Not signed in";
  return (
    <><div className="account-grid">
      <section className="profile-card">
        <div className="profile-avatar">{authentication.user?.photoUrl ? <img src={authentication.user.photoUrl} alt="" referrerPolicy="no-referrer" /> : authenticationUserInitials(authentication.user)}</div>
        <h2>{profileName}</h2>
        <p>{profileDetail}</p>
        <span className="ownership-badge"><HardDrive size={16} /> {projects.length} local project{projects.length === 1 ? "" : "s"}</span>
        <div className="profile-divider" />
        <button className="profile-sign-in" onClick={() => setAccountDialog("sign-in")}><span><LogIn size={18} /> {authentication.user ? "Manage signed-in account" : "Sign in or create account"}</span><ChevronRight size={17} /></button>
      </section>

      <div className="account-stack">
        <article className="lifetime-card">
          <div className="lifetime-copy">
            <span className="small-badge dark">One payment · No subscription</span>
            <h2>Lifetime Access</h2>
            <p>Permanent access to Version 1 calculators, projects, reports, and purchase restoration.</p>
            <ul><li><Check size={16} /> API 510, 570 and 653</li><li><Check size={16} /> API 571 reference guidance</li><li><Check size={16} /> Offline calculations and reports</li></ul>
          </div>
          <div className="lifetime-price"><small>Access status</small><strong>Not active</strong><button onClick={() => setAccountDialog("restore-purchase")}><RotateCcw size={17} /> Restore purchase</button></div>
        </article>

        <section className="settings-card">
          <div className="section-heading"><div><p className="eyebrow">Preferences</p><h2>Account settings</h2></div></div>
          {[
            { icon: LogIn, title: authentication.user ? "Signed-in account" : "Sign in", description: authentication.user ? `${authenticationProviderLabel(authentication.user.providerId)} · ${authentication.user.email || "Connected"}` : "Google · Apple", action: () => setAccountDialog("sign-in" as const) },
            { icon: Settings, title: "Units and appearance", description: `${preferredUnitSystem === "metric" ? "Metric" : "U.S. customary"} · ${theme === "light" ? "Light" : "Dark"}`, action: () => setAccountDialog("units" as const) },
            { icon: Cloud, title: "Backup and restore", description: `${projects.length} local project${projects.length === 1 ? "" : "s"} · JSON export/import`, action: openBackup },
            { icon: RotateCcw, title: "Restore purchase", description: "Lifetime access", action: () => setAccountDialog("restore-purchase" as const) },
            { icon: ShieldCheck, title: "Privacy and security", description: "Local data and account security", action: () => setAccountDialog("privacy" as const) },
          ].map(({ icon: RowIcon, title, description, action }) => {
            return <button className="setting-row is-functional" key={title} onClick={action}><div><RowIcon size={19} /></div><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={18} /></button>;
          })}
        </section>
      </div>
    </div>{accountDialog ? <AccountSettingsDialog dialog={accountDialog} theme={theme} preferredUnitSystem={preferredUnitSystem} projectCount={projects.length} authentication={authentication} onThemeChange={onThemeChange} onPreferredUnitSystemChange={onPreferredUnitSystemChange} onOpenBackup={openBackup} onClose={() => setAccountDialog(null)} /> : null}{backupOpen ? <WorkspaceBackupDialog projectCount={projects.length} onClose={() => setBackupOpen(false)} onExportWorkspace={onExportWorkspace} onPreviewBackup={onPreviewBackup} onImportBackup={onImportBackup} notify={notify} /> : null}</>
  );
}

function SummaryCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return <article className="summary-card"><div className="summary-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function CalculatorPreview({ onBack, onNeedProject, notify, projects, initialCalculation, initialComponent, onSave, onReview, onApprove }: {
  onBack: () => void;
  onNeedProject: () => void;
  notify: (message: string) => void;
  projects: LocalProject[];
  initialCalculation: SavedApi510Calculation | null;
  initialComponent: PressureVesselComponent;
  onSave: (input: SaveCalculationInput) => SavedApi510Calculation;
  onReview: (input: ReviewCalculationInput) => SavedApi510Calculation;
  onApprove: (input: ApproveCalculationInput) => SavedApi510Calculation;
}) {
  const currentYear = new Date().getFullYear();
  const initialInputs = initialCalculation?.inputs;
  const initialProject = projects.find((project) => project.id === initialCalculation?.projectId);
  const initialEquipment = initialProject?.equipment.find((equipment) => equipment.id === initialCalculation?.equipmentId);
  const initialUnitSystem = initialInputs?.unitSystem ?? "metric";
  const [component, setComponent] = useState<PressureVesselComponent>(initialInputs?.component ?? initialComponent);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem);
  const [pressureInputUnit, setPressureInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.pressureUnit, "pressure", initialUnitSystem));
  const [diameterInputUnit, setDiameterInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.diameterUnit, "length", initialUnitSystem));
  const [crownRadiusInputUnit, setCrownRadiusInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.crownRadiusUnit, "length", initialUnitSystem));
  const [sphericalRadiusInputUnit, setSphericalRadiusInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.sphericalRadiusUnit, "length", initialUnitSystem));
  const [diameterOrShortSpanInputUnit, setDiameterOrShortSpanInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.diameterOrShortSpanUnit, "length", initialUnitSystem));
  const [designTemperatureInputUnit, setDesignTemperatureInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.designTemperatureUnit, "temperature", initialUnitSystem));
  const [allowableStressInputUnit, setAllowableStressInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.allowableStressUnit, "pressure", initialUnitSystem));
  const [originalThicknessInputUnit, setOriginalThicknessInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.originalThicknessUnit, "length", initialUnitSystem));
  const [previousThicknessInputUnit, setPreviousThicknessInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.previousThicknessUnit, "length", initialUnitSystem));
  const [actualThicknessInputUnit, setActualThicknessInputUnit] = useState<EngineeringUnit>(() => resolveInputUnit(initialInputs?.actualThicknessUnit, "length", initialUnitSystem));
  const [pressure, setPressure] = useState(initialInputs?.pressure ?? "1.50");
  const [diameter, setDiameter] = useState(initialInputs?.diameter ?? "2000");
  const [crownRadius, setCrownRadius] = useState(initialInputs?.crownRadius ?? "2000");
  const [sphericalRadius, setSphericalRadius] = useState(initialInputs?.sphericalRadius ?? "1000");
  const [halfApexAngle, setHalfApexAngle] = useState(initialInputs?.halfApexAngle ?? "30");
  const [diameterOrShortSpan, setDiameterOrShortSpan] = useState(initialInputs?.diameterOrShortSpan ?? "200");
  const [attachmentFactor, setAttachmentFactor] = useState(initialInputs?.attachmentFactor ?? "0.3");
  const [efficiency, setEfficiency] = useState(initialInputs?.efficiency ?? "0.85");
  const [designTemperature, setDesignTemperature] = useState(initialInputs?.designTemperature ?? "150");
  const [materialSpec, setMaterialSpec] = useState(initialInputs?.materialSpec ?? defaultPressureVesselMaterial);
  const [gradeKey, setGradeKey] = useState(initialInputs?.gradeKey ?? defaultPressureVesselGrade);
  const [stressMode, setStressMode] = useState<AutomaticValueMode>(initialInputs?.stressMode ?? "auto");
  const [manualStress, setManualStress] = useState(initialInputs?.manualStress ?? "138");
  const [originalThickness, setOriginalThickness] = useState(initialInputs?.originalThickness ?? "18.00");
  const [previousThickness, setPreviousThickness] = useState(initialInputs?.previousThickness ?? "16.50");
  const [actualThickness, setActualThickness] = useState(initialInputs?.actualThickness ?? "15.80");
  const [buildYear, setBuildYear] = useState(initialInputs?.buildYear ?? String(currentYear - 20));
  const [serviceYearsMode, setServiceYearsMode] = useState<AutomaticValueMode>(initialInputs?.serviceYearsMode ?? "auto");
  const [manualServiceYears, setManualServiceYears] = useState(initialInputs?.manualServiceYears ?? "20");
  const [previousInspectionYear, setPreviousInspectionYear] = useState(initialInputs?.previousInspectionYear ?? String(currentYear - 5));
  const [inspectionYearsMode, setInspectionYearsMode] = useState<AutomaticValueMode>(initialInputs?.inspectionYearsMode ?? "auto");
  const [manualInspectionYears, setManualInspectionYears] = useState(initialInputs?.manualInspectionYears ?? "5");
  const [nextInspectionYears, setNextInspectionYears] = useState(initialInputs?.nextInspectionYears ?? "5");
  const [equipmentTag, setEquipmentTag] = useState(initialEquipment?.tag ?? "V-201");
  const [equipmentName, setEquipmentName] = useState(initialEquipment?.name ?? "Pressure vessel");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveProjectId, setSaveProjectId] = useState(initialCalculation?.projectId ?? projects.find((project) => project.status === "active")?.id ?? "");
  const [savedProjectId, setSavedProjectId] = useState(initialCalculation?.projectId);
  const [savedEquipmentId, setSavedEquipmentId] = useState(initialCalculation?.equipmentId);
  const [savedCalculationId, setSavedCalculationId] = useState(initialCalculation?.id);
  const [calculationTitle, setCalculationTitle] = useState(initialCalculation?.title ?? "API 510 assessment");
  const [recordStatus, setRecordStatus] = useState<CalculationWorkflowStatus>(initialCalculation?.status ?? "draft");
  const [workflow, setWorkflow] = useState<CalculationWorkflow | undefined>(initialCalculation?.workflow);
  const [preparedBy, setPreparedBy] = useState(initialCalculation?.workflow.preparedBy ?? "Libin Varghese");
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">(initialCalculation ? "saved" : "idle");
  const [savedUpdatedAt, setSavedUpdatedAt] = useState(initialCalculation?.updatedAt);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const pressureMpa = convertUnitToSI(Number(pressure), "pressure", pressureInputUnit);
  const insideDiameterMm = convertUnitToSI(Number(diameter), "length", diameterInputUnit);
  const crownRadiusMm = convertUnitToSI(Number(crownRadius), "length", crownRadiusInputUnit);
  const sphericalRadiusMm = convertUnitToSI(Number(sphericalRadius), "length", sphericalRadiusInputUnit);
  const diameterOrShortSpanMm = convertUnitToSI(Number(diameterOrShortSpan), "length", diameterOrShortSpanInputUnit);
  const designTemperatureC = convertUnitToSI(Number(designTemperature), "temperature", designTemperatureInputUnit);
  const originalThicknessMm = convertUnitToSI(Number(originalThickness), "length", originalThicknessInputUnit);
  const previousThicknessMm = convertUnitToSI(Number(previousThickness), "length", previousThicknessInputUnit);
  const actualThicknessMm = convertUnitToSI(Number(actualThickness), "length", actualThicknessInputUnit);
  const resultLengthUnit = unitLabel("length", unitSystem);
  const resultPressureUnit = unitLabel("pressure", unitSystem);
  const serviceYears = useMemo(
    () => deriveYearsInService(Number(buildYear), currentYear),
    [buildYear, currentYear],
  );
  const inspectionYears = useMemo(
    () => deriveYearsSincePreviousInspection(Number(previousInspectionYear), Number(buildYear), currentYear),
    [buildYear, currentYear, previousInspectionYear],
  );
  const materialGrades = useMemo(
    () => listPressureVesselMaterialGrades(materialSpec),
    [materialSpec],
  );
  useEffect(() => {
    if (!materialGrades.some((grade) => grade.key === gradeKey)) {
      setGradeKey(materialGrades[0]?.key ?? "");
    }
  }, [gradeKey, materialGrades]);
  const materialStress = useMemo(
    () => resolvePressureVesselAllowableStress(materialSpec, gradeKey, designTemperatureC),
    [designTemperatureC, gradeKey, materialSpec],
  );
  const automaticStressDisplay = materialStress.allowableStressMpa === null
    ? ""
    : formatConvertedInput(
        convertSIToUnit(materialStress.allowableStressMpa, "pressure", allowableStressInputUnit),
        "pressure",
        allowableStressInputUnit,
      );
  const selectedStress = resolveAutomaticNumericValue(
    stressMode,
    materialStress.allowableStressMpa,
    convertUnitToSI(manualStress.trim() ? Number(manualStress) : Number.NaN, "pressure", allowableStressInputUnit),
  );
  const selectedServiceYears = resolveAutomaticNumericValue(
    serviceYearsMode,
    serviceYears.yearsInService,
    manualServiceYears.trim() ? Number(manualServiceYears) : Number.NaN,
  );
  const selectedInspectionYears = resolveAutomaticNumericValue(
    inspectionYearsMode,
    inspectionYears.yearsSincePreviousInspection,
    manualInspectionYears.trim() ? Number(manualInspectionYears) : Number.NaN,
  );
  const result = useMemo(() => {
    const input = {
      insideDiameterMm,
      designPressureMpa: pressureMpa,
      allowableStressMpa: selectedStress.value,
      jointEfficiency: Number(efficiency),
      originalThicknessMm,
      previousThicknessMm,
      actualThicknessMm,
      yearsInService: selectedServiceYears.value,
      yearsSincePreviousInspection: selectedInspectionYears.value,
      nextInspectionYears: Number(nextInspectionYears),
    };
    if (component === "spherical") return calculateSphericalShell(input);
    if (component === "ellipsoidal") return calculateEllipsoidalHead(input);
    if (component === "torispherical") return calculateTorisphericalHead({ ...input, crownRadiusMm });
    if (component === "hemispherical") return calculateHemisphericalHead({ ...input, sphericalRadiusMm });
    if (component === "conical") return calculateConicalHead({ ...input, outsideDiameterMm: insideDiameterMm, halfApexAngleDeg: Number(halfApexAngle) });
    if (component === "flat-circular") return calculateFlatCircularHead({ ...input, diameterOrShortSpanMm, attachmentFactor: Number(attachmentFactor) });
    return calculateCylindricalShell(input);
  }, [actualThicknessMm, attachmentFactor, component, crownRadiusMm, diameterOrShortSpanMm, efficiency, halfApexAngle, insideDiameterMm, nextInspectionYears, originalThicknessMm, pressureMpa, previousThicknessMm, selectedInspectionYears.value, selectedServiceYears.value, selectedStress.value, sphericalRadiusMm]);
  const calculatorDefinition = api510CalculatorFor(component);
  const componentLabel = calculatorDefinition.title;
  const inputSnapshot: Api510InputSnapshot = {
    component,
    unitSystem,
    pressureUnit: pressureInputUnit,
    diameterUnit: diameterInputUnit,
    crownRadiusUnit: crownRadiusInputUnit,
    sphericalRadiusUnit: sphericalRadiusInputUnit,
    diameterOrShortSpanUnit: diameterOrShortSpanInputUnit,
    designTemperatureUnit: designTemperatureInputUnit,
    allowableStressUnit: allowableStressInputUnit,
    originalThicknessUnit: originalThicknessInputUnit,
    previousThicknessUnit: previousThicknessInputUnit,
    actualThicknessUnit: actualThicknessInputUnit,
    pressure,
    diameter,
    crownRadius,
    sphericalRadius,
    halfApexAngle,
    diameterOrShortSpan,
    attachmentFactor,
    efficiency,
    designTemperature,
    materialSpec,
    gradeKey,
    stressMode,
    manualStress,
    originalThickness,
    previousThickness,
    actualThickness,
    buildYear,
    serviceYearsMode,
    manualServiceYears,
    previousInspectionYear,
    inspectionYearsMode,
    manualInspectionYears,
    nextInspectionYears,
    resolvedAllowableStressMpa: selectedStress.value,
    resolvedYearsInService: selectedServiceYears.value,
    resolvedYearsSincePreviousInspection: selectedInspectionYears.value,
  };
  const recordFingerprint = createCalculationFingerprint({
    projectId: saveProjectId || savedProjectId || "",
    equipmentTag,
    equipmentName,
    title: calculationTitle,
    inputs: inputSnapshot,
    result,
  });
  const isDirty = lastSavedFingerprint !== null && lastSavedFingerprint !== recordFingerprint;
  const reviewConfirmed = recordStatus !== "draft" && workflow?.reviewedFingerprint === recordFingerprint;
  const reviewConfirmationChecked = reviewConfirmed || reviewAcknowledged;
  const reportProject = projects.find((project) => project.id === (savedProjectId ?? saveProjectId));
  const reportModel = createApi510ReportModel({
    projectName: reportProject?.name ?? "Unassigned local calculation",
    client: reportProject?.client ?? "",
    site: reportProject?.site ?? "",
    equipmentTag,
    equipmentName,
    calculationId: savedCalculationId,
    title: calculationTitle === "API 510 assessment" ? `${componentLabel} assessment` : calculationTitle,
    status: recordStatus,
    workflow,
    preparedBy,
    updatedAt: savedUpdatedAt,
    inputs: inputSnapshot,
    result,
  });
  const openSaveDialog = () => {
    if (projects.length === 0) {
      notify("Create a local project before saving this calculation.");
      onNeedProject();
      return;
    }
    if (calculationTitle === "API 510 assessment") setCalculationTitle(`${componentLabel} assessment`);
    if (!saveProjectId) setSaveProjectId(projects.find((project) => project.status === "active")?.id ?? projects[0]?.id ?? "");
    setSaveDialogOpen(true);
  };
  const saveLocalRecord = () => {
    if (!result.ok) {
      notify(calculationError ?? "Resolve the calculation input errors before saving.");
      return;
    }
    try {
      const updatesExistingRecord = Boolean(savedCalculationId && savedProjectId === saveProjectId);
      const saved = onSave({
        projectId: saveProjectId,
        equipmentId: updatesExistingRecord ? savedEquipmentId : undefined,
        equipmentTag,
        equipmentName,
        calculationId: updatesExistingRecord ? savedCalculationId : undefined,
        title: calculationTitle,
        status: "draft",
        preparedBy,
        inputs: inputSnapshot,
        result,
      });
      setSavedProjectId(saved.projectId);
      setSavedEquipmentId(saved.equipmentId);
      setSavedCalculationId(saved.id);
      setSavedUpdatedAt(saved.updatedAt);
      setRecordStatus(saved.status);
      setWorkflow(saved.workflow);
      setLastSavedFingerprint(recordFingerprint);
      setAutosaveState("saved");
      setSaveDialogOpen(false);
      notify(`${saved.status === "draft" ? "Draft" : `${saved.status[0]?.toUpperCase()}${saved.status.slice(1)} record`} saved locally.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Calculation could not be saved.");
    }
  };
  const measuredThickness = convertFromSI(actualThicknessMm, "length", unitSystem);
  const requiredThickness = convertFromSI(result.requiredThicknessMm, "length", unitSystem);
  const thicknessMargin = result.ok && Number.isFinite(actualThicknessMm)
    ? convertFromSI(actualThicknessMm - result.requiredThicknessMm, "length", unitSystem)
    : null;
  const firstError = result.issues.find((issue) => issue.severity === "error");
  const calculationWarning = result.issues.find((issue) => issue.severity === "warning");
  const calculationError = stressMode === "auto" && materialStress.status !== "resolved"
    ? materialStress.message
    : serviceYearsMode === "auto" && serviceYears.message
      ? serviceYears.message
      : inspectionYearsMode === "auto" && inspectionYears.message
        ? inspectionYears.message
        : firstError?.message;
  useEffect(() => {
    setLastSavedFingerprint((current) => current ?? recordFingerprint);
  }, [recordFingerprint]);
  useEffect(() => {
    setReviewAcknowledged(false);
  }, [recordFingerprint]);
  useEffect(() => {
    if (!isDirty || recordStatus === "draft") return;
    setRecordStatus("draft");
    setWorkflow((current) => current ? {
      revision: current.revision + 1,
      preparedBy: current.preparedBy,
      history: current.history,
    } : current);
    notify("The edited reviewed record returned to Draft and now requires a new review.");
  }, [isDirty, notify, recordStatus]);
  useEffect(() => {
    if (!isDirty || !savedCalculationId || !savedProjectId || !savedEquipmentId || saveDialogOpen || recordStatus !== "draft" || !result.ok) return undefined;
    setAutosaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        const saved = onSave({
          projectId: savedProjectId,
          equipmentId: savedEquipmentId,
          equipmentTag,
          equipmentName,
          calculationId: savedCalculationId,
          title: calculationTitle,
          status: "draft",
          preparedBy,
          inputs: inputSnapshot,
          result,
        });
        setSavedProjectId(saved.projectId);
        setSavedEquipmentId(saved.equipmentId);
        setSavedCalculationId(saved.id);
        setSavedUpdatedAt(saved.updatedAt);
        setRecordStatus(saved.status);
        setWorkflow(saved.workflow);
        setLastSavedFingerprint(recordFingerprint);
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [calculationTitle, equipmentName, equipmentTag, inputSnapshot, isDirty, onSave, preparedBy, recordFingerprint, recordStatus, result, saveDialogOpen, savedCalculationId, savedEquipmentId, savedProjectId]);
  useEffect(() => {
    if (!isDirty) return undefined;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);
  const manualOverrides = [
    stressMode === "manual" ? "Allowable stress" : null,
    serviceYearsMode === "manual" ? "Years in service" : null,
    inspectionYearsMode === "manual" ? "Years since previous inspection" : null,
  ].filter((value): value is string => Boolean(value));
  const hasManualOverrides = manualOverrides.length > 0;
  const requestBack = () => {
    if (!isDirty || window.confirm("Leave this calculation? Unsaved changes will be lost.")) onBack();
  };
  const recordLocalReview = (details: { reviewerName: string; reviewNotes: string }) => {
    if (!saveProjectId) {
      notify("Create or select a local project before recording the review.");
      return false;
    }
    try {
      const updatesExistingRecord = Boolean(savedCalculationId && savedProjectId === saveProjectId);
      const saved = onSave({
        projectId: saveProjectId,
        equipmentId: updatesExistingRecord ? savedEquipmentId : undefined,
        equipmentTag,
        equipmentName,
        calculationId: updatesExistingRecord ? savedCalculationId : undefined,
        title: calculationTitle,
        status: "draft",
        preparedBy,
        inputs: inputSnapshot,
        result,
      });
      const fingerprint = createCalculationFingerprint({
        projectId: saved.projectId,
        equipmentTag,
        equipmentName,
        title: calculationTitle,
        inputs: inputSnapshot,
        result,
      });
      const reviewed = onReview({
        projectId: saved.projectId,
        equipmentId: saved.equipmentId,
        calculationId: saved.id,
        reviewerName: details.reviewerName,
        reviewNotes: details.reviewNotes,
        fingerprint,
      });
      setSavedProjectId(reviewed.projectId);
      setSavedEquipmentId(reviewed.equipmentId);
      setSavedCalculationId(reviewed.id);
      setSavedUpdatedAt(reviewed.updatedAt);
      setRecordStatus(reviewed.status);
      setWorkflow(reviewed.workflow);
      setLastSavedFingerprint(fingerprint);
      setAutosaveState("saved");
      notify("Review recorded locally with reviewer details and revision history.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Review could not be recorded.");
      return false;
    }
  };
  const approveLocalReport = (details: { approverName: string; approvalNotes: string }) => {
    if (!savedProjectId || !savedEquipmentId || !savedCalculationId) {
      notify("Save and review this calculation before approval.");
      return false;
    }
    try {
      const approved = onApprove({
        projectId: savedProjectId,
        equipmentId: savedEquipmentId,
        calculationId: savedCalculationId,
        approverName: details.approverName,
        approvalNotes: details.approvalNotes,
        fingerprint: recordFingerprint,
      });
      setSavedUpdatedAt(approved.updatedAt);
      setRecordStatus(approved.status);
      setWorkflow(approved.workflow);
      notify("Revision approved locally and added to the history.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Approval could not be recorded.");
      return false;
    }
  };
  const openReview = () => {
    if (!result.ok) {
      notify(calculationError ?? "Resolve the calculation errors before review.");
      return;
    }
    if (!saveProjectId) {
      notify("Create or select a local project before recording the review.");
      onNeedProject();
      return;
    }
    setReviewDialogOpen(true);
  };
  const openReportPreview = () => {
    if (!result.ok) {
      notify(calculationError ?? "Resolve the calculation errors before creating a report preview.");
      return;
    }
    setReportPreviewOpen(true);
  };
  const changeStressMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && automaticStressDisplay) setManualStress(automaticStressDisplay);
    setStressMode(mode);
  };
  const changeServiceYearsMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && serviceYears.yearsInService !== null) {
      setManualServiceYears(String(serviceYears.yearsInService));
    }
    setServiceYearsMode(mode);
  };
  const changeInspectionYearsMode = (mode: AutomaticValueMode) => {
    if (mode === "manual" && inspectionYears.yearsSincePreviousInspection !== null) {
      setManualInspectionYears(String(inspectionYears.yearsSincePreviousInspection));
    }
    setInspectionYearsMode(mode);
  };
  const convertDisplayedUnit = (value: string, quantity: EngineeringQuantity, fromUnit: EngineeringUnit, toUnit: EngineeringUnit) => {
    if (!value.trim()) return "";
    return formatConvertedInput(convertBetweenUnits(Number(value), quantity, fromUnit, toUnit), quantity, toUnit);
  };
  const changeInputUnit = (
    value: string,
    setValue: (nextValue: string) => void,
    quantity: EngineeringQuantity,
    currentUnit: EngineeringUnit,
    setUnit: (nextUnit: EngineeringUnit) => void,
    nextUnit: EngineeringUnit,
  ) => {
    if (!isEngineeringUnitForQuantity(nextUnit, quantity) || nextUnit === currentUnit) return;
    setValue(convertDisplayedUnit(value, quantity, currentUnit, nextUnit));
    setUnit(nextUnit);
  };
  const changeUnitSystem = (nextUnitSystem: string) => {
    const next = nextUnitSystem as UnitSystem;
    if (next === unitSystem) return;
    const nextPressureUnit = defaultUnitForSystem("pressure", next);
    const nextLengthUnit = defaultUnitForSystem("length", next);
    const nextTemperatureUnit = defaultUnitForSystem("temperature", next);
    setPressure(convertDisplayedUnit(pressure, "pressure", pressureInputUnit, nextPressureUnit));
    setDiameter(convertDisplayedUnit(diameter, "length", diameterInputUnit, nextLengthUnit));
    setCrownRadius(convertDisplayedUnit(crownRadius, "length", crownRadiusInputUnit, nextLengthUnit));
    setSphericalRadius(convertDisplayedUnit(sphericalRadius, "length", sphericalRadiusInputUnit, nextLengthUnit));
    setDiameterOrShortSpan(convertDisplayedUnit(diameterOrShortSpan, "length", diameterOrShortSpanInputUnit, nextLengthUnit));
    setDesignTemperature(convertDisplayedUnit(designTemperature, "temperature", designTemperatureInputUnit, nextTemperatureUnit));
    setOriginalThickness(convertDisplayedUnit(originalThickness, "length", originalThicknessInputUnit, nextLengthUnit));
    setPreviousThickness(convertDisplayedUnit(previousThickness, "length", previousThicknessInputUnit, nextLengthUnit));
    setActualThickness(convertDisplayedUnit(actualThickness, "length", actualThicknessInputUnit, nextLengthUnit));
    setManualStress(convertDisplayedUnit(manualStress, "pressure", allowableStressInputUnit, nextPressureUnit));
    setPressureInputUnit(nextPressureUnit);
    setDiameterInputUnit(nextLengthUnit);
    setCrownRadiusInputUnit(nextLengthUnit);
    setSphericalRadiusInputUnit(nextLengthUnit);
    setDiameterOrShortSpanInputUnit(nextLengthUnit);
    setDesignTemperatureInputUnit(nextTemperatureUnit);
    setAllowableStressInputUnit(nextPressureUnit);
    setOriginalThicknessInputUnit(nextLengthUnit);
    setPreviousThicknessInputUnit(nextLengthUnit);
    setActualThicknessInputUnit(nextLengthUnit);
    setUnitSystem(next);
  };

  return (
    <div className="calculator-page">
      <div className="calculator-header">
        <button className="back-button" onClick={requestBack}><ArrowLeft size={19} /> API 510 library</button>
        <div className="calculator-heading-row">
          <div><p className="eyebrow">API 510 · Pressure vessel</p><h1>{componentLabel}</h1><p>{calculatorDefinition.description}</p></div>
          <div className="calculator-actions"><span className={`save-state-badge ${isDirty ? "is-dirty" : "is-saved"} ${autosaveState === "error" ? "is-error" : ""}`}>{autosaveState === "saving" ? <RefreshCw size={13} className="spin" /> : isDirty ? <CloudOff size={13} /> : <Cloud size={13} />}{autosaveState === "saving" ? "Saving draft…" : autosaveState === "error" ? "Autosave failed" : isDirty ? savedCalculationId ? "Unsaved changes" : "Not saved" : savedCalculationId ? "Saved locally" : "Ready"}</span><button className="secondary-button" onClick={openSaveDialog}><HardDrive size={17} /> {savedCalculationId ? "Update record" : "Save draft"}</button></div>
        </div>
        <div className="step-line" aria-label="Calculation workflow"><button className="complete" onClick={() => document.getElementById("calculation-basis")?.scrollIntoView({ behavior: "smooth", block: "start" })}><b>1</b> Basis</button><i /><button className={result.ok ? "complete" : "active"} onClick={() => document.getElementById("calculation-inputs")?.scrollIntoView({ behavior: "smooth", block: "start" })}><b>2</b> Inputs</button><i /><button className={reviewConfirmed ? "complete" : reviewDialogOpen ? "active" : ""} onClick={openReview}><b>3</b> Review</button><i /><button className={reportPreviewOpen ? "active" : ""} onClick={openReportPreview}><b>4</b> Report</button></div>
      </div>

      <div className="calculator-workspace">
        <div className="input-column">
          <section className="form-card" id="calculation-basis">
            <div className="form-card-heading"><div><span>01</span><div><h2>Calculation basis</h2><p>Confirm the equipment and design basis.</p></div></div><CircleCheck size={20} /></div>
            <div className="form-grid">
              <TextInputField label="Equipment tag" value={equipmentTag} onChange={setEquipmentTag} help="Equipment identifier used by the local project record." />
              <SelectInputField label="Unit system" value={unitSystem} onChange={changeUnitSystem} options={[{ value: "metric", label: "Metric · MPa / mm / °C" }, { value: "us-customary", label: "U.S. customary · psi / in / °F" }]} />
              <SelectInputField label="Component" value={component} onChange={(value) => setComponent(value as PressureVesselComponent)} options={API510_CALCULATORS.map((definition) => ({ value: definition.component, label: definition.title }))} />
              <SelectInputField label="Material specification" value={materialSpec} onChange={setMaterialSpec} options={pressureVesselMaterialSpecs.map((specification) => ({ value: specification, label: specification }))} />
              <SelectInputField label="Material grade" value={gradeKey} onChange={setGradeKey} options={materialGrades.map((grade) => ({ value: grade.key, label: grade.label }))} />
            </div>
          </section>

          <section className="form-card" id="calculation-inputs">
            <div className="form-card-heading"><div><span>02</span><div><h2>Design and inspection data</h2><p>Enter controlled input values with explicit units.</p></div></div><Info size={20} /></div>
            <div className="form-grid">
              <NumberField label="Internal design pressure" value={pressure} onChange={setPressure} unit={unitSymbol(pressureInputUnit)} unitValue={pressureInputUnit} unitOptions={pressureInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(pressure, setPressure, "pressure", pressureInputUnit, setPressureInputUnit, nextUnit)} help="Positive pressure at calculation condition. Select the actual field unit; it is converted automatically before calculation." />
              {component === "flat-circular"
                ? <NumberField label="Diameter or short span" value={diameterOrShortSpan} onChange={setDiameterOrShortSpan} unit={unitSymbol(diameterOrShortSpanInputUnit)} unitValue={diameterOrShortSpanInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(diameterOrShortSpan, setDiameterOrShortSpan, "length", diameterOrShortSpanInputUnit, setDiameterOrShortSpanInputUnit, nextUnit)} help="Diameter or short span d used by the flat-head equation." />
                : <NumberField label={component === "conical" ? "Outside diameter" : "Inside diameter"} value={diameter} onChange={setDiameter} unit={unitSymbol(diameterInputUnit)} unitValue={diameterInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(diameter, setDiameter, "length", diameterInputUnit, setDiameterInputUnit, nextUnit)} help={component === "conical" ? "Outside diameter D used by the conical-head equation." : "Nominal inside diameter."} />}
              {component === "torispherical" ? <NumberField label="Inside crown radius" value={crownRadius} onChange={setCrownRadius} unit={unitSymbol(crownRadiusInputUnit)} unitValue={crownRadiusInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(crownRadius, setCrownRadius, "length", crownRadiusInputUnit, setCrownRadiusInputUnit, nextUnit)} help="Inside spherical or crown radius L used by the torispherical-head equation." /> : null}
              {component === "hemispherical" ? <NumberField label="Inside spherical radius" value={sphericalRadius} onChange={setSphericalRadius} unit={unitSymbol(sphericalRadiusInputUnit)} unitValue={sphericalRadiusInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(sphericalRadius, setSphericalRadius, "length", sphericalRadiusInputUnit, setSphericalRadiusInputUnit, nextUnit)} help="Inside spherical radius L used by the hemispherical-head equation." /> : null}
              {component === "conical" ? <NumberField label="Cone half-apex angle" value={halfApexAngle} onChange={setHalfApexAngle} unit="°" help="Angle alpha from 0 degrees up to, but not including, 90 degrees." min={0} max={89.9} step={0.1} /> : null}
              {component === "flat-circular" ? <NumberField label="Attachment factor C" value={attachmentFactor} onChange={setAttachmentFactor} unit="C" help="Dimensionless factor based on the applicable attachment detail and dimensional basis." min={0} step={0.001} /> : null}
              <NumberField label="Design temperature" value={designTemperature} onChange={setDesignTemperature} unit={unitSymbol(designTemperatureInputUnit)} unitValue={designTemperatureInputUnit} unitOptions={temperatureInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(designTemperature, setDesignTemperature, "temperature", designTemperatureInputUnit, setDesignTemperatureInputUnit, nextUnit)} help="Temperature used to select the allowable-stress table limit." />
              <AutomaticNumberField label="Allowable stress" value={stressMode === "auto" ? automaticStressDisplay : manualStress} onChange={setManualStress} unit={unitSymbol(allowableStressInputUnit)} unitValue={allowableStressInputUnit} unitOptions={pressureInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(stressMode === "auto" ? automaticStressDisplay : manualStress, setManualStress, "pressure", allowableStressInputUnit, setAllowableStressInputUnit, nextUnit)} help={stressMode === "auto" ? materialStress.message : "Manual override is active. Verify the entered allowable stress against the controlled material basis."} mode={stressMode} onModeChange={changeStressMode} />
              <NumberField label="Joint efficiency" value={efficiency} onChange={setEfficiency} unit="E" help="Applicable welded-joint efficiency." />
              <NumberField label="Original thickness" value={originalThickness} onChange={setOriginalThickness} unit={unitSymbol(originalThicknessInputUnit)} unitValue={originalThicknessInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(originalThickness, setOriginalThickness, "length", originalThicknessInputUnit, setOriginalThicknessInputUnit, nextUnit)} help="Original recorded component thickness." />
              <NumberField label="Previous measured thickness" value={previousThickness} onChange={setPreviousThickness} unit={unitSymbol(previousThicknessInputUnit)} unitValue={previousThicknessInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(previousThickness, setPreviousThickness, "length", previousThicknessInputUnit, setPreviousThicknessInputUnit, nextUnit)} help="Representative thickness at the previous inspection." />
              <NumberField label="Current measured thickness" value={actualThickness} onChange={setActualThickness} unit={unitSymbol(actualThicknessInputUnit)} unitValue={actualThicknessInputUnit} unitOptions={lengthInputUnitOptions} onUnitChange={(nextUnit) => changeInputUnit(actualThickness, setActualThickness, "length", actualThicknessInputUnit, setActualThicknessInputUnit, nextUnit)} help="Representative current inspection thickness." />
              <NumberField label="Build year" value={buildYear} onChange={setBuildYear} unit="year" help={`Whole year from 1900 to ${currentYear}.`} min={1900} max={currentYear} step={1} />
              <AutomaticNumberField label="Years in service" value={serviceYearsMode === "auto" ? serviceYears.yearsInService === null ? "" : String(serviceYears.yearsInService) : manualServiceYears} onChange={setManualServiceYears} unit="yr" help={serviceYearsMode === "auto" ? serviceYears.message ?? `Automatically calculated: ${currentYear} − build year.` : "Manual override is active. Build year remains recorded but does not set this value."} mode={serviceYearsMode} onModeChange={changeServiceYearsMode} />
              <NumberField label="Previous inspection year" value={previousInspectionYear} onChange={setPreviousInspectionYear} unit="year" help={`Whole year from the build year to ${currentYear}.`} min={1900} max={currentYear} step={1} />
              <AutomaticNumberField label="Years since previous inspection" value={inspectionYearsMode === "auto" ? inspectionYears.yearsSincePreviousInspection === null ? "" : String(inspectionYears.yearsSincePreviousInspection) : manualInspectionYears} onChange={setManualInspectionYears} unit="yr" help={inspectionYearsMode === "auto" ? inspectionYears.message ?? `Automatically calculated: ${currentYear} − previous inspection year.` : "Manual override is active. Previous inspection year remains recorded but does not set this value."} mode={inspectionYearsMode} onModeChange={changeInspectionYearsMode} />
              <NumberField label="Next inspection interval" value={nextInspectionYears} onChange={setNextInspectionYears} unit="yr" help="Whole number from 1 to 10 years." />
            </div>
            <div className="unit-system-note"><RefreshCw size={17} /><p><strong>Mixed field units are active.</strong> Each selector converts its input live. Results and report values continue to follow the selected global <b>Unit system</b>.</p></div>
            <div className={`form-note ${hasManualOverrides ? "is-manual" : "is-valid"}`}>{hasManualOverrides ? <TriangleAlert size={18} /> : <CircleCheck size={18} />}<p><strong>{hasManualOverrides ? `${manualOverrides.length} manual override${manualOverrides.length > 1 ? "s" : ""} active.` : "Baseline engine and material catalog connected."}</strong> {hasManualOverrides ? `Verify the highlighted ${manualOverrides.join(" and ")} field${manualOverrides.length > 1 ? "s" : ""} before issue.` : "Automatic values match the protected legacy source and are covered by regression tests."}</p></div>
          </section>

          <section className="reference-card">
            <div className="reference-heading"><div><BookOpenText size={20} /><div><p className="eyebrow">Original reference guidance</p><h2>Before you calculate</h2></div></div><span>No standards PDF</span></div>
            <p>This workflow organizes {componentLabel.toLowerCase()} inputs and makes assumptions visible. Confirm that the selected geometry, material basis, weld efficiency and applicability limits match the controlled edition used for the assessment.</p>
            <div className="reference-points"><span><b>01</b> Verify the pressure and temperature basis.</span><span><b>02</b> Confirm material values from a controlled source.</span><span><b>03</b> Review the governing result with a qualified engineer.</span></div>
          </section>
        </div>

        <aside className="result-column">
          <div className="result-card">
            <div className="result-card-top"><span className="status-pulse" /> Calculation results <small>{result.ok ? "Calculated" : "Check inputs"}</small></div>
            <div className="result-primary-grid">
              <div className="result-primary"><p>Remaining life</p><div className="result-primary-value"><strong>{result.ok ? formatDisplayNumber(result.remainingLifeYears) : "—"}</strong><span>yr</span></div></div>
              <div className="result-primary"><p>Required thickness</p><div className="result-primary-value"><strong>{result.ok ? formatDisplayNumber(requiredThickness) : "—"}</strong><span>{resultLengthUnit}</span></div></div>
            </div>
            <div className="result-comparison"><span>Measured thickness<strong>{Number.isFinite(measuredThickness) ? `${formatDisplayNumber(measuredThickness)} ${resultLengthUnit}` : "—"}</strong></span><span>Thickness margin<strong>{thicknessMargin === null ? "—" : `${formatDisplayNumber(thicknessMargin)} ${resultLengthUnit}`}</strong></span></div>
            <div className="result-comparison"><span>Governing MAWP<strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.governingMawpMpa, "pressure", unitSystem))} ${resultPressureUnit}` : "—"}</strong></span><span>Governing corrosion rate<strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.governingCorrosionRateMmPerYear, "length", unitSystem), "corrosion-rate")} ${resultLengthUnit}/yr` : "—"}</strong></span></div>
            <div className={`result-status ${result.ok ? hasManualOverrides || calculationWarning ? "is-manual" : "is-valid" : ""}`}>{result.ok && !hasManualOverrides && !calculationWarning ? <CircleCheck size={19} /> : <TriangleAlert size={19} />}<div><strong>{result.ok ? hasManualOverrides ? "Calculation includes overrides" : calculationWarning ? "Engineering scope review required" : "Calculation completed" : "Input review required"}</strong><span>{result.ok ? hasManualOverrides ? `Verify ${manualOverrides.join(" and ")} before engineering approval.${calculationWarning ? ` ${calculationWarning.message}` : ""}` : calculationWarning?.message ?? "Review remaining life, required thickness, and MAWP before approval." : calculationError}</span></div></div>
            <button className="calculate-button" onClick={() => notify(result.ok ? "All linked results have been recalculated." : calculationError ?? "Review the calculation inputs.")}><Calculator size={18} /> Recalculate</button>
          </div>

          <div className="trace-card">
            <p className="eyebrow">Supporting results</p><h3>Calculation details</h3>
            <div><span>Component</span><strong>{componentLabel}</strong></div>
            <div><span>Long-term corrosion rate</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.longTermCorrosionRateMmPerYear, "length", unitSystem), "corrosion-rate")} ${resultLengthUnit}/yr` : "—"}</strong></div>
            <div><span>Short-term corrosion rate</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.shortTermCorrosionRateMmPerYear, "length", unitSystem), "corrosion-rate")} ${resultLengthUnit}/yr` : "—"}</strong></div>
            <div><span>Governing corrosion rate</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.governingCorrosionRateMmPerYear, "length", unitSystem), "corrosion-rate")} ${resultLengthUnit}/yr` : "—"}</strong></div>
            <div><span>Corrosion allowance</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.corrosionAllowanceMm, "length", unitSystem))} ${resultLengthUnit}` : "—"}</strong></div>
            <div><span>Projected thickness ({result.intervalYears} yr)</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.projectedThicknessMm, "length", unitSystem))} ${resultLengthUnit}` : "—"}</strong></div>
            <div><span>Future MAWP thickness ({result.intervalYears} yr)</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.futureMawpThicknessMm, "length", unitSystem))} ${resultLengthUnit}` : "—"}</strong></div>
            <div><span>Future MAWP</span><strong>{result.ok ? `${formatDisplayNumber(convertFromSI(result.futureMawpMpa, "pressure", unitSystem))} ${resultPressureUnit}` : "—"}</strong></div>
            <div><span>Overrides</span><strong>{hasManualOverrides ? manualOverrides.join(" · ") : "None"}</strong></div><div><span>Output units</span><strong>{unitSystem === "metric" ? "Metric SI" : "U.S. customary"}</strong></div>
          </div>

          <div className="sticky-actions"><button className="secondary-button" onClick={openReview}><ShieldCheck size={17} /> Review</button><button className="primary-button report-preview-button" onClick={openReportPreview}><FileText size={17} /> Report</button></div>
        </aside>
      </div>
      {saveDialogOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaveDialogOpen(false); }}>
          <section className="modal-card save-calculation-modal" role="dialog" aria-modal="true" aria-labelledby="save-calculation-title">
            <div className="modal-heading"><div><p className="eyebrow">Offline project record</p><h2 id="save-calculation-title">{savedCalculationId ? "Update calculation" : "Save calculation"}</h2></div><button className="icon-button" onClick={() => setSaveDialogOpen(false)} aria-label="Close save calculation form"><X size={19} /></button></div>
            <div className="modal-form-grid">
              <label className="modal-field full"><span>Project *</span><select value={saveProjectId} onChange={(event) => setSaveProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.status === "archived" ? " · Archived" : ""}</option>)}</select></label>
              <label className="modal-field"><span>Equipment tag *</span><input value={equipmentTag} onChange={(event) => setEquipmentTag(event.target.value)} placeholder="V-201" /></label>
              <label className="modal-field"><span>Equipment name</span><input value={equipmentName} onChange={(event) => setEquipmentName(event.target.value)} placeholder="Pressure vessel" /></label>
              <label className="modal-field full"><span>Calculation title *</span><input value={calculationTitle} onChange={(event) => setCalculationTitle(event.target.value)} placeholder={`${componentLabel} assessment`} /></label>
              <label className="modal-field"><span>Prepared by *</span><input value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} placeholder="Preparer name" autoComplete="name" /></label>
              <div className="modal-field workflow-save-status"><span>Workflow status</span><strong className={`record-status ${recordStatus}`}>{recordStatus}</strong><small>Review and approval are recorded only through the controlled workflow.</small></div>
            </div>
            <div className="modal-note"><HardDrive size={17} /><span>The exact inputs, calculated results, units, and overrides will be saved on this device.</span></div>
            <div className="modal-actions"><button className="secondary-button" onClick={() => setSaveDialogOpen(false)}>Cancel</button><button className="primary-button" onClick={saveLocalRecord} disabled={!saveProjectId || !equipmentTag.trim() || !calculationTitle.trim() || !preparedBy.trim()}><CircleCheck size={17} /> {savedCalculationId && savedProjectId === saveProjectId ? "Update record" : "Save locally"}</button></div>
          </section>
        </div>
      ) : null}
      {reviewDialogOpen ? <Api510ReviewDialog model={reportModel} confirmed={reviewConfirmationChecked} onConfirmedChange={(confirmed) => { if (recordStatus === "draft") setReviewAcknowledged(confirmed); else if (!confirmed) notify("Persisted review confirmation can only be replaced by editing the calculation."); }} onRecordReview={recordLocalReview} onClose={() => setReviewDialogOpen(false)} onContinue={() => { setReviewDialogOpen(false); setReportPreviewOpen(true); }} /> : null}
      {reportPreviewOpen ? <Api510ReportPreview model={reportModel} onApprove={approveLocalReport} onClose={() => setReportPreviewOpen(false)} notify={notify} /> : null}
    </div>
  );
}

function TextInputField({ label, value, onChange, help }: { label: string; value: string; onChange: (value: string) => void; help: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /><small>{help}</small></label>;
}

function SelectInputField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="field"><span>{label}</span><select className="select-control native-select" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>;
}

interface UnitSelectorProps {
  unit: string;
  unitValue?: EngineeringUnit;
  unitOptions?: readonly EngineeringUnitOption[];
  onUnitChange?: (unit: EngineeringUnit) => void;
}

function UnitControl({ label, unit, unitValue, unitOptions, onUnitChange }: UnitSelectorProps & { label: string }) {
  if (!unitValue || !unitOptions || !onUnitChange) return <b>{unit}</b>;
  return <select className="unit-picker" aria-label={`${label} unit`} value={unitValue} onChange={(event) => onUnitChange(event.target.value as EngineeringUnit)}>{unitOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>;
}

function AutomaticNumberField({ label, value, onChange, unit, unitValue, unitOptions, onUnitChange, help, mode, onModeChange }: { label: string; value: string; onChange: (value: string) => void; help: string; mode: AutomaticValueMode; onModeChange: (mode: AutomaticValueMode) => void } & UnitSelectorProps) {
  const nextMode = mode === "auto" ? "manual" : "auto";
  return <label className="field automatic-field"><span>{label}<button type="button" aria-label={`${label} help`} title={help}>?</button><button type="button" className={`field-mode-toggle ${mode}`} onClick={() => onModeChange(nextMode)} aria-label={`Switch ${label} to ${nextMode} mode`}>{mode}</button></span><div className={`number-control is-derived ${mode === "manual" ? "is-manual" : ""}`}><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} readOnly={mode === "auto"} /><UnitControl label={label} unit={unit} unitValue={unitValue} unitOptions={unitOptions} onUnitChange={onUnitChange} /></div><small>{help}</small></label>;
}

function NumberField({ label, value, onChange, unit, unitValue, unitOptions, onUnitChange, help, min, max, step, derived = false }: { label: string; value: string; onChange?: (value: string) => void; help: string; min?: number; max?: number; step?: number; derived?: boolean } & UnitSelectorProps) {
  return <label className="field"><span>{label}<button type="button" aria-label={`${label} help`} title={help}>?</button></span><div className={`number-control ${derived ? "is-derived" : ""}`}><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={!onChange} min={min} max={max} step={step} /><UnitControl label={label} unit={unit} unitValue={unitValue} unitOptions={unitOptions} onUnitChange={onUnitChange} /></div><small>{help}</small></label>;
}

export default App;
