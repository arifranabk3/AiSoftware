# ZERO-COST AI POLICY & QUOTA GOVERNANCE

## 1. Zero-Cost Interceptor

The `CostAndQuotaInterceptor` (`packages/ai-engine/src/cost-interceptor.ts`) sits in front of all provider requests:

- **Strict Spending Limit:** $0.00. No requests containing payment authorization or billable flags are permitted.
- **Daily Rate Buffers:**
  - Google Gemini Flash: Capped at 1,000 requests/day (well below 1,500 free daily limit).
  - Groq Cloud: Capped at 1,000 requests/day.
- **Automatic Throttling:** Reaching 100% of the safe daily buffer triggers an immediate `QUOTA_EXHAUSTED` exception, pausing autonomous operations until the daily reset window.
