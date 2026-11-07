# Phase 9.0 — Cost & Resource Feasibility Analysis (Corrected)

**Project:** AI Command Center
**Scope:** Financial & Computational Resource Model for Oracle Cloud Infrastructure
**Core Policy:** Absolute Zero-Cost ($0.00 Total Expense)

---

## 1. Verified Monthly Budget Model ($0.00)

| Infrastructure Item | Provider | Plan / Tier | Allocated Resource | Monthly Free Allowance | Billed Cost |
|---|---|---|---|---|---|
| **ARM64 Compute** | Oracle Cloud Infrastructure | Always Free Tier | `VM.Standard.A1.Flex` (2 OCPU, 12 GB RAM) | 1,500 OCPU-hours, 9,000 GB-hours / month | **$0.00** |
| **Boot Storage** | Oracle Cloud Infrastructure | Always Free Tier | 75 GB Block Storage (Paravirtualized) | 200 GB total allowance | **$0.00** |
| **Outbound Transfer** | Oracle Cloud Infrastructure | Always Free Tier | Inbound free; outbound under 10 TB/mo | 10 TB / month | **$0.00** |
| **Public IPv4** | Oracle Cloud Infrastructure | Always Free Tier | 1 Ephemeral / Reserved Public IP | Included in compute instance | **$0.00** |
| **Database Persistence** | MongoDB Atlas | M0 Shared Tier | 512 MB Storage, 3-node replica set | Shared free sandbox | **$0.00** |
| **Task Queue Cache** | Local Docker Redis | In-VM Container | 128 MB RAM, local memory/disk | Runs on free VM allocation | **$0.00** |
| **Local AI Inference** | Ollama on Ampere A1 | Host systemd / Docker | `llama3.2:1b` (1.3 GB model) | Runs on free VM allocation | **$0.00** |
| **SSL / TLS Certificate** | Let's Encrypt / Caddy | Automated ACME | Wildcard / Hostname TLS 1.3 | Public automated service | **$0.00** |
| **TOTAL MONTHLY EXPENSE** | | | | | **$0.00** |

---

## 2. Resource Utilization on 2 OCPU / 12 GB RAM

```
Total Memory: 12.0 GB (12,288 MB)
========================================================================
[==================== 46% ALLOCATED ====================] [ 54% BUFFER ]
Ollama: 3.5 GB | Worker: 0.8 GB | API: 0.5 GB | Web: 0.5 GB | Redis: 0.1 GB | OS: 0.4 GB | Headroom: 6.2 GB
```

| Component | Target Memory (Limit) | Base Memory (Idle) | Target CPU (Quota) | Base CPU (Idle) | Scalability Impact |
|---|---|---|---|---|---|
| **Ollama Inference Engine** | 3,500 MB | 1,350 MB | 1.50 OCPU | 0.05 OCPU | Runs `llama3.2:1b` (Q4_K_M). 4K context resident footprint is ~1.8 GB. |
| **BullMQ Worker Daemon** | 768 MB | 140 MB | 0.75 OCPU | 0.02 OCPU | Concurrency = 3; handles background jobs and specialist execution. |
| **Fastify API Server** | 512 MB | 95 MB | 0.50 OCPU | 0.01 OCPU | Fast JSON response times; bounded memory. |
| **Next.js Web Dashboard** | 512 MB | 110 MB | 0.50 OCPU | 0.01 OCPU | Static prerendered dashboard pages. |
| **Local Redis Container** | 128 MB | 25 MB | 0.25 OCPU | 0.01 OCPU | In-memory queues with AOF persistence. |
| **Caddy Gateway** | 128 MB | 35 MB | 0.25 OCPU | 0.01 OCPU | Lightweight reverse proxy. |
| **Host OS & systemd** | 500 MB | 350 MB | Shared | 0.05 OCPU | Linux kernel, containerd, logging. |
| **UNALLOCATED HEADROOM** | **~6,200 MB** | **N/A** | **N/A** | **N/A** | **52% Free Memory Buffer** ensures immunity to Linux OOM killer. |

---

## 3. Ollama CPU Inference Throughput on 2 OCPUs

On 2 ARM Neoverse N1 cores (`VM.Standard.A1.Flex`):
- **Model:** `llama3.2:1b` (Q4_K_M quantization, 1.23B parameters)
- **Prompt Evaluation:** ~35–50 tokens/second
- **Token Generation:** ~14–19 tokens/second
- **Feasibility:** **Fully Feasible**. Adequate for autonomous CEO task decomposition and fast validation loops without GPU.

---

## 4. Quota Exhaustion & Rate-Limit Safeguards

1. **Zero-Cost Strict Mode (`ZERO_COST_STRICT_MODE=true`):** Prevents accidental invocation of paid cloud AI APIs.
2. **Local Redis:** Eliminates third-party command caps (such as Upstash 500k/month), allowing millions of internal BullMQ queue transactions at $0.00.
3. **MongoDB Atlas 512 MB Ceiling:** Task outputs and audit records older than 30 days are scheduled for pruning.
