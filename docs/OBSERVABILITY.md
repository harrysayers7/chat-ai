# Observability (lean, personal-project scope)

## Goals
- See failures quickly; avoid noisy logs; stay cost‑aware.

## What to Log
- On server: request id, route, coarse timing, error name/message (no secrets/PII).
- On client: only non-PII analytics as needed; prefer Vercel analytics if enabled.

## Error Budgets / SLOs (rules now, code later)
- Target: p95 response < 2s UI; p99 < 5s for chat sends.
- Alerting (later): GitHub/Discord webhook on repeated 5xx bursts.

## Retention (rules now)
- Raw error logs: ~30 days.
- Summaries/metrics: ~90 days.

