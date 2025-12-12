# ============================================================================
# Multi-Stage Dockerfile for Rentfix NestJS Microservices
#
# Optimizations:
# - Multi-stage build to minimize final image size
# - Layer caching for faster rebuilds
# - Non-root user for security
# - Alpine Linux for minimal footprint
# - Production dependencies only in final image
#
# Build: docker build -t rentfix/service-name --build-arg SERVICE_NAME=core-auth .
# Run: docker run -p 4000:4000 -e DATABASE_URL=... rentfix/service-name
# ============================================================================

# ============================================================================
# Stage 1: Base Dependencies
# ============================================================================
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package.json ./packages/
COPY services/*/package.json ./services/
COPY apps/*/package.json ./apps/

# ============================================================================
# Stage 2: Dependencies Installation
# ============================================================================
FROM base AS dependencies

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# ============================================================================
# Stage 3: Build Stage
# ============================================================================
FROM dependencies AS build

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Build the specific service
WORKDIR /app/services/${SERVICE_NAME}

# TypeScript compilation
RUN npm run build

# ============================================================================
# Stage 4: Production Dependencies
# ============================================================================
FROM base AS production-deps

# Install ONLY production dependencies
RUN npm ci --legacy-peer-deps --omit=dev

# ============================================================================
# Stage 5: Production Image
# ============================================================================
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=production-deps --chown=nestjs:nodejs /app/packages ./packages

# Copy built application
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

COPY --from=build --chown=nestjs:nodejs /app/services/${SERVICE_NAME}/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/services/${SERVICE_NAME}/package.json ./package.json

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]

# ============================================================================
# Image Metadata
# ============================================================================
LABEL org.opencontainers.image.title="Rentfix Microservice"
LABEL org.opencontainers.image.description="Production-ready NestJS microservice for Rentfix platform"
LABEL org.opencontainers.image.vendor="Rentfix Team"
LABEL org.opencontainers.image.licenses="MIT"
