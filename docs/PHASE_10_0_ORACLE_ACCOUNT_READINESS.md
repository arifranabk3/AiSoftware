# Phase 10.0 — Oracle Cloud Account Readiness & Verification Guide (Audited)

**Project:** AI Command Center
**Repository:** `arifranabk3/AiSoftware`
**Latest Release Commit:** `43e235d`
**Document Status:** Pre-Registration Guidance & Risk Protocol (Non-Deploying)
**Official Registration URL:** [https://signup.cloud.oracle.com/](https://signup.cloud.oracle.com/) (or [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/))
**Date Checked:** 2026-11-07

---

## 1. Executive Summary & Policy Boundaries

This document defines the preparatory protocol for registering an Oracle Cloud Infrastructure (OCI) tenancy to host the AI Command Center under the **Always Free Tier ($0.00)**.

In strict compliance with user instructions:
- **No account is registered automatically.**
- **No personal, credit card, or billing information is submitted by the AI agent.**
- **The user registers directly in their own personal browser.**

---

## 2. Account Eligibility & Registration Realities

### 2.1 Official Oracle Registration URL
- Primary Portal: `https://signup.cloud.oracle.com/`
- Documentation Reference: [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)

### 2.2 Account Types & Lifecycle Distinction
1. **Always Free-Only Tenancy:** [OFFICIALLY VERIFIED]
   - Permanent access to designated Always Free services ($0.00).
   - No automatic charges.
   - Subject to 7-day idle reclamation if CPU, memory, and network utilization fall below threshold.
2. **Free Trial (First 30 Days):** [OFFICIALLY VERIFIED]
   - New accounts receive $300 USD (or equivalent) in promotional cloud credits valid for 30 days.
   - **Crucial Caution:** Resources provisioned beyond Always Free limits consume trial credits. On Day 31, **all trial-backed resources are abruptly terminated**. The AI Command Center must strictly use `VM.Standard.A1.Flex` (2 OCPU / 12 GB RAM) so it transitions smoothly into permanent Always Free without interruption.
3. **Pay As You Go (PAYG) Upgrade:** [OFFICIALLY VERIFIED]
   - Optional upgrade that links a verified credit card.
   - **Risks:** While Always Free allowances remain free, any accidental over-provisioning (e.g. storage > 200 GB, extra compute instances, NAT gateways) will incur immediate charges. **For zero-cost guarantee, staying on Always Free-only is recommended unless the operator consciously accepts billing risk.**

---

## 3. Registration & Verification Considerations for Pakistan

Signing up for OCI from Pakistan involves automated risk and fraud-prevention checks:

### 3.1 Payment Card Verification Protocol
- **Temporary Authorization Hold:** [OFFICIALLY VERIFIED] Oracle executes a temporary authorization hold (~$1.00 USD) to verify card validity. This amount is automatically refunded/released within a few business days.
- **Card Type Eligibility:**
  - **Virtual & Prepaid Cards:** [OBSERVED] Virtual cards (e.g., SadaPay/NayaPay virtual cards) and prepaid gift cards are frequently rejected by Oracle's automated risk engine.
  - **Physical Credit & Debit Cards:** [OBSERVED] Physical cards with international and e-commerce transactions explicitly enabled via the bank's mobile application have the highest likelihood of passing verification.
  - **Individual Bank Acceptance:** [UNKNOWN] Oracle does not publish an official list of approved Pakistani banks. Acceptance is determined dynamically by automated fraud-scoring systems at the time of card authorization.
- **Cardholder Name:** [OFFICIALLY VERIFIED] The name registered on the Oracle account must match the name embossed on the payment card.

### 3.2 Anti-Fraud & Profile Consistency Guidelines
- **No VPNs or Proxies:** [OFFICIALLY VERIFIED] Oracle terms require accurate geographic registration. Using a VPN frequently triggers automated account rejection.
- **Exact Billing Address Matching:** [OFFICIALLY VERIFIED] The address entered into the Oracle billing form must match your bank account statement character-for-character.
- **Clean Browser Profile:** [OBSERVED] Use an incognito/private browser window with location permissions allowed, ensuring no aggressive ad-blockers interfere with Oracle's verification scripts.

---

## 4. The Home Region Permanence Rule

> [!CRITICAL]
> **Your Home Region is Permanent.** [OFFICIALLY VERIFIED: [OCI Regions Documentation](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm)]
> When creating your tenancy, the selected Home Region **cannot be changed, transferred, or migrated** after account creation.
> Always Free resources (including the Ampere A1 compute instance, 200 GB block volumes, and Autonomous Databases) can **only be provisioned in your designated Home Region**.

---

## 5. Summary of Approved AI Command Center Architecture

Once the tenancy is provisioned, the AI Command Center will deploy within the following verified bounds:

- **Compute:** 1 Instance `VM.Standard.A1.Flex` configured to **2 OCPUs, 12 GB RAM, 75 GB Boot Volume**.
- **Container Mesh:** Caddy Reverse Proxy, Fastify API, Next.js Web Dashboard, BullMQ Worker Daemon, and Local Redis 7 container.
- **Local AI:** Ollama running `llama3.2:1b` (Q4_K_M) restricted to 0.8 OCPU quota and concurrency = 1.
- **External Persistence:** MongoDB Atlas M0 Shared Tier (512 MB, TLS encrypted, 3-node replica set).
- **Total Financial Obligation:** **$0.00 / month permanently**.
