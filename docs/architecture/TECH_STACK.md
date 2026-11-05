# TECH STACK SPECIFICATION — AI COMMAND CENTER

## 1. Core Platform Components

| Layer                  | Selected Technology                                                        | Zero-Cost Justification / License                                                      |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Frontend Framework** | Next.js 15+ (App Router)                                                   | Open Source (MIT), highly optimized SSR/SSG. Free hosting on Vercel or Node server.    |
| **Styling & UI**       | Tailwind CSS v4 / v3 + Lucide Icons + Inter Font                           | Open Source (MIT). Zero runtime cost, graphite/charcoal design system.                 |
| **Backend API**        | Node.js (v24 LTS) + Express / Fastify (TypeScript)                         | Open Source (MIT), robust, lightweight, asynchronous non-blocking I/O.                 |
| **Database ORM**       | Prisma ORM                                                                 | Open Source (Apache 2.0). Type-safe database queries and migrations.                   |
| **Database**           | PostgreSQL                                                                 | Open Source. Local Docker / Windows install or Free Tier Serverless (Neon / Supabase). |
| **Queue & Messaging**  | BullMQ + Redis                                                             | Open Source. Industry standard for durable distributed job queues.                     |
| **Automation**         | Playwright (TypeScript)                                                    | Open Source (Apache 2.0). Headless browser for scraping and form submissions.          |
| **Background Daemon**  | PM2 or Native Windows Service                                              | Open Source (AGPL/MIT). Auto-restarts worker on crash or OS boot.                      |
| **AI LLM Engine**      | Hybrid Free-Tier Connectors (Gemini Flash Free / Groq Free / Ollama Local) | Free-tier APIs with strict rate-limit guards and $0 budget enforcement.                |

---

## 2. Monorepo Tooling

- **Package Manager:** `npm` (Workspaces enabled).
- **TypeScript:** Strict type checking across all packages.
- **Linting & Code Quality:** ESLint + Prettier.
- **Testing:** Vitest / Playwright Test.
