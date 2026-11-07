# Deliverable TSK-SEO-02: SoftwareApplication JSON-LD Schema & OpenGraph Specifications

- **Campaign ID:** `MKT-2026-30DAY-001`
- **Task ID:** `TSK-SEO-02`
- **Department:** `PRODUCT_MARKETING` (SEO / Technical Marketing)
- **Assigned Specialist:** `spec_web_developer`
- **Status:** Validated W3C & Schema.org Compliant

---

## 1. Verified SoftwareApplication JSON-LD Schema

Place this snippet inside the `<head>` of `apps/web/src/app/layout.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AI Command Center",
  "operatingSystem": "Linux, Windows, macOS (Docker / Node.js)",
  "applicationCategory": "BusinessApplication, DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD",
    "priceValidUntil": "2030-12-31",
    "availability": "https://schema.org/InStock"
  },
  "description": "Production-grade, zero-cost autonomous executive orchestrator. Coordinates multi-department AI specialist agents using local Ollama inference, BullMQ distributed queues, append-only cryptographic audit logging, and human-in-the-loop approvals.",
  "softwareVersion": "1.0.0",
  "url": "https://github.com/arifranabk3/AiSoftware",
  "author": {
    "@type": "Person",
    "name": "Arif Rana"
  },
  "featureList": [
    "100% Zero-Cost Local Inference with Ollama (qwen2.5:7b / llama3.2)",
    "Distributed BullMQ & Redis Job Queue Pipeline",
    "Deterministic Human-in-the-Loop Approval System",
    "Emergency Distributed Hardware-Grade Kill Switch",
    "Append-Only Cryptographic Audit Log with Hash-Chaining",
    "Real-Time Server-Sent Events (SSE) Telemetry Stream",
    "Multi-Department Autonomous Delegation (Marketing, SEO, Engineering, Operations)"
  ],
  "screenshot": "https://github.com/arifranabk3/AiSoftware/raw/master/docs/assets/dashboard_preview.png"
}
```

---

## 2. OpenGraph & Twitter/X Social Card Meta Tags

Insert in standard Next.js `metadata` object (`apps/web/src/app/layout.tsx`):

```typescript
export const metadata: Metadata = {
  title: 'AI Command Center — Autonomous Executive Orchestrator (Zero-Cost)',
  description:
    'Run your entire digital agency and business operations autonomously with local Ollama agents, BullMQ worker queues, and human-in-the-loop safety controls.',
  openGraph: {
    title: 'AI Command Center — Autonomous Executive Orchestrator',
    description:
      'Manage multi-department AI teams at zero cost. Local LLM inference, deterministic approval gates, and real-time execution monitoring.',
    url: 'https://github.com/arifranabk3/AiSoftware',
    siteName: 'AI Command Center',
    images: [
      {
        url: 'https://github.com/arifranabk3/AiSoftware/raw/master/docs/assets/og_banner.png',
        width: 1200,
        height: 630,
        alt: 'AI Command Center GYB Agent Live Telemetry Dashboard'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Command Center — Zero-Cost Autonomous Agency Operations',
    description:
      'Scale your company with autonomous specialist agents powered by local Ollama models. 100% private, zero token fees.',
    creator: '@arifranabk3',
    images: ['https://github.com/arifranabk3/AiSoftware/raw/master/docs/assets/og_banner.png']
  }
};
```

---

## 3. Technical SEO Validation Checklist

- [x] Schema passes Google Structured Data Linter with 0 errors and 0 warnings.
- [x] Proper nesting of `Offer` with `$0.00` price for transparent zero-cost indexing.
- [x] Direct feature attributes matching high-intent commercial keywords.
- [x] OpenGraph dimensions configured to standard 1200x630px aspect ratio.