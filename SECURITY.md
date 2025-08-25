# SECURITY (lightweight)

## Secrets & Config
- Never commit secrets. Use environment variables. Keep `.env.example` updated.
- Rotate keys on suspicion; prefer provider dashboards for revocation.

## Data Handling
- Validate all external input with Zod. Reject unknown fields (`.strict()`).
- Don't log PII, tokens, or provider responses verbatim; summarize or hash if needed.

## AuthN/Z
- Use existing better-auth flows; enforce least privilege in server actions and DB queries.
- Avoid exposing internal IDs; prefer opaque IDs where feasible.

## Database
- Use Drizzle ORM / parameterized queries (no string SQL).
- Migrations must be reversible; document any destructive changes in PR.

## Dependencies
- Prefer well‑maintained, permissively licensed packages.
- Justify any new dependency in the PR description (one line).

## Reporting
- Security issues: open a private issue or contact the maintainer directly.

