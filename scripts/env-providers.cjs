"use strict";
/**
 * Generate .cursor/rules/auto/11-providers.mdc from .env / .env.example
 * - Shows which providers appear enabled vs. which are referenced in code (from 10-patterns.mdc)
 * - Pure Node, no deps
 */
const fs = require("fs");
const path = require("path");

const PROVIDER_KEYS = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  "google-ai": "GOOGLE_GENERATIVE_AI_API_KEY",
  xai: "XAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  ollama: "OLLAMA_BASE_URL",
};

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const text = fs.readFileSync(p, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    // Strip quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function parseDetectedProviders() {
  // Read the patterns summary we generated (if present) and infer providers mentioned in code
  const p = path.join(".cursor", "rules", "auto", "10-patterns.mdc");
  if (!fs.existsSync(p)) return new Set();
  const text = fs.readFileSync(p, "utf8");
  const found = new Set();
  for (const name of Object.keys(PROVIDER_KEYS)) {
    const rx = new RegExp(`\\b${name.replace(/[-/]/g, "[-/]")}\\b`, "i");
    if (rx.test(text)) found.add(name);
  }
  return found;
}

function renderMdc(envActual, envExample, detected) {
  const ts = new Date().toISOString();
  const lines = [];
  lines.push("---");
  lines.push("description: Auto-generated providers view (env vs code)");
  lines.push('globs: ["**/*"]');
  lines.push("alwaysApply: false");
  lines.push("---\n");
  lines.push(`# 🔌 Providers (Env ↔ Code)`);
  lines.push(`Generated: ${ts}\n`);

  lines.push("## Environment Keys");
  for (const [name, key] of Object.entries(PROVIDER_KEYS)) {
    const actual = envActual[key] ? "set" : "unset";
    const exemplar = envExample[key] ? "present" : "missing";
    lines.push(`- **${name}** → \`${key}\`: ${actual} (example: ${exemplar})`);
  }

  lines.push("\n## Providers Referenced in Code");
  if (detected.size === 0) {
    lines.push("- _none detected yet_");
  } else {
    for (const n of Array.from(detected).sort()) {
      lines.push(`- **${n}**`);
    }
  }

  const enabledSet = new Set(
    Object.entries(PROVIDER_KEYS)
      .filter(([_, key]) => Boolean(envActual[key]))
      .map(([name]) => name),
  );

  const suggestions = [];
  for (const n of detected) {
    if (!enabledSet.has(n)) {
      suggestions.push(
        `- Code references **${n}** but env key \`${PROVIDER_KEYS[n]}\` is not set.`,
      );
    }
  }
  for (const n of enabledSet) {
    if (!detected.has(n)) {
      suggestions.push(
        `- Env enables **${n}** but no code references found—consider removing the key or adding a rule.`,
      );
    }
  }

  lines.push("\n## Suggestions");
  if (suggestions.length === 0) lines.push("- Looks consistent ✅");
  else lines.push(...suggestions);

  return lines.join("\n");
}

(function main() {
  const envActual = loadEnvFile(".env");
  const envExample = loadEnvFile(".env.example");
  const detected = parseDetectedProviders();
  const outDir = path.join(".cursor", "rules", "auto");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "11-providers.mdc"),
    renderMdc(envActual, envExample, detected),
  );
  console.log("✓ Wrote .cursor/rules/auto/11-providers.mdc");
})();
