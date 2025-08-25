#!/usr/bin/env bash
set -euo pipefail

MERGED=".cursor/rules/rules.mdc"
AUTO_DIR=".cursor/rules/auto"

if [ ! -f "$MERGED" ]; then
  echo "❌ $MERGED missing. Run: pnpm rules:merge (or: node scripts/analyze-patterns.cjs && node scripts/merge-rules.cjs)"
  exit 1
fi

if [ -d "$AUTO_DIR" ]; then
  # If any auto file is newer than merged, require a re-merge
  if find "$AUTO_DIR" -type f -name '*.mdc' -newer "$MERGED" | grep -q . ; then
    echo "❌ Auto-generated rules are newer than merged."
    echo "   Run: pnpm rules:merge (or: node scripts/analyze-patterns.cjs && node scripts/merge-rules.cjs)"
    exit 1
  fi
fi

echo "✅ Rules guard OK — merged rules are up to date."
