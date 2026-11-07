# Phase 9.0 — Production Environment & Security Requirements (Corrected)

**Project:** AI Command Center
**Document Purpose:** Production Environment Variables & Network Security Rules
**Security Level:** Zero-Credential Specification (No Real Secrets Contained)

---

## 1. Production Environment Variables (`.env.production`)

All production values must be provisioned on the host VM via secure environment injection (`chmod 600 /opt/ai-command-center/.env.production`):

```bash
# ==============================================================================
# AI COMMAND CENTER — PRODUCTION ENVIRONMENT SPECIFICATION
# ==============================================================================
NODE_ENV=production
PORT=3001
WEB_PORT=3000

# Edge Domain for Caddy TLS Reverse Proxy
API_DOMAIN=control.yourdomain.com
FRONTEND_URL=https://control.yourdomain.com

# ------------------------------------------------------------------------------
# 1. DATABASE & PERSISTENCE (MongoDB Atlas M0 Shared Tier)
# ------------------------------------------------------------------------------
# Subject to 512MB storage, 500 connections, and 100 ops/sec rate limits.
# Inactive for 30 days results in automated cluster pause.
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=AiCommandCenter
MONGODB_DB_NAME=ai_command_center

# ------------------------------------------------------------------------------
# 2. LOCAL TASK QUEUE & CACHE (Local Redis 7 Container on VM)
# ------------------------------------------------------------------------------
# Internal Docker bridge network connection: sub-millisecond, zero external quotas
REDIS_URL=redis://redis:6379

# ------------------------------------------------------------------------------
# 3. CRYPTOGRAPHIC SECURITY TOKENS (Phase 8.3/8.4 Strict Validation)
# ------------------------------------------------------------------------------
# Must be distinct 64-character hexadecimal keys with Shannon entropy >= 3.5 bits/char.
# Generate with: openssl rand -hex 32
JWT_SECRET=<64_hex_chars_entropy_ge_3.5>
REFRESH_TOKEN_SECRET=<distinct_64_hex_chars_entropy_ge_3.5>
MASTER_ENCRYPTION_KEY=<distinct_64_hex_chars_entropy_ge_3.5>
JWT_EXPIRES_IN=15m

# ------------------------------------------------------------------------------
# 4. INITIAL OWNER PROVISIONING (Phase 8.3 Hardening)
# ------------------------------------------------------------------------------
# Required for first-boot root owner account creation.
# Default/predictable strings ('admin', 'password', 'ownersecurepass') are strictly rejected.
OWNER_EMAIL=owner@yourdomain.com
OWNER_INITIAL_PASSWORD=<strong_random_password_min_12_chars>
OWNER_PHONE_NUMBER=+1234567890

# ------------------------------------------------------------------------------
# 5. LOCAL ZERO-COST AI INFERENCE (Ollama on Ampere A1 Host)
# ------------------------------------------------------------------------------
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:1b

# ------------------------------------------------------------------------------
# 6. EXTERNAL AI FREE-TIER PROVIDERS (Tiered Fallbacks)
# ------------------------------------------------------------------------------
GEMINI_API_KEY=<gemini_free_tier_key>
GROQ_API_KEY=<groq_free_tier_key>
HUGGING_FACE_TOKEN=<huggingface_read_token>

# ------------------------------------------------------------------------------
# 7. GOVERNANCE & SAFETY SWITCHES
# ------------------------------------------------------------------------------
SYSTEM_EMERGENCY_HALT=false
ZERO_COST_STRICT_MODE=true
```

---

## 2. Oracle Cloud VCN Ingress Rules & Firewall

### 2.1 Ingress Rules (Security List)
| Port | Protocol | Source CIDR | Purpose | Risk Mitigation |
|---|---|---|---|---|
| `80` | TCP | `0.0.0.0/0` | HTTP ACME challenge & HTTP->HTTPS redirect | Caddy auto-redirects all traffic to 443 |
| `443` | TCP | `0.0.0.0/0` | HTTPS encrypted API and Dashboard traffic | TLS 1.3, HSTS (`max-age=31536000`), secure headers |
| `22` | TCP | `<OWNER_STATIC_IP>/32` | Administrative SSH Management | **Strictly locked** to owner IP; password auth disabled |

> [!CAUTION]
> Ports `3001` (API), `3000` (Web), `6379` (Redis), and `11434` (Ollama) **MUST NEVER** be opened in the OCI Security List. They must communicate exclusively via Docker bridge network or host loopback (`127.0.0.1`).

---

## 3. MongoDB Atlas Constraints & Safeguards

In accordance with official MongoDB Atlas documentation:
- **512 MB Storage Limit:** All task outbox records and audit logs older than 30 days must be pruned or archived.
- **Connection Caps:** Fastify API connection pool is configured to `maxPoolSize: 10`, Worker to `maxPoolSize: 10`. Peak connections remain under 25 (well below the 500 limit).
- **Inactivity Pausing:** Atlas automatically pauses Free clusters after 30 days of zero connections. The continuous BullMQ worker heartbeat prevents this automatically.
- **Network Access:** Restrict Atlas Network Access strictly to the **OCI VM Public IP** (`<OCI_IP>/32`).
