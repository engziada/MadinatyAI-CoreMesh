# syntax=docker/dockerfile:1.7
#
# CoreMesh production image — multi-stage build.
#
#   builder  → install all deps + build TypeScript + generate Prisma client
#   deps     → install ONLY prod deps + regenerate Prisma client
#   runtime  → minimal Node 20 alpine with only what's needed to serve
#
# Build args:
#   BE_GIT_SHA      git commit hash, injected into the /api/v1/version response
#   BE_BUILD_TIME   ISO-8601 timestamp of the build (e.g. 2026-06-12T00:00:00Z)
#
# Build locally:
#   docker build \
#     --build-arg BE_GIT_SHA=$(git rev-parse HEAD) \
#     --build-arg BE_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
#     -t coremesh:local .
#
# Run locally (talks to local Postgres/Redis docker network):
#   docker run --rm -p 3000:3000 --env-file .env coremesh:local

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# OpenSSL is required by @prisma/client on alpine.
RUN apk add --no-cache openssl

WORKDIR /app

# Copy manifests first so npm ci is cache-friendly.
COPY package.json package-lock.json* tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs
COPY prisma ./prisma

# Install ALL dependencies (dev + prod). --prefer-offline reuses the cache.
RUN npm ci --prefer-offline --no-audit --no-fund

# Generate the Prisma client BEFORE tsc so the generated @prisma/client types
# exist for the compiler.
RUN npx prisma generate

# Compile TypeScript + rewrite path aliases.
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — production-only deps
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ONLY prod deps. Prisma's postinstall hook generates the client.
RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund \
  && npx prisma generate \
  && npm cache clean --force

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# OpenSSL for Prisma at runtime, tini for proper PID-1 signal handling,
# wget for the HEALTHCHECK.
RUN apk add --no-cache openssl tini wget \
    && addgroup -S coremesh && adduser -S coremesh -G coremesh

WORKDIR /app

# Compiled output + pruned node_modules + schema/migrations + manifest.
COPY --from=builder /app/dist ./dist
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json package-lock.json* ./

# Build-time identity stamps surface via /api/v1/version.
ARG BE_GIT_SHA=unknown
ARG BE_BUILD_TIME=unknown
ENV BE_GIT_SHA=${BE_GIT_SHA} \
    BE_BUILD_TIME=${BE_BUILD_TIME} \
    NODE_ENV=production \
    PORT=3000

# Drop privileges.
RUN chown -R coremesh:coremesh /app
USER coremesh

EXPOSE 3000

# Container healthcheck. Fly/k8s ignore this if they have their own probes,
# but it helps `docker run` + docker-compose detect rot.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

# tini ensures SIGTERM reaches Node so Nest's graceful-shutdown hooks fire.
ENTRYPOINT ["/sbin/tini", "--"]

# Apply pending migrations on boot then serve. Safe because
# `prisma migrate deploy` is idempotent — already-applied migrations are no-ops.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/apps/core-hub/src/main.js"]
