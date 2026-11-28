import { useEffect, useState } from "react";
import { adminRequest } from "./admin-api.ts";
import type { PinSession } from "./admin-api.ts";

export function OwnerPinForm({ purpose, onUnlocked }: { purpose: "login" | "management"; onUnlocked: (session: PinSession) => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setError("");
    try { setConfigured((await adminRequest<{ configured: boolean }>("status")).configured); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load PIN settings."); }
  };
  useEffect(() => { void load(); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      if (!configured) {
        if (pin !== confirmation) throw new Error("The PINs do not match.");
        await adminRequest("setup", { pin }); setConfigured(true);
      }
      const session = await adminRequest<PinSession>("unlock", { pin, purpose });
      setPin(""); setConfirmation(""); onUnlocked(session);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to unlock."); setPin(""); setConfirmation(""); }
    finally { setBusy(false); }
  };
  return <form className="admin-pin-form" onSubmit={event => void submit(event)}>
    <p>{configured === false ? "Create your private security PIN (8–12 digits). Use it after signing in and to open account management." : "Enter your security PIN to continue."}</p>
    {configured !== null && <>
      <label className="field"><span>{configured ? "Security PIN" : "New security PIN"}</span><input autoFocus type="password" inputMode="numeric" pattern="[0-9]{8,12}" minLength={8} maxLength={12} autoComplete={configured ? "current-password" : "new-password"} required value={pin} onChange={event => setPin(event.target.value)} /></label>
      {!configured && <label className="field"><span>Confirm PIN</span><input type="password" inputMode="numeric" pattern="[0-9]{8,12}" maxLength={12} autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
      <button className="primary-button" disabled={busy}>{busy ? "Checking…" : configured ? "Unlock" : "Create PIN and unlock"}</button>
    </>}
    {error && <p role="alert">{error}</p>}
    {configured === null && <button type="button" className="secondary-button" onClick={() => void load()}>Retry</button>}
  </form>;
}
