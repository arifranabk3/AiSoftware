# SPECIALIST PROMPT REGISTRY

## 1. Registry Overview

The Specialist Prompt Registry (`packages/ai-engine/src/prompt-registry.ts`) manages instruction templates for all **55 specialist profiles**.

---

## 2. Hardcoded Architectural Boundaries

- **Task-Driven Execution:** Specialists are NOT permanently running background LLM daemons. They execute strictly upon job dequeue and terminate immediately after producing output.
- **Prohibited Boundaries:**
  - Forbidden from creating paid accounts or billing subscriptions.
  - Forbidden from attempting CAPTCHA bypasses.
  - Forbidden from calling external APIs directly without passing through the central cost interceptor.
