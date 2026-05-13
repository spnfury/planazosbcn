/**
 * Orquestador principal de outreach PlanazosBCN
 *
 * Ejecutar todo:       node scripts/outreach/run-all.js
 * Solo directorios WA: node scripts/outreach/run-all.js --wa
 * Solo Reddit:         node scripts/outreach/run-all.js --reddit
 * Solo Facebook:       node scripts/outreach/run-all.js --fb
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const run = (script) =>
  execSync(`node ${path.join(__dirname, script)}`, { stdio: "inherit" });

const args = process.argv.slice(2);
const only = args[0];

console.log("═══════════════════════════════════════");
console.log("  PlanazosBCN — Outreach Runner");
console.log("═══════════════════════════════════════\n");

if (!only || only === "--wa") {
  console.log("▶ [1/3] Directorios WhatsApp\n");
  run("wa-directories.js");
}

if (!only || only === "--reddit") {
  console.log("\n▶ [2/3] Reddit\n");
  run("reddit-poster.js");
}

if (!only || only === "--fb") {
  console.log("\n▶ [3/3] Facebook grupos\n");
  run("facebook-poster.js");
}

console.log("\n✅ Outreach completado.");
