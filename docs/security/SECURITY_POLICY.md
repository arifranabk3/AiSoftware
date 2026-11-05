# SECURITY BASELINE & POLICY — AI COMMAND CENTER

## 1. Authentication & Role-Based Access Control (RBAC)

- **Hashing:** Passwords hashed with Argon2id / Bcrypt (salt rounds >= 12).
- **Session Tokens:** Stateless JWT with strict expiration (15-min access token + rotating refresh token stored in HTTP-only, Secure, SameSite cookies).
- **Roles:**
  - `OWNER`: Full administrative override, emergency shutdown, approve/reject high-risk tasks.
  - `AUDITOR`: Read-only access to audit logs, metrics, cost registers.
  - `SYSTEM_AGENT`: Programmatic service-to-service internal authentication with signed HMAC tokens.

---

## 2. Secrets & Environment Variable Management

- **Zero Secrets in Code:** `.gitignore` blocks `.env`, `.env.local`, `*.pem`, `*.key`, credentials.
- **Environment Validation:** Zod schema validation on application bootstrap (`packages/config`). Missing environment variables crash the app immediately before opening ports.
- **Data-at-Rest Encryption:** Sensitive tokens (e.g. WhatsApp session, external API keys) database mein AES-256-GCM encrypted format mein store honge using a master local secret.

---

## 3. Human-in-the-Loop & Approval Gates

Autonomous execution in actions par rok di jayegi jab tak Owner explicit approval na de:

1. Sending cold emails or public messages to leads.
2. Submitting official applications or binding forms.
3. Modifying system security policies or role configurations.
4. Enabling any new external integration.
5. Invoking any network request with potentially paid parameters.

---

## 4. Emergency Shutdown (Kill-Switch) Mechanism

- Global Redis key & Database flag: `SYSTEM_STATE: "RUNNING" | "PAUSED" | "EMERGENCY_HALT"`.
- Every BullMQ worker iteration and API mutation checks this flag prior to step execution.
- If set to `PAUSED`, workers freeze current tasks without dropping queue data.
- If set to `EMERGENCY_HALT`, all background processes, Playwright browser instances, and outgoing connections terminate immediately.
- Triggerable via:
  1. Owner Web Dashboard button (red prominent switch).
  2. Owner WhatsApp reply command (e.g., `STOP ALL`).
  3. CLI emergency script (`npm run emergency:stop`).
