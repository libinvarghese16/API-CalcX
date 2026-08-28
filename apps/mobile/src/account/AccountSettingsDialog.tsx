import { useState } from "react";
import type { UnitSystem } from "@api-calc-pro/calc-engine";
import {
  BadgeCheck,
  Check,
  Cloud,
  CreditCard,
  Fingerprint,
  HardDrive,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import type { AuthenticationSession } from "./use-auth-session.ts";
import { authenticationProviderLabel, authenticationUserInitials } from "./auth-model.ts";

export type AccountDialog = "sign-in" | "units" | "restore-purchase" | "privacy";
export type AppearanceTheme = "light" | "dark";

interface AccountSettingsDialogProps {
  dialog: AccountDialog;
  theme: AppearanceTheme;
  preferredUnitSystem: UnitSystem;
  projectCount: number;
  authentication: AuthenticationSession;
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

export function AccountSettingsDialog({ dialog, theme, preferredUnitSystem, projectCount, authentication, onThemeChange, onPreferredUnitSystemChange, onOpenBackup, onClose }: AccountSettingsDialogProps) {
  const [restoreChecked, setRestoreChecked] = useState(false);
  const heading = dialogTitle[dialog];
  const closeDialog = () => {
    authentication.clearError();
    onClose();
  };
  const authenticationBusy = authentication.busyProvider !== null;

  return (
    <div className="modal-backdrop account-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
      <section className="modal-card account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
        <div className="modal-heading"><div><p className="eyebrow">{heading.eyebrow}</p><h2 id="account-dialog-title">{heading.title}</h2></div><button className="icon-button" onClick={closeDialog} aria-label={`Close ${heading.title}`}><X size={19} /></button></div>

        {dialog === "sign-in" ? <>
          {authentication.user ? <>
            <div className="authenticated-user-card">
              <div className="authenticated-avatar">
                {authentication.user.photoUrl ? <img src={authentication.user.photoUrl} alt="" referrerPolicy="no-referrer" /> : authenticationUserInitials(authentication.user)}
              </div>
              <span><small>Signed in with {authenticationProviderLabel(authentication.user.providerId)}</small><strong>{authentication.user.displayName || authentication.user.email || "API Calc Pro account"}</strong>{authentication.user.email ? <em>{authentication.user.email}</em> : null}</span>
              <BadgeCheck size={21} />
            </div>
            <p className="dialog-intro authenticated-intro">Your identity is connected. Calculations and project records remain on this device until cloud synchronization is separately enabled.</p>
            {authentication.error ? <div className="account-inline-note is-error"><LockKeyhole size={18} /><p>{authentication.error}</p></div> : null}
            <div className="modal-actions"><button className="secondary-button" onClick={closeDialog}>Close</button><button className="danger-outline-button" onClick={() => void authentication.signOut()} disabled={authenticationBusy}><LogOut size={17} /> {authentication.busyProvider === "sign-out" ? "Signing out…" : "Sign out"}</button></div>
          </> : <>
            <p className="dialog-intro">Use Google or Apple to keep one secure identity across the web, Android, and iOS applications. Local calculations remain available without an account.</p>
            <div className="provider-list">
              <button onClick={() => void authentication.signIn("google")} disabled={!authentication.ready || authenticationBusy}><span><Mail size={19} /><strong>{authentication.busyProvider === "google" ? "Connecting to Google…" : "Continue with Google"}</strong></span><small>{authentication.configured ? "Secure OAuth" : "Configuration required"}</small>{authentication.busyProvider === "google" ? <LoaderCircle className="spin" size={17} /> : null}</button>
              <button onClick={() => void authentication.signIn("apple")} disabled={!authentication.ready || authenticationBusy}><span><Fingerprint size={19} /><strong>{authentication.busyProvider === "apple" ? "Connecting to Apple…" : "Continue with Apple"}</strong></span><small>{authentication.configured ? "Secure OAuth" : "Configuration required"}</small>{authentication.busyProvider === "apple" ? <LoaderCircle className="spin" size={17} /> : null}</button>
            </div>
            {!authentication.configured ? <div className="account-configuration-note"><LockKeyhole size={18} /><span><strong>Provider connection pending</strong><small>Add this app's Firebase configuration and enable Google and Apple before testing sign-in.</small></span></div> : null}
            {authentication.error ? <div className="account-inline-note is-error"><LockKeyhole size={18} /><p>{authentication.error}</p></div> : null}
            <div className="modal-actions"><button className="secondary-button" onClick={closeDialog}>Continue without account</button></div>
          </>}
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
          <div className="modal-actions"><button className="primary-button" onClick={closeDialog}>Done</button></div>
        </> : null}

        {dialog === "restore-purchase" ? <>
          <div className="account-feature-icon"><CreditCard size={25} /></div>
          <h3 className="account-feature-title">Restore lifetime access</h3>
          <p className="dialog-intro centered">Use the Google Play or Apple account that completed the original one-time purchase. Restoring never creates another charge.</p>
          {restoreChecked ? <div className="account-inline-note"><Cloud size={18} /><p>No store receipt is available in this local test build.</p></div> : null}
          <div className="modal-actions"><button className="secondary-button" onClick={closeDialog}>Cancel</button><button className="primary-button" onClick={() => setRestoreChecked(true)}>Restore purchase</button></div>
        </> : null}

        {dialog === "privacy" ? <>
          <div className="privacy-summary"><div><HardDrive size={21} /></div><span><strong>Stored on this device</strong><small>{projectCount} local project{projectCount === 1 ? "" : "s"}; no account is connected.</small></span></div>
          <div className="privacy-list">
            <div><ShieldCheck size={19} /><span><strong>Calculation privacy</strong><small>Calculations and reports remain in local application storage unless you export them.</small></span></div>
            <div><LockKeyhole size={19} /><span><strong>Account security</strong><small>{authentication.user ? `Signed in with ${authenticationProviderLabel(authentication.user.providerId)}; Firebase manages the authentication session.` : "No account is currently connected."}</small></span></div>
          </div>
          <div className="modal-actions"><button className="secondary-button" onClick={onOpenBackup}>Backup and restore</button><button className="primary-button" onClick={closeDialog}>Done</button></div>
        </> : null}
      </section>
    </div>
  );
}
