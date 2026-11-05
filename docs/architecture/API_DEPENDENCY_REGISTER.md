# API & DEPENDENCY REGISTER

**Policy:** $0 Cost Enforcement

---

## 1. Registered Free External APIs & Integrations

| Service / API                                                                            | Purpose                                     | Free Tier Allowance                                                               | Limitation & Guardrail                                                                                | Setup Requirement            |
| ---------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Google Gemini Free API**                                                               | Complex Reasoning & CEO decision making     | 15 RPM (Requests per minute), 1M TPM, 1,500 RPD on Flash                          | Rate limiter enforced at 10 RPM. Daily cap at 1,000 requests. Zero credit card needed.                | API Key via Google AI Studio |
| **Groq Free Cloud API**                                                                  | Fast inference & text summarization         | Free public tier (30 RPM, 6000 TPM on Llama 3)                                    | Used as high-speed secondary backup to Gemini.                                                        | Free account API key         |
| **Hugging Face Inference (Free)**                                                        | Specialist classification & embeddings      | Free Community Rate Limits                                                        | Used for small text transformations and zero-shot NLP.                                                | Free user token              |
| **WhatsApp Notifications (Self-hosted Webhook / Baileys / WPPConnect / Twilio Sandbox)** | Owner Critical Alerts & Approval prompts    | Unlimited via Baileys (self-hosted WhatsApp Web session) OR Twilio Sandbox (Free) | Baileys runs self-hosted via local Node.js worker (uses QR code scan once, 0 cost). Zero API charges. | Local session state QR scan  |
| **GitHub REST API**                                                                      | Monorepo CI/CD & repository synchronization | 5,000 requests/hr (Authenticated)                                                 | Scoped personal access token (Read/Write to repo only).                                               | GitHub PAT                   |
| **Vercel Hobby Plan**                                                                    | Web UI Frontend deployment                  | 100 GB Bandwidth, free SSL, automatic CI/CD                                       | Next.js serverless static/ISR routes. Heavy background tasks worker par outsource honge.              | Vercel Account Link          |
| **PostgreSQL (Local / Neon Free)**                                                       | Core database                               | Local: Unlimited. Neon Free: 0.5 GB storage, 1 compute branch                     | Production uses Neon/Supabase free tier; development uses local docker or local service.              | DB Connection String         |
| **Redis (Local / Upstash Free)**                                                         | BullMQ Distributed Queue                    | Local: Unlimited. Upstash Free: 10,000 commands/day                               | High-volume local jobs run on local Redis; Cloud jobs bounded by batching.                            | Redis URL                    |

---

## 2. Blocked / Prohibited Services

- Paid OpenAI endpoints without billing limits.
- AWS / GCP pay-as-you-go instances without hard spend limit.
- Twilio Paid SMS / Paid WhatsApp Business API numbers.
- Any API requiring credit card upfront with auto-renewal.
