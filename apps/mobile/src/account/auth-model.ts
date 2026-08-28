export type AuthenticationProvider = "google" | "apple";

export interface AuthenticationUser {
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  photoUrl: string | null;
  providerId: string;
  uid: string;
}

export interface FirebaseWebConfiguration {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const requiredFirebaseWebFields = ["apiKey", "authDomain", "projectId", "appId"] as const;

export function missingFirebaseWebConfiguration(configuration: FirebaseWebConfiguration): string[] {
  return requiredFirebaseWebFields.filter((field) => !configuration[field]?.trim());
}

export function authenticationProviderLabel(provider: AuthenticationProvider | string): string {
  if (provider === "google" || provider === "google.com") return "Google";
  if (provider === "apple" || provider === "apple.com") return "Apple";
  return "Secure account";
}

export function authenticationUserInitials(user: Pick<AuthenticationUser, "displayName" | "email"> | null, fallback = "LV"): string {
  const source = user?.displayName?.trim() || user?.email?.split("@")[0]?.trim();
  if (!source) return fallback;

  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`
    : parts[0]?.slice(0, 2) ?? "";
  return initials.toUpperCase() || fallback;
}

export function describeAuthenticationError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalizedMessage = message.toLowerCase();

  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request") || normalizedMessage.includes("canceled")) {
    return "Sign-in was cancelled. No account changes were made.";
  }
  if (code.includes("NoCredential") || normalizedMessage.includes("no credentials available")) {
    return "No compatible sign-in account is available on this device. Add an account in device settings and try again.";
  }
  if (code.includes("unauthorized-domain")) {
    return "This web address is not authorized in Firebase Authentication yet.";
  }
  if (code.includes("operation-not-allowed")) {
    return "This sign-in provider is not enabled in Firebase Authentication yet.";
  }
  if (code.includes("network-request-failed")) {
    return "Sign-in could not reach the authentication service. Check the internet connection and try again.";
  }
  if (code.includes("account-exists-with-different-credential")) {
    return "An account already exists with this email using a different sign-in provider.";
  }
  if (message.includes("Firebase App") || normalizedMessage.includes("configuration")) {
    return "Firebase Authentication is not fully configured for this application build.";
  }
  return "Sign-in could not be completed. Review the provider configuration and try again.";
}
