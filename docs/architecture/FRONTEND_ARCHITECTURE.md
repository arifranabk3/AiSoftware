# FRONTEND ARCHITECTURE — ENTERPRISE WEB DASHBOARD

## 1. Overview

The frontend application (`apps/web`) is an enterprise-grade web dashboard built with **Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**. It connects directly to the backend API (`http://localhost:3001/api/v1`) using typed API clients and real-time operational polling.

---

## 2. Directory Structure

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── globals.css      (Tailwind base styles & custom palette)
│   │   ├── layout.tsx       (Root dark enterprise layout)
│   │   └── page.tsx         (Main Owner Dashboard & Control Center)
│   └── lib/
│       ├── api.ts           (Typed REST API Client for Fastify endpoints)
│       └── utils.ts         (Class merge and UI styling utilities)
├── next.config.js           (Next.js transpiler & optimization config)
├── tailwind.config.js       (Graphite & Futuristic Orange theme tokens)
└── tsconfig.json            (Bundler resolution & path aliases)
```

---

## 3. Real Backend API Integration

The dashboard relies on actual live backend endpoints:

- `GET /api/v1/system/health`: Live database connectivity and distributed kill-switch status.
- `POST /api/v1/system/kill-switch/activate`: Triggers emergency distributed halt.
- `POST /api/v1/system/kill-switch/deactivate`: Resumes normal autonomous execution upon owner command.
- If a service is offline, the UI truthfully displays `DISCONNECTED` or `HALTED` instead of mocking artificial statistics.
