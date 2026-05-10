#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { appendLog, exists, slugify, vaultPath, yamlString } from "./wiki-lib.mjs";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function args(name) {
  const values = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === name && process.argv[i + 1]) values.push(process.argv[i + 1]);
  }
  return values;
}

async function stdin() {
  if (process.stdin.isTTY) return "";
  let value = "";
  for await (const chunk of process.stdin) value += chunk;
  return value;
}

const vault = vaultPath();
const title = arg("--title", "Untitled Source");
const url = arg("--url", "");
const sourceType = arg("--type", url ? "webpage" : "note");
const author = arg("--author", "");
const published = arg("--published", "");
const contentFile = arg("--content-file", "");
const content = contentFile ? await fs.readFile(contentFile, "utf8") : await stdin();
const imageInputs = args("--image");
const date = new Date().toISOString().slice(0, 10);
const rawDir = path.join(vault, "raw");
const noteSlug = slugify(title);

await fs.mkdir(rawDir, { recursive: true });

let filename = `${date}--${noteSlug}.md`;
let target = path.join(rawDir, filename);
let counter = 2;
while (await exists(target)) {
  filename = `${date}--${noteSlug}-${counter}.md`;
  target = path.join(rawDir, filename);
  counter += 1;
}

const imageMarkdown = [];
if (imageInputs.length > 0) {
  const assetDir = path.join(rawDir, "assets", path.basename(target, ".md"));
  await fs.mkdir(assetDir, { recursive: true });
  for (const image of imageInputs) {
    if (/^https?:\/\//i.test(image)) {
      imageMarkdown.push(`![${path.basename(image)}](${image})`);
      continue;
    }
    const resolved = path.resolve(image);
    if (!(await exists(resolved))) {
      imageMarkdown.push(`- Missing local image: \`${image}\``);
      continue;
    }
    const copied = path.join(assetDir, path.basename(resolved));
    await fs.copyFile(resolved, copied);
    const relative = path.relative(path.dirname(target), copied).replace(/\\/g, "/");
    imageMarkdown.push(`![${path.basename(resolved)}](${relative})`);
  }
}

const body = `---\ntitle: ${yamlString(title)}\ntype: raw-source\nsource_type: ${yamlString(sourceType)}\nstatus: inbox\nauthor: ${yamlString(author)}\npublished: ${yamlString(published)}\ncaptured: ${yamlString(new Date().toISOString())}\nsource_url: ${yamlString(url)}\ntags:\n  - raw\nrelated:\n---\n\n# ${title}\n\n## Source\n\n- Author: ${author}\n- Published: ${published}\n- URL: ${url}\n- Captured: ${new Date().toISOString()}\n- Source type: ${sourceType}\n\n## Capture\n\n${content.trim() || "Add source content here."}\n\n## Images\n\n${imageMarkdown.length ? imageMarkdown.join("\n") : "- No explicit images captured."}\n\n## Extracted Claims\n\n- \n\n## Candidate Wiki Links\n\n- \n\n## Processing Notes\n\n- Status: inbox\n- Next action: compile durable ideas into wiki pages.\n`;

await fs.writeFile(target, body, "utf8");
await appendLog(`CAPTURE_RAW source="${path.relative(vault, target)}" type="${sourceType}"`);

let refresh = null;
if (!process.argv.includes("--no-refresh")) {
  const refreshScript = new URL("./refresh-dashboard.mjs", import.meta.url).pathname;
  const result = spawnSync("node", [refreshScript, "--serve"], { encoding: "utf8" });
  const jsonStart = result.stdout.indexOf('{\n  "vault"');
  refresh = {
    status: result.status,
    stdout: jsonStart >= 0 ? JSON.parse(result.stdout.slice(jsonStart)) : null,
    stderr: result.stderr || ""
  };
}

console.log(JSON.stringify({
  path: target,
  vaultRelative: path.relative(vault, target).replace(/\\/g, "/"),
  title,
  images: imageMarkdown.length,
  refreshed: refresh?.status === 0,
  dashboard: refresh?.stdout?.url || "not refreshed",
  next: refresh?.status === 0
    ? "Read this raw note, synthesize wiki pages, mark raw status processed when done. Dashboard graph has already been refreshed after capture."
    : "Read this raw note, synthesize wiki pages, mark raw status processed when done, then refresh the dashboard."
}, null, 2));
