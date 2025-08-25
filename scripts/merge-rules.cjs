"use strict";
/**
 * Merge static + auto-generated rules into .cursor/rules/rules.mdc
 * Precedence: static first, then auto (with clear section headers).
 */
const fs = require("fs");
const path = require("path");

const RULES_DIR = path.join(".cursor", "rules");
const AUTO_DIR = path.join(RULES_DIR, "auto");
const OUT_FILE = path.join(RULES_DIR, "rules.mdc");

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function listMdc(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdc"))
    .map((f) => path.join(dir, f))
    .sort(); // stable order
}

function loadSectionHeader(title) {
  return `\n\n<!-- ===== ${title} ===== -->\n`;
}

(function main() {
  if (!fs.existsSync(RULES_DIR)) {
    console.error("No .cursor/rules directory found.");
    process.exit(1);
  }
  const staticFiles = listMdc(RULES_DIR).filter(
    (f) =>
      !f.includes("rules.mdc") && !f.includes(`${path.sep}auto${path.sep}`),
  );
  const autoFiles = listMdc(AUTO_DIR);

  let out = "";
  out += `<!-- GENERATED: Do not edit by hand. Run \`node scripts/analyze-patterns.cjs && node scripts/merge-rules.cjs\` -->\n`;
  out += `# Cursor Rules (Merged)\n\n`;
  out += `This file merges **static** rules (hand-written) first, then **auto-generated** rules.\n`;
  out += `Static rules take precedence when guidance overlaps.\n`;

  out += loadSectionHeader("STATIC RULES");
  for (const f of staticFiles) {
    out += `\n<!-- file: ${path.basename(f)} -->\n\n`;
    out += readIfExists(f).trim() + "\n";
  }

  out += loadSectionHeader("AUTO-GENERATED RULES");
  for (const f of autoFiles) {
    out += `\n<!-- file: ${path.basename(f)} -->\n\n`;
    out += readIfExists(f).trim() + "\n";
  }

  fs.writeFileSync(OUT_FILE, out);
  console.log(
    `✓ Wrote ${OUT_FILE} (static: ${staticFiles.length}, auto: ${autoFiles.length})`,
  );
})();
