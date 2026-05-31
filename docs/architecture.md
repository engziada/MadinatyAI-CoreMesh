# MadinatyAI Ecosystem Hub — Architecture & Technical Reference

> **نواة مدينتي** — Multi-tenant core backend unifying the MadinatyAI ecosystem apps.
> Last updated: May 2026 · Version 0.1.0

---

## 1. System Overview

MadinatyAI Ecosystem Hub is a **multi-tenant API gateway** that provides shared identity, trust, KYC, AI routing, and cross-platform event infrastructure for four ecosystem applications:

| App | Subdomain | PostgreSQL Schema | Domain |
|-----|-----------|-------------------|--------|
| **Souq** | `souq` | `tenant_souq` | Marketplace |
| **Kitchen** | `kitchen` | `tenant_kitchen` | Home-cooked food |
| **Tutor** | `tutor` | `tenant_tutor` | Tutoring sessions |
| **Time Bank** | `timebank` | `tenant_timebank` | Skill exchange |

The hub follows a **Transparent Broker** policy: it never models financial transactions or payment logic. Payment handles (Instapay / Vodafone Cash) are stored only as opaque strings inside `GlobalUser.metadata` JSON.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js (TypeScript 5.6) | — |
| **Framework** | NestJS | 10.4.x |
| **ORM** | Prisma (multiSchema + pgvector) | 5.22.0 |
| **Database** | PostgreSQL 16 + pgvector | `pgvector/pgvector:pg16` |
| **Cache / Queue** | Redis 7 + BullMQ 5 | Alpine |
| **Local AI** | Ollama (llama3:8b) | Latest |
| **Cloud AI** | Google Gemini 1.5 Pro | SDK 0.21.0 |
| **Monorepo** | Nx | 20.3.0 |
| **Testing** | Jest 29 + ts-jest + Supertest | 29.x |
| **Linting** | ESLint 8 + @typescript-eslint 8 | — |
| **Formatting** | Prettier | 3.4.2 |
| **Package Manager** | npm (pinned exact versions) | — |
| **Containerization** | Docker multi-stage + docker-compose | — |

---

## 3. Monorepo Layout

```
CoreMesh/
├── apps/
│   └── core-hub/                  # API gateway (NestJS application)
│       └── src/
│           ├── main.ts             # Bootstrap: global prefix /api, ValidationPipe, CORS
│           ├── app/
│           │   └── app.module.ts   # Root module wiring all libs + controllers
│           └── modules/
│               ├── ai/             # AiController — delegates to AiRouterService
│               ├── users/          # UsersController — GlobalUser CRUD
│               ├── kyc/            # KycController — submit/review KYC documents
│               ├── reports/        # ReportsController — cross-platform incident reports
│               └── tenant/         # TenantController — tenant context + scoped items
│
├── libs/
│   ├── common/                     # Shared: config, env validation, enums, RBAC guard, exception filter
│   ├── prisma/                     # PrismaService, TenantContextService (AsyncLocalStorage)
│   ├── tenancy/                    # TenantMiddleware, TenantGuard, tenant-resolver (pure)
│   ├── ai-router/                  # Hybrid AI routing: Ollama (LOW) / Gemini (HIGH)
│   ├── kyc/                        # KYC engine: AES-256-GCM encrypt/decrypt, StorageProvider
│   ├── trust-score/                # Pure TrustScore calculator + service
│   ├── events/                     # BullMQ-backed cross-platform event emitter
│   └── tokens/                     # Closed-loop token wallet + activity pricing
│
├── prisma/
│   └── schema.prisma               # Multi-schema Prisma definition (core + tenant_*)
│
├── docker-compose.yml              # Postgres (pgvector), Redis, Ollama, core-hub
├── Dockerfile                      # Multi-stage build
└── jest.config.ts / jest.e2e.config.ts
```

### TS Path Aliases

All libs are importable via `@madinatyai/<lib>` aliases resolved by `tsc-alias`:

```
@madinatyai/common      → libs/common/src
@madinatyai/prisma      → libs/prisma/src
@madinatyai/tenancy     → libs/tenancy/src
@madinatyai/ai-router   → libs/ai-router/src
@madinatyai/kyc         → libs/kyc/src
@madinatyai/trust-score → libs/trust-score/src
@madinatyai/events      → libs/events/src
@madinatyai/tokens      → libs/tokens/src
```

---

## 4. Data Model (Prisma Schema)

### 4.1 Enums (core schema)

| Enum | Values |
|------|--------|
| `Role` | `USER`, `PROVIDER`, `TENANT_ADMIN`, `PLATFORM_ADMIN` |
| `TenantTier` | `FREE`, `STANDARD`, `PREMIUM` |
| `KycStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `IncidentType` | `FRAUD`, `SCAM`, `ABUSE`, `SPAM`, `IMPERSONATION`, `POLICY_VIOLATION`, `OTHER` |

### 4.2 Core Models

- **`GlobalUser`** — Shared identity across all tenants. `trustScore` (0–100), `isVerified` (flipped by KYC), `metadata` JSON for opaque payment handles.
- **`Tenant`** — Maps a subdomain to a physical PostgreSQL schema. `isActive` flag for soft-disable.
- **`KycRegistry`** — Encrypted document reference (`encryptedIdPath`), never stores raw documents. AES-256-GCM at rest.
- **`EcosystemSharedReport`** — Cross-platform incident with severity (1–5), optional `isPlatformWideBanned` flag, and `originSubdomain`.
- **`EcosystemCrossMatches`** — Global event ledger populated by the BullMQ processor for analytics.
- **`SemanticProfile`** — 768-dim pgvector embedding for cross-platform matching (cloud-generated via Gemini).

### 4.3 Per-Tenant Models

Each tenant schema has a minimal placeholder model (`SouqListing`, `KitchenMenuItem`, `TutorBooking`, `TimeBankOffer`) ensuring physical schema isolation. Ecosystem apps extend their own schemas later.

---

## 5. Multi-Tenancy Architecture

### 5.1 Resolution Flow

```
Request → TenantMiddleware
            ├─ 1. Check x-tenant-id header (preferred)
            ├─ 2. Extract subdomain from Host header
            ├─ 3. Validate against TENANT_SCHEMA_MAP
            ├─ 4. Look up Tenant row in core schema
            └─ 5. Bind TenantContext via AsyncLocalStorage → next()
```

### 5.2 Context Propagation

`TenantContextService` uses `AsyncLocalStorage` so any service deep in the call stack can read the active tenant without prop drilling:

```typescript
interface TenantContext {
  tenantId: string;
  subdomain: string;
  schemaName: string;  // e.g. "tenant_souq"
  tierLevel: string;
}
```

### 5.3 Tenant Guard

`TenantGuard` protects tenant-scoped routes — rejects requests that reach a tenant endpoint without a resolved context.

### 5.4 Schema Mapping

```typescript
const TENANT_SCHEMA_MAP = {
  souq:     'tenant_souq',
  kitchen:  'tenant_kitchen',
  tutor:    'tenant_tutor',
  timebank: 'tenant_timebank',
};
```

---

## 6. Core Libraries

### 6.1 AI Router (`@madinatyai/ai-router`)

Hybrid routing based on complexity tier:

| Complexity | Provider | Model | Use Case |
|-----------|----------|-------|----------|
| `COMPLEXITY_LOW` | Ollama (local) | llama3:8b | PII checks, spam/content moderation |
| `COMPLEXITY_HIGH` | Gemini (cloud) | gemini-1.5-pro | Semantic matching, embedding generation |

- `process(req)` — routes to the correct inference layer
- `moderate(text)` — convenience wrapper for local moderation
- `generateEmbedding(text)` — cloud embedding for `SemanticProfile` (768-dim, `text-embedding-004`)

### 6.2 KYC Engine (`@madinatyai/kyc`)

- **Encryption**: AES-256-GCM with key from `ConfigService` (`kyc.encryptionKey`). Documents encrypted in-memory before storage.
- **Storage**: `StorageProvider` interface (local volume MVP, S3 swappable). Only encrypted blob paths are persisted.
- **Flow**: `submit()` → encrypt + store + upsert `KycRegistry` (PENDING) · `review()` → update status + flip `GlobalUser.isVerified` in a transaction · `getDecryptedDocument()` → decrypt for authorized reviewers.

### 6.3 Trust Score (`@madinatyai/trust-score`)

Pure calculator (no DB dependency):

```
score = clamp(base - Σ(severity × 8) + ageBonus, 0, 100)
ageBonus = min(20, months × 2)
ban = score ≤ 20 OR any report.isPlatformWideBanned
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `base` | 100 | Starting score |
| `PENALTY_PER_SEVERITY` | 8 | Points deducted per severity level |
| `AGE_BONUS_PER_MONTH` | 2 | Points added per month of account age |
| `MAX_AGE_BONUS` | 20 | Cap on age bonus |
| `DEFAULT_BAN_THRESHOLD` | 20 | Score at/below which user is banned |

### 6.4 Events (`@madinatyai/events`)

BullMQ-backed cross-platform event emitter:

- `emit(event)` → enqueue to Redis with exponential backoff (3 attempts, 1s initial delay)
- Processor persists to `EcosystemCrossMatches` ledger asynchronously
- Decouples tenant request latency from event persistence

### 6.5 Token Wallet (`@madinatyai/tokens`)

Closed-loop credit system. Users pay cash offline; platform admins credit tokens. Tokens are spent across ecosystem activities at prices configured in the `ActivityPricing` table (admin-editable without code deploy).

| Model | Purpose |
|-------|---------|
| `TokenWallet` | Per-user balances: `businessTokens` (SaaS tenants) + `individualTokens` (end users) |
| `TokenAllocation` | User-managed budget dedicating tokens to specific activities |
| `TokenTransaction` | Immutable ledger of every credit/debit for auditability |
| `ActivityPricing` | Admin-configurable cost per activity type |

**Key methods:**
- `credit(userId, amount, tokenType, reason)` — admin credits tokens
- `spend(userId, activityType, tokenType, referenceId?)` — deduct for activity (checks `ActivityPricing`)
- `allocate(userId, activityType, tokenType, amount)` — user dedicates tokens to activity budget
- `getWallet(userId)` — balance + allocations + recent transactions
- `listActivityPricing()` / `setActivityPricing(...)` — admin pricing CRUD

**Design decisions:**
- Two token types: `business` (SaaS subscriptions) vs `individual` (end-user credits)
- No expiry / no refunds in v1 (extensible later)
- Cash collection stays outside the system — hub remains a Transparent Broker

---

## 7. API Endpoints

All routes are prefixed with `/api`.

| Method | Route | Controller | Auth | Description |
|--------|-------|------------|------|-------------|
| GET | `/api/health` | HealthController | — | Liveness check |
| POST | `/api/ai` | AiController | — | Route AI request by complexity |
| GET | `/api/users` | UsersController | — | List global users |
| POST | `/api/kyc` | KycController | — | Submit KYC document (base64) |
| PATCH | `/api/kyc/:id/review` | KycController | — | Approve/reject KYC |
| POST | `/api/reports` | ReportsController | — | Create cross-platform report |
| POST | `/api/tokens/credit` | TokensController | PLATFORM_ADMIN | Credit tokens to user wallet |
| POST | `/api/tokens/spend` | TokensController | — | Spend tokens on activity |
| POST | `/api/tokens/allocate` | TokensController | — | Allocate tokens to activity budget |
| GET | `/api/tokens/wallet` | TokensController | — | Get wallet balance + transactions |
| GET | `/api/tokens/pricing` | TokensController | — | List activity pricing |
| POST | `/api/tokens/pricing` | TokensController | PLATFORM_ADMIN | Set/update activity pricing |
| GET | `/api/tenant/context` | TenantController | TenantGuard | Current tenant context |
| POST | `/api/tenant/items` | TenantController | TenantGuard | Create tenant-scoped item |
| GET | `/api/tenant/items` | TenantController | TenantGuard | List tenant-scoped items |

---

## 8. Infrastructure

### 8.1 Docker Compose

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | `pgvector/pgvector:pg16` | 5432 | Primary DB with vector extension |
| `redis` | `redis:7-alpine` | 6379 | BullMQ job queue + cache |
| `ollama` | `ollama/ollama:latest` | 11434 | Local LLM inference |
| `core-hub` | Custom Dockerfile | 3000 | API gateway |

### 8.2 Build Pipeline

```
tsc -p apps/core-hub/tsconfig.app.json   # compile TypeScript
tsc-alias -p apps/core-hub/tsconfig.app.json  # resolve @madinatyai/* aliases
node dist/apps/core-hub/src/main.js       # production entry
```

Dev mode uses `ts-node-dev --respawn --transpile-only` with `tsconfig-paths/register`.

---

## 9. Testing

### 9.1 Test Configuration

| Config | Pattern | Scope |
|--------|---------|-------|
| `jest.config.ts` | `*.spec.ts` | Unit tests |
| `jest.e2e.config.ts` | `*.e2e-spec.ts` | End-to-end tests (run in band) |

### 9.2 Unit Test Suites (9 suites, 40 tests)

| Suite | File | Tests | What's Verified |
|-------|------|-------|-----------------|
| AES Crypto | `libs/kyc/src/crypto/aes.spec.ts` | 2 | Encrypt/decrypt round-trip, tamper detection |
| Trust Score Calculator | `libs/trust-score/src/trust-score.calculator.spec.ts` | 5 | Base score, penalty, age bonus, ban threshold, platform-wide ban |
| Tenant Resolver | `libs/tenancy/src/tenant-resolver.spec.ts` | 5 | Subdomain extraction, schema mapping, unknown tenant |
| AI Router | `libs/ai-router/src/ai-router.service.spec.ts` | 5 | LOW→Ollama, HIGH→Gemini, moderate(), embedding, error handling |
| KycController | `apps/core-hub/src/modules/kyc/kyc.controller.spec.ts` | 3 | Submit (base64→Buffer), approve, reject |
| ReportsController | `apps/core-hub/src/modules/reports/reports.controller.spec.ts` | 2 | Create report + trust recalculation, isPlatformWideBanned default |
| TenantController | `apps/core-hub/src/modules/tenant/tenant.controller.spec.ts` | 3 | Context retrieval, create item, list items |
| TokensService | `libs/tokens/src/tokens.service.spec.ts` | 8 | Credit, spend, allocate, insufficient tokens, invalid activity, empty wallet, list pricing, set pricing |
| TokensController | `apps/core-hub/src/modules/tokens/tokens.controller.spec.ts` | 6 | Credit, spend, allocate, wallet, list pricing, set pricing endpoints |

### 9.3 E2E Test Suite (1 suite, 5 tests)

| Suite | File | Tests | What's Verified |
|-------|------|-------|-----------------|
| Tenant Routing & Isolation | `apps/core-hub/test/tenant.e2e-spec.ts` | 5 | Subdomain→schema resolution, tenant isolation, missing tenant rejection (400), unknown tenant rejection (400), unprovisioned tenant rejection (400) |

### 9.4 Verification Results (May 2026)

| Check | Command | Result |
|-------|---------|--------|
| Unit tests | `npx jest --ci` | **9 suites, 40/40 passed** ✅ |
| E2E tests | `npx jest --config jest.e2e.config.ts --runInBand --ci` | **1 suite, 5/5 passed** ✅ |
| TypeScript build | `npx tsc -p apps/core-hub/tsconfig.app.json --noEmit` | **0 errors** ✅ |
| ESLint | `npm run lint` | **0 errors, 0 warnings** ✅ |
| Prisma validate | `npx prisma validate` | **Schema valid** ✅ |

---

## 10. Security

| Aspect | Implementation |
|--------|---------------|
| **KYC Documents** | AES-256-GCM encryption in-memory before storage; key from env (`kyc.encryptionKey`) |
| **Payment Data** | Transparent Broker — no financial models; payment handles as opaque strings in `metadata` JSON |
| **Input Validation** | Global `ValidationPipe` (whitelist + transform + forbidNonWhitelisted) |
| **Tenant Isolation** | Separate PostgreSQL schemas per tenant; `TenantGuard` rejects missing context |
| **RBAC** | `@Roles()` decorator + `RolesGuard` (libs/common) |
| **Error Handling** | Global `AllExceptionsFilter` for consistent error responses |
| **Secrets** | `.env` file (local dev); Docker secrets / orchestrator for production |
| **CORS** | Configurable origins via `corsOrigins` env variable |

---

## 11. Key Design Decisions

1. **Schema-per-tenant over database-per-tenant** — Lower operational overhead; Prisma `multiSchema` preview feature handles schema switching natively.
2. **AsyncLocalStorage over request prop drilling** — `TenantContextService` makes tenant context available anywhere in the call stack without explicit parameter passing.
3. **Pure calculator for TrustScore** — No DB dependency in the calculation logic, enabling deterministic unit testing and easy rule changes.
4. **BullMQ for events** — Decouples event persistence from request latency; exponential backoff with retry handles transient failures.
5. **Hybrid AI routing** — Cost optimization: free local inference for routine tasks, paid cloud inference only when semantic depth is needed.
6. **StorageProvider interface for KYC** — Local volume for MVP, S3-compatible storage swappable without code changes.
7. **tsc + tsc-alias over nest build** — Direct TypeScript compilation with alias resolution, avoiding Nest CLI abstraction layer.
8. **DB-driven token pricing** — `ActivityPricing` table means admins can change costs without a code deploy. Closed-loop credits (not money) keep the Transparent Broker policy intact.
