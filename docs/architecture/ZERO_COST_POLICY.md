# ZERO-COST POLICY & ENFORCEMENT CHARTER

**Mandate:** $0 Total Financial Expenditure  
**Authorized By:** System Owner

---

## 1. Fundamental Principles

1. **Never Spend Money:** Koi bhi paid API, subscription, cloud credit, ya software license purchase karna strictly prohibited hai.
2. **Built-In First:** Kisi bhi functionality ko pehle internally code kiya jayega (Node.js, TypeScript, regex, web scrapers, local algorithms) bajaye kisi paid SaaS API ko bulane ke.
3. **Open-Source Priority:** Hamesha MIT, Apache 2.0, BSD, ya permissive OSS libraries use honge.
4. **Free Tier Guardrails:** Agar external API use karni pare (jaise Gemini Free tier, GitHub API, Cloudflare Free tier):
   - Owner ko pehle notify aur register karwaya jayega.
   - Purpose, free quota limits, aur rate limits document honge.
   - Software ke andar hard quota counters honge jo 90% free limit par automatic request block kar denge taake overage charges na lag sakein.
5. **No Billing Card Linking:** Aisi kisi service ka API key use nahi hoga jahan credit card link ho aur auto-charge enable ho.

---

## 2. Hardcoded Architectural Interceptors

- **`ZeroCostInterceptor`:** Sabhi outbound HTTP requests (Axios / Fetch wrapper) is interceptor se pass honge.
- Agar kisi request mein paid endpoint header detect hota hai ya quota exceed hone lagta hai, request **ABORT** ho jayegi aur `AuditLog` mein cost warning save hogi.
- Owner approval ke baghair system 0.0001 USD bhi spend karne ke qabil nahi hoga.

---

## 3. Escalation Protocol

Agar koi task paid API ke baghair technically impossible ho:

1. Worker foran execution pause karega.
2. Owner ko alert dispatch hoga: "Task X requires paid service Y. Paused by Zero-Cost Policy."
3. Open-source alternative ya manual fallback route suggest kiya jayega.
