```markdown
# AI Agent Execution Prompt: MadinatyAI Ecosystem Core Hub Creation

You are an expert lead software architect and senior engineer specializing in highly scalable NestJS, Prisma, PostgreSQL, and Hybrid AI architectures. Your mission is to construct the complete foundational repository for the **MadinatyAI Ecosystem Hub**, providing all the essential structural boilerplate, schema definition files, and business logic handlers.

## Core Architectural Guardrails
1. **Multi-Tenancy Strategy:** Implement an explicit multi-tenant architecture using PostgreSQL schemas or an explicit tenant isolation filter via Prisma middleware. The backend must isolate application data securely based on an incoming tenant identifier header (`x-tenant-id`) or a parsed subdomain string.
2. **Transparent Broker Policy:** Ensure zero financial transactional pooling logic exists within this core database or service architecture. All payment handles must be stored as raw metadata strings (e.g., Instapay handles, Vodafone cash numbers) to keep the system clean of financial, legal, and tax liabilities.
3. **Hybrid AI Dual Routing:** Write an explicit utility controller service (`AiRouterService`) that accepts a text processing payload along with a parameter representing execution complexity:
    - `COMPLEXITY_LOW` -> routes locally via Axios to a running Ollama container execution endpoint (`http://localhost:11434/api/generate`).
    - `COMPLEXITY_HIGH` -> routes via SDK to the cloud Google Gemini API.
4. **Cross-Platform Synchronization Engines:** Implement a Redis or database-backed centralized Event System. When an action occurs within a tenant boundary, emit an internal ecosystem notification to a global ledger table `EcosystemCrossMatches` to populate cross-platform analytics reports.

## Detailed Schema Blueprint (Prisma)
Generate a comprehensive `schema.prisma` blueprint featuring:
- `GlobalUser`: Containing `id`, `phoneNumber`, `isVerified`, `trustScore`, `createdAt`, and a JSON block for `metadata`.
- `Tenant`: Containing `id`, `subdomain`, `isActive`, and `tierLevel`.
- `KycRegistry`: Containing `id`, `userId` (relation), `encryptedIdPath`, `idNumber`, and `status` (PENDING, APPROVED, REJECTED).
- `EcosystemSharedReport`: Containing `id`, `reporterId`, `offenderId`, `incidentType`, `severity`, and `isPlatformWideBanned`.

## Step-by-Step Code Generation Requirements
Execute your construction sequentially, producing concrete code blocks without placeholders:
1. **Step 1:** Complete Database Configuration file (`schema.prisma`) matching the design instructions.
2. **Step 2:** Multi-tenant Extraction Middleware / NestJS Guard protecting app modules from missing tenant parameters.
3. **Step 3:** The `AiRouterService` showing how internal text validation runs locally against Ollama, while vector search maps to the cloud Gemini framework.
4. **Step 4:** The internal `TrustScoreCalculatorService` calculating user reputation metrics based on flags found inside the `EcosystemSharedReport`.

Do not write markdown truncation statements or mock sections. Produce valid code blocks to ensure a clean, production-ready implementation.