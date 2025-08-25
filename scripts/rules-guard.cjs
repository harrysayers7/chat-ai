#!/usr/bin/env node
// scripts/rules-guard.cjs
// Lean guard: warn/fail if arch-critical paths changed without .mdc edits.
// Exits with 0 if bypass label present (read from env), or no drift detected.

const { execSync } = require("node:child_process");

const BYPASS = (process.env.RULES_BYPASS_LABELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// In GH Actions, you can inject labels via an earlier step; for local runs, this is empty.

const BYPASS_REASONS = {
  "rules-ok": "Architecture changes reviewed and rules updated",
  "security-patch": "Emergency security fix - rules update deferred",
  "dependency-update": "Routine dependency update - no arch impact",
};

const watched = [
  "^src/app/api/",
  "^src/lib/auth/", // Auth changes are security-critical
  "^src/lib/db/", // Database schema changes
  "^src/types/", // Type definition changes
  "^src/lib/", // Core library changes
  "^next\\.config\\.",
  "^middleware\\.",
  "^\\.env\\.example$",
  "^docker/",
  "^infra/",
  "^.cursor/rules/", // Rule changes themselves
  "^package.json$", // Dependency changes
];

const ruleFiles = /^\.cursor\/rules\//;

function changedFiles(base = "origin/main") {
  // If not on CI, fallback to previous commit.
  let range = base;
  try {
    execSync("git rev-parse --verify " + base, { stdio: "ignore" });
  } catch {
    range = "HEAD~1";
  }
  const out = execSync(`git diff --name-only ${range}...HEAD`, {
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

const files = changedFiles(process.env.RULES_GUARD_BASE || "origin/main");

const touchedWatched = files.filter((f) =>
  watched.some((rx) => new RegExp(rx).test(f)),
);
const touchedRules = files.filter((f) => ruleFiles.test(f));

if (BYPASS.includes("rules-ok")) {
  console.log("🟢 rules:guard bypassed by label");
  process.exit(0);
}

if (BYPASS.length > 0) {
  console.log("🟡 rules:guard bypassed by labels:", BYPASS.join(", "));
  BYPASS.forEach((label) => {
    if (BYPASS_REASONS[label]) {
      console.log(`   ${label}: ${BYPASS_REASONS[label]}`);
    }
  });
  process.exit(0);
}

if (touchedWatched.length && !touchedRules.length) {
  console.error(
    "🔶 rules:guard — Architecture paths changed, but no `.cursor/rules/*` updates detected.\n",
  );
  console.error("Changed arch files:\n - " + touchedWatched.join("\n - "));
  console.error("\nPlease either:");
  console.error("1. Update the relevant `.cursor/rules/*.mdc` file(s)");
  console.error("2. Add the `rules-ok` label to bypass this check");
  console.error("3. Add `RULES_BYPASS_LABELS=rules-ok` to your environment\n");
  process.exit(1);
}

console.log("✅ rules:guard — no action needed.");
