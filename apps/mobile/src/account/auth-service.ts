import {
  FirebaseAuthentication,
  Persistence,
} from "@capacitor-firebase/authentication";
import type { PluginListenerHandle } from "@capacitor/core";
import type { User } from "@capacitor-firebase/authentication";
import { getApps, initializeApp } from "firebase/app";
import type {
  AuthenticationProvider,
  AuthenticationUser,
} from "./auth-model.ts";
import {
  authenticationConfiguration,
  firebaseWebConfiguration,
  isNativeAuthentication,
} from "./auth-config.ts";

function toAuthenticationUser(user: User | null): AuthenticationUser | null {
  if (!user) return null;
  return {
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    photoUrl: user.photoUrl,
    providerId: user.providerData[0]?.providerId ?? user.providerId,
    uid: user.uid,
  };
}

function assertAuthenticationConfigured(): void {
  if (authenticationConfiguration.configured) return;
  throw new Error(`Firebase authentication configuration is incomplete: ${authenticationConfiguration.missingFields.join(", ")}`);
}

function initializeFirebaseWebApplication(): void {
  if (isNativeAuthentication || getApps().length > 0) return;
  initializeApp(firebaseWebConfiguration);
}

export async function initializeAuthentication(): Promise<AuthenticationUser | null> {
  assertAuthenticationConfigured();
  initializeFirebaseWebApplication();

  if (!isNativeAuthentication) {
    await FirebaseAuthentication.setPersistence({ persistence: Persistence.IndexedDbLocal });
    await FirebaseAuthentication.useAppLanguage();
  }

  const result = await FirebaseAuthentication.getCurrentUser();
  return toAuthenticationUser(result.user);
}

export async function observeAuthenticationState(listener: (user: AuthenticationUser | null) => void): Promise<PluginListenerHandle> {
  assertAuthenticationConfigured();
  initializeFirebaseWebApplication();
  return FirebaseAuthentication.addListener("authStateChange", ({ user }) => listener(toAuthenticationUser(user)));
}

export async function signInWithAuthenticationProvider(provider: AuthenticationProvider): Promise<AuthenticationUser | null> {
  assertAuthenticationConfigured();
  initializeFirebaseWebApplication();

  if (provider === "google") {
    const result = await FirebaseAuthentication.signInWithGoogle(isNativeAuthentication
      ? { useCredentialManager: true }
      : { mode: "popup" });
    return toAuthenticationUser(result.user);
  }

  const result = await FirebaseAuthentication.signInWithApple(isNativeAuthentication
    ? { scopes: ["email", "name"] }
    : { mode: "popup", scopes: ["email", "name"] });
  return toAuthenticationUser(result.user);
}

export async function signOutAuthenticatedUser(): Promise<void> {
  assertAuthenticationConfigured();
  initializeFirebaseWebApplication();
  await FirebaseAuthentication.signOut();
}
