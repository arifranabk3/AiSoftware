# WORKER ARCHITECTURE — AI COMMAND CENTER

## 1. Overview

The worker service (`apps/worker`) operates as an independent Node.js daemon designed to run 24/7 on the host operating system or a dedicated environment. It executes autonomous business workflows, BullMQ queue jobs, recurring cron tasks, and Playwright automation without requiring Google Antigravity or a browser session to remain open.

---

## 2. Decoupled Pipeline

```
[Scheduler / External Trigger]
           │
           ▼
   [BullMQ Queue Manager]
           │
           ▼
[Worker Execution Daemon] ◄── [Kill-Switch Guard (Shared State)]
           │
    ┌──────┴──────────────┐
    ▼                     ▼
[MongoDB Persistence] [Playwright Safe Browser]
```

---

## 3. Host Availability & Operational Reality

- The worker service runs as a persistent background process using Node.js, PM2, or a native Windows Service.
- **Important Operational Note:** Background tasks execute continuously as long as the host machine is awake and powered. If the physical machine sleeps, hibernates, or powers down, task execution automatically suspends and resumes upon boot through idempotent restart policies.
