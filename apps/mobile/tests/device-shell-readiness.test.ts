import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(testDirectory, "..");
const html = readFileSync(resolve(appDirectory, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(appDirectory, "public/manifest.webmanifest"), "utf8")) as Record<string, unknown>;
const serviceWorker = readFileSync(resolve(appDirectory, "public/sw.js"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(appDirectory, "package.json"), "utf8")) as { scripts: Record<string, string> };
const precacheTool = readFileSync(resolve(appDirectory, "tools/generate-precache.mjs"), "utf8");
const mainSource = readFileSync(resolve(appDirectory, "src/main.tsx"), "utf8");
const styles = readFileSync(resolve(appDirectory, "src/styles.css"), "utf8");
const appSource = readFileSync(resolve(appDirectory, "src/App.tsx"), "utf8");

test("publishes local Android and iOS install metadata without remote services", () => {
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.equal(manifest.name, "API Calc Pro");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.deepEqual(manifest.icons, [{ src: "/brand/api-calc-mark.png", sizes: "512x512", type: "image/png", purpose: "any" }]);
});

test("registers an offline shell only in production builds", () => {
  assert.match(mainSource, /import\.meta\.env\.PROD/);
  assert.match(mainSource, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(serviceWorker, /importScripts\("\/precache-manifest\.js"\)/);
  assert.match(serviceWorker, /api-calc-pro-mobile-v3/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /contentType\.includes\("text\/html"\)/);
  assert.match(serviceWorker, /caches\.match\("\/"\)/);
  assert.match(packageJson.scripts.build, /generate-precache\.mjs/);
  assert.match(precacheTool, /__API_CALC_PRECACHE/);
});

test("retains phone safe-area spacing, dynamic viewport height, and larger touch controls", () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(styles, /min-height: 100dvh/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /\.mobile-tabs button \{ min-height: 48px; \}/);
  assert.match(styles, /\.field > span button \{ width: 24px; height: 24px;/);
  assert.match(styles, /\.module-card \{[^}]*padding: 19px 19px 43px;/);
  assert.match(styles, /\.module-grid\.compact \.module-card \{[^}]*padding: 15px 15px 39px;/);
});

test("omits internal regression wording and stale hard-coded test counts", () => {
  assert.doesNotMatch(appSource, /Regression suite/);
  assert.doesNotMatch(appSource, /45 passing/);
});
