"use strict";
/**
 * Dev-only watcher (optional). Regenerates auto rules on file changes.
 * Run: NODE_ENV=development node scripts/watch-patterns.cjs
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const WATCH_DIRS = ["app", "src", "lib"];
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

function walkDirs() {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    const ents = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of ents) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else out.push(p);
    }
  }
  for (const d of WATCH_DIRS) walk(d);
  return out;
}

if (process.env.NODE_ENV !== "development") {
  console.log("Watcher is dev-only. Set NODE_ENV=development to run.");
  process.exit(0);
}

let t = null;
function regen() {
  clearTimeout(t);
  t = setTimeout(() => {
    const step1 = spawn(process.execPath, ["scripts/analyze-patterns.cjs"], {
      stdio: "inherit",
    });
    step1.on("exit", () => {
      const step2 = spawn(process.execPath, ["scripts/env-providers.cjs"], {
        stdio: "inherit",
      });
      step2.on("exit", () => {
        const step3 = spawn(process.execPath, ["scripts/merge-rules.cjs"], {
          stdio: "inherit",
        });
        step3.on("exit", () => console.log("✓ Rules regenerated."));
      });
    });
  }, 200);
}

console.log("👀 Watching for changes in app/, src/, lib/ …");
regen();

// naive polling watcher (no external deps)
const mtimes = new Map();
setInterval(() => {
  const files = walkDirs().filter(
    (f) => f.endsWith(".ts") || f.endsWith(".tsx"),
  );
  let changed = false;
  for (const f of files) {
    try {
      const { mtimeMs } = fs.statSync(f);
      const prev = mtimes.get(f);
      if (!prev || mtimeMs > prev) {
        mtimes.set(f, mtimeMs);
        changed = true;
      }
    } catch {}
  }
  if (changed) regen();
}, 1000);
