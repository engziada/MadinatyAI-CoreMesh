# MadinatyAI Ecosystem Hub — Core (نواة مدينتي)

Multi-tenant core backend that unifies the MadinatyAI ecosystem apps (Souq, Kitchen, Tutor, Time Bank) behind a single identity, KYC, reputation, and hybrid-AI layer.

> **Transparent Broker policy:** this system stores **no** financial balances or transactions. Payment handles (Instapay / Vodafone Cash) live only as opaque strings in `GlobalUser.metadata`.

## Stack

- **NestJS** (TypeScript) in an **Nx** monorepo
- **PostgreSQL + Prisma** with **separate-schema** multi-tenancy (`core`, `tenant_souq`, `tenant_kitchen`, `tenant_tutor`, `tenant_timebank`)
- **pgvector** for semantic cross-matching embeddings
- **Redis + BullMQ** for the cross-platform event ledger
- **Hybrid AI:** local **Ollama** (Llama-3) for low-complexity, cloud **Gemini** for high-complexity

## Layout

```
apps/core-hub          NestJS API gateway (controllers + bootstrap)
libs/common            Config, env validation, RBAC, enums, filters
libs/prisma            Prisma client + request-scoped tenant context
libs/tenancy           Tenant resolution middleware + guard
libs/ai-router         AiRouterService (Ollama / Gemini routing)
libs/kyc               AES-256-GCM KYC ingestion + storage driver
libs/trust-score       Cross-platform reputation engine
libs/events            Redis/BullMQ ecosystem event ledger
prisma/schema.prisma   Multi-schema data model
```

## Quick start (local)

```bash
# 1. Install
npm ci

# 2. Configure
cp .env.example .env
#   generate a KYC key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#   paste it into KYC_ENCRYPTION_KEY in .env

# 3. Start infra (Postgres + pgvector, Redis, Ollama)
docker compose up -d postgres redis ollama
docker compose exec ollama ollama pull llama3:8b   # one-time model pull

# 4. Database
npm run prisma:generate
npm run prisma:migrate          # creates all schemas (core + tenant_*)
npm run db:seed                 # provisions the 4 tenants + sample user

# 5. Run the API
npm run dev                     # http://localhost:3000/api
```

## Full stack via Docker

```bash
KYC_ENCRYPTION_KEY=<64-hex> docker compose up --build
```

The `core-hub` service runs `prisma migrate deploy` then starts the API. Ready for AWS ECS / Kubernetes.

## Multi-tenancy

Requests are routed by **subdomain** (`souq.madinatyai.com`) or the **`x-tenant-id`** header. `TenantMiddleware` validates the tenant against the core `Tenant` table and binds a request-scoped `TenantContext` (the dynamic schema pointer). `TenantGuard` rejects tenant routes lacking a valid tenant.

## Hybrid AI routing

`POST /api/ai/process` with `{ "text": "...", "complexity": "COMPLEXITY_LOW" | "COMPLEXITY_HIGH" }`:

- `COMPLEXITY_LOW` → local Ollama (`/api/generate`) — moderation / PII checks
- `COMPLEXITY_HIGH` → cloud Gemini — semantic cross-matching & embeddings

## Key endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/users` | Create a shared GlobalUser |
| POST | `/api/kyc` | Submit (AES-256 encrypted) ID document |
| PATCH | `/api/kyc/:id/review` | Approve/reject KYC |
| POST | `/api/reports` | File a cross-platform report (+ trust recalculation) |
| POST | `/api/ai/process` | Hybrid AI routing |
| GET | `/api/tenant/context` | Echo resolved tenant (tenant-scoped) |

## Testing

```bash
npm test            # unit tests
npm run test:e2e    # multi-tenant routing/isolation e2e
npm run lint
npm run build
```
