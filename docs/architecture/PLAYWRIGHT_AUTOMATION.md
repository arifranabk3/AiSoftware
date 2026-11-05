# PLAYWRIGHT AUTOMATION & ETHICAL GUARDRAILS

## 1. Capabilities

- Headless Chromium execution via `packages/automation/src/browser.ts`.
- Resilient DOM interaction, element screenshotting, and data extraction.

---

## 2. Hardcoded Safety & Ethical Boundaries

- **No CAPTCHA Bypass:** Playwright automation halts and escalates to the owner when an anti-bot challenge is encountered.
- **Payment URL Blocking:** Any navigation containing `checkout.stripe.com`, `paypal.com/signin`, `billing`, or `subscribe` triggers an immediate `SAFETY POLICY BLOCKED` exception.
- **Zero Financial Autonomy:** The automation engine is barred from accepting binding terms, making purchases, or entering card credentials.
