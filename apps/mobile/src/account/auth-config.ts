import { Capacitor } from "@capacitor/core";
import type { FirebaseWebConfiguration } from "./auth-model.ts";
import { missingFirebaseWebConfiguration } from "./auth-model.ts";
import { firebasePublicWebConfiguration } from "./firebase-public-config.ts";

export const firebaseWebConfiguration: FirebaseWebConfiguration = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || firebasePublicWebConfiguration.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || firebasePublicWebConfiguration.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || firebasePublicWebConfiguration.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || firebasePublicWebConfiguration.appId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || firebasePublicWebConfiguration.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || firebasePublicWebConfiguration.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || firebasePublicWebConfiguration.measurementId,
};

export const isNativeAuthentication = Capacitor.isNativePlatform();
const missingWebFields = missingFirebaseWebConfiguration(firebaseWebConfiguration);
const nativeAuthenticationEnabled = import.meta.env.VITE_NATIVE_FIREBASE_AUTH_ENABLED === "true";

export const authenticationConfiguration = {
  configured: isNativeAuthentication ? nativeAuthenticationEnabled : missingWebFields.length === 0,
  mode: isNativeAuthentication ? "native" : "web",
  missingFields: isNativeAuthentication && !nativeAuthenticationEnabled
    ? ["VITE_NATIVE_FIREBASE_AUTH_ENABLED"]
    : missingWebFields,
} as const;
