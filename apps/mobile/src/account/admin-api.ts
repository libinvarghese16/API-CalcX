import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import type { AuthenticationUser } from "./auth-model.ts";

// Visibility hint only. The server independently verifies UID, verified email and revocation.
export const isOwnerCandidate = (user: AuthenticationUser | null) => user?.email?.toLowerCase() === "libinvarghese16@gmail.com" && user.emailVerified;
export class AdminApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
const activePinSessions = new Map<string, string>();
export async function lockOwnerPinSessions() {
  await Promise.allSettled([...activePinSessions].map(([purpose, token]) => adminRequest("lock", { purpose }, token)));
  activePinSessions.clear();
}
export async function adminRequest<T>(action: string, body: Record<string, unknown> = {}, session?: string): Promise<T> {
  const { token } = await FirebaseAuthentication.getIdToken();
  const response = await fetch("/api/account-admin", { method: "POST", cache: "no-store", headers: {
    "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(session ? { "X-Admin-Session": session } : {}),
  }, body: JSON.stringify({ ...body, action }) });
  const data = await response.json().catch(() => ({ error: "Account management is unavailable." })) as T & { error?: string; code?: string };
  if (!response.ok) throw new AdminApiError(data.error || "Request failed.", response.status, data.code);
  if (action === "unlock" && typeof (data as unknown as PinSession).token === "string") activePinSessions.set(String(body.purpose), (data as unknown as PinSession).token);
  if (action === "lock" && activePinSessions.get(String(body.purpose)) === session) activePinSessions.delete(String(body.purpose));
  return data;
}
export interface PinSession { token: string; expiresAt: number }
export interface ManagedUser { uid: string; email: string; name: string; disabled: boolean; paidAccess: boolean | null; createdAt: string; lastSignInAt: string }
