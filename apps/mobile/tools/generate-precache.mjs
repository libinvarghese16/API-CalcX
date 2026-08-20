import { readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(toolDirectory, "..");
const distDirectory = resolve(appDirectory, "dist");
const excluded = new Set(["precache-manifest.js", "sw.js"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolute));
    else if (!excluded.has(relative(distDirectory, absolute).split(sep).join("/"))) files.push(absolute);
  }
  return files;
}

const files = (await collectFiles(distDirectory))
  .map((absolute) => `/${relative(distDirectory, absolute).split(sep).join("/")}`)
  .sort();
const urls = ["/", ...files.filter((url) => url !== "/index.html")];
const source = `self.__API_CALC_PRECACHE = ${JSON.stringify(urls, null, 2)};\n`;

await writeFile(resolve(distDirectory, "precache-manifest.js"), source, "utf8");
console.log(`Generated offline precache manifest (${urls.length} files).`);
