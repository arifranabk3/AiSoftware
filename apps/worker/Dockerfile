# Production Dockerfile for AI Command Center - Autonomous Background Worker
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (e.g. argon2)
RUN apk add --no-cache python3 make g++

# Copy root workspace files
COPY package*.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies and compile packages + Worker app
RUN npm ci --ignore-scripts=false
RUN npm run --workspace=@ai-command-center/shared build && \
    npm run --workspace=@ai-command-center/config build && \
    npm run --workspace=@ai-command-center/security build && \
    npm run --workspace=@ai-command-center/database build && \
    npm run --workspace=@ai-command-center/integrations build && \
    npm run --workspace=@ai-command-center/ai-engine build && \
    npm run --workspace=@ai-command-center/automation build && \
    npm run --workspace=@ai-command-center/worker build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

# Run as non-root user
USER node

# Copy built artifacts and runtime modules
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/worker ./apps/worker

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker/dist/index.js"]
