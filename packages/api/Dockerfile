# AgentSocial API — Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root package files
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci --workspace=packages/api --workspace=packages/shared

# Copy source
COPY packages/api/ ./packages/api/
COPY packages/shared/ ./packages/shared/
COPY tsconfig.json ./

# Build
RUN npm run build --workspace=packages/shared && npm run build --workspace=packages/api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 agentsocial

COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/node_modules ./node_modules
COPY --from=builder /app/packages/api/package.json ./

USER agentsocial

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]