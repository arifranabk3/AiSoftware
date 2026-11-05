# Production Dockerfile for AI Command Center - Fastify API Server
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (e.g. argon2)
RUN apk add --no-cache python3 make g++

# Copy root workspace files
COPY package*.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies and compile packages + API app
RUN npm ci --ignore-scripts=false
RUN npm run --workspace=@ai-command-center/shared build && \
    npm run --workspace=@ai-command-center/config build && \
    npm run --workspace=@ai-command-center/security build && \
    npm run --workspace=@ai-command-center/database build && \
    npm run --workspace=@ai-command-center/api build

# Prune dev dependencies for lean production image
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV PORT=3001

# Run as non-root user
USER node

# Copy built artifacts and runtime modules
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/api ./apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/system/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]
