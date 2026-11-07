# Phase 9.3 — Final Resource Allocation & Idle Reclamation Decision

**Project:** AI Command Center
**Repository:** `arifranabk3/AiSoftware`
**Current Release Commit:** `dbb12a938862fbf681224e150234bdf62037a8a3`
**Evaluation Date:** 2026-11-07
**Official Reference:** [OCI Idle Instance Reclamation Documentation](https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/instancereclamation.htm)

---

## 1. Concrete 2.0 OCPU Hard Quota Model & CPU Partitioning

In Phase 9.2, aggregate CPU quotas were previously listed as 3.75 OCPU, which exceeded the physical 2.0 OCPU allocation of a single Always Free Ampere A1 VM.

In this final Phase 9.3 specification, CPU limits are strictly reconciled to a **non-oversubscribed hard ceiling of exactly 2.00 OCPUs**:

| Service | Hard CPU Quota (`--cpus`) | CPU Shares (`--cpu-shares`) | Memory Limit (`--memory`) | Expected Active Memory | Memory Classification | Operational Role |
|---|---|---|---|---|---|---|
| **Caddy Gateway** | 0.15 OCPU | 1024 (Highest) | 128 MB | ~40 MB | Estimated | Ingress reverse proxy, TLS 1.3 termination |
| **Fastify API Server** | 0.35 OCPU | 1024 (Highest) | 512 MB | ~160 MB | Estimated | REST endpoints, authentication, job dispatch |
| **Next.js Web Dashboard** | 0.25 OCPU | 512 (Standard) | 512 MB | ~180 MB | Estimated | CEO Dashboard UI rendering |
| **Local Redis 7** | 0.10 OCPU | 1024 (Highest) | 128 MB | ~35 MB | Estimated | Queue store, BullMQ locks & idempotency |
| **BullMQ Worker** | 0.35 OCPU | 256 (Low) | 768 MB | ~220 MB | Estimated | Background job execution (Concurrency = 2) |
| **Ollama Daemon** | 0.80 OCPU | 256 (Low) | 3,500 MB | ~1,800 MB | Measured | Local model inference (Concurrency = 1) |
| **Host OS & systemd** | Shared (Host) | N/A | N/A | ~400 MB | Estimated | Linux kernel, containerd, monitoring |
| **TOTALS** | **2.00 OCPU** | **N/A** | **~5,676 MB** | **~2,835 MB** | | **54% Free RAM Headroom (~6.6 GB)** |

### Protection of API and UI Responsiveness:
- Caddy, Fastify API, and Redis are granted **high CPU shares (1024)**, while Ollama and BullMQ Worker are restricted to **low CPU shares (256)**.
- If Ollama undergoes intensive token generation (saturating its 0.8 OCPU quota), incoming HTTP requests to Caddy and the Fastify API are prioritized immediately by the Linux CFS scheduler without latency degradation.
- **Ollama Concurrency:** Hard-limited to **1 active inference request**. Simultaneous tasks are buffered in BullMQ or delegated to cloud free tiers (Groq / Gemini).
- **Worker Concurrency:** Hard-limited to **2 concurrent jobs**.

---

## 2. Memory Headroom, Build-Time vs. Runtime & OOM Mitigation

- **Measured Baseline:** Ollama `llama3.2:1b` consumes ~1,350 MB idle resident memory and ~1,800 MB during active prompt processing (measured in local development).
- **Runtime Memory Limits:** Total container ceiling is configured at **5,676 MB**, leaving **6,612 MB (54%)** of unallocated physical RAM on the 12 GB VM.
- **Build-Time vs. Runtime:**
  - Building Next.js (`next build`) and compiling TypeScript (`tsc -b`) requires up to 2.5 GB RAM during peak compilation.
  - To prevent OOM kills on a 2 OCPU / 12 GB VM, container images are **pre-built in GitHub Actions CI** (`.github/workflows/arm64-docker-build.yml`) and pulled to the VM, rather than compiled locally on the server.
- **Swap Space Requirement:** A **4 GB swap file** (`/swapfile`) is provisioned on the 75 GB boot volume as a safety valve against transient memory spikes.

---

## 3. Official Oracle Idle Instance Reclamation Policy

According to official OCI documentation, an Always Free compute instance is flagged as idle if, **over a continuous 7-day period**, all three of the following conditions are met:
1. **CPU utilization (95th percentile)** is less than the threshold (typically 10%–20%).
2. **Network utilization** is less than the threshold.
3. **Memory utilization** is less than the threshold (*applies to Ampere A1 shapes*).

### The Inactivity Reality:
- Idle background heartbeats (such as BullMQ periodic checks or passive Ollama model residency) **do not guarantee immunity** from reclamation if overall compute and network utilization remain negligible.
- **Strict Policy:** In accordance with ethical cloud guidelines, **no artificial CPU spinning or fake network loops will be implemented**.
- **Owner Notification & Recovery Strategy:**
  1. Oracle sends an automated email notification before stopping an idle instance.
  2. If reclaimed, **boot and block volumes remain intact**.
  3. The owner can manually restart the instance directly from the OCI Web Console.
  4. If "Out of host capacity" occurs upon manual restart, the operator can restore from the latest automated volume backup into an alternate availability domain.

---

## 4. MongoDB Atlas M0 Inactivity & Backup Policy

- **Inactivity Pausing:** Under official Atlas documentation, Free M0 clusters are automatically paused if there are zero active connections for **30 days**. Atlas sends an email alert 7 days prior to pause.
- **Resumption:** Paused clusters can be resumed manually with one click in the Atlas UI.
- **Backup Plan:** Atlas Free clusters do not include continuous point-in-time restore. Therefore, an operational cron script exports an encrypted JSON database dump (`mongodump`) weekly to the local host storage (`/opt/backups/mongodb`), ensuring independent disaster recoverability.

---

## 5. Final Architecture & Account Decision

### Evaluation of Options:
- **Option A (Always Free-Only with Documented Reclamation Risk):**
  - **Pros:** 100% financial guarantee of $0.00 cost; no credit card required; zero billing risk.
  - **Cons:** Subject to potential idle stoppage if system is unused for > 7 days; capacity subject to regional availability.
- **Option B (Pay As You Go Account):**
  - **Pros:** Exempt from idle reclamation; priority capacity provisioning.
  - **Cons:** Introduces financial risk if misconfigured; credit card is charged immediately if storage exceeds 200 GB.
- **Option C (Delay Deployment):** Unnecessary; the software and architecture are verified and production-ready.

### **FINAL DECISION: OPTION A (ALWAYS FREE-ONLY WITH RECLAMATION RECOVERY PROCEDURE)**

The AI Command Center will deploy under the **Always Free-Only** tier with:
1. `VM.Standard.A1.Flex` configured to **2 OCPUs, 12 GB RAM, 75 GB Boot Volume**.
2. Non-oversubscribed hard CPU quotas totaling exactly **2.00 OCPUs**.
3. Local containerized Redis 7 for queue operations.
4. Pre-built ARM64 images from CI to prevent VM memory exhaustion.
5. Automated weekly `mongodump` backups to safeguard against Atlas free cluster pausing.
