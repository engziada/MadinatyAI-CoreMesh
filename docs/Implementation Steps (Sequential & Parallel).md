Phase 1: Foundations & Tenant Isolation (Sequential)
Step 1.1: Initialize NextJS/NestJS Monorepo workspace. Configure global Prisma client.

Step 1.2: Implement Multi-tenant middleware to intercept every request, parse incoming host subdomains (e.g., souq.madinatyai.com, tutor.madinatyai.com), and attach the target database schema pointer dynamically.

Step 1.3: Build Core Global Users schema supporting shared credentials and Role-Based Access Control (RBAC).

Phase 2: Dual AI Layer & Vector Processing (Parallel with Phase 1)
Step 2.1: Spin up Dockerized Ollama framework with a local Llama-3 model. Create internal proxy route.

Step 2.2: Configure cloud-based Vector Database (pgvector extension inside PostgreSQL) to house semantic user embeddings.

Step 2.3: Build the AI Router Engine: Route basic tasks (PII checking, spam moderation) to the Local Model. Route high-level tasks (cross-platform skill/item matching) to the Cloud Gemini API.

Phase 3: Identity & Reputation Engine (Sequential)
Step 3.1: Write the KYC file ingestion module utilizing AES-256 binary encryption prior to cloud bucket storage.

Step 3.2: Develop the math-driven TrustScore calculator combining user history flags and account age across all linked SaaS instances.

Phase 4: Verification, Testing & Production (Finalization)
Step 4.1: Run continuous integration testing checks evaluating system load spikes across multi-tenant boundaries.

Step 4.2: Deliver production-ready Docker containers (Dockerfile + docker-compose) ready for AWS ECS or a dedicated Kubernetes cluster.