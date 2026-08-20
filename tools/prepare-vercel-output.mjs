import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolsDirectory, "..");
const mobileOutput = resolve(repositoryRoot, "apps", "mobile", "dist");
const vercelOutput = resolve(repositoryRoot, "dist");

await stat(mobileOutput).catch(() => {
  throw new Error(
    `Mobile build output was not found at ${mobileOutput}. Run the mobile build before preparing Vercel output.`,
  );
});

await rm(vercelOutput, { recursive: true, force: true });
await mkdir(vercelOutput, { recursive: true });
await cp(mobileOutput, vercelOutput, { recursive: true });

console.log(`Prepared Vercel output at ${vercelOutput}`);
