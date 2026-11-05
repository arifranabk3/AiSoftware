# FRONTEND SECURITY & SESSION HANDLING

## 1. Zero Secret Leakage

- Frontend bundles contain ZERO API keys, master secrets, or AI provider credentials.
- All external AI provider calls are mediated strictly by the backend `packages/ai-engine`.

---

## 2. Token Security

- Tokens are never stored in `localStorage` or `sessionStorage` (preventing XSS exfiltration).
- Authentication utilizes short-lived access tokens combined with HTTP-only, SameSite Secure refresh cookies.
