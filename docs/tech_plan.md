# Technical Architecture Plan: MadinatyAI Ecosystem Core Hub

## 1. Tech Stack Selection
* **Backend Framework:** NestJS (TypeScript) - Selected for modular architecture, strict dependency injection, and native support for microservices.
* **Database Engine:** PostgreSQL with Prisma ORM. Utilizes multi-schema tenant isolation strategies to serve all ecosystem applications.
* **Caching & Broker:** Redis for session caching, rate-limiting, and real-time cross-platform event queues.
* **AI Orchestration Framework:** LangChain.js or Vercel AI SDK integrated with dual drivers.
* **Local AI Inference Layer:** Ollama running Llama-3-8B inside an on-premise Docker instance for cost-free routine tasks (e.g., initial text moderation).
* **Cloud AI Inference Layer:** Google Gemini 1.5 Pro via API for deep cross-platform vector search and semantic profile analytics.

## 2. System Architecture & Database Model
```text
                     +---------------------------------------+
                     |         API Gateway Layer             |
                     +---------------------------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
+-----------------------------+                     +-----------------------------+
|    Tenant-A: Souq Schema    |                     |   Tenant-B: Kitchen Schema  |
+-----------------------------+                     +-----------------------------+
               |                                                   |
               +-------------------------+-------------------------+
                                         | (Cross-Platform Events)
                                         v
                     +---------------------------------------+
                     |         Shared Core Schema            |
                     |  - Global Users  - Shared Reports     |
                     |  - KYC Registry  - Trust Scoring      |
                     +---------------------------------------+