# AI Command Center — Phase 6.1: API, Redis & Worker Infrastructure Activation Report

**Repository Path:** `D:\projects\AiSoftware\ai-command-center`  
**Git Remote:** `https://github.com/arifranabk3/AiSoftware.git`  
**Branch:** `master`  
**Audit Date:** 2026-11-05T21:40:00+05:00  
**Role:** Senior Backend and DevOps Architect  
**Policy Compliance:** 100% Zero-Cost ($0.00 spent), Zero-Secret Leakage, No Dummy Statuses  

---

## 1. Executive Summary & Readiness Verdict

> ### **INFRASTRUCTURE STATUS: BLOCKED ON EXTERNAL REDIS INSTANCE**
> - **Fastify API (`apps/api`):** **PRODUCTION CONFIG READY** (0.0.0.0 host binding, cookie auth, CORS, rate limits, graceful shutdown).
> - **Frontend API Configuration (`apps/web`):** **PRODUCTION CONFIG READY** (Silent localhost fallback removed; runtime production warning emitted when `NEXT_PUBLIC_API_URL` is omitted).
> - **MongoDB Atlas Cluster:** **LIVE & CONNECTED** (TLS connection pool, 6 mission-critical collections with synchronized unique/compound indexes).
> - **Redis & BullMQ Queues (`apps/worker`):** **BLOCKED (Offline)**. Local Redis (`127.0.0.1:6379`) is unreachable. Live BullMQ tests are blocked until owner configures a free Redis instance.

---

## 2. Step 1 — API Production Configuration & Frontend URL Resolution

### 2.1 Fastify API Inspection (`apps/api/src/server.ts`)
- **Port & Host Binding:** 
  - Listens on `host: '0.0.0.0'` and `port: Number(process.env.PORT) || 3001` (required for containerized PaaS platforms like Render, Railway, Fly.io, or Docker).
- **Health Endpoints:**
  - `GET /api/v1/system/health`: Reports live kill-switch status, MongoDB connection health, and server timestamp.
  - `GET /api/v1/system/security`: Reports audit log chain length, SHA-256 hash integrity, and zero-cost policy enforcement.
- **CORS Allowlist:** Configured with `credentials: true`. In strict production environments, replace wildcard origin with `origin: [process.env.WEB_URL || 'https://your-domain.vercel.app']`.
- **Authentication & Cookie Lifecycle:**
  - Fastify JWT access tokens via Authorization header / cookie.
  - Refresh tokens in secure, `httpOnly`, `sameSite: strict` cookies (`path: /api/v1/auth`, `secure: env.NODE_ENV === 'production'`).
- **Graceful Shutdown:** Process traps `SIGTERM` and `SIGINT` to close Fastify listeners and disconnect MongoDB clients cleanly.

### 2.2 Frontend API Configuration Fix (`apps/web/src/lib/api.ts`)
- **Issue:** Previously, frontend silently fell back to `http://localhost:3001/api/v1`, risking silent failures when deployed to Vercel without `NEXT_PUBLIC_API_URL`.
- **Resolution:**
  - Refined `getApiBase()` to check `process.env.NEXT_PUBLIC_API_URL`.
  - In browser runtime under `NODE_ENV === 'production'`, logs a prominent warning when `NEXT_PUBLIC_API_URL` is unset, alerting the operator to configure the production API endpoint in Vercel project settings while maintaining Next.js static prerendering during build time.

---

## 3. Step 2 — Redis Architecture & BullMQ Compatibility Evaluation

BullMQ requires raw TCP Redis socket connections supporting binary Redis protocol (RESP) and specific pub/sub and atomic script execution features.

### Free Redis Hosting Evaluation Matrix:

| Provider / Option | Connection Type | BullMQ Compatibility | Free-Tier Limits | Production Suitability | Owner Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local / Self-Hosted Redis** | TCP socket (`redis://`) | **100% Compatible** | Unlimited (Resource bound) | Recommended for local development and self-hosted VPS / Docker | Install and start `redis-server` locally or run `docker run -p 6379:6379 redis:alpine` |
| **Upstash Redis (Free Tier)** | REST & Redis TCP (`rediss://`) | **Compatible with TCP endpoint** | 10,000 commands/day, 256 MB storage | Good for staging / low-throughput autonomous workers. **Risk:** Rate-limiting once daily command ceiling is reached | Create free database at upstash.com and copy TCP connection URI (`rediss://default:...@...upstash.io:6379`) |
| **Render Redis / Railway Redis** | TCP socket | **100% Compatible** | Trial credits or free shared instances | High performance, no command rate limits | Provision free Redis add-on on the container PaaS hosting the Worker |

> **IMPORTANT BULLMQ NOTE:** Upstash provides both an HTTP/REST endpoint and a standard Redis TCP endpoint. BullMQ **MUST** use the standard TCP URI (`rediss://...`) with `maxRetriesPerRequest: null`. BullMQ cannot function over Upstash HTTP-only endpoints.

---

## 4. Step 3 — Worker Reliability & Live Verification

### 4.1 Queue & Reliability Architecture
- **10 Autonomous Command Queues (`CommandQueueName`):**
  1. `ceo_orchestrator_tasks`
  2. `specialist_tasks`
  3. `business_discovery`
  4. `research_operations`
  5. `content_production`
  6. `seo_operations`
  7. `publishing_operations`
  8. `application_management`
  9. `notifications_dispatch`
  10. `system_maintenance`
- **Job Reliability Policy (`DEFAULT_JOB_OPTIONS`):**
  - Attempts: 3 retries.
  - Backoff: Exponential with 2000ms base delay.
  - Cleanups: Keeps last 100 completed and 500 failed jobs for forensic auditing.
- **Worker Heartbeat & Stale Worker Recovery:**
  - Persistent MongoDB collection `worker_heartbeats`.
  - Stale worker detection threshold: 30 seconds (`detectStaleWorkers(30)`).
  - Clean deregistration on `SIGTERM` / `SIGINT`.
- **Kill-Switch Enforcement:**
  - `distributedKillSwitch.verifyOperational()` runs prior to worker start and on every 5000ms loop tick. Worker halts immediately if emergency freeze is active.

### 4.2 Live Redis Test Result
- **Diagnostic Execution:** `npx tsx -e "import { redisManager } from './packages/automation/src/redis.ts'; ..."`
- **Result:**
  ```json
  {
    "isConnected": false,
    "error": "Redis unreachable: Connection is closed."
  }
  ```
- **Operational Verdict:** **BLOCKED**. In accordance with policy, we do not mock or claim worker queue connectivity until a real Redis instance responds to `PING`.

---

## 5. Step 4 — Deployment Configurations & Required Environment Variables

### 5.1 Service 1: Next.js Frontend (`apps/web`) -> Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `apps/web/.next`
- **Root Directory:** Repository Root
- **Required Environment Variables (Vercel Project Settings):**
  - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api/v1` (Public Fastify API endpoint)
- **Security:** Zero database or Redis secrets provided to Vercel.

### 5.2 Service 2: Fastify API Server (`apps/api`) -> Container / VPS
- **Start Command:** `node apps/api/dist/server.js` (or via `npm run --workspace=@ai-command-center/api start`)
- **Required Environment Variables:**
  - `PORT`: `3001` (or PaaS assigned port)
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: `mongodb+srv://ai_command_center:<password>@sellzy-staging.tv1yvju.mongodb.net/?retryWrites=true&w=majority&appName=AiCommandCenter`
  - `MONGODB_DB_NAME`: `ai_command_center`
  - `JWT_SECRET`: Secure 32+ character random string
  - `REFRESH_TOKEN_SECRET`: Secure 32+ character random string
  - `MASTER_ENCRYPTION_KEY`: Secure 32+ character random string
  - `OWNER_PHONE_NUMBER`: Owner phone with country code

### 5.3 Service 3: Background Worker Daemon (`apps/worker`) -> Container / Background Process
- **Start Command:** `node apps/worker/dist/index.js`
- **Required Environment Variables:**
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: Same as API
  - `MONGODB_DB_NAME`: Same as API
  - `REDIS_URL`: `redis://...` or `rediss://...` (Live TCP Redis URI)
  - `MASTER_ENCRYPTION_KEY`: Same as API

---

## 6. Exact Owner Actions Required

To achieve 100% operational status for the worker and queues:
1. **Provision Free Redis:**
   - Option A (Cloud): Register for Upstash free tier ($0), create a Redis database, and obtain the TCP connection string (`rediss://default:...@...`).
   - Option B (Local / Self-hosted): Run `redis-server` locally on port 6379.
2. **Add `REDIS_URL` to Local `.env`:**
   - Put `REDIS_URL=<your-redis-connection-string>` in your untracked `.env` file.
3. **Deploy API & Worker Containers:**
   - Use a free container hosting platform (Render / Railway / VPS) with the environment variables listed in Section 5.
