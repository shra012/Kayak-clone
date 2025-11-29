FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for Prisma)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Remove development files
RUN rm -rf node_modules/.cache \
    && rm -rf logs/* \
    && rm -rf .git \
    && rm -rf node_modules

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
# Use --omit=dev instead of deprecated --only=production
# Add retry logic for network issues
RUN npm ci --omit=dev --prefer-offline --no-audit || \
    (sleep 5 && npm ci --omit=dev --prefer-offline --no-audit) || \
    (sleep 10 && npm ci --omit=dev --prefer-offline --no-audit) && \
    npm cache clean --force

# Copy application code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/kafka ./kafka

# Copy healthcheck script (from builder stage where it was copied)
COPY --from=builder /app/healthcheck.js ./healthcheck.js

# Note: .env file is NOT copied - it's provided via env_file in docker-compose.yml
# The server will use environment variables from the container environment

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check (using external script for better error handling)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node healthcheck.js

# Start application
CMD ["node", "src/server.js"]
