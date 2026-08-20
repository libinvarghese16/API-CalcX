import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(testDirectory, "..");
const readAppFile = (path: string) => readFileSync(resolve(appDirectory, path), "utf8");

const config = readAppFile("capacitor.config.ts");
const packageJson = JSON.parse(readAppFile("package.json")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
};
const appSource = readAppFile("src/App.tsx");
const manifest = readAppFile("android/app/src/main/AndroidManifest.xml");
const gradleVariables = readAppFile("android/variables.gradle");
const mainActivity = readAppFile("android/app/src/main/java/com/libinvarghese/apicalcpro/MainActivity.java");

test("locks the isolated Capacitor wrapper to the API Calc Pro identity and production output", () => {
  assert.match(config, /appId: "com\.libinvarghese\.apicalcpro"/);
  assert.match(config, /appName: "API Calc Pro"/);
  assert.match(config, /webDir: "dist"/);
  assert.equal(packageJson.dependencies["@capacitor/core"], "8.5.0");
  assert.equal(packageJson.dependencies["@capacitor/android"], "8.5.0");
  assert.equal(packageJson.dependencies["@capacitor/app"], "8.1.1");
  assert.equal(packageJson.devDependencies["@capacitor/cli"], "8.5.0");
});

test("syncs and verifies the exact production bundle before native use", () => {
  assert.match(packageJson.scripts["android:sync"] ?? "", /npm run build && cap sync android && npm run android:verify-assets/);
  assert.match(packageJson.scripts["android:verify-assets"] ?? "", /verify-native-assets\.mjs/);
  assert.match(packageJson.scripts["android:build-debug"] ?? "", /build-android-debug\.ps1/);
  assert.match(packageJson.scripts["android:verify-apk"] ?? "", /verify-debug-apk\.ps1/);
  assert.match(packageJson.scripts["android:instrumented-test"] ?? "", /run-android-instrumented-test\.ps1/);
});

test("uses the approved API Calc Pro mark for native launcher and splash generation", () => {
  const approvedMark = readFileSync(resolve(appDirectory, "public/brand/api-calc-mark.png"));
  const nativeBrandSource = readFileSync(resolve(appDirectory, "resources/logo.png"));
  const adaptiveIcon = readAppFile("android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml");

  assert.deepEqual(nativeBrandSource, approvedMark);
  assert.match(adaptiveIcon, /@mipmap\/ic_launcher_foreground/);
  assert.doesNotMatch(adaptiveIcon, /@drawable\/ic_launcher_foreground/);
});

test("registers Android back navigation while keeping browser behavior unchanged", () => {
  assert.match(appSource, /Capacitor\.isNativePlatform\(\)/);
  assert.match(appSource, /NativeApp\.addListener\("backButton"/);
  assert.match(appSource, /resolveNativeBackAction\(page, mobileMenu\)/);
  assert.match(appSource, /NativeApp\.exitApp\(\)/);
});

test("keeps the first native shell local-only and compatible with Capacitor 8 Android support", () => {
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android\.permission\.INTERNET/);
  assert.doesNotMatch(manifest, /usesCleartextTraffic/);
  assert.match(gradleVariables, /minSdkVersion = 24/);
  assert.match(gradleVariables, /compileSdkVersion = 36/);
  assert.match(gradleVariables, /targetSdkVersion = 36/);
  assert.match(mainActivity, /package com\.libinvarghese\.apicalcpro;/);
});
