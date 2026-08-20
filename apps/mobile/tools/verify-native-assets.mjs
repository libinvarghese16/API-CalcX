import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(toolsDirectory, "..");
const webDirectory = resolve(appDirectory, "dist");
const nativeDirectory = resolve(appDirectory, "android/app/src/main/assets/public");

async function listFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) return listFiles(absolutePath, root);
    return [relative(root, absolutePath).replaceAll("\\", "/")];
  }));
  return files.flat().sort();
}

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

const webFiles = await listFiles(webDirectory);
const nativeFiles = await listFiles(nativeDirectory);
const allowedNativeOnlyFiles = new Set(["cordova.js", "cordova_plugins.js"]);

const missing = webFiles.filter((file) => !nativeFiles.includes(file));
const unexpectedExtra = nativeFiles.filter((file) => !webFiles.includes(file) && !allowedNativeOnlyFiles.has(file));
const nativeBridgeFiles = nativeFiles.filter((file) => allowedNativeOnlyFiles.has(file));

if (missing.length > 0 || unexpectedExtra.length > 0) {
  throw new Error(`Native asset inventory mismatch. Missing: ${missing.join(", ") || "none"}. Unexpected extra: ${unexpectedExtra.join(", ") || "none"}.`);
}

for (const file of webFiles) {
  const [webHash, nativeHash] = await Promise.all([
    digest(resolve(webDirectory, file)),
    digest(resolve(nativeDirectory, file)),
  ]);
  if (webHash !== nativeHash) throw new Error(`Native asset differs from production build: ${file}`);
}

console.log(`Verified ${webFiles.length} Android production assets byte-for-byte; ${nativeBridgeFiles.length} known Capacitor bridge stubs present.`);
