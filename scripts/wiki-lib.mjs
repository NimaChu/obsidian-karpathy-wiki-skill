import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_VAULT = path.join(os.homedir(), "Documents", "knowledge");
export const DASHBOARD_PORT = 5173;
export const DASHBOARD_URL = `http://127.0.0.1:${DASHBOARD_PORT}/`;

const linkPattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

export function vaultPath() {
  return process.env.KARPATHY_OBSIDIAN_VAULT || process.env.OBSIDIAN_VAULT_PATH || DEFAULT_VAULT;
}

export function dashboardPath(vault = vaultPath()) {
  return path.join(vault, "tools", "wiki-dashboard");
}

export async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function walkMarkdown(dir) {
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === "dist") return [];
    if (entry.isDirectory()) return walkMarkdown(full);
    if (entry.isFile() && entry.name.endsWith(".md")) return [full];
    return [];
  }));
  return files.flat();
}

export function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) return {};
  const end = content.indexOf("\n---", 4);
  if (end === -1) return {};
  const data = {};
  let key = null;
  for (const line of content.slice(4, end).split("\n")) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      key = keyMatch[1];
      const value = keyMatch[2].trim();
      data[key] = value ? cleanValue(value) : [];
      continue;
    }
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && key) {
      if (!Array.isArray(data[key])) data[key] = data[key] ? [data[key]] : [];
      data[key].push(cleanValue(item[1]));
    }
  }
  return data;
}

export function cleanValue(value) {
  return String(value).trim().replace(/^["']|["']$/g, "");
}

export function extractLinks(content) {
  return Array.from(new Set(Array.from(content.matchAll(linkPattern), (match) => match[1].trim()).filter(Boolean)));
}

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase() || "untitled";
}

export function titleFromPath(filePath) {
  return path.basename(filePath, ".md");
}

export function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

export function relativeId(vault, filePath) {
  return path.relative(vault, filePath).replace(/\\/g, "/").replace(/\.md$/, "");
}

export async function scanVault(vault = vaultPath()) {
  const roots = ["raw", "wiki", "templates", "_archive"];
  const files = (await Promise.all(roots.map((root) => walkMarkdown(path.join(vault, root))))).flat();
  const nodes = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const frontmatter = parseFrontmatter(content);
    const id = relativeId(vault, file);
    const title = frontmatter.title && !String(frontmatter.title).includes("{{") ? String(frontmatter.title) : titleFromPath(file);
    nodes.push({
      id,
      file,
      path: id + ".md",
      title,
      type: String(frontmatter.type || (id.startsWith("raw/") ? "raw-source" : "note")),
      status: String(frontmatter.status || "unknown"),
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      links: extractLinks(content),
      frontmatter
    });
  }
  const byTitle = new Map();
  const byBase = new Map();
  const byId = new Map();
  for (const node of nodes) {
    byTitle.set(node.title.toLowerCase(), node.id);
    byBase.set(path.basename(node.id).toLowerCase(), node.id);
    byId.set(node.id.toLowerCase(), node.id);
  }
  const resolve = (target) => {
    const normalized = target.replace(/\.md$/, "").replace(/\\/g, "/").toLowerCase();
    return byId.get(normalized) || byTitle.get(normalized) || byBase.get(normalized) || null;
  };
  const edges = [];
  const unresolved = [];
  for (const node of nodes) {
    for (const link of node.links) {
      const target = resolve(link);
      if (target) edges.push({ source: node.id, target });
      else if (!node.id.startsWith("_archive/")) unresolved.push({ source: node.id, target: link });
    }
  }
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
  }
  return { vault, nodes, edges, unresolved, incoming, outgoing };
}

export function statsFromScan(scan) {
  return {
    nodes: scan.nodes.length,
    edges: scan.edges.length,
    rawSources: scan.nodes.filter((node) => node.id.startsWith("raw/")).length,
    wikiPages: scan.nodes.filter((node) => node.id.startsWith("wiki/")).length,
    inbox: scan.nodes.filter((node) => node.status === "inbox").length,
    processed: scan.nodes.filter((node) => node.status === "processed").length,
    stale: scan.nodes.filter((node) => node.status === "stale").length,
    unresolved: scan.unresolved.length,
    orphanedWiki: scan.nodes.filter((node) =>
      node.id.startsWith("wiki/") &&
      !["wiki/index", "wiki/log", "wiki/README"].includes(node.id) &&
      (scan.incoming.get(node.id) || 0) === 0 &&
      (scan.outgoing.get(node.id) || 0) === 0
    ).length
  };
}

export async function appendLog(message, vault = vaultPath()) {
  const logPath = path.join(vault, "wiki", "log.md");
  const stamp = new Date().toISOString();
  await fs.appendFile(logPath, `\n- [${stamp}] ${message}\n`, "utf8");
}
