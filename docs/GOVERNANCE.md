# Governance (tiny & practical)

## Branching
- `main`: deploys to Vercel production.
- Feature branches: `feat/*`, `fix/*`, `chore/*`.

## Commits
- Conventional commits recommended (`feat: …`, `fix: …`, `chore: …`).

## Pull Requests
- Small, focused PRs.
- Must pass CI (typecheck, lint, unit tests).
- Use the PR checklist (security, tests, screenshots for UI).

## Releases (Vercel)
- Tag important milestones `vX.Y.Z` (semver-lite).
- Add brief notes in the PR for any environment/migration needs.

## Decision Making
- Default to the simplest thing that works. Leave breadcrumbs (comments) for non-obvious choices.

