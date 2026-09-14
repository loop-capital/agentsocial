# AgentSocial Frontend — Production Dockerfile (Next.js standalone)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=packages/frontend --workspace=packages/shared

COPY packages/frontend/ ./packages/frontend/
COPY packages/shared/ ./packages/shared/

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=packages/frontend

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 agentsocial

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

USER agentsocial

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "packages/frontend/server.js"]