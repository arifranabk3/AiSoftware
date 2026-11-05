# DECISION LOG — PHASE 0 FOUNDATION

### DEC-001: Monorepo Tooling via npm Workspaces

- **Decision:** npm native workspaces use karenge bina kisi extra paid tool ya heavy external runner ke.
- **Context:** npm v11 installed hai. Turborepo / Nx optional hain par zero-dependency native npm workspaces sab se clean aur lightweight hain.
- **Status:** Approved.

### DEC-002: TypeScript First across Full Stack

- **Decision:** API, Worker, Automation scripts, aur Next.js sabhi TypeScript mein build honge.
- **Context:** Type sharing (`packages/shared`) between frontend, backend, and background workers eliminates API mismatch and improves enterprise maintainability.
- **Status:** Approved.

### DEC-003: Hybrid AI Provider Strategy (Zero-Cost Free Tier + Local Fallback)

- **Decision:** Primary AI reasoning Google Gemini 2.5 Flash Free Tier & Groq Llama 3 Free Tier par base hogi.
- **Context:** Host GPU MX330 (2GB VRAM) local 7B+ models ke liye unviable hai. Free cloud providers provide high intelligence with $0 cost.
- **Status:** Approved.

### DEC-004: Decoupled Worker & Queue Architecture

- **Decision:** API server and Background Worker ko alag-alag apps banaya gaya (`apps/api` vs `apps/worker`).
- **Context:** API ko crash ya timeout kiye bina heavy Playwright scraping aur multi-step agent reasoning 24/7 background mein run ho sakti hai.
- **Status:** Approved.

### DEC-005: Zero-Cost WhatsApp Communication Layer

- **Decision:** WhatsApp notification ke liye paid Twilio API ke bajaye self-hosted open-source session bridge (Baileys Node library) ya free Twilio sandbox evaluate kiya gaya.
- **Context:** Zero-Cost policy ke tehat owner ka mobile alert $0 budget par successfully deliver hoga.
- **Status:** Approved.
