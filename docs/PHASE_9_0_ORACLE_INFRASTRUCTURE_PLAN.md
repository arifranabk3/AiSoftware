# Phase 9.0 — Oracle Cloud Infrastructure Plan (Final Corrected)

**Project:** AI Command Center
**Repository:** `arifranabk3/AiSoftware`
**Current Release Commit:** `595b3537032824beac5e0d452755e5640075d83d`
**Target Environment:** Oracle Cloud Infrastructure (OCI) Always Free Tier
**Document Status:** Final Validated Architectural Specification (Non-Deploying)
**Official Reference:** [Oracle Cloud Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

---

## 1. Executive Summary & Entitlement Corrections

This document provides a realistic, internally consistent infrastructure plan for running the AI Command Center on Oracle Cloud Infrastructure (OCI).

### Critical Entitlement & Capacity Limits:
- **Monthly A1 Allowance Limit:** The monthly Always Free allowance for Arm-based Ampere A1 Compute (`VM.Standard.A1.Flex`) is strictly **1,500 OCPU-hours and 9,000 GB-hours per month**.
- **Continuous 24/7 Equivalent:** 1,500 OCPU-hours ÷ 720 hours/month = **~2.08 OCPUs**; 9,000 GB-hours ÷ 720 hours/month = **12.5 GB RAM**.
- **Continuous 24/7 Safe Configuration:** A single VM configured with **2 OCPUs and 12 GB RAM** runs continuously within the monthly free allowance ($0.00). Attempting to run a 4 OCPU / 24 GB VM 24/7 would consume 2,880 OCPU-hours and 17,280 GB-hours, exhausting the monthly allowance in ~15 days.
- **Account Types & Idle Reclamation:**
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

## 3. Strict 2.0 OCPU Hard Quota Model & CPU Shares

To prevent CPU oversubscription from degrading API and dashboard responsiveness during local Ollama inference, the physical 2.0 OCPUs are partitioned using Docker CPU quotas (`--cpus`) or weighted CPU shares:

| Service / Container | Hard CPU Quota (`--cpus`) | CPU Shares (`--cpu-shares`) | Memory Limit (`--memory`) | Expected Active Memory | Priority & Behavior Under Load |
|---|---|---|---|---|---|
| **Caddy Gateway** | 0.15 OCPU | 1024 (Highest) | 128 MB | ~40 MB | Protected; fast reverse proxying & TLS. |
| **Fastify API Server** | 0.35 OCPU | 1024 (Highest) | 512 MB | ~160 MB | Protected; guarantees UI responsiveness. |
| **Next.js Web Dashboard** | 0.25 OCPU | 512 (Standard) | 512 MB | ~180 MB | Static page rendering & client state. |
| **Local Redis 7 Container** | 0.10 OCPU | 1024 (Highest) | 128 MB | ~35 MB | Sub-millisecond queue dispatching. |
| **BullMQ Worker Daemon** | 0.35 OCPU | 256 (Low) | 768 MB | ~220 MB | Background execution; throttled under load. |
| **Ollama Daemon (`llama3.2:1b`)** | 0.80 OCPU | 256 (Low) | 3,500 MB | ~1,800 MB | Concurrency = 1; yields CPU to API/Caddy. |
| **Host OS & systemd** | Shared (Host) | N/A | N/A | ~400 MB | Base system operations & SSH. |
| **TOTAL HARD CEILING** | **2.00 OCPU** | **N/A** | **~5,676 MB** | **~2,835 MB** | **Strict 100% boundary of 2.0 physical OCPUs** |
| **Unallocated Memory Buffer** | | | **~6,612 MB** | | **54% Free RAM Headroom for disk caching & swap** |

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
