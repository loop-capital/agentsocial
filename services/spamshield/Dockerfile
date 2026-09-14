FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY database/ ./database/
COPY scripts/ ./scripts/

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S spamshield -u 1001
USER spamshield

# Start the application
CMD ["node", "src/server.js"]