# ── Builder stage ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install deps (cached on lockfile change)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Build the app + generate Prisma client
COPY . .
RUN npx prisma generate && npm run build

# ── Runtime stage ───────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Carry over installed modules (incl. generated Prisma client) + build output
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/apps/core-hub/src/main.js"]
