import assert from "node:assert/strict";
import test from "node:test";
import {
  authenticationProviderLabel,
  authenticationUserInitials,
  describeAuthenticationError,
  missingFirebaseWebConfiguration,
} from "../src/account/auth-model.ts";
import { firebasePublicWebConfiguration } from "../src/account/firebase-public-config.ts";

test("requires the Firebase fields needed for web authentication", () => {
  assert.deepEqual(missingFirebaseWebConfiguration({}), ["apiKey", "authDomain", "projectId", "appId"]);
  assert.deepEqual(missingFirebaseWebConfiguration({
    apiKey: "public-api-key",
    authDomain: "api-calc-pro.firebaseapp.com",
    projectId: "api-calc-pro",
    appId: "web-app-id",
  }), []);
});

test("ships only the registered Firebase Web app's public identification", () => {
  assert.deepEqual(missingFirebaseWebConfiguration(firebasePublicWebConfiguration), []);
  assert.equal("clientSecret" in firebasePublicWebConfiguration, false);
  assert.equal("privateKey" in firebasePublicWebConfiguration, false);
});

test("presents Google and Apple provider identities", () => {
  assert.equal(authenticationProviderLabel("google.com"), "Google");
  assert.equal(authenticationProviderLabel("apple.com"), "Apple");
  assert.equal(authenticationProviderLabel("unknown"), "Secure account");
});

test("builds stable profile initials when providers omit profile fields", () => {
  assert.equal(authenticationUserInitials({ displayName: "Libin Varghese", email: "libin@example.com" }), "LV");
  assert.equal(authenticationUserInitials({ displayName: null, email: "engineering.user@example.com" }), "EU");
  assert.equal(authenticationUserInitials(null), "LV");
});

test("returns professional provider error messages without exposing credentials", () => {
  assert.equal(describeAuthenticationError({ code: "auth/unauthorized-domain" }), "This web address is not authorized in Firebase Authentication yet.");
  assert.equal(describeAuthenticationError({ code: "auth/operation-not-allowed" }), "This sign-in provider is not enabled in Firebase Authentication yet.");
  assert.equal(describeAuthenticationError({ code: "auth/popup-closed-by-user" }), "Sign-in was cancelled. No account changes were made.");
  assert.equal(describeAuthenticationError(new Error("No credentials available")), "No compatible sign-in account is available on this device. Add an account in device settings and try again.");
});
