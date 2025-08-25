# Self-Learning Rules (Lean)

This repo includes a tiny, dependency-free updater that:
- Scans `app/`, `src/`, `lib/` for common patterns (providers, security, backend, frontend).
- Writes auto-generated Cursor rules to `.cursor/rules/auto/10-patterns.mdc`.
- Merges static + auto rules into `.cursor/rules/rules.mdc`.

## Commands

### Full Update (Analyze + Providers + Merge):
```bash
node scripts/analyze-patterns.cjs && node scripts/env-providers.cjs && node scripts/merge-rules.cjs
```

### Individual Steps:
```bash
# Generate patterns view (code analysis):
node scripts/analyze-patterns.cjs

# Generate providers view (env ↔ code):
node scripts/env-providers.cjs

# Merge static + auto rules:
node scripts/merge-rules.cjs
```

### Dev Watcher (Optional):
```bash
NODE_ENV=development node scripts/watch-patterns.cjs
```

## CI Guard (Optional, Lean)
This repository includes a minimal CI job (`.github/workflows/rules.yml`) that runs:
```bash
bash scripts/rules-guard.sh
```

It fails the build if:
- `.cursor/rules/rules.mdc` is missing, or
- any file in `.cursor/rules/auto/*.mdc` is newer than `rules.mdc` (remind to re-merge).

## Notes
- **Static rules** live in `.cursor/rules/00-*.mdc` (hand-written).
- **Auto rules** live in `.cursor/rules/auto/*.mdc` (generated; OK to commit).
- `rules.mdc` is the merged view that Cursor can read as a single source.
- Re-run the commands whenever you add providers/routes or refactor architecture.

## Integration with Rules Guard
The `rules:guard` script will now detect when architectural changes occur and ensure that either:
1. Rules are updated manually, or
2. The `rules-ok` label is applied to bypass the check

This maintains consistency between your code and your Cursor rules system.

## Tips
- Run `node scripts/env-providers.cjs` after you tweak `.env` or add/remove providers.
- The analyzer now flags API routes without Zod to nudge safer patterns in new endpoints.
- Use `pnpm rules:update` for the complete workflow in one command.
