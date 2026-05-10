#!/usr/bin/env node
import { scanVault, statsFromScan } from "./wiki-lib.mjs";

const scan = await scanVault();
const stats = statsFromScan(scan);
const inbox = scan.nodes.filter((node) => node.id.startsWith("raw/") && node.status === "inbox");

console.log(`# Obsidian Karpathy Wiki Status`);
console.log(`Vault: ${scan.vault}`);
console.log("");
console.log(JSON.stringify(stats, null, 2));
if (inbox.length) {
  console.log("\nInbox raw sources:");
  for (const node of inbox) console.log(`- ${node.path} — ${node.title}`);
}
if (scan.unresolved.length) {
  console.log("\nUnresolved wikilinks:");
  for (const item of scan.unresolved) console.log(`- ${item.source} -> ${item.target}`);
}

