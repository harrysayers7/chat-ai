"use strict";
/**
 * Lean pattern analyzer for chat-ai
 * - No external deps
 * - Scans app/, src/, lib/ (TypeScript/TSX)
 * - Emits .cursor/rules/auto/10-patterns.mdc
 */
const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "src", "lib"];
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);
const EXT_OK = new Set([".ts", ".tsx"]);

const PATTERNS = [
  // Security
  {
    cat: "security",
    id: "possible-secret",
    re: /(api[_-]?key|secret|token)\s*[:=]\s*["'`][^"'`]+["'`]/i,
    hint: "Potential secret in code",
  },
  {
    cat: "security",
    id: "zod",
    re: /\bz\.(object|string|number|array|union)\b/,
    hint: "Zod validation present",
  },
  {
    cat: "security",
    id: "rate-limit",
    re: /\b(upstash|ratelimit|rate[-_ ]?limit)\b/i,
    hint: "Rate limiting referenced",
  },
  {
    cat: "security",
    id: "csp-headers",
    re: /\b(helmet|next[-_]safe|secureHeaders|content[-_]security[-_]policy)\b/i,
    hint: "Security headers referenced",
  },
  {
    cat: "security",
    id: "csrf",
    re: /\bcsrf(Token)?\b/i,
    hint: "CSRF mention",
  },

  // Providers / AI
  { cat: "ai-providers", id: "openai", re: /\bopenai\b|@ai-sdk\/openai/i },
  {
    cat: "ai-providers",
    id: "anthropic",
    re: /\banthropic\b|@ai-sdk\/anthropic/i,
  },
  {
    cat: "ai-providers",
    id: "google-ai",
    re: /\bgemini\b|google[-_ ]?ai|@ai-sdk\/google/i,
  },
  { cat: "ai-providers", id: "xai", re: /\bxai\b|grok|@ai-sdk\/xai/i },
  { cat: "ai-providers", id: "openrouter", re: /\bopenrouter\b/i },
  { cat: "ai-providers", id: "ollama", re: /\bollama\b/i },
  { cat: "ai-providers", id: "mcp", re: /@modelcontextprotocol\/sdk|\bmcp\b/i },

  // Backend
  {
    cat: "backend",
    id: "next-route",
    re: /export\s+async\s+function\s+(GET|POST|PUT|DELETE)/,
  },
  {
    cat: "backend",
    id: "drizzle",
    re: /\bdrizzle-orm\b|from\s+['"]drizzle-orm['"]/,
  },
  { cat: "backend", id: "redis", re: /\bioredis\b|\bredis\b/ },

  // Frontend
  { cat: "frontend", id: "radix", re: /@radix-ui\// },
  { cat: "frontend", id: "shadcn", re: /from\s+['"]@\/components\/ui\// },
  { cat: "frontend", id: "tiptap", re: /@tiptap\// },
  { cat: "frontend", id: "zustand", re: /\bcreate\s*\(\s*\(\s*set/ },
];

function isOkFile(file) {
  return EXT_OK.has(path.extname(file));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of ents) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && isOkFile(p)) out.push(p);
  }
  return out;
}

function analyzeFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        hits.push({
          file,
          line: i + 1,
          category: p.cat,
          match: p.id,
          hint: p.hint || "",
        });
      }
    }
  }
  // Enhancement: detect API route files that lack Zod usage
  const hasApi = hits.some((h) => h.match === "next-route");
  const hasZod = /\bz\.(object|string|number|array|union)\b/.test(text);
  if (hasApi && !hasZod) {
    hits.push({
      file,
      line: 1,
      category: "security",
      match: "api-without-zod",
      hint: "API route exports HTTP method but no Zod validation detected in file",
    });
  }
  return hits;
}

function groupHits(hits) {
  const grouped = {};
  for (const h of hits) {
    const key = `${h.category}:${h.match}`;
    if (!grouped[key])
      grouped[key] = {
        category: h.category,
        match: h.match,
        hint: h.hint || "",
        refs: [],
      };
    grouped[key].refs.push({ file: h.file, line: h.line });
  }
  return Object.values(grouped).sort((a, b) =>
    (a.category + a.match).localeCompare(b.category + b.match),
  );
}

function renderMDC(grouped) {
  const ts = new Date().toISOString();
  const lines = [];
  lines.push("---");
  lines.push("description: Auto-generated patterns (do not edit by hand)");
  lines.push('globs: ["**/*"]');
  lines.push("alwaysApply: false");
  lines.push("---\n");
  lines.push(`# 🤖 Auto Patterns Summary`);
  lines.push(`Generated: ${ts}\n`);
  if (!grouped.length) {
    lines.push("_No notable patterns detected yet._");
  } else {
    let currentCat = "";
    for (const g of grouped) {
      if (g.category !== currentCat) {
        currentCat = g.category;
        lines.push(`\n## ${currentCat}`);
      }
      lines.push(`- **${g.match}** ${g.hint ? `— ${g.hint}` : ""}`);
      for (const r of g.refs.slice(0, 20)) {
        lines.push(`  - \`${r.file}:${r.line}\``);
      }
      if (g.refs.length > 20) lines.push(`  - …and ${g.refs.length - 20} more`);
    }
  }
  lines.push("\n---");
  lines.push("### Cursor Guardrails (suggestions)");
  lines.push("- Keep secrets in env; never commit tokens.");
  lines.push("- Ensure Zod validation at API boundaries.");
  lines.push("- Prefer Drizzle (parameterized) for DB access.");
  lines.push("- Limit tool chains; ask before side-effects.");
  return lines.join("\n");
}

(function main() {
  const files = ROOTS.flatMap((r) => walk(r));
  const hits = files.flatMap(analyzeFile);
  const grouped = groupHits(hits);
  const outDir = path.join(".cursor", "rules", "auto");
  fs.mkdirSync(outDir, { recursive: true });
  const mdc = renderMDC(grouped);
  fs.writeFileSync(path.join(outDir, "10-patterns.mdc"), mdc);
  console.log(
    `✓ Wrote ${path.join(outDir, "10-patterns.mdc")} (${grouped.length} groups)`,
  );
})();
