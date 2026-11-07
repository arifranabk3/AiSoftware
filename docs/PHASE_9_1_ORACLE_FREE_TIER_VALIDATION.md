# Phase 9.1 — Oracle Always Free Plan Correction & Independent Validation (Corrected)

**Project:** AI Command Center
**Verification Date:** 2026-11-06 (Updated: 2026-11-07)
**Document Status:** Independent Validation & Architectural Correction
**Official Sources Consulted:**
- [Oracle Cloud Free Tier Documentation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI Idle Instance Reclamation Documentation](https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/instancereclamation.htm)
- [MongoDB Atlas M0 Free Shared Limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- [Upstash Redis Pricing & Limits](https://upstash.com/pricing/redis)

---

## 1. Official Entitlement Realities

### 1.1 OCI Ampere A1 Compute Allowances
- **Official Monthly Quota:** **1,500 OCPU-hours and 9,000 GB-hours per month**.
- **Continuous 24/7 Capacity:**
  - $1500 \text{ OCPU-hours} / 720 \text{ hours} \approx \mathbf{2.08 \text{ OCPUs}}$
  - $9000 \text{ GB-hours} / 720 \text{ hours} = \mathbf{12.5 \text{ GB RAM}}$
- **Correction:** The safe, continuous 24/7 Always Free VM shape is **2 OCPUs and 12 GB RAM**. Running 4 OCPUs / 24 GB continuously would consume 2,880 OCPU-hours and 17,280 GB-hours, which exceeds the monthly allowance by 92% and triggers billing or stoppage.

### 1.2 Idle Instance Reclamation Rules
- **Rule:** Under Always Free, an instance is flagged as idle if over a 7-day period, the 95th percentile of CPU, network, and memory utilization (for Ampere A1) falls below threshold (typically 15–20%).
- **Mitigation:**
  - Running a background BullMQ queue worker and local Ollama model (`llama3.2:1b`) ensures continuous baseline resident memory and recurring CPU ticks.
  - Upgrading to Pay As You Go (PAYG) provides account-level billing backing that prevents idle reclamation, but introduces billing risk if non-free resources are provisioned. In pure Always Free tenancies, operational background activity is mandatory.

---

## 2. Realistic Three-Tier Configurations

### Configuration A — Pure Always Free-Only (Verified Safe 24/7)
- **VM Allocation:** 1 Compute Instance: **2 OCPUs, 12 GB RAM, 75 GB Boot Volume**.
- **Runtime Stack:**
  - Caddy Reverse Proxy (`--memory=128m`)
  - Fastify API Server (`--memory=512m`)
  - BullMQ Worker Daemon (`--memory=768m`)
  - Next.js Web Dashboard (`--memory=512m`)
  - Local Redis 7 Container (`--memory=128m`)
  - Host Ollama Daemon (`llama3.2:1b`, resident ~1.8 GB)
- **Net RAM Allocated:** ~5.7 GB limit; Peak active ~3.0 GB.
- **Headroom:** ~6.3 GB unallocated memory buffer.
- **Monthly Cost:** **$0.00**.

### Configuration B — Free Trial Account ($300 Promo Credits, 30 Days)
- **Notice:** Promotional credits can temporarily cover larger compute instances. However, all non-Always-Free resources are **abruptly terminated on Day 31**. Core AI Command Center services must not depend on temporary trial shapes.

### Configuration C — Pay As You Go (Zero Billed Usage Mode)
- **Notice:** Always Free allowances apply, but credit card is charged immediately if storage exceeds 200 GB or compute exceeds 1,500 OCPU-hours. Requires strict $1.00 budget alerts.

---

## 3. High Availability vs. Disaster Recovery Reality

- **Single Server is NOT HA:** A single VM has a Single Point of Failure (SPOF).
- **Feasible Resilience:**
  - MongoDB Atlas external 3-node replica set provides independent database failover.
  - OCI automated boot volume backups (5 included free) provide disaster recovery.
  - BullMQ Outbox guarantees zero message loss across host reboots.
