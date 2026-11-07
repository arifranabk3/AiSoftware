# Phase 9.0 — Oracle Cloud Infrastructure Plan (Corrected)

**Project:** AI Command Center
**Repository:** `arifranabk3/AiSoftware`
**Current Release Commit:** `595b3537032824beac5e0d452755e5640075d83d`
**Target Environment:** Oracle Cloud Infrastructure (OCI) Always Free Tier
**Document Status:** Corrected Architectural Specification (Non-Deploying)
**Official Reference:** [Oracle Cloud Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

---

## 1. Executive Summary & Entitlement Corrections

This document provides a realistic, internally consistent infrastructure plan for running the AI Command Center on Oracle Cloud Infrastructure (OCI).

### Critical Entitlement Correction:
- **Monthly A1 Allowance Limit:** The monthly Always Free allowance for Arm-based Ampere A1 Compute (`VM.Standard.A1.Flex`) is strictly **1,500 OCPU-hours and 9,000 GB-hours per month**.
- **Continuous 24/7 Equivalent:** 1,500 OCPU-hours ÷ 720 hours/month = **~2.08 OCPUs**; 9,000 GB-hours ÷ 720 hours/month = **12.5 GB RAM**.
- **Continuous 24/7 Safe Configuration:** A single VM configured with **2 OCPUs and 12 GB RAM** runs continuously within the monthly free allowance ($0.00). Attempting to run a 4 OCPU / 24 GB VM 24/7 would exhaust the monthly allowance in ~15 days, resulting in either suspension or billing charges.
- **Account Types:**
  - *Always Free-Only Tenancy:* Zero card charges possible. Subject to idle instance reclamation if utilization drops below threshold for 7 days.
  - *Free Trial:* Grants $300 in promotional credits valid for 30 days. Non-Always-Free resources are abruptly terminated on Day 31.
  - *Pay As You Go (PAYG):* Always Free allowances still apply at $0.00, but any resource exceeding allowances will be billed automatically to the credit card on file.

No cloud resources are created during Phase 9.

---

## 2. Infrastructure Inventory & Dependency Matrix

The AI Command Center is designed to run consolidated on a single 2 OCPU / 12 GB VM:

| Component | Technology | Runtime Engine | Dependencies | Port / Transport |
|---|---|---|---|---|
| **API Server** | Node.js 22, Fastify, TypeScript | Docker container (`apps/api/Dockerfile`) | Local Redis, MongoDB Atlas, JWT Secrets | `3001` (Internal bridge) |
| **Worker Daemon** | Node.js 22, BullMQ, TypeScript | Docker container (`apps/worker/Dockerfile`) | Local Redis, MongoDB Atlas, Ollama | Background worker |
| **CEO Dashboard** | Next.js 15, React 19, Tailwind | Standalone Node or Static/SSR | Fastify API (`/api/v1/*`) | `3000` (Internal bridge) |
| **Reverse Proxy** | Caddy 2 | Docker container (`caddy:2-alpine`) | API Server, Web Dashboard | `80`, `443` (Public Ingress) |
| **Local Task Queue** | Redis 7 Alpine | Docker container (`redis:7-alpine`) | Local API & Worker | `6379` (Internal bridge) |
| **Local AI Engine** | Ollama (`llama3.2:1b`) | Native systemd service or Docker | Host ARM64 CPU / RAM | `11434` (127.0.0.1) |
| **Database** | MongoDB 7.0 | Managed MongoDB Atlas M0 | External Internet (TLS) | `27017` (TLS encrypted) |

---

## 3. Resource Allocation within 2 OCPU / 12 GB RAM

All services must co-exist within 2 OCPU and 12 GB RAM:

| Service / Container | Memory Limit (`--memory`) | Typical Active Memory | CPU Quota | CPU Idle |
|---|---|---|---|---|
| **Host OS & systemd** | N/A (Host) | 400 MB (Estimated) | Shared | 0.05 OCPU |
| **Docker Engine & containerd** | N/A (Host) | 120 MB (Estimated) | Shared | 0.02 OCPU |
| **Caddy Gateway** | 128 MB | 40 MB (Estimated) | 0.25 OCPU | 0.01 OCPU |
| **Fastify API Server** | 512 MB | 160 MB (Estimated) | 0.50 OCPU | 0.01 OCPU |
| **BullMQ Worker Daemon** | 768 MB | 220 MB (Estimated) | 0.75 OCPU | 0.02 OCPU |
| **Next.js Web Dashboard** | 512 MB | 180 MB (Estimated) | 0.50 OCPU | 0.01 OCPU |
| **Local Redis Container** | 128 MB | 35 MB (Estimated) | 0.25 OCPU | 0.01 OCPU |
| **Ollama (`llama3.2:1b` Q4)** | 3,500 MB | 1,800 MB (Measured local) | 1.50 OCPU | 0.05 OCPU |
| **Total Active Allocated** | **~5,676 MB** | **~2,955 MB** | **2.00 OCPU (Burst)** | **~0.18 OCPU** |
| **Unallocated OS Buffer / Cache** | **~6,324 MB (~52% Headroom)** | | | |

*Note: All values are derived from local development measurements and container profiles; production loads under continuous concurrency may vary.*

---

## 4. Single-Server Reality & Disaster Recovery (Not HA)

> [!WARNING]
> A single VM deployment is **NOT** High Availability (HA). If the physical OCI host, VM kernel, or data center network suffers an outage, the entire command center goes offline. True HA requires multiple servers across distinct availability domains and is not possible within a single Always Free Ampere A1 instance.

### Realistic Recovery Strategy:
1. **Database Resilience:** MongoDB Atlas M0 provides an automated 3-node replica set independent of the VM.
2. **Crash Recovery:** BullMQ job locks auto-expire; on container restart, uncompleted tasks in `ACTIVE` state are detected and recovered.
3. **Backup Strategy:** OCI Always Free provides 5 automated volume backups. Daily boot volume snapshots enable complete recovery on a replacement instance if hardware fails.
4. **Target RTO / RPO:**
   - Recovery Time Objective (RTO): ~30 minutes to spin up a new instance from backup.
   - Recovery Point Objective (RPO): 0 seconds for database state (Atlas); in-flight queue jobs re-run via BullMQ idempotency.
