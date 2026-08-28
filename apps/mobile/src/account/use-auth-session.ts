import { useCallback, useEffect, useState } from "react";
import type { AuthenticationProvider, AuthenticationUser } from "./auth-model.ts";
import { describeAuthenticationError } from "./auth-model.ts";
import { authenticationConfiguration } from "./auth-config.ts";

export interface AuthenticationSession {
  configured: boolean;
  ready: boolean;
  busyProvider: AuthenticationProvider | "sign-out" | null;
  error: string | null;
  user: AuthenticationUser | null;
  signIn: (provider: AuthenticationProvider) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuthenticationSession(): AuthenticationSession {
  const [ready, setReady] = useState(!authenticationConfiguration.configured);
  const [busyProvider, setBusyProvider] = useState<AuthenticationSession["busyProvider"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticationUser | null>(null);

  useEffect(() => {
    if (!authenticationConfiguration.configured) return undefined;

    let active = true;
    let removeListener: (() => Promise<void>) | undefined;

    void import("./auth-service.ts")
      .then(async ({ initializeAuthentication, observeAuthenticationState }) => {
        const initialUser = await initializeAuthentication();
        if (!active) return;
        setUser(initialUser);
        setReady(true);
        const listener = await observeAuthenticationState((nextUser) => {
          if (!active) return;
          setUser(nextUser);
          setBusyProvider(null);
          setError(null);
        });
        removeListener = listener.remove;
      })
      .catch((initializationError: unknown) => {
        if (!active) return;
        setReady(true);
        setError(describeAuthenticationError(initializationError));
      });

    return () => {
      active = false;
      if (removeListener) void removeListener();
    };
  }, []);

  const signIn = useCallback(async (provider: AuthenticationProvider) => {
    setError(null);
    if (!authenticationConfiguration.configured) {
      setError("Connect the Firebase project settings before using Google or Apple sign-in in this build.");
      return;
    }

    setBusyProvider(provider);
    try {
      const { signInWithAuthenticationProvider } = await import("./auth-service.ts");
      const signedInUser = await signInWithAuthenticationProvider(provider);
      if (signedInUser) setUser(signedInUser);
    } catch (signInError: unknown) {
      setError(describeAuthenticationError(signInError));
    } finally {
      setBusyProvider(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusyProvider("sign-out");
    setError(null);
    try {
      const { signOutAuthenticatedUser } = await import("./auth-service.ts");
      await signOutAuthenticatedUser();
      setUser(null);
    } catch (signOutError: unknown) {
      setError(describeAuthenticationError(signOutError));
    } finally {
      setBusyProvider(null);
    }
  }, []);

  return {
    configured: authenticationConfiguration.configured,
    ready,
    busyProvider,
    error,
    user,
    signIn,
    signOut,
    clearError: () => setError(null),
  };
}
