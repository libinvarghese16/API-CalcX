import { useEffect, useState } from "react";
import { AdminApiError, adminRequest, isOwnerCandidate } from "./admin-api.ts";
import type { ManagedUser, PinSession } from "./admin-api.ts";
import type { AuthenticationUser } from "./auth-model.ts";
import { isNativeAuthentication } from "./auth-config.ts";
import { OwnerPinForm } from "./OwnerPinForm.tsx";

export function AccountManagement({ user }: { user: AuthenticationUser | null }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<PinSession | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ action: string; user: ManagedUser } | null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const reset = () => { setSession(null); setUsers([]); setPending(null); setNextPage(null); setCurrentPin(""); setNewPin(""); setConfirmPin(""); };
  useEffect(() => { reset(); setOpen(false); }, [user?.uid]);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(reset, Math.max(0, session.expiresAt - Date.now()));
    return () => { window.clearTimeout(timer); void adminRequest("lock", { purpose: "management" }, session.token).catch(() => {}); };
  }, [session]);
  const failure = (error: unknown) => {
    setError(error instanceof Error ? error.message : "Request failed.");
    if (error instanceof AdminApiError && [401, 403].includes(error.status)) reset();
  };
  const load = async (activeSession: PinSession, more = false) => {
    setBusy(true); setError("");
    try {
      const result = await adminRequest<{ users: ManagedUser[]; nextPage: string | null }>("users", { email: email.trim(), pageToken: more ? nextPage : undefined }, activeSession.token);
      setUsers(previous => more ? [...previous, ...result.users] : result.users); setNextPage(result.nextPage);
    } catch (error) { failure(error); } finally { setBusy(false); }
  };
  const close = () => {
    if (session) void adminRequest("lock", { purpose: "management" }, session.token).catch(() => {});
    reset(); setOpen(false); setError(""); setNotice("");
  };
  const apply = async () => {
    if (!pending || !session) return;
    setBusy(true); setError(""); setNotice("");
    try { await adminRequest(pending.action, { uid: pending.user.uid }, session.token); setNotice("Account updated."); setPending(null); await load(session); }
    catch (error) { failure(error); } finally { setBusy(false); }
  };
  if (isNativeAuthentication || !isOwnerCandidate(user)) return null;
  return <section className="settings-card account-management">
    <div className="section-heading"><div><p className="eyebrow">Owner security</p><h2>Account management</h2></div></div>
    {!open ? <><p>Manage accounts and paid access. Your security PIN is required each time.</p><button className="primary-button" onClick={() => setOpen(true)}>Open account management</button></> : <>
      <button className="secondary-button" disabled={busy} onClick={close}>Lock and close</button>
      {!session ? <OwnerPinForm purpose="management" onUnlocked={value => { setSession(value); void load(value); }} /> : <>
        <p>Unlock lasts 15 minutes. Paid access changes are manual grants or revocations, not payments or refunds.</p>
        <form className="admin-search" onSubmit={event => { event.preventDefault(); void load(session); }}><label className="field"><span>Find account by exact email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label><button className="secondary-button" disabled={busy}>Search / refresh</button></form>
        <div className="admin-user-list">{users.map(account => <article className="admin-user-card" key={account.uid}>
          <h3>{account.name || account.email || "Unnamed account"}</h3><p>{account.email}</p><p>{account.disabled ? "Disabled" : "Enabled"} · {account.paidAccess === null ? "Existing access (no manual override)" : account.paidAccess ? "Paid access granted" : "Paid access revoked"}</p>
          {account.uid !== user?.uid && <div className="admin-user-actions">{([
            [account.disabled ? "enable" : "disable", account.disabled ? "Enable account" : "Disable account"],
            ["revoke-sessions", "Sign out all devices"], ["grant-paid", "Grant paid access"], ["revoke-paid", "Revoke paid access"],
          ] as const).map(([action, label]) => <button key={action} className="secondary-button" disabled={busy} onClick={() => setPending({ action, user: account })}>{label}</button>)}</div>}
        </article>)}</div>
        {!busy && !users.length && <p>No accounts found.</p>}
        {nextPage && <button className="secondary-button" disabled={busy} onClick={() => void load(session, true)}>Load more accounts</button>}
        {pending && <div className="admin-confirm" role="alertdialog" aria-label="Confirm account change"><p>Confirm <strong>{pending.action.replaceAll("-", " ")}</strong> for <strong>{pending.user.email || pending.user.uid}</strong>?</p><button className="primary-button" disabled={busy} onClick={() => void apply()}>Confirm change</button><button className="secondary-button" disabled={busy} onClick={() => setPending(null)}>Cancel</button></div>}
        <form className="admin-pin-form" onSubmit={event => { event.preventDefault(); setError(""); if (newPin !== confirmPin) { setError("New PINs do not match."); return; } setBusy(true); void adminRequest("change-pin", { currentPin, pin: newPin }, session.token).then(() => { reset(); setNotice("PIN changed. Unlock again with your new PIN."); }).catch(failure).finally(() => setBusy(false)); }}>
          <h3>Change security PIN</h3><p>Sign out and sign in again first. Changing your PIN locks all owner PIN sessions.</p>
          <label className="field"><span>Current PIN</span><input type="password" inputMode="numeric" pattern="[0-9]{8,12}" maxLength={12} autoComplete="current-password" required value={currentPin} onChange={event => setCurrentPin(event.target.value)} /></label>
          <label className="field"><span>New PIN</span><input type="password" inputMode="numeric" pattern="[0-9]{8,12}" maxLength={12} autoComplete="new-password" required value={newPin} onChange={event => setNewPin(event.target.value)} /></label>
          <label className="field"><span>Confirm new PIN</span><input type="password" inputMode="numeric" pattern="[0-9]{8,12}" maxLength={12} autoComplete="new-password" required value={confirmPin} onChange={event => setConfirmPin(event.target.value)} /></label>
          <button className="secondary-button" disabled={busy}>Change PIN</button>
        </form>
      </>}
      {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    </>}
  </section>;
}
