import {
  ArrowRight,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { AuthenticationSession } from "./use-auth-session.ts";

interface AccessGateProps {
  authentication: AuthenticationSession;
  onContinueAsGuest: () => void;
}
export function AccessGate({ authentication, onContinueAsGuest }: AccessGateProps) {
  const authenticationBusy = authentication.busyProvider !== null;

  return (
    <div className="access-gate-backdrop">
      <section className="access-gate" role="dialog" aria-modal="true" aria-labelledby="access-gate-title">
        <div className="access-gate-brand">
          <img src="/brand/api-calc-mark.png" alt="API Calc Pro" />
          <span><strong>API Calc Pro</strong><small>Engineering calculation workspace</small></span>
        </div>

        <div className="access-gate-copy">
          <span className="access-gate-icon"><LockKeyhole size={24} /></span>
          <p className="eyebrow">Account access</p>
          <h1 id="access-gate-title">Sign in to continue.</h1>
          <p>Use one secure account for the complete calculator library, project records, reports, and account settings.</p>
        </div>

        <div className="access-gate-providers">
          <button onClick={() => void authentication.signIn("google")} disabled={!authentication.ready || authenticationBusy}>
            <span><Mail size={20} /><strong>{authentication.busyProvider === "google" ? "Connecting to Google…" : "Continue with Google"}</strong></span>
            {authentication.busyProvider === "google" ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
          </button>
          <button onClick={() => void authentication.signIn("apple")} disabled={!authentication.ready || authenticationBusy}>
            <span><Fingerprint size={20} /><strong>{authentication.busyProvider === "apple" ? "Connecting to Apple…" : "Continue with Apple"}</strong></span>
            {authentication.busyProvider === "apple" ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>

        {!authentication.ready ? <div className="access-gate-status"><LoaderCircle className="spin" size={18} /><span>Preparing secure sign-in…</span></div> : null}
        {!authentication.configured ? <div className="access-gate-status is-warning"><ShieldCheck size={18} /><span>Account providers are not configured in this build.</span></div> : null}
        {authentication.error ? <div className="access-gate-status is-error"><LockKeyhole size={18} /><span>{authentication.error}</span></div> : null}

        <div className="access-gate-divider"><span>or use guest access</span></div>

        <button className="access-gate-guest" onClick={() => { authentication.clearError(); onContinueAsGuest(); }} disabled={!authentication.ready || authenticationBusy}>
          <span className="access-gate-guest-icon"><Wrench size={20} /></span>
          <span><strong>Continue without sign in</strong><small>Access API 570 Piping Systems only</small></span>
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}
