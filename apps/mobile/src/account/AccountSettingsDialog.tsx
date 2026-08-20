import { useState } from "react";
import type { UnitSystem } from "@api-calc-pro/calc-engine";
import {
  Check,
  Cloud,
  CreditCard,
  Fingerprint,
  HardDrive,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  X,
} from "lucide-react";

export type AccountDialog = "sign-in" | "units" | "restore-purchase" | "privacy";
export type AppearanceTheme = "light" | "dark";

interface AccountSettingsDialogProps {
  dialog: AccountDialog;
  theme: AppearanceTheme;
  preferredUnitSystem: UnitSystem;
  projectCount: number;
  onThemeChange: (theme: AppearanceTheme) => void;
  onPreferredUnitSystemChange: (unitSystem: UnitSystem) => void;
  onOpenBackup: () => void;
  onClose: () => void;
}

const dialogTitle: Record<AccountDialog, { eyebrow: string; title: string }> = {
  "sign-in": { eyebrow: "Account access", title: "Sign in to API Calc Pro" },
  units: { eyebrow: "Preferences", title: "Units and appearance" },
  "restore-purchase": { eyebrow: "Lifetime access", title: "Restore purchase" },
  privacy: { eyebrow: "Device data", title: "Privacy and security" },
};

export function AccountSettingsDialog({ dialog, theme, preferredUnitSystem, projectCount, onThemeChange, onPreferredUnitSystemChange, onOpenBackup, onClose }: AccountSettingsDialogProps) {
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  const [restoreChecked, setRestoreChecked] = useState(false);
  const heading = dialogTitle[dialog];
  const selectProvider = (provider: string) => setProviderMessage(`${provider} sign-in needs an internet connection and registered app credentials. Local calculations remain available without signing in.`);

  return (
    <div className="modal-backdrop account-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
        <div className="modal-heading"><div><p className="eyebrow">{heading.eyebrow}</p><h2 id="account-dialog-title">{heading.title}</h2></div><button className="icon-button" onClick={onClose} aria-label={`Close ${heading.title}`}><X size={19} /></button></div>

        {dialog === "sign-in" ? <>
          <p className="dialog-intro">Choose the same identity on every device to restore access and synchronize records when online services are enabled.</p>
          <div className="provider-list">
            <button onClick={() => selectProvider("Google")}><span><Mail size={19} /><strong>Continue with Google</strong></span><small>Google account</small></button>
            <button onClick={() => selectProvider("Apple")}><span><Fingerprint size={19} /><strong>Continue with Apple</strong></span><small>Apple ID</small></button>
            <button onClick={() => selectProvider("Phone number")}><span><Smartphone size={19} /><strong>Continue with phone number</strong></span><small>SMS verification</small></button>
          </div>
          {providerMessage ? <div className="account-inline-note"><LockKeyhole size={18} /><p>{providerMessage}</p></div> : null}
          <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Continue without account</button></div>
        </> : null}

        {dialog === "units" ? <>
          <section className="preference-section"><h3>Preferred unit system</h3><p>Used as the starting preference for quick tools and new local workflows.</p><div className="preference-options">
            <button className={preferredUnitSystem === "metric" ? "selected" : ""} onClick={() => onPreferredUnitSystemChange("metric")}><span><strong>Metric</strong><small>MPa · mm · °C</small></span>{preferredUnitSystem === "metric" ? <Check size={18} /> : null}</button>
            <button className={preferredUnitSystem === "us-customary" ? "selected" : ""} onClick={() => onPreferredUnitSystemChange("us-customary")}><span><strong>U.S. customary</strong><small>psi · in · °F</small></span>{preferredUnitSystem === "us-customary" ? <Check size={18} /> : null}</button>
          </div></section>
          <section className="preference-section"><h3>Appearance</h3><p>Choose the display theme for this device.</p><div className="preference-options">
            <button className={theme === "light" ? "selected" : ""} onClick={() => onThemeChange("light")}><span><Sun size={18} /><strong>Light</strong></span>{theme === "light" ? <Check size={18} /> : null}</button>
            <button className={theme === "dark" ? "selected" : ""} onClick={() => onThemeChange("dark")}><span><Moon size={18} /><strong>Dark</strong></span>{theme === "dark" ? <Check size={18} /> : null}</button>
          </div></section>
          <div className="modal-actions"><button className="primary-button" onClick={onClose}>Done</button></div>
        </> : null}

        {dialog === "restore-purchase" ? <>
          <div className="account-feature-icon"><CreditCard size={25} /></div>
          <h3 className="account-feature-title">Restore lifetime access</h3>
          <p className="dialog-intro centered">Use the Google Play or Apple account that completed the original one-time purchase. Restoring never creates another charge.</p>
          {restoreChecked ? <div className="account-inline-note"><Cloud size={18} /><p>No store receipt is available in this local test build.</p></div> : null}
          <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => setRestoreChecked(true)}>Restore purchase</button></div>
        </> : null}

        {dialog === "privacy" ? <>
          <div className="privacy-summary"><div><HardDrive size={21} /></div><span><strong>Stored on this device</strong><small>{projectCount} local project{projectCount === 1 ? "" : "s"}; no account is connected.</small></span></div>
          <div className="privacy-list">
            <div><ShieldCheck size={19} /><span><strong>Calculation privacy</strong><small>Calculations and reports remain in local application storage unless you export them.</small></span></div>
            <div><LockKeyhole size={19} /><span><strong>Account security</strong><small>No login token, password, payment card, or store receipt is stored by this local build.</small></span></div>
          </div>
          <div className="modal-actions"><button className="secondary-button" onClick={onOpenBackup}>Backup and restore</button><button className="primary-button" onClick={onClose}>Done</button></div>
        </> : null}
      </section>
    </div>
  );
}
