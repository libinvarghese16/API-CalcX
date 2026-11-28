import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthenticationSession } from "./use-auth-session.ts";
import { AdminApiError, adminRequest } from "./admin-api.ts";
import type { PinSession } from "./admin-api.ts";
import { isNativeAuthentication } from "./auth-config.ts";
import { OwnerPinForm } from "./OwnerPinForm.tsx";

const AccountAccessContext = createContext<{ owner: boolean; paidAccess: boolean | null } | null>(null);
export const useAccountAccess = () => useContext(AccountAccessContext);

export function AccountSecurityGate({ authentication, children }: { authentication: AuthenticationSession; children: ReactNode }) {
  const [access, setAccess] = useState<{ owner: boolean; paidAccess: boolean | null } | null>(null);
  const [setupPending, setSetupPending] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState<PinSession | null>(null);
  useEffect(() => {
    let active = true;
    setAccess(null); setLogin(null); setSetupPending(false); setError("");
    if (!authentication.user || isNativeAuthentication) return;
    const check = async () => {
      try {
        const result = await adminRequest<{ owner: boolean; paidAccess: boolean | null }>("access");
        if (active) { setAccess(result); setSetupPending(false); setError(""); }
      } catch (error) {
        if (!active) return;
        if (error instanceof AdminApiError && error.code === "setup-required") setSetupPending(true);
        else { setError(error instanceof Error ? error.message : "Unable to check account access."); setLogin(null); }
      }
    };
    void check(); const timer = window.setInterval(() => void check(), 60000);
    const focus = () => void check(); window.addEventListener("focus", focus);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [authentication.user?.uid]);
  useEffect(() => {
    if (!login) return;
    const timer = window.setTimeout(() => setLogin(null), Math.max(0, login.expiresAt - Date.now()));
    const check = () => { void adminRequest("login-check", {}, login.token).catch(() => setLogin(null)); };
    const interval = window.setInterval(check, 60000); window.addEventListener("focus", check);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener("focus", check); void adminRequest("lock", { purpose: "login" }, login.token).catch(() => {}); };
  }, [login]);
  const denied = access?.paidAccess === false && !access.owner;
  const allowed = !authentication.user || isNativeAuthentication || setupPending || Boolean(!error && access && !denied && (!access.owner || login));
  const [workspaceMounted, setWorkspaceMounted] = useState(false);
  useEffect(() => { if (allowed) setWorkspaceMounted(true); }, [allowed]);
  // Keep unsaved calculator inputs mounted while the PIN lock hides and disables the workspace.
  return <AccountAccessContext.Provider value={access}>
    {(allowed || workspaceMounted) && <div hidden={!allowed} inert={!allowed}>{children}</div>}
    {!allowed && <div className="access-gate-backdrop"><section className="access-gate" role="dialog" aria-modal="true" aria-labelledby="security-gate-title">
    <h1 id="security-gate-title">{denied ? "Account access is not active" : access?.owner ? "Unlock your account" : "Checking account access"}</h1>
    {error ? <p role="alert">{error}</p> : denied ? <p>Contact the account owner to restore your access.</p> : access?.owner ? <OwnerPinForm purpose="login" onUnlocked={setLogin} /> : <p>Connecting securely…</p>}
    <p>Your local calculations remain saved on this device.</p>
    <button className="secondary-button" onClick={() => void authentication.signOut()}>Sign out</button>
  </section></div>}</AccountAccessContext.Provider>;
}
