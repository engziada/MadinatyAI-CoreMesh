---
trigger: model_decision
description: Apply when building, running, starting, testing, or debugging the MadinatyAI stack — enforces the BE/DB-before-FE boot order and prevents retry loops.
---

# MadinatyAI Stack Orchestration (read before starting/running/testing anything)

This backend (CoreMesh) is the upstream of a strict local dependency chain.
Starting a downstream service before its upstream is healthy causes infinite
retry loops. **Follow this order. Always.**

```text
Postgres + Redis (docker) → prisma migrate deploy → db:seed (tenant 'kanto')
  → core-hub API :3000 (/api/v1/health = 200) → Souk ElKanto web :3001
```

## Hard rules

1. **Check before acting.** Run `pwsh ./stack-status.ps1` (in the parent
   `Codes\` folder) before starting anything. If a link is already UP, do NOT
   restart it.
2. **Boot through the orchestrator:** `pwsh ./stack-up.ps1`. It is idempotent
   and encodes the correct order (infra → migrate → seed → BE → FE).
3. **Never start the frontend before** `GET http://localhost:3000/api/v1/health`
   returns **200**.
4. **The DB must come first.** If migrate/seed/BE fails with "connection
   refused", Postgres/Redis aren't ready — fix that first, do not start the FE.
5. **No retry loops.** If the same command fails ~3 times, STOP and report the
   first DOWN link + logs. Do not keep restarting services.

## Key facts

- Global route prefix: `/api/v1`. Health: `/api/v1/health`. Port: `3000`.
- Frontend (Souk ElKanto) runs on **:3001** (avoids the :3000 collision).
- `CoreMesh/.env` `CORS_ORIGINS` must include `http://localhost:3001`.
- Orchestrator + full runbook live in the parent folder:
  `f:\Web-Projects\MadinatyAI\Codes\` → `stack-up.ps1`, `stack-status.ps1`,
  `stack-down.ps1`, `RUNBOOK.md`.
